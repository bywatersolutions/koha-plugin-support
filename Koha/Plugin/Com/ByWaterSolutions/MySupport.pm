package Koha::Plugin::Com::ByWaterSolutions::MySupport;

## It's good practive to use Modern::Perl
use Modern::Perl;
use CGI::Carp qw(fatalsToBrowser);

## Required for all plugins
use base qw(Koha::Plugins::Base);

## We will also need to include any Koha libraries we want to access
use C4::Context;
use C4::Branch;
use C4::Members;
use C4::Auth;
use Koha::Database;

use YAML;
use JSON qw(to_json);
use MIME::QuotedPrint;
use MIME::Base64;
use Mail::Sendmail;
use List::MoreUtils qw(uniq);

## Here we set our plugin version
our $VERSION = 1.02;

## TODO: Need to write perl docs. This should probably be used to generate MySupport.md.


## Here is our metadata, some keys are required, some are optional
our $metadata = {
    name   => 'ByWater Solutions Support Plugin',
    author => 'Barton Chittenden',
    description =>
      'This plugin automatically generates support emails with useful data.',
    date_authored   => '2014-05-05',
    date_updated    => '2016-06-19',
    minimum_version => '3.14',
    maximum_version => undef,
    version         => $VERSION,
};


## This is the minimum code required for a plugin's 'new' method
## More can be added, but none should be removed
sub new {
    my ( $class, $args ) = @_;

    ## We need to add our metadata here so our base class can access it
    $args->{'metadata'} = $metadata;

    ## Here, we call the 'new' method for our base class
    ## This runs some additional magic and checking
    ## and returns our actual $self
    my $self = $class->SUPER::new($args);

    return $self;
}

## The existance of a 'tool' subroutine means the plugin is capable
## of running a tool. The difference between a tool and a report is
## primarily semantic, but in general any plugin that modifies the
## Koha database should be considered a tool
sub tool {
    my ( $self, $args ) = @_;

    my $cgi = $self->{'cgi'};
    my $handler = $cgi->param('sub');


    # I would really like to do this with coderefs.
    # see http://www.perlmonks.org/?node_id=62737
    if ( $cgi->param('sub') eq 'process_support_request' ) {
        $self->process_support_request();
    } elsif ( $cgi->param('sub') eq 'get_initial_data' ) {
        $self->get_initial_data();
    } elsif ( $cgi->param('sub') eq 'get_initial_data_part2' ) {
        $self->get_initial_data_part2();
    } elsif ( $cgi->param('sub') eq 'circulation' ) {
        $self->circulation();
    } elsif ( $cgi->param('sub') eq 'passthrough' ) {
        $self->passthrough();
    }

}

# use _getLoggedInUser $username to grab email, firstname, surname.

sub get_initial_data {
    my ( $self, $args ) = @_;

    my $cgi = $self->{'cgi'};
    my $params = $cgi->Vars;
    my $logged_in_user   =  _getLoggedInUser( $params->{username} ) ;
    my ( $category_data, $page ) = _getInitialCategory( $params->{url} );

    my $r;
    $r->{success} = 1;
    $r->{support_data}->{user} = $logged_in_user;
    $r->{support_data}->{username} = $params->{username};
    $r->{category_data} = $category_data;
    $r->{page} = $page;
    $r->{debug} = YAML::Dump( to_json($category_data) );

    print $cgi->header('application/json');
    print to_json($r);
}

sub get_initial_data_part2 {
    my ( $self, $args ) = @_;

    my $cgi = $self->{'cgi'};
    my $params = $cgi->Vars;

    # TODO: Get category.

    my $r;
    $r->{success} = 1;

    print $cgi->header('application/json');
    print to_json($r);
}

sub passthrough {
    my ( $self, $args ) = @_;

    warn("In passthrough");
    my $cgi = $self->{'cgi'};
    my $params = $cgi->Vars;
  
    warn("about to set params->{success}");
    $params->{success} = 1;

    warn $cgi->header('application/json');
    print $cgi->header('application/json');
    warn to_json($params);
    print to_json($params);
}

# TODO: This function needs to be smarter -- It's trying to do too much, and needs to delagate more.
# TODO: html and system preferences should be added as attachments to email, not in the body.
#       see http://alma.ch/perl/Mail-Sendmail-FAQ.html#attachments
sub process_support_request {
    my ( $self, $args ) = @_;

    my $email_to = $self->retrieve_data('email_address');

    my $cgi = $self->{'cgi'};
    my $params = $cgi->Vars;
    my $html = $params->{html};
    $html =~ s/[^\x00-\x7f]//g; # strip wide characters.
    $params->{html} = '';
    my $borrower   = $cgi->param('borrower');

    my $data = [];

    push ( @$data, { page_data => $params } );

    # This should move to circulation.
    if ( $borrower ) {
        my $issues = C4::Circulation::GetIssues( { borrowrenumber => $borrower } );
        push ( @$data, { issues => $issues } );
    }

    # This is overkill, need to be more selective about which sysprefs to pull.
    #push ( @$data, { sysprefs => _getSysprefs() } );

    _sendEmail( to => $email_to, from => $params->{email}, message => YAML::Dump( $data ), attachments => [], cgi => $cgi );
}

sub _sendEmail {
    my %args = ( @_ );

    my $cgi = $args{cgi};

    my %mail = (
        'To'       => $args{to},
        'From'     => $args{from},
        'Reply-To' => $args{from},
        'Message'  => $args{message}, 
    );

    sendmail(%mail);

    my $r;
    $r->{error} = $Mail::Sendmail::error;
    $r->{success} = $Mail::Sendmail::error ? 0 : 1;
    $r->{mailto} = $args{to};

    print $cgi->header('application/json');
    print to_json($r);

}

sub _getLoggedInUser {
    my $username = shift;
    my $schema  = Koha::Database->new()->schema();
    my $rs = $schema->resultset('Borrower')->search( { userid => $username }, { columns => [ qw( email firstname surname ) ] } );
    my $user;
    $rs->result_class('DBIx::Class::ResultClass::HashRefInflator');
    for my $row ( $rs->all ) {
        $user = $row;
    }
    return $user;
}


# TODO: I'd like to move @broad_category_mapping and @narrow_category_mapping into a .json file, probably
# including the Koha version, allowing for easy expansion. The .json file could be hosted locally or
# in, say, a gitub repo.

sub _getInitialCategory {
    my $url = shift;
    my @url_parts = split( '/', $url );

    my @broad_category_mapping = (
        circ => 'Circulation',
        acqui => 'Acquisitions',
        admin => 'Administration',
        authorities => 'Authorities',
        basket => 'Cart',
        catalogue => 'Bibs_and_Items',
        cataloguing => 'Cataloguing',
        value_builder => 'Cataloguing',
        course_reserves => 'Course_Reserves',
        labels => 'Label_Creator',
        members => 'Patrons',
        offline_circ => 'Offline_Circ',
        patron_lists => 'Patron_Lists',
        patroncard => 'Patron_Card_Creator',
        plugins => 'Plugins',
        reports => 'Reports',
        reserve => 'Holds',
        rotating_collections => 'Rotating_Collections',
        serials => 'Serials',
        tags => 'Tags',
        tools => 'Tools',
        virtualshelves => 'Lists',
        koha => 'General',
        cronjobs => 'Cron_Jobs',
        opac => 'OPAC',
        sip2 => 'SIP2',
        selfreg => 'Self_Registration',
    );

    my @narrow_category_mapping = (
       'catalogue/search-history.pl' => 'Search',
       'catalogue/itemsearch.pl' => 'Search',
       'catalogue/search.pl' => 'Search',
       'tools/overduerules.pl' => 'Notices',
       'tools/letter.pl' => 'Notices',
       'tools/quotes-upload.pl' => 'Quotes',
       'tools/manage-marc-import.pl' => 'Import',
       'tools/viewlog.pl' => 'Logs',
       'tools/quotes.pl' => 'Quotes',
       'tools/koha-news.pl' => 'News',
       'tools/marc_modification_templates.pl' => 'Import',
       'tools/stage-marc-import.pl' => 'Import',
       'tools/showdiffmarc.pl' => 'Import',
       'tools/batchMod.pl' => 'Batch_modification',
       'tools/holidays.pl' => 'Calendar',
       'members/boraccount.pl' => 'Fines',
       'members/pay.pl' => 'Fines',
       'members/maninvoice.pl' => 'Fines',
       'members/mancredit.pl' => 'Fines',
       'admin/biblio_framework.pl' => 'Frameworks',
       'tools/viewlog.pl' => 'Logs',
       'admin/z3950servers.pl' => 'z39.50',
       'cataloguing/z3950_search.pl' => 'z39.50',
    );

    my %inverted_category_hash = reverse ( @broad_category_mapping , @narrow_category_mapping );
    my $categories = [ sort keys %inverted_category_hash ];
    my $broad_category = { @broad_category_mapping };
    my $narrow_category = { @narrow_category_mapping };
    my $page = $url_parts[-2] . '/' . $url_parts[-1];
    my $category = ( defined $narrow_category->{$page} ) 
        ? $narrow_category->{$page}
        : $broad_category->{$url_parts[-2]};
    $category //= 'General';
    my $category_data = {
        selected_category => $category,
        category_list => $categories
    };
#my $page =~ s/#.*//;
    return ( $category_data, $page );
}

# TODO: allow searches to be passed in.
sub _getSysprefs {
    my $schema  = Koha::Database->new()->schema();
    my $rs = $schema->resultset('Systempreference')->search( undef, { columns => [ qw( variable value ) ] });
    my @sysprefs;
    $rs->result_class('DBIx::Class::ResultClass::HashRefInflator');
    for my $row ( $rs->all ) {
        push ( @sysprefs, $row );
    }
    return \@sysprefs;
}

## If your tool is complicated enough to needs it's own setting/configuration
## you will want to add a 'configure' method to your plugin like so.
## Here I am throwing all the logic into the 'configure' method, but it could
## be split up like the 'report' method is.
sub configure {
    my ( $self, $args ) = @_;
    my $cgi = $self->{'cgi'};

    unless ( $cgi->param('save') ) {
        my $template = $self->get_template( { file => 'configure.tt' } );

        ## Grab the values we already have for our settings, if any exist
        $template->param(
            email_address => $self->retrieve_data('email_address') );

        print $cgi->header();
        print $template->output();
    }
    else {
        $self->store_data(
            {
                email_address      => $cgi->param('email_address'),
                last_configured_by => C4::Context->userenv->{'number'},
            }
        );
        $self->go_home();
    }
}

## This is the 'install' method. Any database tables or other setup that should
## be done when the plugin if first installed should be executed in this method.
## The installation method should always return true if the installation succeeded
## or false if it failed.
sub install() {
    my ( $self, $args ) = @_;

    my $table = $self->get_qualified_table_name('mytable');

    return 1;
}

## This method will be run just before the plugin files are deleted
## when a plugin is uninstalled. It is good practice to clean up
## after ourselves!
sub uninstall() {
    my ( $self, $args ) = @_;

    my $table = $self->get_qualified_table_name('mytable');

    return C4::Context->dbh->do("DROP TABLE $table");
}

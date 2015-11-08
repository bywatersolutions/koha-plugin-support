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

use YAML;
use JSON qw(to_json);
use MIME::QuotedPrint;
use MIME::Base64;
use Mail::Sendmail;

## Here we set our plugin version
our $VERSION = 1.01;

## Here is our metadata, some keys are required, some are optional
our $metadata = {
    name   => 'ByWater Solutions Support Plugin',
    author => 'Kyle M Hall',
    description =>
      'This plugin automatically generates support emails with useful data.',
    date_authored   => '2014-05-05',
    date_updated    => '2015-11-06',
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

    if ( $cgi->param('sub') eq 'process_support_request' ) {
        $self->process_support_request();
    }

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

    if ( $borrower ) {
        my $issues = C4::Circulation::GetIssues( { borrowrenumber => $borrower } );
        push ( @$data, { issues => $issues } );
    }

    my $schema  = Koha::Database->new()->schema();
    my $rs = $schema->resultset('Systempreference')->search( undef, { columns => [ qw( variable value ) ] });
    my @sysprefs;
    $rs->result_class('DBIx::Class::ResultClass::HashRefInflator');
    for my $row ( $rs->all ) {
        push ( @sysprefs, $row );
    }
    

    push ( @$data, { sysprefs => \@sysprefs } );

    my %mail = (
        'To'       => $email_to,
        'From'     => $params->{email},
        'Reply-To' => $params->{email},
        'Message'  => YAML::Dump( $data ), 
    );

    sendmail(%mail);

    my $r;
    $r->{error} = $Mail::Sendmail::error;
    $r->{success} = $Mail::Sendmail::error ? 0 : 1;

    print $cgi->header('application/json');
    print to_json($r);
}

sub _getIssues {
    my $biblionumber = shift;
    my $items = C4::Circulation::GetIssues( { biblionumber => $biblionumber } );
    return YAML::Dump $items;
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

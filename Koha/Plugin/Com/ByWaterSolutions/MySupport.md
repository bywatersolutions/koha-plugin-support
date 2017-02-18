# Extending the support plugin.

If you want to create a new support plugin section, you will need to edit three files: `MySupport/my_support.js`, `MySupport/my_support.html` and `MySupport.pl`.

* `MySupport/my_support.js`
    * Populate the variable `payload`
    * Call `support_submit()` with the following arguments:
        * `payload`
        * The name of a perl sub to call as a handler in `MySupport.pl`
        * A callback function, which should contain at least `$('#foo').show();`
* `MySupport/my_support.html`
    * Should contain a field set like this: `<fieldset id="foo" class="support">`
* `MySupport.pl`

If `support_submit()` is called with `'bar'` as the perl subroutine, `bar()` must contain at least the following:

    sub bar {
        my ( $self, $args ) = @_; 

        my $cgi = $self->{'cgi'};
        my $params = $cgi->Vars;

        my $r; # return value
        $r->{success} = 1;

        print $cgi->header('application/json');
        print to_json($r);
    }

TODO:

Need to write helpers in Perl/Javascript to facilitate gathering support data:

* Run queries
* Pull data from HTML
* Koha web service API calls?
* Koha perl API
    * Read from Koha-conf
    * Pull sysprefs
    * Pull zebra info?


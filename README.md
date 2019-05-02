# Introduction

Koha's Plugin System (available in Koha 3.12+) allows for you to add additional tools and reports to [Koha](http://koha-community.org) that are specific to your library. Plugins are installed by uploading KPZ ( Koha Plugin Zip ) packages. A KPZ file is just a zip file containing the perl files, template files, and any other files necessary to make the plugin work. Learn more about the Koha Plugin System in the [Koha 3.22 Manual](http://manual.koha-community.org/3.22/en/pluginsystem.html) or watch [Kyle's tutorial video](http://bywatersolutions.com/2013/01/23/koha-plugin-system-coming-soon/).

# Description

This plugin is meant to provide an easy way of reporting support issues in Koha. Once installed, it is accessable via a button in the lower right hand corner of the screen. Clicking on the button opens a slide-in panel which allows the user to fill in support information. 

Furture development for this plugin will achieve the following objectives:

1) The plugin will context-sensitive, and will pull support category information based on the URL of the page the telempath is opened on. 
2) Telempath runs off of "Cards". There is a "Basic" Support Request Card which is the template for the fancier cards to come. This Basic Card is static and can be used by anyone downloading and installing the plugin.
3) Telempath will integrate with other open source resources, such as ticketing systems and customer relations managements systems, to make submission of Koha support requests easier.
4) Telempath will offer suggestions to the Koha end user based on the URL of the page, module selected, or the keywords of the support inquery. Already the Koha community has resources to link Koha users to the manual in Koha. There are RSS feeds and listservs for recently created bugs. 

Adding configuration options that highlight these extant resources to the end user in their time of need, as well as facilitating the easiest submission of a problem or request with relevant metadata is the ultimate goal of the development. 

# Downloading

From the [release page](https://github.com/bywatersolutions/koha-plugin-support/releases) you can download the relevant \*.kpz file

# Installing

To set up the Koha plugin system you, (or your system administrator) must first make some changes to your install.

* Change `<enable_plugins>0<enable_plugins>` to `<enable_plugins>1</enable_plugins>` in your koha-conf.xml file
* Confirm that the path to `<pluginsdir>` exists, is correct, and is writable by the web server
* Edit `/etc/apache2/sites-enabled/koha-SITE` (`SITE` matching your koha instance name), add the following lines:

    <Directory "/var/lib/koha/SITE/plugins">
        Require all granted
    </Directory>
    Alias /plugin "/var/lib/koha/SITE/plugins/"

* Restart your webserver

Once set up is complete you will need to alter your UseKohaPlugins system preference. On the Tools page you will see the Tools Plugins and on the Reports page you will see the Reports Plugins.

# Restricting the use of the plugin to Superlibrarian

To restrict the support plugin to superlibrarians only, Create a report using the following query

    SELECT userid
    FROM borrowers 
    WHERE flags%2=1 
    ORDER BY borrowernumber ASC

Note the number of tne report -- we'll call that `XX`

Change 

    /* JS for Koha Support Plugin
    This JS was added automatically by installing the Support plugin
    Please do not modify */$.getScript('/plugin/Koha/Plugin/Com/ByWaterSolutions/MySupport/my_support.js')/* End of JS for Koha Support Plugin */

to

    $(document).ready(function(){
        var is_superlibrarian = 0;

        $.getJSON(
            "/cgi-bin/koha/svc/report?id=XX&annotated=1", function(data) {
            $.each( data, function( index, value ) {
                if( value.userid === $(".loggedinusername").html() ) {
                    is_superlibrarian = 1;
                }
            } )

            if( is_superlibrarian === 1 ) {

    /* JS for Koha Support Plugin
    This JS was added automatically by installing the Support plugin
    Please do not modify */$.getScript('/plugin/Koha/Plugin/Com/ByWaterSolutions/MySupport/my_support.js')/* End of JS for Koha Support Plugin */

            }
        });

    });

Unfortunately, this call is relatively slow. in 19.05 an higher, the html class `is_superlibrarian` is added on each page in the intranet if the logged in user is a superlibrarian, which allows us to simplify the code above to

    if( $("is_superlibrarian") !== NULL ) {

    /* JS for Koha Support Plugin
    This JS was added automatically by installing the Support plugin
    Please do not modify */$.getScript('/plugin/Koha/Plugin/Com/ByWaterSolutions/MySupport/my_support.js')/* End of JS for Koha Support Plugin */

    }

This will not cause any perceivable delay.

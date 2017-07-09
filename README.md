# Introduction

Koha's Plugin System (available in Koha 3.12+) allows for you to add additional tools and reports to [Koha](http://koha-community.org) that are specific to your library. Plugins are installed by uploading KPZ ( Koha Plugin Zip ) packages. A KPZ file is just a zip file containing the perl files, template files, and any other files necessary to make the plugin work. Learn more about the Koha Plugin System in the [Koha 3.22 Manual](http://manual.koha-community.org/3.22/en/pluginsystem.html) or watch [Kyle's tutorial video](http://bywatersolutions.com/2013/01/23/koha-plugin-system-coming-soon/).

# Description

This plugin is meant to provide an easy way of reporting support issues in Koha. Once installed, it is accessable via a button in the lower right hand corner of the screen. Clicking on the button opens a slide-in panel which allows the user to fill in support information.

The plugin is context-sensitive, and will pull support category information based on the URL where the plugin is launched.

# Downloading

From the [release page](https://github.com/bywatersolutions/koha-plugin-support/releases) you can download the relevant \*.kpz file

# Installing

To set up the Koha plugin system you, (or your system administrator) must first make some changes to your install.

* Change `<enable_plugins>0<enable_plugins>` to `<enable_plugins>1</enable_plugins>` in your koha-conf.xml file
* Confirm that the path to `<pluginsdir>` exists, is correct, and is writable by the web server
* Edit your apache configuration file. In the `Intranet` stanza, add `Alias /plugin/ "/var/lib/koha/INSTANCE/plugins/"` -- this should match your `<pluginsdir>`.
* Restart your webserver

Once set up is complete you will need to alter your UseKohaPlugins system preference. On the Tools page you will see the Tools Plugins and on the Reports page you will see the Reports Plugins.

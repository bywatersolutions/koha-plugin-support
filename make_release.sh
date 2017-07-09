#! /bin/sh
set -x

[ -d ./releases ] || mkdir ./releases

version=$( perl -E 'use Koha::Plugin::Com::ByWaterSolutions::MySupport; say Koha::Plugin::Com::ByWaterSolutions::MySupport::version()' )

zip -r "./releases/koha-plugin-support.${version}.kpz" Koha/

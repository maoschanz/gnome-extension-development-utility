#!/bin/bash

EXT_ID=extension-development-utility@maestroschan.fr

./update-and-compile-translations.sh

cd $EXT_ID

glib-compile-schemas ./schemas

zip ../$EXT_ID.zip *.js
zip ../$EXT_ID.zip metadata.json

zip -r ../$EXT_ID.zip locale
zip -r ../$EXT_ID.zip schemas

shopt -s globstar

zip -d ../$EXT_ID.zip **/*.pot
zip -d ../$EXT_ID.zip **/*.po


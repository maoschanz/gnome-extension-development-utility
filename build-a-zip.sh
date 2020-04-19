#!/bin/bash

./update-and-compile-translations.sh

cd extension-development-utility@maestroschan.fr

glib-compile-schemas ./schemas

zip ../extension-development-utility@maestroschan.fr.zip *.js
zip ../extension-development-utility@maestroschan.fr.zip metadata.json

zip -r ../extension-development-utility@maestroschan.fr.zip locale
zip -r ../extension-development-utility@maestroschan.fr.zip schemas



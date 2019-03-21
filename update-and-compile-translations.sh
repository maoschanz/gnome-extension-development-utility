#!/bin/bash

#####

echo "Generating .pot file..."

xgettext --files-from=POTFILES.in --from-code=UTF-8 --output=extension-development-utility@maestroschan.fr/locale/extension-development-utility.pot

#####

IFS='
'
liste=`ls ./extension-development-utility@maestroschan.fr/locale/`
prefix="./extension-development-utility@maestroschan.fr/locale"

for dossier in $liste
do
	if [ "$dossier" != "extension-development-utility.pot" ]; then
		echo "Updating translation for: $dossier"
		msgmerge -N $prefix/$dossier/LC_MESSAGES/extension-development-utility.po $prefix/extension-development-utility.pot > $prefix/$dossier/LC_MESSAGES/extension-development-utility.temp.po
		mv $prefix/$dossier/LC_MESSAGES/extension-development-utility.temp.po $prefix/$dossier/LC_MESSAGES/extension-development-utility.po
		echo "Compiling translation for: $dossier"
		msgfmt $prefix/$dossier/LC_MESSAGES/extension-development-utility.po -o $prefix/$dossier/LC_MESSAGES/extension-development-utility.mo
	fi
done

#####

exit 0

#!/bin/bash

ext_name="extension-development-utility"
ext_id="$ext_name@maestroschan.fr"

#####

echo "Generating .pot file..."

xgettext --files-from=POTFILES.in --from-code=UTF-8 --add-location=file --output=$ext_id/locale/$ext_name.pot

#####

IFS='
'
liste=`ls ./$ext_id/locale/`
prefix="./$ext_id/locale"

for dossier in $liste
do
	if [ "$dossier" != "$ext_name.pot" ]; then
		echo "Updating translation for: $dossier"
		msgmerge -N $prefix/$dossier/LC_MESSAGES/$ext_name.po $prefix/$ext_name.pot > $prefix/$dossier/LC_MESSAGES/$ext_name.temp.po
		mv $prefix/$dossier/LC_MESSAGES/$ext_name.temp.po $prefix/$dossier/LC_MESSAGES/$ext_name.po
		echo "Compiling translation for: $dossier"
		msgfmt $prefix/$dossier/LC_MESSAGES/$ext_name.po -o $prefix/$dossier/LC_MESSAGES/$ext_name.mo
	fi
done

#####

exit 0

#!/bin/bash

glib-compile-schemas ./extension-development-utility@maestroschan.fr/schemas

if (( $EUID == 0 )); then
	if [ ! -d "/usr/share/gnome-shell/extensions" ]; then
		mkdir /usr/share/gnome-shell/extensions
	fi
	INSTALL_DIR="/usr/share/gnome-shell/extensions"
else
	if [ ! -d "$HOME/.local/share/gnome-shell/extensions" ]; then
		mkdir $HOME/.local/share/gnome-shell/extensions
	fi
	INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions"
fi

echo "Installing extension files in $INSTALL_DIR/extension-development-utility@maestroschan.fr"
cp -r extension-development-utility@maestroschan.fr $INSTALL_DIR

echo "Done."
exit 0


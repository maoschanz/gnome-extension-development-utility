#!/bin/bash

echo "Compiling gsettings schema…"
glib-compile-schemas ./extension-development-utility@maestroschan.fr/schemas

if (( $EUID == 0 )); then
	INSTALL_DIR="/usr/share/gnome-shell/extensions"
else
	INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions"
fi
mkdir -p $INSTALL_DIR

echo "Directory: $INSTALL_DIR/extension-development-utility@maestroschan.fr"
echo "Installing extension files…"
cp -r extension-development-utility@maestroschan.fr $INSTALL_DIR

echo "Done."
exit 0


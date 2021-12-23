// GPLv3

const {Gtk} = imports.gi;
const gtkVersion = Gtk.get_major_version();

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

function init() {
	ExtensionUtils.initTranslations();
}

function buildPrefsWidget() {
	let widget;
	if(gtkVersion > 3) {
		const Gtk4Prefs = Me.imports.prefs_gtk4;
		widget = new Gtk4Prefs.EDUPrefsWidget();
	} else {
		const Gtk3Prefs = Me.imports.prefs_gtk3;
		widget = new Gtk3Prefs.EDUPrefsWidget();
		widget.show_all();
	}
	return widget;
}


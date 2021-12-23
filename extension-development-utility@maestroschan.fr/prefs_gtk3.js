// GPLv3

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Gettext = imports.gettext.domain('extension-development-utility');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

let SETTINGS = ExtensionUtils.getSettings();

//------------------------------------------------------------------------------

var EDUPrefsWidget = new Lang.Class({
	Name: "EDUPrefsWidget",
	Extends: Gtk.Box,

	_init () {
		this.parent({
			visible: true,
			can_focus: false,
			margin_left: 30,
			margin_right: 30,
			margin_top: 18,
			margin_bottom: 18,
			orientation: Gtk.Orientation.VERTICAL,
			spacing: 16
		});

		//----------------------------------------------------------------------

		let section1 = this.addSection(_("Appearance"));

		section1.add(this.buildRow(
			_("Display as buttons"),
			_("You can display the items as buttons on a single line, or as labeled menu items."),
			null,
			this.buildSwitch('items-layout')
		));

		//----------------------------------------------------------------------

		let section2 = this.addSection(_("Terminal"));

		section2.add(this.buildRow(
			_("Use sudo instead of pkexec"),
			null,
			_("Seeing logs often require admin privileges. They can often be " +
			       "obtained using pkexec, but some systems don't support it."),
			this.buildSwitch('use-sudo')
		));

		let prefixEntry = new Gtk.Entry({
			text: SETTINGS.get_string('term-prefix'),
			visible: true,
			valign: Gtk.Align.CENTER,
			secondary_icon_name: 'list-add-symbolic',
		});
		prefixEntry.connect('icon-press', this.applyTermPrefix.bind(this));
		section2.add(this.buildRow(
			_("Terminal emulator"),
			_("(with command-launching option)"),
			_("For example 'gnome-terminal --' or 'tilix -e'") + '\n'
			+ _("Let empty for using the system default terminal."),
			prefixEntry
		));

		//----------------------------------------------------------------------

		let section3 = this.addSection(_("About"));

		let url_button = new Gtk.LinkButton({
			label: _("Report bugs or ideas"),
			uri: Me.metadata.url.toString()
		});

		let version_label = new Gtk.Label({
			label: ' (v' + Me.metadata.version.toString() + ') ',
		});
		section3.add(this.buildRow(
			'<b>' + Me.metadata.name.toString() + '</b>',
			null,
			null,
			version_label
		));

		section3.add(this.buildRow(
			null,
			Me.metadata.description.toString(),
			null,
			null
		));

		section3.add(this.buildRow(
			_("Author:") + " Romain F. T.",
			null,
			null,
			url_button
		));
	},

	//--------------------------------------------------------------------------

	applyTermPrefix (entry, position, event) {
		SETTINGS.set_string('term-prefix', entry.get_text());
	},

	addIcon (liststore, icon_name, label, id) {
		let pixbuf = Gtk.IconTheme.get_default().load_icon(icon_name, 32, 0)
		let iter = liststore.append();
		liststore.set(iter, [0, 1, 2], [pixbuf, label, id]);
	},
	
	addSection (sectionTitle) {
		let frame = new Gtk.Frame({
			label: ' ' + sectionTitle + ' ',
			label_xalign: 0.1,
		});
		let listbox = new Gtk.Box({	orientation: Gtk.Orientation.VERTICAL });
		frame.add(listbox);
		this.add(frame);
		return listbox;
	},

	buildRow (text, subtext, tooltip, widget) {
		let rowBox = new Gtk.Box({
			orientation: Gtk.Orientation.HORIZONTAL,
			tooltip_text: tooltip,
			spacing: 15,
			margin: 10,
			visible: true,
		});
		let labelBox = new Gtk.Box({
			orientation: Gtk.Orientation.VERTICAL,
			visible: true,
		});
		let rowLabel1 = new Gtk.Label({
			label: text,
			halign: Gtk.Align.START,
			use_markup: true,
			visible: true,
		});
		let rowLabel2 = new Gtk.Label({
			label: subtext,
			halign: Gtk.Align.START,
			wrap: true,
			visible: true,
		});
		rowLabel2.get_style_context().add_class('dim-label');
		
		if(text == null) {
			rowBox.pack_start(rowLabel2, false, false, 0);
		} else if(subtext == null) {
			rowBox.pack_start(rowLabel1, false, false, 0);
		} else {
			labelBox.add(rowLabel1);
			labelBox.add(rowLabel2);
			rowBox.pack_start(labelBox, false, false, 0);
		}
		if(widget != null) {
			rowBox.pack_end(widget, false, false, 0);
		}
		return rowBox;
	},

	buildSwitch (booleanSetting) {
		let rowSwitch = new Gtk.Switch({ valign: Gtk.Align.CENTER });
		rowSwitch.set_state(SETTINGS.get_boolean(booleanSetting));
		rowSwitch.connect('notify::active', (widget) => {
			SETTINGS.set_boolean(booleanSetting, widget.active);
		});
		return rowSwitch;
	},
});


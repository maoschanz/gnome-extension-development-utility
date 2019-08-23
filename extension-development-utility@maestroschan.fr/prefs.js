// GPLv3

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Lang = imports.lang;

const Mainloop = imports.mainloop;

const Gettext = imports.gettext.domain('extension-development-utility');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

//------------------------------------------------------------------------------

function init() {
	Convenience.initTranslations();
}

//------------------------------------------------------------------------------

const EDUPrefsWidget = new Lang.Class({
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
//		let s1 = this.addSection(null);//_("Buttons"));
//		let iconView = new Gtk.IconView({ reorderable: true }); // TODO sympa mais inutile
//		let liststore = new Gtk.ListStore();
//		liststore.set_column_types([GdkPixbuf.Pixbuf, GObject.TYPE_STRING, GObject.TYPE_STRING]);
//		iconView.set_model(liststore);
//		iconView.set_pixbuf_column(0);
//		iconView.set_text_column(1);
//		let buttons_array = Convenience.getSettings().get_strv('buttons');
//		for (let i=0; i < buttons_array.length; i++) {
//			this._loadButton(buttons_array[i], liststore);
//		}
//		iconView.show_all();
//		s1.add(iconView);
		//----------------------------------------------------------------------
		let s2 = this.addSection(_("Terminal"));
		s2.add(this.addRow(
			_("Use sudo instead of pkexec"), null,
			_("Seeing logs often require admin privileges. They can often be obtained using pkexec, but some systems don't support it."),
			this.buildSwitch('use-sudo')
		));
		let prefixEntry = new Gtk.Entry({
			text: SETTINGS.get_string('term-prefix'),
			visible: true,
			valign: Gtk.Align.CENTER,
			secondary_icon_name: 'list-add-symbolic',
		});
		prefixEntry.connect('icon-press', this.applyTermPrefix.bind(this));
		s2.add(this.addRow(
			_("Terminal emulator"),
			_("(with command-launching option)"),
			_("For example 'gnome-terminal --' or 'tilix -e'") + '\n'
			+ _("Let empty for using the system default terminal."),
			prefixEntry
		));
		//----------------------------------------------------------------------
		let s3 = this.addSection(_("About"));
		
		let url_button = new Gtk.LinkButton({
			label: _("Report bugs or ideas"),
			uri: Me.metadata.url.toString()
		});
		let version_label = new Gtk.Label({
			label: ' (v' + Me.metadata.version.toString() + ') ',
		});
		s3.add(this.addRow('<b>' + Me.metadata.name.toString() + '</b>', null, null, version_label));
		let descriptionLabel = new Gtk.Label({
			label: _(Me.metadata.description.toString()),
			halign: Gtk.Align.START,
			wrap: true,
			use_markup: true,
			visible: true,
			margin: 10,
		});
		descriptionLabel
		s3.add(this.addRow(null, Me.metadata.description.toString(), null, null));
		s3.add(this.addRow(_("Author:") + " Romain F. T.", null, null, url_button));
		//----------------------------------------------------------------------
	},
	
	_loadButton (button_id, liststore) {
		let accessible_name;
		let icon_name;
		switch (button_id) {
			case 'prefs':
				accessible_name = _("Extensions preferences");
				icon_name = 'preferences-other-symbolic';
			break;
			case 'logs':
				accessible_name = _("See GNOME Shell log");
				icon_name = 'utilities-terminal-symbolic';
			break;
			case 'restart':
				accessible_name = _("Reload GNOME Shell");
				icon_name = 'view-refresh-symbolic';
			break;
			case 'lg':
				accessible_name = _("'Looking Glass' debugging tool");
				icon_name = 'system-run-symbolic';
			break;
			default:
				return;
			break;
		}
		this.addIcon(liststore, icon_name, accessible_name, button_id);
	},
	
	applyTermPrefix (entry, position, event) {
		SETTINGS.set_string('term-prefix', entry.get_text());
	},
	
	addIcon (liststore, icon_name, label, id) {
		let pixbuf = Gtk.IconTheme.get_default().load_icon(icon_name, 32, 0)
		let iter = liststore.append();
		liststore.set(iter, [0, 1, 2], [pixbuf, label, id]);
	},
	
	addSection (titre) {
		let frame = new Gtk.Frame({
			label: titre,
			label_xalign: 0.1,
		});
		let listbox = new Gtk.Box({	orientation: Gtk.Orientation.VERTICAL });
		frame.add(listbox);
		this.add(frame);
		return listbox;
	},
	
	addRow (text, subtext, tooltip, widget) {
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
		
		if (text == null) {
			rowBox.pack_start(rowLabel2, false, false, 0);
		} else if (subtext == null) {
			rowBox.pack_start(rowLabel1, false, false, 0);
		} else {
			labelBox.add(rowLabel1);
			labelBox.add(rowLabel2);
			rowBox.pack_start(labelBox, false, false, 0);
		}
		if (widget != null) {
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

let SETTINGS = Convenience.getSettings();

function buildPrefsWidget() {
	let widget = new EDUPrefsWidget();
	widget.show_all();
	return widget;
}



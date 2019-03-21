
const Lang = imports.lang;
const St = imports.gi.St;
const Panel = imports.ui.panel;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;
const Meta = imports.gi.Meta;
const PopupMenu = imports.ui.popupMenu;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;
const Slider = imports.ui.slider;

const GTop = imports.gi.GTop; //gir1.2-gtop-2.0

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const Gettext = imports.gettext.domain('extension-development-utility');
const _ = Gettext.gettext;

const TERMINAL_SCHEMA = 'org.gnome.desktop.default-applications.terminal';
const EXEC_KEY = 'exec';
const EXEC_ARG_KEY = 'exec-arg';

//-------------------------------------------------

function init() {
	Convenience.initTranslations();
}

//---------------------------------

const ExtensionsButtonsItem = new Lang.Class({
	Name: 'ExtensionsButtonsItem',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function() {
		
		this.parent({ reactive: false, can_focus: false });
		
		this._terminalSettings = new Gio.Settings({ schema_id: TERMINAL_SCHEMA });
		
		this.prefsButton = new St.Button({
			reactive: true,
			can_focus: true,
			track_hover: true,
			accessible_name: _("Extensions preferences"),
			style_class: 'system-menu-action',
		});
		this.prefsButton.child = new St.Icon({ icon_name: 'system-run-symbolic' });
		
		this.seeLogsButton = new St.Button({
			reactive: true,
			can_focus: true,
			track_hover: true,
			accessible_name: _("See logs"),
			style_class: 'system-menu-action',
		});
		this.seeLogsButton.child = new St.Icon({ icon_name: 'utilities-terminal-symbolic' });
		
		this.restartButton = new St.Button({
			reactive: true,
			can_focus: true,
			track_hover: true,
			accessible_name: _("Reload GNOME Shell"),
			style_class: 'system-menu-action',
		});
		this.restartButton.child = new St.Icon({ icon_name: 'view-refresh-symbolic' });
		
		this.lgButton = new St.Button({
			reactive: true,
			can_focus: true,
			track_hover: true,
			accessible_name: _("Looking Glass"),
			style_class: 'system-menu-action',
		});
		this.lgButton.child = new St.Icon({ icon_name: 'system-search-symbolic' });
		
		this.actor.add(this.prefsButton, { expand: true, x_fill: false });
		this.actor.add(this.seeLogsButton, { expand: true, x_fill: false });
		this.actor.add(this.restartButton, { expand: true, x_fill: false });
		this.actor.add(this.lgButton, { expand: true, x_fill: false });
		
		this.lgButton.connect('clicked', Lang.bind(this, this._openLookingGlass));
		this.prefsButton.connect('clicked', Lang.bind(this, this._openPrefs));
		this.restartButton.connect('clicked', Lang.bind(this, this._reloadGS));
		this.seeLogsButton.connect('clicked', Lang.bind(this, this._seeLogs));
	},
	
	_openPrefs: function() {
		Util.trySpawnCommandLine('gnome-shell-extension-prefs');
		Main.panel.statusArea.aggregateMenu.menu.close();
	},
	
	_openLookingGlass: function() {
		Main.createLookingGlass().toggle();
		Main.panel.statusArea.aggregateMenu.menu.close();
	},
	
	_reloadGS: function() {
		Main.panel.statusArea.aggregateMenu.menu.close();
		if (Meta.is_wayland_compositor()) {
			this._showError(_("Restart is not available on Wayland"));
			return;
		}
		Meta.restart(_("Restarting…"));
	},
	
	_seeLogs: function() {
		let exec1 = this._terminalSettings.get_string(EXEC_KEY);
		let exec_arg = this._terminalSettings.get_string(EXEC_ARG_KEY);
		let command = exec1 + ' ' + exec_arg + ' pkexec journalctl -f /usr/bin/gnome-shell';
		Util.trySpawnCommandLine(command);
		Main.panel.statusArea.aggregateMenu.menu.close();
	},
	
});

let my_section;

function enable() {
	let aggregateMenu = Main.panel.statusArea.aggregateMenu;
	
	my_section = new PopupMenu.PopupMenuSection();
	my_section.addMenuItem(new ExtensionsButtonsItem());
	
	aggregateMenu._extensions = my_section;
	aggregateMenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem, 0);
	aggregateMenu.menu.addMenuItem(aggregateMenu._extensions, 0);
}

function disable() {
	Main.panel.statusArea.aggregateMenu._extensions.destroy();
}


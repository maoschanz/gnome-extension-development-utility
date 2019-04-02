
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

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const Gettext = imports.gettext.domain('extension-development-utility');
const _ = Gettext.gettext;

const TERMINAL_SCHEMA = 'org.gnome.desktop.default-applications.terminal';
const EXEC_KEY = 'exec';
const EXEC_ARG_KEY = 'exec-arg';

function init() {
	Convenience.initTranslations();
}

//---------------------------------

class ExtensionsButtonsItem {

	constructor () {
		this.super_item = new PopupMenu.PopupBaseMenuItem({ reactive: false, can_focus: false });
		this._terminalSettings = new Gio.Settings({ schema_id: TERMINAL_SCHEMA });
		
		this._addButton(_("Extensions preferences"), 'system-run-symbolic', this._openPrefs);
		this._addButton(_("See logs"), 'utilities-terminal-symbolic', this._seeLogs);
		this._addButton( _("Reload GNOME Shell"), 'view-refresh-symbolic', this._reloadGS);
		this._addButton(_("Looking Glass"), 'system-search-symbolic', this._openLookingGlass);
	}

	_addButton (accessible_name, icon_name, callback) {
		let newButton = new St.Button({
			reactive: true,
			can_focus: true,
			track_hover: true,
			accessible_name: accessible_name,
			style_class: 'system-menu-action',
		});
		newButton.child = new St.Icon({ icon_name: icon_name });
		
		this.super_item.actor.add(newButton, { expand: true, x_fill: false });
		newButton.connect('clicked', callback.bind(this));
	}

	_openPrefs () {
		Util.trySpawnCommandLine('gnome-shell-extension-prefs');
		Main.panel.statusArea.aggregateMenu.menu.close();
	}

	_openLookingGlass () {
		Main.createLookingGlass().toggle();
		Main.panel.statusArea.aggregateMenu.menu.close();
	}

	_reloadGS () {
		Main.panel.statusArea.aggregateMenu.menu.close();
		if (Meta.is_wayland_compositor()) {
			this._showError(_("Restart is not available on Wayland"));
			return;
		}
		Meta.restart(_("Restarting…"));
	}

	_seeLogs () {
		let exec1 = this._terminalSettings.get_string(EXEC_KEY);
		let exec_arg = this._terminalSettings.get_string(EXEC_ARG_KEY);
		let command = exec1 + ' ' + exec_arg + ' pkexec journalctl -f /usr/bin/gnome-shell';
		Util.trySpawnCommandLine(command);
		Main.panel.statusArea.aggregateMenu.menu.close();
	}
};

let my_section;

function enable() {
	let aggregateMenu = Main.panel.statusArea.aggregateMenu;
	
	my_section = new PopupMenu.PopupMenuSection();
	my_section.addMenuItem(new ExtensionsButtonsItem().super_item);
	
	aggregateMenu._extensions = my_section;
	aggregateMenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem, 0);
	aggregateMenu.menu.addMenuItem(aggregateMenu._extensions, 0);
}

function disable() {
	Main.panel.statusArea.aggregateMenu._extensions.destroy();
}


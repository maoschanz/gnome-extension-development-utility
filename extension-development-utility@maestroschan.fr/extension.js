// GPLv3

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
		this.super_item = new PopupMenu.PopupBaseMenuItem({
			reactive: false,
			can_focus: false
		});
		this._terminalSettings = new Gio.Settings({ schema_id: TERMINAL_SCHEMA });
		let buttons_array = Convenience.getSettings().get_strv('buttons');
		for (let i=0; i < buttons_array.length; i++) {
			this._loadButton(buttons_array[i]);
		}
	}
	
	_loadButton (button_id) {
		let accessible_name;
		let icon_name;
		let callback;
		switch (button_id) {
			case 'prefs':
				accessible_name = _("Extensions preferences");
				icon_name = 'preferences-other-symbolic';
				callback = this._openPrefs;
			break;
			case 'logs':
				accessible_name = _("See GNOME Shell log");
				icon_name = 'utilities-terminal-symbolic';
				callback = this._seeLogs;
			break;
			case 'restart':
				accessible_name = _("Reload GNOME Shell");
				icon_name = 'view-refresh-symbolic';
				callback = this._reloadGS;
			break;
			case 'lg':
				accessible_name = _("'Looking Glass' debugging tool");
				icon_name = 'system-run-symbolic';
				callback = this._openLookingGlass;
			break;
			default:
				return;
			break;
		}
		this._addButton(accessible_name, icon_name, callback);
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

	// Signal callbacks

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
		let command = this._getCommandPrefix() + 'journalctl -f /usr/bin/gnome-shell';
		Util.trySpawnCommandLine(command);
		Main.panel.statusArea.aggregateMenu.menu.close();
	}
	
	// Misc
	
	_getCommandPrefix () {
		let userPrefix = Convenience.getSettings().get_string('term-prefix');
		let command = '';
		if (userPrefix == '') {
			let exec1 = this._terminalSettings.get_string(EXEC_KEY);
			let exec_arg = this._terminalSettings.get_string(EXEC_ARG_KEY);
			command = exec1 + ' ' + exec_arg;
		} else {
			command = userPrefix;
		}
		if (Convenience.getSettings().get_boolean('use-sudo')) {
			command = command + ' sudo ';
		} else {
			command = command + ' pkexec ';
		}
		return command;
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


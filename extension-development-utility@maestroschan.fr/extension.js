// GPLv3

const St = imports.gi.St;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Clutter = imports.gi.Clutter;
const PopupMenu = imports.ui.popupMenu;
const Gio = imports.gi.Gio;
const Util = imports.misc.util;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext.domain('extension-development-utility');
const _ = Gettext.gettext;

const TERMINAL_SCHEMA = 'org.gnome.desktop.default-applications.terminal';
const EXEC_KEY = 'exec';
const EXEC_ARG_KEY = 'exec-arg';

let terminalSettings;

function init() {
	ExtensionUtils.initTranslations();
	terminalSettings = new Gio.Settings({ schema_id: TERMINAL_SCHEMA });
}

function getCommandPrefix(asAdmin) {
	let userPrefix = ExtensionUtils.getSettings().get_string('term-prefix');
	let command = '';
	if(userPrefix == '') {
		let exec1 = terminalSettings.get_string(EXEC_KEY);
		let exec_arg = terminalSettings.get_string(EXEC_ARG_KEY);
		command = exec1 + ' ' + exec_arg;
	} else {
		command = userPrefix;
	}
	if(asAdmin) {
		if(ExtensionUtils.getSettings().get_boolean('use-sudo')) {
			command = command + ' sudo ';
		} else {
			command = command + ' pkexec ';
		}
	} else {
		command = command + ' ';
	}
	return command;
}

//------------------------------------------------------------------------------

class ExtensionSectionBuilder {

	constructor(menuSection) {
		this.parentSection = menuSection;
		let showAsButtons = ExtensionUtils.getSettings().get_boolean('items-layout');
		if(showAsButtons) {
			this.superItem = new PopupMenu.PopupBaseMenuItem({
				reactive: false,
				can_focus: false
			});
			this.parentSection.addMenuItem(this.superItem);
		}

		this._terminalSettings = new Gio.Settings({ schema_id: TERMINAL_SCHEMA });
		let buttons_array = ExtensionUtils.getSettings().get_strv('buttons');
		for (let i=0; i < buttons_array.length; i++) {
			this._loadActionItem(buttons_array[i], showAsButtons);
		}
	}

	getMenuSection() {
		return this.parentSection;
	}

	_loadActionItem(buttonId, showAsButtons) {
		let accessibleName;
		let iconName;
		let callback;
		switch (buttonId) {
			case 'prefs':
				accessibleName = _("Extensions preferences");
				iconName = 'preferences-other-symbolic';
				callback = this._openPrefs;
			break;
			case 'logs':
				accessibleName = _("See GNOME Shell log");
				iconName = 'utilities-terminal-symbolic';
				callback = this._seeLogs;
			break;
			case 'restart':
				if(Meta.is_wayland_compositor()) {
					return;
				}
				accessibleName = _("Reload GNOME Shell");
				iconName = 'view-refresh-symbolic';
				callback = this._reloadGS;
			break;
			case 'nested':
				accessibleName = _("Windowed session (Wayland)");
				iconName = 'window-new-symbolic';
				callback = this._nestedInstance;
			break;
			case 'lg':
				accessibleName = _("'Looking Glass' debugging tool");
				iconName = 'system-run-symbolic';
				callback = this._openLookingGlass;
			break;
			default:
				return;
			break;
		}
		if(showAsButtons) {
			this._addButton(accessibleName, iconName, callback);
		} else {
			this.parentSection.addAction(accessibleName, callback, iconName);
		}
	}

	_addButton(accessibleName, iconName, callback) {
		let newButton = new St.Button({
			reactive: true,
			can_focus: true,
			track_hover: true,
			accessible_name: accessibleName,
			style_class: 'button',
			style: 'padding-right: 12px; padding-left: 12px;',
			y_expand: false,
			x_expand: true,
			x_align: Clutter.ActorAlign.CENTER,
		});
		newButton.child = new St.Icon({
			icon_name: iconName,
			icon_size: 16,
		});

		this.superItem.actor.add_child(newButton);
		newButton.connect('clicked', callback.bind(this));
	}

	// Signal callbacks --------------------------------------------------------

	_openPrefs() {
		Util.trySpawnCommandLine('gnome-shell-extension-prefs');
		// TODO as soon as it breaks, use 'gnome-extensions-app' and change the
		// supported versions starting at 3.36
		Main.panel.statusArea.aggregateMenu.menu.close();
	}

	_openLookingGlass() {
		Main.createLookingGlass().toggle();
		Main.panel.statusArea.aggregateMenu.menu.close();
	}

	_reloadGS() {
		Main.panel.statusArea.aggregateMenu.menu.close();
		if(Meta.is_wayland_compositor()) {
			// Should never be executed since the button isn't shown on Wayland
			return;
		}
		Meta.restart(_("Restarting…"));
	}

	_nestedInstance() {
		let gnomeShellCommand = 'gnome-shell --nested --wayland'
		Util.trySpawnCommandLine(getCommandPrefix(false) +
		                            'dbus-run-session -- ' + gnomeShellCommand);
		Main.panel.statusArea.aggregateMenu.menu.close();
	}

	_seeLogs() {
		let command = getCommandPrefix(true) + 'journalctl -f /usr/bin/gnome-shell';
		Util.trySpawnCommandLine(command);
		Main.panel.statusArea.aggregateMenu.menu.close();
	}
};

//------------------------------------------------------------------------------

function enable() {
	let buttonsItem = new ExtensionSectionBuilder(new PopupMenu.PopupMenuSection());

	let aggregateMenu = Main.panel.statusArea.aggregateMenu;
	aggregateMenu._extensions = buttonsItem.getMenuSection();
	aggregateMenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem, 0);
	aggregateMenu.menu.addMenuItem(aggregateMenu._extensions, 0);
}

function disable() {
	Main.panel.statusArea.aggregateMenu._extensions.destroy();
}



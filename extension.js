/*
  Extension Development Utility

  Copyright (c) 2016 Norman L. Smith, Maestroschan

  This extension is free software; you can redistribute it and/or
  modify it under the terms of the GNU General Public License
  as published by the Free Software Foundation; either version 2
  of the License, or (at your option) any later version.

  This extension is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this extension. If not, see
  < https://www.gnu.org/licenses/old-licenses/gpl-2.0.html >.

  This extension is a derived work of the Gnome Shell.

  This extension is intended for use by Gnome Shell Extension writers.
  It is common practice to restart the Shell during extension testing
  to reload the extension to test changes made to the extension's code.
  Wayland does not allow restart of the Shell. To reload an extension
  under Wayland a logout and a login is required. The extension reloads
  only the selected extension with two mouse clicks saving time for the
  extension writer.
*/

const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const Meta = imports.gi.Meta;
const Gio = imports.gi.Gio;
const St = imports.gi.St;
const ExtensionSystem = imports.ui.extensionSystem;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;
const ExtensionUtils = imports.misc.extensionUtils;
const Util = imports.misc.util;
const Me = ExtensionUtils.getCurrentExtension();
const Notify = Me.imports.notify;

const Gettext = imports.gettext.domain('extension-development-utility');
const _ = Gettext.gettext;
const Convenience = Me.imports.convenience;

const ENABLED = 1;
const ICON = [ 'dialog-information-symbolic',
               'dialog-warning-symbolic',
               'dialog-error-symbolic'
             ];
const MAX_HEIGHT = parseInt(global.screen_height * 0.95).toString();
const ROLE = 'extension-reloader-indicator';
let STATE;
const STYLE1 = 'width: 120px;';
const STYLE2 = 'font-weight: bold;';
const TYPE = { info: 0,
               warning: 1,
               error: 2
             };

const SubMenuItem = new Lang.Class({
    Name: 'ExtensionDevelopmentUtility.SubMenuItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(extension, name, menu, subMenu) {
	this.parent();
        this._extension = extension;
        this._state = extension.state;
        this._uuid = extension.uuid;
        this._name = name;
        if (this._state > 6)
            this._state = 0;
        let box = new St.BoxLayout();
        let label1 = new St.Label({ text: STATE[this._state] });
        label1.set_style(STYLE1);
        box.add_actor(label1);
        let label2 = new St.Label({ text: name });
        if (this._state == ENABLED)
            label2.set_style(STYLE2);
        box.add_actor(label2);
        this.actor.add_child(box);
        this._subMenu = subMenu;
        this._menu = menu;
        this._keyInId = 0;
    },

    destroy: function() {
        this.actor.disconnect(this._keyInId);
        this.parent();
    },

    activate: function() {
        let enabledExtensions = global.settings.get_strv(ExtensionSystem.ENABLED_EXTENSIONS_KEY);
        if (enabledExtensions.indexOf(this._uuid) == -1) {
            enabledExtensions.push(this._uuid);
            global.settings.set_strv(ExtensionSystem.ENABLED_EXTENSIONS_KEY, enabledExtensions);
        }
        try {
            ExtensionSystem.reloadExtension(this._extension);
            Notify.notify(_("Reloading completed"), this._name, TYPE.info);
            log("Reloading completed" + ' : ' + this._name + ' : ' + this._uuid);
        } catch(e) {
            Notify.notify(_("Error reloading") + ' : ' + this._name, e.message + ' : ' + this._uuid, TYPE.error);
        }
        this._subMenu.close();
        this._menu.close();
    }
});

const ExtensionDevelopmentUtilityMenu = new Lang.Class({
    Name: 'ExtensionDevelopmentUtility.ExtensionDevelopmentUtilityMenu',
    Extends: PanelMenu.Button,

    _init: function(subMenuIsOpen) {
        this.parent(0.5, 'Extension Development Utility Menu');
        let hbox = new St.BoxLayout({
            style_class: 'panel-status-menu-box'
        });
        let iconBin = new St.Bin();
        iconBin.child = new St.Icon({
            icon_name: 'emblem-synchronizing-symbolic',
            style_class: 'system-status-icon'
        });
        hbox.add_child(iconBin);
	//	hbox.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
        this.actor.add_actor(hbox);
        
        this.lookingGlass = new PopupMenu.PopupMenuItem("Looking Glass");
		this.menu.addMenuItem(this.lookingGlass);
		this.lookingGlass.connect('activate', Lang.bind(this, this._onLookingGlass));

		//----------------------------------------------
		//this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		//----------------------------------------------

		// restart
		this.restart = new PopupMenu.PopupMenuItem(_("Restart Shell (Xorg only)"));
		this.menu.addMenuItem(this.restart);
		if(!Meta.is_wayland_compositor()){
			this.restart.connect('activate', Lang.bind(this, this._onRestart));
		} else {
			this.restart.setSensitive(false);
		}

		// reload theme
		this.reloadTheme = new PopupMenu.PopupMenuItem(_("Reload Theme"));
		this.menu.addMenuItem(this.reloadTheme);
		this.reloadTheme.connect('activate', Lang.bind(this, this._onReloadTheme));

		//----------------------------------------------

		let reloadExtensions = _("Reload Extensions");
		this._subMenuMenuItem = new PopupMenu.PopupSubMenuMenuItem(reloadExtensions, false);
		this.menu.addMenuItem(this._subMenuMenuItem);

		if (subMenuIsOpen) {
			this._openToggledId = this.menu.connect('open-state-changed', Lang.bind(this, this._openToggled));
		} else {
			this._openToggledId = this.menu.connect('open-state-changed', Lang.bind(this, function(){
				this._subMenuMenuItem.setSubmenuShown(false);
			}));
		}

		this._scrollView = this._subMenuMenuItem.menu.actor;
		this._vBar = this._subMenuMenuItem.menu.actor.get_vscroll_bar();
		this._vBar.vscrollbar_policy = true;
		this._populateSubMenu(this._subMenuMenuItem.menu);
        
        //----------------------------------------------
		//this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		//----------------------------------------------
		
		// open extensions folder
		this.ef = new PopupMenu.PopupMenuItem(_("Open Local Extensions Folder"));
		this.menu.addMenuItem(this.ef);
		this.ef.connect('activate', Lang.bind(this, this._doLocalFolder));
		
		// open extensions folder
		this.ew = new PopupMenu.PopupMenuItem(_("Open Extensions Website"));
		this.menu.addMenuItem(this.ew);
		this.ew.connect('activate', Lang.bind(this, this._doLocalExtensions));
    },
    
        
	_doLocalFolder: function() {
		Main.Util.trySpawnCommandLine('xdg-open .local/share/gnome-shell/extensions/');
	},

	_doLocalExtensions: function() {
		Main.Util.trySpawnCommandLine('xdg-open https://extensions.gnome.org/local/');
	},
	
	_onReloadTheme: function() {
		Main.loadTheme();
	},
	
	_onLookingGlass: function() {
		Main.createLookingGlass().toggle();
	},

	_onRestart: function() {
		//global.reexec_self();
		if (Meta.is_wayland_compositor()) {
			this._showError(_("Restart is not available on Wayland"));
			return;
		}
		Meta.restart(_("Restarting…"));
	},

    _openToggled: function(menu, open) {
        if (open) {
            this._subMenuMenuItem.menu.removeAll();
            this._populateSubMenu(this._subMenuMenuItem.menu);
            this._subMenuMenuItem.menu.open();
        }
    },

    _scrollMenuBox: function(actor) {
        let box = actor.get_allocation_box();
        let currentValue = this._vBar.get_adjustment().get_value();
        let newValue = currentValue;
        let delta = Math.ceil((box.y2 - box.y1) * .25);
        if (currentValue > (box.y1 - delta))
            newValue = box.y1 - delta;
        if ((this._scrollView.height + currentValue) < (box.y2 + delta))
            newValue = box.y2 - this._scrollView.height + delta;
        if (newValue != currentValue)
            this._vBar.get_adjustment().set_value(newValue);
    },

    _compare: function(a, b) {
        let aKey = a.state.toString() + a.metadata.name.toUpperCase();
        let bKey = b.state.toString() + b.metadata.name.toUpperCase();
        return (aKey > bKey) ? 0 : -1;
    },

    _populateSubMenu: function(subMenu) {
        let sortedArray = [];
        for (let i in ExtensionUtils.extensions) {
            let entry = ExtensionUtils.extensions[i];
            Util.insertSorted(sortedArray, entry, Lang.bind(this, function(a, b) {
                return this._compare(a, b);
            }));
        }
        for (let i in sortedArray) {
            let uuid = sortedArray[i].uuid;
            let name = sortedArray[i].metadata.name;
            let state = sortedArray[i].state;
            let ext = sortedArray[i];
            let item = new SubMenuItem(ext, name, this.menu, subMenu);
            item._keyInId = item.actor.connect('key-focus-in', Lang.bind(this, this._scrollMenuBox));
            subMenu.addMenuItem(item);
        }
    },

    destroy: function() {
        this.menu.disconnect(this._openToggledId);
        this._subMenuMenuItem.menu.removeAll();
        this.menu.removeAll();
        this.parent();
    }
});

const ExtensionDevelopmentUtilityExtension = new Lang.Class({
    Name: 'ExtensionDevelopmentUtility.ExtensionDevelopmentUtilityExtension',

    _init: function() {
        this._button = null;
        this._timeoutId = 0;
        let GioSSS = Gio.SettingsSchemaSource;
        let schema = Me.metadata['settings-schema'];
        let schemaDir = Me.dir.get_child('schemas').get_path();
        let schemaSrc = GioSSS.new_from_directory(schemaDir, GioSSS.get_default(), false);
        let schemaObj = schemaSrc.lookup(schema, true);
        this._settings = new Gio.Settings({ settings_schema: schemaObj });
        this._positionChangedSig = 0;
    },

    _positionChange: function() {
        this.disable();
        this._delayedEnable();
    },

    _getPosition: function() {
        let positionInt = this._settings.get_int('panel-icon-position');
   		let position;
   		
        switch(positionInt) {
        	case 0:
        		position = [0, 'center'];
        		break;
        	case 1:
        		position = [-1, 'center'];
        		break;
        	case 2:
        		position = [0, 'right'];
        		break;
            case 3:
				position = [-1, 'right'];
        		break;
        	default:
        		position = [0, 'center'];
        		break;
		}
		
        return position;
    },

    _delayedEnable: function() {
        if (this._timeoutId != 0) {
            Mainloop.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
        
        let parameter = this._settings.get_boolean('submenu-is-open');
        this._button = new ExtensionDevelopmentUtilityMenu(parameter);
        
        let position = this._getPosition();
        Main.panel.addToStatusArea(ROLE, this._button, position[0], position[1]);
        this._positionChangedSig = this._settings.connect('changed::panel-icon-position', Lang.bind(this, this._positionChange));
    },

    destroy: function() {
        if (this._button != null) {
            this._button.destroy();
            this._button = null;
        }
    },

    enable: function() { 
        if (Main.sessionMode.currentMode == 'user' || Main.sessionMode.currentMode == 'classic') {
            this._timeoutId = Mainloop.timeout_add(3000, Lang.bind(this, this._delayedEnable));
        }
    },

    disable: function() {
        if (this._timeoutId != 0) {
            Mainloop.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
        if (this._button != null) {
            this._button.destroy();
            this._button = null;
        }
        if (this._positionChangedSig > 0) {
            this._settings.disconnect(this._positionChangedSig);
            this._positionChangedSig = 0;
        }
    }
});

function init(metadata) {
	Convenience.initTranslations();
	STATE = [_("Unknown"), _("Enabled"), _("Disabled"), _("Error"), _("Out of Date"), _("Downloading"), _("Initialized")];
    return new ExtensionDevelopmentUtilityExtension();
}

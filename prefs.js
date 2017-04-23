/*
  This file is part of extension-development-utility@maestroschan.fr, inspired
  by the extension-reloader@nls1729 Gnome Shell Extension.

  Copyright (c) 2016 Norman L. Smith

  This extension is free software; you can redistribute it and/or
  modify it under the terms of the GNU General Public License
  as published by the Free Software Foundation; either version 2
  of the License, or (at your option) any later version.

  This extension is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program. If not, see
  < https://www.gnu.org/licenses/old-licenses/gpl-2.0.html >.

  This extension is a derived work of the Gnome Shell.
*/

const Lang = imports.lang;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const Config = imports.misc.config;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain('extension-development-utility');
const _ = Gettext.gettext;
const Convenience = Me.imports.convenience;

const IPOSITION = 'panel-icon-position';
const OPEN = 'submenu-is-open';

function init() {
    Convenience.initTranslations();
}

const ExtensionDevelopmentUtilityPrefsWidget = new GObject.Class({
    Name: 'ExtensionDevelopmentUtility.Prefs.Widget',
    GTypeName: 'ExtensionDevelopmentUtilityPrefsWidget',
    Extends: Gtk.Box,

    _init: function(params) {
        this.parent(params);
        let GioSSS = Gio.SettingsSchemaSource;
        let schema = Me.metadata['settings-schema'];
        let schemaDir = Me.dir.get_child('schemas').get_path();
        let schemaSrc = GioSSS.new_from_directory(schemaDir, GioSSS.get_default(), false);
        let schemaObj = schemaSrc.lookup(schema, true);
        this._settings = new Gio.Settings({settings_schema: schemaObj});
        
        this.margin = 30;
        this.spacing = 25;
        this.fill = true;
        this.set_orientation(Gtk.Orientation.VERTICAL);
        
        this._setButtonLocation();
        
        this._setShouldBeOpen();
        
        this._displayVersion();
    },
    
    _setShouldBeOpen: function(){

		let openSubmenuCheckButton = new Gtk.CheckButton({label:_("Open extensions submenu by default")});
		
		openSubmenuCheckButton.connect('toggled', Lang.bind(this, function(b) {
			if(b.get_active()) {
				this._settings.set_boolean(OPEN, true);
			} else {
				this._settings.set_boolean(OPEN, false);
			}
		}));
		
		openSubmenuCheckButton.set_active(this._settings.get_boolean(OPEN));

    	this.add(openSubmenuCheckButton);
    },
    
    _setButtonLocation: function() {
		this._centerLeftRb = new Gtk.RadioButton({label:_("Center Left")});
		this._centerRightRb = new Gtk.RadioButton({group:this._centerLeftRb, label:_("Center Right")});
		this._rightRb = new Gtk.RadioButton({group:this._centerLeftRb, label:_("Right")});
		this._farRightRb = new Gtk.RadioButton({group:this._centerLeftRb, label:_("Far Right")});
        
        
        let rbGroup = new Gtk.Box({orientation:Gtk.Orientation.VERTICAL, homogeneous:false,
            margin_left:4, margin_top:4, margin_bottom:4, margin_right:4, spacing: 10 });
        rbGroup.add(this._centerLeftRb);
        rbGroup.add(this._centerRightRb);
        rbGroup.add(this._rightRb);
        rbGroup.add(this._farRightRb);
        
        let positionInt = this._settings.get_int(IPOSITION);
        this._centerLeftRb.connect('toggled', Lang.bind(this, function(b) {
            if(b.get_active())
				this._settings.set_int(IPOSITION, 0);
        }));
        this._centerRightRb.connect('toggled', Lang.bind(this, function(b) {
			if(b.get_active())
				this._settings.set_int(IPOSITION, 1);
        }));
        this._rightRb.connect('toggled', Lang.bind(this, function(b) {
			if(b.get_active())
				this._settings.set_int(IPOSITION, 2);
        }));
        this._farRightRb.connect('toggled', Lang.bind(this, function(b) {
			if(b.get_active())
				this._settings.set_int(IPOSITION, 3);
        }));
        
        switch(positionInt) {
        	case 0:
        		this._centerLeftRb.set_active(true);
        		break;
        	case 1:
        		this._centerRightRb.set_active(true);
        		break;
        	case 2:
        		this._rightRb.set_active(true);
        		break;
        	case 3:
        		this._farRightRb.set_active(true);
        		break;
        	default:
        		this._centerLeftRb.set_active(true);
        		break;
        }
        
		this.add(new Gtk.Label({ halign: Gtk.Align.START, label: _("Button Location :"), wrap: true, xalign: 0.5 }), 0,  8, 7, 1);
		this.add(rbGroup, 3, 10, 1, 3);
    }, 
    
    _displayVersion: function() {
    	let shell_version = Me.metadata['shell-version'].toString();
        let version = '[v' + Me.metadata.version.toString() + ' - GnomeShell ' + shell_version + ']';
        
        this.add(new Gtk.Label({ halign: Gtk.Align.START, label: version, wrap: true, xalign: 0.5 }), 0, 8, 7, 1);
    }
});

function buildPrefsWidget() {
    let widget = new ExtensionDevelopmentUtilityPrefsWidget();
    widget.show_all();
    return widget;
}


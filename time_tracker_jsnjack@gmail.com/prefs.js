/*globals imports*/
/*jslint nomen: true */
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;

const Gettext = imports.gettext.domain('time-tracker');
const _ = Gettext.gettext;

var settings;


function init() {
    Convenience.initTranslations('time-tracker');
    settings = Convenience.getSettings();
}


function buildPrefsWidget() {
    var widget = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, border_width: 10 }),
        display_label = new Gtk.Label({ label: "<b>" + _("Display") + "</b>", use_markup: true, xalign: 0 }),
        display_box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_left: 20 }),
        seconds_label = new Gtk.Label({label: _("Show seconds"), margin_right: 10}),
        seconds_switch = new Gtk.Switch({active: settings.get_boolean('show-seconds')});


    display_box.add(seconds_label);
    display_box.add(seconds_switch);

    widget.add(display_label);
    widget.add(display_box);

    //Callbacks
    seconds_switch.connect("notify::active", function (state) {
        settings.set_boolean('show-seconds', state.active);
    });

    widget.show_all();
    return widget;
}


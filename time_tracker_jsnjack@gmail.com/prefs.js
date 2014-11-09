/*globals imports*/
/*jslint nomen: true, moz: true */
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Gtk = imports.gi.Gtk;

const Gettext = imports.gettext.domain('time-tracker');
const _ = Gettext.gettext;

var settings, start_time;


function init() {
    Convenience.initTranslations('time-tracker');
    settings = Convenience.getSettings();
    start_time = settings.get_string('start-time');
}


function adjust_start_time(value, type) {
    // Replace old start-time date with the new one
    var change, start_time_obj, new_start_time_obj;
    if (type === "hours") {
        change = value * 60 * 60 * 1000;
    } else if (type === "mins") {
        change = value * 60 * 1000;
    }
    start_time_obj = new Date(start_time);
    new_start_time_obj = new Date(start_time_obj.getTime() + change);
    settings.set_string('start-time', new_start_time_obj.toString());
    // Mark time for update
    settings.set_boolean("update-start-time", true);
}


function buildPrefsWidget() {
    var widget = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, border_width: 10 }),
        display_label = new Gtk.Label({ label: "<b>" + _("Display") + "</b>", use_markup: true, xalign: 0 }),
        display_box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_left: 20 }),
        seconds_label = new Gtk.Label({label: _("Show seconds"), margin_right: 10}),
        seconds_switch = new Gtk.Switch({active: settings.get_boolean('show-seconds')}),

        adjust_time_label = new Gtk.Label({ label: "<b>" + _("Adjust start time") + "</b>", use_markup: true, xalign: 0, margin_top: 20 }),
        start_time_label = new Gtk.Label({ label: _("Current start time: ") + start_time.toLocaleString()}),
        adjust_time_box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, margin_left: 20 }),
        hours_box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL}),
        hours_label = new Gtk.Label({label: _("Hours"), margin_right: 10}),
        hours_spin = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({value: 0,
                                                                        lower: -999,
                                                                        upper: 999,
                                                                        step_increment: 1}),
                                        value: 0}),
        mins_box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL}),
        mins_label = new Gtk.Label({label: _("Minutes"), margin_right: 10}),
        mins_spin = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({value: 0,
                                                                       lower: -60,
                                                                       upper: 60,
                                                                       step_increment: 1}),
                                       value: 0});


    display_box.pack_start(seconds_label, false, false, 3);
    display_box.pack_start(seconds_switch, false, false, 3);

    hours_box.pack_start(hours_label, false, false, 3);
    hours_box.pack_start(hours_spin, false, false, 3);
    mins_box.pack_start(mins_label, false, false, 3);
    mins_box.pack_start(mins_spin, false, false, 3);
    adjust_time_box.pack_start(hours_box, false, false, 3);
    adjust_time_box.pack_start(mins_box, false, false, 3);

    widget.pack_start(display_label, false, false, 3);
    widget.pack_start(display_box, false, false, 3);
    widget.pack_start(adjust_time_label, false, false, 3);
    widget.pack_start(start_time_label, false, false, 3);
    widget.pack_start(adjust_time_box, false, false, 3);

    //Callbacks
    seconds_switch.connect("notify::active", function (state) {
        settings.set_boolean('show-seconds', state.active);
    });
    hours_spin.connect("value-changed", function (spin_button) {
        adjust_start_time(spin_button.get_value(), "hours");
    });
    mins_spin.connect("value-changed", function (spin_button) {
        adjust_start_time(spin_button.get_value(), "mins");
    });


    widget.show_all();
    return widget;
}


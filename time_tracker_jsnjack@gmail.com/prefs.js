/* jshint moz:true, unused: false */
/* exported init, buildPrefsWidget */
/* globals imports */

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;

const Gettext = imports.gettext.domain('time-tracker');
const _ = Gettext.gettext;

var settings, start_time, normal_color, paused_color;


function init() {
    Convenience.initTranslations('time-tracker');
    settings = Convenience.getSettings();
    start_time = settings.get_string('start-time');
    normal_color = new Gdk.RGBA();
    normal_color.parse(settings.get_string('indicator-color'));
    paused_color = new Gdk.RGBA();
    paused_color.parse(settings.get_string('indicator-paused-color'));
}


function adjust_start_time(hours, mins) {
    // Replace old start-time date with the new one
    var change, start_time_obj, new_start_time_obj;
    change = hours * 60 * 60 * 1000 + mins * 60 * 1000;
    start_time_obj = new Date(start_time);
    new_start_time_obj = new Date(start_time_obj.getTime() + change);
    settings.set_string('start-time', new_start_time_obj.toString());
    // Mark time for update
    settings.set_boolean("update-start-time", true);
}

function adjust_pause(hours, mins) {
    // Update pause-duration
    var change = hours * 60 * 60 * 1000 + mins * 60 * 1000;
    settings.set_int('pause-duration', settings.get_int('pause-duration') + change);
    // Mark time for update
    settings.set_boolean("update-start-time", true);
}

function parse_pause_duration(seconds) {
    // Returns amount of hours and minutes
    var data = {};
    data.hours = parseInt(seconds / 3600, 10);
    seconds = seconds - data.hours * 3600;
    data.mins = parseInt(seconds / 60, 10);
    return data;
}

function save_color_change(color, key) {
    // Saves changes to the settings
    settings.set_string(key, color.to_string());
    settings.set_boolean("update-indicator-style", true);
}


function buildPrefsWidget() {
    var widget = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            border_width: 10
            }),
        data = parse_pause_duration(settings.get_int('pause-duration') / 1000),
        display_label = new Gtk.Label({label: "<b>" + _("Display") + "</b>", use_markup: true, xalign: 0}),
        display_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin_left: 20}),
        seconds_label = new Gtk.Label({label: _("Show seconds"), margin_right: 10}),
        seconds_switch = new Gtk.Switch({active: settings.get_boolean('show-seconds')}),

        adjust_time_label = new Gtk.Label({
            label: "<b>" + _("Adjust start time") + "</b>", use_markup: true, xalign: 0, margin_top: 20
        }),
        start_time_label = new Gtk.Label({label: _("Start time: ") + start_time.toLocaleString()}),
        adjust_time_box = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, margin_left: 20}),
        hours_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL}),
        hours_label = new Gtk.Label({label: _("Hours"), margin_right: 10}),
        hours_spin = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({value: 0,
                                                                        lower: -999,
                                                                        upper: 999,
                                                                        step_increment: 1}),
                                        value: 0}),
        mins_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL}),
        mins_label = new Gtk.Label({label: _("Minutes"), margin_right: 10}),
        mins_spin = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({value: 0,
                                                                       lower: -60,
                                                                       upper: 60,
                                                                       step_increment: 1}),
                                       value: 0}),

        adjust_pause_label = new Gtk.Label({
            label: "<b>" + _("Adjust pause duration") + "</b>", use_markup: true, xalign: 0, margin_top: 20
        }),
        adjust_pause_box = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, margin_left: 20}),
        pause_hours_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL}),
        pause_hours_label = new Gtk.Label({label: _("Hours"), margin_right: 10}),
        pause_hours_spin = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({value: data.hours,
                                                                        lower: -999,
                                                                        upper: 999,
                                                                        step_increment: 1}),
                                        value: 0}),
        pause_mins_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL}),
        pause_mins_label = new Gtk.Label({label: _("Minutes"), margin_right: 10}),
        pause_mins_spin = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({value: data.mins,
                                                                       lower: -60,
                                                                       upper: 60,
                                                                       step_increment: 1}),
                                       value: 0}),

        color_label = new Gtk.Label({label: "<b>" + _("Colours") + "</b>", use_markup: true, xalign: 0}),
        color_box = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, margin_left: 20}),
        indicator_color = new Gtk.ColorButton({
            title: _("Normal state"),
            rgba: normal_color
        }),
        indicator_color_label = new Gtk.Label({label: _("Normal state"), margin_right: 10}),
        indicator_color_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL}),
        indicator_paused_color = new Gtk.ColorButton({
            title: _("Paused state"),
            rgba: paused_color
        }),
        indicator_paused_color_label = new Gtk.Label({label: _("Paused state"), margin_right: 10}),
        indicator_paused_color_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});

    display_box.pack_start(seconds_label, false, false, 3);
    display_box.pack_start(seconds_switch, false, false, 3);

    hours_box.pack_start(hours_label, false, false, 3);
    hours_box.pack_start(hours_spin, false, false, 3);
    mins_box.pack_start(mins_label, false, false, 3);
    mins_box.pack_start(mins_spin, false, false, 3);
    adjust_time_box.pack_start(hours_box, false, false, 3);
    adjust_time_box.pack_start(mins_box, false, false, 3);

    pause_hours_box.pack_start(pause_hours_label, false, false, 3);
    pause_hours_box.pack_start(pause_hours_spin, false, false, 3);
    pause_mins_box.pack_start(pause_mins_label, false, false, 3);
    pause_mins_box.pack_start(pause_mins_spin, false, false, 3);
    adjust_pause_box.pack_start(pause_hours_box, false, false, 3);
    adjust_pause_box.pack_start(pause_mins_box, false, false, 3);

    indicator_color_box.pack_start(indicator_color_label, false, false, 3);
    indicator_color_box.pack_start(indicator_color, false, false, 3);
    indicator_paused_color_box.pack_start(indicator_paused_color_label, false, false, 3);
    indicator_paused_color_box.pack_start(indicator_paused_color, false, false, 3);

    color_box.pack_start(indicator_color_box, false, false, 3);
    color_box.pack_start(indicator_paused_color_box, false, false, 3);

    widget.pack_start(display_label, false, false, 3);
    widget.pack_start(display_box, false, false, 3);
    widget.pack_start(adjust_time_label, false, false, 3);
    widget.pack_start(start_time_label, false, false, 3);
    widget.pack_start(adjust_time_box, false, false, 3);
    widget.pack_start(adjust_pause_label, false, false, 3);
    widget.pack_start(adjust_pause_box, false, false, 3);
    widget.pack_start(color_label, false, false, 3);
    widget.pack_start(color_box, false, false, 3);

    pause_hours_spin.set_sensitive(!settings.get_boolean("paused"));
    pause_mins_spin.set_sensitive(!settings.get_boolean("paused"));

    //Callbacks
    seconds_switch.connect("notify::active", function (state) {
        settings.set_boolean('show-seconds', state.active);
    });
    hours_spin.connect("value-changed", function () {
        adjust_start_time(hours_spin.get_value(), mins_spin.get_value());
    });
    mins_spin.connect("value-changed", function () {
        adjust_start_time(hours_spin.get_value(), mins_spin.get_value());
    });
    pause_hours_spin.connect("value-changed", function () {
        adjust_pause(pause_hours_spin.get_value(), pause_mins_spin.get_value());
    });
    pause_mins_spin.connect("value-changed", function () {
        adjust_pause(pause_hours_spin.get_value(), pause_mins_spin.get_value());
    });
    indicator_color.connect("color-set", function () {
        save_color_change(indicator_color.get_rgba(), "indicator-color");
    });
    indicator_paused_color.connect("color-set", function () {
        save_color_change(indicator_paused_color.get_rgba(), "indicator-paused-color");
    });

    widget.show_all();
    return widget;
}

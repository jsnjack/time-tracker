/* jshint moz:true, unused: false */
/* exported init, buildPrefsWidget */
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import Adw from 'gi://Adw';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
var settings, start_time, normal_color, paused_color, initial_pause;


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
    settings.set_int('pause-duration', initial_pause + change);
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


export default class TimeTrackerPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();
        settings = window._settings;
        start_time = settings.get_string('start-time');
        normal_color = new Gdk.RGBA();
        normal_color.parse(settings.get_string('indicator-color'));
        paused_color = new Gdk.RGBA();
        paused_color.parse(settings.get_string('indicator-paused-color'));
        initial_pause = settings.get_int('pause-duration');

        const page = new Adw.PreferencesPage();

        const group = new Adw.PreferencesGroup({
            title: _('General'),
        });
        page.add(group);

        var widget = new Gtk.Box({
              orientation: Gtk.Orientation.VERTICAL,
              margin_top: 10,
              margin_bottom: 10,
              margin_start: 10,
              margin_end: 10,
          }),
          data = parse_pause_duration(settings.get_int('pause-duration') / 1000),
          display_label = new Gtk.Label({label: "<b>" + _("Display") + "</b>", use_markup: true, xalign: 0}),
          display_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin_start: 20}),
          seconds_label = new Gtk.Label({label: _("Show seconds"), margin_end: 10}),
          seconds_switch = new Gtk.Switch({active: settings.get_boolean('show-seconds')}),

          adjust_time_label = new Gtk.Label({
              label: "<b>" + _("Adjust start time") + "</b>", use_markup: true, xalign: 0, margin_top: 20
          }),
          start_time_label = new Gtk.Label({label: _("Start time: ") + start_time.toLocaleString()}),
          adjust_time_box = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, margin_start: 20}),
          hours_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL}),
          hours_label = new Gtk.Label({label: _("Hours"), margin_end: 10}),
          hours_spin = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({value: 0,
                  lower: -999,
                  upper: 999,
                  step_increment: 1}),
              value: 0}),
          mins_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL}),
          mins_label = new Gtk.Label({label: _("Minutes"), margin_end: 10}),
          mins_spin = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({value: 0,
                  lower: -60,
                  upper: 60,
                  step_increment: 1}),
              value: 0}),

          adjust_pause_label = new Gtk.Label({
              label: "<b>" + _("Adjust pause duration") + "</b>", use_markup: true, xalign: 0, margin_top: 20
          }),
          adjust_pause_box = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, margin_start: 20}),
          pause_hours_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL}),
          pause_hours_label = new Gtk.Label({label: _("Hours"), margin_end: 10}),
          pause_hours_spin = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({value: data.hours,
                  lower: -999,
                  upper: 999,
                  step_increment: 1}),
              value: 0}),
          pause_mins_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL}),
          pause_mins_label = new Gtk.Label({label: _("Minutes"), margin_end: 10}),
          pause_mins_spin = new Gtk.SpinButton({adjustment: new Gtk.Adjustment({value: data.mins,
                  lower: -60,
                  upper: 60,
                  step_increment: 1}),
              value: 0}),
          pause_on_lock_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL}),
          pause_on_lock_label = new Gtk.Label({label: _("Pause while screen locked"), margin_end: 10}),
          pause_on_lock_switch = new Gtk.Switch({active: settings.get_boolean('pause-during-screen-lock')}),

          color_label = new Gtk.Label({label: "<b>" + _("Colours") + "</b>", use_markup: true, xalign: 0}),
          color_box = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, margin_start: 20}),
          indicator_color = new Gtk.ColorButton({
              title: _("Normal state"),
              rgba: normal_color
          }),
          indicator_color_label = new Gtk.Label({label: _("Normal state"), margin_end: 10}),
          indicator_color_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL}),
          indicator_paused_color = new Gtk.ColorButton({
              title: _("Paused state"),
              rgba: paused_color
          }),
          indicator_paused_color_label = new Gtk.Label({label: _("Paused state"), margin_end: 10}),
          indicator_paused_color_box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});

        display_box.append(seconds_label, false, false, 3);
        display_box.append(seconds_switch, false, false, 3);

        hours_box.append(hours_label, false, false, 3);
        hours_box.append(hours_spin, false, false, 3);
        mins_box.append(mins_label, false, false, 3);
        mins_box.append(mins_spin, false, false, 3);
        adjust_time_box.append(hours_box, false, false, 3);
        adjust_time_box.append(mins_box, false, false, 3);

        pause_hours_box.append(pause_hours_label, false, false, 3);
        pause_hours_box.append(pause_hours_spin, false, false, 3);
        pause_mins_box.append(pause_mins_label, false, false, 3);
        pause_mins_box.append(pause_mins_spin, false, false, 3);
        pause_on_lock_box.append(pause_on_lock_label, false, false, 3);
        pause_on_lock_box.append(pause_on_lock_switch, false, false, 3);
        adjust_pause_box.append(pause_hours_box, false, false, 3);
        adjust_pause_box.append(pause_mins_box, false, false, 3);
        adjust_pause_box.append(pause_on_lock_box, false, false, 3);

        indicator_color_box.append(indicator_color_label, false, false, 3);
        indicator_color_box.append(indicator_color, false, false, 3);
        indicator_paused_color_box.append(indicator_paused_color_label, false, false, 3);
        indicator_paused_color_box.append(indicator_paused_color, false, false, 3);

        color_box.append(indicator_color_box, false, false, 3);
        color_box.append(indicator_paused_color_box, false, false, 3);

        widget.append(display_label, false, false, 3);
        widget.append(display_box, false, false, 3);
        widget.append(adjust_time_label, false, false, 3);
        widget.append(start_time_label, false, false, 3);
        widget.append(adjust_time_box, false, false, 3);
        widget.append(adjust_pause_label, false, false, 3);
        widget.append(adjust_pause_box, false, false, 3);
        widget.append(color_label, false, false, 3);
        widget.append(color_box, false, false, 3);

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
        pause_on_lock_switch.connect("notify::active", function (state) {
            settings.set_boolean('pause-during-screen-lock', state.active);
        });
        indicator_color.connect("color-set", function () {
            save_color_change(indicator_color.get_rgba(), "indicator-color");
        });
        indicator_paused_color.connect("color-set", function () {
            save_color_change(indicator_paused_color.get_rgba(), "indicator-paused-color");
        });

        group.add(widget)

        window.add(page);
    }
}

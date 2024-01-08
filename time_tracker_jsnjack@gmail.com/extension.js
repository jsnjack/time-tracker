/* jshint moz:true, unused: false */
/* exported init, enable, disable */
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
const Mainloop = imports.mainloop;
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';
import St from 'gi://St';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';
import GObject from 'gi://GObject';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

var start_time, indicator, start_time_string, settings, timeout,
    preferences_button_name,
    restart_button_name,
    toggle_button_name;

var TTNotificationBanner = GObject.registerClass({
    GTypeName: 'MyNSource'
}, class TTNotificationBanner extends MessageTray.NotificationBanner {
    addAction(label, callback) {
        // Style buttons
        var extra_style = "";

        // Redefining label is required for translation
        label = _(label);
        if (label === restart_button_name) {
            extra_style =" button-restart";
        } else if (label === toggle_button_name) {
            if (settings.get_boolean("paused")) {
                label = _("Resume");
                extra_style = " button-resume";
            } else {
                label = _("Pause");
                extra_style = " button-pause";
            }
        }
        let button = new St.Button( {
            style_class : 'notification-button' + extra_style,
            label: label,
            x_expand: true,
            can_focus: true
        });

        return this.addButton(button, callback);
    }
});

var TTSource = GObject.registerClass({
    GTypeName: 'MySource'
}, class TTSource extends MessageTray.Source {
    createBanner(notification) {
        return new TTNotificationBanner(notification);
    }
});

function _refresh() {
    // Get difference between start time and current time
    // and show it
    var current_time = new Date(),
        difference, hours, mins, secs, timer;
    // Check if start_time needs update:
    if (settings.get_boolean("update-start-time")) {
        start_time_string = settings.get_string('start-time');
        start_time = new Date(start_time_string);
        settings.set_boolean("update-start-time", false);
    }
    // Check if indicator style needs update:
    if (settings.get_boolean("update-indicator-style")) {
        update_indicator_style();
        settings.set_boolean("update-indicator-style", false);
    }
    // If in pause, than show the difference between start_time and pause-start-time
    if (settings.get_boolean("paused")) {
        current_time = new Date(settings.get_string("pause-start-time"));
    }
    // Get difference between two times in secs
    difference = Math.round((current_time - start_time - settings.get_int("pause-duration")) / 1000);
    hours = parseInt(difference / 3600, 10);
    if (hours !== 0) {
        difference = difference - hours * 3600;
    }
    mins = parseInt(difference / 60, 10);
    if (mins !== 0) {
        difference = difference - mins * 60;
    }
    secs = difference;
    // Prepare timer info
    if (settings.get_boolean('show-seconds') === true) {
        timer = "%d:%02d:%02d".format(hours, mins, secs);
    } else {
        timer = "%d:%02d".format(hours, mins);
    }
    indicator.set_label(timer);
}

function _restart() {
    // Restart timer. Set new value for start_time
    var message_body = start_time.toLocaleString(),
        message_title = _("Timer was started at"),
        source = new TTSource(_("Time tracker"), "preferences-system-time-symbolic"),
        notification = new MessageTray.Notification(source, message_title, message_body);

    // Add buttons
    notification.addAction(preferences_button_name, on_preferences);
    notification.addAction(toggle_button_name, on_toggle);
    notification.addAction(restart_button_name, on_reset);

    // Notification disapears from tray after it was showed
    notification.setTransient(true);

    Main.messageTray.add(source);
    source.showNotification(notification);
}

function update_indicator_style() {
    // Updates style of the indicator
    if (!settings.get_boolean("paused")) {
        indicator.set_style("color: " + settings.get_string("indicator-color") + ";");
    } else {
        indicator.set_style("color: " + settings.get_string("indicator-paused-color") + ";");
    }
}

function on_preferences() {
    // Show GNOME Shell preferences
    Util.spawn(["gnome-shell-extension-prefs", "time_tracker_jsnjack@gmail.com"]);
    return 0;
}

function on_reset() {
    start_time = new Date();
    settings.set_string('start-time', start_time.toString());
    settings.set_int('pause-duration', 0);
    settings.set_boolean('paused', false);
    update_indicator_style();
}

function on_toggle() {
    // Handle pause button
    var state = settings.get_boolean("paused"),
        current_time, pause_start_time;
    if (!state) {
        // Pause timer
        current_time = new Date();
        settings.set_string('pause-start-time', current_time.toString());
        settings.set_boolean("paused", true);
    } else {
        // Resume timer
        current_time = new Date();
        pause_start_time = new Date(settings.get_string('pause-start-time'));
        settings.set_int('pause-duration', settings.get_int('pause-duration') + (current_time - pause_start_time));
        settings.set_boolean("paused", false);
    }
    update_indicator_style();
}

export default class TimeTracker extends Extension{
    enable() {
        preferences_button_name = _("Preferences");
          restart_button_name = _("Restart");
          toggle_button_name = _("Pause/Resume");

        indicator = new St.Button({
            style_class : 'panel-button',
        });
        settings = this.getSettings();
        update_indicator_style();
        // Get start_time from settings
        start_time_string = settings.get_string('start-time');
        start_time = new Date(start_time_string);
        // If creation of Date object failed, create a new one
        if (isNaN(start_time.getHours())) {
            start_time = new Date();
            settings.set_string('start-time', start_time.toString());
        }
        indicator.set_label('Time Tracker');
        timeout = Mainloop.timeout_add(1000, function () {
            _refresh();
            return true;
        });
        indicator.connect('button-press-event', _restart);

        Main.panel._rightBox.insert_child_at_index(indicator, 0);

        var paused_by_screen_lock = settings.get_boolean('paused-by-screen-lock');
        var paused = settings.get_boolean("paused");
        if (paused_by_screen_lock && paused) {
            on_toggle();
        }
        settings.set_boolean('paused-by-screen-lock', false);
    }

    disable() {
        var pause_during_screen_lock = settings.get_boolean('pause-during-screen-lock');
        var paused = settings.get_boolean("paused");
        if (pause_during_screen_lock && !paused) {
            on_toggle();
            settings.set_boolean('paused-by-screen-lock', true);
        }

        indicator.destroy();
        Mainloop.source_remove(timeout);
    }
}

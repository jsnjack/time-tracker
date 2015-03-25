/* jshint unused: false */
/* exported init, enable, disable*/
/* jshint ignore:start */
const Clutter = imports.gi.Clutter;
const ExtensionUtils = imports.misc.extensionUtils;
const Lang = imports.lang;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const MessageTray = imports.ui.messageTray;
const St = imports.gi.St;
const Tweener = imports.ui.tweener;
const ShellConfig = imports.misc.config;
const Util = imports.misc.util;

const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const Gettext = imports.gettext.domain('time-tracker');
const _ = Gettext.gettext
/* jshint ignore:end */

var start_time, button, start_time_string, settings, timeout;

var shell_version = ShellConfig.PACKAGE_VERSION.split(".");


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
    button.set_label(timer);
}


function _restart() {
    // Restart timer. Set new value for start_time
    var source = new MessageTray.SystemNotificationSource(),
        message_body, message_title, notification, restart_button, preferences_button,
        icon_preferences, icon_restart, preferences_button_name, restart_button_name,
        icon_pause, icon_play, toggle_button_name, toggle_button;

    preferences_button_name = _("Preferences");
    restart_button_name = _("Restart");
    toggle_button_name = _("Pause");

    Main.messageTray.add(source);
    message_title = _("Current start time:") + ' ' + start_time.toLocaleString();
    message_body = _("Confirm to restart timer");
    notification = new MessageTray.Notification(source, message_body, message_title);

    icon_preferences = new St.Icon({icon_name: 'preferences-system-symbolic', icon_size: 16});
    icon_restart = new St.Icon({icon_name: 'view-refresh-symbolic', icon_size: 16});
    icon_pause = new St.Icon({icon_name: 'media-playback-pause-symbolic', icon_size: 16});
    icon_play = new St.Icon({icon_name: 'media-playback-start-symbolic', icon_size: 16});
    if (shell_version[0] === "3" && shell_version[1] === "10") {
        notification.addButton('preferences', preferences_button_name);
        notification.addButton('toggle', toggle_button_name);
        notification.addButton('restart', restart_button_name);
        restart_button = get_button(notification, 'restart');
        restart_button.set_child(icon_restart);
        restart_button.add_style_class_name('system-menu-action button-restart');
        restart_button.remove_style_class_name('notification-button');
        preferences_button = get_button(notification, 'preferences');
        preferences_button.set_child(icon_preferences);
        preferences_button.add_style_class_name('system-menu-action');
        preferences_button.remove_style_class_name('notification-button');
        toggle_button = get_button(notification, 'toggle');
        if (settings.get_boolean("paused")) {
            toggle_button.set_child(icon_play);
        } else {
            toggle_button.set_child(icon_pause);
        }
        toggle_button.add_style_class_name('system-menu-action');
        toggle_button.remove_style_class_name('notification-button');

        notification.connect('action-invoked', function (action, action_id) {
            if (action_id === "restart") {
                on_reset();
            } else  if (action_id === "preferences") {
                on_preferences();
            }
        });
    } else {
        // For GNOME Shell 3.12 and newer
        restart_button = new St.Button({style_class: 'system-menu-action button-restart'});
        restart_button.set_label(restart_button_name);
        restart_button.set_child(icon_restart);

        preferences_button = new St.Button({style_class: 'system-menu-action'});
        preferences_button.set_label(preferences_button_name);
        preferences_button.set_child(icon_preferences);

        toggle_button = new St.Button({style_class: 'system-menu-action'});
        toggle_button.set_label(toggle_button_name);
        if (settings.get_boolean("paused")) {
            toggle_button.set_child(icon_play);
        } else {
            toggle_button.set_child(icon_pause);
        }

        notification.addButton(preferences_button, on_preferences);
        notification.addButton(toggle_button, on_toggle);
        notification.addButton(restart_button, on_reset);
    }
    notification.setTransient(true);
    source.notify(notification);
}


function get_button(parent, action_id) {
    // Get button by action id
    var button;
    button = parent._buttonBox.get_children().filter(function (b) {
                return b._actionId === action_id;
            })[0];
    return button;
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
        button.add_style_class_name("button-paused-style");
        button.remove_style_class_name("button-style");
    } else {
        // Resume timer
        current_time = new Date();
        pause_start_time = new Date(settings.get_string('pause-start-time'));
        settings.set_int('pause-duration', settings.get_int('pause-duration') + (current_time - pause_start_time));
        settings.set_boolean("paused", false);
        button.add_style_class_name("button-style");
        button.remove_style_class_name("button-paused-style");
    }
}


function init() {
    Convenience.initTranslations("time-tracker");
}


function enable() {
    button = new St.Button();
    settings = Convenience.getSettings();
    if (settings.get_boolean("paused")) {
        button.add_style_class_name("button-paused-style");
    } else {
        button.add_style_class_name("button-style");
    }
    // Get start_time from settings
    start_time_string = settings.get_string('start-time');
    start_time = new Date(start_time_string);
    // If creation of Date object failed, create a new one
    if (isNaN(start_time.getHours())) {
        start_time = new Date();
        settings.set_string('start-time', start_time.toString());
    }
    button.set_label('Time Tracker');
    timeout = Mainloop.timeout_add(1000, function () {
        _refresh();
        return true;
    });
    button.connect('button-press-event', _restart);

    Main.panel._rightBox.insert_child_at_index(button, 0);
}


function disable() {
    button.destroy();
    Mainloop.source_remove(timeout);
}

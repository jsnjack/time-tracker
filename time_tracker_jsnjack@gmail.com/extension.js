/*globals imports */
/*jslint nomen: true */

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
const _ = Gettext.gettext;

var start_time, button, start_time_string, settings, timeout;

var shell_version = ShellConfig.PACKAGE_VERSION.split(".");


function _refresh() {
    // Get difference between start time and current time
    // and show it
    var current_time = new Date(),
        difference, hours, mins, secs, timer;
    // Get difference between two times in secs
    difference = Math.round((current_time - start_time) / 1000);
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
        message_body, message_title, notification, restart_button;
    Main.messageTray.add(source);
    message_title = _("Current start time:") + ' ' + start_time.toLocaleString();
    message_body = _("Confirm to restart timer");
    notification = new MessageTray.Notification(source, message_body, message_title);
    if (shell_version[0] === "3" && shell_version[1] === "10") {
        notification.addButton('modify', _("Modify"));
        notification.addButton('restart', _("Restart"));
        notification.connect('action-invoked', function (action, action_id) {
            if (action_id === "restart") {
                on_reset();
            } else  if (action_id === "modify") {
                on_modify();
            }
        });
    } else {
        // For GNOME Shell 3.12 and newer
        restart_button = new St.Button({style_class: 'modal-dialog-button'});
        restart_button.set_label(_("Restart"));
        notification.addButton(restart_button, on_reset);
    }
    notification.setTransient(true);
    source.notify(notification);
}


function on_modify() {
    // Show GNOME Shell preferences
    Util.spawn(["gnome-shell-extension-prefs", "time_tracker_jsnjack@gmail.com"]);
    return 0;
}

function on_reset() {
    start_time = new Date();
    settings.set_string('start-time', start_time.toString());
}


function init() {
    Convenience.initTranslations("time-tracker");
}


function enable() {
    button = new St.Button({style_class: 'button-style'});
    settings = Convenience.getSettings();
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


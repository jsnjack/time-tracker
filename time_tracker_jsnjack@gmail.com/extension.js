/* jshint moz:true, unused: false */
/* exported init, enable, disable */
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import St from 'gi://St';
import GObject from 'gi://GObject';
import {
  Extension,
  gettext as _,
} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

let start_time, start_time_string;

const TimeTracker = GObject.registerClass(
  class TimeTracker extends PanelMenu.Button {
    _init (extention) {
      super._init(0.5, 'Time tracker', false);
      this._extention = extention;
      this._settings = this._extention.getSettings();
      this.set_style_class_name('panel-button');

      this._label = new St.Label({
        text: 'Loading...',
        can_focus: true,
        x_align: Clutter.ActorAlign.CENTER,
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,

      });
      this.actor.add_actor(this._label);

      // Get start_time from settings
      start_time_string = this._settings.get_string('start-time');
      start_time = new Date(start_time_string);
      // If creation of Date object failed, create a new one
      if (isNaN(start_time.getHours())) {
        start_time = new Date();
        this._settings.set_string('start-time', start_time.toString());
      }
      this._timeout = GLib.timeout_add(1000, GLib.PRIORITY_LOW, () => {
        this.refresh();
        return true;
      });

      const paused_by_screen_lock = this._settings.get_boolean(
        'paused-by-screen-lock');
      const paused = this._settings.get_boolean('paused');
      if (paused_by_screen_lock && paused) {
        this.onToggle();
      }
      this._settings.set_boolean('paused-by-screen-lock', false);

      this._pauseMenu = this.menu.addAction(_('Resume'),
        this.onToggle.bind(this),
        'media-playback-start-symbolic'
      );
      this.menu.addAction(_('Restart'),
        this.onReset.bind(this),
        'view-refresh-symbolic'
      );
      this.menu.addAction(_('Preferences'),
        (() => this._extention.openPreferences()),
        'org.gnome.Settings-symbolic',
      );

      this.updateIndicatorStyle();
    }

    updateIndicatorStyle () {
      if (!this._settings.get_boolean('paused')) {
        this._label.set_style(
          'color: ' + this._settings.get_string('indicator-color') + ';');
        this._pauseMenu?.set_style(
          'color: ' + this._settings.get_string('indicator-paused-color') +
          ';');
        this._pauseMenu?.label.set_text(_('Pause'));
        this._pauseMenu?.setIcon('media-playback-pause-symbolic');
      } else {
        this._label.set_style(
          'color: ' + this._settings.get_string('indicator-paused-color') +
          ';');
        this._pauseMenu?.set_style(
          'color: ' + this._settings.get_string('indicator-color') + ';');
        this._pauseMenu?.label.set_text(_('Resume'));
        this._pauseMenu?.setIcon('media-playback-start-symbolic');
      }
    }

    refresh () {
      // Get difference between start time and current time
      // and show it
      let current_time = new Date(),
        difference, timer;
      // Check if start_time needs update:
      if (this._settings.get_boolean('update-start-time')) {
        start_time_string = this._settings.get_string('start-time');
        start_time = new Date(start_time_string);
        this._settings.set_boolean('update-start-time', false);
      }
      // Check if indicator style needs update:
      if (this._settings.get_boolean('update-indicator-style')) {
        this.updateIndicatorStyle();
        this._settings.set_boolean('update-indicator-style', false);
      }
      // If in pause, than show the difference between start_time and pause-start-time
      if (this._settings.get_boolean('paused')) {
        current_time = new Date(this._settings.get_string('pause-start-time'));
      }
      // Get difference between two times in secs
      difference = Math.round(
        (current_time - start_time - this._settings.get_int('pause-duration')) /
        1000);
      const hours = parseInt(difference / 3600, 10);
      if (hours !== 0) {
        difference = difference - hours * 3600;
      }
      const mins = parseInt(difference / 60, 10);
      if (mins !== 0) {
        difference = difference - mins * 60;
      }
      const secs = difference;
      // Prepare timer info
      if (this._settings.get_boolean('show-seconds') === true) {
        timer = '%d:%02d:%02d'.format(hours, mins, secs);
      } else {
        timer = '%d:%02d'.format(hours, mins);
      }
      this._label.set_text(timer);
    }

    onToggle () {
      // Handle pause button
      let state = this._settings.get_boolean('paused'),
        current_time, pause_start_time;
      if (!state) {
        // Pause timer
        current_time = new Date();
        this._settings.set_string('pause-start-time', current_time.toString());
        this._settings.set_boolean('paused', true);
      } else {
        // Resume timer
        current_time = new Date();
        pause_start_time = new Date(
          this._settings.get_string('pause-start-time'));
        this._settings.set_int('pause-duration',
          this._settings.get_int('pause-duration') +
          (current_time - pause_start_time));
        this._settings.set_boolean('paused', false);
      }
      this.updateIndicatorStyle();
    }

    onReset () {
      start_time = new Date();
      this._settings.set_string('start-time', start_time.toString());
      this._settings.set_int('pause-duration', 0);
      this._settings.set_boolean('paused', false);
      this.updateIndicatorStyle();
    }

    onDestroy () {
      const pause_during_screen_lock = this._settings.get_boolean(
        'pause-during-screen-lock');
      const paused = this._settings.get_boolean('paused');
      if (pause_during_screen_lock && !paused) {
        this.onToggle();
        this._settings.set_boolean('paused-by-screen-lock', true);
      }
      GLib.Source.remove(this._timeout);
      this?.destroy();
    }
  });

export default class TimeTrackerExtension extends Extension {
  enable () {
    this._indicator = new TimeTracker(this);

    // Add the indicator to the panel
    Main.panel.addToStatusArea(this.uuid, this._indicator, 0);
    // Main.panel._rightBox.insert_child_at_index(this._indicator, 0);
  }

  disable () {
    this._indicator.onDestroy();
    this._indicator = null;
  }
}

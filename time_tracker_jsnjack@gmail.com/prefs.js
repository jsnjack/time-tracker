/* jshint moz:true, unused: false */
/* exported init, buildPrefsWidget */
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import Adw from 'gi://Adw';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import {
  ExtensionPreferences,
  gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

// Page Adjust time
const AdjustTimePage = GObject.registerClass(
  class TimeTrackerAdjustTimePrefPage extends Adw.PreferencesPage {
    _init (settings, settingsKey) {
      super._init({
        title: _('Adjust time'),
        icon_name: 'org.gnome.Settings-time-symbolic',
        name: 'TimeTrackerAdjustTimePrefPage',
      });
      this.settings = settings;
      this.initialPause = settings.get_int('pause-duration');
      this.initialStartTime = settings.get_uint('state-start-time');

      this.groupAdjustStartTime = new Adw.PreferencesGroup({
        title: _('Adjust start time'),
        description: _('Start time: ') +
          (new Date(this.initialStartTime * 1000)).toLocaleString(),
      });

      this.spinHoursStart = new Adw.SpinRow({
        title: _('Hours'),
        adjustment: new Gtk.Adjustment({
          value: 0,
          lower: -999,
          upper: 999,
          step_increment: 1,
        }),
        value: 0,
      });

      this.spinMinStart = new Adw.SpinRow({
        title: _('Minutes'),
        adjustment: new Gtk.Adjustment({
          value: 0,
          lower: -60,
          upper: 60,
          step_increment: 1,
        }),
        value: 0,
      });

      this.spinHoursStart.connect('output', this._adjustStartTime.bind(this));
      this.spinMinStart.connect('output', this._adjustStartTime.bind(this));

      this.groupAdjustStartTime.add(this.spinHoursStart);
      this.groupAdjustStartTime.add(this.spinMinStart);

      const groupAdjustPauseTime = new Adw.PreferencesGroup({
        title: _('Adjust pause duration'),
      });

      const pauseDuration = settings.get_int('pause-duration');
      this.spinHoursPause = new Adw.SpinRow({
        title: _('Hours'),
        adjustment: new Gtk.Adjustment({
          value: Math.floor(pauseDuration / 3600),
          lower: -999,
          upper: 999,
          step_increment: 1,
        }),
        value: 0,
      });

      this.spinMinPause = new Adw.SpinRow({
        title: _('Minutes'),
        adjustment: new Gtk.Adjustment({
          value: Math.floor((pauseDuration % 3600) / 60),
          lower: -60,
          upper: 60,
          step_increment: 1,
        }),
        value: 0,
      });

      this.spinHoursPause.connect('output', this._adjustPause.bind(this));
      this.spinMinPause.connect('output', this._adjustPause.bind(this));

      groupAdjustPauseTime.add(this.spinHoursPause);
      groupAdjustPauseTime.add(this.spinMinPause);

      this.add(this.groupAdjustStartTime);
      this.add(groupAdjustPauseTime);
    }

    _adjustStartTime () {
      const hours = this.spinHoursStart.get_value();
      const mins = this.spinMinStart.get_value();
      // Replace old start-time date with the new one
      const change = hours * 60 * 60 + mins * 60;
      this.settings.set_uint('state-start-time',
        this.initialStartTime + change);
      // Mark time for update
      this.settings.set_boolean('update-start-time', true);

      this.groupAdjustStartTime.description = _('Start time: ') +
        (new Date((this.initialStartTime + change) * 1000)).toLocaleString();
    }

    _adjustPause () {
      const hours = this.spinHoursPause.get_value();
      const mins = this.spinMinPause.get_value();

      // Update pause-duration
      const change = hours * 60 * 60 + mins * 60;
      this.settings.set_int('pause-duration', this.initialPause + change);
      // Mark time for update
      this.settings.set_boolean('update-start-time', true);
    }
  },
);

// Page Appearance
const AppearancePage = GObject.registerClass(
  class TimeTrackerAppearancePrefPage extends Adw.PreferencesPage {
    _init (settings, settingsKey) {
      super._init({
        title: _('Appearance'),
        icon_name: 'preferences-desktop-appearance-symbolic',
        name: 'TimeTrackerAppearancePrefPage',
      });
      this.settings = settings;

      const groupDisplay = new Adw.PreferencesGroup({
        title: _('Display'),
      });

      const switchShowSeconds = new Adw.SwitchRow({
        title: _('Show seconds'),
        active: this.settings.get_boolean('show-seconds'),
      });

      switchShowSeconds.connect('notify::active', (state) => {
        this.settings.set_boolean('show-seconds', state.active);
      });

      groupDisplay.add(switchShowSeconds);

      const groupColors = new Adw.PreferencesGroup({
        title: _('Colours'),
      });

      const normalColor = new Gdk.RGBA();
      normalColor.parse(this.settings.get_string('indicator-color'));
      const colorButtonNormal = new Gtk.ColorDialogButton({
        rgba: normalColor,
        halign: 3,
        valign: 3,
        dialog: new Gtk.ColorDialog(),
      });
      const actionRowNormalColor = new Adw.ActionRow({
        title: _('Normal state'),
      });

      colorButtonNormal.connect('notify::rgba', () => {
        this._saveColorChange(colorButtonNormal.get_rgba(), 'indicator-color');
      });

      actionRowNormalColor.add_suffix(colorButtonNormal);
      groupColors.add(actionRowNormalColor);

      const pausedColor = new Gdk.RGBA();
      pausedColor.parse(this.settings.get_string('indicator-paused-color'));
      const colorButtonPaused = new Gtk.ColorDialogButton({
        rgba: pausedColor,
        halign: 3,
        valign: 3,
        dialog: new Gtk.ColorDialog(),
      });
      const actionRowPausedColor = new Adw.ActionRow({
        title: _('Paused state'),
      });

      colorButtonPaused.connect('notify::rgba', () => {
        this._saveColorChange(colorButtonPaused.get_rgba(),
          'indicator-paused-color');
      });

      actionRowPausedColor.add_suffix(colorButtonPaused);

      groupColors.add(actionRowPausedColor);

      this.add(groupDisplay);
      this.add(groupColors);
    }

    _saveColorChange (color, key) {
      // Saves changes to the settings
      this.settings.set_string(key, color.to_string());
      this.settings.set_boolean('update-indicator-style', true);
    }
  },
);

// Page Behavior
const BehaviorPage = GObject.registerClass(
  class TimeTrackerBehaviorPrefPage extends Adw.PreferencesPage {
    _init (settings, settingsKey) {
      super._init({
        title: _('Behavior'),
        icon_name: 'org.gnome.Settings-symbolic',
        name: 'TimeTrackerBehaviorPrefPage',
      });
      this.settings = settings;

      const groupOnLock = new Adw.PreferencesGroup();

      const switchPauseOnLock = new Adw.SwitchRow({
        title: _('Pause while screen locked'),
        active: this.settings.get_boolean('pause-during-screen-lock'),
      });

      switchPauseOnLock.connect('notify::active', (state) => {
        this.settings.set_boolean('pause-during-screen-lock', state.active);
      });

      groupOnLock.add(switchPauseOnLock);

      this.add(groupOnLock);

      const groupLogging = new Adw.PreferencesGroup();

      const switchLogging = new Adw.SwitchRow({
        title: _('Log changes of time tracker state'),
        subtitle: 'Log file is ~/timeTrack.log',
      });

      this.settings.bind('pref-log-change-state', switchLogging, 'active',
        Gio.SettingsBindFlags.DEFAULT);

      groupLogging.add(switchLogging);

      this.add(groupLogging);

      const groupStartOnReset = new Adw.PreferencesGroup();
      const switchStartOnReset = new Adw.SwitchRow({
        title: _('Start tracker when restart timer'),
      });

      this.settings.bind('pref-start-on-reset', switchStartOnReset, 'active',
        Gio.SettingsBindFlags.DEFAULT);

      groupStartOnReset.add(switchStartOnReset);
      this.add(groupStartOnReset);
    }
  },
);

export default class TimeTrackerPreferences extends ExtensionPreferences {
  fillPreferencesWindow (window) {
    const settings = this.getSettings();

    const pageAdjustTime = new AdjustTimePage(settings);
    const pageAppearance = new AppearancePage(settings);
    const pageBehavior = new BehaviorPage(settings);

    window.add(pageAdjustTime);
    window.add(pageAppearance);
    window.add(pageBehavior);
  }
}

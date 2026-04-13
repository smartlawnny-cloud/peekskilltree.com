/**
 * Ground Control — Settings Page
 */
var SettingsPage = {
  render: function() {
    var s = DB.settings.get();
    var checkins = DB.checkins.getAll();

    var html = '<div class="settings-page">';
    html += '<h1>Settings</h1>';

    // Profile
    html += '<div class="settings-section">';
    html += '<h3>Profile</h3>';
    html += '<div class="field-group">';
    html += '<label>Your name</label>';
    html += '<input type="text" id="set-name" class="gc-input" value="' + UI.esc(s.name) + '" placeholder="What should I call you?">';
    html += '</div>';
    html += '</div>';

    // Appearance
    html += '<div class="settings-section">';
    html += '<h3>Appearance</h3>';
    html += '<div class="field-group">';
    html += '<label>Theme</label>';
    html += '<select id="set-theme" class="gc-input">';
    html += '<option value="auto"' + (s.theme === 'auto' ? ' selected' : '') + '>Auto (dark before 7am)</option>';
    html += '<option value="light"' + (s.theme === 'light' ? ' selected' : '') + '>Light</option>';
    html += '<option value="dark"' + (s.theme === 'dark' ? ' selected' : '') + '>Dark</option>';
    html += '</select>';
    html += '</div>';
    html += '</div>';

    // Movement
    html += '<div class="settings-section">';
    html += '<h3>Movement</h3>';
    html += '<div class="field-group">';
    html += '<label>Daily goal (minutes)</label>';
    html += '<input type="number" id="set-movement" class="gc-input" value="' + (s.movementGoal || 5) + '" min="1" max="60">';
    html += '</div>';
    html += '</div>';

    // Data
    html += '<div class="settings-section">';
    html += '<h3>Your Data</h3>';
    html += '<p class="settings-note">' + checkins.length + ' days tracked. All data stored on this device.</p>';
    html += '<div class="settings-actions">';
    html += '<button class="gc-btn gc-btn-outline" onclick="SettingsPage._export()">Export Data</button>';
    html += '<button class="gc-btn gc-btn-danger" onclick="SettingsPage._confirmClear()">Clear All Data</button>';
    html += '</div>';
    html += '</div>';

    // About
    html += '<div class="settings-section">';
    html += '<h3>About</h3>';
    html += '<p class="settings-note">' + GC_CONFIG.appName + ' v' + GC_CONFIG.version + '</p>';
    html += '<p class="settings-note">' + GC_CONFIG.tagline + '</p>';
    html += '</div>';

    html += '<button class="gc-btn gc-btn-primary" onclick="SettingsPage._save()" style="margin-top:16px">Save Settings</button>';

    html += '</div>';
    return html;
  },

  _save: function() {
    var name = document.getElementById('set-name').value.trim();
    var theme = document.getElementById('set-theme').value;
    var movement = parseInt(document.getElementById('set-movement').value) || 5;

    DB.settings.save({ name: name, theme: theme, movementGoal: movement });
    applyTheme(theme);
    UI.toast('Settings saved', 'success');
  },

  _export: function() {
    var data = {
      settings: DB.settings.get(),
      checkins: DB.checkins.getAll(),
      exported_at: new Date().toISOString(),
      app: GC_CONFIG.appName,
      version: GC_CONFIG.version
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ground-control-export-' + DB.today() + '.json';
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('Data exported', 'success');
  },

  _confirmClear: function() {
    UI.showModal('Clear All Data',
      '<p>This will delete all your check-ins, journal entries, and settings. This cannot be undone.</p>' +
      '<p><strong>Are you sure?</strong></p>',
      { footer: '<button class="gc-btn gc-btn-danger" onclick="SettingsPage._clearAll()">Yes, clear everything</button> <button class="gc-btn gc-btn-outline" onclick="UI.closeModal()">Cancel</button>' }
    );
  },

  _clearAll: function() {
    localStorage.removeItem('gc-checkins');
    localStorage.removeItem('gc-settings');
    localStorage.removeItem('gc-session');
    UI.closeModal();
    UI.toast('All data cleared', 'info');
    loadPage('settings');
  }
};

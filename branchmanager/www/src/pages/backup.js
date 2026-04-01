/**
 * Branch Manager — Data Backup & Restore
 * Export all data as JSON, restore from backup
 */
var BackupPage = {
  render: function() {
    var html = '<div class="section-header"><h2>Backup & Restore</h2>'
      + '<p style="color:var(--text-light);margin-top:4px;">Download a full backup of all your data, or restore from a previous backup.</p></div>';

    // Data summary
    var clients = DB.clients.getAll().length;
    var quotes = DB.quotes.getAll().length;
    var jobs = DB.jobs.getAll().length;
    var invoices = DB.invoices.getAll().length;
    var requests = DB.requests.getAll().length;

    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="font-size:15px;margin-bottom:12px;">Current Data</h3>'
      + '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;text-align:center;margin-bottom:16px;">'
      + '<div style="padding:12px;background:var(--bg);border-radius:8px;"><div style="font-size:20px;font-weight:800;">' + clients + '</div><div style="font-size:11px;color:var(--text-light);">Clients</div></div>'
      + '<div style="padding:12px;background:var(--bg);border-radius:8px;"><div style="font-size:20px;font-weight:800;">' + quotes + '</div><div style="font-size:11px;color:var(--text-light);">Quotes</div></div>'
      + '<div style="padding:12px;background:var(--bg);border-radius:8px;"><div style="font-size:20px;font-weight:800;">' + jobs + '</div><div style="font-size:11px;color:var(--text-light);">Jobs</div></div>'
      + '<div style="padding:12px;background:var(--bg);border-radius:8px;"><div style="font-size:20px;font-weight:800;">' + invoices + '</div><div style="font-size:11px;color:var(--text-light);">Invoices</div></div>'
      + '<div style="padding:12px;background:var(--bg);border-radius:8px;"><div style="font-size:20px;font-weight:800;">' + requests + '</div><div style="font-size:11px;color:var(--text-light);">Requests</div></div>'
      + '</div>'
      + '<div style="display:flex;gap:8px;">'
      + '<button onclick="BackupPage.downloadBackup()" style="background:var(--green-dark);color:#fff;border:none;padding:12px 24px;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;">📥 Download Full Backup</button>'
      + '<button onclick="CloudSync.refresh()" style="background:#1565c0;color:#fff;border:none;padding:12px 24px;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;">☁️ Sync from Cloud</button>'
      + '</div>'
      + '<p style="font-size:12px;color:var(--text-light);margin-top:8px;">Backup includes all clients, quotes, jobs, invoices, requests, expenses, settings, and communication logs.</p>'
      + '</div>';

    // Restore
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="font-size:15px;margin-bottom:8px;">Restore from Backup</h3>'
      + '<p style="font-size:13px;color:var(--text-light);margin-bottom:12px;">Upload a previously downloaded backup file to restore all data.</p>'
      + '<label style="display:inline-block;background:#fff3e0;border:2px dashed #ffe0b2;border-radius:8px;padding:16px 24px;cursor:pointer;font-size:14px;font-weight:600;color:#e65100;">'
      + '📤 Choose Backup File<input type="file" accept=".json" onchange="BackupPage.restore(event)" style="display:none;">'
      + '</label>'
      + '<p style="font-size:11px;color:var(--red);margin-top:8px;">⚠️ Restoring will replace all current data. Make sure you have a current backup first.</p>'
      + '</div>';

    // Auto-backup settings
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);">'
      + '<h3 style="font-size:15px;margin-bottom:8px;">Backup Info</h3>'
      + '<div style="font-size:13px;color:var(--text-light);line-height:1.8;">'
      + '<div>☁️ <strong>Cloud (Supabase):</strong> ' + (SupabaseDB && SupabaseDB.ready ? '<span style="color:var(--green-dark);">Connected — data syncs automatically</span>' : '<span style="color:var(--red);">Not connected</span>') + '</div>'
      + '<div>💾 <strong>Local Storage:</strong> ' + BackupPage._getLocalSize() + ' used</div>'
      + '<div>📅 <strong>Last cloud sync:</strong> ' + (CloudSync.lastSync > 0 ? UI.dateRelative(new Date(CloudSync.lastSync).toISOString()) : 'Never') + '</div>'
      + '</div></div>';

    return html;
  },

  downloadBackup: function() {
    var backup = {
      version: '1.0',
      app: 'Branch Manager',
      date: new Date().toISOString(),
      data: {}
    };

    // Collect all localStorage data
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.startsWith('bm-')) {
        try {
          backup.data[key] = JSON.parse(localStorage.getItem(key));
        } catch(e) {
          backup.data[key] = localStorage.getItem(key);
        }
      }
    }

    var json = JSON.stringify(backup, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'branch-manager-backup-' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    UI.toast('Backup downloaded!');
  },

  restore: function(event) {
    var file = event.target.files[0];
    if (!file) return;

    if (!confirm('This will replace ALL current data with the backup. Are you sure?')) return;

    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var backup = JSON.parse(e.target.result);
        if (!backup.data || !backup.version) {
          UI.toast('Invalid backup file', 'error');
          return;
        }

        // Clear existing bm- keys
        var keysToRemove = [];
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (key && key.startsWith('bm-')) keysToRemove.push(key);
        }
        keysToRemove.forEach(function(k) { localStorage.removeItem(k); });

        // Restore
        Object.keys(backup.data).forEach(function(key) {
          var val = backup.data[key];
          localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
        });

        UI.toast('Data restored from ' + backup.date.split('T')[0] + '!');
        setTimeout(function() { window.location.reload(); }, 1000);
      } catch(e) {
        UI.toast('Failed to parse backup file', 'error');
      }
    };
    reader.readAsText(file);
  },

  _getLocalSize: function() {
    var total = 0;
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.startsWith('bm-')) {
        total += (localStorage.getItem(key) || '').length;
      }
    }
    if (total > 1048576) return (total / 1048576).toFixed(1) + ' MB';
    if (total > 1024) return Math.round(total / 1024) + ' KB';
    return total + ' bytes';
  }
};

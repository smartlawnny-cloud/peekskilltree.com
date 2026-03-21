/**
 * Branch Manager — Settings Page
 * Company info, Supabase config, Jobber CSV import, data management
 */
var SettingsPage = {
  render: function() {
    var stats = DB.dashboard.getStats();

    var html = '<div style="max-width:700px;">';

    // Company Info
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="margin-bottom:16px;">Company Info</h3>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;">'
      + '<div><strong>Company:</strong> Second Nature Tree Service</div>'
      + '<div><strong>Phone:</strong> (914) 391-5233</div>'
      + '<div><strong>Email:</strong> info@peekskilltree.com</div>'
      + '<div><strong>Address:</strong> 1 Highland Industrial Park, Peekskill, NY 10566</div>'
      + '<div><strong>Licenses:</strong> WC-32079, PC-50644</div>'
      + '<div><strong>Website:</strong> peekskilltree.com</div>'
      + '</div></div>';

    // Data Summary
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="margin-bottom:16px;">Data Summary</h3>'
      + '<div class="stat-grid" style="margin-bottom:0;">'
      + '<div class="stat-card"><div class="stat-label">Clients</div><div class="stat-value">' + stats.totalClients + '</div></div>'
      + '<div class="stat-card"><div class="stat-label">Jobs</div><div class="stat-value">' + DB.jobs.count() + '</div></div>'
      + '<div class="stat-card"><div class="stat-label">Invoices</div><div class="stat-value">' + DB.invoices.count() + '</div></div>'
      + '<div class="stat-card"><div class="stat-label">Quotes</div><div class="stat-value">' + DB.quotes.count() + '</div></div>'
      + '</div></div>';

    // Stripe Payments
    html += Stripe.renderSettings();

    // SendJim Direct Mail
    html += SendJim.renderSettings();

    // Supabase Connection
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="margin-bottom:8px;">Database Connection</h3>'
      + '<p style="font-size:13px;color:var(--text-light);margin-bottom:16px;">Connect to Supabase for cloud sync, multi-device access, and team features. Currently using local storage.</p>'
      + '<div style="display:inline-block;padding:6px 12px;background:#fff3e0;border-radius:8px;font-size:13px;font-weight:600;color:#e65100;margin-bottom:12px;">⚠ Local Storage Mode — data lives on this device only</div>'
      + UI.formField('Supabase URL', 'text', 'sb-url', '', { placeholder: 'https://your-project.supabase.co' })
      + UI.formField('Supabase Anon Key', 'text', 'sb-key', '', { placeholder: 'eyJhbGciOiJIUzI1NiIs...' })
      + '<button class="btn btn-primary" onclick="SettingsPage.connectSupabase()">Connect to Supabase</button>'
      + '</div>';

    // Import from Jobber
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="margin-bottom:8px;">Import from Jobber</h3>'
      + '<p style="font-size:13px;color:var(--text-light);margin-bottom:16px;">Export CSVs from Jobber (Clients → More Actions → Export) and import them here.</p>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      + '<div>'
      + '<label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;">Clients CSV</label>'
      + '<input type="file" id="import-clients" accept=".csv" onchange="SettingsPage.importFile(\'clients\', this)">'
      + '</div>'
      + '<div>'
      + '<label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;">Jobs CSV</label>'
      + '<input type="file" id="import-jobs" accept=".csv" onchange="SettingsPage.importFile(\'jobs\', this)">'
      + '</div>'
      + '<div>'
      + '<label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;">Invoices CSV</label>'
      + '<input type="file" id="import-invoices" accept=".csv" onchange="SettingsPage.importFile(\'invoices\', this)">'
      + '</div>'
      + '<div>'
      + '<label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;">Quotes CSV</label>'
      + '<input type="file" id="import-quotes" accept=".csv" onchange="SettingsPage.importFile(\'quotes\', this)">'
      + '</div>'
      + '</div>'
      + '<div id="import-status" style="margin-top:12px;font-size:13px;color:var(--green-dark);"></div>'
      + '</div>';

    // Danger Zone
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid #ffcdd2;margin-bottom:16px;">'
      + '<h3 style="color:var(--red);margin-bottom:8px;">Data Management</h3>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
      + '<button class="btn btn-outline" onclick="SettingsPage.resetDemo()">Reset to Demo Data</button>'
      + '<button class="btn" style="background:var(--red);color:#fff;" onclick="SettingsPage.clearAll()">Clear All Data</button>'
      + '</div></div>';

    html += '</div>';
    return html;
  },

  connectSupabase: function() {
    var url = document.getElementById('sb-url').value.trim();
    var key = document.getElementById('sb-key').value.trim();
    if (!url || !key) { UI.toast('Enter both Supabase URL and Key', 'error'); return; }
    // Save config
    localStorage.setItem('bm-supabase-url', url);
    localStorage.setItem('bm-supabase-key', key);
    UI.toast('Supabase config saved. Reload to connect.');
  },

  importFile: function(type, input) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
      var csv = e.target.result;
      var count = 0;
      var statusEl = document.getElementById('import-status');

      if (type === 'clients') {
        count = DB.importCSV(DB.KEYS.clients, csv, function(row) {
          return {
            name: (row['First name'] || row['Name'] || '') + (row['Last name'] ? ' ' + row['Last name'] : ''),
            company: row['Company name'] || row['Company'] || '',
            phone: row['Phone number'] || row['Phone'] || '',
            email: row['Email'] || row['Email address'] || '',
            address: [row['Street 1'] || row['Street'] || '', row['City'] || '', row['State'] || row['Province'] || '', row['Zip code'] || row['Postal code'] || ''].filter(Boolean).join(', '),
            status: (row['Status'] || 'active').toLowerCase(),
            tags: row['Tags'] ? row['Tags'].split(',').map(function(t){return t.trim();}) : []
          };
        });
      } else if (type === 'jobs') {
        count = DB.importCSV(DB.KEYS.jobs, csv, function(row) {
          return {
            clientName: row['Client name'] || row['Client'] || '',
            jobNumber: parseInt(row['Job number'] || row['#'] || 0),
            property: row['Property'] || row['Address'] || '',
            description: row['Title'] || row['Description'] || '',
            scheduledDate: row['Start date'] || row['Schedule'] || '',
            status: (row['Status'] || 'scheduled').toLowerCase(),
            total: parseFloat(row['Total'] || 0)
          };
        });
      } else if (type === 'invoices') {
        count = DB.importCSV(DB.KEYS.invoices, csv, function(row) {
          return {
            clientName: row['Client name'] || row['Client'] || '',
            invoiceNumber: parseInt(row['Invoice number'] || row['#'] || 0),
            subject: row['Subject'] || 'For Services Rendered',
            dueDate: row['Due date'] || '',
            status: (row['Status'] || 'draft').toLowerCase(),
            total: parseFloat(row['Total'] || 0),
            balance: parseFloat(row['Balance'] || row['Amount owing'] || 0)
          };
        });
      } else if (type === 'quotes') {
        count = DB.importCSV(DB.KEYS.quotes, csv, function(row) {
          return {
            clientName: row['Client name'] || row['Client'] || '',
            quoteNumber: parseInt(row['Quote number'] || row['#'] || 0),
            property: row['Property'] || row['Address'] || '',
            status: (row['Status'] || 'draft').toLowerCase(),
            total: parseFloat(row['Total'] || 0)
          };
        });
      }

      if (statusEl) statusEl.textContent = 'Imported ' + count + ' ' + type + ' from CSV.';
      UI.toast(count + ' ' + type + ' imported');
      loadPage('settings');
    };
    reader.readAsText(file);
  },

  resetDemo: function() {
    UI.confirm('Reset all data to demo? This will erase current data.', function() {
      Object.values(DB.KEYS).forEach(function(k) { localStorage.removeItem(k); });
      DB.seedDemo();
      UI.toast('Demo data restored');
      loadPage('settings');
    });
  },

  clearAll: function() {
    UI.confirm('Delete ALL data? This cannot be undone.', function() {
      Object.values(DB.KEYS).forEach(function(k) { localStorage.removeItem(k); });
      UI.toast('All data cleared');
      loadPage('settings');
    });
  }
};

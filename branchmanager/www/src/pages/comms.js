/**
 * Branch Manager — Client Communication Log
 * Track all calls, texts, emails, and notes per client
 * Integrates with Dialpad API when connected
 */
var CommsLog = {
  // Render comms section for a client detail view
  renderForClient: function(clientId) {
    var comms = CommsLog.getAll(clientId);
    var html = '<div style="margin-top:20px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">'
      + '<h4 style="font-size:15px;">💬 Communication Log (' + comms.length + ')</h4>'
      + '<button onclick="CommsLog.showAddForm(\'' + clientId + '\')" style="background:var(--green-dark);color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">+ Log</button>'
      + '</div>';

    // Add form (hidden by default)
    html += '<div id="comms-add-form" style="display:none;background:var(--bg);border-radius:10px;padding:16px;margin-bottom:12px;border:1px solid var(--border);">'
      + '<div style="display:grid;grid-template-columns:auto 1fr;gap:8px;margin-bottom:8px;">'
      + '<select id="comms-type" style="padding:8px;border:2px solid var(--border);border-radius:6px;font-size:13px;">'
      + '<option value="call">📞 Call</option><option value="text">💬 Text</option><option value="email">📧 Email</option><option value="note">📌 Note</option><option value="visit">🏠 Site Visit</option><option value="voicemail">📱 Voicemail</option>'
      + '</select>'
      + '<select id="comms-direction" style="padding:8px;border:2px solid var(--border);border-radius:6px;font-size:13px;">'
      + '<option value="outbound">Outbound (you → them)</option><option value="inbound">Inbound (them → you)</option>'
      + '</select></div>'
      + '<textarea id="comms-notes" placeholder="What was discussed? Key details, follow-up needed..." rows="3" style="width:100%;padding:10px;border:2px solid var(--border);border-radius:8px;font-size:14px;resize:vertical;font-family:inherit;"></textarea>'
      + '<div style="display:flex;gap:8px;margin-top:8px;">'
      + '<button onclick="CommsLog.save(\'' + clientId + '\')" style="background:var(--green-dark);color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;">Save</button>'
      + '<button onclick="document.getElementById(\'comms-add-form\').style.display=\'none\'" style="background:var(--bg);color:var(--text);border:2px solid var(--border);padding:8px 16px;border-radius:6px;cursor:pointer;">Cancel</button>'
      + '</div></div>';

    // Communication timeline
    if (comms.length) {
      comms.forEach(function(c) {
        var icons = { call: '📞', text: '💬', email: '📧', note: '📌', visit: '🏠', voicemail: '📱' };
        var icon = icons[c.type] || '📋';
        var dirColor = c.direction === 'inbound' ? '#2980b9' : '#27ae60';
        var dirLabel = c.direction === 'inbound' ? '← In' : '→ Out';

        html += '<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #f0f0f0;">'
          + '<div style="flex-shrink:0;width:36px;height:36px;background:' + (c.type === 'note' ? '#fff3e0' : '#e8f5e9') + ';border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;">' + icon + '</div>'
          + '<div style="flex:1;min-width:0;">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;">'
          + '<span style="font-weight:600;font-size:13px;text-transform:capitalize;">' + c.type + ' <span style="font-size:11px;color:' + dirColor + ';font-weight:400;">' + dirLabel + '</span></span>'
          + '<span style="font-size:11px;color:var(--text-light);">' + UI.dateRelative(c.date) + '</span></div>'
          + '<div style="font-size:13px;color:var(--text-light);margin-top:3px;white-space:pre-wrap;">' + (c.notes || '') + '</div>'
          + '</div></div>';
      });
    } else {
      html += '<div style="text-align:center;padding:20px;color:var(--text-light);font-size:13px;">No communications logged yet.</div>';
    }
    html += '</div>';
    return html;
  },

  showAddForm: function(clientId) {
    var form = document.getElementById('comms-add-form');
    if (form) form.style.display = 'block';
  },

  save: function(clientId) {
    var type = document.getElementById('comms-type').value;
    var direction = document.getElementById('comms-direction').value;
    var notes = document.getElementById('comms-notes').value;
    if (!notes.trim()) { UI.toast('Add some notes', 'error'); return; }

    var entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      clientId: clientId,
      type: type,
      direction: direction,
      notes: notes,
      date: new Date().toISOString(),
      user: 'Doug' // Will use auth user later
    };

    var key = 'bm-comms-' + clientId;
    var all = [];
    try { all = JSON.parse(localStorage.getItem(key)) || []; } catch(e) {}
    all.unshift(entry);
    localStorage.setItem(key, JSON.stringify(all));

    document.getElementById('comms-add-form').style.display = 'none';
    document.getElementById('comms-notes').value = '';
    UI.toast('Communication logged');

    // Refresh client detail
    if (typeof ClientsPage !== 'undefined' && ClientsPage.showDetail) {
      ClientsPage.showDetail(clientId);
    }
  },

  getAll: function(clientId) {
    var key = 'bm-comms-' + clientId;
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch(e) { return []; }
  },

  // Get recent comms across all clients
  getRecent: function(limit) {
    limit = limit || 10;
    var all = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.startsWith('bm-comms-')) {
        try {
          var items = JSON.parse(localStorage.getItem(key)) || [];
          items.forEach(function(item) { all.push(item); });
        } catch(e) {}
      }
    }
    all.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    return all.slice(0, limit);
  }
};

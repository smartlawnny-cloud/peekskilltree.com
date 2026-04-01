/**
 * Branch Manager — Messaging Center
 * Send/view SMS and email conversations per client
 * Ready for Dialpad API when SMS is registered
 */
var MessagingPage = {
  render: function() {
    var clients = DB.clients.getAll().filter(function(c) { return c.phone; }).slice(0, 50);
    var selectedId = MessagingPage._selected || null;

    var html = '<div style="display:grid;grid-template-columns:280px 1fr;gap:0;height:calc(100vh - 140px);background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">';

    // Left: Contact list
    html += '<div style="border-right:1px solid var(--border);overflow-y:auto;">'
      + '<div style="padding:12px;border-bottom:1px solid var(--border);">'
      + '<input type="text" placeholder="Search contacts..." oninput="MessagingPage.filterContacts(this.value)" style="width:100%;padding:8px 12px;border:2px solid var(--border);border-radius:8px;font-size:13px;">'
      + '</div><div id="msg-contacts">';

    clients.forEach(function(c) {
      var isActive = c.id === selectedId;
      var lastComm = CommsLog ? CommsLog.getAll(c.id)[0] : null;
      var preview = lastComm ? lastComm.notes.substring(0, 40) + '...' : 'No messages';
      var time = lastComm ? UI.dateRelative(lastComm.date) : '';

      html += '<div onclick="MessagingPage.selectClient(\'' + c.id + '\')" style="padding:12px;border-bottom:1px solid #f0f0f0;cursor:pointer;background:' + (isActive ? 'var(--green-bg)' : 'var(--white)') + ';transition:background .1s;" onmouseover="this.style.background=\'' + (isActive ? 'var(--green-bg)' : '#fafafa') + '\'" onmouseout="this.style.background=\'' + (isActive ? 'var(--green-bg)' : 'var(--white)') + '\'">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;">'
        + '<strong style="font-size:13px;">' + c.name + '</strong>'
        + '<span style="font-size:10px;color:var(--text-light);">' + time + '</span></div>'
        + '<div style="font-size:12px;color:var(--text-light);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + preview + '</div>'
        + '</div>';
    });
    html += '</div></div>';

    // Right: Conversation
    html += '<div style="display:flex;flex-direction:column;">';
    if (selectedId) {
      var client = DB.clients.getById(selectedId);
      var comms = CommsLog ? CommsLog.getAll(selectedId) : [];

      // Header
      html += '<div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
        + '<div><strong style="font-size:15px;">' + (client ? client.name : '') + '</strong>'
        + '<div style="font-size:12px;color:var(--text-light);">' + (client ? client.phone || '' : '') + '</div></div>'
        + '<div style="display:flex;gap:6px;">'
        + '<a href="tel:' + (client ? (client.phone || '').replace(/\D/g, '') : '') + '" style="background:var(--green-bg);border:1px solid #c8e6c9;border-radius:6px;padding:6px 10px;font-size:12px;text-decoration:none;color:var(--green-dark);font-weight:600;">📞 Call</a>'
        + '<button onclick="MessagingPage.showTemplates(\'' + selectedId + '\')" style="background:#e3f2fd;border:1px solid #bbdefb;border-radius:6px;padding:6px 10px;font-size:12px;cursor:pointer;font-weight:600;color:#1565c0;">📋 Templates</button>'
        + '</div></div>';

      // Messages
      html += '<div id="msg-thread" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px;">';
      if (comms.length) {
        comms.slice().reverse().forEach(function(c) {
          var isOutbound = c.direction === 'outbound';
          var icons = { call: '📞', text: '💬', email: '📧', note: '📌', visit: '🏠', voicemail: '📱' };
          html += '<div style="display:flex;justify-content:' + (isOutbound ? 'flex-end' : 'flex-start') + ';">'
            + '<div style="max-width:75%;padding:10px 14px;border-radius:' + (isOutbound ? '16px 16px 4px 16px' : '16px 16px 16px 4px') + ';background:' + (isOutbound ? 'var(--green-dark)' : 'var(--bg)') + ';color:' + (isOutbound ? '#fff' : 'var(--text)') + ';font-size:14px;">'
            + '<div>' + (icons[c.type] || '') + ' ' + (c.notes || '') + '</div>'
            + '<div style="font-size:10px;opacity:.6;margin-top:4px;text-align:right;">' + UI.dateRelative(c.date) + ' · ' + c.type + '</div>'
            + '</div></div>';
        });
      } else {
        html += '<div style="text-align:center;padding:40px;color:var(--text-light);font-size:13px;">No messages yet. Send the first one below.</div>';
      }
      html += '</div>';

      // Compose
      html += '<div style="padding:12px;border-top:1px solid var(--border);display:flex;gap:8px;">'
        + '<select id="msg-type" style="padding:8px;border:2px solid var(--border);border-radius:8px;font-size:12px;">'
        + '<option value="text">💬 Text</option><option value="email">📧 Email</option><option value="call">📞 Call Note</option><option value="note">📌 Note</option></select>'
        + '<input type="text" id="msg-input" placeholder="Type a message..." style="flex:1;padding:10px;border:2px solid var(--border);border-radius:8px;font-size:14px;" onkeydown="if(event.key===\'Enter\')MessagingPage.send(\'' + selectedId + '\')">'
        + '<button onclick="MessagingPage.send(\'' + selectedId + '\')" style="background:var(--green-dark);color:#fff;border:none;padding:10px 16px;border-radius:8px;font-weight:700;cursor:pointer;">Send</button>'
        + '</div>';
    } else {
      html += '<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--text-light);">'
        + '<div style="text-align:center;"><div style="font-size:48px;margin-bottom:8px;">💬</div>'
        + '<h3 style="font-size:16px;color:var(--text);">Messages</h3>'
        + '<p style="font-size:13px;">Select a contact to view conversation</p></div></div>';
    }
    html += '</div></div>';

    return html;
  },

  _selected: null,

  selectClient: function(clientId) {
    MessagingPage._selected = clientId;
    loadPage('messaging');
    // Scroll to bottom of thread
    setTimeout(function() {
      var thread = document.getElementById('msg-thread');
      if (thread) thread.scrollTop = thread.scrollHeight;
    }, 100);
  },

  send: function(clientId) {
    var input = document.getElementById('msg-input');
    var typeEl = document.getElementById('msg-type');
    if (!input || !input.value.trim()) return;

    var type = typeEl ? typeEl.value : 'text';
    var notes = input.value.trim();

    // Save to comms log
    var key = 'bm-comms-' + clientId;
    var all = [];
    try { all = JSON.parse(localStorage.getItem(key)) || []; } catch(e) {}
    all.unshift({
      id: Date.now().toString(36),
      clientId: clientId,
      type: type,
      direction: 'outbound',
      notes: notes,
      date: new Date().toISOString(),
      user: 'Doug'
    });
    localStorage.setItem(key, JSON.stringify(all));

    input.value = '';
    UI.toast(type === 'text' ? 'Text queued (Dialpad SMS pending registration)' : type === 'email' ? 'Email logged' : 'Note saved');
    MessagingPage.selectClient(clientId);
  },

  showTemplates: function(clientId) {
    var client = DB.clients.getById(clientId);
    if (!client || !Templates) return;

    var html = '<div style="display:grid;gap:8px;">';
    var quickTemplates = ['request_received_sms', 'quote_sent_sms', 'booking_confirm_sms', 'visit_reminder_sms', 'review_request_sms'];
    quickTemplates.forEach(function(key) {
      var t = Templates.library[key];
      if (!t) return;
      var filled = Templates.fill(t.body, { name: client.name, address: client.address });
      html += '<div onclick="document.getElementById(\'msg-input\').value=\'' + filled.replace(/'/g, "\\'").replace(/\n/g, ' ') + '\';UI.closeModal();" style="padding:10px;background:var(--bg);border-radius:8px;cursor:pointer;font-size:13px;border:1px solid var(--border);transition:background .1s;" onmouseover="this.style.background=\'var(--green-bg)\'" onmouseout="this.style.background=\'var(--bg)\'">'
        + '<strong style="font-size:12px;color:var(--green-dark);">' + t.name + '</strong>'
        + '<div style="color:var(--text-light);margin-top:2px;">' + filled.substring(0, 80) + '...</div>'
        + '</div>';
    });
    html += '</div>';
    UI.showModal('Quick Templates', html);
  },

  filterContacts: function(query) {
    var q = query.toLowerCase();
    var contacts = document.getElementById('msg-contacts');
    if (!contacts) return;
    Array.from(contacts.children).forEach(function(el) {
      var name = el.innerText.toLowerCase();
      el.style.display = name.includes(q) ? '' : 'none';
    });
  }
};

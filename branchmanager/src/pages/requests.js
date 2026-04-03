/**
 * Branch Manager — Requests Page v3
 * Matches Jobber: filter chips, stat cards, row actions, detail view
 */
var RequestsPage = {
  _search: '', _filter: 'all',

  // ── Helpers ──────────────────────────────────────────────────────────────
  _isOverdue: function(r) {
    if (r.status === 'converted' || r.status === 'quoted' || r.status === 'archived') return false;
    var age = (Date.now() - new Date(r.createdAt || 0)) / 86400000;
    return age > 3;
  },

  _statusLabel: function(s) {
    var map = { new:'New', assessment_scheduled:'Assessment Scheduled', assessment_complete:'Assessment Complete',
      converted:'Converted', quoted:'Quoted', overdue:'Overdue', archived:'Archived', unscheduled:'Unscheduled' };
    return map[s] || s;
  },

  // ── Background Supabase sync ──────────────────────────────────────────────
  _autoSync: function() {
    var SUPABASE_URL = 'https://ltpivkqahvplapyagljt.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cGl2a3FhaHZwbGFweWFnbGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTgxNzIsImV4cCI6MjA4OTY3NDE3Mn0.bQ-wAx4Uu-FyA2ZwsTVfFoU2ZPbeWCmupqV-6ZR9uFI';
    fetch(SUPABASE_URL + '/rest/v1/requests?select=*&order=created_at.desc&limit=50', {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
    })
    .then(function(r) { return r.json(); })
    .then(function(rows) {
      if (!Array.isArray(rows)) return;
      var existing = DB.requests.getAll();
      var added = 0;
      rows.forEach(function(row) {
        var dup = existing.find(function(e) {
          return (e.supabaseId && e.supabaseId === row.id) ||
                 (e.clientName && row.client_name && e.clientName.toLowerCase() === row.client_name.toLowerCase() &&
                  e.property && row.property && e.property.substring(0,8) === row.property.substring(0,8));
        });
        if (!dup) {
          DB.requests.create({
            supabaseId: row.id,
            clientName: row.client_name || '',
            email: row.email || '',
            phone: row.phone || '',
            property: row.property || '',
            source: row.source || 'Online Form',
            notes: row.notes || '',
            status: row.status || 'new',
            createdAt: row.created_at
          });
          added++;
        }
      });
      localStorage.setItem('bm-req-last-sync', new Date().toISOString());
      if (added > 0) {
        UI.toast('📥 ' + added + ' new online request' + (added > 1 ? 's' : '') + ' pulled in!');
        loadPage('requests');
      }
    })
    .catch(function() {});
  },

  syncFromSupabase: function() {
    var SUPABASE_URL = 'https://ltpivkqahvplapyagljt.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cGl2a3FhaHZwbGFweWFnbGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTgxNzIsImV4cCI6MjA4OTY3NDE3Mn0.bQ-wAx4Uu-FyA2ZwsTVfFoU2ZPbeWCmupqV-6ZR9uFI';
    var btn = document.getElementById('req-sync-btn');
    if (btn) { btn.textContent = '⏳ Syncing...'; btn.disabled = true; }
    fetch(SUPABASE_URL + '/rest/v1/requests?select=*&order=created_at.desc&limit=50', {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
    })
    .then(function(r) { return r.json(); })
    .then(function(rows) {
      if (!Array.isArray(rows)) return;
      var existing = DB.requests.getAll();
      var added = 0;
      rows.forEach(function(row) {
        var dup = existing.find(function(e) {
          return (e.supabaseId && e.supabaseId === row.id) ||
                 (e.clientName && row.client_name && e.clientName.toLowerCase() === row.client_name.toLowerCase() &&
                  e.property && row.property && e.property.substring(0,8) === row.property.substring(0,8));
        });
        if (!dup) {
          DB.requests.create({
            supabaseId: row.id,
            clientName: row.client_name || '',
            email: row.email || '',
            phone: row.phone || '',
            property: row.property || '',
            source: row.source || 'Online Form',
            notes: row.notes || '',
            status: row.status || 'new',
            createdAt: row.created_at
          });
          added++;
        }
      });
      localStorage.setItem('bm-req-last-sync', new Date().toISOString());
      UI.toast(added > 0 ? '✅ Synced ' + added + ' new request' + (added>1?'s':'') + ' from website' : '✅ Already up to date');
      if (btn) { btn.textContent = '🔄 Sync'; btn.disabled = false; }
      loadPage('requests');
    })
    .catch(function() {
      UI.toast('⚠️ Sync failed — check connection');
      if (btn) { btn.textContent = '🔄 Sync'; btn.disabled = false; }
    });
  },

  // ── List render ───────────────────────────────────────────────────────────
  render: function() {
    var lastSync = localStorage.getItem('bm-req-last-sync');
    var fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    if (!lastSync || lastSync < fiveMinAgo) RequestsPage._autoSync();

    var self = RequestsPage;
    var all = DB.requests.getAll();

    // Stats
    var newCount   = all.filter(function(r){ return r.status === 'new'; }).length;
    var assessed   = all.filter(function(r){ return r.status === 'assessment_complete'; }).length;
    var overdue    = all.filter(function(r){ return self._isOverdue(r); }).length;
    var converted  = all.filter(function(r){ return r.status === 'converted' || r.status === 'quoted'; }).length;
    var convRate   = all.length > 0 ? Math.round(converted / all.length * 100) : 0;
    var recentNew  = all.filter(function(r) {
      var ago = new Date(); ago.setDate(ago.getDate()-30);
      return new Date(r.createdAt) >= ago && r.status === 'new';
    });

    var html = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:16px;background:var(--white);" class="stat-row">'
      // Overview
      + '<div onclick="RequestsPage._setFilter(\'all\')" style="padding:14px 16px;border-right:1px solid var(--border);cursor:pointer;">'
      + '<div style="font-size:14px;font-weight:700;margin-bottom:8px;">Overview</div>'
      + '<div style="font-size:12px;"><span style="color:#1565c0;">●</span> New (' + newCount + ')</div>'
      + '<div style="font-size:12px;"><span style="color:#2e7d32;">●</span> Assessment complete (' + assessed + ')</div>'
      + '<div style="font-size:12px;"><span style="color:#dc3545;">●</span> Overdue (' + overdue + ')</div>'
      + '<div style="font-size:12px;"><span style="color:#6c757d;">●</span> Converted (' + converted + ')</div>'
      + '</div>'
      // New requests
      + '<div onclick="RequestsPage._setFilter(\'new\')" style="padding:14px 16px;border-right:1px solid var(--border);cursor:pointer;">'
      + '<div style="font-size:14px;font-weight:700;">New requests</div>'
      + '<div style="font-size:12px;color:var(--text-light);">Past 30 days</div>'
      + '<div style="font-size:28px;font-weight:700;margin-top:4px;">' + recentNew.length + '</div>'
      + '</div>'
      // Conversion rate
      + '<div style="padding:14px 16px;border-right:1px solid var(--border);">'
      + '<div style="font-size:14px;font-weight:700;">Conversion rate</div>'
      + '<div style="font-size:12px;color:var(--text-light);">Requests → quotes</div>'
      + '<div style="font-size:28px;font-weight:700;margin-top:4px;">' + convRate + '%</div>'
      + '</div>'
      // Total
      + '<div style="padding:14px 16px;">'
      + '<div style="font-size:14px;font-weight:700;">Total requests</div>'
      + '<div style="font-size:28px;font-weight:700;margin-top:12px;">' + all.length + '</div>'
      + '<div style="font-size:12px;color:var(--text-light);">All time</div>'
      + '</div>'
      + '</div>';

    var filtered = self._getFiltered();

    // Header + chips + search
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">'
      + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
      + '<h3 style="font-size:16px;font-weight:700;margin:0;">All requests</h3>'
      + '<span style="font-size:13px;color:var(--text-light);">(' + filtered.length + ')</span>';

    var chips = [['all','All'],['new','New'],['assessment_complete','Assessment Complete'],['overdue','Overdue'],['unscheduled','Unscheduled'],['converted','Converted']];
    chips.forEach(function(c) {
      var isActive = self._filter === c[0];
      html += '<button onclick="RequestsPage._setFilter(\'' + c[0] + '\')" style="font-size:12px;padding:5px 14px;border-radius:20px;border:1px solid '
        + (isActive ? '#1565c0' : 'var(--border)') + ';background:' + (isActive ? '#1565c0' : 'var(--white)')
        + ';color:' + (isActive ? '#fff' : 'var(--text)') + ';cursor:pointer;font-weight:' + (isActive ? '600' : '500') + ';">' + c[1] + '</button>';
    });

    html += '</div>'
      + '<div style="display:flex;gap:8px;align-items:center;">'
      + '<div class="search-box" style="min-width:180px;max-width:260px;">'
      + '<span style="color:var(--text-light);">🔍</span>'
      + '<input type="text" placeholder="Search requests..." value="' + UI.esc(self._search) + '" oninput="RequestsPage._search=this.value;loadPage(\'requests\')">'
      + '</div>'
      + '<button class="btn btn-primary" onclick="RequestsPage.showForm()" style="font-size:12px;white-space:nowrap;">+ New Request</button>'
      + '</div></div>';

    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      + '<table class="data-table"><thead><tr>'
      + '<th>Client</th><th>Title</th><th>Property</th><th>Contact</th><th>Requested</th><th>Status</th>'
      + '</tr></thead><tbody>';

    if (filtered.length === 0) {
      html += '<tr><td colspan="6">'
        + (self._search
          ? '<div style="text-align:center;padding:24px;color:var(--text-light);">No requests match "' + UI.esc(self._search) + '"</div>'
          : UI.emptyState('📥', 'No requests yet', 'New requests from your website form will appear here.', '+ New Request', 'RequestsPage.showForm()'))
        + '</td></tr>';
    } else {
      filtered.forEach(function(r) {
        var isOld = self._isOverdue(r);
        var rowBg = isOld ? 'background:#fff8f8;' : '';
        var title = r.service || (r.notes ? r.notes.split('\n')[0].substring(0, 50) + (r.notes.length > 50 ? '…' : '') : 'Request for ' + (r.clientName || ''));

        html += '<tr onclick="RequestsPage.showDetail(\'' + r.id + '\')" style="cursor:pointer;' + rowBg + '">'
          + '<td><strong>' + UI.esc(r.clientName || '—') + '</strong></td>'
          + '<td style="font-size:13px;color:var(--text-light);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + UI.esc(title) + '</td>'
          + '<td style="font-size:12px;color:var(--text-light);max-width:180px;">' + (r.property ? UI.esc(r.property) : '—') + '</td>'
          + '<td style="font-size:13px;">'
          + (r.phone ? '<a href="tel:' + r.phone.replace(/\D/g,'') + '" onclick="event.stopPropagation()" style="color:var(--text);text-decoration:none;">' + UI.phone(r.phone) + '</a>' : '—')
          + (r.email ? '<div style="font-size:11px;color:var(--text-light);">' + r.email + '</div>' : '')
          + '</td>'
          + '<td style="white-space:nowrap;font-size:13px;">'
          + UI.dateRelative(r.createdAt)
          + (isOld ? ' <span style="font-size:10px;font-weight:700;background:#fdecea;color:#c62828;padding:1px 5px;border-radius:3px;">OVERDUE</span>' : '')
          + '</td>'
          + '<td>' + UI.statusBadge(r.status) + '</td>'
          + '</tr>';
      });
    }
    html += '</tbody></table></div>';
    return html;
  },

  // ── Filtering ─────────────────────────────────────────────────────────────
  _getFiltered: function() {
    var self = RequestsPage;
    var all = DB.requests.getAll();
    if (self._filter === 'converted') {
      all = all.filter(function(r) { return r.status === 'converted' || r.status === 'quoted'; });
    } else if (self._filter === 'overdue') {
      all = all.filter(function(r) { return self._isOverdue(r); });
    } else if (self._filter === 'unscheduled') {
      all = all.filter(function(r) { return !r.assessmentDate && (r.status === 'new' || r.status === 'assessment_complete'); });
    } else if (self._filter !== 'all') {
      all = all.filter(function(r) { return r.status === self._filter; });
    }
    if (self._search && self._search.length >= 2) {
      var s = self._search.toLowerCase();
      all = all.filter(function(r) {
        return (r.clientName||'').toLowerCase().indexOf(s) >= 0
          || (r.property||'').toLowerCase().indexOf(s) >= 0
          || (r.phone||'').indexOf(s) >= 0
          || (r.email||'').toLowerCase().indexOf(s) >= 0
          || (r.notes||'').toLowerCase().indexOf(s) >= 0
          || (r.service||'').toLowerCase().indexOf(s) >= 0
          || (r.source||'').toLowerCase().indexOf(s) >= 0;
      });
    }
    // Sort: newest first
    all.sort(function(a,b){ return new Date(b.createdAt||0) - new Date(a.createdAt||0); });
    return all;
  },
  _setFilter: function(f) { RequestsPage._filter = f; loadPage('requests'); },

  // ── New Request form ──────────────────────────────────────────────────────
  showForm: function(editId) {
    var r = editId ? DB.requests.getById(editId) : null;
    var allClients = [];
    try { allClients = JSON.parse(localStorage.getItem('bm-clients') || '[]'); } catch(e) {}
    var clientOptions = [{ value: '', label: '— New client (fill in below) —' }]
      .concat(allClients.map(function(c) { return { value: c.id, label: c.name + (c.address ? ' · ' + c.address.split(',')[0] : '') }; }));

    var services = ['','Tree Removal','Tree Pruning','Stump Grinding','Emergency Tree Work','Tree Assessment','Cabling & Bracing',
      'Chipping / Brush Removal','Lot Clearing','Firewood','Gutter Cleaning','Spring Clean Up','Snow Removal','Other'];

    var html = '<form id="req-form" onsubmit="RequestsPage.save(event,\'' + (editId||'') + '\')">'
      + (r ? '' : UI.formField('Existing Client', 'select', 'r-clientId', '', { options: clientOptions }))
      + '<div id="r-newclient-fields"' + (r ? '' : '') + '>'
      + UI.formField('Client Name', 'text', 'r-name', r ? r.clientName : '', { placeholder: 'Full name' })
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      + UI.formField('Phone', 'tel', 'r-phone', r ? r.phone : '', { placeholder: '(914) 555-0000' })
      + UI.formField('Email', 'email', 'r-email', r ? r.email : '', { placeholder: 'email@example.com' })
      + '</div></div>'
      + UI.formField('Property Address', 'text', 'r-property', r ? r.property : '', { placeholder: 'Street, City, State ZIP' })
      + UI.formField('Service Requested', 'select', 'r-service', r ? r.service : '', { options: services })
      + UI.formField('How did they hear about us?', 'select', 'r-source', r ? r.source : '', { options: ['','Google Search','Facebook','Instagram','Nextdoor','Friend / Referral','Yelp','Angi','Thumbtack','Drive-by','Repeat Client','Other'] })
      + UI.formField('Details / Notes', 'textarea', 'r-notes', r ? r.notes : '', { placeholder: 'What do they need? Any specifics about the property or job.' })
      + '</form>'
      + '<script>var _rci=document.getElementById("r-clientId");if(_rci)_rci.addEventListener("change",function(){'
      + 'var nf=document.getElementById("r-newclient-fields");nf.style.display=this.value?"none":"block";'
      + 'if(this.value){var cl=JSON.parse(localStorage.getItem("bm-clients")||"[]");'
      + 'var c=cl.find(function(x){return x.id===_rci.value;});'
      + 'if(c){if(document.getElementById("r-name"))document.getElementById("r-name").value=c.name||"";'
      + 'if(document.getElementById("r-phone"))document.getElementById("r-phone").value=c.phone||"";'
      + 'if(document.getElementById("r-email"))document.getElementById("r-email").value=c.email||"";'
      + 'if(!document.getElementById("r-property").value)document.getElementById("r-property").value=c.address||"";}}'
      + '});<\/script>';

    UI.showModal(r ? 'Edit Request' : 'New Request', html, {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-primary" onclick="document.getElementById(\'req-form\').requestSubmit()">'
        + (r ? 'Save Changes' : 'Save Request') + '</button>'
    });
  },

  save: function(e, editId) {
    e.preventDefault();
    var service  = (document.getElementById('r-service')||{}).value || '';
    var property = (document.getElementById('r-property')||{}).value.trim();
    var source   = (document.getElementById('r-source')||{}).value || '';
    var notes    = (document.getElementById('r-notes')||{}).value.trim();

    if (editId) {
      var phone = (document.getElementById('r-phone')||{}).value.trim();
      var email = (document.getElementById('r-email')||{}).value.trim();
      var name  = (document.getElementById('r-name')||{}).value.trim();
      DB.requests.update(editId, { clientName: name, phone: phone, email: email, property: property, service: service, source: source, notes: notes });
      UI.toast('Request updated');
      UI.closeModal();
      RequestsPage.showDetail(editId);
      return;
    }

    var existingClientId = (document.getElementById('r-clientId')||{}).value;
    var allClients = [];
    try { allClients = JSON.parse(localStorage.getItem('bm-clients') || '[]'); } catch(ex) {}
    var client;

    if (existingClientId) {
      client = allClients.find(function(c) { return c.id === existingClientId; });
      if (!client) { UI.toast('Client not found', 'error'); return; }
    } else {
      var name = (document.getElementById('r-name')||{}).value.trim();
      if (!name) { UI.toast('Enter a client name or select an existing client', 'error'); return; }
      client = DB.clients.create({
        name: name,
        phone: (document.getElementById('r-phone')||{}).value.trim(),
        email: (document.getElementById('r-email')||{}).value.trim(),
        address: property,
        status: 'lead'
      });
    }

    DB.requests.create({
      clientId: client.id,
      clientName: client.name,
      property: property || client.address || '',
      phone: client.phone || '',
      email: client.email || '',
      service: service,
      source: source,
      notes: notes,
      status: 'new'
    });

    UI.toast('Request created ✅');
    UI.closeModal();
    loadPage('requests');
  },

  // ── Detail view ───────────────────────────────────────────────────────────
  showDetail: function(id) {
    var r = DB.requests.getById(id);
    if (!r) return;
    var self = RequestsPage;

    var statusColor = { new:'#1565c0', assessment_scheduled:'#e07c24', assessment_complete:'#2e7d32',
      converted:'#2e7d32', quoted:'#8b2252', overdue:'#dc3545', archived:'#9e9e9e' }[r.status] || '#1565c0';

    // Find linked quotes
    var linkedQuotes = DB.quotes.getAll().filter(function(q) {
      return q.requestId === r.id || (q.clientName && r.clientName && q.clientName === r.clientName && q.clientId === r.clientId);
    }).slice(0, 3);

    var html = '<div style="max-width:960px;margin:0 auto;">'

    // Top action bar
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px;">'
      + '<button class="btn btn-outline" onclick="loadPage(\'requests\')" style="padding:6px 12px;font-size:12px;">← Back to Requests</button>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;">'
      + (r.phone ? '<a href="tel:' + r.phone.replace(/\D/g,'') + '" class="btn btn-outline" style="font-size:12px;">📞 Call</a>' : '')
      + (r.email ? '<button class="btn btn-outline" onclick="RequestsPage._sendConfirmation(\'' + r.id + '\')" style="font-size:12px;">📧 Email</button>' : '')
      + '<button class="btn btn-outline" onclick="RequestsPage.showForm(\'' + r.id + '\')" style="font-size:12px;">✏️ Edit</button>'
      + '<button class="btn btn-primary" onclick="RequestsPage._createQuote(\'' + r.id + '\',\'' + (r.clientId||'') + '\',\'' + UI.esc(r.clientName||'') + '\')" style="font-size:12px;">📝 Create Quote</button>'
      + '</div></div>'

    // Header card
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:16px;">'
      + '<div style="height:4px;background:' + statusColor + ';"></div>'
      + '<div style="padding:20px 24px;">'
      + '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">'
      + '<div>'
      + '<h2 style="font-size:22px;font-weight:700;margin:0 0 4px;">' + UI.esc(r.clientName || 'Unknown') + '</h2>'
      + '<div style="font-size:13px;color:var(--text-light);">'
      + UI.dateRelative(r.createdAt)
      + (r.source ? ' · via ' + r.source : '')
      + (self._isOverdue(r) ? ' · <span style="color:#c62828;font-weight:600;">Overdue</span>' : '')
      + '</div>'
      + (r.property ? '<div style="font-size:13px;color:var(--text-light);margin-top:4px;">📍 ' + UI.esc(r.property) + '</div>' : '')
      + '</div>'
      + UI.statusBadge(r.status)
      + '</div></div></div>'

    // Two-column layout: main + sidebar
      + '<div style="display:grid;grid-template-columns:1fr 300px;gap:16px;" class="detail-grid">'

    // ── Main column ──
      + '<div>'

    // Request details card
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:20px;margin-bottom:14px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:14px;">Request Details</h4>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;" class="detail-grid">'
      + '<div><div style="font-size:11px;color:var(--text-light);font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Service</div>'
      + '<div style="font-size:14px;font-weight:600;">' + UI.esc(r.service || '—') + '</div></div>'
      + '<div><div style="font-size:11px;color:var(--text-light);font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Source</div>'
      + '<div style="font-size:14px;">' + UI.esc(r.source || '—') + '</div></div>'
      + '<div><div style="font-size:11px;color:var(--text-light);font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Received</div>'
      + '<div style="font-size:14px;">' + UI.dateShort(r.createdAt) + '</div></div>'
      + '<div><div style="font-size:11px;color:var(--text-light);font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Assessment</div>'
      + '<div style="font-size:14px;">' + (r.assessmentDate ? UI.dateShort(r.assessmentDate) : '<span style="color:var(--text-light);">Not scheduled</span>') + '</div></div>'
      + '</div>'
      + (r.notes ? '<div style="font-size:13px;line-height:1.7;color:var(--text);background:var(--bg);border-radius:8px;padding:12px;">' + UI.esc(r.notes).replace(/\n/g,'<br>') + '</div>' : '<div style="font-size:13px;color:var(--text-light);font-style:italic;">No details provided</div>')
      + '</div>'

    // Status workflow card
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:20px;margin-bottom:14px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px;">Update Status</h4>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
    [['new','New'],['assessment_scheduled','Assessment Scheduled'],['assessment_complete','Assessment Complete'],['converted','Converted'],['archived','Archived']].forEach(function(s) {
      var isActive = r.status === s[0];
      html += '<button onclick="RequestsPage.setStatus(\'' + r.id + '\',\'' + s[0] + '\')" style="font-size:12px;padding:6px 14px;border-radius:6px;border:1px solid '
        + (isActive ? '#1565c0' : 'var(--border)') + ';background:' + (isActive ? '#1565c0' : 'var(--white)') + ';color:'
        + (isActive ? '#fff' : 'var(--text)') + ';cursor:pointer;font-weight:' + (isActive ? '700' : '500') + ';">' + s[1] + '</button>';
    });
    html += '</div></div>'

    // Linked quotes
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:20px;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin:0;">Quotes</h4>'
      + '<button onclick="RequestsPage._createQuote(\'' + r.id + '\',\'' + (r.clientId||'') + '\',\'' + UI.esc(r.clientName||'') + '\')" class="btn btn-outline" style="font-size:12px;">+ Create Quote</button>'
      + '</div>';
    if (linkedQuotes.length > 0) {
      linkedQuotes.forEach(function(q) {
        html += '<div onclick="QuotesPage.showDetail(\'' + q.id + '\')" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--bg);border-radius:8px;margin-bottom:6px;cursor:pointer;">'
          + '<div><div style="font-size:13px;font-weight:600;">' + 'Quote #' + (q.quoteNumber||'') + '</div>'
          + '<div style="font-size:11px;color:var(--text-light);">' + UI.dateShort(q.createdAt) + '</div></div>'
          + '<div style="display:flex;align-items:center;gap:8px;">' + UI.statusBadge(q.status) + '<span style="font-size:13px;font-weight:700;">' + UI.money(q.total) + '</span></div>'
          + '</div>';
      });
    } else {
      html += '<div style="font-size:13px;color:var(--text-light);text-align:center;padding:12px;">No quotes yet</div>';
    }
    html += '</div></div>'

    // ── Right sidebar ──
      + '<div>'

    // Contact card
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px;">Contact</h4>'
      + '<div style="font-size:15px;font-weight:700;margin-bottom:8px;">' + UI.esc(r.clientName || '—') + '</div>'
      + (r.property ? '<div style="font-size:12px;color:var(--text-light);margin-bottom:12px;">📍 ' + UI.esc(r.property) + '</div>' : '')
      + (r.phone ? '<a href="tel:' + r.phone.replace(/\D/g,'') + '" class="btn btn-outline" style="width:100%;justify-content:center;margin-bottom:6px;font-size:13px;">📞 ' + UI.phone(r.phone) + '</a>' : '')
      + (r.phone ? '<button class="btn btn-outline" style="width:100%;justify-content:center;margin-bottom:6px;font-size:13px;" onclick="if(typeof Dialpad!==\'undefined\'){Dialpad.showTextModal(\'' + r.phone.replace(/\D/g,'') + '\',\'Hi ' + UI.esc((r.clientName||'').split(' ')[0]||'there') + ', thanks for reaching out to Second Nature Tree Service! We received your request and will follow up shortly. Questions? Call (914) 391-5233.\');}else{window.location=\'sms:' + r.phone.replace(/\D/g,'') + '\';}">💬 Text</button>' : '')
      + (r.email ? '<a href="mailto:' + r.email + '" class="btn btn-outline" style="width:100%;justify-content:center;margin-bottom:6px;font-size:13px;">✉️ ' + UI.esc(r.email) + '</a>' : '')
      + (r.property ? '<a href="https://maps.google.com/?q=' + encodeURIComponent(r.property) + '" target="_blank" class="btn btn-outline" style="width:100%;justify-content:center;font-size:13px;">🗺 Directions</a>' : '')
      + '</div>'

    // Assessment date card
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Assessment Date</h4>'
      + '<input type="date" id="req-assess-date" value="' + (r.assessmentDate || '') + '" style="width:100%;padding:8px 10px;border:2px solid var(--border);border-radius:8px;font-size:13px;margin-bottom:8px;">'
      + '<button onclick="RequestsPage._saveAssessmentDate(\'' + r.id + '\')" class="btn btn-primary" style="width:100%;font-size:13px;">Save Date</button>'
      + '</div>'

    // Quick info
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Details</h4>'
      + '<table style="width:100%;font-size:12px;border-collapse:collapse;">'
      + '<tr><td style="padding:4px 0;color:var(--text-light);">Request #</td><td style="padding:4px 0;text-align:right;font-weight:600;">' + (r.id||'').slice(-6).toUpperCase() + '</td></tr>'
      + '<tr><td style="padding:4px 0;color:var(--text-light);">Received</td><td style="padding:4px 0;text-align:right;">' + UI.dateShort(r.createdAt) + '</td></tr>'
      + '<tr><td style="padding:4px 0;color:var(--text-light);">Source</td><td style="padding:4px 0;text-align:right;font-weight:600;">' + (r.source || '—') + '</td></tr>'
      + (r.confirmationSentAt ? '<tr><td style="padding:4px 0;color:var(--text-light);">Confirmed</td><td style="padding:4px 0;text-align:right;">' + UI.dateShort(r.confirmationSentAt) + '</td></tr>' : '')
      + '</table>'
      + '</div>'

      + '</div></div></div>';

    document.getElementById('pageTitle').textContent = 'Request — ' + (r.clientName || '');
    document.getElementById('pageContent').innerHTML = html;
    document.getElementById('pageAction').style.display = 'none';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  _saveAssessmentDate: function(id) {
    var val = (document.getElementById('req-assess-date')||{}).value;
    DB.requests.update(id, { assessmentDate: val, status: val ? 'assessment_scheduled' : 'new' });
    UI.toast(val ? 'Assessment scheduled for ' + UI.dateShort(val) : 'Assessment date cleared');
    RequestsPage.showDetail(id);
  },

  setStatus: function(id, status) {
    DB.requests.update(id, { status: status });
    UI.toast('Status updated to ' + RequestsPage._statusLabel(status));
    RequestsPage.showDetail(id);
  },

  _updateStatus: function(id, status) {
    DB.requests.update(id, { status: status });
    UI.toast(status === 'archived' ? 'Request archived' : 'Status updated to ' + RequestsPage._statusLabel(status));
    loadPage('requests');
  },

  _createQuote: function(requestId, clientId, clientName) {
    DB.requests.update(requestId, { status: 'converted' });
    UI.toast('Request marked as converted');
    var resolvedId = clientId;
    if (clientId && !DB.clients.getById(clientId) && clientName) {
      var allClients = JSON.parse(localStorage.getItem('bm-clients') || '[]');
      var match = allClients.find(function(c) { return c.name === clientName; });
      if (match) resolvedId = match.id;
    }
    QuotesPage.showForm(null, resolvedId);
  },

  _sendConfirmation: function(id) {
    var r = DB.requests.getById(id);
    if (!r || !r.email) { UI.toast('No email on file for this request', 'error'); return; }
    var firstName = (r.clientName || '').split(' ')[0] || 'there';
    var subject = 'We received your request — Second Nature Tree Service';
    var body = 'Hi ' + firstName + ',\n\n'
      + 'Thanks for reaching out to Second Nature Tree Service! We\'ve received your request and will be in touch within 1 business day to schedule a free assessment.\n\n'
      + (r.service ? '🌳 Service: ' + r.service + '\n' : '')
      + (r.notes ? '📋 Details: ' + r.notes + '\n' : '')
      + (r.property ? '📍 Property: ' + r.property + '\n' : '')
      + '\nFeel free to call or text us at (914) 391-5233 with any questions.\n\n'
      + 'Doug Brown\nSecond Nature Tree Service\n(914) 391-5233\ninfo@peekskilltree.com\nLicensed & Fully Insured';

    var html = '<div style="padding:4px;">'
      + '<div style="background:#e8f5e9;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:13px;color:#1a3c12;">📧 Sending to <strong>' + r.email + '</strong></div>'
      + '<div style="margin-bottom:12px;"><label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Subject</label>'
      + '<input type="text" id="rc-subject" value="' + UI.esc(subject) + '" style="width:100%;padding:8px 12px;border:2px solid var(--border);border-radius:8px;font-size:14px;"></div>'
      + '<div><label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Message</label>'
      + '<textarea id="rc-body" rows="12" style="width:100%;padding:10px;border:2px solid var(--border);border-radius:8px;font-size:13px;line-height:1.6;font-family:inherit;resize:vertical;">' + body + '</textarea></div>'
      + '</div>';

    UI.showModal('Send Request Confirmation', html, {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-primary" onclick="RequestsPage._confirmSendConfirmation(\'' + id + '\')">📧 Send Now</button>'
    });
  },

  _confirmSendConfirmation: function(id) {
    var r = DB.requests.getById(id);
    if (!r) return;
    var subject = (document.getElementById('rc-subject')||{}).value;
    var body = (document.getElementById('rc-body')||{}).value;
    if (typeof Email !== 'undefined' && Email.isConfigured()) {
      Email.send(r.email, subject, body);
    } else {
      window.open('mailto:' + r.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body), '_blank');
    }
    DB.requests.update(id, { confirmationSentAt: new Date().toISOString(), status: 'assessment_scheduled' });
    UI.closeModal();
    UI.toast('Confirmation sent to ' + r.email + ' ✅');
    RequestsPage.showDetail(id);
  }
};

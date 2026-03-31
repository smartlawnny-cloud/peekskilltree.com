/**
 * Branch Manager — Requests Page
 */
var RequestsPage = {
  render: function() {
    var all = DB.requests.getAll();
    var newCount = DB.requests.countNew();

    // Jobber-style stat cards row
    var assessed = all.filter(function(r) { return r.status === 'assessed' || r.status === 'assessment_complete'; }).length;
    var overdue = all.filter(function(r) { return r.status === 'overdue'; }).length;
    var unscheduled = all.filter(function(r) { return r.status === 'unscheduled'; }).length;
    var recentNew = all.filter(function(r) { var d=new Date(r.createdAt); var ago=new Date(); ago.setDate(ago.getDate()-30); return d>=ago && r.status==='new'; });
    var converted = all.filter(function(r) { return r.status === 'converted' || r.status === 'quoted'; });
    var convRate = all.length > 0 ? Math.round(converted.length / all.length * 100) : 0;

    var html = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:16px;background:var(--white);">'
      // Overview
      + '<div style="padding:14px 16px;border-right:1px solid var(--border);">'
      + '<div style="font-size:14px;font-weight:700;margin-bottom:8px;">Overview</div>'
      + '<div style="font-size:12px;"><span style="color:#1565c0;">●</span> New (' + newCount + ')</div>'
      + '<div style="font-size:12px;"><span style="color:#2e7d32;">●</span> Assessment complete (' + assessed + ')</div>'
      + '<div style="font-size:12px;"><span style="color:#dc3545;">●</span> Overdue (' + overdue + ')</div>'
      + '<div style="font-size:12px;"><span style="color:#e6a817;">●</span> Unscheduled (' + unscheduled + ')</div>'
      + '</div>'
      // New requests
      + '<div style="padding:14px 16px;border-right:1px solid var(--border);">'
      + '<div style="font-size:14px;font-weight:700;">New requests</div>'
      + '<div style="font-size:12px;color:var(--text-light);">Past 30 days</div>'
      + '<div style="font-size:28px;font-weight:700;margin-top:4px;">' + recentNew.length + '</div>'
      + '</div>'
      // Conversion rate
      + '<div style="padding:14px 16px;border-right:1px solid var(--border);">'
      + '<div style="font-size:14px;font-weight:700;">Conversion rate</div>'
      + '<div style="font-size:28px;font-weight:700;margin-top:12px;">' + convRate + '%</div>'
      + '</div>'
      // Total
      + '<div style="padding:14px 16px;">'
      + '<div style="font-size:14px;font-weight:700;">Total requests</div>'
      + '<div style="font-size:28px;font-weight:700;margin-top:12px;">' + all.length + '</div>'
      + '<div style="font-size:12px;color:var(--text-light);">All time</div>'
      + '</div>'
      + '</div>';

    // Jobber-style header + search
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">'
      + '<div style="display:flex;align-items:center;gap:12px;">'
      + '<h3 style="font-size:16px;font-weight:700;margin:0;">All requests</h3>'
      + '<span style="font-size:13px;color:var(--text-light);">(' + all.length + ' results)</span>'
      + '<button class="filter-btn active" style="font-size:12px;padding:5px 12px;">Status | All</button>'
      + '</div>'
      + '<div class="search-box" style="min-width:200px;max-width:280px;">'
      + '<span style="color:var(--text-light);">🔍</span>'
      + '<input type="text" placeholder="Search requests..." oninput="">'
      + '</div></div>';

    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      + '<table class="data-table"><thead><tr>'
      + '<th>Client</th><th>Title</th><th>Property</th><th>Contact</th><th>Requested</th><th>Status</th>'
      + '</tr></thead><tbody>';

    if (all.length === 0) {
      html += '<tr><td colspan="6">' + UI.emptyState('📥', 'No requests yet', 'New requests from your website form will appear here.', '+ New Request', 'RequestsPage.showForm()') + '</td></tr>';
    } else {
      all.forEach(function(r) {
        html += '<tr onclick="RequestsPage.showDetail(\'' + r.id + '\')">'
          + '<td><strong>' + UI.esc(r.clientName || '—') + '</strong></td>'
          + '<td style="font-size:13px;color:var(--text-light);">' + UI.esc(r.property || '—') + '</td>'
          + '<td style="font-size:13px;">' + UI.phone(r.phone) + '<br>' + (r.email || '') + '</td>'
          + '<td style="font-size:12px;">' + (r.source || '—') + '</td>'
          + '<td>' + UI.dateRelative(r.createdAt) + '</td>'
          + '<td>' + UI.statusBadge(r.status) + '</td>'
          + '</tr>';
      });
    }
    html += '</tbody></table></div>';
    return html;
  },

  showForm: function() {
    var html = '<form id="req-form" onsubmit="RequestsPage.save(event)">'
      + UI.formField('Client Name *', 'text', 'r-name', '', { required: true, placeholder: 'Full name' })
      + UI.formField('Property Address', 'text', 'r-property', '', { placeholder: 'Street, City, State ZIP' })
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      + UI.formField('Phone', 'tel', 'r-phone', '', { placeholder: '(914) 555-0000' })
      + UI.formField('Email', 'email', 'r-email', '', { placeholder: 'email@example.com' })
      + '</div>'
      + UI.formField('How did they hear about us?', 'select', 'r-source', '', { options: ['','Google Search','Facebook','Instagram','Nextdoor','Friend/Referral','Yelp','Angi','Thumbtack','Drive-by','Repeat Client','Other'] })
      + UI.formField('Notes', 'textarea', 'r-notes', '', { placeholder: 'What do they need?' })
      + '</form>';

    UI.showModal('New Request', html, {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-primary" onclick="document.getElementById(\'req-form\').requestSubmit()">Save Request</button>'
    });
  },

  save: function(e) {
    e.preventDefault();
    var name = document.getElementById('r-name').value.trim();
    if (!name) { UI.toast('Name is required', 'error'); return; }

    // Create client if new
    var client = DB.clients.create({
      name: name,
      phone: document.getElementById('r-phone').value.trim(),
      email: document.getElementById('r-email').value.trim(),
      address: document.getElementById('r-property').value.trim(),
      status: 'lead'
    });

    DB.requests.create({
      clientId: client.id,
      clientName: name,
      property: document.getElementById('r-property').value.trim(),
      phone: document.getElementById('r-phone').value.trim(),
      email: document.getElementById('r-email').value.trim(),
      source: document.getElementById('r-source').value,
      notes: document.getElementById('r-notes').value.trim(),
      status: 'new'
    });

    UI.toast('Request created');
    UI.closeModal();
    loadPage('requests');
  },

  showDetail: function(id) {
    var r = DB.requests.getById(id);
    if (!r) return;

    var html = ''
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">'
      + '<button class="btn btn-outline" onclick="loadPage(\'requests\')" style="padding:6px 12px;">← Back</button>'
      + '<div style="flex:1;"><h2 style="font-size:22px;margin-bottom:2px;">' + (r.clientName || 'New Request') + '</h2>'
      + '<span style="font-size:14px;color:var(--text-light);">' + UI.dateRelative(r.createdAt) + ' · via ' + (r.source || 'Unknown') + '</span></div>'
      + '<div style="display:flex;gap:6px;">'
      + '<button class="btn btn-primary" onclick="QuotesPage.showForm(null,\'' + (r.clientId || '') + '\')">+ Create Quote</button>'
      + '</div></div>'

      + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">'
      + UI.statCard('Status', '<span style="font-size:14px;">' + UI.statusBadge(r.status) + '</span>', '', '', '')
      + UI.statCard('Source', r.source || '—', '', '', '')
      + UI.statCard('Received', UI.dateShort(r.createdAt), '', '', '')
      + '</div>'

      + '<div style="display:grid;grid-template-columns:1fr 300px;gap:20px;" class="detail-grid">'
      + '<div>'

      // Status workflow
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Status</h4>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
    ['new', 'assessment_scheduled', 'assessment_complete', 'converted', 'archived'].forEach(function(s) {
      html += '<button class="btn ' + (r.status === s ? 'btn-primary' : 'btn-outline') + '" onclick="RequestsPage.setStatus(\'' + r.id + '\',\'' + s + '\')" style="font-size:12px;padding:6px 14px;">' + s.replace(/_/g, ' ') + '</button>';
    });
    html += '</div></div>'

      // Notes
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Request Details</h4>'
      + '<p style="font-size:14px;line-height:1.7;margin:0;">' + UI.esc(r.notes || 'No details provided') + '</p>'
      + '</div></div>'

      // Right sidebar
      + '<div>'
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Contact</h4>'
      + '<div style="font-size:14px;font-weight:600;margin-bottom:8px;">' + (r.clientName || '—') + '</div>'
      + (r.property ? '<div style="font-size:13px;color:var(--text-light);margin-bottom:10px;">📍 ' + r.property + '</div>' : '')
      + (r.phone ? '<a href="tel:' + r.phone.replace(/\D/g,'') + '" class="btn btn-outline" style="width:100%;justify-content:center;margin-bottom:6px;font-size:12px;">📞 ' + UI.phone(r.phone) + '</a>' : '')
      + (r.email ? '<a href="mailto:' + r.email + '" class="btn btn-outline" style="width:100%;justify-content:center;margin-bottom:6px;font-size:12px;">✉️ ' + r.email + '</a>' : '')
      + (r.property ? '<a href="https://maps.google.com/?q=' + encodeURIComponent(r.property) + '" target="_blank" class="btn btn-outline" style="width:100%;justify-content:center;font-size:12px;">🗺 Directions</a>' : '')
      + '</div>'
      + '</div></div>';

    document.getElementById('pageTitle').textContent = 'Request';
    document.getElementById('pageContent').innerHTML = html;
    document.getElementById('pageAction').style.display = 'none';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  setStatus: function(id, status) {
    DB.requests.update(id, { status: status });
    UI.toast('Status updated to ' + status.replace(/_/g, ' '));
    RequestsPage.showDetail(id);
  }
};

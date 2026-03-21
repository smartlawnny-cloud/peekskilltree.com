/**
 * Branch Manager — Requests Page
 */
var RequestsPage = {
  render: function() {
    var all = DB.requests.getAll();
    var newCount = DB.requests.countNew();

    var html = '<div class="stat-grid">'
      + UI.statCard('New', newCount.toString(), 'Awaiting response', '', '')
      + UI.statCard('Total Requests', all.length.toString(), 'All time', '', '')
      + '</div>';

    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      + '<table class="data-table"><thead><tr>'
      + '<th>Client</th><th>Property</th><th>Contact</th><th>Source</th><th>Requested</th><th>Status</th>'
      + '</tr></thead><tbody>';

    if (all.length === 0) {
      html += '<tr><td colspan="6">' + UI.emptyState('📥', 'No requests yet', 'New requests from your website form will appear here.', '+ New Request', 'RequestsPage.showForm()') + '</td></tr>';
    } else {
      all.forEach(function(r) {
        html += '<tr onclick="RequestsPage.showDetail(\'' + r.id + '\')">'
          + '<td><strong>' + (r.clientName || '—') + '</strong></td>'
          + '<td style="font-size:13px;color:var(--text-light);">' + (r.property || '—') + '</td>'
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

    var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">'
      + '<div>'
      + '<h3 style="margin-bottom:12px;">' + (r.clientName || 'Unknown') + '</h3>'
      + '<div style="font-size:14px;line-height:2;">'
      + '<div>📍 ' + (r.property || '—') + '</div>'
      + '<div>📞 ' + UI.phone(r.phone) + '</div>'
      + '<div>✉️ ' + (r.email || '—') + '</div>'
      + '<div>📣 Source: <strong>' + (r.source || '—') + '</strong></div>'
      + '<div>📅 Requested: ' + UI.dateRelative(r.createdAt) + '</div>'
      + '</div>'
      + '</div>'
      + '<div>'
      + '<h4>Notes</h4>'
      + '<p style="font-size:14px;color:var(--text-light);">' + (r.notes || 'No notes') + '</p>'
      + '</div></div>';

    var statusOptions = '<div style="display:flex;gap:8px;margin-top:16px;">';
    ['new', 'assessment_scheduled', 'assessment_complete', 'converted', 'archived'].forEach(function(s) {
      statusOptions += '<button class="btn ' + (r.status === s ? 'btn-primary' : 'btn-outline') + '" onclick="RequestsPage.setStatus(\'' + r.id + '\',\'' + s + '\')">' + s.replace(/_/g, ' ') + '</button>';
    });
    statusOptions += '</div>';

    UI.showModal('Request — ' + (r.clientName || ''), html + statusOptions, {
      wide: true,
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Close</button>'
        + ' <button class="btn btn-primary" onclick="UI.closeModal();QuotesPage.showForm(null, \'' + r.clientId + '\')">Create Quote</button>'
    });
  },

  setStatus: function(id, status) {
    DB.requests.update(id, { status: status });
    UI.toast('Status updated to ' + status.replace(/_/g, ' '));
    UI.closeModal();
    loadPage('requests');
  }
};

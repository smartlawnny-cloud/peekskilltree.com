/**
 * Branch Manager — Clients Page
 * Full client list, detail view, add/edit forms
 */
var ClientsPage = {
  render: function() {
    var stats = DB.dashboard.getStats();
    var clients = DB.clients.getAll();

    var html = '<div class="stat-grid">'
      + UI.statCard('Total Clients', stats.totalClients.toLocaleString(), 'All time', '', '')
      + UI.statCard('Active', stats.activeClients.toLocaleString(), 'Current clients', '', '')
      + UI.statCard('Leads', stats.leadClients.toLocaleString(), 'Not yet converted', '', '')
      + '</div>';

    // Filters
    html += '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">'
      + '<button class="btn btn-outline client-filter active" data-filter="all" onclick="ClientsPage.filter(\'all\',this)">All (' + clients.length + ')</button>'
      + '<button class="btn btn-outline client-filter" data-filter="active" onclick="ClientsPage.filter(\'active\',this)">Active (' + stats.activeClients + ')</button>'
      + '<button class="btn btn-outline client-filter" data-filter="lead" onclick="ClientsPage.filter(\'lead\',this)">Leads (' + stats.leadClients + ')</button>'
      + '</div>';

    // Table
    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      + '<table class="data-table" id="clients-table"><thead><tr>'
      + '<th>Name</th><th>Address</th><th>Phone</th><th>Email</th><th>Status</th>'
      + '</tr></thead><tbody>';

    if (clients.length === 0) {
      html += '<tr><td colspan="5">' + UI.emptyState('👥', 'No clients yet', 'Add your first client or import from Jobber.', '+ Add Client', 'ClientsPage.showForm()') + '</td></tr>';
    } else {
      clients.forEach(function(c) {
        html += '<tr onclick="ClientsPage.showDetail(\'' + c.id + '\')" data-status="' + c.status + '">'
          + '<td><strong>' + (c.name || '') + '</strong>' + (c.company ? '<br><span style="font-size:12px;color:var(--text-light);">' + c.company + '</span>' : '') + '</td>'
          + '<td style="font-size:13px;color:var(--text-light);">' + (c.address || '—') + '</td>'
          + '<td>' + UI.phone(c.phone) + '</td>'
          + '<td style="font-size:13px;">' + (c.email || '—') + '</td>'
          + '<td>' + UI.statusBadge(c.status) + '</td>'
          + '</tr>';
      });
    }
    html += '</tbody></table></div>';
    return html;
  },

  filter: function(status, btn) {
    document.querySelectorAll('.client-filter').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    document.querySelectorAll('#clients-table tbody tr').forEach(function(tr) {
      if (status === 'all') { tr.style.display = ''; }
      else { tr.style.display = tr.dataset.status === status ? '' : 'none'; }
    });
  },

  showForm: function(id) {
    var c = id ? DB.clients.getById(id) : {};
    var title = id ? 'Edit Client' : 'New Client';

    var html = '<form id="client-form" onsubmit="ClientsPage.save(event, \'' + (id || '') + '\')">'
      + UI.formField('Name *', 'text', 'c-name', c.name, { required: true, placeholder: 'Full name' })
      + UI.formField('Company', 'text', 'c-company', c.company, { placeholder: 'Company name (optional)' })
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      + UI.formField('Phone *', 'tel', 'c-phone', c.phone, { required: true, placeholder: '(914) 555-0000' })
      + UI.formField('Email', 'email', 'c-email', c.email, { placeholder: 'email@example.com' })
      + '</div>'
      + UI.formField('Address', 'text', 'c-address', c.address, { placeholder: 'Street, City, State ZIP' })
      + UI.formField('Status', 'select', 'c-status', c.status || 'lead', { options: [{value:'lead',label:'Lead'},{value:'active',label:'Active'}] })
      + UI.formField('Tags', 'text', 'c-tags', (c.tags || []).join(', '), { placeholder: 'residential, commercial (comma separated)' })
      + UI.formField('Notes', 'textarea', 'c-notes', c.notes, { placeholder: 'Internal notes...' })
      + '</form>';

    UI.showModal(title, html, {
      footer: (id ? '<button class="btn" style="background:#c0392b;color:#fff;margin-right:auto;" onclick="ClientsPage.remove(\'' + id + '\')">Delete</button>' : '')
        + '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-primary" onclick="document.getElementById(\'client-form\').requestSubmit()">Save Client</button>'
    });
  },

  save: function(e, id) {
    e.preventDefault();
    var data = {
      name: document.getElementById('c-name').value.trim(),
      company: document.getElementById('c-company').value.trim(),
      phone: document.getElementById('c-phone').value.trim(),
      email: document.getElementById('c-email').value.trim(),
      address: document.getElementById('c-address').value.trim(),
      status: document.getElementById('c-status').value,
      tags: document.getElementById('c-tags').value.split(',').map(function(t) { return t.trim(); }).filter(Boolean),
      notes: document.getElementById('c-notes').value.trim()
    };
    if (!data.name) { UI.toast('Name is required', 'error'); return; }

    if (id) {
      DB.clients.update(id, data);
      UI.toast('Client updated');
    } else {
      DB.clients.create(data);
      UI.toast('Client created');
    }
    UI.closeModal();
    loadPage('clients');
  },

  remove: function(id) {
    UI.confirm('Delete this client? This cannot be undone.', function() {
      DB.clients.remove(id);
      UI.toast('Client deleted');
      UI.closeModal();
      loadPage('clients');
    });
  },

  showDetail: function(id) {
    var c = DB.clients.getById(id);
    if (!c) return;

    // Get related records
    var clientJobs = DB.jobs.getAll().filter(function(j) { return j.clientId === id; });
    var clientInvoices = DB.invoices.getAll().filter(function(i) { return i.clientId === id; });
    var clientQuotes = DB.quotes.getAll().filter(function(q) { return q.clientId === id; });
    var totalRevenue = clientInvoices.filter(function(i) { return i.status === 'paid'; }).reduce(function(s, i) { return s + (i.total || 0); }, 0);
    var totalOutstanding = clientInvoices.filter(function(i) { return i.status !== 'paid'; }).reduce(function(s, i) { return s + (i.balance || i.total || 0); }, 0);

    // Full-page client detail (Jobber style)
    var html = ''
      // Back button + header
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">'
      + '<button class="btn btn-outline" onclick="loadPage(\'clients\')" style="padding:6px 12px;">← Back</button>'
      + '<div style="flex:1;">'
      + '<h2 style="font-size:22px;margin-bottom:2px;">' + c.name + '</h2>'
      + (c.company ? '<span style="color:var(--text-light);font-size:13px;">' + c.company + '</span>' : '')
      + '</div>'
      + '<div style="display:flex;gap:6px;">'
      + '<button class="btn btn-outline" onclick="ClientsPage.showForm(\'' + id + '\')">Edit</button>'
      + '<button class="btn btn-outline" onclick="QuotesPage.showForm(null,\'' + id + '\')">+ Quote</button>'
      + '<button class="btn btn-primary" onclick="JobsPage.showForm(null,\'' + id + '\')">+ Job</button>'
      + '</div></div>'

      // Stats row
      + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;">'
      + UI.statCard('Revenue', UI.moneyInt(totalRevenue), 'Lifetime', '', '')
      + UI.statCard('Outstanding', UI.moneyInt(totalOutstanding), 'Unpaid', '', '')
      + UI.statCard('Jobs', clientJobs.length.toString(), 'Total', '', '')
      + UI.statCard('Quotes', clientQuotes.length.toString(), 'Total', '', '')
      + '</div>'

      // Two column layout
      + '<div style="display:grid;grid-template-columns:320px 1fr;gap:20px;">'

      // Left sidebar — contact info
      + '<div>'
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:20px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px;">Contact Info</h4>'
      + '<div style="font-size:14px;line-height:2.2;">'
      + (c.address ? '<div style="display:flex;gap:8px;align-items:start;"><span style="color:var(--text-light);width:16px;">📍</span> <span>' + c.address + '</span></div>' : '')
      + (c.phone ? '<div style="display:flex;gap:8px;align-items:center;"><span style="color:var(--text-light);width:16px;">📞</span> <a href="tel:' + c.phone.replace(/\D/g,'') + '" style="color:var(--accent);text-decoration:none;">' + UI.phone(c.phone) + '</a></div>' : '')
      + (c.email ? '<div style="display:flex;gap:8px;align-items:center;"><span style="color:var(--text-light);width:16px;">✉️</span> <a href="mailto:' + c.email + '" style="color:var(--accent);text-decoration:none;font-size:13px;">' + c.email + '</a></div>' : '')
      + '</div>'
      + '<div style="margin-top:12px;">' + UI.statusBadge(c.status) + '</div>'
      + (c.tags && c.tags.length ? '<div style="margin-top:12px;display:flex;gap:4px;flex-wrap:wrap;">' + c.tags.map(function(t) { return '<span style="display:inline-block;padding:3px 10px;background:var(--bg);border-radius:12px;font-size:11px;font-weight:600;color:var(--text-light);">' + t + '</span>'; }).join('') + '</div>' : '')
      + '</div>'

      // Quick actions
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-top:12px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Quick Actions</h4>'
      + (c.phone ? '<a href="tel:' + c.phone.replace(/\D/g,'') + '" class="btn btn-outline" style="width:100%;justify-content:center;margin-bottom:6px;">📞 Call</a>' : '')
      + (c.email ? '<a href="mailto:' + c.email + '" class="btn btn-outline" style="width:100%;justify-content:center;margin-bottom:6px;">✉️ Email</a>' : '')
      + (c.address ? '<a href="https://maps.google.com/?q=' + encodeURIComponent(c.address) + '" target="_blank" class="btn btn-outline" style="width:100%;justify-content:center;margin-bottom:6px;">🗺 Directions</a>' : '')
      + '</div>'

      // Notes
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-top:12px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Notes</h4>'
      + (c.notes ? '<div style="font-size:13px;color:var(--text);line-height:1.6;">' + c.notes + '</div>' : '<div style="font-size:13px;color:var(--text-light);">No notes</div>')
      + '</div>'
      + '</div>'

      // Right content — tabs
      + '<div>'
      + '<div style="display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:16px;">'
      + '<button class="cd-tab active" onclick="ClientsPage._tab(this,\'cd-jobs\');" style="padding:10px 20px;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid var(--accent);margin-bottom:-2px;color:var(--accent);">Jobs (' + clientJobs.length + ')</button>'
      + '<button class="cd-tab" onclick="ClientsPage._tab(this,\'cd-quotes\');" style="padding:10px 20px;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;color:var(--text-light);">Quotes (' + clientQuotes.length + ')</button>'
      + '<button class="cd-tab" onclick="ClientsPage._tab(this,\'cd-invoices\');" style="padding:10px 20px;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;color:var(--text-light);">Invoices (' + clientInvoices.length + ')</button>'
      + '<button class="cd-tab" onclick="ClientsPage._tab(this,\'cd-comms\');" style="padding:10px 20px;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;color:var(--text-light);">Activity</button>'
      + '</div>'

      // Jobs tab
      + '<div id="cd-jobs" class="cd-panel">'
      + (clientJobs.length ? '<table class="data-table"><thead><tr><th>#</th><th>Description</th><th>Date</th><th>Status</th><th>Total</th></tr></thead><tbody>'
        + clientJobs.map(function(j) {
          return '<tr><td><strong>' + (j.jobNumber || '—') + '</strong></td><td>' + (j.description || '—') + '</td><td>' + (j.scheduledDate || '—') + '</td><td>' + UI.statusBadge(j.status) + '</td><td style="font-weight:600;">' + UI.moneyInt(j.total) + '</td></tr>';
        }).join('') + '</tbody></table>' : UI.emptyState('🔧', 'No jobs yet', 'Create a job for this client.', '+ New Job', 'JobsPage.showForm()'))
      + '</div>'

      // Quotes tab
      + '<div id="cd-quotes" class="cd-panel" style="display:none;">'
      + (clientQuotes.length ? '<table class="data-table"><thead><tr><th>#</th><th>Description</th><th>Status</th><th>Total</th></tr></thead><tbody>'
        + clientQuotes.map(function(q) {
          return '<tr><td><strong>' + (q.quoteNumber || '—') + '</strong></td><td>' + (q.description || '—') + '</td><td>' + UI.statusBadge(q.status) + '</td><td style="font-weight:600;">' + UI.money(q.total) + '</td></tr>';
        }).join('') + '</tbody></table>' : UI.emptyState('📋', 'No quotes yet', 'Create a quote for this client.', '+ New Quote', 'QuotesPage.showForm()'))
      + '</div>'

      // Invoices tab
      + '<div id="cd-invoices" class="cd-panel" style="display:none;">'
      + (clientInvoices.length ? '<table class="data-table"><thead><tr><th>#</th><th>Subject</th><th>Date</th><th>Status</th><th>Total</th></tr></thead><tbody>'
        + clientInvoices.map(function(inv) {
          return '<tr><td><strong>' + (inv.invoiceNumber || '—') + '</strong></td><td>' + (inv.subject || '—') + '</td><td>' + (inv.issuedDate || '—') + '</td><td>' + UI.statusBadge(inv.status) + '</td><td style="font-weight:600;">' + UI.money(inv.total) + '</td></tr>';
        }).join('') + '</tbody></table>' : UI.emptyState('💰', 'No invoices yet', 'Create an invoice for this client.'))
      + '</div>'

      // Activity/Comms tab
      + '<div id="cd-comms" class="cd-panel" style="display:none;">';
    if (typeof CommsLog !== 'undefined') {
      html += CommsLog.renderForClient(id);
    }
    if (typeof Photos !== 'undefined') {
      html += Photos.renderGallery('client', id);
    }
    html += '</div></div></div>';

    // Render as full page
    document.getElementById('pageTitle').textContent = c.name;
    document.getElementById('pageContent').innerHTML = html;
    document.getElementById('pageAction').style.display = 'none';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return; // Skip modal below
  },

  _tab: function(btn, panelId) {
    // Deactivate all tabs
    document.querySelectorAll('.cd-tab').forEach(function(t) {
      t.style.borderBottomColor = 'transparent';
      t.style.color = 'var(--text-light)';
      t.classList.remove('active');
    });
    document.querySelectorAll('.cd-panel').forEach(function(p) { p.style.display = 'none'; });
    // Activate clicked
    btn.style.borderBottomColor = 'var(--accent)';
    btn.style.color = 'var(--accent)';
    btn.classList.add('active');
    document.getElementById(panelId).style.display = 'block';
  },

  // Legacy modal version (keeping for reference, not used)
  _showDetailModal: function(id) {
    var c = DB.clients.getById(id);
    if (!c) return;
    UI.showModal(c.name, '<p>Use full-page view instead.</p>', {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Close</button>'
        + ' <button class="btn btn-primary" onclick="UI.closeModal();QuotesPage.showForm(null, \'' + id + '\')">Create Quote</button>'
    });
  }
};

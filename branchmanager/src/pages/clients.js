/**
 * Branch Manager — Clients Page
 * Full client list, detail view, add/edit forms
 */
var ClientsPage = {
  _page: 0,
  _perPage: 50,
  _filter: 'all',
  _search: '',
  _sort: 'name',
  _sortDir: 1,

  render: function() {
    var self = ClientsPage;
    var stats = DB.dashboard.getStats();
    var clients = self._getFiltered();

    var html = '<div class="stat-grid">'
      + UI.statCard('Total Clients', stats.totalClients.toLocaleString(), 'All time', '', '', "ClientsPage.setFilter('all')")
      + UI.statCard('Active', stats.activeClients.toLocaleString(), 'Current clients', '', '', "ClientsPage.setFilter('active')")
      + UI.statCard('Leads', stats.leadClients.toLocaleString(), 'Not yet converted', '', '', "ClientsPage.setFilter('lead')")
      + '</div>';

    // Search + filters
    html += '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center;">'
      + '<div style="flex:1;min-width:200px;position:relative;">'
      + '<input type="text" id="client-search" placeholder="Search by name, address, phone..." value="' + self._search + '" oninput="ClientsPage.setSearch(this.value)" style="width:100%;padding:9px 12px 9px 34px;border:2px solid var(--border);border-radius:8px;font-size:14px;">'
      + '<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-light);">🔍</span>'
      + '</div>'
      + '<div style="display:flex;gap:4px;">';
    ['all', 'active', 'lead'].forEach(function(f) {
      var count = f === 'all' ? stats.totalClients : f === 'active' ? stats.activeClients : stats.leadClients;
      html += '<button class="btn ' + (self._filter === f ? 'btn-primary' : 'btn-outline') + '" onclick="ClientsPage.setFilter(\'' + f + '\')" style="font-size:12px;padding:6px 12px;">' + f.charAt(0).toUpperCase() + f.slice(1) + ' (' + count + ')</button>';
    });
    html += '</div></div>';

    // Results count
    html += '<div style="font-size:12px;color:var(--text-light);margin-bottom:8px;">'
      + 'Showing ' + Math.min(self._page * self._perPage + 1, clients.length) + '–' + Math.min((self._page + 1) * self._perPage, clients.length) + ' of ' + clients.length + ' clients'
      + '</div>';

    // Paginated slice
    var pageClients = clients.slice(self._page * self._perPage, (self._page + 1) * self._perPage);

    // Table with sortable headers
    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      + '<table class="data-table" id="clients-table"><thead><tr>'
      + self._sortHeader('Name', 'name')
      + self._sortHeader('Address', 'address')
      + self._sortHeader('Phone', 'phone')
      + self._sortHeader('Email', 'email')
      + self._sortHeader('Status', 'status')
      + '</tr></thead><tbody>';

    if (pageClients.length === 0) {
      html += '<tr><td colspan="5">' + (self._search ? '<div style="text-align:center;padding:24px;color:var(--text-light);">No clients match "' + self._search + '"</div>' : UI.emptyState('👥', 'No clients yet', 'Add your first client or import from Jobber.', '+ Add Client', 'ClientsPage.showForm()')) + '</td></tr>';
    } else {
      pageClients.forEach(function(c) {
        html += '<tr onclick="ClientsPage.showDetail(\'' + c.id + '\')" style="cursor:pointer;" data-status="' + c.status + '">'
          + '<td><strong>' + (c.name || '') + '</strong>' + (c.company ? '<br><span style="font-size:12px;color:var(--text-light);">' + c.company + '</span>' : '') + '</td>'
          + '<td style="font-size:13px;color:var(--text-light);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (c.address || '—') + '</td>'
          + '<td style="white-space:nowrap;">' + UI.phone(c.phone) + '</td>'
          + '<td style="font-size:13px;max-width:180px;overflow:hidden;text-overflow:ellipsis;">' + (c.email || '—') + '</td>'
          + '<td>' + UI.statusBadge(c.status) + '</td>'
          + '</tr>';
      });
    }
    html += '</tbody></table></div>';

    // Pagination
    var totalPages = Math.ceil(clients.length / self._perPage);
    if (totalPages > 1) {
      html += '<div style="display:flex;justify-content:center;gap:4px;margin-top:12px;">';
      html += '<button class="btn btn-outline" onclick="ClientsPage.goPage(0)" style="font-size:12px;padding:5px 10px;"' + (self._page === 0 ? ' disabled' : '') + '>«</button>';
      html += '<button class="btn btn-outline" onclick="ClientsPage.goPage(' + (self._page - 1) + ')" style="font-size:12px;padding:5px 10px;"' + (self._page === 0 ? ' disabled' : '') + '>‹</button>';
      // Show max 5 page buttons
      var startP = Math.max(0, self._page - 2);
      var endP = Math.min(totalPages - 1, startP + 4);
      for (var p = startP; p <= endP; p++) {
        html += '<button class="btn ' + (p === self._page ? 'btn-primary' : 'btn-outline') + '" onclick="ClientsPage.goPage(' + p + ')" style="font-size:12px;padding:5px 10px;min-width:32px;">' + (p + 1) + '</button>';
      }
      html += '<button class="btn btn-outline" onclick="ClientsPage.goPage(' + (self._page + 1) + ')" style="font-size:12px;padding:5px 10px;"' + (self._page >= totalPages - 1 ? ' disabled' : '') + '>›</button>';
      html += '<button class="btn btn-outline" onclick="ClientsPage.goPage(' + (totalPages - 1) + ')" style="font-size:12px;padding:5px 10px;"' + (self._page >= totalPages - 1 ? ' disabled' : '') + '>»</button>';
      html += '</div>';
    }

    return html;
  },

  _sortHeader: function(label, field) {
    var arrow = ClientsPage._sort === field ? (ClientsPage._sortDir === 1 ? ' ▲' : ' ▼') : '';
    return '<th onclick="ClientsPage.setSort(\'' + field + '\')" style="cursor:pointer;user-select:none;">' + label + '<span style="font-size:10px;color:var(--text-light);">' + arrow + '</span></th>';
  },

  _getFiltered: function() {
    var self = ClientsPage;
    var clients = DB.clients.getAll();

    // Filter by status
    if (self._filter !== 'all') {
      clients = clients.filter(function(c) { return c.status === self._filter; });
    }

    // Search
    if (self._search && self._search.length >= 2) {
      var q = self._search.toLowerCase();
      clients = clients.filter(function(c) {
        return (c.name || '').toLowerCase().indexOf(q) >= 0
          || (c.address || '').toLowerCase().indexOf(q) >= 0
          || (c.phone || '').replace(/\D/g, '').indexOf(q.replace(/\D/g, '')) >= 0
          || (c.email || '').toLowerCase().indexOf(q) >= 0
          || (c.company || '').toLowerCase().indexOf(q) >= 0;
      });
    }

    // Sort
    clients.sort(function(a, b) {
      var va = (a[self._sort] || '').toString().toLowerCase();
      var vb = (b[self._sort] || '').toString().toLowerCase();
      return va < vb ? -self._sortDir : va > vb ? self._sortDir : 0;
    });

    return clients;
  },

  setFilter: function(f) { ClientsPage._filter = f; ClientsPage._page = 0; loadPage('clients'); },
  setSearch: function(q) { ClientsPage._search = q; ClientsPage._page = 0; loadPage('clients'); },
  setSort: function(field) {
    if (ClientsPage._sort === field) { ClientsPage._sortDir *= -1; }
    else { ClientsPage._sort = field; ClientsPage._sortDir = 1; }
    loadPage('clients');
  },
  goPage: function(p) {
    var total = Math.ceil(ClientsPage._getFiltered().length / ClientsPage._perPage);
    ClientsPage._page = Math.max(0, Math.min(p, total - 1));
    loadPage('clients');
  },

  filter: function(status, btn) {
    ClientsPage.setFilter(status);
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

    // Get related records (match by clientId OR clientName since imports may not have IDs linked)
    var cName = (c.name || '').trim().toLowerCase();
    var clientJobs = DB.jobs.getAll().filter(function(j) { return j.clientId === id || (j.clientName || '').trim().toLowerCase() === cName; });
    var clientInvoices = DB.invoices.getAll().filter(function(i) { return i.clientId === id || (i.clientName || '').trim().toLowerCase() === cName; });
    var clientQuotes = DB.quotes.getAll().filter(function(q) { return q.clientId === id || (q.clientName || '').trim().toLowerCase() === cName; });
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
      + '<div class="detail-grid" style="display:grid;grid-template-columns:320px 1fr;gap:20px;">'

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

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

    // Jobber-style stat cards row
    var now = new Date();
    var ago30 = new Date(); ago30.setDate(ago30.getDate()-30);
    var allClients = DB.clients.getAll();
    var newLeads30 = allClients.filter(function(c){ return c.status==='lead' && new Date(c.createdAt)>=ago30; }).length;
    var newClients30 = allClients.filter(function(c){ return c.status==='active' && new Date(c.createdAt)>=ago30; }).length;
    var ytdClients = allClients.filter(function(c){ return new Date(c.createdAt).getFullYear()===now.getFullYear(); }).length;

    var html = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:16px;background:var(--white);" class="stat-row">'
      // New leads
      + '<div onclick="ClientsPage.setFilter(\'lead\')" style="padding:14px 16px;border-right:1px solid var(--border);cursor:pointer;">'
      + '<div style="font-size:14px;font-weight:700;">New leads</div>'
      + '<div style="font-size:12px;color:var(--text-light);">Past 30 days</div>'
      + '<div style="font-size:28px;font-weight:700;margin-top:4px;">' + newLeads30 + '</div>'
      + '</div>'
      // New clients
      + '<div onclick="ClientsPage.setFilter(\'active\')" style="padding:14px 16px;border-right:1px solid var(--border);cursor:pointer;">'
      + '<div style="font-size:14px;font-weight:700;">New clients</div>'
      + '<div style="font-size:12px;color:var(--text-light);">Past 30 days</div>'
      + '<div style="font-size:28px;font-weight:700;margin-top:4px;">' + newClients30 + '</div>'
      + '</div>'
      // Total new clients YTD
      + '<div onclick="ClientsPage.setFilter(\'all\')" style="padding:14px 16px;border-right:1px solid var(--border);cursor:pointer;">'
      + '<div style="font-size:14px;font-weight:700;">Total new clients</div>'
      + '<div style="font-size:12px;color:var(--text-light);">Year to date</div>'
      + '<div style="font-size:28px;font-weight:700;margin-top:4px;">' + ytdClients + '</div>'
      + '</div>'
      // Total
      + '<div style="padding:14px 16px;">'
      + '<div style="font-size:14px;font-weight:700;">All clients</div>'
      + '<div style="font-size:28px;font-weight:700;margin-top:12px;">' + stats.totalClients + '</div>'
      + '</div>'
      + '</div>';

    // Jobber-style header + filter/search
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">'
      + '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">'
      + '<h3 style="font-size:16px;font-weight:700;margin:0;">Filtered clients</h3>'
      + '<span style="font-size:13px;color:var(--text-light);">(' + clients.length + ' results)</span>'
      + '<button class="filter-btn" style="font-size:12px;padding:5px 12px;">Filter by tag +</button>'
      + '<button class="filter-btn' + (self._filter==='all'?' active':'') + '" onclick="ClientsPage.setFilter(\'all\')" style="font-size:12px;padding:5px 12px;">Status | Leads and Active</button>'
      + '</div>'
      + '<div class="search-box" style="min-width:200px;max-width:280px;">'
      + '<span style="color:var(--text-light);">🔍</span>'
      + '<input type="text" id="client-search" placeholder="Search clients..." value="' + UI.esc(self._search) + '" oninput="ClientsPage.setSearch(this.value)">'
      + '</div></div>';

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
          + '<td><strong>' + UI.esc(c.name || '') + '</strong>' + (c.company ? '<br><span style="font-size:12px;color:var(--text-light);">' + UI.esc(c.company) + '</span>' : '') + '</td>'
          + '<td style="font-size:13px;color:var(--text-light);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + UI.esc(c.address || '—') + '</td>'
          + '<td style="white-space:nowrap;">' + UI.phone(c.phone) + '</td>'
          + '<td style="font-size:13px;max-width:180px;overflow:hidden;text-overflow:ellipsis;">' + UI.esc(c.email || '—') + '</td>'
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

    // Jobber-style client detail
    var html = ''
      // Breadcrumb
      + '<div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">'
      + '<a onclick="loadPage(\'clients\')" style="color:var(--text-light);cursor:pointer;text-decoration:none;">Second Nature Tree</a>'
      + ' | <span style="color:var(--text);">' + UI.esc(c.name) + '</span></div>'

      // Action buttons (right-aligned)
      + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:16px;">'
      + (c.email ? '<button class="btn btn-primary" onclick="window.location.href=\'mailto:' + c.email + '\'">✉️ Email</button>' : '')
      + '<button class="btn btn-outline" onclick="ClientsPage.showForm(\'' + id + '\')">✏️ Edit</button>'
      + '<button class="btn btn-outline">··· More Actions</button>'
      + '</div>'

      // Client name (big, like Jobber)
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">'
      + '<div style="width:48px;height:48px;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--text-light);">👤</div>'
      + '<h2 style="font-size:28px;font-weight:700;">' + UI.esc(c.name) + '</h2>'
      + '</div>'

      // Two column: Properties (left) + Contact info (right)
      + '<div class="detail-grid" style="display:grid;grid-template-columns:1.2fr 1fr;gap:20px;">'

      // Left — Properties card
      + '<div>'
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:20px;margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
      + '<h3 style="font-size:18px;font-weight:700;">Properties</h3>'
      + '<button class="btn btn-outline" style="font-size:12px;padding:5px 12px;" onclick="ClientsPage.showForm(\'' + id + '\')">+ New Property</button>'
      + '</div>'
      + (c.address ? '<div style="display:flex;gap:12px;align-items:start;">'
        + '<div style="width:36px;height:36px;border-radius:8px;background:#e8f5e9;display:flex;align-items:center;justify-content:center;color:#2e7d32;">📍</div>'
        + '<div style="font-size:14px;line-height:1.6;">' + UI.esc(c.address).replace(/,/g, '<br>') + '</div>'
        + '</div>' : '<div style="color:var(--text-light);font-size:13px;">No property address</div>')
      + '</div>'

      // Schedule section
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:20px;margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">'
      + '<h3 style="font-size:18px;font-weight:700;">Schedule</h3>'
      + '<button class="btn btn-outline" style="font-size:12px;padding:5px 12px;" onclick="JobsPage.showForm(null,\'' + id + '\')">New</button>'
      + '</div>';
    var upcomingJobs = clientJobs.filter(function(j){ return j.status==='scheduled'||j.status==='in_progress'; });
    var overdueJobs = clientJobs.filter(function(j){ return j.status==='late'; });
    if (overdueJobs.length) {
      html += '<div style="color:#dc3545;font-size:13px;font-weight:600;margin-bottom:8px;">Overdue</div>';
      overdueJobs.forEach(function(j) {
        html += '<div style="padding:8px 0;border-bottom:1px solid var(--bg);font-size:13px;cursor:pointer;" onclick="JobsPage.showDetail(\'' + j.id + '\')">'
          + '<strong>' + (j.description || 'Job #' + j.jobNumber) + '</strong><br>'
          + '<span style="color:var(--text-light);">' + UI.dateShort(j.scheduledDate) + '</span></div>';
      });
    }
    if (upcomingJobs.length) {
      upcomingJobs.forEach(function(j) {
        html += '<div style="padding:8px 0;border-bottom:1px solid var(--bg);font-size:13px;cursor:pointer;" onclick="JobsPage.showDetail(\'' + j.id + '\')">'
          + '<strong>' + (j.description || 'Job #' + j.jobNumber) + '</strong><br>'
          + '<span style="color:var(--text-light);">' + UI.dateShort(j.scheduledDate) + '</span></div>';
      });
    }
    if (!upcomingJobs.length && !overdueJobs.length) {
      html += '<div style="color:var(--text-light);font-size:13px;">No upcoming schedule</div>';
    }
    html += '</div>'

      // Recent pricing
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:20px;">'
      + '<h3 style="font-size:18px;font-weight:700;margin-bottom:12px;">Recent pricing for this property</h3>';
    var recentLineItems = [];
    clientQuotes.forEach(function(q) {
      if (q.lineItems) q.lineItems.forEach(function(li) {
        recentLineItems.push({ service: li.service, quoted: li.amount || (li.qty * li.rate), type: 'quoted' });
      });
    });
    if (recentLineItems.length) {
      html += '<table style="width:100%;font-size:13px;border-collapse:collapse;">'
        + '<tr style="text-transform:uppercase;font-size:10px;font-weight:600;color:var(--text-light);letter-spacing:.05em;"><td style="padding:6px 0;">Line Item</td><td style="padding:6px 0;text-align:right;">Quoted</td></tr>';
      recentLineItems.slice(0, 5).forEach(function(li) {
        html += '<tr><td style="padding:6px 0;">' + (li.service || 'Custom') + '</td><td style="padding:6px 0;text-align:right;">' + UI.money(li.quoted) + '</td></tr>';
      });
      html += '</table>';
    } else {
      html += '<div style="color:var(--text-light);font-size:13px;">No pricing history</div>';
    }
    html += '</div></div>'

      // Right — Contact info + Tags + Internal notes
      + '<div>'
      + '<div style="margin-bottom:16px;">'
      + '<h3 style="font-size:18px;font-weight:700;margin-bottom:12px;">Contact info</h3>'
      + '<table style="width:100%;font-size:14px;border-collapse:collapse;">'
      + (c.phone ? '<tr><td style="padding:8px 0;color:var(--text-light);width:60px;">Main</td><td style="padding:8px 0;"><a href="tel:' + c.phone.replace(/\D/g,'') + '" style="color:var(--text);text-decoration:none;">' + UI.phone(c.phone) + '</a></td></tr>' : '')
      + (c.email ? '<tr><td style="padding:8px 0;color:var(--text-light);">Main</td><td style="padding:8px 0;"><a href="mailto:' + c.email + '" style="color:#1565c0;text-decoration:none;">' + c.email + '</a></td></tr>' : '')
      + '<tr><td style="padding:8px 0;color:var(--text-light);">Status</td><td style="padding:8px 0;">' + UI.statusBadge(c.status) + '</td></tr>'
      + '<tr><td style="padding:8px 0;color:var(--text-light);">Revenue</td><td style="padding:8px 0;font-weight:600;">' + UI.moneyInt(totalRevenue) + '</td></tr>'
      + '<tr><td style="padding:8px 0;color:var(--text-light);">Owed</td><td style="padding:8px 0;' + (totalOutstanding > 0 ? 'color:var(--red);font-weight:600;' : '') + '">' + UI.moneyInt(totalOutstanding) + '</td></tr>'
      + '</table></div>'

      // Tags
      + '<div style="margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
      + '<h3 style="font-size:18px;font-weight:700;">Tags</h3>'
      + '<button class="btn btn-outline" style="font-size:12px;padding:4px 10px;" onclick="ClientsPage.showForm(\'' + id + '\')">+ New Tag</button>'
      + '</div>'
      + (c.tags && c.tags.length ? '<div style="display:flex;gap:4px;flex-wrap:wrap;">' + c.tags.map(function(t) { return '<span style="display:inline-block;padding:4px 12px;background:var(--bg);border-radius:12px;font-size:12px;font-weight:600;color:var(--text-light);">' + UI.esc(t) + '</span>'; }).join('') + '</div>' : '<div style="font-size:13px;color:var(--text-light);font-style:italic;">This client has no tags</div>')
      + '</div>'

      // Internal notes
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;">'
      + '<h3 style="font-size:18px;font-weight:700;margin-bottom:4px;">Internal notes</h3>'
      + '<div style="font-size:12px;color:var(--text-light);margin-bottom:12px;">Internal notes will only be seen by your team</div>'
      + (c.notes ? '<div style="font-size:13px;color:var(--text);line-height:1.6;padding:8px;background:var(--bg);border-radius:6px;">' + UI.esc(c.notes) + '</div>' : '<textarea placeholder="Note details" style="width:100%;height:80px;border:1px solid var(--border);border-radius:6px;padding:8px;font-size:13px;resize:vertical;" readonly></textarea>')
      + '</div>'
      + '</div></div>'

      // Notes
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-top:12px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Notes</h4>'
      + (c.notes ? '<div style="font-size:13px;color:var(--text);line-height:1.6;">' + UI.esc(c.notes) + '</div>' : '<div style="font-size:13px;color:var(--text-light);">No notes</div>')
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

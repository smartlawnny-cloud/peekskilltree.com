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

    var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">'
      // Left: Contact Info
      + '<div>'
      + '<div style="margin-bottom:16px;">'
      + '<h2 style="font-size:22px;margin-bottom:4px;">' + c.name + '</h2>'
      + (c.company ? '<div style="color:var(--text-light);">' + c.company + '</div>' : '')
      + '<div style="margin-top:8px;">' + UI.statusBadge(c.status) + '</div>'
      + '</div>'
      + '<div style="font-size:14px;line-height:2;">'
      + (c.address ? '<div>📍 ' + c.address + '</div>' : '')
      + (c.phone ? '<div>📞 <a href="tel:' + c.phone.replace(/\D/g,'') + '">' + UI.phone(c.phone) + '</a></div>' : '')
      + (c.email ? '<div>✉️ <a href="mailto:' + c.email + '">' + c.email + '</a></div>' : '')
      + '</div>'
      + (c.tags && c.tags.length ? '<div style="margin-top:12px;">' + c.tags.map(function(t) { return '<span style="display:inline-block;padding:2px 8px;background:var(--bg);border-radius:12px;font-size:12px;margin:2px;">' + t + '</span>'; }).join('') + '</div>' : '')
      + (c.notes ? '<div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:8px;font-size:13px;color:var(--text-light);">' + c.notes + '</div>' : '')
      + '</div>'

      // Right: Activity
      + '<div>'
      + '<h4 style="margin-bottom:8px;">Jobs (' + clientJobs.length + ')</h4>'
      + (clientJobs.length ? '<div style="font-size:13px;">' + clientJobs.slice(0, 5).map(function(j) {
          return '<div style="padding:6px 0;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;">'
            + '<span>#' + j.jobNumber + ' ' + (j.description || '') + '</span>'
            + '<span>' + UI.statusBadge(j.status) + ' ' + UI.moneyInt(j.total) + '</span></div>';
        }).join('') + '</div>' : '<div style="font-size:13px;color:var(--text-light);">No jobs</div>')
      + '<h4 style="margin:16px 0 8px;">Invoices (' + clientInvoices.length + ')</h4>'
      + (clientInvoices.length ? '<div style="font-size:13px;">' + clientInvoices.slice(0, 5).map(function(i) {
          return '<div style="padding:6px 0;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;">'
            + '<span>#' + i.invoiceNumber + ' ' + (i.subject || '') + '</span>'
            + '<span>' + UI.statusBadge(i.status) + ' ' + UI.money(i.total) + '</span></div>';
        }).join('') + '</div>' : '<div style="font-size:13px;color:var(--text-light);">No invoices</div>')
      + '</div></div>';

    UI.showModal(c.name, html, {
      wide: true,
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Close</button>'
        + ' <button class="btn btn-primary" onclick="UI.closeModal();ClientsPage.showForm(\'' + id + '\')">Edit Client</button>'
        + ' <button class="btn btn-primary" onclick="UI.closeModal();QuotesPage.showForm(null, \'' + id + '\')">Create Quote</button>'
    });
  }
};

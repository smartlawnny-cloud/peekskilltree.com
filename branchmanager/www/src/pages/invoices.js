/**
 * Branch Manager — Invoices Page
 */
var InvoicesPage = {
  _page: 0, _perPage: 50, _search: '', _filter: 'all', _sortCol: 'invoiceNumber', _sortDir: 'desc',

  render: function() {
    var self = InvoicesPage;
    var all = DB.invoices.getAll();
    var receivable = DB.invoices.totalReceivable();
    var unpaid = all.filter(function(i) { return i.status !== 'paid'; });
    var draft = all.filter(function(i) { return i.status === 'draft'; }).length;
    var paid = all.filter(function(i) { return i.status === 'paid'; }).length;

    // Jobber-style stat cards row
    var now = new Date();
    var pastDue = all.filter(function(i) { return i.status !== 'paid' && i.dueDate && new Date(i.dueDate) < now; });
    var sentNotDue = all.filter(function(i) { return i.status === 'sent' && (!i.dueDate || new Date(i.dueDate) >= now); });
    var pastDueTotal = pastDue.reduce(function(s,i){return s+(i.balance||0);},0);
    var sentNotDueTotal = sentNotDue.reduce(function(s,i){return s+(i.balance||0);},0);
    var draftTotal = all.filter(function(i){return i.status==='draft';}).reduce(function(s,i){return s+(i.total||0);},0);
    var recentIssued = all.filter(function(i) { var d=new Date(i.createdAt); var ago=new Date(); ago.setDate(ago.getDate()-30); return d>=ago; });
    var recentIssuedTotal = recentIssued.reduce(function(s,i){return s+(i.total||0);},0);
    var avgInvoice = recentIssued.length > 0 ? Math.round(recentIssuedTotal / recentIssued.length) : 0;

    var html = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:16px;background:var(--white);" class="stat-row">'
      // Overview
      + '<div onclick="InvoicesPage._setFilter(\'all\')" style="padding:14px 16px;border-right:1px solid var(--border);cursor:pointer;">'
      + '<div style="font-size:14px;font-weight:700;margin-bottom:8px;">Overview</div>'
      + '<div style="display:flex;justify-content:space-between;font-size:12px;"><span><span style="color:#dc3545;">●</span> Past due (' + pastDue.length + ')</span><span>' + UI.moneyInt(pastDueTotal) + '</span></div>'
      + '<div style="display:flex;justify-content:space-between;font-size:12px;"><span><span style="color:#e6a817;">●</span> Sent but not due (' + sentNotDue.length + ')</span><span>' + UI.moneyInt(sentNotDueTotal) + '</span></div>'
      + '<div style="display:flex;justify-content:space-between;font-size:12px;"><span><span style="color:#6c757d;">●</span> Draft (' + draft + ')</span><span>' + UI.moneyInt(draftTotal) + '</span></div>'
      + '</div>'
      // Issued
      + '<div style="padding:14px 16px;border-right:1px solid var(--border);">'
      + '<div style="font-size:14px;font-weight:700;">Issued</div>'
      + '<div style="font-size:12px;color:var(--text-light);">Past 30 days</div>'
      + '<div style="font-size:28px;font-weight:700;margin-top:4px;">' + recentIssued.length + '</div>'
      + '<div style="font-size:12px;color:var(--text-light);">' + UI.moneyInt(recentIssuedTotal) + '</div>'
      + '</div>'
      // Average invoice
      + '<div style="padding:14px 16px;border-right:1px solid var(--border);">'
      + '<div style="font-size:14px;font-weight:700;">Average invoice</div>'
      + '<div style="font-size:12px;color:var(--text-light);">Past 30 days</div>'
      + '<div style="font-size:28px;font-weight:700;margin-top:4px;">' + UI.moneyInt(avgInvoice) + '</div>'
      + '</div>'
      // Payment time
      + '<div style="padding:14px 16px;">'
      + '<div style="font-size:14px;font-weight:700;">Invoice payment time</div>'
      + '<div style="font-size:28px;font-weight:700;margin-top:12px;">' + paid + '</div>'
      + '<div style="font-size:12px;color:var(--text-light);">Paid invoices</div>'
      + '</div>'
      + '</div>';

    var filtered = self._getFiltered();
    var page = filtered.slice(self._page * self._perPage, (self._page + 1) * self._perPage);

    // Jobber-style header + filter chips + search
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">'
      + '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">'
      + '<h3 style="font-size:16px;font-weight:700;margin:0;">All invoices</h3>'
      + '<span style="font-size:13px;color:var(--text-light);">(' + filtered.length + ' results)</span>'
      + (function() {
        var chips = [['all','All'],['draft','Draft'],['sent','Sent'],['past_due','Past Due'],['paid','Paid']];
        var out = '';
        for (var ci = 0; ci < chips.length; ci++) {
          var val = chips[ci][0], label = chips[ci][1];
          var isActive = self._filter === val;
          out += '<button onclick="InvoicesPage._setFilter(\'' + val + '\')" style="font-size:12px;padding:5px 14px;border-radius:20px;border:1px solid ' + (isActive ? '#2e7d32' : 'var(--border)') + ';background:' + (isActive ? '#2e7d32' : 'var(--white)') + ';color:' + (isActive ? '#fff' : 'var(--text)') + ';cursor:pointer;font-weight:' + (isActive ? '600' : '500') + ';">' + label + '</button>';
        }
        return out;
      })()
      + '</div>'
      + '<div class="search-box" style="min-width:200px;max-width:280px;">'
      + '<span style="color:var(--text-light);">🔍</span>'
      + '<input type="text" placeholder="Search invoices..." value="' + UI.esc(self._search) + '" oninput="InvoicesPage._search=this.value;InvoicesPage._page=0;loadPage(\'invoices\')">'
      + '</div></div>';

    // Floating batch action bar (fixed to bottom)
    html += '<div id="inv-batch-bar" style="display:none;position:fixed;bottom:0;left:var(--sidebar-w,240px);right:0;z-index:500;background:#1a1a2e;color:#fff;padding:12px 24px;align-items:center;justify-content:space-between;box-shadow:0 -4px 20px rgba(0,0,0,.3);animation:invBatchSlideUp .25s ease-out;">'
      + '<span id="inv-batch-count" style="font-weight:700;font-size:14px;">0 selected</span>'
      + '<div style="display:flex;gap:8px;align-items:center;">'
      + '<button onclick="InvoicesPage._batchPaid()" style="background:#2e7d32;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">Mark Paid</button>'
      + '<button onclick="InvoicesPage._batchSendAll()" style="background:#2e7d32;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">Send All</button>'
      + '<button onclick="InvoicesPage._batchExport()" style="background:#2e7d32;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">Export</button>'
      + '<button onclick="InvoicesPage._batchClear()" style="background:none;color:rgba(255,255,255,.7);border:none;padding:8px 12px;font-size:16px;cursor:pointer;">&#10005;</button>'
      + '</div></div>'
      + '<style>@keyframes invBatchSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}</style>';

    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      + '<table class="data-table"><thead><tr>'
      + '<th style="width:32px;"><input type="checkbox" onchange="InvoicesPage._selectAll(this.checked)" style="width:16px;height:16px;"></th>'
      + self._sortTh('Client', 'clientName') + self._sortTh('#', 'invoiceNumber') + self._sortTh('Due', 'dueDate') + '<th>Subject</th>' + self._sortTh('Status', 'status') + self._sortTh('Total', 'total', 'text-align:right;') + self._sortTh('Balance', 'balance', 'text-align:right;')
      + '</tr></thead><tbody>';

    if (page.length === 0) {
      html += '<tr><td colspan="8">' + (self._search ? '<div style="text-align:center;padding:24px;color:var(--text-light);">No invoices match "' + self._search + '"</div>' : UI.emptyState('💰', 'No invoices yet', 'Complete a job and create an invoice.')) + '</td></tr>';
    } else {
      page.forEach(function(inv) {
        html += '<tr style="cursor:pointer;" onclick="InvoicesPage.showDetail(\'' + inv.id + '\')">'
          + '<td onclick="event.stopPropagation()"><input type="checkbox" class="inv-check" value="' + inv.id + '" onchange="InvoicesPage._updateBulk()" style="width:16px;height:16px;"></td>'
          + '<td><strong>' + UI.esc(inv.clientName || '—') + '</strong></td>'
          + '<td>#' + (inv.invoiceNumber || '') + '</td>'
          + '<td style="white-space:nowrap;">' + UI.dateShort(inv.dueDate) + '</td>'
          + '<td style="font-size:13px;color:var(--text-light);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + UI.esc(inv.subject || '—') + '</td>'
          + '<td>' + UI.statusBadge(inv.status) + '</td>'
          + '<td style="text-align:right;font-weight:600;">' + UI.money(inv.total) + '</td>'
          + '<td style="text-align:right;font-weight:600;color:' + ((inv.balance||0) > 0 ? 'var(--red)' : 'var(--accent)') + ';">' + UI.money(inv.balance || 0) + '</td>'
          + '</tr>';
      });
    }
    html += '</tbody></table></div>';

    // Pagination
    var totalPages = Math.ceil(filtered.length / self._perPage);
    if (totalPages > 1) {
      html += '<div style="display:flex;justify-content:center;gap:4px;margin-top:12px;">';
      html += '<button class="btn btn-outline" onclick="InvoicesPage._goPage(' + (self._page - 1) + ')" style="font-size:12px;padding:5px 10px;"' + (self._page === 0 ? ' disabled' : '') + '>‹</button>';
      for (var p = Math.max(0, self._page - 2); p <= Math.min(totalPages - 1, self._page + 2); p++) {
        html += '<button class="btn ' + (p === self._page ? 'btn-primary' : 'btn-outline') + '" onclick="InvoicesPage._goPage(' + p + ')" style="font-size:12px;padding:5px 10px;min-width:32px;">' + (p + 1) + '</button>';
      }
      html += '<button class="btn btn-outline" onclick="InvoicesPage._goPage(' + (self._page + 1) + ')" style="font-size:12px;padding:5px 10px;"' + (self._page >= totalPages - 1 ? ' disabled' : '') + '>›</button>';
      html += '</div>';
    }
    return html;
  },

  _getFiltered: function() {
    var self = InvoicesPage;
    var all = DB.invoices.getAll();
    if (self._filter === 'unpaid') all = all.filter(function(i) { return i.status !== 'paid'; });
    else if (self._filter === 'past_due') all = all.filter(function(i) { var now = new Date(); return i.status !== 'paid' && i.dueDate && new Date(i.dueDate) < now; });
    else if (self._filter !== 'all') all = all.filter(function(i) { return i.status === self._filter; });
    if (self._search && self._search.length >= 2) {
      var s = self._search.toLowerCase();
      all = all.filter(function(i) { return (i.clientName||'').toLowerCase().indexOf(s) >= 0 || (i.subject||'').toLowerCase().indexOf(s) >= 0 || String(i.invoiceNumber).indexOf(s) >= 0; });
    }
    var col = self._sortCol;
    var dir = self._sortDir === 'asc' ? 1 : -1;
    all.sort(function(a, b) {
      var va = a[col], vb = b[col];
      if (col === 'invoiceNumber' || col === 'total' || col === 'balance') return ((va || 0) - (vb || 0)) * dir;
      if (col === 'dueDate') return ((new Date(va || 0)).getTime() - (new Date(vb || 0)).getTime()) * dir;
      va = (va || '').toString().toLowerCase(); vb = (vb || '').toString().toLowerCase();
      return va < vb ? -1 * dir : va > vb ? 1 * dir : 0;
    });
    return all;
  },
  _sortTh: function(label, col, extraStyle) {
    var self = InvoicesPage;
    var arrow = self._sortCol === col ? (self._sortDir === 'asc' ? ' &#9650;' : ' &#9660;') : '';
    return '<th onclick="InvoicesPage._setSort(\'' + col + '\')" style="cursor:pointer;user-select:none;' + (extraStyle || '') + '"' + (self._sortCol === col ? ' class="sort-active"' : '') + '>' + label + arrow + '</th>';
  },
  _setSort: function(col) {
    if (InvoicesPage._sortCol === col) { InvoicesPage._sortDir = InvoicesPage._sortDir === 'asc' ? 'desc' : 'asc'; }
    else { InvoicesPage._sortCol = col; InvoicesPage._sortDir = 'asc'; }
    InvoicesPage._page = 0; loadPage('invoices');
  },
  _setFilter: function(f) { InvoicesPage._filter = f; InvoicesPage._page = 0; loadPage('invoices'); },
  _goPage: function(p) { var t = Math.ceil(InvoicesPage._getFiltered().length / InvoicesPage._perPage); InvoicesPage._page = Math.max(0, Math.min(p, t - 1)); loadPage('invoices'); },

  _selectAll: function(checked) {
    document.querySelectorAll('.inv-check').forEach(function(cb) { cb.checked = checked; });
    InvoicesPage._updateBatchBar();
  },
  _updateBulk: function() {
    InvoicesPage._updateBatchBar();
  },
  _updateBatchBar: function() {
    var selected = document.querySelectorAll('.inv-check:checked');
    var bar = document.getElementById('inv-batch-bar');
    var count = document.getElementById('inv-batch-count');
    if (bar) bar.style.display = selected.length > 0 ? 'flex' : 'none';
    if (count) count.textContent = selected.length + ' selected';
  },
  _getSelected: function() {
    return Array.from(document.querySelectorAll('.inv-check:checked')).map(function(cb) { return cb.value; });
  },
  _batchPaid: function() {
    var ids = InvoicesPage._getSelected();
    if (ids.length === 0) return;
    UI.confirm('Mark ' + ids.length + ' invoice' + (ids.length > 1 ? 's' : '') + ' as paid?', function() {
      ids.forEach(function(id) {
        if (typeof Workflow !== 'undefined') {
          Workflow.markPaid(id, 'bulk');
        } else {
          DB.invoices.update(id, { status: 'paid', balance: 0, paidDate: new Date().toISOString() });
        }
      });
      UI.toast(ids.length + ' invoice' + (ids.length > 1 ? 's' : '') + ' marked paid');
      loadPage('invoices');
    });
  },
  _batchReminder: function() {
    var ids = InvoicesPage._getSelected();
    if (ids.length === 0) return;
    var sent = 0;
    ids.forEach(function(id) {
      var inv = DB.invoices.getById(id);
      if (inv && inv.status !== 'paid') {
        if (typeof Workflow !== 'undefined') { Workflow.sendInvoice(id); }
        sent++;
      }
    });
    UI.toast('Reminders queued for ' + sent + ' invoice' + (sent !== 1 ? 's' : ''));
    loadPage('invoices');
  },
  _batchSendAll: function() {
    var ids = InvoicesPage._getSelected();
    if (ids.length === 0) return;
    UI.confirm('Mark ' + ids.length + ' invoice' + (ids.length > 1 ? 's' : '') + ' as sent?', function() {
      var count = 0;
      ids.forEach(function(id) {
        var inv = DB.invoices.getById(id);
        if (inv && inv.status !== 'paid') {
          DB.invoices.update(id, { status: 'sent' });
          count++;
        }
      });
      UI.toast(count + ' invoice' + (count > 1 ? 's' : '') + ' marked sent');
      loadPage('invoices');
    });
  },
  _batchExport: function() {
    var ids = InvoicesPage._getSelected();
    if (ids.length === 0) return;
    var rows = ['Invoice #,Client,Subject,Status,Due Date,Total,Balance'];
    ids.forEach(function(id) {
      var inv = DB.invoices.getById(id);
      if (!inv) return;
      rows.push(
        '"' + (inv.invoiceNumber || '') + '",'
        + '"' + (inv.clientName || '').replace(/"/g, '""') + '",'
        + '"' + (inv.subject || '').replace(/"/g, '""') + '",'
        + '"' + (inv.status || '') + '",'
        + '"' + (inv.dueDate || '') + '",'
        + '"' + (inv.total || 0) + '",'
        + '"' + (inv.balance || 0) + '"'
      );
    });
    var csv = rows.join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'invoices-export-' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    UI.toast(ids.length + ' invoice' + (ids.length > 1 ? 's' : '') + ' exported');
  },
  _batchClear: function() {
    document.querySelectorAll('.inv-check').forEach(function(cb) { cb.checked = false; });
    var headerCheck = document.querySelector('th input[type="checkbox"]');
    if (headerCheck) headerCheck.checked = false;
    InvoicesPage._updateBatchBar();
  },

  showDetail: function(id) {
    var inv = DB.invoices.getById(id);
    if (!inv) return;

    var statusColors = {draft:'#6c757d',sent:'#1565c0',viewed:'#e07c24',partial:'#e6a817',paid:'#2e7d32',overdue:'#dc3545',cancelled:'#6c757d'};
    var statusColor = statusColors[inv.status] || '#1565c0';

    // Look up client for contact info
    var client = inv.clientId ? DB.clients.getById(inv.clientId) : null;
    var clientPhone = inv.clientPhone || (client ? client.phone : '');
    var clientEmail = inv.clientEmail || (client ? client.email : '');
    var clientAddr = client ? client.address : '';

    var html = '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:20px;">'
      // Colored status bar
      + '<div style="height:4px;background:' + statusColor + ';margin:-24px -24px 16px -24px;border-radius:12px 12px 0 0;"></div>'
      // Status + actions row
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px;">'
      + '<div style="display:flex;align-items:center;gap:10px;">'
      + '<button class="btn btn-outline" onclick="loadPage(\'invoices\')" style="padding:6px 12px;font-size:12px;">← Back</button>'
      + UI.statusBadge(inv.status)
      + '</div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;">'
      + '<button class="btn btn-outline" onclick="PDF.generateInvoice(\'' + id + '\')" style="font-size:12px;">PDF</button>'
      + '<button class="btn btn-outline" onclick="if(typeof Workflow!==\'undefined\')Workflow.sendInvoice(\'' + id + '\');" style="font-size:12px;">Send</button>'
      + (inv.status !== 'paid' ? '<button class="btn btn-primary" onclick="if(typeof Workflow!==\'undefined\')Workflow.markPaid(\'' + id + '\',\'cash\');InvoicesPage.showDetail(\'' + id + '\');" style="font-size:12px;">Mark Paid</button>' : '')
      + '</div></div>'
      // Title
      + '<h2 style="font-size:24px;font-weight:700;margin-bottom:4px;">Invoice for ' + UI.esc(inv.clientName || 'Client') + '</h2>'
      + '<div style="font-size:14px;color:var(--text-light);margin-bottom:20px;">Invoice #' + (inv.invoiceNumber || '') + (inv.subject ? ' — ' + UI.esc(inv.subject) : '') + '</div>'

      // Two-column: Client card + metadata
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;" class="detail-grid">'
      // Client card
      + '<div style="background:var(--bg);border-radius:8px;padding:16px;">'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">'
      + '<div style="width:10px;height:10px;border-radius:50%;background:' + statusColor + ';"></div>'
      + '<span style="font-weight:700;font-size:15px;">' + UI.esc(inv.clientName || '—') + '</span></div>'
      + (clientAddr ? '<div style="font-size:13px;color:var(--text-light);margin-bottom:8px;">📍 ' + UI.esc(clientAddr) + '</div>' : '')
      + (clientPhone ? '<a href="tel:' + clientPhone.replace(/\D/g,'') + '" style="display:block;font-size:13px;color:var(--accent);margin-bottom:4px;">📞 ' + UI.phone(clientPhone) + '</a>' : '')
      + (clientEmail ? '<a href="mailto:' + clientEmail + '" style="display:block;font-size:13px;color:var(--accent);">✉️ ' + clientEmail + '</a>' : '')
      + '</div>'
      // Metadata table
      + '<div style="background:var(--bg);border-radius:8px;padding:16px;">'
      + '<table style="width:100%;font-size:13px;border-collapse:collapse;">'
      + '<tr><td style="padding:4px 0;color:var(--text-light);">Invoice #</td><td style="padding:4px 0;text-align:right;font-weight:600;">' + (inv.invoiceNumber || '—') + '</td></tr>'
      + '<tr><td style="padding:4px 0;color:var(--text-light);">Issued</td><td style="padding:4px 0;text-align:right;">' + UI.dateShort(inv.issuedDate || inv.createdAt) + '</td></tr>'
      + '<tr><td style="padding:4px 0;color:var(--text-light);">Due</td><td style="padding:4px 0;text-align:right;">' + UI.dateShort(inv.dueDate) + '</td></tr>'
      + '<tr><td style="padding:4px 0;color:var(--text-light);">Total</td><td style="padding:4px 0;text-align:right;font-weight:700;">' + UI.money(inv.total) + '</td></tr>'
      + '<tr><td style="padding:4px 0;color:var(--text-light);">Paid</td><td style="padding:4px 0;text-align:right;font-weight:700;color:var(--accent);">' + UI.money((inv.total||0) - (inv.balance||0)) + '</td></tr>'
      + '<tr style="border-top:1px solid var(--border);"><td style="padding:6px 0;color:var(--text-light);font-weight:700;">Balance</td><td style="padding:6px 0;text-align:right;font-weight:800;font-size:15px;color:' + (inv.balance > 0 ? 'var(--red)' : 'var(--accent)') + ';">' + UI.money(inv.balance || 0) + '</td></tr>'
      + '</table></div>'
      + '</div></div>';

    // Main content area
    html += '<div style="display:grid;grid-template-columns:1fr 300px;gap:20px;margin-top:20px;" class="detail-grid"><div>';

    // Line items
    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:16px;">'
      + '<div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin:0;">Products / Services</h4></div>';
    if (inv.lineItems && inv.lineItems.length) {
      html += '<table class="data-table" style="border:none;border-radius:0;"><thead><tr><th>Service</th><th>Description</th><th>Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amount</th></tr></thead><tbody>';
      inv.lineItems.forEach(function(item) {
        html += '<tr><td style="font-weight:600;">' + (item.service || 'Custom') + '</td><td style="color:var(--text-light);">' + (item.description || '') + '</td><td>' + (item.qty || 1) + '</td><td style="text-align:right;">' + UI.money(item.rate) + '</td><td style="text-align:right;font-weight:600;">' + UI.money(item.amount || (item.qty||1) * item.rate) + '</td></tr>';
      });
      html += '<tr style="background:var(--green-bg);"><td colspan="4" style="text-align:right;font-weight:700;">Total</td><td style="text-align:right;font-weight:800;font-size:15px;color:var(--accent);">' + UI.money(inv.total) + '</td></tr>';
      html += '</tbody></table>';
    } else {
      html += '<div style="padding:20px;text-align:center;color:var(--text-light);font-size:13px;">No line items</div>';
    }
    html += '</div>';

    // Payment history
    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Payment History</h4>';
    if (typeof Payments !== 'undefined') { html += Payments.renderForInvoice(id); }
    else { html += '<div style="color:var(--text-light);font-size:13px;">No payments recorded</div>'; }
    html += '</div></div>';

    // Right sidebar
    html += '<div>';
    // Record Payment
    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Record Payment</h4>';
    if (inv.status !== 'paid') {
      if (typeof Workflow !== 'undefined') {
        html += Workflow.invoiceActions(id);
      } else if (typeof Stripe !== 'undefined') {
        html += Stripe.paymentButton(id);
      }
      if (typeof Stripe !== 'undefined' && inv.balance > 0) {
        var fees = Stripe.calcFees(inv.balance || inv.total);
        html += '<div style="margin-top:10px;font-size:12px;color:var(--text-light);display:flex;gap:16px;flex-wrap:wrap;">'
          + '<span>Card fee: $' + fees.card.toFixed(2) + '</span>'
          + '<span>ACH fee: $' + fees.ach.toFixed(2) + '</span></div>';
      }
    } else {
      html += '<div style="text-align:center;padding:12px;color:var(--accent);font-weight:600;">Fully Paid</div>';
    }
    html += '</div>';

    // Status workflow
    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Status</h4>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
    ['draft','sent','paid'].forEach(function(s) {
      html += '<button class="btn ' + (inv.status === s ? 'btn-primary' : 'btn-outline') + '" onclick="InvoicesPage.setStatus(\'' + inv.id + '\',\'' + s + '\')" style="font-size:11px;padding:5px 12px;">' + s + '</button>';
    });
    html += '</div></div>';

    html += '</div></div>';

    document.getElementById('pageTitle').textContent = 'Invoice #' + inv.invoiceNumber;
    document.getElementById('pageContent').innerHTML = html;
    document.getElementById('pageAction').style.display = 'none';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  },

  setStatus: function(id, status) {
    var updates = { status: status };
    if (status === 'paid') {
      updates.balance = 0;
      updates.paidDate = new Date().toISOString();
    }
    DB.invoices.update(id, updates);
    UI.toast('Invoice status: ' + status);
    UI.closeModal();
    loadPage('invoices');
  },

  markPaid: function(id) {
    InvoicesPage.setStatus(id, 'paid');
  }
};

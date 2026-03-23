/**
 * Branch Manager — Invoices Page
 */
var InvoicesPage = {
  _page: 0, _perPage: 50, _search: '', _filter: 'all',

  render: function() {
    var self = InvoicesPage;
    var all = DB.invoices.getAll();
    var receivable = DB.invoices.totalReceivable();
    var unpaid = all.filter(function(i) { return i.status !== 'paid'; });
    var draft = all.filter(function(i) { return i.status === 'draft'; }).length;
    var paid = all.filter(function(i) { return i.status === 'paid'; }).length;

    var html = '<div class="stat-grid">'
      + UI.statCard('Receivables', UI.moneyInt(receivable), unpaid.length + ' unpaid', receivable > 0 ? 'down' : '', '', "InvoicesPage._setFilter('unpaid')")
      + UI.statCard('Draft', draft.toString(), '', '', '', "InvoicesPage._setFilter('draft')")
      + UI.statCard('Paid', paid.toString(), 'All time', '', '', "InvoicesPage._setFilter('paid')")
      + UI.statCard('Total Invoices', all.length.toString(), '', '', '', "InvoicesPage._setFilter('all')")
      + '</div>';

    // Search
    html += '<div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;align-items:center;">'
      + '<div style="flex:1;min-width:200px;position:relative;">'
      + '<input type="text" placeholder="Search invoices..." value="' + self._search + '" oninput="InvoicesPage._search=this.value;InvoicesPage._page=0;loadPage(\'invoices\')" style="width:100%;padding:9px 12px 9px 34px;border:2px solid var(--border);border-radius:8px;font-size:14px;">'
      + '<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-light);">🔍</span></div>'
      + '<div style="display:flex;gap:4px;">';
    [['all', all.length], ['unpaid', unpaid.length], ['paid', paid], ['draft', draft]].forEach(function(f) {
      html += '<button class="btn ' + (self._filter === f[0] ? 'btn-primary' : 'btn-outline') + '" onclick="InvoicesPage._setFilter(\'' + f[0] + '\')" style="font-size:12px;padding:6px 10px;">' + f[0].charAt(0).toUpperCase() + f[0].slice(1) + ' (' + f[1] + ')</button>';
    });
    html += '</div></div>';

    var filtered = self._getFiltered();
    var page = filtered.slice(self._page * self._perPage, (self._page + 1) * self._perPage);

    html += '<div style="font-size:12px;color:var(--text-light);margin-bottom:8px;">Showing ' + Math.min(self._page * self._perPage + 1, filtered.length) + '–' + Math.min((self._page + 1) * self._perPage, filtered.length) + ' of ' + filtered.length + '</div>';

    // Bulk action bar (hidden until selections made)
    html += '<div id="inv-bulk-bar" style="display:none;position:sticky;top:60px;z-index:50;background:var(--accent);color:#fff;padding:10px 16px;border-radius:10px;margin-bottom:8px;display:none;justify-content:space-between;align-items:center;">'
      + '<span id="inv-bulk-count" style="font-weight:700;">0 selected</span>'
      + '<div style="display:flex;gap:6px;">'
      + '<button onclick="InvoicesPage._bulkAction(\'paid\')" style="background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.3);padding:6px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">Mark Paid</button>'
      + '<button onclick="InvoicesPage._bulkAction(\'reminder\')" style="background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.3);padding:6px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">Send Reminder</button>'
      + '<button onclick="InvoicesPage._bulkAction(\'clear\')" style="background:none;color:rgba(255,255,255,.7);border:none;padding:6px 8px;font-size:12px;cursor:pointer;">Clear</button>'
      + '</div></div>';

    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      + '<table class="data-table"><thead><tr>'
      + '<th style="width:32px;"><input type="checkbox" onchange="InvoicesPage._selectAll(this.checked)" style="width:16px;height:16px;"></th>'
      + '<th>Client</th><th>#</th><th>Due</th><th>Subject</th><th>Status</th><th style="text-align:right;">Total</th><th style="text-align:right;">Balance</th>'
      + '</tr></thead><tbody>';

    if (page.length === 0) {
      html += '<tr><td colspan="8">' + (self._search ? '<div style="text-align:center;padding:24px;color:var(--text-light);">No invoices match "' + self._search + '"</div>' : UI.emptyState('💰', 'No invoices yet', 'Complete a job and create an invoice.')) + '</td></tr>';
    } else {
      page.forEach(function(inv) {
        html += '<tr style="cursor:pointer;">'
          + '<td onclick="event.stopPropagation()"><input type="checkbox" class="inv-check" value="' + inv.id + '" onchange="InvoicesPage._updateBulk()" style="width:16px;height:16px;"></td>'
          + '<td onclick="InvoicesPage.showDetail(\'' + inv.id + '\')"><strong>' + (inv.clientName || '—') + '</strong></td>'
          + '<td>#' + (inv.invoiceNumber || '') + '</td>'
          + '<td style="white-space:nowrap;">' + UI.dateShort(inv.dueDate) + '</td>'
          + '<td style="font-size:13px;color:var(--text-light);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (inv.subject || '—') + '</td>'
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
    else if (self._filter !== 'all') all = all.filter(function(i) { return i.status === self._filter; });
    if (self._search && self._search.length >= 2) {
      var s = self._search.toLowerCase();
      all = all.filter(function(i) { return (i.clientName||'').toLowerCase().indexOf(s) >= 0 || (i.subject||'').toLowerCase().indexOf(s) >= 0 || String(i.invoiceNumber).indexOf(s) >= 0; });
    }
    all.sort(function(a, b) { return (b.invoiceNumber || 0) - (a.invoiceNumber || 0); });
    return all;
  },
  _setFilter: function(f) { InvoicesPage._filter = f; InvoicesPage._page = 0; loadPage('invoices'); },
  _goPage: function(p) { var t = Math.ceil(InvoicesPage._getFiltered().length / InvoicesPage._perPage); InvoicesPage._page = Math.max(0, Math.min(p, t - 1)); loadPage('invoices'); },

  _selectAll: function(checked) {
    document.querySelectorAll('.inv-check').forEach(function(cb) { cb.checked = checked; });
    InvoicesPage._updateBulk();
  },
  _updateBulk: function() {
    var selected = document.querySelectorAll('.inv-check:checked');
    var bar = document.getElementById('inv-bulk-bar');
    var count = document.getElementById('inv-bulk-count');
    if (bar) bar.style.display = selected.length > 0 ? 'flex' : 'none';
    if (count) count.textContent = selected.length + ' selected';
  },
  _getSelected: function() {
    return Array.from(document.querySelectorAll('.inv-check:checked')).map(function(cb) { return cb.value; });
  },
  _bulkAction: function(action) {
    var ids = InvoicesPage._getSelected();
    if (ids.length === 0) return;
    if (action === 'paid') {
      UI.confirm('Mark ' + ids.length + ' invoice' + (ids.length > 1 ? 's' : '') + ' as paid?', function() {
        ids.forEach(function(id) { Workflow.markPaid(id, 'bulk'); });
        UI.toast(ids.length + ' invoices marked paid');
        loadPage('invoices');
      });
    } else if (action === 'reminder') {
      var sent = 0;
      ids.forEach(function(id) {
        var inv = DB.invoices.getById(id);
        if (inv && inv.status !== 'paid') { Workflow.sendInvoice(id); sent++; }
      });
      UI.toast(sent + ' reminder' + (sent > 1 ? 's' : '') + ' queued');
    } else if (action === 'clear') {
      document.querySelectorAll('.inv-check').forEach(function(cb) { cb.checked = false; });
      InvoicesPage._updateBulk();
    }
  },

  showDetail: function(id) {
    var inv = DB.invoices.getById(id);
    if (!inv) return;

    var html = ''
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">'
      + '<button class="btn btn-outline" onclick="loadPage(\'invoices\')" style="padding:6px 12px;">← Back</button>'
      + '<div style="flex:1;"><h2 style="font-size:22px;margin-bottom:2px;">Invoice #' + inv.invoiceNumber + '</h2>'
      + '<span style="font-size:14px;color:var(--text-light);">' + (inv.clientName || '') + '</span></div>'
      + '<div style="display:flex;gap:6px;">'
      + '<button class="btn btn-outline" onclick="PDF.generateInvoice(\'' + id + '\')">📄 PDF</button>'
      + '<button class="btn btn-outline" onclick="if(typeof Workflow!==\'undefined\')Workflow.sendInvoice(\'' + id + '\');">📧 Send</button>'
      + (inv.status !== 'paid' ? '<button class="btn btn-primary" onclick="if(typeof Workflow!==\'undefined\')Workflow.markPaid(\'' + id + '\',\'cash\');InvoicesPage.showDetail(\'' + id + '\');">💵 Mark Paid</button>' : '')
      + '</div></div>'

      + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;">'
      + UI.statCard('Status', '<span style="font-size:14px;">' + UI.statusBadge(inv.status) + '</span>', '', '', '')
      + UI.statCard('Total', UI.money(inv.total), '', '', '')
      + UI.statCard('Balance', UI.money(inv.balance || 0), inv.balance > 0 ? 'Due' : 'Paid', inv.balance > 0 ? 'down' : 'up', '')
      + UI.statCard('Due Date', UI.dateShort(inv.dueDate), '', '', '')
      + '</div>'

      + '<div style="display:grid;grid-template-columns:1fr 300px;gap:20px;" class="detail-grid">'
      + '<div>'

      // Payment buttons
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px;">'
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
          + '<span>💳 Card fee: $' + fees.card.toFixed(2) + '</span>'
          + '<span>🏦 ACH fee: $' + fees.ach.toFixed(2) + '</span></div>';
      }
    } else {
      html += '<div style="text-align:center;padding:12px;color:var(--accent);font-weight:600;">✅ Fully Paid</div>';
    }
    html += '</div>'

      // Line items
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:16px;">'
      + '<div style="padding:12px 16px;border-bottom:1px solid var(--border);"><h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin:0;">Line Items</h4></div>';
    if (inv.lineItems && inv.lineItems.length) {
      html += '<table class="data-table" style="border:none;border-radius:0;"><thead><tr><th>Service</th><th>Description</th><th>Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amount</th></tr></thead><tbody>';
      inv.lineItems.forEach(function(item) {
        html += '<tr><td>' + (item.service || 'Custom') + '</td><td style="color:var(--text-light);">' + (item.description || '') + '</td><td>' + (item.qty || 1) + '</td><td style="text-align:right;">' + UI.money(item.rate) + '</td><td style="text-align:right;font-weight:600;">' + UI.money(item.amount || (item.qty||1) * item.rate) + '</td></tr>';
      });
      html += '<tr style="background:var(--green-bg);"><td colspan="4" style="text-align:right;font-weight:700;">Total</td><td style="text-align:right;font-weight:800;font-size:15px;color:var(--accent);">' + UI.money(inv.total) + '</td></tr>';
      html += '</tbody></table>';
    } else {
      html += '<div style="padding:20px;text-align:center;color:var(--text-light);font-size:13px;">No line items</div>';
    }
    html += '</div>'

      // Payment history
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Payment History</h4>';
    if (typeof Payments !== 'undefined') { html += Payments.renderForInvoice(id); }
    else { html += '<div style="color:var(--text-light);font-size:13px;">No payments recorded</div>'; }
    html += '</div></div>'

      // Right sidebar
      + '<div>'
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Client</h4>'
      + '<div style="font-size:14px;font-weight:600;margin-bottom:8px;">' + (inv.clientName || '—') + '</div>'
      + (inv.clientPhone ? '<a href="tel:' + inv.clientPhone + '" class="btn btn-outline" style="width:100%;justify-content:center;margin-bottom:6px;font-size:12px;">📞 Call</a>' : '')
      + (inv.clientEmail ? '<a href="mailto:' + inv.clientEmail + '" class="btn btn-outline" style="width:100%;justify-content:center;font-size:12px;">✉️ Email</a>' : '')
      + '</div>'

      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Details</h4>'
      + '<div style="font-size:13px;line-height:2;">'
      + '<div style="display:flex;justify-content:space-between;"><span style="color:var(--text-light);">Issued</span><span>' + UI.dateShort(inv.issuedDate) + '</span></div>'
      + '<div style="display:flex;justify-content:space-between;"><span style="color:var(--text-light);">Due</span><span>' + UI.dateShort(inv.dueDate) + '</span></div>'
      + '<div style="display:flex;justify-content:space-between;"><span style="color:var(--text-light);">Total</span><span style="font-weight:700;">' + UI.money(inv.total) + '</span></div>'
      + '<div style="display:flex;justify-content:space-between;"><span style="color:var(--text-light);">Paid</span><span style="font-weight:700;color:var(--accent);">' + UI.money((inv.total||0) - (inv.balance||0)) + '</span></div>'
      + '<div style="display:flex;justify-content:space-between;"><span style="color:var(--text-light);">Balance</span><span style="font-weight:700;color:' + (inv.balance > 0 ? 'var(--red)' : 'var(--accent)') + ';">' + UI.money(inv.balance || 0) + '</span></div>'
      + '</div></div>'
      + '</div></div>';

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

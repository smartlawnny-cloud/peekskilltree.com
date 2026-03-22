/**
 * Branch Manager — Invoices Page
 */
var InvoicesPage = {
  render: function() {
    var all = DB.invoices.getAll();
    var receivable = DB.invoices.totalReceivable();
    var draft = all.filter(function(i) { return i.status === 'draft'; }).length;
    var paid = all.filter(function(i) { return i.status === 'paid'; }).length;

    var html = '<div class="stat-grid">'
      + UI.statCard('Receivables', UI.moneyInt(receivable), all.filter(function(i){return i.status!=='paid';}).length + ' unpaid', receivable > 0 ? 'down' : '', '')
      + UI.statCard('Draft', draft.toString(), '', '', '')
      + UI.statCard('Paid', paid.toString(), 'All time', '', '')
      + UI.statCard('Total Invoices', all.length.toString(), '', '', '')
      + '</div>';

    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      + '<table class="data-table"><thead><tr>'
      + '<th>Client</th><th>Invoice #</th><th>Due Date</th><th>Subject</th><th>Status</th><th style="text-align:right;">Total</th><th style="text-align:right;">Balance</th>'
      + '</tr></thead><tbody>';

    if (all.length === 0) {
      html += '<tr><td colspan="7">' + UI.emptyState('💰', 'No invoices yet', 'Complete a job and create an invoice.') + '</td></tr>';
    } else {
      all.forEach(function(inv) {
        html += '<tr onclick="InvoicesPage.showDetail(\'' + inv.id + '\')">'
          + '<td><strong>' + (inv.clientName || '—') + '</strong></td>'
          + '<td>#' + (inv.invoiceNumber || '') + '</td>'
          + '<td>' + UI.dateShort(inv.dueDate) + '</td>'
          + '<td style="font-size:13px;color:var(--text-light);">' + (inv.subject || '—') + '</td>'
          + '<td>' + UI.statusBadge(inv.status) + '</td>'
          + '<td style="text-align:right;font-weight:600;">' + UI.money(inv.total) + '</td>'
          + '<td style="text-align:right;font-weight:600;color:' + (inv.balance > 0 ? 'var(--red)' : 'var(--green-dark)') + ';">' + UI.money(inv.balance) + '</td>'
          + '</tr>';
      });
    }
    html += '</tbody></table></div>';
    return html;
  },

  showDetail: function(id) {
    var inv = DB.invoices.getById(id);
    if (!inv) return;

    var html = '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:20px;">'
      + '<div><h2 style="margin-bottom:4px;">Invoice #' + inv.invoiceNumber + '</h2>'
      + '<div style="color:var(--text-light);">' + (inv.clientName || '') + '</div>'
      + '<div style="font-size:13px;color:var(--text-light);">Due: ' + UI.dateShort(inv.dueDate) + '</div></div>'
      + '<div style="text-align:right;">' + UI.statusBadge(inv.status)
      + '<div style="font-size:2rem;font-weight:800;color:var(--green-dark);margin-top:8px;">' + UI.money(inv.total) + '</div>'
      + (inv.balance > 0 ? '<div style="font-size:14px;color:var(--red);font-weight:600;">Balance: ' + UI.money(inv.balance) + '</div>' : '')
      + '</div></div>';

    // Line items
    if (inv.lineItems && inv.lineItems.length) {
      html += '<table class="data-table" style="margin-bottom:16px;"><thead><tr><th>Service</th><th>Description</th><th>Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amount</th></tr></thead><tbody>';
      inv.lineItems.forEach(function(item) {
        html += '<tr><td>' + (item.service || 'Custom') + '</td><td>' + (item.description || '') + '</td><td>' + (item.qty || 1) + '</td><td style="text-align:right;">' + UI.money(item.rate) + '</td><td style="text-align:right;font-weight:600;">' + UI.money(item.amount || item.qty * item.rate) + '</td></tr>';
      });
      html += '<tr style="background:var(--bg);"><td colspan="4" style="text-align:right;font-weight:700;">Total</td><td style="text-align:right;font-weight:800;">' + UI.money(inv.total) + '</td></tr>';
      html += '</tbody></table>';
    }

    // Workflow payment actions (Cash/Check/Venmo/Zelle/Stripe)
    if (typeof Workflow !== 'undefined') {
      html += '<div style="margin:16px 0;">' + Workflow.invoiceActions(id) + '</div>';
    } else {
      html += Stripe.paymentButton(id);
    }

    // Fee calculator
    if (inv.status !== 'paid' && inv.balance > 0) {
      var fees = Stripe.calcFees(inv.balance || inv.total);
      html += '<div style="margin-top:8px;font-size:12px;color:var(--text-light);display:flex;gap:16px;flex-wrap:wrap;">'
        + '<span>💳 Card fee: $' + fees.card.toFixed(2) + ' (you get $' + fees.cardNet.toFixed(2) + ')</span>'
        + '<span>🏦 ACH fee: $' + fees.ach.toFixed(2) + ' (you get $' + fees.achNet.toFixed(2) + ')</span>'
        + '</div>';
    }

    // Payment history with deposit tracking
    if (typeof Payments !== 'undefined') {
      html += Payments.renderForInvoice(id);
    }

    // Contact info
    if (inv.clientPhone || inv.clientEmail) {
      html += '<div style="display:flex;gap:12px;padding:10px;background:var(--bg);border-radius:8px;margin-top:16px;font-size:13px;">';
      if (inv.clientPhone) html += '<a href="tel:' + inv.clientPhone + '" style="color:var(--green-dark);font-weight:600;">📞 ' + inv.clientPhone + '</a>';
      if (inv.clientEmail) html += '<a href="mailto:' + inv.clientEmail + '" style="color:var(--green-dark);font-weight:600;">✉️ ' + inv.clientEmail + '</a>';
      html += '</div>';
    }

    UI.showModal('Invoice #' + inv.invoiceNumber, html, {
      wide: true,
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Close</button>'
        + ' <button class="btn btn-outline" onclick="PDF.generateInvoice(\'' + id + '\')">📄 PDF</button>'
        + ' <button class="btn btn-outline" onclick="Workflow.sendInvoice(\'' + id + '\')">📧 Send</button>'
        + (inv.status !== 'paid' ? ' <button class="btn btn-primary" onclick="Workflow.markPaid(\'' + id + '\',\'cash\');UI.closeModal();loadPage(\'invoices\');">💵 Mark Paid</button>' : '')
    });
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

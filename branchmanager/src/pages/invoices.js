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

      + '<div style="display:grid;grid-template-columns:1fr 300px;gap:20px;">'
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

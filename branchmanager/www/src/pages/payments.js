/**
 * Branch Manager — Payment & Deposit Tracking
 * Record partial payments, deposits, payment history per invoice
 */
var Payments = {
  // Render payment history for an invoice
  renderForInvoice: function(invoiceId) {
    var payments = Payments.getAll(invoiceId);
    var inv = DB.invoices.getById(invoiceId);
    if (!inv) return '';

    var totalPaid = payments.reduce(function(s, p) { return s + (p.amount || 0); }, 0);
    var remaining = (inv.total || 0) - totalPaid;

    var html = '<div style="margin-top:16px;">'
      + '<h4 style="font-size:14px;margin-bottom:8px;">Payment History</h4>';

    // Progress bar
    var pctPaid = inv.total > 0 ? Math.min(100, Math.round(totalPaid / inv.total * 100)) : 0;
    html += '<div style="margin-bottom:12px;">'
      + '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">'
      + '<span>Paid: ' + UI.money(totalPaid) + '</span>'
      + '<span style="color:' + (remaining > 0 ? 'var(--red)' : 'var(--green-dark)') + ';">Remaining: ' + UI.money(Math.max(0, remaining)) + '</span></div>'
      + '<div style="height:8px;background:var(--bg);border-radius:4px;overflow:hidden;">'
      + '<div style="height:100%;width:' + pctPaid + '%;background:' + (pctPaid >= 100 ? '#4caf50' : '#ff9800') + ';border-radius:4px;transition:width .3s;"></div>'
      + '</div></div>';

    // Payment list
    if (payments.length) {
      payments.forEach(function(p) {
        var methodIcons = { cash: '💵', check: '📝', venmo: '📱', zelle: '📱', card: '💳', stripe: '💳', deposit: '🏦', other: '💰' };
        html += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;">'
          + '<div><span>' + (methodIcons[p.method] || '💰') + '</span> '
          + '<span style="text-transform:capitalize;font-weight:600;">' + (p.method || 'payment') + '</span>'
          + (p.note ? ' <span style="color:var(--text-light);">— ' + p.note + '</span>' : '')
          + '</div>'
          + '<div style="display:flex;align-items:center;gap:8px;">'
          + '<span style="font-weight:700;color:var(--green-dark);">+' + UI.money(p.amount) + '</span>'
          + '<span style="font-size:11px;color:var(--text-light);">' + UI.dateShort(p.date) + '</span>'
          + '</div></div>';
      });
    }

    // Add payment form
    if (remaining > 0) {
      html += '<div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:8px;">'
        + '<div style="font-size:13px;font-weight:600;margin-bottom:8px;">Record Payment</div>'
        + '<div style="display:flex;gap:6px;align-items:end;">'
        + '<div style="flex:1;"><input type="number" id="pay-amount-' + invoiceId + '" value="' + remaining.toFixed(2) + '" step="0.01" style="width:100%;padding:8px;border:2px solid var(--border);border-radius:6px;font-size:14px;font-weight:700;"></div>'
        + '<select id="pay-method-' + invoiceId + '" style="padding:8px;border:2px solid var(--border);border-radius:6px;font-size:13px;">'
        + '<option value="cash">💵 Cash</option><option value="check">📝 Check</option><option value="venmo">Venmo</option><option value="zelle">Zelle</option><option value="card">💳 Card</option><option value="deposit">🏦 Deposit</option></select>'
        + '<input type="text" id="pay-note-' + invoiceId + '" placeholder="Note (check #, etc)" style="flex:1;padding:8px;border:2px solid var(--border);border-radius:6px;font-size:13px;">'
        + '<button onclick="Payments.record(\'' + invoiceId + '\')" style="background:var(--green-dark);color:#fff;border:none;padding:8px 14px;border-radius:6px;font-weight:600;cursor:pointer;white-space:nowrap;">Record</button>'
        + '</div></div>';
    }

    html += '</div>';
    return html;
  },

  record: function(invoiceId) {
    var amountEl = document.getElementById('pay-amount-' + invoiceId);
    var methodEl = document.getElementById('pay-method-' + invoiceId);
    var noteEl = document.getElementById('pay-note-' + invoiceId);
    if (!amountEl) return;

    var amount = parseFloat(amountEl.value);
    if (!amount || amount <= 0) { UI.toast('Enter amount', 'error'); return; }

    var payment = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      invoiceId: invoiceId,
      amount: amount,
      method: methodEl ? methodEl.value : 'cash',
      note: noteEl ? noteEl.value : '',
      date: new Date().toISOString(),
      user: 'Doug'
    };

    // Save payment
    var key = 'bm-payments-' + invoiceId;
    var all = [];
    try { all = JSON.parse(localStorage.getItem(key)) || []; } catch(e) {}
    all.unshift(payment);
    localStorage.setItem(key, JSON.stringify(all));

    // Update invoice balance
    var inv = DB.invoices.getById(invoiceId);
    if (inv) {
      var totalPaid = all.reduce(function(s, p) { return s + (p.amount || 0); }, 0);
      var newBalance = Math.max(0, (inv.total || 0) - totalPaid);
      var updates = {
        amountPaid: totalPaid,
        balance: newBalance
      };
      if (newBalance <= 0) {
        updates.status = 'paid';
        updates.paidDate = new Date().toISOString();
      }
      DB.invoices.update(invoiceId, updates);
    }

    UI.toast('Payment recorded: ' + UI.money(amount) + ' via ' + (methodEl ? methodEl.value : 'cash'));

    // Refresh
    if (typeof InvoicesPage !== 'undefined') {
      InvoicesPage.showDetail(invoiceId);
    }
  },

  getAll: function(invoiceId) {
    var key = 'bm-payments-' + invoiceId;
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch(e) { return []; }
  },

  // Collect deposit before work starts
  collectDeposit: function(invoiceId, percentage) {
    var inv = DB.invoices.getById(invoiceId);
    if (!inv) return;
    var depositAmount = Math.round(inv.total * (percentage || 0.5) * 100) / 100;

    var payment = {
      id: Date.now().toString(36),
      invoiceId: invoiceId,
      amount: depositAmount,
      method: 'deposit',
      note: percentage * 100 + '% deposit',
      date: new Date().toISOString(),
      user: 'Doug'
    };

    var key = 'bm-payments-' + invoiceId;
    var all = [];
    try { all = JSON.parse(localStorage.getItem(key)) || []; } catch(e) {}
    all.unshift(payment);
    localStorage.setItem(key, JSON.stringify(all));

    DB.invoices.update(invoiceId, {
      amountPaid: depositAmount,
      balance: inv.total - depositAmount,
      status: 'deposit_collected'
    });

    UI.toast('Deposit collected: ' + UI.money(depositAmount));
  }
};

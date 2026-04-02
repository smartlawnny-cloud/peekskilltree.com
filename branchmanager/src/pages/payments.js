/**
 * Branch Manager — Payment & Deposit Tracking
 * Record partial payments, deposits, payment history per invoice
 */
var Payments = {
  _filterMethod: 'all',
  _filterPeriod: 'month',

  setFilter: function(type, value) {
    if (type === 'method') Payments._filterMethod = value;
    if (type === 'period') Payments._filterPeriod = value;
    var el = document.getElementById('payments-main');
    if (el) el.innerHTML = Payments._renderContent();
  },

  render: function() {
    return '<div style="max-width:860px;" id="payments-page">'
      + Payments._renderContent()
      + '</div>';
  },

  _getAllPayments: function() {
    var allPayments = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.startsWith('bm-payments-')) {
        try {
          var items = JSON.parse(localStorage.getItem(k)) || [];
          items.forEach(function(p) { allPayments.push(p); });
        } catch(e) {}
      }
    }
    allPayments.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    return allPayments;
  },

  _filterByPeriod: function(payments, period) {
    var now = new Date();
    var cutoff;
    if (period === 'month') {
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'lastmonth') {
      cutoff = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      var endCutoff = new Date(now.getFullYear(), now.getMonth(), 1);
      return payments.filter(function(p) {
        var d = new Date(p.date);
        return d >= cutoff && d < endCutoff;
      });
    } else if (period === '3months') {
      cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else {
      return payments; // all time
    }
    return payments.filter(function(p) { return new Date(p.date) >= cutoff; });
  },

  _renderContent: function() {
    var allPayments = Payments._getAllPayments();

    // Stats for header cards (always unfiltered except for period)
    var now = new Date();
    var thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    var lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    var ytdStart = new Date(now.getFullYear(), 0, 1);

    var thisMonthTotal = allPayments.filter(function(p) { return new Date(p.date) >= thisMonthStart; })
      .reduce(function(s, p) { return s + (p.amount || 0); }, 0);
    var lastMonthTotal = allPayments.filter(function(p) {
      var d = new Date(p.date);
      return d >= lastMonthStart && d < thisMonthStart;
    }).reduce(function(s, p) { return s + (p.amount || 0); }, 0);
    var ytdTotal = allPayments.filter(function(p) { return new Date(p.date) >= ytdStart; })
      .reduce(function(s, p) { return s + (p.amount || 0); }, 0);
    var allTimeTotal = allPayments.reduce(function(s, p) { return s + (p.amount || 0); }, 0);

    // Apply filters to list
    var filtered = Payments._filterByPeriod(allPayments, Payments._filterPeriod);
    if (Payments._filterMethod !== 'all') {
      filtered = filtered.filter(function(p) { return (p.method || 'other') === Payments._filterMethod; });
    }

    // Stats row
    var html = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">'
      + '<div class="stat-card"><div class="stat-label">This Month</div><div class="stat-value">' + UI.money(thisMonthTotal) + '</div></div>'
      + '<div class="stat-card"><div class="stat-label">Last Month</div><div class="stat-value">' + UI.money(lastMonthTotal) + '</div></div>'
      + '<div class="stat-card"><div class="stat-label">YTD</div><div class="stat-value">' + UI.money(ytdTotal) + '</div></div>'
      + '<div class="stat-card"><div class="stat-label">All Time</div><div class="stat-value">' + UI.money(allTimeTotal) + '</div></div>'
      + '</div>';

    // Payment method breakdown
    var methods = ['cash','check','venmo','zelle','card','stripe','deposit','other'];
    var methodTotals = {};
    methods.forEach(function(m) { methodTotals[m] = 0; });
    allPayments.forEach(function(p) {
      var m = p.method || 'other';
      if (!methodTotals[m]) methodTotals[m] = 0;
      methodTotals[m] += (p.amount || 0);
    });
    var methodMax = Math.max.apply(null, methods.map(function(m) { return methodTotals[m] || 0; })) || 1;
    var methodIcons = { cash: '💵', check: '📝', venmo: '📱', zelle: '⚡', card: '💳', stripe: '🔵', deposit: '🏦', other: '💰' };

    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:16px 20px;margin-bottom:16px;">'
      + '<h4 style="font-size:13px;margin-bottom:12px;font-weight:700;">Payment Method Breakdown</h4>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;">';

    methods.forEach(function(m) {
      var amt = methodTotals[m] || 0;
      if (amt === 0) return;
      var pct = Math.round((amt / methodMax) * 100);
      var pctOfTotal = allTimeTotal > 0 ? Math.round((amt / allTimeTotal) * 100) : 0;
      html += '<div style="background:var(--bg);border-radius:8px;padding:10px;">'
        + '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">'
        + '<span style="font-weight:600;text-transform:capitalize;">' + methodIcons[m] + ' ' + m + '</span>'
        + '<span style="color:var(--text-light);">' + pctOfTotal + '%</span>'
        + '</div>'
        + '<div style="height:6px;background:var(--border);border-radius:3px;margin-bottom:4px;overflow:hidden;">'
        + '<div style="height:100%;width:' + pct + '%;background:var(--green-dark);border-radius:3px;"></div>'
        + '</div>'
        + '<div style="font-size:13px;font-weight:700;">' + UI.money(amt) + '</div>'
        + '</div>';
    });

    html += '</div></div>';

    // Filter bar
    var periodFilters = [
      { val: 'month', label: 'This Month' },
      { val: 'lastmonth', label: 'Last Month' },
      { val: '3months', label: 'Last 3 Mo' },
      { val: 'all', label: 'All Time' }
    ];
    var methodFilters = ['all','cash','check','venmo','zelle','card','stripe','deposit','other'];

    var filterBtnStyle = function(active) {
      return 'padding:6px 12px;border-radius:6px;border:1.5px solid ' + (active ? 'var(--green-dark)' : 'var(--border)') + ';background:' + (active ? 'var(--green-dark)' : 'var(--white)') + ';color:' + (active ? '#fff' : 'var(--text)') + ';cursor:pointer;font-size:12px;font-weight:600;';
    };

    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;">'
      + '<span style="font-size:12px;font-weight:600;color:var(--text-light);margin-right:4px;">Period:</span>';
    periodFilters.forEach(function(f) {
      html += '<button style="' + filterBtnStyle(Payments._filterPeriod === f.val) + '" onclick="Payments.setFilter(\'period\',\'' + f.val + '\')">' + f.label + '</button>';
    });
    html += '<span style="font-size:12px;font-weight:600;color:var(--text-light);margin-left:8px;margin-right:4px;">Method:</span>';
    methodFilters.forEach(function(m) {
      var label = m === 'all' ? 'All' : ((methodIcons[m] || '') + ' ' + m.charAt(0).toUpperCase() + m.slice(1));
      html += '<button style="' + filterBtnStyle(Payments._filterMethod === m) + '" onclick="Payments.setFilter(\'method\',\'' + m + '\')">' + label + '</button>';
    });

    // Export CSV button
    html += '<button onclick="Payments.exportCSV()" class="btn btn-outline" style="margin-left:auto;font-size:12px;padding:6px 12px;">Export CSV</button>';
    html += '</div>';

    // Wrap list in updatable div
    html += '<div id="payments-main">';
    html += Payments._renderList(filtered);
    html += '</div>';

    return html;
  },

  _renderList: function(filtered) {
    if (!filtered.length) {
      return '<div class="empty-state"><div class="empty-icon">💵</div><h3>No payments match this filter</h3><p>Try a different date range or payment method.</p><button class="btn btn-primary" style="margin-top:16px;" onclick="loadPage(\'invoices\')">Go to Invoices</button></div>';
    }

    var methodIcons = { cash: '💵', check: '📝', venmo: '📱', zelle: '⚡', card: '💳', stripe: '🔵', deposit: '🏦', other: '💰' };
    var html = '';
    filtered.slice(0, 150).forEach(function(p) {
      var inv = p.invoiceId ? DB.invoices.getById(p.invoiceId) : null;
      var clientName = inv ? (inv.clientName || '') : '';
      var invNum = inv ? (inv.invoiceNumber || '') : '';
      var clientEmail = inv ? (inv.clientEmail || '') : '';

      // Build mailto for receipt
      var receiptSubject = encodeURIComponent('Payment Receipt' + (invNum ? ' — Invoice #' + invNum : ''));
      var receiptBody = encodeURIComponent(
        'Hi' + (clientName ? ' ' + clientName.split(' ')[0] : '') + ',\n\n'
        + 'Thank you for your payment.\n\n'
        + 'Amount: ' + UI.money(p.amount) + '\n'
        + 'Method: ' + (p.method || 'payment') + '\n'
        + 'Date: ' + UI.dateShort(p.date) + '\n'
        + (invNum ? 'Invoice #: ' + invNum + '\n' : '')
        + (p.note ? 'Note: ' + p.note + '\n' : '')
        + '\nThank you for choosing Second Nature Tree Service!\n\n'
        + 'Second Nature Tree Service\n(914) 391-5233\ninfo@peekskilltree.com'
      );
      var mailtoHref = 'mailto:' + (clientEmail || '') + '?subject=' + receiptSubject + '&body=' + receiptBody;

      html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:12px;">'
        + '<div style="display:flex;align-items:center;gap:10px;">'
        + '<div style="font-size:24px;">' + (methodIcons[p.method] || '💰') + '</div>'
        + '<div>'
        + '<div style="font-weight:600;font-size:14px;text-transform:capitalize;">' + (p.method || 'payment')
        + (p.note ? ' <span style="font-weight:400;color:var(--text-light);">— ' + UI.esc(p.note) + '</span>' : '') + '</div>'
        + (inv ? '<div style="font-size:12px;color:var(--text-light);">' + UI.esc(clientName) + (invNum ? ' · Invoice #' + invNum : '') + '</div>' : '')
        + '</div></div>'
        + '<div style="display:flex;align-items:center;gap:10px;">'
        + '<div style="text-align:right;">'
        + '<div style="font-weight:700;font-size:16px;color:var(--green-dark);">+' + UI.money(p.amount) + '</div>'
        + '<div style="font-size:11px;color:var(--text-light);">' + UI.dateShort(p.date) + '</div>'
        + '</div>'
        + '<a href="' + mailtoHref + '" title="Send Receipt" style="background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:12px;color:var(--text);text-decoration:none;white-space:nowrap;">✉️ Receipt</a>'
        + '</div></div>';
    });

    return html;
  },

  exportCSV: function() {
    var allPayments = Payments._getAllPayments();
    var filtered = Payments._filterByPeriod(allPayments, Payments._filterPeriod);
    if (Payments._filterMethod !== 'all') {
      filtered = filtered.filter(function(p) { return (p.method || 'other') === Payments._filterMethod; });
    }

    var rows = [['Date','Client','Invoice #','Method','Amount','Note']];
    filtered.forEach(function(p) {
      var inv = p.invoiceId ? DB.invoices.getById(p.invoiceId) : null;
      rows.push([
        UI.dateShort(p.date),
        inv ? (inv.clientName || '') : '',
        inv ? (inv.invoiceNumber || '') : '',
        p.method || '',
        (p.amount || 0).toFixed(2),
        p.note || ''
      ]);
    });

    var csv = rows.map(function(row) {
      return row.map(function(cell) {
        var s = String(cell).replace(/"/g, '""');
        return /[,"\n]/.test(s) ? '"' + s + '"' : s;
      }).join(',');
    }).join('\r\n');

    var blob = new Blob([csv], {type: 'text/csv'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'payments-' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    UI.toast('CSV exported (' + filtered.length + ' payments)');
  },

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
        var methodIcons = { cash: '💵', check: '📝', venmo: '📱', zelle: '⚡', card: '💳', stripe: '🔵', deposit: '🏦', other: '💰' };
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
      status: 'partial'
    });

    UI.toast('Deposit collected: ' + UI.money(depositAmount));
  }
};

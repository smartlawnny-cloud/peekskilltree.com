/**
 * Branch Manager — Report Export
 * Download CSV reports for clients, jobs, invoices, quotes
 */
var ReportsPage = {
  render: function() {
    var html = '';

    // Invoice Aging Report
    var invoices = DB.invoices.getAll();
    var unpaid = invoices.filter(function(i) { return i.status !== 'paid' && (i.total || 0) > 0; });
    var now = Date.now();
    var aging = { current: [], over30: [], over60: [], over90: [] };
    unpaid.forEach(function(inv) {
      var days = inv.dueDate ? Math.floor((now - new Date(inv.dueDate).getTime()) / 86400000) : 0;
      if (days > 90) aging.over90.push(inv);
      else if (days > 60) aging.over60.push(inv);
      else if (days > 30) aging.over30.push(inv);
      else aging.current.push(inv);
    });
    var sumOf = function(arr) { return arr.reduce(function(s, i) { return s + (i.balance || i.total || 0); }, 0); };

    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:20px;">'
      + '<h3 style="margin-bottom:16px;">Invoice Aging</h3>'
      + '<div class="stat-row" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">'
      + '<div style="text-align:center;padding:14px;background:#e8f5e9;border-radius:10px;"><div style="font-size:11px;color:#666;text-transform:uppercase;font-weight:600;">Current</div><div style="font-size:22px;font-weight:800;color:#2e7d32;">' + UI.moneyInt(sumOf(aging.current)) + '</div><div style="font-size:12px;color:#666;">' + aging.current.length + ' invoice' + (aging.current.length !== 1 ? 's' : '') + '</div></div>'
      + '<div style="text-align:center;padding:14px;background:#fff3e0;border-radius:10px;"><div style="font-size:11px;color:#666;text-transform:uppercase;font-weight:600;">30+ Days</div><div style="font-size:22px;font-weight:800;color:#e65100;">' + UI.moneyInt(sumOf(aging.over30)) + '</div><div style="font-size:12px;color:#666;">' + aging.over30.length + ' invoice' + (aging.over30.length !== 1 ? 's' : '') + '</div></div>'
      + '<div style="text-align:center;padding:14px;background:#fce4ec;border-radius:10px;"><div style="font-size:11px;color:#666;text-transform:uppercase;font-weight:600;">60+ Days</div><div style="font-size:22px;font-weight:800;color:#c62828;">' + UI.moneyInt(sumOf(aging.over60)) + '</div><div style="font-size:12px;color:#666;">' + aging.over60.length + ' invoice' + (aging.over60.length !== 1 ? 's' : '') + '</div></div>'
      + '<div style="text-align:center;padding:14px;background:#ffebee;border-radius:10px;"><div style="font-size:11px;color:#666;text-transform:uppercase;font-weight:600;">90+ Days</div><div style="font-size:22px;font-weight:800;color:#b71c1c;">' + UI.moneyInt(sumOf(aging.over90)) + '</div><div style="font-size:12px;color:#666;">' + aging.over90.length + ' invoice' + (aging.over90.length !== 1 ? 's' : '') + '</div></div>'
      + '</div>';

    // List unpaid invoices
    if (unpaid.length > 0) {
      html += '<table class="data-table"><thead><tr><th>Client</th><th>#</th><th>Due</th><th>Days</th><th style="text-align:right;">Amount</th><th>Action</th></tr></thead><tbody>';
      unpaid.sort(function(a, b) {
        var da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        var db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return da - db;
      }).forEach(function(inv) {
        var days = inv.dueDate ? Math.floor((now - new Date(inv.dueDate).getTime()) / 86400000) : 0;
        var color = days > 90 ? '#b71c1c' : days > 60 ? '#c62828' : days > 30 ? '#e65100' : 'var(--text)';
        var daysLabel = !inv.dueDate ? 'No due date' : days > 0 ? days + 'd overdue' : 'Current';
        html += '<tr>'
          + '<td><strong>' + (inv.clientName || '—') + '</strong></td>'
          + '<td>#' + (inv.invoiceNumber || '') + '</td>'
          + '<td>' + UI.dateShort(inv.dueDate) + '</td>'
          + '<td style="font-weight:700;color:' + color + ';">' + daysLabel + '</td>'
          + '<td style="text-align:right;font-weight:600;">' + UI.money(inv.balance || inv.total) + '</td>'
          + '<td><button class="btn btn-outline" style="font-size:11px;padding:4px 10px;" onclick="Workflow.sendInvoice(\'' + inv.id + '\')">Send Reminder</button></td>'
          + '</tr>';
      });
      html += '</tbody></table>';
    } else {
      html += '<div style="text-align:center;padding:16px;color:var(--accent);font-weight:600;">All caught up! No outstanding invoices.</div>';
    }
    html += '</div>';

    // P&L Statement
    var currentYear = new Date().getFullYear();
    var lastYear = currentYear - 1;

    // Income — from paid invoices
    function getYearRevenue(yr) {
      return DB.invoices.getAll().filter(function(i) {
        return i.status === 'paid';
      }).reduce(function(s, i) {
        var d = new Date(i.paidDate || i.createdAt);
        return d.getFullYear() === yr ? s + (i.total || 0) : s;
      }, 0);
    }

    // Expenses — from DB.expenses if available
    function getYearExpenses(yr) {
      if (!DB.expenses) return 0;
      return DB.expenses.getAll().filter(function(e) {
        return new Date(e.date || e.createdAt).getFullYear() === yr;
      }).reduce(function(s, e) { return s + (e.amount || 0); }, 0);
    }

    var thisRevenue = getYearRevenue(currentYear);
    var lastRevenue = getYearRevenue(lastYear);
    var thisExpenses = getYearExpenses(currentYear);
    var lastExpenses = getYearExpenses(lastYear);
    var thisProfit = thisRevenue - thisExpenses;
    var lastProfit = lastRevenue - lastExpenses;
    var revenueChange = lastRevenue > 0 ? Math.round(((thisRevenue - lastRevenue) / lastRevenue) * 100) : null;
    var profitMargin = thisRevenue > 0 ? Math.round((thisProfit / thisRevenue) * 100) : 0;

    // Expense breakdown by category for current year
    var expenseByCategory = {};
    if (DB.expenses) {
      DB.expenses.getAll().filter(function(e) {
        return new Date(e.date || e.createdAt).getFullYear() === currentYear;
      }).forEach(function(e) {
        var cat = e.category || 'Other';
        expenseByCategory[cat] = (expenseByCategory[cat] || 0) + (e.amount || 0);
      });
    }
    var expenseCats = Object.keys(expenseByCategory).sort(function(a, b) {
      return expenseByCategory[b] - expenseByCategory[a];
    });

    // Monthly income for current year (for spark)
    var monthlyIncome = [];
    for (var mi = 0; mi < 12; mi++) {
      var mRev = DB.invoices.getAll().filter(function(i) {
        if (i.status !== 'paid') return false;
        var d = new Date(i.paidDate || i.createdAt);
        return d.getFullYear() === currentYear && d.getMonth() === mi;
      }).reduce(function(s, i) { return s + (i.total || 0); }, 0);
      monthlyIncome.push(mRev);
    }
    var maxMonthly = Math.max.apply(null, monthlyIncome) || 1;

    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:20px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
      + '<h3 style="margin:0;">Profit & Loss Statement</h3>'
      + '<span style="font-size:13px;color:var(--text-light);">January \u2013 December ' + currentYear + '</span>'
      + '</div>'

      // Three-column P&L summary
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px;">'
      // Revenue
      + '<div style="padding:16px;background:#e8f5e9;border-radius:10px;">'
      + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#2e7d32;margin-bottom:4px;">Revenue ' + currentYear + '</div>'
      + '<div style="font-size:28px;font-weight:800;color:#2e7d32;">' + UI.moneyInt(thisRevenue) + '</div>'
      + (lastRevenue > 0 ? '<div style="font-size:12px;color:var(--text-light);margin-top:4px;">' + UI.moneyInt(lastRevenue) + ' in ' + lastYear + (revenueChange !== null ? ' <span style="color:' + (revenueChange >= 0 ? '#2e7d32' : '#dc3545') + ';font-weight:700;">' + (revenueChange >= 0 ? '\u2191' : '\u2193') + Math.abs(revenueChange) + '%</span>' : '') + '</div>' : '')
      + '</div>'
      // Expenses
      + '<div style="padding:16px;background:#fff3e0;border-radius:10px;">'
      + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#e65100;margin-bottom:4px;">Expenses ' + currentYear + '</div>'
      + '<div style="font-size:28px;font-weight:800;color:#e65100;">' + UI.moneyInt(thisExpenses) + '</div>'
      + (lastExpenses > 0 ? '<div style="font-size:12px;color:var(--text-light);margin-top:4px;">' + UI.moneyInt(lastExpenses) + ' in ' + lastYear + '</div>' : '<div style="font-size:12px;color:var(--text-light);margin-top:4px;"><a href="#" onclick="loadPage(\'expenses\');return false;" style="color:var(--green-dark);">Add expenses \u2192</a></div>')
      + '</div>'
      // Net Profit
      + '<div style="padding:16px;background:' + (thisProfit >= 0 ? '#e3f2fd' : '#ffebee') + ';border-radius:10px;">'
      + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:' + (thisProfit >= 0 ? '#1565c0' : '#c62828') + ';margin-bottom:4px;">Net Profit ' + currentYear + '</div>'
      + '<div style="font-size:28px;font-weight:800;color:' + (thisProfit >= 0 ? '#1565c0' : '#c62828') + ';">' + UI.moneyInt(thisProfit) + '</div>'
      + '<div style="font-size:12px;color:var(--text-light);margin-top:4px;">Margin: <strong>' + profitMargin + '%</strong></div>'
      + '</div>'
      + '</div>'

      // Monthly income sparkline
      + '<div style="margin-bottom:16px;">'
      + '<div style="font-size:12px;font-weight:600;color:var(--text-light);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em;">Monthly Revenue \u2014 ' + currentYear + '</div>'
      + '<div style="display:flex;align-items:flex-end;gap:3px;height:60px;">';
    var monthAbbr = ['J','F','M','A','M','J','J','A','S','O','N','D'];
    for (var si = 0; si < 12; si++) {
      var barH = monthlyIncome[si] > 0 ? Math.max(Math.round((monthlyIncome[si] / maxMonthly) * 52), 4) : 2;
      var isCurMonth = si === new Date().getMonth() && currentYear === new Date().getFullYear();
      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:2px;">'
        + '<div style="width:100%;height:' + barH + 'px;background:' + (isCurMonth ? 'var(--green-dark)' : '#a5d6a7') + ';border-radius:2px 2px 0 0;"></div>'
        + '<div style="font-size:9px;color:var(--text-light);' + (isCurMonth ? 'font-weight:700;color:var(--green-dark);' : '') + '">' + monthAbbr[si] + '</div>'
        + '</div>';
    }
    html += '</div></div>';

    // Expense breakdown by category
    if (expenseCats.length > 0) {
      var maxExpCat = expenseByCategory[expenseCats[0]] || 1;
      html += '<div style="margin-bottom:4px;">'
        + '<div style="font-size:12px;font-weight:600;color:var(--text-light);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em;">Expenses by Category</div>';
      expenseCats.slice(0, 8).forEach(function(cat) {
        var amt = expenseByCategory[cat];
        var pct = Math.round((amt / maxExpCat) * 100);
        html += '<div style="margin-bottom:8px;">'
          + '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:2px;"><span>' + UI.esc(cat) + '</span><strong>' + UI.moneyInt(amt) + '</strong></div>'
          + '<div style="height:6px;background:var(--bg);border-radius:3px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:#e65100;border-radius:3px;"></div></div>'
          + '</div>';
      });
      html += '</div>';
    } else {
      html += '<div style="padding:12px;background:var(--bg);border-radius:8px;font-size:13px;color:var(--text-light);text-align:center;">'
        + '\uD83D\uDCCA No expenses logged yet \u2014 <a href="#" onclick="loadPage(\'expenses\');return false;" style="color:var(--green-dark);">Add expenses</a> to see your full P&L'
        + '</div>';
    }

    html += '</div>';

    html += '<div class="section-header"><h2>Reports & Exports</h2>'
      + '<p style="color:var(--text-light);margin-top:4px;">Download your data as CSV files for accounting, tax prep, or backup.</p></div>';

    var reports = [
      { key: 'clients', icon: '👤', label: 'Client List', desc: 'All clients with name, phone, email, address, status', count: DB.clients.getAll().length },
      { key: 'invoices', icon: '💰', label: 'Invoices', desc: 'All invoices with amounts, status, payment info', count: DB.invoices.getAll().length },
      { key: 'quotes', icon: '📝', label: 'Quotes', desc: 'All quotes with amounts, status, client info', count: DB.quotes.getAll().length },
      { key: 'jobs', icon: '🌳', label: 'Jobs', desc: 'All jobs with dates, status, totals', count: DB.jobs.getAll().length },
      { key: 'requests', icon: '📥', label: 'Requests', desc: 'All service requests with source, status', count: DB.requests.getAll().length },
      { key: 'expenses', icon: '💸', label: 'Expenses', desc: 'All logged expenses by category', count: DB.expenses ? DB.expenses.getAll().length : 0 },
      { key: 'revenue', icon: '📊', label: 'Revenue Summary', desc: 'Monthly revenue breakdown for tax prep', count: '' }
    ];

    html += '<div style="display:grid;gap:12px;">';
    reports.forEach(function(r) {
      html += '<div style="background:var(--white);border-radius:12px;padding:16px 20px;border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
        + '<div style="display:flex;align-items:center;gap:12px;">'
        + '<span style="font-size:24px;">' + r.icon + '</span>'
        + '<div><strong style="font-size:14px;">' + r.label + '</strong>'
        + '<div style="font-size:12px;color:var(--text-light);">' + r.desc + '</div></div></div>'
        + '<div style="display:flex;align-items:center;gap:8px;">'
        + (r.count !== '' ? '<span style="font-size:13px;color:var(--text-light);">' + r.count + ' records</span>' : '')
        + '<button onclick="ReportsPage.download(\'' + r.key + '\')" style="background:var(--green-dark);color:#fff;border:none;padding:8px 16px;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px;">📥 Download CSV</button>'
        + '</div></div>';
    });
    html += '</div>';

    // Quick stats
    var invoices = DB.invoices.getAll();
    var totalRevenue = invoices.reduce(function(s, i) { return s + (i.total || 0); }, 0);
    var totalPaid = invoices.filter(function(i) { return i.status === 'paid'; }).reduce(function(s, i) { return s + (i.total || 0); }, 0);
    var totalOutstanding = invoices.filter(function(i) { return i.balance > 0; }).reduce(function(s, i) { return s + (i.balance || 0); }, 0);

    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-top:16px;">'
      + '<h3 style="font-size:15px;margin-bottom:12px;">Quick Numbers</h3>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">'
      + '<div style="padding:12px;background:var(--green-bg);border-radius:8px;text-align:center;"><div style="font-size:11px;color:var(--text-light);">Total Invoiced</div><div style="font-size:20px;font-weight:800;color:var(--green-dark);">' + UI.moneyInt(totalRevenue) + '</div></div>'
      + '<div style="padding:12px;background:var(--green-bg);border-radius:8px;text-align:center;"><div style="font-size:11px;color:var(--text-light);">Collected</div><div style="font-size:20px;font-weight:800;color:var(--green-dark);">' + UI.moneyInt(totalPaid) + '</div></div>'
      + '<div style="padding:12px;background:#fff3e0;border-radius:8px;text-align:center;"><div style="font-size:11px;color:var(--text-light);">Outstanding</div><div style="font-size:20px;font-weight:800;color:#e65100;">' + UI.moneyInt(totalOutstanding) + '</div></div>'
      + '<div style="padding:12px;background:var(--bg);border-radius:8px;text-align:center;"><div style="font-size:11px;color:var(--text-light);">Clients</div><div style="font-size:20px;font-weight:800;">' + DB.clients.getAll().length + '</div></div>'
      + '</div></div>';

    return html;
  },

  download: function(type) {
    var data, headers, filename;

    switch (type) {
      case 'clients':
        data = DB.clients.getAll();
        headers = ['Name', 'Company', 'Phone', 'Email', 'Address', 'Status', 'Created'];
        data = data.map(function(c) {
          return [c.name, c.company || '', c.phone || '', c.email || '', c.address || '', c.status || '', c.createdAt || ''];
        });
        filename = 'branch-manager-clients.csv';
        break;

      case 'invoices':
        data = DB.invoices.getAll();
        headers = ['Invoice #', 'Client', 'Subject', 'Total', 'Paid', 'Balance', 'Status', 'Due Date', 'Created'];
        data = data.map(function(i) {
          return [i.invoiceNumber || '', i.clientName || '', i.subject || '', i.total || 0, i.amountPaid || 0, i.balance || 0, i.status || '', i.dueDate || '', i.createdAt || ''];
        });
        filename = 'branch-manager-invoices.csv';
        break;

      case 'quotes':
        data = DB.quotes.getAll();
        headers = ['Quote #', 'Client', 'Description', 'Total', 'Status', 'Property', 'Created'];
        data = data.map(function(q) {
          return [q.quoteNumber || '', q.clientName || '', q.description || '', q.total || 0, q.status || '', q.property || '', q.createdAt || ''];
        });
        filename = 'branch-manager-quotes.csv';
        break;

      case 'jobs':
        data = DB.jobs.getAll();
        headers = ['Job #', 'Client', 'Description', 'Total', 'Status', 'Property', 'Scheduled', 'Completed', 'Created'];
        data = data.map(function(j) {
          return [j.jobNumber || '', j.clientName || '', j.description || '', j.total || 0, j.status || '', j.property || '', j.scheduledDate || '', j.completedDate || '', j.createdAt || ''];
        });
        filename = 'branch-manager-jobs.csv';
        break;

      case 'requests':
        data = DB.requests.getAll();
        headers = ['Client', 'Property', 'Source', 'Notes', 'Status', 'Created'];
        data = data.map(function(r) {
          return [r.clientName || '', r.property || '', r.source || '', (r.notes || '').replace(/\n/g, ' '), r.status || '', r.createdAt || ''];
        });
        filename = 'branch-manager-requests.csv';
        break;

      case 'expenses':
        data = DB.expenses ? DB.expenses.getAll() : [];
        headers = ['Date', 'Category', 'Description', 'Amount'];
        data = data.map(function(e) {
          return [e.date || '', e.category || '', e.description || '', e.amount || 0];
        });
        filename = 'branch-manager-expenses.csv';
        break;

      case 'revenue':
        var invoices = DB.invoices.getAll();
        var months = {};
        invoices.forEach(function(inv) {
          var d = new Date(inv.createdAt);
          var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
          if (!months[key]) months[key] = { invoiced: 0, paid: 0, count: 0 };
          months[key].invoiced += inv.total || 0;
          if (inv.status === 'paid') months[key].paid += inv.total || 0;
          months[key].count++;
        });
        headers = ['Month', 'Invoices', 'Total Invoiced', 'Total Collected'];
        data = Object.keys(months).sort().map(function(m) {
          return [m, months[m].count, months[m].invoiced.toFixed(2), months[m].paid.toFixed(2)];
        });
        filename = 'branch-manager-revenue.csv';
        break;
    }

    if (!data || !data.length) {
      UI.toast('No data to export', 'error');
      return;
    }

    // Build CSV
    var csv = headers.join(',') + '\n';
    data.forEach(function(row) {
      csv += row.map(function(cell) {
        var str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      }).join(',') + '\n';
    });

    // Download
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    UI.toast('Downloaded ' + filename);
  }
};

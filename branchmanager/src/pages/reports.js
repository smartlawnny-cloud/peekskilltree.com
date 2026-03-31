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
      var due = inv.dueDate ? new Date(inv.dueDate).getTime() : new Date(inv.createdAt).getTime();
      var days = Math.floor((now - due) / 86400000);
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
        var due = inv.dueDate ? new Date(inv.dueDate).getTime() : new Date(inv.createdAt).getTime();
        var days = Math.floor((now - due) / 86400000);
        var color = days > 90 ? '#b71c1c' : days > 60 ? '#c62828' : days > 30 ? '#e65100' : 'var(--text)';
        html += '<tr>'
          + '<td><strong>' + (inv.clientName || '—') + '</strong></td>'
          + '<td>#' + (inv.invoiceNumber || '') + '</td>'
          + '<td>' + UI.dateShort(inv.dueDate) + '</td>'
          + '<td style="font-weight:700;color:' + color + ';">' + (days > 0 ? days + 'd overdue' : 'Current') + '</td>'
          + '<td style="text-align:right;font-weight:600;">' + UI.money(inv.balance || inv.total) + '</td>'
          + '<td><button class="btn btn-outline" style="font-size:11px;padding:4px 10px;" onclick="Workflow.sendInvoice(\'' + inv.id + '\')">Send Reminder</button></td>'
          + '</tr>';
      });
      html += '</tbody></table>';
    } else {
      html += '<div style="text-align:center;padding:16px;color:var(--accent);font-weight:600;">All caught up! No outstanding invoices.</div>';
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

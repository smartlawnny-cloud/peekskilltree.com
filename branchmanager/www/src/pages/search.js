/**
 * Branch Manager — Global Search
 * Search across clients, jobs, invoices, quotes, requests
 */
var SearchPage = {
  render: function(query) {
    if (!query || query.length < 2) {
      return '<div class="empty-state"><div class="empty-icon">🔍</div><h3>Search</h3><p>Type at least 2 characters to search across clients, jobs, invoices, and quotes.</p></div>';
    }

    var q = query.toLowerCase();
    var results = [];

    // Search clients
    DB.clients.search(q).forEach(function(c) {
      results.push({ type: 'Client', icon: '👥', name: c.name, detail: c.address || c.phone || '', status: c.status, onclick: "ClientsPage.showDetail('" + c.id + "')" });
    });

    // Search jobs
    DB.jobs.search(q).forEach(function(j) {
      results.push({ type: 'Job', icon: '🔧', name: '#' + j.jobNumber + ' ' + (j.clientName || ''), detail: j.description || '', status: j.status, onclick: "JobsPage.showDetail('" + j.id + "')" });
    });

    // Search invoices
    DB.invoices.search(q).forEach(function(i) {
      results.push({ type: 'Invoice', icon: '💰', name: '#' + i.invoiceNumber + ' ' + (i.clientName || ''), detail: i.subject || '', status: i.status, onclick: "InvoicesPage.showDetail('" + i.id + "')" });
    });

    // Search quotes
    DB.quotes.search(q).forEach(function(qr) {
      results.push({ type: 'Quote', icon: '📋', name: '#' + qr.quoteNumber + ' ' + (qr.clientName || ''), detail: qr.description || '', status: qr.status, onclick: "QuotesPage.showDetail('" + qr.id + "')" });
    });

    // Search requests
    DB.requests.search(q).forEach(function(r) {
      results.push({ type: 'Request', icon: '📥', name: r.clientName || '', detail: r.property || '', status: r.status, onclick: "RequestsPage.showDetail('" + r.id + "')" });
    });

    if (results.length === 0) {
      return '<div class="empty-state"><div class="empty-icon">🔍</div><h3>No results for "' + query + '"</h3><p>Try a different search term.</p></div>';
    }

    var html = '<div style="font-size:14px;color:var(--text-light);margin-bottom:16px;">' + results.length + ' result' + (results.length !== 1 ? 's' : '') + ' for "' + query + '"</div>';

    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">';
    results.forEach(function(r) {
      html += '<div onclick="' + r.onclick + '" style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #f0f0f0;cursor:pointer;transition:background .1s;" onmouseover="this.style.background=\'#fafafa\'" onmouseout="this.style.background=\'#fff\'">'
        + '<span style="font-size:20px;">' + r.icon + '</span>'
        + '<div style="flex:1;">'
        + '<div style="font-weight:600;font-size:14px;">' + r.name + '</div>'
        + '<div style="font-size:12px;color:var(--text-light);">' + r.type + (r.detail ? ' — ' + r.detail : '') + '</div>'
        + '</div>'
        + UI.statusBadge(r.status)
        + '</div>';
    });
    html += '</div>';

    return html;
  }
};

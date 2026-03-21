/**
 * Branch Manager — Dashboard Page
 */
var DashboardPage = {
  render: function() {
    var stats = DB.dashboard.getStats();
    var todayJobs = DB.jobs.getToday();
    var upcoming = DB.jobs.getUpcoming().slice(0, 5);
    var unpaidInvoices = DB.invoices.getAll().filter(function(i) { return i.status !== 'paid' && i.balance > 0; });
    var recentRequests = DB.requests.getAll().filter(function(r) { return r.status === 'new'; }).slice(0, 5);

    var html = '<div class="stat-grid">'
      + UI.statCard("Today's Jobs", todayJobs.length.toString(), todayJobs.length ? todayJobs.map(function(j){return j.clientName;}).join(', ') : 'No visits scheduled', '', '', "loadPage('schedule')")
      + UI.statCard('Receivables', UI.moneyInt(stats.receivables), unpaidInvoices.length + ' clients owe you', stats.receivables > 0 ? 'down' : '', '', "loadPage('invoices')")
      + UI.statCard('New Requests', stats.newRequests.toString(), 'Awaiting response', stats.newRequests > 0 ? '' : '', '', "loadPage('requests')")
      + UI.statCard('Active Jobs', stats.activeJobs.toString(), 'In progress', '', '', "loadPage('jobs')")
      + '</div>';

    // Time clock widget
    html += TimeTrackPage.renderClockWidget();

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">';

    // Upcoming Jobs
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);">'
      + '<h3 style="font-size:16px;margin-bottom:16px;">Upcoming Jobs</h3>';
    if (upcoming.length) {
      upcoming.forEach(function(j) {
        html += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;cursor:pointer;" onclick="JobsPage.showDetail(\'' + j.id + '\')">'
          + '<div><strong style="font-size:14px;">' + j.clientName + '</strong><br><span style="font-size:12px;color:var(--text-light);">#' + j.jobNumber + ' — ' + (j.description || '') + '</span></div>'
          + '<div style="text-align:right;"><div style="font-size:13px;">' + UI.dateShort(j.scheduledDate) + '</div><div>' + UI.statusBadge(j.status) + '</div></div>'
          + '</div>';
      });
    } else {
      html += '<div style="text-align:center;padding:20px;color:var(--text-light);font-size:14px;">No upcoming jobs</div>';
    }
    html += '</div>';

    // Outstanding Invoices
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);">'
      + '<h3 style="font-size:16px;margin-bottom:16px;">Outstanding Invoices</h3>';
    if (unpaidInvoices.length) {
      unpaidInvoices.forEach(function(inv) {
        html += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;cursor:pointer;" onclick="InvoicesPage.showDetail(\'' + inv.id + '\')">'
          + '<div><strong style="font-size:14px;">' + inv.clientName + '</strong><br><span style="font-size:12px;color:var(--text-light);">#' + inv.invoiceNumber + ' — ' + (inv.subject || '') + '</span></div>'
          + '<div style="text-align:right;font-weight:700;color:var(--red);">' + UI.money(inv.balance) + '</div>'
          + '</div>';
      });
    } else {
      html += '<div style="text-align:center;padding:20px;color:var(--green-dark);font-size:14px;font-weight:600;">All caught up! No outstanding invoices.</div>';
    }
    html += '</div>';

    html += '</div>';

    // New Requests
    if (recentRequests.length) {
      html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-top:16px;">'
        + '<h3 style="font-size:16px;margin-bottom:16px;">New Requests</h3>';
      recentRequests.forEach(function(r) {
        html += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;cursor:pointer;" onclick="RequestsPage.showDetail(\'' + r.id + '\')">'
          + '<div><strong>' + r.clientName + '</strong> <span style="font-size:12px;color:var(--text-light);">' + (r.source || '') + '</span><br><span style="font-size:13px;color:var(--text-light);">' + (r.property || '') + '</span></div>'
          + '<div style="text-align:right;">' + UI.statusBadge(r.status) + '<br><span style="font-size:12px;color:var(--text-light);">' + UI.dateRelative(r.createdAt) + '</span></div>'
          + '</div>';
      });
      html += '</div>';
    }

    return html;
  }
};

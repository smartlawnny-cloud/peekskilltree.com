/**
 * Branch Manager — Weekly Business Summary
 * One-page overview of the week's performance
 */
var WeeklySummary = {
  render: function() {
    var now = new Date();
    var weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    var weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59);

    var invoices = DB.invoices.getAll();
    var jobs = DB.jobs.getAll();
    var quotes = DB.quotes.getAll();
    var requests = DB.requests.getAll();

    // This week's data
    var weekInvoices = invoices.filter(function(i) { var d = new Date(i.createdAt); return d >= weekStart && d <= weekEnd; });
    var weekJobs = jobs.filter(function(j) { var d = new Date(j.createdAt); return d >= weekStart && d <= weekEnd; });
    var weekQuotes = quotes.filter(function(q) { var d = new Date(q.createdAt); return d >= weekStart && d <= weekEnd; });
    var weekRequests = requests.filter(function(r) { var d = new Date(r.createdAt); return d >= weekStart && d <= weekEnd; });
    var weekCompleted = jobs.filter(function(j) { return j.status === 'completed' && j.completedDate && new Date(j.completedDate) >= weekStart && new Date(j.completedDate) <= weekEnd; });

    var weekRevenue = weekInvoices.reduce(function(s, i) { return s + (i.total || 0); }, 0);
    var weekCollected = weekInvoices.filter(function(i) { return i.status === 'paid'; }).reduce(function(s, i) { return s + (i.total || 0); }, 0);
    var weekQuoteValue = weekQuotes.reduce(function(s, q) { return s + (q.total || 0); }, 0);

    // Time entries this week
    var timeEntries = JSON.parse(localStorage.getItem('bm-time-entries') || '[]');
    var weekHours = timeEntries.filter(function(e) { return new Date(e.date) >= weekStart; })
      .reduce(function(s, e) { return s + (e.hours || 0); }, 0);

    var html = '<div style="text-align:center;margin-bottom:20px;">'
      + '<h2 style="font-size:22px;">📊 Weekly Summary</h2>'
      + '<div style="color:var(--text-light);font-size:14px;">' + UI.dateShort(weekStart.toISOString()) + ' — ' + UI.dateShort(weekEnd.toISOString()) + '</div></div>';

    // Key metrics
    html += '<div class="stat-grid">'
      + UI.statCard('Revenue', UI.moneyInt(weekRevenue), weekInvoices.length + ' invoices', weekRevenue > 0 ? 'up' : '', '')
      + UI.statCard('Collected', UI.moneyInt(weekCollected), '', weekCollected > 0 ? 'up' : '', '')
      + UI.statCard('Jobs Done', weekCompleted.length.toString(), weekHours.toFixed(1) + ' hours worked', '', '')
      + UI.statCard('New Leads', weekRequests.length.toString(), weekQuotes.length + ' quotes sent', '', '')
      + '</div>';

    // Activity breakdown
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="font-size:16px;margin-bottom:16px;">This Week\'s Activity</h3>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">';

    // Left: work done
    html += '<div>'
      + '<h4 style="font-size:13px;color:var(--text-light);margin-bottom:8px;">WORK COMPLETED</h4>';
    if (weekCompleted.length) {
      weekCompleted.forEach(function(j) {
        html += '<div style="padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:13px;">'
          + '<strong>' + j.clientName + '</strong>'
          + '<div style="color:var(--text-light);">' + (j.description || '') + ' · ' + UI.money(j.total || 0) + '</div></div>';
      });
    } else {
      html += '<div style="color:var(--text-light);font-size:13px;">No jobs completed this week</div>';
    }
    html += '</div>';

    // Right: pipeline
    html += '<div>'
      + '<h4 style="font-size:13px;color:var(--text-light);margin-bottom:8px;">NEW THIS WEEK</h4>';
    weekRequests.forEach(function(r) {
      html += '<div style="padding:4px 0;font-size:13px;">📥 <strong>' + r.clientName + '</strong> <span style="color:var(--text-light);">request</span></div>';
    });
    weekQuotes.forEach(function(q) {
      html += '<div style="padding:4px 0;font-size:13px;">📝 <strong>' + q.clientName + '</strong> <span style="color:var(--text-light);">' + UI.money(q.total) + '</span></div>';
    });
    if (!weekRequests.length && !weekQuotes.length) {
      html += '<div style="color:var(--text-light);font-size:13px;">No new leads this week</div>';
    }
    html += '</div></div></div>';

    // Outstanding
    var totalOutstanding = invoices.filter(function(i) { return i.balance > 0; });
    var outstandingTotal = totalOutstanding.reduce(function(s, i) { return s + (i.balance || i.total || 0); }, 0);

    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">'
      + '<h3 style="font-size:16px;">Outstanding Receivables</h3>'
      + '<span style="font-size:20px;font-weight:800;color:' + (outstandingTotal > 0 ? 'var(--red)' : 'var(--green-dark)') + ';">' + UI.moneyInt(outstandingTotal) + '</span></div>';
    if (totalOutstanding.length) {
      totalOutstanding.slice(0, 8).forEach(function(i) {
        html += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0;font-size:13px;">'
          + '<span>' + i.clientName + ' — #' + i.invoiceNumber + '</span>'
          + '<span style="font-weight:600;color:var(--red);">' + UI.money(i.balance || i.total) + '</span></div>';
      });
    } else {
      html += '<div style="color:var(--green-dark);font-size:14px;font-weight:600;text-align:center;padding:8px;">All caught up! 🎉</div>';
    }
    html += '</div>';

    // Score card
    var score = 0;
    if (weekRevenue > 0) score += 25;
    if (weekCompleted.length >= 3) score += 25;
    if (weekRequests.length >= 2) score += 25;
    if (weekQuotes.length >= 2) score += 25;
    var scoreColor = score >= 75 ? '#4caf50' : score >= 50 ? '#ff9800' : '#f44336';
    var scoreLabel = score >= 75 ? '🔥 Great week!' : score >= 50 ? '👍 Solid week' : '📈 Room to grow';

    html += '<div style="background:var(--green-dark);border-radius:12px;padding:24px;color:#fff;text-align:center;">'
      + '<div style="font-size:48px;font-weight:800;">' + score + '</div>'
      + '<div style="font-size:14px;opacity:.8;">Weekly Performance Score</div>'
      + '<div style="font-size:18px;font-weight:600;margin-top:8px;">' + scoreLabel + '</div>'
      + '<div style="height:8px;background:rgba(255,255,255,.2);border-radius:4px;margin-top:16px;overflow:hidden;">'
      + '<div style="height:100%;width:' + score + '%;background:' + scoreColor + ';border-radius:4px;"></div></div>'
      + '</div>';

    return html;
  }
};

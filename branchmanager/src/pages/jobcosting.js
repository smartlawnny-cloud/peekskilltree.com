/**
 * Branch Manager — Job Costing
 * Compare estimated vs actual costs per job
 * Track profitability by job, client, service type
 */
var JobCosting = {
  render: function() {
    var jobs = DB.jobs.getAll().filter(function(j) { return j.status === 'completed'; });
    var timeEntries = JSON.parse(localStorage.getItem('bm-time-entries') || '[]');
    var hourlyRate = parseFloat(localStorage.getItem('bm-my-rate') || '50');

    // Calculate profitability per job
    var costed = jobs.map(function(j) {
      var jobHours = timeEntries.filter(function(e) { return e.jobId === j.id; })
        .reduce(function(s, e) { return s + (e.hours || 0); }, 0);
      var laborCost = jobHours * hourlyRate;
      var expenses = JSON.parse(localStorage.getItem('bm-job-expenses-' + j.id) || '[]');
      var expenseTotal = expenses.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
      var totalCost = laborCost + expenseTotal;
      var revenue = j.total || 0;
      var profit = revenue - totalCost;
      var margin = revenue > 0 ? Math.round(profit / revenue * 100) : 0;

      return {
        id: j.id, clientName: j.clientName, description: j.description,
        revenue: revenue, laborCost: laborCost, expenseTotal: expenseTotal,
        totalCost: totalCost, profit: profit, margin: margin,
        hours: jobHours, completedDate: j.completedDate || j.createdAt
      };
    });

    // Sort by date
    costed.sort(function(a, b) { return new Date(b.completedDate) - new Date(a.completedDate); });

    var totalRevenue = costed.reduce(function(s, j) { return s + j.revenue; }, 0);
    var totalCost = costed.reduce(function(s, j) { return s + j.totalCost; }, 0);
    var totalProfit = totalRevenue - totalCost;
    var avgMargin = totalRevenue > 0 ? Math.round(totalProfit / totalRevenue * 100) : 0;
    var avgJobValue = costed.length > 0 ? Math.round(totalRevenue / costed.length) : 0;

    var html = '<div class="stat-grid">'
      + UI.statCard('Avg Job Value', UI.moneyInt(avgJobValue), costed.length + ' completed jobs', '', '')
      + UI.statCard('Total Revenue', UI.moneyInt(totalRevenue), 'All completed jobs', 'up', '')
      + UI.statCard('Total Costs', UI.moneyInt(totalCost), 'Labor + expenses', '', '')
      + UI.statCard('Profit Margin', avgMargin + '%', UI.moneyInt(totalProfit) + ' profit', avgMargin >= 30 ? 'up' : 'down', '')
      + '</div>';

    // Profitability chart
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="font-size:16px;margin-bottom:16px;">Job Profitability</h3>'
      + '<table class="data-table"><thead><tr>'
      + '<th>Client</th><th>Job</th><th style="text-align:right;">Revenue</th><th style="text-align:right;">Cost</th><th style="text-align:right;">Profit</th><th style="text-align:right;">Margin</th>'
      + '</tr></thead><tbody>';

    costed.slice(0, 20).forEach(function(j) {
      var marginColor = j.margin >= 40 ? '#4caf50' : j.margin >= 20 ? '#ff9800' : '#f44336';
      html += '<tr style="cursor:pointer;" onclick="JobCosting.showDetail(\'' + j.id + '\')">'
        + '<td><strong>' + j.clientName + '</strong></td>'
        + '<td style="font-size:12px;color:var(--text-light);">' + (j.description || '').substring(0, 30) + '</td>'
        + '<td style="text-align:right;">' + UI.money(j.revenue) + '</td>'
        + '<td style="text-align:right;color:var(--text-light);">' + UI.money(j.totalCost) + '</td>'
        + '<td style="text-align:right;font-weight:600;color:' + (j.profit >= 0 ? 'var(--green-dark)' : 'var(--red)') + ';">' + UI.money(j.profit) + '</td>'
        + '<td style="text-align:right;"><span style="background:' + marginColor + ';color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">' + j.margin + '%</span></td>'
        + '</tr>';
    });

    if (costed.length === 0) {
      html += '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-light);">Complete jobs and track time to see profitability.</td></tr>';
    }
    html += '</tbody></table></div>';

    // Tips
    html += '<div style="background:var(--green-bg);border-radius:12px;padding:16px;border:1px solid #c8e6c9;font-size:13px;">'
      + '<strong style="color:var(--green-dark);">💡 Profitability Tips:</strong>'
      + '<ul style="margin:8px 0 0;padding-left:20px;color:var(--text-light);line-height:1.8;">'
      + '<li>Track time on EVERY job — even 30-minute stops</li>'
      + '<li>Log fuel, dump fees, and material costs per job</li>'
      + '<li>Target 35-50% profit margin on tree work</li>'
      + '<li>Jobs under 20% margin need pricing adjustment</li>'
      + '</ul></div>';

    return html;
  },

  showDetail: function(jobId) {
    var j = DB.jobs.getById(jobId);
    if (!j) return;
    // Show job detail with costing breakdown
    JobsPage.showDetail(jobId);
  }
};

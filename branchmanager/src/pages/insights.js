/**
 * Branch Manager — Insights Page
 * Revenue charts, funnel metrics, marketing source breakdown
 */
var InsightsPage = {
  render: function() {
    var allInvoices = DB.invoices.getAll();
    var allJobs = DB.jobs.getAll();
    var allQuotes = DB.quotes.getAll();
    var allRequests = DB.requests.getAll();
    var allClients = DB.clients.getAll();

    var now = new Date();
    var year = now.getFullYear();

    // Revenue by month (current year)
    var monthlyRev = [];
    var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    for (var m = 0; m < 12; m++) {
      var rev = allInvoices.filter(function(inv) {
        if (inv.status !== 'paid') return false;
        var d = new Date(inv.paidDate || inv.createdAt);
        return d.getFullYear() === year && d.getMonth() === m;
      }).reduce(function(sum, inv) { return sum + (inv.total || 0); }, 0);
      monthlyRev.push({ month: monthNames[m], revenue: rev });
    }
    var maxRev = Math.max.apply(null, monthlyRev.map(function(m) { return m.revenue; })) || 1;

    // Total revenue
    var totalRevYear = monthlyRev.reduce(function(s, m) { return s + m.revenue; }, 0);
    var totalReceivable = DB.invoices.totalReceivable();

    // Marketing source breakdown with auto-categorization
    var SOURCE_MAP = {
      'google': 'Google Search', 'google search': 'Google Search', 'google maps': 'Google Search',
      'gbp': 'Google Search', 'organic': 'Google Search', 'seo': 'Google Search',
      'facebook': 'Facebook', 'fb': 'Facebook', 'facebook ad': 'Facebook',
      'instagram': 'Instagram', 'ig': 'Instagram', 'insta': 'Instagram',
      'nextdoor': 'Nextdoor', 'next door': 'Nextdoor',
      'referral': 'Referral', 'friend': 'Referral', 'friend/referral': 'Referral',
      'word of mouth': 'Referral', 'neighbor': 'Referral', 'family': 'Referral',
      'yelp': 'Yelp', 'angi': 'Angi', 'angies list': 'Angi', 'angie': 'Angi',
      'thumbtack': 'Thumbtack', 'porch': 'Porch', 'homeadvisor': 'HomeAdvisor',
      'drive-by': 'Drive-by', 'driveby': 'Drive-by', 'sign': 'Drive-by', 'truck': 'Drive-by', 'saw truck': 'Drive-by',
      'repeat': 'Repeat Client', 'repeat client': 'Repeat Client', 'existing': 'Repeat Client', 'returning': 'Repeat Client',
      'website': 'Website', 'web': 'Website', 'online': 'Website',
      'flyer': 'Flyer/Mailer', 'mailer': 'Flyer/Mailer', 'postcard': 'Flyer/Mailer', 'door hanger': 'Flyer/Mailer'
    };
    var sources = {};
    allRequests.forEach(function(r) {
      var raw = (r.source || 'Unknown').trim();
      var normalized = SOURCE_MAP[raw.toLowerCase()] || raw;
      sources[normalized] = (sources[normalized] || 0) + 1;
    });
    var sourceList = Object.keys(sources).map(function(k) { return { source: k, count: sources[k] }; })
      .sort(function(a, b) { return b.count - a.count; });

    // Funnel
    var totalLeads = allClients.length;
    var totalRequests = allRequests.length;
    var totalQuotes = allQuotes.length;
    var convertedQuotes = allQuotes.filter(function(q) { return q.status === 'approved' || q.status === 'converted'; }).length;
    var totalJobs = allJobs.length;
    var completedJobs = allJobs.filter(function(j) { return j.status === 'completed'; }).length;

    var html = '';

    // Revenue stats
    html += '<div class="stat-grid">'
      + UI.statCard('Revenue (' + year + ')', UI.moneyInt(totalRevYear), 'Year to date', '', '')
      + UI.statCard('Receivables', UI.moneyInt(totalReceivable), 'Outstanding', totalReceivable > 0 ? 'down' : '', '')
      + UI.statCard('Total Jobs', totalJobs.toString(), completedJobs + ' completed', '', '')
      + UI.statCard('Avg Invoice', allInvoices.length > 0 ? UI.moneyInt(allInvoices.reduce(function(s,i){return s+i.total;},0) / allInvoices.length) : '$0', allInvoices.length + ' invoices', '', '')
      + '</div>';

    // Revenue bar chart
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="margin-bottom:16px;">Revenue by Month — ' + year + '</h3>'
      + '<div style="display:flex;align-items:flex-end;gap:6px;height:200px;padding-bottom:24px;position:relative;">';

    monthlyRev.forEach(function(m, i) {
      var h = maxRev > 0 ? Math.max((m.revenue / maxRev) * 180, m.revenue > 0 ? 8 : 2) : 2;
      var isCurrentMonth = i === now.getMonth();
      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;">'
        + (m.revenue > 0 ? '<div style="font-size:10px;font-weight:700;color:var(--green-dark);margin-bottom:2px;">' + UI.moneyInt(m.revenue) + '</div>' : '')
        + '<div style="width:100%;max-width:40px;height:' + h + 'px;background:' + (isCurrentMonth ? 'var(--green-dark)' : 'var(--green-light)') + ';border-radius:4px 4px 0 0;opacity:' + (m.revenue > 0 ? '1' : '.2') + ';"></div>'
        + '<div style="font-size:10px;color:var(--text-light);margin-top:4px;' + (isCurrentMonth ? 'font-weight:700;color:var(--green-dark);' : '') + '">' + m.month + '</div>'
        + '</div>';
    });
    html += '</div></div>';

    // Funnel + Sources side by side
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">';

    // Funnel
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);">'
      + '<h3 style="margin-bottom:16px;">Pipeline Funnel</h3>';
    var quoteRate = totalLeads > 0 ? Math.round((totalQuotes / totalLeads) * 100) : 0;
    var closeRate = totalQuotes > 0 ? Math.round((convertedQuotes / totalQuotes) * 100) : 0;
    var completeRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
    var funnelData = [
      { label: 'Clients', count: totalLeads, color: '#2196f3', rate: '' },
      { label: 'Requests', count: totalRequests, color: '#42a5f5', rate: '' },
      { label: 'Quotes Sent', count: totalQuotes, color: '#66bb6a', rate: quoteRate + '% quoted' },
      { label: 'Converted', count: convertedQuotes, color: '#4caf50', rate: closeRate + '% close rate' },
      { label: 'Jobs', count: totalJobs, color: '#2e7d32', rate: '' },
      { label: 'Completed', count: completedJobs, color: '#1b5e20', rate: completeRate + '% complete' }
    ];
    var funnelMax = Math.max.apply(null, funnelData.map(function(f) { return f.count; })) || 1;
    funnelData.forEach(function(f) {
      var pct = Math.round((f.count / funnelMax) * 100);
      html += '<div style="margin-bottom:8px;">'
        + '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:2px;"><span>' + f.label + (f.rate ? ' <span style="font-size:11px;color:var(--text-light);font-weight:400;">(' + f.rate + ')</span>' : '') + '</span><strong>' + f.count + '</strong></div>'
        + '<div style="background:var(--bg);border-radius:4px;height:20px;overflow:hidden;">'
        + '<div style="background:' + f.color + ';height:100%;width:' + pct + '%;border-radius:4px;transition:width .3s;"></div>'
        + '</div></div>';
    });
    html += '</div>';

    // Marketing sources
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);">'
      + '<h3 style="margin-bottom:16px;">Lead Sources</h3>';
    if (sourceList.length === 0) {
      html += '<div style="text-align:center;color:var(--text-light);padding:20px;font-size:14px;">No request data yet</div>';
    } else {
      var sourceColors = ['#4caf50','#2196f3','#ff9800','#9c27b0','#f44336','#00bcd4','#795548','#607d8b'];
      sourceList.forEach(function(s, i) {
        var pct = Math.round((s.count / totalRequests) * 100);
        html += '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #f0f0f0;">'
          + '<div style="width:10px;height:10px;border-radius:50%;background:' + (sourceColors[i % sourceColors.length]) + ';flex-shrink:0;"></div>'
          + '<div style="flex:1;font-size:14px;">' + s.source + '</div>'
          + '<div style="font-weight:700;font-size:14px;">' + s.count + '</div>'
          + '<div style="font-size:12px;color:var(--text-light);">' + pct + '%</div>'
          + '</div>';
      });
    }
    html += '</div></div>';

    return html;
  }
};

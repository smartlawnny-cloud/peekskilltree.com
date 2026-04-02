/**
 * Branch Manager — Insights Page
 * Revenue charts, funnel metrics, marketing source breakdown
 */
var InsightsPage = {
  _year: null, // null = current year

  render: function() {
    var allInvoices = DB.invoices.getAll();
    var allJobs = DB.jobs.getAll();
    var allQuotes = DB.quotes.getAll();
    var allRequests = DB.requests.getAll();
    var allClients = DB.clients.getAll();

    var now = new Date();
    var year = InsightsPage._year || now.getFullYear();

    // Find available years from invoice data
    var yearsSet = {};
    allInvoices.forEach(function(inv) { yearsSet[new Date(inv.createdAt).getFullYear()] = true; });
    var availableYears = Object.keys(yearsSet).map(Number).sort().reverse();
    if (availableYears.indexOf(now.getFullYear()) === -1) availableYears.unshift(now.getFullYear());

    // Revenue by month (selected year)
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

    // Year picker
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
      + '<h2 style="font-size:18px;font-weight:700;">Insights</h2>'
      + '<div style="display:flex;gap:4px;background:var(--bg);border-radius:8px;padding:3px;">';
    availableYears.forEach(function(y) {
      var active = y === year;
      html += '<button onclick="InsightsPage._year=' + y + ';loadPage(\'insights\')" style="border:none;padding:6px 14px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;'
        + (active ? 'background:var(--green-dark);color:#fff;' : 'background:transparent;color:var(--text);') + '">' + y + '</button>';
    });
    html += '</div></div>';

    // Revenue stats
    var yearInvoices = allInvoices.filter(function(i) { return new Date(i.createdAt).getFullYear() === year; });
    var yearAvgInv = yearInvoices.length > 0 ? yearInvoices.reduce(function(s,i){return s+i.total;},0) / yearInvoices.length : 0;
    html += '<div class="stat-grid">'
      + UI.statCard('Revenue ' + year, UI.moneyInt(totalRevYear), 'Paid invoices', totalRevYear > 0 ? 'up' : '', '')
      + UI.statCard('Receivables', UI.moneyInt(totalReceivable), 'Outstanding balance', totalReceivable > 0 ? 'down' : '', '')
      + UI.statCard('Jobs', totalJobs.toString(), completedJobs + ' completed', '', '')
      + UI.statCard('Avg Invoice', yearAvgInv > 0 ? UI.moneyInt(yearAvgInv) : '$0', yearInvoices.length + ' invoices ' + year, '', '')
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

    // Revenue by Service Type (beyond Jobber)
    var serviceRevenue = {};
    allJobs.forEach(function(j) {
      var desc = j.description || j.property || 'Other';
      // Normalize service type from description
      var serviceType = 'Other';
      var descLower = desc.toLowerCase();
      if (descLower.indexOf('removal') !== -1 || descLower.indexOf('remove') !== -1) serviceType = 'Tree Removal';
      else if (descLower.indexOf('prun') !== -1 || descLower.indexOf('trim') !== -1) serviceType = 'Pruning/Trimming';
      else if (descLower.indexOf('stump') !== -1) serviceType = 'Stump Grinding';
      else if (descLower.indexOf('cable') !== -1 || descLower.indexOf('cabling') !== -1) serviceType = 'Cabling';
      else if (descLower.indexOf('snow') !== -1) serviceType = 'Snow Removal';
      else if (descLower.indexOf('clean') !== -1 || descLower.indexOf('debris') !== -1) serviceType = 'Clean Up';
      else if (descLower.indexOf('firewood') !== -1 || descLower.indexOf('wood') !== -1) serviceType = 'Firewood';
      else if (descLower.indexOf('fence') !== -1) serviceType = 'Fence Work';
      else if (descLower.indexOf('consult') !== -1 || descLower.indexOf('assess') !== -1 || descLower.indexOf('arborist') !== -1) serviceType = 'Consultation';
      if (!serviceRevenue[serviceType]) serviceRevenue[serviceType] = { count: 0, revenue: 0 };
      serviceRevenue[serviceType].count++;
      serviceRevenue[serviceType].revenue += (j.total || 0);
    });
    var serviceList = Object.keys(serviceRevenue).map(function(k) {
      return { name: k, count: serviceRevenue[k].count, revenue: serviceRevenue[k].revenue };
    }).sort(function(a, b) { return b.revenue - a.revenue; });
    var maxServiceRev = serviceList.length > 0 ? serviceList[0].revenue : 1;
    var svcColors = ['#2e7d32','#1565c0','#e65100','#6a1b9a','#c62828','#00838f','#4e342e','#37474f','#558b2f','#ad1457'];

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;">';

    // Revenue by service type
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);">'
      + '<h3 style="margin-bottom:16px;">Revenue by Service Type</h3>';
    if (serviceList.length === 0) {
      html += '<div style="text-align:center;color:var(--text-light);padding:20px;">No job data yet</div>';
    } else {
      serviceList.slice(0, 8).forEach(function(s, idx) {
        var pct = Math.round((s.revenue / maxServiceRev) * 100);
        html += '<div style="margin-bottom:10px;">'
          + '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px;">'
          + '<span style="font-weight:600;">' + UI.esc(s.name) + ' <span style="font-weight:400;color:var(--text-light);">(' + s.count + ' jobs)</span></span>'
          + '<span style="font-weight:700;">' + UI.moneyInt(s.revenue) + '</span></div>'
          + '<div style="height:8px;background:var(--bg);border-radius:4px;overflow:hidden;">'
          + '<div style="height:100%;width:' + pct + '%;background:' + svcColors[idx % svcColors.length] + ';border-radius:4px;"></div>'
          + '</div></div>';
      });
    }
    html += '</div>';

    // Top clients by revenue
    var clientRevenue = {};
    allJobs.forEach(function(j) {
      var name = j.clientName || 'Unknown';
      if (!clientRevenue[name]) clientRevenue[name] = { count: 0, revenue: 0 };
      clientRevenue[name].count++;
      clientRevenue[name].revenue += (j.total || 0);
    });
    var topClients = Object.keys(clientRevenue).map(function(k) {
      return { name: k, count: clientRevenue[k].count, revenue: clientRevenue[k].revenue };
    }).sort(function(a, b) { return b.revenue - a.revenue; });

    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);">'
      + '<h3 style="margin-bottom:16px;">Top Clients by Revenue</h3>';
    if (topClients.length === 0) {
      html += '<div style="text-align:center;color:var(--text-light);padding:20px;">No client data yet</div>';
    } else {
      topClients.slice(0, 10).forEach(function(c, idx) {
        html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f5f5f5;">'
          + '<div style="width:24px;height:24px;border-radius:50%;background:' + svcColors[idx % svcColors.length] + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">' + (idx + 1) + '</div>'
          + '<div style="flex:1;min-width:0;">'
          + '<div style="font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + UI.esc(c.name) + '</div>'
          + '<div style="font-size:11px;color:var(--text-light);">' + c.count + ' job' + (c.count !== 1 ? 's' : '') + '</div>'
          + '</div>'
          + '<div style="font-weight:700;font-size:14px;">' + UI.moneyInt(c.revenue) + '</div>'
          + '</div>';
      });
    }
    html += '</div></div>';

    // Conversion metrics
    var avgJobValue = completedJobs > 0 ? allJobs.filter(function(j){return j.status==='completed';}).reduce(function(s,j){return s+(j.total||0);},0) / completedJobs : 0;
    var avgQuoteValue = totalQuotes > 0 ? allQuotes.reduce(function(s,q){return s+(q.total||0);},0) / totalQuotes : 0;
    var quotesToJobDays = [];
    allJobs.forEach(function(j) {
      if (j.quoteId) {
        var quote = DB.quotes.getById(j.quoteId);
        if (quote && quote.createdAt && j.createdAt) {
          var days = Math.round((new Date(j.createdAt) - new Date(quote.createdAt)) / 86400000);
          if (days >= 0 && days < 365) quotesToJobDays.push(days);
        }
      }
    });
    var avgConversionDays = quotesToJobDays.length > 0 ? Math.round(quotesToJobDays.reduce(function(s,d){return s+d;},0) / quotesToJobDays.length) : null;

    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px;" class="stat-row">'
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center;">'
      + '<div style="font-size:11px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;">Avg Job Value</div>'
      + '<div style="font-size:24px;font-weight:800;color:var(--green-dark);margin-top:4px;">' + UI.moneyInt(avgJobValue) + '</div></div>'
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center;">'
      + '<div style="font-size:11px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;">Avg Quote Value</div>'
      + '<div style="font-size:24px;font-weight:800;color:#1565c0;margin-top:4px;">' + UI.moneyInt(avgQuoteValue) + '</div></div>'
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center;">'
      + '<div style="font-size:11px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;">Close Rate</div>'
      + '<div style="font-size:24px;font-weight:800;color:#e65100;margin-top:4px;">' + closeRate + '%</div></div>'
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center;">'
      + '<div style="font-size:11px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;">Quote → Job</div>'
      + '<div style="font-size:24px;font-weight:800;color:#6a1b9a;margin-top:4px;">' + (avgConversionDays !== null ? avgConversionDays + ' days' : '—') + '</div></div>'
      + '</div>';

    return html;
  }
};

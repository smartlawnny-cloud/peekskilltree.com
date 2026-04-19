/**
 * Branch Manager — Marketing Dashboard
 * Lead sources, conversion funnel, revenue by source, response time,
 * SocialPilot + GBP snapshot stubs.
 */
var MarketingPage = (function() {
  var _range = 90; // days: 30 / 90 / 365

  var SOURCE_COLORS = [
    '#2563eb', '#16a34a', '#f59e0b', '#ef4444',
    '#8b5cf6', '#0ea5e9', '#ec4899', '#14b8a6',
    '#f97316', '#6366f1', '#84cc16', '#64748b'
  ];

  function colorFor(i) { return SOURCE_COLORS[i % SOURCE_COLORS.length]; }

  function getRequests() { try { return DB.requests ? DB.requests.getAll() : DB.getAll('bm-requests'); } catch (e) { return []; } }
  function getQuotes()   { try { return DB.quotes   ? DB.quotes.getAll()   : DB.getAll('bm-quotes');   } catch (e) { return []; } }
  function getJobs()     { try { return DB.jobs     ? DB.jobs.getAll()     : DB.getAll('bm-jobs');     } catch (e) { return []; } }
  function getInvoices() { try { return DB.invoices ? DB.invoices.getAll() : DB.getAll('bm-invoices'); } catch (e) { return []; } }

  function parseTs(d) {
    if (!d) return 0;
    var t = new Date(d).getTime();
    return isNaN(t) ? 0 : t;
  }

  function withinRange(dateStr, days) {
    if (!days) return true;
    var t = parseTs(dateStr);
    if (!t) return false;
    var cutoff = Date.now() - days * 86400000;
    return t >= cutoff;
  }

  function card(inner, extra) {
    return '<div class="quote-card" style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:18px;box-shadow:0 1px 2px rgba(0,0,0,.04);' + (extra || '') + '">' + inner + '</div>';
  }

  function emptyState(emoji, msg, ctaHtml) {
    return '<div style="text-align:center;padding:28px 12px;color:#64748b;">'
      + '<div style="font-size:34px;margin-bottom:6px;">' + emoji + '</div>'
      + '<div style="font-size:14px;margin-bottom:10px;">' + msg + '</div>'
      + (ctaHtml || '')
      + '</div>';
  }

  // ---------- Lead sources ----------
  function renderLeadSources() {
    var reqs = getRequests().filter(function(r) { return withinRange(r.createdAt || r.created_at || r.date, _range); });
    var counts = {};
    reqs.forEach(function(r) {
      var s = (r.source || 'Unknown').toString().trim() || 'Unknown';
      counts[s] = (counts[s] || 0) + 1;
    });
    var entries = Object.keys(counts).map(function(k) { return { source: k, count: counts[k] }; })
      .sort(function(a, b) { return b.count - a.count; });

    var inner = '<h3 style="margin:0 0 4px;font-size:16px;">📣 Lead Sources</h3>'
      + '<div style="font-size:12px;color:#64748b;margin-bottom:12px;">Where your ' + reqs.length + ' requests came from (last ' + _range + ' days)</div>';

    if (!entries.length) {
      inner += emptyState('📊', 'No requests in this window yet.',
        '<button class="btn btn-primary" onclick="loadPage(\'requests\')">Go to Requests</button>');
      return card(inner);
    }

    var max = entries[0].count;
    inner += '<div style="display:flex;flex-direction:column;gap:8px;">';
    entries.forEach(function(e, i) {
      var pct = Math.max(4, Math.round((e.count / max) * 100));
      var color = colorFor(i);
      var label = UI.esc(e.source);
      inner += '<div style="cursor:pointer;" onclick="MarketingPage.filterBySource(\'' + label.replace(/'/g, "\\'") + '\')" title="Click to filter Requests">'
        + '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px;">'
        + '<span style="font-weight:600;">' + label + '</span>'
        + '<span style="color:#475569;">' + e.count + '</span>'
        + '</div>'
        + '<div style="background:#f1f5f9;border-radius:6px;height:12px;overflow:hidden;">'
        + '<div style="width:' + pct + '%;background:' + color + ';height:100%;border-radius:6px;"></div>'
        + '</div>'
        + '</div>';
    });
    inner += '</div>';
    return card(inner);
  }

  // ---------- Conversion funnel ----------
  function renderFunnel() {
    var reqs = getRequests().filter(function(r) { return withinRange(r.createdAt || r.created_at || r.date, _range); });
    var quotes = getQuotes().filter(function(q) { return withinRange(q.createdAt || q.created_at || q.date, _range); });
    var jobs = getJobs().filter(function(j) { return withinRange(j.createdAt || j.created_at || j.scheduledDate, _range); });

    var sentStatuses = { sent: 1, awaiting: 1, approved: 1, converted: 1, declined: 1 };
    var approvedStatuses = { approved: 1, converted: 1 };

    var stages = [
      { label: 'Requests', count: reqs.length, color: '#2563eb' },
      { label: 'Quotes Sent', count: quotes.filter(function(q) { return sentStatuses[q.status]; }).length, color: '#0ea5e9' },
      { label: 'Quotes Approved', count: quotes.filter(function(q) { return approvedStatuses[q.status]; }).length, color: '#16a34a' },
      { label: 'Jobs Completed', count: jobs.filter(function(j) { return j.status === 'completed'; }).length, color: '#f59e0b' }
    ];
    var top = Math.max.apply(null, stages.map(function(s) { return s.count; }).concat([1]));

    var inner = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;flex-wrap:wrap;">'
      + '<div>'
      + '<h3 style="margin:0;font-size:16px;">🔻 Conversion Funnel</h3>'
      + '<div style="font-size:12px;color:#64748b;">Drop-off between stages</div>'
      + '</div>'
      + '<div style="display:flex;gap:4px;">'
      + [30, 90, 365].map(function(d) {
        var active = _range === d;
        return '<button onclick="MarketingPage.setRange(' + d + ')" style="padding:6px 10px;border:1px solid ' + (active ? '#2563eb' : 'var(--border)') + ';background:' + (active ? '#2563eb' : '#fff') + ';color:' + (active ? '#fff' : '#0f172a') + ';border-radius:6px;font-size:12px;cursor:pointer;font-weight:600;">' + (d === 365 ? '1y' : d + 'd') + '</button>';
      }).join('')
      + '</div>'
      + '</div>';

    if (stages[0].count === 0) {
      inner += emptyState('📊', 'No funnel data yet — add requests to see conversion.', '');
      return card(inner);
    }

    inner += '<div style="display:flex;flex-direction:column;gap:6px;">';
    stages.forEach(function(s, i) {
      var pct = Math.max(3, Math.round((s.count / top) * 100));
      var dropText = '';
      if (i > 0) {
        var prev = stages[i - 1].count;
        var drop = prev ? Math.round((s.count / prev) * 100) : 0;
        dropText = '<span style="font-size:11px;color:#64748b;margin-left:8px;">' + drop + '% of prev</span>';
      }
      inner += '<div>'
        + '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px;">'
        + '<span style="font-weight:600;">' + s.label + dropText + '</span>'
        + '<span style="color:#475569;font-weight:600;">' + s.count + '</span>'
        + '</div>'
        + '<div style="background:#f1f5f9;border-radius:6px;height:16px;overflow:hidden;">'
        + '<div style="width:' + pct + '%;background:' + s.color + ';height:100%;border-radius:6px;"></div>'
        + '</div>'
        + '</div>';
    });
    inner += '</div>';

    return card(inner);
  }

  // ---------- Revenue by source ----------
  function renderRevenueBySource() {
    var reqs = getRequests();
    var invoices = getInvoices().filter(function(i) { return i.status === 'paid'; });
    var jobs = getJobs();

    // Build clientId -> source map from requests (use most recent)
    var clientSource = {};
    reqs.forEach(function(r) {
      if (!r.clientId) return;
      var s = (r.source || '').toString().trim();
      if (!s) return;
      var t = parseTs(r.createdAt);
      if (!clientSource[r.clientId] || t > clientSource[r.clientId].t) {
        clientSource[r.clientId] = { source: s, t: t };
      }
    });

    // Build jobId -> source map (job may be linked to a request)
    var jobSource = {};
    jobs.forEach(function(j) {
      var src = null;
      if (j.requestId) {
        var req = reqs.filter(function(r) { return r.id === j.requestId; })[0];
        if (req && req.source) src = req.source;
      }
      if (!src && j.clientId && clientSource[j.clientId]) src = clientSource[j.clientId].source;
      if (src) jobSource[j.id] = src;
    });

    var totals = {};
    invoices.forEach(function(inv) {
      var src = null;
      if (inv.jobId && jobSource[inv.jobId]) src = jobSource[inv.jobId];
      else if (inv.clientId && clientSource[inv.clientId]) src = clientSource[inv.clientId].source;
      src = src || 'Unknown';
      totals[src] = (totals[src] || 0) + (+inv.total || 0);
    });

    var rows = Object.keys(totals).map(function(k) { return { source: k, total: totals[k] }; })
      .sort(function(a, b) { return b.total - a.total; });

    var inner = '<h3 style="margin:0 0 4px;font-size:16px;">💰 Revenue by Source</h3>'
      + '<div style="font-size:12px;color:#64748b;margin-bottom:12px;">Paid invoices attributed back to the lead source</div>';

    if (!rows.length) {
      inner += emptyState('📊', 'No paid invoices yet — revenue will attribute automatically.', '');
      return card(inner);
    }

    var grand = rows.reduce(function(s, r) { return s + r.total; }, 0);
    inner += '<table style="width:100%;border-collapse:collapse;font-size:13px;">'
      + '<thead><tr style="text-align:left;border-bottom:1px solid var(--border);color:#64748b;">'
      + '<th style="padding:6px 4px;">Source</th>'
      + '<th style="padding:6px 4px;text-align:right;">Revenue</th>'
      + '<th style="padding:6px 4px;text-align:right;">% of Total</th>'
      + '</tr></thead><tbody>';
    rows.forEach(function(r) {
      var pct = grand ? Math.round((r.total / grand) * 100) : 0;
      inner += '<tr style="border-bottom:1px solid #f1f5f9;">'
        + '<td style="padding:8px 4px;font-weight:600;">' + UI.esc(r.source) + '</td>'
        + '<td style="padding:8px 4px;text-align:right;">' + UI.money(r.total) + '</td>'
        + '<td style="padding:8px 4px;text-align:right;color:#64748b;">' + pct + '%</td>'
        + '</tr>';
    });
    inner += '</tbody></table>';
    return card(inner);
  }

  // ---------- Response time ----------
  function renderResponseTime() {
    var reqs = getRequests();
    var quotes = getQuotes();

    // Map clientId -> earliest quote createdAt
    var firstQuoteByClient = {};
    quotes.forEach(function(q) {
      if (!q.clientId) return;
      var t = parseTs(q.createdAt || q.created_at || q.date);
      if (!t) return;
      if (!firstQuoteByClient[q.clientId] || t < firstQuoteByClient[q.clientId]) {
        firstQuoteByClient[q.clientId] = t;
      }
    });

    var diffs = [];
    reqs.forEach(function(r) {
      if (!r.clientId) return;
      var rt = parseTs(r.createdAt || r.created_at || r.date);
      var qt = firstQuoteByClient[r.clientId];
      if (!rt || !qt || qt < rt) return;
      diffs.push((qt - rt) / 3600000); // hours
    });

    var inner = '<h3 style="margin:0 0 4px;font-size:16px;">⏱ Response Time</h3>'
      + '<div style="font-size:12px;color:#64748b;margin-bottom:12px;">Avg hours: request → first quote</div>';

    if (!diffs.length) {
      inner += emptyState('📊', 'Not enough paired requests + quotes yet.', '');
      return card(inner);
    }

    var avg = diffs.reduce(function(s, d) { return s + d; }, 0) / diffs.length;
    var median = diffs.slice().sort(function(a, b) { return a - b; })[Math.floor(diffs.length / 2)];
    var color = avg < 2 ? '#16a34a' : (avg < 24 ? '#f59e0b' : '#ef4444');
    var label = avg < 2 ? 'Excellent' : (avg < 24 ? 'Acceptable' : 'Too Slow');

    inner += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      + '<div style="text-align:center;padding:16px;background:#f8fafc;border-radius:10px;">'
      + '<div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Avg Response</div>'
      + '<div style="font-size:28px;font-weight:700;color:' + color + ';margin:4px 0;">' + avg.toFixed(1) + 'h</div>'
      + '<div style="font-size:12px;color:' + color + ';font-weight:600;">' + label + '</div>'
      + '</div>'
      + '<div style="text-align:center;padding:16px;background:#f8fafc;border-radius:10px;">'
      + '<div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Median</div>'
      + '<div style="font-size:28px;font-weight:700;color:#0f172a;margin:4px 0;">' + median.toFixed(1) + 'h</div>'
      + '<div style="font-size:12px;color:#64748b;">across ' + diffs.length + ' pairs</div>'
      + '</div>'
      + '</div>'
      + '<div style="font-size:11px;color:#64748b;margin-top:10px;text-align:center;">Benchmark: &lt;2h green · &lt;24h amber · &gt;24h red</div>';
    return card(inner);
  }

  // ---------- SocialPilot ----------
  function renderSocial() {
    var key = '';
    try { key = localStorage.getItem('bm-socialpilot-key') || ''; } catch (e) {}
    var inner = '<h3 style="margin:0 0 4px;font-size:16px;">📱 Social Media</h3>';

    if (key) {
      inner += '<div style="font-size:12px;color:#64748b;margin-bottom:12px;">SocialPilot connected</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
        + '<div style="padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;text-align:center;">'
        + '<div style="font-size:11px;color:#166534;text-transform:uppercase;">Status</div>'
        + '<div style="font-size:18px;font-weight:700;color:#166534;">✓ Connected</div></div>'
        + '<div style="padding:12px;background:#f8fafc;border:1px solid var(--border);border-radius:8px;text-align:center;">'
        + '<div style="font-size:11px;color:#64748b;text-transform:uppercase;">Posts</div>'
        + '<div style="font-size:18px;font-weight:700;">—</div>'
        + '<div style="font-size:11px;color:#64748b;">stub — live API not wired</div></div>'
        + '</div>'
        + '<button class="btn" style="margin-top:10px;" onclick="MarketingPage.disconnectSocial()">Disconnect</button>';
    } else {
      inner += emptyState('📊',
        'Connect SocialPilot to see posts scheduled, published, and engagement.',
        '<a href="https://www.socialpilot.co/api" target="_blank" class="btn btn-primary" style="margin-right:6px;">Get API key</a>'
        + '<button class="btn" onclick="MarketingPage.connectSocial()">Paste key</button>');
    }
    return card(inner);
  }

  // ---------- GBP ----------
  function renderGBP() {
    var stats = null;
    try { stats = JSON.parse(localStorage.getItem('bm-gbp-stats') || 'null'); } catch (e) {}
    var inner = '<h3 style="margin:0 0 4px;font-size:16px;">🏢 Google Business Profile</h3>';

    if (stats && typeof stats === 'object') {
      inner += '<div style="font-size:12px;color:#64748b;margin-bottom:12px;">Week of ' + UI.esc(stats.weekOf || '—') + '</div>'
        + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;">'
        + statBox('Profile Views', stats.views)
        + statBox('Searches', stats.searches)
        + statBox('Photo Views', stats.photoViews)
        + statBox('Phone Calls', stats.calls)
        + '</div>'
        + '<button class="btn" style="margin-top:10px;" onclick="MarketingPage.updateGBP()">Update numbers</button>';
    } else {
      inner += emptyState('📊',
        'Paste weekly GBP insights to track views, searches, and calls.',
        '<button class="btn btn-primary" onclick="MarketingPage.updateGBP()">Add GBP stats</button>');
    }
    return card(inner);
  }

  function statBox(label, val) {
    return '<div style="padding:10px;background:#f8fafc;border:1px solid var(--border);border-radius:8px;text-align:center;">'
      + '<div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">' + label + '</div>'
      + '<div style="font-size:22px;font-weight:700;color:#0f172a;">' + (val != null ? val : '—') + '</div>'
      + '</div>';
  }

  // ---------- Render ----------
  function render() {
    var html = '<div style="max-width:1200px;margin:0 auto;padding:8px;">'
      + '<div style="margin-bottom:14px;">'
      + '<h2 style="margin:0 0 4px;font-size:22px;">📣 Marketing Dashboard</h2>'
      + '<div style="font-size:13px;color:#64748b;">Your marketing funnel at a glance — lead sources, conversion, revenue attribution, response time.</div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px;">'
      + renderLeadSources()
      + renderFunnel()
      + renderResponseTime()
      + renderRevenueBySource()
      + renderSocial()
      + renderGBP()
      + '</div>'
      + '</div>';
    return html;
  }

  // ---------- Actions ----------
  function setRange(d) { _range = d; loadPage('marketing'); }

  function filterBySource(source) {
    try {
      if (typeof RequestsPage !== 'undefined') {
        RequestsPage._search = source;
      }
    } catch (e) {}
    loadPage('requests');
  }

  function connectSocial() {
    var key = prompt('Paste your SocialPilot API key:');
    if (!key) return;
    try { localStorage.setItem('bm-socialpilot-key', key.trim()); } catch (e) {}
    if (typeof UI !== 'undefined' && UI.toast) UI.toast('SocialPilot connected');
    loadPage('marketing');
  }

  function disconnectSocial() {
    if (!confirm('Disconnect SocialPilot?')) return;
    try { localStorage.removeItem('bm-socialpilot-key'); } catch (e) {}
    loadPage('marketing');
  }

  function updateGBP() {
    var existing = {};
    try { existing = JSON.parse(localStorage.getItem('bm-gbp-stats') || '{}') || {}; } catch (e) {}
    var weekOf = prompt('Week of (e.g. 2026-04-13):', existing.weekOf || '');
    if (weekOf === null) return;
    var views = prompt('Profile views:', existing.views != null ? existing.views : '');
    if (views === null) return;
    var searches = prompt('Search queries:', existing.searches != null ? existing.searches : '');
    if (searches === null) return;
    var photoViews = prompt('Photo views:', existing.photoViews != null ? existing.photoViews : '');
    if (photoViews === null) return;
    var calls = prompt('Phone calls:', existing.calls != null ? existing.calls : '');
    if (calls === null) return;
    var stats = {
      weekOf: weekOf.trim(),
      views: +views || 0,
      searches: +searches || 0,
      photoViews: +photoViews || 0,
      calls: +calls || 0
    };
    try { localStorage.setItem('bm-gbp-stats', JSON.stringify(stats)); } catch (e) {}
    if (typeof UI !== 'undefined' && UI.toast) UI.toast('GBP stats saved');
    loadPage('marketing');
  }

  return {
    render: render,
    setRange: setRange,
    filterBySource: filterBySource,
    connectSocial: connectSocial,
    disconnectSocial: disconnectSocial,
    updateGBP: updateGBP
  };
})();

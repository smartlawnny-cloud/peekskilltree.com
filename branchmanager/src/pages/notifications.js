/**
 * Branch Manager — Notification Center & Activity Feed
 */
var NotificationsPage = {
  render: function() {
    var activities = DB.getActivities ? DB.getActivities() : NotificationsPage._buildFeed();
    var html = '<div class="section-header"><h2>Activity Feed</h2></div>';

    // Filter tabs
    html += '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">';
    var filters = ['All', 'Requests', 'Quotes', 'Jobs', 'Invoices', 'Payments'];
    filters.forEach(function(f) {
      var active = f === 'All' ? ' style="background:var(--green-dark);color:#fff;border-color:var(--green-dark);"' : '';
      html += '<button onclick="NotificationsPage.filter(\'' + f.toLowerCase() + '\')" class="filter-btn"' + active + '>' + f + '</button>';
    });
    html += '</div>';

    // Activity list
    html += '<div id="activity-list" style="display:flex;flex-direction:column;gap:8px;">';
    if (activities.length) {
      activities.forEach(function(a) {
        html += NotificationsPage._renderActivity(a);
      });
    } else {
      html += '<div style="text-align:center;padding:40px;color:var(--text-light);">No activity yet. Import your Jobber data to see your history.</div>';
    }
    html += '</div>';
    return html;
  },

  _renderActivity: function(a) {
    var icons = { request: '📥', quote: '📝', job: '🌳', invoice: '💰', payment: '💳', client: '👤', note: '📌' };
    var icon = icons[a.type] || '📋';
    var timeAgo = UI.dateRelative ? UI.dateRelative(a.date) : a.date;

    return '<div style="background:var(--white);border-radius:10px;padding:14px 16px;border:1px solid var(--border);display:flex;gap:12px;align-items:flex-start;' + (a.unread ? 'border-left:3px solid var(--green-light);' : '') + '">'
      + '<span style="font-size:20px;flex-shrink:0;">' + icon + '</span>'
      + '<div style="flex:1;min-width:0;">'
      + '<div style="font-size:14px;"><strong>' + (a.title || '') + '</strong></div>'
      + '<div style="font-size:13px;color:var(--text-light);margin-top:2px;">' + (a.description || '') + '</div>'
      + '</div>'
      + '<div style="font-size:11px;color:var(--text-light);white-space:nowrap;">' + timeAgo + '</div>'
      + '</div>';
  },

  _buildFeed: function() {
    var feed = [];
    // Build from existing data
    var requests = DB.requests.getAll();
    requests.forEach(function(r) {
      feed.push({ type: 'request', title: 'New request from ' + r.clientName, description: r.property || r.notes || '', date: r.createdAt, unread: r.status === 'new' });
    });
    var quotes = DB.quotes.getAll();
    quotes.forEach(function(q) {
      feed.push({ type: 'quote', title: 'Quote #' + (q.quoteNumber || '') + ' — ' + q.clientName, description: UI.money(q.total) + ' • ' + (q.status || ''), date: q.createdAt });
    });
    var invoices = DB.invoices.getAll();
    invoices.forEach(function(inv) {
      if (inv.status === 'paid') {
        feed.push({ type: 'payment', title: 'Payment received — ' + inv.clientName, description: UI.money(inv.total) + ' • Invoice #' + (inv.invoiceNumber || ''), date: inv.updatedAt || inv.createdAt });
      } else if (inv.balance > 0) {
        feed.push({ type: 'invoice', title: 'Invoice #' + (inv.invoiceNumber || '') + ' outstanding', description: UI.money(inv.balance) + ' remaining • ' + inv.clientName, date: inv.createdAt, unread: true });
      }
    });
    // Sort by date descending
    feed.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    return feed.slice(0, 50);
  },

  filter: function(type) {
    // Re-render with filter
    var activities = NotificationsPage._buildFeed();
    if (type !== 'all') {
      var typeMap = { requests: 'request', quotes: 'quote', jobs: 'job', invoices: 'invoice', payments: 'payment' };
      var filterType = typeMap[type] || type;
      activities = activities.filter(function(a) { return a.type === filterType; });
    }
    var listEl = document.getElementById('activity-list');
    if (listEl) {
      listEl.innerHTML = activities.length
        ? activities.map(function(a) { return NotificationsPage._renderActivity(a); }).join('')
        : '<div style="text-align:center;padding:40px;color:var(--text-light);">No ' + type + ' activity.</div>';
    }
  }
};

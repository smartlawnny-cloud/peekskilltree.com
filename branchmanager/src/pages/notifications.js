/**
 * Branch Manager — Notification Center & Activity Feed
 */
var NotificationsPage = {
  _activeFilter: 'all',

  render: function() {
    var self = NotificationsPage;
    var activities = DB.getActivities ? DB.getActivities() : self._buildFeed();
    var filteredCount = self._hiddenOldCount || 0;
    var html = '<div class="section-header"><h2>Activity Feed</h2>'
      + (filteredCount > 0 ? '<span style="font-size:12px;color:var(--text-light);font-weight:400;">' + filteredCount + ' older entries hidden</span>' : '')
      + '</div>';

    // Filter tabs
    html += '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">';
    var filters = ['All', 'Requests', 'Quotes', 'Jobs', 'Invoices', 'Payments'];
    filters.forEach(function(f) {
      var isActive = f.toLowerCase() === self._activeFilter;
      var style = isActive ? ' style="background:var(--green-dark);color:#fff;border-color:var(--green-dark);"' : '';
      html += '<button onclick="NotificationsPage.filter(\'' + f.toLowerCase() + '\')" class="filter-btn"' + style + '>' + f + '</button>';
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

  _hiddenOldCount: 0,

  _buildFeed: function() {
    var self = NotificationsPage;
    var feed = [];
    var ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
    var thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    // Jobber import window — items "updated" on these days are import artifacts, not real activity
    function isImportArtifact(d) {
      if (!d) return false;
      var day = d.substring(0, 10);
      return day === '2026-03-21' || day === '2026-03-22';
    }
    var allCount = 0;

    // Requests (last 90 days only)
    var requests = DB.requests.getAll();
    requests.forEach(function(r) {
      allCount++;
      if (r.createdAt && r.createdAt < ninetyDaysAgo) return;
      feed.push({ type: 'request', title: 'New request from ' + (r.clientName || 'Unknown'), description: r.property || r.notes || '', date: r.createdAt, unread: r.status === 'new' });
    });

    // Quotes — only meaningful statuses, last 90 days, skip import-date artifacts
    var quotes = DB.quotes.getAll();
    var activeStatuses = { sent: 1, awaiting: 1, approved: 1, declined: 1, converted: 1 };
    quotes.forEach(function(q) {
      if (!activeStatuses[q.status]) return;
      allCount++;
      var actDate = q.updatedAt || q.createdAt;
      if (!actDate || actDate < ninetyDaysAgo) return;
      if (isImportArtifact(actDate)) return; // skip import artifacts
      var statusLabels = { sent: 'Sent', awaiting: 'Awaiting changes', approved: 'Approved ✓', declined: 'Declined', converted: 'Converted to job' };
      feed.push({ type: 'quote', title: 'Quote #' + (q.quoteNumber || '') + ' — ' + (q.clientName || ''), description: UI.money(q.total) + ' • ' + (statusLabels[q.status] || q.status), date: actDate });
    });

    // Jobs completed (last 30 days)
    var jobs = DB.jobs.getAll();
    jobs.forEach(function(j) {
      if (j.status !== 'completed') return;
      allCount++;
      var actDate = j.completedDate || j.scheduledDate || j.createdAt;
      if (!actDate || actDate < ninetyDaysAgo) return;
      if (isImportArtifact(actDate)) return; // skip import artifacts
      feed.push({ type: 'job', title: 'Job #' + (j.jobNumber || '') + ' completed — ' + (j.clientName || ''), description: j.description || j.property || '', date: actDate });
    });

    // Invoices — paid (last 90 days) + outstanding always shown
    var invoices = DB.invoices.getAll();
    var now = new Date();
    invoices.forEach(function(inv) {
      if (inv.status === 'paid') {
        allCount++;
        var paidDate = inv.paidDate || inv.updatedAt || inv.createdAt;
        if (!paidDate || paidDate < ninetyDaysAgo) return;
        if (isImportArtifact(paidDate)) return; // skip import artifacts
        feed.push({ type: 'payment', title: 'Payment received — ' + (inv.clientName || ''), description: UI.money(inv.total) + ' • Invoice #' + (inv.invoiceNumber || ''), date: paidDate });
      } else if (inv.balance > 0 && inv.status !== 'draft' && inv.status !== 'cancelled') {
        var isOverdue = inv.dueDate && new Date(inv.dueDate) < now;
        feed.push({ type: 'invoice', title: 'Invoice #' + (inv.invoiceNumber || '') + (isOverdue ? ' overdue' : ' outstanding'), description: UI.money(inv.balance) + ' remaining • ' + (inv.clientName || ''), date: inv.dueDate || inv.createdAt, unread: isOverdue });
      }
    });

    // Sort by date descending
    feed.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    self._hiddenOldCount = Math.max(0, allCount - feed.length);
    return feed.slice(0, 100);
  },

  filter: function(type) {
    NotificationsPage._activeFilter = type;
    // Update button active states
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
      var isActive = btn.textContent.toLowerCase() === type;
      btn.style.background = isActive ? 'var(--green-dark)' : '';
      btn.style.color = isActive ? '#fff' : '';
      btn.style.borderColor = isActive ? 'var(--green-dark)' : '';
    });
    // Filter and re-render list
    var activities = NotificationsPage._buildFeed();
    if (type !== 'all') {
      var typeMap = { requests: 'request', quotes: 'quote', jobs: 'job', invoices: 'invoice', payments: 'payment' };
      var filterType = typeMap[type] || type;
      // 'invoices' filter should include both invoice and payment types
      if (type === 'invoices') {
        activities = activities.filter(function(a) { return a.type === 'invoice' || a.type === 'payment'; });
      } else {
        activities = activities.filter(function(a) { return a.type === filterType; });
      }
    }
    var listEl = document.getElementById('activity-list');
    if (listEl) {
      listEl.innerHTML = activities.length
        ? activities.map(function(a) { return NotificationsPage._renderActivity(a); }).join('')
        : '<div style="text-align:center;padding:40px;color:var(--text-light);">No ' + type + ' activity.</div>';
    }
  }
};

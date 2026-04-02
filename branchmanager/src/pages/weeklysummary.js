/**
 * Branch Manager — Weekly Business Summary
 * Full-featured weekly overview for Second Nature Tree Service.
 * Sections: Week at a Glance, Admin To-Do, Jobs This Week, Revenue Bar,
 *           Quotes Sent, Photos Uploaded, Top Action Items.
 */
var WeeklySummary = {

  // ── Helpers ──

  _weekBounds: function() {
    var now = new Date();
    // Monday-based week
    var day = now.getDay(); // 0=Sun
    var diffToMon = (day === 0) ? -6 : 1 - day;
    var weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diffToMon);
    weekStart.setHours(0, 0, 0, 0);
    var weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return { start: weekStart, end: weekEnd };
  },

  _inRange: function(dateVal, start, end) {
    if (!dateVal) return false;
    var d = new Date(dateVal);
    return d >= start && d <= end;
  },

  // Returns true if date is the Jobber mass-import window (not real activity)
  _isImportArtifact: function(dateVal) {
    if (!dateVal) return false;
    var day = String(dateVal).substring(0, 10);
    return day === '2026-03-21' || day === '2026-03-22';
  },

  _dateStr: function(d) {
    // yyyy-mm-dd
    return d.getFullYear() + '-'
      + ('0' + (d.getMonth() + 1)).slice(-2) + '-'
      + ('0' + d.getDate()).slice(-2);
  },

  _formatDateRange: function(start, end) {
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var s = months[start.getMonth()] + ' ' + start.getDate();
    var e = months[end.getMonth()] + ' ' + end.getDate() + ', ' + end.getFullYear();
    return s + ' \u2013 ' + e;
  },

  // ── Section 1: Week at a Glance stat cards ──

  _renderGlance: function(week, invoices, jobs, requests) {
    // Revenue Collected = paid invoices where paidAt (or updatedAt) falls in week
    // Exclude Jobber mass-import artifacts (March 21-22 updatedAt dates)
    var collected = invoices.filter(function(i) {
      var d = i.paidAt || i.updatedAt || i.createdAt;
      return (i.status === 'paid' || i.status === 'collected')
        && !WeeklySummary._isImportArtifact(d)
        && WeeklySummary._inRange(d, week.start, week.end);
    }).reduce(function(s, i) { return s + (i.total || 0); }, 0);

    // Jobs completed this week (by completedDate, else scheduledDate)
    var completedJobs = jobs.filter(function(j) {
      return j.status === 'completed'
        && WeeklySummary._inRange(j.completedDate || j.scheduledDate, week.start, week.end);
    });

    // New requests this week
    var newReqs = requests.filter(function(r) {
      return WeeklySummary._inRange(r.createdAt, week.start, week.end);
    });

    // Outstanding balance = all unpaid invoices regardless of week
    var outstanding = invoices.filter(function(i) {
      return i.status !== 'paid' && i.status !== 'collected' && (i.balance > 0 || i.total > 0);
    }).reduce(function(s, i) { return s + (i.balance || i.total || 0); }, 0);

    var html = '<div class="stat-grid" style="margin-bottom:20px;">'
      + UI.statCard('Revenue Collected', UI.moneyInt(collected), 'this week', collected > 0 ? 'up' : '', '')
      + UI.statCard('Jobs Completed', completedJobs.length.toString(), completedJobs.length === 1 ? 'job' : 'jobs done', '', '')
      + UI.statCard('New Requests', newReqs.length.toString(), newReqs.length === 1 ? 'request in' : 'requests in', newReqs.length > 0 ? 'up' : '', '')
      + UI.statCard('Outstanding', UI.moneyInt(outstanding), 'unpaid balance', outstanding > 0 ? 'down' : 'up', '')
      + '</div>';

    return html;
  },

  // ── Section 2: Admin To-Do Summary ──

  _renderAdminTasks: function(week) {
    var tasks = [];
    try { tasks = JSON.parse(localStorage.getItem('bm-admin-tasks') || '[]'); } catch(e) {}

    var weekStartStr = WeeklySummary._dateStr(week.start);
    var weekEndStr   = WeeklySummary._dateStr(week.end);
    var todayStr     = WeeklySummary._dateStr(new Date());

    // Tasks due this week (not yet completed) OR overdue (dueDate < today, not completed)
    var relevant = tasks.filter(function(t) {
      if (t.completed) return false;
      if (!t.dueDate) return false;
      return (t.dueDate >= weekStartStr && t.dueDate <= weekEndStr) || t.dueDate < todayStr;
    });

    // Sort: overdue first, then by dueDate asc
    relevant.sort(function(a, b) {
      var aOver = a.dueDate < todayStr ? 0 : 1;
      var bOver = b.dueDate < todayStr ? 0 : 1;
      if (aOver !== bOver) return aOver - bOver;
      return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
    });

    var html = '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
      + '<h3 style="font-size:16px;font-weight:700;margin:0;">&#128203; Admin To-Do This Week</h3>'
      + '<span style="font-size:12px;color:var(--text-light);">' + relevant.length + ' pending</span>'
      + '</div>';

    if (relevant.length === 0) {
      html += '<div style="color:var(--green-dark);font-size:13px;font-weight:600;text-align:center;padding:12px 0;">All admin tasks are clear &#10003;</div>';
    } else {
      relevant.forEach(function(t) {
        var isOverdue = t.dueDate < todayStr;
        var isMedia   = t.category === 'media' || (t.title && t.title.toLowerCase().indexOf('media') >= 0);

        var rowBg = '';
        var leftBorder = '';
        if (isMedia) {
          rowBg = 'background:#f3e5f5;';
          leftBorder = 'border-left:4px solid #7b1fa2;';
        } else if (isOverdue) {
          rowBg = 'background:#fff3f3;';
          leftBorder = 'border-left:4px solid var(--red,#e53935);';
        } else {
          leftBorder = 'border-left:4px solid transparent;';
        }

        var badgeHtml = '';
        if (t.recurrence === 'weekly') {
          badgeHtml = '<span style="font-size:10px;background:#e8eaf6;color:#3949ab;padding:2px 6px;border-radius:10px;font-weight:600;margin-left:6px;">Weekly</span>';
        } else if (t.recurrence === 'monthly') {
          badgeHtml = '<span style="font-size:10px;background:#e8f5e9;color:#2e7d32;padding:2px 6px;border-radius:10px;font-weight:600;margin-left:6px;">Monthly</span>';
        }

        var dueLabelColor = isOverdue ? 'color:var(--red,#e53935);font-weight:600;' : 'color:var(--text-light);';
        var dueLabel = isOverdue ? 'Overdue \u00b7 ' : 'Due \u00b7 ';

        html += '<div style="display:flex;align-items:flex-start;gap:12px;padding:10px 12px;margin-bottom:6px;border-radius:8px;' + rowBg + leftBorder + '">'
          + '<input type="checkbox" style="margin-top:2px;cursor:pointer;width:16px;height:16px;flex-shrink:0;"'
          + ' onchange="WeeklySummary._completeTask(\'' + t.id + '\', this)">'
          + '<div style="flex:1;min-width:0;">'
          + '<div style="font-size:13px;font-weight:600;">'
          + (isMedia ? '&#128247; ' : '')
          + UI.esc(t.title)
          + badgeHtml
          + '</div>'
          + '<div style="font-size:12px;margin-top:3px;' + dueLabelColor + '">' + dueLabel + UI.dateShort(t.dueDate + 'T12:00:00') + '</div>'
          + '</div>'
          + '</div>';
      });
    }

    html += '</div>';
    return html;
  },

  _completeTask: function(id, checkbox) {
    var tasks = [];
    try { tasks = JSON.parse(localStorage.getItem('bm-admin-tasks') || '[]'); } catch(e) {}
    var t = tasks.find(function(x) { return x.id === id; });
    if (!t) return;

    t.completed = true;

    // Spawn recurrence
    if (t.recurrence === 'weekly' || t.recurrence === 'monthly') {
      var next = new Date(t.dueDate + 'T12:00:00');
      if (t.recurrence === 'weekly') next.setDate(next.getDate() + 7);
      else next.setMonth(next.getMonth() + 1);
      tasks.push({
        id: 'at_' + Date.now(),
        title: t.title,
        dueDate: next.toISOString().split('T')[0],
        completed: false,
        recurrence: t.recurrence,
        category: t.category,
        color: t.color || '#7b1fa2'
      });
    }

    localStorage.setItem('bm-admin-tasks', JSON.stringify(tasks));

    // Visually strike through the row
    var row = checkbox ? checkbox.closest('div[style]') : null;
    if (row) {
      row.style.opacity = '0.45';
      row.style.textDecoration = 'line-through';
    }
    UI.toast('Task marked complete');
  },

  // ── Section 3: Jobs This Week ──

  _renderJobsThisWeek: function(week, jobs) {
    var weekStartStr = WeeklySummary._dateStr(week.start);
    var weekEndStr   = WeeklySummary._dateStr(week.end);

    var weekJobs = jobs.filter(function(j) {
      if (!j.scheduledDate) return false;
      var d = j.scheduledDate.substring(0, 10);
      return d >= weekStartStr && d <= weekEndStr;
    });

    weekJobs.sort(function(a, b) {
      var da = (a.scheduledDate || '').substring(0, 10);
      var db = (b.scheduledDate || '').substring(0, 10);
      return da < db ? -1 : da > db ? 1 : 0;
    });

    var statusBadge = function(s) {
      var map = {
        completed:  { bg:'#e8f5e9', color:'#2e7d32', label:'Completed' },
        in_progress:{ bg:'#e3f2fd', color:'#1565c0', label:'In Progress' },
        scheduled:  { bg:'#fff8e1', color:'#f57f17', label:'Scheduled' },
        cancelled:  { bg:'#fce4ec', color:'#c62828', label:'Cancelled' },
        late:       { bg:'#fce4ec', color:'#c62828', label:'Late' },
        invoiced:   { bg:'#f3e5f5', color:'#6a1b9a', label:'Invoiced' }
      };
      var cfg = map[s] || { bg:'#f5f5f5', color:'#555', label: s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Unknown' };
      return '<span style="font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600;background:' + cfg.bg + ';color:' + cfg.color + ';">' + cfg.label + '</span>';
    };

    var html = '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
      + '<h3 style="font-size:16px;font-weight:700;margin:0;">&#128296; Jobs This Week</h3>'
      + '<span style="font-size:12px;color:var(--text-light);">' + weekJobs.length + ' job' + (weekJobs.length !== 1 ? 's' : '') + '</span>'
      + '</div>';

    if (weekJobs.length === 0) {
      html += '<div style="color:var(--text-light);font-size:13px;text-align:center;padding:12px 0;">No jobs scheduled this week</div>';
    } else {
      weekJobs.forEach(function(j) {
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);gap:12px;">'
          + '<div style="flex:1;min-width:0;">'
          + '<div style="font-size:13px;font-weight:600;">' + UI.esc(j.clientName || 'Unknown Client') + '</div>'
          + '<div style="font-size:12px;color:var(--text-light);margin-top:2px;">'
          + UI.esc(j.description || j.title || 'No description')
          + ' &middot; ' + UI.dateShort(j.scheduledDate)
          + '</div>'
          + '</div>'
          + '<div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">'
          + statusBadge(j.status)
          + '<span style="font-size:13px;font-weight:700;color:var(--green-dark);">' + UI.moneyInt(j.total || 0) + '</span>'
          + '</div>'
          + '</div>';
      });
      var weekJobTotal = weekJobs.reduce(function(s, j) { return s + (j.total || 0); }, 0);
      html += '<div style="display:flex;justify-content:flex-end;padding-top:10px;">'
        + '<span style="font-size:14px;font-weight:700;">Total: ' + UI.moneyInt(weekJobTotal) + '</span>'
        + '</div>';
    }

    html += '</div>';
    return html;
  },

  // ── Section 4: Revenue Bar (3-week comparison) ──

  _renderRevenueBar: function(week, invoices, jobs) {
    // Build revenue for current week, last week, and week before that
    var weeks = [2, 1, 0].map(function(offset) {
      var s = new Date(week.start); s.setDate(s.getDate() - offset * 7);
      var e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23, 59, 59, 999);
      return { start: s, end: e, offset: offset };
    });

    var revenues = weeks.map(function(w) {
      // Prefer paid invoices, fall back to completed job totals
      var inv = invoices.filter(function(i) {
        var d = i.paidAt || i.updatedAt || i.createdAt;
        return (i.status === 'paid' || i.status === 'collected')
          && !WeeklySummary._isImportArtifact(d)
          && WeeklySummary._inRange(d, w.start, w.end);
      }).reduce(function(s, i) { return s + (i.total || 0); }, 0);

      if (inv > 0) return inv;

      // Fallback: completed job totals
      return jobs.filter(function(j) {
        return j.status === 'completed'
          && WeeklySummary._inRange(j.completedDate || j.scheduledDate, w.start, w.end);
      }).reduce(function(s, j) { return s + (j.total || 0); }, 0);
    });

    var maxRev = Math.max.apply(null, revenues.concat([1]));

    var weekLabels = ['2 Weeks Ago', 'Last Week', 'This Week'];
    var barColors  = ['#c8e6c9', '#81c784', 'var(--green-dark)'];

    var html = '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="font-size:16px;font-weight:700;margin-bottom:16px;">&#128200; Revenue Trend</h3>'
      + '<div style="display:flex;align-items:flex-end;gap:12px;height:90px;">';

    revenues.forEach(function(rev, i) {
      var pct = maxRev > 0 ? Math.round((rev / maxRev) * 100) : 0;
      var barH = Math.max(pct, rev > 0 ? 4 : 0);
      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;">'
        + '<div style="font-size:11px;font-weight:700;color:' + (i === 2 ? 'var(--green-dark)' : 'var(--text-light)') + ';">' + UI.moneyInt(rev) + '</div>'
        + '<div style="width:100%;background:' + barColors[i] + ';border-radius:6px 6px 0 0;height:' + barH + 'px;transition:height .3s;"></div>'
        + '<div style="font-size:11px;color:var(--text-light);text-align:center;">' + weekLabels[i] + '</div>'
        + '</div>';
    });

    html += '</div></div>';
    return html;
  },

  // ── Section 5: Quotes Sent This Week ──

  _renderQuotesThisWeek: function(week, quotes) {
    var weekQuotes = quotes.filter(function(q) {
      var actDate = q.updatedAt || q.createdAt;
      if (WeeklySummary._isImportArtifact(actDate)) return false;
      return WeeklySummary._inRange(q.createdAt, week.start, week.end)
        || WeeklySummary._inRange(q.updatedAt, week.start, week.end);
    });

    weekQuotes.sort(function(a, b) {
      return (a.createdAt || '') > (b.createdAt || '') ? -1 : 1;
    });

    var statusBadge = function(s) {
      var map = {
        draft:    { bg:'#f5f5f5', color:'#555', label:'Draft' },
        sent:     { bg:'#e3f2fd', color:'#1565c0', label:'Sent' },
        approved: { bg:'#e8f5e9', color:'#2e7d32', label:'Approved' },
        won:      { bg:'#e8f5e9', color:'#2e7d32', label:'Won' },
        declined: { bg:'#fce4ec', color:'#c62828', label:'Declined' },
        converted:{ bg:'#f3e5f5', color:'#6a1b9a', label:'Converted' },
        awaiting: { bg:'#fff8e1', color:'#f57f17', label:'Awaiting' }
      };
      var cfg = map[s] || { bg:'#f5f5f5', color:'#555', label: s ? s.charAt(0).toUpperCase() + s.slice(1) : '—' };
      return '<span style="font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600;background:' + cfg.bg + ';color:' + cfg.color + ';">' + cfg.label + '</span>';
    };

    var html = '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
      + '<h3 style="font-size:16px;font-weight:700;margin:0;">&#128196; Quotes This Week</h3>'
      + '<span style="font-size:12px;color:var(--text-light);">' + weekQuotes.length + ' quote' + (weekQuotes.length !== 1 ? 's' : '') + '</span>'
      + '</div>';

    if (weekQuotes.length === 0) {
      html += '<div style="color:var(--text-light);font-size:13px;text-align:center;padding:12px 0;">No quotes created or updated this week</div>';
    } else {
      weekQuotes.forEach(function(q) {
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border);gap:12px;">'
          + '<div style="flex:1;min-width:0;">'
          + '<div style="font-size:13px;font-weight:600;">' + UI.esc(q.clientName || 'Unknown') + '</div>'
          + '<div style="font-size:12px;color:var(--text-light);margin-top:2px;">#' + UI.esc(q.quoteNumber || q.id || '—') + ' &middot; ' + UI.dateShort(q.createdAt) + '</div>'
          + '</div>'
          + '<div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">'
          + statusBadge(q.status)
          + '<span style="font-size:13px;font-weight:700;">' + UI.moneyInt(q.total || 0) + '</span>'
          + '</div>'
          + '</div>';
      });
      var quoteTotal = weekQuotes.reduce(function(s, q) { return s + (q.total || 0); }, 0);
      html += '<div style="display:flex;justify-content:flex-end;padding-top:10px;">'
        + '<span style="font-size:14px;font-weight:700;">Pipeline Value: ' + UI.moneyInt(quoteTotal) + '</span>'
        + '</div>';
    }

    html += '</div>';
    return html;
  },

  // ── Section 6: Photos Uploaded This Week ──

  _renderPhotosThisWeek: function(week) {
    var media = [];
    try { media = JSON.parse(localStorage.getItem('bm-media') || '[]'); } catch(e) {}

    var weekPhotos = media.filter(function(m) {
      return WeeklySummary._inRange(m.date || m.createdAt, week.start, week.end);
    });

    var html = '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
      + '<h3 style="font-size:16px;font-weight:700;margin:0;">&#128247; Photos Uploaded This Week</h3>'
      + '<a href="#" onclick="loadPage(\'mediacenter\');return false;" style="font-size:12px;color:var(--green-dark);font-weight:600;text-decoration:none;">Media Center &#8250;</a>'
      + '</div>';

    if (weekPhotos.length === 0) {
      html += '<div style="color:var(--text-light);font-size:13px;text-align:center;padding:12px 0;">No photos uploaded this week &mdash; remind crew to snap job site photos</div>';
    } else {
      // Count + thumbnail strip (first 6)
      html += '<div style="font-size:13px;color:var(--text-light);margin-bottom:10px;">'
        + weekPhotos.length + ' photo' + (weekPhotos.length !== 1 ? 's' : '') + ' uploaded'
        + '</div>';

      var thumbs = weekPhotos.slice(0, 6);
      html += '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
      thumbs.forEach(function(m) {
        var src = m.thumbnail || m.url || m.dataUrl || '';
        if (src) {
          html += '<div style="width:72px;height:72px;border-radius:8px;overflow:hidden;border:1px solid var(--border);background:#f5f5f5;flex-shrink:0;">'
            + '<img src="' + UI.esc(src) + '" alt="' + UI.esc(m.caption || 'Job photo') + '" '
            + 'style="width:100%;height:100%;object-fit:cover;" loading="lazy" onerror="this.style.display=\'none\'">'
            + '</div>';
        } else {
          html += '<div style="width:72px;height:72px;border-radius:8px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">&#128247;</div>';
        }
      });
      if (weekPhotos.length > 6) {
        html += '<div style="width:72px;height:72px;border-radius:8px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--text-light);flex-shrink:0;cursor:pointer;" onclick="loadPage(\'mediacenter\')">+' + (weekPhotos.length - 6) + ' more</div>';
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  // ── Section 7: Top Action Items ──

  _renderActionItems: function(invoices, quotes, jobs) {
    var now = new Date();
    var sevenAgo  = new Date(now.getTime() - 7 * 86400000);
    var sixtyAgo  = new Date(now.getTime() - 60 * 86400000);
    var sixMoAgo  = new Date(now.getTime() - 180 * 86400000);

    var items = [];

    // Overdue invoices
    var overdueInv = invoices.filter(function(i) {
      return i.status !== 'paid' && i.status !== 'collected'
        && (i.balance > 0 || i.total > 0)
        && i.dueDate && new Date(i.dueDate) < now;
    });
    var overdueTotal = overdueInv.reduce(function(s, i) { return s + (i.balance || i.total || 0); }, 0);
    if (overdueInv.length > 0) {
      items.push({
        icon: '&#128308;',
        priority: 'high',
        text: overdueInv.length + ' overdue invoice' + (overdueInv.length > 1 ? 's' : '') + ' &mdash; ' + UI.money(overdueTotal) + ' outstanding',
        action: 'loadPage(\'invoices\')',
        actionLabel: 'View Invoices'
      });
    }

    // Stale quotes (sent 7+ days ago, not acted on)
    var staleQuotes = quotes.filter(function(q) {
      return (q.status === 'sent' || q.status === 'awaiting')
        && q.createdAt
        && new Date(q.createdAt) < sevenAgo
        && new Date(q.createdAt) > sixMoAgo;
    });
    if (staleQuotes.length > 0) {
      items.push({
        icon: '&#9203;',
        priority: 'medium',
        text: staleQuotes.length + ' quote' + (staleQuotes.length > 1 ? 's' : '') + ' sent 7+ days ago — follow up now',
        action: 'loadPage(\'quotes\')',
        actionLabel: 'View Quotes'
      });
    }

    // Jobs needing invoicing (completed, no invoiceId, within last 60 days)
    var needsInvoicing = jobs.filter(function(j) {
      if (j.status !== 'completed' || j.invoiceId) return false;
      var d = new Date(j.completedDate || j.scheduledDate || j.createdAt);
      return d >= sixtyAgo;
    });
    var needsInvTotal = needsInvoicing.reduce(function(s, j) { return s + (j.total || 0); }, 0);
    if (needsInvoicing.length > 0) {
      items.push({
        icon: '&#128181;',
        priority: 'medium',
        text: needsInvoicing.length + ' completed job' + (needsInvoicing.length > 1 ? 's' : '') + ' not yet invoiced &mdash; ' + UI.money(needsInvTotal) + ' waiting',
        action: 'loadPage(\'jobs\')',
        actionLabel: 'View Jobs'
      });
    }

    var priorityBar = { high: '#e53935', medium: '#fb8c00', low: '#43a047' };

    var html = '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="font-size:16px;font-weight:700;margin-bottom:14px;">&#9889; Top Action Items</h3>';

    if (items.length === 0) {
      html += '<div style="color:var(--green-dark);font-size:14px;font-weight:600;text-align:center;padding:12px 0;">All clear &mdash; no urgent actions needed &#10003;</div>';
    } else {
      items.forEach(function(item) {
        var barColor = priorityBar[item.priority] || '#999';
        html += '<div onclick="' + item.action + '" style="display:flex;align-items:center;gap:12px;padding:12px;margin-bottom:8px;border-radius:8px;border:1px solid var(--border);cursor:pointer;border-left:4px solid ' + barColor + ';transition:background .15s;" onmouseover="this.style.background=\'#f9f9f9\'" onmouseout="this.style.background=\'\'">'
          + '<span style="font-size:18px;flex-shrink:0;">' + item.icon + '</span>'
          + '<span style="font-size:13px;flex:1;line-height:1.4;">' + item.text + '</span>'
          + '<span style="font-size:12px;color:var(--green-dark);font-weight:600;white-space:nowrap;flex-shrink:0;">' + item.actionLabel + ' &#8250;</span>'
          + '</div>';
      });
    }

    html += '</div>';
    return html;
  },

  // ── Main Render ──

  render: function() {
    var week     = WeeklySummary._weekBounds();
    var invoices = DB.invoices.getAll();
    var jobs     = DB.jobs.getAll();
    var quotes   = DB.quotes.getAll();
    var requests = DB.requests.getAll();

    var html = '';

    // ── Page header ──
    html += '<div style="margin-bottom:20px;">'
      + '<h2 style="font-size:24px;font-weight:700;margin:0 0 4px;">&#128197; Weekly Summary</h2>'
      + '<div style="font-size:14px;color:var(--text-light);">'
      + WeeklySummary._formatDateRange(week.start, week.end)
      + '</div>'
      + '</div>';

    // 1. Week at a Glance
    html += WeeklySummary._renderGlance(week, invoices, jobs, requests);

    // 2. Admin To-Do Summary
    html += WeeklySummary._renderAdminTasks(week);

    // 3. Jobs This Week
    html += WeeklySummary._renderJobsThisWeek(week, jobs);

    // 4. Revenue Bar (3-week comparison)
    html += WeeklySummary._renderRevenueBar(week, invoices, jobs);

    // 5. Quotes Sent This Week
    html += WeeklySummary._renderQuotesThisWeek(week, quotes);

    // 6. Photos Uploaded This Week
    html += WeeklySummary._renderPhotosThisWeek(week);

    // 7. Top Action Items
    html += WeeklySummary._renderActionItems(invoices, quotes, jobs);

    return html;
  }
};

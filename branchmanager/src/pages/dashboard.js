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

    // Show sync banner if no local data but Supabase is connected
    var localClients = JSON.parse(localStorage.getItem('bm-clients') || '[]');
    var html = '';

    // === MONEY ON THE TABLE widget ===
    var now0 = new Date();
    var todayDateStr = now0.getFullYear() + '-' + (now0.getMonth()+1<10?'0':'') + (now0.getMonth()+1) + '-' + (now0.getDate()<10?'0':'') + now0.getDate();
    var mottDismissKey = 'bm-mott-dismissed-' + todayDateStr;
    if (!localStorage.getItem(mottDismissKey)) {
      var mottAllInvoices = DB.invoices.getAll();
      var mottAllQuotes = DB.quotes.getAll();
      var mottAllJobs = DB.jobs.getAll();
      var mott20Ago = new Date(now0.getTime() - 20 * 86400000);

      // Stale quotes: status sent/awaiting AND createdAt > 20 days ago
      var mottStaleQuotes = mottAllQuotes.filter(function(q) {
        return (q.status === 'sent' || q.status === 'awaiting') && q.createdAt && new Date(q.createdAt) < mott20Ago;
      });
      var mottStaleValue = mottStaleQuotes.reduce(function(s,q) { return s + (q.total||0); }, 0);

      // Overdue invoices: not paid, dueDate < today, balance > 0
      var mottOverdueInv = mottAllInvoices.filter(function(i) {
        return i.status !== 'paid' && i.balance > 0 && i.dueDate && new Date(i.dueDate) < now0;
      });
      var mottOverdueTotal = mottOverdueInv.reduce(function(s,i) { return s + (i.balance||0); }, 0);

      // Completed jobs with no linked invoice
      var mottInvoicedJobIds = {};
      mottAllInvoices.forEach(function(i) { if (i.jobId) mottInvoicedJobIds[i.jobId] = true; });
      var mottUninvoiced = mottAllJobs.filter(function(j) {
        return j.status === 'completed' && !j.invoiceId && !mottInvoicedJobIds[j.id];
      });

      var mottCards = [];
      if (mottStaleQuotes.length > 0) {
        mottCards.push('<div style="flex:1;min-width:200px;background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:14px 16px;position:relative;">'
          + '<div style="font-size:11px;font-weight:700;color:#e65100;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Stale Quotes</div>'
          + '<div style="font-size:26px;font-weight:800;color:#e65100;">' + mottStaleQuotes.length + ' <span style="font-size:15px;font-weight:600;">' + UI.moneyInt(mottStaleValue) + '</span></div>'
          + '<div style="font-size:12px;color:#bf360c;margin-bottom:10px;">Sent 20+ days ago, no response</div>'
          + '<button onclick="loadPage(\'quotes\')" style="background:#e65100;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">Follow Up</button>'
          + '</div>');
      }
      if (mottOverdueInv.length > 0) {
        mottCards.push('<div style="flex:1;min-width:200px;background:#fce4ec;border:1px solid #f48fb1;border-radius:10px;padding:14px 16px;position:relative;">'
          + '<div style="font-size:11px;font-weight:700;color:#c62828;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Overdue Invoices</div>'
          + '<div style="font-size:26px;font-weight:800;color:#c62828;">' + mottOverdueInv.length + ' <span style="font-size:15px;font-weight:600;">' + UI.moneyInt(mottOverdueTotal) + '</span></div>'
          + '<div style="font-size:12px;color:#b71c1c;margin-bottom:10px;">Past due, unpaid balance</div>'
          + '<button onclick="loadPage(\'invoices\')" style="background:#c62828;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">Send Reminders</button>'
          + '</div>');
      }
      if (mottUninvoiced.length > 0) {
        mottCards.push('<div style="flex:1;min-width:200px;background:#e3f2fd;border:1px solid #90caf9;border-radius:10px;padding:14px 16px;position:relative;">'
          + '<div style="font-size:11px;font-weight:700;color:#0d47a1;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Completed, Not Invoiced</div>'
          + '<div style="font-size:26px;font-weight:800;color:#0d47a1;">' + mottUninvoiced.length + ' <span style="font-size:15px;font-weight:600;color:#1565c0;">job' + (mottUninvoiced.length!==1?'s':'') + '</span></div>'
          + '<div style="font-size:12px;color:#0d47a1;margin-bottom:10px;">Completed with no invoice yet</div>'
          + '<button onclick="loadPage(\'jobs\')" style="background:#0d47a1;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">View Jobs</button>'
          + '</div>');
      }

      if (mottCards.length > 0) {
        html += '<div style="background:#fffde7;border:2px solid #f9a825;border-radius:12px;padding:16px;margin-bottom:16px;">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">'
          + '<div><strong style="font-size:15px;color:#e65100;">Money on the Table</strong>'
          + '<span style="font-size:12px;color:#bf360c;margin-left:8px;">— take action now</span></div>'
          + '<span onclick="localStorage.setItem(\'' + mottDismissKey + '\',\'1\');loadPage(\'dashboard\');" style="cursor:pointer;font-size:20px;color:#999;line-height:1;padding:0 4px;" title="Dismiss for today">×</span>'
          + '</div>'
          + '<div style="display:flex;flex-wrap:wrap;gap:12px;">'
          + mottCards.join('')
          + '</div>'
          + '</div>';
      }
    }
    // === END MONEY ON THE TABLE ===

    if (localClients.length === 0 && SupabaseDB && SupabaseDB.DEFAULT_URL) {
      html += '<div style="padding:16px;background:#e3f2fd;border-radius:10px;border-left:4px solid #1976d2;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">'
        + '<div><strong style="color:#1565c0;">Your data is in the cloud</strong>'
        + '<div style="font-size:13px;color:#555;margin-top:4px;">535 clients, 433 quotes, 259 jobs, 348 invoices ready to sync.</div></div>'
        + '<button class="btn btn-primary" onclick="DashboardPage.syncNow()" id="sync-btn" style="white-space:nowrap;">Sync Now</button>'
        + '</div>';
    }
    // Pre-compute data needed for both action alerts and revenue chart
    var allInvoices = DB.invoices.getAll();
    var allQuotes = DB.quotes.getAll();
    var allJobs = DB.jobs.getAll();
    var now = new Date();
    var sixMonthsAgo = new Date(now.getTime() - 180 * 86400000);

    // Setup Required card
    var sgOk = (localStorage.getItem('bm-sendgrid-key') || '').length > 10;
    var aiOk = (localStorage.getItem('bm-claude-key') || '').length > 10;
    var setupDismissed = localStorage.getItem('bm-setup-dismissed');
    if (!setupDismissed && (!sgOk || !aiOk)) {
      html += '<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:12px;padding:16px;margin-bottom:16px;">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">'
        + '<strong style="font-size:14px;">⚙️ Finish setting up Branch Manager</strong>'
        + '<span style="cursor:pointer;font-size:18px;color:#888;line-height:1;" onclick="localStorage.setItem(\'bm-setup-dismissed\',\'1\');loadPage(\'dashboard\');">×</span>'
        + '</div>'
        + '<div style="font-size:12px;color:#777;margin-bottom:12px;">Connect these to enable automated emails and AI assistance</div>';
      if (!sgOk) {
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">'
          + '<div style="display:flex;align-items:center;gap:8px;">'
          + '<span style="font-size:18px;">📧</span>'
          + '<div><div style="font-size:13px;font-weight:600;">SendGrid Email</div>'
          + '<div style="font-size:12px;color:#666;">Send automated quotes, reminders &amp; reviews</div></div>'
          + '</div>'
          + '<button class="btn btn-sm" style="font-size:12px;white-space:nowrap;" onclick="loadPage(\'settings\')">Connect →</button>'
          + '</div>';
      }
      if (!aiOk) {
        html += '<div style="display:flex;align-items:center;justify-content:space-between;">'
          + '<div style="display:flex;align-items:center;gap:8px;">'
          + '<span style="font-size:18px;">🤖</span>'
          + '<div><div style="font-size:13px;font-weight:600;">Claude AI</div>'
          + '<div style="font-size:12px;color:#666;">AI pricing, email drafts &amp; business insights</div></div>'
          + '</div>'
          + '<button class="btn btn-sm" style="font-size:12px;white-space:nowrap;" onclick="loadPage(\'ai\')">Connect →</button>'
          + '</div>';
      }
      html += '</div>';
    }

    // Jobber-style date greeting
    var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var monthFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var hour = now.getHours();
    var greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    var userName = (typeof Auth !== 'undefined' && Auth.user) ? Auth.user.name || 'Doug' : 'Doug';
    html += '<div style="margin-bottom:20px;">'
      + '<div style="font-size:13px;color:var(--text-light);">' + dayNames[now.getDay()] + ', ' + monthFull[now.getMonth()] + ' ' + now.getDate() + '</div>'
      + '<h2 style="font-size:28px;font-weight:700;margin-top:2px;">' + greeting + ', ' + userName.split(' ')[0] + '</h2>'
      + '</div>';

    // Smart Daily Briefing
    var briefingDismissed = localStorage.getItem('bm-briefing-dismissed');
    var briefingDateStr = now.getFullYear() + '-' + (now.getMonth() + 1 < 10 ? '0' : '') + (now.getMonth() + 1) + '-' + (now.getDate() < 10 ? '0' : '') + now.getDate();
    if (briefingDismissed !== briefingDateStr) {
      var briefingInsights = [];
      var bOverdue = allInvoices.filter(function(i) { return i.status !== 'paid' && i.balance > 0 && i.dueDate && new Date(i.dueDate) < now; });
      var bOverdueTotal = bOverdue.reduce(function(s, i) { return s + (i.balance || 0); }, 0);
      if (bOverdue.length > 0) {
        briefingInsights.push({
          icon: '🔴',
          text: 'You have ' + bOverdue.length + ' overdue invoice' + (bOverdue.length > 1 ? 's' : '') + ' worth ' + UI.money(bOverdueTotal) + ' — follow up today',
          action: 'InvoicesPage._setFilter(\'overdue\');loadPage(\'invoices\');'
        });
      }
      var bSevenAgo = new Date(now.getTime() - 7 * 86400000);
      var b180Ago = new Date(now.getTime() - 180 * 86400000);
      var bStaleQuotes = allQuotes.filter(function(q) {
        return q.status === 'sent' && q.createdAt
          && new Date(q.createdAt) < bSevenAgo
          && new Date(q.createdAt) > b180Ago; // only last 6 months
      });
      if (bStaleQuotes.length > 0) {
        briefingInsights.push({
          icon: '⏳',
          text: bStaleQuotes.length + ' quote' + (bStaleQuotes.length > 1 ? 's' : '') + ' sent 7+ days ago need follow-up',
          action: 'loadPage(\'quotes\');'
        });
      }
      var cutoff60str = new Date(now.getTime() - 60 * 86400000).toISOString().split('T')[0];
      var cutoff7str = new Date(now.getTime() - 7 * 86400000).toISOString();
      var bNeedsInvoicing = allJobs.filter(function(j) {
        if (j.status !== 'completed' || j.invoiceId) return false;
        return (j.scheduledDate && j.scheduledDate >= cutoff60str)
            || (!j.scheduledDate && (j.createdAt || '') > cutoff7str);
      });
      var bNeedsInvTotal = bNeedsInvoicing.reduce(function(s, j) { return s + (j.total || 0); }, 0);
      if (bNeedsInvoicing.length > 0) {
        briefingInsights.push({
          icon: '💵',
          text: bNeedsInvoicing.length + ' recent completed job' + (bNeedsInvoicing.length > 1 ? 's' : '') + ' haven\'t been invoiced — ' + UI.money(bNeedsInvTotal) + ' waiting',
          action: 'loadPage(\'jobs\');'
        });
      }
      var bTodayStr = briefingDateStr;
      var bTodayJobs = allJobs.filter(function(j) { return j.scheduledDate && j.scheduledDate.substring(0, 10) === bTodayStr && j.status !== 'completed'; });
      if (bTodayJobs.length === 0) {
        briefingInsights.push({
          icon: '🌤',
          text: 'No jobs scheduled today — good day for estimates',
          action: 'loadPage(\'schedule\');'
        });
      } else {
        briefingInsights.push({
          icon: '📋',
          text: bTodayJobs.length + ' job' + (bTodayJobs.length > 1 ? 's' : '') + ' on the schedule today — let\'s get after it',
          action: 'loadPage(\'schedule\');'
        });
      }
      var bNewRequests = DB.requests.getAll().filter(function(r) { return r.status === 'new'; });
      if (bNewRequests.length > 0) {
        briefingInsights.push({
          icon: '📥',
          text: bNewRequests.length + ' new request' + (bNewRequests.length > 1 ? 's' : '') + ' came in — respond within 2 hours for best conversion',
          action: 'loadPage(\'requests\');'
        });
      }
      var bThisMonth = allInvoices.filter(function(i) {
        var d = new Date(i.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && (i.status === 'paid' || i.status === 'collected');
      }).reduce(function(s, i) { return s + (i.total || 0); }, 0);
      var bLastMonth = allInvoices.filter(function(i) {
        var lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        var ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        var d = new Date(i.createdAt);
        return d.getMonth() === lm && d.getFullYear() === ly && (i.status === 'paid' || i.status === 'collected');
      }).reduce(function(s, i) { return s + (i.total || 0); }, 0);
      if (bThisMonth > 0 || bLastMonth > 0) {
        var bAhead = bThisMonth >= bLastMonth;
        briefingInsights.push({
          icon: bAhead ? '📈' : '📉',
          text: 'This month\'s revenue (' + UI.money(bThisMonth) + ') is ' + (bAhead ? 'ahead of' : 'behind') + ' last month (' + UI.money(bLastMonth) + ')',
          action: 'loadPage(\'profitloss\');'
        });
      }

      // Limit to 5 insights max
      var bShow = briefingInsights.slice(0, 5);
      if (bShow.length > 0) {
        html += '<div id="daily-briefing" style="background:linear-gradient(135deg,#14331a 0%,#1e5428 50%,#1a3c12 100%);border-radius:12px;padding:20px;color:#fff;margin-bottom:20px;">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
          + '<div style="display:flex;align-items:center;gap:8px;">'
          + '<span style="font-size:18px;color:#8fe89f;">✦</span>'
          + '<h3 style="font-size:16px;font-weight:700;margin:0;">Daily Briefing</h3></div>'
          + '<a href="#" onclick="DashboardPage.dismissBriefing();return false;" style="font-size:12px;color:rgba(255,255,255,.5);text-decoration:none;">Dismiss</a>'
          + '</div>';
        bShow.forEach(function(insight, idx) {
          var borderTop = idx > 0 ? 'border-top:1px solid rgba(255,255,255,.1);' : '';
          html += '<div onclick="' + insight.action + '" style="display:flex;align-items:center;gap:10px;padding:10px 0;cursor:pointer;' + borderTop + '">'
            + '<span style="font-size:16px;flex-shrink:0;">' + insight.icon + '</span>'
            + '<span style="font-size:13px;line-height:1.4;opacity:.95;">' + insight.text + '</span>'
            + '<span style="margin-left:auto;font-size:14px;opacity:.4;flex-shrink:0;">›</span>'
            + '</div>';
        });
        html += '</div>';
      }
    }

    // Jobber-style Workflow cards (2x2 grid)
    var overdueInvoices = unpaidInvoices.filter(function(i) { return i.dueDate && new Date(i.dueDate) < now; });
    var unapprovedQuotes = allQuotes.filter(function(q) { return q.status === 'sent' || q.status === 'awaiting'; });
    var draftQuotes = allQuotes.filter(function(q) { return q.status === 'draft'; });
    var changesQuotes = allQuotes.filter(function(q) { return q.status === 'changes_requested'; });
    var approvedQuotes = allQuotes.filter(function(q) { return q.status === 'approved'; });
    var lateJobs = allJobs.filter(function(j) { return j.status === 'late'; });
    var activeJobs = allJobs.filter(function(j) { return j.status === 'in_progress' || j.status === 'scheduled'; });
    var ago90dash = new Date(now.getTime() - 90 * 86400000);
    var needsInvoicing = allJobs.filter(function(j) {
      if (j.status !== 'completed' || j.invoiceId) return false;
      return j.createdAt && new Date(j.createdAt) > ago90dash;
    });
    var actionJobs = allJobs.filter(function(j) { return j.status === 'action_required'; });
    var sentInvoices = allInvoices.filter(function(i) { return i.status === 'sent' && (!i.dueDate || new Date(i.dueDate) >= now); });
    var draftInvoices = allInvoices.filter(function(i) { return i.status === 'draft'; });

    var reqTotal = allQuotes.filter(function(q){return q.status==='approved'||q.status==='converted';}).reduce(function(s,q){return s+(q.total||0);},0);
    var activeJobTotal = activeJobs.reduce(function(s,j){return s+(j.total||0);},0);
    var draftInvTotal = draftInvoices.reduce(function(s,i){return s+(i.total||0);},0);
    var overdueTotal = overdueInvoices.reduce(function(s,i){return s+(i.balance||0);},0);

    html += '<h3 style="font-size:18px;font-weight:700;margin-bottom:12px;">Workflow</h3>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:20px;background:var(--white);">';

    // Requests card
    var allRequests = DB.requests.getAll();
    var newRequests = allRequests.filter(function(r) { return r.status === 'new'; });
    var assessedRequests = allRequests.filter(function(r) { return r.status === 'assessment_complete'; });
    var overdueRequests = allRequests.filter(function(r) {
      if (r.status === 'converted' || r.status === 'quoted' || r.status === 'archived') return false;
      return (Date.now() - new Date(r.createdAt || 0)) / 86400000 > 3;
    });
    html += '<div onclick="loadPage(\'requests\')" style="padding:16px 20px;border-right:1px solid var(--border);border-bottom:1px solid var(--border);cursor:pointer;position:relative;">'
      + '<div style="position:absolute;top:0;left:0;right:0;height:4px;background:#e07c24;"></div>'
      + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;color:var(--text-light);font-size:12px;font-weight:600;">📋 Requests</div>'
      + '<div style="font-size:32px;font-weight:700;">' + newRequests.length + '</div>'
      + '<div style="font-size:14px;font-weight:600;">New</div>'
      + '<div style="font-size:12px;color:var(--text-light);margin-top:6px;">Assessments complete (' + assessedRequests.length + ')</div>'
      + '<div style="font-size:12px;color:' + (overdueRequests.length > 0 ? 'var(--red)' : 'var(--text-light)') + ';">Overdue (' + overdueRequests.length + ')</div>'
      + '</div>';

    // Quotes card
    var awaitingQuotes = allQuotes.filter(function(q) { return q.status === 'sent' || q.status === 'awaiting'; });
    html += '<div onclick="loadPage(\'quotes\')" style="padding:16px 20px;border-bottom:1px solid var(--border);cursor:pointer;position:relative;">'
      + '<div style="position:absolute;top:0;left:0;right:0;height:4px;background:#8b2252;"></div>'
      + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;color:var(--text-light);font-size:12px;font-weight:600;">💰 Quotes</div>'
      + '<div style="font-size:32px;font-weight:700;display:inline;">' + approvedQuotes.length + '</div>'
      + '<span style="font-size:14px;color:var(--text-light);margin-left:6px;">' + UI.moneyInt(reqTotal) + '</span>'
      + '<div style="font-size:14px;font-weight:600;">Approved</div>'
      + '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-light);margin-top:6px;"><span>Draft (' + draftQuotes.length + ')</span><span>' + UI.moneyInt(draftQuotes.reduce(function(s,q){return s+(q.total||0);},0)) + '</span></div>'
      + '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-light);"><span>Changes requested (' + changesQuotes.length + ')</span><span>' + UI.moneyInt(changesQuotes.reduce(function(s,q){return s+(q.total||0);},0)) + '</span></div>'
      + '</div>';

    // Jobs card
    html += '<div onclick="loadPage(\'jobs\')" style="padding:16px 20px;border-right:1px solid var(--border);cursor:pointer;position:relative;">'
      + '<div style="position:absolute;top:0;left:0;right:0;height:4px;background:#2e7d32;"></div>'
      + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;color:var(--text-light);font-size:12px;font-weight:600;">🔧 Jobs</div>'
      + '<div style="font-size:32px;font-weight:700;">' + needsInvoicing.length + '</div>'
      + '<div style="font-size:14px;font-weight:600;">Requires invoicing</div>'
      + '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-light);margin-top:6px;"><span>Active (' + activeJobs.length + ')</span><span>' + UI.moneyInt(activeJobTotal) + '</span></div>'
      + '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-light);"><span>Action required (' + (actionJobs.length + lateJobs.length) + ')</span><span>' + UI.moneyInt(lateJobs.reduce(function(s,j){return s+(j.total||0);},0)) + '</span></div>'
      + '</div>';

    // Invoices card
    html += '<div onclick="loadPage(\'invoices\')" style="padding:16px 20px;cursor:pointer;position:relative;">'
      + '<div style="position:absolute;top:0;left:0;right:0;height:4px;background:#1565c0;"></div>'
      + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;color:var(--text-light);font-size:12px;font-weight:600;">📄 Invoices</div>'
      + '<div style="font-size:32px;font-weight:700;display:inline;">' + unpaidInvoices.length + '</div>'
      + '<span style="font-size:14px;color:var(--text-light);margin-left:6px;">' + UI.moneyInt(unpaidInvoices.reduce(function(s,i){return s+(i.balance||0);},0)) + '</span>'
      + '<div style="font-size:14px;font-weight:600;">Awaiting payment</div>'
      + '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-light);margin-top:6px;"><span>Draft (' + draftInvoices.length + ')</span><span>' + UI.moneyInt(draftInvTotal) + '</span></div>'
      + '<div style="display:flex;justify-content:space-between;font-size:12px;color:' + (overdueInvoices.length ? 'var(--red)' : 'var(--text-light)') + ';"><span>Past due (' + overdueInvoices.length + ')</span><span>' + UI.moneyInt(overdueTotal) + '</span></div>'
      + '</div>';

    html += '</div>';

    // Today's Jobs — Jobber shows this on dashboard
    var todayDateStr2 = now.getFullYear() + '-' + (now.getMonth()+1<10?'0':'') + (now.getMonth()+1) + '-' + (now.getDate()<10?'0':'') + now.getDate();
    var todayJobList = allJobs.filter(function(j) { return j.scheduledDate && j.scheduledDate.substring(0,10) === todayDateStr2; });
    var todayComplete = todayJobList.filter(function(j) { return j.status === 'completed'; }).length;
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
      + '<div><h3 style="font-size:16px;font-weight:700;margin:0;">Today\'s Jobs</h3>'
      + (todayJobList.length > 0 ? '<div style="font-size:12px;color:var(--text-light);margin-top:2px;">' + todayComplete + ' of ' + todayJobList.length + ' complete</div>' : '')
      + '</div>'
      + '<button onclick="loadPage(\'schedule\')" style="background:none;border:1px solid var(--border);padding:5px 12px;border-radius:6px;font-size:12px;cursor:pointer;color:var(--accent);">View Schedule →</button>'
      + '</div>';
    if (todayJobList.length === 0) {
      html += '<div style="text-align:center;padding:20px;color:var(--text-light);font-size:13px;">No jobs scheduled for today.<br><button onclick="loadPage(\'schedule\')" style="margin-top:8px;background:var(--green-dark);color:#fff;border:none;padding:8px 16px;border-radius:6px;font-size:12px;cursor:pointer;font-weight:600;">Open Schedule</button></div>';
    } else {
      todayJobList.forEach(function(j) {
        var statusColor = j.status === 'completed' ? '#2e7d32' : j.status === 'in_progress' ? '#e07c24' : '#1565c0';
        var statusBg = j.status === 'completed' ? '#e8f5e9' : j.status === 'in_progress' ? '#fff3e0' : '#e3f2fd';
        html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="loadPage(\'jobs\');setTimeout(function(){JobsPage.showDetail(\'' + j.id + '\');},100);">'
          + '<div style="width:8px;height:8px;border-radius:50%;background:' + statusColor + ';flex-shrink:0;"></div>'
          + '<div style="flex:1;min-width:0;">'
          + '<div style="font-size:14px;font-weight:600;">' + UI.esc(j.clientName || '—') + '</div>'
          + '<div style="font-size:12px;color:var(--text-light);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + UI.esc(j.description || j.property || '') + '</div>'
          + '</div>'
          + (j.startTime ? '<div style="font-size:12px;color:var(--text-light);flex-shrink:0;">' + j.startTime + '</div>' : '')
          + '<span style="background:' + statusBg + ';color:' + statusColor + ';padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;flex-shrink:0;">' + (j.status||'').replace('_',' ').replace(/\b\w/g,function(c){return c.toUpperCase();}) + '</span>'
          + '<div style="font-size:13px;font-weight:700;flex-shrink:0;">' + UI.money(j.total||0) + '</div>'
          + '</div>';
      });
    }
    html += '</div>';

    // Revenue chart (last 6 months)
    var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Check if invoices have real totals
    var invoiceTotalSum = allInvoices.reduce(function(s, inv) { return s + (inv.total || 0); }, 0);
    var useQuotesForRevenue = invoiceTotalSum < 100; // If invoices are mostly $0, use quotes instead

    var chartData = [];
    for (var m = 5; m >= 0; m--) {
      var mDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
      var mEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 0);
      var mRev;
      if (useQuotesForRevenue) {
        // Use converted/approved quotes as revenue proxy
        mRev = allQuotes.filter(function(q) {
          var d = new Date(q.createdAt);
          return d >= mDate && d <= mEnd && (q.status === 'converted' || q.status === 'approved' || q.status === 'won');
        }).reduce(function(s, q) { return s + (q.total || 0); }, 0);
        // Also add job totals
        mRev += allJobs.filter(function(j) {
          var d = new Date(j.createdAt);
          return d >= mDate && d <= mEnd && (j.status === 'completed' || j.status === 'invoiced');
        }).reduce(function(s, j) { return s + (j.total || 0); }, 0);
      } else {
        mRev = allInvoices.filter(function(inv) {
          var d = new Date(inv.createdAt);
          return d >= mDate && d <= mEnd && (inv.status === 'paid' || inv.status === 'collected');
        }).reduce(function(s, inv) { return s + (inv.total || 0); }, 0);
      }
      chartData.push({ label: monthNames[mDate.getMonth()], value: mRev });
    }
    var maxRev = Math.max.apply(null, chartData.map(function(d) { return d.value; })) || 1;

    // YTD revenue
    var ytdRevenue;
    if (useQuotesForRevenue) {
      ytdRevenue = allQuotes.filter(function(q) {
        return new Date(q.createdAt).getFullYear() === now.getFullYear() && (q.status === 'converted' || q.status === 'approved' || q.status === 'won');
      }).reduce(function(s, q) { return s + (q.total || 0); }, 0);
      ytdRevenue += allJobs.filter(function(j) {
        return new Date(j.createdAt).getFullYear() === now.getFullYear() && (j.status === 'completed' || j.status === 'invoiced');
      }).reduce(function(s, j) { return s + (j.total || 0); }, 0);
    } else {
      ytdRevenue = allInvoices.filter(function(inv) {
        return new Date(inv.createdAt).getFullYear() === now.getFullYear() && inv.status === 'paid';
      }).reduce(function(s, inv) { return s + (inv.total || 0); }, 0);
    }

    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;cursor:pointer;" onclick="loadPage(\'profitloss\')">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
      + '<h3 style="font-size:16px;">Revenue</h3>'
      + '<div style="text-align:right;"><span style="font-size:22px;font-weight:800;color:var(--green-dark);">' + UI.moneyInt(ytdRevenue) + '</span>'
      + '<div style="font-size:11px;color:var(--text-light);">' + now.getFullYear() + ' YTD</div></div></div>'
      + '<div style="display:flex;align-items:flex-end;gap:6px;height:80px;">';
    chartData.forEach(function(d) {
      var barH = Math.max(4, (d.value / maxRev) * 70);
      var isCurrentMonth = d.label === monthNames[now.getMonth()];
      html += '<div style="flex:1;text-align:center;">'
        + '<div style="height:70px;display:flex;align-items:flex-end;justify-content:center;">'
        + '<div style="width:100%;max-width:36px;height:' + barH + 'px;background:' + (isCurrentMonth ? 'var(--green-dark)' : '#c8e6c9') + ';border-radius:4px 4px 0 0;"></div></div>'
        + '<div style="font-size:10px;color:var(--text-light);margin-top:4px;">' + d.label + '</div>'
        + (d.value > 0 ? '<div style="font-size:10px;font-weight:600;">$' + Math.round(d.value/1000) + 'k</div>' : '')
        + '</div>';
    });
    html += '</div></div>';

    // Revenue Goals widget (not in Jobber!)
    var goalsData = JSON.parse(localStorage.getItem('bm-revenue-goals') || '{"annual":300000,"monthly":25000}');
    var currentMonthRev = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
    var annualPct = goalsData.annual > 0 ? Math.round((ytdRevenue / goalsData.annual) * 100) : 0;
    var monthlyPct = goalsData.monthly > 0 ? Math.round((currentMonthRev / goalsData.monthly) * 100) : 0;
    var annualRemaining = goalsData.annual - ytdRevenue;
    var monthlyRemaining = goalsData.monthly - currentMonthRev;
    var annualBarColor = annualPct >= 100 ? 'linear-gradient(90deg,#e6a817,#f5c842)' : 'linear-gradient(90deg,#2e7d32,#4caf50)';
    var monthlyBarColor = monthlyPct >= 100 ? 'linear-gradient(90deg,#e6a817,#f5c842)' : 'linear-gradient(90deg,#2e7d32,#4caf50)';
    var annualPctColor = annualPct >= 100 ? '#e6a817' : 'var(--green-dark)';
    var monthlyPctColor = monthlyPct >= 100 ? '#e6a817' : 'var(--green-dark)';

    html += '<style>'
      + '@keyframes bmGoalFill { from { width: 0%; } }'
      + '.bm-goal-bar { animation: bmGoalFill 1s ease-out; }'
      + '</style>';

    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
      + '<h3 style="font-size:16px;margin:0;">🎯 Revenue Goals</h3>'
      + '<button onclick="DashboardPage.editGoals()" class="btn btn-outline" style="font-size:11px;padding:4px 10px;">Edit Goals</button>'
      + '</div>';

    // Annual goal bar
    html += '<div style="margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'
      + '<span style="font-size:13px;font-weight:600;">Annual Goal</span>'
      + '<span style="font-size:13px;font-weight:700;color:' + annualPctColor + ';">' + annualPct + '%</span>'
      + '</div>'
      + '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-light);margin-bottom:4px;">'
      + '<span>' + UI.moneyInt(ytdRevenue) + ' earned</span>'
      + '<span>' + UI.moneyInt(goalsData.annual) + ' goal</span>'
      + '</div>'
      + '<div style="height:10px;background:#e8e8e8;border-radius:5px;overflow:hidden;">'
      + '<div class="bm-goal-bar" style="height:100%;width:' + Math.min(annualPct, 100) + '%;background:' + annualBarColor + ';border-radius:5px;"></div>'
      + '</div>'
      + '<div style="font-size:12px;margin-top:4px;color:var(--text-light);">'
      + (annualRemaining > 0 ? UI.moneyInt(annualRemaining) + ' remaining to reach goal' : '\uD83C\uDF89 Goal exceeded by ' + UI.moneyInt(Math.abs(annualRemaining)) + '!')
      + '</div>'
      + '</div>';

    // Monthly goal bar
    html += '<div>'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'
      + '<span style="font-size:13px;font-weight:600;">Monthly Goal (' + monthNames[now.getMonth()] + ')</span>'
      + '<span style="font-size:13px;font-weight:700;color:' + monthlyPctColor + ';">' + monthlyPct + '%</span>'
      + '</div>'
      + '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-light);margin-bottom:4px;">'
      + '<span>' + UI.moneyInt(currentMonthRev) + ' earned</span>'
      + '<span>' + UI.moneyInt(goalsData.monthly) + ' goal</span>'
      + '</div>'
      + '<div style="height:10px;background:#e8e8e8;border-radius:5px;overflow:hidden;">'
      + '<div class="bm-goal-bar" style="height:100%;width:' + Math.min(monthlyPct, 100) + '%;background:' + monthlyBarColor + ';border-radius:5px;"></div>'
      + '</div>'
      + '<div style="font-size:12px;margin-top:4px;color:var(--text-light);">'
      + (monthlyRemaining > 0 ? UI.moneyInt(monthlyRemaining) + ' remaining to reach goal' : '\uD83C\uDF89 Goal exceeded by ' + UI.moneyInt(Math.abs(monthlyRemaining)) + '!')
      + '</div>'
      + '</div>';

    html += '</div>';

    // Revenue Forecast widget
    var openQuotes = allQuotes.filter(function(q) {
      if (q.status !== 'sent' && q.status !== 'awaiting' && q.status !== 'draft') return false;
      return !q.createdAt || new Date(q.createdAt) > sixMonthsAgo;
    });
    var pipelineValue = openQuotes.reduce(function(s, q) { return s + (q.total || 0); }, 0);
    var wonQuotes = allQuotes.filter(function(q) { return q.status === 'approved' || q.status === 'converted'; });
    var winRate = allQuotes.length > 0 ? wonQuotes.length / allQuotes.length : 0.5;
    var expectedClose = pipelineValue * winRate;
    var upcomingJobs = allJobs.filter(function(j) {
      var d = new Date(j.scheduledDate);
      return d > now && d <= new Date(now.getTime() + 30 * 86400000);
    });
    var upcomingValue = upcomingJobs.reduce(function(s, j) { return s + (j.total || 0); }, 0);
    var projected30 = expectedClose + upcomingValue;

    html += '<div style="background:linear-gradient(135deg,#1a3c12 0%,#2e5a1e 100%);border-radius:12px;padding:20px;color:#fff;margin-bottom:20px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
      + '<h3 style="font-size:16px;font-weight:700;">Revenue Forecast</h3>'
      + '<span style="font-size:12px;opacity:.7;">Next 30 days</span></div>'
      + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;" class="stat-row">'
      + '<div style="background:rgba(255,255,255,.12);border-radius:8px;padding:12px;text-align:center;">'
      + '<div style="font-size:22px;font-weight:800;">' + UI.moneyInt(pipelineValue) + '</div>'
      + '<div style="font-size:11px;opacity:.8;margin-top:4px;">Pipeline</div></div>'
      + '<div style="background:rgba(255,255,255,.12);border-radius:8px;padding:12px;text-align:center;">'
      + '<div style="font-size:22px;font-weight:800;">' + UI.moneyInt(expectedClose) + '</div>'
      + '<div style="font-size:11px;opacity:.8;margin-top:4px;">Expected Close (' + Math.round(winRate * 100) + '%)</div></div>'
      + '<div style="background:rgba(255,255,255,.12);border-radius:8px;padding:12px;text-align:center;">'
      + '<div style="font-size:22px;font-weight:800;">' + UI.moneyInt(upcomingValue) + '</div>'
      + '<div style="font-size:11px;opacity:.8;margin-top:4px;">Scheduled Work</div></div>'
      + '<div style="background:rgba(255,255,255,.18);border-radius:8px;padding:12px;text-align:center;">'
      + '<div style="font-size:22px;font-weight:800;">' + UI.moneyInt(projected30) + '</div>'
      + '<div style="font-size:11px;opacity:.8;margin-top:4px;">30-Day Projected</div></div>'
      + '</div></div>';

    // Action Items section
    var overdueInvCount = overdueInvoices.length;
    var overdueInvTotal = overdueTotal;
    var sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    var expiringQuotes = allQuotes.filter(function(q) {
      return q.status === 'sent' && q.createdAt
        && new Date(q.createdAt) < sevenDaysAgo
        && new Date(q.createdAt) > sixMonthsAgo;
    });
    var unscheduledJobs = allJobs.filter(function(j) {
      return (j.status === 'in_progress' || j.status === 'scheduled') && !j.scheduledDate;
    });
    var unsignedQuotes = allQuotes.filter(function(q) {
      if (q.status !== 'sent' && q.status !== 'awaiting') return false;
      return !q.createdAt || new Date(q.createdAt) > sixMonthsAgo;
    });

    var hasActions = overdueInvCount > 0 || expiringQuotes.length > 0 || unscheduledJobs.length > 0 || unsignedQuotes.length > 0;
    if (hasActions) {
      html += '<h3 style="font-size:18px;font-weight:700;margin-bottom:12px;">Action Items</h3>';
      html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;" class="stat-row">';

      // Overdue invoices
      html += '<div onclick="InvoicesPage._setFilter(\'overdue\');loadPage(\'invoices\');" style="background:#fff5f5;border:1px solid #ffcdd2;border-radius:10px;padding:14px;cursor:pointer;">'
        + '<div style="font-size:11px;font-weight:600;color:#c62828;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Overdue Invoices</div>'
        + '<div style="font-size:28px;font-weight:800;color:#c62828;">' + overdueInvCount + '</div>'
        + '<div style="font-size:12px;color:#e53935;margin-top:2px;">' + UI.moneyInt(overdueInvTotal) + ' outstanding</div>'
        + '</div>';

      // Expiring quotes
      html += '<div onclick="loadPage(\'quotes\')" style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:14px;cursor:pointer;">'
        + '<div style="font-size:11px;font-weight:600;color:#e65100;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Quotes Expiring</div>'
        + '<div style="font-size:28px;font-weight:800;color:#e65100;">' + expiringQuotes.length + '</div>'
        + '<div style="font-size:12px;color:#ef6c00;margin-top:2px;">Sent 7+ days ago</div>'
        + '</div>';

      // Unscheduled jobs
      html += '<div onclick="loadPage(\'jobs\')" style="background:#e3f2fd;border:1px solid #90caf9;border-radius:10px;padding:14px;cursor:pointer;">'
        + '<div style="font-size:11px;font-weight:600;color:#1565c0;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Needs Scheduling</div>'
        + '<div style="font-size:28px;font-weight:800;color:#1565c0;">' + unscheduledJobs.length + '</div>'
        + '<div style="font-size:12px;color:#1976d2;margin-top:2px;">No date assigned</div>'
        + '</div>';

      // Unsigned quotes
      html += '<div onclick="loadPage(\'quotes\')" style="background:#f3e5f5;border:1px solid #ce93d8;border-radius:10px;padding:14px;cursor:pointer;">'
        + '<div style="font-size:11px;font-weight:600;color:#6a1b9a;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Awaiting Approval</div>'
        + '<div style="font-size:28px;font-weight:800;color:#6a1b9a;">' + unsignedQuotes.length + '</div>'
        + '<div style="font-size:12px;color:#7b1fa2;margin-top:2px;">Quotes sent to clients</div>'
        + '</div>';

      html += '</div>';
    }

    // Today's Schedule (Jobber-style day view)
    function pad2(n) { return n < 10 ? '0' + n : '' + n; }
    var todayStr = now.getFullYear() + '-' + pad2(now.getMonth()+1) + '-' + pad2(now.getDate());
    var todayScheduled = allJobs.filter(function(j) {
      return j.scheduledDate && j.scheduledDate.substring(0,10) === todayStr && j.status !== 'completed';
    });
    var todayCompleted = allJobs.filter(function(j) {
      return j.scheduledDate && j.scheduledDate.substring(0,10) === todayStr && j.status === 'completed';
    });
    var teamMembers = JSON.parse(localStorage.getItem('bm-team') || '[]');

    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
      + '<h3 style="font-size:16px;margin:0;">📅 Today\'s Schedule</h3>'
      + '<div style="display:flex;gap:8px;align-items:center;">'
      + '<span style="font-size:12px;color:var(--text-light);">' + todayScheduled.length + ' remaining · ' + todayCompleted.length + ' done</span>'
      + '<button onclick="loadPage(\'schedule\')" class="btn btn-outline" style="font-size:11px;padding:4px 10px;">View Calendar</button>'
      + '</div></div>';

    if (todayScheduled.length > 0 || todayCompleted.length > 0) {
      // Time slots from 7am to 5pm
      var allToday = todayScheduled.concat(todayCompleted);
      allToday.sort(function(a, b) {
        var at = a.scheduledTime || a.startTime || '08:00';
        var bt = b.scheduledTime || b.startTime || '08:00';
        return at.localeCompare(bt);
      });
      allToday.forEach(function(j) {
        var time = j.scheduledTime || j.startTime || '8:00 AM';
        var isDone = j.status === 'completed';
        var crew = j.assignedTo || j.crew || '';
        html += '<div onclick="JobsPage.showDetail(\'' + j.id + '\')" style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #f5f5f5;cursor:pointer;' + (isDone ? 'opacity:.6;' : '') + '">'
          + '<div style="width:60px;font-size:12px;font-weight:600;color:var(--text-light);padding-top:2px;">' + UI.esc(time) + '</div>'
          + '<div style="width:4px;border-radius:2px;background:' + (isDone ? '#c8e6c9' : 'var(--green-dark)') + ';flex-shrink:0;"></div>'
          + '<div style="flex:1;">'
          + '<div style="font-weight:600;font-size:14px;' + (isDone ? 'text-decoration:line-through;' : '') + '">' + UI.esc(j.clientName) + '</div>'
          + '<div style="font-size:12px;color:var(--text-light);margin-top:2px;">' + UI.esc(j.description || j.property || '') + '</div>'
          + (crew ? '<div style="font-size:11px;color:var(--accent);margin-top:3px;">👷 ' + UI.esc(crew) + '</div>' : '')
          + '</div>'
          + '<div style="text-align:right;">'
          + (isDone ? '<span style="font-size:11px;color:var(--green-dark);font-weight:600;">✓ Done</span>' : UI.statusBadge(j.status))
          + (j.total ? '<div style="font-size:12px;font-weight:600;margin-top:4px;">' + UI.money(j.total) + '</div>' : '')
          + '</div></div>';
      });
    } else {
      html += '<div style="text-align:center;padding:24px;color:var(--text-light);">'
        + '<div style="font-size:24px;margin-bottom:8px;">🌤</div>'
        + '<div style="font-size:14px;">No jobs scheduled today</div>'
        + '<button onclick="loadPage(\'schedule\')" class="btn btn-primary" style="margin-top:12px;font-size:12px;">Schedule a Job</button>'
        + '</div>';
    }
    html += '</div>';

    // This Week overview strip
    var weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    html += '<div style="background:var(--white);border-radius:12px;padding:16px 20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="font-size:14px;margin:0 0 12px 0;color:var(--text-light);font-weight:600;">THIS WEEK</h3>'
      + '<div style="display:flex;gap:4px;">';
    for (var wd = 0; wd < 7; wd++) {
      var weekDay = new Date(startOfWeek);
      weekDay.setDate(startOfWeek.getDate() + wd);
      var wdStr = weekDay.getFullYear() + '-' + pad2(weekDay.getMonth()+1) + '-' + pad2(weekDay.getDate());
      var wdJobs = allJobs.filter(function(j) { return j.scheduledDate && j.scheduledDate.substring(0,10) === wdStr; });
      var isToday = wdStr === todayStr;
      var isPast = weekDay < now && !isToday;
      html += '<div onclick="loadPage(\'schedule\')" style="flex:1;text-align:center;padding:8px 4px;border-radius:8px;cursor:pointer;'
        + (isToday ? 'background:var(--green-dark);color:#fff;' : isPast ? 'opacity:.5;' : '') + '">'
        + '<div style="font-size:10px;font-weight:600;' + (isToday ? '' : 'color:var(--text-light);') + '">' + weekDays[(weekDay.getDay())] + '</div>'
        + '<div style="font-size:16px;font-weight:700;margin:2px 0;">' + weekDay.getDate() + '</div>'
        + '<div style="font-size:10px;' + (isToday ? 'color:rgba(255,255,255,.8);' : 'color:var(--text-light);') + '">'
        + (wdJobs.length > 0 ? wdJobs.length + ' job' + (wdJobs.length > 1 ? 's' : '') : '—')
        + '</div></div>';
    }
    html += '</div></div>';

    // Weather + Time clock
    if (typeof Weather !== 'undefined') html += Weather.renderWidget();
    html += TimeTrackPage.renderClockWidget();

    // Client Satisfaction NPS
    if (typeof Satisfaction !== 'undefined') {
      html += Satisfaction.renderNPSWidget();
    }

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">';

    // Upcoming Jobs
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);">'
      + '<h3 style="font-size:16px;margin-bottom:16px;">Upcoming Jobs</h3>';
    if (upcoming.length) {
      upcoming.forEach(function(j) {
        html += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;cursor:pointer;" onclick="JobsPage.showDetail(\'' + j.id + '\')">'
          + '<div><strong style="font-size:14px;">' + UI.esc(j.clientName) + '</strong><br><span style="font-size:12px;color:var(--text-light);">#' + j.jobNumber + ' — ' + UI.esc(j.description || '') + '</span></div>'
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
          + '<div><strong style="font-size:14px;">' + UI.esc(inv.clientName) + '</strong><br><span style="font-size:12px;color:var(--text-light);">#' + inv.invoiceNumber + ' — ' + UI.esc(inv.subject || '') + '</span></div>'
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
          + '<div><strong>' + UI.esc(r.clientName) + '</strong> <span style="font-size:12px;color:var(--text-light);">' + UI.esc(r.source || '') + '</span><br><span style="font-size:13px;color:var(--text-light);">' + UI.esc(r.property || '') + '</span></div>'
          + '<div style="text-align:right;">' + UI.statusBadge(r.status) + '<br><span style="font-size:12px;color:var(--text-light);">' + UI.dateRelative(r.createdAt) + '</span></div>'
          + '</div>';
      });
      html += '</div>';
    }

    // Lead Source Tracking (beyond Jobber — premium feature)
    var sourceMap = {};
    DB.requests.getAll().forEach(function(r) {
      var src = r.source || 'Unknown';
      if (!sourceMap[src]) sourceMap[src] = { count: 0, revenue: 0 };
      sourceMap[src].count++;
    });
    // Also check clients for source field
    DB.clients.getAll().forEach(function(c) {
      if (c.source) {
        if (!sourceMap[c.source]) sourceMap[c.source] = { count: 0, revenue: 0 };
      }
    });
    var sourceEntries = Object.keys(sourceMap).map(function(k) { return { name: k, count: sourceMap[k].count }; });
    sourceEntries.sort(function(a, b) { return b.count - a.count; });
    var maxSourceCount = sourceEntries.length > 0 ? sourceEntries[0].count : 1;
    var sourceColors = ['#2e7d32', '#1565c0', '#e65100', '#6a1b9a', '#c62828', '#00838f', '#4e342e', '#37474f'];

    if (sourceEntries.length > 1) {
      html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-top:16px;">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
        + '<h3 style="font-size:16px;margin:0;">📊 Lead Sources</h3>'
        + '<span style="font-size:12px;color:var(--text-light);">' + DB.requests.getAll().length + ' total requests</span></div>';
      sourceEntries.slice(0, 8).forEach(function(s, idx) {
        var pct = Math.round((s.count / maxSourceCount) * 100);
        var color = sourceColors[idx % sourceColors.length];
        html += '<div style="margin-bottom:8px;">'
          + '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px;">'
          + '<span style="font-weight:600;">' + UI.esc(s.name) + '</span>'
          + '<span style="color:var(--text-light);">' + s.count + ' requests</span></div>'
          + '<div style="height:8px;background:var(--bg);border-radius:4px;overflow:hidden;">'
          + '<div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:4px;transition:width .3s;"></div>'
          + '</div></div>';
      });
      html += '</div>';
    }

    // Media Center weekly reminder (injected from MediaCenter module)
    if (typeof MediaCenter !== 'undefined') {
      var mediaReminder = MediaCenter.getWeeklyReminderHtml();
      if (mediaReminder) html += mediaReminder;
    }

    // Admin To-Dos widget
    html += DashboardPage._renderAdminTasks();

    // Quick Actions
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-top:16px;">'
      + '<h3 style="font-size:16px;margin-bottom:12px;">Quick Actions</h3>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;">'
      + '<button onclick="loadPage(\'clients\');setTimeout(function(){ClientsPage.showForm()},100);" style="background:var(--green-bg);border:1px solid #c8e6c9;border-radius:8px;padding:12px;text-align:center;cursor:pointer;font-size:13px;font-weight:600;color:var(--green-dark);">👤 New Client</button>'
      + '<button onclick="loadPage(\'requests\');setTimeout(function(){RequestsPage.showForm()},100);" style="background:#e3f2fd;border:1px solid #bbdefb;border-radius:8px;padding:12px;text-align:center;cursor:pointer;font-size:13px;font-weight:600;color:#1565c0;">📥 New Request</button>'
      + '<button onclick="loadPage(\'quotes\');setTimeout(function(){QuotesPage.showForm()},100);" style="background:#fff3e0;border:1px solid #ffe0b2;border-radius:8px;padding:12px;text-align:center;cursor:pointer;font-size:13px;font-weight:600;color:#e65100;">📝 New Quote</button>'
      + '<button onclick="Estimator.show()" style="background:#fce4ec;border:1px solid #f8bbd0;border-radius:8px;padding:12px;text-align:center;cursor:pointer;font-size:13px;font-weight:600;color:#c62828;">🧮 Estimate Job</button>'
      + '<button onclick="loadPage(\'expenses\')" style="background:#f3e5f5;border:1px solid #e1bee7;border-radius:8px;padding:12px;text-align:center;cursor:pointer;font-size:13px;font-weight:600;color:#6a1b9a;">💸 Log Expense</button>'
      + '<button onclick="loadPage(\'schedule\')" style="background:#e8eaf6;border:1px solid #c5cae9;border-radius:8px;padding:12px;text-align:center;cursor:pointer;font-size:13px;font-weight:600;color:#283593;">📅 Schedule</button>'
      + '<button onclick="loadPage(\'treemeasure\')" style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:8px;padding:12px;text-align:center;cursor:pointer;font-size:13px;font-weight:600;color:#2e7d32;">🌲 Measure Tree</button>'
      + '<button onclick="loadPage(\'mediacenter\')" style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:12px;text-align:center;cursor:pointer;font-size:13px;font-weight:600;color:#e65100;">📸 Media Center</button>'
      + '</div></div>';

    // Recent Communications
    if (typeof CommsLog !== 'undefined') {
      var recentComms = CommsLog.getRecent(5);
      if (recentComms.length) {
        html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-top:16px;">'
          + '<h3 style="font-size:16px;margin-bottom:12px;">Recent Communications</h3>';
        recentComms.forEach(function(c) {
          var icons = { call: '📞', text: '💬', email: '📧', note: '📌', visit: '🏠', voicemail: '📱' };
          html += '<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:13px;">'
            + '<span>' + (icons[c.type] || '📋') + '</span>'
            + '<span style="flex:1;color:var(--text-light);">' + (c.notes || '').substring(0, 80) + '</span>'
            + '<span style="font-size:11px;color:var(--text-light);white-space:nowrap;">' + UI.dateRelative(c.date) + '</span>'
            + '</div>';
        });
        html += '</div>';
      }
    }

    // Revenue — Last 6 months bar chart
    var revMonths = [];
    var rNow = new Date();
    for (var rm = 5; rm >= 0; rm--) {
      var rDate = new Date(rNow.getFullYear(), rNow.getMonth() - rm, 1);
      var rMonth = rDate.getMonth();
      var rYear = rDate.getFullYear();
      var rRevenue = allInvoices.filter(function(i) {
        if (i.status !== 'paid') return false;
        var d = new Date(i.paidDate || i.createdAt);
        return d.getMonth() === rMonth && d.getFullYear() === rYear;
      }).reduce(function(s, i) { return s + (i.total || 0); }, 0);
      revMonths.push({ month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][rMonth], revenue: rRevenue, isCurrent: rm === 0 });
    }
    var revMax = Math.max.apply(null, revMonths.map(function(m) { return m.revenue; })) || 1;
    var revTotal = revMonths[5].revenue; // current month
    var revPrev = revMonths[4].revenue; // last month

    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px 20px;margin-bottom:20px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;cursor:pointer;" onclick="loadPage(\'insights\')">'
      + '<div><h3 style="font-size:15px;font-weight:700;margin:0;">Revenue</h3>'
      + '<div style="font-size:12px;color:var(--text-light);margin-top:2px;">' + (revPrev > 0 ? (revTotal >= revPrev ? '↑ ' + Math.round((revTotal - revPrev) / revPrev * 100) + '% vs last month' : '↓ ' + Math.round((revPrev - revTotal) / revPrev * 100) + '% vs last month') : 'Last 6 months collected') + '</div></div>'
      + '<div style="text-align:right;"><div style="font-size:22px;font-weight:800;color:var(--green-dark);">' + UI.moneyInt(revTotal) + '</div>'
      + '<div style="font-size:11px;color:var(--text-light);">this month</div></div>'
      + '</div>';

    revMonths.forEach(function(m) {
      var pct = revMax > 0 ? Math.max(m.revenue / revMax * 100, m.revenue > 0 ? 4 : 0) : 0;
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'
        + '<div style="width:28px;font-size:11px;color:var(--text-light);text-align:right;flex-shrink:0;">' + m.month + '</div>'
        + '<div style="flex:1;height:20px;background:var(--bg);border-radius:4px;overflow:hidden;">'
        + '<div style="height:100%;width:' + pct + '%;background:' + (m.isCurrent ? 'var(--green-dark)' : '#a5d6a7') + ';border-radius:4px;transition:width .3s;"></div></div>'
        + '<div style="width:60px;font-size:12px;font-weight:' + (m.isCurrent ? '700' : '500') + ';color:' + (m.isCurrent ? 'var(--green-dark)' : 'var(--text-light)') + ';text-align:right;">' + (m.revenue > 0 ? UI.moneyInt(m.revenue) : '—') + '</div>'
        + '</div>';
    });

    html += '<div style="text-align:center;margin-top:8px;"><a onclick="loadPage(\'insights\')" style="font-size:12px;color:var(--green-dark);cursor:pointer;text-decoration:none;">View full report →</a></div>'
      + '</div>';

    return html;
  },

  _renderAdminTasks: function() {
    var tasks = DashboardPage._getAdminTasks();
    var now = new Date();
    var todayStr = now.toISOString().split('T')[0];

    // Auto-generate recurring tasks that are past-due or due this week
    DashboardPage._advanceRecurringTasks(tasks, todayStr);
    tasks = DashboardPage._getAdminTasks(); // re-read after advance

    var pending = tasks.filter(function(t) { return !t.completed; });
    var overdue = pending.filter(function(t) { return t.dueDate < todayStr; });
    var thisWeek = pending.filter(function(t) { return t.dueDate >= todayStr; });
    var recentlyDone = tasks.filter(function(t) { return t.completed; }).slice(-3);

    var html = '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-top:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
      + '<h3 style="font-size:16px;margin:0;">📋 Admin To-Dos</h3>'
      + '<div style="display:flex;gap:6px;">'
      + (overdue.length > 0 ? '<span style="background:#ffebee;color:#c62828;font-size:11px;font-weight:700;padding:3px 8px;border-radius:10px;">' + overdue.length + ' overdue</span>' : '')
      + '<button onclick="DashboardPage.showAddTask()" class="btn btn-outline" style="font-size:11px;padding:4px 10px;">+ Add Task</button>'
      + '</div></div>';

    if (pending.length === 0 && recentlyDone.length === 0) {
      html += '<div style="text-align:center;padding:20px;color:var(--text-light);font-size:14px;">✅ All caught up! No admin tasks.</div>';
    }

    // Overdue tasks
    if (overdue.length > 0) {
      html += '<div style="font-size:11px;font-weight:700;color:#c62828;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Overdue</div>';
      overdue.forEach(function(t) { html += DashboardPage._renderTaskRow(t, true); });
    }

    // Due this week / upcoming
    if (thisWeek.length > 0) {
      if (overdue.length > 0) html += '<div style="height:1px;background:var(--border);margin:10px 0;"></div>';
      html += '<div style="font-size:11px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Upcoming</div>';
      thisWeek.forEach(function(t) { html += DashboardPage._renderTaskRow(t, false); });
    }

    // Recently completed (last 3)
    if (recentlyDone.length > 0) {
      html += '<div style="height:1px;background:var(--border);margin:10px 0;"></div>'
        + '<div style="font-size:11px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Recently Done</div>';
      recentlyDone.forEach(function(t) { html += DashboardPage._renderTaskRow(t, false); });
    }

    html += '</div>';
    return html;
  },

  _renderTaskRow: function(t, isOverdue) {
    var catIcons = { media: '📸', social: '📱', finance: '💰', admin: '📋' };
    var icon = catIcons[t.category] || '📋';
    var recurLabel = t.recurrence === 'weekly' ? ' · Weekly' : t.recurrence === 'monthly' ? ' · Monthly' : '';
    var dateLabel = t.dueDate ? UI.dateShort(t.dueDate) : '';
    var rowStyle = t.completed ? 'opacity:.5;' : '';
    var dateColor = isOverdue ? '#c62828' : 'var(--text-light)';

    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f5f5f5;' + rowStyle + '">'
      + '<div onclick="DashboardPage.toggleTask(\'' + t.id + '\')" style="width:20px;height:20px;border-radius:50%;border:2px solid ' + (t.completed ? 'var(--green-dark)' : (isOverdue ? '#c62828' : '#ccc')) + ';display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;background:' + (t.completed ? 'var(--green-dark)' : 'transparent') + ';">'
      + (t.completed ? '<span style="color:#fff;font-size:11px;">✓</span>' : '')
      + '</div>'
      + '<span style="font-size:16px;flex-shrink:0;">' + icon + '</span>'
      + '<div style="flex:1;min-width:0;">'
      + '<div style="font-size:13px;font-weight:600;' + (t.completed ? 'text-decoration:line-through;' : '') + '">' + UI.esc(t.title) + '</div>'
      + '<div style="font-size:11px;color:' + dateColor + ';">' + dateLabel + recurLabel + '</div>'
      + '</div>'
      + '<div style="display:flex;gap:4px;">'
      + (t.category === 'media' ? '<button onclick="loadPage(\'mediacenter\')" class="btn btn-outline" style="font-size:10px;padding:2px 8px;">Open</button>' : '')
      + '<button onclick="DashboardPage.deleteTask(\'' + t.id + '\')" style="background:none;border:none;color:var(--text-light);cursor:pointer;font-size:13px;padding:2px 4px;" title="Delete">✕</button>'
      + '</div></div>';
  },

  _getAdminTasks: function() {
    try { return JSON.parse(localStorage.getItem('bm-admin-tasks') || '[]'); } catch(e) { return []; }
  },

  _saveAdminTasks: function(tasks) {
    localStorage.setItem('bm-admin-tasks', JSON.stringify(tasks));
  },

  _advanceRecurringTasks: function(tasks, todayStr) {
    var changed = false;
    var now = new Date();
    tasks.forEach(function(t) {
      if (!t.recurrence || t.recurrence === 'none') return;
      // If completed and recurrence set, create next occurrence
      if (t.completed && t.nextDue && t.nextDue <= todayStr) {
        t.completed = false;
        t.dueDate = t.nextDue;
        t.nextDue = null;
        changed = true;
      }
      // If not yet created default weekly media task, do it
    });
    // Seed default weekly task if none exist
    if (tasks.length === 0) {
      var d = new Date(now);
      var daysUntilMonday = (8 - d.getDay()) % 7 || 7;
      d.setDate(d.getDate() + daysUntilMonday);
      tasks.push({
        id: 'at_media_weekly',
        title: 'Review media uploads & schedule social posts',
        dueDate: d.toISOString().split('T')[0],
        completed: false,
        recurrence: 'weekly',
        category: 'media',
        color: '#7b1fa2'
      });
      changed = true;
    }
    if (changed) DashboardPage._saveAdminTasks(tasks);
  },

  toggleTask: function(id) {
    var tasks = DashboardPage._getAdminTasks();
    var t = tasks.find(function(x) { return x.id === id; });
    if (!t) return;
    t.completed = !t.completed;
    if (t.completed && t.recurrence === 'weekly') {
      var next = new Date(t.dueDate || new Date());
      next.setDate(next.getDate() + 7);
      t.nextDue = next.toISOString().split('T')[0];
      UI.toast('Task done! Next reminder: ' + UI.dateShort(t.nextDue));
    } else if (t.completed && t.recurrence === 'monthly') {
      var next2 = new Date(t.dueDate || new Date());
      next2.setMonth(next2.getMonth() + 1);
      t.nextDue = next2.toISOString().split('T')[0];
      UI.toast('Task done! Next reminder: ' + UI.dateShort(t.nextDue));
    } else {
      UI.toast(t.completed ? 'Task marked done' : 'Task reopened');
    }
    DashboardPage._saveAdminTasks(tasks);
    loadPage('dashboard');
  },

  deleteTask: function(id) {
    var tasks = DashboardPage._getAdminTasks().filter(function(t) { return t.id !== id; });
    DashboardPage._saveAdminTasks(tasks);
    loadPage('dashboard');
  },

  showAddTask: function() {
    // Find next Monday as default due date
    var d = new Date();
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
    var defDate = d.toISOString().split('T')[0];

    var html = '<div style="display:flex;flex-direction:column;gap:14px;padding:4px 0;">'
      + '<div><label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;">Task Title</label>'
      + '<input id="at-title" class="form-control" placeholder="e.g. Review media uploads" style="width:100%;" /></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      + '<div><label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;">Due Date</label>'
      + '<input id="at-due" type="date" class="form-control" value="' + defDate + '" /></div>'
      + '<div><label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;">Category</label>'
      + '<select id="at-cat" class="form-control"><option value="admin">📋 Admin</option><option value="media">📸 Media</option><option value="social">📱 Social</option><option value="finance">💰 Finance</option></select></div>'
      + '</div>'
      + '<div><label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;">Repeat</label>'
      + '<select id="at-recur" class="form-control"><option value="none">No repeat</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>'
      + '</div>';

    UI.showModal('Add Admin Task', html, {
      footer: '<button class="btn btn-primary" onclick="DashboardPage._saveNewTask()">Add Task</button>'
        + '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
    });
    setTimeout(function() {
      var el = document.getElementById('at-title');
      if (el) el.focus();
    }, 100);
  },

  _saveNewTask: function() {
    var title = (document.getElementById('at-title') || {}).value || '';
    var due = (document.getElementById('at-due') || {}).value || '';
    var cat = (document.getElementById('at-cat') || {}).value || 'admin';
    var recur = (document.getElementById('at-recur') || {}).value || 'none';
    if (!title.trim()) { UI.toast('Please enter a task title'); return; }
    var tasks = DashboardPage._getAdminTasks();
    tasks.push({
      id: 'at_' + Date.now(),
      title: title.trim(),
      dueDate: due || new Date().toISOString().split('T')[0],
      completed: false,
      recurrence: recur,
      category: cat,
      color: cat === 'media' ? '#7b1fa2' : cat === 'social' ? '#1565c0' : cat === 'finance' ? '#2e7d32' : '#555'
    });
    DashboardPage._saveAdminTasks(tasks);
    UI.closeModal();
    loadPage('dashboard');
    UI.toast('Task added');
  },

  syncNow: function() {
    var btn = document.getElementById('sync-btn');
    if (btn) { btn.textContent = 'Syncing...'; btn.disabled = true; }
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.ready) {
      SupabaseDB._pullFromCloud().then(function() {
        loadPage('dashboard');
      }).catch(function(e) {
        console.warn('Sync error:', e);
        loadPage('dashboard');
      });
    } else {
      // Direct fetch if SupabaseDB not initialized yet
      var url = 'https://ltpivkqahvplapyagljt.supabase.co';
      var key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cGl2a3FhaHZwbGFweWFnbGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTgxNzIsImV4cCI6MjA4OTY3NDE3Mn0.bQ-wAx4Uu-FyA2ZwsTVfFoU2ZPbeWCmupqV-6ZR9uFI';
      var tables = [
        { local: 'bm-clients', remote: 'clients' },
        { local: 'bm-requests', remote: 'requests' },
        { local: 'bm-quotes', remote: 'quotes' },
        { local: 'bm-jobs', remote: 'jobs' },
        { local: 'bm-invoices', remote: 'invoices' },
        { local: 'bm-services', remote: 'services' },
        { local: 'bm-team', remote: 'team_members' }
      ];
      var total = 0;
      var idx = 0;
      function fetchNext() {
        if (idx >= tables.length) {
          if (typeof UI !== 'undefined') UI.toast(total + ' records synced from cloud!');
          loadPage('dashboard');
          return;
        }
        var t = tables[idx++];
        fetch(url + '/rest/v1/' + t.remote + '?select=*&limit=5000&order=created_at.desc', {
          headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
        }).then(function(resp) {
          return resp.json();
        }).then(function(data) {
          if (data && data.length > 0) {
            // Convert snake_case to camelCase
            var converted = data.map(function(row) {
              var newRow = {};
              Object.keys(row).forEach(function(k) {
                var camel = k.replace(/_([a-z])/g, function(m, p1) { return p1.toUpperCase(); });
                newRow[camel] = row[k];
              });
              return newRow;
            });
            localStorage.setItem(t.local, JSON.stringify(converted));
            total += converted.length;
          }
          fetchNext();
        }).catch(function(e) {
          console.warn('Sync error:', t.remote, e);
          fetchNext();
        });
      }
      fetchNext();
    }
  },

  dismissBriefing: function() {
    var now = new Date();
    var dateStr = now.getFullYear() + '-' + (now.getMonth() + 1 < 10 ? '0' : '') + (now.getMonth() + 1) + '-' + (now.getDate() < 10 ? '0' : '') + now.getDate();
    localStorage.setItem('bm-briefing-dismissed', dateStr);
    var el = document.getElementById('daily-briefing');
    if (el) el.remove();
  },

  editGoals: function() {
    var goals = JSON.parse(localStorage.getItem('bm-revenue-goals') || '{"annual":300000,"monthly":25000}');
    var modal = '<div id="goals-modal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;" onclick="if(event.target===this)this.remove();">'
      + '<div style="background:#fff;border-radius:12px;padding:24px;width:90%;max-width:400px;">'
      + '<h3 style="margin:0 0 16px 0;font-size:18px;">Set Revenue Goals</h3>'
      + '<form onsubmit="event.preventDefault();DashboardPage.saveGoals(this);">'
      + '<div style="margin-bottom:16px;">'
      + '<label style="display:block;font-size:13px;font-weight:600;margin-bottom:4px;">Annual Revenue Goal ($)</label>'
      + '<input type="number" name="annual" value="' + (goals.annual || 300000) + '" min="0" step="1000" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:15px;" />'
      + '</div>'
      + '<div style="margin-bottom:20px;">'
      + '<label style="display:block;font-size:13px;font-weight:600;margin-bottom:4px;">Monthly Revenue Goal ($)</label>'
      + '<input type="number" name="monthly" value="' + (goals.monthly || 25000) + '" min="0" step="500" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:15px;" />'
      + '</div>'
      + '<div style="display:flex;gap:8px;justify-content:flex-end;">'
      + '<button type="button" onclick="document.getElementById(\'goals-modal\').remove();" class="btn btn-outline" style="font-size:13px;">Cancel</button>'
      + '<button type="submit" class="btn btn-primary" style="font-size:13px;">Save Goals</button>'
      + '</div>'
      + '</form>'
      + '</div></div>';
    document.body.insertAdjacentHTML('beforeend', modal);
  },

  saveGoals: function(form) {
    var annual = parseFloat(form.annual.value) || 300000;
    var monthly = parseFloat(form.monthly.value) || 25000;
    localStorage.setItem('bm-revenue-goals', JSON.stringify({ annual: annual, monthly: monthly }));
    var modal = document.getElementById('goals-modal');
    if (modal) modal.remove();
    UI.toast('Revenue goals updated!');
    loadPage('dashboard');
  }
};

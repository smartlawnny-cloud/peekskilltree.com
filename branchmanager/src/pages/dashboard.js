/**
 * Branch Manager — Dashboard Page
 */
var DashboardPage = {
  render: function() {
    // One-time fix: mark Jobber-migrated completed jobs as already invoiced
    if (!localStorage.getItem('bm-legacy-jobs-fixed')) {
      DB.jobs.getAll().forEach(function(j) {
        if (j.status === 'completed' && !j.invoiceId) DB.jobs.update(j.id, { invoiceId: 'legacy' });
      });
      localStorage.setItem('bm-legacy-jobs-fixed', '1');
    }
    // Auto-expire quotes past their expiry date
    var today = new Date().toISOString().split('T')[0];
    DB.quotes.getAll().forEach(function(q) {
      if (q.expiresAt && q.expiresAt < today && (q.status === 'sent' || q.status === 'awaiting')) {
        DB.quotes.update(q.id, { status: 'expired' });
      }
    });

    var unpaidInvoices = DB.invoices.getAll().filter(function(i) { return i.status !== 'paid' && i.balance > 0; });

    // Show sync banner if no local data but Supabase is connected
    var localClients = JSON.parse(localStorage.getItem('bm-clients') || '[]');
    var html = '';

    // === GREETING (show first on mobile) ===
    var now = new Date();
    var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var monthFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var hour = now.getHours();
    var greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    var userName = (typeof Auth !== 'undefined' && Auth.user) ? Auth.user.name || 'Doug' : 'Doug';
    html += '<div style="margin-bottom:16px;">'
      + '<div style="font-size:13px;color:var(--text-light);">' + dayNames[now.getDay()] + ', ' + monthFull[now.getMonth()] + ' ' + now.getDate() + '</div>'
      + '<h2 style="font-size:28px;font-weight:700;margin-top:2px;">' + greeting + ', ' + userName.split(' ')[0] + '</h2>'
      + '</div>';

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

    if (localClients.length === 0 && typeof SupabaseDB !== 'undefined' && SupabaseDB && SupabaseDB.DEFAULT_URL) {
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
          + '<div><div style="font-size:13px;font-weight:600;">AI Assistant</div>'
          + '<div style="font-size:12px;color:#666;">AI pricing, email drafts &amp; business insights</div></div>'
          + '</div>'
          + '<button class="btn btn-sm" style="font-size:12px;white-space:nowrap;" onclick="loadPage(\'ai\')">Connect →</button>'
          + '</div>';
      }
      html += '</div>';
    }

    // Greeting moved to top of page (above MOTT)

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

    // Receivables panel
    var rcvUnpaid = DB.invoices.getAll().filter(function(i) { return (i.status === 'sent' || i.status === 'overdue' || i.status === 'partial') && (i.balance || i.total || 0) > 0; });
    var rcvTotalOwed = rcvUnpaid.reduce(function(s, i) { return s + (i.balance || i.total || 0); }, 0);
    if (rcvUnpaid.length > 0) {
      rcvUnpaid.sort(function(a, b) { return (b.balance || b.total || 0) - (a.balance || a.total || 0); });
      html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
        + '<h3 style="font-size:16px;margin:0;">Receivables</h3>'
        + '<span style="font-size:12px;color:var(--text-light);">' + rcvUnpaid.length + ' client' + (rcvUnpaid.length !== 1 ? 's' : '') + ' owe you</span></div>'
        + '<div style="font-size:28px;font-weight:800;color:var(--green-dark);margin-bottom:16px;">' + UI.moneyInt(rcvTotalOwed) + '</div>';
      rcvUnpaid.slice(0, 6).forEach(function(inv) {
        var daysLate = inv.dueDate ? Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400000) : 0;
        var lateColor = daysLate > 30 ? '#dc3545' : daysLate > 0 ? '#e65100' : 'var(--text-light)';
        html += '<div onclick="InvoicesPage.showDetail(\'' + inv.id + '\')" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;">'
          + '<span style="font-size:14px;font-weight:600;">' + UI.esc(inv.clientName || '') + '</span>'
          + '<div style="text-align:right;">'
          + '<span style="font-weight:700;">' + UI.money(inv.balance || inv.total) + '</span>'
          + (daysLate > 0 ? '<span style="font-size:11px;color:' + lateColor + ';margin-left:8px;">' + daysLate + 'd late</span>' : '')
          + '</div></div>';
      });
      html += '</div>';
    }

    // Lead Source Tracking
    var sourceMap = {};
    DB.requests.getAll().forEach(function(r) {
      var src = r.source || 'Unknown';
      if (src.toLowerCase().indexOf('request') !== -1) src = 'Direct Request';
      if (!sourceMap[src]) sourceMap[src] = { count: 0, revenue: 0 };
      sourceMap[src].count++;
    });
    // Also check clients for source field
    DB.clients.getAll().forEach(function(c) {
      if (c.source) {
        var csrc = c.source;
        if (csrc.toLowerCase().indexOf('request') !== -1) csrc = 'Direct Request';
        if (!sourceMap[csrc]) sourceMap[csrc] = { count: 0, revenue: 0 };
      }
    });
    var sourceEntries = Object.keys(sourceMap).map(function(k) { return { name: k, count: sourceMap[k].count }; });
    sourceEntries.sort(function(a, b) { return b.count - a.count; });
    var maxSourceCount = sourceEntries.length > 0 ? sourceEntries[0].count : 1;
    var sourceColors = ['#2e7d32', '#1565c0', '#e65100', '#6a1b9a', '#c62828', '#00838f', '#4e342e', '#37474f'];

    if (sourceEntries.length > 1) {
      html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-top:16px;">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
        + '<h3 style="font-size:16px;margin:0;">Lead Sources</h3>'
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

    return html;
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
  }
};

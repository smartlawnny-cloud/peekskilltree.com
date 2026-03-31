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

    html += '<div class="stat-grid">'
      + UI.statCard("Today's Jobs", todayJobs.length.toString(), todayJobs.length ? todayJobs.map(function(j){return UI.esc(j.clientName);}).join(', ') : 'No visits scheduled', '', '', "loadPage('schedule')")
      + UI.statCard('Receivables', UI.moneyInt(stats.receivables), unpaidInvoices.length + ' clients owe you', stats.receivables > 0 ? 'down' : '', '', "loadPage('invoices')")
      + UI.statCard('New Requests', stats.newRequests.toString(), 'Awaiting response', stats.newRequests > 0 ? '' : '', '', "loadPage('requests')")
      + UI.statCard('Active Jobs', stats.activeJobs.toString(), 'In progress', '', '', "loadPage('jobs')")
      + '</div>';

    // Action Required (Jobber-style alerts)
    var overdueInvoices = unpaidInvoices.filter(function(i) { return i.dueDate && new Date(i.dueDate) < now; });
    var unapprovedQuotes = allQuotes.filter(function(q) { return q.status === 'sent' || q.status === 'awaiting'; });
    var lateJobs = allJobs.filter(function(j) { return j.status === 'late'; });
    var hasAlerts = overdueInvoices.length || recentRequests.length || unapprovedQuotes.length || lateJobs.length;

    if (hasAlerts) {
      html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);margin-bottom:16px;overflow:hidden;">'
        + '<div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;">'
        + '<span style="font-size:16px;">⚡</span><h3 style="font-size:15px;margin:0;">Action Required</h3></div>';

      if (overdueInvoices.length) {
        html += '<div onclick="loadPage(\'invoices\')" style="display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid var(--bg);cursor:pointer;transition:background .1s;" onmouseenter="this.style.background=\'var(--bg)\'" onmouseleave="this.style.background=\'\'">'
          + '<div style="width:36px;height:36px;border-radius:8px;background:#fde8e8;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🔴</div>'
          + '<div style="flex:1;"><div style="font-size:14px;font-weight:600;">' + overdueInvoices.length + ' overdue invoice' + (overdueInvoices.length > 1 ? 's' : '') + '</div>'
          + '<div style="font-size:12px;color:var(--text-light);">' + UI.moneyInt(overdueInvoices.reduce(function(s,i){return s+(i.balance||0);},0)) + ' outstanding</div></div>'
          + '<span style="color:var(--text-light);font-size:18px;">›</span></div>';
      }
      if (recentRequests.length) {
        html += '<div onclick="loadPage(\'requests\')" style="display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid var(--bg);cursor:pointer;transition:background .1s;" onmouseenter="this.style.background=\'var(--bg)\'" onmouseleave="this.style.background=\'\'">'
          + '<div style="width:36px;height:36px;border-radius:8px;background:#e3f2fd;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">📥</div>'
          + '<div style="flex:1;"><div style="font-size:14px;font-weight:600;">' + recentRequests.length + ' new request' + (recentRequests.length > 1 ? 's' : '') + '</div>'
          + '<div style="font-size:12px;color:var(--text-light);">Awaiting response</div></div>'
          + '<span style="color:var(--text-light);font-size:18px;">›</span></div>';
      }
      if (unapprovedQuotes.length) {
        html += '<div onclick="loadPage(\'quotes\')" style="display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid var(--bg);cursor:pointer;transition:background .1s;" onmouseenter="this.style.background=\'var(--bg)\'" onmouseleave="this.style.background=\'\'">'
          + '<div style="width:36px;height:36px;border-radius:8px;background:#fff3e0;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">📋</div>'
          + '<div style="flex:1;"><div style="font-size:14px;font-weight:600;">' + unapprovedQuotes.length + ' quote' + (unapprovedQuotes.length > 1 ? 's' : '') + ' awaiting approval</div>'
          + '<div style="font-size:12px;color:var(--text-light);">' + UI.moneyInt(unapprovedQuotes.reduce(function(s,q){return s+(q.total||0);},0)) + ' pending</div></div>'
          + '<span style="color:var(--text-light);font-size:18px;">›</span></div>';
      }
      if (lateJobs.length) {
        html += '<div onclick="loadPage(\'jobs\')" style="display:flex;align-items:center;gap:12px;padding:12px 20px;cursor:pointer;transition:background .1s;" onmouseenter="this.style.background=\'var(--bg)\'" onmouseleave="this.style.background=\'\'">'
          + '<div style="width:36px;height:36px;border-radius:8px;background:#ffebee;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">⚠️</div>'
          + '<div style="flex:1;"><div style="font-size:14px;font-weight:600;">' + lateJobs.length + ' late job' + (lateJobs.length > 1 ? 's' : '') + '</div>'
          + '<div style="font-size:12px;color:var(--text-light);">Needs rescheduling</div></div>'
          + '<span style="color:var(--text-light);font-size:18px;">›</span></div>';
      }
      html += '</div>';
    }

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

    // Weather + Time clock
    if (typeof Weather !== 'undefined') html += Weather.renderWidget();
    html += TimeTrackPage.renderClockWidget();

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

    return html;
  },

  syncNow: async function() {
    var btn = document.getElementById('sync-btn');
    if (btn) { btn.textContent = 'Syncing...'; btn.disabled = true; }
    if (SupabaseDB && SupabaseDB.ready) {
      await SupabaseDB._pullFromCloud();
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
      for (var i = 0; i < tables.length; i++) {
        var t = tables[i];
        try {
          var resp = await fetch(url + '/rest/v1/' + t.remote + '?select=*&limit=5000&order=created_at.desc', {
            headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
          });
          var data = await resp.json();
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
        } catch (e) { console.warn('Sync error:', t.remote, e); }
      }
      UI.toast(total + ' records synced from cloud!');
    }
    loadPage('dashboard');
  }
};

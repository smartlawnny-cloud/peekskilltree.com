/**
 * Branch Manager — Crew Dispatch / Today's Route
 * Shows today's jobs in order with driving directions between stops
 */
var DispatchPage = {
  render: function() {
    var today = new Date();
    var todayStr = today.toISOString().split('T')[0];
    var jobs = DB.jobs.getAll().filter(function(j) {
      if (!j.scheduledDate) return false;
      return j.scheduledDate.split('T')[0] === todayStr;
    });

    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
      + '<div class="section-header" style="margin:0;"><h2>🚛 Today\'s Dispatch</h2>'
      + '<p style="color:var(--text-light);font-size:13px;margin-top:2px;">' + UI.dateShort(today.toISOString()) + ' — ' + jobs.length + ' jobs</p></div>'
      + '<button onclick="DispatchPage.openRoute()" style="background:var(--green-dark);color:#fff;border:none;padding:8px 16px;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px;">🗺 Open in Maps</button>'
      + '</div>';

    // Weather at top
    if (typeof Weather !== 'undefined') {
      html += Weather.renderWidget();
    }

    // Time clock
    if (typeof TimeTrackPage !== 'undefined') {
      html += TimeTrackPage.renderClockWidget();
    }

    // Job route list
    html += '<div style="position:relative;">';
    if (jobs.length) {
      // Start: your location
      html += '<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:0;">'
        + '<div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:40px;">'
        + '<div style="width:32px;height:32px;background:var(--green-dark);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">🏠</div>'
        + '<div style="width:2px;height:20px;background:var(--border);"></div></div>'
        + '<div style="padding:8px 0;"><strong style="font-size:14px;">Start — 1 Highland Industrial Park, Peekskill</strong>'
        + '<div style="font-size:12px;color:var(--text-light);">Base of operations</div></div></div>';

      jobs.forEach(function(j, idx) {
        var statusColors = { scheduled: '#2196f3', active: '#ff9800', completed: '#4caf50' };
        var color = statusColors[j.status] || '#999';

        html += '<div style="display:flex;gap:12px;align-items:flex-start;">'
          + '<div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:40px;">'
          + '<div style="width:32px;height:32px;background:' + color + ';border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">' + (idx + 1) + '</div>'
          + (idx < jobs.length - 1 ? '<div style="width:2px;height:100%;min-height:60px;background:var(--border);"></div>' : '')
          + '</div>'
          + '<div style="flex:1;background:var(--white);border-radius:10px;padding:14px;border:1px solid var(--border);margin-bottom:8px;cursor:pointer;" onclick="JobsPage.showDetail(\'' + j.id + '\')">'
          + '<div style="display:flex;justify-content:space-between;align-items:flex-start;">'
          + '<div><strong style="font-size:15px;">' + j.clientName + '</strong>'
          + '<div style="font-size:13px;color:var(--text-light);margin-top:2px;">' + (j.description || j.property || 'Job #' + (j.jobNumber || '')) + '</div>'
          + '<div style="font-size:12px;color:var(--text-light);margin-top:4px;">📍 ' + (j.property || j.address || 'No address') + '</div></div>'
          + '<div style="text-align:right;">'
          + '<div style="font-weight:700;color:var(--green-dark);">' + UI.money(j.total || 0) + '</div>'
          + '<div style="margin-top:4px;">' + UI.statusBadge(j.status) + '</div></div></div>'
          + '<div style="display:flex;gap:6px;margin-top:8px;">'
          + '<button onclick="event.stopPropagation();DispatchPage.navigate(\'' + (j.property || j.address || '') + '\')" style="background:var(--green-bg);border:1px solid #c8e6c9;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer;font-weight:600;color:var(--green-dark);">🗺 Navigate</button>'
          + '<button onclick="event.stopPropagation();DispatchPage.callClient(\'' + (j.clientPhone || '') + '\')" style="background:#e3f2fd;border:1px solid #bbdefb;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer;font-weight:600;color:#1565c0;">📞 Call</button>'
          + (j.status === 'scheduled' ? '<button onclick="event.stopPropagation();DispatchPage.startJob(\'' + j.id + '\')" style="background:#fff3e0;border:1px solid #ffe0b2;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer;font-weight:600;color:#e65100;">▶ Start</button>' : '')
          + (j.status === 'active' ? '<button onclick="event.stopPropagation();DispatchPage.completeJob(\'' + j.id + '\')" style="background:#e8f5e9;border:1px solid #c8e6c9;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer;font-weight:600;color:#2e7d32;">✅ Complete</button>' : '')
          + '</div></div></div>';
      });

      // End: back to base
      html += '<div style="display:flex;gap:12px;align-items:flex-start;">'
        + '<div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:40px;">'
        + '<div style="width:32px;height:32px;background:var(--green-dark);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">🏠</div></div>'
        + '<div style="padding:8px 0;"><strong style="font-size:14px;">Return to Base</strong></div></div>';

      // Daily total
      var dayTotal = jobs.reduce(function(s, j) { return s + (j.total || 0); }, 0);
      html += '<div style="background:var(--green-dark);border-radius:10px;padding:16px;color:#fff;margin-top:16px;display:flex;justify-content:space-between;align-items:center;">'
        + '<div><div style="font-size:13px;opacity:.7;">Today\'s Revenue</div><div style="font-size:24px;font-weight:800;">' + UI.money(dayTotal) + '</div></div>'
        + '<div style="text-align:right;"><div style="font-size:13px;opacity:.7;">Jobs</div><div style="font-size:24px;font-weight:800;">' + jobs.length + '</div></div></div>';

    } else {
      html += '<div style="text-align:center;padding:60px 20px;background:var(--white);border-radius:12px;border:1px solid var(--border);">'
        + '<div style="font-size:48px;margin-bottom:12px;">🌳</div>'
        + '<h3 style="font-size:18px;margin-bottom:8px;">No jobs scheduled today</h3>'
        + '<p style="color:var(--text-light);font-size:14px;">Check the <a href="#" onclick="loadPage(\'schedule\');return false;" style="color:var(--green-dark);">schedule</a> for upcoming work.</p>'
        + '</div>';
    }
    html += '</div>';

    return html;
  },

  navigate: function(address) {
    if (!address) { UI.toast('No address on file', 'error'); return; }
    var url = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(address);
    window.open(url, '_blank');
  },

  callClient: function(phone) {
    if (!phone) { UI.toast('No phone number', 'error'); return; }
    window.open('tel:' + phone);
  },

  openRoute: function() {
    var jobs = DB.jobs.getAll().filter(function(j) {
      if (!j.scheduledDate) return false;
      return j.scheduledDate.split('T')[0] === new Date().toISOString().split('T')[0];
    });
    if (!jobs.length) { UI.toast('No jobs today', 'error'); return; }

    // Build Google Maps multi-stop URL
    var origin = '1+Highland+Industrial+Park+Peekskill+NY';
    var waypoints = jobs.map(function(j) { return encodeURIComponent(j.property || j.address || j.clientName); }).join('|');
    var url = 'https://www.google.com/maps/dir/' + origin + '/' + waypoints + '/' + origin;
    window.open(url, '_blank');
  },

  startJob: function(jobId) {
    DB.jobs.update(jobId, { status: 'active', startedAt: new Date().toISOString() });
    UI.toast('Job started!');
    loadPage('dispatch');
  },

  completeJob: function(jobId) {
    DB.jobs.update(jobId, { status: 'completed', completedDate: new Date().toISOString() });
    UI.toast('Job completed!');
    loadPage('dispatch');
  }
};

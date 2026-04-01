/**
 * Branch Manager — Schedule / Calendar Page
 * Jobber-style with Today agenda, Week, and Month views
 */
var SchedulePage = {
  view: 'week',
  currentDate: new Date(),

  render: function() {
    var self = SchedulePage;
    var html = '';
    var today = new Date().toISOString().split('T')[0];
    var allJobs = DB.jobs.getAll();
    var todayJobs = allJobs.filter(function(j) { return j.scheduledDate === today; });

    // Jobber-style Today's agenda card (always visible at top)
    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:20px;">'
      + '<div style="background:var(--green-dark);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">'
      + '<div><div style="font-size:12px;opacity:.8;">TODAY</div>'
      + '<div style="font-size:18px;font-weight:700;">' + self._formatDate(new Date(), 'full') + '</div></div>'
      + '<div style="text-align:right;"><div style="font-size:28px;font-weight:800;">' + todayJobs.length + '</div>'
      + '<div style="font-size:11px;opacity:.8;">visit' + (todayJobs.length !== 1 ? 's' : '') + '</div></div>'
      + '</div>';

    if (todayJobs.length > 0) {
      var todayRevenue = todayJobs.reduce(function(s,j){ return s + (j.total||0); }, 0);
      var completed = todayJobs.filter(function(j){ return j.status === 'completed'; }).length;

      // Progress bar
      var pct = todayJobs.length > 0 ? Math.round(completed / todayJobs.length * 100) : 0;
      html += '<div style="padding:12px 20px;border-bottom:1px solid var(--border);">'
        + '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-light);margin-bottom:6px;">'
        + '<span>' + completed + ' of ' + todayJobs.length + ' complete</span>'
        + '<span style="font-weight:700;color:var(--green-dark);">' + UI.moneyInt(todayRevenue) + '</span></div>'
        + '<div style="background:#e8e8e8;border-radius:6px;height:6px;overflow:hidden;">'
        + '<div style="background:var(--green-dark);height:100%;width:' + pct + '%;border-radius:6px;transition:width .3s;"></div>'
        + '</div></div>';

      // Job list
      todayJobs.forEach(function(j, idx) {
        var statusIcon = j.status === 'completed' ? '✅' : j.status === 'in_progress' ? '🔧' : j.status === 'late' ? '⚠️' : '📋';
        var statusColor = j.status === 'completed' ? '#2e7d32' : j.status === 'in_progress' ? '#e07c24' : j.status === 'late' ? '#dc3545' : '#1565c0';
        var borderStyle = idx < todayJobs.length - 1 ? 'border-bottom:1px solid var(--border);' : '';

        html += '<div onclick="JobsPage.showDetail(\'' + j.id + '\')" style="padding:14px 20px;cursor:pointer;' + borderStyle + 'display:flex;align-items:center;gap:14px;transition:background .15s;" onmouseover="this.style.background=\'#f8f9fa\'" onmouseout="this.style.background=\'transparent\'">'
          + '<div style="font-size:20px;">' + statusIcon + '</div>'
          + '<div style="flex:1;min-width:0;">'
          + '<div style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + UI.esc(j.clientName || '') + '</div>'
          + '<div style="font-size:12px;color:var(--text-light);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + UI.esc(j.description || '#' + j.jobNumber) + '</div>'
          + (j.property ? '<div style="font-size:11px;color:var(--text-light);margin-top:2px;">📍 ' + UI.esc(j.property) + '</div>' : '')
          + '</div>'
          + '<div style="text-align:right;flex-shrink:0;">'
          + '<div style="font-weight:700;color:var(--green-dark);font-size:14px;">' + UI.moneyInt(j.total) + '</div>'
          + (j.startTime ? '<div style="font-size:11px;color:var(--text-light);">' + self._formatTime(j.startTime) + '</div>' : '')
          + '</div>'
          + '<div style="color:#ccc;font-size:16px;">›</div>'
          + '</div>';
      });
    } else {
      html += '<div style="padding:24px 20px;text-align:center;color:var(--text-light);">'
        + '<div style="font-size:32px;margin-bottom:8px;">🌳</div>'
        + '<div style="font-size:14px;">No visits scheduled for today</div>'
        + '<button class="btn btn-primary" style="margin-top:12px;" onclick="JobsPage.showForm()">+ Schedule a Job</button>'
        + '</div>';
    }
    html += '</div>';

    // Weather
    if (typeof Weather !== 'undefined') {
      html += Weather.renderWidget();
    }

    // Calendar controls
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">'
      + '<div style="display:flex;align-items:center;gap:8px;">'
      + '<button class="btn btn-outline" onclick="SchedulePage.prev()" style="padding:6px 12px;">&larr;</button>'
      + '<h3 id="cal-title" style="font-size:18px;min-width:200px;text-align:center;">' + self._getTitle() + '</h3>'
      + '<button class="btn btn-outline" onclick="SchedulePage.next()" style="padding:6px 12px;">&rarr;</button>'
      + '<button class="btn btn-outline" onclick="SchedulePage.goToday()" style="font-size:12px;">Today</button>'
      + '</div>'
      + '<div style="display:flex;gap:2px;background:var(--bg);border-radius:8px;padding:2px;">'
      + '<button class="btn ' + (self.view === 'day' ? 'btn-primary' : '') + '" onclick="SchedulePage.setView(\'day\')" style="font-size:12px;padding:6px 14px;border-radius:6px;' + (self.view !== 'day' ? 'background:none;border:none;color:var(--text-light);' : '') + '">Day</button>'
      + '<button class="btn ' + (self.view === 'week' ? 'btn-primary' : '') + '" onclick="SchedulePage.setView(\'week\')" style="font-size:12px;padding:6px 14px;border-radius:6px;' + (self.view !== 'week' ? 'background:none;border:none;color:var(--text-light);' : '') + '">Week</button>'
      + '<button class="btn ' + (self.view === 'month' ? 'btn-primary' : '') + '" onclick="SchedulePage.setView(\'month\')" style="font-size:12px;padding:6px 14px;border-radius:6px;' + (self.view !== 'month' ? 'background:none;border:none;color:var(--text-light);' : '') + '">Month</button>'
      + '</div>'
      + '</div>';

    if (self.view === 'day') {
      html += self._renderDay();
    } else if (self.view === 'week') {
      html += self._renderWeek();
    } else {
      html += self._renderMonth();
    }

    // Upcoming jobs (next 7 days)
    var next7 = [];
    for (var d = 1; d <= 7; d++) {
      var futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + d);
      var fStr = futureDate.toISOString().split('T')[0];
      var fJobs = allJobs.filter(function(j) { return j.scheduledDate === fStr; });
      if (fJobs.length > 0) {
        next7.push({ date: futureDate, dateStr: fStr, jobs: fJobs });
      }
    }

    if (next7.length > 0) {
      html += '<div style="margin-top:20px;">'
        + '<h3 style="font-size:16px;font-weight:700;margin-bottom:12px;">Upcoming This Week</h3>';
      next7.forEach(function(day) {
        html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:8px;">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
          + '<div style="font-weight:700;font-size:13px;">' + SchedulePage._formatDate(day.date, 'short') + '</div>'
          + '<span style="background:var(--green-bg);color:var(--green-dark);font-size:11px;font-weight:700;padding:3px 10px;border-radius:10px;">' + day.jobs.length + ' job' + (day.jobs.length !== 1 ? 's' : '') + '</span>'
          + '</div>';
        day.jobs.forEach(function(j) {
          html += '<div onclick="JobsPage.showDetail(\'' + j.id + '\')" style="display:flex;justify-content:space-between;padding:6px 0;cursor:pointer;font-size:13px;">'
            + '<span>' + UI.esc(j.clientName || '#' + j.jobNumber) + '</span>'
            + '<span style="font-weight:700;color:var(--green-dark);">' + UI.moneyInt(j.total) + '</span></div>';
        });
        html += '</div>';
      });
      html += '</div>';
    }

    return html;
  },

  _formatDate: function(d, format) {
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var sm = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (format === 'full') return days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    if (format === 'short') return days[d.getDay()] + ', ' + sm[d.getMonth()] + ' ' + d.getDate();
    return sm[d.getMonth()] + ' ' + d.getDate();
  },

  _formatTime: function(t) {
    if (!t) return '';
    var parts = t.split(':');
    var h = parseInt(parts[0]);
    var m = parts[1] || '00';
    var ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return h + ':' + m + ' ' + ampm;
  },

  _getTitle: function() {
    var d = SchedulePage.currentDate;
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    if (SchedulePage.view === 'day') {
      return days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    }
    if (SchedulePage.view === 'month') {
      return months[d.getMonth()] + ' ' + d.getFullYear();
    }
    var start = new Date(d);
    start.setDate(start.getDate() - start.getDay());
    var end = new Date(start);
    end.setDate(end.getDate() + 6);
    var sm = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return sm[start.getMonth()] + ' ' + start.getDate() + ' - ' + (end.getMonth() !== start.getMonth() ? sm[end.getMonth()] + ' ' : '') + end.getDate() + ', ' + end.getFullYear();
  },

  _renderDay: function() {
    var d = SchedulePage.currentDate;
    var dateStr = d.toISOString().split('T')[0];
    var allJobs = DB.jobs.getAll();
    var dayJobs = allJobs.filter(function(j) { return j.scheduledDate === dateStr; });

    var html = '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;overflow:hidden;">';

    for (var h = 6; h <= 19; h++) {
      var hour = h > 12 ? h - 12 : h;
      var ampm = h >= 12 ? 'PM' : 'AM';
      var slotJobs = dayJobs.filter(function(j) { return j.startTime && j.startTime.substring(0,2) === String(h).padStart(2,'0'); });

      html += '<div style="display:flex;border-bottom:1px solid var(--border);min-height:52px;">'
        + '<div style="width:70px;padding:8px 10px;font-size:12px;font-weight:600;color:var(--text-light);border-right:1px solid var(--border);flex-shrink:0;text-align:right;">'
        + hour + ':00 ' + ampm + '</div>'
        + '<div style="flex:1;padding:4px 8px;display:flex;gap:6px;flex-wrap:wrap;align-items:flex-start;">';

      slotJobs.forEach(function(j) {
        var bgColor = j.status === 'completed' ? '#e6f6ee' : j.status === 'late' ? '#fde8e8' : j.status === 'in_progress' ? '#fefcbf' : '#ebf4ff';
        var borderColor = j.status === 'completed' ? '#1a8a5c' : j.status === 'late' ? '#e53e3e' : j.status === 'in_progress' ? '#ed8936' : '#4299e1';
        html += '<div onclick="JobsPage.showDetail(\'' + j.id + '\')" style="background:' + bgColor + ';border-left:3px solid ' + borderColor + ';border-radius:6px;padding:8px 12px;cursor:pointer;flex:1;min-width:200px;">'
          + '<div style="font-weight:700;font-size:13px;">' + (j.clientName || '') + '</div>'
          + '<div style="font-size:12px;color:var(--text-light);">' + (j.description || '#' + j.jobNumber) + '</div>'
          + '<div style="display:flex;gap:8px;margin-top:4px;font-size:11px;">'
          + '<span style="font-weight:700;color:var(--accent);">' + UI.moneyInt(j.total) + '</span>'
          + (j.crew ? '<span style="color:var(--text-light);">👷 ' + j.crew.join(', ') + '</span>' : '')
          + '</div></div>';
      });

      html += '</div></div>';
    }

    // Unscheduled
    var unscheduled = dayJobs.filter(function(j) { return !j.startTime; });
    if (unscheduled.length) {
      html += '<div style="display:flex;border-top:2px solid var(--accent);">'
        + '<div style="width:70px;padding:8px 10px;font-size:11px;font-weight:700;color:var(--accent);border-right:1px solid var(--border);text-align:right;">Any<br>time</div>'
        + '<div style="flex:1;padding:6px 8px;display:flex;gap:6px;flex-wrap:wrap;">';
      unscheduled.forEach(function(j) {
        html += '<div onclick="JobsPage.showDetail(\'' + j.id + '\')" style="background:var(--green-bg);border-left:3px solid var(--accent);border-radius:6px;padding:8px 12px;cursor:pointer;flex:1;min-width:200px;">'
          + '<div style="font-weight:700;font-size:13px;">' + (j.clientName || '') + '</div>'
          + '<div style="font-size:12px;color:var(--text-light);">' + (j.description || '#' + j.jobNumber) + '</div>'
          + '<div style="font-weight:700;font-size:11px;color:var(--accent);margin-top:4px;">' + UI.moneyInt(j.total) + '</div></div>';
      });
      html += '</div></div>';
    }

    html += '</div>';

    // Day summary
    if (dayJobs.length) {
      var dayTotal = dayJobs.reduce(function(s,j) { return s + (j.total||0); }, 0);
      html += '<div class="stat-row" style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-top:16px;background:var(--white);">'
        + '<div style="padding:14px;text-align:center;border-right:1px solid var(--border);"><div style="font-size:11px;color:var(--text-light);text-transform:uppercase;font-weight:600;">Jobs</div><div style="font-size:24px;font-weight:800;">' + dayJobs.length + '</div></div>'
        + '<div style="padding:14px;text-align:center;border-right:1px solid var(--border);"><div style="font-size:11px;color:var(--text-light);text-transform:uppercase;font-weight:600;">Revenue</div><div style="font-size:24px;font-weight:800;color:var(--accent);">' + UI.moneyInt(dayTotal) + '</div></div>'
        + '<div style="padding:14px;text-align:center;"><div style="font-size:11px;color:var(--text-light);text-transform:uppercase;font-weight:600;">Crew</div><div style="font-size:24px;font-weight:800;">' + dayJobs.reduce(function(s,j){return s+(j.crew?j.crew.length:0);},0) + '</div></div>'
        + '</div>';
    } else {
      html += '<div style="margin-top:16px;text-align:center;padding:24px;color:var(--text-light);font-size:14px;">No jobs scheduled for this day. <button class="btn btn-primary" style="margin-left:8px;" onclick="JobsPage.showForm()">+ Schedule Job</button></div>';
    }

    return html;
  },

  _dragJobId: null,

  _dragStart: function(e, jobId) {
    SchedulePage._dragJobId = jobId;
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.4';
  },

  _dragEnd: function(e) {
    e.target.style.opacity = '1';
  },

  _dropOnDay: function(e, dateStr) {
    e.preventDefault();
    e.currentTarget.style.background = 'var(--white)';
    var jobId = SchedulePage._dragJobId;
    if (!jobId) return;
    DB.jobs.update(jobId, { scheduledDate: dateStr });
    UI.toast('Job rescheduled to ' + dateStr);
    SchedulePage._dragJobId = null;
    loadPage('schedule');
  },

  _renderWeek: function() {
    var d = new Date(SchedulePage.currentDate);
    d.setDate(d.getDate() - d.getDay());
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var today = new Date().toISOString().split('T')[0];
    var allJobs = DB.jobs.getAll();
    var html = '';

    // Unscheduled jobs panel
    var unscheduled = allJobs.filter(function(j) { return !j.scheduledDate && j.status !== 'completed' && j.status !== 'cancelled'; });
    if (unscheduled.length > 0) {
      html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:12px;">'
        + '<div style="font-weight:700;font-size:13px;margin-bottom:8px;">📋 Unscheduled Jobs (' + unscheduled.length + ') — <span style="font-size:12px;font-weight:400;color:var(--text-light);">drag to calendar</span></div>'
        + '<div style="display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px;">';
      unscheduled.slice(0, 10).forEach(function(j) {
        html += '<div draggable="true" ondragstart="SchedulePage._dragStart(event,\'' + j.id + '\')" ondragend="SchedulePage._dragEnd(event)" '
          + 'style="background:var(--bg);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:6px;padding:8px 12px;cursor:grab;min-width:160px;flex-shrink:0;">'
          + '<div style="font-weight:700;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + UI.esc(j.clientName || '#' + j.jobNumber) + '</div>'
          + '<div style="font-size:11px;color:var(--text-light);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + UI.esc(j.description || '') + '</div>'
          + '<div style="font-weight:700;font-size:12px;color:var(--green-dark);margin-top:4px;">' + UI.moneyInt(j.total) + '</div></div>';
      });
      html += '</div></div>';
    }

    html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:var(--border);border-radius:12px;overflow:hidden;border:1px solid var(--border);">';

    // Header
    for (var i = 0; i < 7; i++) {
      var dd = new Date(d);
      dd.setDate(dd.getDate() + i);
      var dateStr = dd.toISOString().split('T')[0];
      var isToday = dateStr === today;
      html += '<div style="background:' + (isToday ? 'var(--green-dark)' : 'var(--bg)') + ';color:' + (isToday ? '#fff' : 'var(--text)') + ';padding:8px;text-align:center;font-size:12px;font-weight:700;">'
        + days[i] + '<br><span style="font-size:18px;font-weight:800;">' + dd.getDate() + '</span></div>';
    }

    // Cells
    for (var i = 0; i < 7; i++) {
      var dd = new Date(d);
      dd.setDate(dd.getDate() + i);
      var dateStr = dd.toISOString().split('T')[0];
      var isToday = dateStr === today;
      var dayJobs = allJobs.filter(function(j) { return j.scheduledDate === dateStr; });

      html += '<div ondragover="event.preventDefault();this.style.background=\'#e8f5e9\'" ondragleave="this.style.background=\'var(--white)\'" ondrop="SchedulePage._dropOnDay(event,\'' + dateStr + '\')" onclick="SchedulePage.currentDate=new Date(\'' + dateStr + 'T12:00:00\');SchedulePage.setView(\'day\')" style="background:var(--white);min-height:120px;padding:6px;cursor:pointer;' + (isToday ? 'border-top:3px solid var(--green-dark);' : '') + 'transition:background .15s;">';
      dayJobs.forEach(function(j) {
        var bgColor = j.status === 'completed' ? '#e8f5e9' : j.status === 'late' ? '#ffebee' : j.status === 'in_progress' ? '#fff3e0' : '#e3f2fd';
        var borderColor = j.status === 'completed' ? '#4caf50' : j.status === 'late' ? '#f44336' : j.status === 'in_progress' ? '#ff9800' : '#2196f3';
        html += '<div draggable="true" ondragstart="event.stopPropagation();SchedulePage._dragStart(event,\'' + j.id + '\')" ondragend="SchedulePage._dragEnd(event)" onclick="event.stopPropagation();JobsPage.showDetail(\'' + j.id + '\')" style="background:' + bgColor + ';border-left:3px solid ' + borderColor + ';border-radius:6px;padding:6px 8px;margin-bottom:4px;cursor:grab;font-size:12px;">'
          + '<div style="font-weight:700;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + UI.esc(j.clientName || '') + '</div>'
          + '<div style="color:var(--text-light);font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + UI.esc(j.description || '#' + j.jobNumber) + '</div>'
          + '<div style="font-weight:700;font-size:11px;color:var(--green-dark);margin-top:2px;">' + UI.moneyInt(j.total) + '</div>'
          + '</div>';
      });
      if (dayJobs.length === 0) {
        html += '<div style="font-size:10px;color:#ccc;text-align:center;padding-top:20px;">—</div>';
      }
      html += '</div>';
    }
    html += '</div>';

    return html;
  },

  _renderMonth: function() {
    var d = SchedulePage.currentDate;
    var year = d.getFullYear();
    var month = d.getMonth();
    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var today = new Date().toISOString().split('T')[0];
    var allJobs = DB.jobs.getAll();
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    var html = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:var(--border);border-radius:12px;overflow:hidden;border:1px solid var(--border);">';

    days.forEach(function(day) {
      html += '<div style="background:var(--bg);padding:8px;text-align:center;font-size:11px;font-weight:700;color:var(--text-light);">' + day + '</div>';
    });

    for (var i = 0; i < firstDay; i++) {
      html += '<div style="background:#fafafa;min-height:80px;padding:4px;"></div>';
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      var isToday = dateStr === today;
      var dayJobs = allJobs.filter(function(j) { return j.scheduledDate === dateStr; });

      html += '<div onclick="SchedulePage.currentDate=new Date(\'' + dateStr + 'T12:00:00\');SchedulePage.setView(\'day\')" style="background:var(--white);min-height:80px;padding:4px;cursor:pointer;' + (isToday ? 'border:2px solid var(--green-dark);' : '') + '">'
        + '<div style="font-size:12px;font-weight:' + (isToday ? '800' : '600') + ';color:' + (isToday ? 'var(--green-dark)' : 'var(--text)') + ';margin-bottom:2px;">' + day + '</div>';

      dayJobs.forEach(function(j) {
        var bgColor = j.status === 'completed' ? '#e8f5e9' : j.status === 'late' ? '#ffebee' : '#e3f2fd';
        html += '<div onclick="event.stopPropagation();JobsPage.showDetail(\'' + j.id + '\')" style="background:' + bgColor + ';border-radius:4px;padding:2px 4px;margin-bottom:2px;cursor:pointer;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'
          + (j.clientName || '#' + j.jobNumber) + '</div>';
      });
      html += '</div>';
    }

    var totalCells = firstDay + daysInMonth;
    var remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (var i = 0; i < remaining; i++) {
      html += '<div style="background:#fafafa;min-height:80px;padding:4px;"></div>';
    }

    html += '</div>';
    return html;
  },

  setView: function(view) {
    SchedulePage.view = view;
    loadPage('schedule');
  },

  prev: function() {
    var d = SchedulePage.currentDate;
    if (SchedulePage.view === 'day') { d.setDate(d.getDate() - 1); }
    else if (SchedulePage.view === 'week') { d.setDate(d.getDate() - 7); }
    else { d.setMonth(d.getMonth() - 1); }
    loadPage('schedule');
  },

  next: function() {
    var d = SchedulePage.currentDate;
    if (SchedulePage.view === 'day') { d.setDate(d.getDate() + 1); }
    else if (SchedulePage.view === 'week') { d.setDate(d.getDate() + 7); }
    else { d.setMonth(d.getMonth() + 1); }
    loadPage('schedule');
  },

  goToday: function() {
    SchedulePage.currentDate = new Date();
    loadPage('schedule');
  }
};

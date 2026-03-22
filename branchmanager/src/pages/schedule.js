/**
 * Branch Manager — Schedule / Calendar Page
 * Week and Month views with job cards
 */
var SchedulePage = {
  view: 'week', // 'day', 'week', 'month'
  currentDate: new Date(),

  render: function() {
    var self = SchedulePage;
    // Weather widget at top
    var html = '';
    if (typeof Weather !== 'undefined') {
      html += Weather.renderWidget();
    }
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">'
      + '<div style="display:flex;align-items:center;gap:8px;">'
      + '<button class="btn btn-outline" onclick="SchedulePage.prev()">&larr;</button>'
      + '<h3 id="cal-title" style="font-size:18px;min-width:200px;text-align:center;">' + self._getTitle() + '</h3>'
      + '<button class="btn btn-outline" onclick="SchedulePage.next()">&rarr;</button>'
      + '<button class="btn btn-outline" onclick="SchedulePage.goToday()" style="font-size:12px;">Today</button>'
      + '</div>'
      + '<div style="display:flex;gap:4px;">'
      + '<button class="btn ' + (self.view === 'day' ? 'btn-primary' : 'btn-outline') + '" onclick="SchedulePage.setView(\'day\')" style="font-size:12px;padding:6px 12px;">Day</button>'
      + '<button class="btn ' + (self.view === 'week' ? 'btn-primary' : 'btn-outline') + '" onclick="SchedulePage.setView(\'week\')" style="font-size:12px;padding:6px 12px;">Week</button>'
      + '<button class="btn ' + (self.view === 'month' ? 'btn-primary' : 'btn-outline') + '" onclick="SchedulePage.setView(\'month\')" style="font-size:12px;padding:6px 12px;">Month</button>'
      + '</div>'
      + '</div>';

    if (self.view === 'day') {
      html += self._renderDay();
    } else if (self.view === 'week') {
      html += self._renderWeek();
    } else {
      html += self._renderMonth();
    }
    return html;
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

    // Time slots from 6am to 7pm
    for (var h = 6; h <= 19; h++) {
      var hour = h > 12 ? h - 12 : h;
      var ampm = h >= 12 ? 'PM' : 'AM';
      var timeStr = String(h).padStart(2, '0') + ':00';
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

    // Unscheduled jobs (no startTime)
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
      html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px;">'
        + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center;"><div style="font-size:11px;color:var(--text-light);text-transform:uppercase;font-weight:600;">Jobs</div><div style="font-size:24px;font-weight:800;">' + dayJobs.length + '</div></div>'
        + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center;"><div style="font-size:11px;color:var(--text-light);text-transform:uppercase;font-weight:600;">Revenue</div><div style="font-size:24px;font-weight:800;color:var(--accent);">' + UI.moneyInt(dayTotal) + '</div></div>'
        + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center;"><div style="font-size:11px;color:var(--text-light);text-transform:uppercase;font-weight:600;">Crew Needed</div><div style="font-size:24px;font-weight:800;">' + dayJobs.reduce(function(s,j){return s+(j.crew?j.crew.length:0);},0) + '</div></div>'
        + '</div>';
    } else {
      html += '<div style="margin-top:16px;text-align:center;padding:24px;color:var(--text-light);font-size:14px;">No jobs scheduled for this day. <button class="btn btn-primary" style="margin-left:8px;" onclick="JobsPage.showForm()">+ Schedule Job</button></div>';
    }

    return html;
  },

  _renderWeek: function() {
    var d = new Date(SchedulePage.currentDate);
    d.setDate(d.getDate() - d.getDay()); // Sunday
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var today = new Date().toISOString().split('T')[0];
    var allJobs = DB.jobs.getAll();

    var html = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:var(--border);border-radius:12px;overflow:hidden;border:1px solid var(--border);">';

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

      html += '<div style="background:var(--white);min-height:120px;padding:6px;' + (isToday ? 'border-top:3px solid var(--green-dark);' : '') + '">';
      dayJobs.forEach(function(j) {
        var bgColor = j.status === 'completed' ? '#e8f5e9' : j.status === 'late' ? '#ffebee' : j.status === 'in_progress' ? '#fff3e0' : '#e3f2fd';
        var borderColor = j.status === 'completed' ? '#4caf50' : j.status === 'late' ? '#f44336' : j.status === 'in_progress' ? '#ff9800' : '#2196f3';
        html += '<div onclick="JobsPage.showDetail(\'' + j.id + '\')" style="background:' + bgColor + ';border-left:3px solid ' + borderColor + ';border-radius:6px;padding:6px 8px;margin-bottom:4px;cursor:pointer;font-size:12px;">'
          + '<div style="font-weight:700;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (j.clientName || '') + '</div>'
          + '<div style="color:var(--text-light);font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (j.description || '#' + j.jobNumber) + '</div>'
          + '<div style="font-weight:700;font-size:11px;color:var(--green-dark);margin-top:2px;">' + UI.moneyInt(j.total) + '</div>'
          + '</div>';
      });
      if (dayJobs.length === 0) {
        html += '<div style="font-size:10px;color:#ccc;text-align:center;padding-top:20px;">—</div>';
      }
      html += '</div>';
    }
    html += '</div>';

    // Today's summary below calendar
    var todayJobs = allJobs.filter(function(j) { return j.scheduledDate === today; });
    if (todayJobs.length > 0) {
      html += '<div style="margin-top:16px;background:var(--green-dark);border-radius:12px;padding:16px 20px;color:#fff;">'
        + '<h4 style="margin-bottom:8px;">Today — ' + todayJobs.length + ' Job' + (todayJobs.length > 1 ? 's' : '') + '</h4>';
      todayJobs.forEach(function(j) {
        html += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.15);font-size:14px;">'
          + '<div><strong>' + j.clientName + '</strong> — ' + (j.description || '') + '</div>'
          + '<div>' + UI.moneyInt(j.total) + '</div></div>';
      });
      html += '</div>';
    }

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

    // Header
    days.forEach(function(day) {
      html += '<div style="background:var(--bg);padding:8px;text-align:center;font-size:11px;font-weight:700;color:var(--text-light);">' + day + '</div>';
    });

    // Empty cells before first day
    for (var i = 0; i < firstDay; i++) {
      html += '<div style="background:#fafafa;min-height:80px;padding:4px;"></div>';
    }

    // Day cells
    for (var day = 1; day <= daysInMonth; day++) {
      var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      var isToday = dateStr === today;
      var dayJobs = allJobs.filter(function(j) { return j.scheduledDate === dateStr; });

      html += '<div style="background:var(--white);min-height:80px;padding:4px;' + (isToday ? 'border:2px solid var(--green-dark);' : '') + '">'
        + '<div style="font-size:12px;font-weight:' + (isToday ? '800' : '600') + ';color:' + (isToday ? 'var(--green-dark)' : 'var(--text)') + ';margin-bottom:2px;">' + day + '</div>';

      dayJobs.forEach(function(j) {
        var bgColor = j.status === 'completed' ? '#e8f5e9' : j.status === 'late' ? '#ffebee' : '#e3f2fd';
        html += '<div onclick="JobsPage.showDetail(\'' + j.id + '\')" style="background:' + bgColor + ';border-radius:4px;padding:2px 4px;margin-bottom:2px;cursor:pointer;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'
          + (j.clientName || '#' + j.jobNumber) + '</div>';
      });
      html += '</div>';
    }

    // Fill remaining cells
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

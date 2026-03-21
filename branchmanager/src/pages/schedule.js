/**
 * Branch Manager — Schedule / Calendar Page
 * Week and Month views with job cards
 */
var SchedulePage = {
  view: 'week', // 'week' or 'month'
  currentDate: new Date(),

  render: function() {
    var self = SchedulePage;
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">'
      + '<div style="display:flex;align-items:center;gap:8px;">'
      + '<button class="btn btn-outline" onclick="SchedulePage.prev()">&larr;</button>'
      + '<h3 id="cal-title" style="font-size:18px;min-width:200px;text-align:center;">' + self._getTitle() + '</h3>'
      + '<button class="btn btn-outline" onclick="SchedulePage.next()">&rarr;</button>'
      + '<button class="btn btn-outline" onclick="SchedulePage.goToday()" style="font-size:12px;">Today</button>'
      + '</div>'
      + '<div style="display:flex;gap:4px;">'
      + '<button class="btn ' + (self.view === 'week' ? 'btn-primary' : 'btn-outline') + '" onclick="SchedulePage.setView(\'week\')">Week</button>'
      + '<button class="btn ' + (self.view === 'month' ? 'btn-primary' : 'btn-outline') + '" onclick="SchedulePage.setView(\'month\')">Month</button>'
      + '</div>'
      + '</div>';

    if (self.view === 'week') {
      html += self._renderWeek();
    } else {
      html += self._renderMonth();
    }
    return html;
  },

  _getTitle: function() {
    var d = SchedulePage.currentDate;
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    if (SchedulePage.view === 'month') {
      return months[d.getMonth()] + ' ' + d.getFullYear();
    }
    // Week title: "Mar 17 - 23, 2026"
    var start = new Date(d);
    start.setDate(start.getDate() - start.getDay());
    var end = new Date(start);
    end.setDate(end.getDate() + 6);
    var sm = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return sm[start.getMonth()] + ' ' + start.getDate() + ' - ' + (end.getMonth() !== start.getMonth() ? sm[end.getMonth()] + ' ' : '') + end.getDate() + ', ' + end.getFullYear();
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
    if (SchedulePage.view === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    loadPage('schedule');
  },

  next: function() {
    var d = SchedulePage.currentDate;
    if (SchedulePage.view === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    loadPage('schedule');
  },

  goToday: function() {
    SchedulePage.currentDate = new Date();
    loadPage('schedule');
  }
};

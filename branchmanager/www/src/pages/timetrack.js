/**
 * Branch Manager — Time Tracking
 * Employee clock in/out per job, timesheets
 * Accessible from dashboard for crew members
 */
var TimeTrackPage = {
  currentUser: 'Doug Brown', // Will be from auth

  renderClockWidget: function() {
    var today = new Date().toISOString().split('T')[0];
    var todayEntries = DB.timeEntries.getByUser(TimeTrackPage.currentUser, today);
    var activeEntry = todayEntries.find(function(t) { return !t.clockOut; });
    var todayJobs = DB.jobs.getToday();
    var allJobs = DB.jobs.getAll().filter(function(j) { return j.status === 'scheduled' || j.status === 'in_progress'; });

    var html = '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="margin-bottom:12px;">⏱️ Time Clock</h3>';

    if (activeEntry) {
      // Currently clocked in
      var job = activeEntry.jobId ? DB.jobs.getById(activeEntry.jobId) : null;
      var elapsed = ((Date.now() - new Date(activeEntry.clockIn).getTime()) / 3600000).toFixed(1);
      html += '<div style="background:var(--green-bg);border:2px solid var(--green-dark);border-radius:10px;padding:16px;text-align:center;">'
        + '<div style="font-size:13px;color:var(--green-dark);font-weight:600;">CLOCKED IN</div>'
        + '<div style="font-size:2.5rem;font-weight:800;color:var(--green-dark);">' + elapsed + ' hrs</div>'
        + (job ? '<div style="font-size:14px;color:var(--text);">' + job.clientName + ' — #' + job.jobNumber + '</div>' : '')
        + '<button class="btn" style="background:var(--red);color:#fff;margin-top:12px;padding:12px 32px;font-size:16px;" onclick="TimeTrackPage.clockOut(\'' + activeEntry.id + '\')">Clock Out</button>'
        + '</div>';
    } else {
      // Not clocked in — show available jobs
      html += '<div style="text-align:center;padding:12px;color:var(--text-light);margin-bottom:12px;">Not clocked in</div>';
      if (allJobs.length) {
        html += '<div style="font-size:13px;font-weight:600;margin-bottom:8px;">Clock in to a job:</div>';
        allJobs.forEach(function(j) {
          html += '<button class="btn btn-outline" style="width:100%;margin-bottom:6px;justify-content:space-between;" onclick="TimeTrackPage.clockIn(\'' + j.id + '\')">'
            + '<span>🔧 ' + j.clientName + ' — ' + (j.description || '#' + j.jobNumber) + '</span>'
            + '<span style="font-weight:700;">' + UI.dateShort(j.scheduledDate) + '</span>'
            + '</button>';
        });
      }
      html += '<button class="btn btn-primary" style="width:100%;margin-top:8px;" onclick="TimeTrackPage.clockIn(null)">Clock In (No Job)</button>';
    }

    // Today's entries
    if (todayEntries.length > 0) {
      html += '<div style="margin-top:16px;border-top:1px solid var(--border);padding-top:12px;">'
        + '<h4 style="font-size:13px;margin-bottom:8px;">Today\'s Time</h4>';
      var totalHours = 0;
      todayEntries.forEach(function(t) {
        var job = t.jobId ? DB.jobs.getById(t.jobId) : null;
        var hours = t.hours || 0;
        if (!t.clockOut) hours = (Date.now() - new Date(t.clockIn).getTime()) / 3600000;
        totalHours += hours;
        var clockInTime = new Date(t.clockIn).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
        var clockOutTime = t.clockOut ? new Date(t.clockOut).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : 'active';

        html += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:13px;">'
          + '<span>' + (job ? job.clientName + ' #' + job.jobNumber : 'General') + '</span>'
          + '<span>' + clockInTime + ' - ' + clockOutTime + '</span>'
          + '<span style="font-weight:700;">' + hours.toFixed(1) + ' hrs</span>'
          + '</div>';
      });
      html += '<div style="display:flex;justify-content:space-between;padding:8px 0;font-weight:700;font-size:14px;">'
        + '<span>Total Today</span><span style="color:var(--green-dark);">' + totalHours.toFixed(1) + ' hrs</span></div>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  clockIn: function(jobId) {
    var entry = DB.timeEntries.clockIn(TimeTrackPage.currentUser, jobId);
    if (jobId) {
      DB.jobs.update(jobId, { status: 'in_progress' });
    }
    UI.toast('Clocked in');
    loadPage(currentPage);
  },

  clockOut: function(entryId) {
    DB.timeEntries.clockOut(entryId);
    UI.toast('Clocked out');
    loadPage(currentPage);
  },

  renderTimesheet: function() {
    var entries = DB.timeEntries.getAll();
    var today = new Date();

    // Group by date
    var byDate = {};
    entries.forEach(function(t) {
      var d = t.date || (t.clockIn ? t.clockIn.split('T')[0] : '');
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(t);
    });

    var dates = Object.keys(byDate).sort().reverse();
    var totalWeekHours = 0;

    var html = '<h3 style="margin-bottom:16px;">Weekly Timesheet</h3>';
    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">';
    html += '<table class="data-table"><thead><tr><th>Date</th><th>Job</th><th>Clock In</th><th>Clock Out</th><th style="text-align:right;">Hours</th></tr></thead><tbody>';

    if (dates.length === 0) {
      html += '<tr><td colspan="5" style="text-align:center;color:var(--text-light);padding:30px;">No time entries yet. Use the clock widget on the dashboard.</td></tr>';
    } else {
      dates.slice(0, 7).forEach(function(date) {
        var dayEntries = byDate[date];
        var dayTotal = 0;
        dayEntries.forEach(function(t, i) {
          var job = t.jobId ? DB.jobs.getById(t.jobId) : null;
          var hours = t.hours || 0;
          dayTotal += hours;
          totalWeekHours += hours;
          html += '<tr>'
            + '<td>' + (i === 0 ? '<strong>' + UI.dateShort(date) + '</strong>' : '') + '</td>'
            + '<td>' + (job ? job.clientName + ' #' + job.jobNumber : 'General') + '</td>'
            + '<td>' + (t.clockIn ? new Date(t.clockIn).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—') + '</td>'
            + '<td>' + (t.clockOut ? new Date(t.clockOut).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : 'active') + '</td>'
            + '<td style="text-align:right;font-weight:600;">' + hours.toFixed(1) + '</td>'
            + '</tr>';
        });
        // Day total row
        html += '<tr style="background:var(--bg);"><td colspan="4" style="text-align:right;font-weight:600;font-size:12px;">Day Total</td><td style="text-align:right;font-weight:700;">' + dayTotal.toFixed(1) + '</td></tr>';
      });
    }

    html += '</tbody></table></div>';

    if (totalWeekHours > 0) {
      html += '<div style="margin-top:12px;padding:16px;background:var(--green-dark);border-radius:10px;color:#fff;display:flex;justify-content:space-between;align-items:center;">'
        + '<span style="font-weight:600;">Week Total</span>'
        + '<span style="font-size:1.5rem;font-weight:800;">' + totalWeekHours.toFixed(1) + ' hours</span>'
        + '</div>';
    }

    return html;
  }
};

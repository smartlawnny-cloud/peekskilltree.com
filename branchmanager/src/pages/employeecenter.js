/**
 * Branch Manager — Employee Center
 * Personal dashboard for crew members:
 * - Hours worked this week/month/year
 * - Estimated pay & tax withholdings
 * - Payroll tax breakdown
 * - Personal budget planner (Dave Ramsey style)
 */
var EmployeeCenter = {
  render: function() {
    var userName = Auth.user ? Auth.user.name : 'Employee';
    var entries = JSON.parse(localStorage.getItem('bm-time-entries') || '[]')
      .filter(function(e) { return e.user === userName; });

    var now = new Date();
    var weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    var yearStart = new Date(now.getFullYear(), 0, 1);

    var weekHours = EmployeeCenter._sumHours(entries, weekStart);
    var monthHours = EmployeeCenter._sumHours(entries, monthStart);
    var yearHours = EmployeeCenter._sumHours(entries, yearStart);

    // Pay settings
    var hourlyRate = parseFloat(localStorage.getItem('bm-my-rate') || '30');
    var weekPay = weekHours * hourlyRate;
    var monthPay = monthHours * hourlyRate;
    var yearPay = yearHours * hourlyRate;

    var html = '<div style="text-align:center;margin-bottom:20px;">'
      + '<h2 style="font-size:22px;">👤 ' + userName + '</h2>'
      + '<div style="color:var(--text-light);font-size:14px;">Employee Dashboard</div></div>';

    // Stats
    html += '<div class="stat-grid">'
      + UI.statCard('This Week', weekHours.toFixed(1) + ' hrs', UI.money(weekPay) + ' gross', '', '')
      + UI.statCard('This Month', monthHours.toFixed(1) + ' hrs', UI.money(monthPay) + ' gross', '', '')
      + UI.statCard('Year to Date', yearHours.toFixed(1) + ' hrs', UI.money(yearPay) + ' gross', '', '')
      + UI.statCard('Hourly Rate', UI.money(hourlyRate), '<a href="#" onclick="EmployeeCenter.setRate();return false;" style="color:var(--green-dark);">Change</a>', '', '')
      + '</div>';

    // Paycheck estimator
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="font-size:16px;margin-bottom:16px;">💰 Paycheck Estimator</h3>';

    var taxes = EmployeeCenter._calcTaxes(monthPay);
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      + '<div style="padding:16px;background:var(--green-bg);border-radius:10px;text-align:center;">'
      + '<div style="font-size:12px;color:var(--text-light);">Monthly Gross</div>'
      + '<div style="font-size:28px;font-weight:800;color:var(--green-dark);">' + UI.money(monthPay) + '</div></div>'
      + '<div style="padding:16px;background:#e3f2fd;border-radius:10px;text-align:center;">'
      + '<div style="font-size:12px;color:var(--text-light);">Estimated Take-Home</div>'
      + '<div style="font-size:28px;font-weight:800;color:#1565c0;">' + UI.money(taxes.takeHome) + '</div></div>'
      + '</div>';

    // Tax breakdown
    html += '<div style="margin-top:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="var el=document.getElementById(\'tax-detail\');el.style.display=el.style.display===\'none\'?\'block\':\'none\';">'
      + '<h4 style="font-size:14px;">Tax Withholdings Breakdown</h4><span style="color:var(--text-light);">▶</span></div>'
      + '<div id="tax-detail" style="display:none;margin-top:8px;">';

    var taxItems = [
      { label: 'Federal Income Tax (est. 12%)', amount: taxes.federal, pct: '12%' },
      { label: 'Social Security (6.2%)', amount: taxes.ss, pct: '6.2%' },
      { label: 'Medicare (1.45%)', amount: taxes.medicare, pct: '1.45%' },
      { label: 'NY State Income Tax (est. 5.5%)', amount: taxes.state, pct: '5.5%' },
      { label: 'NY Disability (0.5%)', amount: taxes.disability, pct: '0.5%' },
      { label: 'NY Paid Family Leave (0.455%)', amount: taxes.pfl, pct: '0.455%' }
    ];
    taxItems.forEach(function(t) {
      html += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:13px;">'
        + '<span>' + t.label + '</span>'
        + '<span style="font-weight:600;color:var(--red);">-' + UI.money(t.amount) + '</span></div>';
    });
    html += '<div style="display:flex;justify-content:space-between;padding:8px 0;font-weight:700;font-size:15px;border-top:2px solid var(--border);margin-top:4px;">'
      + '<span>Total Taxes</span><span style="color:var(--red);">-' + UI.money(taxes.totalTax) + ' (' + taxes.effectiveRate + '%)</span></div>'
      + '<div style="display:flex;justify-content:space-between;padding:8px 0;font-weight:700;font-size:15px;color:var(--green-dark);">'
      + '<span>Take-Home Pay</span><span>' + UI.money(taxes.takeHome) + '</span></div>'
      + '</div></div></div>';

    // Recent time entries
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="font-size:16px;margin-bottom:12px;">⏱ Recent Time Entries</h3>';
    if (entries.length) {
      entries.slice(0, 14).forEach(function(e) {
        html += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:13px;">'
          + '<span>' + UI.dateShort(e.date) + (e.jobId ? ' — Job' : '') + '</span>'
          + '<span style="font-weight:600;">' + (e.hours || 0).toFixed(1) + ' hrs</span></div>';
      });
    } else {
      html += '<div style="text-align:center;padding:20px;color:var(--text-light);font-size:13px;">No time entries yet. Clock in from the Crew View!</div>';
    }
    html += '</div>';

    // Annual projections
    var weeksWorked = Math.max(1, Math.ceil((now - yearStart) / (7 * 86400000)));
    var avgWeeklyHours = yearHours / weeksWorked;
    var projectedAnnual = avgWeeklyHours * 52 * hourlyRate;
    var annualTaxes = EmployeeCenter._calcTaxes(projectedAnnual);

    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="font-size:16px;margin-bottom:12px;">📊 Annual Projection</h3>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;">'
      + '<div style="padding:12px;background:var(--bg);border-radius:8px;"><div style="font-size:11px;color:var(--text-light);">Avg Weekly Hours</div><div style="font-size:18px;font-weight:700;">' + avgWeeklyHours.toFixed(1) + '</div></div>'
      + '<div style="padding:12px;background:var(--bg);border-radius:8px;"><div style="font-size:11px;color:var(--text-light);">Projected Gross</div><div style="font-size:18px;font-weight:700;">' + UI.moneyInt(projectedAnnual) + '</div></div>'
      + '<div style="padding:12px;background:var(--bg);border-radius:8px;"><div style="font-size:11px;color:var(--text-light);">Projected Net</div><div style="font-size:18px;font-weight:700;">' + UI.moneyInt(annualTaxes.takeHome) + '</div></div>'
      + '</div></div>';

    // Budget planner link
    html += '<button onclick="loadPage(\'budget\')" style="width:100%;padding:16px;background:var(--green-dark);color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;">📋 Open Personal Budget Planner</button>';

    return html;
  },

  _sumHours: function(entries, since) {
    return entries.filter(function(e) { return new Date(e.date) >= since; })
      .reduce(function(s, e) { return s + (e.hours || 0); }, 0);
  },

  _calcTaxes: function(gross) {
    var federal = gross * 0.12;
    var ss = gross * 0.062;
    var medicare = gross * 0.0145;
    var state = gross * 0.055;
    var disability = gross * 0.005;
    var pfl = gross * 0.00455;
    var totalTax = federal + ss + medicare + state + disability + pfl;
    return {
      federal: federal, ss: ss, medicare: medicare, state: state,
      disability: disability, pfl: pfl,
      totalTax: totalTax,
      takeHome: gross - totalTax,
      effectiveRate: gross > 0 ? (totalTax / gross * 100).toFixed(1) : '0'
    };
  },

  setRate: function() {
    var rate = prompt('Enter your hourly rate ($):', localStorage.getItem('bm-my-rate') || '30');
    if (rate !== null && !isNaN(parseFloat(rate))) {
      localStorage.setItem('bm-my-rate', parseFloat(rate));
      UI.toast('Rate updated to $' + parseFloat(rate) + '/hr');
      loadPage('employeecenter');
    }
  }
};

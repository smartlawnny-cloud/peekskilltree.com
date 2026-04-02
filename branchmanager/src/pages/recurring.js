/**
 * Branch Manager — Recurring Job Scheduling
 * Set up jobs that repeat on a schedule (weekly lawn, monthly pruning, etc.)
 */
var RecurringJobs = {
  render: function() {
    var recurring = RecurringJobs.getAll();
    var activeCount = recurring.filter(function(r) { return r.active; }).length;
    var html = '<div class="section-header"><h2>Recurring Jobs' + (activeCount > 0 ? ' <span style="font-size:14px;font-weight:600;background:#e8f5e9;color:#2e7d32;padding:2px 10px;border-radius:12px;vertical-align:middle;">' + activeCount + ' active</span>' : '') + '</h2>'
      + '<p style="color:var(--text-light);margin-top:4px;">Jobs that repeat automatically on a schedule.</p></div>';

    // Add new recurring job
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="font-size:15px;margin-bottom:12px;">Create Recurring Job</h3>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">'
      + '<div><label style="font-size:12px;color:var(--text-light);display:block;margin-bottom:3px;">Client</label>'
      + '<input type="text" id="rec-client" placeholder="Client name" style="width:100%;padding:10px;border:2px solid var(--border);border-radius:8px;font-size:14px;"></div>'
      + '<div><label style="font-size:12px;color:var(--text-light);display:block;margin-bottom:3px;">Service</label>'
      + '<select id="rec-service" style="width:100%;padding:10px;border:2px solid var(--border);border-radius:8px;font-size:14px;">'
      + '<option value="tree_pruning">Tree Pruning</option>'
      + '<option value="tree_removal">Tree Removal</option>'
      + '<option value="stump_removal">Stump Removal</option>'
      + '<option value="gutter_clean">Gutter Clean Out</option>'
      + '<option value="spring_cleanup">Spring Clean Up</option>'
      + '<option value="snow_removal">Snow Removal</option>'
      + '<option value="inspection">Tree Inspection</option>'
      + '<option value="other">Other</option>'
      + '</select></div></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px;">'
      + '<div><label style="font-size:12px;color:var(--text-light);display:block;margin-bottom:3px;">Frequency</label>'
      + '<select id="rec-freq" style="width:100%;padding:10px;border:2px solid var(--border);border-radius:8px;font-size:14px;">'
      + '<option value="weekly">Weekly</option>'
      + '<option value="biweekly">Every 2 Weeks</option>'
      + '<option value="monthly" selected>Monthly</option>'
      + '<option value="quarterly">Quarterly</option>'
      + '<option value="biannual">Every 6 Months</option>'
      + '<option value="annual">Annually</option>'
      + '</select></div>'
      + '<div><label style="font-size:12px;color:var(--text-light);display:block;margin-bottom:3px;">Start Date</label>'
      + '<input type="date" id="rec-start" style="width:100%;padding:10px;border:2px solid var(--border);border-radius:8px;font-size:14px;"></div>'
      + '<div><label style="font-size:12px;color:var(--text-light);display:block;margin-bottom:3px;">Price</label>'
      + '<input type="number" id="rec-price" placeholder="0" step="1" style="width:100%;padding:10px;border:2px solid var(--border);border-radius:8px;font-size:14px;font-weight:700;"></div>'
      + '</div>'
      + '<div style="margin-bottom:8px;"><label style="font-size:12px;color:var(--text-light);display:block;margin-bottom:3px;">Notes</label>'
      + '<input type="text" id="rec-notes" placeholder="Special instructions..." style="width:100%;padding:10px;border:2px solid var(--border);border-radius:8px;font-size:14px;"></div>'
      + '<button onclick="RecurringJobs.create()" style="background:var(--green-dark);color:#fff;border:none;padding:10px 24px;border-radius:8px;font-weight:700;cursor:pointer;">Create Recurring Job</button>'
      + '</div>';

    // List existing recurring jobs
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);">'
      + '<h3 style="font-size:15px;margin-bottom:12px;">Active Recurring Jobs (' + recurring.length + ')</h3>';

    if (recurring.length) {
      var dueSoonCutoff = new Date(Date.now() + 7 * 86400000);
      recurring.forEach(function(r) {
        var freqLabels = { weekly: 'Weekly', biweekly: 'Every 2 Weeks', monthly: 'Monthly', quarterly: 'Quarterly', biannual: 'Every 6 Months', annual: 'Annually' };
        var nextDate = RecurringJobs._getNextDate(r);
        var statusColor = r.active ? '#4caf50' : '#999';
        var isDueSoon = r.active && new Date(nextDate) <= dueSoonCutoff;

        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f0f0f0;">'
          + '<div style="flex:1;">'
          + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
          + '<span style="width:8px;height:8px;border-radius:50%;background:' + statusColor + ';flex-shrink:0;"></span>'
          + '<strong style="font-size:14px;">' + r.clientName + '</strong>'
          + '<span style="font-size:12px;background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:4px;">' + (freqLabels[r.frequency] || r.frequency) + '</span>'
          + (isDueSoon ? '<span style="font-size:11px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;padding:2px 8px;border-radius:4px;font-weight:700;">Due Soon</span>' : '')
          + '</div>'
          + '<div style="font-size:13px;color:var(--text-light);margin-top:3px;margin-left:16px;">'
          + r.service.replace(/_/g, ' ') + (r.notes ? ' — ' + r.notes : '') + '</div>'
          + '<div style="font-size:12px;color:' + (isDueSoon ? '#e65100' : 'var(--text-light)') + ';margin-left:16px;">Next: <strong>' + UI.dateShort(nextDate) + '</strong></div>'
          + '</div>'
          + '<div style="display:flex;align-items:center;gap:8px;">'
          + '<span style="font-weight:700;color:var(--green-dark);font-size:15px;">' + UI.money(r.price) + '</span>'
          + '<button onclick="RecurringJobs.toggle(\'' + r.id + '\')" style="background:' + (r.active ? '#fff3e0' : '#e8f5e9') + ';border:none;padding:6px 10px;border-radius:6px;font-size:11px;cursor:pointer;font-weight:600;">' + (r.active ? 'Pause' : 'Resume') + '</button>'
          + '<button onclick="RecurringJobs.generateJob(\'' + r.id + '\')" style="background:var(--green-dark);color:#fff;border:none;padding:6px 10px;border-radius:6px;font-size:11px;cursor:pointer;font-weight:600;">Generate Job</button>'
          + '</div></div>';
      });
    } else {
      html += '<div style="text-align:center;padding:24px;color:var(--text-light);font-size:13px;">No recurring jobs set up yet.</div>';
    }
    html += '</div>';

    return html;
  },

  create: function() {
    var clientName = document.getElementById('rec-client').value.trim();
    var service = document.getElementById('rec-service').value;
    var frequency = document.getElementById('rec-freq').value;
    var startDate = document.getElementById('rec-start').value;
    var price = parseFloat(document.getElementById('rec-price').value) || 0;
    var notes = document.getElementById('rec-notes').value;

    if (!clientName) { UI.toast('Enter a client name', 'error'); return; }
    if (!startDate) { UI.toast('Pick a start date', 'error'); return; }

    var record = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      clientName: clientName,
      service: service,
      frequency: frequency,
      startDate: startDate,
      price: price,
      notes: notes,
      active: true,
      lastGenerated: null,
      createdAt: new Date().toISOString()
    };

    var all = RecurringJobs.getAll();
    all.push(record);
    localStorage.setItem('bm-recurring', JSON.stringify(all));

    UI.toast('Recurring job created for ' + clientName);
    loadPage('recurring');
  },

  toggle: function(id) {
    var all = RecurringJobs.getAll();
    var item = all.find(function(r) { return r.id === id; });
    if (item) {
      item.active = !item.active;
      localStorage.setItem('bm-recurring', JSON.stringify(all));
      UI.toast(item.active ? 'Resumed' : 'Paused');
      loadPage('recurring');
    }
  },

  generateJob: function(id) {
    var all = RecurringJobs.getAll();
    var rec = all.find(function(r) { return r.id === id; });
    if (!rec) return;

    var nextDate = RecurringJobs._getNextDate(rec);
    DB.jobs.create({
      clientName: rec.clientName,
      description: rec.service.replace(/_/g, ' ') + (rec.notes ? ' — ' + rec.notes : ''),
      scheduledDate: nextDate,
      total: rec.price,
      status: 'scheduled',
      source: 'recurring',
      recurringId: rec.id
    });

    rec.lastGenerated = new Date().toISOString();
    localStorage.setItem('bm-recurring', JSON.stringify(all));
    UI.toast('Job created for ' + rec.clientName + ' on ' + UI.dateShort(nextDate));
  },

  getAll: function() {
    try { return JSON.parse(localStorage.getItem('bm-recurring')) || []; } catch(e) { return []; }
  },

  _getNextDate: function(rec) {
    var base = rec.lastGenerated ? new Date(rec.lastGenerated) : new Date(rec.startDate);
    var next = new Date(base);
    var intervals = { weekly: 7, biweekly: 14, monthly: 30, quarterly: 91, biannual: 182, annual: 365 };
    var days = intervals[rec.frequency] || 30;
    next.setDate(next.getDate() + days);

    // Make sure it's in the future
    while (next < new Date()) {
      next.setDate(next.getDate() + days);
    }
    return next.toISOString();
  }
};

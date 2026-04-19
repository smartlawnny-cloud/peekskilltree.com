// Daily Pre-Trip Inspection — shared widget usable anywhere
// (was on Dashboard; moved to Jobs + Crew per user request).
// Renders once per day; hides itself once the user completes it.

var DailyInspection = {

  // ── Inspection checklist ──
  // Kept relatively short per user: "we will shorten the list and add more equipment."
  // Expand the equipment array here as the fleet grows.
  _items: [
    ['🚛', 'Truck', [
      'Tires + lights OK',
      'Brakes firm',
      'Oil, coolant, fluids',
      'Horn + wipers + mirrors',
      'Registration + insurance in cab',
      'Fire extinguisher + first aid'
    ]],
    ['⚙️', 'Equipment', [
      'Chipper — blades, safety bar, fuel',
      'Chainsaws — chain, bar oil, brake, fuel',
      'Bucket truck — boom, outriggers, hydraulics',
      'Stump grinder — teeth, belt',
      'Ropes, rigging, carabiners — inspect for wear',
      'Ladders — rungs + latches',
      'Crane / mini-skid / other'
    ]],
    ['🦺', 'Safety + PPE', [
      'Hard hats + chaps + eye & ear pro',
      'Harnesses + lanyards + helmets',
      'Cones, signs, flagger vest'
    ]],
    ['🪵', 'Trailer', [
      'Hitch + safety chains + lights',
      'Tires + load secured'
    ]]
  ],

  // Returns true if today's inspection is already recorded.
  isComplete: function() {
    var today = new Date().toISOString().split('T')[0];
    return !!localStorage.getItem('bm-inspection-' + today);
  },

  // Render a collapsed card if not yet done, or a compact "done" confirmation.
  // Pass { compact: true } for a shorter banner suitable for the Crew view.
  render: function(opts) {
    opts = opts || {};
    if (DailyInspection.isComplete()) {
      var today = new Date().toISOString().split('T')[0];
      var rec = {};
      try { rec = JSON.parse(localStorage.getItem('bm-inspection-' + today) || '{}'); } catch(e){}
      var badge = rec.pass ? '✅' : '⚠️';
      return '<div style="background:' + (rec.pass ? '#ecfdf5' : '#fff7ed') + ';border:1px solid ' + (rec.pass ? '#86efac' : '#fed7aa') + ';border-radius:10px;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;font-size:13px;">'
        +   badge + ' <strong>Today\'s pre-trip inspection complete</strong>'
        +   '<span style="color:var(--text-light);margin-left:auto;">' + (rec.driver || '') + (rec.vehicle ? ' · ' + rec.vehicle : '') + '</span>'
        + '</div>';
    }

    var totalCount = DailyInspection._items.reduce(function(s, sec) { return s + sec[2].length; }, 0);
    var html = '<div id="daily-inspection" style="background:var(--white);border-radius:12px;border:2px solid #e65100;margin-bottom:14px;overflow:hidden;">'
      + '<div style="background:#fff3e0;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;">'
      +   '<div style="display:flex;align-items:center;gap:10px;">'
      +     '<span style="font-size:20px;">🚛</span>'
      +     '<div><div style="font-size:14px;font-weight:700;color:#e65100;">Daily Pre-Trip Inspection</div>'
      +     '<div style="font-size:11px;color:#bf360c;">FMCSA/DOT — required before first trip</div></div>'
      +   '</div>'
      +   '<button onclick="DailyInspection.toggle()" id="insp-toggle-btn" style="background:#e65100;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">Start ▾</button>'
      + '</div>'
      + '<div id="insp-body" style="display:none;padding:14px 16px;">'
      +   '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">'
      +     '<input type="text" id="insp-driver" placeholder="Driver name" style="padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px;">'
      +     '<input type="text" id="insp-vehicle" placeholder="Vehicle / plate #" style="padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px;">'
      +   '</div>';

    DailyInspection._items.forEach(function(sec) {
      html += '<div style="font-size:12px;font-weight:700;color:#e65100;margin:10px 0 4px;">' + sec[0] + ' ' + sec[1] + '</div>';
      sec[2].forEach(function(item) {
        html += '<label style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:13px;cursor:pointer;border-bottom:1px solid #f5f5f5;">'
          +   '<input type="checkbox" class="insp-check" style="width:16px;height:16px;accent-color:#1b5e20;" onchange="DailyInspection.count()">'
          +   ' ' + item + '</label>';
      });
    });

    html += '<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;">'
      +   '<span id="insp-count" style="font-size:12px;color:var(--text-light);">0 / ' + totalCount + ' checked</span>'
      +   '<button onclick="DailyInspection.complete()" style="background:#1b5e20;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">✓ Complete Inspection</button>'
      + '</div></div></div>';

    return html;
  },

  toggle: function() {
    var body = document.getElementById('insp-body');
    var btn = document.getElementById('insp-toggle-btn');
    if (!body || !btn) return;
    if (body.style.display === 'none') {
      body.style.display = 'block';
      btn.textContent = 'Hide ▴';
      var user = (typeof Auth !== 'undefined' && Auth.user) ? Auth.user.name : '';
      var driverEl = document.getElementById('insp-driver');
      if (driverEl && !driverEl.value && user) driverEl.value = user;
    } else {
      body.style.display = 'none';
      btn.textContent = 'Start ▾';
    }
  },

  count: function() {
    var checks = document.querySelectorAll('.insp-check');
    var done = Array.from(checks).filter(function(c) { return c.checked; }).length;
    var el = document.getElementById('insp-count');
    if (el) el.textContent = done + ' / ' + checks.length + ' checked';
  },

  complete: function() {
    var checks = document.querySelectorAll('.insp-check');
    var done = Array.from(checks).filter(function(c) { return c.checked; }).length;
    if (done < checks.length) {
      if (!confirm(done + ' of ' + checks.length + ' items checked. Complete anyway with defects noted?')) return;
    }
    var driver = (document.getElementById('insp-driver') || {}).value || '';
    var vehicle = (document.getElementById('insp-vehicle') || {}).value || '';
    if (!driver) { alert('Enter driver name'); return; }

    var today = new Date().toISOString().split('T')[0];
    var record = {
      date: today, driver: driver, vehicle: vehicle,
      checked: done, total: checks.length,
      pass: done === checks.length,
      completedAt: new Date().toISOString()
    };

    localStorage.setItem('bm-inspection-' + today, JSON.stringify(record));
    var history = [];
    try { history = JSON.parse(localStorage.getItem('bm-inspection-history') || '[]'); } catch(e) {}
    history.unshift(record);
    if (history.length > 90) history = history.slice(0, 90);
    localStorage.setItem('bm-inspection-history', JSON.stringify(history));

    UI.toast('Vehicle inspection complete — ' + (record.pass ? 'all clear' : done + '/' + checks.length + ' passed'));
    var el = document.getElementById('daily-inspection');
    if (el) el.remove();
  }
};

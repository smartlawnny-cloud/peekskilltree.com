/**
 * Branch Manager — Equipment Inventory & Maintenance Tracker
 * Track all equipment, maintenance schedules, hours, repair history
 */
var EquipmentPage = {
  render: function() {
    var equipment = EquipmentPage.getAll();
    var needsMaint = equipment.filter(function(e) { return EquipmentPage._needsMaintenance(e); });

    var html = '<div class="stat-grid">'
      + UI.statCard('Equipment', equipment.length.toString(), 'Total items tracked', '', '')
      + UI.statCard('Needs Service', needsMaint.length.toString(), needsMaint.length > 0 ? '⚠️ Overdue' : 'All good ✅', needsMaint.length > 0 ? 'down' : 'up', '')
      + UI.statCard('Total Value', UI.moneyInt(equipment.reduce(function(s, e) { return s + (e.value || 0); }, 0)), 'Replacement cost', '', '')
      + '</div>';

    // Maintenance alerts
    if (needsMaint.length) {
      html += '<div style="background:#fff3e0;border-radius:12px;padding:16px;border-left:4px solid #e65100;margin-bottom:16px;">'
        + '<h4 style="color:#e65100;margin-bottom:8px;">⚠️ Maintenance Due</h4>';
      needsMaint.forEach(function(e) {
        html += '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">'
          + '<span><strong>' + e.name + '</strong> — ' + (e.nextService || 'Service needed') + '</span>'
          + '<button onclick="EquipmentPage.logService(\'' + e.id + '\')" style="background:#e65100;color:#fff;border:none;padding:4px 10px;border-radius:4px;font-size:11px;cursor:pointer;">Mark Done</button>'
          + '</div>';
      });
      html += '</div>';
    }

    // Equipment list
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">'
      + '<h3 style="font-size:16px;">Equipment</h3>'
      + '<button onclick="EquipmentPage.showForm()" style="background:var(--green-dark);color:#fff;border:none;padding:8px 16px;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px;">+ Add Equipment</button></div>';

    var categories = {};
    equipment.forEach(function(e) {
      var cat = e.category || 'Other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(e);
    });

    Object.keys(categories).sort().forEach(function(cat) {
      html += '<div style="margin-bottom:16px;">'
        + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;border-bottom:1px solid var(--border);padding-bottom:4px;">' + cat + '</h4>';
      categories[cat].forEach(function(e) {
        var statusColor = e.status === 'active' ? '#4caf50' : e.status === 'repair' ? '#f44336' : '#999';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f5f5f5;cursor:pointer;" onclick="EquipmentPage.showDetail(\'' + e.id + '\')">'
          + '<div style="display:flex;align-items:center;gap:8px;">'
          + '<span style="width:8px;height:8px;border-radius:50%;background:' + statusColor + ';flex-shrink:0;"></span>'
          + '<div><strong style="font-size:14px;">' + e.name + '</strong>'
          + '<div style="font-size:12px;color:var(--text-light);">' + (e.make || '') + ' ' + (e.model || '') + (e.year ? ' · ' + e.year : '') + (e.serial ? ' · SN: ' + e.serial : '') + '</div></div></div>'
          + '<div style="text-align:right;font-size:12px;">'
          + '<div style="font-weight:600;">' + (e.hours ? e.hours + ' hrs' : '') + '</div>'
          + '<div style="color:var(--text-light);">' + (e.value ? UI.money(e.value) : '') + '</div></div></div>';
      });
      html += '</div>';
    });

    if (equipment.length === 0) {
      html += '<div style="text-align:center;padding:24px;color:var(--text-light);">'
        + '<p>No equipment tracked yet. Add your trucks, saws, and gear.</p></div>';
    }
    html += '</div>';

    return html;
  },

  getAll: function() {
    var stored = localStorage.getItem('bm-equipment');
    if (stored) return JSON.parse(stored);
    // Seed with common tree service equipment
    var defaults = [
      { id: 'eq1', name: 'Bucket Truck', category: 'Trucks', make: '', model: '', status: 'active', value: 85000, hours: 0, nextService: 'Oil change @ 5000 mi' },
      { id: 'eq2', name: 'Chip Truck', category: 'Trucks', make: '', model: '', status: 'active', value: 45000, hours: 0 },
      { id: 'eq3', name: 'Ram 2500', category: 'Trucks', make: 'Ram', model: '2500', status: 'active', value: 45000, hours: 0 },
      { id: 'eq4', name: 'Chipper', category: 'Equipment', make: '', model: '', status: 'active', value: 35000, hours: 0, nextService: 'Blade sharpen @ 50 hrs' },
      { id: 'eq5', name: 'Stump Grinder', category: 'Equipment', make: '', model: '', status: 'active', value: 15000, hours: 0 },
      { id: 'eq6', name: 'Loader', category: 'Equipment', make: '', model: '', status: 'active', value: 25000, hours: 0 },
      { id: 'eq7', name: 'Climbing Gear Set', category: 'Safety', make: '', model: '', status: 'active', value: 3000, nextService: 'Annual inspection' },
      { id: 'eq8', name: 'Stihl MS 462', category: 'Saws', make: 'Stihl', model: 'MS 462', status: 'active', value: 1100, hours: 0 },
      { id: 'eq9', name: 'Stihl MS 261', category: 'Saws', make: 'Stihl', model: 'MS 261', status: 'active', value: 700, hours: 0 },
      { id: 'eq10', name: 'Trailer', category: 'Trucks', make: '', model: '', status: 'active', value: 5000 }
    ];
    localStorage.setItem('bm-equipment', JSON.stringify(defaults));
    return defaults;
  },

  _needsMaintenance: function(e) {
    if (!e.lastService) return !!e.nextService;
    var daysSince = (Date.now() - new Date(e.lastService).getTime()) / 86400000;
    return daysSince > (e.serviceIntervalDays || 90);
  },

  showForm: function(id) {
    var e = id ? EquipmentPage.getAll().find(function(eq) { return eq.id === id; }) : null;
    var categories = ['Trucks', 'Equipment', 'Saws', 'Safety', 'Rigging', 'Other'];

    var html = '<form id="eq-form" onsubmit="EquipmentPage.save(event, ' + (id ? '\'' + id + '\'' : 'null') + ')">'
      + UI.formField('Name', 'text', 'eq-name', e ? e.name : '', { placeholder: 'e.g., Stihl MS 462' })
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
      + UI.formField('Category', 'select', 'eq-cat', e ? e.category : '', { options: categories })
      + UI.formField('Status', 'select', 'eq-status', e ? e.status : 'active', { options: ['active', 'repair', 'retired'] })
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">'
      + UI.formField('Make', 'text', 'eq-make', e ? e.make : '', { placeholder: 'Stihl' })
      + UI.formField('Model', 'text', 'eq-model', e ? e.model : '', { placeholder: 'MS 462' })
      + UI.formField('Year', 'text', 'eq-year', e ? e.year : '', { placeholder: '2024' })
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
      + UI.formField('Value ($)', 'number', 'eq-value', e ? e.value : '', { placeholder: '5000' })
      + UI.formField('Serial Number', 'text', 'eq-serial', e ? e.serial : '', { placeholder: 'SN12345' })
      + '</div>'
      + UI.formField('Service Notes', 'text', 'eq-service', e ? e.nextService : '', { placeholder: 'e.g., Oil change every 100 hours' })
      + '</form>';

    UI.showModal(id ? 'Edit Equipment' : 'Add Equipment', html, {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-primary" onclick="document.getElementById(\'eq-form\').requestSubmit()">Save</button>'
    });
  },

  save: function(e, id) {
    e.preventDefault();
    var all = EquipmentPage.getAll();
    var data = {
      name: document.getElementById('eq-name').value,
      category: document.getElementById('eq-cat').value,
      status: document.getElementById('eq-status').value,
      make: document.getElementById('eq-make').value,
      model: document.getElementById('eq-model').value,
      year: document.getElementById('eq-year').value,
      value: parseFloat(document.getElementById('eq-value').value) || 0,
      serial: document.getElementById('eq-serial').value,
      nextService: document.getElementById('eq-service').value
    };

    if (id) {
      var idx = all.findIndex(function(eq) { return eq.id === id; });
      if (idx >= 0) Object.assign(all[idx], data);
    } else {
      data.id = Date.now().toString(36);
      data.hours = 0;
      data.createdAt = new Date().toISOString();
      all.push(data);
    }
    localStorage.setItem('bm-equipment', JSON.stringify(all));
    UI.closeModal();
    UI.toast(id ? 'Equipment updated' : 'Equipment added');
    loadPage('equipment');
  },

  showDetail: function(id) {
    var e = EquipmentPage.getAll().find(function(eq) { return eq.id === id; });
    if (!e) return;
    var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">'
      + '<div><h4 style="margin-bottom:8px;">Details</h4>'
      + '<div style="font-size:14px;line-height:2;">'
      + '<div>Make: <strong>' + (e.make || '—') + '</strong></div>'
      + '<div>Model: <strong>' + (e.model || '—') + '</strong></div>'
      + '<div>Year: <strong>' + (e.year || '—') + '</strong></div>'
      + '<div>Serial: <strong>' + (e.serial || '—') + '</strong></div>'
      + '<div>Value: <strong>' + UI.money(e.value || 0) + '</strong></div>'
      + '<div>Hours: <strong>' + (e.hours || 0) + '</strong></div></div></div>'
      + '<div><h4 style="margin-bottom:8px;">Service</h4>'
      + '<div style="font-size:14px;line-height:2;">'
      + '<div>Status: ' + UI.statusBadge(e.status) + '</div>'
      + '<div>Next Service: <strong>' + (e.nextService || 'None set') + '</strong></div>'
      + '<div>Last Service: <strong>' + (e.lastService ? UI.dateShort(e.lastService) : 'Never') + '</strong></div></div></div></div>';

    if (typeof Photos !== 'undefined') {
      html += Photos.renderGallery('equipment', id);
    }

    UI.showModal(e.name, html, {
      wide: true,
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Close</button>'
        + ' <button class="btn btn-outline" onclick="EquipmentPage.logService(\'' + id + '\')">✅ Log Service</button>'
        + ' <button class="btn btn-primary" onclick="UI.closeModal();EquipmentPage.showForm(\'' + id + '\')">Edit</button>'
    });
  },

  logService: function(id) {
    var all = EquipmentPage.getAll();
    var eq = all.find(function(e) { return e.id === id; });
    if (eq) {
      eq.lastService = new Date().toISOString();
      localStorage.setItem('bm-equipment', JSON.stringify(all));
      UI.toast('Service logged for ' + eq.name);
      loadPage('equipment');
    }
  }
};

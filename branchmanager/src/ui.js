/**
 * Branch Manager — UI Components
 * Reusable modal, form builder, table builder, status badges
 */
var UI = (function() {

  // ── Modal ──
  function showModal(title, content, options) {
    options = options || {};
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = '<div class="modal' + (options.wide ? ' modal-wide' : '') + '">'
      + '<div class="modal-header">'
      + '<h3>' + title + '</h3>'
      + '<button class="modal-close" onclick="UI.closeModal()">&times;</button>'
      + '</div>'
      + '<div class="modal-body">' + content + '</div>'
      + (options.footer ? '<div class="modal-footer">' + options.footer + '</div>' : '')
      + '</div>';
    overlay.addEventListener('click', function(e) { if (e.target === overlay) UI.closeModal(); });
    document.body.appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('open'); });
    return overlay;
  }
  function closeModal() {
    var m = document.querySelector('.modal-overlay');
    if (m) { m.classList.remove('open'); setTimeout(function() { m.remove(); }, 200); }
  }

  // ── Status Badge ──
  function statusBadge(status) {
    var map = {
      active: 'status-active', lead: 'status-lead', new: 'status-new',
      scheduled: 'status-sent', late: 'status-late', completed: 'status-active',
      cancelled: 'status-draft', draft: 'status-draft', sent: 'status-sent',
      awaiting: 'status-sent', approved: 'status-active', declined: 'status-late',
      paid: 'status-paid', overdue: 'status-late', upcoming: 'status-sent'
    };
    return '<span class="status-badge ' + (map[status] || 'status-draft') + '">' + (status || '—') + '</span>';
  }

  // ── Format helpers ──
  function money(n) { return '$' + (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function moneyInt(n) { return '$' + Math.round(n || 0).toLocaleString(); }
  function dateShort(d) {
    if (!d) return '—';
    var dt = new Date(d + 'T12:00:00');
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
  }
  function dateRelative(d) {
    if (!d) return '—';
    var now = new Date(); var dt = new Date(d);
    var diff = Math.floor((now - dt) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return diff + ' days ago';
    return dateShort(d.split('T')[0]);
  }
  function phone(p) {
    if (!p) return '—';
    var d = p.replace(/\D/g, '');
    if (d.length === 10) return '(' + d.substr(0,3) + ') ' + d.substr(3,3) + '-' + d.substr(6);
    return p;
  }

  // ── Form Builder ──
  function formField(label, type, id, value, options) {
    options = options || {};
    var html = '<div class="form-group">';
    html += '<label for="' + id + '">' + label + '</label>';
    if (type === 'textarea') {
      html += '<textarea id="' + id + '" rows="' + (options.rows || 3) + '" placeholder="' + (options.placeholder || '') + '">' + (value || '') + '</textarea>';
    } else if (type === 'select') {
      html += '<select id="' + id + '">';
      (options.options || []).forEach(function(o) {
        var val = typeof o === 'object' ? o.value : o;
        var label = typeof o === 'object' ? o.label : o;
        html += '<option value="' + val + '"' + (val === value ? ' selected' : '') + '>' + label + '</option>';
      });
      html += '</select>';
    } else {
      html += '<input type="' + type + '" id="' + id + '" value="' + (value || '') + '" placeholder="' + (options.placeholder || '') + '"' + (options.required ? ' required' : '') + '>';
    }
    html += '</div>';
    return html;
  }

  // ── Stat Card ──
  function statCard(label, value, sub, trend, trendText, onclick) {
    return '<div class="stat-card"' + (onclick ? ' onclick="' + onclick + '" style="cursor:pointer;"' : '') + '>'
      + '<div class="stat-label">' + label + '</div>'
      + '<div class="stat-value">' + value + '</div>'
      + (sub ? '<div class="stat-sub">' + sub + (trendText ? ' <span class="stat-trend ' + trend + '">' + trendText + '</span>' : '') + '</div>' : '')
      + '</div>';
  }

  // ── Empty State ──
  function emptyState(icon, title, desc, actionText, actionFn) {
    return '<div class="empty-state">'
      + '<div class="empty-icon">' + icon + '</div>'
      + '<h3>' + title + '</h3>'
      + '<p>' + desc + '</p>'
      + (actionText ? '<button class="btn btn-primary" style="margin-top:16px;" onclick="' + actionFn + '">' + actionText + '</button>' : '')
      + '</div>';
  }

  // ── Confirm Dialog ──
  function confirm(message, onYes) {
    showModal('Confirm', '<p style="font-size:15px;margin-bottom:16px;">' + message + '</p>',
      { footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button> <button class="btn btn-primary" onclick="UI.closeModal();(' + onYes.toString() + ')()">Yes, Continue</button>' });
  }

  // ── Toast / Notification ──
  function toast(message, type) {
    type = type || 'success';
    var t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.textContent = message;
    document.body.appendChild(t);
    requestAnimationFrame(function() { t.classList.add('show'); });
    setTimeout(function() { t.classList.remove('show'); setTimeout(function() { t.remove(); }, 300); }, 3000);
  }

  return {
    showModal: showModal,
    closeModal: closeModal,
    statusBadge: statusBadge,
    money: money,
    moneyInt: moneyInt,
    dateShort: dateShort,
    dateRelative: dateRelative,
    phone: phone,
    formField: formField,
    statCard: statCard,
    emptyState: emptyState,
    confirm: confirm,
    toast: toast
  };
})();

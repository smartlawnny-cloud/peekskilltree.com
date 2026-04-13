/**
 * Ground Control — UI Helpers
 */
var UI = {
  // HTML escape
  esc: function(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  },

  // Toast notification
  toast: function(msg, type) {
    type = type || 'info';
    var el = document.createElement('div');
    el.className = 'gc-toast gc-toast-' + type;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function() { el.classList.add('gc-toast-show'); }, 10);
    setTimeout(function() {
      el.classList.remove('gc-toast-show');
      setTimeout(function() { el.remove(); }, 300);
    }, 3000);
  },

  // Format date
  dateShort: function(d) {
    if (!d) return '';
    var dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  dateFull: function(d) {
    if (!d) return '';
    var dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  },

  dayOfWeek: function(d) {
    if (!d) return '';
    var dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('en-US', { weekday: 'short' });
  },

  // Time greeting
  greeting: function(name) {
    var h = new Date().getHours();
    var g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    return name ? g + ', ' + name : g;
  },

  // Mood emoji lookup
  moodEmoji: function(value) {
    if (!value) return '';
    var m = GC_CONFIG.moods.find(function(m) { return m.value === value; });
    return m ? m.emoji : '';
  },

  // Relative time
  timeAgo: function(dateStr) {
    var now = new Date();
    var d = new Date(dateStr);
    var diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  },

  // Simple modal
  showModal: function(title, bodyHtml, opts) {
    opts = opts || {};
    var overlay = document.createElement('div');
    overlay.className = 'gc-modal-overlay';
    overlay.innerHTML =
      '<div class="gc-modal">' +
        '<div class="gc-modal-header">' +
          '<h3>' + UI.esc(title) + '</h3>' +
          '<button class="gc-modal-close" onclick="UI.closeModal()">&times;</button>' +
        '</div>' +
        '<div class="gc-modal-body">' + bodyHtml + '</div>' +
        (opts.footer ? '<div class="gc-modal-footer">' + opts.footer + '</div>' : '') +
      '</div>';
    document.body.appendChild(overlay);
    setTimeout(function() { overlay.classList.add('gc-modal-show'); }, 10);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) UI.closeModal();
    });
  },

  closeModal: function() {
    var m = document.querySelector('.gc-modal-overlay');
    if (m) {
      m.classList.remove('gc-modal-show');
      setTimeout(function() { m.remove(); }, 200);
    }
  }
};

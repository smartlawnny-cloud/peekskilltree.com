/**
 * Branch Manager — Quotes Page
 * Quote list, builder with line items, status management
 */
var QuotesPage = {
  _page: 0, _perPage: 50, _search: '', _filter: 'all', _sortCol: 'quoteNumber', _sortDir: 'desc',

  _co: function() {
    return {
      name: localStorage.getItem('bm-co-name') || BM_CONFIG.companyName,
      phone: localStorage.getItem('bm-co-phone') || BM_CONFIG.phone,
      email: localStorage.getItem('bm-co-email') || BM_CONFIG.email,
      website: localStorage.getItem('bm-co-website') || BM_CONFIG.website,
      licenses: localStorage.getItem('bm-co-licenses') || 'WC-32079, PC-50644'
    };
  },

  _pendingDetail: null,

  render: function() {
    var self = QuotesPage;
    if (self._pendingDetail) {
      var _pid = self._pendingDetail;
      self._pendingDetail = null;
      setTimeout(function() { QuotesPage.showDetail(_pid); }, 50);
    }
    var all = DB.quotes.getAll();
    var now7ago = new Date(Date.now() - 7 * 86400000);

    // ── 3 clean KPI cards ──
    var active = all.filter(function(q) { return q.status === 'sent' || q.status === 'awaiting' || q.status === 'changes_requested'; });
    var activeTotal = active.reduce(function(s,q){return s+(q.total||0);},0);
    var closed = all.filter(function(q) { return q.status === 'converted' || q.status === 'approved'; });
    var convRate = all.length > 0 ? Math.round(closed.length / all.length * 100) : 0;
    var stale = active.filter(function(q) { return q.createdAt && new Date(q.createdAt) < now7ago; });
    var convColor = convRate >= 40 ? '#059669' : convRate >= 25 ? '#d97706' : '#dc2626';

    var html = '<div class="stat-row" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">'
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:16px 18px;">'
      +   '<div style="font-size:11px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.04em;">Active Pipeline</div>'
      +   '<div style="font-size:24px;font-weight:800;color:var(--text);margin-top:4px;">' + UI.moneyInt(activeTotal) + '</div>'
      +   '<div style="font-size:12px;color:var(--text-light);margin-top:2px;">' + active.length + ' awaiting</div>'
      + '</div>'
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:16px 18px;">'
      +   '<div style="font-size:11px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.04em;">Conversion</div>'
      +   '<div style="font-size:24px;font-weight:800;color:' + convColor + ';margin-top:4px;">' + convRate + '%</div>'
      +   '<div style="font-size:12px;color:var(--text-light);margin-top:2px;">' + closed.length + ' of ' + all.length + '</div>'
      + '</div>'
      + '<div style="background:' + (stale.length > 0 ? '#fffbeb' : 'var(--white)') + ';border:1px solid ' + (stale.length > 0 ? '#fcd34d' : 'var(--border)') + ';border-radius:12px;padding:16px 18px;cursor:pointer;" onclick="QuotesPage._setFilter(\'stale\')">'
      +   '<div style="font-size:11px;font-weight:600;color:' + (stale.length > 0 ? '#92400e' : 'var(--text-light)') + ';text-transform:uppercase;letter-spacing:.04em;">Stale · 7d+</div>'
      +   '<div style="font-size:24px;font-weight:800;color:' + (stale.length > 0 ? '#b45309' : 'var(--text)') + ';margin-top:4px;">' + stale.length + '</div>'
      +   '<div style="font-size:12px;color:' + (stale.length > 0 ? '#92400e' : 'var(--text-light)') + ';margin-top:2px;">' + (stale.length > 0 ? 'Follow up →' : 'All caught up ✓') + '</div>'
      + '</div>'
      + '</div>';

    var filtered = self._getFiltered();
    var page = filtered.slice(self._page * self._perPage, (self._page + 1) * self._perPage);

    // ── Header: title + chip filters + search ──
    var chipDefs = [['all','All'],['draft','Draft'],['awaiting','Awaiting'],['stale','Stale 7d+'],['changes_requested','Changes Req.'],['approved','Approved'],['converted','Converted']];
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">'
      + '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
      +   '<h3 style="font-size:16px;font-weight:700;margin:0;">Quotes</h3>'
      +   '<span style="font-size:13px;color:var(--text-light);">(' + filtered.length + ')</span>'
      + '</div>'
      + '<div class="search-box" style="min-width:200px;max-width:280px;">'
      +   '<span style="color:var(--text-light);">🔍</span>'
      +   '<input type="text" placeholder="Search quotes..." value="' + UI.esc(self._search) + '" oninput="QuotesPage._search=this.value;QuotesPage._page=0;loadPage(\'quotes\')">'
      + '</div></div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;">';
    for (var ci = 0; ci < chipDefs.length; ci++) {
      var val = chipDefs[ci][0], label = chipDefs[ci][1];
      var isActive = self._filter === val;
      html += '<button onclick="QuotesPage._setFilter(\'' + val + '\')" style="font-size:12px;padding:6px 14px;border-radius:20px;border:1px solid ' + (isActive ? '#2e7d32' : 'var(--border)') + ';background:' + (isActive ? '#2e7d32' : 'var(--white)') + ';color:' + (isActive ? '#fff' : 'var(--text)') + ';cursor:pointer;font-weight:' + (isActive ? '600' : '500') + ';white-space:nowrap;">' + label + '</button>';
    }
    html += '</div>';

    // ── Batch action bar ──
    html += '<div id="q-batch-bar" class="bm-batch-bar" style="display:none;position:fixed;bottom:0;left:var(--sidebar-w,0);right:0;z-index:500;background:#1a1a2e;color:#fff;padding:12px 24px;padding-bottom:max(12px,env(safe-area-inset-bottom));align-items:center;justify-content:space-between;box-shadow:0 -4px 20px rgba(0,0,0,.3);">'
      + '<span id="q-batch-count" style="font-weight:700;font-size:14px;">0 selected</span>'
      + '<div style="display:flex;gap:8px;align-items:center;">'
      +   '<button onclick="QuotesPage._batchFollowUp()" style="background:#e6a817;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">📬 Send Follow-up</button>'
      +   '<button onclick="QuotesPage._batchDecline()" style="background:#dc3545;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">✗ Mark Declined</button>'
      +   '<button onclick="QuotesPage._batchClear()" style="background:none;color:rgba(255,255,255,.7);border:none;padding:8px 12px;font-size:16px;cursor:pointer;">&#10005;</button>'
      + '</div></div>';

    // ── Empty state with "Clear filter" affordance ──
    if (page.length === 0) {
      if (self._search || self._filter !== 'all') {
        html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:40px 20px;text-align:center;color:var(--text-light);">'
          +   '<div style="font-size:36px;margin-bottom:10px;">📋</div>'
          +   '<div style="font-size:15px;font-weight:600;margin-bottom:4px;color:var(--text);">No quotes match this view</div>'
          +   '<div style="font-size:13px;margin-bottom:14px;">' + (self._search ? 'Search: "' + UI.esc(self._search) + '"' : 'Filter: ' + self._filter) + '</div>'
          +   '<button class="btn btn-outline" onclick="QuotesPage._search=\'\';QuotesPage._filter=\'all\';QuotesPage._page=0;loadPage(\'quotes\')" style="font-size:13px;">Clear filters</button>'
          + '</div>';
      } else {
        html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:24px;">'
          + UI.emptyState('📋', 'No quotes yet', 'Create your first quote.', '+ New Quote', 'QuotesPage.showForm()')
          + '</div>';
      }
    } else {
      // ── DESKTOP: table (column order: Client → Total → Status → Date → Quote#) ──
      html += '<div class="q-desktop-only" style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
        + '<table class="data-table"><thead><tr>'
        +   '<th style="width:32px;"><input type="checkbox" onchange="QuotesPage._selectAll(this.checked)" style="width:16px;height:16px;"></th>'
        +   self._sortTh('Client', 'clientName')
        +   self._sortTh('Total', 'total', 'text-align:right;')
        +   self._sortTh('Status', 'status')
        +   self._sortTh('Created', 'createdAt')
        +   self._sortTh('Quote #', 'quoteNumber')
        + '</tr></thead><tbody>';
      page.forEach(function(q) {
        var isStale = (q.status === 'sent' || q.status === 'awaiting') && q.createdAt && new Date(q.createdAt) < now7ago;
        var staleDot = isStale ? '<span title="Stale — sent 7+ days ago, needs follow-up" style="display:inline-block;width:8px;height:8px;background:#f59e0b;border-radius:50%;margin-right:6px;vertical-align:middle;"></span>' : '';
        html += '<tr onclick="QuotesPage.showDetail(\'' + q.id + '\')" style="cursor:pointer;">'
          + '<td onclick="event.stopPropagation()"><input type="checkbox" class="q-check" value="' + q.id + '" onchange="QuotesPage._updateBulk()" style="width:16px;height:16px;"></td>'
          + '<td>' + staleDot + '<strong>' + UI.esc(q.clientName || '—') + '</strong>'
          +   (q.property ? '<div style="font-size:11px;color:var(--text-light);margin-top:2px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + UI.esc(q.property) + '</div>' : '') + '</td>'
          + '<td style="text-align:right;font-weight:700;font-size:14px;">' + UI.money(q.total) + '</td>'
          + '<td>' + UI.statusBadge(q.status) + '</td>'
          + '<td style="font-size:13px;color:var(--text-light);">' + UI.dateShort(q.createdAt) + '</td>'
          + '<td style="font-size:12px;color:var(--text-light);">#' + (q.quoteNumber || '') + '</td>'
          + '</tr>';
      });
      html += '</tbody></table></div>';

      // ── MOBILE: card layout ──
      html += '<div class="q-mobile-only" style="display:none;">';
      page.forEach(function(q) {
        var isStale = (q.status === 'sent' || q.status === 'awaiting') && q.createdAt && new Date(q.createdAt) < now7ago;
        var staleBar = isStale ? 'border-left:3px solid #f59e0b;' : 'border-left:3px solid transparent;';
        html += '<div data-qid="' + q.id + '" class="quote-card" style="background:var(--white);border:1px solid var(--border);' + staleBar + 'border-radius:12px;padding:14px 16px;margin-bottom:8px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.04);-webkit-tap-highlight-color:transparent;">'
          + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">'
          +   '<div style="flex:1;min-width:0;">'
          +     '<div style="font-size:15px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + UI.esc(q.clientName || '—') + '</div>'
          +     (q.property ? '<div style="font-size:12px;color:var(--text-light);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">📍 ' + UI.esc(q.property) + '</div>' : '')
          +   '</div>'
          +   '<div style="font-size:17px;font-weight:800;color:var(--text);flex-shrink:0;">' + UI.money(q.total) + '</div>'
          + '</div>'
          + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px;flex-wrap:wrap;">'
          +   '<div>' + UI.statusBadge(q.status) + '</div>'
          +   '<div style="font-size:11px;color:var(--text-light);">'
          +     (isStale ? '<span style="color:#b45309;font-weight:600;">Stale · </span>' : '')
          +     UI.dateShort(q.createdAt) + ' · #' + (q.quoteNumber || '')
          +   '</div>'
          + '</div>'
          + '</div>';
      });
      html += '</div>';
    }

    // Pagination
    var totalPages = Math.ceil(filtered.length / self._perPage);
    if (totalPages > 1) {
      html += '<div style="display:flex;justify-content:center;gap:4px;margin-top:12px;">';
      html += '<button class="btn btn-outline" onclick="QuotesPage._goPage(' + (self._page - 1) + ')" style="font-size:12px;padding:5px 10px;"' + (self._page === 0 ? ' disabled' : '') + '>‹</button>';
      for (var p = Math.max(0, self._page - 2); p <= Math.min(totalPages - 1, self._page + 2); p++) {
        html += '<button class="btn ' + (p === self._page ? 'btn-primary' : 'btn-outline') + '" onclick="QuotesPage._goPage(' + p + ')" style="font-size:12px;padding:5px 10px;min-width:32px;">' + (p + 1) + '</button>';
      }
      html += '<button class="btn btn-outline" onclick="QuotesPage._goPage(' + (self._page + 1) + ')" style="font-size:12px;padding:5px 10px;"' + (self._page >= totalPages - 1 ? ' disabled' : '') + '>›</button>';
      html += '</div>';
    }

    // Mobile card tap handlers (scroll-safe — same pattern as clients page)
    setTimeout(function() {
      document.querySelectorAll('.quote-card').forEach(function(card) {
        var startX, startY, moved;
        card.addEventListener('touchstart', function(e) {
          var t = e.touches[0]; startX = t.clientX; startY = t.clientY; moved = false;
        }, { passive: true });
        card.addEventListener('touchmove', function(e) {
          var t = e.touches[0];
          if (Math.abs(t.clientX - startX) > 10 || Math.abs(t.clientY - startY) > 10) moved = true;
        }, { passive: true });
        card.addEventListener('click', function() {
          if (moved) return;
          var qid = this.getAttribute('data-qid');
          if (qid) QuotesPage.showDetail(qid);
        });
      });
    }, 0);

    return html;
  },

  _getFiltered: function() {
    var self = QuotesPage;
    var all = DB.quotes.getAll();
    if (self._filter !== 'all') {
      if (self._filter === 'stale') {
        var sevenAgo = new Date(Date.now() - 7 * 86400000);
        all = all.filter(function(q) {
          return (q.status === 'sent' || q.status === 'awaiting') && q.createdAt && new Date(q.createdAt) < sevenAgo;
        });
      } else {
        all = all.filter(function(q) {
          if (self._filter === 'awaiting' || self._filter === 'sent') return q.status === 'sent' || q.status === 'awaiting';
          return q.status === self._filter;
        });
      }
    }
    if (self._search && self._search.length >= 2) {
      var s = self._search.toLowerCase();
      all = all.filter(function(q) {
        return (q.clientName || '').toLowerCase().indexOf(s) >= 0 || (q.description || '').toLowerCase().indexOf(s) >= 0 || (q.property || '').toLowerCase().indexOf(s) >= 0 || String(q.quoteNumber).indexOf(s) >= 0;
      });
    }
    var col = self._sortCol;
    var dir = self._sortDir === 'asc' ? 1 : -1;
    all.sort(function(a, b) {
      var va = a[col], vb = b[col];
      if (col === 'quoteNumber' || col === 'total') return ((va || 0) - (vb || 0)) * dir;
      if (col === 'createdAt') return ((new Date(va || 0)).getTime() - (new Date(vb || 0)).getTime()) * dir;
      va = (va || '').toString().toLowerCase(); vb = (vb || '').toString().toLowerCase();
      return va < vb ? -1 * dir : va > vb ? 1 * dir : 0;
    });
    return all;
  },
  _sortTh: function(label, col, extraStyle) {
    var self = QuotesPage;
    var arrow = self._sortCol === col ? (self._sortDir === 'asc' ? ' &#9650;' : ' &#9660;') : '';
    return '<th onclick="QuotesPage._setSort(\'' + col + '\')" style="cursor:pointer;user-select:none;' + (extraStyle || '') + '"' + (self._sortCol === col ? ' class="sort-active"' : '') + '>' + label + arrow + '</th>';
  },
  _setSort: function(col) {
    if (QuotesPage._sortCol === col) { QuotesPage._sortDir = QuotesPage._sortDir === 'asc' ? 'desc' : 'asc'; }
    else { QuotesPage._sortCol = col; QuotesPage._sortDir = 'asc'; }
    QuotesPage._page = 0; loadPage('quotes');
  },
  _setFilter: function(f) { QuotesPage._filter = f; QuotesPage._page = 0; loadPage('quotes'); },
  _goPage: function(p) { var t = Math.ceil(QuotesPage._getFiltered().length / QuotesPage._perPage); QuotesPage._page = Math.max(0, Math.min(p, t - 1)); loadPage('quotes'); },

  _selectAll: function(checked) {
    document.querySelectorAll('.q-check').forEach(function(cb) { cb.checked = checked; });
    QuotesPage._updateBatchBar();
  },
  _updateBulk: function() { QuotesPage._updateBatchBar(); },
  _updateBatchBar: function() {
    var selected = document.querySelectorAll('.q-check:checked');
    var bar = document.getElementById('q-batch-bar');
    var count = document.getElementById('q-batch-count');
    if (bar) bar.style.display = selected.length > 0 ? 'flex' : 'none';
    if (count) count.textContent = selected.length + ' selected';
  },
  _getSelected: function() {
    return Array.from(document.querySelectorAll('.q-check:checked')).map(function(cb) { return cb.value; });
  },
  _batchClear: function() {
    document.querySelectorAll('.q-check').forEach(function(cb) { cb.checked = false; });
    var bar = document.getElementById('q-batch-bar'); if (bar) bar.style.display = 'none';
  },
  _quickFollowUp: function(id) {
    var q = DB.quotes.getById(id);
    if (!q) return;
    DB.quotes.update(id, { lastFollowUp: new Date().toISOString() });

    // Try to send email if Email module is available and client has email
    var client = q.clientId ? DB.clients.getById(q.clientId) : null;
    var email = q.clientEmail || (client && client.email) || '';
    if (email && typeof Email !== 'undefined') {
      var firstName = (q.clientName || '').split(' ')[0] || 'there';
      var _co2 = QuotesPage._co();
      var subject = 'Following up on your quote from ' + _co2.name;
      var body = 'Hi ' + firstName + ',\n\n'
        + 'I wanted to follow up on the quote I sent over for ' + (q.description || 'tree services') + '.\n\n'
        + 'Quote #' + q.quoteNumber + ' — ' + UI.money(q.total) + '\n\n'
        + 'Do you have any questions or would you like to move forward? Just reply to this email or give me a call at ' + _co2.phone + '.\n\n'
        + 'Thanks,\nDoug Brown\n' + _co2.name + '\n' + _co2.phone + '\n' + _co2.website;
      Email.send(email, subject, body).then(function() {
        UI.toast('Follow-up sent to ' + email);
      }).catch(function() {
        UI.toast('Follow-up logged (email send failed — check SendGrid key in Settings)');
      });
    } else {
      UI.toast('Follow-up logged for ' + UI.esc(q.clientName || 'client') + (email ? '' : ' — no email on file'));
    }
  },
  _batchFollowUp: function() {
    var ids = QuotesPage._getSelected();
    if (ids.length === 0) return;
    ids.forEach(function(id) {
      DB.quotes.update(id, { lastFollowUp: new Date().toISOString() });
    });
    UI.toast(ids.length + ' follow-up' + (ids.length > 1 ? 's' : '') + ' logged');
    QuotesPage._batchClear();
    loadPage('quotes');
  },
  _batchDecline: function() {
    var ids = QuotesPage._getSelected();
    if (ids.length === 0) return;
    UI.confirm('Mark ' + ids.length + ' quote' + (ids.length > 1 ? 's' : '') + ' as declined?', function() {
      ids.forEach(function(id) { DB.quotes.update(id, { status: 'declined' }); });
      UI.toast(ids.length + ' quote' + (ids.length > 1 ? 's' : '') + ' marked declined');
      loadPage('quotes');
    });
  },

  showForm: function(quoteId, clientId, requestId) {
    var q = quoteId ? DB.quotes.getById(quoteId) : {};
    var client = clientId ? DB.clients.getById(clientId) : (q.clientId ? DB.clients.getById(q.clientId) : null);
    // Start empty — no auto-populated blank row. User explicitly taps "Add Tree" to begin.
    // Also filter out any ghost/empty items that might have crept in from old saves.
    var items = (q.lineItems || []).filter(function(it) {
      return it && (it.service || it.description || it.rate || (it.photos && it.photos.length) || it.photo);
    });
    // Stash requestId so save() captures it as origin
    QuotesPage._originRequestId = requestId || q.requestId || null;

    // Check for tree measurement data
    var treeMeasure = null;
    try { treeMeasure = JSON.parse(localStorage.getItem('bm-tree-measure')); localStorage.removeItem('bm-tree-measure'); } catch(e) {}
    if (treeMeasure && !quoteId) {
      var desc = 'Tree removal';
      if (treeMeasure.dbh) desc += ' — ' + treeMeasure.dbh + '" DBH';
      if (treeMeasure.height) desc += ', ~' + treeMeasure.height + ' ft';
      if (treeMeasure.complexity) desc += ' (' + treeMeasure.complexity + ')';
      var price = treeMeasure.dbh ? Math.round(treeMeasure.dbh * 100 / 50) * 50 : 0;
      items = [{ service: 'Tree Removal', description: desc, qty: 1, rate: price }];
      q.description = desc;
    }
    var services = DB.services.getAll();

    // Get clients synchronously from localStorage
    var allClients = [];
    try { allClients = JSON.parse(localStorage.getItem('bm-clients') || '[]'); } catch(e) {}

    var html = '<form id="quote-form" onsubmit="QuotesPage.save(event, \'' + (quoteId || '') + '\')">';

    // Client + property + description (minimal, auto-filled)
    var _qProperty = q.property || (client ? client.address : '') || '';
    var _qDesc = q.description || '';

    // Auto-fill description from request notes if creating from a request
    if (!_qDesc && !quoteId) {
      // Check if there's a recently converted request with notes
      var recentReqs = DB.requests.getAll().filter(function(r) {
        return r.status === 'converted' && r.clientName === (client ? client.name : '');
      });
      if (recentReqs.length > 0 && recentReqs[0].notes) _qDesc = recentReqs[0].notes;
      if (!_qDesc && recentReqs.length > 0 && recentReqs[0].service) _qDesc = recentReqs[0].service;
    }

    // Client section as a collapsible box (collapsed by default if client already selected, expanded if new)
    // For EXISTING quotes: use q.clientName as fallback when DB.clients.getById couldn't find the record
    // (client may have been removed locally but the quote still has the name/id).
    var hasResolvedClient = !!(client || q.clientId || q.clientName);
    var clientExpanded = !hasResolvedClient; // if no client info, start open
    var clientSummaryName = client ? UI.esc(client.name) : (q.clientName ? UI.esc(q.clientName) : 'Pick a client');
    var clientSummaryAddr = _qProperty ? ' · 📍 ' + UI.esc(_qProperty) : '';
    html += '<div class="q-client-box" style="background:var(--white);border:1px solid var(--border);border-radius:12px;margin-bottom:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">'
      // Summary header (always visible)
      + '<div onclick="QuotesPage._toggleClientBox(this)" style="display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;">'
      +   '<div style="width:36px;height:36px;border-radius:50%;background:' + (client ? 'var(--green-bg)' : 'var(--bg)') + ';display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;color:var(--green-dark);">👤</div>'
      +   '<div style="flex:1;min-width:0;">'
      +     '<div style="font-size:15px;font-weight:700;color:' + (client ? 'var(--text)' : 'var(--text-light)') + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" class="q-client-summary-name">' + clientSummaryName + '</div>'
      +   '</div>'
      +   '<div class="q-client-chevron" style="font-size:16px;color:var(--text-light);transition:transform .2s;' + (clientExpanded ? '' : 'transform:rotate(-90deg);') + '">▾</div>'
      + '</div>'
      // Body (collapsible)
      + '<div class="q-client-body" style="padding:0 14px 14px 14px;' + (clientExpanded ? '' : 'display:none;') + '">';

    // Treat as "resolved" if we have EITHER a fresh client obj OR stored clientId/clientName on the quote.
    // Keeps the Line Items section visible on existing quotes even when the local client was never seeded.
    if (client || q.clientName || q.clientId) {
      var _cid = (client && client.id) || q.clientId || '';
      var _cname = (client && client.name) || q.clientName || '';
      html += '<input type="hidden" id="q-clientId" value="' + _cid + '">'
        + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;">'
        +   (_cid
            ? '<a onclick="ClientsPage.showDetail(\'' + _cid + '\')" style="font-size:15px;font-weight:700;color:var(--text);cursor:pointer;text-decoration:none;border-bottom:1px dashed var(--text-light);">' + UI.esc(_cname) + ' →</a>'
            : '<span style="font-size:15px;font-weight:700;color:var(--text);">' + UI.esc(_cname) + '</span>')
        + '</div>'
        + (_qProperty ? '<div style="margin-top:6px;"><a href="https://maps.apple.com/?daddr=' + encodeURIComponent(_qProperty) + '" target="_blank" style="font-size:13px;color:var(--accent);text-decoration:none;" onclick="event.stopPropagation();">📍 ' + UI.esc(_qProperty) + ' →</a></div>' : '')
        + '<input type="hidden" id="q-property" value="' + UI.esc(_qProperty) + '">';
    } else {
      // Build list of up-to-5 most-recently-quoted clients for quick-pick
      var _recentClients = [];
      try {
        var _allClients = JSON.parse(localStorage.getItem('bm-clients') || '[]');
        var _byId = {};
        _allClients.forEach(function(c){ _byId[c.id] = c; });
        var _allQuotes = DB.quotes.getAll().slice().sort(function(a,b){ return (b.createdAt||'').localeCompare(a.createdAt||''); });
        var _seen = {};
        for (var _q = 0; _q < _allQuotes.length && _recentClients.length < 5; _q++) {
          var _cid = _allQuotes[_q].clientId;
          if (!_cid || _seen[_cid]) continue;
          var _cl = _byId[_cid]; if (!_cl) continue;
          _seen[_cid] = true;
          _recentClients.push(_cl);
        }
      } catch(e) {}

      html += '<input type="hidden" id="q-clientId" value="">'
        + '<input type="hidden" id="q-property" value="">'
        // Big label
        + '<div style="font-size:18px;font-weight:700;color:var(--text);margin-bottom:4px;">Who is this quote for?</div>'
        + '<div style="font-size:12px;color:var(--text-light);margin-bottom:12px;">Search existing clients, tap a recent one, or create a new one.</div>'
        // Big search field with leading icon
        + '<div style="position:relative;margin-bottom:10px;">'
        +   '<span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:16px;color:var(--text-light);pointer-events:none;">🔍</span>'
        +   '<input type="text" id="q-client-search" placeholder="Type a name, address, or phone…" autocomplete="off" '
        +     'oninput="QuotesPage._searchClient(this.value)" onfocus="QuotesPage._showRecentClients()" '
        +     'style="width:100%;padding:14px 14px 14px 40px;border:2px solid var(--green-dark);border-radius:10px;font-size:15px;box-sizing:border-box;box-shadow:0 0 0 4px rgba(0,131,108,0.08);">'
        + '</div>'
        + '<div id="q-client-results" style="display:none;position:relative;z-index:10;margin-bottom:10px;"></div>';

      // Recent client pills (quick-pick)
      if (_recentClients.length > 0) {
        html += '<div style="font-size:11px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;">Recent</div>'
          + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">';
        _recentClients.forEach(function(c) {
          var initials = (c.name || '?').split(/\s+/).slice(0,2).map(function(w){return w.charAt(0).toUpperCase();}).join('');
          html += '<button type="button" onclick="QuotesPage._selectClient(\'' + c.id + '\',\'' + UI.esc(c.name).replace(/'/g,"\\'") + '\')" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--white);border:1px solid var(--border);border-radius:20px;font-size:13px;cursor:pointer;font-weight:500;">'
            + '<span style="width:22px;height:22px;border-radius:50%;background:var(--green-bg);color:var(--green-dark);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">' + initials + '</span>'
            + UI.esc(c.name)
            + '</button>';
        });
        html += '</div>';
      }

      // New client CTA
      html += '<button type="button" onclick="QuotesPage._promptNewClient()" style="width:100%;padding:12px;background:#fff;color:var(--green-dark);border:2px dashed var(--green-light);border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">+ Create New Client</button>';
    }

    // Description lives inside the client box
    html += '<div class="form-group" style="margin-top:12px;margin-bottom:0;">'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Description (for client-facing quote)</label>'
      + '<textarea id="q-description" rows="2" placeholder="e.g., Tree removal - 2 oaks" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;font-family:inherit;resize:vertical;">' + UI.esc(_qDesc) + '</textarea>'
      + (_qDesc ? '<div style="font-size:11px;color:var(--text-light);margin-top:3px;">Auto-filled from request</div>' : '')
      + '</div>'
    + '</div>' // close q-client-body
    + '</div>'; // close q-client-box

    // ═══ STEP 1: Per Tree/Task ═══
    var tmData = q.timeMaterial || {};

    // Progressive disclosure: for NEW quotes, hide line items until client is picked.
    // Existing quotes skip the gate (they already have a client).
    var hasClient = !!(q && q.id) || (client && client.id);
    var gateDisplay = hasClient ? 'block' : 'none';
    if (!hasClient) {
      html += '<div id="q-pick-client-first" style="margin:16px 0;padding:16px;background:#fef9c3;border:1px dashed #eab308;border-radius:10px;text-align:center;font-size:13px;color:#854d0e;">'
        +   '👆 Pick or create a client above to start adding trees.'
        + '</div>';
    }

    html += '<div id="q-items-section" style="margin:16px 0;display:' + gateDisplay + ';">'
      + '<div style="font-size:15px;font-weight:800;margin-bottom:4px;">Line Items</div>'
      + '<p style="font-size:12px;color:var(--text-light);margin-bottom:12px;">Take or upload a photo — AI identifies species, DBH, condition, and suggests service + price.</p>';

    // Three-button action row: Add Tree (photo+AI) | Measure | Manual
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">'
      + '<button type="button" onclick="QuotesPage._addPhotoFirst()" style="padding:14px 8px;background:var(--green-dark);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">'
      +   '📷 Add Tree Photo'
      + '</button>'
      + '<button type="button" onclick="QuotesPage._openTreeMeasure()" style="padding:14px 8px;background:#fff;color:var(--text);border:2px solid var(--border);border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;" title="Measure DBH or height">'
      +   '📏 Measure'
      + '</button>'
      + '<button type="button" onclick="QuotesPage.addItem()" style="padding:14px 8px;background:#fff;color:var(--text);border:2px solid var(--border);border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;" title="Enter manually without photo">'
      +   '✍️ Manual'
      + '</button>'
      + '</div>';

    // Line items (with photo thumbnails)
    html += '<div id="q-items">';
    // Render all items COLLAPSED by default (user opens one as needed)
    items.forEach(function(item, i) {
      html += QuotesPage._itemRow(i, item, services, /*expanded=*/ false);
    });
    html += '</div>'
      // Duplicate 'Add Another Tree' + 'Manual' row removed — top 3 buttons cover it
      + '<div id="q-pertree-total" style="margin-top:12px;text-align:right;font-size:15px;font-weight:700;color:var(--green-dark);"></div>'
      + '</div>';

    // ═══ EQUIPMENT ON THIS JOB — open Property Map to place equipment; ticked auto-sync ═══
    // Hidden checkboxes below track which pieces are "on the job" (T&M reads them).
    // User interacts via PropertyMap — dropping a pin auto-ticks the matching checkbox.
    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:16px;margin-top:14px;margin-bottom:14px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:10px;">'
      +   '<div>'
      +     '<div style="font-size:14px;font-weight:800;">🛠 Equipment on this job</div>'
      +     '<div style="font-size:12px;color:var(--text-light);margin-top:2px;">Plan your job site on the satellite map — placed equipment auto-counts into the T&M total.</div>'
      +   '</div>'
      +   '<button type="button" onclick="QuotesPage._openEquipmentMap()" style="background:var(--green-dark);color:#fff;border:none;padding:10px 18px;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap;">🗺 Open Equipment Map →</button>'
      + '</div>'
      + '<div id="q-equip-summary" style="font-size:13px;color:var(--text-light);padding:10px 12px;background:var(--bg);border-radius:8px;">'
      +   (function() {
          var picked = ['bucket','chipper','crane','stumpGrinder','miniSkid','dumpTruck','liftLadder','trailer'].filter(function(k){return tmData[k];});
          return picked.length
            ? '✓ ' + picked.length + ' piece(s) planned'
            : 'No equipment planned yet. Open the map to drag what you\'ll bring.';
        })()
      + '</div>'
      // Hidden checkboxes — still wired as the source of truth for T&M cost
      + '<div style="display:none;">'
      +   QuotesPage._tmEquipPill('bucket', 'Bucket truck', 75, tmData)
      +   QuotesPage._tmEquipPill('chipper', 'Chipper', 44, tmData)
      +   QuotesPage._tmEquipPill('crane', 'Crane', 200, tmData)
      +   QuotesPage._tmEquipPill('stumpGrinder', 'Stump grinder', 50, tmData)
      +   QuotesPage._tmEquipPill('miniSkid', 'Mini-skid', 60, tmData)
      +   QuotesPage._tmEquipPill('dumpTruck', 'Dump truck', 40, tmData)
      +   QuotesPage._tmEquipPill('liftLadder', 'Man lift', 60, tmData)
      +   QuotesPage._tmEquipPill('trailer', 'Trailer', 25, tmData)
      + '</div>'
      + '</div>';

    // Total display with tax breakdown (Jobber style)
    var _qSubtotal = 0;
    (q.lineItems || []).forEach(function(it) { _qSubtotal += (it.qty || 1) * (it.rate || 0); });
    var _qTaxRate = (q.taxRate !== undefined ? q.taxRate : (parseFloat(localStorage.getItem('bm-tax-rate')) || 8.375));
    var _qTaxAmt = Math.round(_qSubtotal * _qTaxRate / 100 * 100) / 100;
    var _qGrandTotal = _qSubtotal + _qTaxAmt;
    html += '<div style="margin-top:16px;background:var(--bg);border:1px solid var(--border);border-radius:10px;overflow:hidden;">'
      + '<div style="padding:10px 16px;display:flex;justify-content:space-between;align-items:center;font-size:13px;border-bottom:1px solid var(--border);">'
      + '<span style="color:var(--text-light);">Subtotal</span><span id="q-subtotal-display" style="font-weight:600;">' + UI.money(_qSubtotal) + '</span>'
      + '</div>'
      + '<div style="padding:10px 16px;display:flex;justify-content:space-between;align-items:center;font-size:13px;border-bottom:1px solid var(--border);">'
      + '<span style="color:var(--text-light);">Tax (' + _qTaxRate + '%)</span><input type="hidden" id="q-tax-rate" value="' + _qTaxRate + '">'
      + '<span id="q-tax-display" style="font-weight:600;">' + UI.money(_qTaxAmt) + '</span>'
      + '</div>'
      + '<div style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;background:var(--green-dark);color:var(--white);">'
      + '<span style="font-weight:600;">Total</span>'
      + '<span id="q-total-display" style="font-size:1.5rem;font-weight:800;">' + UI.money(_qGrandTotal) + '</span>'
      + '</div>'
      // Est. Profit Margin row removed — T&M price check already shows cost vs line-item spread
      + '</div>';

    // Property Map moved to Step 2

    html += UI.formField('Internal Notes', 'textarea', 'q-notes', q.notes, { placeholder: 'Notes (not shown to client)' });

    // Expiry
    html += '<div style="margin-bottom:16px;">'
      + '<input type="hidden" id="q-expires" value="' + (q.expiresAt ? q.expiresAt.substring(0,10) : new Date(Date.now() + 30*86400000).toISOString().substring(0,10)) + '">'
      + '<div style="font-size:11px;color:var(--text-light);">Quote valid for 30 days.</div>'
      + '</div>';

    // ═══ MODE 2: Time & Materials sanity check (hidden until user clicks "Price-check this quote") ═══
    html += '<div style="margin:20px 0 12px;padding:14px;background:#f5f3ff;border:1px dashed #c4b5fd;border-radius:10px;">'
      +   '<div style="font-size:13px;font-weight:700;color:#5b21b6;margin-bottom:4px;">💡 Price Check (Mode 2 — Time & Materials)</div>'
      +   '<div style="font-size:12px;color:#6d28d9;margin-bottom:10px;">Sanity-check your line-item quote against what the job would cost billed hourly. <strong>Your line-item total should be HIGHER than T&M.</strong></div>'
      +   '<button type="button" id="q-show-tm-btn" onclick="document.getElementById(\'q-mode-tm\').style.display=\'block\';this.style.display=\'none\';document.getElementById(\'q-mode-tm\').scrollIntoView({behavior:\'smooth\'});" style="width:100%;padding:12px;background:#7c3aed;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;' + (tmData.totalHrs ? 'display:none;' : '') + '">📊 Run T&M Price Check</button>'
      + '</div>';

    html += '<div id="q-mode-tm" style="display:' + (tmData.totalHrs ? 'block' : 'none') + ';border:2px solid #7c3aed;border-radius:10px;padding:16px;margin-bottom:12px;">'
      + '<div style="font-size:15px;font-weight:800;margin-bottom:4px;">Production Estimate (T&M)</div>'
      + '<p style="font-size:12px;color:var(--text-light);margin-bottom:16px;">Enter total job hours, then pick the equipment and crew you\'ll use.</p>'

      // ═══ STEP 1 — Total job hours (big, prominent) ═══
      // ═══ STEP 1 — Crew (how many + roles) ═══
      + '<div style="background:var(--bg);border-radius:10px;padding:14px;margin-bottom:14px;">'
      +   '<label style="font-size:12px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:8px;">Step 1 — Crew needed</label>'
      +   '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;">'
      +     '<div><label style="font-size:11px;color:var(--text-light);display:block;margin-bottom:2px;"># Climbers <span style="color:#94a3b8;">($50/hr)</span></label>'
      +       '<input type="number" id="q-tm-climber-count" value="' + (tmData.climberCount || '') + '" placeholder="0" min="0" step="1" oninput="QuotesPage._calcTM()" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;font-size:14px;"></div>'
      +     '<div><label style="font-size:11px;color:var(--text-light);display:block;margin-bottom:2px;"># Groundsmen <span style="color:#94a3b8;">($30/hr)</span></label>'
      +       '<input type="number" id="q-tm-ground-count" value="' + (tmData.groundCount || '') + '" placeholder="0" min="0" step="1" oninput="QuotesPage._calcTM()" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;font-size:14px;"></div>'
      +     '<div><label style="font-size:11px;color:var(--text-light);display:block;margin-bottom:2px;"># Foreman <span style="color:#94a3b8;">($60/hr)</span></label>'
      +       '<input type="number" id="q-tm-foreman-count" value="' + (tmData.foremanCount || '') + '" placeholder="0" min="0" step="1" oninput="QuotesPage._calcTM()" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;font-size:14px;"></div>'
      +   '</div>'
      + '</div>'

      // Equipment section removed here — now lives above the Totals card, outside T&M.
      // T&M reads the same #q-tm-* checkboxes to compute cost.

      // ═══ STEP 2 — Job hours ═══
      + '<div style="background:var(--bg);border-radius:10px;padding:14px;margin-bottom:14px;">'
      +   '<label style="font-size:12px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:6px;">Step 2 — Job hours</label>'
      +   '<div style="display:flex;align-items:center;gap:10px;">'
      +     '<input type="number" id="q-tm-total-hrs" value="' + (tmData.totalHrs || '') + '" placeholder="0" min="0" step="0.5" oninput="QuotesPage._calcTM()" style="flex:1;padding:14px;border:2px solid var(--border);border-radius:8px;font-size:22px;font-weight:700;text-align:center;">'
      +     '<span style="font-size:14px;color:var(--text-light);font-weight:600;">hrs on site</span>'
      +   '</div>'
      +   '<div style="font-size:11px;color:var(--text-light);margin-top:6px;">Each crew member + equipment piece multiplies by these hours.</div>'
      + '</div>'

      // ═══ STEP 3 — Disposal (optional) ═══
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:0 2px;">'
      +   '<label style="font-size:12px;color:var(--text-light);font-weight:600;flex-shrink:0;">Step 3 — Dump / disposal fee:</label>'
      +   '<input type="number" id="q-tm-disposal" value="' + (tmData.disposal || '') + '" placeholder="0" min="0" oninput="QuotesPage._calcTM()" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:14px;">'
      +   '<span style="font-size:12px;color:var(--text-light);">$</span>'
      + '</div>'

      // T&M Total
      + '<div id="q-tm-breakdown" style="background:var(--bg);border-radius:8px;padding:12px;font-size:13px;"></div>'
      + '<div id="q-tm-total" style="margin-top:8px;text-align:right;font-size:15px;font-weight:700;color:var(--accent);"></div>'
      + '</div>'

      // Compare button + panel
      + '<button type="button" id="q-compare-btn" onclick="QuotesPage._showPriceComparison()" style="display:none;margin-top:12px;width:100%;padding:14px;background:#7c3aed;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;">📊 Compare Pricing Methods</button>'
      + '<div id="q-comparison" style="display:none;margin-top:12px;background:#f5f3ff;border:2px solid #c4b5fd;border-radius:10px;padding:16px;"></div>'

      + '</form>';

    // Render as full page (not modal)
    var pageHtml = '<div style="max-width:680px;margin:0 auto;padding-bottom:80px;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">'
      + '<button class="btn btn-outline" onclick="loadPage(\'quotes\')" style="font-size:13px;">← Back to Quotes</button>'
      + '<div style="display:flex;gap:8px;">'
      + '<button class="btn btn-outline" onclick="QuotesPage.saveAs(\'draft\')">Save Draft</button>'
      + '<button class="btn btn-primary" onclick="QuotesPage.saveAs(\'sent\')">Save & Send</button>'
      + '</div></div>'
      + '<h2 style="font-size:20px;margin-bottom:16px;">' + (quoteId ? 'Edit Quote #' + q.quoteNumber : 'New Quote') + '</h2>'
      + html
      + '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">'
      + '<button class="btn btn-outline" onclick="loadPage(\'quotes\')">Cancel</button>'
      + '<button class="btn btn-outline" onclick="QuotesPage.saveAs(\'draft\')">Save Draft</button>'
      + '<button class="btn btn-primary" onclick="QuotesPage.saveAs(\'sent\')">Save & Send</button>'
      + '</div></div>';

    var content = document.getElementById('pageContent');
    if (content) content.innerHTML = pageHtml;

    // ── AUTO-SAVE FAILSAFE ──
    // Save form state every 15 seconds + on every input change
    // Restores if app crashes, loses service, or accidentally navigates away
    QuotesPage._autoSaveKey = 'bm-quote-autosave-' + (quoteId || 'new');
    QuotesPage._autoSaveTimer = setInterval(function() { QuotesPage._autoSave(); }, 15000);

    // Save on any input change
    var form = document.getElementById('quote-form');
    if (form) {
      form.addEventListener('input', function() {
        clearTimeout(QuotesPage._autoSaveDebounce);
        QuotesPage._autoSaveDebounce = setTimeout(function() { QuotesPage._autoSave(); }, 2000);
      });
    }

    // Warn before leaving page with unsaved changes
    window._quoteFormDirty = false;
    if (form) form.addEventListener('input', function() { window._quoteFormDirty = true; });
    window.addEventListener('beforeunload', QuotesPage._beforeUnload);

    // Check for recovered draft
    var recovered = localStorage.getItem(QuotesPage._autoSaveKey);
    if (recovered && !quoteId) {
      try {
        var rd = JSON.parse(recovered);
        if (rd.clientName || (rd.lineItems && rd.lineItems.length > 0 && rd.lineItems[0].service)) {
          var banner = document.createElement('div');
          banner.id = 'q-recovery-banner';
          banner.style.cssText = 'background:#fff3e0;border:1px solid #ffe0b2;border-radius:8px;padding:12px 16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;';
          banner.innerHTML = '<div><strong style="color:#e65100;">📋 Recovered draft</strong><span style="font-size:13px;color:var(--text-light);margin-left:8px;">' + (rd.clientName || 'Unsaved quote') + ' — ' + new Date(rd.savedAt).toLocaleTimeString() + '</span></div>'
            + '<div style="display:flex;gap:6px;">'
            + '<button onclick="QuotesPage._restoreAutoSave()" class="btn btn-primary" style="font-size:12px;padding:4px 12px;">Restore</button>'
            + '<button onclick="this.parentElement.parentElement.remove();localStorage.removeItem(\'' + QuotesPage._autoSaveKey + '\')" class="btn btn-outline" style="font-size:12px;padding:4px 12px;">Discard</button>'
            + '</div>';
          var formEl = document.getElementById('quote-form');
          if (formEl) formEl.parentElement.insertBefore(banner, formEl);
        }
      } catch(e) {}
    }
  },

  _autoSave: function() {
    var form = document.getElementById('quote-form');
    if (!form) return;
    // Client name comes from the search box (while picking) OR the summary
    // label inside the collapsible client box (after picking).
    var cid = (document.getElementById('q-clientId') || {}).value || '';
    var cname = (document.getElementById('q-client-search') || {}).value || '';
    if (!cname && cid) {
      var sumEl = document.querySelector('.q-client-summary-name');
      if (sumEl) cname = sumEl.textContent || '';
      if (!cname && typeof DB !== 'undefined' && DB.clients) {
        var cc = DB.clients.getById(cid);
        if (cc) cname = cc.name || '';
      }
    }
    var data = {
      savedAt: new Date().toISOString(),
      clientId: cid,
      clientName: cname,
      property: (document.getElementById('q-property') || {}).value || '',
      description: (document.getElementById('q-description') || {}).value || '',
      notes: (document.getElementById('q-notes') || {}).value || '',
      lineItems: []
    };
    document.querySelectorAll('.quote-item-row').forEach(function(row) {
      var photos = [];
      if (row.dataset.photos) { try { photos = JSON.parse(row.dataset.photos); } catch(e){} }
      else if (row.dataset.photo) { photos = [row.dataset.photo]; }
      var wrap = row.closest('.q-item-wrap');
      data.lineItems.push({
        species: (wrap && wrap.querySelector('.q-item-species') || {}).value || '',
        location: (wrap && wrap.querySelector('.q-item-location') || {}).value || '',
        service: (row.querySelector('.q-item-service') || {}).value || '',
        description: (row.querySelector('.q-item-desc') || {}).value || '',
        qty: (row.querySelector('.q-item-qty') || {}).value || '1',
        rate: (row.querySelector('.q-item-rate') || {}).value || '',
        photos: photos,
        photo: photos[0] || ''
      });
    });
    try {
      localStorage.setItem(QuotesPage._autoSaveKey, JSON.stringify(data));
    } catch(e) {}
  },

  _restoreAutoSave: function() {
    // Remove the banner FIRST so it's gone no matter what happens below
    var banner = document.getElementById('q-recovery-banner');
    if (banner) banner.remove();
    try {
      var data = JSON.parse(localStorage.getItem(QuotesPage._autoSaveKey));
      if (!data) { UI.toast('Nothing to restore', 'error'); return; }

      // If a client was previously picked, trigger the full _selectClient flow so
      // the gate lifts and the Line Items section appears. Otherwise just fill the
      // search field so the user can re-pick.
      if (data.clientId) {
        QuotesPage._selectClient(data.clientId, data.clientName || '');
      } else if (data.clientName) {
        var cs = document.getElementById('q-client-search');
        if (cs) cs.value = data.clientName;
      }
      var prop = document.getElementById('q-property');
      if (prop && data.property) prop.value = data.property;
      var desc = document.getElementById('q-description');
      if (desc && data.description) desc.value = data.description;
      var notes = document.getElementById('q-notes');
      if (notes && data.notes) notes.value = data.notes;

      // Line items — populate even if hidden, they render once section unhides
      if (data.lineItems && data.lineItems.length > 0) {
        // Clear existing items container first
        var container = document.getElementById('q-items');
        if (container) container.innerHTML = '';
        var services = (typeof DB !== 'undefined' && DB.services) ? DB.services.getAll() : [];
        data.lineItems.forEach(function(li, i) {
          // Render via _itemRow so species + location + photos all come back
          var tmp = document.createElement('div');
          tmp.innerHTML = QuotesPage._itemRow(i, li, services, /*expanded=*/ i === data.lineItems.length - 1);
          var newWrap = tmp.firstChild;
          if (newWrap && container) {
            container.appendChild(newWrap);
            // Rehydrate photos onto the row's dataset so they persist through save
            var row = newWrap.querySelector('.quote-item-row');
            if (row) {
              if (li.photos && li.photos.length) row.dataset.photos = JSON.stringify(li.photos);
              if (li.photo) row.dataset.photo = li.photo;
            }
          }
        });
        QuotesPage.calcTotal();
      }

      // Remove recovery banner — try class first, then text fallback
      var banner = document.getElementById('q-recovery-banner');
      if (banner) banner.remove();
      document.querySelectorAll('div').forEach(function(b) {
        if (b.textContent && b.textContent.indexOf('Recovered draft') >= 0 && b.querySelector('button[onclick*="_restoreAutoSave"]')) {
          b.remove();
        }
      });
      UI.toast('Draft restored ✅');
    } catch(e) {
      console.error('restore error', e);
      UI.toast('Could not restore draft: ' + (e.message || e), 'error');
    }
  },

  _beforeUnload: function(e) {
    if (window._quoteFormDirty) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes on this quote. Are you sure you want to leave?';
    }
  },

  _clearAutoSave: function() {
    if (QuotesPage._autoSaveTimer) clearInterval(QuotesPage._autoSaveTimer);
    if (QuotesPage._autoSaveKey) localStorage.removeItem(QuotesPage._autoSaveKey);
    window._quoteFormDirty = false;
    window.removeEventListener('beforeunload', QuotesPage._beforeUnload);
  },

  // Default rates for common services (editable in settings)
  _defaultRates: {
    'Tree Removal': 0, 'Tree Pruning': 0, 'Stump Removal': 150, 'Bucket Truck': 600,
    'Cabling': 300, 'Land Clearing': 0, 'Snow Removal': 0, 'Chipping Brush': 350,
    'Haul Debris': 250, 'Labor': 400, 'Gutter Clean Out': 150, 'Arborist Letter': 350,
    'Firewood Cord': 400, 'Firewood Bundle': 10, 'Free Woodchips': 0, 'Free Estimate': 0
  },

  _itemRow: function(index, item, services, expanded) {
    QuotesPage._dataListOnce(services);
    var lineTotal = ((item.qty || 1) * (item.rate || 0));
    if (typeof expanded === 'undefined') expanded = true;
    var photos = Array.isArray(item.photos) ? item.photos : (item.photo ? [item.photo] : []);
    var photoStr = photos.length ? ' data-photos=\'' + JSON.stringify(photos).replace(/'/g,'&#39;') + '\'' : '';
    var hasContent = !!(item.service || item.description || item.rate);

    // Photo grid (shown in both collapsed + expanded modes)
    var photoHtml = '';
    if (photos.length) {
      photoHtml = '<div class="q-photo-grid" style="display:grid;grid-template-columns:repeat(' + Math.min(photos.length, 3) + ',1fr);gap:4px;margin-bottom:10px;">';
      photos.forEach(function(p, pi) {
        photoHtml += '<img src="' + p + '" onclick="event.stopPropagation();QuotesPage._openLightbox(' + JSON.stringify(photos).replace(/"/g, '&quot;') + ',' + pi + ')" style="width:100%;height:80px;object-fit:cover;border-radius:6px;border:1px solid var(--border);cursor:pointer;">';
      });
      if (photos.length > 3) photoHtml += '<div style="grid-column:1/-1;font-size:11px;color:var(--text-light);text-align:center;">+' + (photos.length - 3) + ' more — tap any photo to view</div>';
      photoHtml += '</div>';
    }

    // Summary strip: photo + species (AI-filled, extracted from description) + price + chevron
    // Species = the part of description BEFORE the first " — " (e.g. "White Oak" from
    // "White Oak — 22\" DBH — 45' tall — Good — healthy form")
    var summaryThumb = photos.length ? '<img src="' + photos[0] + '" style="width:40px;height:40px;object-fit:cover;border-radius:6px;flex-shrink:0;">' : '<div style="width:40px;height:40px;background:var(--bg);border:1px dashed var(--border);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--text-light);font-size:16px;flex-shrink:0;">🌳</div>';
    var titleText;
    if (!hasContent) {
      titleText = 'New tree — fill below';
    } else if (item.species) {
      titleText = UI.esc(item.species);
    } else if (item.description && item.description.indexOf(' — ') > 0) {
      titleText = UI.esc(item.description.split(' — ')[0]);
    } else {
      titleText = UI.esc(item.service || item.description || 'Tree');
    }
    var summary = '<div class="q-item-header" onclick="QuotesPage._toggleItem(this)" style="display:flex;align-items:center;gap:10px;cursor:pointer;">'
      + summaryThumb
      + '<div class="q-item-summary-title" style="flex:1;min-width:0;font-size:14px;font-weight:600;color:' + (hasContent ? 'var(--text)' : 'var(--text-light)') + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + titleText + '</div>'
      + '<div class="q-item-summary-total" style="font-size:15px;font-weight:700;color:var(--green-dark);flex-shrink:0;">' + UI.money(lineTotal) + '</div>'
      + '<div class="q-item-chevron" style="font-size:16px;color:var(--text-light);transition:transform .2s;' + (expanded ? '' : 'transform:rotate(-90deg);') + '">▾</div>'
      + '</div>';

    // Pricing formula hint — shows under rate if the service has a known formula
    // Computed client-side from description (DBH auto-extraction) when possible
    var formulaHint = '<div class="q-item-formula" style="font-size:11px;color:var(--text-light);margin-top:4px;"></div>';

    // Expanded form body (hidden when collapsed)
    var body = '<div class="q-item-body" style="margin-top:12px;' + (expanded ? '' : 'display:none;') + '">'
      + photoHtml
      // Species + Location row (displayed prominently at top so user can tag where tree is)
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">'
      +   '<div class="form-group" style="margin:0;"><label style="font-size:11px;font-weight:600;">Species (AI-filled)</label><input class="q-item-species" value="' + UI.esc(item.species || '') + '" placeholder="e.g. White Oak" oninput="QuotesPage._syncSummary(this)" style="font-size:13px;"></div>'
      +   '<div class="form-group" style="margin:0;"><label style="font-size:11px;font-weight:600;">Location on property</label><input class="q-item-location" value="' + UI.esc(item.location || '') + '" placeholder="e.g. back yard near pool" oninput="QuotesPage._syncSummary(this)" style="font-size:13px;"></div>'
      + '</div>'
      + '<div class="quote-item-row" style="display:grid;grid-template-columns:2fr 2fr 60px 90px 80px 36px;gap:8px;align-items:end;"' + photoStr + '>'
      +   '<div class="form-group" style="margin:0;"><label style="font-size:11px;font-weight:600;">Service</label>'
      +     '<input class="q-item-service" list="q-svc-datalist" value="' + UI.esc(item.service || '') + '" placeholder="Type or pick…" onchange="QuotesPage._onServiceChange(this)" oninput="QuotesPage._syncSummary(this)" style="font-size:13px;">'
      +   '</div>'
      +   '<div class="form-group" style="margin:0;"><label style="font-size:11px;font-weight:600;">Description</label><input class="q-item-desc" value="' + UI.esc(item.description || '') + '" placeholder="Work details..." oninput="QuotesPage._syncSummary(this);QuotesPage._updateFormula(this)" style="font-size:13px;"></div>'
      +   '<div class="form-group" style="margin:0;"><label style="font-size:11px;font-weight:600;">Qty</label><input type="number" class="q-item-qty" value="' + (item.qty || 1) + '" min="1" oninput="QuotesPage.calcTotal();QuotesPage._syncSummary(this)" style="font-size:13px;text-align:center;"></div>'
      +   '<div class="form-group" style="margin:0;"><label style="font-size:11px;font-weight:600;">Rate ($)</label><input type="number" class="q-item-rate" value="' + (item.rate || '') + '" step="0.01" placeholder="0.00" oninput="QuotesPage.calcTotal();QuotesPage._syncSummary(this)" style="font-size:13px;">'
      +     formulaHint + '</div>'
      +   '<div class="form-group" style="margin:0;"><label style="font-size:11px;font-weight:600;">Amount</label><div class="q-item-amount" style="font-size:14px;font-weight:700;color:var(--green-dark);padding:8px 0;">' + UI.money(lineTotal) + '</div></div>'
      +   '<button type="button" style="background:none;border:none;font-size:20px;color:var(--red);cursor:pointer;padding-bottom:8px;opacity:.6;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.6" onclick="this.closest(\'.q-item-wrap\').remove();QuotesPage.calcTotal();">✕</button>'
      + '</div>'
      + '<div style="margin-top:10px;display:flex;gap:6px;justify-content:flex-start;flex-wrap:wrap;">'
      +   '<button type="button" onclick="QuotesPage._addMorePhotos(this)" style="padding:8px 12px;background:#fff;color:var(--text);border:1px solid var(--border);border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">📷 Add Photos</button>'
      +   '<button type="button" onclick="QuotesPage._runAIOnRow(this)" style="padding:8px 12px;background:#fff;color:#7c3aed;border:1px solid #c4b5fd;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;" title="Let Claude fill species, DBH, condition, rate">🤖 Run AI</button>'
      +   '<button type="button" onclick="QuotesPage._plantNetSecondOpinion(this)" style="padding:8px 12px;background:#fff;color:#15803d;border:1px solid #bbf7d0;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;" title="Verify species with PlantNet (second opinion)">🌿 2nd</button>'
      +   '<button type="button" onclick="QuotesPage._openMeasureModal(this)" style="padding:8px 12px;background:#fff;color:var(--text);border:1px solid var(--border);border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">📏 Measure</button>'
      +   '<button type="button" onclick="QuotesPage._collapseRow(this)" style="padding:8px 14px;background:var(--green-dark);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;margin-left:auto;">✓ Done</button>'
      + '</div>'
      + '</div>';

    return '<div class="q-item-wrap" data-index="' + index + '" style="margin-bottom:10px;padding:12px 14px;background:var(--white);border-radius:12px;border:1px solid var(--border);box-shadow:0 1px 3px rgba(0,0,0,0.04);">'
      + summary
      + body
      + '</div>';
  },

  // Toggle expand/collapse on a line item when user taps the summary header
  _toggleItem: function(headerEl) {
    var wrap = headerEl.closest('.q-item-wrap');
    var body = wrap.querySelector('.q-item-body');
    var chev = wrap.querySelector('.q-item-chevron');
    if (!body) return;
    var collapsed = body.style.display === 'none';
    body.style.display = collapsed ? 'block' : 'none';
    if (chev) chev.style.transform = collapsed ? 'rotate(0deg)' : 'rotate(-90deg)';
  },

  // Programmatically collapse the current row (called by "Done with this tree" button)
  _collapseRow: function(btn) {
    var wrap = btn.closest('.q-item-wrap');
    var body = wrap.querySelector('.q-item-body');
    var chev = wrap.querySelector('.q-item-chevron');
    if (body) body.style.display = 'none';
    if (chev) chev.style.transform = 'rotate(-90deg)';
    // Flash confirmation
    wrap.style.transition = 'background .25s'; wrap.style.background = '#dcfce7';
    setTimeout(function() { wrap.style.background = 'var(--bg)'; }, 400);
  },

  // Sync the compact summary text when inputs change (live feedback)
  _syncSummary: function(input) {
    var wrap = input.closest('.q-item-wrap'); if (!wrap) return;
    var species = (wrap.querySelector('.q-item-species') || {}).value || '';
    var location = (wrap.querySelector('.q-item-location') || {}).value || '';
    var svc = (wrap.querySelector('.q-item-service') || {}).value || '';
    var desc = (wrap.querySelector('.q-item-desc') || {}).value || '';
    var qty = parseFloat((wrap.querySelector('.q-item-qty') || {}).value) || 1;
    var rate = parseFloat((wrap.querySelector('.q-item-rate') || {}).value) || 0;
    var title = wrap.querySelector('.q-item-summary-title');
    var total = wrap.querySelector('.q-item-summary-total');
    if (title) {
      // Species · location  (fall back to service/description if species not set yet)
      var left = species || (desc && desc.indexOf(' — ') > 0 ? desc.split(' — ')[0] : '') || svc || 'Tree';
      title.innerHTML = '<span>' + UI.esc(left) + '</span>' + (location ? '<span style="color:var(--text-light);font-weight:500;"> · ' + UI.esc(location) + '</span>' : '');
      title.style.color = 'var(--text)';
    }
    if (total) total.textContent = UI.money(qty * rate);
  },

  // Show a formula hint under the rate input when description mentions DBH inches
  _updateFormula: function(descInput) {
    var wrap = descInput.closest('.q-item-wrap'); if (!wrap) return;
    var hint = wrap.querySelector('.q-item-formula');
    var svc = (wrap.querySelector('.q-item-service') || {}).value || '';
    var desc = descInput.value || '';
    var dbhMatch = desc.match(/(\d+(?:\.\d+)?)\s*["']?\s*DBH/i) || desc.match(/(\d+(?:\.\d+)?)\s*["']\s*/);
    if (!hint) return;
    if (dbhMatch && /removal/i.test(svc)) {
      var dbh = parseFloat(dbhMatch[1]);
      var suggested = Math.round(dbh * 100 / 50) * 50;
      hint.innerHTML = '💡 ' + dbh + '" × $100 = <strong>$' + suggested + '</strong> — <a onclick="event.preventDefault();var r=this.closest(\'.quote-item-row\').querySelector(\'.q-item-rate\');r.value=' + suggested + ';QuotesPage.calcTotal();QuotesPage._syncSummary(r);" style="color:var(--accent);cursor:pointer;text-decoration:underline;" href="#">use</a>';
    } else {
      hint.innerHTML = '';
    }
  },

  // Fullscreen photo lightbox with swipe between images
  _openLightbox: function(photos, startIdx) {
    var idx = startIdx || 0;
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:flex;align-items:center;justify-content:center;touch-action:pan-y;';
    overlay.innerHTML = '<img id="lb-img" src="' + photos[idx] + '" style="max-width:96vw;max-height:90vh;object-fit:contain;border-radius:8px;">'
      + '<div style="position:absolute;top:20px;right:20px;font-size:28px;color:#fff;cursor:pointer;" onclick="this.parentElement.remove()">×</div>'
      + (photos.length > 1 ? '<div id="lb-count" style="position:absolute;bottom:24px;left:50%;transform:translateX(-50%);color:#fff;font-size:13px;background:rgba(0,0,0,.5);padding:6px 14px;border-radius:12px;">' + (idx+1) + ' / ' + photos.length + '</div>' : '');
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    // Swipe left/right
    var startX = 0;
    overlay.addEventListener('touchstart', function(e) { startX = e.touches[0].clientX; }, { passive: true });
    overlay.addEventListener('touchend', function(e) {
      var dx = (e.changedTouches[0].clientX - startX);
      if (Math.abs(dx) < 40) return;
      if (dx < 0 && idx < photos.length - 1) idx++;
      else if (dx > 0 && idx > 0) idx--;
      document.getElementById('lb-img').src = photos[idx];
      var c = document.getElementById('lb-count'); if (c) c.textContent = (idx+1) + ' / ' + photos.length;
    });
    document.body.appendChild(overlay);
  },

  // Manually trigger AI on an already-uploaded tree row (works even when auto-AI is off,
  // useful after a failed attempt or when service is bad)
  _runAIOnRow: function(btn) {
    var wrap = btn.closest('.q-item-wrap');
    if (!wrap) return;
    var row = wrap.querySelector('.quote-item-row');
    var photos = [];
    if (row && row.dataset.photos) { try { photos = JSON.parse(row.dataset.photos); } catch(e){} }
    else if (row && row.dataset.photo) { photos = [row.dataset.photo]; }
    if (!photos.length) { UI.toast('Upload a photo first, then tap 🤖 Run AI', 'error'); return; }
    var rows = document.querySelectorAll('.quote-item-row');
    var idx = Array.prototype.indexOf.call(rows, row);
    QuotesPage._identifyTree(photos, idx);
  },

  // Add more photos to an existing line item (appends to dataset.photos array)
  _addMorePhotos: function(btn) {
    var wrap = btn.closest('.q-item-wrap');
    if (!wrap) return;
    var row = wrap.querySelector('.quote-item-row');
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = function(e) {
      var files = Array.from(e.target.files || []);
      if (!files.length) return;
      Promise.all(files.map(function(f) {
        return new Promise(function(resolve) {
          var r = new FileReader();
          r.onload = function(ev) { resolve(ev.target.result); };
          r.readAsDataURL(f);
        });
      })).then(function(newUrls) {
        var existing = [];
        if (row.dataset.photos) { try { existing = JSON.parse(row.dataset.photos); } catch(e){} }
        else if (row.dataset.photo) { existing = [row.dataset.photo]; }
        var all = existing.concat(newUrls).slice(0, 5); // cap at 5
        row.dataset.photos = JSON.stringify(all);
        row.dataset.photo = all[0];
        // Re-render the photo grid in the body
        var body = wrap.querySelector('.q-item-body');
        var existingGrid = body ? body.querySelector('.q-photo-grid') : null;
        if (existingGrid) existingGrid.remove();
        var grid = document.createElement('div');
        grid.className = 'q-photo-grid';
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(' + Math.min(all.length, 3) + ',1fr);gap:4px;margin-bottom:10px;';
        grid.innerHTML = all.map(function(u, pi) {
          return '<img src="' + u + '" onclick="event.stopPropagation();QuotesPage._openLightbox(' + JSON.stringify(all).replace(/"/g,'&quot;') + ',' + pi + ')" style="width:100%;height:80px;object-fit:cover;border-radius:6px;border:1px solid var(--border);cursor:pointer;">';
        }).join('') + (all.length > 1 ? '<div style="grid-column:1/-1;font-size:11px;color:var(--text-light);text-align:center;">' + all.length + ' photos</div>' : '');
        if (body) body.insertBefore(grid, body.firstChild);
        UI.toast('📷 ' + newUrls.length + ' more photo(s) added — tap 🤖 Run AI to analyze');
      });
    };
    input.click();
  },

  // Open Property Map in equipment-planning mode; on close, sync placed equipment
  // to the hidden T&M checkboxes so the T&M cost picks up whatever was dropped.
  _openEquipmentMap: function() {
    var address = (document.getElementById('q-property') || {}).value || '';
    if (!address) {
      var clientId = (document.getElementById('q-clientId') || {}).value;
      var c = clientId ? DB.clients.getById(clientId) : null;
      if (c && c.address) address = c.address;
    }
    if (!address) { UI.toast('Add a client + property first so the map knows where to show', 'error'); return; }

    // Register a hook so PropertyMap calls us when its markers array changes/closes.
    window._bmEquipmentMapHook = function(markers) {
      QuotesPage._syncEquipmentFromMap(markers || []);
    };

    if (typeof PropertyMap !== 'undefined' && PropertyMap.show) {
      PropertyMap.show(address, null);
    } else {
      UI.toast('Property map unavailable', 'error');
    }
  },

  // Map the PropertyMap pin IDs onto our T&M equipment checkbox IDs.
  // PropertyMap uses: bucket, chipper, crane, truck, ram, loader, trailer, climber, ground, dropzone, hazard, powerline
  // Our T&M uses:     bucket, chipper, crane, stumpGrinder, miniSkid, dumpTruck, liftLadder, trailer
  _mapMarkerToEquip: {
    'bucket':       'bucket',
    'chipper':      'chipper',
    'crane':        'crane',
    'truck':        'dumpTruck',
    'loader':       'miniSkid',
    'ram':          'dumpTruck',
    'trailer':      'trailer'
    // climber/ground = crew; dropzone/hazard/powerline = markers, no equipment cost
  },

  _syncEquipmentFromMap: function(markers) {
    var present = {};
    (markers || []).forEach(function(m) {
      var equipKey = QuotesPage._mapMarkerToEquip[m.type || m.id];
      if (equipKey) present[equipKey] = true;
    });
    // Tick the corresponding hidden checkboxes (T&M reads them next _calcTM)
    ['bucket','chipper','crane','stumpGrinder','miniSkid','dumpTruck','liftLadder','trailer'].forEach(function(k) {
      var cb = document.getElementById('q-tm-' + k.toLowerCase());
      if (cb) cb.checked = !!present[k];
    });
    // Update the summary line
    var count = Object.keys(present).length;
    var summary = document.getElementById('q-equip-summary');
    if (summary) {
      summary.textContent = count
        ? '✓ ' + count + ' piece(s) planned on the map'
        : 'No equipment planned yet. Open the map to drag what you\'ll bring.';
    }
    QuotesPage._calcTM();
  },

  // PlantNet second-opinion — sends the line item's photos to PlantNet API
  // for a pure species ID. Overwrites/suggests species if different from what
  // Claude picked. Key from Settings: bm-plantnet-key. Sign up: my.plantnet.org
  _plantNetSecondOpinion: function(btn) {
    var wrap = btn.closest('.q-item-wrap');
    if (!wrap) return;
    var row = wrap.querySelector('.quote-item-row');
    var photos = [];
    if (row && row.dataset.photos) { try { photos = JSON.parse(row.dataset.photos); } catch(e){} }
    else if (row && row.dataset.photo) { photos = [row.dataset.photo]; }
    if (!photos.length) { UI.toast('Upload a photo first before asking for a 2nd opinion', 'error'); return; }

    var key = localStorage.getItem('bm-plantnet-key') || '';
    if (!key) {
      key = prompt('Paste your PlantNet API key (free at my.plantnet.org):');
      if (!key) return;
      localStorage.setItem('bm-plantnet-key', key.trim());
    }

    UI.toast('🌿 Getting 2nd opinion from PlantNet…');

    // PlantNet wants multipart/form-data with image files, not base64 JSON.
    // Convert each data URL to a Blob and build FormData.
    var form = new FormData();
    photos.slice(0, 5).forEach(function(dataUrl, i) {
      var parts = dataUrl.split(',');
      var mime = (parts[0].match(/:(.*?);/) || [,'image/jpeg'])[1];
      var bin = atob(parts[1]);
      var buf = new Uint8Array(bin.length);
      for (var j = 0; j < bin.length; j++) buf[j] = bin.charCodeAt(j);
      form.append('images', new Blob([buf], { type: mime }), 'tree' + i + '.jpg');
      form.append('organs', 'auto');
    });

    fetch('https://my-api.plantnet.org/v2/identify/all?api-key=' + encodeURIComponent(key) + '&nb-results=3', {
      method: 'POST',
      body: form
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.statusCode === 404 || data.error) {
        UI.toast('PlantNet: ' + (data.message || data.error || 'no match'), 'error');
        return;
      }
      var results = data.results || [];
      if (!results.length) { UI.toast('PlantNet: no species matched'); return; }
      var top = results[0];
      var common = (top.species && top.species.commonNames && top.species.commonNames[0]) || '';
      var scientific = (top.species && top.species.scientificNameWithoutAuthor) || '';
      var pct = Math.round((top.score || 0) * 100);

      // Build a small popup to confirm replacement — user sees top 3 matches
      var choices = results.slice(0, 3).map(function(res, i) {
        var c = (res.species && res.species.commonNames && res.species.commonNames[0]) || res.species.scientificNameWithoutAuthor || 'Unknown';
        var s = res.species.scientificNameWithoutAuthor || '';
        var p = Math.round((res.score || 0) * 100);
        return '<button type="button" onclick="QuotesPage._applyPlantNetPick(this,\'' + c.replace(/'/g, "\\'") + '\')" style="display:block;width:100%;text-align:left;padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:#fff;cursor:pointer;margin-bottom:6px;font-size:13px;">'
          + '<strong>' + UI.esc(c) + '</strong> <span style="color:var(--text-light);font-size:11px;">(' + p + '% match)</span>'
          + (s ? '<div style="font-size:11px;color:var(--text-light);font-style:italic;">' + UI.esc(s) + '</div>' : '')
          + '</button>';
      }).join('');

      var modal = document.createElement('div');
      modal.id = 'plantnet-popup';
      modal.dataset.wrapId = wrap.dataset.index || '';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
      modal.innerHTML = '<div style="background:#fff;border-radius:12px;padding:20px;max-width:420px;width:100%;" onclick="event.stopPropagation();">'
        + '<h3 style="margin:0 0 8px;">🌿 PlantNet 2nd Opinion</h3>'
        + '<div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">Tap a match to use it as the species.</div>'
        + choices
        + '<button type="button" onclick="document.getElementById(\'plantnet-popup\').remove();" style="width:100%;margin-top:8px;padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;font-size:13px;cursor:pointer;">Cancel</button>'
        + '</div>';
      modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
      // Keep reference to wrap so _applyPlantNetPick can find its species input
      modal._targetWrap = wrap;
      document.body.appendChild(modal);
    })
    .catch(function(e) {
      UI.toast('PlantNet error: ' + (e.message || 'network'), 'error');
    });
  },

  _applyPlantNetPick: function(btn, commonName) {
    var modal = document.getElementById('plantnet-popup');
    var wrap = modal && modal._targetWrap;
    if (!wrap) { if (modal) modal.remove(); return; }
    var speciesEl = wrap.querySelector('.q-item-species');
    if (speciesEl) { speciesEl.value = commonName; QuotesPage._syncSummary(speciesEl); }
    if (modal) modal.remove();
    UI.toast('Species updated to ' + commonName);
  },

  // Tree-measure modal: opens TreeMeasure in an iframe-less inline container + writes back to current row's DBH
  _openMeasureModal: function(btn) {
    var wrap = btn.closest('.q-item-wrap');
    if (!wrap) return;
    // Simple prompt fallback — TreeMeasure page is a full page; embedding it requires refactor
    var current = (wrap.querySelector('.q-item-desc') || {}).value || '';
    var dbh = prompt('DBH (diameter at breast height, inches):', (current.match(/(\d+)\s*["\']?\s*DBH/i) || [,''])[1]);
    if (!dbh || isNaN(parseFloat(dbh))) return;
    var descEl = wrap.querySelector('.q-item-desc');
    var rateEl = wrap.querySelector('.q-item-rate');
    var svc = (wrap.querySelector('.q-item-service') || {}).value || '';
    if (descEl) {
      if (/DBH/i.test(descEl.value)) descEl.value = descEl.value.replace(/\d+\s*["']?\s*DBH/i, dbh + '" DBH');
      else descEl.value = dbh + '" DBH' + (descEl.value ? ' — ' + descEl.value : '');
    }
    // Auto-suggest rate for removal
    if (/removal/i.test(svc) && rateEl && !rateEl.value) {
      rateEl.value = Math.round(parseFloat(dbh) * 100 / 50) * 50;
    }
    QuotesPage.calcTotal();
    QuotesPage._syncSummary(wrap.querySelector('.q-item-desc'));
    QuotesPage._updateFormula(wrap.querySelector('.q-item-desc'));
    UI.toast('DBH set to ' + dbh + '"');
  },

  // Service-specific measurement prompts → auto-price
  _servicePricing: {
    'Tree Removal': { prompt: 'DBH (inches):', unit: 'inch', rate: 100, desc: function(v) { return v + '" DBH tree removal'; } },
    'Stump Removal': { prompt: 'Total stump radius (inches):', unit: 'inch', rate: 10, desc: function(v) { return v + '" radius stump grinding'; } },
    'Cabling': { prompt: 'Cable length (feet):', unit: 'foot', rate: 10, desc: function(v) { return v + '\' cable installation'; } }
  },

  _onServiceChange: function(sel) {
    var row = sel.closest('.quote-item-row');
    var svc = sel.value;
    var rateInput = row.querySelector('.q-item-rate');
    var descInput = row.querySelector('.q-item-desc');

    // Check for measurement-based pricing
    var pricing = QuotesPage._servicePricing[svc];
    if (pricing) {
      var measurement = prompt(pricing.prompt);
      if (measurement && !isNaN(parseFloat(measurement))) {
        var m = parseFloat(measurement);
        var price = Math.round(m * pricing.rate);
        rateInput.value = price;
        if (!descInput.value) descInput.value = pricing.desc(m);
      }
    } else {
      // Use default flat rate if set
      var rate = QuotesPage._defaultRates[svc];
      if (rate && rate > 0) {
        rateInput.value = rate;
      }
    }

    // Auto-fill description from service catalog if still empty
    if (!descInput.value) {
      var services = DB.services.getAll();
      var match = services.find(function(s) { return s.name === svc; });
      if (match && match.description) descInput.value = match.description;
    }
    QuotesPage.calcTotal();
  },

  addItem: function() {
    var container = document.getElementById('q-items');
    var index = container.children.length;
    var services = DB.services.getAll();
    // Auto-collapse any previously-added trees so user can focus on the new one
    container.querySelectorAll('.q-item-wrap .q-item-body').forEach(function(b) { b.style.display = 'none'; });
    container.querySelectorAll('.q-item-wrap .q-item-chevron').forEach(function(c) { c.style.transform = 'rotate(-90deg)'; });
    var div = document.createElement('div');
    div.innerHTML = QuotesPage._itemRow(index, {}, services);
    container.appendChild(div.firstChild);
    // Focus the service input on the new (expanded) item
    var newWrap = container.lastElementChild;
    if (newWrap) {
      var sel = newWrap.querySelector('.q-item-service');
      if (sel) setTimeout(function(){ sel.focus(); }, 50);
      newWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  _toggleDeposit: function(checked) {
    var fields = document.getElementById('q-deposit-fields');
    var preview = document.getElementById('q-deposit-preview');
    var label = document.querySelector('#q-deposit-req + span');
    if (fields) fields.style.display = checked ? 'grid' : 'none';
    if (preview) preview.style.display = checked ? 'block' : 'none';
    if (label) label.textContent = checked ? 'On' : 'Off';
    if (checked) QuotesPage._calcDeposit();
  },

  _calcDeposit: function() {
    var totalEl = document.getElementById('q-total-display');
    var depTypeEl = document.getElementById('q-deposit-type');
    var depAmtEl = document.getElementById('q-deposit-amount');
    var preview = document.getElementById('q-deposit-preview');
    if (!preview) return;
    var total = parseFloat((totalEl ? totalEl.textContent : '0').replace(/[^0-9.]/g,'')) || 0;
    var type = depTypeEl ? depTypeEl.value : 'percent';
    var amount = depAmtEl ? parseFloat(depAmtEl.value) || 0 : 0;
    var due = type === 'percent' ? (total * amount / 100) : amount;
    preview.textContent = 'Deposit due: ' + (type === 'percent' ? amount + '% = ' : '') + '$' + due.toFixed(2) + (total > 0 ? ' of $' + total.toFixed(2) + ' total' : '');
  },

  calcTotal: function() {
    var subtotal = 0;
    document.querySelectorAll('.quote-item-row').forEach(function(row) {
      var qty = parseFloat(row.querySelector('.q-item-qty').value) || 0;
      var rate = parseFloat(row.querySelector('.q-item-rate').value) || 0;
      var lineTotal = qty * rate;
      subtotal += lineTotal;
      var amountEl = row.querySelector('.q-item-amount');
      if (amountEl) amountEl.textContent = UI.money(lineTotal);
    });
    var taxRateEl = document.getElementById('q-tax-rate');
    var taxRate = taxRateEl ? (parseFloat(taxRateEl.value) || 0) : 0;
    var taxAmt = Math.round(subtotal * taxRate / 100 * 100) / 100;
    var total = subtotal + taxAmt;
    var subEl = document.getElementById('q-subtotal-display');
    var taxEl = document.getElementById('q-tax-display');
    var totEl = document.getElementById('q-total-display');
    if (subEl) subEl.textContent = UI.money(subtotal);
    if (taxEl) taxEl.textContent = UI.money(taxAmt);
    if (totEl) totEl.textContent = UI.money(total);
  },

  saveAs: function(status) {
    var form = document.getElementById('quote-form');
    if (!form) return;
    // Store desired status, trigger save
    form.dataset.saveStatus = status;
    form.requestSubmit();
  },

  save: function(e, quoteId) {
    e.preventDefault();
    try { return QuotesPage._saveImpl(e, quoteId); }
    catch(err) {
      console.error('[QuotesPage.save] ERROR:', err);
      QuotesPage._saving = false;
      var f = e.target;
      if (f) f.querySelectorAll('button').forEach(function(b) { b.disabled = false; b.style.opacity = ''; b.style.cursor = ''; });
      UI.toast('Save failed: ' + (err && err.message ? err.message : err), 'error');
    }
  },

  _saveImpl: function(e, quoteId) {
    if (QuotesPage._saving) return;
    var form = e.target;
    var _disableButtons = function() {
      QuotesPage._saving = true;
      if (form) form.querySelectorAll('button[type=submit], button[onclick*="requestSubmit"], button[onclick*="saveAs"]').forEach(function(b) {
        b.disabled = true; b.style.opacity = '0.5'; b.style.cursor = 'wait';
      });
    };
    var _unsave = function() {
      QuotesPage._saving = false;
      if (form) form.querySelectorAll('button').forEach(function(b) {
        b.disabled = false; b.style.opacity = ''; b.style.cursor = '';
      });
    };

    var clientIdEl = document.getElementById('q-clientId');
    var clientId = clientIdEl ? clientIdEl.value : '';
    if (!clientId) {
      UI.toast('Client required — pick or create one before saving', 'error');
      var clientArea = document.getElementById('q-client-search') || document.getElementById('q-client-block') || clientIdEl;
      if (clientArea && clientArea.scrollIntoView) clientArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (clientArea) {
        var orig = clientArea.style.boxShadow;
        clientArea.style.boxShadow = '0 0 0 3px #dc3545';
        clientArea.style.transition = 'box-shadow .3s';
        setTimeout(function() { if (document.contains(clientArea)) clientArea.style.boxShadow = orig || ''; }, 2500);
      }
      return; // Don't disable — let user retry after picking client
    }
    var client = DB.clients.getById(clientId);
    if (!client) {
      UI.toast('Selected client no longer exists — pick another', 'error');
      return;
    }

    // Passed validation — NOW disable buttons to prevent double-submit
    _disableButtons();

    var items = [];
    var subtotal = 0;
    document.querySelectorAll('.quote-item-row').forEach(function(row) {
      var service = row.querySelector('.q-item-service').value;
      var desc = row.querySelector('.q-item-desc').value;
      var qty = parseFloat(row.querySelector('.q-item-qty').value) || 0;
      var rate = parseFloat(row.querySelector('.q-item-rate').value) || 0;
      if (service || desc || rate) {
        var photos = [];
        if (row.dataset.photos) { try { photos = JSON.parse(row.dataset.photos); } catch(e){} }
        else if (row.dataset.photo) { photos = [row.dataset.photo]; }
        var wrap = row.closest('.q-item-wrap');
        var species = (wrap && wrap.querySelector('.q-item-species') || {}).value || '';
        var location = (wrap && wrap.querySelector('.q-item-location') || {}).value || '';
        items.push({ species: species, location: location, service: service, description: desc, qty: qty, rate: rate, amount: qty * rate, photos: photos, photo: photos[0] || '' });
        subtotal += qty * rate;
      }
    });
    var taxRateVal = document.getElementById('q-tax-rate');
    var taxRate = taxRateVal ? (parseFloat(taxRateVal.value) || 0) : (parseFloat(localStorage.getItem('bm-tax-rate')) || 8.375);
    var taxAmount = Math.round(subtotal * taxRate / 100 * 100) / 100;
    var total = subtotal + taxAmount;

    // Deposit handled in settings/PDF, not on quote form
    var depositRequired = false;
    var depositType = 'percent';
    var depositAmount = 0;
    var depositDue = 0;
    var expiresEl = document.getElementById('q-expires');
    var expiresAt = expiresEl ? expiresEl.value : new Date(Date.now() + 30*86400000).toISOString().split('T')[0];

    var existingQ = quoteId ? DB.quotes.getById(quoteId) : {};
    var data = {
      clientId: clientId,
      clientName: client ? client.name : '',
      clientEmail: (client && client.email) || '',
      clientPhone: (client && client.phone) || '',
      property: document.getElementById('q-property').value.trim() || (client && client.address) || '',
      description: document.getElementById('q-description').value.trim(),
      lineItems: items,
      subtotal: subtotal,
      taxRate: taxRate,
      taxAmount: taxAmount,
      total: total,
      notes: document.getElementById('q-notes').value.trim(),
      status: form.dataset.saveStatus || 'draft',
      // Preserve origin request link (don't lose on edit)
      requestId: QuotesPage._originRequestId || existingQ.requestId || null,
      depositRequired: depositRequired,
      depositType: depositType,
      depositAmount: depositAmount,
      depositDue: depositDue,
      expiresAt: expiresAt,
      options: null,
      timeMaterial: (function() {
        var climberHrs = parseFloat((document.getElementById('q-tm-climber-hrs') || {}).value) || 0;
        var groundCount = parseFloat((document.getElementById('q-tm-ground-count') || {}).value) || 0;
        var groundHrs = parseFloat((document.getElementById('q-tm-ground-hrs') || {}).value) || 0;
        var totalHrs = parseFloat((document.getElementById('q-tm-total-hrs') || {}).value) || 0;
        var disposal = parseFloat((document.getElementById('q-tm-disposal') || {}).value) || 0;
        if (!climberHrs && !groundHrs && !totalHrs) return null;
        return {
          climberHrs: climberHrs, groundCount: groundCount, groundHrs: groundHrs,
          totalHrs: totalHrs, disposal: disposal,
          bucket: !!(document.getElementById('q-tm-bucket') || {}).checked,
          chipper: !!(document.getElementById('q-tm-chipper') || {}).checked,
          crane: !!(document.getElementById('q-tm-crane') || {}).checked,
          stumpGrinder: !!(document.getElementById('q-tm-stumpgrinder') || {}).checked,
          tmTotal: QuotesPage._calcTM()
        };
      })()
    };

    var savedId;
    if (quoteId) {
      DB.quotes.update(quoteId, data);
      UI.toast('Quote updated');
      savedId = quoteId;
    } else {
      var newQ = DB.quotes.create(data);
      UI.toast('Quote created');
      savedId = newQ.id;
    }

    QuotesPage._clearAutoSave();
    if (client && client.status === 'lead') DB.clients.update(clientId, { status: 'active' });
    _unsave();
    if (document.querySelector('.modal-overlay')) UI.closeModal();

    if (data.status === 'sent' && savedId) {
      QuotesPage._sendQuote(savedId);
    } else {
      loadPage('quotes');
    }
  },

  showDetail: function(id) {
    var q = DB.quotes.getById(id);
    if (!q) return;

    // Jobber-style quote detail
    var statusColors = {draft:'#6c757d',sent:'#e07c24',awaiting:'#e07c24',approved:'#2e7d32',converted:'#2e7d32',declined:'#dc3545'};
    var statusColor = statusColors[q.status] || '#8b2252';
    var client = q.clientId ? DB.clients.getById(q.clientId) : null;

    var html = '<div style="max-width:960px;margin:0 auto;">'
      // Top bar: back + actions
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px;">'
      + '<button class="btn btn-outline" onclick="loadPage(\'quotes\')" style="padding:6px 12px;font-size:12px;">← Back to Quotes</button>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">'
      + '<button class="btn btn-outline" onclick="QuotesPage._copyApprovalLink(\'' + id + '\')" style="font-size:12px;">Copy Link</button>'
      + (q.status !== 'converted' && q.status !== 'declined'
          ? '<button class="btn btn-outline" onclick="QuotesPage._sendQuote(\'' + id + '\')" style="font-size:12px;">Send Quote</button>' : '')
      + (q.status === 'approved' || q.status === 'converted'
          ? '<button class="btn btn-primary" onclick="if(typeof Workflow!==\'undefined\')Workflow.quoteToJob(\'' + id + '\');loadPage(\'jobs\');" style="font-size:12px;">Convert to Job</button>'
          : '<button class="btn btn-primary" onclick="QuotesPage.showForm(\'' + id + '\')" style="font-size:12px;">Edit Quote</button>')
      + '<div style="position:relative;display:inline-block;">'
      + '<button onclick="var d=this.nextElementSibling;document.querySelectorAll(\'.more-dd\').forEach(function(x){x.style.display=\'none\'});d.style.display=d.style.display===\'block\'?\'none\':\'block\';" class="btn btn-outline" style="font-size:13px;padding:6px 10px;">•••</button>'
      + '<div class="more-dd" style="display:none;position:absolute;right:0;top:calc(100% + 4px);background:#fff;border:1px solid var(--border);border-radius:8px;padding:4px 0;z-index:200;min-width:180px;box-shadow:0 4px 16px rgba(0,0,0,.12);">'
      + '<button onclick="QuotesPage.showForm(\'' + id + '\')" style="display:block;width:100%;text-align:left;padding:8px 14px;font-size:13px;background:none;border:none;cursor:pointer;color:var(--text);">Edit Quote</button>'
      + '<button onclick="QuotesPage._sendQuote(\'' + id + '\')" style="display:block;width:100%;text-align:left;padding:8px 14px;font-size:13px;background:none;border:none;cursor:pointer;color:var(--text);">Send to Client</button>'
      + '<button onclick="QuotesPage._copyApprovalLink(\'' + id + '\')" style="display:block;width:100%;text-align:left;padding:8px 14px;font-size:13px;background:none;border:none;cursor:pointer;color:var(--text);">Copy Approval Link</button>'
      + '<button onclick="PDF.generateQuote(\'' + id + '\')" style="display:block;width:100%;text-align:left;padding:8px 14px;font-size:13px;background:none;border:none;cursor:pointer;color:var(--text);">Download PDF</button>'
      + '<button onclick="QuotesPage._quickFollowUp(\'' + id + '\')" style="display:block;width:100%;text-align:left;padding:8px 14px;font-size:13px;background:none;border:none;cursor:pointer;color:var(--text);">Send Follow-up</button>'
      + '<div style="height:1px;background:var(--border);margin:4px 0;"></div>'
      + '<button onclick="QuotesPage.setStatus(\'' + id + '\',\'declined\')" style="display:block;width:100%;text-align:left;padding:8px 14px;font-size:13px;background:none;border:none;cursor:pointer;color:#dc3545;">Mark Declined</button>'
      + '<button onclick="QuotesPage._archiveQuote(\'' + id + '\')" style="display:block;width:100%;text-align:left;padding:8px 14px;font-size:13px;background:none;border:none;cursor:pointer;color:var(--text-light);">Archive</button>'
      + '<button onclick="QuotesPage._deleteQuote(\'' + id + '\')" style="display:block;width:100%;text-align:left;padding:8px 14px;font-size:13px;background:none;border:none;cursor:pointer;color:#dc3545;">Delete Quote</button>'
      + '</div></div>'
      + '</div></div>'

      // Single header card — no duplication
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:16px;">'
      + '<div style="height:4px;background:' + statusColor + ';"></div>'
      + '<div style="padding:20px 24px;">'
      + '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px;">'
      + '<div>'
      + '<h2 style="font-size:22px;font-weight:700;margin:0 0 4px;">Quote #' + (q.quoteNumber||'') + ' — ' + UI.esc(q.clientName || '—') + '</h2>'
      + '<div style="font-size:13px;color:var(--text-light);">' + UI.dateShort(q.createdAt) + (q.sentAt ? ' · Sent ' + UI.dateShort(q.sentAt) : '') + '</div>'
      + (q.property ? '<a href="https://maps.apple.com/?daddr=' + encodeURIComponent(q.property) + '" target="_blank" style="display:block;font-size:13px;color:var(--accent);margin-top:2px;text-decoration:none;">📍 ' + UI.esc(q.property) + ' →</a>' : '')
      + '</div>'
      + '<div style="text-align:right;">' + UI.statusBadge(q.status) + '<div style="font-size:24px;font-weight:800;color:var(--accent);margin-top:6px;">' + UI.money(q.total) + '</div></div>'
      + '</div>'
      // Contact + details in one row
      + '<div style="display:flex;gap:24px;flex-wrap:wrap;font-size:13px;color:var(--text-light);border-top:1px solid var(--border);padding-top:12px;">'
      + (q.clientPhone || (client && client.phone) ? '<a href="tel:' + (q.clientPhone || client.phone).replace(/\D/g,'') + '" style="color:var(--accent);">📞 ' + (q.clientPhone || client.phone) + '</a>' : '')
      + (q.clientEmail || (client && client.email) ? '<a href="mailto:' + (q.clientEmail || client.email) + '" style="color:var(--accent);">✉️ ' + (q.clientEmail || client.email) + '</a>' : '')
      + (q.expiresAt ? (function() {
          var exp = new Date(q.expiresAt); var now = new Date();
          var days = Math.ceil((exp - now) / 86400000);
          var color = days < 0 ? '#dc3545' : days <= 5 ? '#e6a817' : 'var(--text-light)';
          var label = days < 0 ? 'Expired ' + Math.abs(days) + 'd ago' : days === 0 ? 'Expires today' : 'Valid ' + days + 'd';
          return '<span style="color:' + color + ';">⏱ ' + label + '</span>';
        })() : '')
      + (q.depositRequired ? '<span>' + (q.depositPaid ? '✅ Deposit paid' : '⚠️ Deposit due: ' + UI.money(q.depositDue)) + '</span>' : '')
      + (q.source ? '<span>📣 ' + UI.esc(q.source) + '</span>' : '')
      + (q.requestId ? '<a onclick="RequestsPage._pendingDetail=\'' + q.requestId + '\';loadPage(\'requests\');" style="color:var(--accent);cursor:pointer;">📥 From Request</a>' : '')
      + '</div>'
      + '</div></div>'

      // Description
      + (q.description ? '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px;">'
        + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Description</h4>'
        + '<p style="font-size:14px;line-height:1.6;margin:0;word-wrap:break-word;overflow-wrap:break-word;white-space:pre-wrap;">' + UI.esc(q.description) + '</p></div>' : '')

      // Line items (Product / Service) — inline editor
      + QuotesPage.renderLineItems(q, id)

      // Video walkthrough (full width, above photos)
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Video Walkthrough</h4>'
      + (q.videoUrl
        ? '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin-bottom:8px;">'
          + '<iframe src="' + q.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/') + '" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen></iframe></div>'
          + '<div style="display:flex;gap:6px;">'
          + '<button class="btn btn-outline" style="font-size:11px;" onclick="navigator.clipboard.writeText(\'' + UI.esc(q.videoUrl) + '\');UI.toast(\'Video link copied!\')">🔗 Copy Link</button>'
          + '<button class="btn btn-outline" style="font-size:11px;" onclick="QuotesPage._removeVideo(\'' + id + '\')">🗑 Remove</button>'
          + '</div>'
        : '<div style="text-align:center;padding:16px;background:var(--bg);border-radius:8px;">'
          + '<div style="font-size:24px;margin-bottom:8px;">🎥</div>'
          + '<div style="font-size:13px;color:var(--text-light);margin-bottom:8px;">Record a property walkthrough and attach it to this quote</div>'
          + '<button class="btn btn-primary" style="font-size:12px;" onclick="QuotesPage._addVideo(\'' + id + '\')">+ Add Video</button>'
          + '</div>')
      + '</div>'

      // Photos + Notes + Actions in bottom section
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;" class="detail-grid">'

      // Photos
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Photos</h4>';
    if (typeof Photos !== 'undefined') { html += Photos.renderGallery('quote', id); }
    else { html += '<div style="color:var(--text-light);font-size:13px;">No photos</div>'; }
    html += '</div>'

      // Notes + Actions
      + '<div>'
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Internal Notes</h4>'
      + (q.notes ? '<div style="font-size:13px;line-height:1.6;">' + UI.esc(q.notes) + '</div>' : '<div style="color:var(--text-light);font-size:13px;">No notes</div>')
      + '</div>'
      + '<div style="display:flex;flex-direction:column;gap:6px;">'
      + '<button class="btn btn-outline" style="width:100%;justify-content:center;font-size:12px;" onclick="PDF.generateQuote(\'' + id + '\')">📄 Download PDF</button>'
      + (q.property ? '<button class="btn btn-outline" style="width:100%;justify-content:center;font-size:12px;" onclick="PropertyMap.show(\'' + (q.property || '').replace(/'/g, "\\'") + '\')">📐 Equipment Layout</button>' : '')
      + (q.status !== 'converted' ? '<button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="if(typeof Workflow!==\'undefined\')Workflow.quoteToJob(\'' + id + '\');loadPage(\'jobs\');">✅ Convert to Job</button>' : '')
      + '</div></div>'

      + '</div>'
      + '</div>'; // close max-width wrapper

    // Render full page
    document.getElementById('pageTitle').textContent = 'Quote #' + q.quoteNumber;
    document.getElementById('pageContent').innerHTML = html;
    document.getElementById('pageAction').style.display = 'none';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  },

  _getApprovalLink: function(id) {
    // Generate or retrieve approval token for CSRF protection
    var q = DB.quotes.getById(id);
    var token = q && q.approvalToken;
    if (!token) {
      token = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 16);
      DB.quotes.update(id, { approvalToken: token });
    }
    return 'https://peekskilltree.com/branchmanager/approve.html?id=' + id + '&token=' + token;
  },

  _copyApprovalLink: function(id) {
    var link = QuotesPage._getApprovalLink(id);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(function() { UI.toast('Approval link copied!'); }).catch(function() { UI.toast('Could not copy — use Ctrl+C', 'error'); });
    } else {
      var el = document.getElementById('approval-link-input');
      if (el) { el.select(); document.execCommand('copy'); UI.toast('Approval link copied!'); }
    }
  },

  _sendQuote: function(id) {
    var q = DB.quotes.getById(id);
    if (!q) return;

    // Get client email
    var client = q.clientId ? DB.clients.getById(q.clientId) : null;
    var email = (client && client.email) || q.clientEmail || '';
    var firstName = (q.clientName || '').split(' ')[0] || 'there';
    var approvalLink = QuotesPage._getApprovalLink(id);

    // Build email preview (Jobber style)
    var _co = QuotesPage._co();
    var subject = 'Quote #' + q.quoteNumber + ' from ' + _co.name + ' — ' + UI.money(q.total);
    var body = 'Hi ' + firstName + ',\n\n'
      + 'Thanks for reaching out to ' + _co.name + '! Here\'s your quote for the work we discussed:\n\n'
      + '📋 Quote #' + q.quoteNumber + '\n'
      + '📍 ' + (q.property || 'Property on file') + '\n'
      + '💰 Total: ' + UI.money(q.total) + '\n\n';
    if (q.description) body += 'Scope: ' + q.description + '\n\n';
    body += '👉 View & approve your quote online:\n' + approvalLink + '\n\n'
      + 'This quote is valid for 30 days. Click the link above to approve or request changes — no login required.\n\n'
      + 'Questions? Reply to this email or call ' + _co.phone + '.\n\n'
      + 'Thanks,\nDoug Brown\n' + _co.name + '\n' + _co.phone + '\n' + _co.website + '\nLicensed & Fully Insured — ' + _co.licenses;

    // Build line items summary for review
    var itemsSummary = '';
    if (q.lineItems && q.lineItems.length) {
      q.lineItems.forEach(function(item) {
        var amt = item.amount || ((item.qty || 1) * (item.rate || 0));
        itemsSummary += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:13px;">'
          + '<span>' + UI.esc(item.service || item.description || 'Service') + '</span>'
          + '<span style="font-weight:600;">' + UI.money(amt) + '</span></div>';
      });
    }

    var html = '<div style="padding:16px;">'
      // Review card — read only
      + '<div style="background:var(--bg);border-radius:10px;padding:16px;margin-bottom:16px;">'
      + '<div style="font-size:13px;color:var(--text-light);margin-bottom:4px;">Sending to</div>'
      + '<div style="font-size:16px;font-weight:700;">' + UI.esc(email || 'No email on file') + '</div>'
      + '<input type="hidden" id="send-to" value="' + UI.esc(email) + '">'
      + '</div>'

      // Quote summary
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">'
      + '<div style="font-size:15px;font-weight:700;">Quote #' + q.quoteNumber + '</div>'
      + '<div style="font-size:20px;font-weight:800;color:var(--green-dark);">' + UI.money(q.total) + '</div>'
      + '</div>'
      + '<div style="font-size:13px;color:var(--text-light);margin-bottom:8px;">' + UI.esc(q.clientName || '') + ' · ' + UI.esc(q.property || '') + '</div>'
      + (q.description ? '<div style="font-size:13px;margin-bottom:10px;word-wrap:break-word;overflow-wrap:break-word;white-space:pre-wrap;">' + UI.esc(q.description) + '</div>' : '')
      + itemsSummary
      + '</div>'

      // Approval link
      + '<div style="background:#e8f5e9;border-radius:8px;padding:12px 14px;margin-bottom:16px;border-left:3px solid var(--green-dark);">'
      + '<div style="font-size:12px;font-weight:700;color:var(--green-dark);margin-bottom:6px;">Client Approval Link</div>'
      + '<div style="display:flex;gap:6px;align-items:center;">'
      + '<input id="approval-link-input" type="text" readonly value="' + approvalLink + '" style="flex:1;font-size:11px;padding:6px 10px;border:1px solid var(--border);border-radius:6px;background:#fff;color:#333;">'
      + '<button onclick="QuotesPage._copyApprovalLink(\'' + id + '\')" style="background:var(--green-dark);color:#fff;border:none;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">Copy</button>'
      + '</div>'
      + '<div style="font-size:11px;color:var(--text-light);margin-top:4px;">Or copy link and text it directly</div>'
      + '</div>'

      // Hidden fields for the send function
      + '<input type="hidden" id="send-subject" value="' + UI.esc(subject) + '">'
      + '<input type="hidden" id="send-body" value="' + UI.esc(body) + '">'
      + '</div>';

    UI.showModal('Send Quote #' + q.quoteNumber, html, {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-outline" onclick="PDF.generateQuote(\'' + id + '\')">👁 Preview PDF</button>'
        + ' <button class="btn btn-primary" onclick="QuotesPage._confirmSend(\'' + id + '\')">📧 Send Quote</button>'
    });
  },

  _confirmSend: function(id) {
    var to = document.getElementById('send-to').value.trim();
    if (!to) { UI.toast('Enter an email address', 'error'); return; }

    var subject = document.getElementById('send-subject').value;
    var body = document.getElementById('send-body').value;
    var q = DB.quotes.getById(id);

    // Disable button to prevent double-send
    var sendBtn = document.querySelector('.modal-footer .btn-primary');
    if (sendBtn) { sendBtn.textContent = 'Sending...'; sendBtn.disabled = true; }

    UI.closeModal();

    // Build branded HTML email
    var approvalLink = QuotesPage._getApprovalLink(id);
    var firstName = (q && q.clientName ? q.clientName.split(' ')[0] : 'there');

    var lineItemsHtml = '';
    if (q && q.lineItems && q.lineItems.length) {
      lineItemsHtml = '<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">'
        + '<tr style="background:#f0f9f4;"><th style="padding:8px 12px;text-align:left;font-size:12px;color:#555;font-weight:600;border-bottom:2px solid #c8e6c9;">SERVICE</th><th style="padding:8px 12px;text-align:right;font-size:12px;color:#555;font-weight:600;border-bottom:2px solid #c8e6c9;">AMOUNT</th></tr>';
      q.lineItems.forEach(function(item) {
        var amt = item.amount || ((item.qty||1) * (item.rate||0));
        lineItemsHtml += '<tr><td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;">' + (item.service||item.description||'Service') + '</td><td style="padding:8px 12px;text-align:right;border-bottom:1px solid #e0e0e0;font-weight:600;">' + UI.money(amt) + '</td></tr>';
      });
      if (q.subtotal && q.taxRate) {
        lineItemsHtml += '<tr><td style="padding:6px 12px;color:#718096;">Subtotal</td><td style="padding:6px 12px;text-align:right;">' + UI.money(q.subtotal) + '</td></tr>';
        lineItemsHtml += '<tr><td style="padding:6px 12px;color:#718096;">Tax (' + q.taxRate + '%)</td><td style="padding:6px 12px;text-align:right;">' + UI.money(q.taxAmount || 0) + '</td></tr>';
      }
      lineItemsHtml += '<tr style="background:#f0f9f4;"><td style="padding:10px 12px;font-weight:700;">Quote Total</td><td style="padding:10px 12px;text-align:right;font-weight:800;color:#00836c;font-size:16px;">' + UI.money(q.total) + '</td></tr>';
      lineItemsHtml += '</table>';
    }

    var htmlBody = '<div style="background:#f5f6f8;padding:24px 0;">'
      + '<div style="max-width:520px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;">'
      + '<div style="background:linear-gradient(135deg,#1a3c12 0%,#00836c 100%);border-radius:12px 12px 0 0;padding:24px 28px;color:#fff;">'
      + '<div style="font-size:13px;opacity:.8;margin-bottom:4px;">🌳 ' + _co.name + '</div>'
      + '<div style="font-size:24px;font-weight:900;letter-spacing:-.5px;">Quote #' + (q ? q.quoteNumber : '') + '</div>'
      + '<div style="font-size:38px;font-weight:900;margin:6px 0 4px;letter-spacing:-1px;">' + UI.money(q ? q.total : 0) + '</div>'
      + '<div style="font-size:13px;opacity:.75;">' + (q && q.property ? '📍 ' + q.property : '') + '</div>'
      + '</div>'
      + '<div style="background:#fff;border-radius:0 0 12px 12px;padding:24px 28px;">'
      + '<p style="font-size:15px;color:#2d3748;margin-bottom:12px;">Hi ' + firstName + ',</p>'
      + '<p style="font-size:14px;color:#4a5568;line-height:1.6;margin-bottom:16px;">Thanks for reaching out to ' + _co.name + '! Here\'s the quote for the work we discussed. You can approve it online — no login required.</p>'
      + (q && q.description ? '<p style="font-size:13px;color:#718096;background:#f7fafc;padding:10px 12px;border-radius:6px;margin-bottom:16px;"><strong>Scope:</strong> ' + q.description + '</p>' : '')
      + lineItemsHtml
      + '<div style="text-align:center;margin:24px 0;">'
      + '<a href="' + approvalLink + '" style="display:inline-block;background:linear-gradient(135deg,#00836c,#1a3c12);color:#fff;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;box-shadow:0 4px 14px rgba(0,131,108,.35);">✅ View & Approve Quote</a>'
      + '</div>'
      + '<p style="font-size:12px;color:#a0aec0;text-align:center;margin-bottom:20px;">This quote is valid for 30 days. Click above to approve or request changes.</p>'
      + '<p style="font-size:13px;color:#718096;">Questions? Reply to this email or call/text <strong>' + _co.phone + '</strong>.</p>'
      + '<p style="font-size:13px;color:#2d3748;margin-top:12px;">Thanks,<br><strong>Doug Brown</strong><br>' + _co.name + '<br>Licensed & Insured — ' + _co.licenses + '</p>'
      + '</div></div></div>';

    if (typeof Email !== 'undefined') {
      Email.send(to, subject, body, { htmlBody: htmlBody }).then(function(result) {
        if (result && result.ok) {
          UI.toast('Quote sent to ' + to + ' ✓');
        } else {
          UI.toast('Email sent (check for errors)', 'warning');
        }
      }).catch(function() {
        UI.toast('Failed to send email', 'error');
      });
    } else {
      window.open('mailto:' + encodeURIComponent(to) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body), '_blank');
    }

    // Mark as sent
    DB.quotes.update(id, { status: 'sent', sentAt: new Date().toISOString(), sentTo: to });
    QuotesPage.showDetail(id);
  },

  setStatus: function(id, status) {
    DB.quotes.update(id, { status: status });

    // Auto-convert approved quotes to jobs (Jobber-style pipeline)
    if (status === 'approved') {
      var q = DB.quotes.getById(id);
      if (q && !q.convertedJobId) {
        UI.confirm('Quote approved! Create a job from this quote?', function() {
          if (typeof Workflow !== 'undefined') {
            var job = Workflow.quoteToJob(id);
            if (job) { UI.toast('✅ Job #' + job.jobNumber + ' created'); loadPage('jobs'); return; }
          }
          QuotesPage.showDetail(id);
        }, function() { UI.toast('Quote approved'); QuotesPage.showDetail(id); });
        return;
      }
    }
    UI.toast('Quote status: ' + status);
    QuotesPage.showDetail(id);
  },

  // Injects a shared <datalist> with all service suggestions. The line-item
  // service input is an <input list="q-svc-datalist"> so users can type or pick.
  _dataListOnce: function(services) {
    if (document.getElementById('q-svc-datalist')) return;
    setTimeout(function() {
      if (document.getElementById('q-svc-datalist')) return;
      var dl = document.createElement('datalist');
      dl.id = 'q-svc-datalist';
      (services || []).forEach(function(s) {
        var opt = document.createElement('option');
        opt.value = s.name;
        dl.appendChild(opt);
      });
      // Fallback defaults if services list is empty
      if (!services || !services.length) {
        ['Tree Removal','Tree Pruning','Stump Grinding','Cabling','Clean Up','Arborist Letter','Other']
          .forEach(function(n) { var o = document.createElement('option'); o.value = n; dl.appendChild(o); });
      }
      document.body.appendChild(dl);
    }, 0);
  },

  // ── Photo-first flow — focused one-tree-at-a-time with MULTIPLE photos for AI ──
  _addPhotoFirst: function() {
    QuotesPage._pendingService = ''; // let AI choose the service itself
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true; // ← allow multi-select (trunk + crown + whole tree) for better AI accuracy
    input.onchange = function(e) {
      var files = Array.from(e.target.files || []);
      if (!files.length) return;
      // Only create the line item AFTER photos are picked (avoids empty rows if user cancels)
      QuotesPage.addItem();
      // Hard cap at 5 to keep payload reasonable
      if (files.length > 5) { UI.toast('Max 5 photos per tree — using first 5'); files = files.slice(0, 5); }
      Promise.all(files.map(function(f) {
        return new Promise(function(resolve) {
          var r = new FileReader();
          r.onload = function(ev) { resolve(ev.target.result); };
          r.readAsDataURL(f);
        });
      })).then(function(dataUrls) {
        var wraps = document.querySelectorAll('.q-item-wrap');
        var lastWrap = wraps[wraps.length - 1];
        var lastRow = lastWrap ? lastWrap.querySelector('.quote-item-row') : null;
        if (lastWrap && lastRow) {
          // Store photos on both the row (for save()) and the wrap (for display persistence)
          lastRow.dataset.photos = JSON.stringify(dataUrls);
          lastRow.dataset.photo = dataUrls[0];
          // Replace any existing photo grid, then prepend a fresh one inside q-item-body
          var body = lastWrap.querySelector('.q-item-body');
          var existingGrid = body ? body.querySelector('.q-photo-grid') : null;
          if (existingGrid) existingGrid.remove();
          var grid = document.createElement('div');
          grid.className = 'q-photo-grid';
          grid.style.cssText = 'display:grid;grid-template-columns:repeat(' + Math.min(dataUrls.length, 3) + ',1fr);gap:4px;margin-bottom:10px;';
          grid.innerHTML = dataUrls.map(function(u, pi) {
            return '<img src="' + u + '" onclick="event.stopPropagation();QuotesPage._openLightbox(' + JSON.stringify(dataUrls).replace(/"/g,'&quot;') + ',' + pi + ')" style="width:100%;height:80px;object-fit:cover;border-radius:6px;border:1px solid var(--border);cursor:pointer;">';
          }).join('') + (dataUrls.length > 1 ? '<div style="grid-column:1/-1;font-size:11px;color:var(--text-light);text-align:center;margin-top:2px;">' + dataUrls.length + ' photos — AI analyzing all</div>' : '');
          body.insertBefore(grid, body.firstChild);
          // Update header thumb
          var headerThumb = lastWrap.querySelector('.q-item-header img, .q-item-header div[style*="dashed"]');
          if (headerThumb) {
            var newThumb = document.createElement('img');
            newThumb.src = dataUrls[0];
            newThumb.style.cssText = 'width:44px;height:44px;object-fit:cover;border-radius:6px;flex-shrink:0;';
            headerThumb.replaceWith(newThumb);
          }
        }
        // Respect global AI toggle — if user turned off AI, skip the call entirely.
        // They can manually trigger it later via the 🤖 Run AI button on the row.
        var aiOn = localStorage.getItem('bm-ai-enabled') !== '0';
        if (aiOn) {
          QuotesPage._identifyTree(dataUrls, document.querySelectorAll('.quote-item-row').length - 1);
        } else {
          UI.toast('Photo added — AI off, fill details manually or tap 🤖 Run AI');
        }
      });
    };
    input.click();
  },

  _openTreeMeasure: function() {
    // Open the standalone Tree Measure page in a new tab so user can use the camera-ruler tool.
    // (Keeping the quote form state intact — tab-out is safer than modal injection.)
    if (typeof loadPage !== 'function') { UI.toast('Tree Measure page not loaded'); return; }
    window.open(window.location.pathname + '#treemeasure', '_blank');
  },

  // ── Service-first then photo (legacy path, kept for backwards compat) ──
  _addWithServiceAndPhoto: function() {
    var sel = document.getElementById('q-add-service');
    var svc = sel ? sel.value : '';
    if (!svc) { UI.toast('Select a service first'); return; }

    // Prompt for measurement based on service
    var pricing = QuotesPage._servicePricing[svc];
    var measurement = null;
    var rate = 0;
    var desc = '';
    if (pricing) {
      measurement = prompt(pricing.prompt);
      if (!measurement || isNaN(parseFloat(measurement))) { measurement = null; }
      else {
        var m = parseFloat(measurement);
        rate = Math.round(m * pricing.rate);
        desc = pricing.desc(m);
      }
    }

    // Add line item with service pre-filled
    QuotesPage.addItem();
    var rows = document.querySelectorAll('.quote-item-row');
    var lastRow = rows[rows.length - 1];
    if (lastRow) {
      var svcEl = lastRow.querySelector('.q-item-service');
      if (svcEl) svcEl.value = svc;
      if (desc) { var descEl = lastRow.querySelector('.q-item-desc'); if (descEl) descEl.value = desc; }
      if (rate) { var rateEl = lastRow.querySelector('.q-item-rate'); if (rateEl) rateEl.value = rate; }
      QuotesPage.calcTotal();
    }

    // Store selected service for AI context
    QuotesPage._pendingService = svc;

    // Now open camera
    QuotesPage._addTreePhoto();
  },

  _addTreePhoto: function() {
    // Use camera or file input — no `capture` attr so iOS/Android show the
    // native picker (Take Photo / Photo Library / Browse) instead of forcing camera.
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        var dataUrl = ev.target.result;
        // Use existing last row (already added by _addWithServiceAndPhoto) or add new
        var rows = document.querySelectorAll('.quote-item-row');
        if (!rows.length || QuotesPage._pendingService) {
          // Row already added by _addWithServiceAndPhoto, use last one
        } else {
          QuotesPage.addItem();
          rows = document.querySelectorAll('.quote-item-row');
        }
        var lastRow = rows[rows.length - 1];
        if (lastRow) {
          // Store photo on the row
          lastRow.dataset.photo = dataUrl;
          // Add photo thumbnail before the row content
          var thumb = document.createElement('div');
          thumb.style.cssText = 'margin-bottom:8px;';
          thumb.innerHTML = '<img src="' + dataUrl + '" style="width:100%;max-height:120px;object-fit:cover;border-radius:8px;border:1px solid var(--border);">';
          lastRow.insertBefore(thumb, lastRow.firstChild);
        }

        // Try AI identification
        QuotesPage._identifyTree(dataUrl, rows.length - 1);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  },

  _identifyTree: function(images, rowIndex) {
    // Accept a single data URL OR an array — normalize to array
    var imgArr = Array.isArray(images) ? images : [images];

    if (QuotesPage._identifying) {
      UI.toast('Already identifying a tree, please wait...', 'error');
      return;
    }
    var aiKey = localStorage.getItem('bm-claude-key');
    if (!aiKey) {
      UI.toast('Add AI key in Settings for auto tree ID');
      return;
    }

    QuotesPage._identifying = true;
    UI.toast(imgArr.length > 1 ? 'Analyzing ' + imgArr.length + ' photos…' : 'Identifying tree…');

    // Build content array: all images followed by the prompt
    var content = imgArr.map(function(dataUrl) {
      return {
        type: 'image',
        source: { type: 'base64', media_type: dataUrl.split(';')[0].split(':')[1], data: dataUrl.split(',')[1] }
      };
    });
    content.push({
      type: 'text',
      text: 'You are a certified arborist in ZIP ' + (localStorage.getItem('bm-zip') || '10566') + '. '
        + (imgArr.length > 1 ? 'You have ' + imgArr.length + ' photos of the SAME tree (different angles). Use them together for better accuracy. ' : '')
        + (QuotesPage._pendingService ? 'The user selected service: ' + QuotesPage._pendingService + '. Use that for suggestedService.' : 'Pick the MOST LIKELY service this tree needs based on its condition (Tree Removal if dead/hazardous, Tree Pruning if healthy with overgrowth, Stump Grinding if only stump, Cabling if split/weak fork, Clean Up if debris).')
        + ' Respond in ONLY this JSON format: {"species":"Common Name","dbh":"estimated diameter in inches as a number","heightFt":"estimated height in feet as a number","condition":"good/fair/poor/dead","notes":"1 sentence assessment","suggestedService":"Tree Removal OR Tree Pruning OR Stump Grinding OR Cabling OR Clean Up","diseases":"top disease risk for this species"}'
    });

    fetch('https://ltpivkqahvplapyagljt.supabase.co/functions/v1/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: aiKey,
        model: 'claude-sonnet-4-5',
        max_tokens: 400,
        messages: [{ role: 'user', content: content }]
      })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      // Surface API errors (bad model name, invalid key, rate limit) to the user
      if (data.error) {
        console.warn('AI error response:', data);
        UI.toast('AI error: ' + (data.error.message || data.error.type || JSON.stringify(data.error).slice(0, 100)), 'error');
        QuotesPage._identifying = false;
        return;
      }
      var text = data.content && data.content[0] ? data.content[0].text : '';
      if (!text) {
        console.warn('AI returned no content', data);
        UI.toast('AI returned empty response — check API key in Settings', 'error');
        QuotesPage._identifying = false;
        return;
      }
      try {
        var match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('No JSON in: ' + text.slice(0, 100));
        var tree = JSON.parse(match[0]);

        // Fill in the line item
        var rows = document.querySelectorAll('.quote-item-row');
        var row = rows[rowIndex];
        if (row) {
          var serviceEl = row.querySelector('.q-item-service');
          var descEl = row.querySelector('.q-item-desc');
          var rateEl = row.querySelector('.q-item-rate');
          var qtyEl = row.querySelector('.q-item-qty');

          if (serviceEl) serviceEl.value = tree.suggestedService || 'Tree Removal';
          // Store species separately so the summary header shows it cleanly
          var wrapEl = row.closest('.q-item-wrap');
          var speciesEl = wrapEl ? wrapEl.querySelector('.q-item-species') : null;
          if (speciesEl) speciesEl.value = tree.species || '';
          var heightStr = tree.heightFt ? ' — ' + tree.heightFt + '\' tall' : '';
          // Description now holds just the details (no species up front — species is its own field above)
          if (descEl) descEl.value = (tree.dbh || '?') + '" DBH' + heightStr + ' — ' + (tree.condition || '') + (tree.notes ? ' — ' + tree.notes : '');
          if (qtyEl) qtyEl.value = '1';

          // Price suggestion: $100 per inch of DBH
          var dbh = parseInt(tree.dbh) || 18;
          var suggestedPrice = Math.round(dbh * 100 / 50) * 50; // round to nearest $50
          if (rateEl) rateEl.value = suggestedPrice;

          QuotesPage.calcTotal();
          UI.toast('🌳 ' + tree.species + ' · ' + tree.dbh + '" DBH' + (tree.heightFt ? ' · ' + tree.heightFt + 'ft' : '') + ' · $' + suggestedPrice);
          // Update the collapsed summary header so it reflects AI-filled data even when body hidden
          if (descEl) {
            QuotesPage._syncSummary(descEl);
            QuotesPage._updateFormula(descEl);
          }
          // Make sure the just-filled row is visible to the user
          var wrap = row.closest('.q-item-wrap');
          if (wrap) {
            var wb = wrap.querySelector('.q-item-body');
            if (wb) wb.style.display = 'block';
            var wc = wrap.querySelector('.q-item-chevron');
            if (wc) wc.style.transform = 'rotate(0deg)';
            wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          // NO auto-addItem — user taps "Add Another Tree" explicitly when ready.
        }
      } catch(e) {
        console.warn('Tree ID parse error:', e, text);
        UI.toast('Could not identify — fill in manually');
      }
      QuotesPage._identifying = false;
    })
    .catch(function(e) {
      console.warn('Tree ID error:', e);
      UI.toast('AI unavailable — fill in manually');
      QuotesPage._identifying = false;
    });
  },

  // ── Dual Pricing (removed tabs — now sequential) ──
  _showPricingMode: function(mode) {
    var pertree = document.getElementById('q-mode-pertree');
    var tm = document.getElementById('q-mode-tm');
    var tabPT = document.getElementById('q-tab-pertree');
    var tabTM = document.getElementById('q-tab-tm');
    if (mode === 'pertree') {
      pertree.style.display = 'block'; tm.style.display = 'none';
      tabPT.style.background = 'var(--green-dark)'; tabPT.style.color = '#fff';
      tabTM.style.background = 'var(--bg)'; tabTM.style.color = 'var(--text-light)';
    } else {
      pertree.style.display = 'none'; tm.style.display = 'block';
      tabTM.style.background = 'var(--accent)'; tabTM.style.color = '#fff';
      tabPT.style.background = 'var(--bg)'; tabPT.style.color = 'var(--text-light)';
    }
  },

  // ── Time & Material Calculator ──
  // Default rates — user can override in Settings → T&M Pricing Rates
  _TM_DEFAULTS: {
    climber: 50, ground: 30, foreman: 60,
    bucket: 75, chipper: 44, crane: 200, stumpGrinder: 50,
    miniSkid: 60, dumpTruck: 40, liftLadder: 60, trailer: 25,
    insurance: 0.31,  // WC 9% + GL 9% + disability 2% + payroll 8% + auto 3%
    markup: 1.5       // 50% markup on cost
  },

  // Read user-customized rates merged over defaults.
  // Key: bm-tm-rates (plain object in localStorage).
  getTMRates: function() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem('bm-tm-rates') || '{}'); } catch(e) {}
    var out = {};
    for (var k in QuotesPage._TM_DEFAULTS) out[k] = QuotesPage._TM_DEFAULTS[k];
    for (var k2 in saved) if (typeof saved[k2] === 'number') out[k2] = saved[k2];
    return out;
  },

  // Back-compat shim: code referencing QuotesPage._TM_RATES still works via getter
  get _TM_RATES() { return QuotesPage.getTMRates(); },

  // Build a single equipment pill checkbox — rate read dynamically from settings
  _tmEquipPill: function(key, label, defaultRate, tmData) {
    var checked = !!tmData[key];
    var rates = QuotesPage.getTMRates();
    var rate = rates[key] || defaultRate;
    return '<label style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--white);border:2px solid ' + (checked ? 'var(--green-dark)' : 'var(--border)') + ';border-radius:10px;cursor:pointer;font-size:14px;font-weight:600;">'
      + '<input type="checkbox" id="q-tm-' + key.toLowerCase() + '" onchange="QuotesPage._calcTM();this.parentElement.style.borderColor=this.checked?\'var(--green-dark)\':\'var(--border)\';"' + (checked ? ' checked' : '') + ' style="width:18px;height:18px;">'
      + '<span style="flex:1;">' + label + '</span>'
      + '<span style="color:var(--text-light);font-size:12px;font-weight:500;">$' + rate + '/hr</span>'
      + '</label>';
  },

  _calcTM: function() {
    var r = QuotesPage._TM_RATES;
    function num(id) { var el = document.getElementById(id); return el ? (parseFloat(el.value) || 0) : 0; }
    function chk(id) { var el = document.getElementById(id); return !!(el && el.checked); }

    // Crew (counts × hours)
    var climberCount = num('q-tm-climber-count');
    var groundCount  = num('q-tm-ground-count');
    var foremanCount = num('q-tm-foreman-count');
    // Job hours
    var totalHrs = num('q-tm-total-hrs');
    var disposal = num('q-tm-disposal');

    // Equipment picks (ids match _tmEquipPill key.toLowerCase())
    var EQUIP = [
      { key:'bucket',       id:'q-tm-bucket',       label:'Bucket truck',       rate:r.bucket },
      { key:'chipper',      id:'q-tm-chipper',      label:'Chipper',            rate:r.chipper },
      { key:'crane',        id:'q-tm-crane',        label:'Crane',              rate:r.crane },
      { key:'stumpGrinder', id:'q-tm-stumpgrinder', label:'Stump grinder',      rate:r.stumpGrinder },
      { key:'miniSkid',     id:'q-tm-miniskid',     label:'Mini-skid / loader', rate:r.miniSkid },
      { key:'dumpTruck',    id:'q-tm-dumptruck',    label:'Dump truck',         rate:r.dumpTruck },
      { key:'liftLadder',   id:'q-tm-liftladder',   label:'Man lift / ladder',  rate:r.liftLadder },
      { key:'trailer',      id:'q-tm-trailer',      label:'Trailer',            rate:r.trailer }
    ];
    var activeEquip = EQUIP.filter(function(e){ return chk(e.id); });

    var climberCost = climberCount * totalHrs * r.climber;
    var groundLaborCost = groundCount * totalHrs * r.ground;
    var foremanCost = foremanCount * totalHrs * r.foreman;
    var laborCost = climberCost + groundLaborCost + foremanCost;
    var equipCost = activeEquip.reduce(function(s,e){ return s + (totalHrs * e.rate); }, 0);
    var insuranceCost = laborCost * r.insurance;
    var subtotalCost = laborCost + equipCost + insuranceCost + disposal;
    var tmTotal = Math.round(subtotalCost * r.markup);

    var breakdown = document.getElementById('q-tm-breakdown');
    if (breakdown) {
      var rows = '';
      function line(txt, amt) {
        return '<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;color:var(--text-light);"><span>' + txt + '</span><span>' + UI.money(amt) + '</span></div>';
      }
      if (climberCount > 0 && totalHrs > 0) rows += line(climberCount + ' × Climber — ' + totalHrs + 'hr × $' + r.climber + '/hr', climberCost);
      if (groundCount > 0 && totalHrs > 0)  rows += line(groundCount + ' × Groundsman — ' + totalHrs + 'hr × $' + r.ground + '/hr', groundLaborCost);
      if (foremanCount > 0 && totalHrs > 0) rows += line(foremanCount + ' × Foreman — ' + totalHrs + 'hr × $' + r.foreman + '/hr', foremanCost);
      activeEquip.forEach(function(e) {
        if (totalHrs > 0) rows += line(e.label + ' — ' + totalHrs + 'hr × $' + e.rate + '/hr', totalHrs * e.rate);
      });
      if (!rows) rows = '<div style="font-size:12px;color:var(--text-light);padding:4px 0;">Enter crew counts + hours + pick equipment to see breakdown.</div>';

      breakdown.innerHTML = rows
        + (laborCost > 0 ? '<div style="display:flex;justify-content:space-between;padding:6px 0 3px;border-top:1px dashed var(--border);margin-top:4px;"><span>Labor subtotal</span><span>' + UI.money(laborCost) + '</span></div>' : '')
        + (equipCost > 0 ? '<div style="display:flex;justify-content:space-between;padding:3px 0;"><span>Equipment subtotal</span><span>' + UI.money(equipCost) + '</span></div>' : '')
        + (insuranceCost > 0 ? '<div style="display:flex;justify-content:space-between;padding:3px 0;"><span>Insurance + overhead (31%)</span><span>' + UI.money(insuranceCost) + '</span></div>' : '')
        + (disposal > 0 ? '<div style="display:flex;justify-content:space-between;padding:3px 0;"><span>Disposal</span><span>' + UI.money(disposal) + '</span></div>' : '')
        + (subtotalCost > 0 ? '<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid var(--border);font-weight:600;"><span>Cost</span><span>' + UI.money(subtotalCost) + '</span></div>' : '')
        + (tmTotal > 0 ? '<div style="display:flex;justify-content:space-between;padding:3px 0;font-weight:700;color:var(--accent);"><span>T&M Price (1.5× markup)</span><span>' + UI.money(tmTotal) + '</span></div>' : '');
    }
    var tmTotalEl = document.getElementById('q-tm-total');
    if (tmTotalEl) tmTotalEl.textContent = 'T&M Total: ' + UI.money(tmTotal);

    // Show compare button if both modes have data
    var compareBtn = document.getElementById('q-compare-btn');
    if (compareBtn && tmTotal > 0) compareBtn.style.display = 'block';

    return tmTotal;
  },

  // ── Price Comparison Page ──
  _showPriceComparison: function() {
    // Get per-tree total
    var perTreeTotal = 0;
    document.querySelectorAll('.quote-item-row').forEach(function(row) {
      var qty = parseFloat(row.querySelector('.q-item-qty').value) || 0;
      var rate = parseFloat(row.querySelector('.q-item-rate').value) || 0;
      perTreeTotal += qty * rate;
    });

    // Get T&M total
    var tmTotal = QuotesPage._calcTM();
    var average = Math.round((perTreeTotal + tmTotal) / 2);
    var diff = Math.abs(perTreeTotal - tmTotal);
    var diffPct = perTreeTotal > 0 ? Math.round((diff / perTreeTotal) * 100) : 0;

    // Determine which is higher
    var higher = perTreeTotal >= tmTotal ? 'Per Tree' : 'T&M';
    var barMax = Math.max(perTreeTotal, tmTotal, 1);

    var panel = document.getElementById('q-comparison');
    if (!panel) return;

    panel.style.display = 'block';
    panel.innerHTML = '<div style="font-size:16px;font-weight:800;margin-bottom:16px;color:#5b21b6;">📊 Price Comparison</div>'

      // Per Tree bar
      + '<div style="margin-bottom:12px;">'
      + '<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin-bottom:4px;"><span>Per Tree/Task</span><span>' + UI.money(perTreeTotal) + '</span></div>'
      + '<div style="background:#e2e8f0;border-radius:6px;height:8px;"><div style="background:var(--green-dark);border-radius:6px;height:100%;width:' + Math.round((perTreeTotal / barMax) * 100) + '%;"></div></div>'
      + '</div>'

      // T&M bar
      + '<div style="margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin-bottom:4px;"><span>Time & Material</span><span>' + UI.money(tmTotal) + '</span></div>'
      + '<div style="background:#e2e8f0;border-radius:6px;height:8px;"><div style="background:var(--accent);border-radius:6px;height:100%;width:' + Math.round((tmTotal / barMax) * 100) + '%;"></div></div>'
      + '</div>'

      // Average
      + '<div style="background:#fff;border-radius:8px;padding:14px;text-align:center;border:2px solid #7c3aed;">'
      + '<div style="font-size:12px;color:var(--text-light);margin-bottom:4px;">RECOMMENDED PRICE (Average)</div>'
      + '<div style="font-size:28px;font-weight:800;color:#5b21b6;">' + UI.money(average) + '</div>'
      + '<div style="font-size:12px;color:var(--text-light);margin-top:4px;">Difference: ' + UI.money(diff) + ' (' + diffPct + '%) — ' + higher + ' is higher</div>'
      + '</div>'

      // Use buttons
      + '<div style="display:flex;gap:8px;margin-top:12px;">'
      + '<button type="button" onclick="QuotesPage._usePrice(' + perTreeTotal + ')" class="btn btn-outline" style="flex:1;font-size:12px;">Use Per Tree (' + UI.money(perTreeTotal) + ')</button>'
      + '<button type="button" onclick="QuotesPage._usePrice(' + average + ')" class="btn btn-primary" style="flex:1;font-size:12px;background:#7c3aed;">Use Average (' + UI.money(average) + ')</button>'
      + '<button type="button" onclick="QuotesPage._usePrice(' + tmTotal + ')" class="btn btn-outline" style="flex:1;font-size:12px;">Use T&M (' + UI.money(tmTotal) + ')</button>'
      + '</div>';

    // Scroll to comparison
    panel.scrollIntoView({ behavior: 'smooth' });
  },

  _usePrice: function(price) {
    // Update the first line item or add a total adjustment to match the selected price
    var currentTotal = 0;
    document.querySelectorAll('.quote-item-row').forEach(function(row) {
      currentTotal += (parseFloat(row.querySelector('.q-item-qty').value) || 0) * (parseFloat(row.querySelector('.q-item-rate').value) || 0);
    });

    if (Math.abs(currentTotal - price) < 1) {
      UI.toast('Price already matches');
      return;
    }

    var diff = price - currentTotal;
    if (diff > 0) {
      // Add a line item for the adjustment
      QuotesPage.addItem();
      setTimeout(function() {
        var rows = document.querySelectorAll('.quote-item-row');
        var last = rows[rows.length - 1];
        if (last) {
          last.querySelector('.q-item-service').value = 'Price adjustment';
          last.querySelector('.q-item-desc').value = 'Adjusted to match production estimate';
          last.querySelector('.q-item-qty').value = '1';
          last.querySelector('.q-item-rate').value = diff.toFixed(2);
        }
        QuotesPage.calcTotal();
        UI.toast('Price adjusted to ' + UI.money(price));
      }, 100);
    } else {
      UI.toast('To lower the price, edit individual line items');
    }
  },

  _updateMargin: function() {
    var costEl = document.getElementById('q-est-cost');
    var totalEl = document.getElementById('q-total-display');
    var profitEl = document.getElementById('q-profit-display');
    var pctEl = document.getElementById('q-margin-pct');
    if (!costEl || !totalEl || !profitEl) return;
    var cost = parseFloat(costEl.value) || 0;
    var total = parseFloat((totalEl.textContent || '').replace(/[^0-9.]/g, '')) || 0;
    var profit = total - cost;
    var margin = total > 0 ? Math.round((profit / total) * 100) : 0;
    profitEl.textContent = UI.money(profit);
    profitEl.style.color = profit >= 0 ? 'var(--green-dark)' : 'var(--red)';
    pctEl.textContent = '(' + margin + '%)';
    pctEl.style.color = margin >= 40 ? 'var(--green-dark)' : margin >= 20 ? '#e07c24' : 'var(--red)';
  },

  // Prompt for a new client inline without losing the quote form state
  _promptNewClient: function() {
    var name = prompt('New client name:');
    if (!name || !name.trim()) return;
    var newClient = DB.clients.create({
      name: name.trim(),
      status: 'lead',
      createdAt: new Date().toISOString()
    });
    QuotesPage._selectClient(newClient.id, newClient.name);
  },

  // Show the 8 most recent clients when the search field is focused but empty.
  // (Different from the "Recent" pill row, which is the 5 most recently-quoted.)
  _showRecentClients: function() {
    var input = document.getElementById('q-client-search');
    if (!input || input.value.length >= 2) return;
    var results = document.getElementById('q-client-results');
    if (!results) return;
    var allClients = [];
    try { allClients = JSON.parse(localStorage.getItem('bm-clients') || '[]'); } catch(e) {}
    var recent = allClients.slice().sort(function(a,b){
      return (b.createdAt||'').localeCompare(a.createdAt||'');
    }).slice(0, 8);
    if (!recent.length) return;
    var html = '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;max-height:260px;overflow-y:auto;box-shadow:0 4px 12px rgba(0,0,0,.1);">';
    recent.forEach(function(c) {
      html += '<div onclick="QuotesPage._selectClient(\'' + c.id + '\',\'' + UI.esc(c.name).replace(/'/g,"\\'") + '\')" style="padding:12px 14px;cursor:pointer;border-bottom:1px solid #f5f5f5;font-size:14px;" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\'\'">'
        + '<strong>' + UI.esc(c.name) + '</strong>'
        + (c.address ? '<div style="font-size:12px;color:var(--text-light);margin-top:2px;">' + UI.esc(c.address) + '</div>' : '')
        + '</div>';
    });
    html += '</div>';
    results.innerHTML = html;
    results.style.display = 'block';
  },

  _clientSearchTimeout: null,
  _searchClient: function(query) {
    clearTimeout(QuotesPage._clientSearchTimeout);
    var results = document.getElementById('q-client-results');
    if (!query || query.length < 2) { results.style.display = 'none'; return; }
    QuotesPage._clientSearchTimeout = setTimeout(function() {
      var q = query.toLowerCase();
      var allClients = [];
      try { allClients = JSON.parse(localStorage.getItem('bm-clients') || '[]'); } catch(e) {}
      var matches = allClients.filter(function(c) {
        return (c.name || '').toLowerCase().indexOf(q) >= 0 || (c.address || '').toLowerCase().indexOf(q) >= 0 || (c.phone || '').indexOf(q) >= 0;
      }).slice(0, 8);
      if (matches.length === 0) {
        results.innerHTML = '<div style="padding:10px 14px;font-size:13px;color:var(--text-light);background:var(--white);border:1px solid var(--border);border-radius:8px;margin-top:4px;">No clients found. <button type="button" style="color:var(--accent);background:none;border:none;cursor:pointer;font-weight:600;text-decoration:underline;" onclick="QuotesPage._newClientInline()">+ Create new</button></div>';
        results.style.display = 'block';
        return;
      }
      var html = '<div style="background:var(--white);border:1px solid var(--border);border-radius:8px;margin-top:4px;max-height:250px;overflow-y:auto;box-shadow:0 4px 12px rgba(0,0,0,.1);">';
      matches.forEach(function(c) {
        html += '<div onclick="QuotesPage._selectClient(\'' + c.id + '\',\'' + UI.esc(c.name).replace(/'/g,"\\'") + '\')" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid #f5f5f5;font-size:14px;" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\'\'">'
          + '<strong>' + UI.esc(c.name) + '</strong>'
          + (c.address ? '<div style="font-size:12px;color:var(--text-light);margin-top:1px;">' + UI.esc(c.address) + '</div>' : '')
          + '</div>';
      });
      html += '</div>';
      results.innerHTML = html;
      results.style.display = 'block';
    }, 150);
  },

  _selectClient: function(id, name) {
    document.getElementById('q-clientId').value = id;
    document.getElementById('q-client-search').value = name;
    document.getElementById('q-client-results').style.display = 'none';
    var client = DB.clients.getById(id);
    if (client && client.address) {
      var prop = document.getElementById('q-property');
      if (prop && !prop.value) prop.value = client.address;
    }
    // Update the collapsible client box summary
    var box = document.querySelector('.q-client-box');
    if (box) {
      var nameEl = box.querySelector('.q-client-summary-name');
      var addrEl = box.querySelector('.q-client-summary-addr');
      if (nameEl) { nameEl.textContent = name; nameEl.style.color = 'var(--text)'; }
      if (addrEl && client && client.address) addrEl.textContent = '📍 ' + client.address;
    }
    // Progressive disclosure: reveal line items
    var gate = document.getElementById('q-pick-client-first');
    var section = document.getElementById('q-items-section');
    if (gate) gate.style.display = 'none';
    if (section) {
      section.style.display = 'block';
      setTimeout(function() { section.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
    }
    // Auto-collapse the client box now that it's picked
    QuotesPage._collapseClientBox();
  },

  // Toggle collapse/expand on the Client section
  _toggleClientBox: function(headerEl) {
    var box = headerEl.closest('.q-client-box');
    if (!box) return;
    var body = box.querySelector('.q-client-body');
    var chev = box.querySelector('.q-client-chevron');
    if (!body) return;
    var collapsed = body.style.display === 'none';
    body.style.display = collapsed ? 'block' : 'none';
    if (chev) chev.style.transform = collapsed ? 'rotate(0deg)' : 'rotate(-90deg)';
  },
  _collapseClientBox: function() {
    var box = document.querySelector('.q-client-box');
    if (!box) return;
    var body = box.querySelector('.q-client-body');
    var chev = box.querySelector('.q-client-chevron');
    if (body) body.style.display = 'none';
    if (chev) chev.style.transform = 'rotate(-90deg)';
  },

  _newClientInline: function() {
    var name = document.getElementById('q-client-search').value.trim();
    if (!name) return;
    var newClient = DB.clients.create({ name: name, status: 'lead' });
    QuotesPage._selectClient(newClient.id, newClient.name);
    UI.toast('Client "' + name + '" created');
  },

  _applyEstimator: function() {
    var calc = (typeof Estimator !== 'undefined') ? Estimator._lastCalc : null;
    if (!calc) { UI.toast('Calculate a price first', 'error'); return; }

    var items = calc.lineItems.map(function(li) {
      return { service: li.service, description: li.description, qty: li.qty, rate: li.rate, amount: li.amount };
    });
    if (calc.insurance > 0) {
      items.push({ service: 'Insurance & Compliance', description: 'WC, GL, Disability, Payroll, Auto', qty: 1, rate: calc.insurance, amount: calc.insurance });
    }
    if (calc.markup > 0) {
      items.push({ service: 'Service Fee', description: 'Coordination & management', qty: 1, rate: calc.markup, amount: calc.markup });
    }
    QuotesPage._fillFromEstimator(items, calc.total);

    // Collapse the estimator
    var estEl = document.getElementById('inline-estimator');
    if (estEl) estEl.style.display = 'none';

    UI.toast('Calculator applied — ' + items.length + ' line items, ' + UI.money(calc.total));
  },

  _fillFromEstimator: function(items, total) {
    // Clear existing line items
    var container = document.getElementById('q-items');
    if (!container) return;
    container.innerHTML = '';
    var services = DB.services.getAll();

    // Add each item from estimator
    items.forEach(function(item) {
      var div = document.createElement('div');
      div.innerHTML = QuotesPage._itemRow(container.children.length, item, services);
      container.appendChild(div.firstChild);
    });

    // Update total display
    var totalEl = document.getElementById('q-total-display');
    if (totalEl) totalEl.textContent = UI.money(total);

    UI.toast('Estimate applied — ' + items.length + ' line items, ' + UI.money(total));
  },

  // --- Inline Line Item Editor for Detail View ---

  renderLineItems: function(q, id) {
    var services = DB.services.getAll();
    var items = q.lineItems || [];
    var subtotal = 0;
    items.forEach(function(item) { subtotal += (item.qty || 0) * (item.rate || 0); });
    var discount = q.discount || 0;
    var grandTotal = subtotal - discount;

    var html = '<div id="li-section" style="background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border);">'
      + '<h4 style="font-size:15px;font-weight:700;margin:0;">Product / Service</h4>'
      + '<div style="display:flex;gap:6px;">'
      + '<button class="btn btn-primary" style="font-size:12px;padding:5px 12px;" onclick="QuotesPage.addLineItem(\'' + id + '\')">+ Add Line Item</button>'
      + '<button class="btn btn-outline" style="font-size:12px;padding:5px 12px;" onclick="QuotesPage.addLineItem(\'' + id + '\', true)">+ Custom Item</button>'
      + '</div></div>';

    if (items.length > 0) {
      html += '<table class="data-table" style="border:none;border-radius:0;"><thead><tr>'
        + '<th>Service / Description</th><th style="width:70px;">Qty</th>'
        + '<th style="text-align:right;width:100px;">Unit Price</th>'
        + '<th style="text-align:right;width:90px;">Total</th>'
        + '<th style="width:40px;"></th>'
        + '</tr></thead><tbody id="li-tbody">';
      items.forEach(function(item, idx) {
        var lineTotal = (item.qty || 0) * (item.rate || 0);
        html += '<tr id="li-row-' + idx + '">'
          + '<td>'
          + '<strong class="li-name" onclick="QuotesPage.editLineItem(\'' + id + '\',' + idx + ')" style="cursor:pointer;" title="Click to edit">' + UI.esc(item.service || item.name || 'Custom') + '</strong>'
          + (item.description ? '<br><span style="color:var(--text-light);font-size:12px;">' + UI.esc(item.description) + '</span>' : '')
          + '</td>'
          + '<td><input type="number" class="li-qty-input" value="' + (item.qty || 1) + '" min="0" step="1" style="width:60px;text-align:center;padding:4px 6px;border:1px solid var(--border);border-radius:4px;font-size:13px;" onblur="QuotesPage.updateLineItemField(\'' + id + '\',' + idx + ',\'qty\',this.value)" onkeydown="if(event.key===\'Enter\'){this.blur();}"></td>'
          + '<td style="text-align:right;"><input type="number" class="li-rate-input" value="' + (item.rate || 0) + '" min="0" step="0.01" style="width:90px;text-align:right;padding:4px 6px;border:1px solid var(--border);border-radius:4px;font-size:13px;" onblur="QuotesPage.updateLineItemField(\'' + id + '\',' + idx + ',\'rate\',this.value)" onkeydown="if(event.key===\'Enter\'){this.blur();}"></td>'
          + '<td style="text-align:right;font-weight:600;" id="li-total-' + idx + '">' + UI.money(lineTotal) + '</td>'
          + '<td style="text-align:center;"><button onclick="QuotesPage.removeLineItem(\'' + id + '\',' + idx + ')" style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--red);opacity:.6;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.6" title="Delete line item">🗑️</button></td>'
          + '</tr>';
      });
      html += '</tbody></table>';

      // Subtotal / Discount / Grand Total
      var taxRateDisplay = q.taxRate !== undefined ? q.taxRate : (parseFloat(localStorage.getItem('bm-tax-rate')) || 8.375);
      var taxAmtDisplay = Math.round(grandTotal * taxRateDisplay / 100 * 100) / 100;
      var totalWithTax = grandTotal + taxAmtDisplay;
      html += '<div style="padding:12px 16px;border-top:1px solid var(--border);">'
        + '<div style="display:flex;justify-content:flex-end;">'
        + '<table style="font-size:14px;min-width:260px;">'
        + '<tr><td style="padding:4px 16px 4px 0;text-align:right;color:var(--text-light);">Subtotal</td><td style="padding:4px 0;text-align:right;font-weight:600;">' + UI.money(subtotal) + '</td></tr>';
      html += '<tr><td style="padding:4px 16px 4px 0;text-align:right;color:var(--text-light);">Discount</td>'
        + '<td style="padding:4px 0;text-align:right;">'
        + '<input type="number" id="li-discount" value="' + discount + '" min="0" step="0.01" style="width:90px;text-align:right;font-size:13px;padding:4px 6px;border:1px solid var(--border);border-radius:4px;" onchange="QuotesPage.updateDiscount(\'' + id + '\',this.value)">'
        + '</td></tr>';
      html += '<tr><td style="padding:4px 16px 4px 0;text-align:right;color:var(--text-light);">Tax (' + taxRateDisplay + '%)</td><td style="padding:4px 0;text-align:right;font-weight:600;">' + UI.money(taxAmtDisplay) + '</td></tr>';
      html += '<tr style="border-top:2px solid var(--border);"><td style="padding:8px 16px 4px 0;text-align:right;font-weight:700;font-size:15px;">Total</td>'
        + '<td style="padding:8px 0 4px;text-align:right;font-weight:800;font-size:16px;color:var(--accent);">' + UI.money(totalWithTax) + '</td></tr>';
      html += '</table></div></div>';
    } else {
      // No line items — check if services exist
      if (services.length === 0) {
        html += '<div style="padding:24px;text-align:center;color:var(--text-light);font-size:13px;">'
          + '<div style="font-size:24px;margin-bottom:8px;">📦</div>'
          + 'No services in catalog. Add services in <strong>Settings → Products & Services</strong>'
          + '</div>';
      } else {
        html += '<div style="padding:24px;text-align:center;color:var(--text-light);font-size:13px;">'
          + '<div style="font-size:24px;margin-bottom:8px;">📋</div>'
          + 'No line items yet. Click <strong>+ Add Line Item</strong> to get started.'
          + '</div>';
      }
    }

    // Add-row area (hidden by default, shown when adding)
    html += '<div id="li-add-row" style="display:none;"></div>';
    html += '</div>';
    return html;
  },

  addLineItem: function(quoteId, isCustom) {
    var services = DB.services.getAll();
    var container = document.getElementById('li-add-row');
    if (!container) return;

    // Build category-grouped options
    var optionsHtml = '<option value="">-- Select a service --</option>';
    if (!isCustom && services.length > 0) {
      var categories = {};
      services.forEach(function(s) {
        var cat = s.category || 'Other';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(s);
      });
      var catKeys = Object.keys(categories).sort();
      catKeys.forEach(function(cat) {
        optionsHtml += '<optgroup label="' + UI.esc(cat) + '">';
        categories[cat].forEach(function(s) {
          optionsHtml += '<option value="' + s.id + '" data-name="' + UI.esc(s.name) + '" data-desc="' + UI.esc(s.description || '') + '" data-price="' + (s.unitPrice || 0) + '">' + UI.esc(s.name) + (s.unitPrice ? ' — ' + UI.money(s.unitPrice) : '') + '</option>';
        });
        optionsHtml += '</optgroup>';
      });
    }

    var rowHtml = '<div style="padding:12px 16px;border-top:1px solid var(--border);background:#f9fafb;">'
      + '<div style="font-size:13px;font-weight:700;margin-bottom:8px;">' + (isCustom ? 'Add Custom Item' : 'Add Service from Catalog') + '</div>'
      + '<div style="display:grid;grid-template-columns:2fr 2fr 70px 100px 90px;gap:8px;align-items:end;">';

    if (isCustom) {
      rowHtml += '<div class="form-group" style="margin:0;"><label style="font-size:11px;font-weight:600;">Name</label>'
        + '<input type="text" id="li-new-name" placeholder="Item name..." style="font-size:13px;"></div>';
    } else {
      rowHtml += '<div class="form-group" style="margin:0;"><label style="font-size:11px;font-weight:600;">Service</label>'
        + '<select id="li-new-service" onchange="QuotesPage._onNewServiceSelect()" style="font-size:13px;">' + optionsHtml + '</select></div>';
    }

    rowHtml += '<div class="form-group" style="margin:0;"><label style="font-size:11px;font-weight:600;">Description</label>'
      + '<input type="text" id="li-new-desc" placeholder="Work details..." style="font-size:13px;"></div>'
      + '<div class="form-group" style="margin:0;"><label style="font-size:11px;font-weight:600;">Qty</label>'
      + '<input type="number" id="li-new-qty" value="1" min="1" style="font-size:13px;text-align:center;" oninput="QuotesPage._calcNewLineTotal()"></div>'
      + '<div class="form-group" style="margin:0;"><label style="font-size:11px;font-weight:600;">Unit Price ($)</label>'
      + '<input type="number" id="li-new-rate" value="" step="0.01" placeholder="0.00" style="font-size:13px;" oninput="QuotesPage._calcNewLineTotal()"></div>'
      + '<div class="form-group" style="margin:0;"><label style="font-size:11px;font-weight:600;">Total</label>'
      + '<div id="li-new-total" style="font-size:14px;font-weight:700;color:var(--green-dark);padding:8px 0;">$0.00</div></div>'
      + '</div>'
      + '<div style="display:flex;gap:6px;margin-top:10px;">'
      + '<button class="btn btn-primary" style="font-size:12px;padding:5px 14px;" onclick="QuotesPage.saveLineItem(\'' + quoteId + '\',' + (isCustom ? 'true' : 'false') + ')">Save</button>'
      + '<button class="btn btn-outline" style="font-size:12px;padding:5px 14px;" onclick="document.getElementById(\'li-add-row\').style.display=\'none\';">Cancel</button>'
      + '</div></div>';

    container.innerHTML = rowHtml;
    container.style.display = 'block';

    // Focus the first input
    setTimeout(function() {
      var el = document.getElementById(isCustom ? 'li-new-name' : 'li-new-service');
      if (el) el.focus();
    }, 50);
  },

  _onNewServiceSelect: function() {
    var sel = document.getElementById('li-new-service');
    if (!sel) return;
    var opt = sel.options[sel.selectedIndex];
    if (!opt || !opt.value) return;
    var descEl = document.getElementById('li-new-desc');
    var rateEl = document.getElementById('li-new-rate');
    if (descEl && opt.dataset.desc) descEl.value = opt.dataset.desc;
    if (rateEl && opt.dataset.price) rateEl.value = opt.dataset.price;
    QuotesPage._calcNewLineTotal();
  },

  _calcNewLineTotal: function() {
    var qty = parseFloat((document.getElementById('li-new-qty') || {}).value) || 0;
    var rate = parseFloat((document.getElementById('li-new-rate') || {}).value) || 0;
    var el = document.getElementById('li-new-total');
    if (el) el.textContent = UI.money(qty * rate);
  },

  saveLineItem: function(quoteId, isCustom) {
    var q = DB.quotes.getById(quoteId);
    if (!q) return;
    var items = q.lineItems ? q.lineItems.slice() : [];

    var name, description, qty, rate, serviceId;
    if (isCustom) {
      name = (document.getElementById('li-new-name') || {}).value || '';
      if (!name.trim()) { UI.toast('Enter an item name', 'error'); return; }
    } else {
      var sel = document.getElementById('li-new-service');
      if (!sel || !sel.value) { UI.toast('Select a service', 'error'); return; }
      var opt = sel.options[sel.selectedIndex];
      serviceId = sel.value;
      name = opt.dataset.name || opt.textContent;
    }
    description = (document.getElementById('li-new-desc') || {}).value || '';
    qty = parseFloat((document.getElementById('li-new-qty') || {}).value) || 1;
    rate = parseFloat((document.getElementById('li-new-rate') || {}).value) || 0;

    var newItem = {
      id: 'li-' + Date.now(),
      serviceId: serviceId || null,
      service: name,
      name: name,
      description: description,
      qty: qty,
      rate: rate,
      amount: qty * rate
    };
    items.push(newItem);

    var total = 0;
    items.forEach(function(it) { total += (it.qty || 0) * (it.rate || 0); });
    total = total - (q.discount || 0);

    DB.quotes.update(quoteId, { lineItems: items, total: total });
    UI.toast('Line item added');
    QuotesPage.showDetail(quoteId);
  },

  editLineItem: function(quoteId, itemIdx) {
    var q = DB.quotes.getById(quoteId);
    if (!q || !q.lineItems || !q.lineItems[itemIdx]) return;
    var item = q.lineItems[itemIdx];
    var services = DB.services.getAll();

    // Build category-grouped options
    var optionsHtml = '<option value="">-- Select or keep current --</option>';
    var categories = {};
    services.forEach(function(s) {
      var cat = s.category || 'Other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(s);
    });
    var catKeys = Object.keys(categories).sort();
    catKeys.forEach(function(cat) {
      optionsHtml += '<optgroup label="' + UI.esc(cat) + '">';
      categories[cat].forEach(function(s) {
        var selected = (item.serviceId === s.id || item.service === s.name) ? ' selected' : '';
        optionsHtml += '<option value="' + s.id + '" data-name="' + UI.esc(s.name) + '" data-desc="' + UI.esc(s.description || '') + '" data-price="' + (s.unitPrice || 0) + '"' + selected + '>' + UI.esc(s.name) + '</option>';
      });
      optionsHtml += '</optgroup>';
    });

    var lineTotal = (item.qty || 0) * (item.rate || 0);

    var rowHtml = '<tr id="li-edit-row" style="background:#fffde7;">'
      + '<td><select id="li-edit-service" style="font-size:13px;margin-bottom:4px;width:100%;" onchange="QuotesPage._onEditServiceSelect()">' + optionsHtml + '</select>'
      + '<input type="text" id="li-edit-name" value="' + UI.esc(item.service || item.name || '') + '" placeholder="Item name" style="font-size:12px;margin-bottom:4px;width:100%;">'
      + '<input type="text" id="li-edit-desc" value="' + UI.esc(item.description || '') + '" placeholder="Description" style="font-size:12px;width:100%;"></td>'
      + '<td><input type="number" id="li-edit-qty" value="' + (item.qty || 1) + '" min="1" style="font-size:13px;text-align:center;width:55px;" oninput="QuotesPage._calcEditLineTotal()"></td>'
      + '<td style="text-align:right;"><input type="number" id="li-edit-rate" value="' + (item.rate || 0) + '" step="0.01" style="font-size:13px;text-align:right;width:85px;" oninput="QuotesPage._calcEditLineTotal()"></td>'
      + '<td style="text-align:right;font-weight:600;" id="li-edit-total">' + UI.money(lineTotal) + '</td>'
      + '<td style="text-align:center;">'
      + '<button class="btn btn-primary" style="font-size:11px;padding:3px 8px;margin-bottom:2px;display:block;width:100%;" onclick="QuotesPage._saveEditedItem(\'' + quoteId + '\',' + itemIdx + ')">Save</button>'
      + '<button class="btn btn-outline" style="font-size:11px;padding:3px 8px;display:block;width:100%;" onclick="QuotesPage.showDetail(\'' + quoteId + '\')">Cancel</button>'
      + '</td></tr>';

    // Replace the row
    var existingRow = document.getElementById('li-row-' + itemIdx);
    if (existingRow) {
      existingRow.outerHTML = rowHtml;
    }
  },

  _onEditServiceSelect: function() {
    var sel = document.getElementById('li-edit-service');
    if (!sel) return;
    var opt = sel.options[sel.selectedIndex];
    if (!opt || !opt.value) return;
    var nameEl = document.getElementById('li-edit-name');
    var descEl = document.getElementById('li-edit-desc');
    var rateEl = document.getElementById('li-edit-rate');
    if (nameEl && opt.dataset.name) nameEl.value = opt.dataset.name;
    if (descEl && opt.dataset.desc) descEl.value = opt.dataset.desc;
    if (rateEl && opt.dataset.price && parseFloat(opt.dataset.price) > 0) rateEl.value = opt.dataset.price;
    QuotesPage._calcEditLineTotal();
  },

  _calcEditLineTotal: function() {
    var qty = parseFloat((document.getElementById('li-edit-qty') || {}).value) || 0;
    var rate = parseFloat((document.getElementById('li-edit-rate') || {}).value) || 0;
    var el = document.getElementById('li-edit-total');
    if (el) el.textContent = UI.money(qty * rate);
  },

  _saveEditedItem: function(quoteId, itemIdx) {
    var q = DB.quotes.getById(quoteId);
    if (!q || !q.lineItems || !q.lineItems[itemIdx]) return;
    var items = q.lineItems.slice();

    var sel = document.getElementById('li-edit-service');
    var serviceId = sel ? sel.value : null;
    var name = (document.getElementById('li-edit-name') || {}).value || '';
    var description = (document.getElementById('li-edit-desc') || {}).value || '';
    var qty = parseFloat((document.getElementById('li-edit-qty') || {}).value) || 1;
    var rate = parseFloat((document.getElementById('li-edit-rate') || {}).value) || 0;

    items[itemIdx] = {
      id: items[itemIdx].id || ('li-' + Date.now()),
      serviceId: serviceId || items[itemIdx].serviceId || null,
      service: name,
      name: name,
      description: description,
      qty: qty,
      rate: rate,
      amount: qty * rate
    };

    var total = 0;
    items.forEach(function(it) { total += (it.qty || 0) * (it.rate || 0); });
    total = total - (q.discount || 0);

    DB.quotes.update(quoteId, { lineItems: items, total: total });
    UI.toast('Line item updated');
    QuotesPage.showDetail(quoteId);
  },

  // On-the-fly single-field update (qty or rate) — no modal
  updateLineItemField: function(quoteId, itemIdx, field, value) {
    var q = DB.quotes.getById(quoteId);
    if (!q || !q.lineItems || !q.lineItems[itemIdx]) return;
    var items = q.lineItems.slice();
    var newVal = parseFloat(value) || 0;
    if (items[itemIdx][field] === newVal) return; // no change
    items[itemIdx][field] = newVal;
    items[itemIdx].amount = (items[itemIdx].qty || 0) * (items[itemIdx].rate || 0);

    var subtotal = 0;
    items.forEach(function(it) { subtotal += (it.qty || 0) * (it.rate || 0); });
    var discount = q.discount || 0;
    var afterDiscount = subtotal - discount;
    var taxRate = q.taxRate !== undefined ? q.taxRate : (parseFloat(localStorage.getItem('bm-tax-rate')) || 8.375);
    var tax = Math.round(afterDiscount * taxRate / 100 * 100) / 100;
    var total = afterDiscount + tax;

    DB.quotes.update(quoteId, { lineItems: items, total: total });
    QuotesPage.showDetail(quoteId);
  },

  removeLineItem: function(quoteId, itemIdx) {
    UI.confirm('Delete this line item?', function() {
      var q = DB.quotes.getById(quoteId);
      if (!q || !q.lineItems) return;
      var items = q.lineItems.slice();
      items.splice(itemIdx, 1);

      var total = 0;
      items.forEach(function(it) { total += (it.qty || 0) * (it.rate || 0); });
      total = total - (q.discount || 0);

      DB.quotes.update(quoteId, { lineItems: items, total: total });
      UI.toast('Line item removed');
      QuotesPage.showDetail(quoteId);
    });
  },

  updateDiscount: function(quoteId, val) {
    var q = DB.quotes.getById(quoteId);
    if (!q) return;
    var discount = parseFloat(val) || 0;
    var subtotal = 0;
    (q.lineItems || []).forEach(function(it) { subtotal += (it.qty || 0) * (it.rate || 0); });
    var afterDiscount = subtotal - discount;
    if (afterDiscount < 0) afterDiscount = 0;
    var taxRate = q.taxRate !== undefined ? q.taxRate : 8.375;
    var taxAmount = Math.round(afterDiscount * taxRate / 100 * 100) / 100;
    var total = afterDiscount + taxAmount;
    DB.quotes.update(quoteId, { discount: discount, subtotal: subtotal, taxAmount: taxAmount, total: total });
    QuotesPage.showDetail(quoteId);
  },

  convertToJob: function(quoteId) {
    var q = DB.quotes.getById(quoteId);
    if (!q) return;
    var job = DB.jobs.create({
      clientId: q.clientId,
      clientName: q.clientName,
      property: q.property,
      description: q.description,
      lineItems: q.lineItems,
      total: q.total,
      quoteId: quoteId,
      status: 'scheduled',
      scheduledDate: null
    });
    DB.quotes.update(quoteId, { status: 'converted', jobId: job.id });
    if (q.clientId) DB.clients.update(q.clientId, { status: 'active' });
    UI.toast('Job #' + job.jobNumber + ' created from quote');
    UI.closeModal();
    loadPage('jobs');
  },

  // ── Video Walkthrough ──
  _addVideo: function(quoteId) {
    var html = '<div style="text-align:center;margin-bottom:16px;">'
      + '<div style="font-size:48px;margin-bottom:8px;">🎥</div>'
      + '<p style="font-size:13px;color:var(--text-light);">Record a walkthrough of the property on your phone, upload it to YouTube as Unlisted, then paste the link below.</p>'
      + '</div>'
      + '<div style="background:var(--bg);border-radius:8px;padding:12px;margin-bottom:12px;">'
      + '<div style="font-size:12px;font-weight:700;margin-bottom:8px;">Quick steps:</div>'
      + '<div style="font-size:12px;color:var(--text-light);line-height:1.6;">'
      + '1. Open Camera app \u2192 Record video walking the property<br>'
      + '2. Open YouTube app \u2192 Tap + \u2192 Upload \u2192 Select video<br>'
      + '3. Set visibility to <strong>Unlisted</strong><br>'
      + '4. Copy the link \u2192 Paste below'
      + '</div></div>'
      + UI.field('YouTube Link', '<input type="url" id="vw-url" placeholder="https://youtu.be/... or https://youtube.com/watch?v=...">')
      + '<div style="font-size:11px;color:var(--text-light);margin-top:4px;">Unlisted = only people with the link can see it. Not public, not searchable.</div>';

    UI.showModal('Add Video Walkthrough', html, {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-primary" onclick="QuotesPage._saveVideo(\'' + quoteId + '\')">Save Video</button>'
    });
  },

  _saveVideo: function(quoteId) {
    var url = document.getElementById('vw-url').value.trim();
    if (!url) { UI.toast('Paste a YouTube link', 'error'); return; }
    if (url.indexOf('youtu') === -1 && url.indexOf('youtube') === -1) {
      UI.toast('Please use a YouTube link', 'error'); return;
    }
    DB.quotes.update(quoteId, { videoUrl: url });
    UI.closeModal();
    UI.toast('Video walkthrough added! \uD83C\uDFAC');
    QuotesPage.showDetail(quoteId);
  },

  _removeVideo: function(quoteId) {
    if (!confirm('Remove video from this quote?')) return;
    DB.quotes.update(quoteId, { videoUrl: null });
    UI.toast('Video removed');
    QuotesPage.showDetail(quoteId);
  },

  _archiveQuote: function(quoteId) {
    if (!confirm('Archive this quote? It will be hidden from the main list.')) return;
    DB.quotes.update(quoteId, { status: 'archived' });
    UI.toast('Quote archived');
    loadPage('quotes');
  },

  _deleteQuote: function(quoteId) {
    if (!confirm('Delete this quote permanently? This cannot be undone.')) return;
    DB.quotes.delete(quoteId);
    UI.toast('Quote deleted');
    loadPage('quotes');
  }
};

/**
 * Branch Manager — Quotes Page
 * Quote list, builder with line items, status management
 */
var QuotesPage = {
  _page: 0, _perPage: 50, _search: '', _filter: 'all', _sortCol: 'quoteNumber', _sortDir: 'desc',

  _co: function() {
    return {
      name: localStorage.getItem('bm-co-name') || 'Second Nature Tree Service',
      phone: localStorage.getItem('bm-co-phone') || '(914) 391-5233',
      email: localStorage.getItem('bm-co-email') || 'info@peekskilltree.com',
      website: localStorage.getItem('bm-co-website') || 'peekskilltree.com',
      licenses: localStorage.getItem('bm-co-licenses') || 'WC-32079, PC-50644'
    };
  },

  render: function() {
    var self = QuotesPage;
    var all = DB.quotes.getAll();
    var draft = all.filter(function(q) { return q.status === 'draft'; }).length;
    var sent = all.filter(function(q) { return q.status === 'sent' || q.status === 'awaiting'; }).length;
    var approved = all.filter(function(q) { return q.status === 'approved'; }).length;

    // Jobber-style stat cards row
    var converted = all.filter(function(q) { return q.status === 'converted'; });
    var changesReq = all.filter(function(q) { return q.status === 'changes_requested'; });
    var sentTotal = all.filter(function(q) { return q.status === 'sent' || q.status === 'awaiting'; }).reduce(function(s,q){return s+(q.total||0);},0);
    var convertedTotal = converted.reduce(function(s,q){return s+(q.total||0);},0);
    var convRate = all.length > 0 ? Math.round((converted.length + approved) / all.length * 100) : 0;

    var html = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:16px;background:var(--white);" class="stat-row">'
      // Overview
      + '<div onclick="QuotesPage._setFilter(\'all\')" style="padding:14px 16px;border-right:1px solid var(--border);cursor:pointer;">'
      + '<div style="font-size:14px;font-weight:700;margin-bottom:8px;">Overview</div>'
      + '<div style="font-size:12px;"><span style="color:#6c757d;">●</span> Draft (' + draft + ')</div>'
      + '<div style="font-size:12px;"><span style="color:#e6a817;">●</span> Awaiting response (' + sent + ')</div>'
      + '<div style="font-size:12px;"><span style="color:#dc3545;">●</span> Changes requested (' + changesReq.length + ')</div>'
      + '<div style="font-size:12px;"><span style="color:#2e7d32;">●</span> Approved (' + approved + ')</div>'
      + '</div>'
      // Conversion rate
      + '<div style="padding:14px 16px;border-right:1px solid var(--border);">'
      + '<div style="font-size:14px;font-weight:700;">Conversion rate</div>'
      + '<div style="font-size:12px;color:var(--text-light);">All time</div>'
      + '<div style="font-size:28px;font-weight:700;margin-top:4px;">' + convRate + '%</div>'
      + '</div>'
      // Sent (currently awaiting)
      + '<div onclick="QuotesPage._setFilter(\'sent\')" style="padding:14px 16px;border-right:1px solid var(--border);cursor:pointer;">'
      + '<div style="font-size:14px;font-weight:700;">Sent</div>'
      + '<div style="font-size:12px;color:var(--text-light);">Past 30 days</div>'
      + '<div style="font-size:28px;font-weight:700;margin-top:4px;">' + sent + '</div>'
      + '<div style="font-size:12px;color:var(--text-light);">' + UI.moneyInt(sentTotal) + '</div>'
      + '</div>'
      // Converted
      + '<div onclick="QuotesPage._setFilter(\'converted\')" style="padding:14px 16px;cursor:pointer;">'
      + '<div style="font-size:14px;font-weight:700;">Converted</div>'
      + '<div style="font-size:12px;color:var(--text-light);">All time</div>'
      + '<div style="font-size:28px;font-weight:700;margin-top:4px;">' + converted.length + '</div>'
      + '<div style="font-size:12px;color:var(--text-light);">' + UI.moneyInt(convertedTotal) + '</div>'
      + '</div>'
      + '</div>';

    var filtered = self._getFiltered();
    var page = filtered.slice(self._page * self._perPage, (self._page + 1) * self._perPage);

    // Jobber-style "All quotes (X results)" + filter chips + search
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">'
      + '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">'
      + '<h3 style="font-size:16px;font-weight:700;margin:0;">All quotes</h3>'
      + '<span style="font-size:13px;color:var(--text-light);">(' + filtered.length + ' results)</span>'
      + (function() {
        var chips = [['all','All'],['draft','Draft'],['awaiting','Awaiting Response'],['changes_requested','Changes Requested'],['approved','Approved'],['converted','Converted']];
        var out = '';
        for (var ci = 0; ci < chips.length; ci++) {
          var val = chips[ci][0], label = chips[ci][1];
          var isActive = self._filter === val;
          out += '<button onclick="QuotesPage._setFilter(\'' + val + '\')" style="font-size:12px;padding:5px 14px;border-radius:20px;border:1px solid ' + (isActive ? '#2e7d32' : 'var(--border)') + ';background:' + (isActive ? '#2e7d32' : 'var(--white)') + ';color:' + (isActive ? '#fff' : 'var(--text)') + ';cursor:pointer;font-weight:' + (isActive ? '600' : '500') + ';">' + label + '</button>';
        }
        return out;
      })()
      + '</div>'
      + '<div class="search-box" style="min-width:200px;max-width:280px;">'
      + '<span style="color:var(--text-light);">🔍</span>'
      + '<input type="text" placeholder="Search quotes..." value="' + UI.esc(self._search) + '" oninput="QuotesPage._search=this.value;QuotesPage._page=0;loadPage(\'quotes\')">'
      + '</div></div>';

    // Batch action bar
    html += '<div id="q-batch-bar" style="display:none;position:fixed;bottom:0;left:var(--sidebar-w,240px);right:0;z-index:500;background:#1a1a2e;color:#fff;padding:12px 24px;align-items:center;justify-content:space-between;box-shadow:0 -4px 20px rgba(0,0,0,.3);">'
      + '<span id="q-batch-count" style="font-weight:700;font-size:14px;">0 selected</span>'
      + '<div style="display:flex;gap:8px;align-items:center;">'
      + '<button onclick="QuotesPage._batchFollowUp()" style="background:#e6a817;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">📬 Send Follow-up</button>'
      + '<button onclick="QuotesPage._batchDecline()" style="background:#dc3545;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">✗ Mark Declined</button>'
      + '<button onclick="QuotesPage._batchClear()" style="background:none;color:rgba(255,255,255,.7);border:none;padding:8px 12px;font-size:16px;cursor:pointer;">&#10005;</button>'
      + '</div></div>';

    var now7ago = new Date(Date.now() - 7 * 86400000);
    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      + '<table class="data-table"><thead><tr>'
      + '<th style="width:32px;"><input type="checkbox" onchange="QuotesPage._selectAll(this.checked)" style="width:16px;height:16px;"></th>'
      + self._sortTh('Client', 'clientName') + self._sortTh('Quote number', 'quoteNumber') + '<th>Property</th>' + self._sortTh('Created', 'createdAt') + self._sortTh('Status', 'status') + self._sortTh('Total', 'total', 'text-align:right;')
      + '</tr></thead><tbody>';

    if (page.length === 0) {
      html += '<tr><td colspan="8">' + (self._search ? '<div style="text-align:center;padding:24px;color:var(--text-light);">No quotes match "' + self._search + '"</div>' : UI.emptyState('📋', 'No quotes yet', 'Create your first quote.', '+ New Quote', 'QuotesPage.showForm()')) + '</td></tr>';
    } else {
      page.forEach(function(q) {
        var isStale = (q.status === 'sent' || q.status === 'awaiting') && q.createdAt && new Date(q.createdAt) < now7ago;
        var rowStyle = 'cursor:pointer;' + (isStale ? 'background:#fffbf0;' : '');
        html += '<tr onclick="QuotesPage.showDetail(\'' + q.id + '\')" style="' + rowStyle + '">'
          + '<td onclick="event.stopPropagation()"><input type="checkbox" class="q-check" value="' + q.id + '" onchange="QuotesPage._updateBulk()" style="width:16px;height:16px;"></td>'
          + '<td><strong>' + UI.esc(q.clientName || '—') + '</strong>' + (isStale ? ' <span title="Sent 7+ days ago" style="font-size:10px;color:#e6a817;font-weight:700;background:#fff3cd;padding:1px 5px;border-radius:3px;">FOLLOW UP</span>' : '') + '</td>'
          + '<td>#' + (q.quoteNumber || '') + '</td>'
          + '<td style="font-size:13px;color:var(--text-light);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + UI.esc(q.property || '—') + '</td>'
          + '<td>' + UI.dateShort(q.createdAt) + '</td>'
          + '<td>' + UI.statusBadge(q.status) + '</td>'
          + '<td style="text-align:right;font-weight:600;">' + UI.money(q.total) + '</td>'
          + '</tr>';
      });
    }
    html += '</tbody></table></div>';

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
    return html;
  },

  _getFiltered: function() {
    var self = QuotesPage;
    var all = DB.quotes.getAll();
    if (self._filter !== 'all') {
      all = all.filter(function(q) {
        if (self._filter === 'awaiting' || self._filter === 'sent') return q.status === 'sent' || q.status === 'awaiting';
        return q.status === self._filter;
      });
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

  showForm: function(quoteId, clientId) {
    var q = quoteId ? DB.quotes.getById(quoteId) : {};
    var client = clientId ? DB.clients.getById(clientId) : (q.clientId ? DB.clients.getById(q.clientId) : null);
    var items = q.lineItems || [{ service: '', description: '', qty: 1, rate: 0 }];

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

    // Client selector
    if (client) {
      html += '<input type="hidden" id="q-clientId" value="' + client.id + '">'
        + '<div class="form-group"><label>Client</label><div style="padding:8px 12px;background:var(--bg);border-radius:8px;font-weight:600;">' + client.name + '<br><span style="font-weight:400;font-size:13px;color:var(--text-light);">' + (client.address || '') + '</span></div></div>';
    } else {
      var clientOptions = allClients.map(function(c) { return { value: c.id, label: c.name + (c.address ? ' — ' + c.address : '') }; });
      html += UI.formField('Client *', 'select', 'q-clientId', '', { options: [{ value: '', label: 'Select a client...' }].concat(clientOptions) });
    }

    html += UI.formField('Property Address', 'text', 'q-property', q.property || (client ? client.address : ''), { placeholder: 'Job site address' })
      + UI.formField('Description', 'text', 'q-description', q.description, { placeholder: 'e.g., Tree removal - 2 oaks' });

    // Inline Job Estimator (replaces popup)
    html += '<div style="margin:16px 0;background:#f9fafb;border:2px solid var(--border);border-radius:10px;padding:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;cursor:pointer;" onclick="var el=document.getElementById(\'inline-estimator\');el.style.display=el.style.display===\'none\'?\'block\':\'none\';">'
      + '<h4 style="font-size:15px;">🧮 Job Cost Calculator</h4><span style="color:var(--text-light);">▶</span></div>'
      + '<div id="inline-estimator" style="' + (items.length <= 1 ? '' : 'display:none;') + '">'
      + '<p style="font-size:12px;color:var(--text-light);margin-bottom:12px;">Select crew and equipment → costs auto-calculate → fills line items below.</p>'
      + (typeof Estimator !== 'undefined' ? Estimator.renderInline() : '<p style="font-size:13px;color:var(--text-light);">Estimator not available.</p>')
      + '<button type="button" class="btn btn-primary" style="margin-top:12px;width:100%;" onclick="QuotesPage._applyEstimator()">✅ Apply to Quote</button>'
      + '</div></div>';

    // Line items
    html += '<div style="margin:16px 0 8px;font-weight:700;">Line Items</div>'
      + '<div id="q-items">';
    items.forEach(function(item, i) {
      html += QuotesPage._itemRow(i, item, services);
    });
    html += '</div>'
      + '<button type="button" class="btn btn-outline" style="margin-top:8px;" onclick="QuotesPage.addItem()">+ Add Line Item</button>';

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
      + '<span style="color:var(--text-light);">Tax (<input type="number" id="q-tax-rate" value="' + _qTaxRate + '" step="0.001" min="0" max="100" oninput="QuotesPage.calcTotal()" style="width:55px;font-size:12px;padding:2px 4px;border:1px solid var(--border);border-radius:4px;text-align:center;">%)</span>'
      + '<span id="q-tax-display" style="font-weight:600;">' + UI.money(_qTaxAmt) + '</span>'
      + '</div>'
      + '<div style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;background:var(--green-dark);color:var(--white);">'
      + '<span style="font-weight:600;">Total</span>'
      + '<span id="q-total-display" style="font-size:1.5rem;font-weight:800;">' + UI.money(_qGrandTotal) + '</span>'
      + '</div>'
      + '</div>';

    // Property Map button
    html += '<div style="margin-top:16px;"><button type="button" class="btn btn-outline" onclick="PropertyMap.show(document.getElementById(\'q-property\').value)">🗺️ Open Property Map — Place Equipment</button></div>';

    html += UI.formField('Internal Notes', 'textarea', 'q-notes', q.notes, { placeholder: 'Notes (not shown to client)' });

    // Deposit section
    var depRequired = q.depositRequired || false;
    var depType = q.depositType || 'percent';
    var depAmount = q.depositAmount || 50;
    html += '<div style="background:#f8faf8;border:2px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">'
      + '<div><h4 style="font-size:14px;font-weight:700;">Require Deposit</h4><div style="font-size:12px;color:var(--text-light);">Client pays deposit before job is scheduled</div></div>'
      + '<label style="cursor:pointer;display:flex;align-items:center;gap:6px;"><input type="checkbox" id="q-deposit-req" onchange="QuotesPage._toggleDeposit(this.checked)" style="width:18px;height:18px;"' + (depRequired ? ' checked' : '') + '><span style="font-size:13px;font-weight:600;">' + (depRequired ? 'On' : 'Off') + '</span></label>'
      + '</div>'
      + '<div id="q-deposit-fields" style="' + (depRequired ? '' : 'display:none;') + 'display:' + (depRequired ? 'grid' : 'none') + ';grid-template-columns:1fr 1fr;gap:12px;">'
      + '<div><label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Deposit Type</label>'
      + '<select id="q-deposit-type" onchange="QuotesPage._calcDeposit()" style="width:100%;padding:8px 12px;border:2px solid var(--border);border-radius:8px;font-size:14px;">'
      + '<option value="percent"' + (depType === 'percent' ? ' selected' : '') + '>Percentage (%)</option>'
      + '<option value="flat"' + (depType === 'flat' ? ' selected' : '') + '>Flat Amount ($)</option>'
      + '</select></div>'
      + '<div><label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Amount</label>'
      + '<input type="number" id="q-deposit-amount" value="' + depAmount + '" min="1" oninput="QuotesPage._calcDeposit()" style="width:100%;padding:8px 12px;border:2px solid var(--border);border-radius:8px;font-size:14px;"></div>'
      + '</div>'
      + '<div id="q-deposit-preview" style="margin-top:10px;font-size:13px;color:var(--green-dark);font-weight:600;' + (depRequired ? '' : 'display:none;') + '"></div>'
      + '</div>'

      // Expiry
      + '<div style="margin-bottom:16px;">'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Quote Valid Until</label>'
      + '<input type="date" id="q-expires" value="' + (q.expiresAt ? q.expiresAt.substring(0,10) : new Date(Date.now() + 30*86400000).toISOString().substring(0,10)) + '" style="width:100%;padding:8px 12px;border:2px solid var(--border);border-radius:8px;font-size:14px;">'
      + '</div>'
      + '</form>';

    UI.showModal(quoteId ? 'Edit Quote #' + q.quoteNumber : 'New Quote', html, {
      wide: true,
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-outline" onclick="QuotesPage.saveAs(\'draft\')">Save Draft</button>'
        + ' <button class="btn btn-primary" onclick="QuotesPage.saveAs(\'sent\')">Save & Send</button>'
    });
  },

  // Default rates for common services (editable in settings)
  _defaultRates: {
    'Tree Removal': 0, 'Tree Pruning': 0, 'Stump Removal': 150, 'Bucket Truck': 600,
    'Cabling': 300, 'Land Clearing': 0, 'Snow Removal': 0, 'Chipping Brush': 350,
    'Haul Debris': 250, 'Labor': 400, 'Gutter Clean Out': 150, 'Arborist Letter': 350,
    'Firewood Cord': 400, 'Firewood Bundle': 10, 'Free Woodchips': 0, 'Free Estimate': 0
  },

  _itemRow: function(index, item, services) {
    var svcOptions = services.map(function(s) {
      return '<option value="' + s.name + '"' + (item.service === s.name ? ' selected' : '') + '>' + s.name + (s.type === 'product' ? ' (product)' : '') + '</option>';
    }).join('');

    var lineTotal = ((item.qty || 1) * (item.rate || 0));

    return '<div class="quote-item-row" style="display:grid;grid-template-columns:2fr 2fr 60px 90px 80px 36px;gap:8px;align-items:end;margin-bottom:8px;padding:10px 12px;background:var(--bg);border-radius:8px;border:1px solid var(--border);">'
      + '<div class="form-group" style="margin:0;"><label style="font-size:11px;font-weight:600;">Service</label><select class="q-item-service" onchange="QuotesPage._onServiceChange(this)" style="font-size:13px;"><option value="">— Select or type custom —</option>' + svcOptions + '</select></div>'
      + '<div class="form-group" style="margin:0;"><label style="font-size:11px;font-weight:600;">Description</label><input class="q-item-desc" value="' + UI.esc(item.description || '') + '" placeholder="Work details..." style="font-size:13px;"></div>'
      + '<div class="form-group" style="margin:0;"><label style="font-size:11px;font-weight:600;">Qty</label><input type="number" class="q-item-qty" value="' + (item.qty || 1) + '" min="1" oninput="QuotesPage.calcTotal()" style="font-size:13px;text-align:center;"></div>'
      + '<div class="form-group" style="margin:0;"><label style="font-size:11px;font-weight:600;">Rate ($)</label><input type="number" class="q-item-rate" value="' + (item.rate || '') + '" step="0.01" placeholder="0.00" oninput="QuotesPage.calcTotal()" style="font-size:13px;"></div>'
      + '<div class="form-group" style="margin:0;"><label style="font-size:11px;font-weight:600;">Amount</label><div class="q-item-amount" style="font-size:14px;font-weight:700;color:var(--green-dark);padding:8px 0;">' + UI.money(lineTotal) + '</div></div>'
      + '<button type="button" style="background:none;border:none;font-size:20px;color:var(--red);cursor:pointer;padding-bottom:8px;opacity:.6;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.6" onclick="this.parentElement.remove();QuotesPage.calcTotal();">✕</button>'
      + '</div>';
  },

  _onServiceChange: function(sel) {
    var row = sel.closest('.quote-item-row');
    var svc = sel.value;
    var rate = QuotesPage._defaultRates[svc];
    if (rate && rate > 0) {
      row.querySelector('.q-item-rate').value = rate;
    }
    // Auto-fill description from service catalog
    var services = DB.services.getAll();
    var match = services.find(function(s) { return s.name === svc; });
    var descInput = row.querySelector('.q-item-desc');
    if (match && match.description && !descInput.value) {
      descInput.value = match.description;
    }
    QuotesPage.calcTotal();
  },

  addItem: function() {
    var container = document.getElementById('q-items');
    var index = container.children.length;
    var services = DB.services.getAll();
    var div = document.createElement('div');
    div.innerHTML = QuotesPage._itemRow(index, {}, services);
    container.appendChild(div.firstChild);
    // Focus the new service dropdown
    var newRow = container.lastElementChild;
    if (newRow) { var sel = newRow.querySelector('.q-item-service'); if (sel) sel.focus(); }
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
    var form = e.target;
    var clientId = document.getElementById('q-clientId').value;
    if (!clientId) { UI.toast('Select a client', 'error'); return; }
    var client = DB.clients.getById(clientId);

    var items = [];
    var subtotal = 0;
    document.querySelectorAll('.quote-item-row').forEach(function(row) {
      var service = row.querySelector('.q-item-service').value;
      var desc = row.querySelector('.q-item-desc').value;
      var qty = parseFloat(row.querySelector('.q-item-qty').value) || 0;
      var rate = parseFloat(row.querySelector('.q-item-rate').value) || 0;
      if (service || desc || rate) {
        items.push({ service: service, description: desc, qty: qty, rate: rate, amount: qty * rate });
        subtotal += qty * rate;
      }
    });
    var taxRateVal = document.getElementById('q-tax-rate');
    var taxRate = taxRateVal ? (parseFloat(taxRateVal.value) || 0) : (parseFloat(localStorage.getItem('bm-tax-rate')) || 8.375);
    var taxAmount = Math.round(subtotal * taxRate / 100 * 100) / 100;
    var total = subtotal + taxAmount;

    var depReq = document.getElementById('q-deposit-req');
    var depTypeEl = document.getElementById('q-deposit-type');
    var depAmtEl = document.getElementById('q-deposit-amount');
    var depositRequired = depReq && depReq.checked;
    var depositType = depTypeEl ? depTypeEl.value : 'percent';
    var depositAmount = depAmtEl ? parseFloat(depAmtEl.value) || 0 : 0;
    var depositDue = depositRequired ? (depositType === 'percent' ? Math.round(total * depositAmount / 100 * 100) / 100 : depositAmount) : 0;
    var expiresEl = document.getElementById('q-expires');
    var expiresAt = expiresEl ? expiresEl.value : new Date(Date.now() + 30*86400000).toISOString().split('T')[0];

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
      depositRequired: depositRequired,
      depositType: depositType,
      depositAmount: depositAmount,
      depositDue: depositDue,
      expiresAt: expiresAt
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

    // Update client to active
    if (client && client.status === 'lead') DB.clients.update(clientId, { status: 'active' });

    UI.closeModal();

    // "Save & Send" → immediately show the email composer
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
      + '<button class="btn btn-outline" onclick="QuotesPage._copyApprovalLink(\'' + id + '\')" style="font-size:12px;">🔗 Copy Link</button>'
      + (q.status !== 'converted' && q.status !== 'declined'
          ? '<button class="btn btn-outline" onclick="QuotesPage._sendQuote(\'' + id + '\')" style="font-size:12px;">📧 Send Quote</button>' : '')
      + (q.status === 'approved' || q.status === 'converted'
          ? '<button class="btn btn-primary" onclick="if(typeof Workflow!==\'undefined\')Workflow.quoteToJob(\'' + id + '\');loadPage(\'jobs\');" style="font-size:12px;">🔧 Convert to Job</button>'
          : '<button class="btn btn-primary" onclick="QuotesPage.showForm(\'' + id + '\')" style="font-size:12px;">✏️ Edit Quote</button>')
      + '<div style="position:relative;display:inline-block;">'
      + '<button onclick="var d=this.nextElementSibling;document.querySelectorAll(\'.more-dd\').forEach(function(x){x.style.display=\'none\'});d.style.display=d.style.display===\'block\'?\'none\':\'block\';" class="btn btn-outline" style="font-size:13px;padding:6px 10px;">•••</button>'
      + '<div class="more-dd" style="display:none;position:absolute;right:0;top:calc(100% + 4px);background:#fff;border:1px solid var(--border);border-radius:8px;padding:4px 0;z-index:200;min-width:180px;box-shadow:0 4px 16px rgba(0,0,0,.12);">'
      + '<button onclick="QuotesPage.showForm(\'' + id + '\')" style="display:block;width:100%;text-align:left;padding:8px 14px;font-size:13px;background:none;border:none;cursor:pointer;color:var(--text);">✏️ Edit Quote</button>'
      + '<button onclick="QuotesPage._sendQuote(\'' + id + '\')" style="display:block;width:100%;text-align:left;padding:8px 14px;font-size:13px;background:none;border:none;cursor:pointer;color:var(--text);">📧 Send to Client</button>'
      + '<button onclick="QuotesPage._copyApprovalLink(\'' + id + '\')" style="display:block;width:100%;text-align:left;padding:8px 14px;font-size:13px;background:none;border:none;cursor:pointer;color:var(--text);">🔗 Copy Approval Link</button>'
      + '<button onclick="PDF.generateQuote(\'' + id + '\')" style="display:block;width:100%;text-align:left;padding:8px 14px;font-size:13px;background:none;border:none;cursor:pointer;color:var(--text);">📄 Download PDF</button>'
      + '<button onclick="QuotesPage._quickFollowUp(\'' + id + '\')" style="display:block;width:100%;text-align:left;padding:8px 14px;font-size:13px;background:none;border:none;cursor:pointer;color:var(--text);">📬 Send Follow-up</button>'
      + '<div style="height:1px;background:var(--border);margin:4px 0;"></div>'
      + '<button onclick="QuotesPage.setStatus(\'' + id + '\',\'declined\')" style="display:block;width:100%;text-align:left;padding:8px 14px;font-size:13px;background:none;border:none;cursor:pointer;color:#dc3545;">✗ Mark Declined</button>'
      + '</div></div>'
      + '</div></div>'

      // Header card
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:16px;">'
      + '<div style="height:4px;background:' + statusColor + ';"></div>'
      + '<div style="padding:20px 24px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">'
      + '<div>'
      + '<h2 style="font-size:22px;font-weight:700;margin:0 0 4px;">Quote #' + (q.quoteNumber||'') + ' — ' + UI.esc(q.clientName || '—') + '</h2>'
      + '<div style="font-size:13px;color:var(--text-light);">' + UI.dateShort(q.createdAt) + (q.sentAt ? ' · Sent ' + UI.dateShort(q.sentAt) : '') + '</div>'
      + (q.property ? '<div style="font-size:13px;color:var(--text-light);margin-top:2px;">📍 ' + UI.esc(q.property) + '</div>' : '')
      + '</div>'
      + '<div style="text-align:right;">' + UI.statusBadge(q.status) + '<div style="font-size:24px;font-weight:800;color:var(--accent);margin-top:6px;">' + UI.money(q.total) + '</div></div>'
      + '</div></div>'

      // Two-column: Client card (left) + metadata (right) — Jobber layout
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;" class="detail-grid">'

      // Client contact card
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:start;">'
      + '<div>'
      + '<div style="font-size:16px;font-weight:700;">' + UI.esc(q.clientName || '—') + ' <span style="color:#1565c0;font-size:10px;">●</span></div>'
      + '<div style="font-size:12px;color:var(--text-light);margin-top:4px;">Property Address</div>'
      + '<div style="font-size:14px;margin-top:2px;">' + UI.esc(q.property || '—') + '</div>'
      + (q.clientPhone || (client && client.phone) ? '<div style="font-size:14px;margin-top:8px;">' + (q.clientPhone || client.phone) + '</div>' : '')
      + (q.clientEmail || (client && client.email) ? '<div style="margin-top:2px;"><a href="mailto:' + (q.clientEmail || client.email) + '" style="font-size:14px;color:#1565c0;">' + (q.clientEmail || client.email) + '</a></div>' : '')
      + '</div>'
      + '<button style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--text-light);">···</button>'
      + '</div></div>'

      // Quote metadata table
      + '<div>'
      + '<table style="width:100%;font-size:14px;border-collapse:collapse;">'
      + '<tr><td style="padding:8px 0;color:var(--text-light);width:120px;">Quote #</td><td style="padding:8px 0;font-weight:500;">' + (q.quoteNumber || '') + '</td></tr>'
      + '<tr><td style="padding:8px 0;color:var(--text-light);">Created</td><td style="padding:8px 0;">' + UI.dateShort(q.createdAt) + '</td></tr>'
      + (q.sentAt ? '<tr><td style="padding:8px 0;color:var(--text-light);">Sent</td><td style="padding:8px 0;">' + UI.dateShort(q.sentAt) + '</td></tr>' : '')
      + (q.subtotal ? '<tr><td style="padding:8px 0;color:var(--text-light);">Subtotal</td><td style="padding:8px 0;">' + UI.money(q.subtotal) + '</td></tr>' : '')
      + (q.taxRate ? '<tr><td style="padding:8px 0;color:var(--text-light);">Tax (' + q.taxRate + '%)</td><td style="padding:8px 0;">' + UI.money(q.taxAmount || 0) + '</td></tr>' : '')
      + '<tr><td style="padding:8px 0;color:var(--text-light);">Total</td><td style="padding:8px 0;font-weight:700;font-size:16px;">' + UI.money(q.total) + '</td></tr>'
      + (q.source ? '<tr><td style="padding:8px 0;color:var(--text-light);">Lead Source</td><td style="padding:8px 0;">' + UI.esc(q.source) + '</td></tr>' : '')
      + (q.expiresAt ? (function() {
          var exp = new Date(q.expiresAt); var now = new Date();
          var days = Math.ceil((exp - now) / 86400000);
          var color = days < 0 ? '#dc3545' : days <= 5 ? '#e6a817' : 'var(--accent)';
          var label = days < 0 ? 'Expired ' + Math.abs(days) + 'd ago' : days === 0 ? 'Expires today' : 'Expires in ' + days + 'd';
          return '<tr><td style="padding:8px 0;color:var(--text-light);">Valid Until</td><td style="padding:8px 0;"><span style="color:' + color + ';font-weight:600;font-size:12px;">' + label + '</span> <span style="color:var(--text-light);font-size:12px;">(' + UI.dateShort(q.expiresAt) + ')</span></td></tr>';
        })() : '')
      + (q.depositRequired ? '<tr><td style="padding:8px 0;color:var(--text-light);">Deposit</td><td style="padding:8px 0;"><span style="background:' + (q.depositPaid ? '#e8f5e9' : '#fff3e0') + ';color:' + (q.depositPaid ? '#2e7d32' : '#e07c24') + ';padding:2px 8px;border-radius:10px;font-size:12px;font-weight:600;">' + (q.depositPaid ? '✓ Paid' : 'Due: ' + UI.money(q.depositDue)) + '</span></td></tr>' : '')
      + '</table></div>'
      + '</div>'

      // Workflow progress bar
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px;">';
    // Workflow stages — declined/changes_requested shown as a branch off "Sent"
    var qStages = ['draft','sent','approved','converted'];
    var qStageLabels = {draft:'Draft', sent:'Sent', approved:'Approved', converted:'Job Created'};
    var statusForStage = (q.status === 'awaiting' || q.status === 'changes_requested') ? 'sent' : q.status;
    var qIdx = qStages.indexOf(statusForStage);
    if (qIdx < 0) qIdx = q.status === 'declined' ? 1 : 0;
    html += '<div style="display:flex;align-items:center;margin-bottom:14px;">';
    qStages.forEach(function(s, i) {
      var done = i < qIdx || (q.status !== 'declined' && i === qIdx);
      var active = i === qIdx && q.status !== 'declined';
      var declined = q.status === 'declined' && i === qIdx;
      html += '<div style="flex:1;text-align:center;position:relative;">'
        + '<div style="width:28px;height:28px;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;'
        + (declined ? 'background:#dc3545;color:#fff;' : done ? 'background:var(--accent);color:#fff;' : 'background:var(--bg);color:var(--text-light);border:2px solid var(--border);') + '">'
        + (declined ? '✗' : (done && !active ? '✓' : (i + 1))) + '</div>'
        + '<div style="font-size:11px;font-weight:' + (active ? '700' : '500') + ';color:' + (declined ? '#dc3545' : done ? 'var(--accent)' : 'var(--text-light)') + ';margin-top:4px;">' + qStageLabels[s] + '</div>'
        + '</div>';
      if (i < qStages.length - 1) {
        html += '<div style="flex:0 0 40px;height:2px;background:' + (i < qIdx ? 'var(--accent)' : 'var(--border)') + ';margin-top:-16px;"></div>';
      }
    });
    html += '</div>';
    // Status change buttons with proper labels
    var statusBtns = [['draft','Draft'],['sent','Sent'],['awaiting','Awaiting Response'],['changes_requested','Changes Requested'],['approved','Approved'],['declined','Declined']];
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
    statusBtns.forEach(function(sb) {
      var isActive = q.status === sb[0];
      html += '<button onclick="QuotesPage.setStatus(\'' + id + '\',\'' + sb[0] + '\')" style="font-size:11px;padding:5px 12px;border-radius:6px;border:1px solid '
        + (isActive ? '#2e7d32' : 'var(--border)') + ';background:' + (isActive ? '#2e7d32' : 'var(--white)') + ';color:' + (isActive ? '#fff' : 'var(--text)') + ';cursor:pointer;font-weight:' + (isActive ? '700' : '500') + ';">'
        + sb[1] + '</button>';
    });
    html += '</div></div>'

      // Description
      + (q.description ? '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px;">'
        + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Description</h4>'
        + '<p style="font-size:14px;line-height:1.6;margin:0;">' + UI.esc(q.description) + '</p></div>' : '')

      // Line items (Product / Service) — inline editor
      + QuotesPage.renderLineItems(q, id)

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
      // Video walkthrough
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px;">'
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
    return 'https://peekskilltree.com/branchmanager/approve.html?id=' + id;
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

    var html = '<div style="padding:16px;">'
      // Approval link prominent display
      + '<div style="background:#e8f5e9;border-radius:8px;padding:12px 14px;margin-bottom:16px;border-left:3px solid var(--green-dark);">'
      + '<div style="font-size:12px;font-weight:700;color:var(--green-dark);margin-bottom:6px;">🔗 Client Approval Link</div>'
      + '<div style="display:flex;gap:6px;align-items:center;">'
      + '<input id="approval-link-input" type="text" readonly value="' + approvalLink + '" style="flex:1;font-size:12px;padding:6px 10px;border:1px solid var(--border);border-radius:6px;background:#fff;color:#333;cursor:text;">'
      + '<button onclick="QuotesPage._copyApprovalLink(\'' + id + '\')" style="background:var(--green-dark);color:#fff;border:none;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;">Copy</button>'
      + '</div>'
      + '<div style="font-size:11px;color:var(--text-light);margin-top:6px;">Client clicks this to view & approve — no login required</div>'
      + '</div>'
      + '<div style="margin-bottom:16px;">'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">To</label>'
      + '<input type="email" id="send-to" value="' + email + '" placeholder="client@email.com" style="width:100%;padding:8px 12px;border:2px solid var(--border);border-radius:8px;font-size:14px;">'
      + '</div>'
      + '<div style="margin-bottom:16px;">'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Subject</label>'
      + '<input type="text" id="send-subject" value="' + subject + '" style="width:100%;padding:8px 12px;border:2px solid var(--border);border-radius:8px;font-size:14px;">'
      + '</div>'
      + '<div style="margin-bottom:16px;">'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Message</label>'
      + '<textarea id="send-body" rows="10" style="width:100%;padding:10px 12px;border:2px solid var(--border);border-radius:8px;font-size:13px;line-height:1.6;font-family:inherit;resize:vertical;">' + body + '</textarea>'
      + '</div>'
      + '<div style="font-size:12px;color:var(--text-light);margin-bottom:12px;">📎 Quote PDF will be attached automatically when SendGrid is configured</div>'
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
    UI.toast('Quote status: ' + status);
    QuotesPage.showDetail(id);
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
          + '<td class="li-qty" onclick="QuotesPage.editLineItem(\'' + id + '\',' + idx + ')" style="cursor:pointer;" title="Click to edit">' + (item.qty || 1) + '</td>'
          + '<td class="li-rate" style="text-align:right;cursor:pointer;" onclick="QuotesPage.editLineItem(\'' + id + '\',' + idx + ')" title="Click to edit">' + UI.money(item.rate || 0) + '</td>'
          + '<td style="text-align:right;font-weight:600;">' + UI.money(lineTotal) + '</td>'
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
  }
};

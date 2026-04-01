/**
 * Branch Manager — Quotes Page
 * Quote list, builder with line items, status management
 */
var QuotesPage = {
  _page: 0, _perPage: 50, _search: '', _filter: 'all', _sort: 'createdAt', _sortDir: -1,

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
      + '<div style="font-size:12px;color:var(--text-light);">Past 30 days</div>'
      + '<div style="font-size:28px;font-weight:700;margin-top:4px;">' + convRate + '%</div>'
      + '</div>'
      // Sent
      + '<div onclick="QuotesPage._setFilter(\'sent\')" style="padding:14px 16px;border-right:1px solid var(--border);cursor:pointer;">'
      + '<div style="font-size:14px;font-weight:700;">Sent</div>'
      + '<div style="font-size:12px;color:var(--text-light);">Past 30 days</div>'
      + '<div style="font-size:28px;font-weight:700;margin-top:4px;">' + sent + '</div>'
      + '<div style="font-size:12px;color:var(--text-light);">' + UI.moneyInt(sentTotal) + '</div>'
      + '</div>'
      // Converted
      + '<div onclick="QuotesPage._setFilter(\'converted\')" style="padding:14px 16px;cursor:pointer;">'
      + '<div style="font-size:14px;font-weight:700;">Converted</div>'
      + '<div style="font-size:12px;color:var(--text-light);">Past 30 days</div>'
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
      + '<button class="filter-btn' + (self._filter==='all'?' active':'') + '" onclick="QuotesPage._setFilter(\'all\')" style="font-size:12px;padding:5px 12px;">Status | All</button>'
      + '</div>'
      + '<div class="search-box" style="min-width:200px;max-width:280px;">'
      + '<span style="color:var(--text-light);">🔍</span>'
      + '<input type="text" placeholder="Search quotes..." value="' + UI.esc(self._search) + '" oninput="QuotesPage._search=this.value;QuotesPage._page=0;loadPage(\'quotes\')">'
      + '</div></div>';

    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      + '<table class="data-table"><thead><tr>'
      + '<th>Client</th><th>Quote number</th><th>Property</th><th>Created</th><th>Status</th><th style="text-align:right;">Total</th>'
      + '</tr></thead><tbody>';

    if (page.length === 0) {
      html += '<tr><td colspan="6">' + (self._search ? '<div style="text-align:center;padding:24px;color:var(--text-light);">No quotes match "' + self._search + '"</div>' : UI.emptyState('📋', 'No quotes yet', 'Create your first quote.', '+ New Quote', 'QuotesPage.showForm()')) + '</td></tr>';
    } else {
      page.forEach(function(q) {
        html += '<tr onclick="QuotesPage.showDetail(\'' + q.id + '\')" style="cursor:pointer;">'
          + '<td><strong>' + UI.esc(q.clientName || '—') + '</strong></td>'
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
        if (self._filter === 'sent') return q.status === 'sent' || q.status === 'awaiting';
        return q.status === self._filter;
      });
    }
    if (self._search && self._search.length >= 2) {
      var s = self._search.toLowerCase();
      all = all.filter(function(q) {
        return (q.clientName || '').toLowerCase().indexOf(s) >= 0 || (q.description || '').toLowerCase().indexOf(s) >= 0 || (q.property || '').toLowerCase().indexOf(s) >= 0 || String(q.quoteNumber).indexOf(s) >= 0;
      });
    }
    all.sort(function(a, b) {
      var va = a[self._sort] || '', vb = b[self._sort] || '';
      if (typeof va === 'number') return (va - vb) * self._sortDir;
      return va.toString().localeCompare(vb.toString()) * self._sortDir;
    });
    return all;
  },
  _setFilter: function(f) { QuotesPage._filter = f; QuotesPage._page = 0; loadPage('quotes'); },
  _goPage: function(p) { var t = Math.ceil(QuotesPage._getFiltered().length / QuotesPage._perPage); QuotesPage._page = Math.max(0, Math.min(p, t - 1)); loadPage('quotes'); },

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
      + Estimator.renderInline()
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

    // Total display
    html += '<div style="margin-top:16px;padding:16px;background:var(--green-dark);color:var(--white);border-radius:10px;display:flex;justify-content:space-between;align-items:center;">'
      + '<span style="font-weight:600;">Total</span>'
      + '<span id="q-total-display" style="font-size:1.5rem;font-weight:800;">' + UI.money(q.total || 0) + '</span>'
      + '</div>';

    // Property Map button
    html += '<div style="margin-top:16px;"><button type="button" class="btn btn-outline" onclick="PropertyMap.show(document.getElementById(\'q-property\').value)">🗺️ Open Property Map — Place Equipment</button></div>';

    html += UI.formField('Internal Notes', 'textarea', 'q-notes', q.notes, { placeholder: 'Notes (not shown to client)' })
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

  calcTotal: function() {
    var total = 0;
    document.querySelectorAll('.quote-item-row').forEach(function(row) {
      var qty = parseFloat(row.querySelector('.q-item-qty').value) || 0;
      var rate = parseFloat(row.querySelector('.q-item-rate').value) || 0;
      var lineTotal = qty * rate;
      total += lineTotal;
      var amountEl = row.querySelector('.q-item-amount');
      if (amountEl) amountEl.textContent = UI.money(lineTotal);
    });
    var el = document.getElementById('q-total-display');
    if (el) el.textContent = UI.money(total);
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
    var total = 0;
    document.querySelectorAll('.quote-item-row').forEach(function(row) {
      var service = row.querySelector('.q-item-service').value;
      var desc = row.querySelector('.q-item-desc').value;
      var qty = parseFloat(row.querySelector('.q-item-qty').value) || 0;
      var rate = parseFloat(row.querySelector('.q-item-rate').value) || 0;
      if (service || desc || rate) {
        items.push({ service: service, description: desc, qty: qty, rate: rate, amount: qty * rate });
        total += qty * rate;
      }
    });

    var data = {
      clientId: clientId,
      clientName: client ? client.name : '',
      property: document.getElementById('q-property').value.trim(),
      description: document.getElementById('q-description').value.trim(),
      lineItems: items,
      total: total,
      notes: document.getElementById('q-notes').value.trim(),
      status: form.dataset.saveStatus || 'draft'
    };

    if (quoteId) {
      DB.quotes.update(quoteId, data);
      UI.toast('Quote updated');
    } else {
      DB.quotes.create(data);
      UI.toast('Quote created');
    }

    // Update client to active
    if (client && client.status === 'lead') DB.clients.update(clientId, { status: 'active' });

    UI.closeModal();
    loadPage('quotes');
  },

  showDetail: function(id) {
    var q = DB.quotes.getById(id);
    if (!q) return;

    // Jobber-style quote detail
    var statusColors = {draft:'#6c757d',sent:'#e07c24',awaiting:'#e07c24',approved:'#2e7d32',converted:'#2e7d32',declined:'#dc3545'};
    var statusColor = statusColors[q.status] || '#8b2252';
    var client = q.clientId ? DB.clients.getById(q.clientId) : null;

    var html = ''
      // Colored status bar
      + '<div style="height:4px;background:' + statusColor + ';margin:-24px -24px 16px -24px;"></div>'

      // Status + action buttons
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">'
      + '<div style="display:flex;align-items:center;gap:8px;">'
      + '<span style="font-size:20px;">💰</span>'
      + '<span>' + UI.statusBadge(q.status) + '</span>'
      + '</div>'
      + '<div style="display:flex;gap:6px;">'
      + '<button class="btn btn-outline" onclick="QuotesPage.showForm(\'' + id + '\')">··· More</button>'
      + '<button class="btn btn-primary" onclick="QuotesPage._sendQuote(\'' + id + '\')">📧 Send Quote</button>'
      + '</div></div>'

      // Title
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">'
      + '<h2 style="font-size:24px;font-weight:700;">Quote for ' + UI.esc(q.clientName || '—') + '</h2>'
      + '<button onclick="QuotesPage.showForm(\'' + id + '\')" style="background:none;border:none;cursor:pointer;font-size:18px;color:var(--text-light);">✏️</button>'
      + '</div>'

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
      + '<tr><td style="padding:8px 0;color:var(--text-light);">Total</td><td style="padding:8px 0;font-weight:700;font-size:16px;">' + UI.money(q.total) + '</td></tr>'
      + (q.source ? '<tr><td style="padding:8px 0;color:var(--text-light);">Lead Source</td><td style="padding:8px 0;">' + UI.esc(q.source) + '</td></tr>' : '')
      + '</table></div>'
      + '</div>'

      // Workflow progress bar
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px;">';
    var qStages = ['draft','sent','approved','converted'];
    var qStageLabels = {draft:'Draft',sent:'Sent',approved:'Approved',converted:'Converted to Job'};
    var qIdx = qStages.indexOf(q.status === 'awaiting' ? 'sent' : q.status);
    if (qIdx < 0) qIdx = 0;
    html += '<div style="display:flex;align-items:center;margin-bottom:14px;">';
    qStages.forEach(function(s, i) {
      var done = i <= qIdx;
      var active = i === qIdx;
      html += '<div style="flex:1;text-align:center;position:relative;">'
        + '<div style="width:28px;height:28px;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;'
        + (done ? 'background:var(--accent);color:#fff;' : 'background:var(--bg);color:var(--text-light);border:2px solid var(--border);') + '">'
        + (done && !active ? '✓' : (i + 1)) + '</div>'
        + '<div style="font-size:11px;font-weight:' + (active ? '700' : '500') + ';color:' + (done ? 'var(--accent)' : 'var(--text-light)') + ';margin-top:4px;">' + qStageLabels[s] + '</div>'
        + '</div>';
      if (i < qStages.length - 1) {
        html += '<div style="flex:0 0 40px;height:2px;background:' + (i < qIdx ? 'var(--accent)' : 'var(--border)') + ';margin-top:-16px;"></div>';
      }
    });
    html += '</div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
    ['draft', 'sent', 'awaiting', 'approved', 'declined'].forEach(function(s) {
      html += '<button class="btn ' + (q.status === s ? 'btn-primary' : 'btn-outline') + '" onclick="QuotesPage.setStatus(\'' + id + '\',\'' + s + '\')" style="font-size:11px;padding:5px 12px;">' + s + '</button>';
    });
    html += '</div></div>'

      // Description
      + (q.description ? '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px;">'
        + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Description</h4>'
        + '<p style="font-size:14px;line-height:1.6;margin:0;">' + UI.esc(q.description) + '</p></div>' : '')

      // Line items (Product / Service)
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border);"><h4 style="font-size:15px;font-weight:700;margin:0;">Product / Service</h4><button onclick="QuotesPage.showForm(\'' + id + '\')" style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--text-light);">✏️</button></div>';
    if (q.lineItems && q.lineItems.length) {
      html += '<table class="data-table" style="border:none;border-radius:0;"><thead><tr><th>Line Item</th><th>Quantity</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;">Total</th></tr></thead><tbody>';
      q.lineItems.forEach(function(item) {
        html += '<tr><td><strong>' + (item.service || 'Custom') + '</strong>' + (item.description ? '<br><span style="color:var(--text-light);font-size:12px;">' + item.description + '</span>' : '') + '</td><td>' + item.qty + '</td><td style="text-align:right;">' + UI.money(item.rate) + '</td><td style="text-align:right;font-weight:600;">' + UI.money(item.amount || item.qty * item.rate) + '</td></tr>';
      });
      html += '<tr style="background:var(--green-bg);"><td colspan="3" style="text-align:right;font-weight:700;">Total</td><td style="text-align:right;font-weight:800;font-size:15px;color:var(--accent);">' + UI.money(q.total) + '</td></tr>';
      html += '</tbody></table>';
    } else {
      html += '<div style="padding:20px;text-align:center;color:var(--text-light);font-size:13px;">No line items</div>';
    }
    html += '</div>'

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

      + '</div>';

    // Render full page
    document.getElementById('pageTitle').textContent = 'Quote #' + q.quoteNumber;
    document.getElementById('pageContent').innerHTML = html;
    document.getElementById('pageAction').style.display = 'none';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  },

  _sendQuote: function(id) {
    var q = DB.quotes.getById(id);
    if (!q) return;

    // Get client email
    var client = q.clientId ? DB.clients.getById(q.clientId) : null;
    var email = (client && client.email) || q.clientEmail || '';
    var firstName = (q.clientName || '').split(' ')[0] || 'there';

    // Build email preview (Jobber style)
    var subject = 'Quote #' + q.quoteNumber + ' from Second Nature Tree Service — ' + UI.money(q.total);
    var body = 'Hi ' + firstName + ',\n\n'
      + 'Thanks for reaching out to Second Nature Tree Service! Here\'s your quote for the work we discussed:\n\n'
      + '📋 Quote #' + q.quoteNumber + '\n'
      + '📍 ' + (q.property || 'Property on file') + '\n'
      + '💰 Total: ' + UI.money(q.total) + '\n\n';
    if (q.description) body += 'Scope: ' + q.description + '\n\n';
    body += 'To approve this quote, simply reply to this email or call us at (914) 391-5233.\n\n'
      + 'This quote is valid for 30 days.\n\n'
      + 'Thanks,\nDoug Brown\nSecond Nature Tree Service\n(914) 391-5233\npeekskilltree.com\nLicensed & Fully Insured — WC-32079 / PC-50644';

    var html = '<div style="padding:16px;">'
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
      + '<textarea id="send-body" rows="12" style="width:100%;padding:10px 12px;border:2px solid var(--border);border-radius:8px;font-size:13px;line-height:1.6;font-family:inherit;resize:vertical;">' + body + '</textarea>'
      + '</div>'
      + '<div style="font-size:12px;color:var(--text-light);margin-bottom:12px;">📎 Quote PDF will be attached automatically</div>'
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

    // Try mailto as fallback (SendGrid will replace this when wired)
    var mailto = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    window.open(mailto, '_blank');

    // Mark as sent
    DB.quotes.update(id, { status: 'sent', sentAt: new Date().toISOString(), sentTo: to });
    UI.closeModal();
    UI.toast('Quote marked as sent to ' + to);
    QuotesPage.showDetail(id);
  },

  setStatus: function(id, status) {
    DB.quotes.update(id, { status: status });
    UI.toast('Quote status: ' + status);
    QuotesPage.showDetail(id);
  },

  _applyEstimator: function() {
    var calc = Estimator._lastCalc;
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
      scheduledDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    });
    DB.quotes.update(quoteId, { status: 'converted', jobId: job.id });
    if (q.clientId) DB.clients.update(q.clientId, { status: 'active' });
    UI.toast('Job #' + job.jobNumber + ' created from quote');
    UI.closeModal();
    loadPage('jobs');
  }
};

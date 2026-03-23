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

    var html = '<div class="stat-grid">'
      + UI.statCard('Draft', draft.toString(), '', '', '', "QuotesPage._setFilter('draft')")
      + UI.statCard('Awaiting Response', sent.toString(), '', '', '', "QuotesPage._setFilter('sent')")
      + UI.statCard('Approved', approved.toString(), '', '', '', "QuotesPage._setFilter('approved')")
      + UI.statCard('Total Quotes', all.length.toString(), '', '', '', "QuotesPage._setFilter('all')")
      + '</div>';

    // Search + filter
    html += '<div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;align-items:center;">'
      + '<div style="flex:1;min-width:200px;position:relative;">'
      + '<input type="text" placeholder="Search quotes..." value="' + self._search + '" oninput="QuotesPage._search=this.value;QuotesPage._page=0;loadPage(\'quotes\')" style="width:100%;padding:9px 12px 9px 34px;border:2px solid var(--border);border-radius:8px;font-size:14px;">'
      + '<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-light);">🔍</span></div></div>';

    var filtered = self._getFiltered();
    var page = filtered.slice(self._page * self._perPage, (self._page + 1) * self._perPage);

    html += '<div style="font-size:12px;color:var(--text-light);margin-bottom:8px;">Showing ' + Math.min(self._page * self._perPage + 1, filtered.length) + '–' + Math.min((self._page + 1) * self._perPage, filtered.length) + ' of ' + filtered.length + '</div>';

    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      + '<table class="data-table"><thead><tr>'
      + '<th>Client</th><th>Quote #</th><th>Description</th><th>Created</th><th>Status</th><th style="text-align:right;">Total</th>'
      + '</tr></thead><tbody>';

    if (page.length === 0) {
      html += '<tr><td colspan="6">' + (self._search ? '<div style="text-align:center;padding:24px;color:var(--text-light);">No quotes match "' + self._search + '"</div>' : UI.emptyState('📋', 'No quotes yet', 'Create your first quote.', '+ New Quote', 'QuotesPage.showForm()')) + '</td></tr>';
    } else {
      page.forEach(function(q) {
        html += '<tr onclick="QuotesPage.showDetail(\'' + q.id + '\')" style="cursor:pointer;">'
          + '<td><strong>' + (q.clientName || '—') + '</strong></td>'
          + '<td>#' + (q.quoteNumber || '') + '</td>'
          + '<td style="font-size:13px;color:var(--text-light);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (q.description || q.property || '—') + '</td>'
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

  _itemRow: function(index, item, services) {
    var svcOptions = services.map(function(s) {
      return '<option value="' + s.name + '"' + (item.service === s.name ? ' selected' : '') + '>' + s.name + '</option>';
    }).join('');

    return '<div class="quote-item-row" style="display:grid;grid-template-columns:2fr 2fr 60px 90px 40px;gap:8px;align-items:end;margin-bottom:8px;">'
      + '<div class="form-group" style="margin:0;"><label style="font-size:11px;">Service</label><select class="q-item-service" onchange="QuotesPage.calcTotal()"><option value="">Custom...</option>' + svcOptions + '</select></div>'
      + '<div class="form-group" style="margin:0;"><label style="font-size:11px;">Description</label><input class="q-item-desc" value="' + (item.description || '') + '" placeholder="Details"></div>'
      + '<div class="form-group" style="margin:0;"><label style="font-size:11px;">Qty</label><input type="number" class="q-item-qty" value="' + (item.qty || 1) + '" min="1" oninput="QuotesPage.calcTotal()"></div>'
      + '<div class="form-group" style="margin:0;"><label style="font-size:11px;">Rate ($)</label><input type="number" class="q-item-rate" value="' + (item.rate || '') + '" step="0.01" placeholder="0.00" oninput="QuotesPage.calcTotal()"></div>'
      + '<button type="button" style="background:none;border:none;font-size:18px;color:var(--red);cursor:pointer;padding-bottom:8px;" onclick="this.parentElement.remove();QuotesPage.calcTotal();">&times;</button>'
      + '</div>';
  },

  addItem: function() {
    var container = document.getElementById('q-items');
    var index = container.children.length;
    var services = DB.services.getAll();
    var div = document.createElement('div');
    div.innerHTML = QuotesPage._itemRow(index, {}, services);
    container.appendChild(div.firstChild);
  },

  calcTotal: function() {
    var total = 0;
    document.querySelectorAll('.quote-item-row').forEach(function(row) {
      var qty = parseFloat(row.querySelector('.q-item-qty').value) || 0;
      var rate = parseFloat(row.querySelector('.q-item-rate').value) || 0;
      total += qty * rate;
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

    // Full-page quote detail (Jobber style)
    var html = ''
      // Back + header
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">'
      + '<button class="btn btn-outline" onclick="loadPage(\'quotes\')" style="padding:6px 12px;">← Back</button>'
      + '<div style="flex:1;">'
      + '<h2 style="font-size:22px;margin-bottom:2px;">Quote #' + q.quoteNumber + '</h2>'
      + '<span style="font-size:14px;color:var(--text-light);">' + (q.clientName || '') + (q.property ? ' — ' + q.property : '') + '</span>'
      + '</div>'
      + '<div style="display:flex;gap:6px;">'
      + '<button class="btn btn-outline" onclick="QuotesPage.showForm(\'' + id + '\')">Edit</button>'
      + '<button class="btn btn-outline" onclick="PDF.generateQuote(\'' + id + '\')">📄 PDF</button>'
      + '<button class="btn btn-outline" onclick="QuotesPage._sendQuote(\'' + id + '\')">📧 Send</button>'
      + (q.status !== 'converted' ? '<button class="btn btn-primary" onclick="if(typeof Workflow!==\'undefined\')Workflow.quoteToJob(\'' + id + '\');loadPage(\'jobs\');">✅ Convert to Job</button>' : '')
      + '</div></div>'

      // Stats bar
      + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;">'
      + UI.statCard('Status', '<span style="font-size:14px;">' + UI.statusBadge(q.status) + '</span>', '', '', '')
      + UI.statCard('Total', UI.money(q.total), '', '', '')
      + UI.statCard('Created', UI.dateShort(q.createdAt || ''), '', '', '')
      + UI.statCard('Client', q.clientName || '—', '', '', '')
      + '</div>'

      // Two column
      + '<div style="display:grid;grid-template-columns:1fr 300px;gap:20px;" class="detail-grid">'

      // Left — main
      + '<div>'

      // Status workflow
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Status</h4>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
    ['draft', 'sent', 'awaiting', 'approved', 'declined'].forEach(function(s) {
      html += '<button class="btn ' + (q.status === s ? 'btn-primary' : 'btn-outline') + '" onclick="QuotesPage.setStatus(\'' + id + '\',\'' + s + '\')" style="font-size:12px;padding:6px 14px;">' + s + '</button>';
    });
    html += '</div></div>'

      // Description
      + (q.description ? '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px;">'
        + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Description</h4>'
        + '<p style="font-size:14px;line-height:1.6;margin:0;">' + q.description + '</p></div>' : '')

      // Line items
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:16px;">'
      + '<div style="padding:12px 16px;border-bottom:1px solid var(--border);"><h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin:0;">Line Items</h4></div>';
    if (q.lineItems && q.lineItems.length) {
      html += '<table class="data-table" style="border:none;border-radius:0;"><thead><tr><th>Service</th><th>Description</th><th>Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amount</th></tr></thead><tbody>';
      q.lineItems.forEach(function(item) {
        html += '<tr><td>' + (item.service || 'Custom') + '</td><td style="color:var(--text-light);">' + (item.description || '') + '</td><td>' + item.qty + '</td><td style="text-align:right;">' + UI.money(item.rate) + '</td><td style="text-align:right;font-weight:600;">' + UI.money(item.amount || item.qty * item.rate) + '</td></tr>';
      });
      html += '<tr style="background:var(--green-bg);"><td colspan="4" style="text-align:right;font-weight:700;">Total</td><td style="text-align:right;font-weight:800;font-size:15px;color:var(--accent);">' + UI.money(q.total) + '</td></tr>';
      html += '</tbody></table>';
    } else {
      html += '<div style="padding:20px;text-align:center;color:var(--text-light);font-size:13px;">No line items</div>';
    }
    html += '</div>'

      // Photos
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Photos</h4>';
    if (typeof Photos !== 'undefined') { html += Photos.renderGallery('quote', id); }
    else { html += '<div style="color:var(--text-light);font-size:13px;">No photos</div>'; }
    html += '</div></div>'

      // Right sidebar
      + '<div>'

      // Client info
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Client</h4>'
      + '<div style="font-size:14px;font-weight:600;margin-bottom:6px;">' + (q.clientName || '—') + '</div>'
      + (q.property ? '<div style="font-size:13px;color:var(--text-light);margin-bottom:8px;">📍 ' + q.property + '</div>' : '')
      + (q.clientPhone ? '<a href="tel:' + q.clientPhone + '" class="btn btn-outline" style="width:100%;justify-content:center;margin-bottom:6px;font-size:12px;">📞 Call</a>' : '')
      + (q.clientEmail ? '<a href="mailto:' + q.clientEmail + '" class="btn btn-outline" style="width:100%;justify-content:center;margin-bottom:6px;font-size:12px;">✉️ Email</a>' : '')
      + (q.property ? '<a href="https://maps.google.com/?q=' + encodeURIComponent(q.property) + '" target="_blank" class="btn btn-outline" style="width:100%;justify-content:center;font-size:12px;">🗺 Directions</a>' : '')
      + '</div>'

      // Property map
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Property Map</h4>'
      + '<button class="btn btn-outline" style="width:100%;justify-content:center;font-size:12px;" onclick="PropertyMap.show(\'' + (q.property || '').replace(/'/g, "\\'") + '\')">📐 Equipment Layout</button>'
      + '</div>'

      // Notes
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Internal Notes</h4>'
      + (q.notes ? '<div style="font-size:13px;line-height:1.6;">' + q.notes + '</div>' : '<div style="color:var(--text-light);font-size:13px;">No notes</div>')
      + '</div>'

      + '</div></div>';

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

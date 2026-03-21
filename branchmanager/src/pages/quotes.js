/**
 * Branch Manager — Quotes Page
 * Quote list, builder with line items, status management
 */
var QuotesPage = {
  render: function() {
    var all = DB.quotes.getAll();
    var draft = all.filter(function(q) { return q.status === 'draft'; }).length;
    var sent = all.filter(function(q) { return q.status === 'sent' || q.status === 'awaiting'; }).length;
    var approved = all.filter(function(q) { return q.status === 'approved'; }).length;

    var html = '<div class="stat-grid">'
      + UI.statCard('Draft', draft.toString(), '', '', '')
      + UI.statCard('Awaiting Response', sent.toString(), '', '', '')
      + UI.statCard('Approved', approved.toString(), '', '', '')
      + UI.statCard('Total Quotes', all.length.toString(), '', '', '')
      + '</div>';

    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      + '<table class="data-table"><thead><tr>'
      + '<th>Client</th><th>Quote #</th><th>Description</th><th>Created</th><th>Status</th><th style="text-align:right;">Total</th>'
      + '</tr></thead><tbody>';

    if (all.length === 0) {
      html += '<tr><td colspan="6">' + UI.emptyState('📋', 'No quotes yet', 'Create your first quote to send to a client.', '+ New Quote', 'QuotesPage.showForm()') + '</td></tr>';
    } else {
      all.forEach(function(q) {
        html += '<tr onclick="QuotesPage.showDetail(\'' + q.id + '\')">'
          + '<td><strong>' + (q.clientName || '—') + '</strong></td>'
          + '<td>#' + (q.quoteNumber || '') + '</td>'
          + '<td style="font-size:13px;color:var(--text-light);">' + (q.description || q.property || '—') + '</td>'
          + '<td>' + UI.dateShort((q.createdAt || '').split('T')[0]) + '</td>'
          + '<td>' + UI.statusBadge(q.status) + '</td>'
          + '<td style="text-align:right;font-weight:600;">' + UI.money(q.total) + '</td>'
          + '</tr>';
      });
    }
    html += '</tbody></table></div>';
    return html;
  },

  showForm: function(quoteId, clientId) {
    var q = quoteId ? DB.quotes.getById(quoteId) : {};
    var client = clientId ? DB.clients.getById(clientId) : (q.clientId ? DB.clients.getById(q.clientId) : null);
    var items = q.lineItems || [{ service: '', description: '', qty: 1, rate: 0 }];
    var services = DB.services.getAll();

    var html = '<form id="quote-form" onsubmit="QuotesPage.save(event, \'' + (quoteId || '') + '\')">';

    // Client selector
    if (client) {
      html += '<input type="hidden" id="q-clientId" value="' + client.id + '">'
        + '<div class="form-group"><label>Client</label><div style="padding:8px 12px;background:var(--bg);border-radius:8px;font-weight:600;">' + client.name + '<br><span style="font-weight:400;font-size:13px;color:var(--text-light);">' + (client.address || '') + '</span></div></div>';
    } else {
      var clientOptions = DB.clients.getAll().map(function(c) { return { value: c.id, label: c.name + (c.address ? ' — ' + c.address : '') }; });
      html += UI.formField('Client *', 'select', 'q-clientId', '', { options: [{ value: '', label: 'Select a client...' }].concat(clientOptions) });
    }

    html += UI.formField('Property Address', 'text', 'q-property', q.property || (client ? client.address : ''), { placeholder: 'Job site address' })
      + UI.formField('Description', 'text', 'q-description', q.description, { placeholder: 'e.g., Tree removal - 2 oaks' });

    // Estimator button
    html += '<div style="margin:16px 0 12px;display:flex;gap:8px;align-items:center;">'
      + '<button type="button" class="btn btn-primary" onclick="Estimator.show(function(items, total) { QuotesPage._fillFromEstimator(items, total); })">🧮 Price with Estimator</button>'
      + '<span style="font-size:12px;color:var(--text-light);">Calculate crew, equipment, insurance → auto-fill line items</span>'
      + '</div>';

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

    var html = '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:20px;">'
      + '<div><h2 style="margin-bottom:4px;">Quote #' + q.quoteNumber + '</h2>'
      + '<div style="color:var(--text-light);">' + (q.clientName || '') + '</div>'
      + '<div style="font-size:13px;color:var(--text-light);">' + (q.property || '') + '</div></div>'
      + '<div style="text-align:right;">' + UI.statusBadge(q.status) + '<div style="font-size:2rem;font-weight:800;color:var(--green-dark);margin-top:8px;">' + UI.money(q.total) + '</div></div>'
      + '</div>';

    // Line items table
    if (q.lineItems && q.lineItems.length) {
      html += '<table class="data-table" style="margin-bottom:16px;"><thead><tr><th>Service</th><th>Description</th><th>Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amount</th></tr></thead><tbody>';
      q.lineItems.forEach(function(item) {
        html += '<tr><td>' + (item.service || 'Custom') + '</td><td>' + (item.description || '') + '</td><td>' + item.qty + '</td><td style="text-align:right;">' + UI.money(item.rate) + '</td><td style="text-align:right;font-weight:600;">' + UI.money(item.amount || item.qty * item.rate) + '</td></tr>';
      });
      html += '<tr style="background:var(--bg);"><td colspan="4" style="text-align:right;font-weight:700;">Total</td><td style="text-align:right;font-weight:800;font-size:1.1em;">' + UI.money(q.total) + '</td></tr>';
      html += '</tbody></table>';
    }

    // Status actions
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
    ['draft', 'sent', 'awaiting', 'approved', 'declined'].forEach(function(s) {
      html += '<button class="btn ' + (q.status === s ? 'btn-primary' : 'btn-outline') + '" onclick="QuotesPage.setStatus(\'' + id + '\',\'' + s + '\')">' + s + '</button>';
    });
    html += '</div>';

    UI.showModal('Quote #' + q.quoteNumber, html, {
      wide: true,
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Close</button>'
        + ' <button class="btn btn-outline" onclick="PDF.generateQuote(\'' + id + '\')">📄 PDF</button>'
        + ' <button class="btn btn-outline" onclick="UI.closeModal();QuotesPage.showForm(\'' + id + '\')">Edit</button>'
        + (q.status === 'approved' ? ' <button class="btn btn-primary" onclick="QuotesPage.convertToJob(\'' + id + '\')">Convert to Job</button>' : '')
    });
  },

  setStatus: function(id, status) {
    DB.quotes.update(id, { status: status });
    UI.toast('Quote status: ' + status);
    UI.closeModal();
    loadPage('quotes');
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

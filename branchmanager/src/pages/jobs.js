/**
 * Branch Manager — Jobs Page
 */
var JobsPage = {
  render: function() {
    var all = DB.jobs.getAll();
    var late = all.filter(function(j) { return j.status === 'late'; }).length;
    var scheduled = all.filter(function(j) { return j.status === 'scheduled'; }).length;
    var completed = all.filter(function(j) { return j.status === 'completed'; }).length;

    var html = '<div class="stat-grid">'
      + UI.statCard('Late', late.toString(), 'Need attention', late > 0 ? 'down' : '', '')
      + UI.statCard('Scheduled', scheduled.toString(), 'Upcoming', '', '')
      + UI.statCard('Completed', completed.toString(), 'All time', '', '')
      + UI.statCard('Total Jobs', all.length.toString(), '', '', '')
      + '</div>';

    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      + '<table class="data-table"><thead><tr>'
      + '<th>Client</th><th>Job #</th><th>Description</th><th>Scheduled</th><th>Status</th><th>Crew</th><th style="text-align:right;">Total</th>'
      + '</tr></thead><tbody>';

    if (all.length === 0) {
      html += '<tr><td colspan="7">' + UI.emptyState('🔧', 'No jobs yet', 'Create a job from an approved quote or add one manually.', '+ New Job', 'JobsPage.showForm()') + '</td></tr>';
    } else {
      all.forEach(function(j) {
        html += '<tr onclick="JobsPage.showDetail(\'' + j.id + '\')">'
          + '<td><strong>' + (j.clientName || '—') + '</strong></td>'
          + '<td>#' + (j.jobNumber || '') + '</td>'
          + '<td style="font-size:13px;color:var(--text-light);">' + (j.description || '—') + '</td>'
          + '<td>' + UI.dateShort(j.scheduledDate) + '</td>'
          + '<td>' + UI.statusBadge(j.status) + '</td>'
          + '<td style="font-size:12px;">' + (j.crew ? j.crew.join(', ') : '—') + '</td>'
          + '<td style="text-align:right;font-weight:600;">' + UI.money(j.total) + '</td>'
          + '</tr>';
      });
    }
    html += '</tbody></table></div>';
    return html;
  },

  showForm: function(jobId) {
    var j = jobId ? DB.jobs.getById(jobId) : {};
    var clientOptions = DB.clients.getAll().map(function(c) { return { value: c.id, label: c.name }; });

    var html = '<form id="job-form" onsubmit="JobsPage.save(event, \'' + (jobId || '') + '\')">'
      + UI.formField('Client *', 'select', 'j-clientId', j.clientId, { options: [{ value: '', label: 'Select...' }].concat(clientOptions) })
      + UI.formField('Property Address', 'text', 'j-property', j.property, { placeholder: 'Job site address' })
      + UI.formField('Description', 'text', 'j-description', j.description, { placeholder: 'e.g., Remove 2 dead oaks' })
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      + UI.formField('Scheduled Date', 'date', 'j-date', j.scheduledDate)
      + UI.formField('Total ($)', 'number', 'j-total', j.total, { placeholder: '0.00' })
      + '</div>'
      + UI.formField('Status', 'select', 'j-status', j.status || 'scheduled', { options: ['scheduled', 'in_progress', 'completed', 'late', 'cancelled'] })
      + UI.formField('Crew (comma separated)', 'text', 'j-crew', j.crew ? j.crew.join(', ') : '', { placeholder: 'Doug Brown, Ryan Knapp' })
      + UI.formField('Notes', 'textarea', 'j-notes', j.notes, { placeholder: 'Job notes...' })
      + '</form>';

    UI.showModal(jobId ? 'Edit Job #' + j.jobNumber : 'New Job', html, {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-primary" onclick="document.getElementById(\'job-form\').requestSubmit()">Save Job</button>'
    });
  },

  save: function(e, jobId) {
    e.preventDefault();
    var clientId = document.getElementById('j-clientId').value;
    var client = clientId ? DB.clients.getById(clientId) : null;

    var data = {
      clientId: clientId,
      clientName: client ? client.name : '',
      property: document.getElementById('j-property').value.trim(),
      description: document.getElementById('j-description').value.trim(),
      scheduledDate: document.getElementById('j-date').value,
      total: parseFloat(document.getElementById('j-total').value) || 0,
      status: document.getElementById('j-status').value,
      crew: document.getElementById('j-crew').value.split(',').map(function(s) { return s.trim(); }).filter(Boolean),
      notes: document.getElementById('j-notes').value.trim()
    };

    if (jobId) {
      DB.jobs.update(jobId, data);
      UI.toast('Job updated');
    } else {
      DB.jobs.create(data);
      UI.toast('Job created');
    }
    UI.closeModal();
    loadPage('jobs');
  },

  showDetail: function(id) {
    var j = DB.jobs.getById(id);
    if (!j) return;

    var html = '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:20px;">'
      + '<div><h2 style="margin-bottom:4px;">Job #' + j.jobNumber + '</h2>'
      + '<div style="color:var(--text-light);font-size:14px;">' + (j.clientName || '') + '</div>'
      + '<div style="font-size:13px;color:var(--text-light);">' + (j.property || '') + '</div>'
      + '<div style="margin-top:8px;">' + UI.statusBadge(j.status) + '</div></div>'
      + '<div style="text-align:right;"><div style="font-size:2rem;font-weight:800;color:var(--green-dark);">' + UI.money(j.total) + '</div>'
      + '<div style="font-size:13px;color:var(--text-light);">Scheduled: ' + UI.dateShort(j.scheduledDate) + '</div></div>'
      + '</div>';

    // Description
    if (j.description) html += '<div style="padding:12px;background:var(--bg);border-radius:8px;margin-bottom:16px;font-size:14px;">' + j.description + '</div>';

    // Crew
    if (j.crew && j.crew.length) {
      html += '<h4 style="margin-bottom:8px;">Crew</h4><div style="display:flex;gap:8px;margin-bottom:16px;">';
      j.crew.forEach(function(name) {
        html += '<span style="padding:6px 12px;background:var(--green-bg);border-radius:20px;font-size:13px;font-weight:600;">👷 ' + name + '</span>';
      });
      html += '</div>';
    }

    // Line items
    if (j.lineItems && j.lineItems.length) {
      html += '<h4 style="margin-bottom:8px;">Line Items</h4>'
        + '<table class="data-table" style="margin-bottom:16px;"><thead><tr><th>Service</th><th>Description</th><th>Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amount</th></tr></thead><tbody>';
      j.lineItems.forEach(function(item) {
        html += '<tr><td>' + (item.service || 'Custom') + '</td><td>' + (item.description || '') + '</td><td>' + item.qty + '</td><td style="text-align:right;">' + UI.money(item.rate) + '</td><td style="text-align:right;font-weight:600;">' + UI.money(item.amount || item.qty * item.rate) + '</td></tr>';
      });
      html += '</tbody></table>';
    }

    // Property map button
    html += '<div style="margin-bottom:16px;"><button class="btn btn-outline" onclick="UI.closeModal();PropertyMap.show(\'' + (j.property || '').replace(/'/g, "\\'") + '\')">🗺️ Property Map — Equipment Layout</button></div>';

    // Status buttons
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
    ['scheduled', 'in_progress', 'completed', 'late', 'cancelled'].forEach(function(s) {
      html += '<button class="btn ' + (j.status === s ? 'btn-primary' : 'btn-outline') + '" onclick="JobsPage.setStatus(\'' + id + '\',\'' + s + '\')">' + s.replace(/_/g, ' ') + '</button>';
    });
    html += '</div>';

    UI.showModal('Job #' + j.jobNumber, html, {
      wide: true,
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Close</button>'
        + ' <button class="btn btn-outline" onclick="UI.closeModal();JobsPage.showForm(\'' + id + '\')">Edit</button>'
        + (j.status === 'completed' ? ' <button class="btn btn-primary" onclick="JobsPage.createInvoice(\'' + id + '\')">Create Invoice</button>' : '')
    });
  },

  setStatus: function(id, status) {
    DB.jobs.update(id, { status: status });
    UI.toast('Job status: ' + status.replace(/_/g, ' '));
    UI.closeModal();
    loadPage('jobs');
  },

  createInvoice: function(jobId) {
    var j = DB.jobs.getById(jobId);
    if (!j) return;
    var inv = DB.invoices.create({
      clientId: j.clientId,
      clientName: j.clientName,
      jobId: jobId,
      subject: j.description || 'For Services Rendered',
      lineItems: j.lineItems,
      total: j.total,
      balance: j.total,
      status: 'draft',
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    });
    UI.toast('Invoice #' + inv.invoiceNumber + ' created');
    UI.closeModal();
    loadPage('invoices');
  }
};

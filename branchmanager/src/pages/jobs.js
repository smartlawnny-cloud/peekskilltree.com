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
    // Get clients synchronously from localStorage
    var allClients = [];
    try { allClients = JSON.parse(localStorage.getItem('bm-clients') || '[]'); } catch(e) {}
    var clientOptions = allClients.map(function(c) { return { value: c.id, label: c.name }; });

    // Get team members for crew assignment
    var team = [];
    try { team = JSON.parse(localStorage.getItem('bm-team') || '[]'); } catch(e) {}

    // Time slots (Jobber style - 30 min increments)
    var timeSlots = [];
    for (var h = 6; h <= 18; h++) {
      for (var m = 0; m < 60; m += 30) {
        var hour = h > 12 ? h - 12 : h;
        var ampm = h >= 12 ? 'PM' : 'AM';
        var display = hour + ':' + String(m).padStart(2, '0') + ' ' + ampm;
        var value = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
        timeSlots.push({ value: value, label: display });
      }
    }

    var html = '<form id="job-form" onsubmit="JobsPage.save(event, \'' + (jobId || '') + '\')">'
      + UI.formField('Client *', 'select', 'j-clientId', j.clientId, { options: [{ value: '', label: 'Select a client...' }].concat(clientOptions) })
      + UI.formField('Property Address', 'text', 'j-property', j.property, { placeholder: 'Job site address' })
      + UI.formField('Description', 'text', 'j-description', j.description, { placeholder: 'e.g., Remove 2 dead oaks' })

      // Date + Time (Jobber style)
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">'
      + UI.formField('Date *', 'date', 'j-date', j.scheduledDate ? j.scheduledDate.split('T')[0] : '')
      + UI.formField('Start Time', 'select', 'j-starttime', j.startTime || '08:00', { options: [{ value: '', label: 'Anytime' }].concat(timeSlots) })
      + UI.formField('End Time', 'select', 'j-endtime', j.endTime || '', { options: [{ value: '', label: 'Open' }].concat(timeSlots) })
      + '</div>'

      // Arrival window (Jobber style)
      + '<div style="margin-bottom:12px;">'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Arrival Window</label>'
      + '<div style="display:flex;gap:4px;flex-wrap:wrap;">'
      + '<button type="button" class="btn btn-outline arr-btn" onclick="JobsPage._setArrival(this,\'anytime\')" style="font-size:12px;padding:5px 10px;">Anytime</button>'
      + '<button type="button" class="btn btn-primary arr-btn" onclick="JobsPage._setArrival(this,\'morning\')" style="font-size:12px;padding:5px 10px;">Morning (8-12)</button>'
      + '<button type="button" class="btn btn-outline arr-btn" onclick="JobsPage._setArrival(this,\'afternoon\')" style="font-size:12px;padding:5px 10px;">Afternoon (12-5)</button>'
      + '<button type="button" class="btn btn-outline arr-btn" onclick="JobsPage._setArrival(this,\'specific\')" style="font-size:12px;padding:5px 10px;">Specific Time</button>'
      + '</div><input type="hidden" id="j-arrival" value="' + (j.arrivalWindow || 'morning') + '">'
      + '</div>'

      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
      + UI.formField('Total ($)', 'number', 'j-total', j.total, { placeholder: '0.00' })
      + UI.formField('Status', 'select', 'j-status', j.status || 'scheduled', { options: ['scheduled', 'in_progress', 'completed', 'late', 'cancelled'] })
      + '</div>'

      // Crew assignment (checkboxes for team members)
      + '<div style="margin-bottom:12px;">'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:6px;">Assign Crew</label>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
    var currentCrew = j.crew || [];
    if (team.length) {
      team.forEach(function(t) {
        var checked = currentCrew.indexOf(t.name) >= 0;
        html += '<label style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:' + (checked ? 'var(--green-bg)' : 'var(--bg)') + ';border:1px solid ' + (checked ? '#c8e6c9' : 'var(--border)') + ';border-radius:6px;cursor:pointer;font-size:13px;">'
          + '<input type="checkbox" class="j-crew-check" value="' + t.name + '"' + (checked ? ' checked' : '') + ' style="width:16px;height:16px;">'
          + '👷 ' + t.name + '</label>';
      });
    }
    html += '<input type="text" id="j-crew-other" placeholder="+ Add name" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;width:120px;">'
      + '</div></div>'

      + UI.formField('Notes', 'textarea', 'j-notes', j.notes, { placeholder: 'Job notes, special instructions...' })
      + '</form>';

    UI.showModal(jobId ? 'Edit Job #' + j.jobNumber : 'New Job', html, {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-primary" onclick="document.getElementById(\'job-form\').requestSubmit()">Save Job</button>'
    });
  },

  _setArrival: function(btn, window) {
    document.querySelectorAll('.arr-btn').forEach(function(b) {
      b.classList.remove('btn-primary'); b.classList.add('btn-outline');
    });
    btn.classList.remove('btn-outline'); btn.classList.add('btn-primary');
    document.getElementById('j-arrival').value = window;
  },

  save: function(e, jobId) {
    e.preventDefault();
    var clientId = document.getElementById('j-clientId').value;
    // Get client from localStorage directly
    var allClients = [];
    try { allClients = JSON.parse(localStorage.getItem('bm-clients') || '[]'); } catch(e) {}
    var client = allClients.find(function(c) { return c.id === clientId; });

    // Collect crew from checkboxes
    var crew = [];
    document.querySelectorAll('.j-crew-check:checked').forEach(function(cb) { crew.push(cb.value); });
    var otherCrew = document.getElementById('j-crew-other').value.trim();
    if (otherCrew) crew.push(otherCrew);

    var data = {
      clientId: clientId,
      clientName: client ? client.name : '',
      clientPhone: client ? client.phone : '',
      clientEmail: client ? client.email : '',
      property: document.getElementById('j-property').value.trim(),
      description: document.getElementById('j-description').value.trim(),
      scheduledDate: document.getElementById('j-date').value,
      startTime: document.getElementById('j-starttime').value,
      endTime: document.getElementById('j-endtime').value,
      arrivalWindow: document.getElementById('j-arrival').value,
      total: parseFloat(document.getElementById('j-total').value) || 0,
      status: document.getElementById('j-status').value,
      crew: crew,
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

    // Workflow actions
    if (typeof Workflow !== 'undefined') {
      html += '<div style="margin-bottom:16px;">' + Workflow.jobActions(id) + '</div>';
    } else {
      // Fallback status buttons
      html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">';
      ['scheduled', 'in_progress', 'completed', 'late', 'cancelled'].forEach(function(s) {
        html += '<button class="btn ' + (j.status === s ? 'btn-primary' : 'btn-outline') + '" onclick="JobsPage.setStatus(\'' + id + '\',\'' + s + '\')">' + s.replace(/_/g, ' ') + '</button>';
      });
      html += '</div>';
    }

    // Photos
    if (typeof Photos !== 'undefined') {
      html += '<div id="job-photos-section">' + Photos.renderGallery('job', id) + '</div>';
    }

    // Time entries for this job
    var timeEntries = DB.timeEntries ? DB.timeEntries.getAll().filter(function(te) { return te.jobId === id; }) : [];
    if (timeEntries.length) {
      var totalHours = timeEntries.reduce(function(s, te) { return s + (te.hours || 0); }, 0);
      html += '<div style="margin-top:16px;"><h4 style="margin-bottom:8px;">⏱ Time Tracked (' + totalHours.toFixed(1) + ' hrs)</h4>';
      timeEntries.forEach(function(te) {
        html += '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;border-bottom:1px solid #f0f0f0;">'
          + '<span>' + (te.user || 'Crew') + ' — ' + UI.dateShort(te.date) + '</span>'
          + '<span style="font-weight:600;">' + (te.hours || 0).toFixed(1) + ' hrs</span></div>';
      });
      html += '</div>';
    }

    UI.showModal('Job #' + j.jobNumber, html, {
      wide: true,
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Close</button>'
        + ' <button class="btn btn-outline" onclick="UI.closeModal();JobsPage.showForm(\'' + id + '\')">Edit</button>'
        + ' <button class="btn btn-outline" onclick="PDF.generateJobSheet(\'' + id + '\')">📄 Job Sheet</button>'
        + (j.status === 'completed' && !j.invoiceId ? ' <button class="btn btn-primary" onclick="Workflow.jobToInvoice(\'' + id + '\');UI.closeModal();loadPage(\'invoices\');">Create Invoice</button>' : '')
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

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

    var timeEntries = DB.timeEntries ? DB.timeEntries.getAll().filter(function(te) { return te.jobId === id; }) : [];
    var totalHours = timeEntries.reduce(function(s, te) { return s + (te.hours || 0); }, 0);

    // Full-page job detail (Jobber style)
    var html = ''
      // Back + header
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">'
      + '<button class="btn btn-outline" onclick="loadPage(\'jobs\')" style="padding:6px 12px;">← Back</button>'
      + '<div style="flex:1;">'
      + '<h2 style="font-size:22px;margin-bottom:2px;">Job #' + j.jobNumber + '</h2>'
      + '<span style="font-size:14px;color:var(--text-light);">' + (j.clientName || '') + (j.property ? ' — ' + j.property : '') + '</span>'
      + '</div>'
      + '<div style="display:flex;gap:6px;">'
      + '<button class="btn btn-outline" onclick="JobsPage.showForm(\'' + id + '\')">Edit</button>'
      + '<button class="btn btn-outline" onclick="PDF.generateJobSheet(\'' + id + '\')">📄 Job Sheet</button>'
      + '<button class="btn btn-outline" onclick="PropertyMap.show(\'' + (j.property || '').replace(/'/g, "\\'") + '\')">🗺 Map</button>'
      + (j.status === 'completed' && !j.invoiceId ? '<button class="btn btn-primary" onclick="if(typeof Workflow!==\'undefined\')Workflow.jobToInvoice(\'' + id + '\');loadPage(\'invoices\');">Create Invoice</button>' : '')
      + '</div></div>'

      // Status + total bar
      + '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:20px;">'
      + UI.statCard('Status', '<span style="font-size:14px;">' + UI.statusBadge(j.status) + '</span>', '', '', '')
      + UI.statCard('Total', UI.money(j.total), '', '', '')
      + UI.statCard('Scheduled', UI.dateShort(j.scheduledDate), (j.startTime || 'Anytime'), '', '')
      + UI.statCard('Time Tracked', totalHours.toFixed(1) + ' hrs', timeEntries.length + ' entries', '', '')
      + UI.statCard('Crew', (j.crew ? j.crew.length : 0) + ' assigned', '', '', '')
      + '</div>'

      // Two column layout
      + '<div style="display:grid;grid-template-columns:1fr 340px;gap:20px;">'

      // Left — main content
      + '<div>'

      // Status workflow buttons
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Status</h4>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
    ['scheduled', 'in_progress', 'completed', 'cancelled'].forEach(function(s) {
      html += '<button class="btn ' + (j.status === s ? 'btn-primary' : 'btn-outline') + '" onclick="JobsPage.setStatus(\'' + id + '\',\'' + s + '\');JobsPage.showDetail(\'' + id + '\');" style="font-size:12px;padding:6px 14px;">' + s.replace(/_/g, ' ') + '</button>';
    });
    html += '</div></div>'

      // Description
      + (j.description ? '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px;">'
        + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Description</h4>'
        + '<p style="font-size:14px;line-height:1.6;margin:0;">' + j.description + '</p></div>' : '')

      // Line items
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:16px;">'
      + '<div style="padding:12px 16px;border-bottom:1px solid var(--border);"><h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin:0;">Line Items</h4></div>';
    if (j.lineItems && j.lineItems.length) {
      html += '<table class="data-table" style="border:none;border-radius:0;"><thead><tr><th>Service</th><th>Description</th><th>Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amount</th></tr></thead><tbody>';
      j.lineItems.forEach(function(item) {
        html += '<tr><td>' + (item.service || 'Custom') + '</td><td style="color:var(--text-light);">' + (item.description || '') + '</td><td>' + item.qty + '</td><td style="text-align:right;">' + UI.money(item.rate) + '</td><td style="text-align:right;font-weight:600;">' + UI.money(item.amount || item.qty * item.rate) + '</td></tr>';
      });
      html += '<tr style="background:var(--green-bg);"><td colspan="4" style="text-align:right;font-weight:700;">Total</td><td style="text-align:right;font-weight:800;font-size:15px;color:var(--accent);">' + UI.money(j.total) + '</td></tr>';
      html += '</tbody></table>';
    } else {
      html += '<div style="padding:20px;text-align:center;color:var(--text-light);font-size:13px;">No line items</div>';
    }
    html += '</div>'

      // Photos
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:16px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Photos</h4>';
    if (typeof Photos !== 'undefined') {
      html += Photos.renderGallery('job', id);
    } else {
      html += '<div style="color:var(--text-light);font-size:13px;">No photos</div>';
    }
    html += '</div></div>'

      // Right sidebar — crew, time, notes, actions
      + '<div>'

      // Crew
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Crew</h4>';
    if (j.crew && j.crew.length) {
      j.crew.forEach(function(name) {
        html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--bg);">'
          + '<div style="width:32px;height:32px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">' + name.split(' ').map(function(n){return n[0];}).join('') + '</div>'
          + '<span style="font-size:13px;font-weight:600;">' + name + '</span></div>';
      });
    } else {
      html += '<div style="color:var(--text-light);font-size:13px;">No crew assigned</div>';
    }
    html += '</div>'

      // Time tracking
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Time Tracked</h4>';
    if (timeEntries.length) {
      html += '<div style="font-size:24px;font-weight:800;color:var(--accent);margin-bottom:10px;">' + totalHours.toFixed(1) + ' hrs</div>';
      timeEntries.forEach(function(te) {
        html += '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;border-bottom:1px solid var(--bg);">'
          + '<span>' + (te.user || 'Crew') + '</span>'
          + '<span style="font-weight:600;">' + (te.hours || 0).toFixed(1) + 'h</span></div>';
      });
    } else {
      html += '<div style="color:var(--text-light);font-size:13px;">No time logged</div>';
    }
    html += '</div>'

      // Quick actions
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Quick Actions</h4>'
      + (j.clientPhone ? '<a href="tel:' + j.clientPhone + '" class="btn btn-outline" style="width:100%;justify-content:center;margin-bottom:6px;font-size:12px;">📞 Call Client</a>' : '')
      + (j.property ? '<a href="https://maps.google.com/?q=' + encodeURIComponent(j.property) + '" target="_blank" class="btn btn-outline" style="width:100%;justify-content:center;margin-bottom:6px;font-size:12px;">🗺 Navigate</a>' : '')
      + '<button class="btn btn-outline" style="width:100%;justify-content:center;margin-bottom:6px;font-size:12px;" onclick="PropertyMap.show(\'' + (j.property || '').replace(/'/g, "\\'") + '\')">📐 Equipment Layout</button>'
      + '</div>'

      // Activity timeline
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px;">'
      + '<h4 style="font-size:13px;color:var(--text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Activity</h4>'
      + '<div style="border-left:2px solid var(--border);padding-left:16px;margin-left:8px;">';
    // Build timeline from available data
    var timeline = [];
    if (j.createdAt) timeline.push({ date: j.createdAt, text: 'Job created', icon: '📋' });
    if (j.scheduledDate) timeline.push({ date: j.scheduledDate, text: 'Scheduled for ' + UI.dateShort(j.scheduledDate), icon: '📅' });
    timeEntries.forEach(function(te) { timeline.push({ date: te.date, text: (te.user || 'Crew') + ' logged ' + (te.hours||0).toFixed(1) + 'h', icon: '⏱' }); });
    if (j.status === 'completed') timeline.push({ date: j.completedAt || j.scheduledDate, text: 'Job completed', icon: '✅' });
    if (j.invoiceId) timeline.push({ date: j.completedAt || '', text: 'Invoice created', icon: '💰' });
    timeline.sort(function(a,b) { return (a.date||'').localeCompare(b.date||''); });
    if (timeline.length) {
      timeline.forEach(function(t) {
        html += '<div style="position:relative;padding-bottom:14px;">'
          + '<div style="position:absolute;left:-22px;top:2px;width:12px;height:12px;background:var(--accent);border-radius:50%;border:2px solid var(--white);"></div>'
          + '<div style="font-size:12px;color:var(--text-light);">' + (t.date ? UI.dateShort(t.date) : '') + '</div>'
          + '<div style="font-size:13px;">' + t.icon + ' ' + t.text + '</div></div>';
      });
    } else {
      html += '<div style="font-size:13px;color:var(--text-light);">No activity yet</div>';
    }
    html += '</div></div></div></div>';

    // Render as full page
    document.getElementById('pageTitle').textContent = 'Job #' + j.jobNumber;
    document.getElementById('pageContent').innerHTML = html;
    document.getElementById('pageAction').style.display = 'none';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  },

  // Legacy modal (not used)
  _showDetailModal: function(id) {
    UI.showModal('Job', '<p>Use full-page view.</p>', {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Close</button>'
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

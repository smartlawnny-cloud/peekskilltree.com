/**
 * Branch Manager — Client Hub
 * Client-facing portal where customers can:
 * - View their quotes and approve them
 * - See upcoming appointments
 * - View and pay invoices
 * - Submit new requests
 * - See job history
 *
 * Access: peekskilltree.com/branchmanager/client.html?id=CLIENT_ID
 * (In production, this will be a separate page with its own auth)
 */
var ClientHub = {
  render: function() {
    var clients = DB.clients.getAll().slice(0, 200);
    clients.sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); });

    var html = '<div style="max-width:800px;">'
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:16px 20px;margin-bottom:20px;">'
      + '<div style="display:flex;align-items:center;gap:12px;">'
      + '<div style="font-size:32px;">🌳</div>'
      + '<div><div style="font-weight:700;font-size:15px;">Client Portal</div>'
      + '<div style="font-size:13px;color:var(--text-light);">Each client gets a private link to view quotes, approve work, pay invoices, and submit requests.</div></div>'
      + '</div>'
      + '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">'
      + '<div style="font-size:12px;color:var(--text-light);padding:6px 12px;background:var(--bg);border-radius:20px;">✅ View & approve quotes</div>'
      + '<div style="font-size:12px;color:var(--text-light);padding:6px 12px;background:var(--bg);border-radius:20px;">💰 Pay invoices online</div>'
      + '<div style="font-size:12px;color:var(--text-light);padding:6px 12px;background:var(--bg);border-radius:20px;">📅 See appointments</div>'
      + '<div style="font-size:12px;color:var(--text-light);padding:6px 12px;background:var(--bg);border-radius:20px;">📥 Submit requests</div>'
      + '</div></div>';

    html += '<div style="margin-bottom:12px;"><input type="text" id="clienthub-search" placeholder="Search clients..." oninput="ClientHub._filterList(this.value)" style="width:100%;max-width:360px;padding:10px 14px;border:2px solid var(--border);border-radius:8px;font-size:14px;"></div>';
    html += '<div id="clienthub-list">';

    clients.forEach(function(c) {
      var allInvoices = DB.invoices.getAll().filter(function(i) { return i.clientId === c.id || (i.clientName || '').toLowerCase() === (c.name || '').toLowerCase(); });
      var allQuotes = DB.quotes.getAll().filter(function(q) { return q.clientId === c.id || (q.clientName || '').toLowerCase() === (c.name || '').toLowerCase(); });
      var unpaidCount = allInvoices.filter(function(i) { return i.status !== 'paid' && i.balance > 0; }).length;
      var pendingQuotes = allQuotes.filter(function(q) { return q.status === 'sent' || q.status === 'awaiting'; }).length;
      var link = ClientHub.getLink(c.id);

      html += '<div class="client-hub-row" style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:12px;">'
        + '<div style="display:flex;align-items:center;gap:10px;min-width:0;">'
        + '<div style="width:36px;height:36px;border-radius:50%;background:var(--accent-light);color:var(--accent);font-weight:700;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">'
        + (c.name || '?').charAt(0).toUpperCase() + '</div>'
        + '<div style="min-width:0;">'
        + '<div style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + UI.esc(c.name || '') + '</div>'
        + '<div style="font-size:12px;color:var(--text-light);">'
        + (c.email || '') + (c.email && c.phone ? ' · ' : '') + (c.phone || '')
        + '</div></div></div>'
        + '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">'
        + (unpaidCount > 0 ? '<span style="font-size:11px;background:#fff3e0;color:#e65100;padding:3px 8px;border-radius:10px;font-weight:600;">' + unpaidCount + ' unpaid</span>' : '')
        + (pendingQuotes > 0 ? '<span style="font-size:11px;background:#e3f2fd;color:#1565c0;padding:3px 8px;border-radius:10px;font-weight:600;">' + pendingQuotes + ' quote' + (pendingQuotes > 1 ? 's' : '') + '</span>' : '')
        + '<button onclick="ClientHub.showForClient(\'' + c.id + '\')" style="background:var(--green-dark);color:#fff;border:none;padding:7px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">View Portal</button>'
        + '<button onclick="navigator.clipboard.writeText(\'' + link + '\').then(function(){UI.toast(\'Link copied!\');})" style="background:none;border:1px solid var(--border);padding:7px 10px;border-radius:6px;font-size:12px;cursor:pointer;" title="Copy link">🔗</button>'
        + '</div></div>';
    });

    html += '</div></div>';
    return html;
  },

  _filterList: function(query) {
    var rows = document.querySelectorAll('.client-hub-row');
    var q = (query || '').toLowerCase().trim();
    rows.forEach(function(row) {
      var text = row.textContent.toLowerCase();
      row.style.display = (!q || text.indexOf(q) > -1) ? '' : 'none';
    });
  },

  // Generate a shareable client portal link
  getLink: function(clientId) {
    return window.location.origin + window.location.pathname.replace('index.html', '') + 'client.html?id=' + clientId;
  },

  // Render client hub preview (for the admin to see what client sees)
  renderPreview: function(clientId) {
    var c = DB.clients.getById(clientId);
    if (!c) return '<div class="empty-state"><div class="empty-icon">👤</div><h3>Client not found</h3></div>';

    var clientJobs = DB.jobs.getAll().filter(function(j) { return j.clientId === clientId; });
    var clientInvoices = DB.invoices.getAll().filter(function(i) { return i.clientId === clientId; });
    var clientQuotes = DB.quotes.getAll().filter(function(q) { return q.clientId === clientId; });

    var html = '<div style="max-width:600px;margin:0 auto;">';

    // Header
    html += '<div style="text-align:center;padding:24px;background:var(--green-dark);border-radius:12px;color:#fff;margin-bottom:20px;">'
      + '<h2 style="margin-bottom:4px;">🌳 Second Nature Tree Service</h2>'
      + '<p style="opacity:.7;font-size:13px;">Client Portal for ' + c.name + '</p>'
      + '</div>';

    // Quick Actions
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">'
      + '<button class="btn btn-primary" style="padding:16px;font-size:14px;justify-content:center;" onclick="ClientHub.newRequest(\'' + clientId + '\')">📥 New Request</button>'
      + '<a href="tel:9143915233" class="btn btn-outline" style="padding:16px;font-size:14px;justify-content:center;text-decoration:none;">📞 Call Us</a>'
      + '</div>';

    // Pending Quotes
    var pendingQuotes = clientQuotes.filter(function(q) { return q.status === 'sent' || q.status === 'awaiting'; });
    if (pendingQuotes.length > 0) {
      html += '<div style="background:var(--white);border-radius:12px;border:2px solid #ff9800;padding:16px;margin-bottom:16px;">'
        + '<h3 style="font-size:15px;margin-bottom:12px;color:#e65100;">📋 Quotes Awaiting Your Approval</h3>';
      pendingQuotes.forEach(function(q) {
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f0f0f0;">'
          + '<div><strong>Quote #' + q.quoteNumber + '</strong><br><span style="font-size:12px;color:var(--text-light);">' + (q.description || '') + '</span></div>'
          + '<div style="text-align:right;"><div style="font-size:1.2rem;font-weight:800;color:var(--green-dark);">' + UI.money(q.total) + '</div>'
          + '<button class="btn btn-primary" style="font-size:11px;padding:4px 12px;margin-top:4px;" onclick="ClientHub.approveQuote(\'' + q.id + '\')">Approve</button></div>'
          + '</div>';
      });
      html += '</div>';
    }

    // Upcoming Appointments
    var upcomingJobs = clientJobs.filter(function(j) { return j.status === 'scheduled' || j.status === 'in_progress'; });
    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);padding:16px;margin-bottom:16px;">'
      + '<h3 style="font-size:15px;margin-bottom:12px;">📅 Upcoming Appointments</h3>';
    if (upcomingJobs.length > 0) {
      upcomingJobs.forEach(function(j) {
        html += '<div style="padding:10px 0;border-bottom:1px solid #f0f0f0;">'
          + '<div style="display:flex;justify-content:space-between;"><strong>' + (j.description || 'Service') + '</strong>' + UI.statusBadge(j.status) + '</div>'
          + '<div style="font-size:13px;color:var(--text-light);margin-top:4px;">📍 ' + (j.property || c.address || '') + '</div>'
          + '<div style="font-size:13px;color:var(--text-light);">📅 ' + UI.dateShort(j.scheduledDate) + '</div>'
          + '</div>';
      });
    } else {
      html += '<p style="font-size:14px;color:var(--text-light);text-align:center;padding:12px 0;">No upcoming appointments</p>';
    }
    html += '</div>';

    // Outstanding Invoices
    var unpaid = clientInvoices.filter(function(i) { return i.status !== 'paid' && i.balance > 0; });
    if (unpaid.length > 0) {
      html += '<div style="background:var(--white);border-radius:12px;border:2px solid var(--red);padding:16px;margin-bottom:16px;">'
        + '<h3 style="font-size:15px;margin-bottom:12px;color:var(--red);">💰 Outstanding Invoices</h3>';
      unpaid.forEach(function(inv) {
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f0f0f0;">'
          + '<div><strong>Invoice #' + inv.invoiceNumber + '</strong><br><span style="font-size:12px;color:var(--text-light);">Due: ' + UI.dateShort(inv.dueDate) + '</span></div>'
          + '<div style="text-align:right;"><div style="font-size:1.2rem;font-weight:800;color:var(--red);">' + UI.money(inv.balance) + '</div>'
          + '<button class="btn btn-primary" style="font-size:11px;padding:4px 12px;margin-top:4px;" onclick="Stripe.sendPaymentLink(\'' + inv.id + '\')">Pay Now</button></div>'
          + '</div>';
      });
      html += '</div>';
    }

    // Past Invoices
    var paidInvoices = clientInvoices.filter(function(i) { return i.status === 'paid'; });
    if (paidInvoices.length > 0) {
      html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);padding:16px;margin-bottom:16px;">'
        + '<h3 style="font-size:15px;margin-bottom:12px;">✅ Payment History</h3>';
      paidInvoices.forEach(function(inv) {
        html += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">'
          + '<span>#' + inv.invoiceNumber + ' — ' + (inv.subject || '') + '</span>'
          + '<span style="color:var(--green-dark);font-weight:600;">' + UI.money(inv.total) + ' ✓</span>'
          + '</div>';
      });
      html += '</div>';
    }

    // Contact
    html += '<div style="text-align:center;padding:20px;font-size:13px;color:var(--text-light);">'
      + 'Second Nature Tree Service<br>(914) 391-5233 &bull; info@peekskilltree.com<br>peekskilltree.com'
      + '</div>';

    html += '</div>';
    return html;
  },

  // Admin: show client hub for a specific client
  showForClient: function(clientId) {
    var html = ClientHub.renderPreview(clientId);
    var link = ClientHub.getLink(clientId);

    html += '<div style="margin-top:16px;padding:16px;background:var(--bg);border-radius:10px;text-align:center;">'
      + '<div style="font-size:13px;color:var(--text-light);margin-bottom:8px;">Share this link with your client:</div>'
      + '<input type="text" value="' + link + '" style="width:100%;padding:10px;border:2px solid var(--border);border-radius:8px;font-size:13px;text-align:center;" readonly onclick="this.select()">'
      + '<button class="btn btn-primary" style="margin-top:8px;" onclick="navigator.clipboard.writeText(\'' + link + '\');UI.toast(\'Link copied!\')">Copy Link</button>'
      + '</div>';

    UI.showModal('Client Portal Preview', html, { wide: true });
  },

  approveQuote: function(quoteId) {
    DB.quotes.update(quoteId, { status: 'approved' });
    UI.toast('Quote approved!');
    UI.closeModal();
  },

  newRequest: function(clientId) {
    UI.toast('Request form would open here (client-facing version)');
  }
};

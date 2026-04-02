/**
 * Branch Manager — Quote → Job → Invoice Workflow
 * One-click conversions between pipeline stages
 */
var Workflow = {
  // Convert a quote to a job
  quoteToJob: function(quoteId) {
    var quote = DB.quotes.getById(quoteId);
    if (!quote) { UI.toast('Quote not found', 'error'); return; }

    var job = DB.jobs.create({
      clientName: quote.clientName,
      clientId: quote.clientId || '',
      clientEmail: quote.clientEmail || '',
      clientPhone: quote.clientPhone || '',
      property: quote.property || '',
      description: quote.description || 'From Quote #' + (quote.quoteNumber || ''),
      total: quote.total || 0,
      status: 'scheduled',
      quoteId: quoteId,
      lineItems: quote.lineItems || [],
      source: 'quote',
      jobNumber: DB.jobs.getAll().length + 1
    });

    // Update quote status
    DB.quotes.update(quoteId, { status: 'converted', convertedJobId: job.id });

    UI.toast('Quote #' + (quote.quoteNumber || '') + ' → Job #' + job.jobNumber + ' created!');
    return job;
  },

  // Convert a job to an invoice
  jobToInvoice: function(jobId) {
    var job = DB.jobs.getById(jobId);
    if (!job) { UI.toast('Job not found', 'error'); return; }

    var invoice = DB.invoices.create({
      clientName: job.clientName,
      clientId: job.clientId || '',
      clientEmail: job.clientEmail || '',
      clientPhone: job.clientPhone || '',
      subject: job.description || 'Job #' + (job.jobNumber || ''),
      total: job.total || 0,
      balance: job.total || 0,
      amountPaid: 0,
      status: 'draft',
      jobId: jobId,
      lineItems: job.lineItems || [],
      invoiceNumber: DB.invoices.getAll().length + 1,
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString() // Net 30
    });

    // Update job status
    DB.jobs.update(jobId, { status: 'completed', invoiceId: invoice.id });

    UI.toast('Job → Invoice #' + invoice.invoiceNumber + ' created!');
    return invoice;
  },

  // Mark invoice as paid
  markPaid: function(invoiceId, method) {
    var inv = DB.invoices.getById(invoiceId);
    if (!inv) return;
    method = method || 'cash';

    DB.invoices.update(invoiceId, {
      status: 'paid',
      amountPaid: inv.total,
      balance: 0,
      paidDate: new Date().toISOString(),
      paymentMethod: method
    });

    // Log to payment history so Payments.renderForInvoice() shows it
    var pKey = 'bm-payments-' + invoiceId;
    var allPmts = [];
    try { allPmts = JSON.parse(localStorage.getItem(pKey)) || []; } catch(e) {}
    allPmts.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      invoiceId: invoiceId, amount: inv.total, method: method, note: '', date: new Date().toISOString(), user: 'Doug'
    });
    localStorage.setItem(pKey, JSON.stringify(allPmts));

    UI.toast('Invoice #' + (inv.invoiceNumber || '') + ' marked paid — ' + UI.money(inv.total));
  },

  // Render conversion buttons
  quoteActions: function(quoteId) {
    var quote = DB.quotes.getById(quoteId);
    if (!quote) return '';
    if (quote.status === 'converted') {
      return '<div style="padding:8px 12px;background:#e8f5e9;border-radius:6px;font-size:13px;color:#2e7d32;">✅ Converted to job</div>';
    }
    return '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
      + '<button onclick="Workflow.quoteToJob(\'' + quoteId + '\');loadPage(\'jobs\');" style="background:var(--green-dark);color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">✅ Convert to Job</button>'
      + '<button onclick="Workflow.sendQuote(\'' + quoteId + '\')" style="background:#1565c0;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">📧 Send to Client</button>'
      + '<button onclick="PDFGen.generateQuote(\'' + quoteId + '\')" style="background:#6a1b9a;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">📄 Download PDF</button>'
      + '</div>';
  },

  jobActions: function(jobId) {
    var job = DB.jobs.getById(jobId);
    if (!job) return '';
    var html = '<div style="display:flex;gap:8px;flex-wrap:wrap;">';

    if (job.status === 'scheduled') {
      html += '<button onclick="DB.jobs.update(\'' + jobId + '\',{status:\'in_progress\',startedAt:new Date().toISOString()});UI.toast(\'Job started\');loadPage(\'jobs\');" style="background:#ff9800;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">▶ Start Job</button>';
    }
    if (job.status === 'in_progress') {
      html += '<button onclick="Workflow.jobToInvoice(\'' + jobId + '\');loadPage(\'invoices\');" style="background:var(--green-dark);color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">✅ Complete & Invoice</button>';
    }
    if (job.status === 'completed' && !job.invoiceId) {
      html += '<button onclick="Workflow.jobToInvoice(\'' + jobId + '\');loadPage(\'invoices\');" style="background:var(--green-dark);color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">💰 Create Invoice</button>';
    }

    html += '<button onclick="PDFGen.generateJobSheet(\'' + jobId + '\')" style="background:#6a1b9a;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">📄 Job Sheet PDF</button>';

    // Photo button
    html += '<button onclick="document.getElementById(\'job-photos-section\').scrollIntoView({behavior:\'smooth\'})" style="background:#e3f2fd;border:1px solid #bbdefb;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer;font-weight:600;color:#1565c0;">📸 Photos</button>';

    html += '</div>';
    return html;
  },

  invoiceActions: function(invoiceId) {
    var inv = DB.invoices.getById(invoiceId);
    if (!inv) return '';

    if (inv.status === 'paid') {
      return '<div style="padding:8px 12px;background:#e8f5e9;border-radius:6px;font-size:13px;color:#2e7d32;">✅ Paid ' + UI.money(inv.total) + (inv.paidDate ? ' on ' + UI.dateShort(inv.paidDate) : '') + '</div>';
    }

    var html = '<div style="display:flex;gap:8px;flex-wrap:wrap;">';

    // Payment methods
    html += '<button onclick="Workflow.markPaid(\'' + invoiceId + '\',\'cash\');loadPage(\'invoices\');" style="background:var(--green-dark);color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">💵 Cash</button>'
      + '<button onclick="Workflow.markPaid(\'' + invoiceId + '\',\'check\');loadPage(\'invoices\');" style="background:var(--green-dark);color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">📝 Check</button>'
      + '<button onclick="Workflow.markPaid(\'' + invoiceId + '\',\'venmo\');loadPage(\'invoices\');" style="background:#008CFF;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">Venmo</button>'
      + '<button onclick="Workflow.markPaid(\'' + invoiceId + '\',\'zelle\');loadPage(\'invoices\');" style="background:#6D1ED4;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">Zelle</button>';

    // Stripe (if connected)
    html += Stripe.paymentButton(invoiceId);

    // Send & PDF
    html += '<button onclick="Workflow.sendInvoice(\'' + invoiceId + '\')" style="background:#1565c0;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">📧 Send</button>'
      + '<button onclick="PDFGen.generateInvoice(\'' + invoiceId + '\')" style="background:#6a1b9a;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">📄 PDF</button>';

    html += '</div>';
    return html;
  },

  sendQuote: function(quoteId) {
    var q = DB.quotes.getById(quoteId);
    if (!q) { UI.toast('Quote not found', 'error'); return; }

    // Find client email
    var allClients = JSON.parse(localStorage.getItem('bm-clients') || '[]');
    var client = allClients.find(function(c) { return c.id === q.clientId || (c.name||'').toLowerCase() === (q.clientName||'').toLowerCase(); });
    var email = (client && client.email) || q.clientEmail || '';
    var firstName = (q.clientName || '').split(' ')[0] || 'there';

    var approveLink = 'https://peekskilltree.com/branchmanager/approve.html?id=' + quoteId;
    var subject = 'Your estimate from Second Nature Tree — Quote #' + (q.quoteNumber || '');
    var body = 'Hi ' + firstName + ',\n\n'
      + 'Thanks for having us out to take a look! Here\'s your estimate for the work we discussed.\n\n'
      + '📋 Quote #' + (q.quoteNumber || '') + '\n'
      + '📍 ' + (q.property || 'Your property') + '\n'
      + '💰 Total: ' + UI.money(q.total) + '\n\n'
      + (q.description ? '📝 ' + q.description + '\n\n' : '')
      + '✅ Review & Approve Online:\n' + approveLink + '\n\n'
      + 'You can approve, request changes, or ask questions directly from that link.\n\n'
      + 'We can usually schedule within 1-2 weeks of approval. Give us a call anytime at (914) 391-5233.\n\n'
      + 'Doug Brown\nSecond Nature Tree Service\n(914) 391-5233\ninfo@peekskilltree.com';

    var html = '<div style="padding:16px;">'
      + '<div style="margin-bottom:16px;">'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">To</label>'
      + '<input type="email" id="q-send-to" value="' + email + '" placeholder="client@email.com" style="width:100%;padding:8px 12px;border:2px solid var(--border);border-radius:8px;font-size:14px;">'
      + '</div>'
      + '<div style="margin-bottom:16px;">'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Subject</label>'
      + '<input type="text" id="q-send-subject" value="' + subject.replace(/"/g, '&quot;') + '" style="width:100%;padding:8px 12px;border:2px solid var(--border);border-radius:8px;font-size:14px;">'
      + '</div>'
      + '<div style="margin-bottom:16px;">'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Message</label>'
      + '<textarea id="q-send-body" rows="14" style="width:100%;padding:10px 12px;border:2px solid var(--border);border-radius:8px;font-size:13px;line-height:1.6;font-family:inherit;resize:vertical;">' + body + '</textarea>'
      + '</div>'
      + '<div style="font-size:12px;color:var(--text-light);">📎 Quote PDF will be attached</div>'
      + '</div>';

    UI.showModal('Send Quote #' + (q.quoteNumber || ''), html, {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-outline" onclick="PDF.generateQuote(\'' + quoteId + '\')">👁 Preview PDF</button>'
        + ' <button class="btn btn-primary" onclick="Workflow._confirmSendQuote(\'' + quoteId + '\')">📧 Send Quote</button>'
    });
  },

  _confirmSendQuote: function(quoteId) {
    var to = document.getElementById('q-send-to').value.trim();
    if (!to) { UI.toast('Enter an email address', 'error'); return; }
    var subject = document.getElementById('q-send-subject').value;
    var body = document.getElementById('q-send-body').value;

    Workflow._sendViaSupabase(to, subject, body, function(ok) {
      if (!ok) {
        var mailto = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        window.open(mailto, '_blank');
      }
    });

    DB.quotes.update(quoteId, { status: 'sent', sentAt: new Date().toISOString(), sentTo: to });
    UI.closeModal();
    UI.toast('Quote sent to ' + to);
  },

  sendInvoice: function(invoiceId) {
    var inv = DB.invoices.getById(invoiceId);
    if (!inv) { UI.toast('Invoice not found', 'error'); return; }

    var client = inv.clientId ? DB.clients.getById(inv.clientId) : null;
    var email = (client && client.email) || inv.clientEmail || '';
    var firstName = (inv.clientName || '').split(' ')[0] || 'there';

    var payLink = 'https://peekskilltree.com/branchmanager/pay.html?id=' + invoiceId;
    var subject = 'Invoice #' + inv.invoiceNumber + ' from Second Nature Tree Service — ' + UI.money(inv.total);
    var body = 'Hi ' + firstName + ',\n\n'
      + 'Please find your invoice attached for the work completed at your property.\n\n'
      + '🧾 Invoice #' + inv.invoiceNumber + '\n'
      + '💰 Amount Due: ' + UI.money(inv.balance || inv.total) + '\n'
      + '📅 Due: ' + UI.dateShort(inv.dueDate) + '\n\n'
      + '💳 Pay Online (card, Venmo, Zelle):\n' + payLink + '\n\n'
      + 'Or pay by check payable to Second Nature Tree Service.\n\n'
      + 'Thank you for choosing Second Nature Tree Service!\n\n'
      + 'Doug Brown\n(914) 391-5233\ninfo@peekskilltree.com';

    var html = '<div style="padding:16px;">'
      + '<div style="margin-bottom:16px;">'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">To</label>'
      + '<input type="email" id="inv-send-to" value="' + email + '" placeholder="client@email.com" style="width:100%;padding:8px 12px;border:2px solid var(--border);border-radius:8px;font-size:14px;">'
      + '</div>'
      + '<div style="margin-bottom:16px;">'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Subject</label>'
      + '<input type="text" id="inv-send-subject" value="' + subject + '" style="width:100%;padding:8px 12px;border:2px solid var(--border);border-radius:8px;font-size:14px;">'
      + '</div>'
      + '<div style="margin-bottom:16px;">'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Message</label>'
      + '<textarea id="inv-send-body" rows="14" style="width:100%;padding:10px 12px;border:2px solid var(--border);border-radius:8px;font-size:13px;line-height:1.6;font-family:inherit;resize:vertical;">' + body + '</textarea>'
      + '</div>'
      + '<div style="font-size:12px;color:var(--text-light);">📎 Invoice PDF will be attached</div>'
      + '</div>';

    UI.showModal('Send Invoice #' + inv.invoiceNumber, html, {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-outline" onclick="PDF.generateInvoice(\'' + invoiceId + '\')">👁 Preview PDF</button>'
        + ' <button class="btn btn-primary" onclick="Workflow._confirmSendInvoice(\'' + invoiceId + '\')">📧 Send Invoice</button>'
    });
  },

  _confirmSendInvoice: function(invoiceId) {
    var to = document.getElementById('inv-send-to').value.trim();
    if (!to) { UI.toast('Enter an email address', 'error'); return; }

    var subject = document.getElementById('inv-send-subject').value;
    var body = document.getElementById('inv-send-body').value;

    // Try SendGrid via Supabase, fallback to mailto
    Workflow._sendViaSupabase(to, subject, body, function(ok) {
      if (!ok) {
        var mailto = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        window.open(mailto, '_blank');
      }
    });

    DB.invoices.update(invoiceId, { status: 'sent', sentAt: new Date().toISOString(), sentTo: to });
    UI.closeModal();
    UI.toast('Invoice sent to ' + to);
  },

  _sendViaSupabase: function(to, subject, body, callback) {
    // Use Email.send() (SendGrid) if configured, else let caller handle fallback
    if (typeof Email !== 'undefined' && Email.isConfigured()) {
      Email.send(to, subject, body).then(function(result) {
        if (callback) callback(result && result.success);
      });
    } else {
      if (callback) callback(false);
    }
  },

  // Show a payment recording modal with method selection
  showMarkPaid: function(invoiceId) {
    var inv = DB.invoices.getById(invoiceId);
    if (!inv) return;
    var balance = inv.balance || inv.total || 0;

    var html = '<div style="text-align:center;padding:8px 0;">'
      + '<div style="font-size:48px;margin-bottom:12px;">💵</div>'
      + '<h3 style="font-size:18px;margin-bottom:4px;">Record Payment</h3>'
      + '<p style="color:var(--text-light);font-size:14px;margin-bottom:20px;">Invoice #' + inv.invoiceNumber + ' — ' + UI.money(balance) + ' due</p>'
      + '</div>'
      + '<div style="text-align:left;margin-bottom:16px;">'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);">Amount Received</label>'
      + '<input type="number" id="mp-amount" value="' + balance.toFixed(2) + '" step="0.01" min="0.01" style="width:100%;padding:12px;border:2px solid var(--border);border-radius:8px;font-size:18px;font-weight:700;margin-top:4px;text-align:center;">'
      + '</div>'
      + '<div style="text-align:left;margin-bottom:8px;">'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);margin-bottom:8px;display:block;">Payment Method</label>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">';
    ['Cash', 'Check', 'Venmo', 'Zelle', 'Card', 'Other'].forEach(function(m, i) {
      html += '<button type="button" class="mp-method-btn" data-method="' + m.toLowerCase() + '" '
        + 'onclick="document.querySelectorAll(\'.mp-method-btn\').forEach(function(b){b.style.background=\'var(--bg)\';b.style.color=\'var(--text)\';b.style.borderColor=\'var(--border)\'});this.style.background=\'var(--green-dark)\';this.style.color=\'#fff\';this.style.borderColor=\'var(--green-dark)\';document.getElementById(\'mp-method-val\').value=this.dataset.method;" '
        + 'style="padding:10px 8px;background:' + (i === 0 ? 'var(--green-dark);color:#fff' : 'var(--bg);color:var(--text)') + ';border:2px solid ' + (i === 0 ? 'var(--green-dark)' : 'var(--border)') + ';border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">'
        + m + '</button>';
    });
    html += '</div>'
      + '<input type="hidden" id="mp-method-val" value="cash">'
      + '</div>'
      + '<div style="text-align:left;margin-bottom:20px;">'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);">Note (optional)</label>'
      + '<input type="text" id="mp-note" placeholder="Check #, transaction ID..." style="width:100%;padding:10px;border:2px solid var(--border);border-radius:8px;font-size:14px;margin-top:4px;">'
      + '</div>';

    UI.showModal('Record Payment', html, {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-primary" onclick="Workflow._confirmMarkPaid(\'' + invoiceId + '\')">✅ Record Payment</button>'
    });
  },

  _confirmMarkPaid: function(invoiceId) {
    var amount = parseFloat(document.getElementById('mp-amount').value);
    var method = document.getElementById('mp-method-val').value || 'cash';
    var note = document.getElementById('mp-note') ? document.getElementById('mp-note').value : '';
    if (!amount || amount <= 0) { UI.toast('Enter a valid amount', 'error'); return; }

    var inv = DB.invoices.getById(invoiceId);
    if (!inv) return;

    var prevPaid = inv.amountPaid || 0;
    var newPaid = prevPaid + amount;
    var newBalance = Math.max(0, (inv.total || 0) - newPaid);
    var isFullyPaid = newBalance <= 0;

    DB.invoices.update(invoiceId, {
      status: isFullyPaid ? 'paid' : 'partial',
      balance: newBalance,
      amountPaid: newPaid,
      paidDate: isFullyPaid ? new Date().toISOString() : (inv.paidDate || null),
      paymentMethod: method
    });

    // Save to payment history log
    var pKey = 'bm-payments-' + invoiceId;
    var allPmts = [];
    try { allPmts = JSON.parse(localStorage.getItem(pKey)) || []; } catch(e) {}
    allPmts.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      invoiceId: invoiceId,
      amount: amount,
      method: method,
      note: note,
      date: new Date().toISOString(),
      user: 'Doug'
    });
    localStorage.setItem(pKey, JSON.stringify(allPmts));

    UI.toast('Payment recorded — ' + UI.money(amount) + ' via ' + method);
    UI.closeModal();
    if (typeof InvoicesPage !== 'undefined') InvoicesPage.showDetail(invoiceId);
  }
};

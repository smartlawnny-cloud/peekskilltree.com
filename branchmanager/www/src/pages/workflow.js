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

    DB.invoices.update(invoiceId, {
      status: 'paid',
      amountPaid: inv.total,
      balance: 0,
      paidDate: new Date().toISOString(),
      paymentMethod: method || 'cash'
    });

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
      html += '<button onclick="DB.jobs.update(\'' + jobId + '\',{status:\'active\',startedAt:new Date().toISOString()});UI.toast(\'Job started\');loadPage(\'jobs\');" style="background:#ff9800;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">▶ Start Job</button>';
    }
    if (job.status === 'active') {
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

    var subject = 'Your estimate from Second Nature Tree — Quote #' + (q.quoteNumber || '');
    var body = 'Hi ' + firstName + ',\n\n'
      + 'Thanks for having us out to take a look! Here\'s your estimate for the work we discussed.\n\n'
      + '📋 Quote #' + (q.quoteNumber || '') + '\n'
      + '📍 ' + (q.property || 'Your property') + '\n'
      + '💰 Total: ' + UI.money(q.total) + '\n\n'
      + (q.description ? '📝 ' + q.description + '\n\n' : '')
      + 'To approve this quote, just reply "approved" to this email or call (914) 391-5233.\n\n'
      + 'We can usually schedule within 1-2 weeks of approval.\n\n'
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

    var subject = 'Invoice #' + inv.invoiceNumber + ' from Second Nature Tree Service — ' + UI.money(inv.total);
    var body = 'Hi ' + firstName + ',\n\n'
      + 'Please find your invoice attached for the work completed at your property.\n\n'
      + '🧾 Invoice #' + inv.invoiceNumber + '\n'
      + '💰 Amount Due: ' + UI.money(inv.balance || inv.total) + '\n'
      + '📅 Due: ' + UI.dateShort(inv.dueDate) + '\n\n'
      + 'Payment Options:\n'
      + '• 💳 Credit Card — reply to this email and we\'ll send a secure payment link\n'
      + '• 📝 Check — payable to Second Nature Tree Service\n'
      + '• Venmo — @SecondNatureTree\n'
      + '• Zelle — info@peekskilltree.com\n\n'
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

    DB.invoices.update(invoiceId, { status: 'awaiting_payment', sentAt: new Date().toISOString(), sentTo: to });
    UI.closeModal();
    UI.toast('Invoice sent to ' + to);
  },

  _sendViaSupabase: function(to, subject, body, callback) {
    var url = 'https://ltpivkqahvplapyagljt.supabase.co/rest/v1/rpc/send_email';
    var key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cGl2a3FhaHZwbGFweWFnbGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTgxNzIsImV4cCI6MjA4OTY3NDE3Mn0.bQ-wAx4Uu-FyA2ZwsTVfFoU2ZPbeWCmupqV-6ZR9uFI';
    fetch(url, {
      method: 'POST',
      headers: { 'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_email: to, subject: subject, body: body })
    }).then(function(r) { return r.json(); })
      .then(function(d) { if (callback) callback(d && d.success); })
      .catch(function() { if (callback) callback(false); });
  }
};

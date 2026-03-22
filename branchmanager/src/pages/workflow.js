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
    if (!q || !q.clientEmail) { UI.toast('No email on file', 'error'); return; }
    DB.quotes.update(quoteId, { status: 'sent', sentAt: new Date().toISOString() });
    UI.toast('Quote sent to ' + q.clientEmail);
  },

  sendInvoice: function(invoiceId) {
    var inv = DB.invoices.getById(invoiceId);
    if (!inv || !inv.clientEmail) { UI.toast('No email on file', 'error'); return; }
    DB.invoices.update(invoiceId, { status: 'awaiting_payment', sentAt: new Date().toISOString() });
    UI.toast('Invoice sent to ' + inv.clientEmail);
  }
};

/**
 * Branch Manager — Email & SMS Templates
 * Pre-built templates for all automation triggers
 * Variables: {{name}}, {{company}}, {{phone}}, {{amount}}, {{date}}, {{jobNumber}}, {{quoteNumber}}, {{invoiceNumber}}, {{address}}
 */
var Templates = {
  // All templates
  library: {
    // ── Request Received ──
    request_received_email: {
      name: 'Request Received',
      trigger: 'New request submitted',
      channel: 'email',
      subject: 'We received your request — Second Nature Tree Service',
      body: 'Hi {{name}},\n\nThanks for reaching out to Second Nature Tree Service! We received your request for service at {{address}}.\n\nWe\'ll review your request and get back to you within 2 hours during business hours to schedule a free on-site estimate.\n\nIf you need immediate assistance, call us at (914) 391-5233.\n\nTalk soon,\nDoug Brown\nSecond Nature Tree Service\npeekskilltree.com'
    },
    request_received_sms: {
      name: 'Request Received',
      trigger: 'New request submitted',
      channel: 'sms',
      body: 'Hi {{name}}, thanks for your request! We got it and will be in touch within 2 hours to schedule your free estimate. — Doug, Second Nature Tree (914) 391-5233'
    },

    // ── Quote Sent ──
    quote_sent_email: {
      name: 'Quote Sent',
      trigger: 'Quote sent to client',
      channel: 'email',
      subject: 'Your estimate from Second Nature Tree — Quote #{{quoteNumber}}',
      body: 'Hi {{name}},\n\nThanks for having us out to take a look. Attached is your estimate for the work we discussed at {{address}}.\n\nQuote #{{quoteNumber}}\nTotal: {{amount}}\n\nTo approve this quote, just reply "approved" to this email or call (914) 391-5233. We can usually schedule within 1-2 weeks of approval.\n\nLet me know if you have any questions!\n\nDoug Brown\nSecond Nature Tree Service'
    },
    quote_sent_sms: {
      name: 'Quote Sent',
      trigger: 'Quote sent to client',
      channel: 'sms',
      body: 'Hi {{name}}, your estimate (#{{quoteNumber}}) for {{amount}} is ready! Reply YES to approve or call (914) 391-5233 with questions. — Doug, Second Nature Tree'
    },

    // ── Quote Follow-Up (5 days) ──
    quote_followup_5d_email: {
      name: 'Quote Follow-Up (5 days)',
      trigger: '5 days after quote sent, no response',
      channel: 'email',
      subject: 'Following up on your estimate — Quote #{{quoteNumber}}',
      body: 'Hi {{name}},\n\nJust checking in on the estimate I sent over last week for the work at {{address}} (Quote #{{quoteNumber}} — {{amount}}).\n\nDo you have any questions, or would you like to move forward? Happy to adjust the scope if needed.\n\nLet me know!\n\nDoug Brown\n(914) 391-5233'
    },

    // ── Quote Follow-Up (10 days) ──
    quote_followup_10d_email: {
      name: 'Quote Follow-Up (10 days)',
      trigger: '10 days after quote sent, no response',
      channel: 'email',
      subject: 'Still interested? — Quote #{{quoteNumber}}',
      body: 'Hi {{name}},\n\nI wanted to follow up one more time on the estimate for {{address}}. The quote (#{{quoteNumber}} — {{amount}}) is still valid if you\'d like to proceed.\n\nIf the timing isn\'t right or you went another direction, no worries at all — just let me know so I can close out the file.\n\nThanks,\nDoug Brown\nSecond Nature Tree Service\n(914) 391-5233'
    },

    // ── Booking Confirmation ──
    booking_confirm_email: {
      name: 'Booking Confirmation',
      trigger: 'Job scheduled',
      channel: 'email',
      subject: 'Your tree service is scheduled — {{date}}',
      body: 'Hi {{name}},\n\nGreat news — your tree service is confirmed!\n\nJob #{{jobNumber}}\nDate: {{date}}\nLocation: {{address}}\n\nOur crew will arrive between 8-9am. Please make sure we have access to the work area. We\'ll give you a call when we\'re on our way.\n\nIf you need to reschedule, just reply to this email or call (914) 391-5233.\n\nSee you then!\nDoug Brown\nSecond Nature Tree Service'
    },
    booking_confirm_sms: {
      name: 'Booking Confirmation',
      trigger: 'Job scheduled',
      channel: 'sms',
      body: 'Hi {{name}}, your tree service (Job #{{jobNumber}}) is confirmed for {{date}} at {{address}}. Crew arrives 8-9am. Call (914) 391-5233 to reschedule. — Second Nature Tree'
    },

    // ── Visit Reminder (1 day before) ──
    visit_reminder_email: {
      name: 'Visit Reminder (1 day)',
      trigger: '1 day before scheduled visit',
      channel: 'email',
      subject: 'Reminder: Tree service tomorrow — {{date}}',
      body: 'Hi {{name}},\n\nJust a reminder that our crew is scheduled to be at {{address}} tomorrow.\n\nJob #{{jobNumber}}\nDate: {{date}}\nArrival: 8-9am\n\nPlease make sure we have clear access to the work area. Move any vehicles, patio furniture, or items near the trees we\'ll be working on.\n\nWe\'ll text you when we\'re on the way!\n\nDoug Brown\nSecond Nature Tree Service'
    },
    visit_reminder_sms: {
      name: 'Visit Reminder (1 hr)',
      trigger: '1 hour before scheduled visit',
      channel: 'sms',
      body: 'Hi {{name}}, reminder: our crew is headed to {{address}} shortly for your tree service (Job #{{jobNumber}}). See you soon! — Second Nature Tree'
    },

    // ── Invoice Sent ──
    invoice_sent_email: {
      name: 'Invoice Sent',
      trigger: 'Invoice sent to client',
      channel: 'email',
      subject: 'Invoice #{{invoiceNumber}} from Second Nature Tree — {{amount}}',
      body: 'Hi {{name}},\n\nThanks for choosing Second Nature Tree Service! Attached is your invoice for the completed work.\n\nInvoice #{{invoiceNumber}}\nAmount: {{amount}}\nDue: {{date}}\n\nPayment methods:\n• Check: Payable to "Second Nature Tree Service"\n• Venmo: @SecondNatureTree\n• Zelle: info@peekskilltree.com\n• Card: [Payment link included when Stripe is connected]\n\nThank you for your business!\n\nDoug Brown\nSecond Nature Tree Service\n(914) 391-5233'
    },

    // ── Invoice Follow-Up (1 day overdue) ──
    invoice_followup_1d_email: {
      name: 'Invoice Follow-Up (1 day)',
      trigger: '1 day after invoice due date',
      channel: 'email',
      subject: 'Payment reminder — Invoice #{{invoiceNumber}}',
      body: 'Hi {{name}},\n\nJust a friendly reminder that invoice #{{invoiceNumber}} for {{amount}} was due yesterday. If you\'ve already sent payment, please disregard this message.\n\nIf you have any questions about the invoice, feel free to reach out.\n\nThanks,\nDoug Brown\n(914) 391-5233'
    },

    // ── Invoice Follow-Up (4 days overdue) ──
    invoice_followup_4d_email: {
      name: 'Invoice Follow-Up (4 days)',
      trigger: '4 days after invoice due date',
      channel: 'email',
      subject: 'Past due: Invoice #{{invoiceNumber}} — {{amount}}',
      body: 'Hi {{name}},\n\nI\'m following up on invoice #{{invoiceNumber}} for {{amount}}, which is now 4 days past due.\n\nCould you let me know when we can expect payment? If there\'s an issue with the invoice, I\'m happy to discuss.\n\nPayment can be sent via check, Venmo, Zelle, or card.\n\nThank you,\nDoug Brown\nSecond Nature Tree Service\n(914) 391-5233'
    },

    // ── Review Request ──
    review_request_email: {
      name: 'Review Request',
      trigger: '2 days after job completed',
      channel: 'email',
      subject: 'How did we do? — Second Nature Tree Service',
      body: 'Hi {{name}},\n\nThanks again for choosing Second Nature Tree Service for your recent tree work at {{address}}.\n\nWe\'d love to hear how we did! A quick Google review helps us reach more homeowners in the area:\n\nhttps://g.page/r/CcVkZHV_EKlEEBM/review\n\nIt only takes 30 seconds and means a lot to our small business.\n\nThank you!\nDoug Brown\nSecond Nature Tree Service'
    },
    review_request_sms: {
      name: 'Review Request',
      trigger: '2 days after job completed',
      channel: 'sms',
      body: 'Hi {{name}}, thanks for choosing Second Nature Tree! If you were happy with our work, we\'d love a quick Google review: https://g.page/r/CcVkZHV_EKlEEBM/review — Thank you! Doug'
    }
  },

  // Fill template variables
  fill: function(template, data) {
    var text = template;
    var vars = {
      '{{name}}': data.name || data.clientName || '',
      '{{company}}': data.company || '',
      '{{phone}}': data.phone || data.clientPhone || '',
      '{{email}}': data.email || data.clientEmail || '',
      '{{amount}}': data.amount || data.total ? UI.money(data.amount || data.total) : '',
      '{{date}}': data.date ? UI.dateShort(data.date) : '',
      '{{address}}': data.address || data.property || '',
      '{{jobNumber}}': data.jobNumber || '',
      '{{quoteNumber}}': data.quoteNumber || '',
      '{{invoiceNumber}}': data.invoiceNumber || ''
    };
    Object.keys(vars).forEach(function(key) {
      text = text.split(key).join(vars[key]);
    });
    return text;
  },

  // Get templates by trigger
  getByTrigger: function(trigger) {
    return Object.values(Templates.library).filter(function(t) {
      return t.trigger.toLowerCase().includes(trigger.toLowerCase());
    });
  },

  // Render template editor
  renderEditor: function(templateKey) {
    var t = Templates.library[templateKey];
    if (!t) return '';

    // Check for custom override
    var custom = localStorage.getItem('bm-template-' + templateKey);
    var currentBody = custom || t.body;
    var currentSubject = t.subject ? (localStorage.getItem('bm-template-subj-' + templateKey) || t.subject) : null;

    var html = '<div style="background:var(--white);border-radius:10px;padding:16px;border:1px solid var(--border);margin-bottom:12px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
      + '<div><strong style="font-size:14px;">' + t.name + '</strong>'
      + '<span style="font-size:11px;padding:2px 8px;background:' + (t.channel === 'sms' ? '#e3f2fd' : '#f3e5f5') + ';border-radius:4px;margin-left:6px;">' + t.channel.toUpperCase() + '</span></div>'
      + '<span style="font-size:11px;color:var(--text-light);">' + t.trigger + '</span></div>';

    if (currentSubject) {
      html += '<input type="text" id="tpl-subj-' + templateKey + '" value="' + currentSubject.replace(/"/g, '&quot;') + '" style="width:100%;padding:8px;border:2px solid var(--border);border-radius:6px;font-size:13px;margin-bottom:6px;" placeholder="Subject">';
    }
    html += '<textarea id="tpl-body-' + templateKey + '" rows="4" style="width:100%;padding:8px;border:2px solid var(--border);border-radius:6px;font-size:13px;font-family:inherit;resize:vertical;">' + currentBody + '</textarea>'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">'
      + '<span style="font-size:10px;color:var(--text-light);">Variables: {{name}} {{address}} {{amount}} {{date}} {{jobNumber}} {{quoteNumber}} {{invoiceNumber}}</span>'
      + '<div style="display:flex;gap:4px;">'
      + (custom ? '<button onclick="Templates.resetTemplate(\'' + templateKey + '\')" style="background:#fff3e0;border:1px solid #ffe0b2;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;">Reset</button>' : '')
      + '<button onclick="Templates.saveTemplate(\'' + templateKey + '\')" style="background:var(--green-dark);color:#fff;border:none;border-radius:4px;padding:4px 10px;font-size:11px;cursor:pointer;font-weight:600;">Save</button>'
      + '</div></div></div>';
    return html;
  },

  saveTemplate: function(key) {
    var bodyEl = document.getElementById('tpl-body-' + key);
    var subjEl = document.getElementById('tpl-subj-' + key);
    if (bodyEl) localStorage.setItem('bm-template-' + key, bodyEl.value);
    if (subjEl) localStorage.setItem('bm-template-subj-' + key, subjEl.value);
    UI.toast('Template saved');
  },

  resetTemplate: function(key) {
    localStorage.removeItem('bm-template-' + key);
    localStorage.removeItem('bm-template-subj-' + key);
    UI.toast('Reset to default');
    loadPage('automations');
  }
};

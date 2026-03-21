/**
 * Branch Manager — PDF Generation
 * Creates professional quote and invoice PDFs using browser print
 * No external libraries needed — generates HTML, opens print dialog
 */
var PDF = {
  _style: function() {
    return '<style>'
      + '* { margin:0; padding:0; box-sizing:border-box; }'
      + 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1d1d1f; padding: 40px; }'
      + '.header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px; padding-bottom:20px; border-bottom:3px solid #1a3c12; }'
      + '.company h1 { font-size:22px; color:#1a3c12; } .company p { font-size:12px; color:#666; margin-top:2px; }'
      + '.doc-info { text-align:right; } .doc-info h2 { font-size:28px; color:#1a3c12; } .doc-info p { font-size:13px; color:#666; }'
      + '.client-box { background:#f5f5f5; border-radius:8px; padding:16px; margin-bottom:24px; }'
      + '.client-box h3 { font-size:14px; color:#888; text-transform:uppercase; letter-spacing:.05em; margin-bottom:8px; }'
      + '.client-box p { font-size:14px; margin:2px 0; }'
      + 'table { width:100%; border-collapse:collapse; margin-bottom:24px; }'
      + 'th { background:#1a3c12; color:#fff; padding:10px 14px; text-align:left; font-size:12px; font-weight:700; text-transform:uppercase; }'
      + 'td { padding:10px 14px; border-bottom:1px solid #e0e0e0; font-size:14px; }'
      + 'tr:nth-child(even) { background:#f9f9f9; }'
      + '.total-row td { font-weight:700; font-size:16px; border-top:2px solid #1a3c12; background:#f0f8e8; }'
      + '.total-big { font-size:24px; color:#1a3c12; font-weight:800; }'
      + '.notes { background:#f5f5f5; border-radius:8px; padding:16px; margin-bottom:24px; font-size:13px; color:#555; }'
      + '.notes h4 { font-size:13px; color:#1d1d1f; margin-bottom:6px; }'
      + '.footer { margin-top:40px; padding-top:16px; border-top:1px solid #e0e0e0; text-align:center; font-size:11px; color:#999; }'
      + '.badge { display:inline-block; padding:4px 12px; border-radius:12px; font-size:11px; font-weight:700; }'
      + '.badge-draft { background:#f5f5f5; color:#666; } .badge-sent { background:#fff3e0; color:#e65100; }'
      + '.badge-paid { background:#e8f5e9; color:#2e7d32; } .badge-approved { background:#e8f5e9; color:#2e7d32; }'
      + '@media print { body { padding:20px; } }'
      + '</style>';
  },

  _companyHeader: function() {
    return '<div class="company">'
      + '<h1>🌳 Second Nature Tree Service</h1>'
      + '<p>1 Highland Industrial Park, Peekskill, NY 10566</p>'
      + '<p>(914) 391-5233 &bull; info@peekskilltree.com</p>'
      + '<p>Licensed &amp; Insured — WC-32079 / PC-50644</p>'
      + '</div>';
  },

  _footer: function() {
    return '<div class="footer">'
      + 'Second Nature Tree Service &bull; peekskilltree.com &bull; (914) 391-5233<br>'
      + 'Licensed &amp; Fully Insured — Westchester &amp; Putnam Counties'
      + '</div>';
  },

  generateQuote: function(quoteId) {
    var q = DB.quotes.getById(quoteId);
    if (!q) { UI.toast('Quote not found', 'error'); return; }
    var client = q.clientId ? DB.clients.getById(q.clientId) : null;

    var html = '<!DOCTYPE html><html><head><title>Quote #' + q.quoteNumber + '</title>' + PDF._style() + '</head><body>';
    html += '<div class="header">' + PDF._companyHeader()
      + '<div class="doc-info"><h2>QUOTE</h2><p>#' + q.quoteNumber + '</p><p>' + UI.dateShort((q.createdAt || '').split('T')[0]) + '</p>'
      + '<p><span class="badge badge-' + q.status + '">' + (q.status || 'draft').toUpperCase() + '</span></p></div></div>';

    // Client
    html += '<div class="client-box"><h3>Prepared For</h3>';
    if (client) {
      html += '<p><strong>' + client.name + '</strong></p>';
      if (client.address) html += '<p>' + client.address + '</p>';
      if (client.phone) html += '<p>' + UI.phone(client.phone) + '</p>';
      if (client.email) html += '<p>' + client.email + '</p>';
    } else {
      html += '<p><strong>' + (q.clientName || '') + '</strong></p>';
    }
    if (q.property) html += '<p style="margin-top:8px;"><strong>Property:</strong> ' + q.property + '</p>';
    html += '</div>';

    if (q.description) html += '<p style="margin-bottom:16px;font-size:15px;"><strong>Scope:</strong> ' + q.description + '</p>';

    // Line items
    if (q.lineItems && q.lineItems.length) {
      html += '<table><thead><tr><th>Service</th><th>Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amount</th></tr></thead><tbody>';
      q.lineItems.forEach(function(item) {
        html += '<tr><td>' + (item.service || 'Custom') + '</td><td>' + (item.description || '') + '</td><td style="text-align:center;">' + (item.qty || 1) + '</td><td style="text-align:right;">' + UI.money(item.rate) + '</td><td style="text-align:right;">' + UI.money(item.amount || item.qty * item.rate) + '</td></tr>';
      });
      html += '<tr class="total-row"><td colspan="4" style="text-align:right;">TOTAL</td><td style="text-align:right;" class="total-big">' + UI.money(q.total) + '</td></tr>';
      html += '</tbody></table>';
    }

    // Terms
    html += '<div class="notes"><h4>Terms &amp; Conditions</h4>'
      + '<p>This quote is valid for 30 days from the date above. Payment is due upon completion unless otherwise arranged. '
      + 'All work is performed by licensed and insured professionals. '
      + 'Client is responsible for ensuring access to the property and identifying any underground utilities.</p></div>';

    html += PDF._footer() + '</body></html>';
    PDF._openPrint(html);
  },

  generateInvoice: function(invoiceId) {
    var inv = DB.invoices.getById(invoiceId);
    if (!inv) { UI.toast('Invoice not found', 'error'); return; }
    var client = inv.clientId ? DB.clients.getById(inv.clientId) : null;

    var html = '<!DOCTYPE html><html><head><title>Invoice #' + inv.invoiceNumber + '</title>' + PDF._style() + '</head><body>';
    html += '<div class="header">' + PDF._companyHeader()
      + '<div class="doc-info"><h2>INVOICE</h2><p>#' + inv.invoiceNumber + '</p><p>Due: ' + UI.dateShort(inv.dueDate) + '</p>'
      + '<p><span class="badge badge-' + inv.status + '">' + (inv.status || 'draft').toUpperCase() + '</span></p></div></div>';

    // Client
    html += '<div class="client-box"><h3>Bill To</h3>';
    if (client) {
      html += '<p><strong>' + client.name + '</strong></p>';
      if (client.address) html += '<p>' + client.address + '</p>';
      if (client.phone) html += '<p>' + UI.phone(client.phone) + '</p>';
      if (client.email) html += '<p>' + client.email + '</p>';
    } else {
      html += '<p><strong>' + (inv.clientName || '') + '</strong></p>';
    }
    html += '</div>';

    // Line items
    if (inv.lineItems && inv.lineItems.length) {
      html += '<table><thead><tr><th>Service</th><th>Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amount</th></tr></thead><tbody>';
      inv.lineItems.forEach(function(item) {
        html += '<tr><td>' + (item.service || 'Custom') + '</td><td>' + (item.description || '') + '</td><td style="text-align:center;">' + (item.qty || 1) + '</td><td style="text-align:right;">' + UI.money(item.rate) + '</td><td style="text-align:right;">' + UI.money(item.amount || item.qty * item.rate) + '</td></tr>';
      });
      html += '<tr class="total-row"><td colspan="4" style="text-align:right;">TOTAL</td><td style="text-align:right;" class="total-big">' + UI.money(inv.total) + '</td></tr>';
      if (inv.balance > 0 && inv.balance !== inv.total) {
        html += '<tr><td colspan="4" style="text-align:right;font-weight:600;color:#c0392b;">BALANCE DUE</td><td style="text-align:right;font-weight:800;font-size:20px;color:#c0392b;">' + UI.money(inv.balance) + '</td></tr>';
      }
      html += '</tbody></table>';
    } else {
      html += '<table><thead><tr><th>Description</th><th style="text-align:right;">Amount</th></tr></thead><tbody>';
      html += '<tr><td>' + (inv.subject || 'For Services Rendered') + '</td><td style="text-align:right;" class="total-big">' + UI.money(inv.total) + '</td></tr>';
      html += '</tbody></table>';
    }

    // Payment info
    html += '<div class="notes"><h4>Payment Information</h4>'
      + '<p>Payment is due by ' + UI.dateShort(inv.dueDate) + '. '
      + 'Please make checks payable to Second Nature Tree Service. '
      + 'For questions about this invoice, call (914) 391-5233 or email info@peekskilltree.com.</p></div>';

    html += PDF._footer() + '</body></html>';
    PDF._openPrint(html);
  },

  _openPrint: function(html) {
    var w = window.open('', '_blank', 'width=800,height=1000');
    w.document.write(html);
    w.document.close();
    setTimeout(function() { w.print(); }, 500);
  }
};

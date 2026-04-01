/**
 * Branch Manager — Online Booking / Request Form
 * Embeddable form for peekskilltree.com that creates requests in Branch Manager
 * Also generates a standalone booking page at /branchmanager/book
 */
var OnlineBooking = {
  render: function() {
    var html = '<div class="section-header"><h2>Online Booking</h2>'
      + '<p style="color:var(--text-light);margin-top:4px;">Let clients submit requests directly from your website.</p></div>';

    // Embed code
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="font-size:15px;margin-bottom:8px;">Embed on Your Website</h3>'
      + '<p style="font-size:13px;color:var(--text-light);margin-bottom:12px;">Add this code to any page on peekskilltree.com to show the booking form:</p>'
      + '<div style="background:#1d1d1f;border-radius:8px;padding:16px;overflow-x:auto;">'
      + '<code style="color:#4caf50;font-size:12px;white-space:pre;">&lt;iframe src="https://peekskilltree.com/branchmanager/book.html"\n  width="100%" height="600" frameborder="0"\n  style="border-radius:12px;border:1px solid #e0e0e0;"&gt;\n&lt;/iframe&gt;</code>'
      + '</div>'
      + '<button onclick="navigator.clipboard.writeText(\'<iframe src=\\\"https://peekskilltree.com/branchmanager/book.html\\\" width=\\\"100%\\\" height=\\\"600\\\" frameborder=\\\"0\\\" style=\\\"border-radius:12px;border:1px solid #e0e0e0;\\\"></iframe>\');UI.toast(\'Copied!\')" style="background:var(--green-dark);color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:12px;margin-top:8px;">📋 Copy Code</button>'
      + '</div>';

    // Direct link
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="font-size:15px;margin-bottom:8px;">Direct Booking Link</h3>'
      + '<p style="font-size:13px;color:var(--text-light);margin-bottom:8px;">Share this link with clients via text, email, or social media:</p>'
      + '<div style="display:flex;gap:8px;align-items:center;">'
      + '<input type="text" value="https://peekskilltree.com/branchmanager/book.html" readonly style="flex:1;padding:10px;border:2px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg);">'
      + '<button onclick="navigator.clipboard.writeText(\'https://peekskilltree.com/branchmanager/book.html\');UI.toast(\'Link copied!\')" style="background:var(--green-dark);color:#fff;border:none;padding:10px 16px;border-radius:8px;font-weight:600;cursor:pointer;">Copy</button>'
      + '</div></div>';

    // Form settings
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="font-size:15px;margin-bottom:12px;">Form Settings</h3>'
      + '<div style="display:grid;gap:8px;">';

    var services = [
      'Tree Removal', 'Tree Pruning', 'Stump Removal', 'Storm Damage',
      'Land Clearing', 'Bucket Truck Work', 'Cabling & Bracing',
      'Tree Health Assessment', 'Firewood', 'Other'
    ];
    html += '<div><label style="font-size:12px;color:var(--text-light);display:block;margin-bottom:4px;">Services shown on form</label>'
      + '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
    services.forEach(function(s) {
      var checked = (localStorage.getItem('bm-booking-services') || services.join(',')).includes(s);
      html += '<label style="display:flex;align-items:center;gap:4px;font-size:13px;padding:4px 8px;background:' + (checked ? '#e8f5e9' : 'var(--bg)') + ';border-radius:6px;cursor:pointer;">'
        + '<input type="checkbox" ' + (checked ? 'checked' : '') + ' onchange="OnlineBooking.toggleService(\'' + s + '\')" style="width:14px;height:14px;">'
        + s + '</label>';
    });
    html += '</div></div>';

    html += '<div><label style="font-size:12px;color:var(--text-light);display:block;margin-bottom:4px;">Auto-reply message</label>'
      + '<textarea id="booking-autoreply" rows="3" style="width:100%;padding:10px;border:2px solid var(--border);border-radius:8px;font-size:14px;font-family:inherit;">'
      + (localStorage.getItem('bm-booking-autoreply') || 'Thanks for your request! We\'ll review it and get back to you within 2 hours during business hours. — Doug, Second Nature Tree Service')
      + '</textarea>'
      + '<button onclick="localStorage.setItem(\'bm-booking-autoreply\',document.getElementById(\'booking-autoreply\').value);UI.toast(\'Saved!\')" style="background:var(--green-dark);color:#fff;border:none;padding:6px 14px;border-radius:6px;font-weight:600;cursor:pointer;font-size:12px;margin-top:4px;">Save</button>'
      + '</div></div></div>';

    // Preview
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);">'
      + '<h3 style="font-size:15px;margin-bottom:12px;">Form Preview</h3>'
      + '<div style="border:2px solid var(--border);border-radius:12px;padding:24px;max-width:500px;margin:0 auto;">'
      + OnlineBooking._renderForm()
      + '</div></div>';

    return html;
  },

  _renderForm: function() {
    return '<div style="text-align:center;margin-bottom:20px;">'
      + '<div style="font-size:24px;">🌳</div>'
      + '<h3 style="font-size:18px;color:#1a3c12;">Request a Free Estimate</h3>'
      + '<p style="font-size:13px;color:#666;">Second Nature Tree Service — Peekskill, NY</p></div>'
      + '<div style="display:grid;gap:10px;">'
      + '<input type="text" placeholder="Your Name *" style="padding:12px;border:2px solid #e0e0e0;border-radius:8px;font-size:15px;">'
      + '<input type="tel" placeholder="Phone Number *" style="padding:12px;border:2px solid #e0e0e0;border-radius:8px;font-size:15px;">'
      + '<input type="email" placeholder="Email" style="padding:12px;border:2px solid #e0e0e0;border-radius:8px;font-size:15px;">'
      + '<input type="text" placeholder="Property Address *" style="padding:12px;border:2px solid #e0e0e0;border-radius:8px;font-size:15px;">'
      + '<select style="padding:12px;border:2px solid #e0e0e0;border-radius:8px;font-size:15px;color:#666;">'
      + '<option>Select Service Needed...</option>'
      + '<option>Tree Removal</option><option>Tree Pruning</option><option>Stump Removal</option>'
      + '<option>Storm Damage</option><option>Land Clearing</option><option>Other</option></select>'
      + '<textarea placeholder="Describe the work needed..." rows="3" style="padding:12px;border:2px solid #e0e0e0;border-radius:8px;font-size:15px;font-family:inherit;resize:vertical;"></textarea>'
      + '<button style="background:#1a3c12;color:#fff;border:none;padding:14px;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;">Submit Request</button>'
      + '<p style="font-size:11px;color:#999;text-align:center;">We typically respond within 2 hours during business hours.</p>'
      + '</div>';
  },

  toggleService: function(service) {
    var current = (localStorage.getItem('bm-booking-services') || '').split(',');
    var idx = current.indexOf(service);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(service);
    localStorage.setItem('bm-booking-services', current.filter(Boolean).join(','));
  }
};

/**
 * Branch Manager — Review Tools
 * Google review link, QR codes, review tracking, follow-up
 */
var ReviewTools = {
  GOOGLE_REVIEW_URL: 'https://g.page/r/CcVkZHV_EKlEEBM/review',

  render: function() {
    var html = '<div class="section-header"><h2>⭐ Review Tools</h2></div>';

    // Stats
    html += '<div class="stat-grid">'
      + UI.statCard('Google Rating', '5.0 ★', '100+ reviews', 'up', '')
      + UI.statCard('Review Link', 'Copy & Share', 'Tap to copy', '', '', 'ReviewTools.copyLink()')
      + UI.statCard('QR Code', 'Download', 'Print for trucks/cards', '', '', 'ReviewTools.downloadQR()')
      + '</div>';

    // QR Code display
    html += '<div style="background:var(--white);border-radius:12px;padding:24px;border:1px solid var(--border);margin-bottom:16px;text-align:center;">'
      + '<h3 style="font-size:16px;margin-bottom:16px;">Google Review QR Code</h3>'
      + '<div id="review-qr" style="display:inline-block;padding:16px;background:#fff;border-radius:12px;border:1px solid var(--border);">'
      + '<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(ReviewTools.GOOGLE_REVIEW_URL) + '" alt="Review QR Code" style="width:200px;height:200px;">'
      + '</div>'
      + '<div style="margin-top:12px;font-size:14px;font-weight:600;color:var(--green-dark);">Scan to leave a Google review</div>'
      + '<p style="font-size:12px;color:var(--text-light);margin-top:4px;">Print this QR code on business cards, truck magnets, invoices, and leave-behind cards.</p>'
      + '<div style="display:flex;gap:8px;justify-content:center;margin-top:16px;">'
      + '<button onclick="ReviewTools.downloadQR()" style="background:var(--green-dark);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;">📥 Download QR</button>'
      + '<button onclick="ReviewTools.copyLink()" style="background:#1565c0;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;">🔗 Copy Link</button>'
      + '<button onclick="ReviewTools.printCard()" style="background:#6a1b9a;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;">🖨 Print Card</button>'
      + '</div></div>';

    // Review request sender
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="font-size:16px;margin-bottom:12px;">Send Review Request</h3>'
      + '<p style="font-size:13px;color:var(--text-light);margin-bottom:12px;">Send a review request to a recent client via text or email.</p>';

    // Recent completed jobs
    var completed = DB.jobs.getAll().filter(function(j) { return j.status === 'completed'; }).slice(0, 10);
    if (completed.length) {
      completed.forEach(function(j) {
        var sent = localStorage.getItem('bm-review-sent-' + j.id);
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;">'
          + '<div><strong style="font-size:14px;">' + j.clientName + '</strong>'
          + '<div style="font-size:12px;color:var(--text-light);">' + (j.description || '') + ' · ' + UI.dateShort(j.completedDate || j.createdAt) + '</div></div>'
          + '<div>' + (sent ? '<span style="font-size:12px;color:var(--green-dark);">✅ Sent</span>'
            : '<button onclick="ReviewTools.sendRequest(\'' + j.id + '\')" style="background:var(--green-dark);color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">Send Request</button>')
          + '</div></div>';
      });
    } else {
      html += '<div style="text-align:center;padding:16px;color:var(--text-light);font-size:13px;">No completed jobs yet.</div>';
    }
    html += '</div>';

    // Shareable links
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);">'
      + '<h3 style="font-size:16px;margin-bottom:12px;">Review Links</h3>'
      + '<div style="display:grid;gap:8px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--bg);border-radius:8px;">'
      + '<div><strong style="font-size:13px;">Google</strong><div style="font-size:11px;color:var(--text-light);">Primary — most important</div></div>'
      + '<button onclick="navigator.clipboard.writeText(\'' + ReviewTools.GOOGLE_REVIEW_URL + '\');UI.toast(\'Copied!\')" style="background:var(--green-dark);color:#fff;border:none;padding:6px 12px;border-radius:6px;font-size:12px;cursor:pointer;">Copy</button></div>'
      + '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--bg);border-radius:8px;">'
      + '<div><strong style="font-size:13px;">Yelp</strong><div style="font-size:11px;color:var(--text-light);">yelp.com/biz/second-nature-tree-peekskill</div></div>'
      + '<button onclick="navigator.clipboard.writeText(\'https://www.yelp.com/biz/second-nature-tree-peekskill\');UI.toast(\'Copied!\')" style="background:var(--green-dark);color:#fff;border:none;padding:6px 12px;border-radius:6px;font-size:12px;cursor:pointer;">Copy</button></div>'
      + '</div></div>';

    return html;
  },

  copyLink: function() {
    navigator.clipboard.writeText(ReviewTools.GOOGLE_REVIEW_URL);
    UI.toast('Google review link copied! 🔗');
  },

  downloadQR: function() {
    var url = 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=' + encodeURIComponent(ReviewTools.GOOGLE_REVIEW_URL);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'second-nature-google-review-qr.png';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    UI.toast('QR code downloading...');
  },

  printCard: function() {
    var html = '<!DOCTYPE html><html><head><title>Review Card</title><style>'
      + 'body{font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff;}'
      + '.card{width:3.5in;padding:24px;text-align:center;border:2px solid #1a3c12;border-radius:12px;}'
      + '</style></head><body><div class="card">'
      + '<div style="font-size:28px;">🌳</div>'
      + '<h2 style="color:#1a3c12;font-size:16px;margin:8px 0 4px;">Second Nature Tree Service</h2>'
      + '<p style="font-size:11px;color:#666;margin:0 0 16px;">Licensed & Insured — Peekskill, NY</p>'
      + '<p style="font-size:13px;font-weight:600;margin:0 0 12px;">Enjoyed our work? We\'d love a review!</p>'
      + '<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(ReviewTools.GOOGLE_REVIEW_URL) + '" style="width:150px;height:150px;">'
      + '<p style="font-size:10px;color:#666;margin:8px 0 0;">Scan to leave a Google review</p>'
      + '<p style="font-size:10px;color:#999;margin:4px 0 0;">(914) 391-5233 · peekskilltree.com</p>'
      + '</div></body></html>';
    var w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    setTimeout(function() { w.print(); }, 500);
  },

  sendRequest: function(jobId) {
    var job = DB.jobs.getById(jobId);
    if (!job) return;

    // Try email template
    if (typeof Email !== 'undefined' && typeof Templates !== 'undefined') {
      Email.sendTemplate('review_request_email', {
        name: job.clientName,
        address: job.property || '',
        email: job.clientEmail || '',
        id: job.clientId
      });
    }

    // Mark as sent
    localStorage.setItem('bm-review-sent-' + jobId, new Date().toISOString());
    UI.toast('Review request sent to ' + job.clientName);
    loadPage('reviews');
  }
};

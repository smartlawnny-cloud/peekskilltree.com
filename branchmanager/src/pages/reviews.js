/**
 * Branch Manager — Reviews Page v2
 * Review request management, request history, metrics, manual logging, Google review link
 */
var ReviewsPage = {
  GOOGLE_REVIEW_URL: 'https://g.page/r/CcVkZHV_EKlEEBM/review',

  // --- LocalStorage helpers ---
  getRequests: function() {
    return JSON.parse(localStorage.getItem('bm-review-requests') || '[]');
  },
  saveRequests: function(arr) {
    localStorage.setItem('bm-review-requests', JSON.stringify(arr));
  },
  getLoggedReviews: function() {
    return JSON.parse(localStorage.getItem('bm-logged-reviews') || '[]');
  },
  saveLoggedReviews: function(arr) {
    localStorage.setItem('bm-logged-reviews', JSON.stringify(arr));
  },

  // --- Render ---
  render: function() {
    var completedJobs = DB.jobs.getAll().filter(function(j) { return j.status === 'completed'; });
    var requests = ReviewsPage.getRequests();
    var loggedReviews = ReviewsPage.getLoggedReviews();

    // --- Metrics dashboard ---
    var html = '<div class="stat-grid">'
      + UI.statCard('Google Rating', '5.0 ★', '100 reviews', 'up', '')
      + UI.statCard('Avg Response', '2 hrs', 'Response time', 'up', '')
      + UI.statCard('Completed Jobs', completedJobs.length.toString(), 'Eligible for review request', '', '')
      + UI.statCard('Requests Sent', requests.length.toString(), 'Review requests logged', requests.length > 0 ? 'up' : '', '')
      + '</div>';

    // --- Auto-request settings ---
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="margin-bottom:12px;">Automatic Review Requests</h3>'
      + '<p style="font-size:13px;color:var(--text-light);margin-bottom:16px;">When a job is marked "completed", Branch Manager will automatically send a review request email to the client after a configurable delay.</p>'
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">'
      + '<label style="font-weight:600;font-size:14px;">Send review request</label>'
      + '<select id="review-delay" style="padding:8px 12px;border:2px solid var(--border);border-radius:8px;font-size:14px;">'
      + '<option value="1">1 day after completion</option>'
      + '<option value="2">2 days after completion</option>'
      + '<option value="3" selected>3 days after completion</option>'
      + '<option value="7">1 week after completion</option>'
      + '</select>'
      + '</div>'
      + '<div style="background:var(--bg);border-radius:8px;padding:16px;">'
      + '<h4 style="font-size:13px;margin-bottom:8px;">Preview Email</h4>'
      + '<div style="font-size:13px;color:var(--text-light);line-height:1.8;">'
      + '<strong>Subject:</strong> How did we do? — Second Nature Tree Service<br>'
      + '<strong>Body:</strong> Hi {client_name},<br><br>'
      + 'Thanks for choosing Second Nature Tree Service! We hope you\'re happy with the work. '
      + 'If you have a moment, we\'d really appreciate a Google review — it helps us grow and lets other homeowners know what to expect.<br><br>'
      + '<a href="#" style="display:inline-block;padding:10px 24px;background:#1a3c12;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">Leave a Review on Google ★</a><br><br>'
      + 'Thank you!<br>Doug Brown<br>Second Nature Tree Service'
      + '</div></div></div>';

    // --- Manual review request ---
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="margin-bottom:12px;">Send Manual Review Request</h3>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;">';

    var sentJobIds = requests.map(function(r) { return r.jobId; });
    var recentCompleted = completedJobs.slice(0, 10);
    if (recentCompleted.length) {
      recentCompleted.forEach(function(j) {
        var alreadySent = sentJobIds.indexOf(j.id) !== -1;
        html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:var(--bg);border-radius:8px;margin-bottom:6px;width:100%;">'
          + '<div>'
          + '<strong>' + j.clientName + '</strong>'
          + '<span style="font-size:12px;color:var(--text-light);margin-left:8px;">#' + j.jobNumber + ' — ' + (j.description || '') + '</span>'
          + (alreadySent ? '<span style="font-size:11px;color:var(--green-dark);margin-left:8px;background:#e8f5e9;padding:2px 6px;border-radius:4px;">Sent</span>' : '')
          + '</div>'
          + '<button class="btn ' + (alreadySent ? 'btn-secondary' : 'btn-primary') + '" style="font-size:12px;padding:6px 12px;" onclick="ReviewsPage.sendRequest(\'' + j.id + '\')">'
          + (alreadySent ? 'Resend' : 'Send Request') + '</button>'
          + '</div>';
      });
    } else {
      html += '<div style="text-align:center;color:var(--text-light);padding:20px;width:100%;">No completed jobs yet. Complete a job to send review requests.</div>';
    }
    html += '</div></div>';

    // --- Request History ---
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="margin-bottom:12px;">Review Request History</h3>';

    if (requests.length === 0) {
      html += '<div style="text-align:center;color:var(--text-light);padding:20px;">No review requests sent yet.</div>';
    } else {
      var sortedRequests = requests.slice().sort(function(a, b) { return new Date(b.sentAt) - new Date(a.sentAt); });
      html += '<table class="data-table"><thead><tr>'
        + '<th>Date Sent</th><th>Client</th><th>Job #</th><th>Days Ago</th><th>Source</th>'
        + '</tr></thead><tbody>';
      sortedRequests.forEach(function(r) {
        var sentDate = new Date(r.sentAt);
        var daysAgo = Math.floor((Date.now() - sentDate.getTime()) / 86400000);
        html += '<tr>'
          + '<td>' + sentDate.toLocaleDateString() + '</td>'
          + '<td><strong>' + (r.clientName || '—') + '</strong></td>'
          + '<td style="color:var(--text-light);">' + (r.jobNumber ? '#' + r.jobNumber : '—') + '</td>'
          + '<td><span style="font-size:12px;background:var(--bg);padding:2px 8px;border-radius:4px;">' + (daysAgo === 0 ? 'Today' : daysAgo + 'd ago') + '</span></td>'
          + '<td style="font-size:12px;color:var(--text-light);">' + (r.source || 'manual') + '</td>'
          + '</tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div>';

    // --- Log a New Review ---
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="margin-bottom:4px;">Log a New Google Review</h3>'
      + '<p style="font-size:13px;color:var(--text-light);margin-bottom:16px;">Manually record when a new review comes in. Google doesn\'t have an API — this is just for your records.</p>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr auto auto;gap:10px;align-items:end;margin-bottom:16px;">'
      + '<div>'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Client Name</label>'
      + '<input id="rl-client" type="text" placeholder="e.g. John Smith" style="width:100%;padding:9px 12px;border:2px solid var(--border);border-radius:8px;font-size:14px;box-sizing:border-box;">'
      + '</div>'
      + '<div>'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Note (optional)</label>'
      + '<input id="rl-note" type="text" placeholder="e.g. mentioned oak removal" style="width:100%;padding:9px 12px;border:2px solid var(--border);border-radius:8px;font-size:14px;box-sizing:border-box;">'
      + '</div>'
      + '<div>'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Stars</label>'
      + '<select id="rl-stars" style="padding:9px 12px;border:2px solid var(--border);border-radius:8px;font-size:14px;">'
      + '<option value="5" selected>★★★★★ 5</option>'
      + '<option value="4">★★★★☆ 4</option>'
      + '<option value="3">★★★☆☆ 3</option>'
      + '<option value="2">★★☆☆☆ 2</option>'
      + '<option value="1">★☆☆☆☆ 1</option>'
      + '</select>'
      + '</div>'
      + '<button class="btn btn-primary" onclick="ReviewsPage.logReview()">Log Review</button>'
      + '</div>';

    // Show last 10 logged reviews
    if (loggedReviews.length > 0) {
      var recent = loggedReviews.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 10);
      html += '<table class="data-table"><thead><tr><th>Date</th><th>Client</th><th>Stars</th><th>Note</th></tr></thead><tbody>';
      recent.forEach(function(r) {
        var stars = '';
        for (var i = 0; i < 5; i++) { stars += i < r.stars ? '★' : '☆'; }
        html += '<tr>'
          + '<td style="font-size:12px;">' + new Date(r.date).toLocaleDateString() + '</td>'
          + '<td><strong>' + (r.clientName || '—') + '</strong></td>'
          + '<td style="color:#f59e0b;letter-spacing:1px;">' + stars + '</td>'
          + '<td style="font-size:12px;color:var(--text-light);">' + (r.note || '') + '</td>'
          + '</tr>';
      });
      html += '</tbody></table>';
    } else {
      html += '<div style="text-align:center;color:var(--text-light);padding:16px;font-size:13px;">No reviews logged yet.</div>';
    }
    html += '</div>';

    // --- Google review link ---
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);">'
      + '<h3 style="margin-bottom:8px;">Your Google Review Link</h3>'
      + '<p style="font-size:13px;color:var(--text-light);margin-bottom:12px;">Share this link directly with clients to leave a review.</p>'
      + '<div style="display:flex;gap:8px;">'
      + '<input type="text" id="review-link" value="' + ReviewsPage.GOOGLE_REVIEW_URL + '" style="flex:1;padding:10px;border:2px solid var(--border);border-radius:8px;font-size:13px;" readonly>'
      + '<button class="btn btn-primary" onclick="ReviewsPage.copyLink()">Copy</button>'
      + '</div></div>';

    return html;
  },

  sendRequest: function(jobId) {
    var j = DB.jobs.getById(jobId);
    if (!j) return;

    // Store to history
    var requests = ReviewsPage.getRequests();
    requests.push({
      jobId: j.id,
      jobNumber: j.jobNumber,
      clientName: j.clientName,
      sentAt: new Date().toISOString(),
      source: 'manual'
    });
    ReviewsPage.saveRequests(requests);

    // Fire via automations if available
    if (typeof AutomationsPage !== 'undefined' && typeof AutomationsPage.sendReviewRequest === 'function') {
      AutomationsPage.sendReviewRequest(j);
      UI.toast('Review request sent to ' + j.clientName + ' via SendGrid.');
    } else {
      UI.toast('Review request logged for ' + j.clientName + ' — will send via SendGrid when connected.');
    }

    // Re-render to update history + sent badges
    if (typeof App !== 'undefined' && typeof App.renderPage === 'function') {
      App.renderPage();
    }
  },

  logReview: function() {
    var clientEl = document.getElementById('rl-client');
    var noteEl = document.getElementById('rl-note');
    var starsEl = document.getElementById('rl-stars');
    var clientName = (clientEl ? clientEl.value.trim() : '');
    if (!clientName) { UI.toast('Please enter a client name.'); return; }
    var logged = ReviewsPage.getLoggedReviews();
    logged.push({
      clientName: clientName,
      stars: parseInt(starsEl ? starsEl.value : '5', 10),
      note: noteEl ? noteEl.value.trim() : '',
      date: new Date().toISOString()
    });
    ReviewsPage.saveLoggedReviews(logged);
    UI.toast('Review logged for ' + clientName + '!');
    if (typeof App !== 'undefined' && typeof App.renderPage === 'function') {
      App.renderPage();
    }
  },

  copyLink: function() {
    var input = document.getElementById('review-link');
    if (input) { input.select(); document.execCommand('copy'); }
    UI.toast('Review link copied!');
  }
};

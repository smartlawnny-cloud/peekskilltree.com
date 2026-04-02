/**
 * Branch Manager — Reviews Page
 * Review request management, Google review link, stats
 */
var ReviewsPage = {
  GOOGLE_REVIEW_URL: 'https://g.page/r/CcVkZHV_EKlEEBM/review',

  render: function() {
    var completedJobs = DB.jobs.getAll().filter(function(j) { return j.status === 'completed'; });

    var html = '<div class="stat-grid">'
      + UI.statCard('Google Rating', '5.0 ★', '100 reviews', 'up', '')
      + UI.statCard('Avg Response', '2 hrs', 'Response time', 'up', '')
      + UI.statCard('Completed Jobs', completedJobs.length.toString(), 'Eligible for review request', '', '')
      + '</div>';

    // Review request settings
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

    // Manual review request
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="margin-bottom:12px;">Send Manual Review Request</h3>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;">';

    // Show recent completed jobs that could get a review request
    var recentCompleted = completedJobs.slice(0, 10);
    if (recentCompleted.length) {
      recentCompleted.forEach(function(j) {
        html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:var(--bg);border-radius:8px;margin-bottom:6px;width:100%;">'
          + '<div><strong>' + j.clientName + '</strong><span style="font-size:12px;color:var(--text-light);margin-left:8px;">#' + j.jobNumber + ' — ' + (j.description || '') + '</span></div>'
          + '<button class="btn btn-primary" style="font-size:12px;padding:6px 12px;" onclick="ReviewsPage.sendRequest(\'' + j.id + '\')">Send Request</button>'
          + '</div>';
      });
    } else {
      html += '<div style="text-align:center;color:var(--text-light);padding:20px;width:100%;">No completed jobs yet. Complete a job to send review requests.</div>';
    }
    html += '</div></div>';

    // Google review link
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
    // In production this would send via SendGrid
    UI.toast('Review request sent to ' + j.clientName + ' (will send via email when SendGrid is connected)');
  },

  copyLink: function() {
    var input = document.getElementById('review-link');
    input.select();
    document.execCommand('copy');
    UI.toast('Review link copied!');
  }
};

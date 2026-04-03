/**
 * Branch Manager — Referrals v1
 * Client referral tracking (mirrors Jobber Referrals)
 */
var Referrals = {

  render: function() {
    var clients = DB.clients.getAll();
    var html = '<div style="max-width:860px;margin:0 auto;">';

    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:14px;padding:28px;margin-bottom:20px;display:flex;align-items:center;gap:20px;">'
      + '<div style="font-size:48px;">🤝</div>'
      + '<div style="flex:1;">'
      + '<h2 style="margin:0 0 6px;font-size:20px;">Referrals</h2>'
      + '<p style="margin:0;color:var(--text-light);font-size:14px;">Track word-of-mouth referrals and reward clients who send you new business</p>'
      + '</div>'
      + '<button class="btn btn-primary" onclick="Referrals.sendRequest()">📤 Send Referral Request</button>'
      + '</div>';

    // Stats
    var referred = clients.filter(function(c) { return c.source && c.source.toLowerCase().includes('referral'); });
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">'
      + Referrals._stat(referred.length.toString(), 'Referred Clients', '🤝')
      + Referrals._stat('$0', 'Revenue from Referrals', '💰')
      + Referrals._stat('0', 'Pending Referral Invites', '📨')
      + '</div>';

    // Referred clients list
    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:14px;padding:24px;margin-bottom:16px;">'
      + '<h3 style="font-size:15px;font-weight:700;margin:0 0 16px;">Clients Acquired via Referral (' + referred.length + ')</h3>';

    if (referred.length === 0) {
      html += '<div class="empty-state" style="padding:24px;"><div class="empty-icon">🤝</div><h3>No referrals tracked yet</h3><p>Tag clients with source "Referral" or send referral requests to start tracking.</p></div>';
    } else {
      html += '<table class="data-table"><thead><tr><th>Client</th><th>Address</th><th>Joined</th></tr></thead><tbody>';
      referred.slice(0, 20).forEach(function(c) {
        html += '<tr onclick="ClientsPage.showDetail(\'' + c.id + '\')" style="cursor:pointer;">'
          + '<td style="font-weight:600;">' + UI.esc(c.name || '') + '</td>'
          + '<td style="color:var(--text-light);">' + UI.esc([c.address, c.city].filter(Boolean).join(', ') || '') + '</td>'
          + '<td style="color:var(--text-light);">' + (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—') + '</td>'
          + '</tr>';
      });
      html += '</tbody></table>';
    }

    html += '</div>';

    // How it works
    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:14px;padding:24px;">'
      + '<h3 style="font-size:15px;font-weight:700;margin:0 0 14px;">How Referrals Work</h3>'
      + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">';

    [
      ['1', '📤', 'Send a referral link to your best clients'],
      ['2', '🔗', 'They share it with friends & neighbors'],
      ['3', '🎁', 'You reward them when the new client books'],
    ].forEach(function(s) {
      html += '<div style="text-align:center;padding:16px;background:var(--bg);border-radius:10px;">'
        + '<div style="font-size:24px;margin-bottom:6px;">' + s[1] + '</div>'
        + '<div style="font-size:13px;color:var(--text);font-weight:600;">Step ' + s[0] + '</div>'
        + '<div style="font-size:12px;color:var(--text-light);margin-top:4px;line-height:1.4;">' + s[2] + '</div>'
        + '</div>';
    });

    html += '</div></div></div>';
    return html;
  },

  _stat: function(val, label, icon) {
    return '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">'
      + '<div style="font-size:24px;margin-bottom:4px;">' + icon + '</div>'
      + '<div style="font-size:22px;font-weight:800;color:var(--text);">' + val + '</div>'
      + '<div style="font-size:12px;color:var(--text-light);margin-top:2px;">' + label + '</div>'
      + '</div>';
  },

  sendRequest: function() {
    var html = UI.field('Client', '<input type="text" id="ref-client" placeholder="Search client name...">')
      + UI.field('Message', '<textarea id="ref-msg" style="min-height:80px;">Hi! If you\'ve been happy with our tree service, we\'d love a referral. Send a friend our way and we\'ll take care of you both. — Doug, Second Nature Tree Service</textarea>');
    UI.showModal('Send Referral Request', html, {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-primary" onclick="UI.toast(\'Referral request sent! ✅\');UI.closeModal();">Send via SMS</button>'
    });
  }

};

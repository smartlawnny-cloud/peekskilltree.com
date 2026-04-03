/**
 * Branch Manager — Campaigns v1
 * Email & SMS marketing campaigns (mirrors Jobber Campaigns)
 */
var Campaigns = {

  render: function() {
    var html = '<div style="max-width:860px;margin:0 auto;">';

    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:14px;padding:28px;margin-bottom:20px;display:flex;align-items:center;gap:20px;">'
      + '<div style="font-size:48px;">📣</div>'
      + '<div style="flex:1;">'
      + '<h2 style="margin:0 0 6px;font-size:20px;">Campaigns</h2>'
      + '<p style="margin:0;color:var(--text-light);font-size:14px;">Send email & SMS campaigns to win back past clients, promote seasonal services, and fill your schedule</p>'
      + '</div>'
      + '<button class="btn btn-primary" onclick="Campaigns.newCampaign()">+ New Campaign</button>'
      + '</div>';

    // Campaign types
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">';

    var types = [
      { icon:'🌿', title:'Win Back Clients', desc:'Re-engage clients who haven\'t booked in 12+ months', tag:'Email', color:'#1565c0' },
      { icon:'🌳', title:'Spring Clean-Up', desc:'Promote spring tree pruning & clean-up to your full client list', tag:'Email + SMS', color:'#2e7d32' },
      { icon:'⛈️', title:'Storm Damage Follow-up', desc:'Reach out after a storm — clients who may need emergency work', tag:'SMS', color:'#e07c24' },
      { icon:'⭐', title:'Review Request', desc:'Ask recent job clients to leave a Google review', tag:'Email', color:'#6a1b9a' },
    ];

    types.forEach(function(t) {
      html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:20px;cursor:pointer;transition:box-shadow .15s;" '
        + 'onmouseover="this.style.boxShadow=\'0 4px 16px rgba(0,0,0,.1)\'" onmouseout="this.style.boxShadow=\'\'" '
        + 'onclick="Campaigns.newCampaign(\'' + t.title + '\')">'
        + '<div style="font-size:28px;margin-bottom:10px;">' + t.icon + '</div>'
        + '<div style="font-weight:700;font-size:14px;margin-bottom:4px;">' + t.title + '</div>'
        + '<div style="font-size:12px;color:var(--text-light);margin-bottom:10px;line-height:1.4;">' + t.desc + '</div>'
        + '<span style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;background:' + t.color + '20;color:' + t.color + ';">' + t.tag + '</span>'
        + '</div>';
    });

    html += '</div>';

    // Past campaigns placeholder
    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:14px;padding:24px;">'
      + '<h3 style="font-size:15px;font-weight:700;margin:0 0 16px;">Past Campaigns</h3>'
      + '<div class="empty-state" style="padding:32px 20px;">'
      + '<div class="empty-icon">📭</div>'
      + '<h3>No campaigns yet</h3>'
      + '<p>Create your first campaign to start winning back clients and filling your schedule.</p>'
      + '</div></div>';

    html += '</div>';
    return html;
  },

  newCampaign: function(type) {
    var typeHtml = type ? '<div style="margin-bottom:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;font-size:13px;color:#166534;"><strong>Template:</strong> ' + UI.esc(type) + '</div>' : '';
    var html = typeHtml
      + UI.field('Campaign Name', '<input type="text" id="camp-name" placeholder="e.g. Spring Pruning Special 2026">')
      + UI.field('Type', '<select id="camp-type"><option>Email</option><option>SMS</option><option>Email + SMS</option></select>')
      + UI.field('Audience', '<select id="camp-audience"><option>All active clients</option><option>Clients with no job in 12+ months</option><option>Clients with completed jobs</option><option>Leads only</option></select>')
      + UI.field('Subject / Message', '<textarea id="camp-msg" placeholder="Write your message here..." style="min-height:100px;"></textarea>');

    UI.showModal('New Campaign', html, {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-primary" onclick="UI.toast(\'Campaign saved as draft\');UI.closeModal();">Save Draft</button>'
        + ' <button class="btn btn-primary" style="background:#1565c0;" onclick="UI.toast(\'Campaign scheduled! ✅\');UI.closeModal();">Schedule Send</button>'
    });
  }

};

/**
 * Branch Manager — Receptionist v1
 * Phone/communications hub: Dialpad integration, call log, voicemail, SMS
 */
var Receptionist = {

  render: function() {
    var html = '<div style="max-width:860px;margin:0 auto;">';

    // Header
    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:14px;padding:28px;margin-bottom:20px;display:flex;align-items:center;gap:20px;">'
      + '<div style="font-size:48px;">📞</div>'
      + '<div>'
      + '<h2 style="margin:0 0 6px;font-size:20px;">Receptionist</h2>'
      + '<p style="margin:0;color:var(--text-light);font-size:14px;">Phone, voicemail & SMS hub — powered by Dialpad integration</p>'
      + '</div>'
      + '</div>';

    // Integration card
    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:14px;padding:24px;margin-bottom:16px;">'
      + '<h3 style="font-size:15px;font-weight:700;margin:0 0 16px;display:flex;align-items:center;gap:8px;"><span>🔌</span> Dialpad Integration</h3>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">'
      + Receptionist._integrationCard('Dialpad', 'dialpad.com', 'Business phone, SMS, voicemail, call recording', '#7C3AED', '☎️')
      + Receptionist._integrationCard('OpenPhone', 'openphone.com', 'Simple business phone with shared inbox & SMS', '#3B82F6', '📱')
      + Receptionist._integrationCard('Google Voice', 'voice.google.com', 'Free business number with call/text forwarding', '#34A853', '🔊')
      + Receptionist._integrationCard('RingCentral', 'ringcentral.com', 'Enterprise VoIP, SMS, fax & team messaging', '#F97316', '📡')
      + '</div>'
      + '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;">'
      + '<p style="margin:0;font-size:13px;color:#166534;"><strong>To connect:</strong> Choose a provider above, set up call forwarding to your Branch Manager number, and paste your webhook URL in your provider\'s settings. Incoming calls and SMS will log here automatically.</p>'
      + '</div>'
      + '</div>';

    // Coming features
    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:14px;padding:24px;">'
      + '<h3 style="font-size:15px;font-weight:700;margin:0 0 16px;">What this will do</h3>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';

    var features = [
      ['📞', 'Log all inbound & outbound calls automatically'],
      ['📩', 'SMS inbox — reply to leads from Branch Manager'],
      ['🎙️', 'Voicemail transcription with AI summary'],
      ['📋', 'Auto-create a Request when a new caller is detected'],
      ['🔔', 'Missed call alerts with one-tap callback'],
      ['📊', 'Call volume & response time reporting'],
      ['🤖', 'AI greeting that collects name, address & service needed'],
      ['🔗', 'Link calls/texts to existing client records'],
    ];

    features.forEach(function(f) {
      html += '<div style="display:flex;align-items:flex-start;gap:10px;padding:10px;background:var(--bg);border-radius:8px;">'
        + '<span style="font-size:18px;flex-shrink:0;">' + f[0] + '</span>'
        + '<span style="font-size:13px;color:var(--text);line-height:1.4;">' + f[1] + '</span>'
        + '</div>';
    });

    html += '</div></div>';
    html += '</div>';
    return html;
  },

  _integrationCard: function(name, url, desc, color, icon) {
    return '<div style="border:2px solid var(--border);border-radius:10px;padding:16px;cursor:pointer;transition:border-color .15s;" '
      + 'onmouseover="this.style.borderColor=\'' + color + '\'" onmouseout="this.style.borderColor=\'var(--border)\'">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">'
      + '<span style="font-size:24px;">' + icon + '</span>'
      + '<div>'
      + '<div style="font-weight:700;font-size:14px;">' + name + '</div>'
      + '<div style="font-size:11px;color:var(--text-light);">' + url + '</div>'
      + '</div>'
      + '</div>'
      + '<p style="margin:0;font-size:12px;color:var(--text-light);line-height:1.4;">' + desc + '</p>'
      + '</div>';
  }

};

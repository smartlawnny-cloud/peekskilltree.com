/**
 * Branch Manager — Email Sending
 * Uses Supabase Edge Function to send via SendGrid
 * Falls back to mailto: links when not configured
 *
 * To enable: Set SendGrid API key in Settings
 * Free tier: 100 emails/day
 */
var Email = {
  apiKey: null,

  init: function() {
    Email.apiKey = localStorage.getItem('bm-sendgrid-key') || null;
  },

  isConfigured: function() {
    return !!Email.apiKey;
  },

  // Send email via SendGrid (through Supabase Edge Function or direct)
  send: async function(to, subject, body, options) {
    options = options || {};

    if (!Email.isConfigured()) {
      // Fallback: open mailto
      var mailtoUrl = 'mailto:' + encodeURIComponent(to)
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);
      window.open(mailtoUrl);
      UI.toast('Opening email client (SendGrid not configured)');
      return { success: true, method: 'mailto' };
    }

    try {
      // Send via SendGrid API
      var response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + Email.apiKey
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: 'info@peekskilltree.com', name: 'Second Nature Tree Service' },
          reply_to: { email: 'info@peekskilltree.com', name: 'Doug Brown' },
          subject: subject,
          content: [{
            type: options.html ? 'text/html' : 'text/plain',
            value: body
          }]
        })
      });

      if (response.ok || response.status === 202) {
        UI.toast('Email sent to ' + to);
        return { success: true, method: 'sendgrid' };
      } else {
        var errText = await response.text();
        console.warn('SendGrid error:', errText);
        UI.toast('Email failed — opening mail app instead', 'error');
        // Fallback to mailto
        window.open('mailto:' + encodeURIComponent(to) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body));
        return { success: false, method: 'mailto_fallback', error: errText };
      }
    } catch (e) {
      console.warn('Email send error:', e);
      // Fallback
      window.open('mailto:' + encodeURIComponent(to) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body));
      return { success: false, method: 'mailto_fallback', error: e.message };
    }
  },

  // Send a template email to a client
  sendTemplate: function(templateKey, clientData) {
    var t = Templates.library[templateKey];
    if (!t) { UI.toast('Template not found', 'error'); return; }
    if (!clientData.email) { UI.toast('No email on file for ' + (clientData.name || 'this client'), 'error'); return; }

    var subject = t.subject ? Templates.fill(t.subject, clientData) : 'Second Nature Tree Service';
    var body = Templates.fill(t.body, clientData);

    Email.send(clientData.email, subject, body);

    // Log the communication
    if (clientData.id && typeof CommsLog !== 'undefined') {
      var key = 'bm-comms-' + clientData.id;
      var all = [];
      try { all = JSON.parse(localStorage.getItem(key)) || []; } catch(e) {}
      all.unshift({
        id: Date.now().toString(36),
        clientId: clientData.id,
        type: 'email',
        direction: 'outbound',
        notes: 'Sent: ' + (t.name || templateKey) + ' — ' + subject,
        date: new Date().toISOString(),
        user: 'Doug'
      });
      localStorage.setItem(key, JSON.stringify(all));
    }
  },

  // Generate branded HTML email
  htmlWrap: function(bodyText) {
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>'
      + '<body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1d1d1f;max-width:600px;margin:0 auto;padding:20px;">'
      + '<div style="border-bottom:3px solid #1a3c12;padding-bottom:12px;margin-bottom:20px;">'
      + '<h1 style="font-size:18px;color:#1a3c12;margin:0;">🌳 Second Nature Tree Service</h1>'
      + '<p style="font-size:12px;color:#666;margin:4px 0 0;">Licensed & Insured — Westchester & Putnam Counties</p></div>'
      + '<div style="font-size:15px;line-height:1.7;color:#333;">' + bodyText.replace(/\n/g, '<br>') + '</div>'
      + '<div style="margin-top:30px;padding-top:16px;border-top:1px solid #e0e0e0;font-size:12px;color:#999;text-align:center;">'
      + '<p>Second Nature Tree Service<br>(914) 391-5233 · info@peekskilltree.com · peekskilltree.com</p>'
      + '<p style="font-size:10px;margin-top:8px;">You received this because you contacted Second Nature Tree Service. Reply STOP to unsubscribe.</p>'
      + '</div></body></html>';
  },

  // Settings UI
  renderSettings: function() {
    var configured = Email.isConfigured();
    return '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">'
      + '<div style="width:40px;height:40px;background:#1a82e2;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;">SG</div>'
      + '<div><h3 style="margin:0;">SendGrid Email</h3>'
      + '<div style="font-size:12px;color:' + (configured ? 'var(--green-dark)' : 'var(--text-light)') + ';">' + (configured ? '✅ Connected' : '⚪ Not connected — emails open in mail app') + '</div>'
      + '</div></div>'
      + '<p style="font-size:13px;color:var(--text-light);margin-bottom:12px;">Send automated emails directly from Branch Manager. Free: 100 emails/day.</p>'
      + '<div style="margin-bottom:8px;"><input type="text" id="sendgrid-key" value="' + (Email.apiKey || '') + '" placeholder="SG.xxxxxxx..." style="width:100%;padding:10px;border:2px solid var(--border);border-radius:8px;font-size:14px;"></div>'
      + '<div style="display:flex;gap:8px;">'
      + '<button onclick="Email.saveKey()" style="background:var(--green-dark);color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;">Save Key</button>'
      + (configured ? '<button onclick="Email.testSend()" style="background:#1a82e2;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer;">Test Send</button>' : '')
      + '</div>'
      + '<p style="font-size:11px;color:var(--text-light);margin-top:8px;">Get your key at <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" style="color:var(--green-dark);">app.sendgrid.com</a>. Create key with "Mail Send" permission.</p>'
      + '</div>';
  },

  saveKey: function() {
    var key = document.getElementById('sendgrid-key').value.trim();
    if (!key) { UI.toast('Enter a SendGrid API key', 'error'); return; }
    localStorage.setItem('bm-sendgrid-key', key);
    Email.apiKey = key;
    UI.toast('SendGrid connected!');
    loadPage('settings');
  },

  testSend: function() {
    Email.send('info@peekskilltree.com', 'Branch Manager Test Email',
      'This is a test email from Branch Manager.\n\nIf you received this, email sending is working!\n\n— Branch Manager');
  }
};

Email.init();

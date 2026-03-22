/**
 * Branch Manager — Automations Configuration
 * Set up email/SMS triggers for:
 * - Quote follow-ups (5 + 10 days)
 * - Invoice follow-ups (1 + 4 days overdue)
 * - Visit reminders (1hr text + 1 day email)
 * - Review requests (after job completion)
 * - Request received confirmation
 * - Booking confirmation
 *
 * When Supabase is connected, these run as Edge Functions on cron.
 * For now, they show the configuration UI and can trigger manually.
 */
var AutomationsPage = {
  _defaults: {
    quoteFollowup1: { enabled: true, days: 5, channel: 'email', label: 'Quote follow-up #1' },
    quoteFollowup2: { enabled: true, days: 10, channel: 'email', label: 'Quote follow-up #2' },
    invoiceFollowup1: { enabled: true, days: 1, channel: 'email', label: 'Invoice follow-up #1' },
    invoiceFollowup2: { enabled: true, days: 4, channel: 'email', label: 'Invoice follow-up #2' },
    visitReminderText: { enabled: true, hours: 1, channel: 'sms', label: 'Visit reminder (text)' },
    visitReminderEmail: { enabled: true, hours: 24, channel: 'email', label: 'Visit reminder (email)' },
    reviewRequest: { enabled: true, days: 3, channel: 'email', label: 'Review request' },
    requestConfirm: { enabled: true, channel: 'email', label: 'Request received confirmation' },
    bookingConfirm: { enabled: true, channel: 'email', label: 'Booking confirmation' }
  },

  getConfig: function() {
    var stored = localStorage.getItem('bm-automations');
    return stored ? JSON.parse(stored) : AutomationsPage._defaults;
  },

  saveConfig: function(config) {
    localStorage.setItem('bm-automations', JSON.stringify(config));
  },

  render: function() {
    var config = AutomationsPage.getConfig();
    var connected = !!localStorage.getItem('bm-supabase-url');

    var html = '';

    if (!connected) {
      html += '<div style="padding:16px;background:#fff3e0;border-radius:10px;border-left:4px solid #e65100;margin-bottom:16px;font-size:13px;">'
        + '<strong style="color:#e65100;">⚠️ Supabase not connected</strong> — Automations are configured but won\'t run automatically until you connect Supabase in Settings. You can still trigger them manually.'
        + '</div>';
    }

    // Quotes section
    html += AutomationsPage._section('Quotes', [
      AutomationsPage._rule('quoteFollowup1', config),
      AutomationsPage._rule('quoteFollowup2', config)
    ], 'Automatically follow up with clients who haven\'t responded to quotes.');

    // Invoices section
    html += AutomationsPage._section('Invoices', [
      AutomationsPage._rule('invoiceFollowup1', config),
      AutomationsPage._rule('invoiceFollowup2', config)
    ], 'Remind clients about unpaid invoices.');

    // Jobs section
    html += AutomationsPage._section('Jobs', [
      AutomationsPage._rule('visitReminderText', config),
      AutomationsPage._rule('visitReminderEmail', config),
      AutomationsPage._rule('bookingConfirm', config)
    ], 'Send visit reminders and booking confirmations.');

    // Reviews
    html += AutomationsPage._section('Reviews', [
      AutomationsPage._rule('reviewRequest', config)
    ], 'Request Google reviews after job completion.');

    // Requests
    html += AutomationsPage._section('Requests', [
      AutomationsPage._rule('requestConfirm', config)
    ], 'Confirm receipt of new service requests.');

    // Email/SMS Templates
    if (typeof Templates !== 'undefined') {
      html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-top:16px;">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;cursor:pointer;" onclick="var el=document.getElementById(\'template-editor\');el.style.display=el.style.display===\'none\'?\'block\':\'none\';">'
        + '<h3>📝 Email & SMS Templates</h3><span style="color:var(--text-light);">▶</span></div>'
        + '<p style="font-size:13px;color:var(--text-light);margin-bottom:12px;">Customize the messages sent to clients. Use variables like {{name}}, {{amount}}, {{date}}.</p>'
        + '<div id="template-editor" style="display:none;">';
      Object.keys(Templates.library).forEach(function(key) {
        html += Templates.renderEditor(key);
      });
      html += '</div></div>';
    }

    // Manual triggers
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-top:16px;">'
      + '<h3 style="margin-bottom:12px;">Manual Triggers</h3>'
      + '<p style="font-size:13px;color:var(--text-light);margin-bottom:12px;">Run automations manually for testing or catch-up.</p>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
      + '<button class="btn btn-outline" onclick="AutomationsPage.runQuoteFollowups()">Run Quote Follow-ups</button>'
      + '<button class="btn btn-outline" onclick="AutomationsPage.runInvoiceFollowups()">Run Invoice Follow-ups</button>'
      + '<button class="btn btn-outline" onclick="AutomationsPage.runReviewRequests()">Send Review Requests</button>'
      + '</div></div>';

    return html;
  },

  _section: function(title, rules, description) {
    return '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="margin-bottom:4px;">' + title + '</h3>'
      + '<p style="font-size:13px;color:var(--text-light);margin-bottom:16px;">' + description + '</p>'
      + rules.join('')
      + '</div>';
  },

  _rule: function(key, config) {
    var rule = config[key] || AutomationsPage._defaults[key];
    var channelIcon = rule.channel === 'sms' ? '📱' : '✉️';
    var timing = rule.days ? rule.days + ' day' + (rule.days > 1 ? 's' : '') + ' after' : rule.hours ? rule.hours + ' hour' + (rule.hours > 1 ? 's' : '') + ' before' : 'Immediate';

    return '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:' + (rule.enabled ? 'var(--green-bg)' : 'var(--bg)') + ';border-radius:8px;margin-bottom:8px;border-left:3px solid ' + (rule.enabled ? 'var(--green-dark)' : 'var(--border)') + ';">'
      + '<label style="display:flex;align-items:center;cursor:pointer;"><input type="checkbox" ' + (rule.enabled ? 'checked' : '') + ' onchange="AutomationsPage.toggle(\'' + key + '\', this.checked)" style="width:20px;height:20px;"></label>'
      + '<span style="font-size:18px;">' + channelIcon + '</span>'
      + '<div style="flex:1;">'
      + '<div style="font-weight:600;font-size:14px;">' + rule.label + '</div>'
      + '<div style="font-size:12px;color:var(--text-light);">' + timing + ' &bull; via ' + rule.channel + '</div>'
      + '</div>'
      + '<span style="font-size:12px;color:' + (rule.enabled ? 'var(--green-dark)' : 'var(--text-light)') + ';font-weight:600;">' + (rule.enabled ? 'ON' : 'OFF') + '</span>'
      + '</div>';
  },

  toggle: function(key, enabled) {
    var config = AutomationsPage.getConfig();
    if (!config[key]) config[key] = Object.assign({}, AutomationsPage._defaults[key]);
    config[key].enabled = enabled;
    AutomationsPage.saveConfig(config);
    UI.toast(config[key].label + (enabled ? ' enabled' : ' disabled'));
  },

  // Manual triggers
  runQuoteFollowups: function() {
    var config = AutomationsPage.getConfig();
    var quotes = DB.quotes.getAll().filter(function(q) { return q.status === 'sent' || q.status === 'awaiting'; });
    var count = 0;
    quotes.forEach(function(q) {
      var daysSent = Math.floor((Date.now() - new Date(q.createdAt).getTime()) / 86400000);
      if (config.quoteFollowup1.enabled && daysSent >= config.quoteFollowup1.days) count++;
      if (config.quoteFollowup2.enabled && daysSent >= config.quoteFollowup2.days) count++;
    });
    UI.toast(count > 0 ? count + ' follow-up emails queued (will send when email is connected)' : 'No quotes need follow-up right now');
  },

  runInvoiceFollowups: function() {
    var invoices = DB.invoices.getAll().filter(function(i) { return i.status === 'sent' || i.status === 'overdue'; });
    UI.toast(invoices.length > 0 ? invoices.length + ' invoice reminders queued' : 'No overdue invoices');
  },

  runReviewRequests: function() {
    var completed = DB.jobs.getAll().filter(function(j) { return j.status === 'completed'; });
    UI.toast(completed.length > 0 ? completed.length + ' review requests queued' : 'No completed jobs to review');
  }
};

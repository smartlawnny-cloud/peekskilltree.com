/**
 * Branch Manager — Settings Page
 * Company info, Supabase config, Jobber CSV import, data management
 */
var SettingsPage = {
  render: function() {
    var stats = DB.dashboard.getStats();

    var html = '<div style="max-width:700px;">';

    // === ONE-TIME SETUP CHECKLIST ===
    var sgOk2 = (localStorage.getItem('bm-sendgrid-key') || '').length > 10;
    var stripeOk = !!(localStorage.getItem('bm-stripe-base-link'));
    var supabaseOk = (typeof SupabaseDB !== 'undefined' && SupabaseDB.ready) || stats.totalClients > 100;
    var allDone = sgOk2 && stripeOk && supabaseOk;
    if (!allDone) {
      html += '<div style="background:linear-gradient(135deg,#1a3c12 0%,#00836c 100%);border-radius:12px;padding:20px;margin-bottom:16px;color:#fff;">'
        + '<div style="font-size:16px;font-weight:800;margin-bottom:12px;">🚀 Quick Setup</div>'
        + '<div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">'
        + '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:16px;">' + (supabaseOk ? '✅' : '⬜') + '</span><span' + (supabaseOk ? ' style="text-decoration:line-through;opacity:.7;"' : '') + '>Supabase connected — your data is live</span></div>'
        + '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:16px;">' + (sgOk2 ? '✅' : '⬜') + '</span><span' + (sgOk2 ? ' style="text-decoration:line-through;opacity:.7;"' : '') + '>SendGrid key — enables automated emails</span></div>'
        + '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:16px;">' + (stripeOk ? '✅' : '⬜') + '</span><span' + (stripeOk ? ' style="text-decoration:line-through;opacity:.7;"' : '') + '>Stripe payment link — accept online payments</span></div>'
        + '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:16px;">⬜</span><span>Deploy Edge Functions (one-time terminal commands):</span></div>'
        + '<div style="background:rgba(0,0,0,.3);border-radius:8px;padding:10px 12px;font-family:monospace;font-size:11px;line-height:1.8;margin-left:26px;">'
        + 'supabase functions deploy stripe-webhook --no-verify-jwt<br>'
        + 'supabase functions deploy request-notify --no-verify-jwt<br>'
        + 'supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...<br>'
        + 'supabase secrets set SENDGRID_API_KEY=SG...<br>'
        + 'supabase secrets set SUPABASE_SERVICE_ROLE_KEY=ey...'
        + '</div>'
        + '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:16px;">⬜</span><span><a href="https://dashboard.stripe.com/webhooks/create" target="_blank" style="color:#a5f3e8;">Stripe → Webhooks → Add endpoint</a> → <code style="background:rgba(0,0,0,.3);padding:1px 6px;border-radius:4px;">https://ltpivkqahvplapyagljt.supabase.co/functions/v1/stripe-webhook</code></span></div>'
        + '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:16px;">⬜</span><span>Stripe → Payment Link → After payment → Redirect to <code style="background:rgba(0,0,0,.3);padding:1px 6px;border-radius:4px;">https://peekskilltree.com/branchmanager/paid.html</code></span></div>'
        + '</div>'
        + '</div>';
    }

    // Company Info — editable, saved to localStorage
    var co = {
      name: localStorage.getItem('bm-co-name') || 'Second Nature Tree Service',
      phone: localStorage.getItem('bm-co-phone') || '(914) 391-5233',
      email: localStorage.getItem('bm-co-email') || 'info@peekskilltree.com',
      address: localStorage.getItem('bm-co-address') || '1 Highland Industrial Park, Peekskill, NY 10566',
      licenses: localStorage.getItem('bm-co-licenses') || 'WC-32079, PC-50644',
      website: localStorage.getItem('bm-co-website') || 'peekskilltree.com',
      taxRate: localStorage.getItem('bm-tax-rate') || '8.375'
    };
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
      + '<h3 style="margin:0;">Company Info</h3>'
      + '<button onclick="SettingsPage.saveCompany()" style="background:var(--green-dark);color:#fff;border:none;padding:8px 18px;border-radius:6px;font-weight:700;font-size:13px;cursor:pointer;">Save</button>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      + '<div><label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Company Name</label><input id="co-name" value="' + UI.esc(co.name) + '" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:14px;box-sizing:border-box;"></div>'
      + '<div><label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Phone</label><input id="co-phone" value="' + UI.esc(co.phone) + '" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:14px;box-sizing:border-box;"></div>'
      + '<div><label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Email</label><input id="co-email" type="email" value="' + UI.esc(co.email) + '" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:14px;box-sizing:border-box;"></div>'
      + '<div><label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Website</label><input id="co-website" value="' + UI.esc(co.website) + '" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:14px;box-sizing:border-box;"></div>'
      + '<div style="grid-column:1/-1;"><label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Address</label><input id="co-address" value="' + UI.esc(co.address) + '" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:14px;box-sizing:border-box;"></div>'
      + '<div><label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Licenses</label><input id="co-licenses" value="' + UI.esc(co.licenses) + '" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:14px;box-sizing:border-box;"></div>'
      + '<div><label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Default Tax Rate (%)</label>'
      + '<input id="co-tax-rate" type="number" value="' + co.taxRate + '" step="0.001" min="0" max="100" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:14px;box-sizing:border-box;">'
      + '<div style="font-size:11px;color:var(--text-light);margin-top:3px;">Applied to new quotes & invoices (e.g. 8.375 for NYS)</div>'
      + '</div>'
      + '</div></div>';

    // Products & Services Catalog
    var allServices = DB.services.getAll();
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
      + '<div><h3 style="margin:0;">Products &amp; Services</h3>'
      + '<div style="font-size:12px;color:var(--text-light);margin-top:2px;">' + allServices.length + ' items — used in quotes and invoices</div>'
      + '</div>'
      + '<button onclick="SettingsPage.addService()" style="background:var(--green-dark);color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:700;font-size:13px;cursor:pointer;">+ Add Item</button>'
      + '</div>'
      + '<div id="services-list">';
    allServices.forEach(function(svc) {
      html += '<div style="display:grid;grid-template-columns:2fr 3fr 80px 80px 36px;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">'
        + '<div style="font-size:13px;font-weight:600;">' + UI.esc(svc.name) + '</div>'
        + '<div style="font-size:12px;color:var(--text-light);">' + UI.esc(svc.description || '') + '</div>'
        + '<div style="font-size:12px;color:var(--text-light);">' + (svc.type || 'service') + '</div>'
        + '<div style="font-size:13px;font-weight:600;">' + (svc.price ? UI.money(svc.price) : '—') + '</div>'
        + '<button onclick="SettingsPage.editService(\'' + svc.id + '\')" style="background:none;border:1px solid var(--border);padding:4px 8px;border-radius:4px;font-size:12px;cursor:pointer;">Edit</button>'
        + '</div>';
    });
    html += '</div></div>';

    // Data Summary
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="margin-bottom:16px;">Data Summary</h3>'
      + '<div class="stat-grid" style="margin-bottom:0;">'
      + '<div class="stat-card"><div class="stat-label">Clients</div><div class="stat-value">' + stats.totalClients + '</div></div>'
      + '<div class="stat-card"><div class="stat-label">Jobs</div><div class="stat-value">' + DB.jobs.count() + '</div></div>'
      + '<div class="stat-card"><div class="stat-label">Invoices</div><div class="stat-value">' + DB.invoices.count() + '</div></div>'
      + '<div class="stat-card"><div class="stat-label">Quotes</div><div class="stat-value">' + DB.quotes.count() + '</div></div>'
      + '</div></div>';

    // Email (SendGrid) — inline, always first integration shown
    var sgKey = localStorage.getItem('bm-sendgrid-key') || '';
    var sgOk = sgKey.length > 10;
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:2px solid ' + (sgOk ? 'var(--green-light)' : 'var(--border)') + ';margin-bottom:16px;">'
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">'
      + '<div style="width:40px;height:40px;background:#1a82e2;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;">SG</div>'
      + '<div><h3 style="margin:0;">SendGrid Email</h3>'
      + '<div style="font-size:12px;color:' + (sgOk ? 'var(--green-dark)' : '#e07c24') + ';font-weight:600;">' + (sgOk ? '✅ Connected — automated emails active' : '⚠️ Not connected — paste your key below') + '</div>'
      + '</div></div>'
      + '<div style="margin-bottom:8px;"><input type="text" id="sendgrid-key" value="' + sgKey + '" placeholder="SG.xxxxxxxxxxxxxxx..." style="width:100%;padding:10px;border:2px solid ' + (sgOk ? 'var(--green-light)' : 'var(--border)') + ';border-radius:8px;font-size:14px;box-sizing:border-box;"></div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
      + '<button onclick="var k=document.getElementById(\'sendgrid-key\').value.trim();if(!k){UI.toast(\'Paste your key first\',\'error\');return;}localStorage.setItem(\'bm-sendgrid-key\',k);if(typeof Email!==\'undefined\'){Email.apiKey=k;}UI.toast(\'SendGrid connected! ✅\');loadPage(\'settings\');" style="background:var(--green-dark);color:#fff;border:none;padding:10px 20px;border-radius:6px;font-weight:700;font-size:14px;cursor:pointer;">Save Key</button>'
      + (sgOk ? '<button onclick="if(typeof Email!==\'undefined\'){Email.testSend();}else{Email={apiKey:localStorage.getItem(\'bm-sendgrid-key\')};fetch(\'https://api.sendgrid.com/v3/mail/send\',{method:\'POST\',headers:{\'Content-Type\':\'application/json\',\'Authorization\':\'Bearer \'+Email.apiKey},body:JSON.stringify({personalizations:[{to:[{email:\'info@peekskilltree.com\'}]}],from:{email:\'info@peekskilltree.com\',name:\'Branch Manager\'},subject:\'Test Email\',content:[{type:\'text/plain\',value:\'SendGrid is connected!\'}]})}).then(function(r){UI.toast(r.ok||r.status===202?\'Test sent! Check info@peekskilltree.com\':\'Failed: \'+r.status,r.ok||r.status===202?\'success\':\'error\');})}" style="background:#1a82e2;color:#fff;border:none;padding:10px 20px;border-radius:6px;font-weight:700;font-size:14px;cursor:pointer;">Send Test Email</button>' : '')
      + (sgOk ? '<button onclick="localStorage.removeItem(\'bm-sendgrid-key\');UI.toast(\'Key removed\');loadPage(\'settings\');" style="background:none;border:1px solid var(--border);padding:10px 20px;border-radius:6px;font-size:13px;cursor:pointer;">Remove</button>' : '')
      + '</div>'
      + '<p style="font-size:11px;color:var(--text-light);margin-top:8px;">Enables: automated quote follow-ups, invoice reminders, visit reminders, review requests. Free: 100 emails/day.</p>'
      + '</div>';

    // Claude AI Assistant
    var aiKey = localStorage.getItem('bm-claude-key') || '';
    var aiOk = aiKey.length > 10;
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:2px solid ' + (aiOk ? 'var(--green-light)' : 'var(--border)') + ';margin-bottom:16px;">'
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">'
      + '<div style="width:40px;height:40px;background:linear-gradient(135deg,#D4A574,#C4956A);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px;">🤖</div>'
      + '<div><h3 style="margin:0;">Claude AI Assistant</h3>'
      + '<div style="font-size:12px;color:' + (aiOk ? 'var(--green-dark)' : '#e07c24') + ';font-weight:600;">' + (aiOk ? '✅ Connected — AI estimates & emails active' : '⚠️ Not connected — paste your Anthropic API key') + '</div>'
      + '</div></div>'
      + '<div style="margin-bottom:8px;"><input type="password" id="claude-ai-key" value="' + aiKey + '" placeholder="sk-ant-api03-..." style="width:100%;padding:10px;border:2px solid ' + (aiOk ? 'var(--green-light)' : 'var(--border)') + ';border-radius:8px;font-size:14px;box-sizing:border-box;"></div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
      + '<button onclick="var k=document.getElementById(\'claude-ai-key\').value.trim();if(!k){UI.toast(\'Paste your key first\',\'error\');return;}localStorage.setItem(\'bm-claude-key\',k);if(typeof AI!==\'undefined\'){AI._apiKey=k;}UI.toast(\'Claude AI connected! ✅\');loadPage(\'settings\');" style="background:var(--green-dark);color:#fff;border:none;padding:10px 20px;border-radius:6px;font-weight:700;font-size:14px;cursor:pointer;">Save Key</button>'
      + (aiOk ? '<button onclick="localStorage.removeItem(\'bm-claude-key\');UI.toast(\'Key removed\');loadPage(\'settings\');" style="background:none;border:1px solid var(--border);padding:10px 20px;border-radius:6px;font-size:13px;cursor:pointer;">Remove</button>' : '')
      + '</div>'
      + '<p style="font-size:11px;color:var(--text-light);margin-top:8px;">Get your key at console.anthropic.com → API Keys → Create Key (free tier available)</p>'
      + '</div>';

    // Photo Storage info
    html += '<div style="background:#f0f7ff;border-radius:12px;padding:14px 18px;border:1px solid #b3d4f5;margin-bottom:16px;display:flex;align-items:center;gap:12px;">'
      + '<span style="font-size:22px;">📸</span>'
      + '<div style="font-size:13px;color:#1a5276;">'
      + '<strong>Photo Storage</strong> — Uses Supabase Storage bucket <code style="background:#d6eaf8;padding:1px 5px;border-radius:4px;">job-photos</code>. Run the RLS SQL below (Database Connection section) to create the bucket and enable photo uploads on jobs.'
      + '</div></div>';

    // Stripe Payments
    if (typeof Stripe !== 'undefined' && Stripe.renderSettings) {
      html += Stripe.renderSettings();
    } else {
      html += '<div style="padding:12px;color:var(--text-light);font-size:13px;">Stripe integration not loaded.</div>';
    }

    // Dialpad Calling & SMS
    if (typeof Dialpad !== 'undefined' && Dialpad.renderSettings) {
      html += Dialpad.renderSettings();
    } else {
      html += '<div style="padding:12px;color:var(--text-light);font-size:13px;">Dialpad integration not loaded.</div>';
    }

    // SendJim Direct Mail
    if (typeof SendJim !== 'undefined' && SendJim.renderSettings) {
      html += SendJim.renderSettings();
    } else {
      html += '<div style="padding:12px;color:var(--text-light);font-size:13px;">SendJim integration not loaded.</div>';
    }

    // Custom Fields
    if (typeof CustomFields !== 'undefined') {
      html += CustomFields.renderSettings();
    }

    // Checklist Templates
    if (typeof Checklists !== 'undefined') {
      html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
        + Checklists.renderTemplateManager()
        + '</div>';
    }

    // Email Templates
    if (typeof EmailTemplates !== 'undefined') {
      html += EmailTemplates.renderSettings();
    }

    // Crew Performance link
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;">'
      + '<div><h3 style="margin-bottom:4px;">Crew Performance</h3>'
      + '<p style="font-size:13px;color:var(--text-light);margin:0;">View crew metrics, leaderboards, and productivity stats</p></div>'
      + '<button class="btn btn-outline" onclick="loadPage(\'crewperformance\')">View Dashboard →</button>'
      + '</div></div>';

    // Sync from Cloud
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;">'
      + '<div><h3 style="margin-bottom:4px;">Cloud Sync</h3>'
      + '<p style="font-size:13px;color:var(--text-light);margin:0;">Pull latest data from Supabase to this device</p></div>'
      + '<button class="btn btn-primary" onclick="SettingsPage.syncNow(this)">Sync Now</button>'
      + '</div></div>';

    // Supabase Connection
    var isConnected = (typeof SupabaseDB !== 'undefined' && SupabaseDB.ready) || stats.totalClients > 100;
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="margin-bottom:8px;">Database Connection</h3>';
    if (isConnected) {
      html += '<div style="display:inline-block;padding:6px 12px;background:#e8f5e9;border-radius:8px;font-size:13px;font-weight:600;color:#2e7d32;margin-bottom:12px;">Connected to Supabase</div>'
        + '<p style="font-size:13px;color:var(--text-light);margin-bottom:12px;">Project: ltpivkqahvplapyagljt (West US Oregon)</p>'
        + '<details style="margin-top:8px;"><summary style="cursor:pointer;font-size:13px;font-weight:600;color:var(--green-dark);margin-bottom:8px;">🔒 Client-facing RLS Policies (required for approve.html &amp; pay.html)</summary>'
        + '<p style="font-size:12px;color:var(--text-light);margin-bottom:8px;">Run this SQL once in your <a href="https://supabase.com/dashboard/project/ltpivkqahvplapyagljt/sql" target="_blank" style="color:var(--green-dark);">Supabase SQL Editor</a> to allow clients to view &amp; approve quotes and pay invoices:</p>'
        + '<pre style="background:#1e2128;color:#a8d8a8;padding:14px;border-radius:8px;font-size:11px;overflow:auto;white-space:pre;line-height:1.6;">'
        + '-- Safe to re-run: drops existing policies first\n'
        + 'DROP POLICY IF EXISTS "Anon read quotes" ON quotes;\n'
        + 'DROP POLICY IF EXISTS "Anon update quote status" ON quotes;\n'
        + 'DROP POLICY IF EXISTS "Anon read invoices" ON invoices;\n'
        + 'DROP POLICY IF EXISTS "Anon read clients" ON clients;\n'
        + 'DROP POLICY IF EXISTS "Anon insert requests" ON requests;\n\n'
        + '-- Allow anonymous clients to read non-draft quotes (for approve.html)\n'
        + 'CREATE POLICY "Anon read quotes"\n'
        + '  ON quotes FOR SELECT TO anon\n'
        + '  USING (status &lt;&gt; \'draft\');\n\n'
        + '-- Allow anonymous clients to approve/request changes on sent quotes\n'
        + 'CREATE POLICY "Anon update quote status"\n'
        + '  ON quotes FOR UPDATE TO anon\n'
        + '  USING (status IN (\'sent\', \'awaiting\'))\n'
        + '  WITH CHECK (status IN (\'approved\', \'awaiting\'));\n\n'
        + '-- Allow anonymous clients to read non-draft invoices (for pay.html)\n'
        + 'CREATE POLICY "Anon read invoices"\n'
        + '  ON invoices FOR SELECT TO anon\n'
        + '  USING (status &lt;&gt; \'draft\');\n\n'
        + '-- Allow anonymous clients to read client portal data (for client.html)\n'
        + 'CREATE POLICY "Anon read clients"\n'
        + '  ON clients FOR SELECT TO anon\n'
        + '  USING (true);\n\n'
        + '-- Allow anonymous form submissions (for book.html)\n'
        + 'CREATE POLICY "Anon insert requests"\n'
        + '  ON requests FOR INSERT TO anon\n'
        + '  WITH CHECK (true);\n\n'
        + '-- Storage bucket for job photos\n'
        + 'INSERT INTO storage.buckets (id, name, public)\n'
        + 'VALUES (\'job-photos\', \'job-photos\', true)\n'
        + 'ON CONFLICT (id) DO NOTHING;\n\n'
        + '-- Allow public read of job photos\n'
        + 'DROP POLICY IF EXISTS "Public read job photos" ON storage.objects;\n'
        + 'CREATE POLICY "Public read job photos" ON storage.objects\n'
        + '  FOR SELECT USING (bucket_id = \'job-photos\');\n\n'
        + '-- Allow authenticated/anon insert to job-photos\n'
        + 'DROP POLICY IF EXISTS "Anon upload job photos" ON storage.objects;\n'
        + 'CREATE POLICY "Anon upload job photos" ON storage.objects\n'
        + '  FOR INSERT WITH CHECK (bucket_id = \'job-photos\');\n\n'
        + '-- Allow delete own photos\n'
        + 'DROP POLICY IF EXISTS "Anon delete job photos" ON storage.objects;\n'
        + 'CREATE POLICY "Anon delete job photos" ON storage.objects\n'
        + '  FOR DELETE USING (bucket_id = \'job-photos\');</pre>'
        + '<button onclick="SettingsPage._copyRlsSql()" style="margin-top:8px;padding:6px 14px;background:var(--green-dark);color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;">Copy SQL</button>'
        + '</details>'
        + '<details style="margin-top:8px;"><summary style="cursor:pointer;font-size:13px;font-weight:600;color:var(--green-dark);margin-bottom:8px;">🗄️ Add Missing Columns (run once on live DB)</summary>'
        + '<p style="font-size:12px;color:var(--text-light);margin-bottom:8px;">If your Supabase tables were created before these columns were added, run this SQL to add them (safe — IF NOT EXISTS means it won\'t fail if already present):</p>'
        + '<pre style="background:#1e2128;color:#a8d8a8;padding:14px;border-radius:8px;font-size:11px;overflow:auto;white-space:pre;line-height:1.6;">'
        + '-- Invoices\n'
        + 'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_email TEXT;\n'
        + 'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_phone TEXT;\n'
        + 'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0;\n'
        + 'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issued_date DATE;\n'
        + 'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_url TEXT;\n'
        + 'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_link_sent TIMESTAMPTZ;\n'
        + 'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_link_email TEXT;\n'
        + 'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;\n\n'
        + '-- Jobs\n'
        + 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_email TEXT;\n'
        + 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_phone TEXT;\n'
        + 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS invoice_id TEXT;\n'
        + 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completed_date DATE;\n\n'
        + '-- Quotes\n'
        + 'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_email TEXT;\n'
        + 'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_phone TEXT;\n'
        + 'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS expires_at DATE;\n'
        + 'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN DEFAULT false;\n'
        + 'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deposit_due DECIMAL(10,2) DEFAULT 0;\n'
        + 'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT false;\n'
        + 'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;\n'
        + 'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_changes TEXT;</pre>'
        + '<button onclick="SettingsPage._copyColumnSql()" style="margin-top:8px;padding:6px 14px;background:var(--green-dark);color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;">Copy SQL</button>'
        + '</details>'
        + '<details style="margin-top:8px;"><summary style="cursor:pointer;font-size:13px;font-weight:600;color:var(--green-dark);margin-bottom:8px;">💸 Create Expenses Table (run once)</summary>'
        + '<p style="font-size:12px;color:var(--text-light);margin-bottom:8px;">If you haven\'t run the full schema yet, run this to create the expenses table and enable cloud sync for expenses:</p>'
        + '<pre id="expenses-sql-block" style="background:#1e2128;color:#a8d8a8;padding:14px;border-radius:8px;font-size:11px;overflow:auto;white-space:pre;line-height:1.6;">'
        + 'CREATE TABLE IF NOT EXISTS expenses (\n'
        + '  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n'
        + '  date TIMESTAMPTZ DEFAULT now(),\n'
        + '  amount NUMERIC(10,2) DEFAULT 0,\n'
        + '  category TEXT,\n'
        + '  description TEXT,\n'
        + '  vendor TEXT,\n'
        + '  job TEXT,\n'
        + '  job_id TEXT,\n'
        + '  receipt_url TEXT,\n'
        + '  notes TEXT,\n'
        + '  employee TEXT,\n'
        + '  created_at TIMESTAMPTZ DEFAULT now(),\n'
        + '  updated_at TIMESTAMPTZ DEFAULT now()\n'
        + ');\n\n'
        + 'ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;\n\n'
        + 'DROP POLICY IF EXISTS "Allow all for authenticated" ON expenses;\n'
        + 'CREATE POLICY "Allow all for authenticated"\n'
        + '  ON expenses FOR ALL\n'
        + '  USING (true);\n\n'
        + 'CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);\n'
        + 'CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);</pre>'
        + '<button onclick="SettingsPage._copyExpensesSql()" style="margin-top:8px;padding:6px 14px;background:var(--green-dark);color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;">Copy SQL</button>'
        + '</details>';
    } else {
      html += '<p style="font-size:13px;color:var(--text-light);margin-bottom:16px;">Connect to Supabase for cloud sync, multi-device access, and team features.</p>'
        + '<div style="display:inline-block;padding:6px 12px;background:#fff3e0;border-radius:8px;font-size:13px;font-weight:600;color:#e65100;margin-bottom:12px;">Local Storage Mode — data lives on this device only</div>'
        + UI.formField('Supabase URL', 'text', 'sb-url', '', { placeholder: 'https://your-project.supabase.co' })
        + UI.formField('Supabase Anon Key', 'text', 'sb-key', '', { placeholder: 'eyJhbGciOiJIUzI1NiIs...' })
        + '<button class="btn btn-primary" onclick="SettingsPage.connectSupabase()">Connect to Supabase</button>';
    }
    html += '</div>';

    // Import from Jobber
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="margin-bottom:8px;">Import from Jobber</h3>'
      + '<p style="font-size:13px;color:var(--text-light);margin-bottom:16px;">Export CSVs from Jobber (Clients → More Actions → Export) and import them here.</p>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      + '<div>'
      + '<label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;">Clients CSV</label>'
      + '<input type="file" id="import-clients" accept=".csv" onchange="SettingsPage.importFile(\'clients\', this)">'
      + '</div>'
      + '<div>'
      + '<label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;">Jobs CSV</label>'
      + '<input type="file" id="import-jobs" accept=".csv" onchange="SettingsPage.importFile(\'jobs\', this)">'
      + '</div>'
      + '<div>'
      + '<label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;">Invoices CSV</label>'
      + '<input type="file" id="import-invoices" accept=".csv" onchange="SettingsPage.importFile(\'invoices\', this)">'
      + '</div>'
      + '<div>'
      + '<label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;">Quotes CSV</label>'
      + '<input type="file" id="import-quotes" accept=".csv" onchange="SettingsPage.importFile(\'quotes\', this)">'
      + '</div>'
      + '</div>'
      + '<div id="import-status" style="margin-top:12px;font-size:13px;color:var(--green-dark);"></div>'
      + '</div>';

    // Data Management
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid #ffcdd2;margin-bottom:16px;">'
      + '<h3 style="color:var(--red);margin-bottom:8px;">Data Management</h3>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">'
      + '<button class="btn btn-outline" onclick="SettingsPage.deduplicateTags()">Fix Duplicate Tags</button>'
      + '<button class="btn btn-outline" onclick="SettingsPage.resetDemo()">Reset to Demo Data</button>'
      + '<button class="btn" style="background:var(--red);color:#fff;" onclick="SettingsPage.clearAll()">Clear All Data</button>'
      + '</div>'
      + '<div style="font-size:12px;color:var(--text-light);">"Fix Duplicate Tags" removes duplicate tags from imported client records (e.g., [VIP, VIP] → [VIP]).</div>'
      + '</div>';

    // About
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="margin-bottom:12px;">About Branch Manager</h3>'
      + '<div style="font-size:13px;color:var(--text-light);line-height:1.8;">'
      + '<div><strong>Version:</strong> 2.0.0</div>'
      + '<div><strong>Pages:</strong> 50 modules</div>'
      + '<div><strong>Stack:</strong> Vanilla JS + Supabase + Stripe + MapLibre</div>'
      + '<div><strong>Storage:</strong> localStorage + Supabase cloud sync</div>'
      + '<div><strong>PWA:</strong> Installable, offline capable</div>'
      + '<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);font-size:12px;">Built for Second Nature Tree Service. Replaces Jobber ($50-130/mo) with a $0/mo custom solution.</div>'
      + '</div></div>';

    html += '</div>';
    return html;
  },

  connectSupabase: function() {
    var url = document.getElementById('sb-url').value.trim();
    var key = document.getElementById('sb-key').value.trim();
    if (!url || !key) { UI.toast('Enter both Supabase URL and Key', 'error'); return; }
    // Save config
    localStorage.setItem('bm-supabase-url', url);
    localStorage.setItem('bm-supabase-key', key);
    UI.toast('Supabase config saved. Reload to connect.');
  },

  importFile: function(type, input) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
      var csv = e.target.result;
      var count = 0;
      var statusEl = document.getElementById('import-status');

      if (type === 'clients') {
        count = DB.importCSV(DB.KEYS.clients, csv, function(row) {
          return {
            name: (row['First name'] || row['Name'] || '') + (row['Last name'] ? ' ' + row['Last name'] : ''),
            company: row['Company name'] || row['Company'] || '',
            phone: row['Phone number'] || row['Phone'] || '',
            email: row['Email'] || row['Email address'] || '',
            address: [row['Street 1'] || row['Street'] || '', row['City'] || '', row['State'] || row['Province'] || '', row['Zip code'] || row['Postal code'] || ''].filter(Boolean).join(', '),
            status: (row['Status'] || 'active').toLowerCase(),
            tags: row['Tags'] ? row['Tags'].split(',').map(function(t){return t.trim();}) : []
          };
        });
      } else if (type === 'jobs') {
        count = DB.importCSV(DB.KEYS.jobs, csv, function(row) {
          return {
            clientName: row['Client name'] || row['Client'] || '',
            jobNumber: parseInt(row['Job number'] || row['#'] || 0),
            property: row['Property'] || row['Address'] || '',
            description: row['Title'] || row['Description'] || '',
            scheduledDate: row['Start date'] || row['Schedule'] || '',
            status: (row['Status'] || 'scheduled').toLowerCase(),
            total: parseFloat(row['Total'] || 0)
          };
        });
      } else if (type === 'invoices') {
        count = DB.importCSV(DB.KEYS.invoices, csv, function(row) {
          return {
            clientName: row['Client name'] || row['Client'] || '',
            invoiceNumber: parseInt(row['Invoice number'] || row['#'] || 0),
            subject: row['Subject'] || 'For Services Rendered',
            dueDate: row['Due date'] || '',
            status: (row['Status'] || 'draft').toLowerCase(),
            total: parseFloat(row['Total'] || 0),
            balance: parseFloat(row['Balance'] || row['Amount owing'] || 0)
          };
        });
      } else if (type === 'quotes') {
        count = DB.importCSV(DB.KEYS.quotes, csv, function(row) {
          return {
            clientName: row['Client name'] || row['Client'] || '',
            quoteNumber: parseInt(row['Quote number'] || row['#'] || 0),
            property: row['Property'] || row['Address'] || '',
            status: (row['Status'] || 'draft').toLowerCase(),
            total: parseFloat(row['Total'] || 0)
          };
        });
      }

      if (statusEl) statusEl.textContent = 'Imported ' + count + ' ' + type + ' from CSV.';
      UI.toast(count + ' ' + type + ' imported');
      loadPage('settings');
    };
    reader.readAsText(file);
  },

  resetDemo: function() {
    UI.confirm('Reset all data to demo? This will erase current data.', function() {
      Object.values(DB.KEYS).forEach(function(k) { localStorage.removeItem(k); });
      DB.seedDemo();
      UI.toast('Demo data restored');
      loadPage('settings');
    });
  },

  clearAll: function() {
    UI.confirm('Delete ALL data? This cannot be undone.', function() {
      Object.values(DB.KEYS).forEach(function(k) { localStorage.removeItem(k); });
      UI.toast('All data cleared');
      loadPage('settings');
    });
  },

  syncNow: async function(btn) {
    if (btn) { btn.textContent = 'Syncing...'; btn.disabled = true; }
    if (typeof DashboardPage !== 'undefined' && DashboardPage.syncNow) {
      await DashboardPage.syncNow();
    } else if (typeof SupabaseDB !== 'undefined' && SupabaseDB.resync) {
      await SupabaseDB.resync();
    } else {
      // Direct fetch fallback
      var url = 'https://ltpivkqahvplapyagljt.supabase.co';
      var key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cGl2a3FhaHZwbGFweWFnbGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTgxNzIsImV4cCI6MjA4OTY3NDE3Mn0.bQ-wAx4Uu-FyA2ZwsTVfFoU2ZPbeWCmupqV-6ZR9uFI';
      var tables = [
        {local:'bm-clients',remote:'clients'},{local:'bm-jobs',remote:'jobs'},
        {local:'bm-invoices',remote:'invoices'},{local:'bm-quotes',remote:'quotes'},
        {local:'bm-services',remote:'services'},{local:'bm-team',remote:'team_members'}
      ];
      var total = 0;
      for (var t of tables) {
        try {
          var resp = await fetch(url+'/rest/v1/'+t.remote+'?select=*&limit=5000&order=created_at.desc',{
            headers:{'apikey':key,'Authorization':'Bearer '+key}
          });
          var data = await resp.json();
          if (data && data.length) {
            var conv = data.map(function(row) {
              var n = {};
              Object.keys(row).forEach(function(k) {
                n[k.replace(/_([a-z])/g,function(m,p){return p.toUpperCase();})] = row[k];
              });
              return n;
            });
            localStorage.setItem(t.local, JSON.stringify(conv));
            total += conv.length;
          }
        } catch(e) {}
      }
      UI.toast(total + ' records synced from cloud!');
    }
    if (btn) { btn.textContent = 'Sync Now'; btn.disabled = false; }
    loadPage('settings');
  },

  deduplicateTags: function() {
    var clients = JSON.parse(localStorage.getItem('bm-clients') || '[]');
    var fixed = 0;
    clients.forEach(function(c) {
      if (!c.tags || !c.tags.length) return;
      var seen = {};
      var uniq = c.tags.filter(function(t) {
        var k = (t || '').toLowerCase();
        return k && (seen[k] ? false : (seen[k] = true));
      });
      if (uniq.length < c.tags.length) { c.tags = uniq; fixed++; }
    });
    localStorage.setItem('bm-clients', JSON.stringify(clients));
    UI.toast('Fixed ' + fixed + ' client' + (fixed !== 1 ? 's' : '') + ' with duplicate tags');
    loadPage('settings');
  },

  _copyRlsSql: function() {
    var sql = '-- Safe to re-run: drops existing policies first\n'
      + 'DROP POLICY IF EXISTS "Anon read quotes" ON quotes;\n'
      + 'DROP POLICY IF EXISTS "Anon update quote status" ON quotes;\n'
      + 'DROP POLICY IF EXISTS "Anon read invoices" ON invoices;\n'
      + 'DROP POLICY IF EXISTS "Anon read clients" ON clients;\n'
      + 'DROP POLICY IF EXISTS "Anon insert requests" ON requests;\n\n'
      + 'CREATE POLICY "Anon read quotes" ON quotes FOR SELECT TO anon USING (status <> \'draft\');\n\n'
      + 'CREATE POLICY "Anon update quote status" ON quotes FOR UPDATE TO anon USING (status IN (\'sent\', \'awaiting\')) WITH CHECK (status IN (\'approved\', \'awaiting\'));\n\n'
      + 'CREATE POLICY "Anon read invoices" ON invoices FOR SELECT TO anon USING (status <> \'draft\');\n\n'
      + 'CREATE POLICY "Anon read clients" ON clients FOR SELECT TO anon USING (true);\n\n'
      + 'CREATE POLICY "Anon insert requests" ON requests FOR INSERT TO anon WITH CHECK (true);\n\n'
      + '-- Storage bucket for job photos\n'
      + 'INSERT INTO storage.buckets (id, name, public)\n'
      + 'VALUES (\'job-photos\', \'job-photos\', true)\n'
      + 'ON CONFLICT (id) DO NOTHING;\n\n'
      + '-- Allow public read of job photos\n'
      + 'DROP POLICY IF EXISTS "Public read job photos" ON storage.objects;\n'
      + 'CREATE POLICY "Public read job photos" ON storage.objects\n'
      + '  FOR SELECT USING (bucket_id = \'job-photos\');\n\n'
      + '-- Allow authenticated/anon insert to job-photos\n'
      + 'DROP POLICY IF EXISTS "Anon upload job photos" ON storage.objects;\n'
      + 'CREATE POLICY "Anon upload job photos" ON storage.objects\n'
      + '  FOR INSERT WITH CHECK (bucket_id = \'job-photos\');\n\n'
      + '-- Allow delete own photos\n'
      + 'DROP POLICY IF EXISTS "Anon delete job photos" ON storage.objects;\n'
      + 'CREATE POLICY "Anon delete job photos" ON storage.objects\n'
      + '  FOR DELETE USING (bucket_id = \'job-photos\');';
    navigator.clipboard.writeText(sql).then(function() { UI.toast('RLS SQL copied!'); });
  },

  _copyColumnSql: function() {
    var sql = 'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_email TEXT;\n'
      + 'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_phone TEXT;\n'
      + 'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0;\n'
      + 'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issued_date DATE;\n'
      + 'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_url TEXT;\n'
      + 'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_link_sent TIMESTAMPTZ;\n'
      + 'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_link_email TEXT;\n'
      + 'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;\n'
      + 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_email TEXT;\n'
      + 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_phone TEXT;\n'
      + 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS invoice_id TEXT;\n'
      + 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completed_date DATE;\n'
      + 'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_email TEXT;\n'
      + 'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_phone TEXT;\n'
      + 'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS expires_at DATE;\n'
      + 'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN DEFAULT false;\n'
      + 'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deposit_due DECIMAL(10,2) DEFAULT 0;\n'
      + 'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT false;\n'
      + 'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;\n'
      + 'ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_changes TEXT;';
    navigator.clipboard.writeText(sql).then(function() { UI.toast('Column SQL copied!'); });
  },

  _copyExpensesSql: function() {
    var el = document.getElementById('expenses-sql-block');
    var sql = el ? el.textContent : '';
    navigator.clipboard.writeText(sql).then(function() { UI.toast('Expenses SQL copied — paste into Supabase SQL Editor!'); });
  },

  saveCompany: function() {
    var fields = ['name','phone','email','address','licenses','website'];
    fields.forEach(function(f) {
      var el = document.getElementById('co-' + f);
      if (el) localStorage.setItem('bm-co-' + f, el.value.trim());
    });
    var taxEl = document.getElementById('co-tax-rate');
    if (taxEl) localStorage.setItem('bm-tax-rate', parseFloat(taxEl.value) || 0);
    UI.toast('Company info saved ✅');
  },

  addService: function() {
    UI.showModal('Add Service / Product', '<form id="svc-form" onsubmit="SettingsPage._saveService(event, null)">'
      + UI.formField('Name *', 'text', 'svc-name', '', { placeholder: 'e.g. Tree Removal' })
      + UI.formField('Description', 'textarea', 'svc-desc', '', { placeholder: 'Short description shown on quotes' })
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      + '<div><label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Type</label>'
      + '<select id="svc-type" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:14px;">'
      + '<option value="service">Service</option><option value="product">Product</option></select></div>'
      + UI.formField('Default Price ($)', 'number', 'svc-price', '', { placeholder: '0.00' })
      + '</div></form>', {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-primary" onclick="SettingsPage._saveService(null, null)">Add</button>'
    });
  },

  editService: function(id) {
    var svc = DB.services.getAll().find(function(s) { return s.id === id; });
    if (!svc) return;
    UI.showModal('Edit Service', '<form id="svc-form">'
      + UI.formField('Name *', 'text', 'svc-name', svc.name)
      + UI.formField('Description', 'textarea', 'svc-desc', svc.description || '')
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      + '<div><label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Type</label>'
      + '<select id="svc-type" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:14px;">'
      + '<option value="service"' + (svc.type !== 'product' ? ' selected' : '') + '>Service</option>'
      + '<option value="product"' + (svc.type === 'product' ? ' selected' : '') + '>Product</option></select></div>'
      + UI.formField('Default Price ($)', 'number', 'svc-price', svc.price || '')
      + '</div></form>', {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn" style="background:var(--red);color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;" onclick="DB.services.remove(\'' + id + '\');UI.closeModal();loadPage(\'settings\');">Delete</button>'
        + ' <button class="btn btn-primary" onclick="SettingsPage._saveService(null, \'' + id + '\')">Save</button>'
    });
  },

  _saveService: function(e, id) {
    if (e) e.preventDefault();
    var name = (document.getElementById('svc-name') || {}).value;
    if (!name || !name.trim()) { UI.toast('Name is required', 'error'); return; }
    var data = {
      name: name.trim(),
      description: ((document.getElementById('svc-desc') || {}).value || '').trim(),
      type: ((document.getElementById('svc-type') || {}).value) || 'service',
      price: parseFloat(((document.getElementById('svc-price') || {}).value) || 0) || 0
    };
    if (id) { DB.services.update(id, data); UI.toast('Service updated'); }
    else { DB.services.create(data); UI.toast('Service added'); }
    UI.closeModal();
    loadPage('settings');
  }
};

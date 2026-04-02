/**
 * Branch Manager — New Request Notification
 * Supabase Edge Function
 *
 * Called by book.html after a customer submits a service request.
 * Sends notification email to info@peekskilltree.com (Team)
 * and confirmation email to customer.
 *
 * Deploy:
 *   supabase functions deploy request-notify --no-verify-jwt
 *
 * Set secrets:
 *   supabase secrets set SENDGRID_API_KEY=SG...
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') ?? '';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };

async function sendEmail(to: string, toName: string, subject: string, text: string, html?: string) {
  if (!SENDGRID_API_KEY) return;
  const body: any = {
    personalizations: [{ to: [{ email: to, name: toName }] }],
    from: { email: 'info@peekskilltree.com', name: 'Second Nature Tree Service' },
    reply_to: { email: 'info@peekskilltree.com', name: 'Second Nature Tree Service' },
    subject,
    content: [{ type: 'text/plain', value: text }]
  };
  if (html) body.content.push({ type: 'text/html', value: html });

  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const data = await req.json();
    const { name, phone, email, address, service, details } = data;

    // 1. Notify the team
    const teamSubject = `🌳 New request — ${service || 'Service'} — ${name}`;
    const teamBody = `New service request submitted via website.

Name:    ${name || '—'}
Phone:   ${phone || '—'}
Email:   ${email || '—'}
Address: ${address || '—'}
Service: ${service || '—'}
Details: ${details || '—'}

View in Branch Manager:
https://peekskilltree.com/branchmanager/

Call or text to follow up:
https://sms.link/?body=Hi+${encodeURIComponent((name || '').split(' ')[0] || 'there')}%2C+this+is+Doug+from+Second+Nature+Tree+Service.+Thanks+for+reaching+out%21&phone=${encodeURIComponent(phone || '')}`;

    await sendEmail('info@peekskilltree.com', 'Team', teamSubject, teamBody);

    // 2. Confirm to customer (if email provided)
    if (email) {
      const firstName = (name || '').split(' ')[0] || 'there';
      const custSubject = 'We received your request — Second Nature Tree Service';
      const custText = `Hi ${firstName},

Thanks for reaching out! We received your request for ${service || 'tree service'} at ${address || 'your property'}.

We typically respond within 2 hours during business hours. We'll call or text you at ${phone || 'the number you provided'} to set up a free estimate.

Questions? Reply to this email or call/text (914) 391-5233.

— Doug & Catherine
Second Nature Tree Service
Peekskill, NY · Licensed & Insured · WC-32079 / PC-50644
peekskilltree.com`;

      const custHtml = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;">
  <div style="background:#1a3c12;padding:24px 28px;border-radius:10px 10px 0 0;">
    <div style="color:#fff;font-size:22px;font-weight:800;">🌳 Second Nature Tree Service</div>
    <div style="color:rgba(255,255,255,.8);font-size:13px;margin-top:4px;">Peekskill, NY · (914) 391-5233</div>
  </div>
  <div style="background:#fff;padding:28px;border:1px solid #e8e8e8;border-radius:0 0 10px 10px;">
    <h2 style="color:#1a3c12;font-size:20px;margin:0 0 12px;">Request Received! ✅</h2>
    <p style="color:#444;font-size:15px;line-height:1.6;">Hi ${firstName},</p>
    <p style="color:#444;font-size:15px;line-height:1.6;">Thanks for reaching out! We got your request for <strong>${service || 'tree service'}</strong> at <strong>${address || 'your property'}</strong>.</p>
    <div style="background:#f0f7f0;border-left:3px solid #1a3c12;border-radius:0 8px 8px 0;padding:14px 16px;margin:16px 0;font-size:14px;color:#333;">
      We typically respond within <strong>2 hours</strong> during business hours.<br>
      We'll reach out at <strong>${phone || 'the number you provided'}</strong> to schedule your free estimate.
    </div>
    <p style="color:#444;font-size:15px;line-height:1.6;">Questions? Reply to this email or call/text us directly:</p>
    <a href="tel:9143915233" style="display:inline-block;background:#1a3c12;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;margin-top:4px;">📞 (914) 391-5233</a>
    <p style="color:#888;font-size:12px;margin-top:24px;border-top:1px solid #eee;padding-top:16px;">Second Nature Tree Service · Peekskill, NY · Licensed & Insured · WC-32079 / PC-50644</p>
  </div>
</div>`;

      await sendEmail(email, firstName, custSubject, custText, custHtml);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('request-notify error:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
});

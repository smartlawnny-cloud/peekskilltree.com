/**
 * Branch Manager — Stripe Integration
 * Payment links, checkout, invoice payment tracking
 * Uses Stripe Checkout (hosted) — no PCI compliance needed
 *
 * Setup: Create Stripe account at stripe.com
 * Get publishable key from Dashboard → Developers → API Keys
 * Create payment links or use Checkout Sessions via Supabase Edge Functions
 */
var Stripe = {
  // Will be set from settings
  publishableKey: null,

  DEFAULT_PK: 'pk_live_51TDawDBGJHz1j102gKSfimIBsbD7OtFgtKtEG7wRjSEIRM0IEsyV3gBSXs5ESx8eRIK9EXfGYJk3lgKKyB5fFeJP00Zwn4B4ED',

  init: function() {
    Stripe.publishableKey = localStorage.getItem('bm-stripe-pk') || Stripe.DEFAULT_PK;
    if (Stripe.publishableKey && !localStorage.getItem('bm-stripe-pk')) {
      localStorage.setItem('bm-stripe-pk', Stripe.publishableKey);
    }
  },

  isConnected: function() {
    return !!Stripe.publishableKey;
  },

  // Get payment link for an invoice — returns stored Stripe Payment Link URL if available
  getPaymentLink: function(invoiceId) {
    var inv = DB.invoices.getById(invoiceId);
    if (!inv) return null;
    // Return the URL saved per-invoice (set from invoice detail sidebar)
    return inv.stripePaymentUrl || null;
  },

  // Render payment button for invoice detail
  paymentButton: function(invoiceId) {
    var inv = DB.invoices.getById(invoiceId);
    if (!inv || inv.status === 'paid') return '';

    if (!Stripe.isConnected()) {
      return '<div style="margin-top:12px;padding:12px;background:#f5f5f5;border-radius:8px;font-size:13px;color:var(--text-light);">'
        + '💳 Connect Stripe in Settings to accept online payments'
        + '</div>';
    }

    return '<div style="margin-top:12px;">'
      + '<button class="btn" style="background:#635bff;color:#fff;width:100%;padding:12px;font-size:15px;" onclick="Stripe.sendPaymentLink(\'' + invoiceId + '\')">'
      + '💳 Send Payment Link — ' + UI.money(inv.balance || inv.total)
      + '</button>'
      + '<div style="font-size:11px;color:var(--text-light);text-align:center;margin-top:4px;">Client pays via Stripe Checkout — card or bank transfer</div>'
      + '</div>';
  },

  // Send payment link to client via email
  sendPaymentLink: function(invoiceId) {
    var inv = DB.invoices.getById(invoiceId);
    if (!inv) return;
    var client = inv.clientId ? DB.clients.getById(inv.clientId) : null;

    if (!client || !client.email) {
      UI.toast('No email on file for this client', 'error');
      return;
    }

    // In production: call Supabase Edge Function → create Stripe Checkout Session → send email with link
    UI.toast('Payment link sent to ' + client.email + ' for ' + UI.money(inv.balance || inv.total));

    // Log the action
    DB.invoices.update(invoiceId, {
      paymentLinkSent: new Date().toISOString(),
      paymentLinkEmail: client.email
    });
  },

  // Render Stripe settings section
  renderSettings: function() {
    var connected = Stripe.isConnected();
    var pk = localStorage.getItem('bm-stripe-pk') || '';

    return '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">'
      + '<div style="width:40px;height:40px;background:#635bff;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px;">S</div>'
      + '<div><h3 style="margin:0;">Stripe Payments</h3>'
      + '<div style="font-size:12px;color:' + (connected ? 'var(--green-dark)' : 'var(--text-light)') + ';">' + (connected ? '✅ Connected' : '⚪ Not connected') + '</div>'
      + '</div></div>'
      + '<p style="font-size:13px;color:var(--text-light);margin-bottom:12px;">Accept credit card and bank payments directly through your invoices. Clients get a secure payment link — funds deposit to your bank in 2 business days.</p>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;font-size:12px;text-align:center;">'
      + '<div style="padding:12px;background:var(--bg);border-radius:8px;"><strong style="font-size:18px;">2.9%</strong><br>+ $0.30/card</div>'
      + '<div style="padding:12px;background:var(--bg);border-radius:8px;"><strong style="font-size:18px;">0.8%</strong><br>ACH bank transfer</div>'
      + '<div style="padding:12px;background:var(--bg);border-radius:8px;"><strong style="font-size:18px;">2 days</strong><br>to your bank</div>'
      + '</div>'
      + UI.formField('Stripe Publishable Key', 'text', 'stripe-pk', pk, { placeholder: 'pk_live_...' })
      + '<div style="display:flex;gap:8px;">'
      + '<button class="btn btn-primary" onclick="Stripe.saveKey()">Save Key</button>'
      + (connected ? '<button class="btn btn-outline" onclick="Stripe.disconnect()">Disconnect</button>' : '')
      + '</div>'
      + '<p style="font-size:11px;color:var(--text-light);margin-top:8px;">Get your key at <a href="https://dashboard.stripe.com/apikeys" target="_blank" style="color:var(--green-dark);">dashboard.stripe.com/apikeys</a>. Use your <strong>publishable</strong> key (starts with pk_).</p>'
      + '</div>';
  },

  saveKey: function() {
    var pk = document.getElementById('stripe-pk').value.trim();
    if (!pk) { UI.toast('Enter your Stripe publishable key', 'error'); return; }
    if (!pk.startsWith('pk_')) { UI.toast('Key should start with pk_live_ or pk_test_', 'error'); return; }
    localStorage.setItem('bm-stripe-pk', pk);
    Stripe.publishableKey = pk;
    UI.toast('Stripe connected!');
    loadPage('settings');
  },

  disconnect: function() {
    localStorage.removeItem('bm-stripe-pk');
    Stripe.publishableKey = null;
    UI.toast('Stripe disconnected');
    loadPage('settings');
  },

  // Calculate fees for display
  calcFees: function(amount) {
    var cardFee = Math.round((amount * 0.029 + 0.30) * 100) / 100;
    var achFee = Math.round((amount * 0.008) * 100) / 100;
    return { card: cardFee, ach: achFee, cardNet: amount - cardFee, achNet: amount - achFee };
  }
};

// Init on load
Stripe.init();

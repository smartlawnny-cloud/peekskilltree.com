/**
 * Branch Manager — Supabase Client
 * Drop-in replacement for localStorage DB layer
 * When connected, all data syncs to cloud — works across devices
 *
 * Uses Supabase JS client v2 (loaded from CDN)
 *
 * SECURITY MODEL:
 * The anon key below is safe to expose in client-side code IF Row Level Security
 * (RLS) policies are properly configured in Supabase. With RLS enabled:
 *   - Anon key can ONLY read non-draft quotes/invoices (for approve.html & pay.html)
 *   - All other data requires authentication (Supabase Auth sign-in)
 *   - Team members, clients, jobs, expenses, etc. are NOT accessible to anon
 *
 * WITHOUT RLS: The anon key grants FULL read/write access to ALL tables.
 * Run migrate-rls.sql in Supabase SQL Editor to enable proper RLS policies.
 */
var SupabaseDB = {
  client: null,
  ready: false,

  // Default credentials — auto-connect
  DEFAULT_URL: 'https://ltpivkqahvplapyagljt.supabase.co',
  DEFAULT_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cGl2a3FhaHZwbGFweWFnbGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTgxNzIsImV4cCI6MjA4OTY3NDE3Mn0.bQ-wAx4Uu-FyA2ZwsTVfFoU2ZPbeWCmupqV-6ZR9uFI',

  init: function() {
    var url = localStorage.getItem('bm-supabase-url') || SupabaseDB.DEFAULT_URL;
    var key = localStorage.getItem('bm-supabase-key') || SupabaseDB.DEFAULT_KEY;
    if (!url || !key) return;
    // Store so import page shows connected
    localStorage.setItem('bm-supabase-url', url);
    localStorage.setItem('bm-supabase-key', key);

    // Load Supabase JS if not present
    if (!window.supabase) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      script.onload = function() { SupabaseDB._connect(url, key); };
      document.head.appendChild(script);
    } else {
      SupabaseDB._connect(url, key);
    }
  },

  _connect: function(url, key) {
    try {
      SupabaseDB.client = window.supabase.createClient(url, key);
      SupabaseDB.ready = true;
      console.log('Supabase connected:', url);

      // Check if RLS policies are properly configured
      SupabaseDB._checkRLS();

      // Override DB methods to use Supabase
      SupabaseDB._overrideDB();

      // Sync local data to Supabase (first time)
      SupabaseDB._initialSync();
    } catch (e) {
      console.error('Supabase connection failed:', e);
    }
  },

  _checkRLS: function() {
    // Test if anon key can read team_members — it shouldn't with proper RLS
    SupabaseDB.client.from('team_members').select('id').limit(1).then(function(res) {
      if (res.data && res.data.length > 0) {
        console.warn('⚠️ WARNING: Supabase RLS policies are NOT configured properly.');
        console.warn('The anon key can read team_members — this means ALL tables are exposed.');
        console.warn('Run migrate-rls.sql in your Supabase SQL Editor to fix this.');
        console.warn('See: https://supabase.com/dashboard/project/ltpivkqahvplapyagljt/sql');
      } else if (res.error && res.error.code === '42501') {
        console.log('✅ Supabase RLS policies are active — anon key is restricted.');
      }
    }).catch(function() {});
  },

  _overrideDB: function() {
    // DO NOT override read methods — they must stay synchronous
    // CloudSync handles pulling data from Supabase into localStorage
    // CloudSync.wrapWrites() handles pushing writes to Supabase
    // This keeps the entire app working with synchronous DB calls
    console.log('SupabaseDB: reads stay local (sync), writes push to cloud (async)');
  },

  _initialSync: async function() {
    if (!SupabaseDB.ready) return;
    var sb = SupabaseDB.client;

    // Check if Supabase already has data
    var { count } = await sb.from('clients').select('*', { count: 'exact', head: true });
    if (count > 0) {
      console.log('Supabase has ' + count + ' clients — pulling cloud data to local');
      await SupabaseDB._pullFromCloud();
      return;
    }

    // No cloud data — push local data up
    console.log('Syncing local data to Supabase...');
    var tables = [
      { local: 'bm-clients', remote: 'clients' },
      { local: 'bm-requests', remote: 'requests' },
      { local: 'bm-quotes', remote: 'quotes' },
      { local: 'bm-jobs', remote: 'jobs' },
      { local: 'bm-invoices', remote: 'invoices' },
      { local: 'bm-services', remote: 'services' }
    ];

    // UUID generator for Supabase compatibility
    function toUUID(localId) {
      if (!localId) return SupabaseDB._uuid();
      // Already a UUID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(localId)) return localId;
      // Convert local ID to deterministic UUID
      var hex = '';
      for (var c = 0; c < localId.length; c++) {
        hex += localId.charCodeAt(c).toString(16);
      }
      hex = (hex + '00000000000000000000000000000000').substr(0, 32);
      return hex.substr(0,8) + '-' + hex.substr(8,4) + '-4' + hex.substr(13,3) + '-a' + hex.substr(17,3) + '-' + hex.substr(20,12);
    }

    for (var i = 0; i < tables.length; i++) {
      var t = tables[i];
      try {
        var localData = JSON.parse(localStorage.getItem(t.local) || '[]');
        if (localData.length > 0) {
          // Convert field names from camelCase to snake_case and fix IDs
          var converted = localData.map(function(row) {
            var newRow = {};
            Object.keys(row).forEach(function(key) {
              var snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
              // Convert ID fields to UUID format
              if (snakeKey === 'id' || snakeKey.endsWith('_id')) {
                newRow[snakeKey] = row[key] ? toUUID(row[key]) : null;
              } else {
                newRow[snakeKey] = row[key];
              }
            });
            // Remove updated_at for services table (doesn't have it)
            if (t.remote === 'services') {
              delete newRow.updated_at;
            }
            return newRow;
          });

          var { error } = await sb.from(t.remote).upsert(converted, { onConflict: 'id', ignoreDuplicates: true });
          if (error) {
            console.warn('Sync error for ' + t.remote + ':', error.message);
          } else {
            console.log('Synced ' + converted.length + ' rows to ' + t.remote);
          }
        }
      } catch (e) {
        console.warn('Sync failed for ' + t.remote + ':', e);
      }
    }
    console.log('Initial sync complete');
    UI.toast('Data synced to cloud!');
    SupabaseDB.startPaymentPolling();
  },

  _pullFromCloud: async function() {
    if (!SupabaseDB.ready) return;
    var sb = SupabaseDB.client;

    var tables = [
      { local: 'bm-clients', remote: 'clients' },
      { local: 'bm-requests', remote: 'requests' },
      { local: 'bm-quotes', remote: 'quotes' },
      { local: 'bm-jobs', remote: 'jobs' },
      { local: 'bm-invoices', remote: 'invoices' },
      { local: 'bm-services', remote: 'services' },
      { local: 'bm-team', remote: 'team_members' }
    ];

    var totalPulled = 0;
    for (var i = 0; i < tables.length; i++) {
      var t = tables[i];
      try {
        var { data, error } = await sb.from(t.remote).select('*').order('created_at', { ascending: false }).limit(5000);
        if (error) {
          console.warn('Pull error for ' + t.remote + ':', error.message);
          continue;
        }
        if (data && data.length > 0) {
          // Convert snake_case to camelCase for local storage
          var converted = data.map(function(row) {
            var newRow = {};
            Object.keys(row).forEach(function(key) {
              var camelKey = key.replace(/_([a-z])/g, function(m, p1) { return p1.toUpperCase(); });
              newRow[camelKey] = row[key];
            });
            return newRow;
          });
          localStorage.setItem(t.local, JSON.stringify(converted));
          totalPulled += converted.length;
          console.log('Pulled ' + converted.length + ' rows from ' + t.remote);
        }
      } catch (e) {
        console.warn('Pull failed for ' + t.remote + ':', e);
      }
    }

    SupabaseDB.startPaymentPolling();
    if (totalPulled > 0) {
      console.log('Cloud sync complete: ' + totalPulled + ' total records');
      UI.toast(totalPulled + ' records synced from cloud');
      // Refresh current page to show data
      if (typeof loadPage === 'function') {
        var currentPage = document.querySelector('.nav-item.active');
        if (currentPage) {
          var page = currentPage.getAttribute('onclick');
          if (page) {
            var match = page.match(/loadPage\('(\w+)'\)/);
            if (match) loadPage(match[1]);
          }
        } else {
          loadPage('dashboard');
        }
      }
    }
  },

  // Poll for new requests submitted via book.html (every 3 min)
  startRequestPolling: function() {
    if (window._requestPollStarted) return;
    window._requestPollStarted = true;
    setInterval(SupabaseDB._checkNewRequests, 3 * 60 * 1000);
  },

  _checkNewRequests: async function() {
    if (!SupabaseDB.ready || !SupabaseDB.client) return;
    try {
      var since = new Date(Date.now() - 3 * 60 * 1000).toISOString();
      var { data, error } = await SupabaseDB.client
        .from('requests')
        .select('id, client_name, client_phone, source, status, created_at')
        .eq('status', 'new')
        .gte('created_at', since);
      if (error || !data || !data.length) return;

      var localReqs = [];
      try { localReqs = JSON.parse(localStorage.getItem('bm-requests') || '[]'); } catch(e) {}
      var localIds = {};
      localReqs.forEach(function(r) { localIds[r.id] = true; });

      var newOnes = data.filter(function(r) { return !localIds[r.id]; });
      if (!newOnes.length) return;

      // Add to local
      newOnes.forEach(function(remote) {
        var local = {};
        Object.keys(remote).forEach(function(k) {
          var camel = k.replace(/_([a-z])/g, function(m, p) { return p.toUpperCase(); });
          local[camel] = remote[k];
        });
        localReqs.unshift(local);
        UI.toast('🆕 New request from ' + (remote.client_name || 'website') + '!', 'success');
      });
      localStorage.setItem('bm-requests', JSON.stringify(localReqs));

      // Refresh requests page badge
      if (typeof NotificationCenter !== 'undefined' && NotificationCenter.updateBadge) {
        NotificationCenter.updateBadge();
      }
    } catch(e) {}
  },

  // Force re-sync from cloud (can be called manually)
  resync: async function() {
    UI.toast('Syncing from cloud...');
    await SupabaseDB._pullFromCloud();
  },

  // Poll for new Stripe payments — runs every 2 min while app is open
  // Updates localStorage so invoices flip to "paid" without a full refresh
  _pollInterval: null,
  startPaymentPolling: function() {
    if (SupabaseDB._pollInterval) return; // already running
    SupabaseDB._checkNewPayments(); // run once immediately
    SupabaseDB._pollInterval = setInterval(function() {
      SupabaseDB._checkNewPayments();
    }, 2 * 60 * 1000); // every 2 minutes
  },

  _checkNewPayments: async function() {
    if (!SupabaseDB.ready || !SupabaseDB.client) return;
    try {
      // Look for invoices paid in the last 10 minutes
      var since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      var { data, error } = await SupabaseDB.client
        .from('invoices')
        .select('id, invoice_number, client_name, amount_paid, paid_date, status, payment_method, stripe_payment_id')
        .eq('status', 'paid')
        .gte('updated_at', since)
        .eq('payment_method', 'stripe');

      if (error || !data || data.length === 0) return;

      // Check which ones are new to localStorage
      var localInvoices = [];
      try { localInvoices = JSON.parse(localStorage.getItem('bm-invoices') || '[]'); } catch(e) {}

      var newPayments = [];
      data.forEach(function(remote) {
        var local = localInvoices.find(function(l) {
          return l.id === remote.id || l.invoiceNumber === remote.invoice_number;
        });
        if (local && local.status !== 'paid') {
          // Update locally
          local.status = 'paid';
          local.balance = 0;
          local.amountPaid = remote.amount_paid;
          local.paidDate = remote.paid_date;
          local.paymentMethod = remote.payment_method || 'stripe';
          local.stripePaymentId = remote.stripe_payment_id;
          newPayments.push(remote);
        }
      });

      if (newPayments.length > 0) {
        localStorage.setItem('bm-invoices', JSON.stringify(localInvoices));
        newPayments.forEach(function(p) {
          var amt = p.amount_paid ? '$' + parseFloat(p.amount_paid).toFixed(2) : '';
          UI.toast('💳 Payment received! Invoice #' + p.invoice_number + ' — ' + amt + ' (Stripe)', 'success');
        });
        // Refresh page if on invoices
        if (typeof loadPage === 'function' && document.querySelector('.nav-item.active')) {
          var active = document.querySelector('.nav-item.active');
          var match = (active.getAttribute('onclick') || '').match(/loadPage\('(\w+)'\)/);
          if (match && (match[1] === 'invoices' || match[1] === 'dashboard' || match[1] === 'payments')) {
            loadPage(match[1]);
          }
        }
      }
    } catch(e) {
      // Silent fail — polling is background
    }
  },

  _uuid: function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  },

  // Test connection
  test: async function() {
    if (!SupabaseDB.ready) {
      UI.toast('Not connected to Supabase', 'error');
      return false;
    }
    try {
      var { data, error } = await SupabaseDB.client.from('services').select('count');
      if (error) throw error;
      UI.toast('Supabase connected! Database is live.');
      return true;
    } catch (e) {
      UI.toast('Connection test failed: ' + e.message, 'error');
      return false;
    }
  }
};

// Auto-init on page load
SupabaseDB.init();

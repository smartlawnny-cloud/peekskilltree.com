/**
 * Branch Manager — Supabase Client
 * Drop-in replacement for localStorage DB layer
 * When connected, all data syncs to cloud — works across devices
 *
 * Uses Supabase JS client v2 (loaded from CDN)
 */
var SupabaseDB = {
  client: null,
  ready: false,

  init: function() {
    var url = localStorage.getItem('bm-supabase-url');
    var key = localStorage.getItem('bm-supabase-key');
    if (!url || !key) return;

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

      // Override DB methods to use Supabase
      SupabaseDB._overrideDB();

      // Sync local data to Supabase (first time)
      SupabaseDB._initialSync();
    } catch (e) {
      console.error('Supabase connection failed:', e);
    }
  },

  _overrideDB: function() {
    if (!SupabaseDB.ready) return;
    var sb = SupabaseDB.client;

    // Map table names
    var tableMap = {
      'bm-clients': 'clients',
      'bm-requests': 'requests',
      'bm-quotes': 'quotes',
      'bm-jobs': 'jobs',
      'bm-invoices': 'invoices',
      'bm-services': 'services',
      'bm-time-entries': 'time_entries'
    };

    // Override DB.clients
    var origClients = Object.assign({}, DB.clients);
    DB.clients.getAll = async function() {
      var { data } = await sb.from('clients').select('*').order('created_at', { ascending: false });
      return data || [];
    };
    DB.clients.getById = async function(id) {
      var { data } = await sb.from('clients').select('*').eq('id', id).single();
      return data;
    };
    DB.clients.create = async function(record) {
      record.created_at = new Date().toISOString();
      record.updated_at = new Date().toISOString();
      var { data } = await sb.from('clients').insert(record).select().single();
      return data;
    };
    DB.clients.update = async function(id, changes) {
      changes.updated_at = new Date().toISOString();
      var { data } = await sb.from('clients').update(changes).eq('id', id).select().single();
      return data;
    };
    DB.clients.remove = async function(id) {
      await sb.from('clients').delete().eq('id', id);
    };
    DB.clients.search = async function(q) {
      var { data } = await sb.from('clients').select('*').or('name.ilike.%' + q + '%,address.ilike.%' + q + '%,phone.ilike.%' + q + '%,email.ilike.%' + q + '%');
      return data || [];
    };
    DB.clients.count = async function() {
      var { count } = await sb.from('clients').select('*', { count: 'exact', head: true });
      return count || 0;
    };
  },

  _initialSync: async function() {
    if (!SupabaseDB.ready) return;
    var sb = SupabaseDB.client;

    // Check if Supabase already has data
    var { count } = await sb.from('clients').select('*', { count: 'exact', head: true });
    if (count > 0) {
      console.log('Supabase has data — using cloud data');
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

    for (var i = 0; i < tables.length; i++) {
      var t = tables[i];
      try {
        var localData = JSON.parse(localStorage.getItem(t.local) || '[]');
        if (localData.length > 0) {
          // Convert field names from camelCase to snake_case
          var converted = localData.map(function(row) {
            var newRow = {};
            Object.keys(row).forEach(function(key) {
              var snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
              newRow[snakeKey] = row[key];
            });
            return newRow;
          });

          var { error } = await sb.from(t.remote).upsert(converted, { onConflict: 'id' });
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

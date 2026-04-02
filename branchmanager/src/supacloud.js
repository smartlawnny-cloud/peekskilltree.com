/**
 * Branch Manager — Supabase Cloud Data Layer
 * Caches Supabase data locally for fast reads, syncs writes to cloud
 * This bridges the gap: app uses synchronous DB calls, cloud is async
 *
 * Strategy: On init, pull all data from Supabase into localStorage cache.
 * Reads come from cache (fast, synchronous). Writes go to both cache + cloud.
 */
var CloudSync = {
  tables: ['clients', 'requests', 'quotes', 'jobs', 'invoices', 'services', 'expenses', 'time_entries'],
  syncing: false,
  lastSync: 0,

  init: async function() {
    if (!SupabaseDB || !SupabaseDB.ready) return;
    CloudSync.syncing = true;

    var sb = SupabaseDB.client;
    var totalRows = 0;

    for (var i = 0; i < CloudSync.tables.length; i++) {
      var table = CloudSync.tables[i];
      var localKey = 'bm-' + table.replace('_', '-');

      try {
        // Pull all rows from Supabase
        var { data, error } = await sb.from(table).select('*').order('created_at', { ascending: false }).limit(1000);
        if (error) {
          // Table doesn't exist in Supabase yet — remove from sync list silently
          if (error.message && error.message.includes('schema cache')) {
            CloudSync.tables = CloudSync.tables.filter(function(t) { return t !== table; });
          } else {
            console.warn('CloudSync: error fetching ' + table + ':', error.message);
          }
          continue;
        }

        if (data && data.length > 0) {
          // Convert snake_case to camelCase for app compatibility
          var converted = data.map(function(row) {
            var newRow = {};
            Object.keys(row).forEach(function(key) {
              var camelKey = key.replace(/_([a-z])/g, function(m, p1) { return p1.toUpperCase(); });
              newRow[camelKey] = row[key];
            });
            return newRow;
          });

          localStorage.setItem(localKey, JSON.stringify(converted));
          totalRows += converted.length;
          console.log('CloudSync: loaded ' + converted.length + ' ' + table);
        }
      } catch (e) {
        console.warn('CloudSync: failed ' + table + ':', e);
      }
    }

    CloudSync.syncing = false;
    CloudSync.lastSync = Date.now();
    console.log('CloudSync: done — ' + totalRows + ' total rows cached');

    // Refresh page if we loaded new data
    if (totalRows > 0 && typeof loadPage === 'function') {
      loadPage('dashboard');
    }
  },

  // Override DB write methods to also push to Supabase
  wrapWrites: function() {
    if (!SupabaseDB || !SupabaseDB.ready) return;
    var sb = SupabaseDB.client;

    CloudSync.tables.forEach(function(table) {
      var localKey = 'bm-' + table.replace('_', '-');
      var dbSection = table === 'time_entries' ? DB.timeEntries : DB[table];
      if (!dbSection) return;

      var origCreate = dbSection.create;
      var origUpdate = dbSection.update;
      var origRemove = dbSection.remove;

      // Wrap create — pre-assign UUID so local + cloud IDs always match
      dbSection.create = function(record) {
        // Inject UUID before local create so both sides use the same ID
        if (!record.id || record.id.indexOf('-') === -1) {
          record.id = CloudSync._uuid();
        }
        var result = origCreate.call(dbSection, record);
        var cloudRecord = CloudSync._toSnake(result);
        // ID is already a UUID — no need to overwrite
        sb.from(table).insert(cloudRecord).then(function(res) {
          if (res.error) console.warn('Cloud create error (' + table + '):', res.error.message);
        });
        return result;
      };

      // Wrap update — find record in local cache and update cloud by same ID
      if (origUpdate) {
        dbSection.update = function(id, changes) {
          var result = origUpdate.call(dbSection, id, changes);
          var cloudChanges = CloudSync._toSnake(changes);
          cloudChanges.updated_at = new Date().toISOString();
          var all = JSON.parse(localStorage.getItem(localKey) || '[]');
          var record = all.find(function(r) { return r.id === id; });
          if (record && record.id) {
            sb.from(table).update(cloudChanges).eq('id', record.id).then(function(res) {
              if (res.error) console.warn('Cloud update error (' + table + '):', res.error.message);
            });
          }
          return result;
        };
      }

      // Wrap remove — delete from cloud when deleted locally
      if (origRemove) {
        dbSection.remove = function(id) {
          var result = origRemove.call(dbSection, id);
          sb.from(table).delete().eq('id', id).then(function(res) {
            if (res.error) console.warn('Cloud delete error (' + table + '):', res.error.message);
          });
          return result;
        };
      }
    });

    console.log('CloudSync: write methods wrapped');
  },

  // Convert camelCase object to snake_case
  _toSnake: function(obj) {
    var result = {};
    Object.keys(obj).forEach(function(key) {
      var snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result[snakeKey] = obj[key];
    });
    return result;
  },

  _uuid: function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  },

  // Manual refresh
  refresh: async function() {
    UI.toast('Syncing with cloud...');
    await CloudSync.init();
    UI.toast('Data refreshed from cloud!');
  }
};

// Auto-init after Supabase connects — retry until connected
(function waitForSupabase(attempts) {
  if (SupabaseDB && SupabaseDB.ready) {
    // Check if we need to sync (no local data or stale)
    var localClients = localStorage.getItem('bm-clients');
    var hasLocal = localClients && JSON.parse(localClients).length > 0;
    if (!hasLocal || (Date.now() - CloudSync.lastSync > 3600000)) {
      CloudSync.init().then(function() { CloudSync.wrapWrites(); });
    } else {
      CloudSync.wrapWrites();
      console.log('CloudSync: using cached data (' + JSON.parse(localClients).length + ' clients)');
    }
  } else if (attempts > 0) {
    setTimeout(function() { waitForSupabase(attempts - 1); }, 1000);
  }
})(15); // Try for 15 seconds

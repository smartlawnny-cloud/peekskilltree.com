/**
 * Branch Manager — Photo Upload & Gallery
 * Attach before/after photos to jobs, quotes, and clients
 * Uses Supabase Storage when connected, falls back to base64 in localStorage
 */
var Photos = {
  BUCKET: 'job-photos',

  // Render upload button + gallery for a record
  renderGallery: function(recordType, recordId) {
    var photos = Photos.getPhotos(recordType, recordId);
    var html = '<div style="margin-top:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">'
      + '<h4 style="font-size:14px;">📸 Photos (' + photos.length + ')</h4>'
      + '<label style="background:var(--green-dark);color:#fff;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">'
      + '+ Add Photo<input type="file" accept="image/*" multiple onchange="Photos.upload(event, \'' + recordType + '\', \'' + recordId + '\')" style="display:none;">'
      + '</label></div>';

    if (photos.length) {
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;">';
      photos.forEach(function(p, idx) {
        html += '<div style="position:relative;border-radius:8px;overflow:hidden;aspect-ratio:1;cursor:pointer;" onclick="Photos.viewFull(\'' + recordType + '\', \'' + recordId + '\', ' + idx + ')">'
          + '<img src="' + p.url + '" style="width:100%;height:100%;object-fit:cover;" loading="lazy">'
          + '<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.6));padding:4px 6px;font-size:10px;color:#fff;">'
          + (p.label || '') + ' ' + (p.date ? UI.dateShort(p.date) : '') + '</div>'
          + '</div>';
      });
      html += '</div>';
    } else {
      html += '<div style="text-align:center;padding:24px;border:2px dashed var(--border);border-radius:10px;color:var(--text-light);font-size:13px;">'
        + 'No photos yet. Tap + Add Photo to attach before/after shots.</div>';
    }
    html += '</div>';
    return html;
  },

  upload: async function(event, recordType, recordId) {
    var files = event.target.files;
    if (!files || !files.length) return;

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      UI.toast('Uploading ' + file.name + '...');

      if (SupabaseDB && SupabaseDB.ready) {
        // Upload to Supabase Storage + write metadata row to `photos` table
        try {
          var safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          var path = recordType + '/' + recordId + '/' + Date.now() + '_' + safeName;
          var { error } = await SupabaseDB.client.storage.from(Photos.BUCKET).upload(path, file);
          if (error) throw error;
          var { data: urlData } = SupabaseDB.client.storage.from(Photos.BUCKET).getPublicUrl(path);

          var meta = {
            record_type: recordType,
            record_id: recordId,
            url: urlData.publicUrl,
            storage_path: path,
            name: file.name,
            label: '',
            taken_at: new Date().toISOString()
          };
          var tid = (typeof DB !== 'undefined' && DB.getTenantId) ? DB.getTenantId() : null;
          if (tid) meta.tenant_id = tid;

          var ins = await SupabaseDB.client.from('photos').insert(meta).select().single();
          if (ins.error) console.warn('Photos: meta insert failed:', ins.error.message);

          Photos._savePhoto(recordType, recordId, {
            id: (ins.data && ins.data.id) || null,
            url: urlData.publicUrl,
            storage_path: path,
            name: file.name,
            date: meta.taken_at,
            label: ''
          });
        } catch (e) {
          console.warn('Supabase upload failed, falling back to local:', e);
          Photos._uploadLocal(file, recordType, recordId);
        }
      } else {
        Photos._uploadLocal(file, recordType, recordId);
      }
    }

    UI.toast(files.length + ' photo(s) uploaded!');
    // Refresh the page to show new photos
    if (typeof loadPage === 'function') {
      var currentPage = document.querySelector('.nav-item.active');
      if (currentPage) currentPage.click();
    }
  },

  // Pull all photo metadata for this tenant into local cache (call on app boot)
  syncFromCloud: async function() {
    if (!SupabaseDB || !SupabaseDB.ready) return;
    try {
      var tid = (typeof DB !== 'undefined' && DB.getTenantId) ? DB.getTenantId() : null;
      var q = SupabaseDB.client.from('photos').select('*').order('taken_at', { ascending: false });
      if (tid) q = q.eq('tenant_id', tid);
      var { data, error } = await q;
      if (error) { console.warn('Photos.syncFromCloud:', error.message); return; }
      if (!data) return;

      // Group by record_type + record_id and write to bm-photos-* keys
      var groups = {};
      data.forEach(function(row) {
        var key = 'bm-photos-' + row.record_type + '-' + row.record_id;
        if (!groups[key]) groups[key] = [];
        groups[key].push({
          id: row.id,
          url: row.url,
          storage_path: row.storage_path,
          name: row.name,
          label: row.label || '',
          date: row.taken_at || row.created_at
        });
      });
      Object.keys(groups).forEach(function(k) {
        localStorage.setItem(k, JSON.stringify(groups[k]));
      });
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB._debug) console.log('Photos.syncFromCloud: cached ' + data.length + ' photos across ' + Object.keys(groups).length + ' records');
    } catch (e) {
      console.warn('Photos.syncFromCloud failed:', e);
    }
  },

  _uploadLocal: function(file, recordType, recordId) {
    var reader = new FileReader();
    reader.onload = function(e) {
      // Resize to max 800px to save localStorage space
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        var maxSize = 800;
        var w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = h * maxSize / w; w = maxSize; }
          else { w = w * maxSize / h; h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        var dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        Photos._savePhoto(recordType, recordId, { url: dataUrl, name: file.name, date: new Date().toISOString(), label: '' });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  _savePhoto: function(recordType, recordId, photo) {
    var key = 'bm-photos-' + recordType + '-' + recordId;
    var photos = [];
    try { photos = JSON.parse(localStorage.getItem(key)) || []; } catch(e) {}
    photo.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    photos.push(photo);
    localStorage.setItem(key, JSON.stringify(photos));
  },

  getPhotos: function(recordType, recordId) {
    var key = 'bm-photos-' + recordType + '-' + recordId;
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch(e) { return []; }
  },

  viewFull: function(recordType, recordId, index) {
    var photos = Photos.getPhotos(recordType, recordId);
    if (!photos[index]) return;
    var p = photos[index];

    var overlay = document.createElement('div');
    overlay.id = 'photo-viewer';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.9);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;';

    // Build DOM safely — no innerHTML with unescaped URL (XSS risk)
    var img = document.createElement('img');
    img.src = p.url;
    img.style.cssText = 'max-width:90vw;max-height:80vh;border-radius:8px;object-fit:contain;';
    overlay.appendChild(img);

    var caption = document.createElement('div');
    caption.style.cssText = 'color:#fff;margin-top:12px;font-size:14px;';
    caption.textContent = (p.name || '') + ' — ' + (p.date ? UI.dateShort(p.date) : '');
    overlay.appendChild(caption);

    var btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:12px;margin-top:12px;';
    btnRow.innerHTML = '<button onclick="Photos._labelPhoto(\'' + recordType + '\', \'' + recordId + '\', ' + index + ')" style="background:#fff;color:#333;border:none;padding:8px 16px;border-radius:6px;font-size:13px;cursor:pointer;">Label</button>'
      + '<button onclick="Photos._deletePhoto(\'' + recordType + '\', \'' + recordId + '\', ' + index + ')" style="background:#c0392b;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-size:13px;cursor:pointer;">Delete</button>'
      + '<button onclick="document.getElementById(\'photo-viewer\').remove()" style="background:#555;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-size:13px;cursor:pointer;">Close</button>';
    overlay.appendChild(btnRow);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  },

  _labelPhoto: function(recordType, recordId, index) {
    var label = prompt('Label this photo (e.g. "Before", "After", "Damage"):');
    if (label === null) return;
    var key = 'bm-photos-' + recordType + '-' + recordId;
    var photos = [];
    try { photos = JSON.parse(localStorage.getItem(key)) || []; } catch(e) {}
    if (photos[index]) {
      photos[index].label = label;
      localStorage.setItem(key, JSON.stringify(photos));
      // Sync to cloud
      if (photos[index].id && SupabaseDB && SupabaseDB.ready) {
        SupabaseDB.client.from('photos').update({ label: label }).eq('id', photos[index].id).then(function(res) {
          if (res.error) console.warn('Photos label sync failed:', res.error.message);
        });
      }
      document.getElementById('photo-viewer').remove();
      UI.toast('Photo labeled: ' + label);
    }
  },

  _deletePhoto: function(recordType, recordId, index) {
    if (!confirm('Delete this photo?')) return;
    var key = 'bm-photos-' + recordType + '-' + recordId;
    var photos = [];
    try { photos = JSON.parse(localStorage.getItem(key)) || []; } catch(e) {}
    var removed = photos.splice(index, 1)[0];
    localStorage.setItem(key, JSON.stringify(photos));
    // Sync delete to cloud (storage object + metadata row)
    if (removed && SupabaseDB && SupabaseDB.ready) {
      if (removed.storage_path) {
        SupabaseDB.client.storage.from(Photos.BUCKET).remove([removed.storage_path]).then(function(res) {
          if (res.error) console.warn('Photo storage delete failed:', res.error.message);
        });
      }
      if (removed.id) {
        SupabaseDB.client.from('photos').delete().eq('id', removed.id).then(function(res) {
          if (res.error) console.warn('Photo meta delete failed:', res.error.message);
        });
      }
    }
    document.getElementById('photo-viewer').remove();
    UI.toast('Photo deleted');
  }
};

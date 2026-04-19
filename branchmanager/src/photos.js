/**
 * Branch Cam — Photo Upload & Gallery
 * Attach before/after photos to jobs, quotes, and clients
 * GPS + timestamp burned into every shot for proof-of-work
 * Uses Supabase Storage when connected, falls back to base64 in localStorage
 */
var Photos = {
  BUCKET: 'job-photos',
  BRAND: 'Branch Cam',

  // Capture GPS once, reuse across uploads in the same batch (saves prompts + battery)
  _lastGps: null,
  _lastGpsTime: 0,
  _getGps: function() {
    return new Promise(function(resolve) {
      // Reuse if fetched in last 60s
      if (Photos._lastGps && (Date.now() - Photos._lastGpsTime) < 60000) {
        return resolve(Photos._lastGps);
      }
      if (!navigator.geolocation) return resolve(null);
      var done = false;
      var timer = setTimeout(function() { if (!done) { done = true; resolve(null); } }, 4000);
      navigator.geolocation.getCurrentPosition(function(pos) {
        if (done) return; done = true; clearTimeout(timer);
        Photos._lastGps = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        Photos._lastGpsTime = Date.now();
        resolve(Photos._lastGps);
      }, function() {
        if (done) return; done = true; clearTimeout(timer); resolve(null);
      }, { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 });
    });
  },

  // Burn watermark (date/time + GPS + Branch Cam brand) into image, return Blob
  _stampImage: function(file, gps) {
    return new Promise(function(resolve) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          // Resize to max 1600px (CompanyCam-style — keep readable but slim)
          var maxSize = 1600;
          var w = img.width, h = img.height;
          if (w > maxSize || h > maxSize) {
            if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
            else { w = Math.round(w * maxSize / h); h = maxSize; }
          }
          var canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          // --- Watermark band ---
          var pad = Math.max(10, Math.round(w * 0.012));
          var fontPx = Math.max(14, Math.round(w * 0.024));
          ctx.font = '600 ' + fontPx + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          var smallPx = Math.max(11, Math.round(w * 0.018));

          var d = new Date();
          var dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
          var timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          var gpsStr = gps ? (gps.lat.toFixed(5) + '°, ' + gps.lng.toFixed(5) + '°') : 'GPS unavailable';

          var bandH = Math.round(fontPx * 2.6 + smallPx * 1.6 + pad * 1.4);
          // Gradient bg for readability over any image
          var grad = ctx.createLinearGradient(0, h - bandH, 0, h);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(0.4, 'rgba(0,0,0,0.55)');
          grad.addColorStop(1, 'rgba(0,0,0,0.85)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, h - bandH, w, bandH);

          // Brand pill (top-left of band)
          var pillTxt = '🌳 ' + Photos.BRAND;
          ctx.font = '700 ' + smallPx + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          var pillW = ctx.measureText(pillTxt).width + smallPx * 1.4;
          var pillH = smallPx * 1.8;
          var pillY = h - bandH + pad * 0.6;
          ctx.fillStyle = 'rgba(46, 125, 50, 0.95)';
          Photos._roundRect(ctx, pad, pillY, pillW, pillH, pillH / 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.textBaseline = 'middle';
          ctx.fillText(pillTxt, pad + smallPx * 0.7, pillY + pillH / 2);

          // Date + time (left, big)
          ctx.font = '700 ' + fontPx + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = '#fff';
          ctx.fillText(dateStr + ' · ' + timeStr, pad, h - pad - smallPx - 4);

          // GPS (bottom-left, small)
          ctx.font = '500 ' + smallPx + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.fillText('📍 ' + gpsStr, pad, h - pad);

          canvas.toBlob(function(blob) {
            resolve(blob || file);
          }, 'image/jpeg', 0.85);
        };
        img.onerror = function() { resolve(file); };
        img.src = e.target.result;
      };
      reader.onerror = function() { resolve(file); };
      reader.readAsDataURL(file);
    });
  },

  _roundRect: function(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },

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

    // Get GPS once for the whole batch (in parallel with first file read)
    var gpsPromise = Photos._getGps();

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      UI.toast('Stamping ' + file.name + '...');

      // Branch Cam stamp: timestamp + GPS + brand
      var gps = await gpsPromise;
      var stamped = await Photos._stampImage(file, gps);

      if (SupabaseDB && SupabaseDB.ready) {
        // Upload to Supabase Storage + write metadata row to `photos` table
        try {
          var safeName = (file.name || 'photo.jpg').replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '.jpg');
          var path = recordType + '/' + recordId + '/' + Date.now() + '_' + safeName;
          var { error } = await SupabaseDB.client.storage.from(Photos.BUCKET).upload(path, stamped, { contentType: 'image/jpeg' });
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
          if (gps) { meta.gps_lat = gps.lat; meta.gps_lng = gps.lng; }
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
          date: row.taken_at || row.created_at,
          gps_lat: row.gps_lat || null,
          gps_lng: row.gps_lng || null,
          tags: Array.isArray(row.tags) ? row.tags : (row.label ? row.label.split(',').map(function(s){return s.trim();}).filter(Boolean) : [])
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

  _uploadLocal: async function(file, recordType, recordId) {
    // Stamp with Branch Cam watermark even in local-only mode
    var gps = await Photos._getGps();
    var stamped = await Photos._stampImage(file, gps);
    var reader = new FileReader();
    reader.onload = function(e) {
      Photos._savePhoto(recordType, recordId, {
        url: e.target.result,
        name: file.name,
        date: new Date().toISOString(),
        label: '',
        gps_lat: gps ? gps.lat : null,
        gps_lng: gps ? gps.lng : null
      });
    };
    reader.readAsDataURL(stamped);
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

  // Standard tags for tree-service work
  STANDARD_TAGS: ['Before', 'After', 'Hazard', 'Damage', 'Equipment', 'Permit', 'Receipt', 'Crew', 'Property'],

  viewFull: function(recordType, recordId, index) {
    var photos = Photos.getPhotos(recordType, recordId);
    if (!photos[index]) return;
    var p = photos[index];
    var tags = Photos._getTags(p);

    var overlay = document.createElement('div');
    overlay.id = 'photo-viewer';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.92);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:16px;overflow-y:auto;';

    var img = document.createElement('img');
    img.src = p.url;
    img.style.cssText = 'max-width:90vw;max-height:65vh;border-radius:8px;object-fit:contain;';
    overlay.appendChild(img);

    var caption = document.createElement('div');
    caption.style.cssText = 'color:#fff;margin-top:10px;font-size:13px;text-align:center;';
    var capParts = [];
    if (p.date) capParts.push(UI.dateShort(p.date));
    if (p.gps_lat) capParts.push('📍 ' + p.gps_lat.toFixed(4) + ', ' + p.gps_lng.toFixed(4));
    caption.textContent = capParts.join('  ·  ');
    overlay.appendChild(caption);

    // Tag chip picker
    var tagWrap = document.createElement('div');
    tagWrap.style.cssText = 'margin-top:14px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:90vw;';
    Photos.STANDARD_TAGS.forEach(function(t) {
      var on = tags.indexOf(t) !== -1;
      var chip = document.createElement('button');
      chip.textContent = t;
      chip.style.cssText = 'background:' + (on ? '#2e7d32' : 'rgba(255,255,255,0.15)') + ';color:#fff;border:1px solid ' + (on ? '#2e7d32' : 'rgba(255,255,255,0.3)') + ';padding:6px 12px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;';
      chip.onclick = function() { Photos._toggleTag(recordType, recordId, index, t); };
      tagWrap.appendChild(chip);
    });
    overlay.appendChild(tagWrap);

    var btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;justify-content:center;';
    btnRow.innerHTML = '<button onclick="Photos._customTag(\'' + recordType + '\', \'' + recordId + '\', ' + index + ')" style="background:#fff;color:#333;border:none;padding:8px 16px;border-radius:6px;font-size:13px;cursor:pointer;">+ Custom tag</button>'
      + '<button onclick="Photos._deletePhoto(\'' + recordType + '\', \'' + recordId + '\', ' + index + ')" style="background:#c0392b;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-size:13px;cursor:pointer;">Delete</button>'
      + '<button onclick="document.getElementById(\'photo-viewer\').remove()" style="background:#555;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-size:13px;cursor:pointer;">Close</button>';
    overlay.appendChild(btnRow);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  },

  _getTags: function(p) {
    if (Array.isArray(p.tags)) return p.tags;
    if (p.label) return p.label.split(',').map(function(s){ return s.trim(); }).filter(Boolean);
    return [];
  },

  _saveTags: function(recordType, recordId, index, tags) {
    var key = 'bm-photos-' + recordType + '-' + recordId;
    var photos = [];
    try { photos = JSON.parse(localStorage.getItem(key)) || []; } catch(e) {}
    if (!photos[index]) return null;
    photos[index].tags = tags;
    photos[index].label = tags.join(', '); // mirror for legacy compat
    localStorage.setItem(key, JSON.stringify(photos));
    if (photos[index].id && SupabaseDB && SupabaseDB.ready) {
      SupabaseDB.client.from('photos').update({ tags: tags, label: tags.join(', ') }).eq('id', photos[index].id).then(function(res) {
        if (res.error) console.warn('Photos tags sync failed:', res.error.message);
      });
    }
    return photos[index];
  },

  _toggleTag: function(recordType, recordId, index, tag) {
    var photos = Photos.getPhotos(recordType, recordId);
    if (!photos[index]) return;
    var tags = Photos._getTags(photos[index]);
    var i = tags.indexOf(tag);
    if (i === -1) tags.push(tag); else tags.splice(i, 1);
    Photos._saveTags(recordType, recordId, index, tags);
    document.getElementById('photo-viewer').remove();
    Photos.viewFull(recordType, recordId, index);
  },

  _customTag: function(recordType, recordId, index) {
    var t = prompt('Custom tag:');
    if (!t) return;
    t = t.trim();
    if (!t) return;
    var photos = Photos.getPhotos(recordType, recordId);
    if (!photos[index]) return;
    var tags = Photos._getTags(photos[index]);
    if (tags.indexOf(t) === -1) tags.push(t);
    Photos._saveTags(recordType, recordId, index, tags);
    document.getElementById('photo-viewer').remove();
    Photos.viewFull(recordType, recordId, index);
  },

  // ============ BRANCH CAM LIBRARY ============
  // All-photos browser with tag filter + search by client/job
  openLibrary: function() {
    var container = document.getElementById('page-content');
    if (!container) return;

    // Aggregate every photo from every bm-photos-* key
    var all = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k || k.indexOf('bm-photos-') !== 0) continue;
      var parts = k.replace('bm-photos-', '').split('-');
      var recordType = parts.shift();
      var recordId = parts.join('-');
      var arr = [];
      try { arr = JSON.parse(localStorage.getItem(k)) || []; } catch(e) { continue; }
      arr.forEach(function(p, idx) {
        all.push({
          recordType: recordType,
          recordId: recordId,
          index: idx,
          url: p.url,
          date: p.date,
          tags: Photos._getTags(p),
          gps_lat: p.gps_lat,
          gps_lng: p.gps_lng
        });
      });
    }
    // Sort newest first
    all.sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });

    // Build tag tally
    var tagCounts = {};
    all.forEach(function(ph) { ph.tags.forEach(function(t) { tagCounts[t] = (tagCounts[t] || 0) + 1; }); });
    var allTags = Object.keys(tagCounts).sort(function(a, b) { return tagCounts[b] - tagCounts[a]; });

    var activeTag = Photos._libFilter || '';
    var activeQuery = Photos._libQuery || '';

    // Filter
    var clientLookup = {};
    if (typeof DB !== 'undefined' && DB.clients) {
      DB.clients.list().forEach(function(c) { clientLookup[c.id] = c.name || ''; });
    }
    var filtered = all.filter(function(ph) {
      if (activeTag && ph.tags.indexOf(activeTag) === -1) return false;
      if (activeQuery) {
        var q = activeQuery.toLowerCase();
        var hay = (ph.recordType + ' ' + ph.recordId + ' ' + (clientLookup[ph.recordId] || '') + ' ' + ph.tags.join(' ')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    var html = '<div class="page-header"><h1>📸 Branch Cam Library</h1>'
      + '<p style="color:var(--text-light);font-size:13px;">' + all.length + ' total photos · ' + filtered.length + ' shown</p></div>';

    // Search box
    html += '<div style="background:var(--white);padding:14px 16px;border-radius:12px;margin-bottom:14px;border:1px solid var(--border);">'
      + '<input id="branchcam-search" type="text" placeholder="Search by client, job ID, tag…" value="' + activeQuery.replace(/"/g, '&quot;') + '" '
      +   'oninput="Photos._libQuery=this.value; clearTimeout(window._lqT); window._lqT=setTimeout(function(){Photos.openLibrary();},250);" '
      +   'style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;">'
      + '</div>';

    // Tag chips
    if (allTags.length) {
      html += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">';
      html += '<button onclick="Photos._libFilter=\'\'; Photos.openLibrary();" style="background:' + (!activeTag ? '#2e7d32' : 'var(--white)') + ';color:' + (!activeTag ? '#fff' : 'var(--text)') + ';border:1px solid ' + (!activeTag ? '#2e7d32' : 'var(--border)') + ';padding:6px 12px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;">All (' + all.length + ')</button>';
      allTags.forEach(function(t) {
        var on = activeTag === t;
        html += '<button onclick="Photos._libFilter=\'' + t.replace(/'/g, "\\'") + '\'; Photos.openLibrary();" style="background:' + (on ? '#2e7d32' : 'var(--white)') + ';color:' + (on ? '#fff' : 'var(--text)') + ';border:1px solid ' + (on ? '#2e7d32' : 'var(--border)') + ';padding:6px 12px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;">' + t + ' (' + tagCounts[t] + ')</button>';
      });
      html += '</div>';
    }

    // Grid
    if (!filtered.length) {
      html += '<div style="text-align:center;padding:40px;color:var(--text-light);">No photos match.</div>';
    } else {
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;">';
      filtered.forEach(function(ph) {
        var subtitle = clientLookup[ph.recordId] || (ph.recordType + ':' + ph.recordId.substring(0,6));
        html += '<div style="position:relative;border-radius:8px;overflow:hidden;aspect-ratio:1;cursor:pointer;background:#000;" '
          + 'onclick="Photos.viewFull(\'' + ph.recordType + '\', \'' + ph.recordId + '\', ' + ph.index + ')">'
          + '<img src="' + ph.url + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;">'
          + '<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.75));padding:6px 8px;color:#fff;font-size:10px;">'
          + '<div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + subtitle + '</div>'
          + '<div style="opacity:0.8;">' + (ph.date ? UI.dateShort(ph.date) : '') + '</div>'
          + '</div></div>';
      });
      html += '</div>';
    }

    container.innerHTML = html;
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

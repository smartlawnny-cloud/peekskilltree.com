/**
 * Branch Manager — SocialBranch
 * Native social-media suite. Replaces SocialPilot.
 *
 * Backends (auto-selected per account):
 *   • Zapier/Make webhook (works today, any plan)
 *   • Direct network APIs (GMB OAuth, Meta Graph — wired as OAuth completes)
 *
 * Data:
 *   localStorage 'bm-social-posts' (array of post objects)
 *   Post: { id, caption, media, networks, scheduledAt, status, postedAt, results, createdAt }
 */
var SocialBranch = {
  _tab: 'dashboard',
  STATUS: { DRAFT: 'draft', SCHEDULED: 'scheduled', POSTING: 'posting', POSTED: 'posted', FAILED: 'failed' },
  NETWORKS: [
    { id: 'gmb',       name: 'Google Business',  icon: '🔵', color: '#4285F4' },
    { id: 'facebook',  name: 'Facebook',         icon: '📘', color: '#1877F2' },
    { id: 'instagram', name: 'Instagram',        icon: '📸', color: '#E4405F' },
    { id: 'youtube',   name: 'YouTube',          icon: '📹', color: '#FF0000' },
    { id: 'linkedin',  name: 'LinkedIn',         icon: '💼', color: '#0A66C2' },
    { id: 'tiktok',    name: 'TikTok',           icon: '🎵', color: '#000000' },
    { id: 'x',         name: 'X (Twitter)',      icon: '𝕏', color: '#000000' }
  ],

  render: function() {
    var self = SocialBranch;
    var tab = self._tab || 'dashboard';
    var html = '';

    // Header
    html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px;">'
      +   '<div><h2 style="margin:0;font-size:24px;font-weight:800;">🌿 SocialBranch</h2>'
      +   '<div style="font-size:13px;color:var(--text-light);margin-top:2px;">Post to every network from Branch Manager</div></div>'
      +   '<button onclick="SocialBranch._goTab(\'compose\')" class="btn btn-primary" style="font-size:14px;">✏️ New Post</button>'
      + '</div>';

    // Tabs
    var tabs = [
      { id:'dashboard', label:'Dashboard',  icon:'📊' },
      { id:'compose',   label:'Compose',    icon:'✏️' },
      { id:'calendar',  label:'Calendar',   icon:'🗓️' },
      { id:'accounts',  label:'Accounts',   icon:'🔗' },
      { id:'analytics', label:'Analytics',  icon:'📈' },
      { id:'inbox',     label:'Inbox',      icon:'💬' }
    ];
    html += '<div style="display:flex;gap:4px;border-bottom:2px solid var(--border);margin-bottom:18px;overflow-x:auto;white-space:nowrap;">';
    tabs.forEach(function(t) {
      var active = tab === t.id;
      html += '<button onclick="SocialBranch._goTab(\'' + t.id + '\')" style="background:none;border:none;padding:10px 16px;font-size:13px;font-weight:' + (active ? '700' : '500') + ';color:' + (active ? 'var(--green-dark)' : 'var(--text-light)') + ';cursor:pointer;border-bottom:3px solid ' + (active ? 'var(--green-dark)' : 'transparent') + ';margin-bottom:-2px;transition:color .15s;">' + t.icon + ' ' + t.label + '</button>';
    });
    html += '</div>';

    // Tab body
    switch (tab) {
      case 'compose':   html += self._renderCompose();   break;
      case 'calendar':  html += self._renderCalendar();  break;
      case 'accounts':  html += self._renderAccounts();  break;
      case 'analytics': html += self._renderAnalytics(); break;
      case 'inbox':     html += self._renderInbox();     break;
      default:          html += self._renderDashboard();
    }

    return html;
  },

  _goTab: function(id) { SocialBranch._tab = id; loadPage('socialbranch'); },

  // ─────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────
  _renderDashboard: function() {
    var posts = SocialBranch._getPosts();
    var now = Date.now();
    var scheduled = posts.filter(function(p){ return p.status === 'scheduled'; }).sort(function(a,b){ return new Date(a.scheduledAt) - new Date(b.scheduledAt); });
    var recent = posts.filter(function(p){ return p.status === 'posted' || p.status === 'failed'; }).sort(function(a,b){ return new Date(b.postedAt || b.createdAt) - new Date(a.postedAt || a.createdAt); }).slice(0, 8);
    var connected = SocialBranch._getConnectedNetworks();

    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-bottom:20px;">';
    html += SocialBranch._statCard('Scheduled',  scheduled.length,                '📅', 'var(--accent)');
    html += SocialBranch._statCard('Posted (all-time)', posts.filter(function(p){return p.status==='posted';}).length, '✅', 'var(--green-dark)');
    html += SocialBranch._statCard('Drafts',     posts.filter(function(p){return p.status==='draft';}).length,   '📝', 'var(--text-light)');
    html += SocialBranch._statCard('Connected',  connected.length + ' networks',  '🔗', '#8b5cf6');
    html += '</div>';

    // Upcoming queue
    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:18px;margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">'
      + '<h3 style="margin:0;font-size:16px;">Upcoming Queue</h3>'
      + '<button onclick="SocialBranch._goTab(\'calendar\')" style="background:none;border:none;color:var(--accent);font-size:12px;cursor:pointer;">View calendar →</button>'
      + '</div>';
    if (scheduled.length === 0) {
      html += '<div style="padding:20px;text-align:center;color:var(--text-light);font-size:14px;">No scheduled posts. <a href="#" onclick="SocialBranch._goTab(\'compose\');return false;" style="color:var(--accent);">Create your first</a> →</div>';
    } else {
      scheduled.slice(0, 5).forEach(function(p) { html += SocialBranch._postRow(p); });
    }
    html += '</div>';

    // Recent activity
    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:18px;">'
      + '<h3 style="margin:0 0 12px;font-size:16px;">Recent Activity</h3>';
    if (recent.length === 0) {
      html += '<div style="padding:20px;text-align:center;color:var(--text-light);font-size:14px;">Nothing posted yet.</div>';
    } else {
      recent.forEach(function(p) { html += SocialBranch._postRow(p); });
    }
    html += '</div>';

    return html;
  },

  _statCard: function(label, value, icon, color) {
    return '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:16px;">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">'
      + '<div style="width:32px;height:32px;border-radius:8px;background:' + color + '20;color:' + color + ';display:flex;align-items:center;justify-content:center;font-size:16px;">' + icon + '</div>'
      + '<div style="font-size:12px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.4px;">' + label + '</div>'
      + '</div>'
      + '<div style="font-size:24px;font-weight:800;color:var(--text);">' + value + '</div>'
      + '</div>';
  },

  _postRow: function(p) {
    var when = p.status === 'scheduled'
      ? 'Scheduled ' + SocialBranch._formatWhen(p.scheduledAt)
      : (p.postedAt ? 'Posted ' + SocialBranch._formatWhen(p.postedAt) : 'Draft');
    var statusBadge = SocialBranch._statusBadge(p.status);
    var nets = (p.networks || []).map(function(n) {
      var net = SocialBranch.NETWORKS.find(function(x){ return x.id === n; });
      return net ? '<span title="' + net.name + '" style="margin-right:4px;">' + net.icon + '</span>' : '';
    }).join('');
    var preview = (p.caption || '').substring(0, 80) + ((p.caption || '').length > 80 ? '…' : '');
    var thumb = (p.media && p.media[0]) ? '<img src="' + UI.esc(p.media[0]) + '" style="width:42px;height:42px;border-radius:6px;object-fit:cover;">' : '<div style="width:42px;height:42px;border-radius:6px;background:var(--bg);display:flex;align-items:center;justify-content:center;color:var(--text-light);">📝</div>';
    return '<div onclick="SocialBranch._editPost(\'' + p.id + '\')" style="display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--border);cursor:pointer;">'
      + thumb
      + '<div style="flex:1;min-width:0;">'
      + '<div style="font-size:13px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + UI.esc(preview || '(no caption)') + '</div>'
      + '<div style="font-size:11px;color:var(--text-light);margin-top:2px;">' + when + '</div>'
      + '</div>'
      + '<div style="font-size:14px;">' + nets + '</div>'
      + statusBadge
      + '</div>';
  },

  _statusBadge: function(status) {
    var map = {
      draft:     { bg:'#f3f4f6', color:'#6b7280', label:'Draft' },
      scheduled: { bg:'#dbeafe', color:'#1e40af', label:'Queued' },
      posting:   { bg:'#fef3c7', color:'#92400e', label:'Posting…' },
      posted:    { bg:'#dcfce7', color:'#166534', label:'Posted' },
      failed:    { bg:'#fee2e2', color:'#991b1b', label:'Failed' }
    };
    var s = map[status] || map.draft;
    return '<span style="background:' + s.bg + ';color:' + s.color + ';font-size:10px;font-weight:700;padding:3px 8px;border-radius:10px;text-transform:uppercase;letter-spacing:.3px;">' + s.label + '</span>';
  },

  _formatWhen: function(iso) {
    if (!iso) return '';
    var d = new Date(iso), now = new Date();
    var diffMin = Math.round((d - now) / 60000);
    if (Math.abs(diffMin) < 60) return (diffMin < 0 ? Math.abs(diffMin) + 'm ago' : 'in ' + diffMin + 'm');
    var sameDay = d.toDateString() === now.toDateString();
    var opts = sameDay ? { hour:'numeric', minute:'2-digit' } : { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' };
    return d.toLocaleString('en-US', opts);
  },

  // ─────────────────────────────────────────────────────────
  // COMPOSE
  // ─────────────────────────────────────────────────────────
  _renderCompose: function() {
    var draft = SocialBranch._editingPost || { id:'', caption:'', media:[], networks:[], scheduledAt:'', status:'draft' };
    var html = '<div style="display:grid;grid-template-columns:1fr 320px;gap:16px;" class="sb-compose-grid">';

    // Left — editor
    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:18px;">';

    html += '<label style="display:block;font-size:12px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;">Caption</label>'
      + '<textarea id="sb-caption" rows="6" placeholder="What\'s happening at your tree service?" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:8px;font-size:14px;font-family:inherit;resize:vertical;box-sizing:border-box;">' + UI.esc(draft.caption || '') + '</textarea>'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;font-size:11px;color:var(--text-light);">'
      +   '<span>Tip: #treeservice #peekskill go a long way on GMB + IG</span>'
      +   '<span id="sb-charcount">0 / 2200</span>'
      + '</div>';

    html += '<div style="margin-top:16px;"><label style="display:block;font-size:12px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;">Media</label>'
      + '<div id="sb-media-preview" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;min-height:60px;"></div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
      +   '<button type="button" onclick="SocialBranch._pickFromMediaCenter()" style="background:var(--bg);border:1px dashed var(--border);padding:10px 14px;border-radius:8px;font-size:13px;cursor:pointer;">📂 Pick from Media Center</button>'
      +   '<label style="background:var(--bg);border:1px dashed var(--border);padding:10px 14px;border-radius:8px;font-size:13px;cursor:pointer;display:inline-block;">📤 Upload<input type="file" accept="image/*,video/*" multiple onchange="SocialBranch._uploadMedia(event)" style="display:none;"></label>'
      + '</div></div>';

    html += '<div style="margin-top:16px;"><label style="display:block;font-size:12px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px;">Post to networks</label>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px;" id="sb-networks">';
    var connected = SocialBranch._getConnectedNetworks();
    SocialBranch.NETWORKS.forEach(function(n) {
      var isConnected = connected.indexOf(n.id) >= 0;
      var checked = (draft.networks || []).indexOf(n.id) >= 0;
      html += '<label style="display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:20px;border:2px solid ' + (checked ? n.color : 'var(--border)') + ';background:' + (checked ? n.color + '14' : (isConnected ? 'var(--white)' : '#f9fafb')) + ';cursor:' + (isConnected ? 'pointer' : 'not-allowed') + ';opacity:' + (isConnected ? 1 : 0.5) + ';font-size:13px;font-weight:600;">'
        + '<input type="checkbox" value="' + n.id + '" ' + (checked ? 'checked' : '') + ' ' + (isConnected ? '' : 'disabled') + ' style="margin:0;">'
        + n.icon + ' ' + n.name
        + (isConnected ? '' : ' <span style="font-size:10px;color:var(--text-light);">(not connected)</span>')
        + '</label>';
    });
    html += '</div></div>';

    html += '<div style="margin-top:16px;"><label style="display:block;font-size:12px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;">Schedule (optional)</label>'
      + '<input type="datetime-local" id="sb-schedule" value="' + (draft.scheduledAt ? new Date(draft.scheduledAt).toISOString().slice(0,16) : '') + '" style="padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:14px;">'
      + '<div style="font-size:11px;color:var(--text-light);margin-top:4px;">Leave empty to publish immediately.</div>'
      + '</div>';

    html += '<div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap;">'
      + '<button onclick="SocialBranch._savePost(\'post\')" class="btn btn-primary" style="font-size:14px;">🚀 Publish / Schedule</button>'
      + '<button onclick="SocialBranch._savePost(\'draft\')" style="background:var(--white);border:1px solid var(--border);padding:10px 16px;border-radius:8px;font-size:14px;cursor:pointer;">💾 Save draft</button>'
      + '<button onclick="SocialBranch._clearDraft()" style="background:none;border:none;color:var(--text-light);padding:10px;cursor:pointer;font-size:13px;">Cancel</button>'
      + '</div>';

    html += '</div>';

    // Right — preview
    html += '<div>'
      + '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:16px;position:sticky;top:12px;">'
      +   '<div style="font-size:12px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:.4px;margin-bottom:10px;">Live Preview</div>'
      +   '<div id="sb-preview" style="background:var(--bg);border-radius:8px;padding:14px;font-size:13px;color:var(--text);min-height:120px;white-space:pre-wrap;word-break:break-word;">' + UI.esc(draft.caption || '(your caption will appear here)') + '</div>'
      +   '<div style="margin-top:12px;font-size:11px;color:var(--text-light);line-height:1.5;">Each network shortens differently. X caps at 280, GMB recommends 150, IG auto-shows 125 before "more".</div>'
      + '</div></div>';

    html += '</div>';

    // Restore media previews after render
    setTimeout(function() {
      var ta = document.getElementById('sb-caption');
      var cc = document.getElementById('sb-charcount');
      var pv = document.getElementById('sb-preview');
      if (ta) {
        var upd = function() {
          if (cc) cc.textContent = (ta.value.length) + ' / 2200';
          if (pv) pv.textContent = ta.value || '(your caption will appear here)';
        };
        ta.addEventListener('input', upd); upd();
      }
      SocialBranch._renderMediaPreview(draft.media || []);
    }, 50);

    return html;
  },

  _renderMediaPreview: function(media) {
    var host = document.getElementById('sb-media-preview');
    if (!host) return;
    SocialBranch._draftMedia = media.slice();
    if (media.length === 0) { host.innerHTML = '<div style="color:var(--text-light);font-size:12px;padding:12px;">No media attached yet.</div>'; return; }
    host.innerHTML = media.map(function(src, i) {
      return '<div style="position:relative;width:84px;height:84px;border-radius:6px;overflow:hidden;background:var(--bg);">'
        + '<img src="' + UI.esc(src) + '" style="width:100%;height:100%;object-fit:cover;">'
        + '<button onclick="SocialBranch._removeMedia(' + i + ')" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,.6);color:#fff;border:none;width:20px;height:20px;border-radius:50%;cursor:pointer;font-size:12px;line-height:1;">×</button>'
        + '</div>';
    }).join('');
  },

  _removeMedia: function(i) {
    SocialBranch._draftMedia.splice(i, 1);
    SocialBranch._renderMediaPreview(SocialBranch._draftMedia);
  },

  _uploadMedia: function(e) {
    var files = e.target.files; if (!files || !files.length) return;
    var existing = SocialBranch._draftMedia || [];
    Array.prototype.forEach.call(files, function(f) {
      var reader = new FileReader();
      reader.onload = function(evt) {
        existing.push(evt.target.result);
        SocialBranch._renderMediaPreview(existing);
      };
      reader.readAsDataURL(f);
    });
  },

  _pickFromMediaCenter: function() {
    // Pull from Media Center's stored photos
    var photos = [];
    try { photos = JSON.parse(localStorage.getItem('bm-media-library') || '[]'); } catch(e) {}
    if (photos.length === 0) { UI.toast('Media Center is empty — upload photos there first', 'warn'); return; }
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    var box = document.createElement('div');
    box.style.cssText = 'background:var(--white);border-radius:12px;max-width:640px;width:100%;max-height:80vh;overflow:auto;padding:20px;';
    var grid = photos.map(function(p, i) {
      var src = p.url || p.data || p;
      return '<div onclick="SocialBranch._addMediaFromLib(' + i + ');event.currentTarget.style.outline=\'3px solid var(--green-dark)\';" style="cursor:pointer;aspect-ratio:1;border-radius:6px;overflow:hidden;background:var(--bg);"><img src="' + UI.esc(src) + '" style="width:100%;height:100%;object-fit:cover;"></div>';
    }).join('');
    box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><h3 style="margin:0;">Pick photos</h3><button onclick="this.closest(\'.sb-modal\').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;">×</button></div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;">' + grid + '</div>'
      + '<div style="margin-top:14px;text-align:right;"><button onclick="this.closest(\'.sb-modal\').remove()" class="btn btn-primary">Done</button></div>';
    overlay.className = 'sb-modal';
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    SocialBranch._libPhotos = photos;
  },

  _addMediaFromLib: function(i) {
    var p = (SocialBranch._libPhotos || [])[i]; if (!p) return;
    var src = p.url || p.data || p;
    var existing = SocialBranch._draftMedia || [];
    if (existing.indexOf(src) < 0) existing.push(src);
    SocialBranch._renderMediaPreview(existing);
  },

  _savePost: function(action) {
    var caption = (document.getElementById('sb-caption') || {}).value || '';
    var schedule = (document.getElementById('sb-schedule') || {}).value || '';
    var networkInputs = document.querySelectorAll('#sb-networks input[type="checkbox"]:checked');
    var networks = Array.prototype.map.call(networkInputs, function(i) { return i.value; });

    if (action === 'post' && !networks.length) { UI.toast('Pick at least one network', 'error'); return; }
    if (action === 'post' && !caption && !(SocialBranch._draftMedia || []).length) { UI.toast('Add a caption or media', 'error'); return; }

    var post = SocialBranch._editingPost || {};
    post.id = post.id || ('sbp_' + Date.now() + '_' + Math.random().toString(36).slice(2,8));
    post.caption = caption;
    post.media = (SocialBranch._draftMedia || []).slice();
    post.networks = networks;
    post.scheduledAt = schedule ? new Date(schedule).toISOString() : '';
    post.createdAt = post.createdAt || new Date().toISOString();

    if (action === 'draft') {
      post.status = 'draft';
    } else if (schedule) {
      post.status = 'scheduled';
    } else {
      post.status = 'posting';
    }

    SocialBranch._upsertPost(post);
    SocialBranch._editingPost = null;
    SocialBranch._draftMedia = [];

    if (post.status === 'posting') {
      SocialBranch._publishNow(post);
    } else {
      UI.toast(post.status === 'scheduled' ? '📅 Scheduled!' : '💾 Draft saved');
      SocialBranch._goTab('dashboard');
    }
  },

  _clearDraft: function() {
    SocialBranch._editingPost = null;
    SocialBranch._draftMedia = [];
    SocialBranch._goTab('dashboard');
  },

  _editPost: function(id) {
    var p = SocialBranch._getPosts().find(function(x){ return x.id === id; });
    if (!p) return;
    SocialBranch._editingPost = Object.assign({}, p);
    SocialBranch._draftMedia = (p.media || []).slice();
    SocialBranch._goTab('compose');
  },

  // ─────────────────────────────────────────────────────────
  // PUBLISH — routes per network to the right backend
  // ─────────────────────────────────────────────────────────
  _publishNow: function(post) {
    var webhook = localStorage.getItem('bm-socialpilot-webhook') || '';

    // Instagram/GMB/Meta APIs require PUBLIC image URLs, not base64. Upload any
    // data-URL media to Supabase Storage → public URL → send that to webhook.
    SocialBranch._uploadMediaToPublicUrls(post.media || []).then(function(publicMedia) {
      var payload = {
        id: post.id,
        caption: post.caption,
        imageUrl: publicMedia[0] || '',
        media: publicMedia,
        platforms: post.networks,
        scheduledAt: post.scheduledAt || ''
      };

      if (webhook) {
        fetch(webhook, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
          .then(function(r) {
            post.status = r.ok ? 'posted' : 'failed';
            post.postedAt = new Date().toISOString();
            post.results = { httpStatus: r.status, backend: 'webhook', publicMedia: publicMedia };
            SocialBranch._upsertPost(post);
            UI.toast(r.ok ? '✅ Post sent' : '⚠️ Post failed — check webhook', r.ok ? 'success' : 'error');
            SocialBranch._goTab('dashboard');
          })
          .catch(function(e) {
            post.status = 'failed';
            post.results = { error: String(e.message || e), backend: 'webhook' };
            SocialBranch._upsertPost(post);
            UI.toast('❌ Network error', 'error');
            SocialBranch._goTab('dashboard');
          });
        return;
      }

      // No webhook, no direct APIs yet — save as draft
      post.status = 'draft';
      post.results = { note: 'No backend configured. Connect a webhook in Accounts or wait for direct APIs.' };
      SocialBranch._upsertPost(post);
      UI.toast('⚠️ Saved as draft — connect a backend in Accounts tab', 'warn');
      SocialBranch._goTab('accounts');
    }).catch(function(err) {
      post.status = 'failed';
      post.results = { error: 'Media upload failed: ' + String(err.message || err) };
      SocialBranch._upsertPost(post);
      UI.toast('❌ Couldn\'t upload media: ' + String(err.message || err), 'error');
      SocialBranch._goTab('dashboard');
    });
  },

  // Upload any base64/data-URL media to Supabase Storage and return an array
  // of public URLs. If an item is already a public URL, pass it through.
  _uploadMediaToPublicUrls: function(media) {
    if (!media || !media.length) return Promise.resolve([]);
    var url = localStorage.getItem('bm-supabase-url') || '';
    var key = localStorage.getItem('bm-supabase-key') || '';
    if (!url || !key) return Promise.reject(new Error('Supabase not configured'));
    var bucket = 'social-media';
    return Promise.all(media.map(function(src, i) {
      // Already a public URL? pass through.
      if (/^https?:\/\//i.test(src)) return Promise.resolve(src);
      if (!/^data:/.test(src)) return Promise.reject(new Error('Unsupported media source at index ' + i));
      // Parse data URL
      var match = /^data:([^;]+);base64,(.+)$/.exec(src);
      if (!match) return Promise.reject(new Error('Bad data URL at index ' + i));
      var contentType = match[1];
      var b64 = match[2];
      var ext = (contentType.split('/')[1] || 'bin').replace(/\+.+$/, '');
      var filename = 'sb_' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
      // Decode base64 to Blob
      var bin = atob(b64);
      var bytes = new Uint8Array(bin.length);
      for (var j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);
      var blob = new Blob([bytes], { type: contentType });
      var uploadUrl = url.replace(/\/$/, '') + '/storage/v1/object/' + bucket + '/' + filename;
      return fetch(uploadUrl, {
        method: 'POST',
        headers: { 'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': contentType, 'x-upsert': 'true' },
        body: blob
      }).then(function(r) {
        if (!r.ok) return r.text().then(function(t) { throw new Error('Upload ' + r.status + ': ' + t.slice(0,120)); });
        return url.replace(/\/$/, '') + '/storage/v1/object/public/' + bucket + '/' + filename;
      });
    }));
  },

  // ─────────────────────────────────────────────────────────
  // CALENDAR
  // ─────────────────────────────────────────────────────────
  _renderCalendar: function() {
    var posts = SocialBranch._getPosts().filter(function(p) { return p.status === 'scheduled' || p.status === 'posted'; });
    var now = new Date();
    var year = now.getFullYear(), month = now.getMonth();
    var first = new Date(year, month, 1);
    var daysInMonth = new Date(year, month+1, 0).getDate();
    var startDay = first.getDay();
    var title = first.toLocaleString('en-US', { month:'long', year:'numeric' });

    var html = '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:18px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;"><h3 style="margin:0;font-size:18px;">' + title + '</h3></div>'
      + '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;font-size:11px;font-weight:700;color:var(--text-light);text-transform:uppercase;margin-bottom:6px;">'
      + ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(function(d){ return '<div style="text-align:center;padding:6px 0;">'+d+'</div>'; }).join('')
      + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">';

    for (var i = 0; i < startDay; i++) html += '<div></div>';
    for (var d = 1; d <= daysInMonth; d++) {
      var dayDate = new Date(year, month, d);
      var dayKey = dayDate.toISOString().slice(0, 10);
      var dayPosts = posts.filter(function(p) {
        var when = p.scheduledAt || p.postedAt;
        return when && when.slice(0, 10) === dayKey;
      });
      var isToday = dayDate.toDateString() === now.toDateString();
      html += '<div style="min-height:80px;padding:6px;border:1px solid ' + (isToday ? 'var(--green-dark)' : 'var(--border)') + ';border-radius:6px;background:' + (isToday ? 'var(--green-bg)' : 'var(--white)') + ';">'
        + '<div style="font-size:11px;font-weight:700;color:' + (isToday ? 'var(--green-dark)' : 'var(--text-light)') + ';margin-bottom:4px;">' + d + '</div>';
      dayPosts.slice(0, 3).forEach(function(p) {
        var nets = (p.networks || []).slice(0, 3).map(function(nId) {
          var n = SocialBranch.NETWORKS.find(function(x){ return x.id === nId; });
          return n ? n.icon : '';
        }).join('');
        html += '<div onclick="SocialBranch._editPost(\'' + p.id + '\')" style="background:var(--bg);border-radius:4px;padding:3px 5px;margin-bottom:2px;font-size:10px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + nets + ' ' + UI.esc((p.caption || '').substring(0, 20)) + '</div>';
      });
      if (dayPosts.length > 3) html += '<div style="font-size:10px;color:var(--text-light);">+' + (dayPosts.length - 3) + ' more</div>';
      html += '</div>';
    }
    html += '</div></div>';
    return html;
  },

  // ─────────────────────────────────────────────────────────
  // ACCOUNTS
  // ─────────────────────────────────────────────────────────
  _renderAccounts: function() {
    var connected = SocialBranch._getConnectedNetworks();
    var webhook = localStorage.getItem('bm-socialpilot-webhook') || '';
    var gmbToken = localStorage.getItem('bm-gmb-access-token') || '';

    var html = '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:18px;margin-bottom:14px;">'
      + '<h3 style="margin:0 0 8px;font-size:16px;">Backends</h3>'
      + '<p style="color:var(--text-light);font-size:13px;margin:0 0 16px;">SocialBranch routes posts through the first configured backend. Webhook works today on any plan; direct APIs come online as you connect OAuth per network.</p>';

    // Webhook row
    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:10px;">'
      + '<div><div style="font-weight:700;font-size:14px;">🔗 Zapier / Make Webhook</div>'
      + '<div style="font-size:12px;color:var(--text-light);">' + (webhook ? '✅ Configured — ' + webhook.substring(0, 50) + '…' : '⚠️ Not set') + '</div></div>'
      + '<button onclick="loadPage(\'settings\')" style="background:var(--white);border:1px solid var(--border);padding:8px 14px;border-radius:6px;font-size:12px;cursor:pointer;">Configure</button>'
      + '</div>';

    // GMB row
    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:10px;">'
      + '<div><div style="font-weight:700;font-size:14px;">🔵 Google Business Profile</div>'
      + '<div style="font-size:12px;color:var(--text-light);">' + (gmbToken ? '✅ Connected' : '⚠️ Not connected') + '</div></div>'
      + '<button onclick="loadPage(\'settings\')" style="background:var(--white);border:1px solid var(--border);padding:8px 14px;border-radius:6px;font-size:12px;cursor:pointer;">Configure</button>'
      + '</div>';

    html += '</div>';

    // Network map
    html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:18px;">'
      + '<h3 style="margin:0 0 12px;font-size:16px;">Networks</h3>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;">';
    SocialBranch.NETWORKS.forEach(function(n) {
      var isC = connected.indexOf(n.id) >= 0;
      html += '<div style="padding:14px;border:1px solid var(--border);border-radius:10px;background:' + (isC ? n.color + '10' : 'var(--white)') + ';">'
        + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><span style="font-size:20px;">' + n.icon + '</span><div style="font-weight:700;">' + n.name + '</div></div>'
        + '<div style="font-size:12px;color:' + (isC ? 'var(--green-dark)' : 'var(--text-light)') + ';font-weight:600;">' + (isC ? '✅ Reachable' : '⚪ Awaiting backend') + '</div>'
        + '</div>';
    });
    html += '</div></div>';

    return html;
  },

  // ─────────────────────────────────────────────────────────
  // ANALYTICS (placeholder — real data once direct APIs connect)
  // ─────────────────────────────────────────────────────────
  _renderAnalytics: function() {
    var posts = SocialBranch._getPosts().filter(function(p){ return p.status === 'posted'; });
    var total = posts.length;
    var byNetwork = {};
    posts.forEach(function(p) {
      (p.networks || []).forEach(function(n) { byNetwork[n] = (byNetwork[n] || 0) + 1; });
    });

    var html = '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:18px;">'
      + '<h3 style="margin:0 0 12px;font-size:16px;">Posting Volume</h3>'
      + '<div style="font-size:36px;font-weight:800;color:var(--green-dark);margin-bottom:4px;">' + total + '</div>'
      + '<div style="font-size:13px;color:var(--text-light);margin-bottom:20px;">total posts shipped</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;">';
    SocialBranch.NETWORKS.forEach(function(n) {
      var c = byNetwork[n.id] || 0;
      html += '<div style="padding:14px;border:1px solid var(--border);border-radius:10px;">'
        + '<div style="font-size:12px;color:var(--text-light);">' + n.icon + ' ' + n.name + '</div>'
        + '<div style="font-size:22px;font-weight:700;color:' + n.color + ';">' + c + '</div></div>';
    });
    html += '</div>'
      + '<div style="margin-top:20px;padding:12px;background:var(--bg);border-radius:8px;font-size:12px;color:var(--text-light);">Engagement metrics (likes, reach, clicks) arrive once direct APIs are wired per network. Webhook-only posting can\'t report back.</div>'
      + '</div>';
    return html;
  },

  // ─────────────────────────────────────────────────────────
  // INBOX (placeholder)
  // ─────────────────────────────────────────────────────────
  _renderInbox: function() {
    return '<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;padding:40px;text-align:center;">'
      + '<div style="font-size:42px;margin-bottom:10px;">💬</div>'
      + '<h3 style="margin:0 0 8px;">Unified Inbox coming next</h3>'
      + '<p style="color:var(--text-light);font-size:13px;max-width:420px;margin:0 auto;">Once FB/IG/GMB OAuth is connected, all DMs, comments, and reviews land here. Currently they live in each network\'s own app.</p>'
      + '</div>';
  },

  // ─────────────────────────────────────────────────────────
  // STORAGE
  // ─────────────────────────────────────────────────────────
  _getPosts: function() {
    try { return JSON.parse(localStorage.getItem('bm-social-posts') || '[]'); }
    catch (e) { return []; }
  },
  _setPosts: function(posts) {
    localStorage.setItem('bm-social-posts', JSON.stringify(posts));
  },
  _upsertPost: function(post) {
    var posts = SocialBranch._getPosts();
    var idx = posts.findIndex(function(p){ return p.id === post.id; });
    if (idx >= 0) posts[idx] = post; else posts.unshift(post);
    SocialBranch._setPosts(posts);
  },

  _getConnectedNetworks: function() {
    var connected = [];
    var webhook = (localStorage.getItem('bm-socialpilot-webhook') || '').length > 10;
    var gmbToken = (localStorage.getItem('bm-gmb-access-token') || '').length > 20;
    // Webhook implicitly reaches every network you've wired in the Zap
    if (webhook) SocialBranch.NETWORKS.forEach(function(n) { connected.push(n.id); });
    if (gmbToken && connected.indexOf('gmb') < 0) connected.push('gmb');
    return connected;
  },

  // Fires scheduled posts that are due — call on app load
  runScheduler: function() {
    var posts = SocialBranch._getPosts();
    var now = Date.now();
    var due = posts.filter(function(p) {
      return p.status === 'scheduled' && p.scheduledAt && new Date(p.scheduledAt).getTime() <= now;
    });
    if (!due.length) return;
    due.forEach(function(p) {
      p.status = 'posting';
      SocialBranch._upsertPost(p);
      SocialBranch._publishNow(p);
    });
  }
};

// Kick the scheduler on app load + every 60s
if (typeof window !== 'undefined') {
  setTimeout(function() { try { SocialBranch.runScheduler(); } catch(e){} }, 5000);
  setInterval(function() { try { SocialBranch.runScheduler(); } catch(e){} }, 60000);
}

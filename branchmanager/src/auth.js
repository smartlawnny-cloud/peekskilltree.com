/**
 * Branch Manager — Authentication
 * Supabase Auth with email/password login
 * Role-based access: Owner, Crew Lead, Crew Member
 */
var Auth = {
  user: null,
  role: null,

  init: function() {
    // URL-based logout escape hatch: ?logout=1
    if (window.location.search.includes('logout=1')) {
      localStorage.removeItem('bm-session');
      window.location.href = window.location.pathname;
      return;
    }
    // Check for existing session
    var session = localStorage.getItem('bm-session');
    if (session) {
      try {
        Auth.user = JSON.parse(session);
        Auth.role = Auth.user.role || 'owner';
      } catch(e) {
        localStorage.removeItem('bm-session');
      }
    }
  },

  isLoggedIn: function() {
    return !!Auth.user;
  },

  isOwner: function() {
    return Auth.role === 'owner';
  },

  isCrewLead: function() {
    return Auth.role === 'owner' || Auth.role === 'crew_lead';
  },

  // Show login screen
  renderLogin: function() {
    return '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:20px;">'
      + '<div style="background:var(--white);border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:400px;width:100%;padding:40px;">'
      + '<div style="text-align:center;margin-bottom:32px;">'
      + '<div style="font-size:48px;margin-bottom:8px;">🌳</div>'
      + '<h1 style="font-size:24px;color:var(--green-dark);margin-bottom:4px;">Branch Manager</h1>'
      + '<p style="font-size:14px;color:var(--text-light);">Second Nature Tree Service</p>'
      + '</div>'
      + '<form onsubmit="Auth.login(event)">'
      + '<div style="margin-bottom:12px;">'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Email</label>'
      + '<input type="email" id="auth-email" required placeholder="you@email.com" style="width:100%;padding:12px;border:2px solid var(--border);border-radius:10px;font-size:15px;" autofocus>'
      + '</div>'
      + '<div style="margin-bottom:16px;">'
      + '<label style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:4px;">Password</label>'
      + '<input type="password" id="auth-password" required placeholder="••••••••" style="width:100%;padding:12px;border:2px solid var(--border);border-radius:10px;font-size:15px;">'
      + '</div>'
      + '<button type="submit" id="auth-submit" style="width:100%;padding:14px;background:var(--green-dark);color:#fff;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;">Sign In</button>'
      + '<div id="auth-error" style="display:none;margin-top:12px;padding:10px;background:#fde8e8;border-radius:8px;font-size:13px;color:#c0392b;text-align:center;"></div>'
      + '</form>'
      + '<div style="margin-top:24px;text-align:center;">'
      + '<button onclick="Auth.showQuickLogin()" style="background:none;border:none;color:var(--text-light);font-size:12px;cursor:pointer;text-decoration:underline;">Quick login (demo)</button>'
      + '</div>'
      + '<div id="quick-login" style="display:none;margin-top:12px;">'
      + '<div style="font-size:12px;color:var(--text-light);margin-bottom:8px;text-align:center;">Select a role:</div>'
      + '<div style="display:grid;gap:6px;">'
      + '<button onclick="Auth.quickLogin(\'owner\')" style="padding:10px;background:var(--green-bg);border:1px solid #c8e6c9;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;color:var(--green-dark);">👑 Owner — Full access</button>'
      + '<button onclick="Auth.quickLogin(\'crew_lead\')" style="padding:10px;background:#e3f2fd;border:1px solid #bbdefb;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;color:#1565c0;">👷 Crew Lead — Jobs, schedule, photos</button>'
      + '<button onclick="Auth.quickLogin(\'crew_member\')" style="padding:10px;background:#fff3e0;border:1px solid #ffe0b2;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;color:#e65100;">🧑‍🔧 Crew Member — Today\'s schedule, clock in/out</button>'
      + '</div></div>'
      + '</div></div>';
  },

  login: async function(event) {
    event.preventDefault();
    var email = document.getElementById('auth-email').value.trim();
    var password = document.getElementById('auth-password').value;
    var btn = document.getElementById('auth-submit');
    var errEl = document.getElementById('auth-error');

    btn.textContent = 'Signing in...';
    btn.disabled = true;
    errEl.style.display = 'none';

    // Try Supabase auth
    if (SupabaseDB && SupabaseDB.ready) {
      try {
        var { data, error } = await SupabaseDB.client.auth.signInWithPassword({ email: email, password: password });
        if (error) throw error;
        Auth.user = { email: data.user.email, id: data.user.id, role: 'owner', name: 'Doug Brown' };
        Auth.role = 'owner';
        localStorage.setItem('bm-session', JSON.stringify(Auth.user));
        window.location.reload();
        return;
      } catch(e) {
        // Fall through to local auth
        console.warn('Supabase auth failed:', e.message);
      }
    }

    // Local auth fallback — case insensitive email
    // Uses djb2 hash for password comparison (no plaintext passwords in source)
    // To generate a hash: Auth._hash('yourpassword') in browser console
    var emailLower = email.toLowerCase();
    var customHashes = {};
    try { customHashes = JSON.parse(localStorage.getItem('bm-auth-hashes') || '{}'); } catch(e) {}
    var users = {
      'info@peekskilltree.com': { hash: customHashes['info@peekskilltree.com'] || '28006cfd', role: 'owner', name: 'Doug Brown' },
      'crew@peekskilltree.com': { hash: customHashes['crew@peekskilltree.com'] || '14b65440', role: 'crew_lead', name: 'Crew Lead' },
      'doug@peekskilltree.com': { hash: customHashes['doug@peekskilltree.com'] || '28006cfd', role: 'owner', name: 'Doug Brown' }
    };

    var user = users[emailLower];
    if (user && Auth._hash(password) === user.hash) {
      Auth.user = { email: email, role: user.role, name: user.name };
      Auth.role = user.role;
      localStorage.setItem('bm-session', JSON.stringify(Auth.user));
      window.location.reload();
    } else {
      errEl.textContent = 'Invalid email or password';
      errEl.style.display = 'block';
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  },

  showQuickLogin: function() {
    document.getElementById('quick-login').style.display = 'block';
  },

  quickLogin: function(role) {
    var names = { owner: 'Doug Brown', crew_lead: 'Crew Lead', crew_member: 'Crew Member' };
    Auth.user = { email: role + '@demo', role: role, name: names[role] };
    Auth.role = role;
    localStorage.setItem('bm-session', JSON.stringify(Auth.user));
    window.location.reload();
  },

  // djb2 hash — simple, fast, no dependencies. Returns hex string.
  // Generate new hash: Auth._hash('yourpassword') in browser console
  _hash: function(str) {
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & 0xffffffff;
    }
    return (hash >>> 0).toString(16);
  },

  logout: function() {
    Auth.user = null;
    Auth.role = null;
    localStorage.removeItem('bm-session');
    // Clear sensitive cached data on logout
    localStorage.removeItem('bm-recent-search');
    localStorage.removeItem('bm-recent-searches');
    if (SupabaseDB && SupabaseDB.ready) {
      SupabaseDB.client.auth.signOut().catch(function() {});
    }
    // Clear service worker cache for security
    if ('caches' in window) {
      caches.keys().then(function(names) {
        names.forEach(function(n) { caches.delete(n); });
      });
    }
    window.location.reload();
  },

  // Session timeout — auto logout after 30 min inactivity
  _TIMEOUT_MS: 30 * 60 * 1000,
  _lastActivity: Date.now(),
  _timeoutTimer: null,

  resetActivity: function() {
    Auth._lastActivity = Date.now();
  },

  startSessionTimer: function() {
    if (Auth._timeoutTimer) clearInterval(Auth._timeoutTimer);
    Auth._timeoutTimer = setInterval(function() {
      if (Auth.isLoggedIn() && (Date.now() - Auth._lastActivity) > Auth._TIMEOUT_MS) {
        UI.toast('Session expired — logging out for security', 'error');
        setTimeout(function() { Auth.logout(); }, 1500);
      }
    }, 60000); // Check every minute
    // Track activity
    ['click', 'keydown', 'scroll', 'touchstart'].forEach(function(evt) {
      document.addEventListener(evt, Auth.resetActivity, { passive: true });
    });
  },

  // Get pages visible for current role
  getVisiblePages: function() {
    var all = ['dashboard','pipeline','schedule','dispatch','clients','requests','quotes','jobs','invoices',
      'payments','insights','reviews','reviewtools','satisfaction','team','timesheet','automations',
      'calculators','messaging','clientmap','photomap','propertymap','recurring','notifications',
      'expenses','profitloss','jobcosting','budget','reports','weeklysummary','onlinebooking',
      'clienthub','formbuilder','mediacenter','beforeafter','campaigns','referrals','receptionist',
      'import','backup','settings','crewview','crewperformance','employeecenter','equipment',
      'materials','comms','emailtemplates','customfields','visits','checklists','workflow',
      'ai','treemeasure','reminders','search'];

    if (Auth.role === 'crew_member') {
      return ['crewview','dispatch','schedule','timesheet','employeecenter','budget','notifications'];
    }
    if (Auth.role === 'crew_lead') {
      return ['dashboard','dispatch','schedule','clients','jobs','quotes','timesheet','messaging','employeecenter','budget','notifications','expenses'];
    }
    return all; // owner sees everything
  },

  // Check if current user can see a page
  canAccess: function(page) {
    return Auth.getVisiblePages().indexOf(page) >= 0;
  }
};

// Init on load
Auth.init();

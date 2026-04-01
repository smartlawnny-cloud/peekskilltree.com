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
    var emailLower = email.toLowerCase();
    var users = {
      'info@peekskilltree.com': { password: 'branch2026', role: 'owner', name: 'Doug Brown' },
      'crew@peekskilltree.com': { password: 'crew2026', role: 'crew_lead', name: 'Crew Lead' },
      'doug@peekskilltree.com': { password: 'branch2026', role: 'owner', name: 'Doug Brown' }
    };

    var user = users[emailLower];
    if (user && user.password === password) {
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

  logout: function() {
    Auth.user = null;
    Auth.role = null;
    localStorage.removeItem('bm-session');
    if (SupabaseDB && SupabaseDB.ready) {
      SupabaseDB.client.auth.signOut().catch(function() {});
    }
    window.location.reload();
  },

  // Get pages visible for current role
  getVisiblePages: function() {
    var all = ['dashboard','pipeline','schedule','dispatch','clients','requests','quotes','jobs','invoices',
      'insights','reviews','team','timesheet','automations','calculators','messaging','clientmap',
      'recurring','notifications','expenses','profitloss','reports','onlinebooking','import','settings'];

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

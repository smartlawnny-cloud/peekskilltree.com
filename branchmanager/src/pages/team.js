/**
 * Branch Manager — Team Management
 * Add/edit team members, assign roles, view hours
 */
var TeamPage = {
  render: function() {
    var members = TeamPage.getMembers();
    var entries = DB.timeEntries.getAll();

    var html = '<div class="stat-grid">'
      + UI.statCard('Team Size', members.length.toString(), 'Active members', '', '')
      + UI.statCard('Hours This Week', TeamPage.weekHours().toFixed(1), 'All members', '', '')
      + '</div>';

    // Team list
    html += '<div style="background:var(--white);border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      + '<table class="data-table"><thead><tr>'
      + '<th>Name</th><th>Role</th><th>Phone</th><th>Email</th><th>Hours (Week)</th><th>Status</th>'
      + '</tr></thead><tbody>';

    if (members.length === 0) {
      html += '<tr><td colspan="6">' + UI.emptyState('👷', 'No team members', 'Add your crew to start tracking time.', '+ Add Member', 'TeamPage.showForm()') + '</td></tr>';
    } else {
      members.forEach(function(m) {
        var weekHrs = TeamPage.memberWeekHours(m.name);
        html += '<tr onclick="TeamPage.showDetail(\'' + m.id + '\')">'
          + '<td><strong>' + m.name + '</strong></td>'
          + '<td>' + UI.statusBadge(m.role) + '</td>'
          + '<td>' + UI.phone(m.phone) + '</td>'
          + '<td style="font-size:13px;">' + (m.email || '—') + '</td>'
          + '<td style="font-weight:600;">' + weekHrs.toFixed(1) + ' hrs</td>'
          + '<td>' + (m.active ? '<span style="color:var(--green-dark);">Active</span>' : '<span style="color:var(--text-light);">Inactive</span>') + '</td>'
          + '</tr>';
      });
    }
    html += '</tbody></table></div>';

    return html;
  },

  getMembers: function() {
    var stored = JSON.parse(localStorage.getItem('bm-team') || '[]');
    if (stored.length === 0) {
      // Seed with default team from Jobber
      stored = [
        { id: 'owner', name: 'Doug Brown', role: 'owner', phone: '(914) 391-5233', email: 'info@peekskilltree.com', active: true },
        { id: 'ryan', name: 'Ryan Knapp', role: 'crew_lead', phone: '', email: '', active: true },
        { id: 'anthony', name: 'Anthony Turner', role: 'crew_member', phone: '', email: '', active: true },
        { id: 'catherine', name: 'Catherine Conway', role: 'crew_member', phone: '', email: '', active: true }
      ];
      localStorage.setItem('bm-team', JSON.stringify(stored));
    }
    return stored;
  },

  saveMember: function(member) {
    var members = TeamPage.getMembers();
    var idx = members.findIndex(function(m) { return m.id === member.id; });
    if (idx >= 0) {
      members[idx] = member;
    } else {
      member.id = member.id || Date.now().toString(36);
      members.push(member);
    }
    localStorage.setItem('bm-team', JSON.stringify(members));
  },

  removeMember: function(id) {
    var members = TeamPage.getMembers().filter(function(m) { return m.id !== id; });
    localStorage.setItem('bm-team', JSON.stringify(members));
  },

  weekHours: function() {
    var now = new Date();
    var weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    var startStr = weekStart.toISOString().split('T')[0];
    return DB.timeEntries.getAll().filter(function(t) { return t.date >= startStr; })
      .reduce(function(sum, t) { return sum + (t.hours || 0); }, 0);
  },

  memberWeekHours: function(name) {
    var now = new Date();
    var weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    var startStr = weekStart.toISOString().split('T')[0];
    return DB.timeEntries.getAll().filter(function(t) { return t.userId === name && t.date >= startStr; })
      .reduce(function(sum, t) { return sum + (t.hours || 0); }, 0);
  },

  showForm: function(id) {
    var m = id ? TeamPage.getMembers().find(function(mem) { return mem.id === id; }) : {};
    var title = id ? 'Edit Team Member' : 'Add Team Member';

    var html = '<form id="team-form" onsubmit="TeamPage.save(event, \'' + (id || '') + '\')">'
      + UI.formField('Name *', 'text', 'tm-name', m.name, { required: true, placeholder: 'Full name' })
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      + UI.formField('Phone', 'tel', 'tm-phone', m.phone, { placeholder: '(914) 555-0000' })
      + UI.formField('Email', 'email', 'tm-email', m.email, { placeholder: 'email@example.com' })
      + '</div>'
      + UI.formField('Role', 'select', 'tm-role', m.role || 'crew', { options: [
          { value: 'owner', label: 'Owner — Full access' },
          { value: 'crew_lead', label: 'Crew Lead — Jobs, schedule, clients' },
          { value: 'crew', label: 'Crew Member — Clock in/out, today\'s jobs' }
        ]})
      + '</form>';

    UI.showModal(title, html, {
      footer: (id && id !== 'owner' ? '<button class="btn" style="background:var(--red);color:#fff;margin-right:auto;" onclick="TeamPage.remove(\'' + id + '\')">Remove</button>' : '')
        + '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-primary" onclick="document.getElementById(\'team-form\').requestSubmit()">Save</button>'
    });
  },

  save: function(e, id) {
    e.preventDefault();
    var data = {
      id: id || Date.now().toString(36),
      name: document.getElementById('tm-name').value.trim(),
      phone: document.getElementById('tm-phone').value.trim(),
      email: document.getElementById('tm-email').value.trim(),
      role: document.getElementById('tm-role').value,
      active: true
    };
    if (!data.name) { UI.toast('Name is required', 'error'); return; }
    TeamPage.saveMember(data);
    UI.toast(id ? 'Member updated' : 'Member added');
    UI.closeModal();
    loadPage('team');
  },

  remove: function(id) {
    UI.confirm('Remove this team member?', function() {
      TeamPage.removeMember(id);
      UI.toast('Member removed');
      UI.closeModal();
      loadPage('team');
    });
  },

  showDetail: function(id) {
    var m = TeamPage.getMembers().find(function(mem) { return mem.id === id; });
    if (!m) return;

    var html = '<div style="text-align:center;margin-bottom:20px;">'
      + '<div style="font-size:48px;margin-bottom:8px;">👷</div>'
      + '<h2>' + m.name + '</h2>'
      + '<div>' + UI.statusBadge(m.role) + '</div>'
      + '</div>'
      + '<div style="font-size:14px;line-height:2;">'
      + (m.phone ? '<div>📞 ' + UI.phone(m.phone) + '</div>' : '')
      + (m.email ? '<div>✉️ ' + m.email + '</div>' : '')
      + '<div>⏱️ Hours this week: <strong>' + TeamPage.memberWeekHours(m.name).toFixed(1) + '</strong></div>'
      + '</div>';

    // Recent time entries
    var entries = DB.timeEntries.getAll().filter(function(t) { return t.userId === m.name; }).slice(0, 10);
    if (entries.length > 0) {
      html += '<h4 style="margin-top:16px;margin-bottom:8px;">Recent Time Entries</h4>';
      entries.forEach(function(t) {
        var job = t.jobId ? DB.jobs.getById(t.jobId) : null;
        html += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:13px;">'
          + '<span>' + UI.dateShort(t.date) + ' — ' + (job ? job.clientName : 'General') + '</span>'
          + '<span style="font-weight:600;">' + (t.hours || 0).toFixed(1) + ' hrs</span>'
          + '</div>';
      });
    }

    UI.showModal(m.name, html, {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Close</button>'
        + ' <button class="btn btn-primary" onclick="UI.closeModal();TeamPage.showForm(\'' + id + '\')">Edit</button>'
    });
  }
};

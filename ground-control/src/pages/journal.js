/**
 * Ground Control — Journal Page
 * Past entries + new entry editor.
 */
var JournalPage = {
  render: function() {
    var entries = DB.checkins.getAll().filter(function(c) { return c.journal; });
    var today = DB.checkins.getToday();

    var html = '<div class="journal-page">';
    html += '<h1>Journal</h1>';

    // Quick entry (if today doesn't have one)
    if (!today || !today.journal) {
      var dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
      var prompt = GC_CONFIG.prompts[dayOfYear % GC_CONFIG.prompts.length];

      html += '<div class="journal-new">';
      html += '<p class="journal-prompt-header">"' + prompt + '"</p>';
      html += '<textarea id="journal-new-text" class="gc-textarea" rows="4" placeholder="Whatever comes to mind..."></textarea>';
      html += '<button class="gc-btn gc-btn-primary" onclick="JournalPage._save()">Save</button>';
      html += '</div>';
    }

    // Past entries
    if (entries.length) {
      html += '<div class="journal-list">';
      entries.forEach(function(e) {
        html += '<div class="journal-entry" onclick="JournalPage._viewEntry(\'' + e.date + '\')">';
        html += '<div class="journal-entry-header">';
        html += '<span class="journal-entry-date">' + UI.dateFull(e.date) + '</span>';
        html += '<span class="journal-entry-mood">' + UI.moodEmoji(e.mood_am) + ' ' + (e.energy_am || '') + '</span>';
        html += '</div>';
        html += '<p class="journal-entry-preview">' + UI.esc(e.journal.substring(0, 120)) + (e.journal.length > 120 ? '...' : '') + '</p>';
        html += '</div>';
      });
      html += '</div>';
    } else if (today && today.journal) {
      html += '<div class="journal-empty">';
      html += '<p>Your journal entries will appear here.</p>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  _save: function() {
    var text = document.getElementById('journal-new-text').value.trim();
    if (!text) {
      UI.toast('Write something first', 'warning');
      return;
    }
    DB.checkins.saveToday({ journal: text });
    UI.toast('Saved', 'success');
    loadPage('journal');
  },

  _viewEntry: function(date) {
    var entry = DB.checkins.getByDate(date);
    if (!entry) return;

    var body = '';
    body += '<div class="journal-view-meta">';
    body += UI.moodEmoji(entry.mood_am) + ' Energy: ' + (entry.energy_am || '-') + '/10';
    if (entry.movement_type && entry.movement_type !== 'skip') {
      body += ' &middot; ' + entry.movement_type + ' (' + (entry.movement_minutes || 0) + ' min)';
    }
    body += '</div>';
    body += '<div class="journal-view-text">' + UI.esc(entry.journal).replace(/\n/g, '<br>') + '</div>';

    if (entry.priority_must || entry.priority_should || entry.priority_want) {
      body += '<div class="journal-view-priorities">';
      body += '<h4>Priorities</h4>';
      if (entry.priority_must) body += '<div>' + (entry.priority_must_done ? '&#10003; ' : '&#9675; ') + UI.esc(entry.priority_must) + '</div>';
      if (entry.priority_should) body += '<div>' + (entry.priority_should_done ? '&#10003; ' : '&#9675; ') + UI.esc(entry.priority_should) + '</div>';
      if (entry.priority_want) body += '<div>' + (entry.priority_want_done ? '&#10003; ' : '&#9675; ') + UI.esc(entry.priority_want) + '</div>';
      body += '</div>';
    }

    UI.showModal(UI.dateFull(date), body);
  }
};

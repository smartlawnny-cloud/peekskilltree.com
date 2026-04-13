/**
 * Ground Control — Evening Check-in Page
 */
var EveningPage = {
  render: function() {
    var today = DB.checkins.getToday();

    var html = '<div class="evening-page">';
    html += '<h1>Evening Check-in</h1>';

    if (!today || !today.priorities_set) {
      html += '<div class="evening-empty">';
      html += '<p>Complete your morning ritual first.</p>';
      html += '<button class="gc-btn gc-btn-primary" onclick="loadPage(\'ritual\')">Go to Ritual</button>';
      html += '</div>';
      html += '</div>';
      return html;
    }

    if (today.energy_pm) {
      // Already done
      html += EveningPage._doneView(today);
      html += '</div>';
      return html;
    }

    // Priority review
    html += '<div class="step-card step-active">';
    html += '<h2>How did it go?</h2>';

    if (today.priority_must) {
      html += '<div class="evening-priority">';
      html += '<label class="evening-check">';
      html += '<input type="checkbox" id="ev-must" ' + (today.priority_must_done ? 'checked' : '') + '>';
      html += '<span class="priority-dot priority-must-dot"></span>';
      html += UI.esc(today.priority_must);
      html += '</label>';
      html += '</div>';
    }

    if (today.priority_should) {
      html += '<div class="evening-priority">';
      html += '<label class="evening-check">';
      html += '<input type="checkbox" id="ev-should" ' + (today.priority_should_done ? 'checked' : '') + '>';
      html += '<span class="priority-dot priority-should-dot"></span>';
      html += UI.esc(today.priority_should);
      html += '</label>';
      html += '</div>';
    }

    if (today.priority_want) {
      html += '<div class="evening-priority">';
      html += '<label class="evening-check">';
      html += '<input type="checkbox" id="ev-want" ' + (today.priority_want_done ? 'checked' : '') + '>';
      html += '<span class="priority-dot priority-want-dot"></span>';
      html += UI.esc(today.priority_want);
      html += '</label>';
      html += '</div>';
    }

    // Energy PM
    html += '<div class="field-group" style="margin-top:20px">';
    html += '<label>Energy now</label>';
    html += '<div class="energy-slider">';
    html += '<input type="range" id="energy-pm" min="1" max="10" value="' + (today.energy_pm || today.energy_am || 5) + '" oninput="document.getElementById(\'energy-pm-val\').textContent=this.value">';
    html += '<span class="energy-val" id="energy-pm-val">' + (today.energy_pm || today.energy_am || 5) + '</span>';
    html += '<span class="energy-label">/10</span>';
    html += '</div>';
    html += '</div>';

    // Mood PM
    html += '<div class="field-group">';
    html += '<label>Mood now</label>';
    html += '<div class="mood-picker">';
    GC_CONFIG.moods.forEach(function(m) {
      var sel = today.mood_pm === m.value ? ' mood-selected' : '';
      html += '<button class="mood-btn' + sel + '" onclick="EveningPage._setMood(\'' + m.value + '\')" title="' + m.label + '">';
      html += '<span class="mood-emoji">' + m.emoji + '</span>';
      html += '</button>';
    });
    html += '</div>';
    html += '</div>';

    // Evening note
    html += '<div class="field-group">';
    html += '<label>One sentence: how was today?</label>';
    html += '<input type="text" id="ev-note" class="gc-input" placeholder="In a word or a sentence..." value="' + UI.esc(today.evening_note || '') + '">';
    html += '</div>';

    html += '<button class="gc-btn gc-btn-primary" onclick="EveningPage._save()">Close out the day</button>';
    html += '</div>';

    html += '</div>';
    return html;
  },

  _setMood: function(value) {
    document.querySelectorAll('.evening-page .mood-btn').forEach(function(b) { b.classList.remove('mood-selected'); });
    event.currentTarget.classList.add('mood-selected');
    EveningPage._selectedMood = value;
  },

  _save: function() {
    var data = {
      energy_pm: parseInt(document.getElementById('energy-pm').value),
      mood_pm: EveningPage._selectedMood || null,
      evening_note: document.getElementById('ev-note').value.trim()
    };

    var mustEl = document.getElementById('ev-must');
    var shouldEl = document.getElementById('ev-should');
    var wantEl = document.getElementById('ev-want');

    if (mustEl) data.priority_must_done = mustEl.checked;
    if (shouldEl) data.priority_should_done = shouldEl.checked;
    if (wantEl) data.priority_want_done = wantEl.checked;

    DB.checkins.saveToday(data);
    EveningPage._selectedMood = null;
    UI.toast('Day closed out', 'success');
    loadPage('evening');
  },

  _doneView: function(today) {
    var html = '<div class="done-view">';
    html += '<div class="done-check">&#10003;</div>';
    html += '<h2>Day closed</h2>';

    html += '<div class="done-summary">';
    html += '<div class="done-stat">';
    html += '<span class="done-stat-val">' + (today.energy_am || '-') + ' &rarr; ' + (today.energy_pm || '-') + '</span>';
    html += '<span class="done-stat-label">Energy AM &rarr; PM</span>';
    html += '</div>';
    html += '<div class="done-stat">';
    html += '<span class="done-stat-val">' + UI.moodEmoji(today.mood_am) + ' &rarr; ' + UI.moodEmoji(today.mood_pm) + '</span>';
    html += '<span class="done-stat-label">Mood</span>';
    html += '</div>';
    html += '</div>';

    if (today.evening_note) {
      html += '<p class="evening-note-display">"' + UI.esc(today.evening_note) + '"</p>';
    }

    // Priorities outcome
    var done = 0, total = 0;
    if (today.priority_must) { total++; if (today.priority_must_done) done++; }
    if (today.priority_should) { total++; if (today.priority_should_done) done++; }
    if (today.priority_want) { total++; if (today.priority_want_done) done++; }
    if (total) {
      html += '<p class="evening-priorities-result">' + done + '/' + total + ' priorities completed</p>';
    }

    html += '</div>';
    return html;
  }
};

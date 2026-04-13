/**
 * Ground Control — Morning Ritual Page
 * The core experience. One step at a time.
 */
var RitualPage = {
  _timer: null,
  _timerSeconds: 0,

  render: function() {
    var today = DB.checkins.getToday() || {};
    var settings = DB.settings.get();
    var step = RitualPage._currentStep(today);
    var patterns = DB.stats.detectPatterns();

    var html = '<div class="ritual-page">';

    // Greeting
    html += '<div class="ritual-greeting">';
    html += '<h1>' + UI.greeting(settings.name) + '</h1>';
    html += '<p class="ritual-date">' + UI.dateFull(DB.today()) + '</p>';
    html += '</div>';

    // Progress bar
    html += RitualPage._progressBar(today);

    // Pattern alerts (show before ritual if there are any)
    if (patterns.length && step === 'checkin') {
      html += '<div class="ritual-patterns">';
      patterns.forEach(function(p) {
        html += '<div class="pattern-card pattern-' + p.type + '">';
        html += '<span class="pattern-icon">' + p.icon + '</span>';
        html += '<span class="pattern-msg">' + UI.esc(p.message) + '</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    // Steps
    if (step === 'done') {
      html += RitualPage._doneView(today);
    } else {
      html += RitualPage._stepCheckin(today, step === 'checkin');
      html += RitualPage._stepMovement(today, step === 'movement');
      html += RitualPage._stepPriorities(today, step === 'priorities');
      html += RitualPage._stepJournal(today, step === 'journal');
    }

    html += '</div>';
    return html;
  },

  _currentStep: function(today) {
    if (!today || !today.energy_am) return 'checkin';
    if (!today.movement_type) return 'movement';
    if (!today.priority_must && !today.priorities_set) return 'priorities';
    if (!today.journal && !today.journal_skipped) return 'journal';
    return 'done';
  },

  _progressBar: function(today) {
    var steps = ['checkin', 'movement', 'priorities', 'journal'];
    var current = RitualPage._currentStep(today || {});
    var currentIdx = current === 'done' ? 4 : steps.indexOf(current);

    var html = '<div class="progress-bar">';
    steps.forEach(function(s, i) {
      var cls = i < currentIdx ? 'step-done' : i === currentIdx ? 'step-active' : 'step-pending';
      html += '<div class="progress-step ' + cls + '"></div>';
    });
    html += '</div>';
    return html;
  },

  // ---- Step 1: Check-in ----
  _stepCheckin: function(today, active) {
    if (!active && today.energy_am) {
      return '<div class="step-card step-collapsed">' +
        '<div class="step-header" onclick="RitualPage._expandStep(\'checkin\')">' +
        '<span class="step-check">&#10003;</span> Check-in: ' +
        UI.moodEmoji(today.mood_am) + ' Energy ' + today.energy_am + '/10' +
        '</div></div>';
    }
    if (!active) return '';

    var html = '<div class="step-card step-active">';
    html += '<h2>How are you showing up?</h2>';

    // Wake time
    html += '<div class="field-group">';
    html += '<label>When did you wake up?</label>';
    html += '<input type="time" id="wake-time" class="gc-input" value="' + (today.wake_time || '') + '">';
    html += '</div>';

    // Energy slider
    html += '<div class="field-group">';
    html += '<label>Energy level</label>';
    html += '<div class="energy-slider">';
    html += '<input type="range" id="energy-am" min="1" max="10" value="' + (today.energy_am || 5) + '" oninput="document.getElementById(\'energy-val\').textContent=this.value">';
    html += '<span class="energy-val" id="energy-val">' + (today.energy_am || 5) + '</span>';
    html += '<span class="energy-label">/10</span>';
    html += '</div>';
    html += '</div>';

    // Mood picker
    html += '<div class="field-group">';
    html += '<label>Mood</label>';
    html += '<div class="mood-picker">';
    GC_CONFIG.moods.forEach(function(m) {
      var sel = today.mood_am === m.value ? ' mood-selected' : '';
      html += '<button class="mood-btn' + sel + '" onclick="RitualPage._setMood(\'' + m.value + '\')" title="' + m.label + '">';
      html += '<span class="mood-emoji">' + m.emoji + '</span>';
      html += '<span class="mood-label">' + m.label + '</span>';
      html += '</button>';
    });
    html += '</div>';
    html += '</div>';

    html += '<button class="gc-btn gc-btn-primary" onclick="RitualPage._saveCheckin()">Next</button>';
    html += '</div>';
    return html;
  },

  _setMood: function(value) {
    document.querySelectorAll('.mood-btn').forEach(function(b) { b.classList.remove('mood-selected'); });
    event.currentTarget.classList.add('mood-selected');
    RitualPage._selectedMood = value;
  },

  _saveCheckin: function() {
    var wake = document.getElementById('wake-time');
    var energy = document.getElementById('energy-am');
    var mood = RitualPage._selectedMood;

    if (!mood) {
      UI.toast('Pick a mood', 'warning');
      return;
    }

    DB.checkins.saveToday({
      wake_time: wake ? wake.value : '',
      energy_am: parseInt(energy.value),
      mood_am: mood
    });

    RitualPage._selectedMood = null;
    loadPage('ritual');
  },

  // ---- Step 2: Movement ----
  _stepMovement: function(today, active) {
    if (!active && today.movement_type) {
      var label = today.movement_type === 'skip' ? 'Skipped' :
        today.movement_type.charAt(0).toUpperCase() + today.movement_type.slice(1) +
        (today.movement_minutes ? ' (' + today.movement_minutes + ' min)' : '');
      return '<div class="step-card step-collapsed">' +
        '<div class="step-header">' +
        '<span class="step-check">&#10003;</span> Movement: ' + label +
        '</div></div>';
    }
    if (!active) return '';

    var html = '<div class="step-card step-active">';
    html += '<h2>Move your body</h2>';
    html += '<p class="step-subtitle">Even 5 minutes counts. Pick what you\'ll actually do.</p>';

    html += '<div class="movement-picker">';
    GC_CONFIG.movements.forEach(function(m) {
      html += '<button class="movement-btn" onclick="RitualPage._pickMovement(\'' + m.value + '\')">';
      html += '<span class="movement-icon">' + m.icon + '</span>';
      html += '<span class="movement-label">' + m.label + '</span>';
      html += '</button>';
    });
    html += '</div>';

    // Timer area (hidden until movement picked)
    html += '<div id="movement-timer" class="movement-timer" style="display:none">';
    html += '<div class="timer-display" id="timer-display">0:00</div>';
    html += '<div class="timer-btns">';
    html += '<button class="gc-btn gc-btn-outline" id="timer-toggle" onclick="RitualPage._toggleTimer()">Start</button>';
    html += '<button class="gc-btn gc-btn-primary" onclick="RitualPage._saveMovement()">Done</button>';
    html += '</div>';
    html += '</div>';

    html += '</div>';
    return html;
  },

  _pickMovement: function(type) {
    RitualPage._movementType = type;

    if (type === 'skip') {
      DB.checkins.saveToday({ movement_type: 'skip', movement_minutes: 0 });
      loadPage('ritual');
      return;
    }

    // Show timer
    document.querySelectorAll('.movement-btn').forEach(function(b) {
      b.classList.remove('movement-selected');
    });
    event.currentTarget.classList.add('movement-selected');
    document.getElementById('movement-timer').style.display = 'flex';
  },

  _toggleTimer: function() {
    var btn = document.getElementById('timer-toggle');
    if (RitualPage._timer) {
      clearInterval(RitualPage._timer);
      RitualPage._timer = null;
      btn.textContent = 'Resume';
    } else {
      RitualPage._timer = setInterval(function() {
        RitualPage._timerSeconds++;
        var m = Math.floor(RitualPage._timerSeconds / 60);
        var s = RitualPage._timerSeconds % 60;
        document.getElementById('timer-display').textContent = m + ':' + (s < 10 ? '0' : '') + s;
      }, 1000);
      btn.textContent = 'Pause';
    }
  },

  _saveMovement: function() {
    if (RitualPage._timer) {
      clearInterval(RitualPage._timer);
      RitualPage._timer = null;
    }
    var minutes = Math.max(1, Math.ceil(RitualPage._timerSeconds / 60));
    DB.checkins.saveToday({
      movement_type: RitualPage._movementType,
      movement_minutes: minutes
    });
    RitualPage._timerSeconds = 0;
    RitualPage._movementType = null;
    loadPage('ritual');
  },

  // ---- Step 3: Priorities ----
  _stepPriorities: function(today, active) {
    if (!active && today.priorities_set) {
      return '<div class="step-card step-collapsed">' +
        '<div class="step-header">' +
        '<span class="step-check">&#10003;</span> Priorities set' +
        '</div></div>';
    }
    if (!active) return '';

    var html = '<div class="step-card step-active">';
    html += '<h2>Three priorities</h2>';
    html += '<p class="step-subtitle">Not a to-do list. Three buckets.</p>';

    html += '<div class="priority-group">';
    html += '<label class="priority-label priority-must">Must happen</label>';
    html += '<input type="text" id="p-must" class="gc-input" placeholder="The one non-negotiable thing" value="' + UI.esc(today.priority_must || '') + '">';
    html += '</div>';

    html += '<div class="priority-group">';
    html += '<label class="priority-label priority-should">Should happen</label>';
    html += '<input type="text" id="p-should" class="gc-input" placeholder="Moves something forward" value="' + UI.esc(today.priority_should || '') + '">';
    html += '</div>';

    html += '<div class="priority-group">';
    html += '<label class="priority-label priority-want">Want to happen</label>';
    html += '<input type="text" id="p-want" class="gc-input" placeholder="For you, not just the business" value="' + UI.esc(today.priority_want || '') + '">';
    html += '</div>';

    html += '<button class="gc-btn gc-btn-primary" onclick="RitualPage._savePriorities()">Lock it in</button>';
    html += '</div>';
    return html;
  },

  _savePriorities: function() {
    var must = document.getElementById('p-must').value.trim();
    var should = document.getElementById('p-should').value.trim();
    var want = document.getElementById('p-want').value.trim();

    if (!must) {
      UI.toast('At least set the Must', 'warning');
      return;
    }

    DB.checkins.saveToday({
      priority_must: must,
      priority_should: should,
      priority_want: want,
      priorities_set: true
    });
    loadPage('ritual');
  },

  // ---- Step 4: Journal ----
  _stepJournal: function(today, active) {
    if (!active) return '';

    // Pick today's prompt
    var dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    var prompt = GC_CONFIG.prompts[dayOfYear % GC_CONFIG.prompts.length];

    var html = '<div class="step-card step-active">';
    html += '<h2>Quick journal</h2>';
    html += '<p class="step-subtitle journal-prompt">"' + prompt + '"</p>';
    html += '<textarea id="journal-text" class="gc-textarea" rows="4" placeholder="Whatever comes to mind...">' + UI.esc(today.journal || '') + '</textarea>';
    html += '<div class="journal-actions">';
    html += '<button class="gc-btn gc-btn-outline" onclick="RitualPage._skipJournal()">Skip</button>';
    html += '<button class="gc-btn gc-btn-primary" onclick="RitualPage._saveJournal()">Save</button>';
    html += '</div>';
    html += '</div>';
    return html;
  },

  _skipJournal: function() {
    DB.checkins.saveToday({ journal_skipped: true });
    loadPage('ritual');
  },

  _saveJournal: function() {
    var text = document.getElementById('journal-text').value.trim();
    DB.checkins.saveToday({ journal: text || '', journal_skipped: !text });
    loadPage('ritual');
  },

  // ---- Done View ----
  _doneView: function(today) {
    var streak = DB.stats.movementStreak();
    var avg = DB.stats.avgEnergy(7);

    var html = '<div class="done-view">';
    html += '<div class="done-check">&#10003;</div>';
    html += '<h2>Ritual complete</h2>';
    html += '<p class="done-subtitle">You showed up. That\'s the whole thing.</p>';

    // Today's summary
    html += '<div class="done-summary">';
    html += '<div class="done-stat">';
    html += '<span class="done-stat-val">' + UI.moodEmoji(today.mood_am) + '</span>';
    html += '<span class="done-stat-label">Mood</span>';
    html += '</div>';
    html += '<div class="done-stat">';
    html += '<span class="done-stat-val">' + (today.energy_am || '-') + '</span>';
    html += '<span class="done-stat-label">Energy</span>';
    html += '</div>';
    html += '<div class="done-stat">';
    html += '<span class="done-stat-val">' + (today.movement_minutes || 0) + 'm</span>';
    html += '<span class="done-stat-label">Movement</span>';
    html += '</div>';
    html += '<div class="done-stat">';
    html += '<span class="done-stat-val">' + streak + '</span>';
    html += '<span class="done-stat-label">Streak</span>';
    html += '</div>';
    html += '</div>';

    // Priorities card
    html += '<div class="done-priorities">';
    html += '<h3>Today\'s priorities</h3>';
    if (today.priority_must) {
      html += '<div class="done-priority"><span class="priority-dot priority-must-dot"></span>' + UI.esc(today.priority_must) + '</div>';
    }
    if (today.priority_should) {
      html += '<div class="done-priority"><span class="priority-dot priority-should-dot"></span>' + UI.esc(today.priority_should) + '</div>';
    }
    if (today.priority_want) {
      html += '<div class="done-priority"><span class="priority-dot priority-want-dot"></span>' + UI.esc(today.priority_want) + '</div>';
    }
    html += '</div>';

    // Edit button
    html += '<button class="gc-btn gc-btn-outline" onclick="RitualPage._editToday()" style="margin-top:16px">Edit today\'s entry</button>';

    html += '</div>';
    return html;
  },

  _editToday: function() {
    // Reset flags to re-enter flow
    DB.checkins.saveToday({
      energy_am: null,
      mood_am: null,
      movement_type: null,
      priorities_set: false,
      journal_skipped: false
    });
    loadPage('ritual');
  },

  _expandStep: function(step) {
    // Allow re-editing a completed step
    // For now, just show the done view — could expand inline later
  }
};

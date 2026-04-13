/**
 * Ground Control — Patterns Page
 * Energy chart, mood trend, movement streak, pattern flags.
 */
var PatternsPage = {
  _range: 14,

  render: function() {
    var data = DB.checkins.getRange(PatternsPage._range);
    var patterns = DB.stats.detectPatterns();

    var html = '<div class="patterns-page">';
    html += '<h1>Patterns</h1>';

    // Range toggle
    html += '<div class="range-toggle">';
    [7, 14, 30].forEach(function(d) {
      var cls = PatternsPage._range === d ? ' range-active' : '';
      html += '<button class="range-btn' + cls + '" onclick="PatternsPage._setRange(' + d + ')">' + d + 'd</button>';
    });
    html += '</div>';

    // Pattern alerts
    if (patterns.length) {
      html += '<div class="pattern-alerts">';
      patterns.forEach(function(p) {
        html += '<div class="pattern-card pattern-' + p.type + '">';
        html += '<span class="pattern-icon">' + p.icon + '</span>';
        html += '<span class="pattern-msg">' + UI.esc(p.message) + '</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    // Stats row
    html += '<div class="stats-row">';
    html += PatternsPage._statCard('Avg Energy', DB.stats.avgEnergy(PatternsPage._range) || '-', '/10');
    html += PatternsPage._statCard('Movement Streak', DB.stats.movementStreak(), ' days');
    html += PatternsPage._statCard('Priorities Done', DB.stats.priorityCompletionRate(PatternsPage._range) + '%', '');
    html += '</div>';

    // Energy chart
    html += '<div class="chart-card">';
    html += '<h3>Energy</h3>';
    html += PatternsPage._energyChart(data);
    html += '</div>';

    // Mood trend
    html += '<div class="chart-card">';
    html += '<h3>Mood</h3>';
    html += PatternsPage._moodStreak(data);
    html += '</div>';

    // Movement heatmap
    html += '<div class="chart-card">';
    html += '<h3>Movement</h3>';
    html += PatternsPage._movementHeatmap(data);
    html += '</div>';

    html += '</div>';
    return html;
  },

  _setRange: function(days) {
    PatternsPage._range = days;
    loadPage('patterns');
  },

  _statCard: function(label, value, suffix) {
    return '<div class="mini-stat">' +
      '<div class="mini-stat-val">' + value + '<span class="mini-stat-suffix">' + suffix + '</span></div>' +
      '<div class="mini-stat-label">' + label + '</div>' +
      '</div>';
  },

  _energyChart: function(data) {
    if (!data.length) return '<p class="chart-empty">No data yet. Complete your morning ritual to start tracking.</p>';

    var maxH = 120;
    var w = Math.max(300, data.length * 36);
    var html = '<div class="chart-scroll"><svg class="energy-svg" viewBox="0 0 ' + w + ' ' + (maxH + 30) + '" width="' + w + '" height="' + (maxH + 30) + '">';

    // Grid lines
    for (var g = 2; g <= 10; g += 2) {
      var gy = maxH - (g / 10 * maxH);
      html += '<line x1="0" y1="' + gy + '" x2="' + w + '" y2="' + gy + '" stroke="var(--gc-border)" stroke-width="0.5" stroke-dasharray="3"/>';
      html += '<text x="2" y="' + (gy - 3) + '" fill="var(--gc-text-light)" font-size="10">' + g + '</text>';
    }

    // Line + dots
    var points = [];
    data.forEach(function(c, i) {
      if (!c.energy_am) return;
      var x = 20 + i * 32;
      var y = maxH - (c.energy_am / 10 * maxH);
      points.push(x + ',' + y);
    });

    if (points.length > 1) {
      html += '<polyline points="' + points.join(' ') + '" fill="none" stroke="var(--gc-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
    }

    data.forEach(function(c, i) {
      if (!c.energy_am) return;
      var x = 20 + i * 32;
      var y = maxH - (c.energy_am / 10 * maxH);
      html += '<circle cx="' + x + '" cy="' + y + '" r="4" fill="var(--gc-primary)"/>';
      html += '<text x="' + x + '" y="' + (maxH + 16) + '" text-anchor="middle" fill="var(--gc-text-light)" font-size="9">' + UI.dayOfWeek(c.date) + '</text>';
    });

    html += '</svg></div>';
    return html;
  },

  _moodStreak: function(data) {
    if (!data.length) return '<p class="chart-empty">No mood data yet.</p>';

    var html = '<div class="mood-streak">';
    data.forEach(function(c) {
      html += '<div class="mood-day">';
      html += '<span class="mood-day-emoji">' + (UI.moodEmoji(c.mood_am) || '&middot;') + '</span>';
      html += '<span class="mood-day-label">' + UI.dayOfWeek(c.date) + '</span>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  },

  _movementHeatmap: function(data) {
    if (!data.length) return '<p class="chart-empty">No movement data yet.</p>';

    var html = '<div class="movement-heatmap">';
    data.forEach(function(c) {
      var moved = c.movement_type && c.movement_type !== 'skip';
      var cls = moved ? 'heat-on' : 'heat-off';
      var icon = c.movement_type === 'walk' ? '🚶' : c.movement_type === 'stretch' ? '🧘' : c.movement_type === 'workout' ? '💪' : '·';
      html += '<div class="heat-cell ' + cls + '" title="' + UI.dateShort(c.date) + ': ' + (c.movement_type || 'none') + '">';
      html += '<span class="heat-icon">' + icon + '</span>';
      html += '<span class="heat-label">' + UI.dayOfWeek(c.date) + '</span>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }
};

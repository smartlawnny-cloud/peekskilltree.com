/**
 * Ground Control — Data Layer
 * localStorage-first with optional Supabase sync later.
 */
var DB = (function() {
  var KEYS = {
    checkins: 'gc-checkins',
    settings: 'gc-settings',
    session: 'gc-session'
  };

  function _get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch(e) { return []; }
  }

  function _set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function _uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function _today() {
    return new Date().toISOString().split('T')[0];
  }

  // ---- Checkins ----
  var checkins = {
    getAll: function() {
      return _get(KEYS.checkins).sort(function(a, b) {
        return b.date.localeCompare(a.date);
      });
    },

    getByDate: function(date) {
      date = date || _today();
      var all = _get(KEYS.checkins);
      return all.find(function(c) { return c.date === date; }) || null;
    },

    getToday: function() {
      return checkins.getByDate(_today());
    },

    getRange: function(days) {
      var all = _get(KEYS.checkins);
      var cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      var cutoffStr = cutoff.toISOString().split('T')[0];
      return all.filter(function(c) { return c.date >= cutoffStr; })
               .sort(function(a, b) { return a.date.localeCompare(b.date); });
    },

    saveToday: function(data) {
      var all = _get(KEYS.checkins);
      var today = _today();
      var idx = all.findIndex(function(c) { return c.date === today; });

      if (idx >= 0) {
        // Merge with existing
        Object.assign(all[idx], data);
        all[idx].updated_at = new Date().toISOString();
      } else {
        // New entry
        data.id = _uuid();
        data.date = today;
        data.created_at = new Date().toISOString();
        data.updated_at = new Date().toISOString();
        all.push(data);
      }
      _set(KEYS.checkins, all);
      return checkins.getToday();
    },

    getLast: function(n) {
      return checkins.getAll().slice(0, n);
    }
  };

  // ---- Settings ----
  var settings = {
    get: function() {
      try {
        return JSON.parse(localStorage.getItem(KEYS.settings)) || settings._defaults();
      } catch(e) {
        return settings._defaults();
      }
    },

    save: function(data) {
      var current = settings.get();
      Object.assign(current, data);
      localStorage.setItem(KEYS.settings, JSON.stringify(current));
      return current;
    },

    _defaults: function() {
      return {
        name: '',
        timezone: 'America/New_York',
        morningReminder: '06:30',
        eveningReminder: '20:00',
        theme: 'auto',
        movementGoal: 5, // minutes
        onboardingDone: false
      };
    }
  };

  // ---- Session ----
  var session = {
    get: function() {
      try { return JSON.parse(localStorage.getItem(KEYS.session)) || {}; }
      catch(e) { return {}; }
    },
    set: function(data) {
      localStorage.setItem(KEYS.session, JSON.stringify(data));
    },
    clear: function() {
      localStorage.removeItem(KEYS.session);
    }
  };

  // ---- Stats ----
  var stats = {
    movementStreak: function() {
      var all = checkins.getAll();
      var streak = 0;
      for (var i = 0; i < all.length; i++) {
        if (all[i].movement_type && all[i].movement_type !== 'skip') {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    },

    avgEnergy: function(days) {
      var data = checkins.getRange(days || 7);
      if (!data.length) return 0;
      var sum = data.reduce(function(s, c) { return s + (c.energy_am || 0); }, 0);
      return Math.round((sum / data.length) * 10) / 10;
    },

    priorityCompletionRate: function(days) {
      var data = checkins.getRange(days || 7);
      if (!data.length) return 0;
      var total = 0, done = 0;
      data.forEach(function(c) {
        if (c.priority_must) { total++; if (c.priority_must_done) done++; }
        if (c.priority_should) { total++; if (c.priority_should_done) done++; }
        if (c.priority_want) { total++; if (c.priority_want_done) done++; }
      });
      return total ? Math.round((done / total) * 100) : 0;
    },

    skippedMovementDays: function(days) {
      var data = checkins.getRange(days || 7);
      return data.filter(function(c) {
        return !c.movement_type || c.movement_type === 'skip';
      }).length;
    },

    detectPatterns: function() {
      var patterns = [];
      var last7 = checkins.getRange(7);
      var last14 = checkins.getRange(14);

      // Movement skips
      var recentSkips = stats.skippedMovementDays(7);
      if (recentSkips >= 3) {
        patterns.push({
          type: 'warning',
          icon: '🚶',
          message: "You've skipped movement " + recentSkips + " of the last 7 days. What's getting in the way?"
        });
      }

      // Energy trend
      if (last7.length >= 3) {
        var recent3 = last7.slice(-3);
        var declining = recent3.every(function(c, i) {
          if (i === 0) return true;
          return (c.energy_am || 5) < (recent3[i-1].energy_am || 5);
        });
        if (declining && recent3.length === 3) {
          patterns.push({
            type: 'alert',
            icon: '📉',
            message: "Energy has been declining 3 days straight. Worth checking in on sleep, food, or what's weighing on you."
          });
        }
      }

      // Mood by day of week
      if (last14.length >= 7) {
        var moodByDay = {};
        var moodValues = { frustrated: 1, low: 2, neutral: 3, good: 4, great: 5 };
        last14.forEach(function(c) {
          if (!c.mood_am) return;
          var day = new Date(c.date + 'T12:00:00').getDay();
          if (!moodByDay[day]) moodByDay[day] = [];
          moodByDay[day].push(moodValues[c.mood_am] || 3);
        });
        var dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
        Object.keys(moodByDay).forEach(function(day) {
          var avg = moodByDay[day].reduce(function(a, b) { return a + b; }, 0) / moodByDay[day].length;
          if (avg <= 2 && moodByDay[day].length >= 2) {
            patterns.push({
              type: 'insight',
              icon: '📅',
              message: dayNames[day] + " tend to be tough for you. Notice what's different about that day."
            });
          }
        });
      }

      // Priority completion
      var completionRate = stats.priorityCompletionRate(7);
      if (completionRate < 30 && last7.length >= 3) {
        patterns.push({
          type: 'nudge',
          icon: '🎯',
          message: "Only " + completionRate + "% of priorities completed this week. Are you setting the bar too high, or is something blocking you?"
        });
      }

      // Movement streak positive
      var streak = stats.movementStreak();
      if (streak >= 5) {
        patterns.push({
          type: 'win',
          icon: '🔥',
          message: streak + "-day movement streak. That's not nothing."
        });
      }

      return patterns;
    }
  };

  return {
    checkins: checkins,
    settings: settings,
    session: session,
    stats: stats,
    today: _today
  };
})();

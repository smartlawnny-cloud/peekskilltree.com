/**
 * Branch Manager — Weather Widget
 * 5-day forecast for Peekskill, NY using Open-Meteo (free, no API key)
 */
var Weather = {
  LAT: 41.2901,
  LON: -73.9204,
  cache: null,
  cacheTime: 0,

  renderWidget: function() {
    var html = '<div id="weather-widget" style="background:var(--white);border-radius:12px;padding:16px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
      + '<h4 style="font-size:14px;margin:0;">🌤 Weather — Peekskill, NY</h4>'
      + '<span style="font-size:11px;color:var(--text-light);">5-day forecast</span></div>'
      + '<div id="weather-data" style="font-size:13px;color:var(--text-light);">Loading...</div>'
      + '</div>';

    // Fetch weather after render
    setTimeout(function() { Weather.fetch(); }, 100);
    return html;
  },

  fetch: function() {
    // Cache for 30 min
    if (Weather.cache && Date.now() - Weather.cacheTime < 1800000) {
      Weather._render(Weather.cache);
      return;
    }

    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + Weather.LAT + '&longitude=' + Weather.LON
      + '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode'
      + '&temperature_unit=fahrenheit&timezone=America/New_York&forecast_days=5';

    fetch(url).then(function(r) { return r.json(); }).then(function(data) {
      Weather.cache = data;
      Weather.cacheTime = Date.now();
      Weather._render(data);
    }).catch(function(e) {
      var el = document.getElementById('weather-data');
      if (el) el.innerHTML = '<span style="color:var(--text-light);">Unable to load weather</span>';
    });
  },

  _render: function(data) {
    var el = document.getElementById('weather-data');
    if (!el || !data || !data.daily) return;

    var days = data.daily;
    var dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var html = '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;text-align:center;">';

    for (var i = 0; i < 5; i++) {
      var d = new Date(days.time[i] + 'T12:00:00');
      var dayName = i === 0 ? 'Today' : dayNames[d.getDay()];
      var hi = Math.round(days.temperature_2m_max[i]);
      var lo = Math.round(days.temperature_2m_min[i]);
      var rain = days.precipitation_probability_max[i];
      var code = days.weathercode[i];
      var icon = Weather._icon(code);
      var rainWarning = rain > 60;

      html += '<div style="padding:8px 4px;border-radius:8px;' + (rainWarning ? 'background:#fff3e0;' : '') + '">'
        + '<div style="font-size:11px;font-weight:600;color:var(--text-light);">' + dayName + '</div>'
        + '<div style="font-size:22px;margin:4px 0;">' + icon + '</div>'
        + '<div style="font-size:14px;font-weight:700;">' + hi + '°</div>'
        + '<div style="font-size:11px;color:var(--text-light);">' + lo + '°</div>'
        + (rain > 0 ? '<div style="font-size:10px;color:' + (rainWarning ? '#e65100' : '#2196f3') + ';margin-top:2px;">💧 ' + rain + '%</div>' : '')
        + '</div>';
    }
    html += '</div>';

    // Rain warning for scheduling
    var rainyDays = [];
    for (var j = 0; j < 5; j++) {
      if (days.precipitation_probability_max[j] > 60) {
        var rd = new Date(days.time[j] + 'T12:00:00');
        rainyDays.push(j === 0 ? 'Today' : dayNames[rd.getDay()]);
      }
    }
    if (rainyDays.length) {
      html += '<div style="margin-top:8px;padding:8px;background:#fff3e0;border-radius:6px;font-size:12px;color:#e65100;">'
        + '⚠️ Rain likely: <strong>' + rainyDays.join(', ') + '</strong> — consider rescheduling outdoor work</div>';
    }

    el.innerHTML = html;
  },

  _icon: function(code) {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 49) return '🌫️';
    if (code <= 59) return '🌧️';
    if (code <= 69) return '🌨️';
    if (code <= 79) return '🌧️';
    if (code <= 82) return '⛈️';
    if (code <= 86) return '❄️';
    if (code >= 95) return '⛈️';
    return '☁️';
  }
};

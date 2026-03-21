/**
 * Branch Manager — Property Map
 * Satellite view with draggable equipment placement for quotes/jobs
 * Uses MapLibre GL + ESRI satellite tiles (free)
 */
var PropertyMap = {
  map: null,
  markers: [],
  equipmentList: [
    { id: 'bucket', label: 'Bucket Truck', icon: '🚛', color: '#2196f3' },
    { id: 'chipper', label: 'Chipper', icon: '⚙️', color: '#4caf50' },
    { id: 'crane', label: 'Crane', icon: '🏗️', color: '#ff9800' },
    { id: 'stump', label: 'Stump Grinder', icon: '🪵', color: '#795548' },
    { id: 'truck', label: 'Chip Truck', icon: '🚚', color: '#607d8b' },
    { id: 'ram', label: 'Ram 2500', icon: '🛻', color: '#9c27b0' },
    { id: 'loader', label: 'Loader', icon: '🚜', color: '#e91e63' },
    { id: 'climber', label: 'Climber', icon: '🧗', color: '#f44336' },
    { id: 'ground', label: 'Ground Crew', icon: '👷', color: '#00bcd4' },
    { id: 'dropzone', label: 'Drop Zone', icon: '🎯', color: '#ff5722' },
    { id: 'hazard', label: 'Hazard', icon: '⚠️', color: '#f44336' },
    { id: 'powerline', label: 'Power Lines', icon: '⚡', color: '#ffc107' }
  ],

  show: function(address, existingMarkers) {
    // Load MapLibre if not already loaded
    if (!window.maplibregl) {
      var link = document.createElement('link');
      link.href = 'https://unpkg.com/maplibre-gl@4.1.2/dist/maplibre-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      var script = document.createElement('script');
      script.src = 'https://unpkg.com/maplibre-gl@4.1.2/dist/maplibre-gl.js';
      script.onload = function() { PropertyMap._init(address, existingMarkers); };
      document.head.appendChild(script);
    } else {
      PropertyMap._init(address, existingMarkers);
    }
  },

  _init: function(address, existingMarkers) {
    var self = PropertyMap;

    var html = '<div style="display:flex;gap:12px;height:70vh;min-height:400px;">'
      // Map
      + '<div style="flex:1;position:relative;">'
      + '<div id="prop-map" style="width:100%;height:100%;border-radius:10px;overflow:hidden;"></div>'
      + '<div style="position:absolute;top:10px;left:10px;z-index:10;">'
      + '<div style="background:rgba(255,255,255,.95);border-radius:8px;padding:8px 12px;box-shadow:0 2px 8px rgba(0,0,0,.2);font-size:13px;">'
      + '<input type="text" id="map-address" value="' + (address || '') + '" placeholder="Enter address..." style="border:none;outline:none;font-size:14px;width:250px;font-weight:600;">'
      + ' <button class="btn btn-primary" style="padding:4px 12px;font-size:12px;" onclick="PropertyMap.geocode()">Go</button>'
      + '</div></div>'
      + '</div>'
      // Equipment panel
      + '<div style="width:180px;background:var(--white);border-radius:10px;border:1px solid var(--border);padding:12px;overflow-y:auto;">'
      + '<h4 style="font-size:13px;margin-bottom:8px;color:var(--text);">Equipment</h4>'
      + '<p style="font-size:11px;color:var(--text-light);margin-bottom:10px;">Click to place on map. Drag to move.</p>';

    self.equipmentList.forEach(function(eq) {
      html += '<button class="btn btn-outline" style="width:100%;margin-bottom:6px;font-size:12px;padding:6px 8px;justify-content:flex-start;" '
        + 'onclick="PropertyMap.addEquipment(\'' + eq.id + '\')">'
        + '<span style="font-size:16px;">' + eq.icon + '</span> ' + eq.label + '</button>';
    });

    html += '<div style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px;">'
      + '<button class="btn btn-outline" style="width:100%;font-size:12px;" onclick="PropertyMap.clearMarkers()">Clear All</button>'
      + '</div></div></div>';

    // Placed equipment list
    html += '<div id="placed-equipment" style="margin-top:12px;"></div>';

    UI.showModal('Property Map', html, {
      wide: true,
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-primary" onclick="PropertyMap.saveToRecord()">Save to Quote/Job</button>'
    });

    // Init map after modal renders
    setTimeout(function() {
      self.map = new maplibregl.Map({
        container: 'prop-map',
        style: {
          version: 8,
          sources: {
            'satellite': {
              type: 'raster',
              tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
              tileSize: 256, maxzoom: 19
            },
            'labels': {
              type: 'raster',
              tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'],
              tileSize: 256, maxzoom: 19
            }
          },
          layers: [
            { id: 'satellite-layer', type: 'raster', source: 'satellite' },
            { id: 'labels-layer', type: 'raster', source: 'labels', paint: { 'raster-opacity': 0.6 } }
          ]
        },
        center: [-73.9204, 41.2890], // Peekskill default
        zoom: 18,
        maxPitch: 60
      });
      self.map.addControl(new maplibregl.NavigationControl(), 'top-right');
      self.markers = [];

      // If address provided, geocode immediately
      if (address) {
        setTimeout(function() { self.geocode(); }, 500);
      }

      // Restore existing markers
      if (existingMarkers && existingMarkers.length) {
        existingMarkers.forEach(function(m) {
          self._placeMarker(m.id, m.lng, m.lat, m.notes);
        });
      }
    }, 300);
  },

  geocode: function() {
    var address = document.getElementById('map-address').value.trim();
    if (!address) return;

    fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(address) + '&limit=1')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.length > 0) {
          var lat = parseFloat(data[0].lat);
          var lng = parseFloat(data[0].lon);
          PropertyMap.map.flyTo({ center: [lng, lat], zoom: 19, duration: 1500 });
        } else {
          UI.toast('Address not found', 'error');
        }
      })
      .catch(function() { UI.toast('Geocoding failed', 'error'); });
  },

  addEquipment: function(eqId) {
    var self = PropertyMap;
    if (!self.map) return;
    var center = self.map.getCenter();
    // Offset slightly so multiple items don't stack
    var offset = self.markers.length * 0.00003;
    self._placeMarker(eqId, center.lng + offset, center.lat + offset, '');
  },

  _placeMarker: function(eqId, lng, lat, notes) {
    var self = PropertyMap;
    var eq = self.equipmentList.find(function(e) { return e.id === eqId; });
    if (!eq) return;

    var el = document.createElement('div');
    el.style.cssText = 'width:36px;height:36px;background:' + eq.color + ';border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);cursor:grab;';
    el.textContent = eq.icon;
    el.title = eq.label;

    var marker = new maplibregl.Marker({ element: el, draggable: true })
      .setLngLat([lng, lat])
      .addTo(self.map);

    var markerData = { id: eqId, label: eq.label, icon: eq.icon, lng: lng, lat: lat, notes: notes || '', marker: marker };
    self.markers.push(markerData);

    marker.on('dragend', function() {
      var pos = marker.getLngLat();
      markerData.lng = pos.lng;
      markerData.lat = pos.lat;
    });

    self._updatePlacedList();
  },

  _updatePlacedList: function() {
    var self = PropertyMap;
    var el = document.getElementById('placed-equipment');
    if (!el) return;

    if (self.markers.length === 0) {
      el.innerHTML = '';
      return;
    }

    var html = '<div style="background:var(--white);border-radius:10px;border:1px solid var(--border);padding:12px;">'
      + '<h4 style="font-size:13px;margin-bottom:8px;">Placed Equipment (' + self.markers.length + ')</h4>';
    self.markers.forEach(function(m, i) {
      html += '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #f0f0f0;font-size:13px;">'
        + '<span style="font-size:16px;">' + m.icon + '</span>'
        + '<span style="flex:1;">' + m.label + '</span>'
        + '<button style="background:none;border:none;color:var(--red);cursor:pointer;font-size:16px;" onclick="PropertyMap.removeMarker(' + i + ')">&times;</button>'
        + '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
  },

  removeMarker: function(index) {
    var self = PropertyMap;
    if (self.markers[index]) {
      self.markers[index].marker.remove();
      self.markers.splice(index, 1);
      self._updatePlacedList();
    }
  },

  clearMarkers: function() {
    var self = PropertyMap;
    self.markers.forEach(function(m) { m.marker.remove(); });
    self.markers = [];
    self._updatePlacedList();
  },

  getMarkerData: function() {
    return PropertyMap.markers.map(function(m) {
      return { id: m.id, label: m.label, icon: m.icon, lng: m.lng, lat: m.lat, notes: m.notes };
    });
  },

  saveToRecord: function() {
    var data = PropertyMap.getMarkerData();
    // Store in a temp variable for the quote/job to pick up
    PropertyMap._savedData = data;
    UI.toast(data.length + ' equipment positions saved');
    UI.closeModal();
  }
};

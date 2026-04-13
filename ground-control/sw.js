var CACHE_NAME = 'ground-control-v1';
var ASSETS = [
  '/ground-control/',
  '/ground-control/index.html',
  '/ground-control/config.js',
  '/ground-control/src/db.js',
  '/ground-control/src/ui.js',
  '/ground-control/src/pages/ritual.js',
  '/ground-control/src/pages/journal.js',
  '/ground-control/src/pages/patterns.js',
  '/ground-control/src/pages/evening.js',
  '/ground-control/src/pages/settings.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function() {
        // Don't fail if some assets aren't available yet
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Skip non-GET and external requests
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request).then(function(response) {
      // Cache successful responses
      if (response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(e.request).then(function(cached) {
        if (cached) return cached;
        // Offline fallback for navigation
        if (e.request.mode === 'navigate') {
          return caches.match('/ground-control/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

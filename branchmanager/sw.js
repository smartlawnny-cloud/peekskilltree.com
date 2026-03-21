// Branch Manager — Service Worker
// Enables offline access and PWA install
var CACHE_NAME = 'branch-manager-v1';
var ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/db.js',
  '/src/ui.js',
  '/src/pdf.js',
  '/src/pages/dashboard.js',
  '/src/pages/clients.js',
  '/src/pages/requests.js',
  '/src/pages/quotes.js',
  '/src/pages/jobs.js',
  '/src/pages/invoices.js',
  '/src/pages/schedule.js',
  '/src/pages/insights.js',
  '/src/pages/settings.js',
  '/src/pages/propertymap.js'
];

// Install — cache all assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
          .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', function(e) {
  // Skip non-GET and external requests
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request).then(function(response) {
      // Cache successful responses
      var clone = response.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(e.request, clone);
      });
      return response;
    }).catch(function() {
      // Offline — serve from cache
      return caches.match(e.request).then(function(cached) {
        return cached || new Response('Offline — please reconnect', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});

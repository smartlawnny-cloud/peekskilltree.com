// Branch Manager — Service Worker v9
// Full offline support + push notifications
var CACHE_NAME = 'branch-manager-v65';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  // Core
  './src/auth.js',
  './src/db.js',
  './src/ui.js',
  './src/pdf.js',
  './src/supabase.js',
  './src/supacloud.js',
  './src/stripe.js',
  './src/sendjim.js',
  './src/templates.js',
  './src/photos.js',
  './src/email.js',
  './src/geofence.js',
  './src/weather.js',
  // Pages
  './src/pages/dashboard.js',
  './src/pages/pipeline.js',
  './src/pages/schedule.js',
  './src/pages/clients.js',
  './src/pages/requests.js',
  './src/pages/quotes.js',
  './src/pages/jobs.js',
  './src/pages/invoices.js',
  './src/pages/timetrack.js',
  './src/pages/expenses.js',
  './src/pages/insights.js',
  './src/pages/team.js',
  './src/pages/automations.js',
  './src/pages/settings.js',
  './src/pages/crewview.js',
  './src/pages/employeecenter.js',
  './src/pages/budget.js',
  './src/pages/dispatch.js',
  './src/pages/clientmap.js',
  './src/pages/photomap.js',
  './src/pages/messaging.js',
  './src/pages/equipment.js',
  './src/pages/jobcosting.js',
  './src/pages/recurring.js',
  './src/pages/notifications.js',
  './src/pages/profitloss.js',
  './src/pages/weeklysummary.js',
  './src/pages/reviewtools.js',
  './src/pages/reviews.js',
  './src/pages/reports.js',
  './src/pages/onlinebooking.js',
  './src/pages/import.js',
  './src/pages/backup.js',
  './src/pages/search.js',
  './src/pages/estimator.js',
  './src/pages/treemeasure.js',
  './src/pages/propertymap.js',
  './src/pages/pdfgen.js',
  './src/pages/workflow.js',
  './src/pages/clienthub.js',
  './src/pages/comms.js',
  './src/pages/payments.js',
  './src/pages/checklists.js',
  './src/pages/visits.js',
  './src/pages/customfields.js',
  './src/pages/commandpalette.js',
  './src/pages/ai.js',
  './src/pages/satisfaction.js',
  './src/pages/emailtemplates.js',
  './src/pages/beforeafter.js',
  './src/pages/materials.js',
  './src/pages/reminders.js',
  './src/pages/crewperformance.js',
  './src/pages/pipeline.js',
  // Icons
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  // Client-facing pages
  './approve.html',
  './pay.html',
  './client.html',
  './book.html',
  './paid.html'
];

// Install — cache all assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function(err) {
        console.warn('SW: Some assets failed to cache', err);
        return Promise.allSettled(
          ASSETS.map(function(url) { return cache.add(url).catch(function(){}); })
        );
      });
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
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request).then(function(response) {
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
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      });
    })
  );
});

// Push notifications
self.addEventListener('push', function(e) {
  var data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Branch Manager', {
      body: data.body || '',
      icon: data.icon || './icons/icon-192.png',
      badge: './icons/icon-192.png',
      data: data.url || './',
      tag: data.tag || 'default',
      actions: data.actions || []
    })
  );
});

// Notification click — open app
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    clients.openWindow(e.notification.data || './')
  );
});

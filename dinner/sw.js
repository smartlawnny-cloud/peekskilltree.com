// dinner · service worker
// Cache-first for the app shell; network-only for API + Stripe + auth.
const CACHE = "dinner-shell-v1";
const SHELL = [
  "/dinner/",
  "/dinner/app.html",
  "/dinner/operator.html",
  "/dinner/icon.svg",
  "/dinner/icon-180.png",
  "/dinner/icon-512.png",
  "/dinner/manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // Best-effort — don't fail install if one fetch fails
    await Promise.allSettled(SHELL.map(u => c.add(u)));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  // Never cache API, auth, payments, edge functions, esm.sh imports
  if (
    u.host.endsWith("supabase.co") ||
    u.host.endsWith("supabase.in") ||
    u.host.endsWith("stripe.com") ||
    u.host.endsWith("esm.sh") ||
    u.host.endsWith("openai.com") ||
    u.host.endsWith("googleapis.com") ||
    e.request.method !== "GET"
  ) return;

  // Same-origin shell: cache-first, fall back to network, update in background
  if (u.origin === self.location.origin && u.pathname.startsWith("/dinner/")) {
    e.respondWith((async () => {
      const cached = await caches.match(e.request);
      const fetchAndUpdate = fetch(e.request).then(resp => {
        if (resp && resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => null);
      return cached || (await fetchAndUpdate) || new Response("offline", { status: 503 });
    })());
  }
});

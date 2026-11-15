// Project Serenity web app: keeps the app opening when offline.
// Pages and app files are cached as they are used. Nothing personal is cached here:
// the person's data lives in the browser's own storage, and API calls to Supabase are never cached.
const CACHE = 'serenity-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // Supabase and other sites: always live
  if (req.mode === 'navigate') {
    // Pages: try the network first, fall back to the cached app when offline.
    e.respondWith(fetch(req).catch(() => caches.match('/')));
    return;
  }
  // App files (scripts, fonts, images): cache first, then network.
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
          return res;
        }),
    ),
  );
});

// Stabil PWA v4 — minimal, güvenli SW
const CACHE_NAME = 'meyhane-pwa-cache-v4';
const CORE = ['./index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CORE)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// HTML isteklerinde network-first; offline'da cache'e düş
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(req);
        return cached || caches.match('./index.html');
      }
    })());
  } else {
    // Diğer isteklerde direkt ağ (CDN sürtüşme riskini azaltır)
    e.respondWith(fetch(req).catch(() => caches.match(req)));
  }
});

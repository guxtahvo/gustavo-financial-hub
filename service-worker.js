const CACHE_NAME = 'gfh-static-v1-mobile2';
const APP_SHELL = [
  './', './index.html', './styles.css', './app.js', './world-map-data.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon.svg'
];
const RUNTIME_CACHE = 'gfh-runtime-v1';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => ![CACHE_NAME,RUNTIME_CACHE].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Network-first for the app document so an updated version can arrive without touching localStorage.
  if (new URL(req.url).origin === self.location.origin && (req.mode === 'navigate' || req.destination === 'document')) {
    event.respondWith(fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      return resp;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }

  // Cache-first for local static assets.
  if (new URL(req.url).origin === self.location.origin) {
    event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      return resp;
    })));
    return;
  }

  // Runtime-cache third-party assets such as Chart.js after a successful online load.
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(resp => {
    if (resp.ok || resp.type === 'opaque') {
      const copy = resp.clone();
      caches.open(RUNTIME_CACHE).then(cache => cache.put(req, copy));
    }
    return resp;
  }).catch(() => cached)));
});

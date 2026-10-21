const CACHE_NAME = 'ashen-guild-v12-legacy-trials';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './game.js',
  './pwa.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './assets/characters/bran/full.webp',
  './assets/characters/bran/half.webp',
  './assets/characters/bran/avatar.webp',
  './assets/characters/bran/small.webp',
  './assets/characters/mira/full.webp',
  './assets/characters/mira/half.webp',
  './assets/characters/mira/avatar.webp',
  './assets/characters/mira/small.webp',
  './assets/characters/sena/full.webp',
  './assets/characters/sena/half.webp',
  './assets/characters/sena/avatar.webp',
  './assets/characters/sena/small.webp',
  './assets/characters/riven/full.webp',
  './assets/characters/riven/half.webp',
  './assets/characters/riven/avatar.webp',
  './assets/characters/riven/small.webp',
  './assets/characters/alda/full.webp',
  './assets/characters/alda/half.webp',
  './assets/characters/alda/avatar.webp',
  './assets/characters/alda/small.webp',
  './assets/characters/tor/full.webp',
  './assets/characters/tor/half.webp',
  './assets/characters/tor/avatar.webp',
  './assets/characters/tor/small.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(response => {
        if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        return response;
      });
      return cached || network;
    })
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

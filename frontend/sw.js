const CACHE_NAME = 'diary-cache-v1';
const ASSETS = [
  'index.html',
  'registerform.html',
  'feedpage.html',
  'post.html',
  'edit.html',
  'dedicatedpage.html',
  'games.html',
  'neobrutalism.css',
  'neo-popup.js',
  'config.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});

const CACHE_NAME = 'runpulse-cache-v3';

// Bestanden die de app offline beschikbaar houdt.
const FILES_TO_CACHE = [
  './index.html',
  './css/Style.css',
  './js/app.js',
  './manifest.json',
  './icons/hardlopen.png',
  './icons/hardlopen 2.png'
];

// Slaat de belangrijkste bestanden op in de cache bij installatie.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Ruimt oude caches op als de app een nieuwe versie krijgt.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// HTML-pagina's worden altijd vers opgehaald; andere assets worden gecached.
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  const isNavigation = event.request.mode === 'navigate';
  const isHtmlRequest = requestUrl.pathname.endsWith('.html') || requestUrl.pathname === '/';

  if (isNavigation || isHtmlRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      });
    })
  );
});
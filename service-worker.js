const CACHE_NAME = 'runpulse-cache-v1';

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
    )
  );
});

// Geeft eerst de cache terug en haalt pas daarna nieuwe bestanden op.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
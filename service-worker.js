// Naam van de cache. Ik gebruik een versienummer
// omdat de browser anders soms een oude cache blijft gebruiken.
// Dit is handig tijdens het nakijken en bij een nieuwe update.
const CACHE_NAME = 'runpulse-cache-v3';

// Deze bestanden wil ik offline beschikbaar hebben.
// Het zijn de pagina, de stylesheet, de JavaScript, het manifest en de iconen.
const FILES_TO_CACHE = [
  './index.html',
  './css/Style.css',
  './js/app.js',
  './manifest.json',
  './icons/hardlopen.png',
  './icons/hardlopen 2.png'
];

// Installatie van de service worker.
// Hier zet ik de belangrijkste bestanden in de cache.
// Hierdoor kan de app starten zonder internetverbinding.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Activeren van de service worker.
// Als er een nieuwe versie van de app komt, verwijder ik oude caches.
// Zo blijft de app schoon en gebruikt hij niet per ongeluk oude bestanden.
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

// Fetch-event: hier bepaal ik hoe de app reageert op netwerkverzoeken.
// Ik scheid HTML-pagina's van andere bestanden.
// HTML moet altijd vers zijn, andere bestanden mogen uit de cache komen.
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  const isNavigation = event.request.mode === 'navigate';
  const isHtmlRequest = requestUrl.pathname.endsWith('.html') || requestUrl.pathname === '/';

  if (isNavigation || isHtmlRequest) {
    // Voor pagina's probeer ik eerst het netwerk.
    // Dat zorgt ervoor dat de gebruiker altijd de nieuwste versie ziet.
    // Als het netwerk wegvalt, gebruik ik de opgeslagen startpagina.
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

  // Voor andere assets zoals CSS, JS en plaatjes controleer ik eerst de cache.
  // Dit maakt de app sneller en zorgt dat statische bestanden offline werken.
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
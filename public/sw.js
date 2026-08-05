// KiddoChecker Kiosk Service Worker
// Enables PWA install and offline capability for kiosk terminals

const CACHE_NAME = 'kiddochecker-kiosk-v3';
const URLS_TO_CACHE = [
  '/',
  '/device-login',
  '/check-in',
  '/check-out',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-only for API calls, functions, and non-GET requests
  const isApi = event.request.url.includes('/api/') || 
                event.request.url.includes('/functions/') || 
                event.request.url.includes('/rest/') || 
                event.request.url.includes('/auth/');
  
  if (event.request.method !== 'GET' || isApi) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response('Network request failed', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      })
  );
});

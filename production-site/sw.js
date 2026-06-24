const CACHE_NAME = 'netra-graphics-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/favicon.svg',
  '/click.mp3',
  '/click.wav',
  '/ambient-loop.mp3'
];

// Install Event - Pre-cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache first for assets, network first for documents, bypass API/Supabase
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass database, API, and Supabase connections entirely
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase.co')) {
    return;
  }

  // Network-first for navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html') || caches.match('/'))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache new static assets dynamically
        if (
          networkResponse.status === 200 &&
          (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2|mp3|wav)$/) ||
           url.pathname.includes('/assets/'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});

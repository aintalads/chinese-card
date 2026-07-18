const CACHE_NAME = 'mandarin-cache-v16';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/app.js?v=111',
  '/style.css',
  '/gestures.js',
  '/vision_bundle.mjs',
  '/gesture_recognizer.task',
  '/wasm/vision_wasm_internal.wasm',
  '/wasm/vision_wasm_internal.js',
  '/wasm/vision_wasm_nosimd_internal.wasm',
  '/wasm/vision_wasm_nosimd_internal.js',
  '/wasm/vision_wasm_module_internal.wasm',
  '/wasm/vision_wasm_module_internal.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const cacheAllowlist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheAllowlist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // Check if it's a primary web asset (HTML, JS, CSS) or the main root
  const isWebAsset = url.pathname.endsWith('.html') || 
                     url.pathname.endsWith('.js') || 
                     url.pathname.endsWith('.css') || 
                     url.pathname === '/' ||
                     url.pathname.endsWith('/');

  if (isWebAsset) {
    // Network-first strategy for instant updates when online, with fallback to offline cache
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first strategy for other static assets (fonts, icons, image files, dictionaries)
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          }).catch(() => {
            // Fallback gracefully on fetch failure
          });
        })
    );
  }
});

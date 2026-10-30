// CipherVault Service Worker v1.0.0
const CACHE_NAME = 'ciphervault-static-v1.0.0';
const RUNTIME_CACHE = 'ciphervault-runtime-v1.0.0';

// Essential static resources to pre-cache
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/ciphervault-logo.png',
  '/ciphervault.ico',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Pre-caching partial fail (will fetch on demand):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up stale old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. DO NOT intercept or cache API requests, authentication, or uploads
  if (url.pathname.startsWith('/api') || url.pathname.includes('/upload') || request.method !== 'GET') {
    return; // Let browser handle normally
  }

  // 2. Ignore non-HTTP/HTTPS schemes (e.g. chrome-extension://)
  if (!request.url.startsWith('http')) {
    return;
  }

  // 3. For Navigation (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return caches.match('/');
        });
      })
    );
    return;
  }

  // 4. Stale-While-Revalidate for static assets (images, css, js, fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        // Network failed, nothing extra needed if cachedResponse was returned
      });

      return cachedResponse || fetchPromise;
    })
  );
});

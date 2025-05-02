const CACHE_NAME = 'tweet-link-analyzer-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
  // Add other assets if needed
];

// Install event: Cache essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => {
        console.error('Failed to open cache or add URLs:', err);
      })
  );
  self.skipWaiting(); // Activate worker immediately
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control of uncontrolled clients
});

// Fetch event: Serve cached assets if available, otherwise fetch from network
self.addEventListener('fetch', event => {
  // We only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // For navigation requests, try network first, then cache (NetworkFallingBackToCache)
  // This ensures the user gets the latest HTML if online
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If fetch is successful, cache the response for offline use
          return caches.open(CACHE_NAME).then(cache => {
            // Check if the response is valid before caching
            if (response.ok) {
                cache.put(event.request, response.clone());
            }
            return response;
          });
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request)
            .then(response => {
              return response || caches.match('/index.html'); // Fallback to index
            });
        })
    );
    return;
  }

  // For non-navigation requests (CSS, JS, images), use CacheFirst strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse; // Don't cache invalid responses
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
      .catch(err => {
          console.error("Fetch error:", err);
          // Optionally provide a fallback asset here, e.g., an offline image
      })
  );
});

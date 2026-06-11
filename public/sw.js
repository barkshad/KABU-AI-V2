const CACHE_NAME = 'kabu-ai-cache-v2';
const SYNC_QUEUE_NAME = 'kabu-ai-sync-queue';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP(S) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Network-first strategy for navigation requests to always get the latest index.html
  if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(request, response.clone());
          return response;
        });
      }).catch(() => {
        return caches.match(request).then(response => {
          if (response) return response;
          return caches.match('/index.html');
        });
      })
    );
    return;
  }

  // Cache-first strategy for assets
  if (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.png') || url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) return response;
        return fetch(request).then(networkResponse => {
           // Skip caching non-ok responses
           if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
             return networkResponse;
           }
           const responseToCache = networkResponse.clone();
           caches.open(CACHE_NAME).then(cache => {
             cache.put(request, responseToCache);
           });
           return networkResponse;
        }).catch(() => {
           // Provide a blank response or a specific offline asset if needed
           return new Response();
        });
      })
    );
    return;
  }

  // Let other handlers or default browser behavior handle the rest
  return;
});

// Background Sync capability
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js');

if (workbox) {
  const { BackgroundSyncPlugin } = workbox.backgroundSync;
  const { registerRoute } = workbox.routing;
  const { NetworkOnly } = workbox.strategies;

  const bgSyncPlugin = new BackgroundSyncPlugin(SYNC_QUEUE_NAME, {
    maxRetentionTime: 24 * 60, // Retry for max of 24 Hours (specified in minutes)
    onSync: async ({queue}) => {
       try {
         await queue.replayRequests();
         // Optionally, notify clients that sync is complete
         const clients = await self.clients.matchAll();
         for (const client of clients) {
           client.postMessage({ type: 'SYNC_COMPLETE' });
         }
       } catch (error) {
         console.error("Background sync replay failed:", error);
       }
    }
  });

  registerRoute(
    ({url}) => url.pathname.startsWith('/api/'),
    new NetworkOnly({
      plugins: [bgSyncPlugin]
    }),
    'POST'
  );
  
  registerRoute(
    ({url}) => url.pathname.startsWith('/api/'),
    new NetworkOnly({
      plugins: [bgSyncPlugin]
    }),
    'PUT'
  );
  
  registerRoute(
    ({url}) => url.pathname.startsWith('/api/'),
    new NetworkOnly({
      plugins: [bgSyncPlugin]
    }),
    'DELETE'
  );
}


const CACHE_NAME = 'puchase-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// Handle incoming Payment Handler requests if another merchant calls this origin
self.addEventListener('paymentrequest', (event) => {
  event.respondWith(
    new Promise((resolve) => {
      // In production, open a payment confirmation window via event.openWindow(...)
      // and resolve with { methodName, details } after user approval.
      resolve({
        methodName: event.methodData[0]?.supportedMethods || 'basic-card',
        details: {
          status: 'approved',
          handler: 'puchase-payment-handler',
          total: event.total
        }
      });
    })
  );
});

// Segundos de Sabedoria — Service Worker
const CACHE_NAME = 'sds-v1';
const ASSETS = [
  '/segundos-de-sabedoria/',
  '/segundos-de-sabedoria/index.html',
];

// Install: cache assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clear old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', (e) => {
  // Skip Firebase and external requests
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache successful responses for the main page
        if (response.ok && e.request.destination === 'document') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener('push', (e) => {
  const data = e.data?.json() || {};
  const title = data.title || 'Segundos de Sabedoria';
  const options = {
    body: data.body || 'Sua frase do dia está esperando por você.',
    icon: '/segundos-de-sabedoria/icons/icon-192.png',
    badge: '/segundos-de-sabedoria/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: '/segundos-de-sabedoria/' },
    actions: [
      { action: 'open', title: 'Ver frase' },
      { action: 'close', title: 'Fechar' }
    ]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'close') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      const existing = cs.find(c => c.url.includes('segundos-de-sabedoria'));
      if (existing) return existing.focus();
      return clients.openWindow('/segundos-de-sabedoria/');
    })
  );
});

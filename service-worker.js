// Service Worker para Mar y Rios Pacifico PWA
// Versión 1.0.0

const CACHE_NAME = 'mar-pacifico-v2.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/logo_turismo.png',
  '/manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache abierto');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})));
      })
      .catch(err => {
        console.error('[Service Worker] Error al cachear:', err);
      })
  );
  
  // Forzar activación inmediata
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Tomar control inmediatamente
  return self.clients.claim();
});

// Estrategia de caché: Network First, fallback to Cache
self.addEventListener('fetch', event => {
  // Ignorar requests que no son GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requests de Supabase (necesitan estar siempre online)
  if (event.request.url.includes('supabase.co')) {
    return fetch(event.request);
  }

  // Siempre descargar archivos .js frescos (no usar caché para JavaScript)
  if (event.request.url.endsWith('.js') || event.request.url.includes('.js?')) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, clonarla y guardarla en cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar servir desde cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            console.log('[Service Worker] Sirviendo desde cache:', event.request.url);
            return cachedResponse;
          }
          
          // Si tampoco está en cache, mostrar página offline
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Manejo de mensajes desde la app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({type: 'CACHE_CLEARED'});
    });
  }
});

// Notificaciones push (preparado para futuras implementaciones)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva actualización disponible',
    icon: '/logo_turismo.png',
    badge: '/icon-96.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver ahora',
        icon: '/icon-72.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icon-72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Mar y Rios Pacifico', options)
  );
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sincronización en segundo plano
self.addEventListener('sync', event => {
  if (event.tag === 'sync-sitios') {
    event.waitUntil(syncSitios());
  }
});

async function syncSitios() {
  // Aquí se podría implementar sincronización de datos
  console.log('[Service Worker] Sincronizando datos...');
}

console.log('[Service Worker] Cargado correctamente');

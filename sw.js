// Version auto-incrémentée à chaque déploiement
// ⚠️ NE PAS modifier manuellement — mis à jour par le script de build
const CACHE_VERSION = 'medstat-v132958';
const CACHE_STATIC = CACHE_VERSION + '-static';
const ASSETS = ['/manifest.json'];

// Install : mettre en cache les assets statiques, prendre le contrôle immédiatement
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting()) // activer le nouveau SW sans attendre
  );
});

// Activate : supprimer les anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !k.startsWith('medstat-v' + '127834'))
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch : stratégie par type de ressource
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // HTML (navigation) → Network First : toujours la dernière version
  if (e.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // Mettre à jour le cache avec la nouvelle version
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_STATIC).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request)) // fallback offline
    );
    return;
  }

  // Assets statiques → Cache First (manifest, icons)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_STATIC).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});

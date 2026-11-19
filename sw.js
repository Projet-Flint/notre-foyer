// Garde l'app disponible hors connexion. Changer VERSION à chaque mise à jour.
const VERSION = 'notrefoyer-v4';
const FILES = ['./', 'index.html', 'app.css', 'store.js', 'ui.js', 'famille.js', 'autres.js', 'infirmiere.js', 'partage.js', 'app.js',
  'manifest.webmanifest', 'manifest-a.webmanifest', 'manifest-b.webmanifest', 'manifest-c.webmanifest',
  'icons/icon-a-180.png', 'icons/icon-a-192.png', 'icons/icon-a-512.png', 'icons/icon-b-180.png', 'icons/icon-b-192.png', 'icons/icon-b-512.png',
  'icons/icon-c-180.png', 'icons/icon-c-192.png', 'icons/icon-c-512.png', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Réseau d'abord (pour recevoir les mises à jour), cache si pas de connexion.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});

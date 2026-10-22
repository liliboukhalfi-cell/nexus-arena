// Service worker minimal : rend le jeu installable (web app) sans rien mettre en cache.
// Tout passe par le réseau, donc chaque déploiement Netlify est vu tout de suite.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {}); // pas de respondWith : le navigateur gère la requête normalement

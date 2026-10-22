/*
 * Servicewerker van De Dag.
 *
 * Netwerk eerst, cache als terugval. De briefing verandert drie keer per dag,
 * dus een cache-eerst-aanpak zou hem oude berichten laten zien; andersom is het
 * hooguit een seconde wachten en heb je altijd het nieuwste.
 */
const VERSIE = 'dedag-1';
const BESTANDEN = ['./', './index.html', './manifest.webmanifest',
                   './icoon-180.png', './icoon-192.png', './icoon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSIE);
    await cache.addAll(BESTANDEN);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const namen = await caches.keys();
    await Promise.all(namen.filter((n) => n.startsWith('dedag-') && n !== VERSIE)
                           .map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const vers = await fetch(e.request);
      const cache = await caches.open(VERSIE);
      cache.put(e.request, vers.clone());
      return vers;
    } catch (err) {
      const bewaard = await caches.match(e.request);
      return bewaard || caches.match('./index.html');
    }
  })());
});

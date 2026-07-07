/*
  Seyda Zeynab Academy — Service Worker
  Stratégie :
  - Page principale (index.html) : réseau d'abord (pour récupérer les mises à jour
    dès qu'il y a internet), puis secours sur le cache si hors ligne.
  - Autres fichiers (icônes, manifest) : cache d'abord.
  - CACHE_VERSION : à changer à chaque nouvelle version envoyée pour forcer
    la mise à jour du cache (les données de l'appli, elles, ne sont jamais
    stockées ici — elles restent dans le stockage local du navigateur et ne
    sont donc jamais affectées par une mise à jour).
*/
const CACHE_VERSION = "sza-v1";
const CORE_ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Navigation (the app page itself): network-first, cache fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // Everything else: cache-first, network fallback.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        caches.open(CACHE_VERSION).then((cache) => cache.put(req, res.clone()));
        return res;
      }).catch(() => cached);
    })
  );
});

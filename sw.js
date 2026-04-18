const CACHE_NAME = 'familyguard-ai-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './ui.js',
  './gemini.js',
  './riskEngine.js',
  './interventions.js',
  './familyManager.js',
  './clinicalAdvisor.js',
  './clinicalValidation.js',
  './explainability.js',
  './outcomeSimulator.js',
  './localizedRecommendations.js',
  './modelPerformance.js',
  './securityAudit.js',
  './indianThresholds.json',
  './demoPatient.json',
  './mockLabDataset.json',
  './manifest.webmanifest',
  './assets/icons/icon-192.svg',
  './assets/icons/icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const req = event.request;
  const isSameOrigin = new URL(req.url).origin === self.location.origin;

  if (req.mode === 'navigate' || isSameOrigin) {
    event.respondWith(
      fetch(req)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, responseClone));
          return response;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});

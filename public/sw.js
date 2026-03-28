const CACHE_NAME = '__CACHE_NAME__';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Let API calls and video streams pass through to the network
  if (url.pathname.startsWith('/Users/') ||
      url.pathname.startsWith('/Videos/') ||
      url.pathname.startsWith('/Items/') ||
      url.pathname.startsWith('/Shows/') ||
      url.pathname.startsWith('/Sessions/') ||
      url.pathname.startsWith('/Library/')) {
    return;
  }

  // For app shell, try network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

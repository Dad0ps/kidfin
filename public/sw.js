const CACHE_NAME = 'kidfin-v1';

self.addEventListener('install', () => {
  // Don't activate immediately — wait for the app to trigger skipWaiting
  // so the user sees the update notice first
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
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

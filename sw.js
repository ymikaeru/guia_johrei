
const CACHE_NAME = 'johrei-guide-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './css/tag-browser.css',
    './js/main.js',
    './js/data.js',
    './js/ui.js',
    './js/search-engine.js',
    './js/tag-browser.js',
    './js/body-map-helpers.js',
    './js/favorites.js',
    './js/print-manager.js',
    './assets/images/icon.png',
    './data/index.json',
    // We should technically list all data files if we want 100% offline on first load,
    // or let the user browse to cache them. 
    // For a "Perfect" app, let's try to cache key data files if possible, 
    // or rely on the dynamic caching strategy below.
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // DATA Strategy: Stale-While-Revalidate (Fast render, then update)
    if (url.pathname.includes('/data/') || url.pathname.endsWith('.json')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // STATIC ASSETS Strategy: Cache First
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((networkResponse) => {
                // Dynamically cache other visited assets (like font files, images not in list)
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});

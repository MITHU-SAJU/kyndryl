/* global importScripts, workbox, self */

// Load Workbox from Google CDN to avoid local ESM path import parsing bugs
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (self.workbox) {
  console.log('[PWA SW] Workbox loaded from CDN');

  // Immediately activate new service workers when updated
  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  // Precache built assets (will be injected by vite-plugin-pwa)
  self.workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

  // Cache Google Fonts stylesheets
  self.workbox.routing.registerRoute(
    /^https:\/\/fonts\.googleapis\.com\/.*/i,
    new self.workbox.strategies.CacheFirst({
      cacheName: 'google-fonts-stylesheets',
      plugins: [
        new self.workbox.expiration.ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
        })
      ]
    })
  );

  // Cache Google Fonts webfonts (woff2, etc.)
  self.workbox.routing.registerRoute(
    /^https:\/\/fonts\.gstatic\.com\/.*/i,
    new self.workbox.strategies.CacheFirst({
      cacheName: 'google-fonts-webfonts',
      plugins: [
        new self.workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
        })
      ]
    })
  );

  // Cache JSDelivr Bootstrap CDN CSS & Bundle JS
  self.workbox.routing.registerRoute(
    /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
    new self.workbox.strategies.NetworkFirst({
      cacheName: 'jsdelivr-cdn',
      plugins: [
        new self.workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
        })
      ]
    })
  );

  // Catch-all SPA navigation routing so users reloading deep links offline get index.html
  self.workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new self.workbox.strategies.NetworkFirst({
      cacheName: 'spa-navigations',
      plugins: [
        {
          handlerDidError: async () => {
            // Serve the precached index.html if network navigation fails
            return self.workbox.precaching.getCacheKeyForURL('/index.html') 
              ? caches.match(self.workbox.precaching.getCacheKeyForURL('/index.html'))
              : Response.error();
          }
        }
      ]
    })
  );
} else {
  console.log('[PWA SW] Failed to load Workbox from CDN');
}

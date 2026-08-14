/**
 * Service worker.
 *
 * Two caching strategies, chosen per request type:
 *
 *   - Static build output (/_next/static/*, icons, the manifest) is
 *     cache-first. Those URLs are content-hashed, so a cached copy can never be
 *     stale and re-fetching one is pure waste.
 *   - Everything else is network-first with a cache fallback. A studio's prices
 *     and availability must never be served from a stale cache, so the network
 *     always gets first refusal; the cache only answers when it is offline.
 *
 * Anything that is not a GET is passed straight through. Caching a booking POST
 * would be actively harmful.
 */

/**
 * The build id, passed in by the registration URL (`/sw.js?v=<build>`).
 *
 * Cache names are derived from it so a deploy starts with empty caches and the
 * activate handler below deletes the previous build's. A fixed version string
 * here would let a stale HTML shell survive a deploy and then request chunk
 * files that no longer exist.
 */
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const STATIC_CACHE = `pulse-static-${VERSION}`;
const PAGE_CACHE = `pulse-pages-${VERSION}`;
const OFFLINE_URL = '/offline';

/** Pre-cached so the offline page is available on the very first disconnection. */
const PRECACHE = [OFFLINE_URL, '/icon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      // Individually, so one 404 does not fail the whole install and leave the
      // worker permanently uninstalled.
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Only handle our own origin. Embedded players and the map are third-party
  // and must be left to their own caching.
  if (url.origin !== self.location.origin) return;

  // Never cache the API — availability and quotes have to be live.
  if (url.pathname.startsWith('/api/')) return;

  const isStatic =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webmanifest') ||
    url.pathname.endsWith('.woff2');

  if (isStatic) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.mode === 'navigate') {
          const copy = response.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        // A navigation with nothing cached gets the offline page rather than
        // the browser's own error, which tells the visitor nothing useful.
        if (request.mode === 'navigate') {
          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;
        }

        return new Response('Offline', {
          status: 503,
          statusText: 'Offline',
          headers: { 'Content-Type': 'text/plain' },
        });
      }),
  );
});

const CACHE_NAME = 'preplingo-v14';

const CORE_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
];

const BYPASS_HOSTS = new Set([
  'api.dictionaryapi.dev',
  'api.mymemory.translated.net',
]);

const FONT_HOSTS = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
]);

/**
 * Extracts local script, stylesheet, and preload URLs from the HTML shell
 * so Vite-hashed JS/CSS/JSON bundles are cached immediately on install.
 */
function extractHtmlAssetUrls(html, baseUrl) {
  const urls = new Set();
  const attrRegex = /(?:src|href)=["']([^"']+)["']/gi;
  let match;

  while ((match = attrRegex.exec(html)) !== null) {
    const raw = match[1];
    if (!raw || raw.startsWith('data:') || raw.startsWith('#') || raw.startsWith('mailto:')) {
      continue;
    }
    try {
      const resolved = new URL(raw, baseUrl);
      if (resolved.origin === self.location.origin || FONT_HOSTS.has(resolved.hostname)) {
        urls.add(resolved.href);
      }
    } catch {
      // Ignore malformed URLs
    }
  }

  return Array.from(urls);
}

async function cacheAssetSafely(cache, url) {
  try {
    const request = new Request(url, { mode: url.startsWith(self.location.origin) ? 'same-origin' : 'cors' });
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      await cache.put(url, response.clone());
    }
  } catch {
    // Individual asset failure must not abort installation
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // 1. Precache core shell, manifest, and PWA icons
      await Promise.allSettled(
        CORE_SHELL_ASSETS.map((asset) => cacheAssetSafely(cache, new URL(asset, self.location.origin).href))
      );

      // 2. Discover and precache all linked JS/CSS bundles from index.html
      try {
        const indexResp = await fetch(new Request('/', { cache: 'reload' }));
        if (indexResp && indexResp.ok) {
          const htmlText = await indexResp.clone().text();
          await cache.put(new URL('/', self.location.origin).href, indexResp.clone());
          await cache.put(new URL('/index.html', self.location.origin).href, indexResp);

          const discoveredAssets = extractHtmlAssetUrls(htmlText, self.location.origin);
          await Promise.allSettled(discoveredAssets.map((assetUrl) => cacheAssetSafely(cache, assetUrl)));
        }
      } catch {
        // Fallback silently if offline during re-install
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((oldName) => caches.delete(oldName))
      );
      await self.clients.claim();
    })()
  );
});

function isCacheableRequest(request, url) {
  if (request.method !== 'GET') return false;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

  // Never cache external online dictionary APIs; fail gracefully when offline
  if (BYPASS_HOSTS.has(url.hostname)) return false;

  // Never cache Vite dev server modules or HMR endpoints (prevents stale UI/logic in preview)
  if (
    url.pathname === '/__vite_ping' ||
    url.pathname.includes('hot-update') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@vite/') ||
    url.pathname.startsWith('/@fs/') ||
    url.pathname.startsWith('/@id/') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return false;
  }

  // Allow same-origin assets & navigations + Google Fonts
  return url.origin === self.location.origin || FONT_HOSTS.has(url.hostname);
}

function isNavigationOrShellRequest(request, url) {
  if (request.mode === 'navigate') return true;
  if (url.origin === self.location.origin) {
    return url.pathname === '/' || url.pathname === '/index.html';
  }
  return false;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  let url;

  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Bypass external online dictionary API calls and non-cacheable requests
  if (!isCacheableRequest(request, url)) {
    return;
  }

  // Network-First (with Cache Fallback) for index.html / navigation requests
  // Ensures mobile & desktop devices immediately receive new UI updates when online.
  if (isNavigationOrShellRequest(request, url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
            await cache.put(new URL('/', self.location.origin).href, networkResponse.clone());
            await cache.put(new URL('/index.html', self.location.origin).href, networkResponse.clone());
            return networkResponse;
          }
        } catch {
          // Offline or network unreachable -> fall through to cache
        }

        const cachedShell =
          (await cache.match(request, { ignoreSearch: true })) ||
          (await cache.match(new URL('/index.html', self.location.origin).href)) ||
          (await cache.match(new URL('/', self.location.origin).href));

        if (cachedShell) {
          return cachedShell;
        }

        return new Response('Çevrimdışı içerik bulunamadı.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })()
    );
    return;
  }

  // Cache-First (with Network Fallback & Runtime Caching) for static bundles, JSON, fonts, icons
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(request);
        if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
          cache.put(request, networkResponse.clone()).catch(() => {});
        }
        return networkResponse;
      } catch {
        return new Response('Çevrimdışı içerik bulunamadı.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    })()
  );
});

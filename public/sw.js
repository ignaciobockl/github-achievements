/**
 * Service Worker for GitHub Achievements
 * Cache strategies:
 * - Static assets (JS, CSS, images, fonts): Cache First (1 year)
 * - HTML pages: Network First with fallback to cache (offline support)
 * - API calls (GitHub API): Network Only (no caching)
 * - Manifest: Cache First
 */

const SW_VERSION = "v1.0.0";
const CACHE_NAMES = {
  static: `static-${SW_VERSION}`,
  pages: `pages-${SW_VERSION}`,
  api: `api-${SW_VERSION}`,
};

// Assets to precache on install
const PRECACHE_ASSETS = ["/", "/en/", "/es/", "/manifest.json", "/favicon.svg", "/favicon.ico"];

// URL patterns for routing
const PATTERNS = {
  // Static assets served from /_astro/ and public folder
  static: /\.(?:js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot|map)$/,
  // HTML pages (Astro routes)
  html: /\.(?:html?)$/,
  // API calls to GitHub
  api: /^https:\/\/api\.github\.com\//,
  // Manifest
  manifest: /\/manifest\.json$/,
};

/**
 * Check if request is for a static asset
 */
function isStaticAsset(url) {
  return PATTERNS.static.test(url.pathname);
}

/**
 * Check if request is for an HTML page
 */
function isHtmlPage(url) {
  return PATTERNS.html.test(url.pathname) || url.pathname.endsWith("/");
}

/**
 * Check if request is to GitHub API
 */
function isApiRequest(url) {
  return PATTERNS.api.test(url.href);
}

/**
 * Check if request is for manifest
 */
function isManifestRequest(url) {
  return PATTERNS.manifest.test(url.pathname);
}

/**
 * Open a cache by name
 */
async function openCache(cacheName) {
  return caches.open(cacheName);
}

/**
 * Cache-first strategy for static assets
 */
async function cacheFirst(request, cacheName) {
  const cache = await openCache(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Serve from cache, optionally update in background
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache for 1 year (static assets with hash in filename)
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    console.error("[SW] Cache-first fetch failed:", error);
    throw error;
  }
}

/**
 * Network-first strategy for HTML pages
 */
async function networkFirst(request, cacheName) {
  const cache = await openCache(cacheName);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("[SW] Network failed, trying cache:", error);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      const offlineResponse = await cache.match("/offline.html");
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    throw error;
  }
}

/**
 * Network-only strategy for API calls
 */
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.error("[SW] API request failed:", error);
    throw error;
  }
}

/**
 * Install event - precache critical assets
 */
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker:", SW_VERSION);

  event.waitUntil(
    (async () => {
      const staticCache = await openCache(CACHE_NAMES.static);
      const pagesCache = await openCache(CACHE_NAMES.pages);

      // Precache static assets
      const staticPromises = PRECACHE_ASSETS.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await staticCache.put(url, response);
          }
        } catch (error) {
          console.warn("[SW] Failed to precache:", url, error);
        }
      });

      await Promise.all(staticPromises);

      // Also precache the offline page
      try {
        const offlineResponse = await fetch("/offline.html");
        if (offlineResponse.ok) {
          await pagesCache.put("/offline.html", offlineResponse);
        }
      } catch (error) {
        console.warn("[SW] Failed to precache offline.html:", error);
      }

      // Force activation
      await self.skipWaiting();
    })(),
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker:", SW_VERSION);

  event.waitUntil(
    (async () => {
      // Get all cache names
      const cacheNames = await caches.keys();

      // Delete caches that don't match current version
      const deletePromises = cacheNames
        .filter((name) => {
          const isCurrentStatic = name === CACHE_NAMES.static;
          const isCurrentPages = name === CACHE_NAMES.pages;
          const isCurrentApi = name === CACHE_NAMES.api;
          return !isCurrentStatic && !isCurrentPages && !isCurrentApi;
        })
        .map((name) => {
          console.log("[SW] Deleting old cache:", name);
          return caches.delete(name);
        });

      await Promise.all(deletePromises);

      // Claim all clients
      await self.clients.claim();
    })(),
  );
});

/**
 * Fetch event - route requests based on URL patterns
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http(s) schemes
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Route based on request type
  if (isApiRequest(url)) {
    // GitHub API - Network Only
    event.respondWith(networkOnly(request));
  } else if (isManifestRequest(url)) {
    // Manifest - Cache First
    event.respondWith(cacheFirst(request, CACHE_NAMES.static));
  } else if (isStaticAsset(url)) {
    // Static assets (JS, CSS, images, fonts) - Cache First
    event.respondWith(cacheFirst(request, CACHE_NAMES.static));
  } else if (isHtmlPage(url)) {
    // HTML pages - Network First with cache fallback
    event.respondWith(networkFirst(request, CACHE_NAMES.pages));
  } else {
    // Default: Network First for everything else
    event.respondWith(networkFirst(request, CACHE_NAMES.pages));
  }
});

/**
 * Message event - handle messages from clients
 */
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }

  if (event.data === "getVersion") {
    event.ports[0].postMessage({ version: SW_VERSION });
  }
});

/**
 * Error handler for unhandled promise rejections
 */
self.addEventListener("unhandledrejection", (event) => {
  console.error("[SW] Unhandled rejection:", event.reason);
});

console.log("[SW] Service Worker loaded:", SW_VERSION);

// Track C: service worker (PWA skeleton).
// Bump CACHE_VERSION whenever the caching strategy or the shell list changes:
// activate then deletes every cache from older versions.
const CACHE_VERSION = 'v1';
const CACHE_NAME = `hav-shell-${CACHE_VERSION}`;
const CACHE_PREFIX = 'hav-shell-';

// All paths are relative to this file, so the app works under any base path (vite base './').
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Vite gives the built JS/CSS hashed names, so they cannot be listed here.
// Read them from the built index.html instead, so the shell works offline after the first visit.
async function builtAssets() {
  try {
    const html = await (await fetch('./index.html', { cache: 'no-cache' })).text();
    return [...html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)].map((m) => m[1]);
  } catch {
    return [];
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(SHELL);
      // Best effort: a missing hashed asset must not block installation.
      await Promise.allSettled((await builtAssets()).map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

const isHTML = (request) =>
  request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');

// Only cache complete, same-origin responses (no errors, no partial 206 range responses).
const cacheable = (response) => response.ok && response.status === 200 && response.type === 'basic';

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (cacheable(response)) cache.put(request, response.clone());
    return response;
  } catch (err) {
    // Offline: same page with any query string (e.g. ?model=...), else the app shell.
    const cached =
      (await cache.match(request, { ignoreSearch: true })) || (await cache.match('./index.html'));
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (cacheable(response)) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return; // let the browser handle it
  if (request.headers.has('range')) return; // partial requests are not cached
  event.respondWith(isHTML(request) ? networkFirst(request) : cacheFirst(request));
});

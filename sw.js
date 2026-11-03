'use strict';
const VERSION = '2026-11-03-photo-guide-10';
const PREFIX = 'sg-visit-2026-';
const SHELL = PREFIX + 'shell-' + VERSION;
const PHOTOS = PREFIX + 'photos-' + VERSION;
const BASE = self.registration.scope;
const ASSETS = ['./', './index.html', './pwa.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'].map(p => new URL(p, BASE).href);
const MAX_PHOTOS = 60;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await cache.addAll(ASSETS.map(url => new Request(url, {cache: 'reload'})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(PREFIX) && key !== SHELL && key !== PHOTOS) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
async function networkWithTimeout(request) {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 5000);
  try { return await fetch(request, {signal: abort.signal}); }
  finally { clearTimeout(timer); }
}
async function navigation(request) {
  const cache = await caches.open(SHELL);
  try {
    const response = await networkWithTimeout(request);
    if (response.ok && (response.headers.get('content-type') || '').includes('text/html')) {
      try { await cache.put(new URL('./index.html', BASE).href, response.clone()); } catch (_) {}
      return response;
    }
    const cached = await cache.match(new URL('./index.html', BASE).href);
    return cached || response;
  } catch (_) {
    const cached = await cache.match(new URL('./index.html', BASE).href);
    return cached || Response.error();
  }
}
async function photo(request) {
  const cache = await caches.open(PHOTOS);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === 'opaque') {
    try {
      await cache.put(request, response.clone());
      const keys = await cache.keys();
      for (const key of keys.slice(0, Math.max(0, keys.length - MAX_PHOTOS))) await cache.delete(key);
    } catch (_) { /* Storage limits must not prevent the live image from loading. */ }
  }
  return response;
}
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const sameSite = url.origin === new URL(BASE).origin && url.pathname.startsWith(new URL(BASE).pathname);
  if (sameSite && event.request.mode === 'navigate') {
    event.respondWith(navigation(event.request));
  } else if (sameSite && ASSETS.includes(url.href)) {
    event.respondWith(caches.open(SHELL).then(async cache => (await cache.match(event.request)) || fetch(event.request)));
  } else if (event.request.destination === 'image' && /^https?:$/.test(url.protocol)) {
    event.respondWith(photo(event.request));
  }
});

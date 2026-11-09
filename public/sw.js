// The build script injects hashed asset URLs and a build-specific cache name.
const CACHE = 'maglody-shell-dev'
const BUILD_ASSETS = []
const SHELL = ['./', './index.html', './manifest.webmanifest', ...BUILD_ASSETS]
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    await cache.addAll(SHELL)
    await self.skipWaiting()
  })())
})
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names.filter(name => name !== CACHE && (name.startsWith('maglody-shell-') || name === 'maglody-v1')).map(name => caches.delete(name)))
    await self.clients.claim()
  })())
})
self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/api/')) return
  event.respondWith((async () => {
    try {
      const response = await fetch(request)
      if (response.ok) {
        const copy = response.clone()
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {}))
      }
      return response
    } catch {
      const cache = await caches.open(CACHE)
      const buildAsset = BUILD_ASSETS.some(asset => new URL(asset, self.registration.scope).href === url.href)
      // Immutable same-origin build files are identical for module and precache requests.
      const cached = await cache.match(request, { ignoreVary: buildAsset })
      if (cached) return cached
      // An unavailable script/image must never receive HTML in its place.
      if (request.mode === 'navigate') return (await cache.match('./index.html')) || Response.error()
      return Response.error()
    }
  })())
})

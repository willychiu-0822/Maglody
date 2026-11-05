// Maglody service worker：App 外殼離線可用（網路優先，失敗時讀快取）
const CACHE = 'maglody-v1'
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html', './manifest.webmanifest'])))
  self.skipWaiting()
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))))
  self.clients.claim()
})
self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  // 只處理同源 GET；大師 Agent 的 API 呼叫不快取
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/api/')) return
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(req, copy))
        return res
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  )
})

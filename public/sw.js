/* TicketShop lite service worker — cache shell for scanner PWA */
const CACHE = 'ticketshop-scanner-v1'
const PRECACHE = ['/admin/scanner', '/manifest.webmanifest', '/icons/scanner-192.png', '/icons/scanner-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  // Network-first for API; cache-first for scanner shell assets
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request).catch(() => new Response(JSON.stringify({ ok: false, offline: true }), { headers: { 'Content-Type': 'application/json' } })))
    return
  }
  if (url.pathname.startsWith('/admin/scanner') || url.pathname.startsWith('/icons/') || url.pathname === '/manifest.webmanifest') {
    event.respondWith(
      caches.match(event.request).then((hit) => hit || fetch(event.request).then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(event.request, copy))
        return res
      }))
    )
  }
})

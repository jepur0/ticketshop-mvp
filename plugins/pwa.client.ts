export default defineNuxtPlugin(() => {
  if (!('serviceWorker' in navigator)) return
  const path = window.location.pathname
  // Register SW on scanner (and optionally site-wide for install prompt)
  if (path.startsWith('/admin/scanner') || path.startsWith('/login')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('[PWA] SW register failed', e))
    })
  }
})

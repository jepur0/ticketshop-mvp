/**
 * Client interval stub: every 60s ping server to expire unpaid holds.
 * Admin can also force-release from Monitoring.
 */
export default defineNuxtPlugin(() => {
  if (!import.meta.client) return
  const tick = () => {
    $fetch('/api/holds/release-expired', { method: 'POST', body: {} }).catch(() => {})
  }
  // first run after 15s, then every 60s
  setTimeout(tick, 15000)
  setInterval(tick, 60000)
})

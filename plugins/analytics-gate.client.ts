export default defineNuxtPlugin(() => {
  const allowed = useNonEssentialAllowed()
  watch(
    allowed,
    (ok) => {
      if (ok) {
        // Placeholder: load analytics only after full consent
        ;(window as any).__TS_ANALYTICS__ = { enabled: true, note: 'Would load Matomo/GA here' }
        console.info('[TicketShop] Non-essential cookies allowed — analytics stub armed')
      } else {
        ;(window as any).__TS_ANALYTICS__ = { enabled: false }
      }
    },
    { immediate: true }
  )
})

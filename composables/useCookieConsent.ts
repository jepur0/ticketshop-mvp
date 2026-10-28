export type ConsentLevel = 'essential' | 'all' | null

export function useCookieConsent() {
  return useState<ConsentLevel>('cookie-consent', () => null)
}

/** Non-essential scripts (analytics etc.) may run only when consent === 'all'. */
export function useNonEssentialAllowed() {
  const consent = useCookieConsent()
  return computed(() => consent.value === 'all')
}

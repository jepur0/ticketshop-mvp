export type CartItem = {
  eventId: string
  eventSlug: string
  eventTitle: string
  label: string
  price: number
  seatId?: string | null
  categoryId?: string
}

export type HoldMeta = {
  holdId?: string | null
  seatsHoldToken?: string | null
}

const HOLD_MS_DEFAULT = 20 * 60 * 1000

export function useCart() {
  const items = useState<CartItem[]>('cart-items', () => [])
  const holdStartedAt = useState<number | null>('cart-hold-started', () => null)
  const holdMeta = useState<HoldMeta>('cart-hold-meta', () => ({}))
  const holdMs = useState<number>('cart-hold-ms', () => HOLD_MS_DEFAULT)

  const total = computed(() => items.value.reduce((s, i) => s + i.price, 0))
  const count = computed(() => items.value.length)

  const holdExpiresAt = computed(() =>
    holdStartedAt.value ? holdStartedAt.value + holdMs.value : null
  )

  const holdRemainingMs = computed(() => {
    if (!holdExpiresAt.value) return 0
    return Math.max(0, holdExpiresAt.value - Date.now())
  })

  function addItem(item: CartItem) {
    items.value = [...items.value, item]
    if (!holdStartedAt.value) holdStartedAt.value = Date.now()
  }

  function removeItem(index: number) {
    items.value = items.value.filter((_, i) => i !== index)
    if (!items.value.length) {
      holdStartedAt.value = null
      holdMeta.value = {}
    }
  }

  function clear() {
    items.value = []
    holdStartedAt.value = null
    holdMeta.value = {}
  }

  function setHoldMeta(meta: Partial<HoldMeta>) {
    holdMeta.value = { ...holdMeta.value, ...meta }
  }

  function setHoldMinutes(minutes: number) {
    holdMs.value = Math.max(5, minutes) * 60 * 1000
  }

  return {
    items,
    total,
    count,
    holdStartedAt,
    holdExpiresAt,
    holdRemainingMs,
    holdMeta,
    addItem,
    removeItem,
    clear,
    setHoldMeta,
    setHoldMinutes
  }
}

import { listCatalog } from './catalog'
import { readOrders } from './store'

export type PromoRecord = {
  id: string
  code: string
  kind: 'percent' | 'fixed'
  amount: number
  validFrom?: string
  validUntil?: string
  usageLimit?: number
  eventId?: string
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

export async function evaluatePromo(code: string, eventId: string, subtotal: number) {
  const trimmed = code.trim()
  if (!trimmed) return { ok: true as const, discount: 0, code: '' }
  const promos = await listCatalog<PromoRecord>('promos')
  const promo = promos.find((p) => p.code.trim().toLowerCase() === trimmed.toLowerCase())
  if (!promo) return { ok: false as const, message: 'Promo-Code unbekannt' }
  const today = new Date().toISOString().slice(0, 10)
  if (promo.validFrom && today < promo.validFrom) return { ok: false as const, message: 'Promo-Code ist noch nicht gültig' }
  if (promo.validUntil && today > promo.validUntil) return { ok: false as const, message: 'Promo-Code ist abgelaufen' }
  if (promo.eventId && promo.eventId !== eventId) return { ok: false as const, message: 'Promo-Code gilt nicht für dieses Event' }
  const limit = Number(promo.usageLimit || 0)
  if (limit > 0) {
    const orders = await readOrders()
    const used = orders.filter(
      (o) =>
        (o as any).promoCode &&
        String((o as any).promoCode).toLowerCase() === promo.code.toLowerCase() &&
        (o.status === 'paid' || o.status === 'pending')
    ).length
    if (used >= limit) return { ok: false as const, message: 'Promo-Code wurde bereits zu oft verwendet' }
  }
  const amount = Number(promo.amount) || 0
  const discount =
    promo.kind === 'percent' ? round2(subtotal * (Math.min(100, Math.max(0, amount)) / 100)) : Math.min(subtotal, Math.max(0, amount))
  return { ok: true as const, discount: round2(discount), code: promo.code }
}

export function applyDiscount(items: Array<{ price: number }>, discount: number) {
  const subtotal = round2(items.reduce((s, i) => s + Number(i.price || 0), 0))
  if (discount <= 0 || subtotal <= 0) return items.map((i) => ({ ...i, price: round2(Number(i.price || 0)) }))
  let left = discount
  return items.map((item, index) => {
    const price = Number(item.price || 0)
    if (index === items.length - 1) return { ...item, price: round2(Math.max(0, price - left)) }
    const share = round2(discount * (price / subtotal))
    left = round2(left - share)
    return { ...item, price: round2(Math.max(0, price - share)) }
  })
}

import { createError } from 'h3'
import { applyDiscount, evaluatePromo } from './promo'

export async function priceCheckoutBody(body: any) {
  const rawItems = Array.isArray(body?.items) ? body.items : []
  const items = rawItems.map((i: any) => ({
    label: String(i.label || ''),
    price: Number(i.price) || 0,
    seatId: i.seatId ?? null,
    categoryId: i.categoryId,
    eventId: i.eventId,
    eventTitle: i.eventTitle,
    eventSlug: i.eventSlug
  }))
  const subtotal = Math.round(items.reduce((s, i) => s + i.price, 0) * 100) / 100
  const eventId = String(body?.eventId || items[0]?.eventId || '')
  const promo = await evaluatePromo(String(body?.promoCode || ''), eventId, subtotal)
  if (!promo.ok) throw createError({ statusCode: 400, statusMessage: promo.message })
  const priced = applyDiscount(items, promo.discount)
  const total = Math.round(priced.reduce((s, i) => s + i.price, 0) * 100) / 100
  return {
    items: priced,
    subtotal,
    discount: promo.discount,
    total,
    promoCode: promo.code || undefined,
    affiliateRef: String(body?.affiliateRef || '').trim() || undefined,
    eventId
  }
}

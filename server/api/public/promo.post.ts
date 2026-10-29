import { priceCheckoutBody } from '../../utils/checkout-price'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const priced = await priceCheckoutBody({ ...body, affiliateRef: '' })
  return {
    ok: true,
    subtotal: priced.subtotal,
    discount: priced.discount,
    total: priced.total,
    promoCode: priced.promoCode || null
  }
})

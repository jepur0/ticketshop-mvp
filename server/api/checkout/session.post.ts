import Stripe from 'stripe'
import { readSettings } from '../../utils/settings'
import { readOrders, writeOrders, newId, logFailedPayment, type OrderRecord } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const settings = await readSettings()

  if (!body?.customer?.email || !body?.customer?.name || !Array.isArray(body?.items) || !body.items.length) {
    throw createError({ statusCode: 400, statusMessage: 'customer + items required' })
  }

  const orderId = newId('ord')
  const total = body.items.reduce((s: number, i: any) => s + Number(i.price || 0), 0)
  const order: OrderRecord = {
    id: orderId,
    eventId: String(body.eventId || body.items[0]?.eventId || ''),
    eventTitle: String(body.eventTitle || body.items[0]?.eventTitle || 'Event'),
    eventSlug: body.eventSlug || body.items[0]?.eventSlug,
    createdAt: new Date().toISOString(),
    status: 'pending',
    payment: 'stripe',
    customer: {
      name: String(body.customer.name),
      email: String(body.customer.email),
      phone: body.customer.phone || ''
    },
    items: body.items.map((i: any) => ({
      label: String(i.label),
      price: Number(i.price),
      seatId: i.seatId ?? null,
      categoryId: i.categoryId
    })),
    total,
    fees: 0,
    holdIds: body.holdId ? [body.holdId] : [],
    seatsHoldToken: body.seatsHoldToken || null
  }

  const orders = await readOrders()
  orders.unshift(order)
  await writeOrders(orders)

  const stripeReady = !!(settings.stripe.secretKey && settings.stripe.publishableKey)
  if (!stripeReady) {
    return { mode: 'mock', orderId, message: 'Stripe keys not set — use mock pay' }
  }

  try {
    const stripe = new Stripe(settings.stripe.secretKey)
    const site = settings.commerce.siteUrl || 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: order.customer.email,
      client_reference_id: orderId,
      metadata: { orderId, eventId: order.eventId },
      line_items: order.items.map((i) => ({
        quantity: 1,
        price_data: {
          currency: settings.commerce.currency || 'eur',
          unit_amount: Math.round(i.price * 100),
          product_data: {
            name: `${order.eventTitle} — ${i.label}`.slice(0, 120)
          }
        }
      })),
      success_url: `${site}/checkout/success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/checkout?canceled=1&orderId=${orderId}`
    })

    order.stripeSessionId = session.id
    order.paymentRef = session.id
    await writeOrders(orders)

    return {
      mode: 'stripe',
      orderId,
      sessionId: session.id,
      url: session.url
    }
  } catch (e: any) {
    order.status = 'failed'
    order.failReason = e?.message || 'stripe_error'
    await writeOrders(orders)
    await logFailedPayment({
      email: order.customer.email,
      amount: total,
      reason: e?.message || 'stripe_error',
      provider: 'stripe',
      orderId
    })
    // Never log secret keys
    console.error('[TicketShop] Stripe session failed:', e?.message)
    throw createError({ statusCode: 502, statusMessage: 'Stripe session failed' })
  }
})

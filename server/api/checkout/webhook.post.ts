import Stripe from 'stripe'
import { readSettings } from '../../utils/settings'
import { readOrders, writeOrders, readHolds, writeHolds, logFailedPayment } from '../../utils/store'
import { fulfillPaidOrder } from '../../utils/tickets'

export default defineEventHandler(async (event) => {
  const settings = await readSettings()
  const raw = await readRawBody(event)
  const sig = getHeader(event, 'stripe-signature')

  // Without webhook secret: accept JSON mock events for local testing
  let type = ''
  let session: any = null
  let paymentIntent: any = null

  if (settings.stripe.webhookSecret && settings.stripe.secretKey && sig && raw) {
    try {
      const stripe = new Stripe(settings.stripe.secretKey)
      const evt = stripe.webhooks.constructEvent(raw, sig, settings.stripe.webhookSecret)
      type = evt.type
      if (type === 'checkout.session.completed') session = evt.data.object
      if (type === 'payment_intent.succeeded') paymentIntent = evt.data.object
      if (type === 'payment_intent.payment_failed') {
        const pi = evt.data.object as any
        await logFailedPayment({
          email: pi.receipt_email || undefined,
          amount: (pi.amount || 0) / 100,
          reason: pi.last_payment_error?.message || 'payment_failed',
          provider: 'stripe',
          orderId: pi.metadata?.orderId
        })
        return { received: true, handled: 'failed_logged' }
      }
    } catch (e: any) {
      console.error('[TicketShop] webhook verify failed:', e?.message)
      throw createError({ statusCode: 400, statusMessage: 'Webhook signature invalid' })
    }
  } else {
    const body = raw ? JSON.parse(typeof raw === 'string' ? raw : raw.toString('utf8') || '{}') : await readBody(event)
    type = body?.type || ''
    session = body?.data?.object || body?.session || null
    paymentIntent = type === 'payment_intent.succeeded' ? body?.data?.object : null
  }

  const orderId =
    session?.client_reference_id ||
    session?.metadata?.orderId ||
    paymentIntent?.metadata?.orderId

  if (!orderId) {
    return { received: true, handled: 'ignored_no_order' }
  }

  if (type === 'checkout.session.completed' || type === 'payment_intent.succeeded') {
    const orders = await readOrders()
    const order = orders.find((o) => o.id === orderId)
    if (!order) return { received: true, handled: 'order_missing' }
    if (order.status === 'paid') return { received: true, handled: 'already_paid' }

    order.payment = 'stripe'
    order.paymentRef = session?.id || paymentIntent?.id || order.paymentRef
    const paid = await fulfillPaidOrder(order, order.eventId)

    if (paid.holdIds?.length) {
      const holds = await readHolds()
      for (const h of holds) {
        if (paid.holdIds!.includes(h.id)) {
          h.status = 'converted'
          h.orderId = paid.id
        }
      }
      await writeHolds(holds)
    }

    return { received: true, handled: 'fulfilled', orderId: paid.id }
  }

  return { received: true, handled: 'noop', type }
})

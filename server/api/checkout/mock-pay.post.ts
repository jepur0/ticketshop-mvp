import { readOrders, writeOrders, readHolds, writeHolds, logFailedPayment } from '../../utils/store'
import { fulfillPaidOrder } from '../../utils/tickets'
import { readSettings } from '../../utils/settings'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const settings = await readSettings()

  // Prefer existing pending order, else create from body
  let orderId = body?.orderId as string | undefined
  let orders = await readOrders()
  let order = orderId ? orders.find((o) => o.id === orderId) : undefined

  if (!order) {
    if (!body?.customer?.email || !Array.isArray(body?.items) || !body.items.length) {
      throw createError({ statusCode: 400, statusMessage: 'orderId or customer+items required' })
    }
    const { newId } = await import('../../utils/store')
    order = {
      id: newId('ord'),
      eventId: String(body.eventId || body.items[0]?.eventId || ''),
      eventTitle: String(body.eventTitle || body.items[0]?.eventTitle || 'Event'),
      eventSlug: body.eventSlug,
      createdAt: new Date().toISOString(),
      status: 'pending',
      payment: settings.otpVpos.enabled ? 'OTP VPOS (stub)' : 'mock',
      customer: {
        name: String(body.customer.name || 'Gast'),
        email: String(body.customer.email),
        phone: body.customer.phone || ''
      },
      items: body.items.map((i: any) => ({
        label: String(i.label),
        price: Number(i.price),
        seatId: i.seatId ?? null,
        categoryId: i.categoryId
      })),
      total: body.items.reduce((s: number, i: any) => s + Number(i.price || 0), 0),
      fees: 0,
      holdIds: body.holdId ? [body.holdId] : [],
      seatsHoldToken: body.seatsHoldToken || null
    }
    orders.unshift(order)
    await writeOrders(orders)
    orderId = order.id
  }

  if (body?.fail) {
    order.status = 'failed'
    order.failReason = body.reason || 'mock_decline'
    await writeOrders(orders)
    await logFailedPayment({
      email: order.customer.email,
      amount: order.total,
      reason: order.failReason!,
      provider: order.payment,
      orderId: order.id
    })
    return { ok: false, orderId: order.id, status: 'failed' }
  }

  const eventKey = body?.seatsEventKey || order.eventId
  const paid = await fulfillPaidOrder(order, eventKey)

  // Convert holds
  if (paid.holdIds?.length) {
    const holds = await readHolds()
    for (const h of holds) {
      if (paid.holdIds!.includes(h.id) && h.status === 'active') {
        h.status = 'converted'
        h.orderId = paid.id
      }
    }
    await writeHolds(holds)
  }

  return {
    ok: true,
    orderId: paid.id,
    tickets: paid.items.map((i) => ({ code: i.ticketCode, label: i.label })),
    payment: paid.payment
  }
})

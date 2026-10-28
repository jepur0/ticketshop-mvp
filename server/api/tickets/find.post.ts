import { readOrders, readTickets } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = String(body?.email || '').trim().toLowerCase()
  const eventId = body?.eventId ? String(body.eventId) : ''
  const captchaOk = String(body?.captcha || '').toLowerCase() === 'ticket'
  if (!email) throw createError({ statusCode: 400, statusMessage: 'email required' })
  if (!captchaOk) throw createError({ statusCode: 400, statusMessage: 'Captcha falsch (Tipp: ticket)' })

  const orders = (await readOrders()).filter(
    (o) =>
      o.status === 'paid' &&
      o.customer.email.toLowerCase() === email &&
      (!eventId || o.eventId === eventId)
  )
  const tickets = await readTickets()
  const result = orders.map((o) => ({
    orderId: o.id,
    eventTitle: o.eventTitle,
    createdAt: o.createdAt,
    tickets: tickets
      .filter((t) => t.orderId === o.id)
      .map((t) => ({
        code: t.code,
        label: t.label,
        status: t.status,
        pdfUrl: `/api/tickets/${t.code}/pdf`
      }))
  }))

  console.log('[TicketShop] ticket-find resend stub →', email, result.length, 'orders')
  return { ok: true, orders: result, resent: result.length > 0 }
})

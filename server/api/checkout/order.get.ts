import { readOrders, readTickets } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const orderId = String(q.orderId || '')
  if (!orderId) throw createError({ statusCode: 400, statusMessage: 'orderId required' })
  const orders = await readOrders()
  const order = orders.find((o) => o.id === orderId)
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  const tickets = (await readTickets()).filter((t) => t.orderId === orderId)
  return {
    order: {
      id: order.id,
      status: order.status,
      total: order.total,
      payment: order.payment,
      eventTitle: order.eventTitle,
      customer: { name: order.customer.name, email: order.customer.email },
      items: order.items
    },
    tickets: tickets.map((t) => ({
      code: t.code,
      label: t.label,
      status: t.status,
      pdfUrl: `/api/tickets/${t.code}/pdf`
    }))
  }
})

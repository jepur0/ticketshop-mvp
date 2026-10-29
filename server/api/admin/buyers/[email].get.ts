import { requireUser } from '../../../utils/auth'
import { readOrders, readTickets } from '../../../utils/store'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin', 'client'])
  const email = decodeURIComponent(String(getRouterParam(event, 'email') || '')).trim().toLowerCase()
  if (!email) throw createError({ statusCode: 400, statusMessage: 'E-Mail fehlt' })
  const orders = (await readOrders()).filter((o) => (o.customer?.email || '').trim().toLowerCase() === email)
  const tickets = (await readTickets()).filter((t) => (t.customerEmail || '').trim().toLowerCase() === email)
  if (!orders.length && !tickets.length) throw createError({ statusCode: 404, statusMessage: 'Käufer nicht gefunden' })
  return {
    email,
    name: orders[0]?.customer?.name || tickets[0]?.customerName || email,
    orders,
    tickets
  }
})

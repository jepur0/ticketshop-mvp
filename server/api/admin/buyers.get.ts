import { requireUser } from '../../utils/auth'
import { readOrders } from '../../utils/store'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin', 'client'])
  const q = String(getQuery(event).q || '').trim().toLowerCase()
  const orders = await readOrders()
  const map = new Map<string, { email: string; name: string; orders: number; spent: number; lastOrder: string }>()
  for (const order of orders) {
    const email = (order.customer?.email || '').trim().toLowerCase()
    if (!email) continue
    const row = map.get(email) || {
      email,
      name: order.customer?.name || email,
      orders: 0,
      spent: 0,
      lastOrder: ''
    }
    row.orders += 1
    if (order.status === 'paid') row.spent = Math.round((row.spent + Number(order.total || 0)) * 100) / 100
    if (!row.lastOrder || order.createdAt > row.lastOrder) {
      row.lastOrder = order.createdAt
      if (order.customer?.name) row.name = order.customer.name
    }
    map.set(email, row)
  }
  let list = [...map.values()].sort((a, b) => b.lastOrder.localeCompare(a.lastOrder))
  if (q) list = list.filter((b) => b.name.toLowerCase().includes(q) || b.email.includes(q))
  return list
})

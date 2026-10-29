import { requireUser } from '../../../utils/auth'
import { readOrders } from '../../../utils/store'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin', 'client'])
  const orders = await readOrders()
  const map = new Map<string, { email: string; name: string; orders: number; spent: number; lastOrder: string }>()
  for (const order of orders) {
    const email = (order.customer?.email || '').trim().toLowerCase()
    if (!email) continue
    const row = map.get(email) || { email, name: order.customer?.name || email, orders: 0, spent: 0, lastOrder: '' }
    row.orders += 1
    if (order.status === 'paid') row.spent = Math.round((row.spent + Number(order.total || 0)) * 100) / 100
    if (!row.lastOrder || order.createdAt > row.lastOrder) {
      row.lastOrder = order.createdAt
      if (order.customer?.name) row.name = order.customer.name
    }
    map.set(email, row)
  }
  const lines = ['Name;E-Mail;Bestellungen;Umsatz;Letzte Bestellung']
  for (const row of map.values()) {
    const cell = (v: string) => `"${v.replace(/"/g, '""')}"`
    lines.push([cell(row.name), cell(row.email), String(row.orders), String(row.spent), cell(row.lastOrder)].join(';'))
  }
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', 'attachment; filename="kaeufer.csv"')
  return '\uFEFF' + lines.join('\n')
})

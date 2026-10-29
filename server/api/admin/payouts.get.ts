import { requireUser } from '../../utils/auth'
import { readSettings } from '../../utils/settings'
import { readEvents, readOrders } from '../../utils/store'
import { listCatalog } from '../../utils/catalog'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin', 'client'])
  const settings = await readSettings()
  const orders = (await readOrders()).filter((o) => o.status === 'paid')
  const gross = orders.reduce((s, o) => s + o.total, 0)
  const pct = settings.commerce.commissionPercent
  const commission = Math.round(gross * (pct / 100) * 100) / 100
  const connect = settings.stripe.connect
  return {
    note: connect.enabled
      ? 'Stripe Connect skeleton — splits are mock until live Connect transfers are wired.'
      : 'Stripe Connect not enabled — mock payouts from paid orders. Enable + paste account IDs in Settings.',
    commissionPercent: pct,
    currency: settings.commerce.currency,
    gross,
    commission,
    platformShare: commission,
    organizerShare: Math.round((gross - commission) * 100) / 100,
    net: Math.round((gross - commission) * 100) / 100,
    ordersCount: orders.length,
    connect: {
      enabled: connect.enabled,
      platformAccountId: connect.platformAccountId || null,
      connectedAccountId: connect.connectedAccountId || null,
      configured: !!(connect.platformAccountId && connect.connectedAccountId)
    },
    rows: orders.slice(0, 30).map((o) => {
      const fee = Math.round(o.total * (pct / 100) * 100) / 100
      return {
        orderId: o.id,
        eventTitle: o.eventTitle,
        total: o.total,
        commission: fee,
        organizer: Math.round((o.total - fee) * 100) / 100,
        createdAt: o.createdAt,
        payment: o.payment
      }
    }),
    clients: await clientPayouts(orders, pct),
    history: await listCatalog<any>('payouts')
  }
})

async function clientPayouts(orders: any[], fallbackPct: number) {
  const events = await readEvents()
  const byId = new Map(events.map((e: any) => [e.id, e]))
  const clients = await listCatalog<any>('clients')
  const history = await listCatalog<any>('payouts')
  return clients.map((client) => {
    const sales = orders
      .filter((o) => {
        const ev = byId.get(o.eventId)
        if (ev?.clientId && ev.clientId === client.id) return true
        return String(ev?.organizer || '').trim().toLowerCase() === String(client.name || '').trim().toLowerCase()
      })
      .reduce((s, o) => s + Number(o.total || 0), 0)
    const feePct = Number(client.feePercent ?? fallbackPct) || 0
    const fee = Math.round(sales * (feePct / 100) * 100) / 100
    const owed = Math.round((sales - fee) * 100) / 100
    const paid = history
      .filter((p) => p.clientId === client.id)
      .reduce((s, p) => s + Number(p.amount || 0), 0)
    return {
      id: client.id,
      name: client.name,
      feePercent: feePct,
      sales: Math.round(sales * 100) / 100,
      fee,
      owed,
      paid: Math.round(paid * 100) / 100,
      open: Math.round((owed - paid) * 100) / 100
    }
  })
}

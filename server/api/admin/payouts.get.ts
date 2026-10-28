import { requireUser } from '../../utils/auth'
import { readSettings } from '../../utils/settings'
import { readOrders } from '../../utils/store'

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
    })
  }
})

import { requireUser } from '../../utils/auth'
import { listCatalog } from '../../utils/catalog'
import { readOrders } from '../../utils/store'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin'])
  const affiliates = await listCatalog<any>('affiliates')
  const orders = (await readOrders()).filter((o) => o.status === 'paid' && (o as any).affiliateRef)
  return affiliates.map((aff) => {
    const code = String(aff.code || '').trim().toLowerCase()
    const matched = orders.filter((o) => String((o as any).affiliateRef || '').trim().toLowerCase() === code)
    const sales = Math.round(matched.reduce((s, o) => s + Number(o.total || 0), 0) * 100) / 100
    const pct = Number(aff.commissionPercent) || 0
    return {
      id: aff.id,
      name: aff.name,
      code: aff.code,
      commissionPercent: pct,
      orders: matched.length,
      sales,
      commission: Math.round(sales * (pct / 100) * 100) / 100
    }
  })
})
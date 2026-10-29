import { requireUser } from '../../utils/auth'
import { upsertCatalog, listCatalog } from '../../utils/catalog'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin'])
  const body = await readBody(event)
  const clientId = String(body?.clientId || '')
  const amount = Number(body?.amount)
  if (!clientId || !Number.isFinite(amount) || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Veranstalter und Betrag erforderlich' })
  }
  const client = (await listCatalog<any>('clients')).find((c) => c.id === clientId)
  if (!client) throw createError({ statusCode: 404, statusMessage: 'Veranstalter nicht gefunden' })
  const saved = await upsertCatalog(
    'payouts',
    {
      clientId,
      clientName: client.name,
      amount: Math.round(amount * 100) / 100,
      paidAt: String(body?.paidAt || new Date().toISOString().slice(0, 10)),
      note: String(body?.note || '').slice(0, 500)
    },
    'pay'
  )
  return { ok: true, item: saved }
})

import { requireUser } from '../../../utils/auth'
import { upsertCatalog } from '../../../utils/catalog'

const META: Record<string, { roles: Array<'admin' | 'client'>; prefix: string }> = {
  places: { roles: ['admin', 'client'], prefix: 'plc' },
  clients: { roles: ['admin'], prefix: 'cli' },
  promos: { roles: ['admin'], prefix: 'prm' },
  sponsors: { roles: ['admin'], prefix: 'spo' },
  affiliates: { roles: ['admin'], prefix: 'aff' }
}

export default defineEventHandler(async (event) => {
  const name = String(getRouterParam(event, 'table') || '')
  const meta = META[name]
  if (!meta) throw createError({ statusCode: 404, statusMessage: 'Unbekannt' })
  await requireUser(event, meta.roles)
  const body = await readBody(event)
  if (!body || typeof body !== 'object') throw createError({ statusCode: 400, statusMessage: 'Daten fehlen' })
  if (name === 'places' && !String(body.name || '').trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Name fehlt' })
  }
  if (name === 'clients' && !String(body.name || '').trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Name fehlt' })
  }
  if (name === 'promos' && !String(body.code || '').trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Code fehlt' })
  }
  if (name === 'sponsors' && !String(body.name || '').trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Name fehlt' })
  }
  if (name === 'affiliates' && !String(body.code || '').trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Code fehlt' })
  }
  const saved = await upsertCatalog(name, body, meta.prefix)
  return { ok: true, item: saved }
})

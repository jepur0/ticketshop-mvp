import { requireUser } from '../../../../utils/auth'
import { deleteCatalog } from '../../../../utils/catalog'

const ROLES: Record<string, Array<'admin' | 'client'>> = {
  places: ['admin', 'client'],
  clients: ['admin'],
  promos: ['admin'],
  sponsors: ['admin'],
  affiliates: ['admin']
}

export default defineEventHandler(async (event) => {
  const name = String(getRouterParam(event, 'table') || '')
  const id = String(getRouterParam(event, 'id') || '')
  const roles = ROLES[name]
  if (!roles || !id) throw createError({ statusCode: 404, statusMessage: 'Unbekannt' })
  await requireUser(event, roles)
  await deleteCatalog(name, id)
  return { ok: true }
})

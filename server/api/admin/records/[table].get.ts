import { requireUser } from '../../../utils/auth'
import { listCatalog } from '../../../utils/catalog'

const ROLES: Record<string, Array<'admin' | 'client'>> = {
  places: ['admin', 'client'],
  clients: ['admin'],
  promos: ['admin'],
  sponsors: ['admin'],
  affiliates: ['admin']
}

export default defineEventHandler(async (event) => {
  const name = String(getRouterParam(event, 'table') || '')
  const roles = ROLES[name]
  if (!roles) throw createError({ statusCode: 404, statusMessage: 'Unbekannt' })
  await requireUser(event, roles)
  return await listCatalog(name)
})

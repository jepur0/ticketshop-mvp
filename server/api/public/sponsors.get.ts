import { listCatalog } from '../../utils/catalog'

export default defineEventHandler(async (event) => {
  const eventId = String(getQuery(event).eventId || '')
  const all = await listCatalog<any>('sponsors')
  return all.filter((s) => !s.eventId || s.eventId === eventId)
})

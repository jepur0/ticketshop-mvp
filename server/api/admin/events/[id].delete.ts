import { requireUser } from '../../../utils/auth'
import { deleteEvent, readEventById } from '../../../utils/store'
import { deletePoster } from '../../../utils/posters'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin', 'client'])
  const id = String(getRouterParam(event, 'id') || '')
  const existing = await readEventById(id)
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Event nicht gefunden' })
  await deletePoster(id)
  await deleteEvent(id)
  return { ok: true }
})

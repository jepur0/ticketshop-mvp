import { requireUser } from '../../utils/auth'
import { upsertEvent } from '../../utils/store'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin', 'client'])
  const body = await readBody(event)
  if (!body?.id || !body?.slug) {
    throw createError({ statusCode: 400, statusMessage: 'id and slug required' })
  }
  await upsertEvent(body)
  return { ok: true }
})

import { requireUser } from '../../utils/auth'
import { prepareEventWrite } from '../../utils/event-save'
import { upsertEvent } from '../../utils/store'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin', 'client'])
  const body = await readBody(event)
  const { event: saved, warning } = await prepareEventWrite(body)
  await upsertEvent(saved)
  return { ok: true, event: saved, warning }
})

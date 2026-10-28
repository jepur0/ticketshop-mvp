import { requireUser } from '../../utils/auth'
import { readSettings, toAdminFormView } from '../../utils/settings'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin'])
  const s = await readSettings()
  return toAdminFormView(s)
})

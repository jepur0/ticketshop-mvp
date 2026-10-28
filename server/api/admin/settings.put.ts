import { requireUser } from '../../utils/auth'
import { readSettings, writeSettings, applySettingsUpdate, toAdminFormView } from '../../utils/settings'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin'])
  const body = await readBody(event)
  const current = await readSettings()
  const next = applySettingsUpdate(current, body || {})
  await writeSettings(next)
  return { ok: true, settings: toAdminFormView(next) }
})

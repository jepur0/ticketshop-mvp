import { readSettings, toPublicIntegrations } from '../../utils/settings'

export default defineEventHandler(async () => {
  const s = await readSettings()
  return toPublicIntegrations(s)
})

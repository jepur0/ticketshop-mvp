import { readSettings, toPublicCompany } from '../../utils/settings'

export default defineEventHandler(async () => {
  const s = await readSettings()
  return toPublicCompany(s)
})

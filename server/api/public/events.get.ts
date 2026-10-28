import { readEvents } from '../../utils/store'

/** Public catalogue — active events only, soonest first. */
export default defineEventHandler(async () => {
  const all = await readEvents()
  return all
    .filter((e: any) => e?.active !== false)
    .sort((a: any, b: any) => String(a.date || '').localeCompare(String(b.date || '')))
})

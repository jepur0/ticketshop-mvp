import { readEvents } from '../../utils/store'

export default defineEventHandler(async () => {
  return await readEvents()
})

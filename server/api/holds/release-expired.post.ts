import { releaseExpiredHolds, readHolds, writeHolds } from '../../utils/store'
import { releaseSeatsHold } from '../../utils/seatsio'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({} as any))
  const n = await releaseExpiredHolds()
  let forced = 0
  if (body?.forceAll) {
    const holds = await readHolds()
    for (const h of holds) {
      if (h.status === 'active') {
        h.status = 'released'
        forced++
        if (h.seatsHoldToken) {
          await releaseSeatsHold({ eventKey: h.eventId, holdToken: h.seatsHoldToken })
        }
      }
    }
    await writeHolds(holds)
  }
  return { expired: n, forced }
})

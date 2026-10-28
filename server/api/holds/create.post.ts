import { readSettings } from '../../utils/settings'
import { readHolds, writeHolds, newId, releaseExpiredHolds, type HoldRecord } from '../../utils/store'

export default defineEventHandler(async (event) => {
  await releaseExpiredHolds()
  const body = await readBody(event)
  const settings = await readSettings()
  const minutes = settings.commerce.holdMinutes || 20
  const seatIds: string[] = Array.isArray(body?.seatIds) ? body.seatIds.filter(Boolean) : []
  if (!body?.eventId) {
    throw createError({ statusCode: 400, statusMessage: 'eventId required' })
  }
  const now = Date.now()
  const hold: HoldRecord = {
    id: newId('hold'),
    eventId: String(body.eventId),
    seatIds,
    seatsHoldToken: body.seatsHoldToken || null,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + minutes * 60 * 1000).toISOString(),
    status: 'active',
    orderId: null,
    customerEmail: body.email || null
  }
  const holds = await readHolds()
  holds.unshift(hold)
  await writeHolds(holds)
  return { hold, holdMinutes: minutes }
})

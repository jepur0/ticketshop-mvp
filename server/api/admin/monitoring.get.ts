import { requireUser } from '../../utils/auth'
import { readMonitoring, readHolds, releaseExpiredHolds } from '../../utils/store'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin'])
  await releaseExpiredHolds()
  const m = await readMonitoring()
  const holds = await readHolds()
  return {
    failedPayments: m.failedPayments.slice(0, 50),
    seatsSyncErrors: m.seatsSyncErrors.slice(0, 50),
    holds: {
      active: holds.filter((h) => h.status === 'active').length,
      expired: holds.filter((h) => h.status === 'expired').length,
      recent: holds.slice(0, 20)
    }
  }
})

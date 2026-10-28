import { requireUser } from '../../utils/auth'
import { readOrders } from '../../utils/store'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin', 'client'])
  const orders = await readOrders()
  return { orders }
})

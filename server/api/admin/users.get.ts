import { requireUser, listUsers } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin'])
  return { users: await listUsers() }
})

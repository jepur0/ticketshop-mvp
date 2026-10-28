import { clearSessionCookie, destroySession, getSessionToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const token = getSessionToken(event)
  await destroySession(token)
  clearSessionCookie(event)
  return { ok: true }
})

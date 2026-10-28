import { loginWithPassword, setSessionCookie, allowDemoLogin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = (body?.email || '').trim()
  const password = body?.password || ''
  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'E-Mail und Passwort erforderlich' })
  }

  const result = await loginWithPassword(email, password)
  if (!result) {
    throw createError({
      statusCode: 401,
      statusMessage: allowDemoLogin()
        ? 'Login fehlgeschlagen'
        : 'Ungültige Zugangsdaten (Demo-Login nur mit ALLOW_DEMO_LOGIN=true)'
    })
  }

  setSessionCookie(event, result.token)
  return {
    user: result.user,
    demo: !!result.demo,
    allowDemoLogin: allowDemoLogin()
  }
})

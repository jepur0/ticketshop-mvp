import { getSessionUser, allowDemoLogin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event)
  return {
    user,
    allowDemoLogin: allowDemoLogin(),
    nodeEnv: process.env.NODE_ENV || 'development'
  }
})

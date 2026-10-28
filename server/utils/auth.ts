import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie, createError } from 'h3'
import { ensureDb, dbApi, dbNewId } from './db'

export type Role = 'admin' | 'scanner' | 'client'

export type AuthUser = {
  id: string
  email: string
  role: Role
  name: string | null
}

const SESSION_COOKIE = 'ts_session'
const SESSION_DAYS = 14

function allowDemoLogin() {
  return process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEMO_LOGIN === 'true'
}

export async function findUserByEmail(email: string) {
  await ensureDb()
  return dbApi.get<{
    id: string
    email: string
    password_hash: string
    role: string
    name: string | null
  }>('SELECT id, email, password_hash, role, name FROM users WHERE email = ?', [
    email.trim().toLowerCase()
  ])
}

export async function createSession(userId: string): Promise<string> {
  await ensureDb()
  const token = randomBytes(32).toString('hex')
  const now = new Date()
  const expires = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  dbApi.run('INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)', [
    token,
    userId,
    expires.toISOString(),
    now.toISOString()
  ])
  dbApi.persistNow()
  return token
}

export async function destroySession(token: string | undefined | null) {
  if (!token) return
  await ensureDb()
  dbApi.run('DELETE FROM sessions WHERE token = ?', [token])
  dbApi.persistNow()
}

export async function userFromToken(token: string | undefined | null): Promise<AuthUser | null> {
  if (!token) return null
  await ensureDb()
  const row = dbApi.get<{
    user_id: string
    expires_at: string
    email: string
    role: string
    name: string | null
  }>(
    `SELECT s.user_id, s.expires_at, u.email, u.role, u.name
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ?`,
    [token]
  )
  if (!row) return null
  if (new Date(row.expires_at).getTime() < Date.now()) {
    dbApi.run('DELETE FROM sessions WHERE token = ?', [token])
    dbApi.persistNow()
    return null
  }
  return {
    id: row.user_id,
    email: row.email,
    role: row.role as Role,
    name: row.name
  }
}

export function setSessionCookie(event: H3Event, token: string) {
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    secure: process.env.NODE_ENV === 'production'
  })
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

export function getSessionToken(event: H3Event) {
  return getCookie(event, SESSION_COOKIE)
}

export async function getSessionUser(event: H3Event): Promise<AuthUser | null> {
  return userFromToken(getSessionToken(event))
}

export async function requireUser(event: H3Event, roles?: Role[]): Promise<AuthUser> {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Nicht angemeldet' })
  }
  if (roles && !roles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Keine Berechtigung' })
  }
  return user
}

export async function loginWithPassword(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string; demo?: boolean } | null> {
  const key = (email || '').trim().toLowerCase()
  const row = await findUserByEmail(key)

  if (row && bcrypt.compareSync(password, row.password_hash)) {
    const token = await createSession(row.id)
    return {
      user: { id: row.id, email: row.email, role: row.role as Role, name: row.name },
      token
    }
  }

  // Open any-password demo ONLY when explicitly enabled in development
  if (allowDemoLogin() && key) {
    await ensureDb()
    let user = row
    if (!user) {
      const id = dbNewId('user')
      const hash = bcrypt.hashSync(password || 'demo', 10)
      dbApi.run(
        'INSERT INTO users (id, email, password_hash, role, name, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, key, hash, 'admin', 'Demo Admin', new Date().toISOString()]
      )
      dbApi.persistNow()
      user = {
        id,
        email: key,
        password_hash: hash,
        role: 'admin',
        name: 'Demo Admin'
      }
    }
    const token = await createSession(user.id)
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role as Role,
        name: user.name
      },
      token,
      demo: true
    }
  }

  return null
}

export async function listUsers() {
  await ensureDb()
  return dbApi.all<{ id: string; email: string; role: string; name: string | null; created_at: string }>(
    'SELECT id, email, role, name, created_at FROM users ORDER BY email'
  )
}

export async function updateUserPassword(email: string, newPassword: string) {
  await ensureDb()
  const hash = bcrypt.hashSync(newPassword, 10)
  dbApi.run('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email.trim().toLowerCase()])
  dbApi.persistNow()
}

export { SESSION_COOKIE, allowDemoLogin }

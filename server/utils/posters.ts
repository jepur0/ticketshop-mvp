import { createError } from 'h3'
import { ensureDb, dbApi } from './db'

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_BYTES = 1_500_000

function asBytes(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) return new Uint8Array(value)
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  if (Array.isArray(value)) return Uint8Array.from(value as number[])
  if (value && typeof value === 'object') {
    const vals = Object.values(value as Record<string, number>)
    if (vals.length && vals.every((n) => typeof n === 'number')) return Uint8Array.from(vals)
  }
  return new Uint8Array()
}

function magicOk(mime: string, buf: Buffer) {
  if (buf.length < 12) return false
  if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
  if (mime === 'image/png') {
    return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  }
  if (mime === 'image/gif') return buf.subarray(0, 3).toString('ascii') === 'GIF'
  if (mime === 'image/webp') {
    return buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP'
  }
  return false
}

export function isSafeEventId(eventId: string) {
  return /^[a-zA-Z0-9_-]+$/.test(eventId)
}

export async function savePoster(eventId: string, mime: string, base64: string) {
  if (!isSafeEventId(eventId)) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Event-ID' })
  }
  const cleanMime = String(mime || '').toLowerCase().split(';')[0].trim()
  if (!ALLOWED.has(cleanMime)) {
    throw createError({ statusCode: 400, statusMessage: 'Nur JPEG, PNG, WebP oder GIF' })
  }
  const raw = base64.includes(',') ? base64.slice(base64.indexOf(',') + 1) : base64
  const buf = Buffer.from(raw, 'base64')
  if (!buf.length || buf.length > MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Bild ist leer oder größer als 1,5 MB' })
  }
  if (!magicOk(cleanMime, buf)) {
    throw createError({ statusCode: 400, statusMessage: 'Bilddatei ist beschädigt' })
  }
  await ensureDb()
  const updated = new Date().toISOString()
  dbApi.run(
    'INSERT OR REPLACE INTO event_posters (event_id, mime, bytes, updated_at) VALUES (?, ?, ?, ?)',
    [eventId, cleanMime, new Uint8Array(buf), updated]
  )
  dbApi.persistNow()
  return {
    url: `/api/public/posters/${eventId}?v=${encodeURIComponent(updated)}`,
    mime: cleanMime
  }
}

export async function readPoster(eventId: string) {
  if (!isSafeEventId(eventId)) return null
  await ensureDb()
  const row = dbApi.get<{ mime: string; bytes: unknown; updated_at: string }>(
    'SELECT mime, bytes, updated_at FROM event_posters WHERE event_id = ?',
    [eventId]
  )
  if (!row) return null
  const bytes = asBytes(row.bytes)
  if (!bytes.length) return null
  return { mime: row.mime || 'image/jpeg', bytes, updatedAt: row.updated_at }
}

export async function deletePoster(eventId: string) {
  if (!isSafeEventId(eventId)) return
  await ensureDb()
  dbApi.run('DELETE FROM event_posters WHERE event_id = ?', [eventId])
  dbApi.persistNow()
}

import { readSettings } from './settings'
import { logSeatsSyncError } from './store'

const SEATS_REGIONS = ['eu', 'na', 'sa', 'oc'] as const
export type SeatsRegion = (typeof SEATS_REGIONS)[number]

function baseUrl(region: string) {
  // Optional test override. Leave unset in production so the workspace region is used.
  const origin = process.env.SEATSIO_API_ORIGIN?.trim()
  if (origin) return `${origin.replace(/\/$/, '')}/${region}`
  return `https://api-${region}.seatsio.net`
}

/** Demo / empty keys must not be sent to the seats.io API. */
export function isPlaceholderSeatsKey(key?: string | null) {
  if (!key) return true
  const k = key.trim().toLowerCase()
  if (!k) return true
  if (k.startsWith('demo')) return true
  if (k.includes('placeholder') || k.includes('changeme') || k.includes('your-')) return true
  return false
}

function secretLooksUsable(secret: string) {
  const sk = secret.trim()
  if (sk.length < 12) return false
  const lower = sk.toLowerCase()
  if (lower.startsWith('demo') || lower.includes('changeme') || lower.includes('placeholder') || lower.includes('your-')) {
    return false
  }
  if (sk.includes('SECRET')) return false
  return true
}

export type SeatsEventLookup =
  | { ok: true; chartKey: string; region: SeatsRegion }
  | { ok: false; reason: string; quiet?: boolean }

/**
 * Read the chart key for an event. seats.io shows the owner one key per event
 * (the event key); the chart key is on the event resource.
 * Tries the configured region first, then the other seats.io regions.
 */
export async function lookupSeatsEvent(eventKey: string): Promise<SeatsEventLookup> {
  const key = eventKey.trim()
  if (!key || isPlaceholderSeatsKey(key)) {
    return { ok: false, reason: 'Kein echter Event Key.' }
  }
  const settings = await readSettings()
  if (!secretLooksUsable(settings.seatsio.secretKey)) {
    return {
      ok: false,
      quiet: true,
      reason:
        'Secret Key fehlt in den Einstellungen. Der Sitzplan braucht nur den Event Key und den Workspace Public Key.'
    }
  }
  const auth = Buffer.from(`${settings.seatsio.secretKey}:`).toString('base64')
  const preferred = (settings.seatsio.region || 'eu') as SeatsRegion
  const regions = [preferred, ...SEATS_REGIONS.filter((r) => r !== preferred)]
  let sawAuthError = false
  let sawMissing = false
  for (const region of regions) {
    try {
      const res = await fetch(`${baseUrl(region)}/events/${encodeURIComponent(key)}`, {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/json'
        },
        signal: AbortSignal.timeout(6000)
      })
      if (res.status === 401 || res.status === 403) {
        sawAuthError = true
        continue
      }
      if (res.status === 404) {
        sawMissing = true
        continue
      }
      if (!res.ok) continue
      const data = await res.json().catch(() => null)
      const chartKey = String(data?.chartKey || data?.chart?.key || '').trim()
      if (!chartKey) {
        return {
          ok: false,
          reason: 'seats.io hat keinen Chart Key geliefert. Der Sitzplan nutzt den Event Key.'
        }
      }
      return { ok: true, chartKey, region }
    } catch {
      continue
    }
  }
  if (sawAuthError && !sawMissing) {
    return { ok: false, reason: 'seats.io hat den Secret Key abgelehnt. Der Sitzplan nutzt den Event Key.' }
  }
  return {
    ok: false,
    reason:
      'Event Key wurde bei seats.io nicht gefunden. Der Sitzplan nutzt den Event Key, sobald er zum Workspace Public Key passt.'
  }
}

export async function bookSeats(opts: {
  eventKey: string
  seatIds: string[]
  holdToken?: string | null
  orderId: string
}): Promise<{ ok: boolean; mock?: boolean; error?: string }> {
  const settings = await readSettings()
  if (!settings.seatsio.secretKey) {
    return { ok: true, mock: true }
  }
  // Skip network for obvious placeholders
  const sk = settings.seatsio.secretKey
  if (sk.includes('demo') || sk.includes('test') || sk.includes('SECRET') || sk.length < 12) {
    return { ok: true, mock: true }
  }
  if (!opts.seatIds.length) return { ok: true, mock: true }

  try {
    const auth = Buffer.from(`${settings.seatsio.secretKey}:`).toString('base64')
    const body: Record<string, unknown> = {
      objects: opts.seatIds,
      orderId: opts.orderId
    }
    if (opts.holdToken) body.holdToken = opts.holdToken

    const res = await fetch(
      `${baseUrl(settings.seatsio.region)}/events/${encodeURIComponent(opts.eventKey)}/actions/book`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    )
    if (!res.ok) {
      const text = await res.text()
      await logSeatsSyncError({
        eventId: opts.eventKey,
        action: 'book',
        message: `${res.status}: ${text.slice(0, 300)}`
      })
      return { ok: false, error: text.slice(0, 200) }
    }
    return { ok: true }
  } catch (e: any) {
    await logSeatsSyncError({
      eventId: opts.eventKey,
      action: 'book',
      message: e?.message || String(e)
    })
    return { ok: false, error: e?.message || String(e) }
  }
}

export async function releaseSeatsHold(opts: {
  eventKey: string
  holdToken: string
}): Promise<{ ok: boolean; mock?: boolean }> {
  const settings = await readSettings()
  if (!settings.seatsio.secretKey) return { ok: true, mock: true }
  try {
    const auth = Buffer.from(`${settings.seatsio.secretKey}:`).toString('base64')
    await fetch(
      `${baseUrl(settings.seatsio.region)}/events/${encodeURIComponent(opts.eventKey)}/actions/release`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ holdToken: opts.holdToken })
      }
    )
    return { ok: true }
  } catch (e: any) {
    await logSeatsSyncError({
      eventId: opts.eventKey,
      action: 'release',
      message: e?.message || String(e)
    })
    return { ok: false }
  }
}

import { readSettings } from './settings'
import { logSeatsSyncError } from './store'

function baseUrl(region: string) {
  return `https://api-${region}.seatsio.net`
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

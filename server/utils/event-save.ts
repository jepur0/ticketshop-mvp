import { createError } from 'h3'
import { readSettings, writeSettings } from './settings'
import { readEventById } from './store'
import { dbApi, ensureDb } from './db'
import { isPlaceholderSeatsKey, lookupSeatsEvent } from './seatsio'
import { deletePoster, savePoster } from './posters'

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

function isAllowedPoster(value: string) {
  if (!value) return true
  if (value.startsWith('/images/')) return true
  if (value.startsWith('/api/public/posters/')) return true
  return /^https?:\/\/\S+$/i.test(value) && value.length <= 2000
}

export async function prepareEventWrite(body: any): Promise<{ event: any; warning?: string }> {
  if (!body || typeof body !== 'object' || !body.id) {
    throw createError({ statusCode: 400, statusMessage: 'id required' })
  }
  const id = String(body.id).trim()
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Event-ID' })
  }
  const title = String(body.title || '').trim()
  if (!title) throw createError({ statusCode: 400, statusMessage: 'Titel fehlt' })

  await ensureDb()
  const existing = await readEventById(id)
  const posterUpload = body.posterUpload
  const event: any = { ...(existing || {}), ...body }
  delete event.posterUpload

  let warning: string | undefined

  if (posterUpload?.base64) {
    const saved = await savePoster(id, String(posterUpload.mime || 'image/jpeg'), String(posterUpload.base64))
    event.posterImage = saved.url
    event.posterLocked = true
  } else if (String(event.posterImage || '').startsWith('data:')) {
    throw createError({ statusCode: 400, statusMessage: 'Bild bitte als Datei hochladen' })
  } else {
    event.posterLocked = body.posterLocked === true
  }

  event.posterImage = String(event.posterImage || '')
  if ((event.posterLocked || posterUpload?.base64) && !isAllowedPoster(event.posterImage)) {
    throw createError({ statusCode: 400, statusMessage: 'Bild-URL ist ungültig' })
  }
  if (!event.posterImage.startsWith('/api/public/posters/')) {
    const previous = String(existing?.posterImage || '')
    if (event.posterLocked || previous.startsWith('/api/public/posters/')) {
      await deletePoster(id)
    }
  }

  const chartMode = body.type === 'combined' || body.ticketMode === 'chart'
  event.type = chartMode ? 'combined' : 'simple'
  const prevSeats = existing?.seats || {}
  const incomingSeats = body.seats || {}
  const eventKey = chartMode ? String(incomingSeats.eventKey || '').trim() : ''
  const sameMode = !!existing && (existing.type === 'combined') === chartMode
  const sameKey = String(prevSeats.eventKey || '') === eventKey

  event.seats = {
    workspaceKey: String(prevSeats.workspaceKey || ''),
    eventKey,
    chartKey: '',
    hasNumericSeats: false,
    hasNonNumeric: true
  }

  if (sameMode) {
    event.seats.hasNumericSeats = !!prevSeats.hasNumericSeats
    event.seats.hasNonNumeric = !!prevSeats.hasNonNumeric
    if (chartMode && !event.seats.hasNumericSeats && !event.seats.hasNonNumeric) {
      event.seats.hasNumericSeats = true
    }
  } else if (chartMode) {
    event.seats.hasNumericSeats = true
    event.seats.hasNonNumeric = false
  }

  if (!chartMode) {
    event.seats.eventKey = ''
    event.seats.chartKey = ''
  } else if (eventKey && !isPlaceholderSeatsKey(eventKey) && !(sameKey && prevSeats.chartKey)) {
    const found = await lookupSeatsEvent(eventKey)
    if (found.ok) {
      event.seats.chartKey = found.chartKey
      const settings = await readSettings()
      if (settings.seatsio.region !== found.region) {
        settings.seatsio.region = found.region
        settings.updatedAt = new Date().toISOString()
        await writeSettings(settings)
      }
    } else {
      event.seats.chartKey = ''
      if (!found.quiet) warning = found.reason
    }
  } else {
    event.seats.chartKey = String((sameKey && prevSeats.chartKey) || incomingSeats.chartKey || '')
  }

  if (!Array.isArray(body.priceCategories) || !body.priceCategories.length) {
    throw createError({ statusCode: 400, statusMessage: 'Mindestens eine Preiskategorie' })
  }
  event.priceCategories = body.priceCategories.map((cat: any, index: number) => {
    const name = String(cat?.name || '').trim()
    if (!name) throw createError({ statusCode: 400, statusMessage: 'Jede Preiskategorie braucht einen Namen' })
    const price = Number(cat?.price)
    return {
      id: String(cat?.id || `cat-${index + 1}`),
      name,
      price: Number.isFinite(price) ? price : 0
    }
  })

  event.id = id
  event.title = title
  event.slug = String(body.slug || existing?.slug || slugify(title) || id).trim()
  event.city = String(body.city ?? existing?.city ?? '').trim()
  event.venue = String(body.venue ?? existing?.venue ?? '').trim()
  event.description = String(body.description ?? existing?.description ?? '')
  event.organizer = String(body.organizer ?? existing?.organizer ?? '')
  event.active = body.active !== false
  event.promo = !!body.promo
  event.date = body.date || existing?.date || new Date().toISOString()
  event.endDate = existing?.endDate || event.date

  const clash = dbApi.get<{ id: string }>('SELECT id FROM events WHERE slug = ? AND id <> ?', [event.slug, id])
  if (clash) event.slug = `${event.slug}-${id.slice(-6)}`

  return { event, warning }
}

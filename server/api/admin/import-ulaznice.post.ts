import { requireUser } from '../../utils/auth'
import { upsertEvent } from '../../utils/store'

/**
 * POST /api/admin/import-ulaznice
 * Body: { upcomingOnly?: boolean, deactivateDemos?: boolean }
 * Pulls live events from ulaznice.de and upserts into SQLite.
 * Does not reuse their seats.io keys.
 */
export default defineEventHandler(async (event) => {
  await requireUser(event, ['admin'])
  const body = (await readBody(event).catch(() => ({}))) || {}
  const upcomingOnly = body.upcomingOnly !== false
  const deactivateDemos = body.deactivateDemos === true
  const today = new Date().toISOString().slice(0, 10)

  async function postJson(url: string, payload: Record<string, unknown> = {}) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'TicketShop-Import/1.0'
      },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw createError({ statusCode: 502, statusMessage: `ulaznice ${url} → ${res.status}` })
    return res.json()
  }

  const first = await postJson('https://ulaznice.de/api/v1/front/event/get-list', { page: 1 })
  const pages = first.totalPages || 1
  let list: any[] = [...(first.filteredEvents || [])]
  for (let page = 2; page <= pages; page++) {
    const d = await postJson('https://ulaznice.de/api/v1/front/event/get-list', { page })
    list.push(...(d.filteredEvents || []))
  }
  const seen = new Set<string>()
  list = list.filter((e) => {
    if (seen.has(e._id)) return false
    seen.add(e._id)
    return true
  })
  if (upcomingOnly) list = list.filter((e) => (e.date || '').slice(0, 10) >= today)

  const CITY: Record<string, string> = {
    Fellbach: 'Stuttgart',
    Freiburg: 'Freiburg',
    München: 'München',
    Offenbach: 'Offenbach',
    Dortmund: 'Dortmund',
    Nürnberg: 'Nürnberg',
    Karlsruhe: 'Karlsruhe',
    Duisburg: 'Duisburg',
    Frankfurt: 'Frankfurt',
    Stuttgart: 'Stuttgart'
  }
  const COLORS = ['#1e3a5f', '#7c2d12', '#4c1d95', '#365314', '#0e7490', '#9a3412', '#1e40af', '#831843']

  const imported: string[] = []
  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    let detail: any = null
    try {
      const d = await postJson(`https://ulaznice.de/api/v1/front/event/${item.slug}`, {})
      detail = d.event
    } catch {
      /* list-only fallback */
    }
    const ev = detail || {}
    const place = (ev.placeId || item.placeId || [])[0] || {}
    const blob = `${place.title || ''} ${item.title || ''} ${(item.tags || []).join(' ')}`
    let city = 'Deutschland'
    for (const [k, v] of Object.entries(CITY)) {
      if (blob.toLowerCase().includes(k.toLowerCase())) {
        city = v
        break
      }
    }
    const pricing = (ev.pricing || []).filter((p: any) => p.enabled !== false)
    const cats = pricing.map((p: any, j: number) => ({
      id: `cat-${p.key ?? j}`,
      name: p.label || `Kategorie ${j + 1}`,
      price: Number(p.price) || 0
    }))
    let thumb = (ev.media || item.media || [])[0]?.files?.thumb480 || ''
    if (thumb.startsWith('/')) thumb = `https://ulaznice.de${thumb}`
    const desc = String(ev.additionalContentHTML || ev.contentHTML || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1200)
    const date = String(ev.date || item.date || '').replace('.000Z', '+00:00')
    const shop = {
      id: `ulaz-${String(item._id).slice(0, 12)}`,
      slug: item.slug,
      title: String(ev.title || item.title || '').trim(),
      subtitle: ev.genre || item.genre || 'Event',
      city,
      venue: place.title || '',
      venueMapsUrl: String(place.locationLink || '').trim() || `https://maps.google.com/?q=${encodeURIComponent(city)}`,
      date,
      endDate: date,
      type: 'simple' as const,
      active: true,
      promo: i < 3,
      organizer: ev.clientId?.title || 'Boommedia / ulaznice.de',
      posterColor: COLORS[i % COLORS.length],
      bannerEmoji: '🎫',
      description: desc || item.title,
      posterImage: thumb,
      tags: item.tags || [],
      priceCategories: cats.length ? cats : [{ id: 'cat-std', name: 'Ticket', price: 25 }],
      seats: {
        workspaceKey: '',
        eventKey: '',
        chartKey: '',
        hasNumericSeats: false,
        hasNonNumeric: true
      },
      sold: 0,
      capacity: Number(item.availableCount) || 500,
      source: 'ulaznice.de',
      sourceUrl: `https://ulaznice.de/event/${item.slug}`
    }
    await upsertEvent(shop)
    imported.push(shop.slug)
  }

  let deactivated = 0
  if (deactivateDemos) {
    const { readEvents } = await import('../../utils/store')
    const all = await readEvents()
    for (const e of all) {
      if (String(e.id || '').startsWith('evt-') && e.organizer === 'WAW Media Demo' && e.active) {
        await upsertEvent({ ...e, active: false })
        deactivated++
      }
    }
  }

  return { ok: true, imported: imported.length, slugs: imported, deactivated }
})

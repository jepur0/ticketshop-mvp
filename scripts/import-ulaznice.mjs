#!/usr/bin/env node
/**
 * Pull upcoming events from ulaznice.de into TicketShop.
 *
 * Modes:
 *   1) Write seed JSON:  node scripts/import-ulaznice.mjs
 *      → data/events-ulaznice.json (+ optional merge into data/events.json with --seed)
 *   2) Push to running shop:  IMPORT_BASE=https://ticketshop-mvp.onrender.com \
 *        IMPORT_EMAIL=admin@ticketshop.local IMPORT_PASSWORD=admin \
 *        node scripts/import-ulaznice.mjs --push
 *
 * Does NOT copy ulaznice seats.io keys (their workspace). Events are type=simple
 * with real price categories; attach your own seats.io Event Key later in admin.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const PUSH = process.argv.includes('--push')
const SEED = process.argv.includes('--seed')
const ONLY_UPCOMING = !process.argv.includes('--all')
const TODAY = new Date().toISOString().slice(0, 10)

const CITY_HINTS = {
  Fellbach: 'Stuttgart',
  Freiburg: 'Freiburg',
  München: 'München',
  Munchen: 'München',
  Offenbach: 'Offenbach',
  Dortmund: 'Dortmund',
  Nürnberg: 'Nürnberg',
  Nurnberg: 'Nürnberg',
  Karlsruhe: 'Karlsruhe',
  Duisburg: 'Duisburg',
  Frankfurt: 'Frankfurt',
  Stuttgart: 'Stuttgart'
}
const EMOJIS = { 'pop-rock': '🎤', 'stand-up': '🎭', concert: '🎶', theater: '🎭', party: '🥳' }
const COLORS = ['#1e3a5f', '#7c2d12', '#4c1d95', '#365314', '#0e7490', '#9a3412', '#1e40af', '#831843', '#115e59', '#713f12']

async function postJson(url, body = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'TicketShop-Import/1.0' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.json()
}

function stripHtml(html = '') {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function cityOf(item, placeTitle = '') {
  const blob = `${placeTitle} ${item.title || ''} ${(item.tags || []).join(' ')}`
  for (const [k, v] of Object.entries(CITY_HINTS)) {
    if (blob.toLowerCase().includes(k.toLowerCase())) return v
  }
  const tags = item.tags || []
  for (const t of [...tags].reverse()) {
    if (Object.values(CITY_HINTS).includes(t)) return t
  }
  return tags[tags.length - 1] || 'Deutschland'
}

async function fetchAllList() {
  const first = await postJson('https://ulaznice.de/api/v1/front/event/get-list', { page: 1 })
  const pages = first.totalPages || 1
  let list = [...(first.filteredEvents || [])]
  for (let page = 2; page <= pages; page++) {
    const d = await postJson('https://ulaznice.de/api/v1/front/event/get-list', { page })
    list.push(...(d.filteredEvents || []))
  }
  const seen = new Set()
  return list.filter((e) => {
    if (seen.has(e._id)) return false
    seen.add(e._id)
    return true
  })
}

async function fetchDetail(slug) {
  const d = await postJson(`https://ulaznice.de/api/v1/front/event/${slug}`, {})
  return d.event || null
}

function toShopEvent(listItem, detail, index) {
  const ev = detail || {}
  const place = (ev.placeId || listItem.placeId || [])[0] || {}
  const desc = stripHtml(ev.additionalContentHTML || ev.contentHTML || '').slice(0, 1200) || listItem.title
  const media = ev.media || listItem.media || []
  let thumb = media[0]?.files?.thumb480 || ''
  if (thumb.startsWith('/')) thumb = `https://ulaznice.de${thumb}`
  const pricing = (ev.pricing || []).filter((p) => p.enabled !== false)
  const cats = pricing.map((p, j) => ({
    id: `cat-${p.key ?? j}`,
    name: p.label || `Kategorie ${j + 1}`,
    price: Number(p.price) || 0
  }))
  const slug = listItem.slug
  const date = (ev.date || listItem.date || '').replace('.000Z', '+00:00')
  return {
    id: `ulaz-${String(listItem._id).slice(0, 12)}`,
    slug,
    title: (ev.title || listItem.title || '').trim(),
    subtitle: ev.genre || listItem.genre || 'Event',
    city: cityOf(listItem, place.title || ''),
    venue: place.title || '',
    venueMapsUrl: String(place.locationLink || '').trim() || `https://maps.google.com/?q=${encodeURIComponent(place.title || '')}`,
    date,
    endDate: date,
    type: 'simple',
    active: true,
    promo: index < 3,
    organizer: ev.clientId?.title || 'Boommedia / ulaznice.de',
    posterColor: COLORS[index % COLORS.length],
    bannerEmoji: EMOJIS[ev.genre] || EMOJIS[listItem.type] || '🎫',
    description: desc,
    posterImage: thumb,
    tags: listItem.tags || [],
    priceCategories: cats.length ? cats : [{ id: 'cat-std', name: 'Ticket', price: 25 }],
    seats: {
      workspaceKey: '',
      eventKey: '',
      chartKey: '',
      hasNumericSeats: false,
      hasNonNumeric: true
    },
    sold: 0,
    capacity: Number(listItem.availableCount) || 500,
    source: 'ulaznice.de',
    sourceUrl: `https://ulaznice.de/event/${slug}`
  }
}

async function pushEvents(events) {
  const base = process.env.IMPORT_BASE || 'http://localhost:3000'
  const email = process.env.IMPORT_EMAIL || 'admin@ticketshop.local'
  const password = process.env.IMPORT_PASSWORD || 'admin'
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!loginRes.ok) throw new Error(`login failed ${loginRes.status}`)
  const cookie = loginRes.headers.getSetCookie?.()?.join('; ') || loginRes.headers.get('set-cookie') || ''
  let ok = 0
  for (const ev of events) {
    const res = await fetch(`${base}/api/admin/events`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(ev)
    })
    if (!res.ok) {
      console.error('PUT failed', ev.slug, res.status, await res.text())
      continue
    }
    ok++
    console.log('pushed', ev.slug)
  }
  console.log(`Pushed ${ok}/${events.length} → ${base}`)
}

const list = await fetchAllList()
const filtered = ONLY_UPCOMING ? list.filter((e) => (e.date || '').slice(0, 10) >= TODAY) : list
console.log(`List: ${list.length} total, importing ${filtered.length} (${ONLY_UPCOMING ? 'upcoming' : 'all'})`)

const shopEvents = []
for (let i = 0; i < filtered.length; i++) {
  const item = filtered[i]
  let detail = null
  try {
    detail = await fetchDetail(item.slug)
  } catch (e) {
    console.warn('detail fail', item.slug, e.message)
  }
  shopEvents.push(toShopEvent(item, detail, i))
  console.log('ok', item.slug)
}

mkdirSync(join(root, 'data'), { recursive: true })
const outPath = join(root, 'data', 'events-ulaznice.json')
writeFileSync(outPath, JSON.stringify(shopEvents, null, 2))
console.log('Wrote', outPath)

if (SEED) {
  const seedPath = join(root, 'data', 'events.json')
  writeFileSync(seedPath, JSON.stringify(shopEvents, null, 2))
  console.log('Replaced data/events.json seed with ulaznice upcoming')
}

if (PUSH) await pushEvents(shopEvents)

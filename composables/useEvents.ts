import eventsSeed from '~/data/events.json'
import ordersSeed from '~/data/orders.json'

export type EventItem = (typeof eventsSeed)[number]
export type OrderItem = (typeof ordersSeed)[number]

export function useEvents() {
  const events = useState<EventItem[]>('events', () => [...eventsSeed] as EventItem[])
  const orders = useState<OrderItem[]>('orders', () => [...ordersSeed] as OrderItem[])
  const loaded = useState('events-api-loaded', () => false)

  async function loadFromApi() {
    try {
      const list = await $fetch<EventItem[]>('/api/public/events')
      if (Array.isArray(list) && list.length) {
        events.value = list as EventItem[]
      }
      loaded.value = true
    } catch {
      loaded.value = true
    }
  }

  if (import.meta.client && !loaded.value) {
    loadFromApi()
  }

  function bySlug(slug: string) {
    return events.value.find((e) => e.slug === slug)
  }

  function byId(id: string) {
    return events.value.find((e) => e.id === id)
  }

  function featured() {
    return events.value.filter((e) => e.active).slice(0, 4)
  }

  function cities() {
    return [...new Set(events.value.map((e) => e.city))].sort()
  }

  async function upsert(
    event: EventItem,
    opts?: { throwOnError?: boolean; extra?: Record<string, unknown> }
  ) {
    const payload = { ...event, ...(opts?.extra || {}) }
    const local = { ...payload } as EventItem & { posterUpload?: unknown }
    delete local.posterUpload
    const idx = events.value.findIndex((e) => e.id === event.id)
    if (idx >= 0) {
      events.value = events.value.map((e, i) => (i === idx ? (local as EventItem) : e))
    } else {
      events.value = [...events.value, local as EventItem]
    }
    if (!import.meta.client) return
    try {
      const res = await $fetch<{ ok: boolean; event?: EventItem; warning?: string }>('/api/admin/events', {
        method: 'PUT',
        body: payload
      })
      if (res?.event) {
        const saved = res.event
        const i = events.value.findIndex((e) => e.id === saved.id)
        if (i >= 0) events.value = events.value.map((e, n) => (n === i ? saved : e))
        else events.value = [...events.value, saved]
      }
      return res
    } catch (err) {
      if (opts?.throwOnError) throw err
    }
  }

  function remove(id: string) {
    events.value = events.value.filter((e) => e.id !== id)
  }

  return { events, orders, bySlug, byId, featured, cities, upsert, remove, loadFromApi }
}

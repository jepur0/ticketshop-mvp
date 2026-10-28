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

  function upsert(event: EventItem) {
    const idx = events.value.findIndex((e) => e.id === event.id)
    if (idx >= 0) {
      events.value = events.value.map((e, i) => (i === idx ? event : e))
    } else {
      events.value = [...events.value, event]
    }
    // Best-effort persist (admin)
    if (import.meta.client) {
      $fetch('/api/admin/events', { method: 'PUT', body: event }).catch(() => {})
    }
  }

  function remove(id: string) {
    events.value = events.value.filter((e) => e.id !== id)
  }

  return { events, orders, bySlug, byId, featured, cities, upsert, remove, loadFromApi }
}

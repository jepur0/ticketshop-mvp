<template>
  <div>
    <NuxtLink to="/admin/events" class="link text-sm">← Events</NuxtLink>
    <h1 class="mb-6 mt-3 break-words text-3xl font-semibold">
      {{ mode === 'create' ? 'Neues Event' : 'Event bearbeiten' }}
      <span class="ml-2 text-sm font-normal text-slate-400">({{ form.type }})</span>
    </h1>

    <form class="card grid max-w-3xl gap-4 p-4 sm:grid-cols-2 sm:p-6" @submit.prevent="save">
      <div class="sm:col-span-2">
        <label class="label">Titel *</label>
        <input v-model="form.title" required class="input" />
      </div>
      <div>
        <label class="label">Stadt</label>
        <input v-model="form.city" class="input" />
      </div>
      <div>
        <label class="label">Venue</label>
        <input v-model="form.venue" class="input" />
      </div>
      <div>
        <label class="label">Datum / Start</label>
        <input v-model="form.dateLocal" type="datetime-local" class="input" />
      </div>
      <div>
        <label class="label">Typ</label>
        <select v-model="form.type" class="input">
          <option value="combined">Combined (Chart + numeric + optional non-numeric)</option>
          <option value="simple">Simple (kein Chart)</option>
        </select>
      </div>
      <div>
        <label class="label">Organizer</label>
        <input v-model="form.organizer" class="input" />
      </div>
      <div class="flex flex-wrap items-center gap-4 pt-2 sm:pt-6">
        <label class="flex items-center gap-2 text-sm"><input v-model="form.active" type="checkbox" /> Active</label>
        <label class="flex items-center gap-2 text-sm"><input v-model="form.promo" type="checkbox" /> Promo</label>
      </div>
      <div class="sm:col-span-2">
        <label class="label">Beschreibung</label>
        <textarea v-model="form.description" rows="3" class="input" />
      </div>

      <template v-if="form.type === 'combined'">
        <div class="sm:col-span-2 border-t pt-4">
          <p class="font-semibold text-sm mb-2">seats.io Keys (pro Event)</p>
          <p class="text-xs text-slate-400 mb-2">Workspace Public/Secret Key → Admin Settings. Hier nur Chart Key + Event Key.</p>
        </div>
        <div>
          <label class="label">Chart Key</label>
          <input v-model="form.chartKey" class="input" placeholder="chartKey" />
        </div>
        <div>
          <label class="label">Event Key</label>
          <input v-model="form.eventKey" class="input" placeholder="eventKey" />
        </div>
        <div class="sm:col-span-2 flex flex-col gap-3 text-sm sm:flex-row sm:gap-4">
          <label class="flex items-center gap-2"><input v-model="form.hasNumericSeats" type="checkbox" /> Numeric seats</label>
          <label class="flex items-center gap-2"><input v-model="form.hasNonNumeric" type="checkbox" /> Non-numeric (GA)</label>
        </div>
      </template>

      <div class="sm:col-span-2 border-t pt-4">
        <p class="font-semibold text-sm mb-2">Preiskategorien (JSON-einfach)</p>
        <div v-for="(cat, i) in form.priceCategories" :key="i" class="mb-2 grid gap-2 sm:grid-cols-[1fr_7rem]">
          <input v-model="cat.name" class="input" placeholder="Name" />
          <input v-model.number="cat.price" type="number" step="0.01" class="input" placeholder="€" />
        </div>
        <button type="button" class="btn-secondary !text-xs" @click="form.priceCategories.push({ id: `cat-${Date.now()}`, name: 'Neu', price: 20 })">+ Kategorie</button>
      </div>

      <div class="sm:col-span-2 flex flex-col gap-2 pt-2 sm:flex-row">
        <button type="submit" class="btn-primary w-full sm:w-auto">Speichern</button>
        <NuxtLink to="/admin/events" class="btn-secondary w-full sm:w-auto">Abbrechen</NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { EventItem } from '~/composables/useEvents'

const props = defineProps<{
  mode: 'create' | 'edit'
  event?: EventItem
}>()

const route = useRoute()
const { upsert } = useEvents()

function toLocal(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const defaultType = (route.query.type as string) === 'simple' ? 'simple' : 'combined'

const form = reactive({
  id: props.event?.id || `evt-${Date.now().toString(36)}`,
  slug: props.event?.slug || '',
  title: props.event?.title || '',
  subtitle: props.event?.subtitle || '',
  city: props.event?.city || 'Frankfurt',
  venue: props.event?.venue || '',
  venueMapsUrl: props.event?.venueMapsUrl || '',
  dateLocal: toLocal(props.event?.date) || toLocal(new Date().toISOString()),
  type: (props.event?.type || defaultType) as 'combined' | 'simple',
  active: props.event?.active ?? true,
  promo: props.event?.promo ?? false,
  organizer: props.event?.organizer || 'WAW Media Demo',
  posterColor: props.event?.posterColor || '#1e3a5f',
  bannerEmoji: props.event?.bannerEmoji || '🎫',
  description: props.event?.description || '',
  tags: props.event?.tags || ['Event'],
  priceCategories: props.event
    ? props.event.priceCategories.map((c) => ({ ...c }))
    : [{ id: 'cat-std', name: 'Standard', price: 25 }],
  chartKey: props.event?.seats.chartKey || '',
  eventKey: props.event?.seats.eventKey || '',
  hasNumericSeats: props.event?.seats.hasNumericSeats ?? true,
  hasNonNumeric: props.event?.seats.hasNonNumeric ?? false,
  sold: props.event?.sold ?? 0,
  capacity: props.event?.capacity ?? 100
})

function slugify(t: string) {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function save() {
  const date = form.dateLocal ? new Date(form.dateLocal).toISOString() : new Date().toISOString()
  const slug = form.slug || slugify(form.title) || form.id
  const item: EventItem = {
    id: form.id,
    slug,
    title: form.title,
    subtitle: form.subtitle,
    city: form.city,
    venue: form.venue,
    venueMapsUrl: form.venueMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(form.city)}`,
    date,
    endDate: date,
    type: form.type,
    active: form.active,
    promo: form.promo,
    organizer: form.organizer,
    posterColor: form.posterColor,
    bannerEmoji: form.bannerEmoji,
    description: form.description,
    tags: form.tags,
    priceCategories: form.priceCategories,
    seats: {
      workspaceKey: '',
      eventKey: form.type === 'combined' ? form.eventKey : '',
      chartKey: form.type === 'combined' ? form.chartKey : '',
      hasNumericSeats: form.type === 'combined' ? form.hasNumericSeats : false,
      hasNonNumeric: form.type === 'simple' ? true : form.hasNonNumeric
    },
    sold: form.sold,
    capacity: form.capacity
  }
  upsert(item)
  navigateTo('/admin/events')
}
</script>

<template>
  <div>
    <NuxtLink to="/admin/events" class="link text-sm">← Events</NuxtLink>
    <h1 class="mb-6 mt-3 font-display text-3xl font-medium">
      {{ mode === 'create' ? 'Neues Event' : 'Event bearbeiten' }}
    </h1>

    <form class="grid max-w-3xl gap-6" @submit.prevent="save">
      <section class="card grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
        <h2 class="font-display text-2xl font-medium sm:col-span-2">Grunddaten</h2>
        <div class="sm:col-span-2">
          <label class="label" for="event-title">Titel *</label>
          <input id="event-title" v-model="form.title" required class="input" />
        </div>
        <div>
          <label class="label" for="event-date">Datum / Uhrzeit</label>
          <input id="event-date" v-model="form.dateLocal" type="datetime-local" class="input" />
        </div>
        <div>
          <label class="label" for="event-city">Stadt</label>
          <input id="event-city" v-model="form.city" class="input" />
        </div>
        <div class="sm:col-span-2">
          <label class="label" for="event-place">Venue</label>
          <select id="event-place" v-model="placePick" class="input" @change="onPlace">
            <option value="">Freitext</option>
            <option v-for="p in places" :key="p.id" :value="p.id">{{ p.name }} · {{ p.city }}</option>
          </select>
          <input v-if="!placePick" id="event-venue" v-model="form.venue" class="input mt-2" placeholder="Venue" />
        </div>
        <div class="sm:col-span-2">
          <label class="label" for="event-description">Beschreibung</label>
          <textarea id="event-description" v-model="form.description" rows="4" class="input" />
        </div>
        <div class="sm:col-span-2">
          <label class="label">Bild</label>
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div
              class="relative flex h-40 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line"
              :style="{ background: form.posterColor }"
            >
              <img v-if="preview" :src="preview" alt="" class="h-full w-full object-cover" />
              <span v-else class="text-3xl">{{ form.bannerEmoji }}</span>
            </div>
            <div class="min-w-0 flex-1 space-y-3">
              <label class="btn-secondary cursor-pointer">
                Bild auswählen
                <input type="file" accept="image/*" class="sr-only" @change="onFile" />
              </label>
              <div>
                <label class="label" for="event-image-url">oder Bild-URL</label>
                <input
                  id="event-image-url"
                  v-model="form.imageUrl"
                  type="url"
                  class="input"
                  placeholder="https://…"
                  @change="onImageUrl"
                />
              </div>
              <button type="button" class="text-xs text-ink-muted underline decoration-gold/40" @click="clearImage">
                Bild entfernen
              </button>
              <p class="text-xs leading-relaxed text-ink-muted">
                Datei wird in der Datenbank gespeichert und über den Shop ausgeliefert. Auf Render Free geht diese
                Datei bei einem neuen Deploy verloren. Eine Bild-URL bleibt erhalten, solange die Quelle online ist.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="card grid gap-4 p-4 sm:p-6">
        <div>
          <h2 class="font-display text-2xl font-medium">Tickets</h2>
          <p class="mt-1 text-sm text-ink-muted">Eine Variante wählen.</p>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <label
            class="cursor-pointer rounded-[1.15rem] border bg-paper-card p-4 transition"
            :class="ticketMode === 'chart' ? 'border-gold shadow-glow' : 'border-line'"
          >
            <span class="flex items-start gap-2">
              <input v-model="ticketMode" class="mt-1" type="radio" name="ticketMode" value="chart" />
              <span>
                <span class="block text-sm font-semibold">Saalplan (seats.io)</span>
                <span class="mt-1 block text-xs leading-relaxed text-ink-muted">Nummerierte Plätze über den Event Key.</span>
              </span>
            </span>
          </label>
          <label
            class="cursor-pointer rounded-[1.15rem] border bg-paper-card p-4 transition"
            :class="ticketMode === 'ga' ? 'border-gold shadow-glow' : 'border-line'"
          >
            <span class="flex items-start gap-2">
              <input v-model="ticketMode" class="mt-1" type="radio" name="ticketMode" value="ga" />
              <span>
                <span class="block text-sm font-semibold">Ohne Sitzplan</span>
                <span class="mt-1 block text-xs leading-relaxed text-ink-muted">Freie Platzwahl. Gäste wählen eine Preiskategorie.</span>
              </span>
            </span>
          </label>
        </div>
        <div v-if="ticketMode === 'chart'">
          <label class="label" for="event-key">Event Key *</label>
          <input
            id="event-key"
            v-model="form.eventKey"
            required
            class="input font-mono text-xs"
            placeholder="z. B. 0f3c8f33-8f15-4384-9bc2-01ceda9c6711"
            autocomplete="off"
            spellcheck="false"
          />
          <p class="mt-2 text-xs leading-relaxed text-ink-muted">
            Im seats.io-Dashboard steht pro Event nur dieser eine Key. Den Chart Key trägt das Formular nicht ein.
            Wenn er intern gebraucht wird, liest ihn der Server mit dem Secret Key aus Admin → Settings.
            Der öffentliche Sitzplan lädt mit Event Key und Workspace Public Key.
          </p>
        </div>
        <p v-else class="text-sm text-ink-soft">Ohne Saalplan. Die Preiskategorien unten sind die Tickets.</p>
      </section>

      <section class="card p-4 sm:p-6">
        <h2 class="font-display text-2xl font-medium">Preiskategorien</h2>
        <div class="mt-4 space-y-2">
          <div
            v-for="(cat, i) in form.priceCategories"
            :key="cat.id"
            class="grid gap-2 sm:grid-cols-[1fr_8rem_auto] sm:items-center"
          >
            <input v-model="cat.name" class="input" :aria-label="`Name Kategorie ${i + 1}`" placeholder="Name" required />
            <input
              v-model.number="cat.price"
              type="number"
              min="0"
              step="0.01"
              class="input"
              :aria-label="`Preis Kategorie ${i + 1}`"
              placeholder="Preis €"
              required
            />
            <button
              type="button"
              class="btn-secondary !min-h-10"
              :disabled="form.priceCategories.length < 2"
              @click="removeCategory(i)"
            >
              Entfernen
            </button>
          </div>
        </div>
        <button type="button" class="btn-secondary mt-3 !text-xs" @click="addCategory">+ Kategorie</button>
      </section>

      <details class="card p-4 sm:p-6">
        <summary class="cursor-pointer text-sm font-semibold">Weitere Optionen</summary>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="label" for="event-organizer">Veranstalter</label>
            <select id="event-client" v-model="clientPick" class="input" @change="onClient">
              <option value="">Freitext</option>
              <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <input v-if="!clientPick" id="event-organizer" v-model="form.organizer" class="input mt-2" placeholder="Veranstalter" />
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="form.active" type="checkbox" />
            Aktiv
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="form.promo" type="checkbox" />
            Promo
          </label>
        </div>
      </details>

      <p v-if="error" class="text-sm text-red-700">{{ error }}</p>
      <p v-if="warning" class="text-sm text-gold-deep">Gespeichert. {{ warning }}</p>

      <div class="flex flex-col gap-2 sm:flex-row">
        <button type="submit" class="btn-primary w-full sm:w-auto" :disabled="saving">
          {{ saving ? 'Speichern…' : 'Speichern' }}
        </button>
        <NuxtLink to="/admin/events" class="btn-secondary w-full sm:w-auto">
          {{ warning ? 'Zur Übersicht' : 'Abbrechen' }}
        </NuxtLink>
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
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const initialMode: 'chart' | 'ga' = props.event
  ? props.event.type === 'combined'
    ? 'chart'
    : 'ga'
  : route.query.type === 'simple'
    ? 'ga'
    : 'chart'

const ticketMode = ref<'chart' | 'ga'>(initialMode)
const saving = ref(false)
const error = ref('')
const warning = ref('')
const preview = ref(props.event?.posterImage || '')
const imageLocked = ref(Boolean((props.event as EventItem & { posterLocked?: boolean } | undefined)?.posterLocked))
const pendingUpload = ref<{ mime: string; base64: string } | null>(null)

const existingPoster = props.event?.posterImage || ''
const places = ref<any[]>([])
const clients = ref<any[]>([])
const placePick = ref('')
const clientPick = ref('')

const form = reactive({
  id: props.event?.id || `evt-${Date.now().toString(36)}`,
  slug: props.event?.slug || '',
  title: props.event?.title || '',
  city: props.event?.city || 'Frankfurt',
  venue: props.event?.venue || '',
  dateLocal: toLocal(props.event?.date) || toLocal(new Date().toISOString()),
  active: props.event?.active ?? true,
  promo: props.event?.promo ?? false,
  organizer: props.event?.organizer || 'WAW Media Demo',
  posterColor: props.event?.posterColor || '#1e3a5f',
  bannerEmoji: props.event?.bannerEmoji || '🎫',
  description: props.event?.description || '',
  posterImage: existingPoster,
  imageUrl: /^https?:\/\//i.test(existingPoster) ? existingPoster : '',
  eventKey: props.event?.seats.eventKey || '',
  priceCategories: props.event
    ? props.event.priceCategories.map((c) => ({ ...c }))
    : [{ id: 'cat-std', name: 'Standard', price: 25 }]
})

function onPlace() {
  const place = places.value.find((p) => p.id === placePick.value)
  if (!place) return
  form.venue = place.name || ''
  if (place.city) form.city = place.city
  if (place.seatsEventKey && !form.eventKey) {
    form.eventKey = place.seatsEventKey
    ticketMode.value = 'chart'
  }
}

function onClient() {
  const client = clients.value.find((c) => c.id === clientPick.value)
  if (client) form.organizer = client.name || ''
}

onMounted(async () => {
  places.value = await $fetch('/api/admin/records/places').catch(() => [])
  clients.value = await $fetch('/api/admin/records/clients').catch(() => [])
  const savedPlace = (props.event as any)?.placeId
  if (savedPlace && places.value.some((p) => p.id === savedPlace)) placePick.value = savedPlace
  const savedClient = (props.event as any)?.clientId
  if (savedClient && clients.value.some((c) => c.id === savedClient)) clientPick.value = savedClient
})

function addCategory() {
  form.priceCategories.push({ id: `cat-${Date.now().toString(36)}`, name: '', price: 0 })
}

function removeCategory(index: number) {
  if (form.priceCategories.length < 2) return
  form.priceCategories.splice(index, 1)
}

function onImageUrl() {
  pendingUpload.value = null
  const url = form.imageUrl.trim()
  imageLocked.value = true
  form.posterImage = url
  preview.value = url
}

function clearImage() {
  pendingUpload.value = null
  form.imageUrl = ''
  form.posterImage = ''
  preview.value = ''
  imageLocked.value = true
}

async function onFile(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  error.value = ''
  try {
    const compressed = await compressImage(file)
    pendingUpload.value = { mime: compressed.mime, base64: compressed.base64 }
    preview.value = compressed.dataUrl
    form.imageUrl = ''
    imageLocked.value = true
  } catch (err: any) {
    error.value = err?.message || 'Bild konnte nicht gelesen werden.'
  }
}

function compressImage(file: File): Promise<{ dataUrl: string; mime: string; base64: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Bitte eine Bilddatei wählen.'))
      return
    }
    if (file.size > 12 * 1024 * 1024) {
      reject(new Error('Bild ist größer als 12 MB.'))
      return
    }
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const maxSide = 1600
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height || 1))
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Bild konnte nicht verarbeitet werden.'))
        return
      }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      let quality = 0.82
      let dataUrl = canvas.toDataURL('image/jpeg', quality)
      while (dataUrl.length > 1_400_000 && quality > 0.5) {
        quality -= 0.1
        dataUrl = canvas.toDataURL('image/jpeg', Number(quality.toFixed(2)))
      }
      if (dataUrl.length > 1_900_000) {
        reject(new Error('Bild ist nach dem Verkleinern noch zu groß.'))
        return
      }
      resolve({
        dataUrl,
        mime: 'image/jpeg',
        base64: dataUrl.slice(dataUrl.indexOf(',') + 1)
      })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Bild konnte nicht gelesen werden.'))
    }
    img.src = url
  })
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildItem(): EventItem {
  const date = form.dateLocal ? new Date(form.dateLocal).toISOString() : new Date().toISOString()
  const slug = form.slug || slugify(form.title) || form.id
  const chart = ticketMode.value === 'chart'
  const base = (props.event ? { ...props.event } : {}) as EventItem
  const sameKey = chart && form.eventKey.trim() === (props.event?.seats.eventKey || '')
  return {
    ...base,
    id: form.id,
    slug,
    title: form.title.trim(),
    subtitle: base.subtitle || '',
    city: form.city.trim(),
    venue: form.venue.trim(),
    venueMapsUrl: base.venueMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(form.venue || form.city)}`,
    date,
    endDate: base.endDate || date,
    type: chart ? 'combined' : 'simple',
    active: form.active,
    promo: form.promo,
    organizer: form.organizer.trim(),
    posterColor: form.posterColor,
    posterImage: form.posterImage,
    bannerEmoji: form.bannerEmoji,
    description: form.description,
    tags: base.tags?.length ? base.tags : ['Event'],
    priceCategories: form.priceCategories.map((cat) => ({
      id: cat.id,
      name: cat.name.trim(),
      price: Number(cat.price) || 0
    })),
    seats: {
      workspaceKey: base.seats?.workspaceKey || '',
      eventKey: chart ? form.eventKey.trim() : '',
      chartKey: sameKey ? base.seats?.chartKey || '' : '',
      hasNumericSeats: chart ? base.seats?.hasNumericSeats ?? true : false,
      hasNonNumeric: chart ? base.seats?.hasNonNumeric ?? false : true
    },
    sold: base.sold ?? 0,
    capacity: base.capacity ?? 100
  }
}

async function save() {
  error.value = ''
  warning.value = ''
  if (!form.title.trim()) {
    error.value = 'Bitte einen Titel eintragen.'
    return
  }
  if (ticketMode.value === 'chart' && !form.eventKey.trim()) {
    error.value = 'Bitte den seats.io Event Key eintragen.'
    return
  }
  if (!form.priceCategories.length || form.priceCategories.some((cat) => !cat.name.trim())) {
    error.value = 'Jede Preiskategorie braucht einen Namen.'
    return
  }
  saving.value = true
  try {
    const extra: Record<string, unknown> = {
      posterLocked: imageLocked.value,
      placeId: placePick.value || '',
      clientId: clientPick.value || ''
    }
    if (pendingUpload.value) extra.posterUpload = pendingUpload.value
    const res = await upsert(buildItem(), { throwOnError: true, extra })
    if (res?.warning) {
      warning.value = res.warning
      saving.value = false
      return
    }
    await navigateTo('/admin/events')
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.statusMessage || err?.message || 'Speichern fehlgeschlagen'
    saving.value = false
  }
}
</script>

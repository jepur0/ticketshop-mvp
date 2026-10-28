<template>
  <div v-if="event" class="mx-auto max-w-6xl px-4 py-6 sm:py-8">
    <div
      v-if="eventItems.length"
      class="sticky top-[61px] z-30 mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:top-[69px] lg:hidden"
    >
      <div class="min-w-0 flex-1">
        <p class="text-xs text-slate-500">{{ eventItems.length }} {{ eventItems.length === 1 ? 'Ticket' : 'Tickets' }}</p>
        <p class="font-semibold">{{ eventTotal }} €</p>
      </div>
      <NuxtLink to="/checkout" class="btn-primary shrink-0">Zur Kasse</NuxtLink>
    </div>
    <div class="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div class="min-w-0">
        <div
          class="rounded-2xl h-40 sm:h-56 flex items-center justify-center text-6xl sm:text-7xl mb-6"
          :style="{ background: event.posterColor }"
        >
          {{ event.bannerEmoji }}
        </div>
        <p class="text-sm font-medium text-blue-700 mb-1 break-words">{{ event.city }} · {{ event.venue }}</p>
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 break-words">{{ event.title }}</h1>
        <p class="text-slate-500 mt-1 break-words">{{ event.subtitle }}</p>
        <p class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
          <span>{{ formatDate(event.date) }}</span>
          <a v-if="event.venueMapsUrl" :href="event.venueMapsUrl" target="_blank" class="inline-flex min-h-11 items-center text-blue-700 underline sm:min-h-0">Karte</a>
        </p>
        <p class="mt-6 text-slate-700 leading-relaxed whitespace-pre-line">{{ event.description }}</p>

        <div class="mt-8">
          <SeatsChart
            v-if="event.type === 'combined'"
            :workspace-key="integrations?.seatsio?.workspacePublicKey"
            :region="integrations?.seatsio?.region || 'eu'"
            :chart-key="event.seats.chartKey"
            :event-key="event.seats.eventKey"
            :categories="event.priceCategories"
            :emoji="event.bannerEmoji"
            :hold-minutes="holdMinutes"
            @select-category="onSelectCategory"
            @select-seat="onSelectSeat"
            @deselect-seat="onDeselectSeat"
            @hold-token="onHoldToken"
          />
          <div v-else class="card p-6">
            <h2 class="font-semibold mb-3">Tickets (ohne Sitzplan)</h2>
            <div class="space-y-2">
              <button
                v-for="cat in event.priceCategories"
                :key="cat.id"
                type="button"
                class="w-full flex items-center justify-between btn-secondary"
                @click="onSelectCategory(cat)"
              >
                <span>{{ cat.name }}</span>
                <span class="font-bold">{{ cat.price }} €</span>
              </button>
            </div>
            <p class="text-xs text-slate-400 mt-3">Reservierung wird {{ holdMinutes }} Minuten gehalten.</p>
          </div>
        </div>
      </div>

      <aside class="lg:sticky lg:top-20 h-fit">
        <div class="card p-5">
          <h2 class="font-semibold mb-3">Warenkorb</h2>
          <p v-if="!eventItems.length" class="text-sm text-slate-400">Noch keine Tickets gewählt.</p>
          <ul v-else class="mb-4 space-y-2">
            <li v-for="(item, i) in eventItems" :key="i" class="flex items-center gap-2 border-b border-slate-100 pb-2 text-sm">
              <span class="min-w-0 flex-1 break-words">{{ item.label }}</span>
              <span class="shrink-0 font-medium">{{ item.price }} €</span>
              <button
                type="button"
                class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                :aria-label="`${item.label} entfernen`"
                @click="removeFromEvent(item)"
              >✕</button>
            </li>
          </ul>
          <div v-if="eventItems.length" class="flex justify-between font-semibold mb-2">
            <span>Summe</span>
            <span>{{ eventTotal }} €</span>
          </div>
          <p v-if="holdStartedAt" class="text-xs text-amber-700 mb-3">
            ⏱ Hold: ca. {{ holdMinutes }} Min. — danach werden Plätze freigegeben.
          </p>
          <NuxtLink
            to="/checkout"
            class="btn-primary w-full"
            :class="{ 'pointer-events-none opacity-50': !eventItems.length }"
          >
            Zur Kasse
          </NuxtLink>
        </div>
      </aside>
    </div>
  </div>
  <div v-else class="mx-auto max-w-6xl px-4 py-20 text-center text-slate-500">
    Event nicht gefunden. <NuxtLink to="/archive" class="text-blue-700 underline">Zur Übersicht</NuxtLink>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { bySlug } = useEvents()
const { items, addItem, removeItem, holdStartedAt, setHoldMeta } = useCart()

const event = computed(() => bySlug(String(route.params.slug)))
const { data: integrations } = await useFetch('/api/public/integrations')
const holdMinutes = computed(() => (integrations.value as any)?.holdMinutes || 20)

const eventItems = computed(() => items.value.filter((i) => i.eventId === event.value?.id))
const eventTotal = computed(() => eventItems.value.reduce((s, i) => s + i.price, 0))

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin'
  })
}

function onSelectCategory(cat: { id: string; name: string; price: number }) {
  if (!event.value) return
  const seatId = event.value.type === 'combined' ? `DEMO-${cat.id}-${Math.floor(Math.random() * 90 + 10)}` : null
  addItem({
    eventId: event.value.id,
    eventSlug: event.value.slug,
    eventTitle: event.value.title,
    label: seatId ? `${cat.name} (${seatId})` : cat.name,
    price: cat.price,
    seatId,
    categoryId: cat.id
  })
}

function onSelectSeat(payload: { seatId: string; label: string; categoryId?: string; price: number }) {
  if (!event.value) return
  // avoid dup
  if (items.value.some((i) => i.seatId === payload.seatId && i.eventId === event.value!.id)) return
  const cat = event.value.priceCategories.find((c) => c.id === payload.categoryId)
  addItem({
    eventId: event.value.id,
    eventSlug: event.value.slug,
    eventTitle: event.value.title,
    label: `${cat?.name || 'Sitz'} (${payload.label})`,
    price: payload.price,
    seatId: payload.seatId,
    categoryId: payload.categoryId
  })
}

function onDeselectSeat(seatId: string) {
  const idx = items.value.findIndex((i) => i.seatId === seatId && i.eventId === event.value?.id)
  if (idx >= 0) removeItem(idx)
}

function onHoldToken(token: string | null) {
  setHoldMeta({ seatsHoldToken: token })
}

function removeFromEvent(item: { seatId?: string | null; label?: string; price?: number }) {
  const exact = items.value.findIndex(
    (i) =>
      i.eventId === event.value?.id &&
      i.seatId === item.seatId &&
      i.label === item.label &&
      i.price === item.price
  )
  if (exact >= 0) removeItem(exact)
}
</script>

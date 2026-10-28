<template>
  <div v-if="event" class="mx-auto max-w-6xl px-4 py-10 sm:py-14">
    <div class="grid gap-10 lg:grid-cols-[1fr_340px]">
      <div>
        <div
          class="relative mb-8 overflow-hidden rounded-[1.35rem] border border-line shadow-soft"
          :style="{ background: event.posterColor || '#17151a' }"
        >
          <div class="aspect-[21/9] min-h-[180px] sm:min-h-[220px]">
            <img
              v-if="event.posterImage"
              :src="event.posterImage"
              :alt="event.title"
              class="h-full w-full object-cover"
            />
            <div v-else class="flex h-full items-center justify-center text-7xl">{{ event.bannerEmoji }}</div>
          </div>
          <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        <p class="eyebrow">{{ event.city }} · {{ event.venue }}</p>
        <h1 class="page-title mt-3">{{ event.title }}</h1>
        <p v-if="event.subtitle" class="page-dek">{{ event.subtitle }}</p>
        <p class="mt-4 text-sm font-medium text-ink-soft">
          {{ formatDate(event.date) }}
          <a
            v-if="event.venueMapsUrl"
            :href="event.venueMapsUrl"
            target="_blank"
            class="link ml-2"
          >Karte</a>
        </p>
        <p class="mt-6 whitespace-pre-line text-base leading-relaxed text-ink-soft">{{ event.description }}</p>

        <div class="mt-10">
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
          <div v-else class="card p-6 sm:p-7">
            <h2 class="font-display text-xl font-medium">Tickets wählen</h2>
            <p class="mt-1 text-sm text-ink-muted">Ohne Sitzplan — Kategorie und Anzahl.</p>
            <div class="mt-5 space-y-2.5">
              <button
                v-for="cat in event.priceCategories"
                :key="cat.id"
                type="button"
                class="btn-secondary flex w-full items-center !justify-between !rounded-xl !min-h-12"
                @click="onSelectCategory(cat)"
              >
                <span>{{ cat.name }}</span>
                <span class="font-semibold tabular-nums">{{ cat.price }} €</span>
              </button>
            </div>
            <p class="mt-4 text-xs text-ink-muted">Reservierung wird {{ holdMinutes }} Minuten gehalten.</p>
          </div>
        </div>
      </div>

      <aside class="h-fit lg:sticky lg:top-24">
        <div class="card p-6">
          <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Warenkorb</p>
          <p v-if="!eventItems.length" class="mt-3 text-sm text-ink-muted">Noch keine Tickets gewählt.</p>
          <ul v-else class="mt-4 mb-4 space-y-3">
            <li
              v-for="(item, i) in eventItems"
              :key="i"
              class="flex items-start justify-between gap-3 border-b border-line pb-3 text-sm"
            >
              <span class="min-w-0 leading-snug">{{ item.label }}</span>
              <div class="flex shrink-0 items-center gap-2">
                <span class="font-semibold tabular-nums">{{ item.price }} €</span>
                <button type="button" class="text-xs text-red-500/90 hover:text-red-600" @click="removeFromEvent(item)">✕</button>
              </div>
            </li>
          </ul>
          <div v-if="eventItems.length" class="mb-3 flex justify-between text-base font-semibold">
            <span>Summe</span>
            <span class="tabular-nums">{{ eventTotal }} €</span>
          </div>
          <p v-if="holdStartedAt" class="mb-4 text-xs text-gold-deep">
            Hold: ca. {{ holdMinutes }} Min. — danach werden Plätze freigegeben.
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
  <div v-else class="mx-auto max-w-6xl px-4 py-24 text-center text-ink-soft">
    Event nicht gefunden.
    <NuxtLink to="/archive" class="link ml-1">Zur Übersicht</NuxtLink>
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

<template>
  <div v-if="event" class="overflow-x-clip pb-28 xl:pb-16 xl:pr-[22rem]">
    <div class="xl:mx-auto xl:max-w-[1600px] xl:px-4 xl:pt-8">
      <div class="xl:grid xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:overflow-hidden xl:rounded-[1.35rem] xl:border xl:border-line">
        <div
          class="relative aspect-[16/10] min-h-[210px] w-full bg-night sm:aspect-[21/9] xl:aspect-auto xl:min-h-[460px]"
          :style="{ background: event.posterColor || '#17151a' }"
        >
          <img
            v-if="event.posterImage"
            :src="event.posterImage"
            :alt="event.title"
            class="absolute inset-0 h-full w-full object-cover"
          />
          <div v-else class="flex h-full items-center justify-center text-7xl">{{ event.bannerEmoji }}</div>
        </div>

        <section class="bg-night px-4 py-6 text-paper-soft sm:px-6 sm:py-8 xl:flex xl:flex-col xl:justify-center xl:px-10 xl:py-12">
          <h1 class="break-words font-display text-[1.65rem] font-bold leading-[1.15] min-[390px]:text-3xl sm:text-4xl xl:text-5xl">
            {{ event.title }}
          </h1>
          <ul class="mt-5 space-y-3 text-sm">
            <li class="flex items-start gap-3">
              <svg viewBox="0 0 24 24" class="mt-0.5 h-5 w-5 shrink-0 text-gold-soft" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3.5v3M16 3.5v3M3.5 10h17"/></svg>
              <span class="min-w-0 break-words font-medium">{{ formatDate(event.date) }}</span>
            </li>
            <li class="flex items-start gap-3">
              <svg viewBox="0 0 24 24" class="mt-0.5 h-5 w-5 shrink-0 text-gold-soft" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z"/><circle cx="12" cy="10" r="2.2"/></svg>
              <a
                v-if="event.venueMapsUrl"
                :href="event.venueMapsUrl"
                target="_blank"
                class="min-w-0 break-words font-medium underline decoration-gold/40 underline-offset-4"
              >{{ event.venue }}</a>
              <span v-else class="min-w-0 break-words font-medium">{{ event.venue }}</span>
            </li>
            <li v-if="event.organizer" class="flex items-start gap-3">
              <svg viewBox="0 0 24 24" class="mt-0.5 h-5 w-5 shrink-0 text-gold-soft" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="12" cy="8" r="3.2"/><path d="M5 19.5c1.4-3 3.8-4.5 7-4.5s5.6 1.5 7 4.5"/></svg>
              <span class="min-w-0 break-words">{{ event.organizer }}</span>
            </li>
            <li v-if="phone" class="flex items-start gap-3">
              <svg viewBox="0 0 24 24" class="mt-0.5 h-5 w-5 shrink-0 text-gold-soft" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M7 3.5h3l1.5 4-2 1.2a12 12 0 0 0 5.8 5.8l1.2-2 4 1.5v3A2 2 0 0 1 18.5 19 15.5 15.5 0 0 1 5 5.5 2 2 0 0 1 7 3.5z"/></svg>
              <a :href="`tel:${phoneTel}`" class="min-w-0 break-words font-medium">{{ phone }}</a>
            </li>
          </ul>
          <div class="mt-6 flex flex-wrap gap-2">
            <a
              v-for="link in shareLinks"
              :key="link.id"
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-paper-soft transition hover:border-gold/50 hover:text-gold-soft"
              :aria-label="link.label"
              @click="onShareClick(link, $event)"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4" :fill="link.filled ? 'currentColor' : 'none'" :stroke="link.filled ? 'none' : 'currentColor'" stroke-width="1.75" aria-hidden="true">
                <path v-for="(d, i) in link.paths" :key="i" :d="d" />
              </svg>
            </a>
          </div>
          <p v-if="copied" class="mt-2 text-xs text-gold-soft">Link kopiert.</p>
        </section>
      </div>
    </div>

    <div class="mx-auto mt-5 max-w-[1600px] px-4 xl:mt-8">
      <nav class="flex flex-wrap items-center gap-2" aria-label="Kategorien">
        <NuxtLink to="/archive" class="chip">Events</NuxtLink>
        <span v-for="chip in categoryChips" :key="chip" class="chip">{{ chip }}</span>
        <span v-if="event.city" class="chip border-gold/40 bg-gold/15 text-gold-deep">{{ event.city }}</span>
      </nav>

      <p class="mt-4 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm leading-relaxed text-ink">
        <template v-if="event.type === 'combined'">
          Wähle deine Plätze im Sitzplan. Die Plätze werden {{ holdMinutes }} Minuten gehalten.
        </template>
        <template v-else>
          Wähle eine Kategorie. Die Reservierung wird {{ holdMinutes }} Minuten gehalten.
        </template>
      </p>
    </div>

    <section class="mx-auto mt-5 max-w-[1600px] xl:px-4">
      <div :class="expanded ? 'fixed inset-0 z-[70] flex flex-col bg-paper' : ''">
        <div class="flex items-center gap-2 px-4 py-3">
          <div class="flex min-w-0 flex-1 gap-2 overflow-x-auto">
            <span
              v-for="(cat, i) in event.priceCategories"
              :key="cat.id"
              class="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-paper-card px-3 py-1.5 text-sm font-semibold"
            >
              <span class="h-2.5 w-2.5 rounded-full" :style="{ background: legendColor(i) }" aria-hidden="true" />
              {{ cat.price }} €
              <span class="font-medium text-ink-muted">{{ cat.name }}</span>
            </span>
          </div>
          <button
            v-if="event.type === 'combined'"
            type="button"
            class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-strong bg-paper-card text-ink"
            :aria-label="expanded ? 'Sitzplan schließen' : 'Sitzplan vergrößern'"
            @click="expanded = !expanded"
          >
            <svg v-if="expanded" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            <svg v-else viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M9 4H4v5M15 4h5v5M20 15v5h-5M4 15v5h5"/></svg>
          </button>
        </div>

        <SeatsChart
          v-if="event.type === 'combined'"
          :workspace-key="integrations?.seatsio?.workspacePublicKey"
          :region="integrations?.seatsio?.region || 'eu'"
          :chart-key="event.seats.chartKey"
          :event-key="event.seats.eventKey"
          :categories="event.priceCategories"
          :emoji="event.bannerEmoji"
          :hold-minutes="holdMinutes"
          :expanded="expanded"
          @select-category="onSelectCategory"
          @select-seat="onSelectSeat"
          @deselect-seat="onDeselectSeat"
          @hold-token="onHoldToken"
        />
        <div v-else class="card mx-4 p-6 sm:p-7 xl:mx-0">
          <div class="space-y-2.5">
            <button
              v-for="cat in event.priceCategories"
              :key="cat.id"
              type="button"
              class="btn-secondary flex w-full items-center !justify-between !min-h-12 !rounded-xl"
              @click="onSelectCategory(cat)"
            >
              <span>{{ cat.name }}</span>
              <span class="font-semibold tabular-nums">{{ cat.price }} €</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <div class="mx-auto mt-8 max-w-3xl px-4 xl:max-w-[1600px]">
      <h2 class="font-display text-xl font-semibold">Beschreibung</h2>
      <p class="mt-3 whitespace-pre-line break-words text-base leading-relaxed text-ink-soft">{{ event.description }}</p>
    </div>

    <aside
      class="fixed inset-x-0 z-40 border-t border-line bg-paper-card/95 px-3 py-2.5 shadow-lift backdrop-blur xl:hidden"
      :class="consent === null ? 'bottom-48' : 'bottom-0'"
      style="padding-bottom: max(0.625rem, env(safe-area-inset-bottom))"
    >
      <div class="mx-auto flex max-w-3xl items-center gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-ink">{{ seatCountLabel }}</p>
          <p class="text-xs tabular-nums text-ink-muted">{{ eventTotal }} €</p>
        </div>
        <NuxtLink
          to="/checkout"
          class="btn-primary shrink-0"
          :class="{ 'pointer-events-none opacity-50': !eventItems.length }"
        >
          Zur Kasse
        </NuxtLink>
      </div>
    </aside>

    <aside class="mt-8 hidden xl:fixed xl:right-6 xl:top-24 xl:z-30 xl:mt-0 xl:block xl:w-80">
      <div class="card p-6">
        <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Warenkorb</p>
        <p v-if="!eventItems.length" class="mt-3 text-sm text-ink-muted">Noch keine Tickets gewählt.</p>
        <ul v-else class="mb-4 mt-4 space-y-3">
          <li
            v-for="(item, i) in eventItems"
            :key="i"
            class="flex items-start justify-between gap-3 border-b border-line pb-3 text-sm"
          >
            <span class="min-w-0 break-words leading-snug">{{ item.label }}</span>
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
  <div v-else class="mx-auto max-w-6xl px-4 py-24 text-center text-ink-soft">
    Event nicht gefunden.
    <NuxtLink to="/archive" class="link ml-1">Zur Übersicht</NuxtLink>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const consent = useCookieConsent()
const requestUrl = useRequestURL()
const { bySlug } = useEvents()
const { items, addItem, removeItem, holdStartedAt, setHoldMeta } = useCart()

const event = computed(() => bySlug(String(route.params.slug)))
const { data: integrations } = await useFetch('/api/public/integrations')
const { data: company } = await useFetch('/api/public/company')
const holdMinutes = computed(() => (integrations.value as any)?.holdMinutes || 20)
const expanded = ref(false)
const copied = ref(false)

const eventItems = computed(() => items.value.filter((i) => i.eventId === event.value?.id))
const eventTotal = computed(() => eventItems.value.reduce((s, i) => s + i.price, 0))
const seatCountLabel = computed(() => {
  const n = eventItems.value.length
  return n === 1 ? '1 Platz' : `${n} Plätze`
})

const categoryChips = computed(() => {
  const current = event.value
  if (!current) return []
  const city = (current.city || '').trim().toLowerCase()
  const seen = new Set<string>()
  const chips: string[] = []
  const add = (value?: string) => {
    const text = (value || '').trim()
    const key = text.toLowerCase()
    if (!text || key === city || seen.has(key)) return
    seen.add(key)
    chips.push(text)
  }
  add(current.subtitle)
  for (const tag of current.tags || []) add(tag)
  return chips
})

const phone = computed(() => {
  const current = event.value as { phone?: string; description?: string } | undefined
  if (current?.phone) return current.phone
  const match = current?.description?.match(/\+\d[\d\s()./-]{6,}\d/)
  if (match) return match[0].replace(/\s+/g, ' ').trim()
  const companyPhone = (company.value as { phone?: string } | null)?.phone || ''
  if (companyPhone && !companyPhone.startsWith('[')) return companyPhone
  return ''
})
const phoneTel = computed(() => phone.value.replace(/[^\d+]/g, ''))

const legendPalette = ['#c89a3c', '#2563eb', '#e11d48', '#059669', '#7c3aed', '#ea580c', '#0f766e', '#be123c']
function legendColor(index: number) {
  return legendPalette[index % legendPalette.length]
}

const shareUrl = computed(() => {
  if (import.meta.client) return window.location.href
  return `${requestUrl.origin}/event/${route.params.slug}`
})
const shareText = computed(() => event.value?.title || 'TicketShop')

function shareHref(kind: string) {
  const url = encodeURIComponent(shareUrl.value)
  const text = encodeURIComponent(`${shareText.value} ${shareUrl.value}`)
  if (kind === 'facebook') return `https://www.facebook.com/sharer/sharer.php?u=${url}`
  if (kind === 'x') return `https://twitter.com/intent/tweet?url=${url}&text=${encodeURIComponent(shareText.value)}`
  if (kind === 'whatsapp') return `https://wa.me/?text=${text}`
  if (kind === 'viber') return `viber://forward?text=${text}`
  if (kind === 'telegram') return `https://t.me/share/url?url=${url}&text=${encodeURIComponent(shareText.value)}`
  return 'https://www.instagram.com/'
}

async function onInstagram(ev: MouseEvent) {
  ev.preventDefault()
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    /* clipboard may be blocked */
  }
  window.open('https://www.instagram.com/', '_blank', 'noopener')
}

function onShareClick(link: { onClick?: (ev: MouseEvent) => void }, ev: MouseEvent) {
  link.onClick?.(ev)
}

const shareLinks = computed(() => [
  { id: 'facebook', label: 'Auf Facebook teilen', href: shareHref('facebook'), filled: true, paths: ['M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1z'] },
  { id: 'x', label: 'Auf X teilen', href: shareHref('x'), filled: true, paths: ['M14.7 10.3 21.4 3h-1.6l-5.8 6.4L9.3 3H3.2l7 10.1L3 21h1.6l6.2-6.8L14.6 21h6.1l-6-10.7z'] },
  { id: 'whatsapp', label: 'Per WhatsApp teilen', href: shareHref('whatsapp'), filled: true, paths: ['M12 3.2A8.7 8.7 0 0 0 4.7 16.3L3.5 20.5l4.3-1.1A8.8 8.8 0 1 0 12 3.2z'] },
  { id: 'viber', label: 'Per Viber teilen', href: shareHref('viber'), filled: true, paths: ['M12.2 3C7.6 3 4.8 5.7 4.6 10.2c-.1 2.4.6 4.3 1.8 5.6l-.7 3.2 3.3-1.1A8.7 8.7 0 1 0 12.2 3z'] },
  { id: 'telegram', label: 'Per Telegram teilen', href: shareHref('telegram'), filled: true, paths: ['M20.7 4.4 2.9 11.2c-1.2.5-1.2 1.1-.2 1.4l4.6 1.4 10.6-6.7c.5-.3 1-.1.6.2l-8.6 7.8-.3 4.6c.5 0 .7-.2 1-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.2-.5-1.8-1.7-1.3z'] },
  { id: 'instagram', label: 'Link kopieren und Instagram öffnen', href: shareHref('instagram'), filled: false, paths: ['M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z', 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z'], onClick: onInstagram }
])

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

function onKey(ev: KeyboardEvent) {
  if (ev.key === 'Escape') expanded.value = false
}

watch(expanded, (on) => {
  if (!import.meta.client) return
  document.body.style.overflow = on ? 'hidden' : ''
})

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

</script>

<style scoped>
.chip {
  display: inline-flex;
  min-height: 2rem;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(23, 21, 26, 0.12);
  background: #fffdf9;
  padding: 0.25rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #17151a;
}
</style>

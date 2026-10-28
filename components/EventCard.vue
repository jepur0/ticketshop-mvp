<template>
  <NuxtLink
    :to="`/event/${event.slug}`"
    class="card group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-md"
  >
    <div
      class="relative flex h-48 items-center justify-center overflow-hidden text-6xl sm:h-52"
      :style="{ background: event.posterColor }"
    >
      <img
        v-if="event.posterImage"
        :src="event.posterImage"
        alt=""
        class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        loading="lazy"
        decoding="async"
      />
      <template v-else>
        <span class="pointer-events-none absolute inset-3 rounded-xl border border-white/45" aria-hidden="true" />
        <span class="relative">{{ event.bannerEmoji }}</span>
      </template>
    </div>
    <div class="flex flex-1 flex-col p-5">
      <div class="flex items-start justify-between gap-3">
        <p class="text-xs tracking-wide text-slate-400">{{ event.city }} · {{ formatDate(event.date) }}</p>
        <span v-if="event.promo" class="badge shrink-0">Promo</span>
      </div>
      <h3 class="mt-2 text-lg font-medium leading-snug text-slate-900 break-words">{{ event.title }}</h3>
      <p class="mt-auto pt-4 text-sm text-slate-500">ab {{ minPrice }} €</p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { EventItem } from '~/composables/useEvents'

const props = defineProps<{ event: EventItem }>()

const minPrice = computed(() =>
  Math.min(...props.event.priceCategories.map((c) => c.price))
)

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin'
  })
}
</script>

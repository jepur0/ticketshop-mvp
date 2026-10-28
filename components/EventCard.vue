<template>
  <NuxtLink :to="`/event/${event.slug}`" class="card overflow-hidden hover:shadow-md transition group">
    <div
      class="h-36 flex items-center justify-center text-5xl"
      :style="{ background: event.posterColor }"
    >
      <span>{{ event.bannerEmoji }}</span>
    </div>
    <div class="p-4">
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-semibold leading-snug text-slate-900 break-words group-hover:text-blue-700">{{ event.title }}</h3>
        <span v-if="event.promo" class="shrink-0 text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Promo</span>
      </div>
      <p class="mt-1 text-sm text-slate-500">{{ event.city }} · {{ formatDate(event.date) }}</p>
      <p class="mt-2 text-sm font-medium text-blue-800">ab {{ minPrice }} €</p>
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

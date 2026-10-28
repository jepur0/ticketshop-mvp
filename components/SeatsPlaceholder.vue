<template>
  <div class="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
    <div class="flex items-center justify-between mb-3">
      <p class="text-sm font-semibold text-slate-700">Sitzplan (seats.io Placeholder)</p>
      <span class="text-xs text-slate-400">Hold {{ holdMinutes }} Min.</span>
    </div>
    <!--
      REAL seats.io embed:
      1. Load https://cdn.seats.io/chart.js
      2. new seatsio.SeatingChart({
           divId: 'chart',
           workspaceKey: config.public.seatsWorkspaceKey,
           event: eventKey,
           onObjectSelected: (obj) => addToCart(...),
           onObjectDeselected: ...
         }).render()
      Env: NUXT_PUBLIC_SEATS_WORKSPACE_KEY
    -->
    <div
      id="chart"
      class="relative min-h-[280px] rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <p class="text-4xl">{{ emoji }}</p>
      <p class="text-sm text-slate-600 max-w-md">
        Hier erscheint der seats.io Chart (<code class="text-xs bg-slate-100 px-1 rounded">{{ chartKey || 'chartKey' }}</code> /
        Event <code class="text-xs bg-slate-100 px-1 rounded">{{ eventKey || 'eventKey' }}</code>).
      </p>
      <div v-if="categories.length" class="flex flex-wrap justify-center gap-2 mt-2">
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          class="btn-secondary !py-1.5 !px-3 text-xs"
          @click="$emit('select-category', cat)"
        >
          + {{ cat.name }} ({{ cat.price }} €)
        </button>
      </div>
      <p class="text-xs text-slate-400 mt-2">Demo: Klicke eine Kategorie, um ein Mock-Ticket in den Warenkorb zu legen.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  chartKey?: string
  eventKey?: string
  categories: { id: string; name: string; price: number }[]
  emoji?: string
  holdMinutes?: number
}>()

defineEmits<{ 'select-category': [cat: { id: string; name: string; price: number }] }>()
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
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
      class="relative flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-center sm:p-6"
    >
      <p class="text-4xl">{{ emoji }}</p>
      <p class="max-w-md text-sm text-slate-600 break-words">
        Noch kein Live-Sitzplan — Workspace Key in Admin → Settings, Event Key am Event. Chart (<code class="break-all rounded bg-slate-100 px-1 text-xs">{{ chartKey || 'chartKey' }}</code> /
        Event <code class="break-all rounded bg-slate-100 px-1 text-xs">{{ eventKey || 'eventKey' }}</code>).
      </p>
      <div v-if="categories.length" class="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          class="btn-secondary w-full sm:w-auto"
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

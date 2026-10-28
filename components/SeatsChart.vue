<template>
  <div class="rounded-xl border border-slate-200 bg-white overflow-hidden">
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
      <p class="text-sm font-semibold text-slate-700">
        Sitzplan
        <span v-if="live" class="ml-2 text-xs font-normal text-emerald-600">seats.io live</span>
        <span v-else class="ml-2 text-xs font-normal text-amber-600">Placeholder</span>
      </p>
      <span class="text-xs text-slate-400">Hold {{ holdMinutes }} Min.</span>
    </div>

    <div v-if="configHint" class="px-4 py-2 text-xs bg-amber-50 text-amber-900 border-b border-amber-100">
      {{ configHint }}
    </div>

    <div v-if="live" class="relative">
      <div :id="chartDivId" class="min-h-[360px]" />
      <div v-if="chartError" class="p-4 text-sm text-red-700 bg-red-50 space-y-2">
        <p class="font-semibold">Sitzplan konnte nicht geladen werden</p>
        <p>{{ chartError }}</p>
        <p class="text-xs text-red-600/80">
          Prüfe: Admin → Settings (Workspace Public Key + Region) und Event bearbeiten
          (echter Event Key aus seats.io, kein <code>demo-*</code>).
        </p>
        <div v-if="categories.length" class="flex flex-wrap gap-2 pt-2">
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
      </div>
      <p v-else-if="loading" class="absolute inset-0 flex items-center justify-center text-sm text-slate-400 bg-white/70">
        Chart wird geladen…
      </p>
    </div>

    <SeatsPlaceholder
      v-else
      :chart-key="chartKey"
      :event-key="eventKey"
      :categories="categories"
      :emoji="emoji"
      :hold-minutes="holdMinutes"
      @select-category="$emit('select-category', $event)"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  workspaceKey?: string | null
  region?: string
  chartKey?: string
  eventKey?: string
  categories: { id: string; name: string; price: number }[]
  emoji?: string
  holdMinutes?: number
}>()

const emit = defineEmits<{
  'select-category': [cat: { id: string; name: string; price: number }]
  'select-seat': [payload: { seatId: string; label: string; categoryId?: string; price: number }]
  'deselect-seat': [seatId: string]
  'hold-token': [token: string | null]
}>()

const chartDivId = `seats-chart-${Math.random().toString(36).slice(2, 9)}`
const loading = ref(true)
const chartError = ref('')
let chartInstance: any = null

/** Demo / empty keys must NOT trigger live seats.io (causes "chart could not be loaded"). */
function isRealKey(key?: string | null) {
  if (!key) return false
  const k = key.trim().toLowerCase()
  if (!k) return false
  if (k.startsWith('demo')) return false
  if (k.includes('placeholder') || k.includes('changeme') || k.includes('your-')) return false
  return true
}

const live = computed(
  () => !!(isRealKey(props.workspaceKey) && isRealKey(props.eventKey))
)

const configHint = computed(() => {
  if (live.value) return ''
  if (isRealKey(props.workspaceKey) && !isRealKey(props.eventKey)) {
    return 'Workspace Key ist gesetzt, aber dieses Event hat keinen echten seats.io Event Key — Placeholder aktiv. Event bearbeiten → Event Key eintragen.'
  }
  if (!isRealKey(props.workspaceKey) && isRealKey(props.eventKey)) {
    return 'Event Key vorhanden, aber Workspace Public Key fehlt → Admin → Settings → seats.io.'
  }
  return ''
})

function priceForCategory(catKey?: string, catLabel?: string, pricing?: number) {
  if (typeof pricing === 'number' && !Number.isNaN(pricing)) return pricing
  const match =
    props.categories.find((c) => c.id === catKey) ||
    props.categories.find((c) => c.name.toLowerCase() === (catLabel || '').toLowerCase())
  return match?.price ?? props.categories[0]?.price ?? 0
}

function loadScript(region: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const w = window as any
    if (w.seatsio) {
      resolve()
      return
    }
    const existing = document.querySelector('script[data-seatsio]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('seats.io script failed')))
      return
    }
    const s = document.createElement('script')
    s.src = `https://cdn-${region || 'eu'}.seatsio.net/chart.js`
    s.async = true
    s.dataset.seatsio = '1'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('seats.io CDN unreachable'))
    document.head.appendChild(s)
  })
}

async function renderChart() {
  if (!live.value || !import.meta.client) return
  loading.value = true
  chartError.value = ''
  try {
    await loadScript(props.region || 'eu')
    const seatsio = (window as any).seatsio
    if (chartInstance?.destroy) {
      try {
        chartInstance.destroy()
      } catch {
        /* ignore */
      }
    }
    chartInstance = new seatsio.SeatingChart({
      divId: chartDivId,
      workspaceKey: props.workspaceKey,
      event: props.eventKey,
      onObjectSelected: (obj: any) => {
        const seatId = obj.id || obj.label
        const label = obj.labels?.own || obj.label || seatId
        const catKey = obj.category?.key || obj.category?.label
        const price = priceForCategory(catKey, obj.category?.label, obj.pricing?.price)
        emit('select-seat', {
          seatId,
          label: String(label),
          categoryId: catKey,
          price
        })
      },
      onObjectDeselected: (obj: any) => {
        emit('deselect-seat', obj.id || obj.label)
      },
      onHoldSucceeded: (_objects: any, holdToken: string) => {
        emit('hold-token', holdToken)
      },
      onHoldTokenExpired: () => {
        emit('hold-token', null)
      },
      onChartRendered: () => {
        loading.value = false
      },
      onChartRenderingFailed: (err: any) => {
        loading.value = false
        chartError.value =
          err?.message ||
          'Ungültiger Event Key / Workspace Key oder Region. In seats.io Dashboard prüfen.'
      }
    })
    chartInstance.render()
    setTimeout(() => {
      loading.value = false
    }, 6000)
  } catch (e: any) {
    chartError.value = e?.message || 'Chart konnte nicht geladen werden'
    loading.value = false
  }
}

watch(
  () => [props.workspaceKey, props.eventKey, props.region],
  () => {
    if (live.value) nextTick(renderChart)
  }
)

onMounted(() => {
  if (live.value) renderChart()
})

onBeforeUnmount(() => {
  if (chartInstance?.destroy) {
    try {
      chartInstance.destroy()
    } catch {
      /* ignore */
    }
  }
})
</script>

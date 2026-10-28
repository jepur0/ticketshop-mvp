<template>
  <div>
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">Monitoring</h1>
        <p class="text-sm text-slate-500">Failed payments, seats.io Sync-Fehler, Holds</p>
      </div>
      <button type="button" class="btn-secondary w-full shrink-0 sm:w-auto" :disabled="busy" @click="releaseHolds">
        Unpaid Holds freigeben
      </button>
    </div>

    <div v-if="data" class="grid gap-4 lg:grid-cols-3 mb-6">
      <div class="card p-4">
        <p class="text-xs text-slate-400">Active holds</p>
        <p class="text-2xl font-bold">{{ data.holds.active }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-slate-400">Expired holds</p>
        <p class="text-2xl font-bold">{{ data.holds.expired }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-slate-400">Failed payments</p>
        <p class="text-2xl font-bold">{{ data.failedPayments.length }}</p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <section class="card p-4">
        <h2 class="font-semibold mb-3">Failed payments</h2>
        <div v-if="!data?.failedPayments?.length" class="text-sm text-slate-400">Keine Einträge.</div>
        <ul v-else class="space-y-2 text-sm max-h-96 overflow-auto">
          <li v-for="f in data.failedPayments" :key="f.id" class="border-b border-slate-100 pb-2">
            <p class="font-medium text-red-700">{{ f.reason }}</p>
            <p class="text-xs text-slate-500">
              {{ formatAt(f.at) }} · {{ f.provider }} · {{ f.email || '—' }} · {{ f.amount ?? '—' }} €
              <span v-if="f.orderId"> · {{ f.orderId }}</span>
            </p>
          </li>
        </ul>
      </section>
      <section class="card p-4">
        <h2 class="font-semibold mb-3">seats.io sync errors</h2>
        <div v-if="!data?.seatsSyncErrors?.length" class="text-sm text-slate-400">Keine Einträge.</div>
        <ul v-else class="space-y-2 text-sm max-h-96 overflow-auto">
          <li v-for="e in data.seatsSyncErrors" :key="e.id" class="border-b border-slate-100 pb-2">
            <p class="font-medium">{{ e.action }} <span class="text-slate-400">{{ e.eventId }}</span></p>
            <p class="text-xs text-red-600 break-all">{{ e.message }}</p>
            <p class="text-xs text-slate-400">{{ formatAt(e.at) }}</p>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { data, refresh } = await useFetch('/api/admin/monitoring')
const busy = ref(false)

function formatAt(iso: string) {
  return new Date(iso).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })
}

async function releaseHolds() {
  busy.value = true
  try {
    await $fetch('/api/holds/release-expired', { method: 'POST', body: { forceAll: true } })
    await refresh()
  } finally {
    busy.value = false
  }
}
</script>

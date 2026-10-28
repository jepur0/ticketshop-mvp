<template>
  <div>
    <p class="eyebrow">Übersicht</p>
    <h1 class="page-title mt-2 mb-6">Dashboard</h1>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <div v-for="s in stats" :key="s.label" class="card p-5">
        <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{{ s.label }}</p>
        <p class="mt-2 font-display text-2xl font-medium text-ink">{{ s.value }}</p>
      </div>
    </div>

    <div class="card p-4 mb-8 text-sm text-ink-soft flex flex-wrap gap-3 items-center">
      <span class="font-medium text-ink">Schnellzugriff:</span>
      <NuxtLink to="/admin/settings" class="link">Settings (API keys)</NuxtLink>
      <NuxtLink to="/admin/monitoring" class="link">Monitoring</NuxtLink>
      <NuxtLink to="/admin/scanner" class="link">Scanner</NuxtLink>
      <NuxtLink to="/admin/payouts" class="link">Payouts</NuxtLink>
    </div>

    <h2 class="text-lg font-semibold mb-3">Ops-Tools</h2>
    <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 mb-8">
      <button
        v-for="op in ops"
        :key="op"
        type="button"
        class="card px-4 py-3 text-left text-sm hover:border-gold/40 hover:bg-gold/5 transition"
        @click="runOp(op)"
      >
        {{ op }}
        <span class="block text-xs text-ink-muted mt-0.5">{{ op.includes('Release') || op.includes('expired') ? 'Live' : 'Stub' }}</span>
      </button>
    </div>
    <p v-if="opMsg" class="text-sm text-emerald-700 mb-4">{{ opMsg }}</p>

    <h2 class="text-lg font-semibold mb-3">Letzte Bestellungen</h2>
    <div class="space-y-3 md:hidden">
      <article v-for="o in recentOrders" :key="o.id" class="card space-y-1 p-4 text-sm">
        <div class="flex items-start justify-between gap-3">
          <p class="font-mono text-xs break-all">{{ o.id }}</p>
          <StatusBadge :status="o.status" />
        </div>
        <p class="break-words">{{ o.eventTitle }}</p>
        <p>{{ o.customer?.name }}</p>
        <p class="text-right font-medium">{{ o.total }} €</p>
      </article>
    </div>
    <div class="card hidden overflow-x-auto md:block">
      <table class="w-full text-sm">
        <thead class="table-head">
          <tr>
            <th class="px-4 py-2">ID</th>
            <th class="px-4 py-2">Event</th>
            <th class="px-4 py-2">Kunde</th>
            <th class="px-4 py-2">Status</th>
            <th class="px-4 py-2 text-right">Summe</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in recentOrders" :key="o.id" class="border-t border-line">
            <td class="px-4 py-2 font-mono text-xs">{{ o.id }}</td>
            <td class="px-4 py-2">{{ o.eventTitle }}</td>
            <td class="px-4 py-2">{{ o.customer?.name }}</td>
            <td class="px-4 py-2"><StatusBadge :status="o.status" /></td>
            <td class="px-4 py-2 text-right font-medium">{{ o.total }} €</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { events } = useEvents()
const { data: ordersData, refresh } = await useFetch('/api/admin/orders')
const recentOrders = computed(() => ((ordersData.value as any)?.orders || []).slice(0, 8))

const stats = computed(() => {
  const orders = (ordersData.value as any)?.orders || []
  const paid = orders.filter((o: any) => o.status === 'paid')
  return [
    { label: 'Events aktiv', value: events.value.filter((e) => e.active).length },
    { label: 'Bestellungen', value: orders.length },
    { label: 'Umsatz', value: `${paid.reduce((s: number, o: any) => s + (o.total || 0), 0)} €` },
    { label: 'Tickets verkauft (seed)', value: events.value.reduce((s, e) => s + e.sold, 0) }
  ]
})

const ops = [
  'Find / Release booked but not paid',
  'Mark expired & release seats',
  'Check duplicate seats',
  'Generate payspot tickets from PDF',
  'Rebook paid orders',
  'Optimize DB',
  'Send event reminder',
  'Send daily report to clients',
  'Sync OTP VPOS and seats.io',
  'Optimize tickets'
]

const opMsg = ref('')
async function runOp(name: string) {
  if (name.includes('Release') || name.includes('expired')) {
    const res = await $fetch<any>('/api/holds/release-expired', {
      method: 'POST',
      body: { forceAll: name.includes('Release') }
    })
    opMsg.value = `✓ Holds: expired=${res.expired}, forced=${res.forced}`
    await refresh()
    return
  }
  opMsg.value = `✓ „${name}“ ausgeführt (Demo-Stub).`
}
</script>

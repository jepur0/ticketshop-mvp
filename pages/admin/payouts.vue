<template>
  <div>
    <h1 class="mb-1 text-3xl font-semibold">Payouts</h1>
    <p class="text-sm text-slate-500 mb-4">{{ data?.note }}</p>

    <div v-if="data?.connect" class="card p-4 mb-6 text-sm">
      <p class="font-medium mb-1">Stripe Connect</p>
      <p class="break-words text-slate-600">
        Status:
        <strong :class="data.connect.enabled ? 'text-emerald-700' : 'text-slate-500'">
          {{ data.connect.enabled ? 'enabled (skeleton)' : 'off' }}
        </strong>
        · Platform: <code class="break-all text-xs">{{ data.connect.platformAccountId || '—' }}</code>
        · Connected: <code class="break-all text-xs">{{ data.connect.connectedAccountId || '—' }}</code>
      </p>
      <p class="text-xs text-slate-400 mt-2">Configure IDs under Admin → Settings → Stripe Connect.</p>
    </div>

    <div v-if="data" class="grid sm:grid-cols-4 gap-3 mb-6">
      <div class="card p-4">
        <p class="text-xs text-slate-400">Gross</p>
        <p class="text-xl font-bold">{{ data.gross }} {{ data.currency?.toUpperCase() }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-slate-400">Platform ({{ data.commissionPercent }}%)</p>
        <p class="text-xl font-bold">{{ data.platformShare ?? data.commission }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-slate-400">Organizer net</p>
        <p class="text-xl font-bold text-emerald-700">{{ data.organizerShare ?? data.net }}</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-slate-400">Paid orders</p>
        <p class="text-xl font-bold">{{ data.ordersCount }}</p>
      </div>
    </div>

    <div class="space-y-3 md:hidden">
      <article v-for="r in data?.rows || []" :key="r.orderId" class="card space-y-1 p-4 text-sm">
        <p class="font-mono text-xs break-all">{{ r.orderId }}</p>
        <p class="font-medium break-words">{{ r.eventTitle }}</p>
        <p>Total {{ r.total }} · Platform {{ r.commission }} · Organizer {{ r.organizer }}</p>
        <p class="text-xs text-slate-500">{{ formatAt(r.createdAt) }}</p>
      </article>
      <p v-if="!data?.rows?.length" class="card p-6 text-center text-sm text-slate-400">Noch keine bezahlten Orders.</p>
    </div>
    <div class="card hidden overflow-x-auto md:block">
      <table class="min-w-full text-sm">
        <thead class="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th class="px-4 py-2">Order</th>
            <th class="px-4 py-2">Event</th>
            <th class="px-4 py-2">Total</th>
            <th class="px-4 py-2">Platform</th>
            <th class="px-4 py-2">Organizer</th>
            <th class="px-4 py-2">When</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in data?.rows || []" :key="r.orderId" class="border-t border-slate-100">
            <td class="px-4 py-2 font-mono text-xs">{{ r.orderId }}</td>
            <td class="px-4 py-2">{{ r.eventTitle }}</td>
            <td class="px-4 py-2">{{ r.total }}</td>
            <td class="px-4 py-2">{{ r.commission }}</td>
            <td class="px-4 py-2">{{ r.organizer }}</td>
            <td class="px-4 py-2 text-xs text-slate-500">{{ formatAt(r.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!data?.rows?.length" class="p-6 text-sm text-slate-400 text-center">Noch keine bezahlten Orders.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const { data } = await useFetch('/api/admin/payouts')
function formatAt(iso: string) {
  return new Date(iso).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })
}
</script>

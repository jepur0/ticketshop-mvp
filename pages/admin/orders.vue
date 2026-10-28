<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Orders</h1>
      <button type="button" class="btn-secondary !text-xs" @click="refresh()">Aktualisieren</button>
    </div>
    <div class="card overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th class="px-4 py-2">ID</th>
            <th class="px-4 py-2">Datum</th>
            <th class="px-4 py-2">Event</th>
            <th class="px-4 py-2">Kunde</th>
            <th class="px-4 py-2">Payment</th>
            <th class="px-4 py-2">Status</th>
            <th class="px-4 py-2 text-right">Summe</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in list" :key="o.id" class="border-t border-slate-100">
            <td class="px-4 py-2 font-mono text-xs">{{ o.id }}</td>
            <td class="px-4 py-2 text-xs whitespace-nowrap">{{ formatDate(o.createdAt) }}</td>
            <td class="px-4 py-2">{{ o.eventTitle }}</td>
            <td class="px-4 py-2">
              <p>{{ o.customer?.name }}</p>
              <p class="text-xs text-slate-400">{{ o.customer?.email }}</p>
            </td>
            <td class="px-4 py-2 text-xs">{{ o.payment }}</td>
            <td class="px-4 py-2"><StatusBadge :status="o.status" /></td>
            <td class="px-4 py-2 text-right font-medium">{{ o.total }} €</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!list.length" class="p-6 text-center text-sm text-slate-400">Keine Orders.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const { data, refresh } = await useFetch('/api/admin/orders')
const list = computed(() => (data.value as any)?.orders || [])
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Berlin'
  })
}
</script>

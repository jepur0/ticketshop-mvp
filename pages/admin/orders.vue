<template>
  <div>
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-3xl font-semibold">Orders</h1>
      <button type="button" class="btn-secondary w-full sm:w-auto" @click="refresh()">Aktualisieren</button>
    </div>
    <div class="space-y-3 md:hidden">
      <article v-for="o in list" :key="o.id" class="card space-y-1 p-4 text-sm">
        <div class="flex items-start justify-between gap-3">
          <p class="font-mono text-xs break-all">{{ o.id }}</p>
          <StatusBadge :status="o.status" />
        </div>
        <p class="font-medium break-words">{{ o.eventTitle }}</p>
        <p>{{ o.customer?.name }}</p>
        <p class="break-all text-slate-400">{{ o.customer?.email }}</p>
        <p class="text-slate-500">{{ formatDate(o.createdAt) }} · {{ o.payment }}</p>
        <p class="font-medium">{{ o.total }} €</p>
      </article>
      <p v-if="!list.length" class="card p-6 text-center text-sm text-slate-400">Keine Orders.</p>
    </div>
    <div class="card hidden overflow-x-auto md:block">
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

<template>
  <div>
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="font-display text-3xl font-semibold">Käufer</h1>
        <p class="text-sm text-ink-muted">Aus bezahlten und offenen Bestellungen.</p>
      </div>
      <a href="/api/admin/buyers/export" class="btn-secondary w-full sm:w-auto">CSV exportieren</a>
    </div>
    <input v-model="q" type="search" class="input mb-4 max-w-md" placeholder="Name oder E-Mail suchen" @input="load" />
    <p v-if="error" class="mb-3 text-sm text-red-700">{{ error }}</p>
    <div class="card overflow-x-auto">
      <table class="w-full min-w-[640px] text-sm">
        <thead class="table-head">
          <tr>
            <th class="px-4 py-2">Name</th>
            <th class="px-4 py-2">E-Mail</th>
            <th class="px-4 py-2">Bestellungen</th>
            <th class="px-4 py-2">Umsatz</th>
            <th class="px-4 py-2">Letzte Bestellung</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="b in buyers"
            :key="b.email"
            class="cursor-pointer border-t border-line hover:bg-gold/5"
            @click="open(b.email)"
          >
            <td class="px-4 py-3 font-medium">{{ b.name }}</td>
            <td class="px-4 py-3 break-all">{{ b.email }}</td>
            <td class="px-4 py-3 tabular-nums">{{ b.orders }}</td>
            <td class="px-4 py-3 tabular-nums">{{ b.spent }} €</td>
            <td class="px-4 py-3 text-xs">{{ formatAt(b.lastOrder) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!buyers.length" class="p-6 text-center text-sm text-ink-muted">Keine Käufer.</p>
    </div>

    <section v-if="detail" class="card mt-6 p-5">
      <div class="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 class="font-display text-2xl font-semibold">{{ detail.name }}</h2>
          <p class="text-sm text-ink-muted break-all">{{ detail.email }}</p>
        </div>
        <button type="button" class="btn-secondary !min-h-9" @click="detail = null">Schließen</button>
      </div>
      <h3 class="mb-2 text-sm font-semibold">Bestellungen</h3>
      <ul class="mb-5 space-y-2 text-sm">
        <li v-for="o in detail.orders" :key="o.id" class="rounded-xl border border-line px-3 py-2">
          <span class="font-mono text-xs">{{ o.id }}</span>
          · {{ o.eventTitle }} · {{ o.status }} · {{ o.total }} €
          <span class="text-ink-muted"> · {{ formatAt(o.createdAt) }}</span>
        </li>
        <li v-if="!detail.orders.length" class="text-ink-muted">Keine Bestellungen.</li>
      </ul>
      <h3 class="mb-2 text-sm font-semibold">Tickets</h3>
      <ul class="space-y-2 text-sm">
        <li v-for="t in detail.tickets" :key="t.code" class="rounded-xl border border-line px-3 py-2">
          <span class="font-mono text-xs">{{ t.code }}</span>
          · {{ t.eventTitle }} · {{ t.label }} · {{ t.status }}
        </li>
        <li v-if="!detail.tickets.length" class="text-ink-muted">Keine Tickets.</li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const q = ref('')
const buyers = ref<any[]>([])
const detail = ref<any>(null)
const error = ref('')

async function load() {
  error.value = ''
  try {
    buyers.value = await $fetch('/api/admin/buyers', { query: { q: q.value } })
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Käufer konnten nicht geladen werden'
  }
}

async function open(email: string) {
  detail.value = await $fetch(`/api/admin/buyers/${encodeURIComponent(email)}`)
}

function formatAt(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })
}

await load()
</script>

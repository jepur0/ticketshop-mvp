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

    <section class="mb-8">
      <h2 class="mb-3 font-display text-2xl font-semibold">Pro Veranstalter</h2>
      <p class="mb-4 text-sm text-ink-muted">Umsatz bezahlter Bestellungen minus Gebühr. „Als bezahlt markieren“ bucht kein Geld, nur den Verlauf.</p>
      <div class="mb-4 grid gap-3 md:grid-cols-2">
        <article v-for="c in data?.clients || []" :key="c.id" class="card p-4 text-sm">
          <p class="font-semibold">{{ c.name }}</p>
          <p class="mt-1 text-ink-muted">Umsatz {{ c.sales }} € · Gebühr {{ c.feePercent }} % ({{ c.fee }} €)</p>
          <p>Anspruch {{ c.owed }} € · schon markiert {{ c.paid }} € · offen <strong>{{ c.open }} €</strong></p>
        </article>
        <p v-if="!data?.clients?.length" class="text-sm text-ink-muted">Lege zuerst Veranstalter unter Kunden an.</p>
      </div>
      <form v-if="isAdmin" class="card grid gap-3 p-4 sm:grid-cols-2" @submit.prevent="markPaid">
        <div>
          <label class="label">Veranstalter</label>
          <select v-model="pay.clientId" required class="input">
            <option value="">Wählen</option>
            <option v-for="c in data?.clients || []" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="label">Betrag €</label>
          <input v-model.number="pay.amount" required type="number" min="0.01" step="0.01" class="input" />
        </div>
        <div>
          <label class="label">Datum</label>
          <input v-model="pay.paidAt" type="date" class="input" />
        </div>
        <div>
          <label class="label">Notiz</label>
          <input v-model="pay.note" class="input" />
        </div>
        <button class="btn-primary sm:col-span-2" type="submit">Als bezahlt markieren</button>
      </form>
      <h3 class="mb-2 mt-6 text-sm font-semibold">Verlauf</h3>
      <ul class="space-y-2 text-sm">
        <li v-for="h in data?.history || []" :key="h.id" class="card px-4 py-3">
          {{ h.paidAt }} · {{ h.clientName }} · {{ h.amount }} €
          <span v-if="h.note" class="text-ink-muted"> · {{ h.note }}</span>
        </li>
        <li v-if="!data?.history?.length" class="text-ink-muted">Noch keine markierten Auszahlungen.</li>
      </ul>
    </section>

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
const { data, refresh } = await useFetch('/api/admin/payouts')
const { isAdmin } = useAuth()
const pay = reactive({ clientId: '', amount: 0, paidAt: '', note: '' })
async function markPaid() {
  await $fetch('/api/admin/payouts', { method: 'POST', body: { ...pay } })
  pay.amount = 0
  pay.note = ''
  await refresh()
}
function formatAt(iso: string) {
  return new Date(iso).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })
}
</script>

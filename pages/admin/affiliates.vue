<template>
  <div>
    <h1 class="mb-1 font-display text-3xl font-semibold">Affiliates</h1>
    <p class="mb-6 text-sm text-ink-muted">Empfehlungslink mit ?ref= wird an der Bestellung gespeichert. Keine Auszahlung, nur Bericht.</p>
    <form class="card mb-6 grid gap-3 p-5 sm:grid-cols-2" @submit.prevent="save">
      <div>
        <label class="label">Name</label>
        <input v-model="form.name" class="input" />
      </div>
      <div>
        <label class="label">Code *</label>
        <input v-model="form.code" required class="input font-mono" />
      </div>
      <div>
        <label class="label">Provision %</label>
        <input v-model.number="form.commissionPercent" type="number" min="0" max="100" step="0.1" class="input" />
      </div>
      <div class="flex items-end gap-2">
        <button class="btn-primary" type="submit">{{ form.id ? 'Speichern' : 'Anlegen' }}</button>
        <button v-if="form.id" class="btn-secondary" type="button" @click="reset">Abbrechen</button>
      </div>
    </form>
    <article v-for="a in list" :key="a.id" class="card mb-3 p-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <p class="font-semibold">{{ a.name || a.code }}</p>
          <p class="break-all text-sm text-ink-muted">{{ origin }}/?ref={{ a.code }} · {{ a.commissionPercent || 0 }} %</p>
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn-secondary !min-h-9" @click="edit(a)">Bearbeiten</button>
          <button type="button" class="btn-danger" @click="remove(a.id)">Löschen</button>
        </div>
      </div>
    </article>
    <h2 class="mb-3 mt-8 font-display text-2xl font-semibold">Provision</h2>
    <div class="card overflow-x-auto">
      <table class="w-full min-w-[520px] text-sm">
        <thead class="table-head">
          <tr>
            <th class="px-4 py-2">Name</th>
            <th class="px-4 py-2">Bestellungen</th>
            <th class="px-4 py-2">Umsatz</th>
            <th class="px-4 py-2">Provision</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in report" :key="r.id" class="border-t border-line">
            <td class="px-4 py-3">{{ r.name || r.code }}</td>
            <td class="px-4 py-3 tabular-nums">{{ r.orders }}</td>
            <td class="px-4 py-3 tabular-nums">{{ r.sales }} €</td>
            <td class="px-4 py-3 tabular-nums">{{ r.commission }} €</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!report.length" class="p-6 text-center text-sm text-ink-muted">Noch keine Affiliates.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const list = ref<any[]>([])
const report = ref<any[]>([])
const origin = ref('')
const empty = () => ({ id: '', name: '', code: '', commissionPercent: 10 })
const form = reactive(empty())
async function load() {
  list.value = await $fetch('/api/admin/records/affiliates')
  report.value = await $fetch('/api/admin/affiliates/report')
}
function edit(a: any) {
  Object.assign(form, empty(), a)
}
function reset() {
  Object.assign(form, empty())
}
async function save() {
  await $fetch('/api/admin/records/affiliates', {
    method: 'PUT',
    body: { ...form, id: form.id || undefined, code: form.code.trim() }
  })
  reset()
  await load()
}
async function remove(id: string) {
  if (!confirm('Affiliate löschen?')) return
  await $fetch(`/api/admin/records/affiliates/${id}`, { method: 'DELETE' })
  await load()
}
onMounted(() => {
  origin.value = window.location.origin
})
await load()
</script>

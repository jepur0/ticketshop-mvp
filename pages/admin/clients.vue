<template>
  <div>
    <h1 class="mb-1 font-display text-3xl font-semibold">Veranstalter</h1>
    <p class="mb-6 text-sm text-ink-muted">Organizer. Das Event-Formular übernimmt den Namen als Veranstalter.</p>
    <form class="card mb-6 grid gap-3 p-5 sm:grid-cols-2" @submit.prevent="save">
      <div>
        <label class="label">Name *</label>
        <input v-model="form.name" required class="input" />
      </div>
      <div>
        <label class="label">Ansprechpartner</label>
        <input v-model="form.contact" class="input" />
      </div>
      <div>
        <label class="label">E-Mail</label>
        <input v-model="form.email" type="email" class="input" />
      </div>
      <div>
        <label class="label">Telefon</label>
        <input v-model="form.phone" class="input" />
      </div>
      <div>
        <label class="label">IBAN</label>
        <input v-model="form.iban" class="input font-mono text-xs" />
      </div>
      <div>
        <label class="label">Gebühr %</label>
        <input v-model.number="form.feePercent" type="number" min="0" max="100" step="0.1" class="input" />
      </div>
      <div class="flex gap-2 sm:col-span-2">
        <button class="btn-primary" type="submit">{{ form.id ? 'Speichern' : 'Anlegen' }}</button>
        <button v-if="form.id" class="btn-secondary" type="button" @click="reset">Abbrechen</button>
      </div>
    </form>
    <div class="space-y-3">
      <article v-for="c in list" :key="c.id" class="card p-4">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="font-semibold">{{ c.name }}</p>
            <p class="text-sm text-ink-muted">{{ c.contact }} · {{ c.email }} · {{ c.phone }} · {{ c.feePercent || 0 }} %</p>
            <p v-if="c.iban" class="font-mono text-xs text-ink-muted">{{ c.iban }}</p>
          </div>
          <div class="flex gap-2">
            <button type="button" class="btn-secondary !min-h-9" @click="edit(c)">Bearbeiten</button>
            <button type="button" class="btn-danger" @click="remove(c.id)">Löschen</button>
          </div>
        </div>
      </article>
      <p v-if="!list.length" class="text-sm text-ink-muted">Noch keine Veranstalter.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const list = ref<any[]>([])
const empty = () => ({ id: '', name: '', contact: '', email: '', phone: '', iban: '', feePercent: 10 })
const form = reactive(empty())
async function load() {
  list.value = await $fetch('/api/admin/records/clients')
}
function edit(c: any) {
  Object.assign(form, empty(), c)
}
function reset() {
  Object.assign(form, empty())
}
async function save() {
  await $fetch('/api/admin/records/clients', { method: 'PUT', body: { ...form, id: form.id || undefined } })
  reset()
  await load()
}
async function remove(id: string) {
  if (!confirm('Veranstalter löschen?')) return
  await $fetch(`/api/admin/records/clients/${id}`, { method: 'DELETE' })
  await load()
}
await load()
</script>

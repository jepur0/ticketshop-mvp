<template>
  <div>
    <h1 class="mb-1 font-display text-3xl font-semibold">Marketing</h1>
    <p class="mb-6 text-sm text-ink-muted">Promo-Codes werden an der Kasse geprüft.</p>
    <form class="card mb-6 grid gap-3 p-5 sm:grid-cols-2" @submit.prevent="save">
      <div>
        <label class="label">Code *</label>
        <input v-model="form.code" required class="input font-mono uppercase" />
      </div>
      <div>
        <label class="label">Art</label>
        <select v-model="form.kind" class="input">
          <option value="percent">Prozent</option>
          <option value="fixed">Fester Betrag €</option>
        </select>
      </div>
      <div>
        <label class="label">Wert</label>
        <input v-model.number="form.amount" type="number" min="0" step="0.01" class="input" />
      </div>
      <div>
        <label class="label">Nutzungslimit (0 = unbegrenzt)</label>
        <input v-model.number="form.usageLimit" type="number" min="0" class="input" />
      </div>
      <div>
        <label class="label">Gültig von</label>
        <input v-model="form.validFrom" type="date" class="input" />
      </div>
      <div>
        <label class="label">Gültig bis</label>
        <input v-model="form.validUntil" type="date" class="input" />
      </div>
      <div class="sm:col-span-2">
        <label class="label">Nur Event (optional)</label>
        <select v-model="form.eventId" class="input">
          <option value="">Alle Events</option>
          <option v-for="e in events" :key="e.id" :value="e.id">{{ e.title }}</option>
        </select>
      </div>
      <div class="flex gap-2 sm:col-span-2">
        <button class="btn-primary" type="submit">{{ form.id ? 'Speichern' : 'Anlegen' }}</button>
        <button v-if="form.id" class="btn-secondary" type="button" @click="reset">Abbrechen</button>
      </div>
    </form>
    <article v-for="p in list" :key="p.id" class="card mb-3 p-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="font-mono font-semibold">{{ p.code }}</p>
          <p class="text-sm text-ink-muted">
            {{ p.kind === 'percent' ? p.amount + ' %' : p.amount + ' €' }}
            · {{ p.validFrom || 'sofort' }} – {{ p.validUntil || 'offen' }}
            · Limit {{ p.usageLimit || '∞' }}
          </p>
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn-secondary !min-h-9" @click="edit(p)">Bearbeiten</button>
          <button type="button" class="btn-danger" @click="remove(p.id)">Löschen</button>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const { events, loadFromApi } = useEvents()
await loadFromApi()
const list = ref<any[]>([])
const empty = () => ({ id: '', code: '', kind: 'percent', amount: 10, validFrom: '', validUntil: '', usageLimit: 0, eventId: '' })
const form = reactive(empty())
async function load() {
  list.value = await $fetch('/api/admin/records/promos')
}
function edit(p: any) {
  Object.assign(form, empty(), p)
}
function reset() {
  Object.assign(form, empty())
}
async function save() {
  await $fetch('/api/admin/records/promos', {
    method: 'PUT',
    body: { ...form, id: form.id || undefined, code: form.code.trim().toUpperCase() }
  })
  reset()
  await load()
}
async function remove(id: string) {
  if (!confirm('Code löschen?')) return
  await $fetch(`/api/admin/records/promos/${id}`, { method: 'DELETE' })
  await load()
}
await load()
</script>

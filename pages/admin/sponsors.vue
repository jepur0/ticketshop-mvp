<template>
  <div>
    <h1 class="mb-1 font-display text-3xl font-semibold">Sponsoren</h1>
    <p class="mb-6 text-sm text-ink-muted">Ohne Event-Zuordnung erscheint der Sponsor auf jeder Eventseite.</p>
    <form class="card mb-6 grid gap-3 p-5 sm:grid-cols-2" @submit.prevent="save">
      <div>
        <label class="label">Name *</label>
        <input v-model="form.name" required class="input" />
      </div>
      <div>
        <label class="label">Link</label>
        <input v-model="form.link" type="url" class="input" placeholder="https://…" />
      </div>
      <div class="sm:col-span-2">
        <label class="label">Logo-URL</label>
        <input v-model="form.logoUrl" type="url" class="input" placeholder="https://…" />
      </div>
      <div class="sm:col-span-2">
        <label class="label">Event</label>
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
    <article v-for="s in list" :key="s.id" class="card mb-3 flex items-center gap-3 p-4">
      <img v-if="s.logoUrl" :src="s.logoUrl" alt="" class="h-12 w-12 rounded-lg object-contain" />
      <div class="min-w-0 flex-1">
        <p class="font-semibold">{{ s.name }}</p>
        <p class="truncate text-sm text-ink-muted">{{ s.link || 'kein Link' }}</p>
      </div>
      <button type="button" class="btn-secondary !min-h-9" @click="edit(s)">Bearbeiten</button>
      <button type="button" class="btn-danger" @click="remove(s.id)">Löschen</button>
    </article>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const { events, loadFromApi } = useEvents()
await loadFromApi()
const list = ref<any[]>([])
const empty = () => ({ id: '', name: '', logoUrl: '', link: '', eventId: '' })
const form = reactive(empty())
async function load() {
  list.value = await $fetch('/api/admin/records/sponsors')
}
function edit(s: any) {
  Object.assign(form, empty(), s)
}
function reset() {
  Object.assign(form, empty())
}
async function save() {
  await $fetch('/api/admin/records/sponsors', { method: 'PUT', body: { ...form, id: form.id || undefined } })
  reset()
  await load()
}
async function remove(id: string) {
  if (!confirm('Sponsor löschen?')) return
  await $fetch(`/api/admin/records/sponsors/${id}`, { method: 'DELETE' })
  await load()
}
await load()
</script>

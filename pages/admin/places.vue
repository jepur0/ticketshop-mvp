<template>
  <div>
    <h1 class="mb-1 font-display text-3xl font-semibold">Orte</h1>
    <p class="mb-6 text-sm text-ink-muted">Venues. Das Event-Formular kann sie als Venue wählen.</p>
    <form class="card mb-6 grid gap-3 p-5 sm:grid-cols-2" @submit.prevent="save">
      <div class="sm:col-span-2">
        <label class="label">Name *</label>
        <input v-model="form.name" required class="input" />
      </div>
      <div class="sm:col-span-2">
        <label class="label">Adresse</label>
        <input v-model="form.address" class="input" />
      </div>
      <div>
        <label class="label">Stadt</label>
        <input v-model="form.city" class="input" />
      </div>
      <div>
        <label class="label">Kapazität</label>
        <input v-model.number="form.capacity" type="number" min="0" class="input" />
      </div>
      <div>
        <label class="label">seats.io Event Key</label>
        <input v-model="form.seatsEventKey" class="input font-mono text-xs" />
      </div>
      <div>
        <label class="label">seats.io Chart Key</label>
        <input v-model="form.seatsChartKey" class="input font-mono text-xs" />
      </div>
      <div class="sm:col-span-2">
        <label class="label">Bild-URL</label>
        <input v-model="form.imageUrl" type="url" class="input" placeholder="https://…" />
      </div>
      <div class="flex gap-2 sm:col-span-2">
        <button class="btn-primary" type="submit">{{ form.id ? 'Speichern' : 'Anlegen' }}</button>
        <button v-if="form.id" class="btn-secondary" type="button" @click="reset">Abbrechen</button>
      </div>
    </form>
    <div class="space-y-3">
      <article v-for="p in list" :key="p.id" class="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <img v-if="p.imageUrl" :src="p.imageUrl" alt="" class="h-16 w-16 rounded-xl object-cover" />
        <div class="min-w-0 flex-1">
          <p class="font-semibold">{{ p.name }}</p>
          <p class="text-sm text-ink-muted">{{ p.city }} · {{ p.address || 'keine Adresse' }} · {{ p.capacity || 0 }} Plätze</p>
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn-secondary !min-h-9" @click="edit(p)">Bearbeiten</button>
          <button type="button" class="btn-danger" @click="remove(p.id)">Löschen</button>
        </div>
      </article>
      <p v-if="!list.length" class="text-sm text-ink-muted">Noch keine Orte.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const list = ref<any[]>([])
const empty = () => ({ id: '', name: '', address: '', city: '', capacity: 0, seatsEventKey: '', seatsChartKey: '', imageUrl: '' })
const form = reactive(empty())

async function load() {
  list.value = await $fetch('/api/admin/records/places')
}
function edit(p: any) {
  Object.assign(form, empty(), p)
}
function reset() {
  Object.assign(form, empty())
}
async function save() {
  await $fetch('/api/admin/records/places', { method: 'PUT', body: { ...form, id: form.id || undefined } })
  reset()
  await load()
}
async function remove(id: string) {
  if (!confirm('Ort löschen?')) return
  await $fetch(`/api/admin/records/places/${id}`, { method: 'DELETE' })
  await load()
}
await load()
</script>

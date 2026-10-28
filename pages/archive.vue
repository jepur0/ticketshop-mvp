<template>
  <div class="mx-auto max-w-6xl px-4 py-10">
    <h1 class="text-2xl font-bold mb-6">Alle Events</h1>
    <div class="flex flex-wrap gap-3 mb-8">
      <select v-model="city" class="input !w-auto">
        <option value="">Alle Städte</option>
        <option v-for="c in cities()" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="tag" class="input !w-auto">
        <option value="">Alle Tags</option>
        <option v-for="t in allTags" :key="t" :value="t">{{ t }}</option>
      </select>
      <label class="flex items-center gap-2 text-sm text-slate-600">
        <input v-model="onlyActive" type="checkbox" class="rounded" />
        Nur aktive
      </label>
    </div>
    <div v-if="filtered.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <EventCard v-for="e in filtered" :key="e.id" :event="e" />
    </div>
    <p v-else class="text-slate-500">Keine Events gefunden.</p>
  </div>
</template>

<script setup lang="ts">
const { events, cities } = useEvents()
const city = ref('')
const tag = ref('')
const onlyActive = ref(true)

const allTags = computed(() =>
  [...new Set(events.value.flatMap((e) => e.tags))].sort()
)

const filtered = computed(() =>
  events.value.filter((e) => {
    if (onlyActive.value && !e.active) return false
    if (city.value && e.city !== city.value) return false
    if (tag.value && !e.tags.includes(tag.value)) return false
    return true
  })
)
</script>

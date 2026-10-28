<template>
  <EventForm v-if="event" mode="edit" :event="event" />
  <p v-else class="text-slate-500">Event nicht gefunden.</p>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const { byId } = useEvents()
const event = computed(() => byId(String(route.params.id)))
</script>

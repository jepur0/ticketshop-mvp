<template>
  <div v-if="event">
    <div class="mb-6">
      <NuxtLink to="/admin/events" class="link text-sm">← Events</NuxtLink>
      <h1 class="mt-3 break-words text-3xl font-semibold">Event manager — {{ event.title }}</h1>
      <p class="text-sm text-slate-500">Ops für dieses Event (Stubs)</p>
    </div>
    <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <button
        v-for="op in ops"
        :key="op"
        type="button"
        class="card px-4 py-3 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:shadow-md"
        @click="msg = `✓ ${op} @ ${event.title} (stub)`"
      >
        {{ op }}
      </button>
    </div>
    <p v-if="msg" class="mt-4 text-sm text-emerald-700">{{ msg }}</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()
const { byId } = useEvents()
const event = computed(() => byId(String(route.params.id)))
const msg = ref('')
const ops = [
  'Check duplicate seats',
  'Find / Release booked but not paid',
  'Rebook paid orders',
  'Mark expired & release seats',
  'Sync OTP VPOS and seats.io',
  'Send event reminder',
  'Export QR codes',
  'Tickets scanned'
]
</script>

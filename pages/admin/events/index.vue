<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-bold">Events</h1>
        <p class="text-sm text-slate-500">Combined (Chart) vs Simple (ohne Chart)</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/admin/events/new?type=combined" class="btn-primary !text-xs">+ Combined Event</NuxtLink>
        <NuxtLink to="/admin/events/new?type=simple" class="btn-secondary !text-xs">+ Simple Event</NuxtLink>
        <button type="button" class="btn-secondary !text-xs" @click="toast('GATEWAY REPORT (stub)')">GATEWAY REPORT</button>
        <button type="button" class="btn-secondary !text-xs" @click="toast('BULK REPORT (stub)')">BULK REPORT</button>
      </div>
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="from" type="date" class="input !w-auto" />
      <span class="self-center text-slate-400">–</span>
      <input v-model="to" type="date" class="input !w-auto" />
      <input v-model="q" type="search" placeholder="Titel / Stadt…" class="input !w-48" />
    </div>
    <p v-if="msg" class="text-sm text-emerald-700 mb-3">{{ msg }}</p>

    <div class="card overflow-x-auto">
      <table class="w-full text-sm min-w-[900px]">
        <thead class="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th class="px-3 py-2">Active</th>
            <th class="px-3 py-2">Poster</th>
            <th class="px-3 py-2">Title</th>
            <th class="px-3 py-2">Date</th>
            <th class="px-3 py-2">Promo</th>
            <th class="px-3 py-2">Organizer</th>
            <th class="px-3 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in filtered" :key="e.id" class="border-t border-slate-100 align-middle">
            <td class="px-3 py-2">
              <button
                type="button"
                class="relative inline-flex h-5 w-9 items-center rounded-full transition"
                :class="e.active ? 'bg-emerald-500' : 'bg-slate-300'"
                @click="toggleActive(e.id)"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition"
                  :class="e.active ? 'translate-x-4' : 'translate-x-0.5'"
                />
              </button>
            </td>
            <td class="px-3 py-2">
              <div
                class="h-10 w-10 rounded flex items-center justify-center text-lg"
                :style="{ background: e.posterColor }"
              >{{ e.bannerEmoji }}</div>
            </td>
            <td class="px-3 py-2">
              <p class="font-medium">{{ e.title }}</p>
              <p class="text-xs text-slate-400">
                {{ e.city }} ·
                <span :class="e.type === 'combined' ? 'text-blue-600' : 'text-slate-500'">
                  {{ e.type === 'combined' ? 'Combined' : 'Simple' }}
                </span>
              </p>
            </td>
            <td class="px-3 py-2 whitespace-nowrap text-xs">{{ formatDate(e.date) }}</td>
            <td class="px-3 py-2">
              <span v-if="e.promo" class="text-xs font-bold text-amber-700">PROMO</span>
              <span v-else class="text-xs text-slate-300">—</span>
            </td>
            <td class="px-3 py-2 text-xs">{{ e.organizer }}</td>
            <td class="px-3 py-2">
              <div class="flex flex-wrap gap-1 max-w-xs">
                <NuxtLink :to="`/admin/events/${e.id}`" class="btn-secondary !py-1 !px-2 !text-[10px]">Edit</NuxtLink>
                <button type="button" class="btn-danger" @click="onDelete(e.id)">Delete</button>
                <NuxtLink :to="`/admin/events/${e.id}/manager`" class="btn-secondary !py-1 !px-2 !text-[10px]">Event manager</NuxtLink>
                <a :href="`/event/${e.slug}`" target="_blank" class="btn-secondary !py-1 !px-2 !text-[10px]">Live link</a>
                <button type="button" class="btn-secondary !py-1 !px-2 !text-[10px]" @click="toast(`Export orders: ${e.title}`)">Export orders</button>
                <button type="button" class="btn-secondary !py-1 !px-2 !text-[10px]" @click="toast(`Export customers: ${e.title}`)">Export customers</button>
                <button type="button" class="btn-secondary !py-1 !px-2 !text-[10px]" @click="toast(`Tickets scanned: ${e.title}`)">Tickets scanned</button>
                <button type="button" class="btn-secondary !py-1 !px-2 !text-[10px]" @click="toast(`Export QR: ${e.title}`)">Export QR codes</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { events, remove, upsert } = useEvents()
const q = ref('')
const from = ref('')
const to = ref('')
const msg = ref('')

const filtered = computed(() =>
  events.value.filter((e) => {
    if (q.value) {
      const s = q.value.toLowerCase()
      if (!e.title.toLowerCase().includes(s) && !e.city.toLowerCase().includes(s)) return false
    }
    if (from.value && new Date(e.date) < new Date(from.value)) return false
    if (to.value && new Date(e.date) > new Date(to.value + 'T23:59:59')) return false
    return true
  })
)

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Berlin'
  })
}

function toast(t: string) {
  msg.value = `✓ ${t} (stub)`
  console.log('[TicketShop]', t)
}

function toggleActive(id: string) {
  const e = events.value.find((x) => x.id === id)
  if (!e) return
  upsert({ ...e, active: !e.active })
}

function onDelete(id: string) {
  if (!confirm('Event wirklich löschen?')) return
  remove(id)
  toast('Event gelöscht')
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h1 class="text-3xl font-semibold">Events</h1>
        <p class="text-sm text-slate-500">Combined (Chart) vs Simple (ohne Chart)</p>
      </div>
      <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
        <NuxtLink to="/admin/events/new?type=combined" class="btn-primary w-full sm:w-auto">+ Combined Event</NuxtLink>
        <NuxtLink to="/admin/events/new?type=simple" class="btn-secondary w-full sm:w-auto">+ Simple Event</NuxtLink>
        <button type="button" class="btn-secondary !text-xs" :disabled="importing" @click="importUlaznice">
          {{ importing ? 'Import…' : 'Import ulaznice.de' }}
        </button>
        <button type="button" class="btn-secondary w-full sm:w-auto" @click="toast('GATEWAY REPORT (stub)')">GATEWAY REPORT</button>
        <button type="button" class="btn-secondary w-full sm:w-auto" @click="toast('BULK REPORT (stub)')">BULK REPORT</button>
      </div>
    </div>

    <div class="mb-4 grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
      <input v-model="from" type="date" class="input lg:w-auto" />
      <input v-model="to" type="date" class="input lg:w-auto" />
      <input v-model="q" type="search" placeholder="Titel / Stadt…" class="input sm:col-span-2 lg:col-span-1 lg:w-48" />
    </div>
    <p v-if="msg" class="text-sm text-emerald-700 mb-3">{{ msg }}</p>

    <div class="space-y-3 md:hidden">
      <article v-for="e in filtered" :key="e.id" class="card space-y-3 p-4">
        <div class="flex items-start gap-3">
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded text-xl"
            :style="{ background: e.posterColor }"
          >
            <img v-if="e.posterImage" :src="e.posterImage" alt="" class="h-full w-full object-cover" />
            <template v-else>{{ e.bannerEmoji }}</template>
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-medium break-words">{{ e.title }}</p>
            <p class="text-xs text-slate-400">
              {{ e.city }} ·
              <span :class="e.type === 'combined' ? 'font-medium text-slate-800' : 'text-slate-500'">
                {{ e.type === 'combined' ? 'Combined' : 'Simple' }}
              </span>
            </p>
            <p class="text-xs text-slate-500">{{ formatDate(e.date) }}</p>
            <p class="text-xs text-slate-500">{{ e.organizer }}</p>
          </div>
        </div>
        <div class="flex items-center justify-between gap-3">
          <button
            type="button"
            class="relative inline-flex h-7 w-12 items-center rounded-full transition"
            :class="e.active ? 'bg-emerald-500' : 'bg-slate-300'"
            :aria-label="e.active ? 'Event deaktivieren' : 'Event aktivieren'"
            @click="toggleActive(e.id)"
          >
            <span
              class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition"
              :class="e.active ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
          <span v-if="e.promo" class="badge">Promo</span>
          <span v-else class="text-xs text-slate-300">—</span>
        </div>
        <div class="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
          <NuxtLink :to="`/admin/events/${e.id}`" class="btn-secondary w-full">Edit</NuxtLink>
          <button type="button" class="btn-danger w-full" @click="onDelete(e.id)">Delete</button>
          <NuxtLink :to="`/admin/events/${e.id}/manager`" class="btn-secondary w-full">Event manager</NuxtLink>
          <a :href="`/event/${e.slug}`" target="_blank" class="btn-secondary w-full">Live link</a>
          <button type="button" class="btn-secondary w-full" @click="toast(`Export orders: ${e.title}`)">Export orders</button>
          <button type="button" class="btn-secondary w-full" @click="toast(`Export customers: ${e.title}`)">Export customers</button>
          <button type="button" class="btn-secondary w-full" @click="toast(`Tickets scanned: ${e.title}`)">Tickets scanned</button>
          <button type="button" class="btn-secondary w-full" @click="toast(`Export QR: ${e.title}`)">Export QR codes</button>
        </div>
      </article>
      <p v-if="!filtered.length" class="card p-6 text-center text-sm text-slate-400">Keine Events.</p>
    </div>

    <div class="card hidden overflow-x-auto md:block">
      <table class="w-full min-w-[900px] text-sm">
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
                class="flex h-10 w-10 items-center justify-center overflow-hidden rounded text-lg"
                :style="{ background: e.posterColor }"
              >
                <img v-if="e.posterImage" :src="e.posterImage" alt="" class="h-full w-full object-cover" />
                <template v-else>{{ e.bannerEmoji }}</template>
              </div>
            </td>
            <td class="px-3 py-2">
              <p class="font-medium">{{ e.title }}</p>
              <p class="text-xs text-slate-400">
                {{ e.city }} ·
                <span :class="e.type === 'combined' ? 'font-medium text-slate-800' : 'text-slate-500'">
                  {{ e.type === 'combined' ? 'Combined' : 'Simple' }}
                </span>
              </p>
            </td>
            <td class="px-3 py-2 whitespace-nowrap text-xs">{{ formatDate(e.date) }}</td>
            <td class="px-3 py-2">
              <span v-if="e.promo" class="badge">Promo</span>
              <span v-else class="text-xs text-slate-300">—</span>
            </td>
            <td class="px-3 py-2 text-xs">{{ e.organizer }}</td>
            <td class="px-3 py-2">
              <div class="flex flex-wrap gap-1 max-w-xs">
                <NuxtLink :to="`/admin/events/${e.id}`" class="btn-secondary btn-inline">Edit</NuxtLink>
                <button type="button" class="btn-danger btn-inline" @click="onDelete(e.id)">Delete</button>
                <NuxtLink :to="`/admin/events/${e.id}/manager`" class="btn-secondary btn-inline">Event manager</NuxtLink>
                <a :href="`/event/${e.slug}`" target="_blank" class="btn-secondary btn-inline">Live link</a>
                <button type="button" class="btn-secondary btn-inline" @click="toast(`Export orders: ${e.title}`)">Export orders</button>
                <button type="button" class="btn-secondary btn-inline" @click="toast(`Export customers: ${e.title}`)">Export customers</button>
                <button type="button" class="btn-secondary btn-inline" @click="toast(`Tickets scanned: ${e.title}`)">Tickets scanned</button>
                <button type="button" class="btn-secondary btn-inline" @click="toast(`Export QR: ${e.title}`)">Export QR codes</button>
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

const { events, remove, upsert, loadFromApi } = useEvents()
const q = ref('')
const from = ref('')
const to = ref('')
const msg = ref('')
const importing = ref(false)

async function importUlaznice() {
  if (!confirm('Upcoming Events von ulaznice.de importieren? (Demo-Events werden deaktiviert)')) return
  importing.value = true
  msg.value = ''
  try {
    const res = await $fetch<any>('/api/admin/import-ulaznice', {
      method: 'POST',
      body: { upcomingOnly: true, deactivateDemos: true }
    })
    msg.value = `✓ Import: ${res.imported} Events`
    await loadFromApi()
  } catch (e: any) {
    msg.value = e?.data?.statusMessage || e?.message || 'Import fehlgeschlagen'
  } finally {
    importing.value = false
  }
}

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

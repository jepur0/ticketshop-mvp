<template>
  <div class="mx-auto max-w-lg px-4 py-12 sm:py-16">
    <p class="eyebrow">Hilfe</p>
    <h1 class="page-title mt-3">Tickets finden</h1>
    <p class="page-dek mb-8">Bezahlte Tickets aus dem Orders-Store erneut anzeigen / „zusenden“.</p>

    <form v-if="!result" class="card space-y-4 p-6 sm:p-8" @submit.prevent="submit">
      <div>
        <label class="label">Event (optional)</label>
        <select v-model="eventId" class="input">
          <option value="">Alle Events</option>
          <option v-for="e in events.filter((x) => x.active)" :key="e.id" :value="e.id">
            {{ e.title }} ({{ e.city }})
          </option>
        </select>
      </div>
      <div>
        <label class="label">E-Mail</label>
        <input v-model="email" type="email" required class="input" />
      </div>
      <div>
        <label class="label">Captcha: Tippe das Wort <strong>ticket</strong></label>
        <input v-model="captcha" required class="input" autocomplete="off" />
      </div>
      <button type="submit" class="btn-primary w-full" :disabled="busy">
        {{ busy ? 'Suche…' : 'Tickets finden' }}
      </button>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    </form>

    <div v-else class="space-y-4">
      <div class="card p-6">
        <p class="font-semibold text-emerald-700 mb-2">
          {{ result.orders.length ? `${result.orders.length} Bestellung(en)` : 'Keine Tickets gefunden' }}
        </p>
        <p class="text-xs text-slate-400 mb-4">Resend-Stub geloggt auf dem Server.</p>
        <div v-for="o in result.orders" :key="o.orderId" class="border-t border-slate-100 py-3">
          <p class="text-sm font-medium">{{ o.eventTitle }}</p>
          <p class="text-xs text-slate-400 font-mono">{{ o.orderId }}</p>
          <ul class="mt-2 space-y-2">
            <li v-for="t in o.tickets" :key="t.code" class="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span class="min-w-0 break-words">{{ t.label }} <code class="break-all rounded bg-slate-100 px-1 text-xs">{{ t.code }}</code></span>
              <a :href="t.pdfUrl" target="_blank" class="btn-secondary w-full sm:w-auto">PDF</a>
            </li>
          </ul>
        </div>
      </div>
      <button type="button" class="btn-secondary" @click="result = null">Nochmal</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { events } = useEvents()
const eventId = ref('')
const email = ref('')
const captcha = ref('')
const error = ref('')
const busy = ref(false)
const result = ref<any>(null)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    result.value = await $fetch('/api/tickets/find', {
      method: 'POST',
      body: { email: email.value, eventId: eventId.value || undefined, captcha: captcha.value }
    })
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || 'Fehler'
  } finally {
    busy.value = false
  }
}
</script>

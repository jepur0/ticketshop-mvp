<template>
  <div class="mx-auto max-w-lg px-4 py-10">
    <h1 class="text-2xl font-bold mb-2">Tickets finden</h1>
    <p class="text-sm text-slate-500 mb-6">Bezahlte Tickets aus dem Orders-Store erneut anzeigen / „zusenden“.</p>

    <form v-if="!result" class="card p-6 space-y-4" @submit.prevent="submit">
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
            <li v-for="t in o.tickets" :key="t.code" class="flex items-center justify-between text-sm gap-2">
              <span>{{ t.label }} <code class="text-xs bg-slate-100 px-1 rounded">{{ t.code }}</code></span>
              <a :href="t.pdfUrl" target="_blank" class="text-blue-700 text-xs underline">PDF</a>
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

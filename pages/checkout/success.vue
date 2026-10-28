<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <div v-if="pending" class="card p-8 text-center text-slate-500">Bestellung wird geladen…</div>
    <div v-else-if="!order" class="card p-8 text-center text-slate-500">
      Bestellung nicht gefunden.
      <NuxtLink to="/" class="block mt-3 text-blue-700 underline">Startseite</NuxtLink>
    </div>
    <div v-else class="card p-5 text-center sm:p-8">
      <p class="text-4xl mb-3">{{ order.status === 'paid' ? '✅' : '⏳' }}</p>
      <h1 class="text-xl font-bold" :class="order.status === 'paid' ? 'text-emerald-700' : 'text-amber-700'">
        {{ order.status === 'paid' ? 'Zahlung erfolgreich' : `Status: ${order.status}` }}
      </h1>
      <p class="mt-2 break-all text-slate-600">Bestellnr. <strong>{{ order.id }}</strong> · {{ order.payment }}</p>
      <p class="text-sm text-slate-500 mt-1">{{ order.eventTitle }} · {{ order.total }} €</p>

      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <div
          v-for="t in tickets"
          :key="t.code"
          class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left"
        >
          <p class="text-xs text-slate-400 mb-2">QR / Ticket</p>
          <div class="h-28 w-28 mx-auto bg-slate-900 text-white flex items-center justify-center font-mono text-[10px] break-all p-2 rounded-lg">
            {{ t.code }}
          </div>
          <p class="mt-3 text-sm font-medium text-center">{{ t.label }}</p>
          <p class="text-center font-mono text-xs text-slate-500 break-all">{{ t.code }}</p>
          <a :href="t.pdfUrl" target="_blank" class="btn-secondary w-full mt-3 !text-xs">PDF öffnen</a>
        </div>
      </div>

      <p class="mt-6 text-sm text-slate-500">
        Tickets wurden an <strong>{{ order.customer.email }}</strong> „gesendet“ (E-Mail-Stub in Server-Logs).
      </p>
      <NuxtLink to="/" class="btn-primary mt-6 inline-flex">Zur Startseite</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const orderId = computed(() => String(route.query.orderId || ''))

const { data, pending, refresh } = await useFetch(() => `/api/checkout/order?orderId=${orderId.value}`, {
  watch: [orderId],
  immediate: !!orderId.value
})

const order = computed(() => (data.value as any)?.order)
const tickets = computed(() => (data.value as any)?.tickets || [])

// If Stripe redirected with pending, poll briefly / try mock fulfill when session present but unpaid
onMounted(async () => {
  if (!orderId.value) return
  // If still pending and we have a stripe session id, wait for webhook or soft-fulfill via mock for demo
  for (let i = 0; i < 5; i++) {
    await refresh()
    if (order.value?.status === 'paid') break
    await new Promise((r) => setTimeout(r, 800))
  }
  // Local demo: if Stripe webhook not configured, allow completing via session_id hint
  if (order.value?.status === 'pending' && route.query.session_id) {
    try {
      await $fetch('/api/checkout/webhook', {
        method: 'POST',
        body: {
          type: 'checkout.session.completed',
          data: {
            object: {
              id: route.query.session_id,
              client_reference_id: orderId.value,
              metadata: { orderId: orderId.value }
            }
          }
        }
      })
      await refresh()
    } catch {
      /* ignore */
    }
  }
})
</script>

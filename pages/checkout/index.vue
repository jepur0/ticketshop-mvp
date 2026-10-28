<template>
  <div class="mx-auto max-w-3xl px-4 py-6 sm:py-10">
    <h1 class="text-2xl font-bold mb-6">Kasse</h1>

    <div v-if="route.query.canceled" class="mb-4 rounded-lg bg-amber-50 text-amber-800 text-sm px-4 py-3">
      Zahlung abgebrochen. Du kannst es erneut versuchen.
    </div>
    <div v-if="error" class="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{{ error }}</div>

    <div v-if="!items.length" class="card p-5 text-center text-slate-500 sm:p-8">
      Warenkorb ist leer. <NuxtLink to="/archive" class="text-blue-700 underline">Events ansehen</NuxtLink>
    </div>
    <form v-else class="grid gap-6 sm:grid-cols-2" @submit.prevent="pay">
      <div class="sm:col-span-2 card space-y-4 p-4 sm:p-5">
        <h2 class="font-semibold">Gast-Checkout</h2>
        <div>
          <label class="label" for="checkout-name">Name *</label>
          <input id="checkout-name" v-model="form.name" required class="input" autocomplete="name" />
        </div>
        <div>
          <label class="label" for="checkout-email">E-Mail *</label>
          <input id="checkout-email" v-model="form.email" type="email" required class="input" autocomplete="email" />
        </div>
        <div>
          <label class="label" for="checkout-phone">Telefon</label>
          <input id="checkout-phone" v-model="form.phone" type="tel" class="input" autocomplete="tel" />
        </div>
      </div>
      <div class="sm:col-span-2 card p-4 sm:p-5">
        <h2 class="font-semibold mb-3">Bestellübersicht</h2>
        <ul class="space-y-2 text-sm mb-4">
          <li v-for="(item, i) in items" :key="i" class="flex justify-between gap-3">
            <span class="min-w-0 break-words">{{ item.eventTitle }} — {{ item.label }}</span>
            <span class="shrink-0 font-medium">{{ item.price }} €</span>
          </li>
        </ul>
        <div class="flex justify-between font-bold text-lg border-t pt-3">
          <span>Gesamt</span>
          <span>{{ total }} €</span>
        </div>
        <p class="text-xs text-slate-400 mt-2">
          Zahlung:
          <strong v-if="integrations?.stripe?.enabled">Stripe Checkout</strong>
          <strong v-else-if="integrations?.otpVpos?.enabled">OTP VPOS (Stub → Mock)</strong>
          <strong v-else>Demo Mock (kein Stripe Key)</strong>
        </p>
        <button type="submit" class="btn-primary w-full mt-4" :disabled="paying">
          {{ paying ? 'Wird verarbeitet…' : `Jetzt zahlen (${total} €)` }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { items, total, clear, holdMeta, setHoldMeta, setHoldMinutes } = useCart()
const { data: integrations } = await useFetch('/api/public/integrations')

watchEffect(() => {
  const m = (integrations.value as any)?.holdMinutes
  if (m) setHoldMinutes(m)
})

const form = reactive({ name: '', email: '', phone: '' })
const paying = ref(false)
const error = ref('')

async function ensureHold() {
  if (holdMeta.value.holdId) return holdMeta.value.holdId
  const first = items.value[0]
  if (!first) return null
  try {
    const res = await $fetch<any>('/api/holds/create', {
      method: 'POST',
      body: {
        eventId: first.eventId,
        seatIds: items.value.map((i) => i.seatId).filter(Boolean),
        seatsHoldToken: holdMeta.value.seatsHoldToken,
        email: form.email
      }
    })
    setHoldMeta({ holdId: res.hold.id })
    return res.hold.id as string
  } catch {
    return null
  }
}

async function pay() {
  paying.value = true
  error.value = ''
  try {
    const holdId = await ensureHold()
    const payload = {
      customer: { ...form },
      items: items.value.map((i) => ({ ...i })),
      eventId: items.value[0]?.eventId,
      eventTitle: items.value[0]?.eventTitle,
      eventSlug: items.value[0]?.eventSlug,
      holdId,
      seatsHoldToken: holdMeta.value.seatsHoldToken,
      seatsEventKey: items.value[0]?.eventId
    }

    if ((integrations.value as any)?.stripe?.enabled) {
      const session = await $fetch<any>('/api/checkout/session', { method: 'POST', body: payload })
      if (session.mode === 'stripe' && session.url) {
        clear()
        window.location.href = session.url
        return
      }
      // fallback mock if session says mock
    }

    const res = await $fetch<any>('/api/checkout/mock-pay', { method: 'POST', body: payload })
    clear()
    await navigateTo(`/checkout/success?orderId=${res.orderId}`)
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || 'Zahlung fehlgeschlagen'
  } finally {
    paying.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-12 sm:py-16">
    <h1 class="page-title mb-8">Kasse</h1>

    <div v-if="route.query.canceled" class="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Zahlung abgebrochen. Du kannst es erneut versuchen.
    </div>
    <div v-if="error" class="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ error }}</div>

    <div v-if="!items.length" class="card p-8 text-center text-slate-500 sm:p-12">
      Warenkorb ist leer. <NuxtLink to="/archive" class="link">Events ansehen</NuxtLink>
    </div>
    <form v-else class="grid gap-6 sm:grid-cols-2" @submit.prevent="pay">
      <div class="card space-y-4 p-5 sm:col-span-2 sm:p-6">
        <h2 class="text-lg font-semibold">Gast-Checkout</h2>
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
      <div class="card p-5 sm:col-span-2 sm:p-6">
        <h2 class="mb-4 text-lg font-semibold">Bestellübersicht</h2>
        <ul class="space-y-2 text-sm mb-4">
          <li v-for="(item, i) in items" :key="i" class="flex justify-between gap-3">
            <span class="min-w-0 break-words">{{ item.eventTitle }} — {{ item.label }}</span>
            <span class="shrink-0 font-medium">{{ item.price }} €</span>
          </li>
        </ul>
        <div class="flex justify-between border-t border-slate-100 pt-4 text-lg font-semibold tracking-tight text-slate-900">
          <span>Gesamt</span>
          <span>{{ total }} €</span>
        </div>
        <p class="text-xs text-slate-400 mt-2">
          Zahlung:
          <strong v-if="integrations?.stripe?.enabled">Stripe Checkout</strong>
          <strong v-else-if="integrations?.otpVpos?.enabled">OTP VPOS (Stub → Mock)</strong>
          <strong v-else>Demo Mock (kein Stripe Key)</strong>
        </p>
        <div>
          <label class="label" for="checkout-promo">Promo-Code</label>
          <div class="flex gap-2">
            <input id="checkout-promo" v-model="promoCode" class="input font-mono uppercase" autocomplete="off" />
            <button type="button" class="btn-secondary shrink-0" @click="checkPromo">Prüfen</button>
          </div>
          <p v-if="promoNote" class="mt-2 text-sm" :class="promoOk ? 'text-emerald-700' : 'text-red-700'">{{ promoNote }}</p>
        </div>
        <button type="submit" class="btn-primary w-full mt-4" :disabled="paying">
          {{ paying ? 'Wird verarbeitet…' : `Jetzt zahlen (${payable} €)` }}
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
const promoCode = ref('')
const promoNote = ref('')
const promoOk = ref(false)
const discount = ref(0)
const payable = computed(() => Math.max(0, Math.round((total.value - discount.value) * 100) / 100))
const affiliateRef = useState<string>('affiliate-ref', () => '')

watch(promoCode, () => {
  discount.value = 0
  promoOk.value = false
  promoNote.value = ''
})

async function checkPromo() {
  promoNote.value = ''
  discount.value = 0
  promoOk.value = false
  if (!promoCode.value.trim()) return
  try {
    const res = await $fetch<any>('/api/public/promo', {
      method: 'POST',
      body: {
        promoCode: promoCode.value,
        eventId: items.value[0]?.eventId,
        items: items.value.map((i) => ({ price: i.price, label: i.label }))
      }
    })
    discount.value = res.discount || 0
    promoOk.value = true
    promoNote.value = discount.value ? `Rabatt ${discount.value} € · neu ${res.total} €` : 'Code gültig, kein Rabatt'
  } catch (e: any) {
    promoNote.value = e?.data?.statusMessage || 'Code ungültig'
  }
}

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
      seatsEventKey: items.value[0]?.eventId,
      promoCode: promoCode.value.trim(),
      affiliateRef: affiliateRef.value
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

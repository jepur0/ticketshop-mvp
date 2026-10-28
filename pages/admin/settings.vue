<template>
  <div class="max-w-3xl">
    <h1 class="mb-1 text-3xl font-semibold text-slate-900">Settings</h1>
    <p class="text-sm text-slate-500 mb-6">
      API-Schlüssel (seats.io, Stripe, E-Mail) und Firmendaten für Impressum.
      Secrets maskiert in SQLite (<code class="text-xs bg-slate-100 px-1 rounded">.data/ticketshop.sqlite</code>).
    </p>

    <div v-if="loadError" class="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{{ loadError }}</div>
    <div v-if="savedMsg" class="mb-4 rounded-lg bg-emerald-50 text-emerald-800 text-sm px-4 py-3">{{ savedMsg }}</div>

    <div v-if="ready" class="mb-6 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
      <div class="card px-3 py-2" :class="ready.seatsioChart ? 'border-emerald-300' : 'border-amber-200'">
        seats.io Chart: <strong>{{ ready.seatsioChart ? 'OK' : 'fehlt' }}</strong>
      </div>
      <div class="card px-3 py-2" :class="ready.seatsioBook ? 'border-emerald-300' : 'border-amber-200'">
        seats.io Book: <strong>{{ ready.seatsioBook ? 'OK' : 'fehlt' }}</strong>
      </div>
      <div class="card px-3 py-2" :class="ready.stripeCheckout ? 'border-emerald-300' : 'border-amber-200'">
        Stripe: <strong>{{ ready.stripeCheckout ? 'OK' : 'fehlt' }}</strong>
      </div>
      <div class="card px-3 py-2" :class="ready.stripeConnect ? 'border-emerald-300' : 'border-slate-200'">
        Connect: <strong>{{ ready.stripeConnect ? 'OK' : 'aus' }}</strong>
      </div>
      <div class="card px-3 py-2" :class="ready.email ? 'border-emerald-300' : 'border-amber-200'">
        E-Mail: <strong>{{ ready.email ? 'OK' : 'fehlt' }}</strong>
      </div>
      <div class="card px-3 py-2" :class="ready.otpVpos ? 'border-emerald-300' : 'border-slate-200'">
        OTP VPOS: <strong>{{ ready.otpVpos ? 'OK' : 'aus' }}</strong>
      </div>
    </div>

    <form v-if="form" class="space-y-6" @submit.prevent="save">
      <section class="card p-5 space-y-3">
        <h2 class="font-semibold">seats.io</h2>
        <p class="text-xs text-slate-500">Paste keys from seats.io dashboard. Chart Key per Combined event.</p>
        <div>
          <label class="label !flex items-start justify-between gap-3">
            <span>Workspace Public Key</span>
            <StatusDot :on="!!form.seatsio.workspacePublicKeySet" />
          </label>
          <input v-model="form.seatsio.workspacePublicKey" class="input font-mono text-xs" placeholder="pub-…" autocomplete="off" />
        </div>
        <div>
          <label class="label !flex items-start justify-between gap-3">
            <span>Secret Key</span>
            <StatusDot :on="!!form.seatsio.secretKeySet" />
          </label>
          <input v-model="form.seatsio.secretKey" class="input font-mono text-xs" type="password" placeholder="•••••••• (leer = unverändert)" autocomplete="new-password" />
        </div>
        <div>
          <label class="label">Region</label>
          <select v-model="form.seatsio.region" class="input">
            <option value="eu">EU</option>
            <option value="na">NA</option>
            <option value="sa">SA</option>
            <option value="oc">OC</option>
          </select>
        </div>
      </section>

      <section class="card p-5 space-y-3">
        <h2 class="font-semibold">Stripe</h2>
        <p class="text-xs text-slate-500">Checkout + Webhook. Secret nie an den Client.</p>
        <div>
          <label class="label !flex items-start justify-between gap-3"><span>Publishable Key</span><StatusDot :on="!!form.stripe.publishableKeySet" /></label>
          <input v-model="form.stripe.publishableKey" class="input font-mono text-xs" placeholder="pk_test_…" autocomplete="off" />
        </div>
        <div>
          <label class="label !flex items-start justify-between gap-3"><span>Secret Key</span><StatusDot :on="!!form.stripe.secretKeySet" /></label>
          <input v-model="form.stripe.secretKey" class="input font-mono text-xs" type="password" placeholder="••••••••" autocomplete="new-password" />
        </div>
        <div>
          <label class="label !flex items-start justify-between gap-3"><span>Webhook Secret</span><StatusDot :on="!!form.stripe.webhookSecretSet" /></label>
          <input v-model="form.stripe.webhookSecret" class="input font-mono text-xs" type="password" placeholder="whsec_…" autocomplete="new-password" />
          <p class="text-xs text-slate-400 mt-1">Endpoint: <code class="bg-slate-100 px-1 rounded">POST /api/checkout/webhook</code></p>
        </div>
        <div class="border-t pt-3 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold">Stripe Connect (skeleton)</h3>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="form.stripe.connect.enabled" type="checkbox" /> Aktiv
            </label>
          </div>
          <div>
            <label class="label">Platform Account ID</label>
            <input v-model="form.stripe.connect.platformAccountId" class="input font-mono text-xs" placeholder="acct_… (platform)" />
          </div>
          <div>
            <label class="label">Connected Account ID (Organizer)</label>
            <input v-model="form.stripe.connect.connectedAccountId" class="input font-mono text-xs" placeholder="acct_… (express/standard)" />
          </div>
          <p class="text-xs text-slate-400">Payouts page shows mock split by commission % until live transfers are wired.</p>
        </div>
      </section>

      <section class="card p-5 space-y-3">
        <h2 class="font-semibold">E-Mail (PDF-Tickets)</h2>
        <div>
          <label class="label">Provider</label>
          <select v-model="form.email.provider" class="input">
            <option value="log">Log only (dev)</option>
            <option value="smtp">SMTP (nodemailer)</option>
            <option value="resend">Resend API</option>
          </select>
        </div>
        <div>
          <label class="label">From</label>
          <input v-model="form.email.from" class="input" placeholder="tickets@deine-domain.de" />
        </div>
        <template v-if="form.email.provider === 'smtp'">
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="label">SMTP Host</label>
              <input v-model="form.email.smtpHost" class="input font-mono text-xs" placeholder="smtp.example.com" />
            </div>
            <div>
              <label class="label">Port</label>
              <input v-model.number="form.email.smtpPort" type="number" class="input" />
            </div>
            <div>
              <label class="label">User</label>
              <input v-model="form.email.smtpUser" class="input font-mono text-xs" autocomplete="off" />
            </div>
            <div>
              <label class="label !flex items-start justify-between gap-3"><span>Password</span><StatusDot :on="!!form.email.smtpPassSet" /></label>
              <input v-model="form.email.smtpPass" type="password" class="input font-mono text-xs" autocomplete="new-password" />
            </div>
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="form.email.smtpSecure" type="checkbox" /> Secure (TLS / port 465)
          </label>
        </template>
        <div v-if="form.email.provider === 'resend'">
          <label class="label !flex items-start justify-between gap-3"><span>Resend API Key</span><StatusDot :on="!!form.email.resendApiKeySet" /></label>
          <input v-model="form.email.resendApiKey" type="password" class="input font-mono text-xs" placeholder="re_…" autocomplete="new-password" />
        </div>
      </section>

      <section class="card p-5 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">OTP VPOS (optional)</h2>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="form.otpVpos.enabled" type="checkbox" /> Aktiv
          </label>
        </div>
        <div>
          <label class="label">Merchant ID</label>
          <input v-model="form.otpVpos.merchantId" class="input font-mono text-xs" autocomplete="off" />
        </div>
        <div>
          <label class="label !flex items-start justify-between gap-3"><span>API Key</span><StatusDot :on="!!form.otpVpos.apiKeySet" /></label>
          <input v-model="form.otpVpos.apiKey" class="input font-mono text-xs" type="password" autocomplete="new-password" />
        </div>
        <div>
          <label class="label">Endpoint URL</label>
          <input v-model="form.otpVpos.endpoint" class="input font-mono text-xs" placeholder="https://…" />
        </div>
      </section>

      <section class="card p-5 space-y-3">
        <h2 class="font-semibold">Firma (Impressum / AGB tokens)</h2>
        <p class="text-xs text-slate-500">Ersetzt [FIRMA], [STRASSE], … auf öffentlichen Legal-Seiten.</p>
        <div class="grid sm:grid-cols-2 gap-3">
          <div class="sm:col-span-2">
            <label class="label">Firmenname</label>
            <input v-model="form.company.name" class="input" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">Straße</label>
            <input v-model="form.company.street" class="input" />
          </div>
          <div>
            <label class="label">PLZ</label>
            <input v-model="form.company.zip" class="input" />
          </div>
          <div>
            <label class="label">Ort</label>
            <input v-model="form.company.city" class="input" />
          </div>
          <div>
            <label class="label">Land</label>
            <input v-model="form.company.country" class="input" />
          </div>
          <div>
            <label class="label">E-Mail</label>
            <input v-model="form.company.email" class="input" />
          </div>
          <div>
            <label class="label">Telefon</label>
            <input v-model="form.company.phone" class="input" />
          </div>
          <div>
            <label class="label">Geschäftsführung</label>
            <input v-model="form.company.managingDirector" class="input" />
          </div>
          <div>
            <label class="label">HRB</label>
            <input v-model="form.company.hrb" class="input" />
          </div>
          <div>
            <label class="label">Amtsgericht</label>
            <input v-model="form.company.court" class="input" />
          </div>
          <div>
            <label class="label">Steuernummer</label>
            <input v-model="form.company.steuernummer" class="input" />
          </div>
          <div>
            <label class="label">USt-IdNr.</label>
            <input v-model="form.company.ustId" class="input" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">Datenschutz-E-Mail</label>
            <input v-model="form.company.privacyEmail" class="input" />
          </div>
        </div>
      </section>

      <section class="card p-5 space-y-3">
        <h2 class="font-semibold">Commerce</h2>
        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="label">Hold (Minuten)</label>
            <input v-model.number="form.commerce.holdMinutes" type="number" min="5" max="60" class="input" />
          </div>
          <div>
            <label class="label">Commission %</label>
            <input v-model.number="form.commerce.commissionPercent" type="number" min="0" max="30" step="0.1" class="input" />
          </div>
          <div>
            <label class="label">Currency</label>
            <input v-model="form.commerce.currency" class="input" />
          </div>
          <div>
            <label class="label">Site URL</label>
            <input v-model="form.commerce.siteUrl" class="input" placeholder="https://tickets.example.de" />
          </div>
        </div>
      </section>

      <div class="flex flex-col gap-2 sm:flex-row">
        <button type="submit" class="btn-primary w-full sm:w-auto" :disabled="saving">{{ saving ? 'Speichern…' : 'Speichern' }}</button>
        <button type="button" class="btn-secondary w-full sm:w-auto" :disabled="loading" @click="load">Neu laden</button>
      </div>
      <p v-if="form.updatedAt" class="text-xs text-slate-400">Zuletzt: {{ formatAt(form.updatedAt) }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const form = ref<any>(null)
const ready = ref<any>(null)
const loading = ref(false)
const saving = ref(false)
const loadError = ref('')
const savedMsg = ref('')

function formatAt(iso: string) {
  return new Date(iso).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })
}

function applyForm(data: any) {
  form.value = {
    seatsio: { ...data.seatsio },
    stripe: {
      ...data.stripe,
      connect: { enabled: false, platformAccountId: '', connectedAccountId: '', ...(data.stripe?.connect || {}) }
    },
    otpVpos: { ...data.otpVpos },
    email: { ...data.email },
    company: { ...data.company },
    commerce: { ...data.commerce },
    updatedAt: data.updatedAt
  }
  ready.value = data.ready
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await $fetch<any>('/api/admin/settings')
    applyForm(data)
  } catch (e: any) {
    loadError.value = e?.data?.statusMessage || e?.message || 'Laden fehlgeschlagen'
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!form.value) return
  saving.value = true
  savedMsg.value = ''
  try {
    const res = await $fetch<any>('/api/admin/settings', {
      method: 'PUT',
      body: {
        seatsio: {
          workspacePublicKey: form.value.seatsio.workspacePublicKey,
          secretKey: form.value.seatsio.secretKey,
          region: form.value.seatsio.region
        },
        stripe: {
          publishableKey: form.value.stripe.publishableKey,
          secretKey: form.value.stripe.secretKey,
          webhookSecret: form.value.stripe.webhookSecret,
          connect: { ...form.value.stripe.connect }
        },
        otpVpos: {
          enabled: form.value.otpVpos.enabled,
          merchantId: form.value.otpVpos.merchantId,
          apiKey: form.value.otpVpos.apiKey,
          endpoint: form.value.otpVpos.endpoint
        },
        email: { ...form.value.email },
        company: { ...form.value.company },
        commerce: { ...form.value.commerce }
      }
    })
    applyForm(res.settings)
    savedMsg.value = 'Gespeichert. Secrets bleiben maskiert; leere Secret-Felder ändern nichts.'
  } catch (e: any) {
    loadError.value = e?.data?.statusMessage || e?.message || 'Speichern fehlgeschlagen'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

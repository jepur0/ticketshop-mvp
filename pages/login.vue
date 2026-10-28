<template>
  <div class="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16">
    <div class="card w-full p-8 sm:p-9">
      <p class="eyebrow">Organizer</p>
      <h1 class="page-title mt-3 text-[1.85rem]">Anmelden</h1>
      <p class="mt-2 text-sm leading-relaxed text-ink-soft">
        Session-Cookie + bcrypt. Demo-Zugänge nur lokal — in Produktion ändern.
      </p>
      <form class="mt-7 space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="label" for="login-email">E-Mail</label>
          <input id="login-email" v-model="email" type="email" required class="input" placeholder="admin@ticketshop.local" autocomplete="username" />
        </div>
        <div>
          <label class="label" for="login-password">Passwort</label>
          <input id="login-password" v-model="password" type="password" required class="input" placeholder="••••••••" autocomplete="current-password" />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="busy">
          {{ busy ? 'Anmelden…' : 'Anmelden' }}
        </button>
      </form>
      <ul class="mt-7 space-y-1.5 border-t border-line pt-5 text-xs text-ink-muted">
        <li><code class="text-ink-soft">admin@ticketshop.local</code> / admin — voller Zugang</li>
        <li><code class="text-ink-soft">scanner@ticketshop.local</code> / scanner — nur Scanner</li>
        <li><code class="text-ink-soft">client@ticketshop.local</code> / client — Events/Orders</li>
        <li v-if="demoHint" class="text-gold-deep">
          ALLOW_DEMO_LOGIN=true — beliebige E-Mail wird als Admin akzeptiert (nur Dev)
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const { login, user, refresh } = useAuth()
const email = ref('admin@ticketshop.local')
const password = ref('admin')
const error = ref('')
const busy = ref(false)
const demoHint = ref(false)

onMounted(async () => {
  const me = await $fetch<{ allowDemoLogin?: boolean; user: any }>('/api/auth/me')
  demoHint.value = !!me.allowDemoLogin
  if (me.user) {
    await refresh()
    if (user.value?.role === 'scanner') navigateTo('/admin/scanner')
    else navigateTo('/admin')
  }
})

async function onSubmit() {
  error.value = ''
  busy.value = true
  try {
    await login(email.value, password.value)
    if (user.value?.role === 'scanner') navigateTo('/admin/scanner')
    else navigateTo('/admin')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || 'Login fehlgeschlagen'
  } finally {
    busy.value = false
  }
}
</script>

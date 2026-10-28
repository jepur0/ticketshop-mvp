<template>
  <div class="mx-auto max-w-md px-4 py-16">
    <div class="card p-8">
      <h1 class="text-2xl font-bold mb-2">Organizer Login</h1>
      <p class="text-sm text-slate-500 mb-6">
        Session-Cookie + bcrypt. Demo-Passwörter nur lokal — in Produktion ändern.
      </p>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="label">E-Mail</label>
          <input v-model="email" type="email" required class="input" placeholder="admin@ticketshop.local" />
        </div>
        <div>
          <label class="label">Passwort</label>
          <input v-model="password" type="password" required class="input" placeholder="admin" />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="busy">
          {{ busy ? 'Anmelden…' : 'Anmelden' }}
        </button>
      </form>
      <ul class="mt-6 text-xs text-slate-500 space-y-1 border-t pt-4">
        <li><code>admin@ticketshop.local</code> / admin — voller Zugang</li>
        <li><code>scanner@ticketshop.local</code> / scanner — nur Scanner</li>
        <li><code>client@ticketshop.local</code> / client — Events/Orders</li>
        <li v-if="demoHint" class="text-amber-700">
          ALLOW_DEMO_LOGIN=true — beliebige Email wird als Admin akzeptiert (nur Dev)
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

<template>
  <div
    v-if="visible"
    class="fixed bottom-0 inset-x-0 z-50 border-t border-slate-200 bg-white shadow-lg"
  >
    <div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-slate-600">
        Essenzielle Cookies sind nötig für Warenkorb/Login. Statistik & Marketing nur mit Zustimmung.
        <NuxtLink to="/page/datenschutz" class="link">Datenschutz</NuxtLink>.
      </p>
      <div class="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button type="button" class="btn-secondary w-full sm:w-auto" @click="set('essential')">Nur essenziell</button>
        <button type="button" class="btn-primary w-full sm:w-auto" @click="set('all')">Alle akzeptieren</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const consent = useCookieConsent()
const visible = computed(() => consent.value === null)

onMounted(() => {
  const stored = localStorage.getItem('ts-cookie')
  if (stored === 'accepted' || stored === 'all') consent.value = 'all'
  else if (stored === 'rejected' || stored === 'essential') consent.value = 'essential'
  else consent.value = null
})

function set(value: 'essential' | 'all') {
  consent.value = value
  localStorage.setItem('ts-cookie', value)
}
</script>

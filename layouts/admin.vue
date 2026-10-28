<template>
  <div class="min-h-screen bg-slate-100 lg:flex" :class="consent === null ? 'pb-48 sm:pb-28' : ''">
    <button
      v-if="navOpen"
      type="button"
      class="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
      aria-label="Menü schließen"
      @click="navOpen = false"
    />
    <aside
      id="admin-nav"
      class="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col overflow-hidden bg-slate-900 text-slate-200 transition-transform duration-200 lg:static lg:z-auto lg:w-56 lg:shrink-0 lg:translate-x-0"
      :class="navOpen ? 'translate-x-0' : '-translate-x-full max-lg:invisible'"
    >
      <div class="flex items-start justify-between gap-2 border-b border-slate-700 px-4 py-4">
        <div class="min-w-0">
          <p class="text-xs uppercase tracking-wider text-slate-400">Organizer</p>
          <p class="font-bold text-white">TicketShop Admin</p>
          <p class="text-[10px] text-slate-400 mt-1 uppercase">{{ user?.role }}</p>
        </div>
        <button
          type="button"
          class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white hover:bg-slate-800 lg:hidden"
          aria-label="Menü schließen"
          @click="navOpen = false"
        >
          ✕
        </button>
      </div>
      <nav class="min-h-0 flex-1 overflow-y-auto py-2 text-sm">
        <NuxtLink
          v-for="item in visibleNav"
          :key="item.to"
          :to="item.to"
          class="flex min-h-11 items-center gap-2 px-4 py-2.5 hover:bg-slate-800 transition"
          :class="isNavActive(item.to) ? '!bg-blue-700 !text-white' : ''"
          @click="navOpen = false"
        >
          <span class="opacity-70 w-4 text-center">{{ item.icon }}</span>
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="shrink-0 border-t border-slate-700 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-sm">
        <NuxtLink
          v-if="isAdmin"
          to="/admin/settings"
          class="flex min-h-11 items-center gap-2 px-4 py-2.5 hover:bg-slate-800"
          active-class="!bg-blue-700 !text-white"
          @click="navOpen = false"
        >
          <span class="opacity-70">⚙</span> Settings
        </NuxtLink>
        <a href="/" target="_blank" class="flex min-h-11 items-center gap-2 px-4 py-2.5 hover:bg-slate-800 text-emerald-400">
          <span>●</span> Live site
        </a>
        <button type="button" class="flex min-h-11 w-full items-center gap-2 px-4 py-2.5 text-left text-red-300 hover:bg-slate-800" @click="onLogout">
          <span>↩</span> Logout
        </button>
      </div>
    </aside>
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 sm:gap-3 sm:px-6 sm:py-3">
        <button
          type="button"
          class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
          aria-controls="admin-nav"
          :aria-expanded="navOpen"
          aria-label="Menü öffnen"
          @click="navOpen = true"
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm text-slate-500">
            Angemeldet als <strong class="text-slate-800">{{ user?.email }}</strong>
          </p>
          <p class="truncate text-xs text-slate-400">{{ user?.role }} · SQLite + session auth</p>
        </div>
      </header>
      <main class="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, logout, isAdmin } = useAuth()
const navOpen = ref(false)
const route = useRoute()
const consent = useCookieConsent()

const nav = [
  { to: '/admin', label: 'Dashboard', icon: '▣', roles: ['admin', 'client'] },
  { to: '/admin/pages', label: 'Pages', icon: '▦', roles: ['admin'] },
  { to: '/admin/events', label: 'Events', icon: '🎫', roles: ['admin', 'client'] },
  { to: '/admin/orders', label: 'Orders', icon: '☰', roles: ['admin', 'client'] },
  { to: '/admin/scanner', label: 'Scanner', icon: '▣', roles: ['admin', 'scanner'] },
  { to: '/admin/monitoring', label: 'Monitoring', icon: '📡', roles: ['admin'] },
  { to: '/admin/clients', label: 'Clients', icon: '🏢', roles: ['admin'] },
  { to: '/admin/buyers', label: 'Buyers', icon: '👤', roles: ['admin', 'client'] },
  { to: '/admin/places', label: 'Places', icon: '📍', roles: ['admin', 'client'] },
  { to: '/admin/marketing', label: 'Marketing', icon: '📣', roles: ['admin'] },
  { to: '/admin/sponsors', label: 'Sponsors', icon: '★', roles: ['admin'] },
  { to: '/admin/users', label: 'Users', icon: '👥', roles: ['admin'] },
  { to: '/admin/affiliates', label: 'Affiliates', icon: '🔗', roles: ['admin'] },
  { to: '/admin/payouts', label: 'Payouts', icon: '€', roles: ['admin', 'client'] }
]

const visibleNav = computed(() => {
  const role = user.value?.role || 'admin'
  return nav.filter((n) => n.roles.includes(role))
})

function isNavActive(to: string) {
  const path = route.path
  if (to === '/admin') return path === '/admin'
  return path === to || path.startsWith(`${to}/`)
}

watch(() => route.fullPath, () => {
  navOpen.value = false
})

watch(navOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') navOpen.value = false
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

async function onLogout() {
  navOpen.value = false
  await logout()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 lg:flex" :class="consent === null ? 'pb-48 sm:pb-28' : ''">
    <button
      v-if="navOpen"
      type="button"
      class="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] lg:hidden"
      aria-label="Menü schließen"
      @click="navOpen = false"
    />
    <aside
      id="admin-nav"
      class="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col overflow-hidden border-r border-slate-200 bg-white text-slate-600 shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:w-60 lg:shrink-0 lg:translate-x-0 lg:shadow-none"
      :class="navOpen ? 'translate-x-0' : '-translate-x-full max-lg:invisible'"
    >
      <div class="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-5">
        <div class="min-w-0">
          <p class="eyebrow">Organizer</p>
          <p class="mt-1 font-semibold tracking-tight text-slate-900">TicketShop Admin</p>
          <p class="mt-1 text-[10px] uppercase tracking-wider text-slate-400">{{ user?.role }}</p>
        </div>
        <button
          type="button"
          class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-label="Menü schließen"
          @click="navOpen = false"
        >
          ✕
        </button>
      </div>
      <nav class="min-h-0 flex-1 overflow-y-auto px-2 py-3 text-sm">
        <NuxtLink
          v-for="item in visibleNav"
          :key="item.to"
          :to="item.to"
          class="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          :class="isNavActive(item.to) ? 'bg-slate-100 font-medium text-slate-900' : ''"
          @click="navOpen = false"
        >
          <span class="w-4 text-center text-slate-400">{{ item.icon }}</span>
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="shrink-0 border-t border-slate-100 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-sm">
        <NuxtLink
          v-if="isAdmin"
          to="/admin/settings"
          class="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          active-class="!bg-slate-100 !font-medium !text-slate-900"
          @click="navOpen = false"
        >
          <span class="w-4 text-center text-slate-400">⚙</span> Settings
        </NuxtLink>
        <a href="/" target="_blank" class="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
          <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live site
        </a>
        <button type="button" class="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-slate-600 hover:bg-rose-50 hover:text-rose-700" @click="onLogout">
          <span class="w-4 text-center text-slate-400">↩</span> Logout
        </button>
      </div>
    </aside>
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200/80 bg-white/80 px-3 py-2 backdrop-blur-md sm:gap-3 sm:px-6 sm:py-3">
        <button
          type="button"
          class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 lg:hidden"
          aria-controls="admin-nav"
          :aria-expanded="navOpen"
          aria-label="Menü öffnen"
          @click="navOpen = true"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm text-slate-500">
            Angemeldet als <strong class="font-medium text-slate-900">{{ user?.email }}</strong>
          </p>
          <p class="truncate text-xs text-slate-400">{{ user?.role }} · SQLite + session auth</p>
        </div>
      </header>
      <main class="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
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

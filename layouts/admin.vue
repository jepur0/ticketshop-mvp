<template>
  <div class="admin-shell min-h-screen lg:flex" :class="consent === null ? 'pb-48 sm:pb-28' : ''">
    <button
      v-if="navOpen"
      type="button"
      class="fixed inset-0 z-40 bg-night/40 backdrop-blur-[2px] lg:hidden"
      aria-label="Menü schließen"
      @click="navOpen = false"
    />
    <aside
      id="admin-nav"
      class="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col overflow-hidden bg-night text-paper-soft shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:w-60 lg:shrink-0 lg:translate-x-0 lg:shadow-none"
      :class="navOpen ? 'translate-x-0' : '-translate-x-full max-lg:invisible'"
    >
      <div class="flex items-start justify-between gap-2 border-b border-night-line px-4 py-5">
        <div class="min-w-0">
          <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-soft/80">Organizer</p>
          <p class="mt-1 font-display text-xl font-medium text-white">TicketShop</p>
          <p class="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/40">{{ user?.role }}</p>
        </div>
        <button
          type="button"
          class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-paper-soft hover:bg-white/10 lg:hidden"
          aria-label="Menü schließen"
          @click="navOpen = false"
        >
          ✕
        </button>
      </div>
      <nav class="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        <NuxtLink
          v-for="item in visibleNav"
          :key="item.to"
          :to="item.to"
          class="admin-nav-link min-h-11"
          :class="isNavActive(item.to) ? 'is-active' : ''"
          @click="navOpen = false"
        >
          <span class="w-4 text-center opacity-70">{{ item.icon }}</span>
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="shrink-0 space-y-0.5 border-t border-night-line px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-sm">
        <NuxtLink
          v-if="isAdmin"
          to="/admin/settings"
          class="admin-nav-link min-h-11"
          :class="isNavActive('/admin/settings') ? 'is-active' : ''"
          @click="navOpen = false"
        >
          <span class="opacity-70">⚙</span> Einstellungen
        </NuxtLink>
        <a href="/" target="_blank" class="admin-nav-link min-h-11 !text-accent">
          <span>●</span> Live-Shop
        </a>
        <button type="button" class="admin-nav-link min-h-11 w-full !text-red-300/90" @click="onLogout">
          <span>↩</span> Abmelden
        </button>
      </div>
    </aside>
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-paper-card/90 px-3 py-2 backdrop-blur sm:gap-3 sm:px-6 sm:py-3.5">
        <button
          type="button"
          class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-strong bg-paper-card text-ink lg:hidden"
          aria-controls="admin-nav"
          :aria-expanded="navOpen"
          aria-label="Menü öffnen"
          @click="navOpen = true"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <p class="min-w-0 flex-1 truncate text-sm text-ink-soft">
          Angemeldet als <strong class="font-semibold text-ink">{{ user?.email }}</strong>
          <span class="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-deep">{{ user?.role }}</span>
        </p>
        <span class="hidden shrink-0 rounded-full border border-line px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-ink-muted sm:inline">Session · SQLite</span>
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
  { to: '/admin/pages', label: 'Seiten', icon: '▦', roles: ['admin'] },
  { to: '/admin/events', label: 'Events', icon: '🎫', roles: ['admin', 'client'] },
  { to: '/admin/orders', label: 'Bestellungen', icon: '☰', roles: ['admin', 'client'] },
  { to: '/admin/scanner', label: 'Scanner', icon: '▣', roles: ['admin', 'scanner'] },
  { to: '/admin/monitoring', label: 'Monitoring', icon: '📡', roles: ['admin'] },
  { to: '/admin/clients', label: 'Kunden', icon: '🏢', roles: ['admin'] },
  { to: '/admin/buyers', label: 'Käufer', icon: '👤', roles: ['admin', 'client'] },
  { to: '/admin/places', label: 'Orte', icon: '📍', roles: ['admin', 'client'] },
  { to: '/admin/marketing', label: 'Marketing', icon: '📣', roles: ['admin'] },
  { to: '/admin/sponsors', label: 'Sponsoren', icon: '★', roles: ['admin'] },
  { to: '/admin/users', label: 'Benutzer', icon: '👥', roles: ['admin'] },
  { to: '/admin/affiliates', label: 'Affiliate', icon: '🔗', roles: ['admin'] },
  { to: '/admin/payouts', label: 'Auszahlungen', icon: '€', roles: ['admin', 'client'] }
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

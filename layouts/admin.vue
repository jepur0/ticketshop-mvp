<template>
  <div class="min-h-screen flex bg-slate-100">
    <aside class="w-56 shrink-0 bg-slate-900 text-slate-200 flex flex-col">
      <div class="px-4 py-4 border-b border-slate-700">
        <p class="text-xs uppercase tracking-wider text-slate-400">Organizer</p>
        <p class="font-bold text-white">TicketShop Admin</p>
        <p class="text-[10px] text-slate-400 mt-1 uppercase">{{ user?.role }}</p>
      </div>
      <nav class="flex-1 overflow-y-auto py-3 text-sm">
        <NuxtLink
          v-for="item in visibleNav"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 transition"
          active-class="!bg-blue-700 !text-white"
        >
          <span class="opacity-70 w-4 text-center">{{ item.icon }}</span>
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="border-t border-slate-700 py-2 text-sm">
        <NuxtLink
          v-if="isAdmin"
          to="/admin/settings"
          class="flex items-center gap-2 px-4 py-2 hover:bg-slate-800"
          active-class="!bg-blue-700 !text-white"
        >
          <span class="opacity-70">⚙</span> Settings
        </NuxtLink>
        <a href="/" target="_blank" class="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 text-emerald-400">
          <span>●</span> Live site
        </a>
        <button type="button" class="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-800 text-left text-red-300" @click="onLogout">
          <span>↩</span> Logout
        </button>
      </div>
    </aside>
    <div class="flex-1 flex flex-col min-w-0">
      <header class="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <p class="text-sm text-slate-500">
          Angemeldet als <strong class="text-slate-800">{{ user?.email }}</strong>
          <span class="ml-2 text-xs rounded bg-slate-100 px-2 py-0.5">{{ user?.role }}</span>
        </p>
        <span class="text-xs rounded-full bg-blue-50 text-blue-800 px-2 py-0.5 font-medium">SQLite + session auth</span>
      </header>
      <main class="flex-1 p-6 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, logout, isAdmin } = useAuth()

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

async function onLogout() {
  await logout()
  navigateTo('/login')
}
</script>

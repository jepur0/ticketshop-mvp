<template>
  <div class="min-h-screen flex flex-col" :class="consent === null ? 'pb-48 sm:pb-28' : ''">
    <header class="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-4 sm:py-3">
        <NuxtLink to="/" class="flex min-w-0 items-center gap-2 font-bold text-lg text-blue-800">
          <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white text-sm">TS</span>
          <span class="hidden truncate min-[380px]:inline">TicketShop</span>
        </NuxtLink>
        <nav class="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
          <NuxtLink to="/" class="hover:text-blue-700">Start</NuxtLink>
          <NuxtLink to="/archive" class="hover:text-blue-700">Alle Events</NuxtLink>
          <NuxtLink to="/ticket-find" class="hover:text-blue-700">Tickets finden</NuxtLink>
          <NuxtLink to="/login" class="hover:text-blue-700">Organizer</NuxtLink>
        </nav>
        <div class="flex shrink-0 items-center gap-2">
          <button
            type="button"
            class="inline-flex h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
            title="Sprachumschalter (Stub)"
          >
            DE ▾
          </button>
          <NuxtLink to="/checkout" class="relative btn-secondary whitespace-nowrap !px-3 text-xs sm:text-sm">
            Warenkorb
            <span
              v-if="count"
              class="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white"
            >{{ count }}</span>
          </NuxtLink>
          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
            :aria-expanded="menuOpen"
            aria-controls="mobile-nav"
            :aria-label="menuOpen ? 'Menü schließen' : 'Menü öffnen'"
            @click="menuOpen = !menuOpen"
          >
            <svg v-if="!menuOpen" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            <svg v-else class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>
      <nav
        v-show="menuOpen"
        id="mobile-nav"
        class="border-t border-slate-100 bg-white lg:hidden"
      >
        <NuxtLink
          to="/"
          class="flex min-h-11 items-center border-b border-slate-100 px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
          exact-active-class="bg-blue-50 text-blue-800"
          @click="menuOpen = false"
        >
          Start
        </NuxtLink>
        <NuxtLink
          to="/archive"
          class="flex min-h-11 items-center border-b border-slate-100 px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
          active-class="bg-blue-50 text-blue-800"
          @click="menuOpen = false"
        >
          Alle Events
        </NuxtLink>
        <NuxtLink
          to="/ticket-find"
          class="flex min-h-11 items-center border-b border-slate-100 px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
          active-class="bg-blue-50 text-blue-800"
          @click="menuOpen = false"
        >
          Tickets finden
        </NuxtLink>
        <NuxtLink
          to="/login"
          class="flex min-h-11 items-center px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
          active-class="bg-blue-50 text-blue-800"
          @click="menuOpen = false"
        >
          Organizer
        </NuxtLink>
      </nav>
    </header>

    <main class="flex-1 min-w-0">
      <slot />
    </main>

    <footer class="border-t border-slate-200 bg-white mt-12">
      <div class="mx-auto max-w-6xl px-4 py-8 grid gap-6 sm:grid-cols-3 text-sm text-slate-600">
        <div>
          <p class="font-semibold text-slate-900 mb-2">TicketShop</p>
          <p>MVP-Demo für WAW Media / Frankfurt. Keine echte Zahlung.</p>
        </div>
        <div>
          <p class="font-semibold text-slate-900 mb-2">Rechtliches</p>
          <ul class="space-y-1">
            <li><NuxtLink to="/page/impressum" class="inline-flex min-h-11 items-center hover:text-blue-700 sm:min-h-0">Impressum</NuxtLink></li>
            <li><NuxtLink to="/page/datenschutz" class="inline-flex min-h-11 items-center hover:text-blue-700 sm:min-h-0">Datenschutz</NuxtLink></li>
            <li><NuxtLink to="/page/agb" class="inline-flex min-h-11 items-center hover:text-blue-700 sm:min-h-0">AGB</NuxtLink></li>
          </ul>
        </div>
        <div>
          <p class="font-semibold text-slate-900 mb-2">Hilfe</p>
          <ul class="space-y-1">
            <li><NuxtLink to="/ticket-find" class="inline-flex min-h-11 items-center hover:text-blue-700 sm:min-h-0">Tickets finden / erneut senden</NuxtLink></li>
            <li><a href="mailto:support@ticketshop.local" class="inline-flex min-h-11 items-center break-all hover:text-blue-700 sm:min-h-0">support@ticketshop.local</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-slate-100 py-3 text-center text-xs text-slate-400">
        © {{ year }} TicketShop MVP — Demo only
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const { count } = useCart()
const year = new Date().getFullYear()
const menuOpen = ref(false)
const route = useRoute()
const consent = useCookieConsent()

watch(() => route.fullPath, () => {
  menuOpen.value = false
})
</script>

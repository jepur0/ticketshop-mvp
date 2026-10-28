<template>
  <div class="min-h-screen flex flex-col" :class="consent === null ? 'pb-48 sm:pb-28' : ''">
    <header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-4 sm:py-3">
        <NuxtLink to="/" class="flex min-w-0 items-center gap-2.5 text-slate-900">
          <span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-900 text-[11px] font-semibold tracking-tight">TS</span>
          <span class="hidden truncate text-[15px] font-medium tracking-tight min-[380px]:inline">TicketShop</span>
        </NuxtLink>
        <nav class="hidden items-center gap-6 text-sm text-slate-500 lg:flex">
          <NuxtLink to="/" class="transition hover:text-slate-900" exact-active-class="font-medium text-slate-900">Start</NuxtLink>
          <NuxtLink to="/archive" class="transition hover:text-slate-900" active-class="font-medium text-slate-900">Alle Events</NuxtLink>
          <NuxtLink to="/ticket-find" class="transition hover:text-slate-900" active-class="font-medium text-slate-900">Tickets finden</NuxtLink>
          <NuxtLink to="/login" class="transition hover:text-slate-900" active-class="font-medium text-slate-900">Organizer</NuxtLink>
        </nav>
        <div class="flex shrink-0 items-center gap-2">
          <button
            type="button"
            class="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-medium uppercase tracking-wide text-slate-500"
            title="Sprachumschalter (Stub)"
          >
            DE ▾
          </button>
          <NuxtLink to="/checkout" class="btn-secondary relative whitespace-nowrap !px-3.5 text-xs sm:text-sm">
            Warenkorb
            <span
              v-if="count"
              class="absolute -top-1 right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white"
            >{{ count }}</span>
          </NuxtLink>
          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 lg:hidden"
            :aria-expanded="menuOpen"
            aria-controls="mobile-nav"
            :aria-label="menuOpen ? 'Menü schließen' : 'Menü öffnen'"
            @click="menuOpen = !menuOpen"
          >
            <svg v-if="!menuOpen" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>
      <nav
        v-show="menuOpen"
        id="mobile-nav"
        class="border-t border-slate-100 bg-white/95 lg:hidden"
      >
        <NuxtLink
          to="/"
          class="flex min-h-11 items-center border-b border-slate-100 px-4 py-3 text-base text-slate-600 hover:bg-slate-50"
          exact-active-class="bg-slate-50 font-medium text-slate-900"
          @click="menuOpen = false"
        >
          Start
        </NuxtLink>
        <NuxtLink
          to="/archive"
          class="flex min-h-11 items-center border-b border-slate-100 px-4 py-3 text-base text-slate-600 hover:bg-slate-50"
          active-class="bg-slate-50 font-medium text-slate-900"
          @click="menuOpen = false"
        >
          Alle Events
        </NuxtLink>
        <NuxtLink
          to="/ticket-find"
          class="flex min-h-11 items-center border-b border-slate-100 px-4 py-3 text-base text-slate-600 hover:bg-slate-50"
          active-class="bg-slate-50 font-medium text-slate-900"
          @click="menuOpen = false"
        >
          Tickets finden
        </NuxtLink>
        <NuxtLink
          to="/login"
          class="flex min-h-11 items-center px-4 py-3 text-base text-slate-600 hover:bg-slate-50"
          active-class="bg-slate-50 font-medium text-slate-900"
          @click="menuOpen = false"
        >
          Organizer
        </NuxtLink>
      </nav>
    </header>

    <main class="flex-1 min-w-0">
      <slot />
    </main>

    <footer class="mt-16 border-t border-slate-200/80 bg-white">
      <div class="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-slate-600 sm:grid-cols-3">
        <div>
          <p class="mb-2 font-medium tracking-tight text-slate-900">TicketShop</p>
          <p class="leading-relaxed">MVP-Demo für WAW Media / Frankfurt. Keine echte Zahlung.</p>
        </div>
        <div>
          <p class="mb-2 font-medium tracking-tight text-slate-900">Rechtliches</p>
          <ul class="space-y-1">
            <li><NuxtLink to="/page/impressum" class="inline-flex min-h-11 items-center transition hover:text-slate-900 sm:min-h-0">Impressum</NuxtLink></li>
            <li><NuxtLink to="/page/datenschutz" class="inline-flex min-h-11 items-center transition hover:text-slate-900 sm:min-h-0">Datenschutz</NuxtLink></li>
            <li><NuxtLink to="/page/agb" class="inline-flex min-h-11 items-center transition hover:text-slate-900 sm:min-h-0">AGB</NuxtLink></li>
          </ul>
        </div>
        <div>
          <p class="mb-2 font-medium tracking-tight text-slate-900">Hilfe</p>
          <ul class="space-y-1">
            <li><NuxtLink to="/ticket-find" class="inline-flex min-h-11 items-center transition hover:text-slate-900 sm:min-h-0">Tickets finden / erneut senden</NuxtLink></li>
            <li><a href="mailto:support@ticketshop.local" class="inline-flex min-h-11 items-center break-all transition hover:text-slate-900 sm:min-h-0">support@ticketshop.local</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-slate-100 py-4 text-center text-xs tracking-wide text-slate-400">
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

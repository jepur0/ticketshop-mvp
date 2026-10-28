<template>
  <div class="min-h-screen flex flex-col" :class="consent === null ? 'pb-48 sm:pb-28' : ''">
    <header class="sticky top-0 z-40 border-b border-line/80 bg-paper/80 backdrop-blur-xl">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3.5">
        <NuxtLink to="/" class="group flex min-w-0 items-center gap-2.5">
          <span
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-night text-[11px] font-bold tracking-wide text-gold-soft shadow-glow"
          >TS</span>
          <span class="min-w-0 leading-tight">
            <span class="block truncate text-[15px] font-semibold tracking-tight text-ink">TicketShop</span>
            <span class="hidden text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted min-[380px]:block">by WAW Media</span>
          </span>
        </NuxtLink>
        <nav class="hidden items-center gap-1 text-sm font-medium text-ink-soft md:flex">
          <NuxtLink to="/" class="rounded-full px-3 py-2 hover:bg-white/70 hover:text-ink">Start</NuxtLink>
          <NuxtLink to="/archive" class="rounded-full px-3 py-2 hover:bg-white/70 hover:text-ink">Alle Events</NuxtLink>
          <NuxtLink to="/ticket-find" class="rounded-full px-3 py-2 hover:bg-white/70 hover:text-ink">Tickets finden</NuxtLink>
          <NuxtLink to="/login" class="rounded-full px-3 py-2 hover:bg-white/70 hover:text-ink">Organizer</NuxtLink>
        </nav>
        <div class="flex shrink-0 items-center gap-2">
          <span class="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted sm:inline">DE</span>
          <NuxtLink to="/checkout" class="relative btn-secondary !min-h-9 !px-3.5 !py-1.5 text-xs">
            Warenkorb
            <span
              v-if="count"
              class="absolute -top-1 right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-night"
            >{{ count }}</span>
          </NuxtLink>
          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-paper-card text-ink md:hidden"
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
        class="border-t border-line bg-paper-card/95 md:hidden"
      >
        <NuxtLink to="/" class="flex min-h-11 items-center border-b border-line px-4 py-3 text-base text-ink-soft hover:bg-white/70 hover:text-ink" @click="menuOpen = false">Start</NuxtLink>
        <NuxtLink to="/archive" class="flex min-h-11 items-center border-b border-line px-4 py-3 text-base text-ink-soft hover:bg-white/70 hover:text-ink" @click="menuOpen = false">Alle Events</NuxtLink>
        <NuxtLink to="/ticket-find" class="flex min-h-11 items-center border-b border-line px-4 py-3 text-base text-ink-soft hover:bg-white/70 hover:text-ink" @click="menuOpen = false">Tickets finden</NuxtLink>
        <NuxtLink to="/login" class="flex min-h-11 items-center px-4 py-3 text-base text-ink-soft hover:bg-white/70 hover:text-ink" @click="menuOpen = false">Organizer</NuxtLink>
      </nav>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="mt-16 border-t border-line bg-night text-paper-soft">
      <div class="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <p class="font-display text-xl font-medium text-paper-soft">TicketShop</p>
          <p class="mt-3 text-sm leading-relaxed text-white/55">
            Premium Ticketing für Konzerte und Events. Demo für WAW Media / Frankfurt.
          </p>
        </div>
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-soft/90">Rechtliches</p>
          <ul class="mt-3 space-y-2 text-sm text-white/65">
            <li><NuxtLink to="/page/impressum" class="inline-flex min-h-11 items-center hover:text-gold-soft sm:min-h-0">Impressum</NuxtLink></li>
            <li><NuxtLink to="/page/datenschutz" class="inline-flex min-h-11 items-center hover:text-gold-soft sm:min-h-0">Datenschutz</NuxtLink></li>
            <li><NuxtLink to="/page/agb" class="inline-flex min-h-11 items-center hover:text-gold-soft sm:min-h-0">AGB</NuxtLink></li>
          </ul>
        </div>
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-soft/90">Hilfe</p>
          <ul class="mt-3 space-y-2 text-sm text-white/65">
            <li><NuxtLink to="/ticket-find" class="inline-flex min-h-11 items-center hover:text-gold-soft sm:min-h-0">Tickets finden / erneut senden</NuxtLink></li>
            <li><a href="mailto:support@ticketshop.local" class="inline-flex min-h-11 items-center break-all hover:text-gold-soft sm:min-h-0">support@ticketshop.local</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-white/10 py-4 text-center text-xs text-white/35">
        © {{ year }} TicketShop · WAW Media
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

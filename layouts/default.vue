<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg text-blue-800">
          <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white text-sm">TS</span>
          TicketShop
        </NuxtLink>
        <nav class="hidden sm:flex items-center gap-5 text-sm font-medium text-slate-600">
          <NuxtLink to="/" class="hover:text-blue-700">Start</NuxtLink>
          <NuxtLink to="/archive" class="hover:text-blue-700">Alle Events</NuxtLink>
          <NuxtLink to="/ticket-find" class="hover:text-blue-700">Tickets finden</NuxtLink>
          <NuxtLink to="/login" class="hover:text-blue-700">Organizer</NuxtLink>
        </nav>
        <div class="flex items-center gap-3">
          <button type="button" class="text-xs font-semibold uppercase tracking-wide text-slate-500 border border-slate-200 rounded px-2 py-1" title="Sprachumschalter (Stub)">
            DE ▾
          </button>
          <NuxtLink to="/checkout" class="relative btn-secondary !py-1.5 !px-3 text-xs">
            Warenkorb
            <span
              v-if="count"
              class="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white"
            >{{ count }}</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="flex-1">
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
            <li><NuxtLink to="/page/impressum" class="hover:text-blue-700">Impressum</NuxtLink></li>
            <li><NuxtLink to="/page/datenschutz" class="hover:text-blue-700">Datenschutz</NuxtLink></li>
            <li><NuxtLink to="/page/agb" class="hover:text-blue-700">AGB</NuxtLink></li>
          </ul>
        </div>
        <div>
          <p class="font-semibold text-slate-900 mb-2">Hilfe</p>
          <ul class="space-y-1">
            <li><NuxtLink to="/ticket-find" class="hover:text-blue-700">Tickets finden / erneut senden</NuxtLink></li>
            <li><a href="mailto:support@ticketshop.local" class="hover:text-blue-700">support@ticketshop.local</a></li>
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
</script>

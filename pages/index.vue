<template>
  <div>
    <section class="relative overflow-hidden border-b border-line/70 bg-night">
      <img
        src="/images/hero-editorial.webp"
        alt=""
        class="pointer-events-none absolute inset-0 h-full w-full object-cover object-[70%_center] opacity-90"
        aria-hidden="true"
        fetchpriority="high"
        decoding="async"
      />
      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-r from-night via-night/85 to-night/35"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-t from-night via-transparent to-night/40"
        aria-hidden="true"
      />
      <div class="relative mx-auto max-w-6xl px-4 py-20 sm:py-28 lg:py-32">
        <p class="eyebrow !text-gold-soft/90">
          <span class="!shadow-none" />Tickets online
        </p>
        <h1 class="font-display mt-5 max-w-3xl break-words text-[2.15rem] font-medium leading-[1.08] text-paper-soft min-[390px]:text-[2.35rem] sm:text-6xl sm:leading-[1.02] lg:text-[4.35rem]">
          Events &amp; Konzerte — <em class="not-italic text-gold-soft">einfach</em> Tickets kaufen
        </h1>
        <p class="mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
          Sitzplätze wählen, sicher bezahlen, Ticket per E-Mail. Premium-Shop für WAW Media.
        </p>
        <div class="mt-10 flex flex-col gap-3 sm:flex-row">
          <NuxtLink to="/archive" class="btn-accent w-full sm:w-auto">Alle Events</NuxtLink>
          <NuxtLink to="/ticket-find" class="btn-secondary w-full border-white/20 bg-white/5 text-paper-soft hover:bg-white/10 sm:w-auto">Tickets finden</NuxtLink>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-4 py-14 sm:py-20">
      <div class="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="eyebrow">Programm</p>
          <h2 class="page-title mt-3">Aktuelle Events</h2>
        </div>
        <NuxtLink to="/archive" class="link inline-flex min-h-11 items-center text-sm sm:min-h-0">Alle anzeigen →</NuxtLink>
      </div>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <EventCard v-for="e in featured()" :key="e.id" :event="e" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { featured, events } = useEvents()
const { data } = await useAsyncData('home-events', () => $fetch('/api/public/events'))
if (Array.isArray(data.value) && data.value.length) {
  events.value = data.value as any
}

useHead({
  link: [{ rel: 'preload', as: 'image', href: '/images/hero-editorial.webp' }]
})
</script>

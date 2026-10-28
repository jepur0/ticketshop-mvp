<template>
  <div>
    <section class="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-[#f4efe6] via-slate-50 to-slate-50">
      <div
        class="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style="background-image: radial-gradient(ellipse at 12% 0%, rgba(255,255,255,0.95), transparent 52%), radial-gradient(ellipse at 92% 8%, rgba(15,23,42,0.05), transparent 42%);"
      />
      <div class="relative mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:py-28">
        <p class="eyebrow mb-5">Tickets online</p>
        <h1 class="font-display max-w-3xl text-[2.65rem] font-medium leading-[1.04] text-slate-900 sm:text-6xl lg:text-[4.25rem]">
          Events & Konzerte — einfach Tickets kaufen
        </h1>
        <p class="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Sitzplätze wählen, sicher bezahlen, Ticket per E-Mail. Demo-Shop für WAW Media.
        </p>
        <div class="mt-10 flex flex-col gap-3 sm:flex-row">
          <NuxtLink to="/archive" class="btn-primary w-full sm:w-auto">Alle Events</NuxtLink>
          <NuxtLink to="/ticket-find" class="btn-secondary w-full sm:w-auto">Tickets finden</NuxtLink>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div class="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="eyebrow">Programm</p>
          <h2 class="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">Aktuelle Events</h2>
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
const { featured } = useEvents()
</script>

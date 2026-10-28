<template>
  <div>
    <section class="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white">
      <div class="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <p class="text-sm font-semibold uppercase tracking-widest text-blue-200 mb-3">Tickets online</p>
        <h1 class="text-3xl sm:text-4xl font-bold max-w-xl leading-tight">
          Events & Konzerte — einfach Tickets kaufen
        </h1>
        <p class="mt-4 max-w-lg text-blue-100">
          Sitzplätze wählen, sicher bezahlen, Ticket per E-Mail. Demo-Shop für WAW Media.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <NuxtLink to="/archive" class="btn-primary !bg-amber-500 !text-slate-900 hover:!bg-amber-400">Alle Events</NuxtLink>
          <NuxtLink to="/ticket-find" class="btn-secondary !bg-white/10 !border-white/30 !text-white hover:!bg-white/20">Tickets finden</NuxtLink>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-4 py-12">
      <div class="flex items-end justify-between mb-6">
        <h2 class="text-xl font-bold text-slate-900">Aktuelle Events</h2>
        <NuxtLink to="/archive" class="text-sm font-medium text-blue-700 hover:underline">Alle anzeigen →</NuxtLink>
      </div>
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <EventCard v-for="e in featured()" :key="e.id" :event="e" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { featured } = useEvents()
</script>

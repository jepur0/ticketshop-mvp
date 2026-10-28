<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900 mb-1">{{ title }}</h1>
    <p v-if="subtitle" class="text-sm text-slate-500 mb-6">{{ subtitle }}</p>
    <div class="card p-8 text-center text-slate-500">
      <p class="text-3xl mb-3">🚧</p>
      <p class="font-medium text-slate-700">Coming soon</p>
      <p class="text-sm mt-1">{{ hint || 'Dieser Bereich ist im MVP nur als Menüpunkt vorbereitet.' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; subtitle?: string; hint?: string }>()
</script>

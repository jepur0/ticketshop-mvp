<template>
  <span class="shrink-0 whitespace-nowrap" :class="on ? 'font-medium text-emerald-600' : 'font-medium text-amber-600'">
    {{ on ? 'gesetzt' : 'leer' }}
  </span>
</template>
<script setup lang="ts">
defineProps<{ on: boolean }>()
</script>

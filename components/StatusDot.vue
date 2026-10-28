<template>
  <span :class="on ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'">
    {{ on ? 'gesetzt' : 'leer' }}
  </span>
</template>
<script setup lang="ts">
defineProps<{ on: boolean }>()
</script>

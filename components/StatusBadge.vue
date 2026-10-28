<template>
  <span
    class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize"
    :class="cls"
  >{{ status }}</span>
</template>

<script setup lang="ts">
const props = defineProps<{ status: string }>()
const cls = computed(() => {
  switch (props.status) {
    case 'paid': return 'bg-emerald-100 text-emerald-800'
    case 'pending': return 'bg-amber-100 text-amber-800'
    case 'refunded': return 'bg-slate-100 text-slate-600'
    default: return 'bg-slate-100 text-slate-600'
  }
})
</script>

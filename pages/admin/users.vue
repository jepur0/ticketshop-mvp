<template>
  <div>
    <h1 class="text-2xl font-bold mb-1">Users</h1>
    <p class="text-sm text-slate-500 mb-6">SQLite users (bcrypt). Seed: admin / scanner / client @ticketshop.local</p>
    <div v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</div>
    <div class="card overflow-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th class="px-4 py-2">Email</th>
            <th class="px-4 py-2">Name</th>
            <th class="px-4 py-2">Role</th>
            <th class="px-4 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="border-t border-slate-100">
            <td class="px-4 py-2 font-mono text-xs">{{ u.email }}</td>
            <td class="px-4 py-2">{{ u.name }}</td>
            <td class="px-4 py-2"><span class="rounded bg-slate-100 px-2 py-0.5 text-xs">{{ u.role }}</span></td>
            <td class="px-4 py-2 text-xs text-slate-500">{{ formatAt(u.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })
const users = ref<any[]>([])
const error = ref('')
function formatAt(iso: string) {
  return new Date(iso).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })
}
onMounted(async () => {
  try {
    const res = await $fetch<{ users: any[] }>('/api/admin/users')
    users.value = res.users || []
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || 'Laden fehlgeschlagen'
  }
})
</script>

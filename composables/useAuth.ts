export type Role = 'admin' | 'scanner' | 'client'

export type AuthUser = {
  id?: string
  email: string
  role: Role
  name?: string | null
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const bootstrapped = useState('auth-bootstrapped', () => false)

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const canScan = computed(() => user.value?.role === 'admin' || user.value?.role === 'scanner')
  const canManage = computed(() => user.value?.role === 'admin' || user.value?.role === 'client')

  async function refresh() {
    try {
      const res = await $fetch<{ user: AuthUser | null }>('/api/auth/me')
      user.value = res.user
    } catch {
      user.value = null
    } finally {
      bootstrapped.value = true
    }
    return user.value
  }

  async function login(email: string, password: string) {
    const res = await $fetch<{ user: AuthUser; demo?: boolean }>('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    user.value = res.user
    bootstrapped.value = true
    return res
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      /* ignore */
    }
    user.value = null
  }

  /** @deprecated use refresh — kept for middleware compat */
  function restore() {
    if (!bootstrapped.value) {
      // fire and forget; middleware awaits refresh when needed
      refresh()
    }
  }

  return {
    user,
    bootstrapped,
    isLoggedIn,
    isAdmin,
    canScan,
    canManage,
    login,
    logout,
    restore,
    refresh
  }
}

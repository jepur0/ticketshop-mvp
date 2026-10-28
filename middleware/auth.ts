export default defineNuxtRouteMiddleware(async (to) => {
  const { isLoggedIn, refresh, bootstrapped, user, canScan, isAdmin } = useAuth()

  if (!bootstrapped.value) {
    await refresh()
  }

  if (!isLoggedIn.value && to.path.startsWith('/admin')) {
    return navigateTo('/login')
  }

  const role = user.value?.role
  if (role === 'scanner' && to.path.startsWith('/admin') && to.path !== '/admin/scanner') {
    return navigateTo('/admin/scanner')
  }
  if (to.path.startsWith('/admin/settings') && !isAdmin.value) {
    return navigateTo('/admin')
  }
  if (to.path.startsWith('/admin/scanner') && !canScan.value) {
    return navigateTo('/admin')
  }
  if (to.path.startsWith('/admin/monitoring') && !isAdmin.value) {
    return navigateTo('/admin')
  }
})

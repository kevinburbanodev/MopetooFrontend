// ============================================================
// maintenance — global route middleware (RF-1200 to RF-1209)
//
// Runs on every route navigation. Behaviour:
//
//   1. Admin users bypass maintenance entirely — they must always
//      be able to reach the admin panel to disable maintenance.
//
//   2. If maintenance IS enabled and the user is NOT on /maintenance
//      and the user is NOT an admin → redirect to /maintenance.
//
//   3. If maintenance is NOT enabled and the user IS on /maintenance
//      → redirect to / (maintenance is over).
//
// Registration: Nuxt automatically registers files in app/middleware/
// as global middlewares when they are named WITHOUT a leading dot.
// Named (non-global) middlewares require definePageMeta({ middleware }).
// This file uses a default export, which makes it global.
//
// NOTE: This middleware reads the maintenanceStore, which is populated
// by either:
//   a. The `x-maintenance` header interceptor in useApi.ts (client-side,
//      passive — triggered when any API call comes back with the header)
//   b. Direct admin fetch via useMaintenance().fetchStatus()
//
// The middleware does NOT call fetchStatus() itself to avoid adding an
// API round-trip to every navigation. The interceptor in useApi.ts
// handles reactive detection from the backend.
// ============================================================

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  const maintenanceStore = useMaintenanceStore()

  // Admin users always bypass maintenance
  if (authStore.isAdmin) return

  const isMaintenancePage = to.path === '/maintenance'

  if (maintenanceStore.isEnabled && !isMaintenancePage) {
    // Site is under maintenance and user is trying to reach any other page
    return navigateTo('/maintenance')
  }

  if (!maintenanceStore.isEnabled && isMaintenancePage) {
    // Maintenance has ended; redirect stale /maintenance visitors home
    return navigateTo('/')
  }
})

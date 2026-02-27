<script setup lang="ts">
// /maintenance — full-page maintenance view
//
// NO middleware is applied here. The maintenance page must be
// reachable by everyone, including users who are being redirected
// here by the global maintenance middleware. Applying the auth or
// guest middleware would create redirect loops.
//
// Admins can always reach /maintenance directly to preview the page,
// but the global maintenance middleware never redirects admins here.

// Opt out of the global maintenance middleware redirect so admins
// viewing this page for preview purposes are not bounced back to /.
// (The middleware itself handles this logic, but marking the route
// explicitly makes the intent clear to future maintainers.)
definePageMeta({
  // No middleware — see comment above
})

useHead({
  title: 'En mantenimiento — Mopetoo',
  meta: [
    // Prevent search engines from indexing the maintenance page.
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})

// Read the current maintenance status from the store so we can pass
// any custom message configured by the admin to the component.
// The store is populated by the global maintenance middleware (which
// calls fetchStatus) or by the admin toggling via MaintenanceToggle.
const maintenanceStore = useMaintenanceStore()
</script>

<template>
  <MaintenancePage :message="maintenanceStore.status?.message" />
</template>

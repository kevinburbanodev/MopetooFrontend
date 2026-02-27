<script setup lang="ts">
// Admin shelters page — thin wrapper.
// Protected by admin middleware (checks isAuthenticated + isAdmin).

definePageMeta({
  name: 'admin-shelters',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Gestión de Refugios — Admin Mopetoo',
  description: 'Panel de administración: gestión de refugios de animales',
})
</script>

<template>
  <div class="container py-4">
    <div class="d-flex align-items-center gap-3 mb-4">
      <NuxtLink
        to="/admin"
        class="btn btn-sm btn-link p-0 text-muted text-decoration-none"
        aria-label="Volver al panel"
      >
        &larr; Panel
      </NuxtLink>
      <h1 class="h3 fw-bold mb-0">
        <span aria-hidden="true">🏠</span> Gestión de Refugios
      </h1>
    </div>
    <AdminShelterManager />
  </div>
</template>

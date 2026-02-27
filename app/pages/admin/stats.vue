<script setup lang="ts">
// Admin stats page — shows the full KPI dashboard with a different title.
// Thin wrapper around AdminDashboard. Protected by admin middleware.

definePageMeta({
  name: 'admin-stats',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Estadísticas del Sistema — Admin Mopetoo',
  description: 'Panel de administración: estadísticas y métricas de la plataforma Mopetoo',
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
        <span aria-hidden="true">📊</span> Estadísticas del Sistema
      </h1>
    </div>
    <AdminDashboard />
  </div>
</template>

<script setup lang="ts">
// Admin dashboard page — thin wrapper.
// Protected by admin middleware (checks isAuthenticated + isAdmin).

definePageMeta({
  name: 'admin-dashboard',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Panel Administrativo — Mopetoo',
  description: 'Panel de administración de Mopetoo',
})
</script>

<template>
  <div class="container py-4">
    <h1 class="h3 fw-bold mb-4">
      <span aria-hidden="true">⚙️</span> Panel Administrativo
    </h1>
    <AdminDashboard />
  </div>
</template>

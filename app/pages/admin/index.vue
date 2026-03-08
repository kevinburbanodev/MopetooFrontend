<script setup lang="ts">
// Admin dashboard page — thin wrapper.
// Protected by admin middleware (checks isAuthenticated + isAdmin).

definePageMeta({
  name: 'admin-dashboard',
  layout: 'admin',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Panel Administrativo — Mopetoo',
  description: 'Panel de administración de Mopetoo',
})
</script>

<template>
  <AdminDashboard />
</template>

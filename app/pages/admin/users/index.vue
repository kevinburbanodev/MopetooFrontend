<script setup lang="ts">
// Admin users page — thin wrapper.
// Protected by admin middleware (checks isAuthenticated + isAdmin).

definePageMeta({
  name: 'admin-users',
  layout: 'admin',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Gestión de Usuarios — Admin Mopetoo',
  description: 'Panel de administración: gestión de usuarios registrados',
})
</script>

<template>
  <AdminUserManager />
</template>

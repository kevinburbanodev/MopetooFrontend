<script setup lang="ts">
// Admin stores (petshops) page — thin wrapper.
// Protected by admin middleware (checks isAuthenticated + isAdmin).

definePageMeta({
  name: 'admin-stores',
  layout: 'admin',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Gestión de Tiendas — Admin Mopetoo',
  description: 'Panel de administración: gestión de tiendas pet-friendly',
})
</script>

<template>
  <AdminStoreManager />
</template>

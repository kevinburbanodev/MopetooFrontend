<script setup lang="ts">
// Admin shelters page — thin wrapper.
// Protected by admin middleware (checks isAuthenticated + isAdmin).

definePageMeta({
  name: 'admin-shelters',
  layout: 'admin',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Gestión de Refugios — Admin Mopetoo',
  description: 'Panel de administración: gestión de refugios de animales',
})
</script>

<template>
  <AdminShelterManager />
</template>

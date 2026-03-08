<script setup lang="ts">
// Admin clinics page — thin wrapper.
// Protected by admin middleware (checks isAuthenticated + isAdmin).

definePageMeta({
  name: 'admin-clinics',
  layout: 'admin',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Gestión de Clínicas — Admin Mopetoo',
  description: 'Panel de administración: gestión de clínicas veterinarias',
})
</script>

<template>
  <AdminClinicManager />
</template>

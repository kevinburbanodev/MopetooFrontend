<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useSeoMeta({ title: 'Verificaciones - Admin Mopetoo' })
</script>

<template>
  <AdminVerificationManager />
</template>

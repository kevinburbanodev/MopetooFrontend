<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useSeoMeta({ title: 'Eventos - Admin Mopetoo' })
</script>

<template>
  <AdminEventMonitor />
</template>

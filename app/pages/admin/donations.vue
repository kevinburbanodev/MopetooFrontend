<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useSeoMeta({ title: 'Donaciones - Admin Mopetoo' })
</script>

<template>
  <AdminDonationManager />
</template>

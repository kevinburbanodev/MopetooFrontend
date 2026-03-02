<script setup lang="ts">
// Shelter directory page — thin wrapper.
// Public route; no auth middleware required.

definePageMeta({
  name: 'shelter-directory',
})

useSeoMeta({
  title: 'Refugios — Mopetoo',
  description: 'Directorio de refugios verificados. Conoce las organizaciones que trabajan para darle un hogar a mascotas que lo necesitan.',
  ogTitle: 'Refugios — Mopetoo',
  ogDescription: 'Conoce los refugios verificados que rescatan y cuidan mascotas en Mopetoo.',
})
</script>

<template>
  <div class="container py-5">
    <ShelterDirectory />
  </div>
</template>

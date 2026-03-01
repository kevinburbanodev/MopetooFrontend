<script setup lang="ts">
// Adoption listings directory page — thin wrapper.
// Public route; no auth middleware required.

definePageMeta({
  name: 'shelter-list',
})

useSeoMeta({
  title: 'Mascotas en Adopción — Mopetoo',
  description: 'Directorio de mascotas en adopción. Encuentra una mascota que busca un hogar y dale un nuevo comienzo.',
  ogTitle: 'Mascotas en Adopción — Mopetoo',
  ogDescription: 'Explora mascotas en adopción y encuentra tu próxima compañera con Mopetoo.',
})
</script>

<template>
  <div class="container py-5">
    <ShelterList />
  </div>
</template>

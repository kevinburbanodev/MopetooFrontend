<script setup lang="ts">
// Shelter directory page — thin wrapper.
// Public route; no auth middleware required.

definePageMeta({
  name: 'shelter-list',
})

useSeoMeta({
  title: 'Refugios y Adopciones — Mopetoo',
  description: 'Directorio de refugios de animales y mascotas en adopción. Encuentra un refugio cerca de ti y da un hogar a quien lo necesita.',
  ogTitle: 'Refugios y Adopciones — Mopetoo',
  ogDescription: 'Explora refugios de animales y encuentra tu próxima mascota en adopción con Mopetoo.',
})
</script>

<template>
  <div class="container py-5">
    <ShelterList />
  </div>
</template>

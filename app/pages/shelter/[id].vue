<script setup lang="ts">
// Shelter detail page — thin wrapper.
// Public route; no auth middleware required.

definePageMeta({
  name: 'shelter-detail',
})

const route = useRoute()
const shelterId = route.params.id as string

useSeoMeta({
  title: 'Refugio — Mopetoo',
  description: 'Conoce este refugio de animales y las mascotas disponibles para adopción.',
  ogTitle: 'Refugio — Mopetoo',
  ogDescription: 'Adopta una mascota y cambia una vida. Visita el perfil de este refugio en Mopetoo.',
})
</script>

<template>
  <div class="container py-5">
    <ShelterDetail :shelter-id="shelterId" />
  </div>
</template>

<script setup lang="ts">
// Shelter detail page — thin wrapper.
// Public route; no auth middleware required.

const route = useRoute()

definePageMeta({
  name: 'shelter-detail',
})

useSeoMeta({
  title: 'Detalle del Refugio — Mopetoo',
  description: 'Perfil del refugio: ubicación, contacto y mascotas en adopción.',
})
</script>

<template>
  <div class="container py-5">
    <ShelterDetail :shelter-id="route.params.id as string" />
  </div>
</template>

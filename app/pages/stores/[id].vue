<script setup lang="ts">
// Petshop detail page — thin wrapper.
// Public route; no auth middleware required.

definePageMeta({
  name: 'petshop-detail',
})

const route = useRoute()
const petshopId = route.params.id as string

useSeoMeta({
  title: 'Tienda Pet-Friendly — Mopetoo',
  description: 'Conoce esta tienda para mascotas: horarios, contacto, categorías y ubicación.',
  ogTitle: 'Tienda Pet-Friendly — Mopetoo',
  ogDescription: 'Explora los servicios y productos para tu mascota en esta tienda pet-friendly de Mopetoo.',
})
</script>

<template>
  <div class="container py-5">
    <PetshopDetail :petshop-id="petshopId" />
  </div>
</template>

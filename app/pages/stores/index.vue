<script setup lang="ts">
// Petshop directory page — thin wrapper.
// Public route; no auth middleware required.

definePageMeta({
  name: 'petshop-list',
})

useSeoMeta({
  title: 'Tiendas Pet-Friendly — Mopetoo',
  description: 'Directorio de tiendas y servicios para mascotas. Alimentos, accesorios, veterinarias y más cerca de ti.',
  ogTitle: 'Tiendas Pet-Friendly — Mopetoo',
  ogDescription: 'Encuentra tiendas y servicios para mascotas en tu ciudad con Mopetoo.',
})
</script>

<template>
  <div class="container py-5">
    <PetshopList />
  </div>
</template>

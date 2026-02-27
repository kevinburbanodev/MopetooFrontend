<script setup lang="ts">
// Adoption pet detail page — thin wrapper.
// Public route; no auth middleware required.
// Auth state is evaluated client-side inside AdoptionDetail to show
// the adoption request form to authenticated users.

definePageMeta({
  name: 'adoption-detail',
})

const route = useRoute()
const petId = route.params.id as string

useSeoMeta({
  title: 'Adopción — Mopetoo',
  description: 'Conoce a esta mascota en adopción y envía tu solicitud a través de Mopetoo.',
  ogTitle: 'Adopción — Mopetoo',
  ogDescription: 'Esta mascota está esperando un hogar. Conoce su historia y solicita su adopción en Mopetoo.',
})
</script>

<template>
  <div class="container py-5">
    <AdoptionDetail :pet-id="petId" />
  </div>
</template>

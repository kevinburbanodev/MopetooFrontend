<script setup lang="ts">
// Clinic detail page — thin wrapper.
// Public route; no auth middleware required.

definePageMeta({
  name: 'clinic-detail',
})

const route = useRoute()
const clinicId = route.params.id as string

useSeoMeta({
  title: 'Clínica Veterinaria — Mopetoo',
  description: 'Conoce esta clínica veterinaria: horarios, especialidades, contacto y ubicación.',
  ogTitle: 'Clínica Veterinaria — Mopetoo',
  ogDescription: 'Explora los servicios y especialidades de esta clínica veterinaria en Mopetoo.',
})
</script>

<template>
  <div class="container py-5">
    <ClinicDetail :clinic-id="clinicId" />
  </div>
</template>

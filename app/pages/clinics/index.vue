<script setup lang="ts">
// Clinic directory page — thin wrapper.
// Public route; no auth middleware required.

definePageMeta({
  name: 'clinic-list',
})

useSeoMeta({
  title: 'Clínicas Veterinarias — Mopetoo',
  description: 'Directorio de clínicas veterinarias. Encuentra especialistas para el cuidado de tu mascota: cirugía, dermatología, vacunas y más.',
  ogTitle: 'Clínicas Veterinarias — Mopetoo',
  ogDescription: 'Encuentra clínicas veterinarias especializadas para tu mascota con Mopetoo.',
})
</script>

<template>
  <div class="container py-5">
    <ClinicList />
  </div>
</template>

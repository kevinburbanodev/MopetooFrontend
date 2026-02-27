<script setup lang="ts">
// Create medical record page — thin wrapper rendering MedicalRecordForm in create mode.
// On success the form itself navigates to /dashboard/medical/:petId.

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const petId = route.params.petId as string

useSeoMeta({
  title: 'Nuevo registro médico — Mopetoo',
  description: 'Agrega un nuevo registro al historial médico de tu mascota.',
})
</script>

<template>
  <div class="container py-5">
    <!-- Breadcrumb -->
    <nav aria-label="Migas de pan" class="mb-4">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <NuxtLink to="/dashboard">Dashboard</NuxtLink>
        </li>
        <li class="breadcrumb-item">
          <NuxtLink :to="`/dashboard/pets/${petId}`">Mascota</NuxtLink>
        </li>
        <li class="breadcrumb-item">
          <NuxtLink :to="`/dashboard/medical/${petId}`">Historial médico</NuxtLink>
        </li>
        <li class="breadcrumb-item active" aria-current="page">Nuevo registro</li>
      </ol>
    </nav>

    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
            <h1 class="h4 fw-bold mb-0">Nuevo registro médico</h1>
          </div>
          <div class="card-body p-4">
            <MedicalRecordForm :pet-id="petId" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

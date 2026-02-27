<script setup lang="ts">
// Edit medical record page — thin wrapper rendering MedicalRecordForm in edit mode.
// Fetches the record on mount and passes it to the form.
// On success the form itself navigates to /dashboard/medical/:petId.
// If the record is not found, redirects back to the medical history list.

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const petId = route.params.petId as string
const recordId = route.params.recordId as string

useSeoMeta({
  title: 'Editar registro médico — Mopetoo',
  description: 'Edita los detalles de este registro médico.',
})

const { fetchMedicalRecord, error, medicalStore } = useMedical()

onMounted(async () => {
  const record = await fetchMedicalRecord(petId, recordId)
  if (!record) {
    // Not found or unauthorized — redirect to the pet's medical history
    await navigateTo(`/dashboard/medical/${petId}`)
  }
})

// Clear selected record when leaving the page to avoid stale data
onUnmounted(() => {
  medicalStore.clearSelectedRecord()
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
        <li class="breadcrumb-item active" aria-current="page">Editar registro</li>
      </ol>
    </nav>

    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
            <h1 class="h4 fw-bold mb-0">Editar registro médico</h1>
          </div>
          <div class="card-body p-4">
            <!-- Error alert from the fetch -->
            <div
              v-if="error"
              class="alert alert-danger d-flex align-items-center gap-2 mb-4"
              role="alert"
            >
              <span aria-hidden="true">⚠</span>
              {{ error }}
            </div>

            <!-- Loading spinner while fetching the record -->
            <div
              v-if="medicalStore.isLoading && !medicalStore.selectedRecord"
              class="text-center py-5"
              aria-busy="true"
              aria-label="Cargando registro"
            >
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
            </div>

            <!-- Form — rendered only once the record is loaded -->
            <MedicalRecordForm
              v-else-if="medicalStore.selectedRecord"
              :pet-id="petId"
              :record="medicalStore.selectedRecord"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

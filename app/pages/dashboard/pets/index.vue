<script setup lang="ts">
// Pets index page — thin wrapper: sets metadata, fetches pets, renders PetList.
// All business logic lives in usePets() and the pets store.

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Mis Mascotas — Mopetoo',
  description: 'Gestiona los perfiles de tus mascotas: salud, recordatorios y más.',
  ogTitle: 'Mis Mascotas — Mopetoo',
  ogDescription: 'Lleva un registro completo de la salud y el bienestar de tus compañeros.',
})

const { fetchPets, deletePet, error } = usePets()
const petsStore = usePetsStore()
const router = useRouter()

// ── Toast / alert state ───────────────────────────────────────
const successMessage = ref<string | null>(null)

// Fetch pets on mount — client-side only since the list requires auth token.
// The auth plugin already restores the token before this runs.
onMounted(async () => {
  await fetchPets()
})

async function handleDeletePet(id: string): Promise<void> {
  const ok = await deletePet(id)
  if (ok) {
    successMessage.value = 'Mascota eliminada correctamente.'
    setTimeout(() => { successMessage.value = null }, 4000)
  }
}

function handleSelectPet(pet: { id: string }): void {
  router.push(`/dashboard/pets/${pet.id}`)
}

function handleEditPet(pet: { id: string }): void {
  router.push(`/dashboard/pets/${pet.id}/edit`)
}
</script>

<template>
  <div class="container py-5">
    <!-- Page header -->
    <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 mb-5">
      <div>
        <h1 class="h3 fw-bold mb-1">Mis Mascotas</h1>
        <p class="text-muted mb-0">Gestiona los perfiles de tus compañeros</p>
      </div>
      <NuxtLink to="/dashboard/pets/new" class="btn btn-primary">
        <span aria-hidden="true">+</span> Agregar mascota
      </NuxtLink>
    </div>

    <!-- Success alert -->
    <div
      v-if="successMessage"
      class="alert alert-success alert-dismissible d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span aria-hidden="true">✓</span>
      {{ successMessage }}
      <button
        type="button"
        class="btn-close ms-auto"
        aria-label="Cerrar"
        @click="successMessage = null"
      />
    </div>

    <!-- Error alert -->
    <div
      v-if="error"
      class="alert alert-danger d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span aria-hidden="true">⚠️</span>
      {{ error }}
    </div>

    <!-- Pet list (handles loading + empty state internally) -->
    <PetList
      :pets="petsStore.pets"
      :is-loading="petsStore.isLoading"
      @select-pet="handleSelectPet"
      @edit-pet="handleEditPet"
      @delete-pet="handleDeletePet"
    />
  </div>
</template>

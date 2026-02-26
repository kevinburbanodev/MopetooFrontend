<script setup lang="ts">
// Edit pet page — loads the pet, renders PetForm in edit mode.
// On success, navigates to the pet's detail page.

import type { PetFormSubmitPayload } from '~/features/pets/types'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const { fetchPetById, updatePet, error } = usePets()
const petsStore = usePetsStore()

const petId = computed(() => route.params.id as string)

useSeoMeta({
  title: () =>
    petsStore.selectedPet
      ? `Editar ${petsStore.selectedPet.name} — Mopetoo`
      : 'Editar mascota — Mopetoo',
  description: 'Actualiza la información del perfil de tu mascota.',
})

// ── Data fetch ───────────────────────────────────────────────
onMounted(async () => {
  // If we arrived directly (not via the detail page), fetch the pet
  if (!petsStore.selectedPet || petsStore.selectedPet.id !== petId.value) {
    const pet = await fetchPetById(petId.value)
    if (!pet) {
      await router.replace('/dashboard/pets')
    }
  }
})

onUnmounted(() => {
  petsStore.clearSelectedPet()
})

// ── Submit ───────────────────────────────────────────────────
async function handleSubmit(payload: PetFormSubmitPayload): Promise<void> {
  const updated = await updatePet(petId.value, payload.data, payload.photo)
  if (updated) {
    await router.push(`/dashboard/pets/${petId.value}`)
  }
}
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
          <NuxtLink to="/dashboard/pets">Mis Mascotas</NuxtLink>
        </li>
        <li v-if="petsStore.selectedPet" class="breadcrumb-item">
          <NuxtLink :to="`/dashboard/pets/${petId}`">
            {{ petsStore.selectedPet.name }}
          </NuxtLink>
        </li>
        <li class="breadcrumb-item active" aria-current="page">Editar</li>
      </ol>
    </nav>

    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
            <h1 class="h4 fw-bold mb-0">
              Editar {{ petsStore.selectedPet?.name ?? 'mascota' }}
            </h1>
          </div>
          <div class="card-body p-4">
            <!-- Error alert -->
            <div
              v-if="error"
              class="alert alert-danger d-flex align-items-center gap-2 mb-4"
              role="alert"
            >
              <span aria-hidden="true">⚠️</span>
              {{ error }}
            </div>

            <!-- Loading state while pet is being fetched -->
            <div v-if="petsStore.isLoading && !petsStore.selectedPet" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando…</span>
              </div>
            </div>

            <PetForm
              v-else-if="petsStore.selectedPet"
              :pet="petsStore.selectedPet"
              :is-loading="petsStore.isLoading"
              @submit="handleSubmit"
              @cancel="router.push(`/dashboard/pets/${petId}`)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

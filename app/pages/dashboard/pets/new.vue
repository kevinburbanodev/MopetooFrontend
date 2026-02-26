<script setup lang="ts">
// Create pet page — thin wrapper rendering PetForm in create mode.
// On success, redirects to /dashboard/pets.

import type { PetFormSubmitPayload } from '~/features/pets/types'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Agregar mascota — Mopetoo',
  description: 'Registra el perfil de tu nueva mascota en Mopetoo.',
})

const { createPet, error } = usePets()
const petsStore = usePetsStore()
const router = useRouter()

async function handleSubmit(payload: PetFormSubmitPayload): Promise<void> {
  const pet = await createPet(payload.data, payload.photo)
  if (pet) {
    await router.push('/dashboard/pets')
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
        <li class="breadcrumb-item active" aria-current="page">Agregar mascota</li>
      </ol>
    </nav>

    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
            <h1 class="h4 fw-bold mb-0">Agregar mascota</h1>
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

            <PetForm
              :is-loading="petsStore.isLoading"
              @submit="handleSubmit"
              @cancel="router.push('/dashboard/pets')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

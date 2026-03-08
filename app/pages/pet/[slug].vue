<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

const { pet, photos, notFound, loading } = usePetProfile(slug)

useSeoMeta({
  title: () => pet.value ? `${pet.value.name} - Mopetoo` : 'Mascota - Mopetoo',
  description: () => pet.value
    ? `Conoce a ${pet.value.name}, ${pet.value.species}${pet.value.breed ? ` ${pet.value.breed}` : ''} en Mopetoo`
    : 'Perfil de mascota en Mopetoo',
  ogTitle: () => pet.value?.name ?? 'Mascota',
  ogDescription: () => pet.value
    ? `${pet.value.species}${pet.value.breed ? ` - ${pet.value.breed}` : ''}`
    : undefined,
  ogImage: () => pet.value?.photo_url ?? undefined,
})
</script>

<template>
  <div class="pet-page">
    <!-- Loading -->
    <div v-if="loading" class="pet-page__loading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Not found -->
    <div v-else-if="notFound" class="pet-page__not-found">
      <div class="text-center py-5">
        <span class="fs-1" aria-hidden="true">🐾</span>
        <h1 class="h4 fw-bold mt-3">Mascota no encontrada</h1>
        <p class="text-muted">Este perfil no existe o no es publico.</p>
        <NuxtLink to="/" class="btn btn-outline-primary btn-sm mt-2">
          Ir al inicio
        </NuxtLink>
      </div>
    </div>

    <!-- Pet profile -->
    <PetProfileCard v-else-if="pet" :pet="pet" :photos="photos" />
  </div>
</template>

<style scoped>
.pet-page {
  min-height: 80vh;
  padding: 2rem 1rem;
  background: linear-gradient(180deg, #faf7f2 0%, #ffffff 40%);
}

.pet-page__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.pet-page__not-found {
  max-width: 480px;
  margin: 0 auto;
}
</style>

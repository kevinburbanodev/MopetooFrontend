<script setup lang="ts">
// Medical history page — thin wrapper.
// Sets SEO metadata and renders MedicalHistory with the petId from the route.
// Pet name is fetched so it can be displayed in the heading and PDF filename.

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const petId = route.params.petId as string

const { fetchPetById } = usePets()
const petsStore = usePetsStore()

useSeoMeta({
  title: 'Historial Médico — Mopetoo',
  description: 'Consulta el historial médico completo de tu mascota: visitas, diagnósticos y tratamientos.',
  ogTitle: 'Historial Médico — Mopetoo',
  ogDescription: 'Lleva el control de la salud de tu mascota con el historial médico de Mopetoo.',
})

// Fetch pet so we can show its name in the heading
onMounted(async () => {
  await fetchPetById(petId)
})

const petName = computed(() => petsStore.selectedPet?.name)
</script>

<template>
  <div class="container py-5">
    <MedicalHistory
      :pet-id="petId"
      :pet-name="petName"
    />
  </div>
</template>

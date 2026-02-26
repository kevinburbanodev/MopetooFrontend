<script setup lang="ts">
// Pet detail page — fetches a single pet by route param, renders PetDetail.
// Handles edit/delete actions by navigating or calling the composable.

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const { fetchPetById, deletePet, error } = usePets()
const petsStore = usePetsStore()

// The id param is always a string from the route
const petId = computed(() => route.params.id as string)

// Dynamic SEO — updated once the pet is loaded
const petName = computed(() => petsStore.selectedPet?.name ?? 'Mascota')

useSeoMeta({
  title: () => `${petName.value} — Mopetoo`,
  description: () =>
    `Perfil de ${petName.value} en Mopetoo. Consulta su información, salud y recordatorios.`,
})

// ── Data fetch ───────────────────────────────────────────────
onMounted(async () => {
  const pet = await fetchPetById(petId.value)
  if (!pet) {
    // Pet not found or unauthorised — go back to list
    await router.replace('/dashboard/pets')
  }
})

// Clear selection when navigating away so stale data is not shown
onUnmounted(() => {
  petsStore.clearSelectedPet()
})

// ── Actions ──────────────────────────────────────────────────
function handleEdit(): void {
  router.push(`/dashboard/pets/${petId.value}/edit`)
}

async function handleDelete(): Promise<void> {
  const ok = await deletePet(petId.value)
  if (ok) {
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
        <li class="breadcrumb-item active" aria-current="page">
          {{ petsStore.selectedPet?.name ?? 'Cargando…' }}
        </li>
      </ol>
    </nav>

    <!-- Error state -->
    <div
      v-if="error && !petsStore.isLoading"
      class="alert alert-danger d-flex align-items-center gap-2"
      role="alert"
    >
      <span aria-hidden="true">⚠️</span>
      {{ error }}
    </div>

    <!-- Loading skeleton while fetching -->
    <div v-if="petsStore.isLoading && !petsStore.selectedPet" aria-busy="true" aria-label="Cargando mascota">
      <div class="card border-0 shadow-sm mb-4 p-4">
        <div class="d-flex gap-4 align-items-center">
          <div class="skeleton-pulse rounded-circle" style="width:100px;height:100px;flex-shrink:0;" aria-hidden="true" />
          <div class="flex-grow-1">
            <div class="skeleton-pulse rounded mb-2" style="height:1.5rem;width:40%;" aria-hidden="true" />
            <div class="skeleton-pulse rounded mb-3" style="height:1rem;width:20%;" aria-hidden="true" />
            <div class="d-flex gap-2">
              <div class="skeleton-pulse rounded" style="height:2.25rem;width:120px;" aria-hidden="true" />
              <div class="skeleton-pulse rounded" style="height:2.25rem;width:80px;" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pet detail -->
    <PetDetail
      v-if="petsStore.selectedPet"
      :pet="petsStore.selectedPet"
      :is-loading="petsStore.isLoading"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>

<style scoped lang="scss">
.skeleton-pulse {
  background: linear-gradient(
    90deg,
    var(--bs-secondary-bg) 25%,
    var(--bs-tertiary-bg, #e8e8e8) 50%,
    var(--bs-secondary-bg) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: var(--bs-secondary-bg);
  }
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>

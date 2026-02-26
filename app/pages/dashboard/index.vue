<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const authStore = useAuthStore()
const user = computed(() => authStore.currentUser)

useSeoMeta({
  title: 'Dashboard — Mopetoo',
  description: 'Gestiona tus mascotas, recordatorios y registros médicos en Mopetoo.',
})
</script>

<template>
  <div class="container py-5">
    <div class="mb-4">
      <h1 class="h4 fw-bold">
        Hola{{ user ? `, ${user.name}` : '' }} 👋
      </h1>
      <p class="text-muted mb-0">Bienvenido a tu panel de Mopetoo</p>
    </div>

    <div class="row g-4">
      <!-- Mi perfil -->
      <div class="col-sm-6 col-lg-4">
        <NuxtLink to="/dashboard/profile" class="card text-decoration-none dashboard-card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center gap-3 p-4">
            <span class="dashboard-card__icon" aria-hidden="true">👤</span>
            <div>
              <h2 class="h6 fw-bold mb-0 text-dark">Mi perfil</h2>
              <p class="text-muted small mb-0">Ver y editar tu información</p>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Mis Mascotas -->
      <div class="col-sm-6 col-lg-4">
        <NuxtLink to="/dashboard/pets" class="card text-decoration-none dashboard-card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center gap-3 p-4">
            <span class="dashboard-card__icon" aria-hidden="true">🐾</span>
            <div>
              <h2 class="h6 fw-bold mb-0 text-dark">Mis Mascotas</h2>
              <p class="text-muted small mb-0">Gestiona los perfiles de tus compañeros</p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard-card {
  border-radius: var(--bs-border-radius-lg);
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: var(--bs-box-shadow-lg) !important;
    transform: translateY(-2px);
  }

  &__icon {
    font-size: 1.75rem;
    line-height: 1;
  }
}
</style>

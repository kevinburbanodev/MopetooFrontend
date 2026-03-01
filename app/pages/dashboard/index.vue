<script setup lang="ts">
import type { User, AuthShelter, AuthStore as AuthStoreType, AuthClinic } from '~/features/auth/types'

definePageMeta({
  middleware: 'auth',
})

const authStore = useAuthStore()

const entityName = computed(() => {
  if (!authStore.currentEntity) return ''
  switch (authStore.entityType) {
    case 'user': return (authStore.currentEntity as User).name
    case 'shelter': return (authStore.currentEntity as AuthShelter).organization_name
    case 'store': return (authStore.currentEntity as AuthStoreType).name
    case 'clinic': return (authStore.currentEntity as AuthClinic).name
    default: return ''
  }
})

interface DashboardCard {
  to: string
  icon: string
  title: string
  desc: string
}

const dashboardCards = computed<DashboardCard[]>(() => {
  switch (authStore.entityType) {
    case 'shelter':
      return [
        { to: '/dashboard/profile', icon: '👤', title: 'Mi perfil', desc: 'Ver y editar tu información' },
        { to: '/shelter', icon: '🐾', title: 'Adopciones', desc: 'Gestiona tus mascotas en adopción' },
      ]
    case 'store':
      return [
        { to: '/dashboard/profile', icon: '👤', title: 'Mi perfil', desc: 'Ver y editar tu información' },
        { to: '/stores', icon: '🛍️', title: 'Mi tienda', desc: 'Gestiona tus productos' },
      ]
    case 'clinic':
      return [
        { to: '/dashboard/profile', icon: '👤', title: 'Mi perfil', desc: 'Ver y editar tu información' },
        { to: '/clinics', icon: '🏥', title: 'Mi clínica', desc: 'Gestiona tu clínica y citas' },
      ]
    default:
      return [
        { to: '/dashboard/profile', icon: '👤', title: 'Mi perfil', desc: 'Ver y editar tu información' },
        { to: '/dashboard/pets', icon: '🐾', title: 'Mis Mascotas', desc: 'Gestiona los perfiles de tus compañeros' },
      ]
  }
})

useSeoMeta({
  title: 'Dashboard — Mopetoo',
  description: 'Gestiona tus mascotas, recordatorios y registros médicos en Mopetoo.',
})
</script>

<template>
  <div class="container py-5">
    <div class="mb-4">
      <h1 class="h4 fw-bold">
        Hola{{ entityName ? `, ${entityName}` : '' }} 👋
      </h1>
      <p class="text-muted mb-0">Bienvenido a tu panel de Mopetoo</p>
    </div>

    <div class="row g-4">
      <div
        v-for="card in dashboardCards"
        :key="card.to"
        class="col-sm-6 col-lg-4"
      >
        <NuxtLink :to="card.to" class="card text-decoration-none dashboard-card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center gap-3 p-4">
            <span class="dashboard-card__icon" aria-hidden="true">{{ card.icon }}</span>
            <div>
              <h2 class="h6 fw-bold mb-0 text-dark">{{ card.title }}</h2>
              <p class="text-muted small mb-0">{{ card.desc }}</p>
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

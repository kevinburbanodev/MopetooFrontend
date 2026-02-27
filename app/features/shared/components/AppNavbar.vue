<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()

// Public nav links always visible
const publicLinks = [
  { label: 'Inicio', to: '/' },
]

// Authenticated nav links — shown only when logged in
const authLinks = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Mis Mascotas', to: '/dashboard/pets' },
  { label: 'Recordatorios', to: '/dashboard/reminders' },
]

function isActive(path: string): boolean {
  // Exact match for root, prefix match for nested routes
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function logout(): void {
  authStore.clearSession()
  navigateTo('/login')
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
    <div class="container">
      <!-- Brand -->
      <NuxtLink class="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
        <span class="fs-4" aria-hidden="true">🐾</span>
        <span>Mopetoo</span>
      </NuxtLink>

      <!-- Mobile toggler -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarMain"
        aria-controls="navbarMain"
        aria-expanded="false"
        aria-label="Abrir menú de navegación"
      >
        <span class="navbar-toggler-icon" />
      </button>

      <!-- Links -->
      <div id="navbarMain" class="collapse navbar-collapse">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <!-- Public links -->
          <li v-for="link in publicLinks" :key="link.to" class="nav-item">
            <NuxtLink
              class="nav-link"
              :class="{ active: isActive(link.to) }"
              :aria-current="isActive(link.to) ? 'page' : undefined"
              :to="link.to"
            >
              {{ link.label }}
            </NuxtLink>
          </li>

          <!-- Authenticated links -->
          <template v-if="authStore.isAuthenticated">
            <li v-for="link in authLinks" :key="link.to" class="nav-item">
              <NuxtLink
                class="nav-link"
                :class="{ active: isActive(link.to) }"
                :aria-current="isActive(link.to) ? 'page' : undefined"
                :to="link.to"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </template>
        </ul>

        <!-- Auth actions -->
        <div class="d-flex align-items-center gap-2">
          <template v-if="authStore.isAuthenticated">
            <NuxtLink
              to="/dashboard/profile"
              class="btn btn-outline-light btn-sm"
              :class="{ active: isActive('/dashboard/profile') }"
            >
              Mi perfil
            </NuxtLink>
            <button
              type="button"
              class="btn btn-light btn-sm text-primary fw-semibold"
              @click="logout"
            >
              Cerrar sesión
            </button>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="btn btn-outline-light btn-sm">
              Iniciar sesión
            </NuxtLink>
            <NuxtLink to="/register" class="btn btn-light btn-sm text-primary fw-semibold">
              Registrarse
            </NuxtLink>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

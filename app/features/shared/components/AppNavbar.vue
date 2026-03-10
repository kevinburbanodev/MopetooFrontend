<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()
const mobileOpen = ref(false)

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function logout(): void {
  authStore.clearSession()
  navigateTo('/')
}

function toggleMobile(): void {
  mobileOpen.value = !mobileOpen.value
}
</script>

<template>
  <nav
    class="navbar navbar-expand-lg fixed-top"
    :class="authStore.isAuthenticated ? 'navbar-dark bg-primary' : 'navbar-glass'"
  >
    <div class="container">
      <!-- Brand -->
      <NuxtLink class="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
        <span class="navbar-brand__icon">
          <span class="material-symbols-outlined" aria-hidden="true">pets</span>
        </span>
        <span class="navbar-brand__text">Mopetoo</span>
      </NuxtLink>

      <!-- Mobile toggler -->
      <button
        class="navbar-toggler"
        type="button"
        aria-label="Abrir menu de navegacion"
        @click="toggleMobile"
      >
        <span class="navbar-toggler-icon" />
      </button>

      <!-- Links -->
      <div
        id="navbarMain"
        class="collapse navbar-collapse"
        :class="{ show: mobileOpen }"
      >
        <ul v-if="!authStore.isAuthenticated" class="navbar-nav mx-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <a class="nav-link" href="#features">Funciones</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#shelters">Refugios</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#pricing">Precios</a>
          </li>
          <li class="nav-item">
            <NuxtLink
              class="nav-link"
              :class="{ active: isActive('/blog') }"
              to="/blog"
            >
              Blog
            </NuxtLink>
          </li>
        </ul>

        <ul v-else class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <NuxtLink
              class="nav-link"
              :class="{ active: isActive('/blog') }"
              to="/blog"
            >
              Blog
            </NuxtLink>
          </li>
        </ul>

        <!-- Auth actions -->
        <div class="d-flex align-items-center gap-2">
          <template v-if="authStore.isAuthenticated">
            <NuxtLink
              v-if="authStore.isAdmin"
              to="/admin"
              class="btn btn-outline-light btn-sm"
              :class="{ active: isActive('/admin') }"
              aria-label="Panel Administrativo"
            >
              Admin
            </NuxtLink>
            <button type="button" class="btn btn-outline-light btn-sm" @click="logout">
              Cerrar sesion
            </button>
          </template>

          <template v-else>
            <a href="#app" class="btn btn-dark btn-sm navbar-glass__download">
              Descargar App
            </a>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* Glassmorphism navbar (unauthenticated landing) */
.navbar-glass {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.3s ease;
}

.navbar-glass .navbar-brand {
  color: #111827;
}

.navbar-glass .navbar-brand:hover {
  color: #111827;
}

.navbar-brand__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #10B981;
  border-radius: 0.625rem;
  color: #fff;
}

.navbar-brand__icon .material-symbols-outlined {
  font-size: 1.25rem;
}

.navbar-brand__text {
  font-size: 1.375rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.navbar-glass .nav-link {
  color: #4b5563;
  font-weight: 500;
  font-size: 0.9375rem;
  transition: color 0.2s ease;
}

.navbar-glass .nav-link:hover,
.navbar-glass .nav-link.active {
  color: #10B981;
}

.navbar-glass .navbar-toggler {
  border-color: rgba(17, 24, 39, 0.15);
}

.navbar-glass .navbar-toggler-icon {
  filter: invert(1) grayscale(100%) brightness(0.2);
}

.navbar-glass__login {
  font-weight: 500;
  border-radius: 100px;
  padding: 0.375rem 1.25rem;
}

.navbar-glass__download {
  font-weight: 600;
  border-radius: 100px;
  padding: 0.375rem 1.5rem;
  background: #111827;
  border-color: #111827;
}

.navbar-glass__download:hover {
  background: #1f2937;
  border-color: #1f2937;
}

/* Authenticated navbar */
.navbar-dark .navbar-brand__text {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.navbar-dark .navbar-brand__icon {
  background: rgba(255, 255, 255, 0.2);
}
</style>

<script setup lang="ts">
const route = useRoute()

// Links expand as pages are created in features/*/pages
const navLinks = [
  { label: 'Inicio', to: '/' },
]

function isActive(path: string): boolean {
  return route.path === path
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
    <div class="container">
      <!-- Brand -->
      <NuxtLink class="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
        <span class="fs-4">🐾</span>
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
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon" />
      </button>

      <!-- Links -->
      <div id="navbarMain" class="collapse navbar-collapse">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li v-for="link in navLinks" :key="link.to" class="nav-item">
            <NuxtLink
              class="nav-link"
              :class="{ active: isActive(link.to) }"
              :to="link.to"
            >
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>

        <!-- Auth actions -->
        <div class="d-flex gap-2">
          <NuxtLink to="/auth/login" class="btn btn-outline-light btn-sm">
            Iniciar sesión
          </NuxtLink>
          <NuxtLink to="/auth/register" class="btn btn-light btn-sm text-primary fw-semibold">
            Registrarse
          </NuxtLink>
        </div>
      </div>
    </div>
  </nav>
</template>

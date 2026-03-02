<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()

// Public nav links — minimal for guests, full for authenticated users
const publicLinks = computed(() => {
  if (!authStore.isAuthenticated) {
    return [{ label: 'Inicio', to: '/' }]
  }
  return [
    { label: 'Inicio', to: '/' },
    { label: 'Blog', to: '/blog' },
    { label: 'Adopciones', to: '/shelter' },
    { label: 'Tiendas', to: '/stores' },
    { label: 'Clínicas', to: '/clinics' },
    { label: 'Precios', to: '/pricing' },
  ]
})

// Authenticated nav links — dynamic based on entity type
const authLinks = computed(() => {
  if (!authStore.isAuthenticated) return []
  switch (authStore.entityType) {
    case 'shelter':
      return [
        { label: 'Dashboard', to: '/dashboard' },
      ]
    case 'store':
      return [
        { label: 'Dashboard', to: '/dashboard' },
      ]
    case 'clinic':
      return [
        { label: 'Dashboard', to: '/dashboard' },
      ]
    default:
      return [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Mis Mascotas', to: '/dashboard/pets' },
        { label: 'Recordatorios', to: '/dashboard/reminders' },
      ]
  }
})

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
  <nav
    class="navbar navbar-expand-lg shadow-sm"
    :class="authStore.isAuthenticated ? 'navbar-dark bg-primary' : 'navbar-landing'"
  >
    <div class="container">
      <!-- Brand -->
      <NuxtLink class="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
        <span class="fs-4" aria-hidden="true">🐾</span>
        <span class="navbar-brand__text">Mopetoo</span>
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
            <!-- Admin panel link — only for admin users -->
            <NuxtLink
              v-if="authStore.isAdmin"
              to="/admin"
              class="btn btn-outline-light btn-sm"
              :class="{ active: isActive('/admin') }"
              aria-label="Panel Administrativo"
            >
              ⚙️ Admin
            </NuxtLink>

            <!-- PRO status indicator — shown for users, stores, clinics -->
            <template v-if="authStore.isUser || authStore.isStore || authStore.isClinic">
              <NuxtLink
                v-if="!authStore.isPro"
                to="/pricing"
                class="btn btn-warning btn-sm fw-bold"
                aria-label="Hazte PRO en Mopetoo"
              >
                Hazte PRO
              </NuxtLink>
              <span
                v-else
                class="badge bg-warning text-dark fw-bold"
                aria-label="Tu cuenta tiene plan PRO activo"
              >
                PRO ✓
              </span>
            </template>

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
            <NuxtLink to="/login" class="btn navbar-btn--login btn-sm">
              Iniciar sesión
            </NuxtLink>
            <NuxtLink to="/register" class="btn navbar-btn--register btn-sm fw-semibold">
              Registrarse
            </NuxtLink>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* ── Landing navbar (unauthenticated) ─────────────────────────── */
.navbar-landing {
  --nav-forest: #1e2a38;
  --nav-green: #4caf82;
  --nav-green-dark: #3a9166;
  --nav-cream: #faf7f2;

  background: var(--nav-cream);
  border-bottom: 1px solid rgba(30, 42, 56, 0.06);
}

.navbar-landing .navbar-brand {
  color: var(--nav-forest);
}

.navbar-landing .navbar-brand:hover {
  color: var(--nav-forest);
}

.navbar-landing .navbar-brand__text {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 1.25rem;
  letter-spacing: -0.01em;
}

.navbar-landing .nav-link {
  color: var(--nav-forest);
  font-weight: 500;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.navbar-landing .nav-link:hover,
.navbar-landing .nav-link.active {
  color: var(--nav-forest);
  opacity: 1;
}

.navbar-landing .navbar-toggler {
  border-color: rgba(30, 42, 56, 0.15);
}

.navbar-landing .navbar-toggler-icon {
  filter: invert(1) grayscale(100%) brightness(0.2);
}

/* ── Guest action buttons ─────────────────────────────────────── */
.navbar-btn--login {
  color: var(--nav-forest, #1e2a38);
  background: transparent;
  border: 1.5px solid rgba(30, 42, 56, 0.18);
  border-radius: 100px;
  padding: 6px 18px;
  font-weight: 500;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.navbar-btn--login:hover {
  border-color: var(--nav-green, #4caf82);
  color: var(--nav-green, #4caf82);
}

.navbar-btn--register {
  color: #fff;
  background: var(--nav-green, #4caf82);
  border: 1.5px solid var(--nav-green, #4caf82);
  border-radius: 100px;
  padding: 6px 20px;
  box-shadow: 0 2px 12px rgba(76, 175, 130, 0.3);
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.navbar-btn--register:hover {
  background: var(--nav-green-dark, #3a9166);
  border-color: var(--nav-green-dark, #3a9166);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 18px rgba(76, 175, 130, 0.4);
}

/* ── Authenticated navbar refinements ─────────────────────────── */
.navbar-dark .navbar-brand__text {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 1.25rem;
  letter-spacing: -0.01em;
}
</style>

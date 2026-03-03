<script setup lang="ts">
import type { User, AuthShelter, AuthStore as AuthStoreType, AuthClinic } from '../../auth/types'

const route = useRoute()
const authStore = useAuthStore()

// Public nav links — minimal for guests, full for authenticated users
const publicLinks = computed(() => {
  if (!authStore.isAuthenticated) {
    return [
      { label: 'Inicio', to: '/' },
      { label: 'Adopciones', to: '/shelter' },
      { label: 'Refugios', to: '/shelters' },
    ]
  }
  return [
    { label: 'Blog', to: '/blog' },
    { label: 'Adopciones', to: '/shelter' },
    { label: 'Refugios', to: '/shelters' },
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

// ── Profile dropdown helpers ──────────────────────────────────
function isSafeImageUrl(url: string | undefined | null): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  }
  catch { return false }
}

const avatarUrl = computed(() => {
  const e = authStore.currentEntity
  if (!e) return null
  let url: string | undefined
  if (authStore.isUser) url = (e as User).profile_picture_url
  else if (authStore.isShelter) url = (e as AuthShelter).logo_url
  else if (authStore.isStore) url = (e as AuthStoreType).logo_url
  else if (authStore.isClinic) url = (e as AuthClinic).cover_image_url
  return isSafeImageUrl(url) ? url! : null
})

const displayName = computed(() => {
  const e = authStore.currentEntity
  if (!e) return ''
  if (authStore.isUser) return (e as User).name
  if (authStore.isShelter) return (e as AuthShelter).organization_name
  if (authStore.isStore) return (e as AuthStoreType).name
  if (authStore.isClinic) return (e as AuthClinic).name
  return ''
})

const displayEmail = computed(() => {
  const e = authStore.currentEntity
  if (!e) return ''
  return (e as { email: string }).email
})

const avatarInitial = computed(() => displayName.value.charAt(0).toUpperCase() || '?')

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
          <!-- Authenticated links first (Dashboard, etc.) -->
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
        </ul>

        <!-- Auth actions -->
        <div class="d-flex align-items-center gap-2">
          <template v-if="authStore.isAuthenticated">
            <!-- Admin panel link — outside dropdown, primary action for admins -->
            <NuxtLink
              v-if="authStore.isAdmin"
              to="/admin"
              class="btn btn-outline-light btn-sm"
              :class="{ active: isActive('/admin') }"
              aria-label="Panel Administrativo"
            >
              ⚙️ Admin
            </NuxtLink>

            <!-- Profile dropdown -->
            <div class="dropdown">
              <button
                class="btn btn-link p-0 d-flex align-items-center gap-2 dropdown-toggle navbar-profile-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                aria-label="Menú de perfil"
              >
                <img
                  v-if="avatarUrl"
                  :src="avatarUrl"
                  :alt="displayName"
                  class="navbar-avatar"
                />
                <span v-else class="navbar-avatar-fallback" aria-hidden="true">
                  {{ avatarInitial }}
                </span>
              </button>

              <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                <!-- User name/email header -->
                <li class="px-3 py-2">
                  <div class="fw-semibold text-truncate" style="max-width: 200px;">{{ displayName }}</div>
                  <small class="text-muted text-truncate d-block" style="max-width: 200px;">{{ displayEmail }}</small>
                </li>
                <li><hr class="dropdown-divider" /></li>

                <!-- PRO status — shown for users, stores, clinics -->
                <template v-if="authStore.isUser || authStore.isStore || authStore.isClinic">
                  <li v-if="!authStore.isPro">
                    <NuxtLink to="/pricing" class="dropdown-item">
                      <span class="me-2" aria-hidden="true">⭐</span>Hazte PRO
                    </NuxtLink>
                  </li>
                  <li v-else class="px-3 py-1">
                    <span class="badge bg-warning text-dark fw-bold" aria-label="Tu cuenta tiene plan PRO activo">
                      PRO ✓
                    </span>
                  </li>
                </template>

                <!-- Mi perfil -->
                <li>
                  <NuxtLink to="/dashboard/profile" class="dropdown-item">
                    <span class="me-2" aria-hidden="true">👤</span>Mi perfil
                  </NuxtLink>
                </li>

                <li><hr class="dropdown-divider" /></li>

                <!-- Cerrar sesión -->
                <li>
                  <button type="button" class="dropdown-item text-danger" @click="logout">
                    <span class="me-2" aria-hidden="true">🚪</span>Cerrar sesión
                  </button>
                </li>
              </ul>
            </div>
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

/* ── Profile dropdown ────────────────────────────────────────── */
.navbar-profile-toggle {
  text-decoration: none;
}

.navbar-profile-toggle::after {
  /* Override Bootstrap dropdown caret color for dark navbar */
  color: rgba(255, 255, 255, 0.85);
}

.navbar-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.6);
}

.navbar-avatar-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #4caf82;
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
  border: 2px solid rgba(255, 255, 255, 0.6);
  line-height: 1;
}
</style>

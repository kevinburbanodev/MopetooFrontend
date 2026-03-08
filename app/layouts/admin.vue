<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()
const { logout } = useAuth()

const sidebarOpen = ref(false)

function toggleSidebar(): void {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar(): void {
  sidebarOpen.value = false
}

// Close sidebar on route change (mobile)
watch(() => route.path, closeSidebar)

function isActive(path: string): boolean {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}

const navItems = [
  { label: 'Dashboard', to: '/admin', icon: 'dashboard' },
  { label: 'Usuarios', to: '/admin/users', icon: 'group' },
  { label: 'Refugios', to: '/admin/shelters', icon: 'home_health' },
  { label: 'Tiendas', to: '/admin/stores', icon: 'storefront' },
  { label: 'Clinicas', to: '/admin/clinics', icon: 'medical_services' },
  { label: 'Donaciones', to: '/admin/donations', icon: 'receipt_long' },
  { label: 'Verificaciones', to: '/admin/verifications', icon: 'verified' },
  { label: 'Eventos', to: '/admin/events', icon: 'event' },
  { label: 'Estadisticas', to: '/admin/stats', icon: 'leaderboard' },
]

const secondaryNavItems = [
  { label: 'Blog', to: '/blog', icon: 'article' },
]

// Page title derived from current route
const pageTitle = computed(() => {
  const match = navItems.find(item => isActive(item.to))
  if (match) return match.label
  const secondary = secondaryNavItems.find(item => isActive(item.to))
  if (secondary) return secondary.label
  return 'Admin'
})

// User initials for avatar
const userInitials = computed(() => {
  const user = authStore.currentUser
  if (!user) return 'A'
  const first = user.name?.charAt(0) ?? ''
  const last = user.last_name?.charAt(0) ?? ''
  return (first + last).toUpperCase() || 'A'
})

async function handleLogout(): Promise<void> {
  await logout()
}
</script>

<template>
  <div class="admin-layout">
    <!-- Mobile overlay -->
    <div
      class="admin-sidebar-overlay"
      :class="{ 'admin-sidebar-overlay--visible': sidebarOpen }"
      @click="closeSidebar"
    />

    <!-- Sidebar -->
    <aside
      class="admin-sidebar"
      :class="{ 'admin-sidebar--open': sidebarOpen }"
    >
      <!-- Brand -->
      <NuxtLink to="/admin" class="admin-sidebar__brand">
        <span class="material-symbols-outlined" aria-hidden="true">pets</span>
        <span class="admin-sidebar__brand-text">
          Mopetoo
          <span class="admin-sidebar__brand-label">Admin</span>
        </span>
      </NuxtLink>

      <!-- Navigation -->
      <nav class="admin-sidebar__nav" aria-label="Navegacion del admin">
        <div class="admin-sidebar__nav-label">Menu principal</div>
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="admin-nav-link"
          :class="{ 'admin-nav-link--active': isActive(item.to) }"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          <span class="material-symbols-outlined" aria-hidden="true">{{ item.icon }}</span>
          {{ item.label }}
        </NuxtLink>

        <div class="admin-sidebar__nav-label" style="margin-top: 0.75rem;">Otros</div>
        <NuxtLink
          v-for="item in secondaryNavItems"
          :key="item.to"
          :to="item.to"
          class="admin-nav-link"
          :class="{ 'admin-nav-link--active': isActive(item.to) }"
        >
          <span class="material-symbols-outlined" aria-hidden="true">{{ item.icon }}</span>
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- Profile -->
      <div class="admin-sidebar__profile">
        <div class="admin-sidebar__avatar">{{ userInitials }}</div>
        <div class="admin-sidebar__profile-info">
          <div class="admin-sidebar__profile-name">
            {{ authStore.currentUser?.name ?? 'Admin' }}
          </div>
          <div class="admin-sidebar__profile-role">Administrador</div>
        </div>
        <button
          type="button"
          class="admin-logout-btn"
          aria-label="Cerrar sesion"
          @click="handleLogout"
        >
          <span class="material-symbols-outlined" aria-hidden="true">logout</span>
        </button>
      </div>
    </aside>

    <!-- Main area -->
    <div class="admin-main">
      <!-- Header -->
      <header class="admin-header">
        <button
          type="button"
          class="admin-sidebar-toggle"
          aria-label="Abrir menu"
          @click="toggleSidebar"
        >
          <span class="material-symbols-outlined">menu</span>
        </button>

        <h1 class="admin-header__title">{{ pageTitle }}</h1>

        <div class="admin-header__search">
          <span class="material-symbols-outlined" aria-hidden="true">search</span>
          <input
            type="search"
            placeholder="Buscar..."
            aria-label="Buscar en el panel"
          >
        </div>

        <div class="admin-header__actions">
          <button type="button" class="admin-header__icon-btn" aria-label="Notificaciones">
            <span class="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      <!-- Content -->
      <main class="admin-content">
        <slot />
      </main>
    </div>

    <!-- Toast notifications (client-only) -->
    <ClientOnly>
      <Toaster position="top-right" :duration="4000" rich-colors />
    </ClientOnly>
  </div>
</template>

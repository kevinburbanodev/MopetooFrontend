<script setup lang="ts">
// ActivityLog — recent platform activity feed.
// Fetches the latest activity events on mount (admin endpoint) and
// displays them in a read-only table with color-coded type badges.
// No pagination — shows the most recent events returned by the API.

import type { ActivityType } from '../types'

const { fetchActivityLog, error, statsStore } = useStats()

// ── Badge / label maps ────────────────────────────────────────

type ActivityBadgeClass =
  | 'bg-primary'
  | 'bg-success'
  | 'bg-warning text-dark'
  | 'bg-info text-dark'
  | 'bg-danger'

const ACTIVITY_LABEL: Record<ActivityType, string> = {
  user_registered: 'Registro',
  pet_created: 'Mascota',
  adoption_requested: 'Adopción',
  subscription_created: 'Suscripción',
  donation_made: 'Donación',
}

const ACTIVITY_BADGE: Record<ActivityType, ActivityBadgeClass> = {
  user_registered: 'bg-primary',
  pet_created: 'bg-success',
  adoption_requested: 'bg-warning text-dark',
  subscription_created: 'bg-info text-dark',
  donation_made: 'bg-danger',
}

const ACTIVITY_ICON: Record<ActivityType, string> = {
  user_registered: '👤',
  pet_created: '🐾',
  adoption_requested: '🐶',
  subscription_created: '⭐',
  donation_made: '💝',
}

// ── Formatters ────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function formatDate(dateString: string): string {
  try {
    return dateFormatter.format(new Date(dateString))
  } catch {
    return dateString
  }
}

// ── Lifecycle ─────────────────────────────────────────────────

onMounted(async () => {
  await fetchActivityLog()
})
</script>

<template>
  <section aria-label="Registro de actividad reciente">
    <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
      <h2 class="h5 fw-bold mb-0">
        <span aria-hidden="true">🕐</span> Actividad Reciente
      </h2>
      <span
        v-if="statsStore.hasActivity"
        class="text-muted small"
        role="status"
        aria-live="polite"
      >
        {{ statsStore.totalActivity }} evento{{ statsStore.totalActivity !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Error alert -->
    <div
      v-if="error"
      class="alert alert-danger d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span aria-hidden="true">⚠</span>
      {{ error }}
    </div>

    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col" class="text-center">Tipo</th>
              <th scope="col">Descripción</th>
              <th scope="col">Usuario</th>
              <th scope="col">Fecha</th>
            </tr>
          </thead>
          <tbody>
            <!-- Skeleton rows while loading -->
            <template v-if="statsStore.isLoading">
              <tr
                v-for="n in 8"
                :key="`skel-${n}`"
                aria-hidden="true"
              >
                <td class="text-center"><div class="activity-skeleton__badge skeleton-pulse rounded mx-auto" /></td>
                <td><div class="activity-skeleton__desc skeleton-pulse rounded" /></td>
                <td><div class="activity-skeleton__user skeleton-pulse rounded" /></td>
                <td><div class="activity-skeleton__date skeleton-pulse rounded" /></td>
              </tr>
            </template>

            <!-- Data rows -->
            <template v-else-if="statsStore.hasActivity">
              <tr
                v-for="entry in statsStore.activityEntries"
                :key="entry.id"
              >
                <td class="text-center">
                  <span
                    class="badge"
                    :class="ACTIVITY_BADGE[entry.type]"
                    :aria-label="`Tipo: ${ACTIVITY_LABEL[entry.type]}`"
                  >
                    <span aria-hidden="true">{{ ACTIVITY_ICON[entry.type] }}</span>
                    {{ ACTIVITY_LABEL[entry.type] }}
                  </span>
                </td>
                <td class="small">{{ entry.description }}</td>
                <td class="text-muted small">{{ entry.user_email ?? '—' }}</td>
                <td class="text-muted small">{{ formatDate(entry.created_at) }}</td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-else>
              <td
                colspan="4"
                class="text-center py-5 text-muted"
              >
                <div class="fs-2 mb-2" aria-hidden="true">🕐</div>
                No hay actividad reciente registrada.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.activity-skeleton {
  &__badge {
    height: 1.25rem;
    width: 5rem;
    border-radius: var(--bs-border-radius-pill) !important;
  }

  &__desc { height: 0.875rem; width: 180px; }
  &__user { height: 0.875rem; width: 130px; }
  &__date { height: 0.875rem; width: 80px; }
}

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

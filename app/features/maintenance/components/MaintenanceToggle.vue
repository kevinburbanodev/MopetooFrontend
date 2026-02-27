<script setup lang="ts">
// MaintenanceToggle — admin panel widget to toggle maintenance mode.
// Placed inside AdminDashboard.vue under "Estado del Sistema".
//
// Self-contained: fetches current status on mount, shows current
// state, and handles toggling via useMaintenance().
//
// Follows the two-step inline confirm pattern used across admin
// components (AdminUserManager, AdminShelterManager, etc.):
//   1. Operator clicks "Activar mantenimiento" → confirm row appears
//   2. Operator clicks "Confirmar" → API call fires
//   3. Operator clicks "Cancelar" → confirm row hides, no API call
//
// SSR-safe: no window/document access.
// Accessible: all interactive elements are <button> with clear labels.

const { fetchStatus, toggleMaintenance, error, maintenanceStore } = useMaintenance()

// Whether the two-step confirm UI is visible.
const confirming = ref(false)

// Formatted date string for updated_at — computed once and cached.
const formattedUpdatedAt = computed<string | null>(() => {
  const raw = maintenanceStore.status?.updated_at
  if (!raw) return null
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(raw))
  } catch {
    // If the date string is malformed, fall back to the raw value.
    return raw
  }
})

// ── Handlers ────────────────────────────────────────────────

/** First click on the primary action button. */
function handleActionClick(): void {
  confirming.value = true
}

/** Operator confirms the toggle action. */
async function handleConfirm(): Promise<void> {
  confirming.value = false
  await toggleMaintenance(!maintenanceStore.isEnabled)
}

/** Operator cancels without making any changes. */
function handleCancel(): void {
  confirming.value = false
}

// ── Lifecycle ────────────────────────────────────────────────

onMounted(async () => {
  await fetchStatus()
})
</script>

<template>
  <div class="card border-0 shadow-sm">
    <!-- Card header -->
    <div class="card-header bg-transparent border-bottom d-flex align-items-center gap-2">
      <span aria-hidden="true">⚙️</span>
      <h2 class="h6 fw-bold mb-0">Estado del Sistema</h2>
    </div>

    <div class="card-body">
      <!-- Error alert -->
      <div
        v-if="error"
        class="alert alert-danger d-flex align-items-center gap-2 mb-3"
        role="alert"
      >
        <span aria-hidden="true">⚠</span>
        {{ error }}
      </div>

      <!-- Loading skeleton — shown while fetching initial status -->
      <div
        v-if="maintenanceStore.isLoading && !maintenanceStore.hasStatus"
        class="d-flex align-items-center gap-3"
        aria-busy="true"
        aria-label="Cargando estado del sistema"
      >
        <div class="maintenance-toggle__skeleton maintenance-toggle__skeleton--badge rounded-pill" aria-hidden="true" />
        <div class="maintenance-toggle__skeleton maintenance-toggle__skeleton--text rounded" aria-hidden="true" />
      </div>

      <!-- Main content — shown once status is available -->
      <template v-else-if="maintenanceStore.hasStatus">
        <!-- Status row -->
        <div class="d-flex align-items-center gap-3 flex-wrap mb-3">
          <!-- Current status badge -->
          <span
            class="badge fs-6 px-3 py-2"
            :class="maintenanceStore.isEnabled ? 'bg-danger' : 'bg-success'"
            :aria-label="maintenanceStore.isEnabled ? 'Modo mantenimiento activo' : 'Modo mantenimiento inactivo'"
          >
            {{ maintenanceStore.isEnabled ? 'Activo' : 'Inactivo' }}
          </span>

          <!-- Metadata: who toggled and when -->
          <span
            v-if="maintenanceStore.status?.updated_by"
            class="text-muted small"
          >
            Actualizado por
            <strong>{{ maintenanceStore.status.updated_by }}</strong>
            <template v-if="formattedUpdatedAt">
              el {{ formattedUpdatedAt }}
            </template>
          </span>
          <span
            v-else-if="formattedUpdatedAt"
            class="text-muted small"
          >
            Última actualización: {{ formattedUpdatedAt }}
          </span>
        </div>

        <!-- Custom message preview -->
        <div
          v-if="maintenanceStore.status?.message"
          class="alert alert-secondary py-2 px-3 mb-3 small"
          role="note"
          aria-label="Mensaje de mantenimiento actual"
        >
          <span class="fw-semibold">Mensaje actual:</span>
          {{ maintenanceStore.status.message }}
        </div>

        <!-- Two-step confirm flow -->
        <template v-if="confirming">
          <!-- Confirmation row -->
          <div
            class="d-flex align-items-center gap-2 flex-wrap"
            role="group"
            :aria-label="maintenanceStore.isEnabled
              ? 'Confirmar desactivación del modo mantenimiento'
              : 'Confirmar activación del modo mantenimiento'"
          >
            <span class="text-body fw-semibold small me-1">
              {{
                maintenanceStore.isEnabled
                  ? '¿Desactivar el modo mantenimiento?'
                  : '¿Activar el modo mantenimiento? Los usuarios no podrán acceder al sitio.'
              }}
            </span>

            <button
              type="button"
              class="btn btn-sm"
              :class="maintenanceStore.isEnabled ? 'btn-success' : 'btn-danger'"
              :disabled="maintenanceStore.isLoading"
              :aria-busy="maintenanceStore.isLoading"
              @click="handleConfirm"
            >
              <span
                v-if="maintenanceStore.isLoading"
                class="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              />
              Confirmar
            </button>

            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              :disabled="maintenanceStore.isLoading"
              @click="handleCancel"
            >
              Cancelar
            </button>
          </div>
        </template>

        <!-- Primary action button (shown when not confirming) -->
        <template v-else>
          <button
            type="button"
            class="btn"
            :class="maintenanceStore.isEnabled ? 'btn-success' : 'btn-danger'"
            :disabled="maintenanceStore.isLoading"
            :aria-busy="maintenanceStore.isLoading"
            :aria-pressed="maintenanceStore.isEnabled"
            @click="handleActionClick"
          >
            <span
              v-if="maintenanceStore.isLoading"
              class="spinner-border spinner-border-sm me-1"
              role="status"
              aria-hidden="true"
            />
            {{ maintenanceStore.isEnabled ? 'Desactivar mantenimiento' : 'Activar mantenimiento' }}
          </button>
        </template>
      </template>

      <!-- Empty state — if fetch failed silently and hasStatus is false -->
      <div
        v-else-if="!maintenanceStore.isLoading"
        class="text-muted small d-flex align-items-center gap-2"
      >
        <span aria-hidden="true">ℹ️</span>
        No se pudo obtener el estado del sistema.
        <button
          type="button"
          class="btn btn-sm btn-link p-0 ms-1"
          @click="fetchStatus"
        >
          Reintentar
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// ── Skeleton shimmer — matches AdminDashboard pattern ──────
.maintenance-toggle {
  &__skeleton {
    background: linear-gradient(
      90deg,
      var(--bs-secondary-bg) 25%,
      var(--bs-tertiary-bg, #e8e8e8) 50%,
      var(--bs-secondary-bg) 75%
    );
    background-size: 200% 100%;
    animation: maintenance-shimmer 1.4s ease-in-out infinite;
    display: inline-block;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
      background: var(--bs-secondary-bg);
    }

    &--badge {
      height: 2rem;
      width: 5rem;
    }

    &--text {
      height: 1rem;
      width: 14rem;
    }
  }
}

@keyframes maintenance-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>

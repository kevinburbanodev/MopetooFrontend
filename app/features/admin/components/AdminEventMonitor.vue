<script setup lang="ts">
// AdminEventMonitor — shelter event statistics and overview.
// Shows KPI cards for event statuses (upcoming/active/finished)
// and total counts. Read-only dashboard widget.
// Reuses fetchEventStats from useAdmin composable.

import type { EventStats } from '../types'

const { fetchEventStats, error } = useAdmin()

const stats = ref<EventStats | null>(null)
const loading = ref(false)

async function load(): Promise<void> {
  loading.value = true
  stats.value = await fetchEventStats()
  loading.value = false
}

onMounted(load)

const cards = computed(() => {
  if (!stats.value) return []
  return [
    { label: 'Total eventos', value: stats.value.total_events, icon: 'event_note', color: 'primary' },
    { label: 'Proximos', value: stats.value.upcoming, icon: 'upcoming', color: 'info' },
    { label: 'En curso', value: stats.value.active, icon: 'play_circle', color: 'success' },
    { label: 'Finalizados', value: stats.value.finished, icon: 'check_circle', color: 'secondary' },
    { label: 'En periodo', value: stats.value.events_in_period, icon: 'leaderboard', color: 'warning' },
  ]
})
</script>

<template>
  <section aria-label="Monitor de eventos de refugios">
    <div class="mb-4">
      <h2 class="h5 fw-bold mb-1">
        <span class="material-symbols-outlined" style="font-size: 1.1rem;" aria-hidden="true">event</span> Eventos de Refugios
      </h2>
      <p class="text-muted small mb-0">
        Estadisticas de eventos organizados por refugios.
      </p>
    </div>

    <!-- Error alert -->
    <div
      v-if="error"
      class="alert alert-danger d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span class="material-symbols-outlined" style="font-size: 1.1rem;" aria-hidden="true">warning</span>
      {{ error }}
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando estadisticas...</span>
      </div>
    </div>

    <!-- Stats cards -->
    <template v-else-if="stats">
      <div class="row g-3 mb-4">
        <div v-for="card in cards" :key="card.label" class="col-6 col-md">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body text-center py-3">
              <span class="material-symbols-outlined mb-1" aria-hidden="true">{{ card.icon }}</span>
              <div class="fs-3 fw-bold" :class="`text-${card.color}`">{{ card.value }}</div>
              <div class="small text-muted">{{ card.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Refresh button -->
      <div class="text-end">
        <button
          type="button"
          class="btn btn-outline-primary btn-sm"
          :disabled="loading"
          @click="load"
        >
          Actualizar
        </button>
      </div>
    </template>

    <!-- Empty state -->
    <div v-else class="text-center py-5 text-muted">
      <span class="material-symbols-outlined" style="font-size: 2rem;" aria-hidden="true">event</span>
      No se pudieron cargar las estadisticas de eventos.
      <div class="mt-2">
        <button type="button" class="btn btn-sm btn-link" @click="load">
          Reintentar
        </button>
      </div>
    </div>
  </section>
</template>

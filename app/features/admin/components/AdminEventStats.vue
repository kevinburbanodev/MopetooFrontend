<script setup lang="ts">
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
    { label: 'Activos', value: stats.value.active, icon: 'play_circle', color: 'success' },
    { label: 'Finalizados', value: stats.value.finished, icon: 'check_circle', color: 'secondary' },
  ]
})
</script>

<template>
  <div>
    <h3 class="h6 fw-bold mb-3">Eventos de Refugios</h3>

    <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

    <div v-if="loading" class="text-center py-3">
      <div class="spinner-border spinner-border-sm text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <div v-else-if="stats" class="row g-3">
      <div v-for="card in cards" :key="card.label" class="col-6 col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center py-3">
            <span class="material-symbols-outlined mb-1" style="opacity: 0.5;" aria-hidden="true">{{ card.icon }}</span>
            <div class="fs-4 fw-bold" :class="`text-${card.color}`">{{ card.value }}</div>
            <div class="small text-muted">{{ card.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

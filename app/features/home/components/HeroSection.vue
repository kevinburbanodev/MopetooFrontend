<template>
  <section class="hero-section py-5">
    <div class="container py-4">
      <div class="row align-items-center g-5">
        <!-- Copy -->
        <div class="col-12 col-lg-6">
          <span class="badge bg-primary bg-opacity-10 text-primary fw-semibold mb-3 px-3 py-2">
            🐾 Cuidado inteligente de mascotas
          </span>
          <h1 class="display-4 fw-bold text-dark lh-sm mb-3">
            Cuidá a tus mascotas<br />
            <span class="text-primary">como nunca</span>
          </h1>
          <p class="lead text-muted mb-4">
            Gestiona la salud, recordatorios y el historial médico de todas tus mascotas
            desde un solo lugar. Simple, organizado y siempre disponible.
          </p>

          <!-- Features list -->
          <ul class="list-unstyled mb-4">
            <li v-for="feature in features" :key="feature.text" class="d-flex align-items-center gap-2 mb-2">
              <span class="text-primary fw-bold">{{ feature.icon }}</span>
              <span class="text-muted">{{ feature.text }}</span>
            </li>
          </ul>

          <!-- CTAs -->
          <div class="d-flex gap-3 flex-wrap">
            <NuxtLink to="/auth/register" class="btn btn-primary btn-lg px-4 fw-semibold">
              Empezar gratis
            </NuxtLink>
            <NuxtLink to="/auth/login" class="btn btn-outline-secondary btn-lg px-4">
              Iniciar sesión
            </NuxtLink>
          </div>
        </div>

        <!-- Illustration -->
        <div class="col-12 col-lg-6 text-center">
          <div class="hero-illustration d-flex flex-column align-items-center justify-content-center">
            <span class="display-1 mb-3">🐾</span>
            <div class="row g-3 w-100">
              <div v-for="card in statCards" :key="card.label" class="col-6">
                <div class="card border-0 shadow-sm h-100 p-3 text-center">
                  <div class="fs-2 mb-1">{{ card.icon }}</div>
                  <div class="fw-bold text-dark">{{ card.value }}</div>
                  <div class="small text-muted">{{ card.label }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  { icon: '✅', text: 'Registro y seguimiento de mascotas' },
  { icon: '⏰', text: 'Recordatorios de vacunas y medicamentos' },
  { icon: '🧾', text: 'Historial médico completo y organizado' },
  { icon: '📄', text: 'Exportación en PDF (usuarios PRO)' },
]

const statCards = [
  { icon: '🐶', value: '1000+', label: 'Mascotas registradas' },
  { icon: '⏰', value: '5000+', label: 'Recordatorios activos' },
  { icon: '🧾', value: '3000+', label: 'Registros médicos' },
  { icon: '❤️', text: '', value: '100%', label: 'Dueños felices' },
]
</script>

<style scoped>
.hero-section {
  background: linear-gradient(135deg, #f8fffe 0%, #f0fff8 100%);
  min-height: calc(100vh - 70px);
}
</style>

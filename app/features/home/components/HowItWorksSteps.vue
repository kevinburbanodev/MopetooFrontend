<template>
  <section class="steps-stitch landing-section">
    <div class="container">
      <div class="text-center mb-5">
        <h2 class="steps-stitch__title">Como empezar?</h2>
      </div>

      <div class="position-relative">
        <!-- Connector line (desktop) -->
        <div class="steps-stitch__line d-none d-lg-block" aria-hidden="true" />

        <div class="row g-5">
          <div
            v-for="step in steps"
            :key="step.title"
            class="col-12 col-lg-4 text-center"
          >
            <div class="steps-stitch__circle">
              <span class="steps-stitch__emoji">{{ step.emoji }}</span>
            </div>
            <h4 class="steps-stitch__step-title">{{ step.title }}</h4>
            <p class="steps-stitch__step-text">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const steps = [
  {
    emoji: '📱',
    title: '1. Descarga la App',
    desc: 'Disponible gratis para iOS y Android en toda la region.',
  },
  {
    emoji: '👤',
    title: '2. Crea tu Cuenta',
    desc: 'Registrate como dueno, refugio o negocio en segundos.',
  },
  {
    emoji: '🐾',
    title: '3. Empieza a cuidar',
    desc: 'Registra a tu mascota o publica tus servicios facilmente.',
  },
]
</script>

<style scoped>
.steps-stitch {
  background: #fff;
}

.steps-stitch__title {
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 700;
  color: #111827;
}

.steps-stitch__line {
  position: absolute;
  top: 3rem;
  left: 0;
  width: 100%;
  height: 2px;
  background: #f3f4f6;
  z-index: 0;
}

.steps-stitch__circle {
  width: 6rem;
  height: 6rem;
  background: #fff;
  border: 2px solid #10B981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  position: relative;
  z-index: 1;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.1);
}

.steps-stitch__emoji {
  font-size: 2rem;
}

.steps-stitch__step-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.steps-stitch__step-text {
  font-size: 0.9375rem;
  color: #6b7280;
  max-width: 280px;
  margin-inline: auto;
  line-height: 1.6;
}
</style>

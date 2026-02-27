<template>
  <section ref="sectionRef" class="how" :class="{ 'is-visible': isVisible }">
    <div class="container">

      <div class="how__header">
        <span class="how__eyebrow">Cómo funciona</span>
        <h2 class="how__headline">Empezar es muy fácil</h2>
        <p class="how__sub">Tres pasos simples para cuidar mejor a quienes más quieres.</p>
      </div>

      <div class="row g-4 g-lg-0 justify-content-center">
        <div
          v-for="(step, i) in steps"
          :key="step.title"
          class="col-12 col-md-4 how__col"
          :style="`--delay: ${i * 0.13}s`"
        >
          <!-- Connector between steps -->
          <div v-if="i < steps.length - 1" class="how__connector" aria-hidden="true">
            <div class="how__connector-line" />
            <div class="how__connector-arrow">→</div>
          </div>

          <div class="how__step">
            <div class="how__step-bg-num" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="how__step-icon-wrap">
              <span class="how__step-icon" :aria-label="step.title">{{ step.icon }}</span>
            </div>
            <h3 class="how__step-title">{{ step.title }}</h3>
            <p class="how__step-text">{{ step.desc }}</p>
          </div>
        </div>
      </div>

      <div class="how__cta">
        <NuxtLink to="/auth/register" class="how__btn">
          Crear mi cuenta gratis
        </NuxtLink>
        <p class="how__cta-note">Sin tarjeta de crédito. Sin compromisos.</p>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
const steps = [
  {
    icon: '👤',
    title: 'Crea tu cuenta',
    desc: 'Regístrate gratis en menos de un minuto. Solo tu email y una contraseña.',
  },
  {
    icon: '🐶',
    title: 'Agrega tus mascotas',
    desc: 'Crea perfiles con fotos, raza, edad y toda su información médica relevante.',
  },
  {
    icon: '✨',
    title: 'Organiza su cuidado',
    desc: 'Activa recordatorios, lleva el historial médico y mantén todo al día.',
  },
]

const sectionRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)

onMounted(() => {
  if (!import.meta.client || !sectionRef.value) return
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        isVisible.value = true
        observer.disconnect()
      }
    },
    { threshold: 0.1 },
  )
  observer.observe(sectionRef.value)
})
</script>

<style scoped>
.how {
  --green: #4caf82;
  --green-dark: #3a9166;
  --forest: #1e2a38;
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;

  padding: 6rem 0;
  background: var(--forest);
  background-image: radial-gradient(rgba(76, 175, 130, 0.07) 1px, transparent 1px);
  background-size: 32px 32px;
  font-family: var(--font-body);
}

/* ── Header ─────────────────────────────────────────────────────── */
.how__header {
  text-align: center;
  max-width: 500px;
  margin: 0 auto 4rem;
}

.how__eyebrow {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--green);
  margin-bottom: 1rem;
}

.how__headline {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
  margin-bottom: 0.875rem;
  letter-spacing: -0.01em;
}

.how__sub {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.7;
  margin: 0;
}

/* ── Steps ──────────────────────────────────────────────────────── */
.how__col {
  position: relative;
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity 0.55s ease var(--delay),
    transform 0.55s ease var(--delay);
}

.is-visible .how__col {
  opacity: 1;
  transform: translateY(0);
}

/* Desktop connector arrow between steps */
.how__connector {
  display: none;
  position: absolute;
  top: 88px;
  right: -24px;
  width: 48px;
  height: 24px;
  z-index: 2;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.how__connector-line {
  display: none;
}

.how__connector-arrow {
  color: rgba(76, 175, 130, 0.35);
  font-size: 1.5rem;
  line-height: 1;
}

@media (min-width: 768px) {
  .how__connector {
    display: flex;
  }
}

.how__step {
  text-align: center;
  padding: 2rem 1.5rem;
  position: relative;
}

.how__step-bg-num {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-display);
  font-size: clamp(5rem, 8vw, 8rem);
  font-weight: 700;
  line-height: 1;
  color: rgba(255, 255, 255, 0.035);
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
  letter-spacing: -0.02em;
}

.how__step-icon-wrap {
  width: 76px;
  height: 76px;
  background: rgba(255, 255, 255, 0.055);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.375rem;
  position: relative;
}

.how__step-icon {
  font-size: 2.25rem;
}

.how__step-title {
  font-family: var(--font-display);
  font-size: 1.1875rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.75rem;
  line-height: 1.25;
}

.how__step-text {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.65;
  margin: 0;
  max-width: 28ch;
  margin-inline: auto;
}

/* ── CTA ────────────────────────────────────────────────────────── */
.how__cta {
  text-align: center;
  margin-top: 3.5rem;
}

.how__btn {
  display: inline-flex;
  align-items: center;
  padding: 15px 36px;
  background: var(--green);
  color: #fff;
  border-radius: 100px;
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 24px rgba(76, 175, 130, 0.35);
}

.how__btn:hover {
  background: var(--green-dark);
  color: #fff;
  transform: translateY(-3px);
  box-shadow: 0 8px 36px rgba(76, 175, 130, 0.5);
}

.how__cta-note {
  margin: 0.875rem 0 0;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.3);
}
</style>

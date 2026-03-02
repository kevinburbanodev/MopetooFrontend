<template>
  <section ref="sectionRef" class="donate" :class="{ 'is-visible': isVisible }">
    <div class="donate__grain" aria-hidden="true" />

    <div class="container">
      <div class="row align-items-center g-5">

        <!-- ── Left: copy ─────────────────────────────────────── -->
        <div class="col-12 col-lg-6 donate__copy">
          <span class="donate__eyebrow">
            <span class="donate__heart" aria-hidden="true">❤️</span>
            Donaciones
          </span>

          <h2 class="donate__headline">
            Apoya a quienes<br />
            <em>más lo necesitan</em>
          </h2>

          <p class="donate__lead">
            Cada refugio cuida a decenas de mascotas que buscan un hogar. Con
            tu donación directa, ayudas a cubrir alimentación, atención
            veterinaria y los cuidados que más necesitan.
          </p>

          <ul class="donate__points">
            <li v-for="point in points" :key="point" class="donate__point">
              <span class="donate__point-dot" aria-hidden="true" />
              {{ point }}
            </li>
          </ul>

          <div class="donate__actions">
            <NuxtLink to="/shelter" class="donate__btn donate__btn--primary">
              Conoce nuestros refugios
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </NuxtLink>
            <NuxtLink to="/register" class="donate__btn donate__btn--ghost">
              Registrarme para donar
            </NuxtLink>
          </div>
        </div>

        <!-- ── Right: donation flow mockup ────────────────────── -->
        <div class="col-12 col-lg-6 d-flex justify-content-center donate__visual">
          <div class="donate__mockup">

            <!-- Shelter card -->
            <div class="donate__shelter-card">
              <div class="donate__shelter-avatar">🏠</div>
              <div class="donate__shelter-info">
                <div class="donate__shelter-name">Refugio Patitas Felices</div>
                <div class="donate__shelter-meta">Bogotá · 42 mascotas en cuidado</div>
              </div>
            </div>

            <!-- Donation amount -->
            <div class="donate__amount-row">
              <div class="donate__amount-label">Tu donación</div>
              <div class="donate__amount-value">$ 25.000 <span>COP</span></div>
            </div>

            <!-- Progress -->
            <div class="donate__progress-wrap">
              <div class="donate__progress-bar">
                <div class="donate__progress-fill" aria-hidden="true" />
              </div>
              <div class="donate__progress-text">73% de la meta mensual</div>
            </div>

            <!-- Impact -->
            <div class="donate__impact">
              <div v-for="impact in impacts" :key="impact.label" class="donate__impact-item">
                <span class="donate__impact-icon">{{ impact.icon }}</span>
                <span class="donate__impact-text">{{ impact.label }}</span>
              </div>
            </div>

            <!-- Floating heart -->
            <div class="donate__float-heart" aria-hidden="true">💚</div>

          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const points = [
  '100% de tu donación llega directamente al refugio',
  'Elige el refugio al que quieres apoyar',
  'Transacciones seguras a través de la plataforma',
]

const impacts = [
  { icon: '🍖', label: 'Alimentación' },
  { icon: '💊', label: 'Medicinas' },
  { icon: '🏥', label: 'Atención vet.' },
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
.donate {
  --green: #4caf82;
  --green-dark: #3a9166;
  --forest: #1e2a38;
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;

  position: relative;
  padding: 6rem 0;
  background: var(--forest);
  overflow: hidden;
  font-family: var(--font-body);
}

/* Subtle noise texture overlay */
.donate__grain {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(76, 175, 130, 0.05) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
}

/* ── Copy ──────────────────────────────────────────────────────── */
.donate__copy {
  position: relative;
  z-index: 1;
  opacity: 0;
  transform: translateX(-28px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.is-visible .donate__copy {
  opacity: 1;
  transform: translateX(0);
}

.donate__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
  padding: 6px 16px 6px 10px;
  border-radius: 100px;
  margin-bottom: 1.5rem;
}

.donate__heart {
  font-size: 0.9rem;
}

.donate__headline {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
  margin-bottom: 1.25rem;
  letter-spacing: -0.01em;
}

.donate__headline em {
  font-style: italic;
  color: var(--green);
}

.donate__lead {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.72;
  max-width: 48ch;
  margin-bottom: 2rem;
}

/* ── Points ────────────────────────────────────────────────────── */
.donate__points {
  list-style: none;
  padding: 0;
  margin: 0 0 2.25rem;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.donate__point {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.8);
}

.donate__point-dot {
  width: 8px;
  height: 8px;
  background: var(--green);
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Actions ───────────────────────────────────────────────────── */
.donate__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.donate__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 100px;
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  border: 2px solid transparent;
}

.donate__btn--primary {
  background: var(--green);
  color: #fff;
  box-shadow: 0 4px 24px rgba(76, 175, 130, 0.35);
}

.donate__btn--primary:hover {
  background: var(--green-dark);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 8px 36px rgba(76, 175, 130, 0.5);
}

.donate__btn--ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  border-color: rgba(255, 255, 255, 0.2);
}

.donate__btn--ghost:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.55);
  transform: translateY(-2px);
}

/* ── Mockup (right) ────────────────────────────────────────────── */
.donate__visual {
  position: relative;
  z-index: 1;
  opacity: 0;
  transform: translateX(28px);
  transition: opacity 0.6s 0.15s ease, transform 0.6s 0.15s ease;
}

.is-visible .donate__visual {
  opacity: 1;
  transform: translateX(0);
}

.donate__mockup {
  position: relative;
  width: 100%;
  max-width: 380px;
  background: #fff;
  border-radius: 24px;
  padding: 1.75rem;
  box-shadow: 0 28px 72px rgba(0, 0, 0, 0.22);
}

/* Shelter card in mockup */
.donate__shelter-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #f2f2f2;
  margin-bottom: 1.25rem;
}

.donate__shelter-avatar {
  width: 48px;
  height: 48px;
  background: #fef3e2;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.donate__shelter-info {
  flex: 1;
  min-width: 0;
}

.donate__shelter-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  color: var(--forest);
  line-height: 1.2;
}

.donate__shelter-meta {
  font-size: 0.8125rem;
  color: #9aabb8;
  margin-top: 2px;
}

/* Amount row */
.donate__amount-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.donate__amount-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #9aabb8;
}

.donate__amount-value {
  font-family: var(--font-display);
  font-size: 1.625rem;
  font-weight: 700;
  color: var(--green);
}

.donate__amount-value span {
  font-size: 0.75rem;
  font-weight: 500;
  color: #9aabb8;
  margin-left: 2px;
}

/* Progress bar */
.donate__progress-wrap {
  margin-bottom: 1.25rem;
}

.donate__progress-bar {
  width: 100%;
  height: 8px;
  background: #f0f0f0;
  border-radius: 100px;
  overflow: hidden;
  margin-bottom: 6px;
}

.donate__progress-fill {
  width: 73%;
  height: 100%;
  background: linear-gradient(90deg, var(--green), #6bcea0);
  border-radius: 100px;
  animation: progressGrow 1.2s 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.donate__progress-text {
  font-size: 0.75rem;
  color: #b0bec9;
}

/* Impact row */
.donate__impact {
  display: flex;
  gap: 0;
  padding-top: 1rem;
  border-top: 1px solid #f2f2f2;
}

.donate__impact-item {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.donate__impact-item + .donate__impact-item {
  border-left: 1px solid #f2f2f2;
}

.donate__impact-icon {
  font-size: 1.25rem;
}

.donate__impact-text {
  font-size: 0.6875rem;
  color: #9aabb8;
  font-weight: 500;
}

/* Floating heart */
.donate__float-heart {
  position: absolute;
  top: -16px;
  right: -12px;
  font-size: 2rem;
  animation: floatHeart 3.5s ease-in-out infinite;
  filter: drop-shadow(0 4px 12px rgba(76, 175, 130, 0.3));
}

/* ── Keyframes ─────────────────────────────────────────────────── */
@keyframes progressGrow {
  from { width: 0; }
  to   { width: 73%; }
}

@keyframes floatHeart {
  0%, 100% { transform: translateY(0) rotate(-4deg); }
  50%       { transform: translateY(-10px) rotate(4deg); }
}

/* ── Responsive ────────────────────────────────────────────────── */
@media (max-width: 575.98px) {
  .donate__float-heart {
    display: none;
  }
}
</style>

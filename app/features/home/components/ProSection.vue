<template>
  <section ref="sectionRef" class="pro" :class="{ 'is-visible': isVisible }">
    <div class="pro__deco pro__deco--a" aria-hidden="true" />
    <div class="pro__deco pro__deco--b" aria-hidden="true" />

    <div class="container">
      <div class="row align-items-center g-5">

        <!-- ── Left: copy ─────────────────────────────────────── -->
        <div class="col-12 col-lg-6 pro__copy">
          <span class="pro__eyebrow">Mopetoo PRO</span>
          <h2 class="pro__headline">
            Lleva el cuidado<br />
            al siguiente nivel
          </h2>
          <p class="pro__sub">
            Desbloquea funciones avanzadas para ser el mejor dueño que tu mascota merece.
          </p>
          <ul class="pro__list">
            <li v-for="benefit in benefits" :key="benefit" class="pro__item">
              <span class="pro__check" aria-hidden="true">✓</span>
              {{ benefit }}
            </li>
          </ul>
          <div class="pro__actions">
            <NuxtLink to="/pricing" class="pro__btn pro__btn--primary">
              Ver planes y precios
            </NuxtLink>
            <NuxtLink to="/auth/register" class="pro__btn pro__btn--ghost">
              Empezar gratis
            </NuxtLink>
          </div>
        </div>

        <!-- ── Right: PRO card ────────────────────────────────── -->
        <div class="col-12 col-lg-6 d-flex justify-content-center pro__visual">
          <div class="pro__card" aria-hidden="true">
            <div class="pro__card-header">
              <div class="pro__badge">PRO</div>
              <div class="pro__card-name">Plan PRO</div>
              <div class="pro__card-tagline">Para dueños que quieren más</div>
            </div>
            <div class="pro__card-features">
              <div v-for="f in cardFeatures" :key="f.text" class="pro__feat-row">
                <span class="pro__feat-icon">{{ f.icon }}</span>
                <span class="pro__feat-text">{{ f.text }}</span>
                <span class="pro__feat-pill">{{ f.pill }}</span>
              </div>
            </div>
            <div class="pro__card-footer">
              <span class="pro__card-cta-label">¿Listo para empezar?</span>
              <NuxtLink to="/pricing" class="pro__card-btn">Ver planes →</NuxtLink>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const benefits = [
  'Exportación de historiales médicos en PDF',
  'Recordatorios ilimitados para todas tus mascotas',
  'Historial médico sin límite de registros',
  'Acceso anticipado a nuevas funciones',
  'Soporte personalizado y prioritario',
]

const cardFeatures = [
  { icon: '📄', text: 'Exportar PDF', pill: 'Nuevo' },
  { icon: '⏰', text: 'Recordatorios ilimitados', pill: '∞' },
  { icon: '🧾', text: 'Historial completo', pill: '∞' },
  { icon: '⚡', text: 'Soporte prioritario', pill: 'PRO' },
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
.pro {
  --green: #4caf82;
  --green-dark: #3a9166;
  --green-deep: #2d7a56;
  --forest: #1e2a38;
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;

  position: relative;
  padding: 6rem 0;
  background: var(--green);
  overflow: hidden;
  font-family: var(--font-body);
}

/* ── Decorative circles ─────────────────────────────────────────── */
.pro__deco {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.pro__deco--a {
  width: 560px;
  height: 560px;
  background: rgba(255, 255, 255, 0.06);
  top: -200px;
  right: -120px;
}

.pro__deco--b {
  width: 320px;
  height: 320px;
  background: rgba(0, 0, 0, 0.06);
  bottom: -130px;
  left: -80px;
}

/* ── Copy ──────────────────────────────────────────────────────── */
.pro__copy {
  position: relative;
  z-index: 1;
  opacity: 0;
  transform: translateX(-28px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.is-visible .pro__copy {
  opacity: 1;
  transform: translateX(0);
}

.pro__eyebrow {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.15);
  padding: 5px 14px;
  border-radius: 100px;
  margin-bottom: 1.25rem;
}

.pro__headline {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}

.pro__sub {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.72;
  margin-bottom: 2rem;
  max-width: 44ch;
}

.pro__list {
  list-style: none;
  padding: 0;
  margin: 0 0 2.25rem;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pro__item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.88);
}

.pro__check {
  display: inline-flex;
  width: 22px;
  height: 22px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.pro__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.pro__btn {
  display: inline-flex;
  align-items: center;
  padding: 14px 28px;
  border-radius: 100px;
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  border: 2px solid transparent;
}

.pro__btn--primary {
  background: white;
  color: var(--green-dark);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

.pro__btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 36px rgba(0, 0, 0, 0.2);
  color: var(--green-deep);
}

.pro__btn--ghost {
  background: transparent;
  color: white;
  border-color: rgba(255, 255, 255, 0.4);
}

.pro__btn--ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.7);
  color: white;
  transform: translateY(-2px);
}

/* ── PRO Card ──────────────────────────────────────────────────── */
.pro__visual {
  position: relative;
  z-index: 1;
  opacity: 0;
  transform: translateX(28px);
  transition: opacity 0.6s 0.15s ease, transform 0.6s 0.15s ease;
}

.is-visible .pro__visual {
  opacity: 1;
  transform: translateX(0);
}

.pro__card {
  background: white;
  border-radius: 24px;
  overflow: hidden;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 28px 72px rgba(0, 0, 0, 0.18);
}

.pro__card-header {
  background: var(--forest);
  padding: 2rem;
  text-align: center;
}

.pro__badge {
  display: inline-block;
  background: var(--green);
  color: white;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 100px;
  margin-bottom: 0.875rem;
}

.pro__card-name {
  font-family: var(--font-display);
  font-size: 1.625rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.25rem;
}

.pro__card-tagline {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.45);
}

.pro__card-features {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pro__feat-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 11px;
  background: #f7f8f9;
}

.pro__feat-icon {
  font-size: 1.125rem;
  flex-shrink: 0;
}

.pro__feat-text {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--forest);
}

.pro__feat-pill {
  font-size: 0.6875rem;
  font-weight: 700;
  background: var(--green);
  color: white;
  padding: 3px 9px;
  border-radius: 100px;
}

.pro__card-footer {
  padding: 1rem 1.5rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #f2f2f2;
}

.pro__card-cta-label {
  font-size: 0.875rem;
  color: #9aabb8;
}

.pro__card-btn {
  display: inline-block;
  background: var(--green);
  color: white;
  padding: 10px 20px;
  border-radius: 100px;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s ease, transform 0.2s ease;
}

.pro__card-btn:hover {
  background: var(--green-dark);
  color: white;
  transform: translateY(-2px);
}
</style>

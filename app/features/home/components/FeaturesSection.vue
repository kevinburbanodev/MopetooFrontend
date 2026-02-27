<template>
  <section ref="sectionRef" class="feats" :class="{ 'is-visible': isVisible }">
    <div class="container">

      <div class="feats__header">
        <span class="feats__eyebrow">Funcionalidades</span>
        <h2 class="feats__headline">
          Diseñado para quienes<br />
          <em>realmente se preocupan</em>
        </h2>
        <p class="feats__sub">
          Todo lo que necesitas para mantener a tus mascotas felices,
          saludables y bien cuidadas.
        </p>
      </div>

      <div class="row g-4">
        <div
          v-for="(feat, i) in features"
          :key="feat.title"
          class="col-12 col-md-6 col-lg-4 feats__col"
          :style="`--delay: ${i * 0.09}s`"
        >
          <div class="feats__card">
            <div class="feats__icon-wrap" :style="`background: ${feat.bg}`">
              <span class="feats__icon" :aria-label="feat.title">{{ feat.icon }}</span>
            </div>
            <h3 class="feats__card-title">{{ feat.title }}</h3>
            <p class="feats__card-text">{{ feat.desc }}</p>
            <NuxtLink :to="feat.link" class="feats__link">
              Conocer más
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    icon: '🐾',
    title: 'Perfiles de mascotas',
    desc: 'Crea perfiles completos con foto, raza, edad y toda la información que tu vet necesita.',
    link: '/auth/register',
    bg: '#e6f7ee',
  },
  {
    icon: '⏰',
    title: 'Recordatorios inteligentes',
    desc: 'Vacunas, medicamentos, baños, citas. Nunca más olvidarás algo importante.',
    link: '/auth/register',
    bg: '#fef3e2',
  },
  {
    icon: '🧾',
    title: 'Historial médico',
    desc: 'Todos los registros de salud en un solo lugar, organizados por fecha y tipo.',
    link: '/auth/register',
    bg: '#eff3fe',
  },
  {
    icon: '📄',
    title: 'Exportación PDF',
    desc: 'Descarga el historial completo en PDF para compartirlo con tu veterinario o clínica.',
    link: '/pricing',
    bg: '#f9e8f7',
  },
  {
    icon: '🏥',
    title: 'Red de clínicas',
    desc: 'Encuentra clínicas veterinarias verificadas y de confianza cerca de ti.',
    link: '/clinics',
    bg: '#e6f7ee',
  },
  {
    icon: '🐕',
    title: 'Adopciones',
    desc: 'Conecta con refugios locales y ayuda a una mascota a encontrar el hogar que merece.',
    link: '/shelter',
    bg: '#fef3e2',
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
.feats {
  --green: #4caf82;
  --green-dark: #3a9166;
  --forest: #1e2a38;
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;

  padding: 6rem 0;
  background: #ffffff;
  background-image: radial-gradient(#e4e4e4 1px, transparent 1px);
  background-size: 28px 28px;
  font-family: var(--font-body);
}

/* ── Header ─────────────────────────────────────────────────────── */
.feats__header {
  text-align: center;
  max-width: 580px;
  margin: 0 auto 4rem;
}

.feats__eyebrow {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--green-dark);
  margin-bottom: 1rem;
}

.feats__headline {
  font-family: var(--font-display);
  font-size: clamp(1.875rem, 3.5vw, 2.75rem);
  font-weight: 700;
  color: var(--forest);
  line-height: 1.15;
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}

.feats__headline em {
  font-style: italic;
  color: var(--green);
}

.feats__sub {
  font-size: 1rem;
  color: #6a7d8e;
  line-height: 1.72;
  margin: 0;
}

/* ── Cards ──────────────────────────────────────────────────────── */
.feats__col {
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity 0.5s ease var(--delay),
    transform 0.5s ease var(--delay);
}

.is-visible .feats__col {
  opacity: 1;
  transform: translateY(0);
}

.feats__card {
  background: #fff;
  border-radius: 18px;
  padding: 2rem 1.75rem;
  height: 100%;
  border: 1px solid #efefef;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.feats__card:hover {
  transform: translateY(-7px);
  box-shadow: 0 18px 52px rgba(30, 42, 56, 0.1);
  border-color: transparent;
}

.feats__icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  flex-shrink: 0;
}

.feats__icon {
  font-size: 1.625rem;
}

.feats__card-title {
  font-family: var(--font-display);
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--forest);
  margin-bottom: 0.625rem;
  line-height: 1.3;
}

.feats__card-text {
  font-size: 0.9rem;
  color: #6a7d8e;
  line-height: 1.65;
  margin-bottom: 1.25rem;
}

.feats__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--green);
  text-decoration: none;
  transition: gap 0.2s ease, color 0.2s ease;
}

.feats__link:hover {
  gap: 10px;
  color: var(--green-dark);
}
</style>

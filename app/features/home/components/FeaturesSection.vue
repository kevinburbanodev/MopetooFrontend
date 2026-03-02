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

      <!-- ── Tier 1: Core features (large cards, 2×2) ─────────── -->
      <div class="row g-4 feats__tier feats__tier--core">
        <div
          v-for="(feat, i) in coreFeatures"
          :key="feat.title"
          class="col-12 col-md-6 feats__col"
          :style="`--delay: ${i * 0.09}s`"
        >
          <div class="feats__card feats__card--lg">
            <div class="feats__card-top">
              <div class="feats__icon-wrap feats__icon-wrap--lg" :style="`background: ${feat.bg}`">
                <span class="feats__icon feats__icon--lg" :aria-label="feat.title">{{ feat.icon }}</span>
              </div>
              <span v-if="feat.badge" class="feats__badge">{{ feat.badge }}</span>
            </div>
            <h3 class="feats__card-title feats__card-title--lg">{{ feat.title }}</h3>
            <p class="feats__card-text">{{ feat.desc }}</p>
            <NuxtLink :to="feat.link" class="feats__link">
              {{ feat.cta }}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- ── Tier 2 header ────────────────────────────────────── -->
      <div class="feats__divider">
        <span class="feats__divider-text">Explora el ecosistema</span>
      </div>

      <!-- ── Tier 2: Directory features (compact cards, 4-col) ── -->
      <div class="row g-4 feats__tier feats__tier--dir">
        <div
          v-for="(feat, i) in directoryFeatures"
          :key="feat.title"
          class="col-12 col-sm-6 col-lg-3 feats__col"
          :style="`--delay: ${(i + 4) * 0.09}s`"
        >
          <div class="feats__card feats__card--sm">
            <div class="feats__icon-wrap" :style="`background: ${feat.bg}`">
              <span class="feats__icon" :aria-label="feat.title">{{ feat.icon }}</span>
            </div>
            <h3 class="feats__card-title">{{ feat.title }}</h3>
            <p class="feats__card-text feats__card-text--sm">{{ feat.desc }}</p>
            <NuxtLink :to="feat.link" class="feats__link">
              {{ feat.cta }}
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
const coreFeatures = [
  {
    icon: '🐾',
    title: 'Perfiles de mascotas',
    desc: 'Crea perfiles completos con foto, raza, edad y toda la información que tu vet necesita. Toda la vida de tu mascota en un solo lugar.',
    link: '/register',
    cta: 'Crear mi perfil',
    bg: '#e6f7ee',
    badge: null,
  },
  {
    icon: '⏰',
    title: 'Recordatorios inteligentes',
    desc: 'Vacunas, medicamentos, baños, citas con el veterinario. Configura recordatorios y nunca más olvides algo importante.',
    link: '/register',
    cta: 'Activar recordatorios',
    bg: '#fef3e2',
    badge: null,
  },
  {
    icon: '🧾',
    title: 'Historial médico completo',
    desc: 'Registra cada consulta, vacuna y tratamiento. Todo organizado por fecha y tipo para que tu vet tenga el panorama completo.',
    link: '/register',
    cta: 'Empezar a registrar',
    bg: '#eff3fe',
    badge: null,
  },
  {
    icon: '📄',
    title: 'Exportación PDF',
    desc: 'Descarga el historial médico completo en PDF para compartirlo con cualquier veterinario o clínica en segundos.',
    link: '/pricing',
    cta: 'Ver plan PRO',
    bg: '#f9e8f7',
    badge: 'PRO',
  },
]

const directoryFeatures = [
  {
    icon: '🐕',
    title: 'Adopciones',
    desc: 'Conecta con refugios locales y dale un hogar a quien lo necesita.',
    link: '/shelter',
    cta: 'Ver adopciones',
    bg: '#e6f7ee',
  },
  {
    icon: '🏥',
    title: 'Clínicas veterinarias',
    desc: 'Encuentra clínicas verificadas y de confianza cerca de ti.',
    link: '/clinics',
    cta: 'Buscar clínicas',
    bg: '#eff3fe',
  },
  {
    icon: '🛒',
    title: 'Tiendas pet-friendly',
    desc: 'Descubre tiendas especializadas con productos para cada necesidad.',
    link: '/stores',
    cta: 'Explorar tiendas',
    bg: '#fef3e2',
  },
  {
    icon: '📰',
    title: 'Blog educativo',
    desc: 'Artículos y guías escritas por expertos para cuidar mejor a tus mascotas.',
    link: '/blog',
    cta: 'Leer artículos',
    bg: '#f5f0e8',
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

/* ── Staggered reveal ──────────────────────────────────────────── */
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

/* ── Core cards (Tier 1 — large) ───────────────────────────────── */
.feats__card--lg {
  background: #fff;
  border-radius: 22px;
  padding: 2.25rem 2rem;
  height: 100%;
  border: 1px solid #efefef;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  position: relative;
}

.feats__card--lg:hover {
  transform: translateY(-7px);
  box-shadow: 0 20px 56px rgba(30, 42, 56, 0.11);
  border-color: transparent;
}

.feats__card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.feats__icon-wrap--lg {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feats__icon--lg {
  font-size: 2rem;
}

.feats__badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #fff;
  background: var(--green);
  padding: 4px 10px;
  border-radius: 100px;
}

.feats__card-title--lg {
  font-family: var(--font-display);
  font-size: 1.1875rem;
  font-weight: 700;
  color: var(--forest);
  margin-bottom: 0.75rem;
  line-height: 1.3;
}

/* ── Divider between tiers ─────────────────────────────────────── */
.feats__divider {
  text-align: center;
  margin: 3.5rem 0 2.5rem;
  position: relative;
}

.feats__divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e8e8e8;
}

.feats__divider-text {
  position: relative;
  background: #fff;
  padding: 0 1.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9aabb8;
}

/* ── Directory cards (Tier 2 — compact) ────────────────────────── */
.feats__card--sm {
  background: #fff;
  border-radius: 18px;
  padding: 1.75rem 1.5rem;
  height: 100%;
  border: 1px solid #efefef;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.feats__card--sm:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 44px rgba(30, 42, 56, 0.09);
  border-color: transparent;
}

/* ── Shared card elements ──────────────────────────────────────── */
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

.feats__card-text--sm {
  font-size: 0.85rem;
  margin-bottom: 1rem;
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

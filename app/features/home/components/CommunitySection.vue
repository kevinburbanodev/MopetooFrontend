<template>
  <section ref="sectionRef" class="community" :class="{ 'is-visible': isVisible }">
    <div class="container">

      <div class="community__header">
        <span class="community__eyebrow">Comunidad</span>
        <h2 class="community__headline">
          Más que una app,<br />
          <em>una comunidad</em>
        </h2>
        <p class="community__sub">
          Conectamos dueños, refugios, tiendas y clínicas en un ecosistema pensado para el bienestar animal.
        </p>
      </div>

      <div class="row g-4">
        <div
          v-for="(item, i) in items"
          :key="item.title"
          class="col-12 col-md-4 community__col"
          :style="`--delay: ${i * 0.1}s`"
        >
          <div class="community__card" :style="`--accent: ${item.accent}`">
            <div class="community__card-stripe" aria-hidden="true" />
            <div class="community__icon">{{ item.icon }}</div>
            <h3 class="community__card-title">{{ item.title }}</h3>
            <p class="community__card-text">{{ item.desc }}</p>
            <NuxtLink :to="item.link" class="community__link" :style="`color: ${item.accent}`">
              {{ item.cta }}
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
const items = [
  {
    icon: '🏠',
    title: 'Refugios y Adopciones',
    desc: 'Encuentra refugios cerca de ti. Conecta con mascotas que buscan un hogar y dale una segunda oportunidad a quien lo necesita.',
    link: '/shelter',
    cta: 'Ver adopciones',
    accent: '#4caf82',
  },
  {
    icon: '🛒',
    title: 'Tiendas Pet-friendly',
    desc: 'Descubre las mejores tiendas especializadas en mascotas de tu ciudad, con productos de calidad para cada necesidad.',
    link: '/stores',
    cta: 'Explorar tiendas',
    accent: '#f5a623',
  },
  {
    icon: '🏥',
    title: 'Clínicas Veterinarias',
    desc: 'Profesionales verificados y clínicas de confianza para el cuidado de tu mascota cuando más lo necesita.',
    link: '/clinics',
    cta: 'Buscar clínicas',
    accent: '#3b8fd4',
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
.community {
  --green: #4caf82;
  --forest: #1e2a38;
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;

  padding: 6rem 0;
  background: #f4fbf7;
  font-family: var(--font-body);
}

/* ── Header ─────────────────────────────────────────────────────── */
.community__header {
  text-align: center;
  max-width: 560px;
  margin: 0 auto 4rem;
}

.community__eyebrow {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--green);
  margin-bottom: 1rem;
}

.community__headline {
  font-family: var(--font-display);
  font-size: clamp(1.875rem, 3.5vw, 2.75rem);
  font-weight: 700;
  color: var(--forest);
  line-height: 1.15;
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}

.community__headline em {
  font-style: italic;
  color: var(--green);
}

.community__sub {
  font-size: 1rem;
  color: #6a7d8e;
  line-height: 1.72;
  margin: 0;
}

/* ── Cards ──────────────────────────────────────────────────────── */
.community__col {
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity 0.5s ease var(--delay),
    transform 0.5s ease var(--delay);
}

.is-visible .community__col {
  opacity: 1;
  transform: translateY(0);
}

.community__card {
  background: white;
  border-radius: 20px;
  padding: 2rem 1.75rem 2rem 2.25rem;
  height: 100%;
  position: relative;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  box-shadow: 0 2px 16px rgba(30, 42, 56, 0.06);
}

.community__card:hover {
  transform: translateY(-7px);
  box-shadow: 0 18px 52px rgba(30, 42, 56, 0.1);
}

.community__card-stripe {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--accent);
}

.community__icon {
  font-size: 2.25rem;
  margin-bottom: 1.125rem;
}

.community__card-title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--forest);
  margin-bottom: 0.625rem;
  line-height: 1.3;
}

.community__card-text {
  font-size: 0.9rem;
  color: #6a7d8e;
  line-height: 1.65;
  margin-bottom: 1.375rem;
}

.community__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: gap 0.2s ease, opacity 0.2s ease;
}

.community__link:hover {
  gap: 10px;
  opacity: 0.8;
}
</style>

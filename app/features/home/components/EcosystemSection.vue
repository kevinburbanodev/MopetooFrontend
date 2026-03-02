<template>
  <section ref="sectionRef" class="eco" :class="{ 'is-visible': isVisible }">
    <div class="container">

      <div class="eco__header">
        <span class="eco__eyebrow">Un ecosistema para todos</span>
        <h2 class="eco__headline">
          No importa quién seas,<br />
          <em>hay un lugar para ti</em>
        </h2>
        <p class="eco__sub">
          Mopetoo conecta dueños, refugios, tiendas y clínicas en una
          plataforma diseñada para el bienestar animal.
        </p>
      </div>

      <div class="row g-4">
        <div
          v-for="(entity, i) in entities"
          :key="entity.title"
          class="col-12 col-md-6 eco__col"
          :style="`--delay: ${i * 0.1}s`"
        >
          <div class="eco__card" :style="`--accent: ${entity.accent}`">
            <div class="eco__card-stripe" aria-hidden="true" />
            <div class="eco__card-head">
              <div class="eco__icon-wrap" :style="`background: ${entity.iconBg}`">
                <span class="eco__icon" :aria-label="entity.title">{{ entity.icon }}</span>
              </div>
              <span class="eco__entity-tag" :style="`color: ${entity.accent}`">
                {{ entity.tag }}
              </span>
            </div>
            <h3 class="eco__card-title">{{ entity.title }}</h3>
            <p class="eco__card-text">{{ entity.desc }}</p>
            <ul class="eco__perks">
              <li v-for="perk in entity.perks" :key="perk" class="eco__perk">
                <span class="eco__perk-check" :style="`background: ${entity.accent}`" aria-hidden="true">✓</span>
                {{ perk }}
              </li>
            </ul>
            <NuxtLink to="/register" class="eco__link" :style="`color: ${entity.accent}`">
              {{ entity.cta }}
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
const entities = [
  {
    icon: '👤',
    title: 'Dueños de mascotas',
    tag: 'Usuario',
    desc: 'Gestiona todo el cuidado de tus mascotas desde un solo lugar. Perfiles, recordatorios, historial médico y más.',
    perks: [
      'Perfiles completos con foto y datos',
      'Recordatorios de vacunas y citas',
      'Historial médico organizado',
    ],
    cta: 'Crear cuenta gratis',
    accent: '#4caf82',
    iconBg: '#e6f7ee',
  },
  {
    icon: '🏠',
    title: 'Refugios y fundaciones',
    tag: 'Refugio',
    desc: 'Publica tus mascotas en adopción, recibe donaciones directas y conecta con familias dispuestas a adoptar.',
    perks: [
      'Publica adopciones visibles en toda la plataforma',
      'Recibe donaciones directas de la comunidad',
      'Gestiona solicitudes de adopción',
    ],
    cta: 'Registrar mi refugio',
    accent: '#e8873a',
    iconBg: '#fef3e2',
  },
  {
    icon: '🛒',
    title: 'Tiendas de mascotas',
    tag: 'Tienda',
    desc: 'Muestra tus productos y servicios a miles de dueños de mascotas en tu ciudad. Plan PRO para mayor visibilidad.',
    perks: [
      'Perfil de tienda con productos y horarios',
      'Aparece en el directorio de tiendas',
      'Destaca con el plan Featured',
    ],
    cta: 'Registrar mi tienda',
    accent: '#3b8fd4',
    iconBg: '#eaf4fc',
  },
  {
    icon: '🏥',
    title: 'Clínicas veterinarias',
    tag: 'Clínica',
    desc: 'Verifica tu clínica, muestra tus especialidades y conecta con pacientes que buscan atención de calidad.',
    perks: [
      'Perfil verificado con especialidades',
      'Conecta con dueños de mascotas cercanos',
      'Destaca con el plan PRO',
    ],
    cta: 'Registrar mi clínica',
    accent: '#9b59b6',
    iconBg: '#f5eefb',
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
.eco {
  --green: #4caf82;
  --forest: #1e2a38;
  --cream: #faf7f2;
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;

  padding: 6rem 0;
  background: var(--cream);
  font-family: var(--font-body);
}

/* ── Header ─────────────────────────────────────────────────────── */
.eco__header {
  text-align: center;
  max-width: 580px;
  margin: 0 auto 4rem;
}

.eco__eyebrow {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--green);
  margin-bottom: 1rem;
}

.eco__headline {
  font-family: var(--font-display);
  font-size: clamp(1.875rem, 3.5vw, 2.75rem);
  font-weight: 700;
  color: var(--forest);
  line-height: 1.15;
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}

.eco__headline em {
  font-style: italic;
  color: var(--green);
}

.eco__sub {
  font-size: 1rem;
  color: #6a7d8e;
  line-height: 1.72;
  margin: 0;
}

/* ── Staggered reveal ──────────────────────────────────────────── */
.eco__col {
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity 0.5s ease var(--delay),
    transform 0.5s ease var(--delay);
}

.is-visible .eco__col {
  opacity: 1;
  transform: translateY(0);
}

/* ── Cards ──────────────────────────────────────────────────────── */
.eco__card {
  background: white;
  border-radius: 20px;
  padding: 2rem 2rem 2rem 2.5rem;
  height: 100%;
  position: relative;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  box-shadow: 0 2px 16px rgba(30, 42, 56, 0.05);
}

.eco__card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 52px rgba(30, 42, 56, 0.1);
}

.eco__card-stripe {
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background: var(--accent);
  border-radius: 5px 0 0 5px;
}

.eco__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.125rem;
}

.eco__icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.eco__icon {
  font-size: 1.75rem;
}

.eco__entity-tag {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.eco__card-title {
  font-family: var(--font-display);
  font-size: 1.1875rem;
  font-weight: 700;
  color: var(--forest);
  margin-bottom: 0.625rem;
  line-height: 1.3;
}

.eco__card-text {
  font-size: 0.9rem;
  color: #6a7d8e;
  line-height: 1.65;
  margin-bottom: 1.25rem;
}

/* ── Perk list ─────────────────────────────────────────────────── */
.eco__perks {
  list-style: none;
  padding: 0;
  margin: 0 0 1.375rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.eco__perk {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  color: #5a6c7a;
}

.eco__perk-check {
  display: inline-flex;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

/* ── Link ──────────────────────────────────────────────────────── */
.eco__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: gap 0.2s ease, opacity 0.2s ease;
}

.eco__link:hover {
  gap: 10px;
  opacity: 0.8;
}
</style>

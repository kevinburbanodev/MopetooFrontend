<template>
  <section ref="sectionRef" class="cta-band" :class="{ 'is-visible': isVisible }">
    <div class="cta-band__bg-text" aria-hidden="true">Mopetoo</div>

    <div class="container">
      <div class="cta-band__content">
        <span class="cta-band__paw" aria-hidden="true">🐾</span>
        <h2 class="cta-band__headline">
          El mejor cuidado empieza<br />
          <em>con el primer paso</em>
        </h2>
        <p class="cta-band__sub">
          Registrarte es completamente gratis. Sin tarjeta de crédito. Sin compromisos.
        </p>
        <div class="cta-band__actions">
          <NuxtLink to="/register" class="cta-band__btn cta-band__btn--primary">
            Crear cuenta gratis
          </NuxtLink>
          <NuxtLink to="/pricing" class="cta-band__btn cta-band__btn--ghost">
            Ver planes PRO
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
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
    { threshold: 0.15 },
  )
  observer.observe(sectionRef.value)
})
</script>

<style scoped>
.cta-band {
  --green: #4caf82;
  --green-dark: #3a9166;
  --forest: #1e2a38;
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;

  position: relative;
  padding: 7rem 0;
  background: var(--forest);
  overflow: hidden;
  text-align: center;
  font-family: var(--font-body);
}

.cta-band__bg-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-display);
  font-size: clamp(5rem, 20vw, 18rem);
  font-weight: 700;
  color: rgba(255, 255, 255, 0.025);
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  letter-spacing: -0.03em;
}

.cta-band__content {
  position: relative;
  z-index: 1;
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.65s ease, transform 0.65s ease;
}

.is-visible .cta-band__content {
  opacity: 1;
  transform: translateY(0);
}

.cta-band__paw {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 1.5rem;
  animation: gentleRock 3.5s ease-in-out infinite;
}

.cta-band__headline {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4.5vw, 3.375rem);
  font-weight: 700;
  color: #fff;
  line-height: 1.12;
  margin-bottom: 1.25rem;
  letter-spacing: -0.01em;
}

.cta-band__headline em {
  font-style: italic;
  color: var(--green);
}

.cta-band__sub {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 2.75rem;
  max-width: 42ch;
  margin-inline: auto;
  line-height: 1.7;
}

.cta-band__actions {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-band__btn {
  display: inline-flex;
  align-items: center;
  padding: 15px 36px;
  border-radius: 100px;
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  border: 2px solid transparent;
}

.cta-band__btn--primary {
  background: var(--green);
  color: white;
  box-shadow: 0 4px 28px rgba(76, 175, 130, 0.38);
}

.cta-band__btn--primary:hover {
  background: var(--green-dark);
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 8px 40px rgba(76, 175, 130, 0.55);
}

.cta-band__btn--ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  border-color: rgba(255, 255, 255, 0.2);
}

.cta-band__btn--ghost:hover {
  color: white;
  border-color: rgba(255, 255, 255, 0.55);
  transform: translateY(-3px);
}

@keyframes gentleRock {
  0%,  100% { transform: rotate(-6deg); }
  50%        { transform: rotate(6deg); }
}
</style>

<template>
  <section class="hero">
    <div class="hero__blob hero__blob--a" aria-hidden="true" />
    <div class="hero__blob hero__blob--b" aria-hidden="true" />

    <div class="container">
      <div class="row g-5 align-items-center hero__row">

        <!-- ── Left: copy ─────────────────────────────────────── -->
        <div class="col-12 col-lg-6 hero__copy">
          <span class="hero__eyebrow">
            <span class="hero__eyebrow-dot" aria-hidden="true" />
            Cuidado inteligente de mascotas
          </span>

          <h1 class="hero__headline">
            Todo el cuidado<br />
            de <em>tu mascota</em>,<br />
            en un lugar
          </h1>

          <p class="hero__lead">
            Recordatorios de vacunas, historial médico completo, adopciones y
            directorio de clínicas — organizado, accesible y siempre contigo.
          </p>

          <div class="hero__actions">
            <NuxtLink to="/register" class="hero__btn hero__btn--primary">
              Empezar gratis
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </NuxtLink>
            <NuxtLink to="/login" class="hero__btn hero__btn--ghost">
              Iniciar sesión
            </NuxtLink>
          </div>

          <div class="hero__social-proof">
            <div class="hero__avatars" aria-hidden="true">
              <div class="hero__avatar">🐶</div>
              <div class="hero__avatar">🐱</div>
              <div class="hero__avatar">🐰</div>
              <div class="hero__avatar">🦜</div>
            </div>
            <p class="hero__social-text">+1,000 dueños ya cuidan a sus mascotas aquí</p>
          </div>
        </div>

        <!-- ── Right: app mockup ───────────────────────────────── -->
        <div class="col-12 col-lg-6 d-flex justify-content-center hero__visual">
          <div class="hero__mockup">

            <!-- Floating notification -->
            <div class="hero__notif" aria-hidden="true">
              <span class="hero__notif-icon">🔔</span>
              <div>
                <div class="hero__notif-title">Recordatorio activo</div>
                <div class="hero__notif-sub">Vacuna de Max · hoy</div>
              </div>
            </div>

            <!-- Main pet card -->
            <div class="hero__card">
              <div class="hero__card-header">
                <div class="hero__pet-avatar">🐶</div>
                <div class="hero__pet-info">
                  <div class="hero__pet-name">Max</div>
                  <div class="hero__pet-breed">Golden Retriever · 3 años</div>
                </div>
                <div class="hero__health-chip">
                  <span class="hero__health-dot" aria-hidden="true" />
                  Saludable
                </div>
              </div>

              <div class="hero__section-label">Próximos recordatorios</div>
              <ul class="hero__reminders" role="list">
                <li v-for="r in reminders" :key="r.text" class="hero__reminder">
                  <span
                    class="hero__reminder-dot"
                    :class="`hero__reminder-dot--${r.status}`"
                    aria-hidden="true"
                  />
                  <span class="hero__reminder-text">{{ r.text }}</span>
                  <span class="hero__reminder-when">{{ r.when }}</span>
                </li>
              </ul>

              <div class="hero__card-footer">
                <div v-for="stat in stats" :key="stat.label" class="hero__stat">
                  <span class="hero__stat-num">{{ stat.value }}</span>
                  <span class="hero__stat-lbl">{{ stat.label }}</span>
                </div>
              </div>
            </div>

            <!-- Floating medical record card -->
            <div class="hero__record" aria-hidden="true">
              <div class="hero__record-icon">🧾</div>
              <div>
                <div class="hero__record-title">Historial actualizado</div>
                <div class="hero__record-sub">Consulta vet. · hace 2 días</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const reminders = [
  { text: 'Vacuna antirrábica', when: 'Hoy', status: 'urgent' },
  { text: 'Desparasitación', when: 'En 15 días', status: 'ok' },
  { text: 'Control mensual', when: 'En 30 días', status: 'ok' },
]

const stats = [
  { value: '12', label: 'Registros médicos' },
  { value: '3', label: 'Mascotas' },
  { value: '8', label: 'Recordatorios' },
]
</script>

<style scoped>
/* ── Variables ─────────────────────────────────────────────────── */
.hero {
  --green: #4caf82;
  --green-light: #e6f7ee;
  --green-dark: #3a9166;
  --amber: #f5a623;
  --forest: #1e2a38;
  --cream: #faf7f2;
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;

  position: relative;
  background: var(--cream);
  overflow: hidden;
  font-family: var(--font-body);
}

.hero__row {
  min-height: calc(100vh - 68px);
  padding-block: 5rem;
}

/* ── Blobs ─────────────────────────────────────────────────────── */
.hero__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}

.hero__blob--a {
  width: 640px;
  height: 640px;
  background: rgba(76, 175, 130, 0.13);
  top: -160px;
  right: -120px;
}

.hero__blob--b {
  width: 380px;
  height: 380px;
  background: rgba(245, 166, 35, 0.09);
  bottom: -100px;
  left: -80px;
}

/* ── Copy ──────────────────────────────────────────────────────── */
.hero__copy {
  position: relative;
  z-index: 1;
  animation: heroFadeUp 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--green-dark);
  background: var(--green-light);
  padding: 6px 14px 6px 10px;
  border-radius: 100px;
  margin-bottom: 1.5rem;
}

.hero__eyebrow-dot {
  width: 7px;
  height: 7px;
  background: var(--green);
  border-radius: 50%;
  flex-shrink: 0;
  animation: blink 2s ease-in-out infinite;
}

.hero__headline {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 5vw, 4.25rem);
  font-weight: 700;
  line-height: 1.08;
  color: var(--forest);
  margin-bottom: 1.5rem;
  letter-spacing: -0.01em;
}

.hero__headline em {
  font-style: italic;
  color: var(--green);
  position: relative;
  display: inline-block;
}

.hero__headline em::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--amber);
  border-radius: 2px;
  transform-origin: left;
  animation: lineGrow 0.55s 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.hero__lead {
  font-size: 1.0625rem;
  color: #5f7282;
  line-height: 1.72;
  max-width: 46ch;
  margin-bottom: 2.25rem;
}

.hero__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.hero__btn {
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

.hero__btn--primary {
  background: var(--green);
  color: #fff;
  box-shadow: 0 4px 20px rgba(76, 175, 130, 0.38);
}

.hero__btn--primary:hover {
  background: var(--green-dark);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(76, 175, 130, 0.5);
}

.hero__btn--ghost {
  background: transparent;
  color: var(--forest);
  border-color: rgba(30, 42, 56, 0.22);
}

.hero__btn--ghost:hover {
  border-color: var(--green);
  color: var(--green);
  transform: translateY(-2px);
}

.hero__social-proof {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero__avatars {
  display: flex;
}

.hero__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  border: 2.5px solid var(--cream);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  margin-left: -8px;
}

.hero__avatar:first-child {
  margin-left: 0;
}

.hero__social-text {
  font-size: 0.875rem;
  color: #8a9aaa;
  margin: 0;
}

/* ── Mockup ────────────────────────────────────────────────────── */
.hero__visual {
  position: relative;
  z-index: 1;
  animation: heroSlideIn 0.8s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.hero__mockup {
  position: relative;
  width: 100%;
  max-width: 400px;
  padding: 48px 16px 48px;
}

/* Notification card */
.hero__notif {
  position: absolute;
  top: 8px;
  right: -8px;
  background: white;
  border-radius: 14px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 32px rgba(30, 42, 56, 0.12);
  z-index: 3;
  max-width: 210px;
  animation: floatA 4s ease-in-out infinite 0.3s;
}

.hero__notif-icon {
  font-size: 1.125rem;
  flex-shrink: 0;
}

.hero__notif-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--forest);
  line-height: 1.3;
}

.hero__notif-sub {
  font-size: 0.6875rem;
  color: #aab4be;
  margin-top: 1px;
}

/* Main card */
.hero__card {
  background: #fff;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 20px 60px rgba(30, 42, 56, 0.13), 0 4px 16px rgba(30, 42, 56, 0.06);
  position: relative;
  z-index: 2;
}

.hero__card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1.25rem;
}

.hero__pet-avatar {
  width: 52px;
  height: 52px;
  background: var(--green-light);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  flex-shrink: 0;
}

.hero__pet-info {
  flex: 1;
  min-width: 0;
}

.hero__pet-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.0625rem;
  color: var(--forest);
  line-height: 1.2;
}

.hero__pet-breed {
  font-size: 0.8125rem;
  color: #9aabb8;
  margin-top: 2px;
}

.hero__health-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--green-dark);
  background: var(--green-light);
  padding: 5px 10px;
  border-radius: 100px;
  white-space: nowrap;
}

.hero__health-dot {
  width: 6px;
  height: 6px;
  background: var(--green);
  border-radius: 50%;
  flex-shrink: 0;
}

.hero__section-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #c0cdd8;
  margin-bottom: 0.75rem;
}

.hero__reminders {
  list-style: none;
  padding: 0;
  margin: 0 0 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hero__reminder {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.875rem;
}

.hero__reminder-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.hero__reminder-dot--urgent {
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.hero__reminder-dot--ok {
  background: var(--green);
}

.hero__reminder-text {
  flex: 1;
  color: var(--forest);
}

.hero__reminder-when {
  font-size: 0.8125rem;
  color: #b0bec9;
}

.hero__card-footer {
  display: flex;
  gap: 0;
  padding-top: 1.125rem;
  border-top: 1px solid #f2f2f2;
}

.hero__stat {
  flex: 1;
  text-align: center;
}

.hero__stat + .hero__stat {
  border-left: 1px solid #f2f2f2;
}

.hero__stat-num {
  display: block;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.375rem;
  color: var(--forest);
  line-height: 1.2;
}

.hero__stat-lbl {
  display: block;
  font-size: 0.6875rem;
  color: #b0bec9;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 2px;
}

/* Medical record card */
.hero__record {
  position: absolute;
  bottom: 4px;
  left: -8px;
  background: var(--forest);
  border-radius: 14px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 32px rgba(30, 42, 56, 0.22);
  z-index: 3;
  max-width: 210px;
  animation: floatB 4s ease-in-out infinite 1.5s;
}

.hero__record-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.hero__record-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
  line-height: 1.3;
}

.hero__record-sub {
  font-size: 0.6875rem;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 1px;
}

/* ── Keyframes ─────────────────────────────────────────────────── */
@keyframes heroFadeUp {
  from { opacity: 0; transform: translateY(32px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes heroSlideIn {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes lineGrow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

@keyframes floatA {
  0%, 100% { transform: translateY(0px) rotate(-1deg); }
  50%       { transform: translateY(-10px) rotate(1deg); }
}

@keyframes floatB {
  0%, 100% { transform: translateY(0px) rotate(1deg); }
  50%       { transform: translateY(-8px) rotate(-1deg); }
}

/* ── Responsive ────────────────────────────────────────────────── */
@media (max-width: 991.98px) {
  .hero__row {
    min-height: auto;
    padding-block: 4rem;
  }

  .hero__visual {
    justify-content: center;
  }

  .hero__mockup {
    padding-inline: 48px;
  }
}

@media (max-width: 575.98px) {
  .hero__notif,
  .hero__record {
    display: none;
  }

  .hero__mockup {
    padding: 0;
  }
}
</style>

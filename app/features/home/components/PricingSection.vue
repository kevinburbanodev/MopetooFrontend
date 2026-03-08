<template>
  <section id="pricing" class="pricing-stitch landing-section">
    <div class="container">
      <div class="text-center mb-5">
        <h2 class="pricing-stitch__title">Planes para cada necesidad</h2>
        <p class="pricing-stitch__subtitle">Escoge el nivel de cuidado que prefieras.</p>
      </div>

      <div class="row g-4 justify-content-center">
        <div
          v-for="plan in plans"
          :key="plan.name"
          class="col-12 col-md-4"
          style="max-width: 380px;"
        >
          <div
            class="pricing-stitch__card"
            :class="{
              'pricing-stitch__card--featured': plan.featured,
            }"
          >
            <div v-if="plan.featured" class="pricing-stitch__recommended">Recomendado</div>
            <h3 class="pricing-stitch__plan-name">{{ plan.name }}</h3>
            <div class="pricing-stitch__price">
              {{ plan.price }}
              <span class="pricing-stitch__period">{{ plan.period }}</span>
            </div>
            <p v-if="plan.trial" class="pricing-stitch__trial">{{ plan.trial }}</p>

            <ul class="pricing-stitch__features">
              <li v-for="feat in plan.features" :key="feat">
                <span class="pricing-stitch__check" aria-hidden="true">&#10003;</span>
                {{ feat }}
              </li>
            </ul>

            <button
              class="pricing-stitch__btn"
              :class="{ 'pricing-stitch__btn--primary': plan.featured }"
            >
              {{ plan.cta }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const plans = [
  {
    name: 'Basico',
    price: '$0',
    period: '/siempre',
    trial: null,
    features: [
      'Registro de 1 Mascota',
      'Recordatorios basicos',
      'Acceso a red de adopcion',
    ],
    cta: 'Elegir Gratis',
    featured: false,
  },
  {
    name: 'PRO',
    price: '$15.000',
    period: 'COP/mes',
    trial: 'Prueba 7 dias gratis',
    features: [
      'Mascotas ilimitadas',
      'Carnet Digital Exportable',
      'Perfil Publico (QR Extravio)',
      'Historial en la Nube',
    ],
    cta: 'Obtener PRO',
    featured: true,
  },
  {
    name: 'Negocios PRO',
    price: '$40.000',
    period: 'COP/mes',
    trial: null,
    features: [
      'Perfil de Comercio Verificado',
      'Panel de Gestion de Citas',
      'Anuncios en Directorio',
    ],
    cta: 'Elegir Negocio',
    featured: false,
  },
]
</script>

<style scoped>
.pricing-stitch {
  background: #F9FAFB;
}

.pricing-stitch__title {
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.75rem;
}

.pricing-stitch__subtitle {
  color: #6b7280;
}

.pricing-stitch__card {
  background: #fff;
  border-radius: 1.5rem;
  padding: 2rem;
  border: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.pricing-stitch__card--featured {
  border: 2px solid #10B981;
  box-shadow: 0 20px 50px rgba(16, 185, 129, 0.12);
  transform: scale(1.03);
}

.pricing-stitch__recommended {
  position: absolute;
  top: -0.875rem;
  left: 50%;
  transform: translateX(-50%);
  background: #10B981;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.25rem 1rem;
  border-radius: 100px;
  white-space: nowrap;
}

.pricing-stitch__plan-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.pricing-stitch__price {
  font-size: 2.5rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.25rem;
}

.pricing-stitch__period {
  font-size: 0.875rem;
  font-weight: 400;
  color: #9ca3af;
}

.pricing-stitch__trial {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #10B981;
  margin-bottom: 0;
}

.pricing-stitch__features {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex-grow: 1;
}

.pricing-stitch__features li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.pricing-stitch__check {
  color: #10B981;
  font-weight: 700;
}

.pricing-stitch__btn {
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 2px solid #f3f4f6;
  background: transparent;
  font-weight: 700;
  font-size: 0.9375rem;
  color: #111827;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.pricing-stitch__btn:hover {
  border-color: #10B981;
}

.pricing-stitch__btn--primary {
  background: #10B981;
  color: #fff;
  border-color: #10B981;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.2);
}

.pricing-stitch__btn--primary:hover {
  background: #059669;
  border-color: #059669;
}
</style>

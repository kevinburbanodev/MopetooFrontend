<template>
  <section class="features-stitch landing-section">
    <div class="container">
      <div class="row g-5 align-items-center">
        <!-- Left: Phone mockup -->
        <div class="col-12 col-lg-6 order-2 order-lg-1 d-flex justify-content-center">
          <img
            alt="App Feature"
            class="features-stitch__phone"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3783812zu9qw5LRagdlRPMs1TN7T5xf7ndL7773zUIgm1CMD0twXFHnYCX0IfGwptBTf6u5xO5Aj36nTH6Pd92ZpYwa1PSV6Tvth5mmJEsR_Aun8MG4c4WTUwkU2GoOw8bv30rClE_F4bhDi6EIP8XR6f0w0ASyw5E_2MHKnVjhqhvFTKbSEPoNEnYV1VWr_QKByaH4HDnvEMN0b0lNwSVAQo8a7ZaBLwDgbRoSF4ULAd-HiXijM5YK5HeoVH7qTN8_WRbJEne20m"
          />
        </div>

        <!-- Right: Feature grid -->
        <div class="col-12 col-lg-6 order-1 order-lg-2">
          <span class="features-stitch__eyebrow">Para duenos</span>
          <h2 class="features-stitch__title">
            Control total del bienestar de tu mascota
          </h2>

          <div class="row g-4">
            <div
              v-for="feat in features"
              :key="feat.title"
              class="col-12 col-sm-6"
            >
              <div class="features-stitch__item">
                <div
                  class="features-stitch__number"
                  :class="{ 'features-stitch__number--pro': feat.pro }"
                >
                  {{ feat.pro ? 'PRO' : feat.num }}
                </div>
                <h4 class="features-stitch__item-title">{{ feat.title }}</h4>
                <p class="features-stitch__item-text">{{ feat.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    num: '01',
    title: 'Perfil de Mascotas',
    desc: 'Informacion basica, gustos y comportamiento detallado.',
    pro: false,
  },
  {
    num: '02',
    title: 'Recordatorios',
    desc: 'Alertas inteligentes para vacunas, desparasitacion y citas.',
    pro: false,
  },
  {
    num: '03',
    title: 'Historial Medico',
    desc: 'Guarda cada visita al veterinario de forma cronologica.',
    pro: false,
  },
  {
    num: '04',
    title: 'Carnet Digital & QR',
    desc: 'Exporta en PDF o genera un perfil publico con codigo QR.',
    pro: true,
  },
]
</script>

<style scoped>
.features-stitch {
  background: #F9FAFB;
}

.features-stitch__phone {
  max-width: 280px;
  border-radius: 2.5rem;
  border: 8px solid #fff;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
}

.features-stitch__eyebrow {
  display: inline-block;
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #F97316;
  margin-bottom: 0.75rem;
}

.features-stitch__title {
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 800;
  color: #111827;
  line-height: 1.15;
  margin-bottom: 2rem;
}

.features-stitch__item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.features-stitch__number {
  width: 2.5rem;
  height: 2.5rem;
  background: #d1fae5;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  color: #10B981;
}

.features-stitch__number--pro {
  background: #ffedd5;
  color: #F97316;
}

.features-stitch__item-title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.features-stitch__item-text {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}
</style>

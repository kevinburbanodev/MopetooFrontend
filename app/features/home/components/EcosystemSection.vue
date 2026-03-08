<template>
  <section id="features" class="ecosystem-section landing-section">
    <div class="container">
      <div class="text-center mb-5">
        <h2 class="ecosystem-section__title">Un ecosistema para todos</h2>
        <p class="ecosystem-section__subtitle">
          Disenado para conectar a quienes aman y cuidan a los animales.
        </p>
      </div>

      <div class="row g-4">
        <div
          v-for="card in cards"
          :key="card.title"
          class="col-12 col-md-6 col-lg-3"
        >
          <div class="ecosystem-section__card">
            <div class="ecosystem-section__emoji">{{ card.emoji }}</div>
            <h3 class="ecosystem-section__card-title">{{ card.title }}</h3>
            <p class="ecosystem-section__card-text">{{ card.desc }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const cards = [
  {
    emoji: '🐶',
    title: 'Duenos de Mascotas',
    desc: 'Todo el historial medico y recordatorios en tu bolsillo.',
  },
  {
    emoji: '🏠',
    title: 'Refugios',
    desc: 'Herramientas gratuitas para gestionar adopciones y donaciones.',
  },
  {
    emoji: '🏪',
    title: 'Tiendas Pet',
    desc: 'Llega a clientes locales buscando los mejores productos.',
  },
  {
    emoji: '🏥',
    title: 'Clinicas',
    desc: 'Digitaliza las historias clinicas y agenda citas facilmente.',
  },
]
</script>

<style scoped>
.ecosystem-section {
  background: #fff;
}

.ecosystem-section__title {
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.75rem;
}

.ecosystem-section__subtitle {
  color: #6b7280;
  font-style: italic;
  max-width: 540px;
  margin-inline: auto;
}

.ecosystem-section__card {
  background: #F9FAFB;
  border-radius: 1.5rem;
  padding: 2rem;
  height: 100%;
  border: 1px solid transparent;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}

.ecosystem-section__card:hover {
  border-color: rgba(16, 185, 129, 0.2);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  transform: translateY(-4px);
}

.ecosystem-section__emoji {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  display: inline-block;
  transition: transform 0.25s ease;
}

.ecosystem-section__card:hover .ecosystem-section__emoji {
  transform: scale(1.1);
}

.ecosystem-section__card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.ecosystem-section__card-text {
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}
</style>

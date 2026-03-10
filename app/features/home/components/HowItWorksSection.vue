<template>
  <section id="shelters" class="shelters-stitch landing-section">
    <div class="container">
      <div class="row g-5 align-items-center">
        <!-- Left: Content -->
        <div class="col-12 col-lg-6">
          <span class="shelters-stitch__badge">100% GRATUITO</span>
          <h2 class="shelters-stitch__title">
            Dale visibilidad a tu refugio y salva mas vidas.
          </h2>
          <p class="shelters-stitch__subtitle">
            Entendemos el trabajo de los refugios. Mopetoo ofrece herramientas
            profesionales sin costo para que te enfoques en lo que importa: rescatar.
          </p>

          <ul class="shelters-stitch__features">
            <li v-for="feat in features" :key="feat.title" class="shelters-stitch__feat">
              <span class="shelters-stitch__check" aria-hidden="true">&#10003;</span>
              <div>
                <h5 class="shelters-stitch__feat-title">{{ feat.title }}</h5>
                <p class="shelters-stitch__feat-text">{{ feat.desc }}</p>
              </div>
            </li>
          </ul>

          <a href="#" class="shelters-stitch__cta">Registrar mi Refugio</a>
        </div>

        <!-- Right: Image grid -->
        <div class="col-12 col-lg-6">
          <div class="shelters-stitch__images">
            <img
              alt="Shelter App"
              class="shelters-stitch__img shelters-stitch__img--offset"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTDX4gr6RCr1WR2HS5azvjiH5CJKbSElL0ON3Qq2zPg3QESOERkdKp5jmC0ktnkoK6wdITDu4Du69GXSJBO0cH5qEC9Rs3JmpCetnnOi38VUjI9qKXMF8Fagfd_2mqKlsYDEMw9nUnN-bAhgaiL4OZrjCETDsdusi5Gt2TE85bBzAfaOp2Zz76iYCzrsje0lAahhA4yDM5UirVvyLDKeZqSAeqZpCnAm4Piq7bz-QMyVjnQ8SNP4ecghLQSRv9Db1iHkqudelfCjft"
            />
            <img
              alt="Shelter App"
              class="shelters-stitch__img"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCms9-PqH7VuOrLBx_q8xbSEWX6qbjT6xcZjsSPTQzSpQfcr8wFSeGT7vYAHXkEixcZDdliJ-lDLPSQNqXaA4k10rlmb5LpFZiwiCgrx2fVelhg9nHl_WMRejGMgD64JOgSVU2E1o0X7XTKpHcXnOzUgoxGVScPMsJuvRQzphN43yP8FAnpF4s2powtXJ9xB1iPq6_mUVDz1HJJ3i7WogkBdsJQ9VC1LMIPpFp2RNlgcWhzcnlB3Ur6JYKTvXvSxFXm7WF8CX4TgjTj"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    title: 'Mascotas en Adopcion',
    desc: 'Crea perfiles atractivos con filtros para adoptantes potenciales.',
  },
  {
    title: 'Donaciones Directas',
    desc: 'Vincula tus cuentas de Nequi o Daviplata sin intermediarios.',
  },
  {
    title: 'Verificacion Oficial',
    desc: 'Obten la insignia de confianza para mayor seguridad de los donantes.',
  },
]
</script>

<style scoped>
.shelters-stitch {
  background: #111827;
  color: #fff;
  overflow: hidden;
}

.shelters-stitch__badge {
  display: inline-block;
  background: rgba(16, 185, 129, 0.2);
  color: #10B981;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
}

.shelters-stitch__title {
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 1rem;
}

.shelters-stitch__subtitle {
  font-size: 1.0625rem;
  color: #9ca3af;
  line-height: 1.7;
  margin-bottom: 2.5rem;
}

.shelters-stitch__features {
  list-style: none;
  padding: 0;
  margin: 0 0 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.shelters-stitch__feat {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.shelters-stitch__check {
  color: #10B981;
  font-size: 1rem;
  margin-top: 0.25rem;
  flex-shrink: 0;
}

.shelters-stitch__feat-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
}

.shelters-stitch__feat-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.shelters-stitch__cta {
  display: inline-block;
  padding: 0.875rem 2rem;
  background: #10B981;
  color: #fff;
  font-weight: 700;
  border-radius: 0.75rem;
  text-decoration: none;
  transition: background 0.2s ease;
}

.shelters-stitch__cta:hover {
  background: #059669;
  color: #fff;
}

/* Image grid */
.shelters-stitch__images {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.shelters-stitch__img {
  width: 100%;
  border-radius: 1rem;
  border: 1px solid #374151;
}

.shelters-stitch__img--offset {
  margin-top: 3rem;
}
</style>

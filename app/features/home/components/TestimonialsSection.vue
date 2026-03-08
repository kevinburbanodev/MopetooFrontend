<template>
  <section class="testimonials-stitch landing-section">
    <div class="container">
      <div class="text-center mb-5">
        <h2 class="testimonials-stitch__title">Voces de nuestra comunidad</h2>
      </div>

      <div class="row g-4">
        <div
          v-for="t in testimonials"
          :key="t.name"
          class="col-12 col-md-4"
        >
          <div class="testimonials-stitch__card">
            <div class="testimonials-stitch__stars" aria-label="5 estrellas">
              <span v-for="n in 5" :key="n" class="testimonials-stitch__star">&#9733;</span>
            </div>
            <p class="testimonials-stitch__quote">"{{ t.quote }}"</p>
            <div class="testimonials-stitch__author">
              <img
                :alt="t.name"
                :src="t.avatar"
                class="testimonials-stitch__avatar"
              />
              <div>
                <div class="testimonials-stitch__name">{{ t.name }}</div>
                <div class="testimonials-stitch__role">{{ t.role }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const testimonials = [
  {
    quote: 'Increible app. El carnet digital me salvo en un viaje cuando olvide los papeles fisicos de mi perro.',
    name: 'Mariana R.',
    role: 'Duena de 2 Shih Tzu',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAp63hBXzUe3t0UEdBxuO_pFilXz9pm3fUWl_v9-gPODLxibzZxvf6zD0NjxymddUYixQI-xeU2OCZgunlsB2QFu2ScpQGDJJSxTRSv-vsXByhe1xvtPNbyxM_QRQF7S9h8zdAIfFuD8f5Sy9yvXXT_UBKwdjSBOXq-xt2QoPo8L5I1r_gvF4H60WuhOOvYoWddXn0OcKKLXejjdC0Vd2azHCxDRFqlVvr7Ys1n0yB3_rzhU48pj-ElK-4QrhaTjHi3cNLLa5AxilD_',
  },
  {
    quote: 'Como refugio, nos ha ayudado a organizar las fichas de 40 perritos y recibir donaciones facil.',
    name: 'Fundacion Huellitas',
    role: 'Refugio en Bogota',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3ZWgfoYkNCzCTCe2Hz2cGBC1vIRAUJQRSEo1lPINyW9_1cIcYIsleGsBsS71FSytBT2iF9etZUTloaVLyoMlfwgAX-CgVSwzTPI8f4c8lvY0-dn_1ytO2WNI_SrefxMWcfpUijXCjv1bqPXF1kYA9l6aBQvtB-uhM8QtwdnhLjbCMEpZN-9ND4xp0aSNVF_jqO0hOgL7J5GfUC-ThBqH8SB6RA2rVsiGCXY3_dnKR4ffNWK9_kUzbMqkknkqAZ7P7d2V4FCLQC69e',
  },
  {
    quote: 'Muy intuitiva. Las alertas de vacunacion son geniales para padres de mascotas distraidos.',
    name: 'Carlos M.',
    role: 'Papa de "Bruno" (Golden)',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIY5AyQe-qZr_M0-l7NG2jEUOOpZCz37a2nMgZ1fYrsiMJ-ITFw5MsPT2C8myANJzjFkllwczRnShK6BCkfKiVpPyBMzhD1fSJib3__WWddJNNDpACQxPSOzgoDXoRAT5ss9O5JRIXwy46vtaLaijF5oLwuZhK0dwLRHarvb0apxN_Nw7X_6-lWDEFnPGwdZbwWv58k8hSMGGuYEiT_I-In2BTmmcB8Djn2h8SjltN2K8At5NADa_XZs-UpuVDyjAIMecAfmfus6GD',
  },
]
</script>

<style scoped>
.testimonials-stitch {
  background: #F9FAFB;
}

.testimonials-stitch__title {
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 700;
  color: #111827;
}

.testimonials-stitch__card {
  background: #fff;
  border-radius: 1.5rem;
  padding: 2rem;
  border: 1px solid #f3f4f6;
  height: 100%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.testimonials-stitch__stars {
  display: flex;
  gap: 0.125rem;
  margin-bottom: 1rem;
}

.testimonials-stitch__star {
  color: #F97316;
  font-size: 1rem;
}

.testimonials-stitch__quote {
  font-size: 0.9375rem;
  color: #4b5563;
  font-style: italic;
  line-height: 1.7;
  margin-bottom: 1.5rem;
}

.testimonials-stitch__author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.testimonials-stitch__avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  object-fit: cover;
  background: #e5e7eb;
}

.testimonials-stitch__name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #111827;
}

.testimonials-stitch__role {
  font-size: 0.75rem;
  color: #9ca3af;
}
</style>

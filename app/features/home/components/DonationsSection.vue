<template>
  <section class="donations-stitch landing-section">
    <div class="container text-center position-relative">
      <h2 class="donations-stitch__title">Tu ayuda transforma vidas</h2>
      <p class="donations-stitch__quote">
        "A traves de Mopetoo, hemos facilitado mas de 500 adopciones en el ultimo ano.
        Cada donacion llega directamente a quienes mas lo necesitan."
      </p>

      <div class="donations-stitch__logos">
        <img
          alt="Nequi"
          class="donations-stitch__logo"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBW47h6n3sCcyUsFruoi77m9dloN8zj2FT2nyVHwAxCYNSFkAjfzipRQcr1vK7H_CuzthYc9NHr6a6O2rfrKE42lTsNJyFdgi7wf_uA6iPJoK13WHMBfbDSxsgYftr_txJwQidG3pXEO3GWFJKM0lFoL-tuxbWvCe7r9kyPklGvzgYxGuYfsMMGD4M0QbHlTS3CcOOpLJ_XexlGnFZhJ3NKNzl28P6F0tWbjAbZ1b2ztj9igAd5yIsTWBvHMOTtt-WLTqsw5JK6-UF7"
        />
        <img
          alt="Daviplata"
          class="donations-stitch__logo"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcG5kdSeUR_AJPUaQDPQyQOn9YdhEf-izXH3QKF53PQXtHK919GBxJTk0RN_RcB_4O910hYch-jBuxv4soxn17G-4RnyOR3MUQ8CukzSubeaVYfjNtd1HbrXWH-Pw_0xv3_-J4_KjBkA9uTGlZTW2kM73PXitgLctgCqBvNLJwCjcRyercH3-Smb0_nfCFH-Vjl6CtsZJMqQDKdxhxpeEX7vUmPRYrTVbOhzVARULdb-CA_QetdCLhsKo6-yP7xOARSPF8eUXPeRJr"
        />
        <img
          alt="Wompi"
          class="donations-stitch__logo"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5wKcTOtn7X5-jjzHw52np6uNb13Ml1n4blieheAKuPffwnv-gU-n6oSLp5qZR69UxNzcZe4FpXdxlw741DETbLGXue94dOl7zeNSuxamK-xzB3G8yJEhi4rnb0Qg184rESqvheH3O3eel0KbTOtntogRdA-Og0r0P9e9ktqI0qGCgb_JKlQyXQxPhtVw9l-8iDieLQ5l4BsULPL5uMWcMf3nTY6vg3Kt3skeVh9HMj6dFsBHbAVh_A__RbC-4GIpTUMCQZAh0aTcW"
        />
      </div>

      <a href="#" class="donations-stitch__cta">
        Quiero Apoyar un Refugio
      </a>

      <!-- Decorative paws -->
      <div class="donations-stitch__paw donations-stitch__paw--top" aria-hidden="true">🐾</div>
      <div class="donations-stitch__paw donations-stitch__paw--bottom" aria-hidden="true">🐾</div>
    </div>
  </section>
</template>

<style scoped>
.donations-stitch {
  background: #ecfdf5;
  position: relative;
  overflow: hidden;
}

.donations-stitch__title {
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 800;
  color: #111827;
  margin-bottom: 1.5rem;
}

.donations-stitch__quote {
  font-size: 1.125rem;
  color: #374151;
  line-height: 1.7;
  font-style: italic;
  max-width: 680px;
  margin: 0 auto 2.5rem;
}

.donations-stitch__logos {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2.5rem;
  opacity: 0.7;
  filter: grayscale(1);
  transition: filter 0.3s ease, opacity 0.3s ease;
}

.donations-stitch__logos:hover {
  filter: grayscale(0);
  opacity: 1;
}

.donations-stitch__logo {
  height: 2rem;
}

.donations-stitch__cta {
  display: inline-block;
  padding: 1rem 2.5rem;
  background: #F97316;
  color: #fff;
  font-weight: 700;
  font-size: 1.0625rem;
  border-radius: 1rem;
  text-decoration: none;
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.2);
  transition: background 0.2s ease, transform 0.2s ease;
}

.donations-stitch__cta:hover {
  background: #ea580c;
  color: #fff;
  transform: translateY(-2px);
}

.donations-stitch__paw {
  position: absolute;
  font-size: 3.5rem;
  opacity: 0.1;
}

.donations-stitch__paw--top {
  top: 2rem;
  left: 2rem;
  transform: rotate(12deg);
}

.donations-stitch__paw--bottom {
  bottom: 2rem;
  right: 2rem;
  transform: rotate(-12deg);
}
</style>

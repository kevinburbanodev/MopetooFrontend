<template>
  <section class="hero-stitch paw-pattern">
    <div class="container">
      <div class="row g-5 align-items-center">
        <!-- Left: Content -->
        <div class="col-12 col-lg-6 hero-stitch__content">
          <div class="hero-stitch__badge">
            <span class="hero-stitch__badge-dot" aria-hidden="true">
              <span class="hero-stitch__badge-ping" />
              <span class="hero-stitch__badge-core" />
            </span>
            Lanzamiento en Latinoamerica
          </div>

          <h1 class="hero-stitch__title">
            Cuida a tus mascotas <span class="hero-stitch__accent">como nunca</span>
          </h1>

          <p class="hero-stitch__subtitle">
            La plataforma integral para el bienestar de tus peludos. Gestion de salud,
            adopcion responsable y conexion con expertos en un solo lugar.
          </p>

          <div class="hero-stitch__badges">
            <a href="#" class="hero-stitch__store-link">
              <img
                alt="Get it on Google Play"
                class="hero-stitch__store-img"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiYk2R1znmcxii93j6C6xfQSJ8d_6PR_GKnqmi9ZmRRxvtryEEMlt7V37yzDmmZtYv6_K8fUAJmgcy5eSB_NLaEXfKPp1xXnzEyywi7V8M65Ehh0-m-Ndd3rEMkyGap32jy4c1PNVleX9hOEv2XR7ewcpw9EqtZkAQGC1CVSlBMzRLVaSlcmTCWFvcGKhmAduK3Fo340Z3XTcsVW1xQ_LI4cpCfJMd1HNeK6LLqTW3cliGfa6z7Gqxj_nr08Ug6Z4pi1YLRrWYNe1t"
              />
            </a>
            <a href="#" class="hero-stitch__store-link">
              <img
                alt="Download on App Store"
                class="hero-stitch__store-img"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5bpI3EM0LkA3HncRAGmYO9wDgWesJ9Htbvk96nlCzaX9SkR7xhsp23Q0bGF9iESTKSHIzjGZwoG7f7-BI1c9wyax3aIPA80VfoqqvuKlmvllTEyIfVVQNHTrSlpBTfqZvNMbu0XkRrIFHutkEg-L1mHFJIGpvGkJiKSty96_8_xzKPOLZF9WB89o-X9cdU6zANcLwo7y2D_15MNU5HW-HkoLtevKIXUXAoaYoTfbHPGNf-k6T9VslnUWBt3ofcd8t8KTl5IqoUPle"
              />
            </a>
          </div>

          <div class="hero-stitch__stats">
            <div class="hero-stitch__stat">
              <span class="hero-stitch__stat-value">+1000</span>
              <span class="hero-stitch__stat-label">Mascotas registradas</span>
            </div>
            <div class="hero-stitch__stat hero-stitch__stat--bordered">
              <span class="hero-stitch__stat-value">Gratis</span>
              <span class="hero-stitch__stat-label">Para descargar</span>
            </div>
            <div class="hero-stitch__stat hero-stitch__stat--bordered">
              <span class="hero-stitch__stat-value">4.9/5</span>
              <span class="hero-stitch__stat-label">Valoracion usuarios</span>
            </div>
          </div>
        </div>

        <!-- Right: Phone mockup -->
        <div class="col-12 col-lg-6 d-flex justify-content-center">
          <div class="hero-stitch__mockup">
            <img
              alt="App Dashboard Mockup"
              class="hero-stitch__phone"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDBdqbNHfjPa-_YV4IFS7gq6SMFtZu5bgGz8g_Xx_HWZIUUOZkwNe48hnDb9ukmKjZxwKmyBUjrageBLDP9xYcG8Ew5LhIMdEDoayP3tfSf3x17SzJbjfKUcIiTuJeelv80LosNJyJBSp2SnUud9ygeNQ1oAJGYS65unmtMWG9Q3tFKOWy22lLZU-u6uX65cCNb7YtzR3GE46mpLoD-l1c9s0fCiGhwCN5ALaeOS7NtS9VqkTqsJHHP5H5TaSrq0JBkEWjT9G1nLe3"
            />
            <div class="hero-stitch__deco hero-stitch__deco--orange" aria-hidden="true" />
            <div class="hero-stitch__deco hero-stitch__deco--green" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-stitch {
  background: #F9FAFB;
  padding: 4rem 0 5rem;
  overflow: hidden;
  position: relative;
}

@media (min-width: 992px) {
  .hero-stitch {
    padding: 5rem 0 6rem;
  }
}

.hero-stitch__content {
  text-align: center;
}

@media (min-width: 992px) {
  .hero-stitch__content {
    text-align: left;
  }
}

.hero-stitch__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #d1fae5;
  color: #10B981;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.375rem 1rem;
  border-radius: 100px;
  margin-bottom: 1.5rem;
}

.hero-stitch__badge-dot {
  position: relative;
  display: inline-flex;
  width: 0.5rem;
  height: 0.5rem;
}

.hero-stitch__badge-ping {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #10B981;
  opacity: 0.75;
  animation: heroPing 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.hero-stitch__badge-core {
  position: relative;
  display: inline-flex;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #10B981;
}

@keyframes heroPing {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

.hero-stitch__title {
  font-size: clamp(2.5rem, 5vw, 4.25rem);
  font-weight: 800;
  color: #111827;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
}

.hero-stitch__accent {
  color: #10B981;
  font-style: italic;
}

.hero-stitch__subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  line-height: 1.7;
  max-width: 540px;
  margin-bottom: 2.5rem;
}

@media (max-width: 991.98px) {
  .hero-stitch__subtitle {
    margin-inline: auto;
  }
}

.hero-stitch__badges {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
}

@media (min-width: 992px) {
  .hero-stitch__badges {
    justify-content: flex-start;
  }
}

.hero-stitch__store-link {
  transition: transform 0.2s ease;
}

.hero-stitch__store-link:hover {
  transform: scale(1.05);
}

.hero-stitch__store-img {
  height: 3.5rem;
}

.hero-stitch__stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
}

@media (min-width: 992px) {
  .hero-stitch__stats {
    justify-content: flex-start;
  }
}

.hero-stitch__stat {
  display: flex;
  flex-direction: column;
}

.hero-stitch__stat--bordered {
  padding-left: 2rem;
  border-left: 1px solid #e5e7eb;
}

.hero-stitch__stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.hero-stitch__stat-label {
  font-size: 0.8125rem;
  color: #6b7280;
}

/* Phone mockup */
.hero-stitch__mockup {
  position: relative;
}

.hero-stitch__phone {
  display: block;
  max-width: 300px;
  border-radius: 3rem;
  border: 12px solid #111827;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  animation: landing-float 4s ease-in-out infinite;
}

@media (min-width: 992px) {
  .hero-stitch__phone {
    max-width: 350px;
  }
}

.hero-stitch__deco {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  z-index: -1;
}

.hero-stitch__deco--orange {
  width: 256px;
  height: 256px;
  background: rgba(249, 115, 22, 0.1);
  bottom: -40px;
  right: -40px;
}

.hero-stitch__deco--green {
  width: 256px;
  height: 256px;
  background: rgba(16, 185, 129, 0.1);
  top: -40px;
  left: -40px;
}

@keyframes landing-float {
  0%   { transform: translateY(0px); }
  50%  { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}
</style>

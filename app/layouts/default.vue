<script setup lang="ts">
</script>

<template>
  <div class="d-flex flex-column min-vh-100">
    <AppNavbar />

    <main class="flex-grow-1" style="padding-top: 72px;">
      <slot />
    </main>

    <ClientOnly>
      <Toaster position="top-right" :duration="4000" rich-colors />
    </ClientOnly>

    <footer class="landing-footer">
      <div class="container">
        <div class="row g-4 mb-5">
          <!-- Col 1: Brand + Social -->
          <div class="col-12 col-lg-3">
            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="landing-footer__logo-icon">
                <span class="material-symbols-outlined" aria-hidden="true">pets</span>
              </span>
              <span class="landing-footer__brand">Mopetoo</span>
            </div>
            <p class="landing-footer__tagline">
              Elevando el estandar de cuidado animal en toda Latinoamerica.
            </p>
            <div class="d-flex gap-2">
              <a href="#" class="landing-footer__social" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
              </a>
              <a href="#" class="landing-footer__social" aria-label="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
              </a>
              <a href="#" class="landing-footer__social" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
            </div>
          </div>

          <!-- Col 2: Comunidad -->
          <div class="col-6 col-lg-3">
            <h6 class="landing-footer__heading">Comunidad</h6>
            <ul class="landing-footer__links">
              <li><NuxtLink to="/blog">Blog de Cuidado</NuxtLink></li>
              <li><a href="#">Directorio de Refugios</a></li>
              <li><a href="#">Alianzas</a></li>
              <li><a href="#">Eventos</a></li>
            </ul>
          </div>

          <!-- Col 3: Legal -->
          <div class="col-6 col-lg-3">
            <h6 class="landing-footer__heading">Legal</h6>
            <ul class="landing-footer__links">
              <li><a href="#">Terminos y Condiciones</a></li>
              <li><a href="#">Politica de Privacidad</a></li>
              <li><a href="#">Uso de Cookies</a></li>
            </ul>
          </div>

          <!-- Col 4: Contacto -->
          <div class="col-12 col-lg-3">
            <h6 class="landing-footer__heading">Contacto</h6>
            <ul class="landing-footer__links">
              <li>hola@mopetoo.com</li>
              <li>Soporte tecnico 24/7</li>
            </ul>
            <div class="d-flex gap-2 mt-3">
              <a href="#" class="landing-footer__store-badge" aria-label="Google Play">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734c0-.382.218-.72.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.2L20.4 11.2c.533.333.533.867 0 1.2l-2.4 1.4-2.502-2.502 2.2-1.791zM3.864 1.667L14.8 8.0l-2.302 2.302L3.864 1.667z"/></svg>
              </a>
              <a href="#" class="landing-footer__store-badge" aria-label="App Store">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <!-- Bottom bar -->
        <div class="landing-footer__bottom">
          <p class="landing-footer__copy">
            &copy; {{ new Date().getFullYear() }} Mopetoo App. Hecho con amor en Colombia
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing-footer {
  background: #F9FAFB;
  padding: 4rem 0 2rem;
  border-top: 1px solid #e5e7eb;
}

.landing-footer__logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #10B981;
  border-radius: 0.5rem;
  color: #fff;
}

.landing-footer__logo-icon .material-symbols-outlined {
  font-size: 1.125rem;
}

.landing-footer__brand {
  font-size: 1.25rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.02em;
}

.landing-footer__tagline {
  font-size: 0.875rem;
  color: #6b7280;
  max-width: 280px;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.landing-footer__social {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  color: #9ca3af;
  transition: color 0.2s ease, border-color 0.2s ease;
  text-decoration: none;
}

.landing-footer__social:hover {
  color: #10B981;
  border-color: #10B981;
}

.landing-footer__heading {
  font-weight: 700;
  font-size: 0.875rem;
  color: #111827;
  margin-bottom: 1rem;
}

.landing-footer__links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.landing-footer__links li {
  font-size: 0.875rem;
  color: #6b7280;
}

.landing-footer__links a {
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s ease;
}

.landing-footer__links a:hover {
  color: #10B981;
}

.landing-footer__store-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s ease;
}

.landing-footer__store-badge:hover {
  color: #10B981;
}

.landing-footer__bottom {
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.landing-footer__copy {
  font-size: 0.8125rem;
  color: #9ca3af;
  margin: 0;
}
</style>

<script setup lang="ts">
</script>

<template>
  <div class="d-flex flex-column min-vh-100">
    <AppNavbar />

    <main class="flex-grow-1">
      <slot />
    </main>

    <footer class="footer mt-auto">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-md-6 mb-2 mb-md-0">
            <span class="footer__brand">🐾 Mopetoo</span>
            <span class="footer__tagline">— Cuidá a tus mascotas como nunca</span>
          </div>
          <div class="col-md-6 text-md-end">
            <span class="footer__copy">© {{ new Date().getFullYear() }} Mopetoo. Todos los derechos reservados.</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.footer {
  background: #1e2a38;
  color: #fff;
  padding: 1.25rem 0;
}

.footer__brand {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 700;
  font-size: 1rem;
}

.footer__tagline {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.85rem;
  margin-left: 0.5rem;
}

.footer__copy {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.85rem;
}
</style>

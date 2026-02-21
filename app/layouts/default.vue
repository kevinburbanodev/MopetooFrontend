<script setup lang="ts">
</script>

<template>
  <div class="d-flex flex-column min-vh-100">
    <AppNavbar />

    <main class="flex-grow-1">
      <slot />
    </main>

    <footer class="bg-dark text-white py-4 mt-auto">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-md-6 mb-2 mb-md-0">
            <span class="fw-bold">🐾 Mopetoo</span>
            <span class="text-muted ms-2 small">— Cuidá a tus mascotas como nunca</span>
          </div>
          <div class="col-md-6 text-md-end">
            <span class="text-muted small">© {{ new Date().getFullYear() }} Mopetoo. Todos los derechos reservados.</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

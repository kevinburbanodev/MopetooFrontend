<script setup lang="ts">
// MaintenancePage — full-page maintenance view.
// Shown at /maintenance when maintenance mode is active.
// Also used by admins navigating directly to /maintenance to
// preview what end-users see (admins are never redirected here
// automatically — the middleware bypasses them).
//
// SSR-safe: no window/document access.
// Accessible: role="main", single h1, keyboard-navigable link.

interface Props {
  /** Optional custom message from the backend. Falls back to the
   *  default subtitle when not provided. */
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  message: undefined,
})

// The default subtitle shown when no custom message is configured.
const defaultSubtitle = 'Estamos trabajando para mejorar Mopetoo. Vuelve pronto.'

const subtitle = computed<string>(() => props.message ?? defaultSubtitle)
</script>

<template>
  <main
    class="maintenance-page min-vh-100 d-flex align-items-center justify-content-center"
    role="main"
    aria-label="Sitio en mantenimiento"
  >
    <div class="maintenance-page__container text-center px-4">
      <!-- Icon -->
      <div
        class="maintenance-page__icon mb-4"
        aria-hidden="true"
      >
        🔧
      </div>

      <!-- Heading -->
      <h1 class="maintenance-page__title display-5 fw-bold text-success mb-3">
        En mantenimiento
      </h1>

      <!-- Subtitle / custom message -->
      <p class="maintenance-page__subtitle lead text-muted mb-5">
        {{ subtitle }}
      </p>

      <!-- Back to home link — always visible on the /maintenance page.
           Admins land here directly; regular users see this after maintenance ends. -->
      <NuxtLink
        to="/"
        class="btn btn-outline-success btn-lg maintenance-page__cta"
        aria-label="Volver al inicio de Mopetoo"
      >
        Volver al inicio
      </NuxtLink>
    </div>
  </main>
</template>

<style scoped lang="scss">
.maintenance-page {
  background-color: var(--bs-body-bg);

  &__container {
    max-width: 32rem;
  }

  &__icon {
    font-size: 5rem;
    line-height: 1;
    // Prevent icon from shifting layout during load (CLS)
    display: block;
    min-height: 6rem;
  }

  &__title {
    // Use the brand green token from Bootstrap $success override
    // (_variables.scss sets $success to #4CAF82 / brand green)
    color: var(--bs-success);
  }

  &__subtitle {
    max-width: 24rem;
    margin-left: auto;
    margin-right: auto;
  }

  &__cta {
    // Ensure focus ring is visible for keyboard users
    &:focus-visible {
      outline: 3px solid var(--bs-success);
      outline-offset: 3px;
    }
  }
}
</style>

<script setup lang="ts">
// ProBanner — inline upgrade prompt for gated PRO features.
// Shown to authenticated non-PRO users; non-authenticated users see a
// login CTA instead. PRO users never see this component.
//
// The `compact` prop renders a smaller single-line version suitable for
// embedding directly inside feature pages (e.g., above the export button).

const props = withDefaults(defineProps<{
  /** Name of the PRO feature being gated — shown in the copy. */
  featureName?: string
  /** Render a condensed single-line variant instead of the full alert. */
  compact?: boolean
}>(), {
  featureName: 'esta función',
  compact: false,
})

const emit = defineEmits<{
  /** Emitted when the "Ver planes" / upgrade CTA is clicked. */
  upgrade: []
  /** Emitted when the user dismisses the banner. */
  close: []
}>()

const authStore = useAuthStore()

// Only the parent decides whether to show the component; we expose computed
// flags so the template stays declarative.
const showUpgradeBanner = computed(
  () => authStore.isAuthenticated && !authStore.isPro,
)
const showLoginCta = computed(() => !authStore.isAuthenticated)
</script>

<template>
  <!-- PRO upgrade banner — authenticated non-PRO users -->
  <div
    v-if="showUpgradeBanner"
    :class="[
      'pro-banner alert mb-0 d-flex align-items-center gap-3',
      compact ? 'pro-banner--compact alert-warning border border-warning-subtle py-2 px-3' : 'alert-warning border border-warning rounded-3 py-3 px-4',
    ]"
    role="note"
    aria-label="Función PRO requerida"
  >
    <!-- PRO badge -->
    <span
      class="badge bg-warning text-dark fw-bold flex-shrink-0"
      :class="compact ? 'fs-6' : 'fs-5 py-2 px-3'"
      aria-hidden="true"
    >
      PRO
    </span>

    <!-- Message copy -->
    <div class="flex-grow-1">
      <template v-if="compact">
        <span class="small fw-semibold">
          Desbloquea {{ featureName }} con Mopetoo PRO.
        </span>
      </template>
      <template v-else>
        <p class="fw-semibold mb-0">
          Desbloquea {{ featureName }} con Mopetoo PRO
        </p>
        <p class="text-muted small mb-0 mt-1">
          Accede a funciones avanzadas, exportación de reportes, historial
          ilimitado y mucho más.
        </p>
      </template>
    </div>

    <!-- CTA -->
    <button
      type="button"
      class="btn btn-warning btn-sm fw-bold flex-shrink-0"
      :class="compact ? '' : 'px-3'"
      aria-label="Ver planes PRO de Mopetoo"
      @click="emit('upgrade')"
    >
      Ver planes
    </button>

    <!-- Dismiss button — full banner only -->
    <button
      v-if="!compact"
      type="button"
      class="btn-close flex-shrink-0"
      aria-label="Cerrar aviso"
      @click="emit('close')"
    />
  </div>

  <!-- Login CTA — unauthenticated users -->
  <div
    v-else-if="showLoginCta"
    :class="[
      'pro-banner alert mb-0 d-flex align-items-center gap-3',
      compact ? 'pro-banner--compact alert-info border border-info-subtle py-2 px-3' : 'alert-info border border-info rounded-3 py-3 px-4',
    ]"
    role="note"
    aria-label="Inicia sesión para acceder"
  >
    <span class="flex-shrink-0 fs-4" aria-hidden="true">🔑</span>

    <div class="flex-grow-1">
      <template v-if="compact">
        <span class="small fw-semibold">
          Inicia sesión para acceder a {{ featureName }}.
        </span>
      </template>
      <template v-else>
        <p class="fw-semibold mb-0">Inicia sesión para acceder</p>
        <p class="text-muted small mb-0 mt-1">
          Necesitas una cuenta Mopetoo para usar {{ featureName }}.
        </p>
      </template>
    </div>

    <NuxtLink
      to="/login"
      class="btn btn-info btn-sm fw-bold flex-shrink-0 text-white"
      aria-label="Ir a iniciar sesión"
    >
      Iniciar sesión
    </NuxtLink>
  </div>
</template>

<style scoped lang="scss">
.pro-banner {
  border-radius: var(--bs-border-radius-lg);

  // Compact variant — tighter vertical rhythm for inline embeddings
  &--compact {
    border-radius: var(--bs-border-radius);
  }
}
</style>

<script setup lang="ts">
// MedicalHistory — main list view for a pet's medical records.
// Fetches records on mount, owns the export-PDF action, displays
// a skeleton during loading and an empty state with CTA when empty.
// Delegates delete to useMedical composable; edit navigates via NuxtLink
// inside MedicalRecordCard.

const props = defineProps<{
  petId: string
  /** Pet name used in the heading and the PDF filename. Optional — shown if provided. */
  petName?: string
}>()

const {
  fetchMedicalHistory,
  deleteMedicalRecord,
  exportPDF,
  error,
  medicalStore,
} = useMedical()

// Separate loading flag for PDF export so the main list skeleton is not affected
const isExporting = ref(false)
const successMessage = ref<string | null>(null)

const SKELETON_COUNT = 3

onMounted(async () => {
  await fetchMedicalHistory(props.petId)
})

async function handleDelete(recordId: string): Promise<void> {
  const ok = await deleteMedicalRecord(props.petId, recordId)
  if (ok) {
    successMessage.value = 'Registro eliminado correctamente.'
    setTimeout(() => { successMessage.value = null }, 4000)
  }
}

async function handleExportPDF(): Promise<void> {
  // exportPDF is guarded internally by import.meta.client but we also
  // prevent a second click while the first is in-flight.
  if (isExporting.value) return
  isExporting.value = true
  // Drive error display from the composable's error ref
  await exportPDF(props.petId, props.petName)
  isExporting.value = false
}
</script>

<template>
  <section aria-label="Historial médico">
    <!-- Page header -->
    <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 mb-4">
      <div>
        <h1 class="h3 fw-bold mb-1">
          Historial médico
          <template v-if="petName">
            — <span class="text-primary">{{ petName }}</span>
          </template>
        </h1>
        <p class="text-muted mb-0 small">Registra visitas al veterinario, diagnósticos y tratamientos</p>
      </div>

      <div class="d-flex gap-2 flex-wrap">
        <!-- Export PDF — client-only; button is hidden on SSR via v-if -->
        <button
          v-if="medicalStore.hasRecords"
          type="button"
          class="btn btn-outline-secondary"
          :disabled="isExporting || medicalStore.isLoading"
          :aria-busy="isExporting"
          @click="handleExportPDF"
        >
          <span
            v-if="isExporting"
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          />
          <span v-else aria-hidden="true">📄 </span>
          Exportar PDF
        </button>

        <!-- Add record CTA -->
        <NuxtLink
          :to="`/dashboard/medical/${petId}/record/new`"
          class="btn btn-primary"
        >
          <span aria-hidden="true">+</span> Agregar registro
        </NuxtLink>
      </div>
    </div>

    <!-- Back to pet link -->
    <div class="mb-4">
      <NuxtLink
        :to="`/dashboard/pets/${petId}`"
        class="btn btn-sm btn-link p-0 text-muted text-decoration-none"
      >
        &larr; Volver a la mascota
      </NuxtLink>
    </div>

    <!-- Success alert -->
    <div
      v-if="successMessage"
      class="alert alert-success alert-dismissible d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span aria-hidden="true">✓</span>
      {{ successMessage }}
      <button
        type="button"
        class="btn-close ms-auto"
        aria-label="Cerrar"
        @click="successMessage = null"
      />
    </div>

    <!-- Error alert -->
    <div
      v-if="error"
      class="alert alert-danger d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span aria-hidden="true">⚠</span>
      {{ error }}
    </div>

    <!-- Loading skeleton grid -->
    <div
      v-if="medicalStore.isLoading"
      class="row g-4"
      aria-busy="true"
      aria-label="Cargando historial médico"
    >
      <div
        v-for="n in SKELETON_COUNT"
        :key="n"
        class="col-12 col-md-6 col-xl-4"
      >
        <div class="card border-0 shadow-sm h-100 medical-skeleton" aria-hidden="true">
          <div class="card-header border-0 bg-transparent pt-3 pb-0 d-flex align-items-start gap-2">
            <div class="d-flex flex-column gap-1 flex-grow-1">
              <div class="skeleton-pulse rounded medical-skeleton__date" />
              <div class="skeleton-pulse rounded medical-skeleton__badge" />
            </div>
            <div class="skeleton-pulse rounded medical-skeleton__weight" />
          </div>
          <div class="card-body pt-2">
            <div class="skeleton-pulse rounded mb-1 medical-skeleton__label" />
            <div class="skeleton-pulse rounded mb-3 medical-skeleton__line" />
            <div class="skeleton-pulse rounded mb-1 medical-skeleton__label" />
            <div class="skeleton-pulse rounded medical-skeleton__line" />
          </div>
          <div class="card-footer bg-transparent border-top d-flex gap-2 pt-2 pb-3">
            <div class="skeleton-pulse rounded flex-fill medical-skeleton__btn" />
            <div class="skeleton-pulse rounded medical-skeleton__btn--icon" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state — no records for this pet -->
    <div
      v-else-if="medicalStore.records.length === 0"
      class="medical-empty text-center py-5"
    >
      <div class="medical-empty__illustration" aria-hidden="true">🩺</div>
      <h2 class="h5 fw-bold mt-4 mb-2">Sin registros médicos</h2>
      <p class="text-muted mb-4">
        Lleva un registro de las visitas al veterinario, diagnósticos y tratamientos de tu mascota.
      </p>
      <NuxtLink
        :to="`/dashboard/medical/${petId}/record/new`"
        class="btn btn-primary px-4"
      >
        Agregar primer registro
      </NuxtLink>
    </div>

    <!-- Records grid — sorted newest-first (store inserts with unshift) -->
    <div v-else class="row g-4">
      <div
        v-for="record in medicalStore.records"
        :key="record.id"
        class="col-12 col-md-6 col-xl-4"
      >
        <MedicalRecordCard
          :record="record"
          :pet-id="petId"
          @delete-record="handleDelete"
        />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
// ── Empty state ───────────────────────────────────────────────
.medical-empty {
  &__illustration {
    font-size: 4rem;
    line-height: 1;
    display: block;
    animation: medical-bounce 2s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }
}

@keyframes medical-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

// ── Skeleton shimmer ──────────────────────────────────────────
.skeleton-pulse {
  background: linear-gradient(
    90deg,
    var(--bs-secondary-bg) 25%,
    var(--bs-tertiary-bg, #e8e8e8) 50%,
    var(--bs-secondary-bg) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: var(--bs-secondary-bg);
  }
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.medical-skeleton {
  border-radius: var(--bs-border-radius-lg);

  &__date {
    height: 0.85rem;
    width: 55%;
  }

  &__badge {
    height: 1.25rem;
    width: 70%;
  }

  &__weight {
    height: 1.25rem;
    width: 3.5rem;
    flex-shrink: 0;
  }

  &__label {
    height: 0.6rem;
    width: 40%;
  }

  &__line {
    height: 0.75rem;
    width: 100%;
  }

  &__btn {
    height: 2rem;
  }

  &__btn--icon {
    height: 2rem;
    width: 2.5rem;
  }
}
</style>

<script setup lang="ts">
// PetDetail — full pet profile view.
// Receives the pet as a prop (fetched by the parent page).
// Emits edit and delete so the parent page can handle navigation/confirmation.

import type { Pet } from '../types'

const props = defineProps<{
  pet: Pet
  isLoading?: boolean
}>()

const emit = defineEmits<{
  edit: []
  delete: []
  'export-pdf': []
}>()

const { formatAge } = usePetAge()

// ── Display maps ─────────────────────────────────────────────
const SPECIES_LABEL: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  bird: 'Pájaro',
  rabbit: 'Conejo',
  other: 'Otro',
}

const GENDER_LABEL: Record<string, string> = {
  male: 'Macho',
  female: 'Hembra',
}

const speciesLabel = computed(() => SPECIES_LABEL[props.pet.species] ?? props.pet.species)
const genderLabel = computed(() => GENDER_LABEL[props.pet.gender] ?? props.pet.gender)
const age = computed(() => formatAge(props.pet.age))

// ── Delete confirmation state ─────────────────────────────────
const confirmingDelete = ref(false)

function requestDelete(): void {
  confirmingDelete.value = true
}

function cancelDelete(): void {
  confirmingDelete.value = false
}

function confirmDelete(): void {
  confirmingDelete.value = false
  emit('delete')
}

// ── Detail rows helper type ────────────────────────────────────
interface DetailRow {
  label: string
  value: string
  icon: string
}

const detailRows = computed<DetailRow[]>(() => {
  const rows: DetailRow[] = [
    { label: 'Especie', value: speciesLabel.value, icon: '🐾' },
    { label: 'Raza', value: props.pet.breed, icon: '📋' },
    { label: 'Edad', value: age.value, icon: '🎂' },
    { label: 'Sexo', value: genderLabel.value, icon: props.pet.gender === 'male' ? '♂' : '♀' },
  ]
  if (props.pet.weight) {
    rows.push({ label: 'Peso', value: `${props.pet.weight} kg`, icon: '⚖️' })
  }
  return rows
})

// Format ISO date for display
function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <article class="pet-detail">
    <!-- ── Header — avatar + name + actions ──────────────── -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body p-4">
        <div class="d-flex flex-column flex-sm-row align-items-center align-items-sm-start gap-4">
          <PetAvatar :pet="pet" size="lg" />

          <div class="flex-grow-1 text-center text-sm-start">
            <h1 class="h3 fw-bold mb-1">{{ pet.name }}</h1>
            <span class="badge bg-primary-subtle text-primary-emphasis fs-6 mb-3">
              {{ speciesLabel }}
            </span>

            <div class="d-flex flex-wrap justify-content-center justify-content-sm-start gap-2">
              <button
                type="button"
                class="btn btn-primary"
                :disabled="isLoading"
                @click="emit('edit')"
              >
                Editar mascota
              </button>

              <!-- Link to the pet's medical history -->
              <NuxtLink
                :to="`/dashboard/medical/${pet.id}`"
                class="btn btn-outline-primary"
              >
                Ver historial médico
              </NuxtLink>

              <!-- Export pet profile as PDF -->
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="isLoading"
                @click="emit('export-pdf')"
              >
                <span aria-hidden="true">📄 </span>
                Exportar perfil
              </button>

              <!-- Delete — two-step confirmation inline -->
              <div v-if="!confirmingDelete">
                <button
                  type="button"
                  class="btn btn-outline-danger"
                  :disabled="isLoading"
                  @click="requestDelete"
                >
                  Eliminar
                </button>
              </div>
              <div v-else class="d-flex align-items-center gap-2 flex-wrap">
                <span class="small text-danger fw-semibold">¿Confirmar eliminación?</span>
                <button
                  type="button"
                  class="btn btn-sm btn-danger"
                  :disabled="isLoading"
                  @click="confirmDelete"
                >
                  <span
                    v-if="isLoading"
                    class="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                  />
                  Sí, eliminar
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary"
                  @click="cancelDelete"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Details card ────────────────────────────────────── -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-header bg-transparent border-bottom px-4 pt-3 pb-2">
        <h2 class="h6 fw-bold mb-0 text-muted text-uppercase letter-spacing-wide">
          Información general
        </h2>
      </div>
      <div class="card-body p-0">
        <dl class="mb-0">
          <div
            v-for="(row, index) in detailRows"
            :key="row.label"
            class="pet-detail__row d-flex px-4 py-3"
            :class="{ 'border-top': index > 0 }"
          >
            <dt class="pet-detail__label d-flex align-items-center gap-2 text-muted small">
              <span aria-hidden="true">{{ row.icon }}</span>
              {{ row.label }}
            </dt>
            <dd class="pet-detail__value fw-semibold mb-0">{{ row.value }}</dd>
          </div>

        </dl>
      </div>
    </div>

    <!-- ── Notes card (only if present) ──────────────────── -->
    <div v-if="pet.notes" class="card border-0 shadow-sm mb-4">
      <div class="card-header bg-transparent border-bottom px-4 pt-3 pb-2">
        <h2 class="h6 fw-bold mb-0 text-muted text-uppercase">Notas</h2>
      </div>
      <div class="card-body px-4 py-3">
        <p class="mb-0 text-body" style="white-space: pre-line;">{{ pet.notes }}</p>
      </div>
    </div>

    <!-- ── Metadata ────────────────────────────────────────── -->
    <p class="text-muted small text-end mb-0">
      Registrado el {{ formatDate(pet.created_at) }}
      <template v-if="pet.updated_at !== pet.created_at">
        · Actualizado el {{ formatDate(pet.updated_at) }}
      </template>
    </p>
  </article>
</template>

<style scoped lang="scss">
.pet-detail {
  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem;
  }

  &__label {
    min-width: 180px;
    flex-shrink: 0;
  }

  &__value {
    flex: 1;
    // Don't let very long values (e.g. microchip) overflow
    word-break: break-all;
  }
}

.letter-spacing-wide {
  letter-spacing: 0.05em;
}
</style>

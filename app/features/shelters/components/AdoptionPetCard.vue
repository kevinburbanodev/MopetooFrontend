<script setup lang="ts">
// AdoptionPetCard — compact card for a single pet available for adoption.
// Shows: photo (with species emoji fallback), name, species, breed, age,
// gender, size, status badge, vaccinated/neutered chips.
// "Ver detalles" navigates to /shelter/adoptions/:id
// (only for non-adopted pets).

import type { AdoptionPet } from '../types'

const props = defineProps<{
  pet: AdoptionPet
}>()

// ── Species / display maps ────────────────────────────────
const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕',
  cat: '🐱',
  bird: '🦜',
  rabbit: '🐰',
  other: '🐾',
}

const SPECIES_LABEL: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  bird: 'Ave',
  rabbit: 'Conejo',
  other: 'Otro',
}

const GENDER_LABEL: Record<string, string> = {
  male: 'Macho',
  female: 'Hembra',
  unknown: 'Desconocido',
}

const SIZE_LABEL: Record<string, string> = {
  small: 'Pequeño',
  medium: 'Mediano',
  large: 'Grande',
}

const STATUS_CONFIG: Record<
  AdoptionPet['status'],
  { label: string; badgeClass: string }
> = {
  available: { label: 'Disponible', badgeClass: 'bg-success' },
  pending: { label: 'En proceso', badgeClass: 'bg-warning text-dark' },
  adopted: { label: 'Adoptado', badgeClass: 'bg-secondary' },
}

const speciesEmoji = computed(() => SPECIES_EMOJI[props.pet.species] ?? '🐾')
const speciesLabel = computed(() => SPECIES_LABEL[props.pet.species] ?? props.pet.species)
const genderLabel = computed(() => GENDER_LABEL[props.pet.gender] ?? props.pet.gender)
const sizeLabel = computed(() => SIZE_LABEL[props.pet.size] ?? props.pet.size)
const statusConfig = computed(() => STATUS_CONFIG[props.pet.status] ?? STATUS_CONFIG.available)

// ── Age calculation from age_months ─────────────────────
const ageLabel = computed(() => {
  const m = props.pet.age_months
  if (m === undefined || m === null) return 'Desconocida'
  if (m === 0) return 'Recién nacido'
  const years = Math.floor(m / 12)
  const months = m % 12
  if (years === 0) return months === 1 ? '1 mes' : `${months} meses`
  if (months === 0) return years === 1 ? '1 año' : `${years} años`
  const yearLabel = years === 1 ? '1 año' : `${years} años`
  const monthLabel = months === 1 ? '1 mes' : `${months} meses`
  return `${yearLabel} y ${monthLabel}`
})

// ── URL safety guard ─────────────────────────────────────
function isSafeImageUrl(url: string | undefined): boolean {
  if (!url) return false
  if (url.startsWith('blob:')) return true
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  }
  catch {
    return false
  }
}

const safePhotoUrl = computed(() =>
  isSafeImageUrl(props.pet.photo_url) ? props.pet.photo_url : null,
)

const imgError = ref(false)
const showPhoto = computed(() => !!safePhotoUrl.value && !imgError.value)

function onImgError(): void {
  imgError.value = true
}

watch(() => props.pet.photo_url, () => {
  imgError.value = false
})
</script>

<template>
  <article
    class="card h-100 border-0 shadow-sm adoption-pet-card"
    :aria-label="`Mascota ${pet.name} en adopción`"
  >
    <!-- Photo / fallback -->
    <div class="adoption-pet-card__photo-wrap">
      <img
        v-if="showPhoto"
        :src="safePhotoUrl!"
        :alt="`Foto de ${pet.name}`"
        class="adoption-pet-card__photo"
        width="400"
        height="220"
        @error="onImgError"
      />
      <div
        v-else
        class="adoption-pet-card__fallback d-flex align-items-center justify-content-center"
        aria-hidden="true"
      >
        <span class="adoption-pet-card__fallback-icon">{{ speciesEmoji }}</span>
      </div>

      <!-- Status badge overlaid on photo -->
      <span
        :class="['badge', statusConfig.badgeClass, 'adoption-pet-card__status']"
        :aria-label="`Estado: ${statusConfig.label}`"
      >
        {{ statusConfig.label }}
      </span>
    </div>

    <div class="card-body d-flex flex-column gap-2 p-3">
      <!-- Name + species -->
      <div>
        <h3 class="h6 fw-bold mb-0">{{ pet.name }}</h3>
        <p class="text-muted small mb-0">
          <span aria-hidden="true">{{ speciesEmoji }}</span>
          {{ speciesLabel }}
          <template v-if="pet.breed"> · {{ pet.breed }}</template>
        </p>
      </div>

      <!-- Info badges row -->
      <div class="d-flex flex-wrap gap-1" aria-label="Características">
        <!-- Gender -->
        <span class="badge bg-info-subtle text-info-emphasis fw-normal">
          {{ genderLabel }}
        </span>
        <!-- Size -->
        <span class="badge bg-secondary-subtle text-secondary-emphasis fw-normal">
          {{ sizeLabel }}
        </span>
        <!-- Age -->
        <span class="badge bg-warning-subtle text-warning-emphasis fw-normal">
          {{ ageLabel }}
        </span>
      </div>

      <!-- Health chips -->
      <div class="d-flex gap-2 flex-wrap">
        <span
          :class="[
            'badge fw-normal small',
            pet.vaccinated ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis',
          ]"
          :aria-label="pet.vaccinated ? 'Vacunado' : 'No vacunado'"
        >
          {{ pet.vaccinated ? 'Vacunado' : 'Sin vacuna' }}
        </span>
        <span
          :class="[
            'badge fw-normal small',
            pet.neutered ? 'bg-success-subtle text-success-emphasis' : 'bg-secondary-subtle text-secondary-emphasis',
          ]"
          :aria-label="pet.neutered ? 'Esterilizado' : 'No esterilizado'"
        >
          {{ pet.neutered ? 'Esterilizado' : 'Sin esterilizar' }}
        </span>
      </div>
    </div>

    <!-- CTA footer — hidden for adopted pets -->
    <div class="card-footer bg-transparent border-top-0 px-3 pb-3 pt-0">
      <NuxtLink
        v-if="pet.status !== 'adopted'"
        :to="{ path: `/shelter/adoptions/${pet.id}`, query: { shelterId: pet.shelter_id } }"
        class="btn btn-primary btn-sm w-100"
        :aria-label="`Ver detalles de ${pet.name}`"
      >
        Ver detalles
      </NuxtLink>
      <span
        v-else
        class="d-block text-center text-muted small py-1"
        aria-label="Esta mascota ya fue adoptada"
      >
        Ya fue adoptada
      </span>
    </div>
  </article>
</template>

<style scoped lang="scss">
.adoption-pet-card {
  border-radius: var(--bs-border-radius-lg);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.12) !important;
  }

  // ── Photo area ─────────────────────────────────────────────
  &__photo-wrap {
    position: relative;
    overflow: hidden;
    border-radius: var(--bs-border-radius-lg) var(--bs-border-radius-lg) 0 0;
    height: 180px;
    background-color: var(--bs-secondary-bg);
  }

  &__photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__fallback {
    width: 100%;
    height: 100%;
    background-color: #dff0e8;
  }

  &__fallback-icon {
    font-size: 3.5rem;
    line-height: 1;
  }

  // ── Status badge ───────────────────────────────────────────
  &__status {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    font-size: 0.7rem;
    letter-spacing: 0.03em;
  }
}
</style>

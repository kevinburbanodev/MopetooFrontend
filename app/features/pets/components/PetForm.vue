<script setup lang="ts">
// PetForm — handles both create and edit modes.
// In edit mode the `pet` prop is passed and all fields are pre-filled.
// Photo upload follows the same object-URL lifecycle pattern as UserProfilePicture.
// Bootstrap validation uses the `was-validated` class on the form element.
//
// Backend contract:
//   - Create: multipart/form-data with photo REQUIRED (binding:"required")
//   - Update: multipart/form-data with photo OPTIONAL
//   - Fields: name, species, breed, age (int, years), weight, gender, notes
//
// Emits `submit` with { data: CreatePetDTO, photo?: File } and `cancel`.

import type { Pet, CreatePetDTO, PetFormSubmitPayload } from '../types'

const props = defineProps<{
  /** When provided, the form is in edit mode and fields are pre-filled. */
  pet?: Pet
  /** Shows the submit button spinner. Controlled by the parent page. */
  isLoading?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: PetFormSubmitPayload]
  cancel: []
}>()

// ── Edit mode detection ──────────────────────────────────────
const isEditMode = computed(() => !!props.pet)
const submitLabel = computed(() => isEditMode.value ? 'Guardar cambios' : 'Agregar mascota')

// ── Form fields — initialised from the pet prop in edit mode ──
const name = ref(props.pet?.name ?? '')
const species = ref(props.pet?.species ?? '')
const breed = ref(props.pet?.breed ?? '')
const age = ref<number | ''>(props.pet?.age ?? '')
const gender = ref(props.pet?.gender ?? '')
const weight = ref<number | ''>(props.pet?.weight ?? '')
const notes = ref(props.pet?.notes ?? '')

// ── Photo upload (same pattern as UserProfilePicture.vue) ─────
const photoFile = ref<File | null>(null)
const localPreviewUrl = ref<string | null>(null)
const photoInputRef = useTemplateRef<HTMLInputElement>('photoInput')

// ── URL safety guard ─────────────────────────────────────────
// Validates that a URL uses a safe scheme before it is bound to :src.
// Rejects javascript:, data:, vbscript: and any other unexpected scheme
// that could arrive via a compromised API response.
function isSafeImageUrl(url: string | null | undefined): boolean {
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

// localPreviewUrl is always a blob: URL created by URL.createObjectURL — safe.
// photo_url comes from the API and must pass the safety guard.
const displayPhotoSrc = computed((): string | null => {
  if (localPreviewUrl.value) return localPreviewUrl.value
  const apiUrl = props.pet?.photo_url ?? null
  return isSafeImageUrl(apiUrl) ? apiUrl : null
})

function triggerPhotoInput(): void {
  photoInputRef.value?.click()
}

// ── Photo validation constants ──────────────────────────────
const ALLOWED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_PHOTO_BYTES = 5 * 1024 * 1024 // 5 MB

const photoError = ref<string | null>(null)

function onPhotoChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Reset previous photo error
  photoError.value = null

  // Validate MIME type against the allowed set (defence beyond the accept attr)
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    photoError.value = 'Solo se permiten imágenes JPG, PNG o WebP.'
    // Reset the input so the same invalid file cannot be re-submitted
    input.value = ''
    return
  }

  // Validate file size before creating the preview
  if (file.size > MAX_PHOTO_BYTES) {
    photoError.value = 'La foto no puede superar los 5 MB.'
    input.value = ''
    return
  }

  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value)
  }
  localPreviewUrl.value = URL.createObjectURL(file)
  photoFile.value = file
}

onUnmounted(() => {
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value)
  }
})

// ── Bootstrap form validation ────────────────────────────────
const submitted = ref(false)

const nameInvalid = computed(() => submitted.value && !name.value.trim())
const speciesInvalid = computed(() => submitted.value && !species.value)
const breedInvalid = computed(() => submitted.value && !breed.value.trim())
const genderInvalid = computed(() => submitted.value && !gender.value)
const weightInvalid = computed(
  () => submitted.value && weight.value !== '' && Number(weight.value) <= 0,
)
// Photo is required in create mode (backend binding:"required")
const photoInvalid = computed(
  () => submitted.value && !isEditMode.value && !photoFile.value && !displayPhotoSrc.value,
)

const isFormValid = computed(
  () =>
    name.value.trim() &&
    species.value &&
    breed.value.trim() &&
    gender.value &&
    (weight.value === '' || Number(weight.value) > 0) &&
    // Photo required in create mode only
    (isEditMode.value || photoFile.value),
)

// ── Submit ───────────────────────────────────────────────────
function handleSubmit(): void {
  submitted.value = true
  if (!isFormValid.value) return

  const data: CreatePetDTO = {
    name: name.value.trim(),
    species: species.value,
    breed: breed.value.trim(),
    gender: gender.value,
  }
  if (age.value !== '') data.age = Number(age.value)
  if (weight.value !== '') data.weight = Number(weight.value)
  if (notes.value.trim()) data.notes = notes.value.trim()

  emit('submit', {
    data,
    photo: photoFile.value ?? undefined,
  })
}

// Re-populate if the pet prop changes (e.g., async load on edit page)
watch(
  () => props.pet,
  (pet) => {
    if (!pet) return
    name.value = pet.name
    species.value = pet.species
    breed.value = pet.breed
    age.value = pet.age ?? ''
    gender.value = pet.gender
    weight.value = pet.weight ?? ''
    notes.value = pet.notes ?? ''
  },
)
</script>

<template>
  <form
    novalidate
    class="pet-form"
    :class="{ 'was-validated': submitted }"
    @submit.prevent="handleSubmit"
  >
    <!-- ── Photo upload ───────────────────────────────────── -->
    <div class="mb-4 text-center">
      <div class="pet-form__photo-wrapper d-inline-block position-relative">
        <button
          type="button"
          class="pet-form__photo-btn"
          aria-label="Seleccionar foto de la mascota"
          @click="triggerPhotoInput"
        >
          <img
            v-if="displayPhotoSrc"
            :src="displayPhotoSrc"
            alt="Vista previa de foto"
            class="pet-form__photo-preview"
          />
          <span v-else class="pet-form__photo-placeholder" aria-hidden="true">
            🐾
          </span>
          <div class="pet-form__photo-overlay" aria-hidden="true">
            <span class="pet-form__photo-overlay-text">
              {{ displayPhotoSrc ? 'Cambiar foto' : 'Agregar foto' }}
            </span>
          </div>
        </button>
      </div>
      <input
        ref="photoInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="visually-hidden"
        aria-label="Seleccionar foto de la mascota"
        tabindex="-1"
        @change="onPhotoChange"
      />
      <p class="small text-muted mt-1 mb-0">
        JPG, PNG o WebP. Máx. 5 MB.
        <template v-if="!isEditMode"> (obligatoria)</template>
      </p>
      <p v-if="photoError" class="small text-danger mt-1 mb-0" role="alert">{{ photoError }}</p>
      <p v-if="photoInvalid" class="small text-danger mt-1 mb-0" role="alert">La foto es obligatoria.</p>
    </div>

    <!-- ── Required fields ───────────────────────────────── -->
    <div class="row g-3">
      <!-- Name -->
      <div class="col-12 col-sm-6">
        <label for="pet-name" class="form-label fw-semibold">
          Nombre <span class="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          id="pet-name"
          v-model="name"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': nameInvalid }"
          placeholder="Ej. Max, Luna, Rocky…"
          autocomplete="off"
          required
        />
        <div class="invalid-feedback">El nombre es obligatorio.</div>
      </div>

      <!-- Species -->
      <div class="col-12 col-sm-6">
        <label for="pet-species" class="form-label fw-semibold">
          Especie <span class="text-danger" aria-hidden="true">*</span>
        </label>
        <select
          id="pet-species"
          v-model="species"
          class="form-select"
          :class="{ 'is-invalid': speciesInvalid }"
          required
        >
          <option value="" disabled>Selecciona una especie</option>
          <option value="dog">Perro</option>
          <option value="cat">Gato</option>
          <option value="bird">Pájaro</option>
          <option value="rabbit">Conejo</option>
          <option value="other">Otro</option>
        </select>
        <div class="invalid-feedback">Selecciona una especie.</div>
      </div>

      <!-- Breed -->
      <div class="col-12 col-sm-6">
        <label for="pet-breed" class="form-label fw-semibold">
          Raza <span class="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          id="pet-breed"
          v-model="breed"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': breedInvalid }"
          placeholder="Ej. Labrador, Siamés, Mestizo…"
          autocomplete="off"
          required
        />
        <div class="invalid-feedback">La raza es obligatoria.</div>
      </div>

      <!-- Age -->
      <div class="col-12 col-sm-6">
        <label for="pet-age" class="form-label fw-semibold">
          Edad (años)
        </label>
        <input
          id="pet-age"
          v-model.number="age"
          type="number"
          class="form-control"
          placeholder="Ej. 3"
          min="0"
          step="1"
        />
      </div>

      <!-- Gender -->
      <div class="col-12">
        <fieldset>
          <legend class="form-label fw-semibold mb-1">
            Sexo <span class="text-danger" aria-hidden="true">*</span>
          </legend>
          <div class="d-flex gap-4">
            <div class="form-check">
              <input
                id="gender-male"
                v-model="gender"
                class="form-check-input"
                :class="{ 'is-invalid': genderInvalid }"
                type="radio"
                name="gender"
                value="male"
                required
              />
              <label class="form-check-label" for="gender-male">Macho</label>
            </div>
            <div class="form-check">
              <input
                id="gender-female"
                v-model="gender"
                class="form-check-input"
                :class="{ 'is-invalid': genderInvalid }"
                type="radio"
                name="gender"
                value="female"
                required
              />
              <label class="form-check-label" for="gender-female">Hembra</label>
              <div v-if="genderInvalid" class="invalid-feedback d-block">
                Selecciona el sexo.
              </div>
            </div>
          </div>
        </fieldset>
      </div>
    </div>

    <!-- ── Optional fields ────────────────────────────────── -->
    <hr class="my-4" />
    <p class="text-muted small mb-3">Información adicional (opcional)</p>

    <div class="row g-3">
      <!-- Weight -->
      <div class="col-12 col-sm-6">
        <label for="pet-weight" class="form-label">Peso (kg)</label>
        <input
          id="pet-weight"
          v-model.number="weight"
          type="number"
          class="form-control"
          :class="{ 'is-invalid': weightInvalid }"
          placeholder="Ej. 8.5"
          min="0.1"
          step="0.1"
        />
        <div class="invalid-feedback">El peso debe ser mayor a 0.</div>
      </div>

      <!-- Notes -->
      <div class="col-12">
        <label for="pet-notes" class="form-label">Notas</label>
        <textarea
          id="pet-notes"
          v-model="notes"
          class="form-control"
          rows="3"
          placeholder="Alergias, condiciones especiales, medicamentos actuales…"
        />
      </div>
    </div>

    <!-- ── Form actions ───────────────────────────────────── -->
    <div class="d-flex flex-column flex-sm-row justify-content-end gap-2 mt-4">
      <button
        type="button"
        class="btn btn-outline-secondary"
        :disabled="isLoading"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="btn btn-primary px-4"
        :disabled="isLoading"
      >
        <span
          v-if="isLoading"
          class="spinner-border spinner-border-sm me-2"
          role="status"
          aria-hidden="true"
        />
        {{ isLoading ? 'Guardando…' : submitLabel }}
      </button>
    </div>
  </form>
</template>

<style scoped lang="scss">
.pet-form {
  // ── Photo upload control ─────────────────────────────────
  &__photo-btn {
    position: relative;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    border: 3px solid var(--bs-border-color);
    background: var(--bs-secondary-bg);
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s ease;

    &:hover,
    &:focus-visible {
      border-color: var(--bs-primary);
      outline: 2px solid var(--bs-primary);
      outline-offset: 2px;

      .pet-form__photo-overlay {
        opacity: 1;
      }
    }
  }

  &__photo-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__photo-placeholder {
    font-size: 2.5rem;
    line-height: 1;
    user-select: none;
  }

  &__photo-overlay {
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
    border-radius: 50%;
  }

  &__photo-overlay-text {
    color: #fff;
    font-size: 0.7rem;
    font-weight: 600;
    text-align: center;
    padding: 0 0.5rem;
  }
}
</style>

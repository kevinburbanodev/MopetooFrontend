<script setup lang="ts">
import type { EntityType, RegisterPayload } from '../types'

const { register, pending, error } = useAuth()

const entityType = ref<EntityType>('user')

// ── User registration form state ───────────────────────────
const form = reactive<RegisterPayload>({
  name: '',
  last_name: '',
  email: '',
  password: '',
  country_id: 0,
  city_id: 0,
  phone: '',
})

const confirmPassword = ref('')
const photoFile = ref<File | null>(null)
const photoPreviewUrl = ref<string | null>(null)
const submitted = ref(false)
const phoneCode = ref('+57')

// ── Location dropdowns ───────────────────────────────────
const {
  countries, cities, loadingCountries, loadingCities,
  fetchCountries, fetchCitiesByCountry, clearCities,
} = useLocations()

const countryOptions = computed(() =>
  countries.value.map(c => ({ value: c.id, label: c.name })),
)
const cityOptions = computed(() =>
  cities.value.map(c => ({ value: c.id, label: c.name })),
)

onMounted(() => fetchCountries())

watch(() => form.country_id, (newCountryId) => {
  form.city_id = 0
  clearCities()
  if (!newCountryId) return
  const country = countries.value.find(c => c.id === newCountryId)
  if (country) {
    phoneCode.value = country.phone_code
    fetchCitiesByCountry(country.id)
  }
})

// ── Validation (user form only) ────────────────────────────
const nameInvalid = computed(() => submitted.value && !form.name.trim())
const lastNameInvalid = computed(() => submitted.value && !form.last_name.trim())
const emailInvalid = computed(() => submitted.value && !form.email.trim())
const passwordInvalid = computed(() => submitted.value && form.password.length < 6)
const confirmInvalid = computed(
  () => submitted.value && confirmPassword.value !== form.password,
)
const countryInvalid = computed(() => submitted.value && !form.country_id)
const cityInvalid = computed(() => submitted.value && !form.city_id)
const phoneInvalid = computed(() => submitted.value && !form.phone.trim())

const isFormValid = computed(
  () =>
    !nameInvalid.value
    && !lastNameInvalid.value
    && !emailInvalid.value
    && !passwordInvalid.value
    && !confirmInvalid.value
    && !countryInvalid.value
    && !cityInvalid.value
    && !phoneInvalid.value,
)

// ── Photo handling ─────────────────────────────────────────
function onPhotoChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Revoke the previous object URL to prevent memory leaks
  if (photoPreviewUrl.value) {
    URL.revokeObjectURL(photoPreviewUrl.value)
  }
  photoFile.value = file
  photoPreviewUrl.value = URL.createObjectURL(file)
}

function removePhoto(): void {
  if (photoPreviewUrl.value) {
    URL.revokeObjectURL(photoPreviewUrl.value)
  }
  photoFile.value = null
  photoPreviewUrl.value = null
}

// Clean up object URL when component is unmounted
onUnmounted(() => {
  if (photoPreviewUrl.value) {
    URL.revokeObjectURL(photoPreviewUrl.value)
  }
})

// ── Submit (user form) ─────────────────────────────────────
async function handleSubmit(): Promise<void> {
  submitted.value = true
  if (!isFormValid.value) return
  await register({ ...form }, photoFile.value ?? undefined)
}

const subtitles: Record<EntityType, string> = {
  user: 'Únete y cuida mejor a tus mascotas',
  shelter: 'Registra tu refugio y gestiona adopciones',
  store: 'Registra tu tienda pet-friendly',
  clinic: 'Registra tu clínica veterinaria',
}
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-12 col-sm-10 col-md-8 col-lg-7">
      <div class="card shadow border-0 register-card">
        <div class="card-body p-4 p-md-5">
          <!-- Header -->
          <div class="text-center mb-4">
            <div class="brand-icon mb-2" aria-hidden="true">🐾</div>
            <h1 class="h4 fw-bold text-dark">Crear cuenta</h1>
            <p class="text-muted small mb-0">{{ subtitles[entityType] }}</p>
          </div>

          <!-- Entity type selector -->
          <AuthEntityTypeSelector v-model="entityType" />

          <!-- ── User registration form ─────────────────── -->
          <template v-if="entityType === 'user'">
            <!-- API error alert -->
            <div
              v-if="error"
              class="alert alert-danger py-2 small"
              role="alert"
              aria-live="assertive"
            >
              {{ error }}
            </div>

            <form novalidate @submit.prevent="handleSubmit">
              <!-- Photo upload -->
              <div class="mb-4 text-center">
                <div class="photo-preview-wrapper mx-auto mb-2">
                  <img
                    v-if="photoPreviewUrl"
                    :src="photoPreviewUrl"
                    alt="Vista previa de tu foto de perfil"
                    class="photo-preview"
                  />
                  <div
                    v-else
                    class="photo-placeholder d-flex align-items-center justify-content-center"
                    aria-hidden="true"
                  >
                    <span class="fs-2 text-muted">👤</span>
                  </div>
                </div>
                <div class="d-flex gap-2 justify-content-center">
                  <label
                    for="register-photo"
                    class="btn btn-outline-secondary btn-sm"
                    role="button"
                  >
                    {{ photoFile ? 'Cambiar foto' : 'Agregar foto' }}
                  </label>
                  <button
                    v-if="photoFile"
                    type="button"
                    class="btn btn-outline-danger btn-sm"
                    @click="removePhoto"
                  >
                    Quitar
                  </button>
                </div>
                <input
                  id="register-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="visually-hidden"
                  aria-label="Foto de perfil (opcional)"
                  @change="onPhotoChange"
                />
                <p class="text-muted small mt-1 mb-0">Foto de perfil (opcional)</p>
              </div>

              <!-- Name row -->
              <div class="row g-3 mb-3">
                <div class="col-sm-6">
                  <label for="register-name" class="form-label fw-semibold">Nombre</label>
                  <input
                    id="register-name"
                    v-model="form.name"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': nameInvalid }"
                    placeholder="Juan"
                    autocomplete="given-name"
                    aria-describedby="register-name-error"
                  />
                  <div
                    v-if="nameInvalid"
                    id="register-name-error"
                    class="invalid-feedback"
                  >
                    Ingresa tu nombre.
                  </div>
                </div>
                <div class="col-sm-6">
                  <label for="register-last-name" class="form-label fw-semibold">Apellido</label>
                  <input
                    id="register-last-name"
                    v-model="form.last_name"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': lastNameInvalid }"
                    placeholder="Pérez"
                    autocomplete="family-name"
                    aria-describedby="register-last-name-error"
                  />
                  <div
                    v-if="lastNameInvalid"
                    id="register-last-name-error"
                    class="invalid-feedback"
                  >
                    Ingresa tu apellido.
                  </div>
                </div>
              </div>

              <!-- Email -->
              <div class="mb-3">
                <label for="register-email" class="form-label fw-semibold">Correo electrónico</label>
                <input
                  id="register-email"
                  v-model="form.email"
                  type="email"
                  class="form-control"
                  :class="{ 'is-invalid': emailInvalid }"
                  placeholder="tu@email.com"
                  autocomplete="email"
                  aria-describedby="register-email-error"
                />
                <div
                  v-if="emailInvalid"
                  id="register-email-error"
                  class="invalid-feedback"
                >
                  Ingresa un correo electrónico válido.
                </div>
              </div>

              <!-- Password row -->
              <div class="row g-3 mb-3">
                <div class="col-sm-6">
                  <label for="register-password" class="form-label fw-semibold">Contraseña</label>
                  <input
                    id="register-password"
                    v-model="form.password"
                    type="password"
                    class="form-control"
                    :class="{ 'is-invalid': passwordInvalid }"
                    placeholder="Mínimo 6 caracteres"
                    minlength="6"
                    autocomplete="new-password"
                    aria-describedby="register-password-error"
                  />
                  <div
                    v-if="passwordInvalid"
                    id="register-password-error"
                    class="invalid-feedback"
                  >
                    La contraseña debe tener al menos 6 caracteres.
                  </div>
                </div>
                <div class="col-sm-6">
                  <label for="register-confirm" class="form-label fw-semibold">Confirmar contraseña</label>
                  <input
                    id="register-confirm"
                    v-model="confirmPassword"
                    type="password"
                    class="form-control"
                    :class="{ 'is-invalid': confirmInvalid }"
                    placeholder="Repite tu contraseña"
                    autocomplete="new-password"
                    aria-describedby="register-confirm-error"
                  />
                  <div
                    v-if="confirmInvalid"
                    id="register-confirm-error"
                    class="invalid-feedback"
                  >
                    Las contraseñas no coinciden.
                  </div>
                </div>
              </div>

              <!-- Country / City row -->
              <div class="row g-3 mb-3">
                <div class="col-sm-6">
                  <label for="register-country" class="form-label fw-semibold">País</label>
                  <SearchableSelect
                    v-model="form.country_id"
                    :options="countryOptions"
                    placeholder="Seleccionar país..."
                    :loading="loadingCountries"
                    :is-invalid="countryInvalid"
                    input-id="register-country"
                  />
                  <div
                    v-if="countryInvalid"
                    class="invalid-feedback d-block"
                  >
                    Ingresa tu país.
                  </div>
                </div>
                <div class="col-sm-6">
                  <label for="register-city" class="form-label fw-semibold">Ciudad</label>
                  <SearchableSelect
                    v-model="form.city_id"
                    :options="cityOptions"
                    placeholder="Seleccionar ciudad..."
                    :loading="loadingCities"
                    :disabled="!form.country_id"
                    :is-invalid="cityInvalid"
                    input-id="register-city"
                  />
                  <div
                    v-if="cityInvalid"
                    class="invalid-feedback d-block"
                  >
                    Ingresa tu ciudad.
                  </div>
                </div>
              </div>

              <!-- Phone -->
              <div class="mb-4">
                <label class="form-label fw-semibold" for="register-phone">Teléfono</label>
                <div class="input-group" :class="{ 'has-validation': phoneInvalid }">
                  <span class="input-group-text px-2">
                    <label for="register-phone-code" class="visually-hidden">Código de país</label>
                    <input
                      id="register-phone-code"
                      v-model="phoneCode"
                      type="text"
                      class="form-control phone-code-input border-0 p-0 bg-transparent"
                      placeholder="+57"
                      autocomplete="tel-country-code"
                      aria-label="Código de país"
                      readonly
                    />
                  </span>
                  <input
                    id="register-phone"
                    v-model="form.phone"
                    type="tel"
                    class="form-control"
                    :class="{ 'is-invalid': phoneInvalid }"
                    placeholder="3001234567"
                    autocomplete="tel-national"
                    aria-describedby="register-phone-error"
                  />
                  <div
                    v-if="phoneInvalid"
                    id="register-phone-error"
                    class="invalid-feedback"
                  >
                    Ingresa tu número de teléfono.
                  </div>
                </div>
              </div>

              <button
                type="submit"
                class="btn btn-primary w-100 fw-semibold"
                :disabled="pending"
                :aria-busy="pending"
              >
                <span
                  v-if="pending"
                  class="spinner-border spinner-border-sm me-2"
                  aria-hidden="true"
                />
                {{ pending ? 'Creando cuenta...' : 'Crear cuenta' }}
              </button>
            </form>
          </template>

          <!-- ── Shelter registration form ──────────────── -->
          <AuthRegisterShelterForm v-else-if="entityType === 'shelter'" />

          <!-- ── Store registration form ────────────────── -->
          <AuthRegisterStoreForm v-else-if="entityType === 'store'" />

          <!-- ── Clinic registration form ───────────────── -->
          <AuthRegisterClinicForm v-else-if="entityType === 'clinic'" />

          <!-- Login link -->
          <p class="text-center mt-4 mb-0 small text-muted">
            ¿Ya tienes cuenta?
            <NuxtLink
              to="/login"
              class="text-primary fw-semibold text-decoration-none"
            >
              Iniciar sesión
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.register-card {
  border-radius: var(--bs-border-radius-lg);
}

.brand-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.photo-preview-wrapper {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px dashed var(--bs-border-color);
}

.photo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  background-color: var(--bs-light);
}

.phone-code-input {
  width: 52px;
  min-width: 52px;
}
</style>

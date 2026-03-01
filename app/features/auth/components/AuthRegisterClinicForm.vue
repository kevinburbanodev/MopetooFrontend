<script setup lang="ts">
import type { RegisterClinicPayload } from '../types'

const { registerClinic, pending, error } = useAuth()

const form = reactive<RegisterClinicPayload>({
  name: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  description: '',
})

const confirmPassword = ref('')
const submitted = ref(false)

// ── Validation ─────────────────────────────────────────────
const nameInvalid = computed(() => submitted.value && !form.name.trim())
const emailInvalid = computed(() => submitted.value && !form.email.trim())
const passwordInvalid = computed(() => submitted.value && form.password.length < 6)
const confirmInvalid = computed(
  () => submitted.value && confirmPassword.value !== form.password,
)
const phoneInvalid = computed(() => submitted.value && !form.phone.trim())
const addressInvalid = computed(() => submitted.value && !form.address.trim())
const cityInvalid = computed(() => submitted.value && !form.city.trim())
const countryInvalid = computed(() => submitted.value && !form.country.trim())
const descriptionInvalid = computed(() => submitted.value && !form.description.trim())

const isFormValid = computed(
  () =>
    !nameInvalid.value
    && !emailInvalid.value
    && !passwordInvalid.value
    && !confirmInvalid.value
    && !phoneInvalid.value
    && !addressInvalid.value
    && !cityInvalid.value
    && !countryInvalid.value
    && !descriptionInvalid.value,
)

// ── Submit ─────────────────────────────────────────────────
async function handleSubmit(): Promise<void> {
  submitted.value = true
  if (!isFormValid.value) return
  await registerClinic({ ...form })
}
</script>

<template>
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
    <!-- Clinic name -->
    <div class="mb-3">
      <label for="register-clinic-name" class="form-label fw-semibold">
        Nombre de la clínica
      </label>
      <input
        id="register-clinic-name"
        v-model="form.name"
        type="text"
        class="form-control"
        :class="{ 'is-invalid': nameInvalid }"
        placeholder="Clínica Veterinaria San Jorge"
        autocomplete="organization"
        aria-describedby="register-clinic-name-error"
      />
      <div
        v-if="nameInvalid"
        id="register-clinic-name-error"
        class="invalid-feedback"
      >
        Ingresa el nombre de la clínica.
      </div>
    </div>

    <!-- Email -->
    <div class="mb-3">
      <label for="register-clinic-email" class="form-label fw-semibold">
        Correo electrónico
      </label>
      <input
        id="register-clinic-email"
        v-model="form.email"
        type="email"
        class="form-control"
        :class="{ 'is-invalid': emailInvalid }"
        placeholder="clinica@email.com"
        autocomplete="email"
        aria-describedby="register-clinic-email-error"
      />
      <div
        v-if="emailInvalid"
        id="register-clinic-email-error"
        class="invalid-feedback"
      >
        Ingresa un correo electrónico válido.
      </div>
    </div>

    <!-- Password row -->
    <div class="row g-3 mb-3">
      <div class="col-sm-6">
        <label for="register-clinic-password" class="form-label fw-semibold">
          Contraseña
        </label>
        <input
          id="register-clinic-password"
          v-model="form.password"
          type="password"
          class="form-control"
          :class="{ 'is-invalid': passwordInvalid }"
          placeholder="Mínimo 6 caracteres"
          minlength="6"
          autocomplete="new-password"
          aria-describedby="register-clinic-password-error"
        />
        <div
          v-if="passwordInvalid"
          id="register-clinic-password-error"
          class="invalid-feedback"
        >
          La contraseña debe tener al menos 6 caracteres.
        </div>
      </div>
      <div class="col-sm-6">
        <label for="register-clinic-confirm" class="form-label fw-semibold">
          Confirmar contraseña
        </label>
        <input
          id="register-clinic-confirm"
          v-model="confirmPassword"
          type="password"
          class="form-control"
          :class="{ 'is-invalid': confirmInvalid }"
          placeholder="Repite tu contraseña"
          autocomplete="new-password"
          aria-describedby="register-clinic-confirm-error"
        />
        <div
          v-if="confirmInvalid"
          id="register-clinic-confirm-error"
          class="invalid-feedback"
        >
          Las contraseñas no coinciden.
        </div>
      </div>
    </div>

    <!-- Phone -->
    <div class="mb-3">
      <label for="register-clinic-phone" class="form-label fw-semibold">Teléfono</label>
      <input
        id="register-clinic-phone"
        v-model="form.phone"
        type="tel"
        class="form-control"
        :class="{ 'is-invalid': phoneInvalid }"
        placeholder="+573001234567"
        autocomplete="tel"
        aria-describedby="register-clinic-phone-error"
      />
      <div
        v-if="phoneInvalid"
        id="register-clinic-phone-error"
        class="invalid-feedback"
      >
        Ingresa el número de teléfono.
      </div>
    </div>

    <!-- Address -->
    <div class="mb-3">
      <label for="register-clinic-address" class="form-label fw-semibold">Dirección</label>
      <input
        id="register-clinic-address"
        v-model="form.address"
        type="text"
        class="form-control"
        :class="{ 'is-invalid': addressInvalid }"
        placeholder="Carrera 10 #45-20"
        autocomplete="street-address"
        aria-describedby="register-clinic-address-error"
      />
      <div
        v-if="addressInvalid"
        id="register-clinic-address-error"
        class="invalid-feedback"
      >
        Ingresa la dirección de la clínica.
      </div>
    </div>

    <!-- Country / City row -->
    <div class="row g-3 mb-3">
      <div class="col-sm-6">
        <label for="register-clinic-country" class="form-label fw-semibold">País</label>
        <input
          id="register-clinic-country"
          v-model="form.country"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': countryInvalid }"
          placeholder="Colombia"
          autocomplete="country-name"
          aria-describedby="register-clinic-country-error"
        />
        <div
          v-if="countryInvalid"
          id="register-clinic-country-error"
          class="invalid-feedback"
        >
          Ingresa el país.
        </div>
      </div>
      <div class="col-sm-6">
        <label for="register-clinic-city" class="form-label fw-semibold">Ciudad</label>
        <input
          id="register-clinic-city"
          v-model="form.city"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': cityInvalid }"
          placeholder="Bogotá"
          autocomplete="address-level2"
          aria-describedby="register-clinic-city-error"
        />
        <div
          v-if="cityInvalid"
          id="register-clinic-city-error"
          class="invalid-feedback"
        >
          Ingresa la ciudad.
        </div>
      </div>
    </div>

    <!-- Description -->
    <div class="mb-4">
      <label for="register-clinic-description" class="form-label fw-semibold">
        Descripción
      </label>
      <textarea
        id="register-clinic-description"
        v-model="form.description"
        class="form-control"
        :class="{ 'is-invalid': descriptionInvalid }"
        rows="3"
        placeholder="Describe brevemente los servicios de tu clínica..."
        aria-describedby="register-clinic-description-error"
      />
      <div
        v-if="descriptionInvalid"
        id="register-clinic-description-error"
        class="invalid-feedback"
      >
        Ingresa una descripción de la clínica.
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
      {{ pending ? 'Registrando clínica...' : 'Registrar clínica' }}
    </button>
  </form>
</template>

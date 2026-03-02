<script setup lang="ts">
import type { RegisterStorePayload } from '../types'

const { registerStore, pending, error } = useAuth()

const form = reactive<RegisterStorePayload>({
  name: '',
  email: '',
  password: '',
  description: '',
  country: '',
  city: '',
  phone_country_code: '+57',
  phone: '',
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
const descriptionInvalid = computed(() => submitted.value && !form.description.trim())
const countryInvalid = computed(() => submitted.value && !form.country.trim())
const cityInvalid = computed(() => submitted.value && !form.city.trim())
const phoneInvalid = computed(() => submitted.value && !form.phone.trim())

const isFormValid = computed(
  () =>
    !nameInvalid.value
    && !emailInvalid.value
    && !passwordInvalid.value
    && !confirmInvalid.value
    && !descriptionInvalid.value
    && !countryInvalid.value
    && !cityInvalid.value
    && !phoneInvalid.value,
)

// ── Submit ─────────────────────────────────────────────────
async function handleSubmit(): Promise<void> {
  submitted.value = true
  if (!isFormValid.value) return
  await registerStore({ ...form })
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
    <!-- Store name -->
    <div class="mb-3">
      <label for="register-store-name" class="form-label fw-semibold">
        Nombre de la tienda
      </label>
      <input
        id="register-store-name"
        v-model="form.name"
        type="text"
        class="form-control"
        :class="{ 'is-invalid': nameInvalid }"
        placeholder="MascotasMax"
        autocomplete="organization"
        aria-describedby="register-store-name-error"
      />
      <div
        v-if="nameInvalid"
        id="register-store-name-error"
        class="invalid-feedback"
      >
        Ingresa el nombre de la tienda.
      </div>
    </div>

    <!-- Email -->
    <div class="mb-3">
      <label for="register-store-email" class="form-label fw-semibold">
        Correo electrónico
      </label>
      <input
        id="register-store-email"
        v-model="form.email"
        type="email"
        class="form-control"
        :class="{ 'is-invalid': emailInvalid }"
        placeholder="tienda@email.com"
        autocomplete="email"
        aria-describedby="register-store-email-error"
      />
      <div
        v-if="emailInvalid"
        id="register-store-email-error"
        class="invalid-feedback"
      >
        Ingresa un correo electrónico válido.
      </div>
    </div>

    <!-- Password row -->
    <div class="row g-3 mb-3">
      <div class="col-sm-6">
        <label for="register-store-password" class="form-label fw-semibold">
          Contraseña
        </label>
        <input
          id="register-store-password"
          v-model="form.password"
          type="password"
          class="form-control"
          :class="{ 'is-invalid': passwordInvalid }"
          placeholder="Mínimo 6 caracteres"
          minlength="6"
          autocomplete="new-password"
          aria-describedby="register-store-password-error"
        />
        <div
          v-if="passwordInvalid"
          id="register-store-password-error"
          class="invalid-feedback"
        >
          La contraseña debe tener al menos 6 caracteres.
        </div>
      </div>
      <div class="col-sm-6">
        <label for="register-store-confirm" class="form-label fw-semibold">
          Confirmar contraseña
        </label>
        <input
          id="register-store-confirm"
          v-model="confirmPassword"
          type="password"
          class="form-control"
          :class="{ 'is-invalid': confirmInvalid }"
          placeholder="Repite tu contraseña"
          autocomplete="new-password"
          aria-describedby="register-store-confirm-error"
        />
        <div
          v-if="confirmInvalid"
          id="register-store-confirm-error"
          class="invalid-feedback"
        >
          Las contraseñas no coinciden.
        </div>
      </div>
    </div>

    <!-- Description -->
    <div class="mb-3">
      <label for="register-store-description" class="form-label fw-semibold">
        Descripción
      </label>
      <textarea
        id="register-store-description"
        v-model="form.description"
        class="form-control"
        :class="{ 'is-invalid': descriptionInvalid }"
        rows="3"
        placeholder="Describe brevemente tu tienda y los productos que ofreces..."
        aria-describedby="register-store-description-error"
      />
      <div
        v-if="descriptionInvalid"
        id="register-store-description-error"
        class="invalid-feedback"
      >
        Ingresa una descripción de la tienda.
      </div>
    </div>

    <!-- Country / City row -->
    <div class="row g-3 mb-3">
      <div class="col-sm-6">
        <label for="register-store-country" class="form-label fw-semibold">País</label>
        <input
          id="register-store-country"
          v-model="form.country"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': countryInvalid }"
          placeholder="Colombia"
          autocomplete="country-name"
          aria-describedby="register-store-country-error"
        />
        <div
          v-if="countryInvalid"
          id="register-store-country-error"
          class="invalid-feedback"
        >
          Ingresa el país.
        </div>
      </div>
      <div class="col-sm-6">
        <label for="register-store-city" class="form-label fw-semibold">Ciudad</label>
        <input
          id="register-store-city"
          v-model="form.city"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': cityInvalid }"
          placeholder="Bogotá"
          autocomplete="address-level2"
          aria-describedby="register-store-city-error"
        />
        <div
          v-if="cityInvalid"
          id="register-store-city-error"
          class="invalid-feedback"
        >
          Ingresa la ciudad.
        </div>
      </div>
    </div>

    <!-- Phone -->
    <div class="mb-4">
      <label class="form-label fw-semibold" for="register-store-phone">Teléfono</label>
      <div class="input-group" :class="{ 'has-validation': phoneInvalid }">
        <span class="input-group-text px-2">
          <label for="register-store-phone-code" class="visually-hidden">Código de país</label>
          <input
            id="register-store-phone-code"
            v-model="form.phone_country_code"
            type="text"
            class="form-control phone-code-input border-0 p-0 bg-transparent"
            placeholder="+57"
            autocomplete="tel-country-code"
            aria-label="Código de país"
          />
        </span>
        <input
          id="register-store-phone"
          v-model="form.phone"
          type="tel"
          class="form-control"
          :class="{ 'is-invalid': phoneInvalid }"
          placeholder="3001234567"
          autocomplete="tel-national"
          aria-describedby="register-store-phone-error"
        />
        <div
          v-if="phoneInvalid"
          id="register-store-phone-error"
          class="invalid-feedback"
        >
          Ingresa el número de teléfono.
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
      {{ pending ? 'Registrando tienda...' : 'Registrar tienda' }}
    </button>
  </form>
</template>

<style scoped lang="scss">
.phone-code-input {
  width: 52px;
  min-width: 52px;
}
</style>

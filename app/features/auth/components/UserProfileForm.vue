<script setup lang="ts">
import type { UpdateProfileDTO } from '../types'

const { updateProfile, pending, error } = useAuth()
const authStore = useAuthStore()

const user = computed(() => authStore.currentUser)

// Initialise form from store — user is guaranteed to be set on this
// protected page (the auth middleware ensures that).
const form = reactive<UpdateProfileDTO>({
  name: user.value?.name ?? '',
  last_name: user.value?.last_name ?? '',
  email: user.value?.email ?? '',
  country: user.value?.country ?? '',
  city: user.value?.city ?? '',
  phone_country_code: user.value?.phone_country_code ?? '+57',
  phone: user.value?.phone ?? '',
  current_password: '',
  new_password: '',
})

const confirmNewPassword = ref('')
const pendingPhoto = ref<File | null>(null)
const submitted = ref(false)
const saveSuccess = ref(false)

// ── Validation ─────────────────────────────────────────────
const nameInvalid = computed(() => submitted.value && !form.name?.trim())
const lastNameInvalid = computed(() => submitted.value && !form.last_name?.trim())
const emailInvalid = computed(() => submitted.value && !form.email?.trim())

// Password change is optional — only validate if user typed anything
const isChangingPassword = computed(
  () => !!form.current_password || !!form.new_password,
)
const currentPasswordInvalid = computed(
  () => submitted.value && isChangingPassword.value && !form.current_password,
)
const newPasswordInvalid = computed(
  () =>
    submitted.value
    && isChangingPassword.value
    && (form.new_password?.length ?? 0) < 6,
)
const confirmNewPasswordInvalid = computed(
  () =>
    submitted.value
    && isChangingPassword.value
    && confirmNewPassword.value !== form.new_password,
)

const isFormValid = computed(
  () =>
    !nameInvalid.value
    && !lastNameInvalid.value
    && !emailInvalid.value
    && !currentPasswordInvalid.value
    && !newPasswordInvalid.value
    && !confirmNewPasswordInvalid.value,
)

// ── Photo handler ──────────────────────────────────────────
function onPhotoUpdate(file: File): void {
  pendingPhoto.value = file
}

// ── Submit ─────────────────────────────────────────────────
async function handleSubmit(): Promise<void> {
  submitted.value = true
  saveSuccess.value = false
  if (!isFormValid.value) return

  // Only send password fields when the user actually wants to change it
  const payload: UpdateProfileDTO = {
    name: form.name,
    last_name: form.last_name,
    email: form.email,
    country: form.country,
    city: form.city,
    phone_country_code: form.phone_country_code,
    phone: form.phone,
  }
  if (isChangingPassword.value) {
    payload.current_password = form.current_password
    payload.new_password = form.new_password
  }

  await updateProfile(payload, pendingPhoto.value ?? undefined)

  if (!error.value) {
    saveSuccess.value = true
    // Reset password fields after a successful change
    form.current_password = ''
    form.new_password = ''
    confirmNewPassword.value = ''
    pendingPhoto.value = null
    submitted.value = false
  }
}
</script>

<template>
  <div class="user-profile-form">
    <h2 class="h5 fw-bold mb-4">Editar perfil</h2>

    <!-- Success banner -->
    <div
      v-if="saveSuccess"
      class="alert alert-success py-2 small"
      role="status"
      aria-live="polite"
    >
      Perfil actualizado correctamente.
    </div>

    <!-- API error -->
    <div
      v-if="error"
      class="alert alert-danger py-2 small"
      role="alert"
      aria-live="assertive"
    >
      {{ error }}
    </div>

    <form novalidate @submit.prevent="handleSubmit">
      <!-- Profile picture -->
      <div class="mb-4 text-center">
        <UserProfilePicture
          :src="user?.profile_picture_url"
          :name="user ? `${user.name} ${user.last_name}` : undefined"
          @update:photo="onPhotoUpdate"
        />
      </div>

      <!-- Name row -->
      <div class="row g-3 mb-3">
        <div class="col-sm-6">
          <label for="profile-name" class="form-label fw-semibold">Nombre</label>
          <input
            id="profile-name"
            v-model="form.name"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': nameInvalid }"
            autocomplete="given-name"
            aria-describedby="profile-name-error"
          />
          <div
            v-if="nameInvalid"
            id="profile-name-error"
            class="invalid-feedback"
          >
            El nombre es obligatorio.
          </div>
        </div>
        <div class="col-sm-6">
          <label for="profile-last-name" class="form-label fw-semibold">Apellido</label>
          <input
            id="profile-last-name"
            v-model="form.last_name"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': lastNameInvalid }"
            autocomplete="family-name"
            aria-describedby="profile-last-name-error"
          />
          <div
            v-if="lastNameInvalid"
            id="profile-last-name-error"
            class="invalid-feedback"
          >
            El apellido es obligatorio.
          </div>
        </div>
      </div>

      <!-- Email -->
      <div class="mb-3">
        <label for="profile-email" class="form-label fw-semibold">Correo electrónico</label>
        <input
          id="profile-email"
          v-model="form.email"
          type="email"
          class="form-control"
          :class="{ 'is-invalid': emailInvalid }"
          autocomplete="email"
          aria-describedby="profile-email-error"
        />
        <div
          v-if="emailInvalid"
          id="profile-email-error"
          class="invalid-feedback"
        >
          Ingresa un correo electrónico válido.
        </div>
      </div>

      <!-- Country / City -->
      <div class="row g-3 mb-3">
        <div class="col-sm-6">
          <label for="profile-country" class="form-label fw-semibold">País</label>
          <input
            id="profile-country"
            v-model="form.country"
            type="text"
            class="form-control"
            autocomplete="country-name"
          />
        </div>
        <div class="col-sm-6">
          <label for="profile-city" class="form-label fw-semibold">Ciudad</label>
          <input
            id="profile-city"
            v-model="form.city"
            type="text"
            class="form-control"
            autocomplete="address-level2"
          />
        </div>
      </div>

      <!-- Phone -->
      <div class="mb-4">
        <label class="form-label fw-semibold" for="profile-phone">Teléfono</label>
        <div class="input-group">
          <span class="input-group-text px-2">
            <label for="profile-phone-code" class="visually-hidden">Código de país</label>
            <input
              id="profile-phone-code"
              v-model="form.phone_country_code"
              type="text"
              class="form-control border-0 p-0 bg-transparent phone-code-input"
              autocomplete="tel-country-code"
              aria-label="Código de país"
            />
          </span>
          <input
            id="profile-phone"
            v-model="form.phone"
            type="tel"
            class="form-control"
            autocomplete="tel-national"
          />
        </div>
      </div>

      <!-- Password change section -->
      <hr class="my-4" />
      <h3 class="h6 fw-bold mb-3 text-muted">
        Cambiar contraseña
        <span class="fw-normal">(opcional)</span>
      </h3>

      <div class="mb-3">
        <label for="profile-current-password" class="form-label fw-semibold">
          Contraseña actual
        </label>
        <input
          id="profile-current-password"
          v-model="form.current_password"
          type="password"
          class="form-control"
          :class="{ 'is-invalid': currentPasswordInvalid }"
          autocomplete="current-password"
          placeholder="Ingresa tu contraseña actual"
          aria-describedby="profile-current-password-error"
        />
        <div
          v-if="currentPasswordInvalid"
          id="profile-current-password-error"
          class="invalid-feedback"
        >
          Debes ingresar tu contraseña actual para cambiarla.
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-sm-6">
          <label for="profile-new-password" class="form-label fw-semibold">
            Nueva contraseña
          </label>
          <input
            id="profile-new-password"
            v-model="form.new_password"
            type="password"
            class="form-control"
            :class="{ 'is-invalid': newPasswordInvalid }"
            autocomplete="new-password"
            placeholder="Mínimo 6 caracteres"
            aria-describedby="profile-new-password-error"
          />
          <div
            v-if="newPasswordInvalid"
            id="profile-new-password-error"
            class="invalid-feedback"
          >
            La nueva contraseña debe tener al menos 6 caracteres.
          </div>
        </div>
        <div class="col-sm-6">
          <label for="profile-confirm-password" class="form-label fw-semibold">
            Confirmar nueva contraseña
          </label>
          <input
            id="profile-confirm-password"
            v-model="confirmNewPassword"
            type="password"
            class="form-control"
            :class="{ 'is-invalid': confirmNewPasswordInvalid }"
            autocomplete="new-password"
            placeholder="Repite la nueva contraseña"
            aria-describedby="profile-confirm-password-error"
          />
          <div
            v-if="confirmNewPasswordInvalid"
            id="profile-confirm-password-error"
            class="invalid-feedback"
          >
            Las contraseñas no coinciden.
          </div>
        </div>
      </div>

      <button
        type="submit"
        class="btn btn-primary fw-semibold"
        :disabled="pending"
        :aria-busy="pending"
      >
        <span
          v-if="pending"
          class="spinner-border spinner-border-sm me-2"
          aria-hidden="true"
        />
        {{ pending ? 'Guardando...' : 'Guardar cambios' }}
      </button>
    </form>
  </div>
</template>

<style scoped lang="scss">
.user-profile-form {
  max-width: 600px;
}

.phone-code-input {
  width: 52px;
  min-width: 52px;
}
</style>

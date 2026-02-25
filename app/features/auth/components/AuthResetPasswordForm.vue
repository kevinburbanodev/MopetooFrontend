<script setup lang="ts">
const props = defineProps<{
  /** Reset token from the URL parameter */
  token: string
}>()

const { resetPassword, pending, error } = useAuth()

const password = ref('')
const confirmPassword = ref('')
const submitted = ref(false)

const passwordInvalid = computed(() => submitted.value && password.value.length < 6)
const confirmInvalid = computed(
  () => submitted.value && confirmPassword.value !== password.value,
)

async function handleSubmit(): Promise<void> {
  submitted.value = true
  if (passwordInvalid.value || confirmInvalid.value) return
  await resetPassword(props.token, password.value)
}
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-12 col-sm-10 col-md-8 col-lg-5">
      <div class="card shadow border-0 reset-card">
        <div class="card-body p-4 p-md-5">
          <!-- Header -->
          <div class="text-center mb-4">
            <div class="icon-wrapper mb-2" aria-hidden="true">🔒</div>
            <h1 class="h4 fw-bold text-dark">Nueva contraseña</h1>
            <p class="text-muted small mb-0">Elige una contraseña segura para tu cuenta</p>
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
            <!-- New password -->
            <div class="mb-3">
              <label for="reset-password" class="form-label fw-semibold">
                Nueva contraseña
              </label>
              <input
                id="reset-password"
                v-model="password"
                type="password"
                class="form-control"
                :class="{ 'is-invalid': passwordInvalid }"
                placeholder="Mínimo 6 caracteres"
                minlength="6"
                autocomplete="new-password"
                aria-describedby="reset-password-error"
              />
              <div
                v-if="passwordInvalid"
                id="reset-password-error"
                class="invalid-feedback"
              >
                La contraseña debe tener al menos 6 caracteres.
              </div>
            </div>

            <!-- Confirm password -->
            <div class="mb-4">
              <label for="reset-confirm" class="form-label fw-semibold">
                Confirmar contraseña
              </label>
              <input
                id="reset-confirm"
                v-model="confirmPassword"
                type="password"
                class="form-control"
                :class="{ 'is-invalid': confirmInvalid }"
                placeholder="Repite tu contraseña"
                autocomplete="new-password"
                aria-describedby="reset-confirm-error"
              />
              <div
                v-if="confirmInvalid"
                id="reset-confirm-error"
                class="invalid-feedback"
              >
                Las contraseñas no coinciden.
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
              {{ pending ? 'Guardando...' : 'Restablecer contraseña' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.reset-card {
  border-radius: var(--bs-border-radius-lg);
}

.icon-wrapper {
  font-size: 2.5rem;
  line-height: 1;
}
</style>

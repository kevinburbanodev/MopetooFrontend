<script setup lang="ts">
const {
  verifyEmail,
  resendVerificationCode,
  cancelVerification,
  verificationEmail,
  pending,
  error,
} = useAuth()

const code = ref('')
const submitted = ref(false)
const resendSuccess = ref(false)
const resendCooldown = ref(0)

let cooldownTimer: ReturnType<typeof setInterval> | null = null

const codeInvalid = computed(() => submitted.value && code.value.trim().length !== 6)

async function handleSubmit(): Promise<void> {
  submitted.value = true
  if (codeInvalid.value) return
  await verifyEmail(code.value.trim())
}

async function handleResend(): Promise<void> {
  if (resendCooldown.value > 0) return
  resendSuccess.value = false
  const result = await resendVerificationCode()
  if (result.success) {
    resendSuccess.value = true
    resendCooldown.value = 30
    cooldownTimer = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0 && cooldownTimer) {
        clearInterval(cooldownTimer)
        cooldownTimer = null
      }
    }, 1000)
  }
}

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-12 col-sm-10 col-md-8 col-lg-5">
      <div class="card shadow border-0 verify-card">
        <div class="card-body p-4 p-md-5">
          <!-- Header -->
          <div class="text-center mb-4">
            <div class="brand-icon mb-2" aria-hidden="true">&#x2709;</div>
            <h1 class="h4 fw-bold text-dark">Verifica tu email</h1>
            <p class="text-muted small mb-0">
              Enviamos un código de 6 dígitos a
              <strong>{{ verificationEmail }}</strong>
            </p>
          </div>

          <!-- Success alert for resend -->
          <div
            v-if="resendSuccess"
            class="alert alert-success py-2 small"
            role="alert"
          >
            Se ha enviado un nuevo código de verificación.
          </div>

          <!-- API error alert -->
          <div
            v-if="error"
            class="alert alert-danger py-2 small"
            role="alert"
            aria-live="assertive"
          >
            {{ error }}
          </div>

          <!-- Form -->
          <form novalidate @submit.prevent="handleSubmit">
            <div class="mb-4">
              <label for="verify-code" class="form-label fw-semibold">
                Código de verificación
              </label>
              <input
                id="verify-code"
                v-model="code"
                type="text"
                inputmode="numeric"
                maxlength="6"
                class="form-control form-control-lg text-center"
                :class="{ 'is-invalid': codeInvalid }"
                placeholder="000000"
                autocomplete="one-time-code"
                aria-describedby="verify-code-error"
              />
              <div
                v-if="codeInvalid"
                id="verify-code-error"
                class="invalid-feedback"
              >
                Ingresa el código de 6 dígitos.
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
              {{ pending ? 'Verificando...' : 'Verificar email' }}
            </button>
          </form>

          <!-- Resend & back links -->
          <div class="text-center mt-4">
            <p class="small text-muted mb-2">
              ¿No recibiste el código?
              <button
                type="button"
                class="btn btn-link p-0 small text-primary text-decoration-none fw-semibold"
                :disabled="resendCooldown > 0 || pending"
                @click="handleResend"
              >
                {{ resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código' }}
              </button>
            </p>
            <button
              type="button"
              class="btn btn-link p-0 small text-muted text-decoration-none"
              @click="cancelVerification"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.verify-card {
  border-radius: var(--bs-border-radius-lg);
}

.brand-icon {
  font-size: 2.5rem;
  line-height: 1;
}
</style>

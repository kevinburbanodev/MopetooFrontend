<script setup lang="ts">
const { forgotPassword, pending, error } = useAuth()

const email = ref('')
const submitted = ref(false)
const success = ref(false)

const emailInvalid = computed(() => submitted.value && !email.value.trim())

async function handleSubmit(): Promise<void> {
  submitted.value = true
  if (emailInvalid.value) return

  await forgotPassword(email.value.trim())

  // Show success message only if no API error occurred
  if (!error.value) {
    success.value = true
  }
}
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-12 col-sm-10 col-md-8 col-lg-5">
      <div class="card shadow border-0 forgot-card">
        <div class="card-body p-4 p-md-5">
          <!-- Header -->
          <div class="text-center mb-4">
            <div class="icon-wrapper mb-2" aria-hidden="true">🔑</div>
            <h1 class="h4 fw-bold text-dark">Recuperar contraseña</h1>
            <p class="text-muted small mb-0">
              Te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          <!-- Success state -->
          <div
            v-if="success"
            class="alert alert-success"
            role="status"
            aria-live="polite"
          >
            <strong>Correo enviado.</strong> Revisa tu bandeja de entrada y sigue
            las instrucciones para restablecer tu contraseña.
          </div>

          <!-- Form (hidden after success) -->
          <template v-else>
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
              <div class="mb-4">
                <label for="forgot-email" class="form-label fw-semibold">
                  Correo electrónico
                </label>
                <input
                  id="forgot-email"
                  v-model="email"
                  type="email"
                  class="form-control"
                  :class="{ 'is-invalid': emailInvalid }"
                  placeholder="tu@email.com"
                  autocomplete="email"
                  aria-describedby="forgot-email-error"
                />
                <div
                  v-if="emailInvalid"
                  id="forgot-email-error"
                  class="invalid-feedback"
                >
                  Ingresa tu correo electrónico.
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
                {{ pending ? 'Enviando...' : 'Enviar enlace' }}
              </button>
            </form>
          </template>

          <!-- Back to login -->
          <p class="text-center mt-4 mb-0 small text-muted">
            <NuxtLink
              to="/login"
              class="text-primary fw-semibold text-decoration-none"
            >
              &larr; Volver a iniciar sesión
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.forgot-card {
  border-radius: var(--bs-border-radius-lg);
}

.icon-wrapper {
  font-size: 2.5rem;
  line-height: 1;
}
</style>

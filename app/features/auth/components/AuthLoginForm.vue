<script setup lang="ts">
const { login, pending, error } = useAuth()

const email = ref('')
const password = ref('')

// Client-side validation state — only shown after a submit attempt
const submitted = ref(false)

const emailInvalid = computed(() => submitted.value && !email.value.trim())
const passwordInvalid = computed(() => submitted.value && !password.value)

async function handleSubmit(): Promise<void> {
  submitted.value = true
  if (emailInvalid.value || passwordInvalid.value) return
  await login(email.value.trim(), password.value)
}
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-12 col-sm-10 col-md-8 col-lg-5">
      <div class="card shadow border-0 login-card">
        <div class="card-body p-4 p-md-5">
          <!-- Header -->
          <div class="text-center mb-4">
            <div class="brand-icon mb-2" aria-hidden="true">🐾</div>
            <h1 class="h4 fw-bold text-dark">Bienvenido de vuelta</h1>
            <p class="text-muted small mb-0">Inicia sesión para cuidar a tus mascotas</p>
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
            <!-- Email -->
            <div class="mb-3">
              <label for="login-email" class="form-label fw-semibold">
                Correo electrónico
              </label>
              <input
                id="login-email"
                v-model="email"
                type="email"
                class="form-control"
                :class="{ 'is-invalid': emailInvalid }"
                placeholder="tu@email.com"
                autocomplete="email"
                aria-describedby="login-email-error"
              />
              <div
                v-if="emailInvalid"
                id="login-email-error"
                class="invalid-feedback"
              >
                Ingresa tu correo electrónico.
              </div>
            </div>

            <!-- Password -->
            <div class="mb-4">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <label for="login-password" class="form-label fw-semibold mb-0">
                  Contraseña
                </label>
                <NuxtLink
                  to="/forgot-password"
                  class="small text-primary text-decoration-none"
                >
                  ¿Olvidaste tu contraseña?
                </NuxtLink>
              </div>
              <input
                id="login-password"
                v-model="password"
                type="password"
                class="form-control"
                :class="{ 'is-invalid': passwordInvalid }"
                placeholder="••••••••"
                autocomplete="current-password"
                aria-describedby="login-password-error"
              />
              <div
                v-if="passwordInvalid"
                id="login-password-error"
                class="invalid-feedback"
              >
                Ingresa tu contraseña.
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
              {{ pending ? 'Iniciando sesión...' : 'Iniciar sesión' }}
            </button>
          </form>

          <!-- Register link -->
          <p class="text-center mt-4 mb-0 small text-muted">
            ¿No tienes cuenta?
            <NuxtLink
              to="/register"
              class="text-primary fw-semibold text-decoration-none"
            >
              Regístrate gratis
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-card {
  border-radius: var(--bs-border-radius-lg);
}

.brand-icon {
  font-size: 2.5rem;
  line-height: 1;
}
</style>

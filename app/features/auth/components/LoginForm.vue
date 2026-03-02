<script setup lang="ts">
import type { LoginPayload } from '../types'

const { login, loading, error } = useAuth()

const form = reactive<LoginPayload>({
  email: '',
  password: '',
})
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-12 col-sm-10 col-md-8 col-lg-5">
      <div class="card shadow border-0">
        <div class="card-body p-4 p-md-5">
          <!-- Header -->
          <div class="text-center mb-4">
            <span class="fs-1">🐾</span>
            <h1 class="h4 fw-bold mt-2 text-dark">Bienvenido de vuelta</h1>
            <p class="text-muted small">Inicia sesión para cuidar a tus mascotas</p>
          </div>

          <!-- Error alert -->
          <div v-if="error" class="alert alert-danger py-2 small" role="alert">
            {{ error }}
          </div>

          <!-- Form -->
          <form @submit.prevent="login(form)">
            <div class="mb-3">
              <label for="email" class="form-label fw-semibold">Email</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="form-control"
                placeholder="tu@email.com"
                required
                autocomplete="email"
              />
            </div>

            <div class="mb-4">
              <div class="d-flex justify-content-between align-items-center">
                <label for="password" class="form-label fw-semibold">Contraseña</label>
                <NuxtLink to="/forgot-password" class="small text-primary">
                  ¿Olvidaste tu contraseña?
                </NuxtLink>
              </div>
              <input
                id="password"
                v-model="form.password"
                type="password"
                class="form-control"
                placeholder="••••••••"
                required
                autocomplete="current-password"
              />
            </div>

            <button
              type="submit"
              class="btn btn-primary w-100 fw-semibold"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              {{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
            </button>
          </form>

          <!-- Register link -->
          <p class="text-center mt-4 mb-0 small text-muted">
            ¿No tienes cuenta?
            <NuxtLink to="/register" class="text-primary fw-semibold">
              Regístrate gratis
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

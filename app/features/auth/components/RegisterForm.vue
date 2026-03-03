<script setup lang="ts">
import type { RegisterPayload } from '../types'

const { register, loading, error } = useAuth()
const { toastError } = useToast()

watch(error, (v) => { if (v) toastError(v) })

const form = reactive<RegisterPayload>({
  name: '',
  last_name: '',
  email: '',
  password: '',
  country_id: 0,
  city_id: 0,
  phone: '',
})

const phoneCode = ref('+57')
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-12 col-sm-10 col-md-8 col-lg-6">
      <div class="card shadow border-0">
        <div class="card-body p-4 p-md-5">
          <!-- Header -->
          <div class="text-center mb-4">
            <span class="fs-1">🐾</span>
            <h1 class="h4 fw-bold mt-2 text-dark">Crear cuenta</h1>
            <p class="text-muted small">Únete y cuida mejor a tus mascotas</p>
          </div>

          <!-- Form -->
          <form @submit.prevent="register(form)">
            <!-- Row: name + last_name -->
            <div class="row g-3 mb-3">
              <div class="col-6">
                <label for="name" class="form-label fw-semibold">Nombre</label>
                <input
                  id="name"
                  v-model="form.name"
                  type="text"
                  class="form-control"
                  placeholder="Juan"
                  required
                />
              </div>
              <div class="col-6">
                <label for="last_name" class="form-label fw-semibold">Apellido</label>
                <input
                  id="last_name"
                  v-model="form.last_name"
                  type="text"
                  class="form-control"
                  placeholder="Pérez"
                  required
                />
              </div>
            </div>

            <!-- Email -->
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

            <!-- Password -->
            <div class="mb-3">
              <label for="password" class="form-label fw-semibold">Contraseña</label>
              <input
                id="password"
                v-model="form.password"
                type="password"
                class="form-control"
                placeholder="Mínimo 6 caracteres"
                minlength="6"
                required
                autocomplete="new-password"
              />
            </div>

            <!-- Row: country + city -->
            <div class="row g-3 mb-3">
              <div class="col-6">
                <label for="country" class="form-label fw-semibold">País</label>
                <input
                  id="country"
                  v-model="form.country_id"
                  type="number"
                  class="form-control"
                  placeholder="1"
                  required
                />
              </div>
              <div class="col-6">
                <label for="city" class="form-label fw-semibold">Ciudad</label>
                <input
                  id="city"
                  v-model="form.city_id"
                  type="number"
                  class="form-control"
                  placeholder="1"
                  required
                />
              </div>
            </div>

            <!-- Phone -->
            <div class="mb-4">
              <label class="form-label fw-semibold">Teléfono</label>
              <div class="input-group">
                <input
                  v-model="phoneCode"
                  type="text"
                  class="form-control"
                  style="max-width: 80px"
                  placeholder="+57"
                  readonly
                />
                <input
                  v-model="form.phone"
                  type="tel"
                  class="form-control"
                  placeholder="3001234567"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              class="btn btn-primary w-100 fw-semibold"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
            </button>
          </form>

          <!-- Login link -->
          <p class="text-center mt-4 mb-0 small text-muted">
            ¿Ya tienes cuenta?
            <NuxtLink to="/login" class="text-primary fw-semibold">
              Iniciar sesión
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

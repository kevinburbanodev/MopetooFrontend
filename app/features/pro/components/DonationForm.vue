<script setup lang="ts">
// DonationForm — allows authenticated users to donate to a shelter.
// Unauthenticated users see a login CTA.
//
// Amount selection: preset COP amounts + optional custom input.
// Validation: amount > 0 and ≤ 10_000_000; message ≤ 200 chars.
// On success: renders a thank-you state with reset option.

import type { DonationRequest } from '../types'

const props = defineProps<{
  /** Shelter receiving the donation. */
  shelterId: string
  /** Human-readable shelter name shown in the success state. */
  shelterName: string
}>()

const { donate, error } = usePro()
const authStore = useAuthStore()

// ── Constants ─────────────────────────────────────────────
const PRESET_AMOUNTS = [5_000, 10_000, 25_000, 50_000] as const
const AMOUNT_MIN = 1
const AMOUNT_MAX = 10_000_000
const MESSAGE_MAX = 200

// ── Form state ────────────────────────────────────────────
const selectedAmount = ref<number | null>(null)
const customAmount = ref('')
const message = ref('')
const submitted = ref(false)
const isLoading = ref(false)
const success = ref(false)
const donatedAmount = ref<number | null>(null)

// ── Computed ──────────────────────────────────────────────

/**
 * The effective amount to submit: preset if selected, otherwise parsed
 * from the custom input. Returns null when neither is valid.
 */
const effectiveAmount = computed<number | null>(() => {
  if (selectedAmount.value !== null) return selectedAmount.value
  const parsed = parseInt(customAmount.value.replace(/[.,\s]/g, ''), 10)
  if (Number.isNaN(parsed)) return null
  return parsed
})

const amountInvalid = computed(() => {
  if (!submitted.value) return false
  const amt = effectiveAmount.value
  return amt === null || amt < AMOUNT_MIN || amt > AMOUNT_MAX
})

const messageInvalid = computed(
  () => submitted.value && message.value.length > MESSAGE_MAX,
)

const messageCharsLeft = computed(() => MESSAGE_MAX - message.value.length)

// ── Handlers ──────────────────────────────────────────────

function selectPreset(amount: number): void {
  selectedAmount.value = amount
  // Clear custom input when switching to a preset
  customAmount.value = ''
}

function onCustomAmountFocus(): void {
  // Deselect preset when the user starts typing a custom amount
  selectedAmount.value = null
}

async function handleSubmit(): Promise<void> {
  submitted.value = true
  error.value = null

  const amt = effectiveAmount.value
  if (amt === null || amt < AMOUNT_MIN || amt > AMOUNT_MAX) return
  if (message.value.length > MESSAGE_MAX) return

  const payload: DonationRequest = {
    shelter_id: props.shelterId,
    amount: amt,
    message: message.value.trim() || undefined,
  }

  isLoading.value = true
  const result = await donate(payload)
  isLoading.value = false

  if (result) {
    donatedAmount.value = amt
    success.value = true
  }
}

function reset(): void {
  selectedAmount.value = null
  customAmount.value = ''
  message.value = ''
  submitted.value = false
  success.value = false
  donatedAmount.value = null
  error.value = null
}

function formatCOP(amount: number): string {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount)
  }
  catch {
    return `COP ${amount}`
  }
}
</script>

<template>
  <section class="donation-form" aria-label="Formulario de donación">
    <!-- ── Unauthenticated — login CTA ──────────────────────── -->
    <ClientOnly>
      <template v-if="!authStore.isAuthenticated">
        <div
          class="alert alert-info d-flex align-items-center gap-3 mb-0"
          role="note"
          aria-label="Inicia sesión para donar"
        >
          <span class="fs-3 flex-shrink-0" aria-hidden="true">🔑</span>
          <div>
            <p class="fw-semibold mb-1">Inicia sesión para donar</p>
            <p class="text-muted small mb-2">
              Necesitas una cuenta Mopetoo para hacer una donación a {{ shelterName }}.
            </p>
            <div class="d-flex gap-2 flex-wrap">
              <NuxtLink to="/login" class="btn btn-primary btn-sm">
                Iniciar sesión
              </NuxtLink>
              <NuxtLink to="/register" class="btn btn-outline-primary btn-sm">
                Registrarse
              </NuxtLink>
            </div>
          </div>
        </div>
      </template>

      <!-- ── Success state ────────────────────────────────────── -->
      <template v-else-if="success">
        <div
          class="text-center py-4"
          role="status"
          aria-live="polite"
        >
          <span class="fs-1 d-block" aria-hidden="true">💚</span>
          <h3 class="h5 fw-bold mt-3 mb-2">¡Gracias por tu donación!</h3>
          <p class="text-muted mb-1">
            Donaste
            <strong class="text-success">{{ formatCOP(donatedAmount!) }}</strong>
            a
            <strong>{{ shelterName }}</strong>.
          </p>
          <p class="text-muted small mb-4">
            Tu generosidad ayuda a que más animales encuentren un hogar.
          </p>
          <button
            type="button"
            class="btn btn-outline-success btn-sm"
            @click="reset"
          >
            Hacer otra donación
          </button>
        </div>
      </template>

      <!-- ── Donation form (authenticated) ────────────────────── -->
      <template v-else>
        <h3 class="h5 fw-bold mb-1">Hacer una donación</h3>
        <p class="text-muted small mb-4">
          Tu donación a <strong>{{ shelterName }}</strong> ayuda a cubrir
          alimentos, veterinaria y cuidados para los animales.
        </p>

        <!-- API error -->
        <div
          v-if="error"
          class="alert alert-danger d-flex align-items-center gap-2 mb-3"
          role="alert"
        >
          <span aria-hidden="true">⚠</span>
          {{ error }}
        </div>

        <form
          :class="{ 'was-validated': submitted }"
          novalidate
          @submit.prevent="handleSubmit"
        >
          <!-- Preset amount buttons -->
          <fieldset class="mb-3">
            <legend class="form-label fw-semibold mb-2">
              Selecciona un monto
              <span class="text-danger" aria-hidden="true">*</span>
            </legend>
            <div class="d-flex gap-2 flex-wrap" role="group" aria-label="Montos de donación sugeridos">
              <button
                v-for="preset in PRESET_AMOUNTS"
                :key="preset"
                type="button"
                :class="[
                  'btn btn-sm',
                  selectedAmount === preset
                    ? 'btn-success fw-bold'
                    : 'btn-outline-secondary',
                ]"
                :aria-pressed="selectedAmount === preset"
                :aria-label="`Donar ${formatCOP(preset)}`"
                @click="selectPreset(preset)"
              >
                {{ formatCOP(preset) }}
              </button>
            </div>
          </fieldset>

          <!-- Custom amount input -->
          <div class="mb-3">
            <label for="donation-custom-amount" class="form-label fw-semibold">
              O ingresa un monto personalizado (COP)
            </label>
            <input
              id="donation-custom-amount"
              v-model="customAmount"
              type="number"
              class="form-control"
              :class="{ 'is-invalid': amountInvalid }"
              :min="AMOUNT_MIN"
              :max="AMOUNT_MAX"
              inputmode="numeric"
              placeholder="Ej: 15000"
              aria-describedby="donation-amount-error"
              @focus="onCustomAmountFocus"
            />
            <div
              v-if="amountInvalid"
              id="donation-amount-error"
              class="invalid-feedback"
              role="alert"
            >
              Ingresa un monto válido entre {{ formatCOP(AMOUNT_MIN) }} y
              {{ formatCOP(AMOUNT_MAX) }}.
            </div>
          </div>

          <!-- Optional message -->
          <div class="mb-4">
            <label for="donation-message" class="form-label fw-semibold">
              Mensaje para el refugio
              <span class="text-muted fw-normal small">(opcional)</span>
            </label>
            <textarea
              id="donation-message"
              v-model="message"
              class="form-control"
              :class="{ 'is-invalid': messageInvalid }"
              rows="3"
              :maxlength="MESSAGE_MAX + 10"
              placeholder="Escribe un mensaje de apoyo para el refugio..."
              aria-describedby="donation-message-hint donation-message-error"
            />
            <div
              id="donation-message-hint"
              class="d-flex justify-content-end mt-1"
            >
              <span
                class="form-text"
                :class="{ 'text-danger': messageCharsLeft < 0 }"
                aria-live="polite"
              >
                {{ Math.max(0, messageCharsLeft) }} / {{ MESSAGE_MAX }} caracteres
              </span>
            </div>
            <div
              v-if="messageInvalid"
              id="donation-message-error"
              class="invalid-feedback"
              role="alert"
            >
              El mensaje no puede superar los {{ MESSAGE_MAX }} caracteres.
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="btn btn-success fw-semibold px-4"
            :disabled="isLoading"
            :aria-busy="isLoading"
          >
            <span
              v-if="isLoading"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            />
            {{ isLoading ? 'Procesando...' : 'Donar ahora' }}
          </button>
        </form>
      </template>

      <!-- SSR fallback — shown on server, replaced by ClientOnly on client -->
      <template #fallback>
        <div class="text-center py-3 text-muted small">
          <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          Cargando formulario...
        </div>
      </template>
    </ClientOnly>
  </section>
</template>

<style scoped lang="scss">
.donation-form {
  // Ensure the form has a reasonable max-width when used inline
  max-width: 520px;
}
</style>

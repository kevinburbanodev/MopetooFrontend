<script setup lang="ts">
// Create reminder page — thin wrapper rendering ReminderForm in create mode.
// On success, redirects to /dashboard/reminders.

import type { ReminderFormSubmitPayload } from '~/features/reminders/types'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Nuevo recordatorio — Mopetoo',
  description: 'Crea un recordatorio para vacunas, medicinas y visitas de tus mascotas.',
})

const { createReminder, error } = useReminders()
const remindersStore = useRemindersStore()
const { fetchPets } = usePets()
const petsStore = usePetsStore()
const router = useRouter()

// Pets must be loaded before the form renders the pet selector
onMounted(async () => {
  await fetchPets()
})

async function handleSubmit(payload: ReminderFormSubmitPayload): Promise<void> {
  const reminder = await createReminder(payload.data)
  if (reminder) {
    await router.push('/dashboard/reminders')
  }
}
</script>

<template>
  <div class="container py-5">
    <!-- Breadcrumb -->
    <nav aria-label="Migas de pan" class="mb-4">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <NuxtLink to="/dashboard">Dashboard</NuxtLink>
        </li>
        <li class="breadcrumb-item">
          <NuxtLink to="/dashboard/reminders">Recordatorios</NuxtLink>
        </li>
        <li class="breadcrumb-item active" aria-current="page">Nuevo recordatorio</li>
      </ol>
    </nav>

    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
            <h1 class="h4 fw-bold mb-0">Nuevo recordatorio</h1>
          </div>
          <div class="card-body p-4">
            <!-- Error alert -->
            <div
              v-if="error"
              class="alert alert-danger d-flex align-items-center gap-2 mb-4"
              role="alert"
            >
              <span aria-hidden="true">⚠️</span>
              {{ error }}
            </div>

            <ReminderForm
              :pets="petsStore.pets"
              :is-loading="remindersStore.isLoading"
              @submit="handleSubmit"
              @cancel="router.push('/dashboard/reminders')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

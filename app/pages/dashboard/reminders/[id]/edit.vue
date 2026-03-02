<script setup lang="ts">
// Edit reminder page — thin wrapper rendering ReminderForm in edit mode.
// Fetches the reminder by route param and pre-populates the form.
// On success, redirects to /dashboard/reminders.

import type { ReminderFormSubmitPayload } from '~/features/reminders/types'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Editar recordatorio — Mopetoo',
  description: 'Edita los detalles de tu recordatorio.',
})

const route = useRoute()
const router = useRouter()
const { fetchReminderById, updateReminder, error } = useReminders()
const remindersStore = useRemindersStore()
const { fetchPets } = usePets()
const petsStore = usePetsStore()

const reminderId = computed(() => Number(route.params.id))

// Fetch the reminder and pets in parallel
onMounted(async () => {
  const [, reminder] = await Promise.all([
    fetchPets(),
    fetchReminderById(reminderId.value),
  ])
  if (!reminder) {
    // Not found or unauthorized — go back to list
    await router.replace('/dashboard/reminders')
  }
})

// Clear selection when navigating away so stale data is not shown
onUnmounted(() => {
  remindersStore.clearSelectedReminder()
})

async function handleSubmit(payload: ReminderFormSubmitPayload): Promise<void> {
  const { pet_id, ...data } = payload.data
  const reminder = await updateReminder(reminderId.value, data)
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
        <li class="breadcrumb-item active" aria-current="page">Editar recordatorio</li>
      </ol>
    </nav>

    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-transparent border-bottom px-4 pt-4 pb-3">
            <h1 class="h4 fw-bold mb-0">Editar recordatorio</h1>
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

            <!-- Loading skeleton while fetching -->
            <div
              v-if="remindersStore.isLoading && !remindersStore.selectedReminder"
              class="text-center py-5"
              aria-busy="true"
              aria-label="Cargando recordatorio"
            >
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
            </div>

            <!-- Form — rendered only once the reminder is loaded -->
            <ReminderForm
              v-else-if="remindersStore.selectedReminder"
              :reminder="remindersStore.selectedReminder"
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

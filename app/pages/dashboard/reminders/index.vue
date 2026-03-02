<script setup lang="ts">
// Reminders index page — thin wrapper: sets metadata, fetches reminders + pets,
// renders ReminderList. All business logic lives in useReminders() and the stores.

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Recordatorios — Mopetoo',
  description: 'Gestiona los recordatorios de vacunas, medicinas y visitas de tus mascotas.',
  ogTitle: 'Recordatorios — Mopetoo',
  ogDescription: 'Mantén al día las vacunas, medicinas y controles de salud de tus mascotas.',
})

const { fetchReminders, deleteReminder, error } = useReminders()
const remindersStore = useRemindersStore()
const { fetchPets } = usePets()
const petsStore = usePetsStore()
const router = useRouter()

const successMessage = ref<string | null>(null)

// Fetch pets first, then reminders (sequential because fetchReminders
// without petId iterates over petsStore.pets which must be populated).
onMounted(async () => {
  await fetchPets()
  await fetchReminders()
})

async function handleDeleteReminder(id: number): Promise<void> {
  const ok = await deleteReminder(id)
  if (ok) {
    successMessage.value = 'Recordatorio eliminado correctamente.'
    setTimeout(() => { successMessage.value = null }, 4000)
  }
}

function handleEditReminder(reminder: { id: number }): void {
  router.push(`/dashboard/reminders/${reminder.id}/edit`)
}
</script>

<template>
  <div class="container py-5">
    <!-- Page header -->
    <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 mb-5">
      <div>
        <h1 class="h3 fw-bold mb-1">Recordatorios</h1>
        <p class="text-muted mb-0">Mantén al día la salud de tus mascotas</p>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <NuxtLink to="/dashboard/reminders/new" class="btn btn-primary">
          <span aria-hidden="true">+</span> Nuevo recordatorio
        </NuxtLink>
      </div>
    </div>

    <!-- Success alert -->
    <div
      v-if="successMessage"
      class="alert alert-success alert-dismissible d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span aria-hidden="true">✓</span>
      {{ successMessage }}
      <button
        type="button"
        class="btn-close ms-auto"
        aria-label="Cerrar"
        @click="successMessage = null"
      />
    </div>

    <!-- Error alert -->
    <div
      v-if="error"
      class="alert alert-danger d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span aria-hidden="true">⚠️</span>
      {{ error }}
    </div>

    <!-- Reminder list (handles loading + empty + filter states internally) -->
    <ReminderList
      :reminders="remindersStore.reminders"
      :is-loading="remindersStore.isLoading"
      :pets="petsStore.pets"
      @edit-reminder="handleEditReminder"
      @delete-reminder="handleDeleteReminder"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Editar perfil — Mopetoo',
  description: 'Actualiza la información de tu cuenta en Mopetoo.',
})
</script>

<template>
  <div class="container py-5">
    <div class="row">
      <div class="col-12 col-md-10 col-lg-8 mx-auto">
        <div class="d-flex align-items-center gap-3 mb-4">
          <NuxtLink
            to="/dashboard/profile"
            class="btn btn-outline-secondary btn-sm"
            aria-label="Volver a mi perfil"
          >
            &larr;
          </NuxtLink>
          <h1 class="h4 fw-bold mb-0">Editar perfil</h1>
        </div>

        <div class="card shadow-sm border-0">
          <div class="card-body p-4">
            <UserProfileForm />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
})

useSeoMeta({
  title: 'Recuperar contraseña — Mopetoo',
  description: 'Restablece tu contraseña de Mopetoo de forma segura.',
  ogTitle: 'Recuperar contraseña — Mopetoo',
  ogDescription: 'Restablece tu contraseña de Mopetoo de forma segura.',
})
</script>

<template>
  <div class="container py-5">
    <AuthForgotPasswordForm />
  </div>
</template>

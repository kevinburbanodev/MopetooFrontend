<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
})

useSeoMeta({
  title: 'Iniciar sesión — Mopetoo',
  description: 'Accede a tu cuenta Mopetoo y gestiona el cuidado de tus mascotas.',
  ogTitle: 'Iniciar sesión — Mopetoo',
  ogDescription: 'Accede a tu cuenta Mopetoo y gestiona el cuidado de tus mascotas.',
})
</script>

<template>
  <div class="container py-5">
    <AuthLoginForm />
  </div>
</template>

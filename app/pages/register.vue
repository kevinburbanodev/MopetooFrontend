<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
})

useSeoMeta({
  title: 'Crear cuenta — Mopetoo',
  description: 'Crea tu cuenta gratuita en Mopetoo y empieza a cuidar a tus mascotas como nunca.',
  ogTitle: 'Crear cuenta — Mopetoo',
  ogDescription: 'Crea tu cuenta gratuita en Mopetoo y empieza a cuidar a tus mascotas como nunca.',
})
</script>

<template>
  <div class="container py-5">
    <AuthRegisterForm />
  </div>
</template>

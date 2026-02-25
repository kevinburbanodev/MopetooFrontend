<script setup lang="ts">
// No guest middleware here — the link in the email will hit this page
// even for users who may still be logged in from a different device.
const route = useRoute()
// Nuxt types route.params as string | string[]; the dynamic segment
// is always a single string in this route.
const token = computed(() => {
  const raw = route.params.token
  return Array.isArray(raw) ? raw[0] : raw
})

useSeoMeta({
  title: 'Restablecer contraseña — Mopetoo',
  description: 'Crea una nueva contraseña para tu cuenta de Mopetoo.',
})
</script>

<template>
  <div class="container py-5">
    <AuthResetPasswordForm :token="token" />
  </div>
</template>

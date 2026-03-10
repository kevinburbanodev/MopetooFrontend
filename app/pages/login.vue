<script setup lang="ts">
definePageMeta({ middleware: 'guest' })
useSeoMeta({ title: 'Iniciar sesion - Mopetoo' })
</script>

<template>
  <div class="container py-5">
    <AuthLoginForm />
  </div>
</template>

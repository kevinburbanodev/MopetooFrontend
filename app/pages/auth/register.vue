<script setup lang="ts">
// Permanent redirect — the canonical register route is now /register
definePageMeta({ middleware: 'guest' })
await navigateTo('/register', { redirectCode: 301 })
</script>

<template>
  <div />
</template>

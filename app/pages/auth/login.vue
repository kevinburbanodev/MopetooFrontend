<script setup lang="ts">
// Permanent redirect — the canonical login route is now /login
// This page is kept to avoid broken links from old emails/bookmarks.
definePageMeta({ middleware: 'guest' })
await navigateTo('/login', { redirectCode: 301 })
</script>

<template>
  <div />
</template>

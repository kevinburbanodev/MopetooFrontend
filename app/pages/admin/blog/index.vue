<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

useHead({ title: 'Blog — Admin | Mopetoo' })
</script>

<template>
  <AdminBlogManager />
</template>

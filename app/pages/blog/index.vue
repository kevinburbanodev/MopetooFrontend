<script setup lang="ts">
// Blog listing page — thin wrapper.
// Public route; no auth middleware required.
// SSR delivers the first page of posts for crawlers and LCP.

definePageMeta({
  name: 'blog-list',
})

useSeoMeta({
  title: 'Blog — Mopetoo',
  description: 'Consejos, curiosidades y noticias sobre el cuidado de mascotas. Encuentra artículos sobre salud animal, adopción, nutrición y mucho más.',
  ogTitle: 'Blog — Mopetoo',
  ogDescription: 'El blog de Mopetoo: todo lo que necesitas saber para cuidar mejor a tu mascota.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="container py-5">
    <BlogList />
  </div>
</template>

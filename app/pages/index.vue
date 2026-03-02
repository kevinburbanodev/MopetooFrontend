<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
})

useHead({
  title: 'Mopetoo — Cuidá a tus mascotas como nunca',
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap',
    },
  ],
})
</script>

<template>
  <div>
    <HeroSection />
    <FeaturesSection />
    <HowItWorksSection />
    <EcosystemSection />
    <DonationsSection />
    <ProSection />
    <CtaBand />
  </div>
</template>

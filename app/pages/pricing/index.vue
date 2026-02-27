<script setup lang="ts">
// Pricing page — public, no auth required.
// Renders PricingTable + ProUpgradeModal.
// showModal is toggled by the select-plan event from PricingTable.

definePageMeta({
  name: 'pricing',
})

useSeoMeta({
  title: 'Planes y Precios — Mopetoo',
  description: 'Conoce los planes PRO de Mopetoo: desbloquea funciones avanzadas, exportación de reportes e historial ilimitado para tus mascotas.',
  ogTitle: 'Planes y Precios — Mopetoo',
  ogDescription: 'Gestiona mejor la salud de tus mascotas con Mopetoo PRO. Planes mensuales y anuales disponibles.',
  ogType: 'website',
  twitterCard: 'summary',
})

const showModal = ref(false)
const selectedPlanId = ref<string | null>(null)

function handleSelectPlan(planId: string): void {
  selectedPlanId.value = planId
  showModal.value = true
}
</script>

<template>
  <div class="container py-5">
    <PricingTable @select-plan="handleSelectPlan" />
    <ProUpgradeModal v-model="showModal" />
  </div>
</template>

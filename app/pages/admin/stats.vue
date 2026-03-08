<script setup lang="ts">
// Admin stats page — full statistics and metrics dashboard.
// Protected by admin middleware. Composes three stats components:
//   1. StatsOverview  — KPI cards from nested overview structure
//   2. StatsChart     — revenue bar chart (CSS progress bars)
//   3. RevenueReport  — tabular revenue breakdown with aggregates
//
// Revenue data is fetched here and passed as props to StatsChart
// and RevenueReport so both can share the same dataset without
// making duplicate API calls.

definePageMeta({
  name: 'admin-stats',
  layout: 'admin',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Estadísticas del Sistema — Admin Mopetoo',
  description: 'Panel de administración: estadísticas y métricas de la plataforma Mopetoo',
})

const { fetchRevenueData, revenueLoading, statsStore } = useStats()

onMounted(async () => {
  await fetchRevenueData()
})
</script>

<template>
  <div>
    <!-- Overview KPI cards (self-fetching) -->
    <div class="mb-5">
      <StatsOverview />
    </div>

    <!-- Revenue chart + table side by side -->
    <div class="row g-4 mb-5">
      <div class="col-12 col-lg-6">
        <div class="admin-glass p-4 h-100">
          <StatsChart
            :data="statsStore.revenueData"
            :is-loading="revenueLoading"
          />
        </div>
      </div>
      <div class="col-12 col-lg-6">
        <div class="admin-glass p-4 h-100">
          <RevenueReport
            :data="statsStore.revenueData"
            :stats="statsStore.revenueStats"
            :is-loading="revenueLoading"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Admin stats page — full statistics and metrics dashboard.
// Protected by admin middleware. Composes four stats components:
//   1. StatsOverview  — 10 KPI cards + revenue totals
//   2. StatsChart     — monthly revenue bar chart (CSS progress bars)
//   3. RevenueReport  — tabular monthly revenue breakdown
//   4. ActivityLog    — recent platform events feed
//
// Revenue data is fetched here and passed as props to StatsChart
// and RevenueReport so both can share the same dataset without
// making duplicate API calls.

definePageMeta({
  name: 'admin-stats',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Estadísticas del Sistema — Admin Mopetoo',
  description: 'Panel de administración: estadísticas y métricas de la plataforma Mopetoo',
})

const { fetchRevenueData, revenueLoading, statsStore } = useStats()

onMounted(async () => {
  await fetchRevenueData({ months: 6 })
})
</script>

<template>
  <div class="container py-4">
    <div class="d-flex align-items-center gap-3 mb-5">
      <NuxtLink
        to="/admin"
        class="btn btn-sm btn-link p-0 text-muted text-decoration-none"
        aria-label="Volver al panel"
      >
        &larr; Panel
      </NuxtLink>
      <h1 class="h3 fw-bold mb-0">
        <span aria-hidden="true">📊</span> Estadísticas del Sistema
      </h1>
    </div>

    <!-- Overview KPI cards (self-fetching) -->
    <div class="mb-5">
      <StatsOverview />
    </div>

    <!-- Revenue chart + table side by side -->
    <div class="row g-4 mb-5">
      <div class="col-12 col-lg-6">
        <div class="card border-0 shadow-sm p-4 h-100">
          <StatsChart
            :data="statsStore.revenueData"
            :is-loading="revenueLoading"
          />
        </div>
      </div>
      <div class="col-12 col-lg-6">
        <div class="card border-0 shadow-sm p-4 h-100">
          <RevenueReport
            :data="statsStore.revenueData"
            :is-loading="revenueLoading"
          />
        </div>
      </div>
    </div>

    <!-- Activity log (self-fetching) -->
    <div class="mb-4">
      <ActivityLog />
    </div>
  </div>
</template>

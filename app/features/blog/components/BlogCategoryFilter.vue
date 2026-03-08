<script setup lang="ts">
// BlogCategoryFilter — Stitch-style horizontal scrollable pill buttons.
// Active: emerald bg + white text. Inactive: white bg + border + hover emerald.
// Desktop scroll arrows for overflow.

const props = defineProps<{
  categories: { value: string; label: string }[]
  activeCategory: string | null
  categoryCounts?: Record<string, number>
}>()

const emit = defineEmits<{
  (e: 'select', category: string | null): void
}>()

function select(category: string | null): void {
  emit('select', category)
}

// ── Scroll arrows ──────────────────────────────────────────────
const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function updateScrollState(): void {
  const el = scrollContainer.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 2
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 2
}

function scrollBy(direction: number): void {
  scrollContainer.value?.scrollBy({ left: direction * 200, behavior: 'smooth' })
}

onMounted(() => {
  updateScrollState()
  scrollContainer.value?.addEventListener('scroll', updateScrollState, { passive: true })
})

onUnmounted(() => {
  scrollContainer.value?.removeEventListener('scroll', updateScrollState)
})
</script>

<template>
  <div class="blog-filter-wrapper">
    <!-- Left arrow -->
    <button
      v-show="canScrollLeft"
      type="button"
      class="blog-filter-arrow blog-filter-arrow--left"
      aria-label="Desplazar categorías a la izquierda"
      @click="scrollBy(-1)"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <div
      ref="scrollContainer"
      class="blog-category-filter"
      role="tablist"
      aria-label="Filtrar por categoría"
    >
      <!-- "Todos" pill -->
      <button
        type="button"
        role="tab"
        class="blog-filter-pill"
        :class="{ 'blog-filter-pill--active': activeCategory === null }"
        :aria-selected="activeCategory === null"
        @click="select(null)"
      >
        Todos
      </button>

      <!-- One pill per category -->
      <button
        v-for="cat in categories"
        :key="cat.value"
        type="button"
        role="tab"
        class="blog-filter-pill"
        :class="{ 'blog-filter-pill--active': activeCategory === cat.value }"
        :aria-selected="activeCategory === cat.value"
        @click="select(cat.value)"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- Right arrow -->
    <button
      v-show="canScrollRight"
      type="button"
      class="blog-filter-arrow blog-filter-arrow--right"
      aria-label="Desplazar categorías a la derecha"
      @click="scrollBy(1)"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </div>
</template>

<style scoped lang="scss">
.blog-filter-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.blog-filter-arrow {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: #f3f4f6;
    border-color: #10B981;
    color: #10B981;
  }

  @media (min-width: 768px) {
    display: flex;
  }
}

.blog-category-filter {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 0.25rem 0;
  flex: 1;

  &::-webkit-scrollbar {
    display: none;
  }
}

.blog-filter-pill {
  flex-shrink: 0;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  padding: 0.5em 1.25em;
  font-size: 0.875rem;
  font-weight: 500;
  background: #fff;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(.blog-filter-pill--active) {
    border-color: #10B981;
    color: #10B981;
  }

  &:focus-visible {
    outline: 2px solid #10B981;
    outline-offset: 2px;
  }

  &--active {
    background: #10B981;
    border-color: #10B981;
    color: #fff;
  }
}
</style>

<script setup lang="ts">
// BlogCategoryFilter — horizontal scrollable pill buttons for filtering
// blog posts by category. "Todos" clears the filter (emits null).
// Active state uses btn-primary; inactive uses btn-outline-secondary.

const props = defineProps<{
  categories: { value: string; label: string }[]
  /** Currently active category value, or null for "all posts" */
  activeCategory: string | null
  /** Optional map of category value → post count for badge display */
  categoryCounts?: Record<string, number>
}>()

const emit = defineEmits<{
  /** Emitted when the user selects a category. null means "Todos". */
  (e: 'select', category: string | null): void
}>()

function select(category: string | null): void {
  emit('select', category)
}
</script>

<template>
  <div class="blog-category-filter" role="tablist" aria-label="Filtrar por categoría">
    <!-- "Todos" pill -->
    <button
      type="button"
      role="tab"
      class="btn btn-sm blog-category-filter__pill"
      :class="activeCategory === null ? 'btn-primary' : 'btn-outline-secondary'"
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
      class="btn btn-sm blog-category-filter__pill"
      :class="activeCategory === cat.value ? 'btn-primary' : 'btn-outline-secondary'"
      :aria-selected="activeCategory === cat.value"
      @click="select(cat.value)"
    >
      {{ cat.label }}
      <span
        v-if="categoryCounts?.[cat.value] !== undefined"
        class="badge rounded-pill ms-1 blog-category-filter__count"
        :class="activeCategory === cat.value ? 'bg-white text-primary' : 'bg-primary-subtle text-primary-emphasis'"
        aria-hidden="true"
      >
        {{ categoryCounts[cat.value] }}
      </span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.blog-category-filter {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  overflow-x: auto;
  // Smooth scroll on touch devices; hide scrollbar while keeping functionality
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; // Firefox
  padding-bottom: 0.25rem; // room for focus ring

  &::-webkit-scrollbar {
    display: none; // Chrome / Safari
  }

  // ── Pill buttons ───────────────────────────────────────────
  &__pill {
    flex-shrink: 0; // pills never wrap — they scroll horizontally
    border-radius: var(--bs-border-radius-pill);
    font-size: 0.8125rem;
    font-weight: 500;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;

    &:focus-visible {
      outline: 2px solid var(--bs-primary);
      outline-offset: 2px;
    }
  }

  // ── Post count badge ───────────────────────────────────────
  &__count {
    font-size: 0.65rem;
    font-weight: 600;
    line-height: 1;
    vertical-align: middle;
  }
}
</style>

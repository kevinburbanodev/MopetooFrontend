<script setup lang="ts">
// BlogCategoryFilter — horizontal scrollable pill buttons for filtering
// blog posts by category. "Todos" clears the filter (emits null).
// Active state uses btn-primary; inactive uses btn-outline-secondary.

import type { BlogCategory } from '../types'

const props = defineProps<{
  categories: BlogCategory[]
  /** Currently active category slug, or null for "all posts" */
  activeCategorySlug: string | null
}>()

const emit = defineEmits<{
  /** Emitted when the user selects a category. null means "Todos". */
  (e: 'select', slug: string | null): void
}>()

function select(slug: string | null): void {
  emit('select', slug)
}
</script>

<template>
  <div class="blog-category-filter" role="tablist" aria-label="Filtrar por categoría">
    <!-- "Todos" pill -->
    <button
      type="button"
      role="tab"
      class="btn btn-sm blog-category-filter__pill"
      :class="activeCategorySlug === null ? 'btn-primary' : 'btn-outline-secondary'"
      :aria-selected="activeCategorySlug === null"
      @click="select(null)"
    >
      Todos
    </button>

    <!-- One pill per category -->
    <button
      v-for="cat in categories"
      :key="cat.id"
      type="button"
      role="tab"
      class="btn btn-sm blog-category-filter__pill"
      :class="activeCategorySlug === cat.slug ? 'btn-primary' : 'btn-outline-secondary'"
      :aria-selected="activeCategorySlug === cat.slug"
      @click="select(cat.slug)"
    >
      {{ cat.name }}
      <span
        v-if="cat.post_count !== undefined"
        class="badge rounded-pill ms-1 blog-category-filter__count"
        :class="activeCategorySlug === cat.slug ? 'bg-white text-primary' : 'bg-primary-subtle text-primary-emphasis'"
        aria-hidden="true"
      >
        {{ cat.post_count }}
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

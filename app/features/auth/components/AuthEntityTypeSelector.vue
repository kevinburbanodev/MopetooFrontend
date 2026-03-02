<script setup lang="ts">
import type { EntityType } from '../types'

const modelValue = defineModel<EntityType>({ default: 'user' })

const options: { value: EntityType; label: string; desc: string }[] = [
  { value: 'user', label: 'Usuario', desc: 'Dueño de mascotas' },
  { value: 'shelter', label: 'Refugio', desc: 'Organización de adopción' },
  { value: 'store', label: 'Tienda', desc: 'Tienda pet-friendly' },
  { value: 'clinic', label: 'Clínica', desc: 'Clínica veterinaria' },
]
</script>

<template>
  <ul class="nav nav-pills nav-fill mb-4 entity-selector" role="tablist">
    <li
      v-for="opt in options"
      :key="opt.value"
      class="nav-item"
      role="presentation"
    >
      <button
        class="nav-link py-2 px-1"
        :class="{ active: modelValue === opt.value }"
        type="button"
        role="tab"
        :aria-selected="modelValue === opt.value"
        :title="opt.desc"
        @click="modelValue = opt.value"
      >
        <span class="d-block fw-semibold small">{{ opt.label }}</span>
        <span class="d-none d-sm-block text-muted entity-selector__desc">{{ opt.desc }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped lang="scss">
.entity-selector {
  gap: 0.25rem;

  .nav-link {
    border-radius: var(--bs-border-radius);
    border: 1px solid var(--bs-border-color);
    transition: all 0.15s ease;

    &:not(.active) {
      color: var(--bs-body-color);
      background-color: transparent;

      &:hover {
        background-color: var(--bs-light);
      }
    }
  }

  &__desc {
    font-size: 0.7rem;
    line-height: 1.2;
  }
}
</style>

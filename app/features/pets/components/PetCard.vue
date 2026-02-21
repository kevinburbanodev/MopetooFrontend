<script setup lang="ts">
import type { Pet } from '../types'

const props = defineProps<{
  pet: Pet
}>()

const emit = defineEmits<{
  select: [pet: Pet]
  delete: [id: number]
}>()

const speciesEmoji: Record<string, string> = {
  perro: '🐶',
  gato: '🐱',
  conejo: '🐰',
  ave: '🐦',
  pez: '🐟',
  reptil: '🦎',
}

const emoji = computed(() =>
  speciesEmoji[props.pet.species.toLowerCase()] ?? '🐾',
)
</script>

<template>
  <div class="card h-100 shadow-sm border-0 pet-card" @click="emit('select', pet)">
    <!-- Pet photo -->
    <div class="card-img-wrapper position-relative">
      <img
        :src="pet.photo_url"
        :alt="`Foto de ${pet.name}`"
        class="card-img-top pet-photo"
      />
      <span class="badge bg-primary position-absolute top-0 end-0 m-2">
        {{ emoji }} {{ pet.species }}
      </span>
    </div>

    <div class="card-body">
      <h5 class="card-title fw-bold mb-1">{{ pet.name }}</h5>
      <p v-if="pet.breed" class="card-text text-muted small mb-2">{{ pet.breed }}</p>

      <div class="d-flex gap-3 small text-muted">
        <span v-if="pet.age">🎂 {{ pet.age }} años</span>
        <span v-if="pet.weight">⚖️ {{ pet.weight }} kg</span>
        <span v-if="pet.gender">{{ pet.gender === 'macho' ? '♂️' : '♀️' }} {{ pet.gender }}</span>
      </div>

      <p v-if="pet.notes" class="card-text small text-muted mt-2 mb-0 text-truncate">
        {{ pet.notes }}
      </p>
    </div>

    <div class="card-footer bg-transparent border-0 pt-0 d-flex gap-2">
      <button
        class="btn btn-sm btn-outline-primary flex-fill"
        @click.stop="emit('select', pet)"
      >
        Ver detalle
      </button>
      <button
        class="btn btn-sm btn-outline-danger"
        aria-label="Eliminar mascota"
        @click.stop="emit('delete', pet.id)"
      >
        🗑️
      </button>
    </div>
  </div>
</template>

<style scoped>
.pet-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.pet-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}
.pet-photo {
  height: 200px;
  object-fit: cover;
}
</style>

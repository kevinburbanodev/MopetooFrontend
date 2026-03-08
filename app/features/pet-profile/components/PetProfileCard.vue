<script setup lang="ts">
import type { Pet, PetPhoto } from '../types'

const props = defineProps<{
  pet: Pet
  photos: PetPhoto[]
}>()

const cdnBase = useRuntimeConfig().public.cdnBase as string

function photoUrl(url: string): string {
  if (url.startsWith('http')) return url
  return cdnBase ? `${cdnBase}/${url}` : url
}

const sortedPhotos = computed(() =>
  [...props.photos].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  }),
)

const activePhoto = ref(0)

const petAge = computed(() => {
  if (!props.pet.birth_date) return null
  const birth = new Date(props.pet.birth_date)
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const months = now.getMonth() - birth.getMonth()
  const totalMonths = years * 12 + months
  if (totalMonths < 1) return 'Cachorro'
  if (totalMonths < 12) return `${totalMonths} ${totalMonths === 1 ? 'mes' : 'meses'}`
  const y = Math.floor(totalMonths / 12)
  const m = totalMonths % 12
  const yearStr = `${y} ${y === 1 ? 'ano' : 'anos'}`
  return m > 0 ? `${yearStr} y ${m} ${m === 1 ? 'mes' : 'meses'}` : yearStr
})

const speciesEmoji = computed(() => {
  switch (props.pet.species.toLowerCase()) {
    case 'perro': case 'dog': return '🐕'
    case 'gato': case 'cat': return '🐈'
    case 'ave': case 'bird': return '🐦'
    case 'pez': case 'fish': return '🐟'
    case 'conejo': case 'rabbit': return '🐇'
    default: return '🐾'
  }
})
</script>

<template>
  <div class="pet-profile">
    <!-- Photo gallery -->
    <div class="pet-profile__gallery">
      <div class="pet-profile__main-photo">
        <img
          v-if="sortedPhotos.length > 0"
          :src="photoUrl(sortedPhotos[activePhoto]?.photo_url ?? pet.photo_url)"
          :alt="`Foto de ${pet.name}`"
          class="pet-profile__img"
        />
        <img
          v-else
          :src="photoUrl(pet.photo_url)"
          :alt="`Foto de ${pet.name}`"
          class="pet-profile__img"
        />
      </div>
      <div v-if="sortedPhotos.length > 1" class="pet-profile__thumbs">
        <button
          v-for="(photo, i) in sortedPhotos"
          :key="photo.id"
          class="pet-profile__thumb"
          :class="{ 'pet-profile__thumb--active': activePhoto === i }"
          type="button"
          :aria-label="`Ver foto ${i + 1}`"
          @click="activePhoto = i"
        >
          <img :src="photoUrl(photo.photo_url)" :alt="`Foto ${i + 1} de ${pet.name}`" />
        </button>
      </div>
    </div>

    <!-- Info card -->
    <div class="pet-profile__info">
      <div class="pet-profile__header">
        <span class="pet-profile__emoji" aria-hidden="true">{{ speciesEmoji }}</span>
        <h1 class="pet-profile__name">{{ pet.name }}</h1>
      </div>

      <div class="pet-profile__details">
        <div class="pet-profile__detail">
          <span class="pet-profile__label">Especie</span>
          <span class="pet-profile__value">{{ pet.species }}</span>
        </div>
        <div v-if="pet.breed" class="pet-profile__detail">
          <span class="pet-profile__label">Raza</span>
          <span class="pet-profile__value">{{ pet.breed }}</span>
        </div>
        <div v-if="petAge" class="pet-profile__detail">
          <span class="pet-profile__label">Edad</span>
          <span class="pet-profile__value">{{ petAge }}</span>
        </div>
        <div v-if="pet.weight" class="pet-profile__detail">
          <span class="pet-profile__label">Peso</span>
          <span class="pet-profile__value">{{ pet.weight }} kg</span>
        </div>
        <div v-if="pet.gender" class="pet-profile__detail">
          <span class="pet-profile__label">Genero</span>
          <span class="pet-profile__value">{{ pet.gender }}</span>
        </div>
      </div>

      <!-- Contact message -->
      <div v-if="pet.public_contact_message" class="pet-profile__contact">
        <p class="pet-profile__contact-text">{{ pet.public_contact_message }}</p>
      </div>

      <!-- Notes -->
      <div v-if="pet.notes" class="pet-profile__notes">
        <h2 class="pet-profile__subtitle">Notas</h2>
        <p>{{ pet.notes }}</p>
      </div>
    </div>

    <!-- Mopetoo branding -->
    <div class="pet-profile__branding">
      <NuxtLink to="/" class="pet-profile__brand-link">
        <span aria-hidden="true">🐾</span>
        Mopetoo
      </NuxtLink>
      <p class="pet-profile__brand-tagline">Cuida a tu mascota con amor</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.pet-profile {
  max-width: 480px;
  margin: 0 auto;

  &__gallery {
    margin-bottom: 1.5rem;
  }

  &__main-photo {
    border-radius: 1rem;
    overflow: hidden;
    aspect-ratio: 4 / 3;
    background: var(--bs-light);
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__thumbs {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }

  &__thumb {
    flex-shrink: 0;
    width: 56px;
    height: 56px;
    border-radius: 0.5rem;
    overflow: hidden;
    border: 2px solid transparent;
    padding: 0;
    cursor: pointer;
    background: none;
    transition: border-color 0.15s ease;

    &--active {
      border-color: var(--bs-primary);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__info {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    margin-bottom: 1.5rem;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  &__emoji {
    font-size: 2rem;
    line-height: 1;
  }

  &__name {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    color: var(--bs-dark);
  }

  &__details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  &__detail {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  &__label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--bs-secondary);
    font-weight: 600;
  }

  &__value {
    font-size: 0.95rem;
    color: var(--bs-dark);
    font-weight: 500;
  }

  &__contact {
    margin-top: 1.25rem;
    padding: 1rem;
    background: #f0fdf4;
    border-radius: 0.75rem;
    border-left: 3px solid #4caf82;
  }

  &__contact-text {
    margin: 0;
    color: #1e2a38;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  &__notes {
    margin-top: 1.25rem;
    font-size: 0.9rem;
    color: var(--bs-body-color);

    p {
      margin: 0;
      line-height: 1.6;
    }
  }

  &__subtitle {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--bs-secondary);
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  &__branding {
    text-align: center;
    padding: 1.5rem 0;
  }

  &__brand-link {
    font-family: 'Fraunces', Georgia, serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--bs-dark);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__brand-tagline {
    font-size: 0.8rem;
    color: var(--bs-secondary);
    margin: 0.25rem 0 0;
  }
}
</style>

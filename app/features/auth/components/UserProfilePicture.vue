<script setup lang="ts">
// UserProfilePicture — displays the current profile photo with an overlay
// trigger to replace it. Emits the selected File to the parent so it can
// be passed to updateProfile() alongside other form data.

const props = defineProps<{
  /** Absolute URL of the current profile picture, or undefined for placeholder */
  src?: string
  /** Full name used for the img alt text */
  name?: string
}>()

const emit = defineEmits<{
  'update:photo': [file: File]
}>()

// Local preview replaces the remote src while the user has chosen a new file
// but hasn't saved yet. We manage the object URL lifecycle here.
const localPreviewUrl = ref<string | null>(null)
const inputRef = useTemplateRef<HTMLInputElement>('photoInput')

const displaySrc = computed(() => localPreviewUrl.value ?? props.src ?? null)
const altText = computed(() =>
  props.name ? `Foto de perfil de ${props.name}` : 'Foto de perfil',
)

function triggerInput(): void {
  inputRef.value?.click()
}

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Revoke previous local preview to avoid memory leak
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value)
  }

  localPreviewUrl.value = URL.createObjectURL(file)
  emit('update:photo', file)
}

onUnmounted(() => {
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value)
  }
})
</script>

<template>
  <div class="profile-picture">
    <div class="profile-picture__avatar" @click="triggerInput">
      <img
        v-if="displaySrc"
        :src="displaySrc"
        :alt="altText"
        class="profile-picture__img"
      />
      <span
        v-else
        class="profile-picture__placeholder"
        aria-hidden="true"
      >
        {{ name ? name.charAt(0).toUpperCase() : '?' }}
      </span>

      <!-- Hover overlay -->
      <div class="profile-picture__overlay" aria-hidden="true">
        <span class="profile-picture__overlay-text">Cambiar foto</span>
      </div>
    </div>

    <!-- Accessible trigger button -->
    <button
      type="button"
      class="btn btn-outline-secondary btn-sm mt-2 d-block mx-auto"
      @click="triggerInput"
    >
      {{ displaySrc ? 'Cambiar foto' : 'Agregar foto' }}
    </button>

    <!-- Hidden file input -->
    <input
      ref="photoInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="visually-hidden"
      aria-label="Seleccionar foto de perfil"
      tabindex="-1"
      @change="onFileChange"
    />
  </div>
</template>

<style scoped lang="scss">
.profile-picture {
  display: inline-block;
  text-align: center;

  &__avatar {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    border: 3px solid var(--bs-border-color);
    transition: border-color 0.2s ease;

    &:hover {
      border-color: var(--bs-primary);

      .profile-picture__overlay {
        opacity: 1;
      }
    }
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__placeholder {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    background-color: var(--bs-secondary-bg);
    color: var(--bs-secondary-color);
    font-size: 2.25rem;
    font-weight: 700;
    user-select: none;
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
    border-radius: 50%;
  }

  &__overlay-text {
    color: #fff;
    font-size: 0.75rem;
    font-weight: 600;
    text-align: center;
    padding: 0 0.5rem;
  }
}
</style>

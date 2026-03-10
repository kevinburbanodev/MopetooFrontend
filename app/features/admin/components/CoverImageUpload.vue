<script setup lang="ts">
const props = defineProps<{
  currentImageUrl?: string
}>()

const emit = defineEmits<{
  'file-selected': [file: File]
}>()

const previewUrl = ref<string | null>(null)
const errorMsg = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

const displayUrl = computed(() => previewUrl.value ?? props.currentImageUrl ?? null)

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  errorMsg.value = null

  if (!ALLOWED_TYPES.includes(file.type)) {
    errorMsg.value = 'Solo se permiten imágenes JPEG, PNG o WebP.'
    input.value = ''
    return
  }

  if (file.size > MAX_SIZE) {
    errorMsg.value = 'La imagen no debe superar los 5 MB.'
    input.value = ''
    return
  }

  // Revoke previous blob URL to avoid memory leaks
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = URL.createObjectURL(file)
  emit('file-selected', file)
}

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<template>
  <div class="cover-upload">
    <div v-if="displayUrl" class="cover-upload__preview mb-2">
      <img :src="displayUrl" alt="Preview de imagen de portada" class="cover-upload__image" />
    </div>

    <div v-if="errorMsg" class="text-danger small mb-2">{{ errorMsg }}</div>

    <label class="btn btn-sm btn-outline-primary">
      {{ displayUrl ? 'Cambiar imagen' : 'Seleccionar imagen' }}
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="d-none"
        @change="onFileChange"
      />
    </label>
    <div class="form-text">JPEG, PNG o WebP. Máximo 5 MB.</div>
  </div>
</template>

<style scoped lang="scss">
.cover-upload {
  &__preview {
    border-radius: 0.5rem;
    overflow: hidden;
    max-height: 240px;
    background: #f3f4f6;
  }

  &__image {
    width: 100%;
    max-height: 240px;
    object-fit: cover;
    display: block;
  }
}
</style>

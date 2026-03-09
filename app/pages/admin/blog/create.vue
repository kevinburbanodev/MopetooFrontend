<script setup lang="ts">
import { BLOG_CATEGORIES } from '~/features/blog/types'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

useHead({ title: 'Nuevo artículo — Admin | Mopetoo' })

const { createPost, uploadCoverImage, error } = useAdminBlog()

const form = reactive({
  title: '',
  slug: '',
  category: '' as string,
  content: '',
})

const coverFile = ref<File | null>(null)
const submitting = ref(false)

function generateSlug(): void {
  form.slug = form.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

watch(() => form.title, generateSlug)

function onCoverSelected(file: File): void {
  coverFile.value = file
}

async function handleSubmit(): Promise<void> {
  if (!form.title || !form.slug || !form.category || !form.content) return
  submitting.value = true

  const post = await createPost({
    title: form.title,
    slug: form.slug,
    category: form.category,
    content: form.content,
  })

  if (post && coverFile.value) {
    await uploadCoverImage(post.id, coverFile.value)
  }

  submitting.value = false
  if (post) {
    navigateTo({ path: '/admin/blog', query: { success: 'Artículo creado exitosamente' } })
  }
}
</script>

<template>
  <section aria-label="Crear artículo del blog">
    <div class="d-flex align-items-center gap-3 mb-4">
      <NuxtLink to="/admin/blog" class="btn btn-sm btn-outline-secondary">
        &larr; Volver
      </NuxtLink>
      <h2 class="mb-0" style="font-size: 1.1rem;">Nuevo artículo</h2>
    </div>

    <div v-if="error" class="alert alert-danger mb-4" role="alert">{{ error }}</div>

    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div class="mb-3">
            <label for="post-title" class="form-label">Título</label>
            <input
              id="post-title"
              v-model="form.title"
              type="text"
              class="form-control"
              required
            />
          </div>

          <div class="mb-3">
            <label for="post-slug" class="form-label">Slug</label>
            <input
              id="post-slug"
              v-model="form.slug"
              type="text"
              class="form-control"
              required
            />
            <div class="form-text">Se genera automáticamente a partir del título.</div>
          </div>

          <div class="mb-3">
            <label for="post-category" class="form-label">Categoría</label>
            <select
              id="post-category"
              v-model="form.category"
              class="form-select"
              required
            >
              <option value="" disabled>Seleccionar categoría</option>
              <option v-for="cat in BLOG_CATEGORIES" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">Imagen de portada</label>
            <CoverImageUpload @file-selected="onCoverSelected" />
          </div>

          <div class="mb-4">
            <label class="form-label">Contenido</label>
            <BlogEditor v-model="form.content" />
          </div>

          <div class="d-flex gap-2">
            <button
              type="submit"
              class="btn admin-btn admin-btn--primary"
              :disabled="submitting"
            >
              {{ submitting ? 'Guardando...' : 'Crear artículo' }}
            </button>
            <NuxtLink to="/admin/blog" class="btn btn-outline-secondary">
              Cancelar
            </NuxtLink>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { BLOG_CATEGORIES } from '~/features/blog/types'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

useHead({ title: 'Editar artículo — Admin | Mopetoo' })

const route = useRoute()
const postId = Number(route.params.id)

const { fetchPostById, updatePost, uploadCoverImage, error } = useAdminBlog()

const form = reactive({
  title: '',
  slug: '',
  category: '' as string,
  content: '',
})

const currentCoverUrl = ref('')
const coverFile = ref<File | null>(null)
const loading = ref(true)
const submitting = ref(false)

onMounted(async () => {
  const post = await fetchPostById(postId)
  if (post) {
    form.title = post.title
    form.slug = post.slug
    form.category = post.category
    form.content = post.content
    currentCoverUrl.value = post.cover_image_url ?? ''
  }
  loading.value = false
})

function onCoverSelected(file: File): void {
  coverFile.value = file
}

async function handleSubmit(): Promise<void> {
  if (!form.title || !form.slug || !form.category || !form.content) return
  submitting.value = true

  const post = await updatePost(postId, {
    title: form.title,
    slug: form.slug,
    category: form.category,
    content: form.content,
    cover_image_url: currentCoverUrl.value || undefined,
  })

  if (post && coverFile.value) {
    await uploadCoverImage(post.id, coverFile.value)
  }

  submitting.value = false
  if (post) {
    navigateTo({ path: '/admin/blog', query: { success: 'Artículo actualizado exitosamente' } })
  }
}
</script>

<template>
  <section aria-label="Editar artículo del blog">
    <div class="d-flex align-items-center gap-3 mb-4">
      <NuxtLink to="/admin/blog" class="btn btn-sm btn-outline-secondary">
        &larr; Volver
      </NuxtLink>
      <h2 class="mb-0" style="font-size: 1.1rem;">Editar artículo</h2>
    </div>

    <div v-if="error" class="alert alert-danger mb-4" role="alert">{{ error }}</div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <div v-else class="card border-0 shadow-sm">
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
            <CoverImageUpload
              :current-image-url="currentCoverUrl"
              @file-selected="onCoverSelected"
            />
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
              {{ submitting ? 'Guardando...' : 'Guardar cambios' }}
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

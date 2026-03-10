<script setup lang="ts">
// AdminBlogManager — blog post management table for admin panel.
// Supports list all posts (published + drafts), publish/unpublish toggle,
// delete with confirmation, and navigation to create/edit pages.

import { BLOG_CATEGORIES } from '../../blog/types'

const { posts, isLoading, error, fetchAllPosts, deletePost, togglePublish } = useAdminBlog()

const route = useRoute()
const successMessage = ref<string | null>(
  typeof route.query.success === 'string' ? route.query.success : null,
)

const filterCategory = ref('')
const deleteConfirmId = ref<number | null>(null)

async function loadPosts(): Promise<void> {
  await fetchAllPosts(filterCategory.value || undefined)
}

async function handleDelete(id: number): Promise<void> {
  if (deleteConfirmId.value !== id) {
    deleteConfirmId.value = id
    return
  }
  await deletePost(id)
  deleteConfirmId.value = null
}

function cancelDelete(): void {
  deleteConfirmId.value = null
}

async function handleTogglePublish(id: number, currentlyPublished: boolean): Promise<void> {
  await togglePublish(id, !currentlyPublished)
}

const dateFormatter = new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' })

function formatDate(dateString?: string): string {
  if (!dateString) return '—'
  try {
    return dateFormatter.format(new Date(dateString))
  }
  catch {
    return dateString
  }
}

function categoryLabel(value: string): string {
  return BLOG_CATEGORIES.find(c => c.value === value)?.label ?? value
}

watch(filterCategory, () => {
  loadPosts()
})

onMounted(async () => {
  await loadPosts()
})
</script>

<template>
  <section aria-label="Gestión del blog">
    <div class="d-flex flex-wrap align-items-center gap-3 mb-4">
      <!-- Category filter -->
      <div style="min-width: 160px;">
        <label for="blog-category-filter" class="visually-hidden">Filtrar por categoría</label>
        <select
          id="blog-category-filter"
          v-model="filterCategory"
          class="form-select form-select-sm"
        >
          <option value="">Todas las categorías</option>
          <option v-for="cat in BLOG_CATEGORIES" :key="cat.value" :value="cat.value">
            {{ cat.label }}
          </option>
        </select>
      </div>

      <!-- Create button -->
      <NuxtLink
        to="/admin/blog/create"
        class="btn btn-sm admin-btn admin-btn--primary ms-auto"
      >
        <span class="material-symbols-outlined" style="font-size: 1rem; vertical-align: middle;" aria-hidden="true">add</span>
        Nuevo artículo
      </NuxtLink>

      <!-- Result count -->
      <span class="text-muted small" role="status" aria-live="polite">
        {{ posts.length }} artículo{{ posts.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Success alert -->
    <div
      v-if="successMessage"
      class="alert alert-success d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span class="material-symbols-outlined" style="font-size: 1.1rem;" aria-hidden="true">check_circle</span>
      {{ successMessage }}
      <button type="button" class="btn-close ms-auto" aria-label="Cerrar" @click="successMessage = null" />
    </div>

    <!-- Error alert -->
    <div
      v-if="error"
      class="alert alert-danger d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span class="material-symbols-outlined" style="font-size: 1.1rem;" aria-hidden="true">warning</span>
      {{ error }}
    </div>

    <!-- Table -->
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col">Título</th>
              <th scope="col">Categoría</th>
              <th scope="col" class="text-center">Estado</th>
              <th scope="col">Fecha</th>
              <th scope="col" class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <!-- Skeleton rows -->
            <template v-if="isLoading">
              <tr v-for="n in 5" :key="`skel-${n}`" aria-hidden="true">
                <td><div class="skeleton-pulse rounded" style="height: 0.875rem; width: 200px;" /></td>
                <td><div class="skeleton-pulse rounded" style="height: 1.25rem; width: 5rem; border-radius: 1rem !important;" /></td>
                <td class="text-center"><div class="skeleton-pulse rounded mx-auto" style="height: 1.25rem; width: 4rem; border-radius: 1rem !important;" /></td>
                <td><div class="skeleton-pulse rounded" style="height: 0.875rem; width: 70px;" /></td>
                <td><div class="skeleton-pulse rounded ms-auto" style="height: 2rem; width: 200px;" /></td>
              </tr>
            </template>

            <!-- Data rows -->
            <template v-else-if="posts.length > 0">
              <tr v-for="post in posts" :key="post.id">
                <td class="fw-semibold">{{ post.title }}</td>
                <td>
                  <span class="badge bg-info">{{ categoryLabel(post.category) }}</span>
                </td>
                <td class="text-center">
                  <span
                    v-if="post.published"
                    class="badge bg-success"
                    aria-label="Publicado"
                  >
                    Publicado
                  </span>
                  <span
                    v-else
                    class="badge bg-secondary"
                    aria-label="Borrador"
                  >
                    Borrador
                  </span>
                </td>
                <td class="text-muted small">{{ formatDate(post.published_at ?? post.created_at) }}</td>
                <td class="text-end">
                  <div class="d-flex justify-content-end gap-1 flex-wrap">
                    <!-- Edit -->
                    <NuxtLink
                      :to="`/admin/blog/${post.id}/edit`"
                      class="btn btn-sm btn-outline-primary"
                      :aria-label="`Editar ${post.title}`"
                    >
                      Editar
                    </NuxtLink>
                    <!-- Publish/Unpublish -->
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="post.published ? 'btn-outline-warning' : 'btn-outline-success'"
                      :aria-label="post.published ? `Despublicar ${post.title}` : `Publicar ${post.title}`"
                      @click="handleTogglePublish(post.id, post.published)"
                    >
                      {{ post.published ? 'Despublicar' : 'Publicar' }}
                    </button>
                    <!-- Delete -->
                    <button
                      v-if="deleteConfirmId !== post.id"
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      :aria-label="`Eliminar ${post.title}`"
                      @click="handleDelete(post.id)"
                    >
                      Eliminar
                    </button>
                    <template v-else>
                      <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        @click="handleDelete(post.id)"
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        @click="cancelDelete"
                      >
                        Cancelar
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-else>
              <td colspan="5" class="text-center py-5 text-muted">
                <span class="material-symbols-outlined" style="font-size: 2rem;" aria-hidden="true">article</span>
                <div class="mt-2">No hay artículos del blog.</div>
                <NuxtLink to="/admin/blog/create" class="btn btn-sm admin-btn admin-btn--primary mt-3">
                  Crear primer artículo
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

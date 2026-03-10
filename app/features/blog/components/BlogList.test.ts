// ============================================================
// BlogList.test.ts
// Tests for the BlogList component (Stitch redesign).
//
// Key design changes from redesign:
//   - Hero featured article: first post is displayed as a hero, grid shows the rest.
//   - 4-column grid (col-12 col-md-6 col-xl-3).
//   - SKELETON_COUNT=8.
//   - Search input is custom (no Bootstrap input-group), aria-label changed.
//   - "Limpiar" button now uses aria-label="Limpiar busqueda".
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import BlogList from './BlogList.vue'
import type { BlogPost } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeBlogPost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: 1,
    slug: 'cuidado-perros',
    title: 'Cuidado de perros en verano',
    content: 'Párrafo uno.\nPárrafo dos.',
    cover_image_url: 'https://example.com/image.jpg',
    category: 'salud',
    published: true,
    published_at: '2025-06-15T10:00:00Z',
    created_at: '2025-06-15T10:00:00Z',
    updated_at: '2025-06-15T10:00:00Z',
    ...overrides,
  }
}

const postA = makeBlogPost({ id: 1, title: 'Cuidado de perros en verano', category: 'salud' })
const postB = makeBlogPost({ id: 2, slug: 'nutricion-gatos', title: 'Nutrición para gatos', content: 'Todo sobre la dieta felina.', category: 'nutricion' })
const postC = makeBlogPost({ id: 3, slug: 'vacunas-mascotas', title: 'Vacunas para mascotas', category: 'cuidados' })

// ── Stubs ─────────────────────────────────────────────────────

const BlogCardStub = { template: '<div class="blog-card-stub" />' }
const BlogCategoryFilterStub = { template: '<div class="blog-category-filter-stub" />' }

// ── useBlog mock ──────────────────────────────────────────────

const mockFetchPosts = vi.fn()
const mockError = ref<string | null>(null)
const mockPosts = ref<BlogPost[]>([])
const mockIsLoading = ref(false)

vi.mock('../composables/useBlog', () => ({
  useBlog: () => ({
    fetchPosts: mockFetchPosts,
    error: mockError,
    blogStore: {
      get posts() { return mockPosts.value },
      get isLoading() { return mockIsLoading.value },
      get hasPosts() { return mockPosts.value.length > 0 },
    },
  }),
}))

// ── Suite ─────────────────────────────────────────────────────

describe('BlogList', () => {
  beforeEach(() => {
    mockFetchPosts.mockReset()
    mockFetchPosts.mockResolvedValue(undefined)
    mockError.value = null
    mockPosts.value = []
    mockIsLoading.value = false
  })

  // ── On mount ───────────────────────────────────────────────

  describe('on mount', () => {
    it('calls fetchPosts on mount', async () => {
      await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })
      expect(mockFetchPosts).toHaveBeenCalledOnce()
    })

    it('does NOT call fetchCategories (no categories endpoint)', async () => {
      await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })
      expect(mockFetchPosts).toHaveBeenCalledOnce()
    })
  })

  // ── BlogCategoryFilter visibility ──────────────────────────

  describe('BlogCategoryFilter visibility', () => {
    it('always renders BlogCategoryFilter (hardcoded categories)', async () => {
      mockPosts.value = []

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.find('.blog-category-filter-stub').exists()).toBe(true)
    })

    it('renders BlogCategoryFilter when posts are loaded', async () => {
      mockPosts.value = [postA]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.find('.blog-category-filter-stub').exists()).toBe(true)
    })
  })

  // ── Loading skeleton ───────────────────────────────────────

  describe('loading skeleton', () => {
    it('renders 8 skeleton cards when isLoading=true and no posts are loaded', async () => {
      mockIsLoading.value = true
      mockPosts.value = []

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      const skeletonCards = wrapper.findAll('.blog-skeleton')
      expect(skeletonCards).toHaveLength(8)
    })

    it('renders the skeleton container with aria-busy="true"', async () => {
      mockIsLoading.value = true
      mockPosts.value = []

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      const skeletonContainer = wrapper.find('[aria-busy="true"]')
      expect(skeletonContainer.exists()).toBe(true)
    })

    it('does NOT render the empty state when loading', async () => {
      mockIsLoading.value = true
      mockPosts.value = []

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.text()).not.toContain('El blog esta en construccion')
    })

    it('does NOT render BlogCard components when loading', async () => {
      mockIsLoading.value = true
      mockPosts.value = []

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.findAll('.blog-card-stub')).toHaveLength(0)
    })
  })

  // ── Empty state ────────────────────────────────────────────

  describe('empty state (no posts)', () => {
    it('renders "El blog esta en construccion" when isLoading=false and posts=[]', async () => {
      mockIsLoading.value = false
      mockPosts.value = []

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.text()).toContain('El blog esta en construccion')
    })

    it('does NOT render skeleton when loading is false and posts are empty', async () => {
      mockIsLoading.value = false
      mockPosts.value = []

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    })

    it('does NOT render BlogCard components in empty state', async () => {
      mockIsLoading.value = false
      mockPosts.value = []

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.findAll('.blog-card-stub')).toHaveLength(0)
    })
  })

  // ── Posts loaded ───────────────────────────────────────────

  describe('posts loaded', () => {
    it('renders BlogCards for grid posts (all except hero) when posts are loaded', async () => {
      mockPosts.value = [postA, postB, postC]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      // First post is hero, remaining 2 are grid cards
      expect(wrapper.findAll('.blog-card-stub')).toHaveLength(2)
    })

    it('renders hero section with first post title', async () => {
      mockPosts.value = [postA, postB, postC]

      const NuxtLinkStub = { template: '<a :href="to"><slot /></a>', props: ['to'] }
      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: NuxtLinkStub, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.find('.blog-hero').exists()).toBe(true)
      expect(wrapper.find('.blog-hero__title').text()).toContain('Cuidado de perros en verano')
    })

    it('renders result count text (plural) when multiple posts are loaded', async () => {
      mockPosts.value = [postA, postB, postC]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.text()).toContain('3 articulos encontrados')
    })

    it('renders result count text (singular) when exactly one post is loaded', async () => {
      mockPosts.value = [postA]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.text()).toContain('1 articulo encontrado')
    })

    it('does NOT render empty state when posts are loaded', async () => {
      mockPosts.value = [postA]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.text()).not.toContain('El blog esta en construccion')
    })
  })

  // ── Client-side search ─────────────────────────────────────

  describe('client-side search', () => {
    it('shows all grid posts when search query is empty', async () => {
      mockPosts.value = [postA, postB, postC]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      // 3 posts total: 1 hero + 2 grid cards
      expect(wrapper.findAll('.blog-card-stub')).toHaveLength(2)
    })

    it('filters posts by title match (case-insensitive)', async () => {
      mockPosts.value = [postA, postB, postC]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      await wrapper.find('input[type="search"]').setValue('nutrición para gatos')

      // Only 1 post matches — it becomes the hero, no grid cards
      expect(wrapper.findAll('.blog-card-stub')).toHaveLength(0)
      expect(wrapper.find('.blog-hero').exists()).toBe(true)
    })

    it('filters posts by content match', async () => {
      mockPosts.value = [postA, postB, postC]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      await wrapper.find('input[type="search"]').setValue('dieta felina')

      // Only 1 post matches — hero only
      expect(wrapper.findAll('.blog-card-stub')).toHaveLength(0)
      expect(wrapper.find('.blog-hero').exists()).toBe(true)
    })

    it('shows "Sin resultados" empty state when search returns 0 matches', async () => {
      mockPosts.value = [postA, postB, postC]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      await wrapper.find('input[type="search"]').setValue('xyzzy_inexistente')

      expect(wrapper.text()).toContain('Sin resultados')
    })

    it('does NOT show "Sin resultados" state when results are found', async () => {
      mockPosts.value = [postA, postB]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      await wrapper.find('input[type="search"]').setValue('perros')

      expect(wrapper.text()).not.toContain('Sin resultados')
    })
  })

  // ── "Limpiar" search button ────────────────────────────────

  describe('"Limpiar" search button', () => {
    it('shows the clear button when search query is not empty', async () => {
      mockPosts.value = [postA]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      await wrapper.find('input[type="search"]').setValue('perros')

      const clearBtn = wrapper.find('button[aria-label="Limpiar busqueda"]')
      expect(clearBtn.exists()).toBe(true)
    })

    it('does NOT show the clear button when search query is empty', async () => {
      mockPosts.value = [postA]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      const clearBtn = wrapper.find('button[aria-label="Limpiar busqueda"]')
      expect(clearBtn.exists()).toBe(false)
    })

    it('clicking clear button clears the search query and shows all posts again', async () => {
      mockPosts.value = [postA, postB, postC]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      await wrapper.find('input[type="search"]').setValue('xyzzy_inexistente')
      expect(wrapper.findAll('.blog-card-stub')).toHaveLength(0)

      await wrapper.find('button[aria-label="Limpiar busqueda"]').trigger('click')

      // After clearing, hero + 2 grid cards
      expect(wrapper.findAll('.blog-card-stub')).toHaveLength(2)
    })
  })

  // ── Error alert ────────────────────────────────────────────

  describe('error alert', () => {
    it('renders error alert when error ref is non-null', async () => {
      mockError.value = 'No se pudieron cargar los artículos'

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      const alert = wrapper.find('[role="alert"]')
      expect(alert.exists()).toBe(true)
      expect(alert.text()).toContain('No se pudieron cargar los artículos')
    })

    it('does NOT render error alert when error is null', async () => {
      mockError.value = null
      mockPosts.value = [postA]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })

  // ── Accessibility ──────────────────────────────────────────

  describe('accessibility', () => {
    it('section has aria-label "Artículos del blog"', async () => {
      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      const section = wrapper.find('section')
      expect(section.attributes('aria-label')).toContain('del blog')
    })

    it('search input has aria-label for searching articles', async () => {
      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      const input = wrapper.find('input[type="search"]')
      expect(input.exists()).toBe(true)
      expect(input.attributes('aria-label')).toBeTruthy()
    })
  })
})

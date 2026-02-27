// ============================================================
// BlogList.test.ts
// Tests for the BlogList component.
//
// Strategy: mountSuspended resolves Nuxt auto-imports. The component
// calls useBlog() which internally calls useApi() and useBlogStore().
// We mock useBlog at the composable boundary so we can control
// the store state and stub fetchPosts / fetchCategories without
// making HTTP calls.
//
// Key design points:
//   - On mount, fetchCategories() and fetchPosts() are called in parallel.
//   - While isLoading is true and no posts exist: skeleton cards (SKELETON_COUNT=6).
//   - When posts are empty post-load: "El blog está en construcción" empty state.
//   - When posts are loaded: BlogCard per post + result count.
//   - Client-side search filters on title, excerpt, author name, tag.
//   - "Cargar más" button shown only when currentPage < totalPages and no search active.
//   - BlogCategoryFilter shown only when hasCategories is true.
//   - Error alert shown when error ref is non-null.
//   - "Limpiar" button in search input clears the query.
//
// Mocking:
//   - useBlog is mocked via vi.mock (project composable, not a Nuxt auto-import).
//   - The mock exposes reactive refs and store state the component reads directly.
//
// Stub naming:
//   - Vue Test Utils creates lowercase hyphenated element names from PascalCase stubs.
//     BlogCard: true → <blog-card-stub>
//     BlogCategoryFilter: true → <blog-category-filter-stub>
//   - For counting rendered items, we use custom template stubs with known CSS classes
//     (mirrors the ShelterList test pattern) so that findAll('.blog-card-stub') works
//     correctly regardless of Vue stub naming conventions.
//
// What this suite does NOT cover intentionally:
//   - CSS animations or SCSS styles.
//   - Category server-side filtering (tested in useBlog.test.ts).
//   - "Limpiar búsqueda" button inside the "Sin resultados" empty state reuses
//     the same clearSearch function — verified via the search input "Limpiar" tests.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import BlogList from './BlogList.vue'
import type { BlogPost, BlogCategory } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeBlogCategory(overrides: Partial<BlogCategory> = {}): BlogCategory {
  return {
    id: 'cat-1',
    slug: 'salud',
    name: 'Salud',
    post_count: 5,
    ...overrides,
  }
}

function makeBlogPost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: 'post-1',
    slug: 'cuidado-perros',
    title: 'Cuidado de perros en verano',
    excerpt: 'Consejos para mantener a tu perro fresco durante el verano.',
    content: 'Párrafo uno.\nPárrafo dos.',
    featured_image: 'https://example.com/image.jpg',
    author: {
      id: 'author-1',
      name: 'Ana García',
      avatar: 'https://example.com/avatar.jpg',
    },
    category: makeBlogCategory(),
    tags: ['perros', 'verano', 'salud'],
    published_at: '2025-06-15T10:00:00Z',
    updated_at: '2025-06-15T10:00:00Z',
    reading_time_minutes: 5,
    is_published: true,
    ...overrides,
  }
}

const postA = makeBlogPost({ id: 'post-1', title: 'Cuidado de perros en verano', tags: ['perros'] })
const postB = makeBlogPost({ id: 'post-2', slug: 'nutricion-gatos', title: 'Nutrición para gatos', excerpt: 'Todo sobre la dieta felina.', author: { id: 'a2', name: 'Carlos López', avatar: undefined }, tags: ['gatos', 'nutricion'] })
const postC = makeBlogPost({ id: 'post-3', slug: 'vacunas-mascotas', title: 'Vacunas para mascotas', tags: ['salud', 'vacunas'] })

// ── Stubs ─────────────────────────────────────────────────────
// Custom template stubs with known CSS classes so that findAll works
// predictably regardless of Vue's internal stub naming.

const BlogCardStub = { template: '<div class="blog-card-stub" />' }
const BlogCategoryFilterStub = { template: '<div class="blog-category-filter-stub" />' }

// ── useBlog mock ──────────────────────────────────────────────
// We mock the composable so we can control store state and stub
// fetch functions without real HTTP calls.

const mockFetchPosts = vi.fn()
const mockFetchCategories = vi.fn()
const mockError = ref<string | null>(null)
const mockPosts = ref<BlogPost[]>([])
const mockCategories = ref<BlogCategory[]>([])
const mockIsLoading = ref(false)
const mockCurrentPage = ref(1)
const mockTotalPages = ref(1)

vi.mock('../composables/useBlog', () => ({
  useBlog: () => ({
    fetchPosts: mockFetchPosts,
    fetchCategories: mockFetchCategories,
    error: mockError,
    blogStore: {
      // Expose reactive state the component reads directly.
      // Plain JS getters returning ref.value — readable inside Vue computed.
      get posts() { return mockPosts.value },
      get categories() { return mockCategories.value },
      get isLoading() { return mockIsLoading.value },
      get currentPage() { return mockCurrentPage.value },
      get totalPages() { return mockTotalPages.value },
      get hasPosts() { return mockPosts.value.length > 0 },
      get hasCategories() { return mockCategories.value.length > 0 },
    },
  }),
}))

// ── Suite ─────────────────────────────────────────────────────

describe('BlogList', () => {
  beforeEach(() => {
    mockFetchPosts.mockReset()
    mockFetchPosts.mockResolvedValue(undefined)
    mockFetchCategories.mockReset()
    mockFetchCategories.mockResolvedValue(undefined)
    mockError.value = null
    mockPosts.value = []
    mockCategories.value = []
    mockIsLoading.value = false
    mockCurrentPage.value = 1
    mockTotalPages.value = 1
  })

  // ── On mount ───────────────────────────────────────────────

  describe('on mount', () => {
    it('calls fetchCategories on mount', async () => {
      await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })
      expect(mockFetchCategories).toHaveBeenCalledOnce()
    })

    it('calls fetchPosts on mount', async () => {
      await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })
      expect(mockFetchPosts).toHaveBeenCalledOnce()
    })

    it('calls fetchCategories and fetchPosts in the same mount cycle (Promise.all pattern)', async () => {
      const callOrder: string[] = []
      mockFetchCategories.mockImplementation(async () => { callOrder.push('categories') })
      mockFetchPosts.mockImplementation(async () => { callOrder.push('posts') })

      await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      // Both were called — order may vary (parallel), but both must be present
      expect(callOrder).toContain('categories')
      expect(callOrder).toContain('posts')
    })
  })

  // ── Loading skeleton ───────────────────────────────────────

  describe('loading skeleton', () => {
    it('renders 6 skeleton cards when isLoading=true and no posts are loaded', async () => {
      mockIsLoading.value = true
      mockPosts.value = []

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      const skeletonCards = wrapper.findAll('.blog-skeleton')
      expect(skeletonCards).toHaveLength(6)
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

      expect(wrapper.text()).not.toContain('El blog está en construcción')
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
    it('renders "El blog está en construcción" when isLoading=false and posts=[]', async () => {
      mockIsLoading.value = false
      mockPosts.value = []

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.text()).toContain('El blog está en construcción')
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
    it('renders a BlogCard for each post when posts are loaded', async () => {
      mockPosts.value = [postA, postB, postC]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.findAll('.blog-card-stub')).toHaveLength(3)
    })

    it('renders result count text (plural) when multiple posts are loaded', async () => {
      mockPosts.value = [postA, postB, postC]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.text()).toContain('3 artículos encontrados')
    })

    it('renders result count text (singular) when exactly one post is loaded', async () => {
      mockPosts.value = [postA]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.text()).toContain('1 artículo encontrado')
    })

    it('does NOT render empty state when posts are loaded', async () => {
      mockPosts.value = [postA]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.text()).not.toContain('El blog está en construcción')
    })
  })

  // ── BlogCategoryFilter visibility ──────────────────────────

  describe('BlogCategoryFilter visibility', () => {
    it('renders BlogCategoryFilter when hasCategories is true', async () => {
      mockCategories.value = [makeBlogCategory()]
      mockPosts.value = [postA]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.find('.blog-category-filter-stub').exists()).toBe(true)
    })

    it('does NOT render BlogCategoryFilter when hasCategories is false', async () => {
      mockCategories.value = []
      mockPosts.value = [postA]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.find('.blog-category-filter-stub').exists()).toBe(false)
    })
  })

  // ── Client-side search ─────────────────────────────────────

  describe('client-side search', () => {
    it('shows all posts when search query is empty', async () => {
      mockPosts.value = [postA, postB, postC]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.findAll('.blog-card-stub')).toHaveLength(3)
    })

    it('filters posts by title match (case-insensitive)', async () => {
      mockPosts.value = [postA, postB, postC]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      await wrapper.find('input[type="search"]').setValue('nutrición para gatos')

      expect(wrapper.findAll('.blog-card-stub')).toHaveLength(1)
    })

    it('filters posts by excerpt match', async () => {
      mockPosts.value = [postA, postB, postC]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      await wrapper.find('input[type="search"]').setValue('dieta felina')

      expect(wrapper.findAll('.blog-card-stub')).toHaveLength(1)
    })

    it('filters posts by author name match', async () => {
      mockPosts.value = [postA, postB, postC]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      await wrapper.find('input[type="search"]').setValue('carlos')

      // Only postB has author 'Carlos López'
      expect(wrapper.findAll('.blog-card-stub')).toHaveLength(1)
    })

    it('filters posts by tag match', async () => {
      mockPosts.value = [postA, postB, postC]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      await wrapper.find('input[type="search"]').setValue('vacunas')

      // Only postC has the 'vacunas' tag
      expect(wrapper.findAll('.blog-card-stub')).toHaveLength(1)
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
    it('shows the "Limpiar" button when search query is not empty', async () => {
      mockPosts.value = [postA]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      await wrapper.find('input[type="search"]').setValue('perros')

      const clearBtn = wrapper.find('button[aria-label="Limpiar búsqueda"]')
      expect(clearBtn.exists()).toBe(true)
    })

    it('does NOT show the "Limpiar" button when search query is empty', async () => {
      mockPosts.value = [postA]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      const clearBtn = wrapper.find('button[aria-label="Limpiar búsqueda"]')
      expect(clearBtn.exists()).toBe(false)
    })

    it('clicking "Limpiar" clears the search query and shows all posts again', async () => {
      mockPosts.value = [postA, postB, postC]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      await wrapper.find('input[type="search"]').setValue('xyzzy_inexistente')
      // Verify filter is active (no cards visible)
      expect(wrapper.findAll('.blog-card-stub')).toHaveLength(0)

      await wrapper.find('button[aria-label="Limpiar búsqueda"]').trigger('click')

      // After clearing, all 3 posts should render again
      expect(wrapper.findAll('.blog-card-stub')).toHaveLength(3)
    })
  })

  // ── "Cargar más" button ────────────────────────────────────

  describe('"Cargar más" button', () => {
    it('shows "Cargar más" button when currentPage < totalPages and no active search', async () => {
      mockPosts.value = [postA, postB]
      mockCurrentPage.value = 1
      mockTotalPages.value = 3

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.text()).toContain('Cargar más artículos')
    })

    it('hides "Cargar más" button when currentPage >= totalPages', async () => {
      mockPosts.value = [postA, postB]
      mockCurrentPage.value = 3
      mockTotalPages.value = 3

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      expect(wrapper.text()).not.toContain('Cargar más artículos')
    })

    it('hides "Cargar más" button when a search query is active', async () => {
      mockPosts.value = [postA, postB, postC]
      mockCurrentPage.value = 1
      mockTotalPages.value = 3

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      await wrapper.find('input[type="search"]').setValue('perros')

      expect(wrapper.text()).not.toContain('Cargar más artículos')
    })

    it('clicking "Cargar más" calls fetchPosts', async () => {
      mockPosts.value = [postA, postB]
      mockCurrentPage.value = 1
      mockTotalPages.value = 3

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      // Find the "Cargar más artículos" button specifically
      const loadMoreBtn = wrapper.findAll('button').find(b => b.text().includes('Cargar más'))
      expect(loadMoreBtn).toBeDefined()
      await loadMoreBtn!.trigger('click')

      // fetchPosts should have been called at mount (once) + once more for load-more
      expect(mockFetchPosts.mock.calls.length).toBeGreaterThanOrEqual(2)
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
      expect(section.attributes('aria-label')).toBe('Artículos del blog')
    })

    it('search input has aria-label "Buscar artículos del blog"', async () => {
      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      const input = wrapper.find('input[aria-label="Buscar artículos del blog"]')
      expect(input.exists()).toBe(true)
    })
  })
})

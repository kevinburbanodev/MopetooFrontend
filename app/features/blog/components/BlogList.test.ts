// ============================================================
// BlogList.test.ts
// Tests for the BlogList component.
//
// Strategy: mountSuspended resolves Nuxt auto-imports. The component
// calls useBlog() which internally calls useApi() and useBlogStore().
// We mock useBlog at the composable boundary so we can control
// the store state and stub fetchPosts without making HTTP calls.
//
// Key design points:
//   - On mount, fetchPosts() is called (no fetchCategories — categories are hardcoded).
//   - BlogCategoryFilter always visible (uses BLOG_CATEGORIES constant).
//   - While isLoading is true and no posts exist: skeleton cards (SKELETON_COUNT=6).
//   - When posts are empty post-load: "El blog está en construcción" empty state.
//   - When posts are loaded: BlogCard per post + result count.
//   - Client-side search filters on title and content only (no author/tags).
//   - Client-side category filter (no re-fetch).
//   - No pagination — backend returns all posts at once.
//   - Error alert shown when error ref is non-null.
//   - "Limpiar" button in search input clears the query.
//
// Mocking:
//   - useBlog is mocked via vi.mock (project composable, not a Nuxt auto-import).
//   - The mock exposes reactive refs and store state the component reads directly.
//
// Stub naming:
//   - Custom template stubs with known CSS classes so findAll works predictably.
//
// What this suite does NOT cover intentionally:
//   - CSS animations or SCSS styles.
//   - Category server-side filtering (tested in useBlog.test.ts).
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
// Custom template stubs with known CSS classes so that findAll works
// predictably regardless of Vue's internal stub naming.

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
      // useBlog mock does not expose fetchCategories at all
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

    it('filters posts by content match', async () => {
      mockPosts.value = [postA, postB, postC]

      const wrapper = await mountSuspended(BlogList, {
        global: { stubs: { NuxtLink: true, BlogCard: BlogCardStub, BlogCategoryFilter: BlogCategoryFilterStub } },
      })

      await wrapper.find('input[type="search"]').setValue('dieta felina')

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

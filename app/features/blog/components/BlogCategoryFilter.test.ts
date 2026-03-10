// ============================================================
// BlogCategoryFilter.test.ts
// Tests for the BlogCategoryFilter component (Stitch redesign).
//
// Key design points:
//   - "Todos" button is always rendered and emits null when clicked.
//   - One pill per category in the categories prop.
//   - Active state uses blog-filter-pill--active class.
//   - Count badges removed in Stitch design.
//   - Accessibility: role="tablist" on container, role="tab" on each pill.
//   - Desktop scroll arrow buttons (not counted as category buttons).
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BlogCategoryFilter from './BlogCategoryFilter.vue'

// ── Fixtures ─────────────────────────────────────────────────

const catA = { value: 'salud', label: 'Salud' }
const catB = { value: 'nutricion', label: 'Nutrición' }
const catC = { value: 'cuidados', label: 'Cuidados' }

// Helper: get only the pill buttons (role="tab"), excluding arrow buttons
function getPills(wrapper: any) {
  return wrapper.findAll('[role="tab"]')
}

// ── Suite ─────────────────────────────────────────────────────

describe('BlogCategoryFilter', () => {
  // ── "Todos" button ─────────────────────────────────────────

  describe('"Todos" button', () => {
    it('always renders a "Todos" button', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [], activeCategory: null },
      })
      expect(wrapper.text()).toContain('Todos')
    })

    it('"Todos" button has blog-filter-pill--active class when activeCategory is null', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategory: null },
      })
      const todosBtn = getPills(wrapper).find((b: any) => b.text().trim().startsWith('Todos'))
      expect(todosBtn?.classes()).toContain('blog-filter-pill--active')
    })

    it('"Todos" button does NOT have blog-filter-pill--active class when activeCategory is non-null', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategory: 'salud' },
      })
      const todosBtn = getPills(wrapper).find((b: any) => b.text().trim().startsWith('Todos'))
      expect(todosBtn?.classes()).not.toContain('blog-filter-pill--active')
    })

    it('clicking "Todos" emits "select" with null', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategory: 'salud' },
      })
      const todosBtn = getPills(wrapper).find((b: any) => b.text().trim().startsWith('Todos'))
      await todosBtn!.trigger('click')
      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')![0]).toEqual([null])
    })
  })

  // ── Category buttons ───────────────────────────────────────

  describe('category buttons', () => {
    it('renders one pill per category in the categories prop', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategory: null },
      })
      // Total pills = 1 ("Todos") + 2 (categories)
      expect(getPills(wrapper)).toHaveLength(3)
    })

    it('renders the category label in each category button', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategory: null },
      })
      expect(wrapper.text()).toContain('Salud')
      expect(wrapper.text()).toContain('Nutrición')
    })

    it('a category button has blog-filter-pill--active when its value matches activeCategory', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategory: 'salud' },
      })
      const pills = getPills(wrapper)
      expect(pills[1].classes()).toContain('blog-filter-pill--active')
    })

    it('a category button does NOT have blog-filter-pill--active when its value does NOT match', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategory: 'salud' },
      })
      const pills = getPills(wrapper)
      expect(pills[2].classes()).not.toContain('blog-filter-pill--active')
    })

    it('clicking a category button emits "select" with the category value', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategory: null },
      })
      const pills = getPills(wrapper)
      await pills[1].trigger('click') // catA — 'salud'
      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')![0]).toEqual(['salud'])
    })

    it('renders no category buttons when categories array is empty', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [], activeCategory: null },
      })
      expect(getPills(wrapper)).toHaveLength(1)
    })
  })

  // ── Accessibility ──────────────────────────────────────────

  describe('accessibility', () => {
    it('container has role="tablist"', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategory: null },
      })
      expect(wrapper.find('[role="tablist"]').exists()).toBe(true)
    })

    it('each pill has role="tab"', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategory: null },
      })
      expect(wrapper.findAll('[role="tab"]')).toHaveLength(3)
    })

    it('"Todos" button has aria-selected="true" when activeCategory is null', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategory: null },
      })
      const todosBtn = getPills(wrapper).find((b: any) => b.text().trim().startsWith('Todos'))
      expect(todosBtn?.attributes('aria-selected')).toBe('true')
    })

    it('active category button has aria-selected="true"', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategory: 'salud' },
      })
      const pills = getPills(wrapper)
      expect(pills[1].attributes('aria-selected')).toBe('true')
    })

    it('inactive category button has aria-selected="false"', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategory: 'salud' },
      })
      const pills = getPills(wrapper)
      expect(pills[2].attributes('aria-selected')).toBe('false')
    })
  })
})

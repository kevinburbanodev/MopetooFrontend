// ============================================================
// BlogCategoryFilter.test.ts
// Tests for the BlogCategoryFilter component.
//
// Strategy: mountSuspended resolves Nuxt auto-imports. The component
// receives all data via props and emits events — no store or HTTP calls.
//
// Key design points:
//   - "Todos" button is always rendered and emits null when clicked.
//   - One button per category in the categories prop.
//   - Active state uses btn-primary; inactive uses btn-outline-secondary.
//   - Badge with post count is shown via categoryCounts prop.
//   - Accessibility: role="tablist" on container, role="tab" on each button.
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BlogCategoryFilter from './BlogCategoryFilter.vue'

// ── Fixtures ─────────────────────────────────────────────────

const catA = { value: 'salud', label: 'Salud' }
const catB = { value: 'nutricion', label: 'Nutrición' }
const catC = { value: 'cuidados', label: 'Cuidados' }

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

    it('"Todos" button has btn-primary class when activeCategory is null', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategory: null },
      })
      const todosBtn = wrapper.findAll('button').find(b => b.text().trim().startsWith('Todos'))
      expect(todosBtn?.classes()).toContain('btn-primary')
    })

    it('"Todos" button has btn-outline-secondary class when activeCategory is non-null', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategory: 'salud' },
      })
      const todosBtn = wrapper.findAll('button').find(b => b.text().trim().startsWith('Todos'))
      expect(todosBtn?.classes()).toContain('btn-outline-secondary')
      expect(todosBtn?.classes()).not.toContain('btn-primary')
    })

    it('clicking "Todos" emits "select" with null', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategory: 'salud' },
      })
      const todosBtn = wrapper.findAll('button').find(b => b.text().trim().startsWith('Todos'))
      await todosBtn!.trigger('click')
      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')![0]).toEqual([null])
    })
  })

  // ── Category buttons ───────────────────────────────────────

  describe('category buttons', () => {
    it('renders one button per category in the categories prop', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategory: null },
      })
      // Total buttons = 1 ("Todos") + 2 (categories)
      expect(wrapper.findAll('button')).toHaveLength(3)
    })

    it('renders the category label in each category button', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategory: null },
      })
      expect(wrapper.text()).toContain('Salud')
      expect(wrapper.text()).toContain('Nutrición')
    })

    it('a category button has btn-primary when its value matches activeCategory', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategory: 'salud' },
      })
      const buttons = wrapper.findAll('button')
      expect(buttons[1].classes()).toContain('btn-primary')
    })

    it('a category button has btn-outline-secondary when its value does NOT match', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategory: 'salud' },
      })
      const buttons = wrapper.findAll('button')
      expect(buttons[2].classes()).toContain('btn-outline-secondary')
      expect(buttons[2].classes()).not.toContain('btn-primary')
    })

    it('clicking a category button emits "select" with the category value', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategory: null },
      })
      const buttons = wrapper.findAll('button')
      await buttons[1].trigger('click') // catA — 'salud'
      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')![0]).toEqual(['salud'])
    })

    it('renders no category buttons when categories array is empty', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [], activeCategory: null },
      })
      expect(wrapper.findAll('button')).toHaveLength(1)
    })
  })

  // ── categoryCounts badge ───────────────────────────────────

  describe('categoryCounts badge', () => {
    it('shows the badge when categoryCounts provides a count for the category', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategory: null, categoryCounts: { salud: 3 } },
      })
      const badge = wrapper.find('.blog-category-filter__count')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('3')
    })

    it('hides the badge when categoryCounts is undefined', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategory: null },
      })
      const badge = wrapper.find('.blog-category-filter__count')
      expect(badge.exists()).toBe(false)
    })

    it('hides the badge when categoryCounts has no entry for the category', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategory: null, categoryCounts: { nutricion: 5 } },
      })
      const badge = wrapper.find('.blog-category-filter__count')
      expect(badge.exists()).toBe(false)
    })

    it('badge has bg-white text-primary class when the category is active', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategory: 'salud', categoryCounts: { salud: 3 } },
      })
      const badge = wrapper.find('.blog-category-filter__count')
      expect(badge.classes()).toContain('bg-white')
      expect(badge.classes()).toContain('text-primary')
    })

    it('badge has bg-primary-subtle class when the category is inactive', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategory: null, categoryCounts: { salud: 3 } },
      })
      const badge = wrapper.find('.blog-category-filter__count')
      expect(badge.classes()).toContain('bg-primary-subtle')
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

    it('each button has role="tab"', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategory: null },
      })
      expect(wrapper.findAll('[role="tab"]')).toHaveLength(3)
    })

    it('"Todos" button has aria-selected="true" when activeCategory is null', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategory: null },
      })
      const todosBtn = wrapper.findAll('button').find(b => b.text().trim().startsWith('Todos'))
      expect(todosBtn?.attributes('aria-selected')).toBe('true')
    })

    it('active category button has aria-selected="true"', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategory: 'salud' },
      })
      const buttons = wrapper.findAll('button')
      expect(buttons[1].attributes('aria-selected')).toBe('true')
    })

    it('inactive category button has aria-selected="false"', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategory: 'salud' },
      })
      const buttons = wrapper.findAll('button')
      expect(buttons[2].attributes('aria-selected')).toBe('false')
    })
  })
})

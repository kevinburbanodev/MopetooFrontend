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
//   - Badge with post_count is shown when post_count is defined.
//   - Badge contrast class changes based on active state.
//   - Accessibility: role="tablist" on container, role="tab" on each button,
//     aria-selected on each button reflecting active state.
//
// What this suite does NOT cover intentionally:
//   - CSS animations, scroll behaviour, SCSS visual styles.
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BlogCategoryFilter from './BlogCategoryFilter.vue'
import type { BlogCategory } from '../types'

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

const catA = makeBlogCategory({ id: 'cat-1', slug: 'salud', name: 'Salud', post_count: 3 })
const catB = makeBlogCategory({ id: 'cat-2', slug: 'nutricion', name: 'Nutrición', post_count: 7 })
const catC = makeBlogCategory({ id: 'cat-3', slug: 'bienestar', name: 'Bienestar', post_count: undefined })

// ── Suite ─────────────────────────────────────────────────────

describe('BlogCategoryFilter', () => {
  // ── "Todos" button ─────────────────────────────────────────

  describe('"Todos" button', () => {
    it('always renders a "Todos" button', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [], activeCategorySlug: null },
      })
      expect(wrapper.text()).toContain('Todos')
    })

    it('"Todos" button has btn-primary class when activeCategorySlug is null', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategorySlug: null },
      })
      const todosBtn = wrapper.findAll('button').find(b => b.text().trim().startsWith('Todos'))
      expect(todosBtn?.classes()).toContain('btn-primary')
    })

    it('"Todos" button has btn-outline-secondary class when activeCategorySlug is non-null', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategorySlug: 'salud' },
      })
      const todosBtn = wrapper.findAll('button').find(b => b.text().trim().startsWith('Todos'))
      expect(todosBtn?.classes()).toContain('btn-outline-secondary')
      expect(todosBtn?.classes()).not.toContain('btn-primary')
    })

    it('clicking "Todos" emits "select" with null', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategorySlug: 'salud' },
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
        props: { categories: [catA, catB], activeCategorySlug: null },
      })
      // Total buttons = 1 ("Todos") + 2 (categories)
      expect(wrapper.findAll('button')).toHaveLength(3)
    })

    it('renders the category name in each category button', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategorySlug: null },
      })
      expect(wrapper.text()).toContain('Salud')
      expect(wrapper.text()).toContain('Nutrición')
    })

    it('a category button has btn-primary when its slug matches activeCategorySlug', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategorySlug: 'salud' },
      })
      const buttons = wrapper.findAll('button')
      // buttons[0] = Todos, buttons[1] = catA (salud), buttons[2] = catB
      expect(buttons[1].classes()).toContain('btn-primary')
    })

    it('a category button has btn-outline-secondary when its slug does NOT match', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategorySlug: 'salud' },
      })
      const buttons = wrapper.findAll('button')
      // buttons[2] = catB (nutricion) — not active
      expect(buttons[2].classes()).toContain('btn-outline-secondary')
      expect(buttons[2].classes()).not.toContain('btn-primary')
    })

    it('clicking a category button emits "select" with the category slug', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategorySlug: null },
      })
      const buttons = wrapper.findAll('button')
      await buttons[1].trigger('click') // catA — 'salud'
      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')![0]).toEqual(['salud'])
    })

    it('clicking a different category button emits its own slug', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategorySlug: 'salud' },
      })
      const buttons = wrapper.findAll('button')
      await buttons[2].trigger('click') // catB — 'nutricion'
      expect(wrapper.emitted('select')![0]).toEqual(['nutricion'])
    })

    it('renders no category buttons when categories array is empty', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [], activeCategorySlug: null },
      })
      // Only the "Todos" button
      expect(wrapper.findAll('button')).toHaveLength(1)
    })
  })

  // ── post_count badge ───────────────────────────────────────

  describe('post_count badge', () => {
    it('shows the badge when post_count is defined', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategorySlug: null },
      })
      // Badge with post_count value
      const badge = wrapper.find('.blog-category-filter__count')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('3')
    })

    it('hides the badge when post_count is undefined', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catC], activeCategorySlug: null },
      })
      const badge = wrapper.find('.blog-category-filter__count')
      expect(badge.exists()).toBe(false)
    })

    it('badge has bg-white text-primary class when the category is active', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategorySlug: 'salud' },
      })
      const badge = wrapper.find('.blog-category-filter__count')
      expect(badge.classes()).toContain('bg-white')
      expect(badge.classes()).toContain('text-primary')
    })

    it('badge has bg-primary-subtle class when the category is inactive', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategorySlug: null },
      })
      const badge = wrapper.find('.blog-category-filter__count')
      expect(badge.classes()).toContain('bg-primary-subtle')
    })
  })

  // ── Accessibility ──────────────────────────────────────────

  describe('accessibility', () => {
    it('container has role="tablist"', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategorySlug: null },
      })
      const container = wrapper.find('[role="tablist"]')
      expect(container.exists()).toBe(true)
    })

    it('each button has role="tab"', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategorySlug: null },
      })
      const tabs = wrapper.findAll('[role="tab"]')
      // "Todos" + 2 category buttons = 3
      expect(tabs).toHaveLength(3)
    })

    it('"Todos" button has aria-selected="true" when activeCategorySlug is null', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategorySlug: null },
      })
      const todosBtn = wrapper.findAll('button').find(b => b.text().trim().startsWith('Todos'))
      expect(todosBtn?.attributes('aria-selected')).toBe('true')
    })

    it('"Todos" button has aria-selected="false" when activeCategorySlug is non-null', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA], activeCategorySlug: 'salud' },
      })
      const todosBtn = wrapper.findAll('button').find(b => b.text().trim().startsWith('Todos'))
      expect(todosBtn?.attributes('aria-selected')).toBe('false')
    })

    it('active category button has aria-selected="true"', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategorySlug: 'salud' },
      })
      const buttons = wrapper.findAll('button')
      // buttons[1] = catA (active)
      expect(buttons[1].attributes('aria-selected')).toBe('true')
    })

    it('inactive category button has aria-selected="false"', async () => {
      const wrapper = await mountSuspended(BlogCategoryFilter, {
        props: { categories: [catA, catB], activeCategorySlug: 'salud' },
      })
      const buttons = wrapper.findAll('button')
      // buttons[2] = catB (inactive)
      expect(buttons[2].attributes('aria-selected')).toBe('false')
    })
  })
})

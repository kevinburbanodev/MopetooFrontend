// ============================================================
// MaintenancePage.test.ts
// Tests for the MaintenancePage component.
//
// MaintenancePage is a pure presentational component — no composable
// calls, no store access, no async behaviour.
//
// Testing strategy:
//   - mountSuspended for Nuxt compatibility and auto-import resolution.
//   - NuxtLink stubbed with a custom template so slot text is visible
//     AND the :to prop is forwarded to href for assertion.
//   - Tests cover: default render, custom message prop, accessibility
//     attributes, single h1, and the CTA link.
//
// What this suite intentionally does NOT cover:
//   - SCSS animation/styling (visual-only, no behaviour)
//   - Server-side rendering (SSR-safe by design — no window/document)
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MaintenancePage from './MaintenancePage.vue'

// ── Stubs ─────────────────────────────────────────────────────

// Forward :to to href so we can assert the link destination.
// Render slot content so the button text is visible.
const NuxtLinkHrefStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

// ── Mount helper ──────────────────────────────────────────────

async function mountPage(props: Record<string, unknown> = {}) {
  return mountSuspended(MaintenancePage, {
    props,
    global: {
      stubs: { NuxtLink: NuxtLinkHrefStub },
    },
  })
}

// ── Suite ─────────────────────────────────────────────────────

describe('MaintenancePage', () => {
  // ── Default render (no props) ───────────────────────────────

  describe('default render — no props provided', () => {
    it('renders a <main> element with role="main"', async () => {
      const wrapper = await mountPage()
      expect(wrapper.find('main[role="main"]').exists()).toBe(true)
    })

    it('has aria-label "Sitio en mantenimiento" on the <main>', async () => {
      const wrapper = await mountPage()
      expect(wrapper.find('main').attributes('aria-label')).toBe('Sitio en mantenimiento')
    })

    it('renders a single <h1> heading', async () => {
      const wrapper = await mountPage()
      expect(wrapper.findAll('h1')).toHaveLength(1)
    })

    it('h1 contains "En mantenimiento"', async () => {
      const wrapper = await mountPage()
      expect(wrapper.find('h1').text()).toBe('En mantenimiento')
    })

    it('shows the default subtitle', async () => {
      const wrapper = await mountPage()
      expect(wrapper.text()).toContain('Estamos trabajando para mejorar Mopetoo. Vuelve pronto.')
    })

    it('renders the CTA link with href="/"', async () => {
      const wrapper = await mountPage()
      expect(wrapper.find('a').attributes('href')).toBe('/')
    })

    it('CTA link text is "Volver al inicio"', async () => {
      const wrapper = await mountPage()
      expect(wrapper.find('a').text()).toBe('Volver al inicio')
    })

    it('CTA link has aria-label "Volver al inicio de Mopetoo"', async () => {
      const wrapper = await mountPage()
      expect(wrapper.find('a').attributes('aria-label')).toBe('Volver al inicio de Mopetoo')
    })
  })

  // ── Accessibility ───────────────────────────────────────────

  describe('accessibility', () => {
    it('the icon element has aria-hidden="true"', async () => {
      const wrapper = await mountPage()
      // The icon is rendered inside the .maintenance-page__icon div
      const iconEl = wrapper.find('[aria-hidden="true"]')
      expect(iconEl.exists()).toBe(true)
    })

    it('the CTA link has a descriptive aria-label', async () => {
      const wrapper = await mountPage()
      const link = wrapper.find('a[aria-label]')
      expect(link.attributes('aria-label')).toBe('Volver al inicio de Mopetoo')
    })

    it('there is exactly one <h1> on the page (no heading hierarchy violation)', async () => {
      const wrapper = await mountPage()
      expect(wrapper.findAll('h1')).toHaveLength(1)
    })

    it('the main landmark has an accessible label', async () => {
      const wrapper = await mountPage()
      const main = wrapper.find('main')
      expect(main.attributes('aria-label')).toBeTruthy()
    })
  })

  // ── With message prop ───────────────────────────────────────

  describe('with message prop provided', () => {
    it('displays the custom message', async () => {
      const wrapper = await mountPage({ message: 'Volveremos en 2 horas.' })
      expect(wrapper.text()).toContain('Volveremos en 2 horas.')
    })

    it('does NOT show the default subtitle when a custom message is provided', async () => {
      const wrapper = await mountPage({ message: 'Mantenimiento programado.' })
      expect(wrapper.text()).not.toContain('Estamos trabajando para mejorar Mopetoo.')
    })

    it('still renders the h1 heading with a custom message', async () => {
      const wrapper = await mountPage({ message: 'Mensaje personalizado.' })
      expect(wrapper.find('h1').text()).toBe('En mantenimiento')
    })

    it('still renders the CTA link with a custom message', async () => {
      const wrapper = await mountPage({ message: 'Back soon!' })
      expect(wrapper.find('a').attributes('href')).toBe('/')
    })

    it('renders a long custom message correctly', async () => {
      const longMsg = 'Estamos realizando actualizaciones críticas de seguridad. Por favor, vuelve en 4 horas.'
      const wrapper = await mountPage({ message: longMsg })
      expect(wrapper.text()).toContain(longMsg)
    })
  })

  // ── With undefined message prop ─────────────────────────────

  describe('with message prop explicitly set to undefined', () => {
    it('falls back to the default subtitle', async () => {
      const wrapper = await mountPage({ message: undefined })
      expect(wrapper.text()).toContain('Estamos trabajando para mejorar Mopetoo. Vuelve pronto.')
    })
  })
})

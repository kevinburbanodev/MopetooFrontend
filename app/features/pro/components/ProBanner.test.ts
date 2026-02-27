// ============================================================
// ProBanner.test.ts
// Tests for the ProBanner component.
//
// Strategy: mountSuspended resolves Nuxt auto-imports. Auth state is
// controlled via createTestingPinia({ initialState }) — we use the
// Nuxt test env's pinia since ProBanner reads useAuthStore() directly.
//
// Key design points:
//   - PRO users (isAuthenticated && isPro): component renders nothing.
//   - Authenticated non-PRO users: shows upgrade banner with PRO badge.
//   - Unauthenticated users: shows login CTA with a link to /login.
//   - `compact` prop: renders a compact variant (different CSS classes,
//     no close button).
//   - `featureName` prop: shown in the copy; defaults to "esta función".
//   - Emits:
//       - `upgrade` when the "Ver planes" button is clicked
//       - `close` when the dismiss button is clicked (full banner only)
//
// Mocking:
//   - localStorage stubbed at module level (auth.client.ts plugin runs
//     during Nuxt init before any beforeEach hook).
//   - useAuthStore: accessed from the Nuxt test env pinia, injected via
//     createTestingPinia({ initialState: { auth: { ... } } }).
//   - NuxtLink: stubbed with { template: '<a :href="to"><slot /></a>',
//     props: ['to'] } so link text and href are both visible.
//
// What this suite does NOT cover intentionally:
//   - SCSS styles / Bootstrap CSS classes applied by the browser engine.
//   - Pro subscription management — that is ProUpgradeModal's concern.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import ProBanner from './ProBanner.vue'

// ── localStorage stub (module-level) ─────────────────────────
// The auth.client.ts plugin calls localStorage.getItem during Nuxt
// app init — before any beforeEach hook runs — so we must stub it
// at module level (see MEMORY.md "localStorage TOKEN KEY" entry).

const localStorageMock = vi.hoisted(() => ({
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}))
vi.stubGlobal('localStorage', localStorageMock)

// ── NuxtLink stub ─────────────────────────────────────────────
// Renders slot content + forwards :to as href so we can check links.
const NuxtLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

// ── Helpers ───────────────────────────────────────────────────

function mountBanner(authState: { isAuthenticated?: boolean; isPro?: boolean } = {}, props = {}) {
  return mountSuspended(ProBanner, {
    props,
    global: {
      plugins: [
        createTestingPinia({
          stubActions: false,
          createSpy: vi.fn,
          initialState: {
            auth: {
              token: authState.isAuthenticated ? 'test-jwt' : null,
              isPro: authState.isPro ?? false,
            },
          },
        }),
      ],
      stubs: { NuxtLink: NuxtLinkStub },
    },
  })
}

// ── Suite ─────────────────────────────────────────────────────

describe('ProBanner', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null)
  })

  // ── PRO users ──────────────────────────────────────────────
  //
  // NOTE on isPro: useAuthStore.isPro is a computed from currentUser.is_pro.
  // We cannot set isPro directly via createTestingPinia initialState because
  // it is not raw state. Instead we set currentUser with is_pro: true and
  // a valid token so that isAuthenticated AND isPro are both truthy.

  describe('when the user is authenticated and has PRO status', () => {
    it('renders nothing (empty wrapper)', async () => {
      const wrapper = await mountSuspended(ProBanner, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              createSpy: vi.fn,
              initialState: {
                auth: {
                  token: 'test-jwt',
                  currentUser: { id: '1', is_pro: true },
                },
              },
            }),
          ],
          stubs: { NuxtLink: NuxtLinkStub },
        },
      })
      // Neither upgrade banner nor login CTA — the component is fully hidden
      expect(wrapper.find('[role="note"]').exists()).toBe(false)
    })
  })

  // ── Authenticated non-PRO users ────────────────────────────

  describe('when the user is authenticated but not PRO', () => {
    it('renders the upgrade banner', async () => {
      const wrapper = await mountBanner({ isAuthenticated: true, isPro: false })
      expect(wrapper.find('[role="note"]').exists()).toBe(true)
    })

    it('shows the "PRO" badge text', async () => {
      const wrapper = await mountBanner({ isAuthenticated: true, isPro: false })
      expect(wrapper.find('.badge').text()).toBe('PRO')
    })

    it('shows the featureName prop in the banner copy', async () => {
      const wrapper = await mountBanner(
        { isAuthenticated: true, isPro: false },
        { featureName: 'Exportar PDF' },
      )
      expect(wrapper.text()).toContain('Exportar PDF')
    })

    it('uses "esta función" as the default featureName when prop is not provided', async () => {
      const wrapper = await mountBanner({ isAuthenticated: true, isPro: false })
      expect(wrapper.text()).toContain('esta función')
    })

    it('shows "Ver planes" button', async () => {
      const wrapper = await mountBanner({ isAuthenticated: true, isPro: false })
      const btn = wrapper.find('button.btn-warning')
      expect(btn.exists()).toBe(true)
      expect(btn.text()).toBe('Ver planes')
    })

    it('emits "upgrade" when the "Ver planes" button is clicked', async () => {
      const wrapper = await mountBanner({ isAuthenticated: true, isPro: false })
      await wrapper.find('button.btn-warning').trigger('click')
      expect(wrapper.emitted('upgrade')).toHaveLength(1)
    })

    it('shows the close button in full (non-compact) banner', async () => {
      const wrapper = await mountBanner({ isAuthenticated: true, isPro: false })
      expect(wrapper.find('button.btn-close').exists()).toBe(true)
    })

    it('emits "close" when the close button is clicked', async () => {
      const wrapper = await mountBanner({ isAuthenticated: true, isPro: false })
      await wrapper.find('button.btn-close').trigger('click')
      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('has aria-label "Función PRO requerida" on the alert', async () => {
      const wrapper = await mountBanner({ isAuthenticated: true, isPro: false })
      expect(wrapper.find('[aria-label="Función PRO requerida"]').exists()).toBe(true)
    })

    it('does not show the login CTA for authenticated users', async () => {
      const wrapper = await mountBanner({ isAuthenticated: true, isPro: false })
      expect(wrapper.find('[aria-label="Inicia sesión para acceder"]').exists()).toBe(false)
    })

    it('includes "alert-warning" class on the banner container', async () => {
      const wrapper = await mountBanner({ isAuthenticated: true, isPro: false })
      expect(wrapper.find('.pro-banner').classes()).toContain('alert-warning')
    })

    // Compact variant
    describe('when compact prop is true', () => {
      it('renders the compact variant class', async () => {
        const wrapper = await mountBanner(
          { isAuthenticated: true, isPro: false },
          { compact: true },
        )
        expect(wrapper.find('.pro-banner--compact').exists()).toBe(true)
      })

      it('does not render a close button in compact mode', async () => {
        const wrapper = await mountBanner(
          { isAuthenticated: true, isPro: false },
          { compact: true },
        )
        expect(wrapper.find('button.btn-close').exists()).toBe(false)
      })

      it('still shows featureName in compact mode', async () => {
        const wrapper = await mountBanner(
          { isAuthenticated: true, isPro: false },
          { compact: true, featureName: 'historial médico' },
        )
        expect(wrapper.text()).toContain('historial médico')
      })
    })
  })

  // ── Unauthenticated users ───────────────────────────────────

  describe('when the user is unauthenticated', () => {
    it('renders the login CTA alert', async () => {
      const wrapper = await mountBanner({ isAuthenticated: false })
      expect(wrapper.find('[aria-label="Inicia sesión para acceder"]').exists()).toBe(true)
    })

    it('shows "Iniciar sesión" link text', async () => {
      const wrapper = await mountBanner({ isAuthenticated: false })
      expect(wrapper.text()).toContain('Iniciar sesión')
    })

    it('login CTA link points to /login', async () => {
      const wrapper = await mountBanner({ isAuthenticated: false })
      const link = wrapper.find('a[href="/login"]')
      expect(link.exists()).toBe(true)
    })

    it('shows the featureName in the login CTA copy', async () => {
      const wrapper = await mountBanner(
        { isAuthenticated: false },
        { featureName: 'Exportar PDF' },
      )
      expect(wrapper.text()).toContain('Exportar PDF')
    })

    it('uses "esta función" default in login CTA when featureName not provided', async () => {
      const wrapper = await mountBanner({ isAuthenticated: false })
      expect(wrapper.text()).toContain('esta función')
    })

    it('does not show the upgrade banner for unauthenticated users', async () => {
      const wrapper = await mountBanner({ isAuthenticated: false })
      expect(wrapper.find('[aria-label="Función PRO requerida"]').exists()).toBe(false)
    })

    it('does not show the close button in the login CTA', async () => {
      const wrapper = await mountBanner({ isAuthenticated: false })
      expect(wrapper.find('button.btn-close').exists()).toBe(false)
    })

    it('does not emit "upgrade" when in login CTA state', async () => {
      const wrapper = await mountBanner({ isAuthenticated: false })
      // No upgrade button present — clicking anywhere should not emit upgrade
      expect(wrapper.emitted('upgrade')).toBeUndefined()
    })
  })
})

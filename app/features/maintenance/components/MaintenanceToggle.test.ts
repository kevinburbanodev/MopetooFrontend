// ============================================================
// MaintenanceToggle.test.ts
// Tests for the MaintenanceToggle admin widget.
//
// Testing strategy:
//   - useMaintenance() is mocked at module level with module-level
//     reactive refs so component state is fully controlled without
//     real HTTP calls or store access.
//   - The mock exposes `maintenanceStore` as a reactive object with
//     getters that delegate to the module-level refs. This mirrors
//     the pattern established in StatsOverview, PetshopList, etc.
//   - Tests cover: loading skeleton, empty state, inactive state,
//     active state, two-step confirm flows (enable and disable),
//     error display, metadata display, onMounted behaviour, and
//     the loading-during-toggle disabled state.
//
// What this suite intentionally does NOT cover:
//   - Intl date formatting locale variations (SSR-safe by design)
//   - SCSS shimmer animation (visual-only)
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, reactive } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import MaintenanceToggle from './MaintenanceToggle.vue'
import type { MaintenanceStatus } from '../types'

// ── useMaintenance mock ───────────────────────────────────────
//
// Module-level reactive refs control what the component sees.
// We do NOT use createTestingPinia initialState here because the
// component reads from useMaintenance(), not directly from the store.

const mockFetchStatus = vi.fn()
const mockToggleMaintenance = vi.fn()
const mockError = ref<string | null>(null)
const mockMaintenanceStore = reactive({
  status: null as MaintenanceStatus | null,
  isLoading: false,
  isEnabled: false,
  hasStatus: false,
  setStatus: vi.fn(),
  setLoading: vi.fn(),
  clearMaintenance: vi.fn(),
})

vi.mock('../composables/useMaintenance', () => ({
  useMaintenance: () => ({
    fetchStatus: mockFetchStatus,
    toggleMaintenance: mockToggleMaintenance,
    error: mockError,
    maintenanceStore: mockMaintenanceStore,
  }),
}))

// ── Mount helper ──────────────────────────────────────────────

async function mountToggle() {
  return mountSuspended(MaintenanceToggle, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            auth: { token: 'admin.jwt', currentUser: { id: 1, is_admin: true } },
          },
        }),
      ],
    },
  })
}

// ── Suite ─────────────────────────────────────────────────────

describe('MaintenanceToggle', () => {
  beforeEach(() => {
    mockFetchStatus.mockReset()
    mockToggleMaintenance.mockReset()
    mockError.value = null
    mockMaintenanceStore.status = null
    mockMaintenanceStore.isLoading = false
    mockMaintenanceStore.isEnabled = false
    mockMaintenanceStore.hasStatus = false
  })

  // ── onMounted behaviour ──────────────────────────────────────

  describe('onMounted', () => {
    it('calls fetchStatus on mount', async () => {
      await mountToggle()
      expect(mockFetchStatus).toHaveBeenCalledTimes(1)
    })

    it('calls fetchStatus with no arguments', async () => {
      await mountToggle()
      expect(mockFetchStatus).toHaveBeenCalledWith()
    })
  })

  // ── Loading skeleton ─────────────────────────────────────────

  describe('loading skeleton (isLoading=true, hasStatus=false)', () => {
    beforeEach(() => {
      mockMaintenanceStore.isLoading = true
      mockMaintenanceStore.hasStatus = false
    })

    it('shows the skeleton element with aria-busy="true"', async () => {
      const wrapper = await mountToggle()
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    })

    it('skeleton has aria-label "Cargando estado del sistema"', async () => {
      const wrapper = await mountToggle()
      expect(wrapper.find('[aria-busy="true"]').attributes('aria-label')).toBe(
        'Cargando estado del sistema',
      )
    })

    it('does NOT show the action button during loading', async () => {
      const wrapper = await mountToggle()
      // The primary action button (not inside confirming) should not exist
      const buttons = wrapper.findAll('button')
      const actionButton = buttons.find(
        (b) =>
          b.text().includes('Activar mantenimiento') ||
          b.text().includes('Desactivar mantenimiento'),
      )
      expect(actionButton).toBeUndefined()
    })

    it('does NOT show the empty state during loading', async () => {
      const wrapper = await mountToggle()
      expect(wrapper.text()).not.toContain('No se pudo obtener el estado del sistema.')
    })
  })

  // ── Empty state ──────────────────────────────────────────────

  describe('empty state (isLoading=false, hasStatus=false)', () => {
    beforeEach(() => {
      mockMaintenanceStore.isLoading = false
      mockMaintenanceStore.hasStatus = false
    })

    it('shows "No se pudo obtener el estado del sistema."', async () => {
      const wrapper = await mountToggle()
      expect(wrapper.text()).toContain('No se pudo obtener el estado del sistema.')
    })

    it('shows a "Reintentar" button', async () => {
      const wrapper = await mountToggle()
      const retryButton = wrapper.findAll('button').find((b) => b.text() === 'Reintentar')
      expect(retryButton).toBeDefined()
      expect(retryButton!.exists()).toBe(true)
    })

    it('clicking "Reintentar" calls fetchStatus', async () => {
      const wrapper = await mountToggle()
      const retryButton = wrapper.findAll('button').find((b) => b.text() === 'Reintentar')
      await retryButton!.trigger('click')
      // onMounted already called it once; retry adds a second call
      expect(mockFetchStatus).toHaveBeenCalledTimes(2)
    })

    it('does NOT show the loading skeleton', async () => {
      const wrapper = await mountToggle()
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    })

    it('does NOT show the action button', async () => {
      const wrapper = await mountToggle()
      const buttons = wrapper.findAll('button').filter(
        (b) =>
          b.text().includes('Activar mantenimiento') ||
          b.text().includes('Desactivar mantenimiento'),
      )
      expect(buttons).toHaveLength(0)
    })
  })

  // ── Inactive state ───────────────────────────────────────────

  describe('inactive state (isEnabled=false, hasStatus=true)', () => {
    beforeEach(() => {
      mockMaintenanceStore.isLoading = false
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = false
      mockMaintenanceStore.status = { is_enabled: false }
    })

    it('shows the status badge with class bg-success', async () => {
      const wrapper = await mountToggle()
      const badge = wrapper.find('.badge')
      expect(badge.classes()).toContain('bg-success')
    })

    it('badge text is "Inactivo"', async () => {
      const wrapper = await mountToggle()
      expect(wrapper.find('.badge').text()).toBe('Inactivo')
    })

    it('badge aria-label is "Modo mantenimiento inactivo"', async () => {
      const wrapper = await mountToggle()
      expect(wrapper.find('.badge').attributes('aria-label')).toBe('Modo mantenimiento inactivo')
    })

    it('shows the primary action button with class btn-danger', async () => {
      const wrapper = await mountToggle()
      // When maintenance is inactive, the action is to activate (danger)
      const actionBtn = wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )
      expect(actionBtn).toBeDefined()
      expect(actionBtn!.classes()).toContain('btn-danger')
    })

    it('action button text is "Activar mantenimiento"', async () => {
      const wrapper = await mountToggle()
      const actionBtn = wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )
      expect(actionBtn!.exists()).toBe(true)
    })

    it('does NOT show the confirming row', async () => {
      const wrapper = await mountToggle()
      expect(wrapper.text()).not.toContain('¿Activar el modo mantenimiento?')
    })

    it('does NOT show the empty state', async () => {
      const wrapper = await mountToggle()
      expect(wrapper.text()).not.toContain('No se pudo obtener el estado del sistema.')
    })
  })

  // ── Active state ─────────────────────────────────────────────

  describe('active state (isEnabled=true, hasStatus=true)', () => {
    beforeEach(() => {
      mockMaintenanceStore.isLoading = false
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = true
      mockMaintenanceStore.status = { is_enabled: true }
    })

    it('shows the status badge with class bg-danger', async () => {
      const wrapper = await mountToggle()
      expect(wrapper.find('.badge').classes()).toContain('bg-danger')
    })

    it('badge text is "Activo"', async () => {
      const wrapper = await mountToggle()
      expect(wrapper.find('.badge').text()).toBe('Activo')
    })

    it('badge aria-label is "Modo mantenimiento activo"', async () => {
      const wrapper = await mountToggle()
      expect(wrapper.find('.badge').attributes('aria-label')).toBe('Modo mantenimiento activo')
    })

    it('shows the primary action button with class btn-success', async () => {
      const wrapper = await mountToggle()
      // When maintenance is active, the action is to deactivate (success = safe)
      const actionBtn = wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Desactivar mantenimiento',
      )
      expect(actionBtn).toBeDefined()
      expect(actionBtn!.classes()).toContain('btn-success')
    })

    it('action button text is "Desactivar mantenimiento"', async () => {
      const wrapper = await mountToggle()
      const actionBtn = wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Desactivar mantenimiento',
      )
      expect(actionBtn!.exists()).toBe(true)
    })

    it('does NOT show the confirming row initially', async () => {
      const wrapper = await mountToggle()
      expect(wrapper.text()).not.toContain('¿Desactivar el modo mantenimiento?')
    })
  })

  // ── Two-step confirm: enabling maintenance ───────────────────

  describe('two-step confirm — enabling maintenance (isEnabled=false)', () => {
    beforeEach(() => {
      mockMaintenanceStore.isLoading = false
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = false
      mockMaintenanceStore.status = { is_enabled: false }
    })

    it('clicking the action button shows the confirm row', async () => {
      const wrapper = await mountToggle()
      const actionBtn = wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )
      await actionBtn!.trigger('click')
      expect(wrapper.text()).toContain('¿Activar el modo mantenimiento?')
    })

    it('confirm row text warns users cannot access the site', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      expect(wrapper.text()).toContain('Los usuarios no podrán acceder al sitio.')
    })

    it('shows "Confirmar" and "Cancelar" buttons in the confirm row', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      const buttons = wrapper.findAll('button')
      expect(buttons.some((b) => b.text().trim() === 'Confirmar')).toBe(true)
      expect(buttons.some((b) => b.text().trim() === 'Cancelar')).toBe(true)
    })

    it('action button is hidden while confirm row is visible', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      const actionBtn = wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )
      expect(actionBtn).toBeUndefined()
    })

    it('clicking "Cancelar" hides the confirm row', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      const cancelBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Cancelar')
      await cancelBtn!.trigger('click')
      expect(wrapper.text()).not.toContain('¿Activar el modo mantenimiento?')
    })

    it('clicking "Cancelar" does NOT call toggleMaintenance', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      const cancelBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Cancelar')
      await cancelBtn!.trigger('click')
      expect(mockToggleMaintenance).not.toHaveBeenCalled()
    })

    it('clicking "Cancelar" restores the primary action button', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      await wrapper.findAll('button').find((b) => b.text().trim() === 'Cancelar')!.trigger('click')
      const actionBtn = wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )
      expect(actionBtn).toBeDefined()
    })

    it('clicking "Confirmar" calls toggleMaintenance(true) — toggling from false to true', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      const confirmBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Confirmar')
      await confirmBtn!.trigger('click')
      expect(mockToggleMaintenance).toHaveBeenCalledWith(true)
    })

    it('clicking "Confirmar" calls toggleMaintenance exactly once', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      await wrapper.findAll('button').find((b) => b.text().trim() === 'Confirmar')!.trigger('click')
      expect(mockToggleMaintenance).toHaveBeenCalledTimes(1)
    })

    it('confirm button has class btn-danger (confirm activate = danger action)', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      const confirmBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Confirmar')
      expect(confirmBtn!.classes()).toContain('btn-danger')
    })
  })

  // ── Two-step confirm: disabling maintenance ──────────────────

  describe('two-step confirm — disabling maintenance (isEnabled=true)', () => {
    beforeEach(() => {
      mockMaintenanceStore.isLoading = false
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = true
      mockMaintenanceStore.status = { is_enabled: true }
    })

    it('clicking the action button shows the confirm row with deactivation text', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Desactivar mantenimiento',
      )!.trigger('click')
      expect(wrapper.text()).toContain('¿Desactivar el modo mantenimiento?')
    })

    it('clicking "Confirmar" calls toggleMaintenance(false) — toggling from true to false', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Desactivar mantenimiento',
      )!.trigger('click')
      await wrapper.findAll('button').find((b) => b.text().trim() === 'Confirmar')!.trigger('click')
      expect(mockToggleMaintenance).toHaveBeenCalledWith(false)
    })

    it('confirm button has class btn-success (confirm deactivate = safe action)', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Desactivar mantenimiento',
      )!.trigger('click')
      const confirmBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Confirmar')
      expect(confirmBtn!.classes()).toContain('btn-success')
    })

    it('confirm row group has correct aria-label for deactivation', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Desactivar mantenimiento',
      )!.trigger('click')
      const group = wrapper.find('[role="group"]')
      expect(group.attributes('aria-label')).toBe(
        'Confirmar desactivación del modo mantenimiento',
      )
    })

    it('clicking "Cancelar" does NOT call toggleMaintenance', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Desactivar mantenimiento',
      )!.trigger('click')
      await wrapper.findAll('button').find((b) => b.text().trim() === 'Cancelar')!.trigger('click')
      expect(mockToggleMaintenance).not.toHaveBeenCalled()
    })
  })

  // ── Error display ────────────────────────────────────────────

  describe('error display', () => {
    it('shows an alert with role="alert" when error has a value', async () => {
      mockError.value = 'Error del servidor'
      const wrapper = await mountToggle()
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    })

    it('the error alert contains the error message text', async () => {
      mockError.value = 'No tienes permisos para realizar esta acción.'
      const wrapper = await mountToggle()
      expect(wrapper.find('[role="alert"]').text()).toContain(
        'No tienes permisos para realizar esta acción.',
      )
    })

    it('does NOT show the error alert when error is null', async () => {
      mockError.value = null
      const wrapper = await mountToggle()
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })

  // ── Metadata display ─────────────────────────────────────────

  describe('metadata display', () => {
    it('shows "Actualizado por [name]" when status.updated_by is set', async () => {
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = false
      mockMaintenanceStore.status = {
        is_enabled: false,
        updated_by: 'admin@mopetoo.com',
      }
      const wrapper = await mountToggle()
      expect(wrapper.text()).toContain('Actualizado por')
      expect(wrapper.text()).toContain('admin@mopetoo.com')
    })

    it('shows "Última actualización:" when updated_at is set but updated_by is absent', async () => {
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = false
      mockMaintenanceStore.status = {
        is_enabled: false,
        updated_at: '2025-01-15T10:00:00Z',
      }
      const wrapper = await mountToggle()
      expect(wrapper.text()).toContain('Última actualización:')
    })

    it('does NOT show metadata when both updated_by and updated_at are absent', async () => {
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = false
      mockMaintenanceStore.status = { is_enabled: false }
      const wrapper = await mountToggle()
      expect(wrapper.text()).not.toContain('Actualizado por')
      expect(wrapper.text()).not.toContain('Última actualización:')
    })

    it('shows the custom message in an alert-secondary with role="note"', async () => {
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = true
      mockMaintenanceStore.status = {
        is_enabled: true,
        message: 'Estaremos de regreso en 2 horas.',
      }
      const wrapper = await mountToggle()
      const noteEl = wrapper.find('[role="note"]')
      expect(noteEl.exists()).toBe(true)
      expect(noteEl.text()).toContain('Estaremos de regreso en 2 horas.')
    })

    it('note element has aria-label "Mensaje de mantenimiento actual"', async () => {
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = true
      mockMaintenanceStore.status = {
        is_enabled: true,
        message: 'Mensaje de prueba.',
      }
      const wrapper = await mountToggle()
      const noteEl = wrapper.find('[role="note"]')
      expect(noteEl.attributes('aria-label')).toBe('Mensaje de mantenimiento actual')
    })

    it('does NOT show the message note when status.message is absent', async () => {
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = true
      mockMaintenanceStore.status = { is_enabled: true }
      const wrapper = await mountToggle()
      expect(wrapper.find('[role="note"]').exists()).toBe(false)
    })
  })

  // ── Loading during toggle ────────────────────────────────────

  describe('loading state while toggle in flight (isLoading=true, hasStatus=true)', () => {
    beforeEach(() => {
      mockMaintenanceStore.isLoading = true
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = false
      mockMaintenanceStore.status = { is_enabled: false }
    })

    it('the primary action button has the disabled attribute', async () => {
      const wrapper = await mountToggle()
      const actionBtn = wrapper.findAll('button').find(
        (b) => b.text().includes('Activar mantenimiento'),
      )
      expect(actionBtn!.attributes('disabled')).toBeDefined()
    })

    it('shows a spinner inside the action button', async () => {
      const wrapper = await mountToggle()
      expect(wrapper.find('.spinner-border-sm').exists()).toBe(true)
    })

    it('spinner has role="status" and aria-hidden="true"', async () => {
      const wrapper = await mountToggle()
      const spinner = wrapper.find('.spinner-border-sm')
      expect(spinner.attributes('role')).toBe('status')
      expect(spinner.attributes('aria-hidden')).toBe('true')
    })

    it('does NOT show the spinner when isLoading is false', async () => {
      mockMaintenanceStore.isLoading = false
      const wrapper = await mountToggle()
      expect(wrapper.find('.spinner-border-sm').exists()).toBe(false)
    })
  })
})

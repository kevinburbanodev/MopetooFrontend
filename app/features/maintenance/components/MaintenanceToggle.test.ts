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
//     active state, two-step confirm flows (activate and deactivate),
//     activation form inputs, error display, metadata display,
//     estimated return display, onMounted behaviour, and the
//     loading-during-toggle disabled state.
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
const mockActivateMaintenance = vi.fn()
const mockDeactivateMaintenance = vi.fn()
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
    activateMaintenance: mockActivateMaintenance,
    deactivateMaintenance: mockDeactivateMaintenance,
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
            auth: { token: 'admin.jwt', currentEntity: { id: 1, is_admin: true }, entityType: 'user' },
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
    mockActivateMaintenance.mockReset()
    mockDeactivateMaintenance.mockReset()
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
      mockMaintenanceStore.status = { is_active: false }
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
      mockMaintenanceStore.status = { is_active: true }
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
      mockMaintenanceStore.status = { is_active: false }
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

    it('shows the activation form with message and estimated return inputs', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      expect(wrapper.find('#maintenance-message').exists()).toBe(true)
      expect(wrapper.find('#maintenance-estimated-return').exists()).toBe(true)
    })

    it('message input has the correct placeholder', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      expect(wrapper.find('#maintenance-message').attributes('placeholder')).toBe(
        'El sitio se encuentra en mantenimiento.',
      )
    })

    it('estimated return input has type="datetime-local"', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      expect(wrapper.find('#maintenance-estimated-return').attributes('type')).toBe('datetime-local')
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

    it('clicking "Cancelar" does NOT call activateMaintenance', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      const cancelBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Cancelar')
      await cancelBtn!.trigger('click')
      expect(mockActivateMaintenance).not.toHaveBeenCalled()
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

    it('clicking "Cancelar" clears form fields', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      // Type something in the message input
      await wrapper.find('#maintenance-message').setValue('Test message')
      await wrapper.findAll('button').find((b) => b.text().trim() === 'Cancelar')!.trigger('click')
      // Reopen the confirm row
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      expect((wrapper.find('#maintenance-message').element as HTMLInputElement).value).toBe('')
    })

    it('clicking "Confirmar" calls activateMaintenance with default message when input is empty', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      const confirmBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Confirmar')
      await confirmBtn!.trigger('click')
      expect(mockActivateMaintenance).toHaveBeenCalledWith({
        message: 'El sitio se encuentra en mantenimiento.',
        estimated_return: undefined,
      })
    })

    it('clicking "Confirmar" passes the custom message from the input', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      await wrapper.find('#maintenance-message').setValue('Mantenimiento programado')
      await wrapper.findAll('button').find((b) => b.text().trim() === 'Confirmar')!.trigger('click')
      expect(mockActivateMaintenance).toHaveBeenCalledWith({
        message: 'Mantenimiento programado',
        estimated_return: undefined,
      })
    })

    it('clicking "Confirmar" passes the estimated return from the input', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      await wrapper.find('#maintenance-message').setValue('Down for updates')
      await wrapper.find('#maintenance-estimated-return').setValue('2025-01-15T14:00')
      await wrapper.findAll('button').find((b) => b.text().trim() === 'Confirmar')!.trigger('click')
      expect(mockActivateMaintenance).toHaveBeenCalledWith({
        message: 'Down for updates',
        estimated_return: '2025-01-15T14:00',
      })
    })

    it('clicking "Confirmar" calls activateMaintenance exactly once', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      await wrapper.findAll('button').find((b) => b.text().trim() === 'Confirmar')!.trigger('click')
      expect(mockActivateMaintenance).toHaveBeenCalledTimes(1)
    })

    it('clicking "Confirmar" does NOT call deactivateMaintenance', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Activar mantenimiento',
      )!.trigger('click')
      await wrapper.findAll('button').find((b) => b.text().trim() === 'Confirmar')!.trigger('click')
      expect(mockDeactivateMaintenance).not.toHaveBeenCalled()
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
      mockMaintenanceStore.status = { is_active: true }
    })

    it('clicking the action button shows the confirm row with deactivation text', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Desactivar mantenimiento',
      )!.trigger('click')
      expect(wrapper.text()).toContain('¿Desactivar el modo mantenimiento?')
    })

    it('does NOT show the activation form inputs when deactivating', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Desactivar mantenimiento',
      )!.trigger('click')
      expect(wrapper.find('#maintenance-message').exists()).toBe(false)
      expect(wrapper.find('#maintenance-estimated-return').exists()).toBe(false)
    })

    it('clicking "Confirmar" calls deactivateMaintenance', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Desactivar mantenimiento',
      )!.trigger('click')
      await wrapper.findAll('button').find((b) => b.text().trim() === 'Confirmar')!.trigger('click')
      expect(mockDeactivateMaintenance).toHaveBeenCalledTimes(1)
    })

    it('clicking "Confirmar" does NOT call activateMaintenance', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Desactivar mantenimiento',
      )!.trigger('click')
      await wrapper.findAll('button').find((b) => b.text().trim() === 'Confirmar')!.trigger('click')
      expect(mockActivateMaintenance).not.toHaveBeenCalled()
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

    it('clicking "Cancelar" does NOT call deactivateMaintenance', async () => {
      const wrapper = await mountToggle()
      await wrapper.findAll('button').find(
        (b) => b.text().trim() === 'Desactivar mantenimiento',
      )!.trigger('click')
      await wrapper.findAll('button').find((b) => b.text().trim() === 'Cancelar')!.trigger('click')
      expect(mockDeactivateMaintenance).not.toHaveBeenCalled()
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
    it('shows "Activado por admin #ID" when status.activated_by_admin_id is set', async () => {
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = false
      mockMaintenanceStore.status = {
        is_active: false,
        activated_by_admin_id: 42,
      }
      const wrapper = await mountToggle()
      expect(wrapper.text()).toContain('Activado por admin')
      expect(wrapper.text()).toContain('#42')
    })

    it('shows "Última activación:" when activated_at is set but activated_by_admin_id is absent', async () => {
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = false
      mockMaintenanceStore.status = {
        is_active: false,
        activated_at: '2025-01-15T10:00:00Z',
      }
      const wrapper = await mountToggle()
      expect(wrapper.text()).toContain('Última activación:')
    })

    it('does NOT show metadata when both activated_by_admin_id and activated_at are absent', async () => {
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = false
      mockMaintenanceStore.status = { is_active: false }
      const wrapper = await mountToggle()
      expect(wrapper.text()).not.toContain('Activado por admin')
      expect(wrapper.text()).not.toContain('Última activación:')
    })

    it('shows the custom message in an alert-secondary with role="note"', async () => {
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = true
      mockMaintenanceStore.status = {
        is_active: true,
        message: 'Estaremos de regreso en 2 horas.',
      }
      const wrapper = await mountToggle()
      const noteEl = wrapper.findAll('[role="note"]').find(
        (el) => el.attributes('aria-label') === 'Mensaje de mantenimiento actual',
      )
      expect(noteEl).toBeDefined()
      expect(noteEl!.text()).toContain('Estaremos de regreso en 2 horas.')
    })

    it('note element has aria-label "Mensaje de mantenimiento actual"', async () => {
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = true
      mockMaintenanceStore.status = {
        is_active: true,
        message: 'Mensaje de prueba.',
      }
      const wrapper = await mountToggle()
      const noteEl = wrapper.findAll('[role="note"]').find(
        (el) => el.attributes('aria-label') === 'Mensaje de mantenimiento actual',
      )
      expect(noteEl).toBeDefined()
    })

    it('does NOT show the message note when status.message is absent', async () => {
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = true
      mockMaintenanceStore.status = { is_active: true }
      const wrapper = await mountToggle()
      const messageNote = wrapper.findAll('[role="note"]').find(
        (el) => el.attributes('aria-label') === 'Mensaje de mantenimiento actual',
      )
      expect(messageNote).toBeUndefined()
    })
  })

  // ── Estimated return display ──────────────────────────────────

  describe('estimated return display', () => {
    it('shows estimated return info when maintenance is active and estimated_return is set', async () => {
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = true
      mockMaintenanceStore.status = {
        is_active: true,
        estimated_return: '2025-01-15T12:00:00Z',
      }
      const wrapper = await mountToggle()
      expect(wrapper.text()).toContain('Retorno estimado:')
    })

    it('estimated return element has aria-label "Retorno estimado"', async () => {
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = true
      mockMaintenanceStore.status = {
        is_active: true,
        estimated_return: '2025-01-15T12:00:00Z',
      }
      const wrapper = await mountToggle()
      const returnNote = wrapper.findAll('[role="note"]').find(
        (el) => el.attributes('aria-label') === 'Retorno estimado',
      )
      expect(returnNote).toBeDefined()
    })

    it('does NOT show estimated return when maintenance is inactive', async () => {
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = false
      mockMaintenanceStore.status = {
        is_active: false,
        estimated_return: '2025-01-15T12:00:00Z',
      }
      const wrapper = await mountToggle()
      expect(wrapper.text()).not.toContain('Retorno estimado:')
    })

    it('does NOT show estimated return when estimated_return is absent', async () => {
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = true
      mockMaintenanceStore.status = { is_active: true }
      const wrapper = await mountToggle()
      expect(wrapper.text()).not.toContain('Retorno estimado:')
    })
  })

  // ── Loading during toggle ────────────────────────────────────

  describe('loading state while toggle in flight (isLoading=true, hasStatus=true)', () => {
    beforeEach(() => {
      mockMaintenanceStore.isLoading = true
      mockMaintenanceStore.hasStatus = true
      mockMaintenanceStore.isEnabled = false
      mockMaintenanceStore.status = { is_active: false }
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

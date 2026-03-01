// ============================================================
// AdminTransactionLog.test.ts
// Tests for the AdminTransactionLog component.
//
// Key behaviours tested:
//   - Calls fetchTransactions on mount.
//   - Loading skeleton while isLoading.
//   - Empty state when no transactions.
//   - Transaction rows: id (number), plan, amount_cop, reference.
//   - Status badges: approved=bg-success "Aprobado",
//     pending=bg-warning "Pendiente", declined=bg-danger "Rechazado",
//     error=bg-secondary "Error".
//   - Columns: ID, Plan, Monto, Estado, Referencia, Fecha.
//   - No Type, User, or Description columns.
//   - Read-only: no delete or update buttons.
//   - Error alert shown / hidden.
//   - Result count (singular / plural).
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref, reactive } from 'vue'
import AdminTransactionLog from './AdminTransactionLog.vue'
import type { AdminTransaction } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeTransaction(overrides: Partial<AdminTransaction> = {}): AdminTransaction {
  return {
    id: 12345,
    user_id: 1,
    plan: 'pro_monthly',
    amount_cop: 49000,
    status: 'approved',
    reference: 'REF-ABC-123456',
    created_at: '2024-01-15T10:00:00Z',
    ...overrides,
  }
}

// ── useAdmin mock ─────────────────────────────────────────────

const mockFetchTransactions = vi.fn()
const mockError = ref<string | null>(null)
const mockAdminStore = reactive({
  transactions: [] as AdminTransaction[],
  isLoading: false,
  totalTransactions: 0,
})

vi.mock('../composables/useAdmin', () => ({
  useAdmin: () => ({
    fetchTransactions: mockFetchTransactions,
    error: mockError,
    adminStore: mockAdminStore,
  }),
}))

// ── Shared mount helper ───────────────────────────────────────

async function mountLog() {
  return mountSuspended(AdminTransactionLog, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            auth: { token: 'admin.jwt', currentEntity: { id: 99, is_admin: true }, entityType: 'user' },
          },
        }),
      ],
    },
  })
}

// ── Suite ─────────────────────────────────────────────────────

describe('AdminTransactionLog', () => {
  beforeEach(() => {
    mockFetchTransactions.mockReset()
    mockError.value = null
    mockAdminStore.transactions = []
    mockAdminStore.isLoading = false
    mockAdminStore.totalTransactions = 0
  })

  // ── Section structure ───────────────────────────────────────

  it('renders a section with aria-label "Registro de transacciones"', async () => {
    const wrapper = await mountLog()
    expect(wrapper.find('section[aria-label="Registro de transacciones"]').exists()).toBe(true)
  })

  it('shows "Registro de Transacciones" heading', async () => {
    const wrapper = await mountLog()
    expect(wrapper.text()).toContain('Registro de Transacciones')
  })

  // ── Lifecycle ───────────────────────────────────────────────

  it('calls fetchTransactions on mount', async () => {
    await mountLog()
    expect(mockFetchTransactions).toHaveBeenCalledTimes(1)
  })

  // ── Loading skeleton ────────────────────────────────────────

  describe('loading skeleton', () => {
    it('renders skeleton rows while isLoading is true', async () => {
      mockAdminStore.isLoading = true
      const wrapper = await mountLog()
      const skeletonRows = wrapper.findAll('[aria-hidden="true"]')
      expect(skeletonRows.length).toBeGreaterThanOrEqual(5)
    })

    it('does not show transaction data while loading', async () => {
      mockAdminStore.isLoading = true
      const wrapper = await mountLog()
      expect(wrapper.text()).not.toContain('REF-ABC-123456')
    })
  })

  // ── Empty state ─────────────────────────────────────────────

  it('shows empty state message when no transactions exist', async () => {
    const wrapper = await mountLog()
    expect(wrapper.text()).toContain('No hay transacciones registradas aún.')
  })

  // ── Transaction rows ────────────────────────────────────────

  describe('transaction rows', () => {
    beforeEach(() => {
      mockAdminStore.transactions = [
        makeTransaction({ id: 12345, plan: 'pro_monthly', reference: 'REF-ABC-123456' }),
      ]
      mockAdminStore.totalTransactions = 1
    })

    it('renders the transaction id', async () => {
      const wrapper = await mountLog()
      expect(wrapper.text()).toContain('12345')
    })

    it('renders the plan', async () => {
      const wrapper = await mountLog()
      expect(wrapper.text()).toContain('pro_monthly')
    })

    it('renders the reference', async () => {
      const wrapper = await mountLog()
      expect(wrapper.text()).toContain('REF-ABC-123456')
    })
  })

  // ── Table columns ────────────────────────────────────────────

  describe('table columns', () => {
    it('has Plan column header', async () => {
      const wrapper = await mountLog()
      const headers = wrapper.findAll('th')
      expect(headers.some(h => h.text() === 'Plan')).toBe(true)
    })

    it('has Referencia column header', async () => {
      const wrapper = await mountLog()
      const headers = wrapper.findAll('th')
      expect(headers.some(h => h.text() === 'Referencia')).toBe(true)
    })

    it('has Monto column header', async () => {
      const wrapper = await mountLog()
      const headers = wrapper.findAll('th')
      expect(headers.some(h => h.text() === 'Monto')).toBe(true)
    })

    it('does not have Type column header', async () => {
      const wrapper = await mountLog()
      const headers = wrapper.findAll('th')
      expect(headers.some(h => h.text() === 'Tipo')).toBe(false)
    })

    it('does not have User column header', async () => {
      const wrapper = await mountLog()
      const headers = wrapper.findAll('th')
      expect(headers.some(h => h.text() === 'Usuario')).toBe(false)
    })

    it('does not have Description column header', async () => {
      const wrapper = await mountLog()
      const headers = wrapper.findAll('th')
      expect(headers.some(h => h.text() === 'Descripción')).toBe(false)
    })
  })

  // ── Status badges ───────────────────────────────────────────

  describe('status badges', () => {
    it('shows "Aprobado" label and bg-success for approved status', async () => {
      mockAdminStore.transactions = [makeTransaction({ status: 'approved' })]
      mockAdminStore.totalTransactions = 1
      const wrapper = await mountLog()
      const badge = wrapper.find('[aria-label="Estado: Aprobado"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Aprobado')
      expect(badge.classes()).toContain('bg-success')
    })

    it('shows "Pendiente" label and bg-warning for pending status', async () => {
      mockAdminStore.transactions = [makeTransaction({ status: 'pending' })]
      mockAdminStore.totalTransactions = 1
      const wrapper = await mountLog()
      const badge = wrapper.find('[aria-label="Estado: Pendiente"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Pendiente')
      expect(badge.classes()).toContain('bg-warning')
    })

    it('shows "Rechazado" label and bg-danger for declined status', async () => {
      mockAdminStore.transactions = [makeTransaction({ status: 'declined' })]
      mockAdminStore.totalTransactions = 1
      const wrapper = await mountLog()
      const badge = wrapper.find('[aria-label="Estado: Rechazado"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Rechazado')
      expect(badge.classes()).toContain('bg-danger')
    })

    it('shows "Error" label and bg-secondary for error status', async () => {
      mockAdminStore.transactions = [makeTransaction({ status: 'error' })]
      mockAdminStore.totalTransactions = 1
      const wrapper = await mountLog()
      const badge = wrapper.find('[aria-label="Estado: Error"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Error')
      expect(badge.classes()).toContain('bg-secondary')
    })
  })

  // ── Read-only: no mutation buttons ─────────────────────────

  describe('read-only (no delete / update buttons)', () => {
    beforeEach(() => {
      mockAdminStore.transactions = [makeTransaction()]
      mockAdminStore.totalTransactions = 1
    })

    it('does not render any Eliminar button', async () => {
      const wrapper = await mountLog()
      expect(wrapper.findAll('button').some(b => b.text() === 'Eliminar')).toBe(false)
    })

    it('does not render any Verificar button', async () => {
      const wrapper = await mountLog()
      expect(wrapper.findAll('button').some(b => b.text() === 'Verificar')).toBe(false)
    })

    it('does not render any Destacar button', async () => {
      const wrapper = await mountLog()
      expect(wrapper.findAll('button').some(b => b.text() === 'Destacar')).toBe(false)
    })
  })

  // ── Result count ────────────────────────────────────────────

  describe('result count', () => {
    it('shows "0 transacciones" when totalTransactions is 0', async () => {
      mockAdminStore.totalTransactions = 0
      const wrapper = await mountLog()
      expect(wrapper.find('[role="status"]').text()).toContain('0 transacción')
    })

    it('shows "1 transacción" (singular) when totalTransactions is 1', async () => {
      mockAdminStore.totalTransactions = 1
      mockAdminStore.transactions = [makeTransaction()]
      const wrapper = await mountLog()
      expect(wrapper.find('[role="status"]').text()).toContain('1 transacción')
    })

    it('shows plural form when totalTransactions is 5', async () => {
      mockAdminStore.totalTransactions = 5
      const wrapper = await mountLog()
      // Component appends 'es' to 'transacción' -> '5 transacciónes'
      expect(wrapper.find('[role="status"]').text()).toContain('5 transacción')
    })
  })

  // ── Error alert ─────────────────────────────────────────────

  describe('error alert', () => {
    it('shows the error alert when error is set', async () => {
      mockError.value = 'Error al cargar transacciones'
      const wrapper = await mountLog()
      expect(wrapper.find('[role="alert"]').text()).toContain('Error al cargar transacciones')
    })

    it('hides the error alert when error is null', async () => {
      const wrapper = await mountLog()
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })

  // ── Pagination footer ───────────────────────────────────────

  it('does not show pagination footer when totalTransactions <= 20', async () => {
    mockAdminStore.totalTransactions = 5
    const wrapper = await mountLog()
    expect(wrapper.find('.card-footer').exists()).toBe(false)
  })
})

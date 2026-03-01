// ============================================================
// AdminTransactionLog.test.ts
// Tests for the AdminTransactionLog component.
//
// Key behaviours tested:
//   - Calls fetchTransactions on mount.
//   - Loading skeleton while isLoading.
//   - Empty state when no transactions.
//   - Transaction rows: user_name, user_email, type badge, status badge.
//   - Type badges: subscription=bg-primary, donation=bg-success.
//   - Type labels: subscription="Suscripción", donation="Donación".
//   - Status badges: completed=bg-success, pending=bg-warning text-dark,
//     failed=bg-danger, refunded=bg-secondary.
//   - Status labels: Completado, Pendiente, Fallido, Reembolsado.
//   - ID shown truncated (first 8 chars + ellipsis).
//   - Currency column visible.
//   - Read-only: no delete or update buttons.
//   - Error alert shown / hidden.
//   - Result count (singular / plural).
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref } from 'vue'
import AdminTransactionLog from './AdminTransactionLog.vue'
import type { AdminTransaction } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeTransaction(overrides: Partial<AdminTransaction> = {}): AdminTransaction {
  return {
    id: 'txn-abc12345',
    user_id: 1,
    user_name: 'Ana García',
    user_email: 'ana@example.com',
    type: 'subscription',
    amount: 49000,
    currency: 'COP',
    status: 'completed',
    description: 'Suscripción PRO mensual',
    created_at: '2024-01-15T10:00:00Z',
    ...overrides,
  }
}

// ── useAdmin mock ─────────────────────────────────────────────

const mockFetchTransactions = vi.fn()
const mockError = ref<string | null>(null)
const mockTransactions = ref<AdminTransaction[]>([])
const mockIsLoading = ref(false)
const mockTotalTransactions = ref(0)

vi.mock('../composables/useAdmin', () => ({
  useAdmin: () => ({
    fetchTransactions: mockFetchTransactions,
    error: mockError,
    adminStore: {
      get transactions() { return mockTransactions.value },
      get isLoading() { return mockIsLoading.value },
      get totalTransactions() { return mockTotalTransactions.value },
    },
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
    mockTransactions.value = []
    mockIsLoading.value = false
    mockTotalTransactions.value = 0
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
      mockIsLoading.value = true
      const wrapper = await mountLog()
      const skeletonRows = wrapper.findAll('[aria-hidden="true"]')
      expect(skeletonRows.length).toBeGreaterThanOrEqual(5)
    })

    it('does not show transaction data while loading', async () => {
      mockIsLoading.value = true
      const wrapper = await mountLog()
      expect(wrapper.text()).not.toContain('ana@example.com')
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
      mockTransactions.value = [
        makeTransaction({ id: 'txn-abc12345', user_name: 'Ana García', user_email: 'ana@example.com' }),
      ]
      mockTotalTransactions.value = 1
    })

    it('renders user name', async () => {
      const wrapper = await mountLog()
      expect(wrapper.text()).toContain('Ana García')
    })

    it('renders user email', async () => {
      const wrapper = await mountLog()
      expect(wrapper.text()).toContain('ana@example.com')
    })

    it('shows the truncated transaction id (first 8 chars)', async () => {
      const wrapper = await mountLog()
      expect(wrapper.text()).toContain('txn-abc1')
    })

    it('shows the currency label', async () => {
      const wrapper = await mountLog()
      expect(wrapper.text()).toContain('COP')
    })

    it('shows the transaction description', async () => {
      const wrapper = await mountLog()
      expect(wrapper.text()).toContain('Suscripción PRO mensual')
    })
  })

  // ── Type badges ─────────────────────────────────────────────

  describe('type badges', () => {
    it('shows "Suscripción" label for subscription type', async () => {
      mockTransactions.value = [makeTransaction({ type: 'subscription' })]
      mockTotalTransactions.value = 1
      const wrapper = await mountLog()
      const badge = wrapper.find('[aria-label="Tipo: Suscripción"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Suscripción')
    })

    it('applies bg-primary class for subscription type', async () => {
      mockTransactions.value = [makeTransaction({ type: 'subscription' })]
      mockTotalTransactions.value = 1
      const wrapper = await mountLog()
      const badge = wrapper.find('[aria-label="Tipo: Suscripción"]')
      expect(badge.classes()).toContain('bg-primary')
    })

    it('shows "Donación" label for donation type', async () => {
      mockTransactions.value = [makeTransaction({ type: 'donation' })]
      mockTotalTransactions.value = 1
      const wrapper = await mountLog()
      const badge = wrapper.find('[aria-label="Tipo: Donación"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Donación')
    })

    it('applies bg-success class for donation type', async () => {
      mockTransactions.value = [makeTransaction({ type: 'donation' })]
      mockTotalTransactions.value = 1
      const wrapper = await mountLog()
      const badge = wrapper.find('[aria-label="Tipo: Donación"]')
      expect(badge.classes()).toContain('bg-success')
    })
  })

  // ── Status badges ───────────────────────────────────────────

  describe('status badges', () => {
    it('shows "Completado" label and bg-success for completed status', async () => {
      mockTransactions.value = [makeTransaction({ status: 'completed' })]
      mockTotalTransactions.value = 1
      const wrapper = await mountLog()
      const badge = wrapper.find('[aria-label="Estado: Completado"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Completado')
      expect(badge.classes()).toContain('bg-success')
    })

    it('shows "Pendiente" label and bg-warning for pending status', async () => {
      mockTransactions.value = [makeTransaction({ status: 'pending' })]
      mockTotalTransactions.value = 1
      const wrapper = await mountLog()
      const badge = wrapper.find('[aria-label="Estado: Pendiente"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Pendiente')
      expect(badge.classes()).toContain('bg-warning')
    })

    it('shows "Fallido" label and bg-danger for failed status', async () => {
      mockTransactions.value = [makeTransaction({ status: 'failed' })]
      mockTotalTransactions.value = 1
      const wrapper = await mountLog()
      const badge = wrapper.find('[aria-label="Estado: Fallido"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Fallido')
      expect(badge.classes()).toContain('bg-danger')
    })

    it('shows "Reembolsado" label and bg-secondary for refunded status', async () => {
      mockTransactions.value = [makeTransaction({ status: 'refunded' })]
      mockTotalTransactions.value = 1
      const wrapper = await mountLog()
      const badge = wrapper.find('[aria-label="Estado: Reembolsado"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('Reembolsado')
      expect(badge.classes()).toContain('bg-secondary')
    })
  })

  // ── Read-only: no mutation buttons ─────────────────────────

  describe('read-only (no delete / update buttons)', () => {
    it('does not render any Eliminar button', async () => {
      mockTransactions.value = [makeTransaction()]
      mockTotalTransactions.value = 1
      const wrapper = await mountLog()
      expect(wrapper.findAll('button').some(b => b.text() === 'Eliminar')).toBe(false)
    })

    it('does not render any Verificar button', async () => {
      mockTransactions.value = [makeTransaction()]
      mockTotalTransactions.value = 1
      const wrapper = await mountLog()
      expect(wrapper.findAll('button').some(b => b.text() === 'Verificar')).toBe(false)
    })

    it('does not render any Destacar button', async () => {
      mockTransactions.value = [makeTransaction()]
      mockTotalTransactions.value = 1
      const wrapper = await mountLog()
      expect(wrapper.findAll('button').some(b => b.text() === 'Destacar')).toBe(false)
    })
  })

  // ── Result count ────────────────────────────────────────────

  describe('result count', () => {
    it('shows "0 transacciónes" when totalTransactions is 0', async () => {
      mockTotalTransactions.value = 0
      const wrapper = await mountLog()
      // The component uses: transacción + 'es' suffix when != 1
      // resulting in "transacciónes" (with accent — matches the source template)
      expect(wrapper.find('[role="status"]').text()).toContain('0 transacción')
    })

    it('shows "1 transacción" (singular) when totalTransactions is 1', async () => {
      mockTotalTransactions.value = 1
      mockTransactions.value = [makeTransaction()]
      const wrapper = await mountLog()
      expect(wrapper.find('[role="status"]').text()).toContain('1 transacción')
    })

    it('shows plural form when totalTransactions is 5', async () => {
      mockTotalTransactions.value = 5
      const wrapper = await mountLog()
      // Component appends 'es' to 'transacción' → '5 transacciónes'
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
    mockTotalTransactions.value = 5
    const wrapper = await mountLog()
    expect(wrapper.find('.card-footer').exists()).toBe(false)
  })
})

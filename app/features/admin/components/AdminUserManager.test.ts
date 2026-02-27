// ============================================================
// AdminUserManager.test.ts
// Tests for the AdminUserManager component.
//
// Behaviours tested:
//   - Calls fetchUsers (via loadUsers) on mount.
//   - Loading skeleton: 5 rows rendered while isLoading is true.
//   - Empty state shown when no users.
//   - User rows rendered with name, email, city.
//   - PRO badge shown for is_pro users; dash shown otherwise.
//   - Admin badge shown for is_admin users; dash shown otherwise.
//   - Toggle PRO calls updateUser with toggled boolean.
//   - Toggle Admin calls updateUser with toggled boolean.
//   - 2-step delete: first click shows ¿Confirmar? / Cancelar,
//     second click calls deleteUser, Cancelar hides confirmation.
//   - Result count text (singular / plural).
//   - Error alert shown / hidden.
//   - Pagination footer hidden when totalUsers <= 20.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref, nextTick } from 'vue'
import AdminUserManager from './AdminUserManager.vue'
import type { AdminUser } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 1,
    name: 'Ana',
    last_name: 'García',
    email: 'ana@example.com',
    country: 'Colombia',
    city: 'Bogotá',
    is_pro: false,
    is_admin: false,
    pets_count: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── useAdmin mock ─────────────────────────────────────────────

const mockFetchUsers = vi.fn()
const mockUpdateUser = vi.fn()
const mockDeleteUser = vi.fn()
const mockError = ref<string | null>(null)
const mockUsers = ref<AdminUser[]>([])
const mockIsLoading = ref(false)
const mockTotalUsers = ref(0)

vi.mock('../composables/useAdmin', () => ({
  useAdmin: () => ({
    fetchUsers: mockFetchUsers,
    updateUser: mockUpdateUser,
    deleteUser: mockDeleteUser,
    error: mockError,
    adminStore: {
      get users() { return mockUsers.value },
      get isLoading() { return mockIsLoading.value },
      get totalUsers() { return mockTotalUsers.value },
    },
  }),
}))

// ── Shared mount helper ───────────────────────────────────────

async function mountManager() {
  return mountSuspended(AdminUserManager, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            auth: { token: 'admin.jwt', currentUser: { id: 99, is_admin: true } },
          },
        }),
      ],
    },
  })
}

// ── Suite ─────────────────────────────────────────────────────

describe('AdminUserManager', () => {
  beforeEach(() => {
    mockFetchUsers.mockReset()
    mockUpdateUser.mockReset()
    mockDeleteUser.mockReset()
    mockError.value = null
    mockUsers.value = []
    mockIsLoading.value = false
    mockTotalUsers.value = 0
  })

  // ── Section structure ───────────────────────────────────────

  it('renders a section with aria-label "Gestión de usuarios"', async () => {
    const wrapper = await mountManager()
    expect(wrapper.find('section[aria-label="Gestión de usuarios"]').exists()).toBe(true)
  })

  // ── Lifecycle ───────────────────────────────────────────────

  it('calls fetchUsers on mount', async () => {
    await mountManager()
    expect(mockFetchUsers).toHaveBeenCalledTimes(1)
  })

  // ── Loading skeleton ────────────────────────────────────────

  describe('loading skeleton', () => {
    it('shows 5 skeleton table rows while isLoading is true', async () => {
      mockIsLoading.value = true
      const wrapper = await mountManager()
      const skeletonRows = wrapper.findAll('[aria-hidden="true"]')
      expect(skeletonRows.length).toBeGreaterThanOrEqual(5)
    })

    it('does not show data rows while loading', async () => {
      mockIsLoading.value = true
      const wrapper = await mountManager()
      expect(wrapper.text()).not.toContain('ana@example.com')
    })
  })

  // ── Empty state ─────────────────────────────────────────────

  it('shows empty state message when no users exist', async () => {
    const wrapper = await mountManager()
    expect(wrapper.text()).toContain('No se encontraron usuarios con los filtros actuales.')
  })

  // ── User rows ───────────────────────────────────────────────

  describe('user rows', () => {
    beforeEach(() => {
      mockUsers.value = [
        makeUser({ id: 1, name: 'Ana', last_name: 'García', email: 'ana@example.com', city: 'Bogotá', is_pro: false, is_admin: false }),
        makeUser({ id: 2, name: 'Carlos', last_name: 'López', email: 'carlos@example.com', city: 'Medellín', is_pro: true, is_admin: false }),
      ]
      mockTotalUsers.value = 2
    })

    it('renders user full name', async () => {
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('Ana García')
    })

    it('renders user email', async () => {
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('ana@example.com')
    })

    it('renders user city', async () => {
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('Bogotá')
    })

    it('shows PRO badge for users with is_pro=true', async () => {
      const wrapper = await mountManager()
      const badge = wrapper.find('[aria-label="Usuario PRO"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toContain('PRO')
    })

    it('shows dash for users with is_pro=false', async () => {
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Usuario sin plan PRO"]').exists()).toBe(true)
    })

    it('does not show Admin badge for non-admin users', async () => {
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Usuario administrador"]').exists()).toBe(false)
    })
  })

  // ── Admin badge ─────────────────────────────────────────────

  it('shows Admin badge for users with is_admin=true', async () => {
    mockUsers.value = [makeUser({ id: 1, is_admin: true })]
    mockTotalUsers.value = 1
    const wrapper = await mountManager()
    expect(wrapper.find('[aria-label="Usuario administrador"]').exists()).toBe(true)
  })

  // ── Toggle PRO ──────────────────────────────────────────────

  describe('toggle PRO', () => {
    it('shows "Dar PRO" button for non-PRO user', async () => {
      mockUsers.value = [makeUser({ id: 1, is_pro: false })]
      mockTotalUsers.value = 1
      const wrapper = await mountManager()
      const proBtn = wrapper.findAll('button').find(b => b.text().includes('Dar PRO'))
      expect(proBtn).toBeDefined()
    })

    it('calls updateUser with { is_pro: true } when "Dar PRO" is clicked', async () => {
      mockUpdateUser.mockResolvedValue(true)
      mockUsers.value = [makeUser({ id: 1, is_pro: false })]
      mockTotalUsers.value = 1
      const wrapper = await mountManager()
      const proBtn = wrapper.findAll('button').find(b => b.text().includes('Dar PRO'))
      await proBtn!.trigger('click')
      expect(mockUpdateUser).toHaveBeenCalledWith(1, { is_pro: true })
    })

    it('shows "Quitar PRO" button for PRO user', async () => {
      mockUsers.value = [makeUser({ id: 1, is_pro: true })]
      mockTotalUsers.value = 1
      const wrapper = await mountManager()
      const proBtn = wrapper.findAll('button').find(b => b.text().includes('Quitar PRO'))
      expect(proBtn).toBeDefined()
    })

    it('calls updateUser with { is_pro: false } when "Quitar PRO" is clicked', async () => {
      mockUpdateUser.mockResolvedValue(true)
      mockUsers.value = [makeUser({ id: 1, is_pro: true })]
      mockTotalUsers.value = 1
      const wrapper = await mountManager()
      const proBtn = wrapper.findAll('button').find(b => b.text().includes('Quitar PRO'))
      await proBtn!.trigger('click')
      expect(mockUpdateUser).toHaveBeenCalledWith(1, { is_pro: false })
    })
  })

  // ── Toggle Admin ────────────────────────────────────────────

  describe('toggle Admin', () => {
    it('calls updateUser with { is_admin: true } when "Dar Admin" is clicked', async () => {
      mockUpdateUser.mockResolvedValue(true)
      mockUsers.value = [makeUser({ id: 1, is_admin: false })]
      mockTotalUsers.value = 1
      const wrapper = await mountManager()
      const adminBtn = wrapper.findAll('button').find(b => b.text().includes('Dar Admin'))
      await adminBtn!.trigger('click')
      expect(mockUpdateUser).toHaveBeenCalledWith(1, { is_admin: true })
    })

    it('calls updateUser with { is_admin: false } when "Quitar Admin" is clicked', async () => {
      mockUpdateUser.mockResolvedValue(true)
      mockUsers.value = [makeUser({ id: 1, is_admin: true })]
      mockTotalUsers.value = 1
      const wrapper = await mountManager()
      const adminBtn = wrapper.findAll('button').find(b => b.text().includes('Quitar Admin'))
      await adminBtn!.trigger('click')
      expect(mockUpdateUser).toHaveBeenCalledWith(1, { is_admin: false })
    })
  })

  // ── 2-step delete ───────────────────────────────────────────

  describe('2-step delete confirmation', () => {
    beforeEach(() => {
      mockUsers.value = [makeUser({ id: 1, name: 'Ana', last_name: 'García' })]
      mockTotalUsers.value = 1
    })

    it('shows "Eliminar" button initially', async () => {
      const wrapper = await mountManager()
      expect(wrapper.findAll('button').some(b => b.text() === 'Eliminar')).toBe(true)
    })

    it('shows ¿Confirmar? after clicking Eliminar', async () => {
      const wrapper = await mountManager()
      const deleteBtn = wrapper.findAll('button').find(b => b.text() === 'Eliminar')
      await deleteBtn!.trigger('click')
      expect(wrapper.text()).toContain('¿Confirmar?')
    })

    it('shows Cancelar button after clicking Eliminar', async () => {
      const wrapper = await mountManager()
      const deleteBtn = wrapper.findAll('button').find(b => b.text() === 'Eliminar')
      await deleteBtn!.trigger('click')
      expect(wrapper.findAll('button').some(b => b.text() === 'Cancelar')).toBe(true)
    })

    it('does not call deleteUser on first click (Eliminar)', async () => {
      const wrapper = await mountManager()
      const deleteBtn = wrapper.findAll('button').find(b => b.text() === 'Eliminar')
      await deleteBtn!.trigger('click')
      expect(mockDeleteUser).not.toHaveBeenCalled()
    })

    it('calls deleteUser with userId when ¿Confirmar? is clicked', async () => {
      mockDeleteUser.mockResolvedValue(true)
      const wrapper = await mountManager()
      const deleteBtn = wrapper.findAll('button').find(b => b.text() === 'Eliminar')
      await deleteBtn!.trigger('click')
      const confirmBtn = wrapper.findAll('button').find(b => b.text() === '¿Confirmar?')
      await confirmBtn!.trigger('click')
      expect(mockDeleteUser).toHaveBeenCalledWith(1)
    })

    it('hides ¿Confirmar? after clicking Cancelar', async () => {
      const wrapper = await mountManager()
      const deleteBtn = wrapper.findAll('button').find(b => b.text() === 'Eliminar')
      await deleteBtn!.trigger('click')
      const cancelBtn = wrapper.findAll('button').find(b => b.text() === 'Cancelar')
      await cancelBtn!.trigger('click')
      expect(wrapper.text()).not.toContain('¿Confirmar?')
    })

    it('does not call deleteUser when Cancelar is clicked', async () => {
      const wrapper = await mountManager()
      const deleteBtn = wrapper.findAll('button').find(b => b.text() === 'Eliminar')
      await deleteBtn!.trigger('click')
      const cancelBtn = wrapper.findAll('button').find(b => b.text() === 'Cancelar')
      await cancelBtn!.trigger('click')
      expect(mockDeleteUser).not.toHaveBeenCalled()
    })
  })

  // ── Result count ────────────────────────────────────────────

  describe('result count text', () => {
    it('shows "0 usuarios" when there are no users', async () => {
      mockTotalUsers.value = 0
      const wrapper = await mountManager()
      const statusEl = wrapper.find('[role="status"]')
      expect(statusEl.text()).toContain('0 usuarios')
    })

    it('shows "1 usuario" (singular) when totalUsers is 1', async () => {
      mockTotalUsers.value = 1
      mockUsers.value = [makeUser()]
      const wrapper = await mountManager()
      const statusEl = wrapper.find('[role="status"]')
      expect(statusEl.text()).toContain('1 usuario')
      expect(statusEl.text()).not.toContain('1 usuarios')
    })

    it('shows "2 usuarios" (plural) when totalUsers is 2', async () => {
      mockTotalUsers.value = 2
      const wrapper = await mountManager()
      const statusEl = wrapper.find('[role="status"]')
      expect(statusEl.text()).toContain('2 usuarios')
    })
  })

  // ── Error alert ─────────────────────────────────────────────

  describe('error alert', () => {
    it('shows the error alert when error is set', async () => {
      mockError.value = 'Error al cargar usuarios'
      const wrapper = await mountManager()
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(wrapper.find('[role="alert"]').text()).toContain('Error al cargar usuarios')
    })

    it('hides the error alert when error is null', async () => {
      mockError.value = null
      const wrapper = await mountManager()
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })

  // ── Pagination ──────────────────────────────────────────────

  it('does not show pagination footer when totalUsers <= 20', async () => {
    mockTotalUsers.value = 5
    mockUsers.value = [makeUser()]
    const wrapper = await mountManager()
    expect(wrapper.find('.card-footer').exists()).toBe(false)
  })
})

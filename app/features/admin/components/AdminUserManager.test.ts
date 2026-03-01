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
//   - is_active status badge (Activo / Inactivo).
//   - Toggle PRO calls grantPro / revokePro.
//   - Toggle Admin calls grantAdmin / revokeAdmin.
//   - Activate / Deactivate calls activateUser / deactivateUser.
//   - Self-protection: admin toggle AND activate/deactivate disabled
//     for the logged-in admin's own row.
//   - Filter controls: plan select, active toggle.
//   - Result count text (singular / plural).
//   - Error alert shown / hidden.
//   - Pagination footer hidden when totalUsers <= 20.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref, reactive } from 'vue'
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
    is_active: true,
    pets_count: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── useAdmin mock ─────────────────────────────────────────────

const mockFetchUsers = vi.fn()
const mockGrantPro = vi.fn()
const mockRevokePro = vi.fn()
const mockGrantAdmin = vi.fn()
const mockRevokeAdmin = vi.fn()
const mockActivateUser = vi.fn()
const mockDeactivateUser = vi.fn()
const mockError = ref<string | null>(null)
const mockAdminStore = reactive({
  users: [] as AdminUser[],
  isLoading: false,
  totalUsers: 0,
})

vi.mock('../composables/useAdmin', () => ({
  useAdmin: () => ({
    fetchUsers: mockFetchUsers,
    grantPro: mockGrantPro,
    revokePro: mockRevokePro,
    grantAdmin: mockGrantAdmin,
    revokeAdmin: mockRevokeAdmin,
    activateUser: mockActivateUser,
    deactivateUser: mockDeactivateUser,
    error: mockError,
    adminStore: mockAdminStore,
  }),
}))

// ── Shared mount helper ───────────────────────────────────────

async function mountManager() {
  return mountSuspended(AdminUserManager, {
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

describe('AdminUserManager', () => {
  beforeEach(() => {
    mockFetchUsers.mockReset()
    mockGrantPro.mockReset()
    mockRevokePro.mockReset()
    mockGrantAdmin.mockReset()
    mockRevokeAdmin.mockReset()
    mockActivateUser.mockReset()
    mockDeactivateUser.mockReset()
    mockError.value = null
    mockAdminStore.users = []
    mockAdminStore.isLoading = false
    mockAdminStore.totalUsers = 0
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
      mockAdminStore.isLoading = true
      const wrapper = await mountManager()
      const skeletonRows = wrapper.findAll('[aria-hidden="true"]')
      expect(skeletonRows.length).toBeGreaterThanOrEqual(5)
    })

    it('does not show data rows while loading', async () => {
      mockAdminStore.isLoading = true
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
      mockAdminStore.users = [
        makeUser({ id: 1, name: 'Ana', last_name: 'García', email: 'ana@example.com', city: 'Bogotá', is_pro: false, is_admin: false, is_active: true }),
        makeUser({ id: 2, name: 'Carlos', last_name: 'López', email: 'carlos@example.com', city: 'Medellín', is_pro: true, is_admin: false, is_active: true }),
      ]
      mockAdminStore.totalUsers = 2
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
    mockAdminStore.users = [makeUser({ id: 1, is_admin: true })]
    mockAdminStore.totalUsers = 1
    const wrapper = await mountManager()
    expect(wrapper.find('[aria-label="Usuario administrador"]').exists()).toBe(true)
  })

  // ── is_active status badge ─────────────────────────────────

  describe('active status badge', () => {
    it('shows Activo badge for active users', async () => {
      mockAdminStore.users = [makeUser({ id: 1, is_active: true })]
      mockAdminStore.totalUsers = 1
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Usuario activo"]').exists()).toBe(true)
    })

    it('shows Inactivo badge for inactive users', async () => {
      mockAdminStore.users = [makeUser({ id: 1, is_active: false })]
      mockAdminStore.totalUsers = 1
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Usuario inactivo"]').exists()).toBe(true)
    })
  })

  // ── Toggle PRO ──────────────────────────────────────────────

  describe('toggle PRO', () => {
    it('shows "Dar PRO" button for non-PRO user', async () => {
      mockAdminStore.users = [makeUser({ id: 1, is_pro: false })]
      mockAdminStore.totalUsers = 1
      const wrapper = await mountManager()
      const proBtn = wrapper.findAll('button').find(b => b.text().includes('Dar PRO'))
      expect(proBtn).toBeDefined()
    })

    it('calls grantPro when "Dar PRO" is clicked', async () => {
      mockGrantPro.mockResolvedValue(true)
      mockAdminStore.users = [makeUser({ id: 1, is_pro: false })]
      mockAdminStore.totalUsers = 1
      const wrapper = await mountManager()
      const proBtn = wrapper.findAll('button').find(b => b.text().includes('Dar PRO'))
      await proBtn!.trigger('click')
      expect(mockGrantPro).toHaveBeenCalledWith(1, 'pro_monthly')
    })

    it('shows "Quitar PRO" button for PRO user', async () => {
      mockAdminStore.users = [makeUser({ id: 1, is_pro: true })]
      mockAdminStore.totalUsers = 1
      const wrapper = await mountManager()
      const proBtn = wrapper.findAll('button').find(b => b.text().includes('Quitar PRO'))
      expect(proBtn).toBeDefined()
    })

    it('calls revokePro when "Quitar PRO" is clicked', async () => {
      mockRevokePro.mockResolvedValue(true)
      mockAdminStore.users = [makeUser({ id: 1, is_pro: true })]
      mockAdminStore.totalUsers = 1
      const wrapper = await mountManager()
      const proBtn = wrapper.findAll('button').find(b => b.text().includes('Quitar PRO'))
      await proBtn!.trigger('click')
      expect(mockRevokePro).toHaveBeenCalledWith(1)
    })
  })

  // ── Toggle Admin ────────────────────────────────────────────

  describe('toggle Admin', () => {
    it('calls grantAdmin when "Dar Admin" is clicked', async () => {
      mockGrantAdmin.mockResolvedValue(true)
      mockAdminStore.users = [makeUser({ id: 1, is_admin: false })]
      mockAdminStore.totalUsers = 1
      const wrapper = await mountManager()
      const adminBtn = wrapper.findAll('button').find(b => b.text().includes('Dar Admin'))
      await adminBtn!.trigger('click')
      expect(mockGrantAdmin).toHaveBeenCalledWith(1)
    })

    it('calls revokeAdmin when "Quitar Admin" is clicked', async () => {
      mockRevokeAdmin.mockResolvedValue(true)
      mockAdminStore.users = [makeUser({ id: 1, is_admin: true })]
      mockAdminStore.totalUsers = 1
      const wrapper = await mountManager()
      const adminBtn = wrapper.findAll('button').find(b => b.text().includes('Quitar Admin'))
      await adminBtn!.trigger('click')
      expect(mockRevokeAdmin).toHaveBeenCalledWith(1)
    })

    it('disables admin toggle for the logged-in admin (self-protection)', async () => {
      mockAdminStore.users = [makeUser({ id: 99, is_admin: true })]
      mockAdminStore.totalUsers = 1
      const wrapper = await mountManager()
      const adminBtn = wrapper.findAll('button').find(b => b.text().includes('Quitar Admin'))
      expect(adminBtn!.attributes('disabled')).toBeDefined()
    })
  })

  // ── Activate / Deactivate ───────────────────────────────────

  describe('activate / deactivate', () => {
    it('shows "Desactivar" button for active users', async () => {
      mockAdminStore.users = [makeUser({ id: 1, is_active: true })]
      mockAdminStore.totalUsers = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text().includes('Desactivar'))
      expect(btn).toBeDefined()
    })

    it('calls deactivateUser when "Desactivar" is clicked', async () => {
      mockDeactivateUser.mockResolvedValue(true)
      mockAdminStore.users = [makeUser({ id: 1, is_active: true })]
      mockAdminStore.totalUsers = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text().includes('Desactivar'))
      await btn!.trigger('click')
      expect(mockDeactivateUser).toHaveBeenCalledWith(1)
    })

    it('shows "Activar" button for inactive users', async () => {
      mockAdminStore.users = [makeUser({ id: 1, is_active: false })]
      mockAdminStore.totalUsers = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text().includes('Activar'))
      expect(btn).toBeDefined()
    })

    it('calls activateUser when "Activar" is clicked', async () => {
      mockActivateUser.mockResolvedValue(true)
      mockAdminStore.users = [makeUser({ id: 1, is_active: false })]
      mockAdminStore.totalUsers = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text().includes('Activar'))
      await btn!.trigger('click')
      expect(mockActivateUser).toHaveBeenCalledWith(1)
    })

    it('disables activate/deactivate button for the logged-in admin (self-protection)', async () => {
      mockAdminStore.users = [makeUser({ id: 99, is_active: true })]
      mockAdminStore.totalUsers = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text().includes('Desactivar'))
      expect(btn!.attributes('disabled')).toBeDefined()
    })
  })

  // ── Filter controls ─────────────────────────────────────────

  describe('filter controls', () => {
    it('renders a plan filter select', async () => {
      const wrapper = await mountManager()
      expect(wrapper.find('#filter-plan').exists()).toBe(true)
    })

    it('renders an active filter toggle', async () => {
      const wrapper = await mountManager()
      expect(wrapper.find('#filter-active').exists()).toBe(true)
    })
  })

  // ── Result count ────────────────────────────────────────────

  describe('result count text', () => {
    it('shows "0 usuarios" when there are no users', async () => {
      mockAdminStore.totalUsers = 0
      const wrapper = await mountManager()
      const statusEl = wrapper.find('[role="status"]')
      expect(statusEl.text()).toContain('0 usuarios')
    })

    it('shows "1 usuario" (singular) when totalUsers is 1', async () => {
      mockAdminStore.totalUsers = 1
      mockAdminStore.users = [makeUser()]
      const wrapper = await mountManager()
      const statusEl = wrapper.find('[role="status"]')
      expect(statusEl.text()).toContain('1 usuario')
      expect(statusEl.text()).not.toContain('1 usuarios')
    })

    it('shows "2 usuarios" (plural) when totalUsers is 2', async () => {
      mockAdminStore.totalUsers = 2
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
    mockAdminStore.totalUsers = 5
    mockAdminStore.users = [makeUser()]
    const wrapper = await mountManager()
    expect(wrapper.find('.card-footer').exists()).toBe(false)
  })
})

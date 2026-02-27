// ============================================================
// ActivityLog.test.ts
// Tests for the ActivityLog component.
//
// Strategy:
//   - useStats is mocked at module level with reactive refs.
//   - Tests verify: lifecycle fetch, skeleton (8 rows), activity type badges,
//     description/email rendering, missing email fallback, event count,
//     empty state, and error alert.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref } from 'vue'
import ActivityLog from './ActivityLog.vue'
import type { ActivityEntry } from '../types'

// ── Fixtures ──────────────────────────────────────────────────

function makeEntry(overrides: Partial<ActivityEntry> = {}): ActivityEntry {
  return {
    id: 'act-1',
    type: 'user_registered',
    description: 'Usuario registrado: test@example.com',
    user_email: 'test@example.com',
    created_at: '2025-01-15T10:30:00Z',
    ...overrides,
  }
}

// ── useStats mock ─────────────────────────────────────────────

const mockFetchActivityLog = vi.fn()
const mockError = ref<string | null>(null)
const mockEntries = ref<ActivityEntry[]>([])
const mockTotalActivity = ref(0)
const mockIsLoading = ref(false)

vi.mock('../composables/useStats', () => ({
  useStats: () => ({
    fetchActivityLog: mockFetchActivityLog,
    error: mockError,
    statsStore: {
      get activityEntries() { return mockEntries.value },
      get totalActivity() { return mockTotalActivity.value },
      get isLoading() { return mockIsLoading.value },
      get hasActivity() { return mockEntries.value.length > 0 },
    },
  }),
}))

// ── Mount helper ──────────────────────────────────────────────

async function mountLog() {
  return mountSuspended(ActivityLog, {
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

describe('ActivityLog', () => {
  beforeEach(() => {
    mockFetchActivityLog.mockReset()
    mockError.value = null
    mockEntries.value = []
    mockTotalActivity.value = 0
    mockIsLoading.value = false
  })

  // ── Section structure ────────────────────────────────────────

  describe('section structure', () => {
    it('renders a section with aria-label "Registro de actividad reciente"', async () => {
      const wrapper = await mountLog()
      expect(wrapper.find('section[aria-label="Registro de actividad reciente"]').exists()).toBe(true)
    })

    it('shows the "Actividad Reciente" heading', async () => {
      const wrapper = await mountLog()
      expect(wrapper.text()).toContain('Actividad Reciente')
    })
  })

  // ── Lifecycle ────────────────────────────────────────────────

  describe('lifecycle', () => {
    it('calls fetchActivityLog on mount', async () => {
      mockFetchActivityLog.mockResolvedValue(undefined)
      await mountLog()
      expect(mockFetchActivityLog).toHaveBeenCalledTimes(1)
    })
  })

  // ── Loading skeleton ─────────────────────────────────────────

  describe('loading skeleton', () => {
    it('shows skeleton when isLoading is true', async () => {
      mockIsLoading.value = true
      const wrapper = await mountLog()
      expect(wrapper.find('[aria-hidden="true"]').exists()).toBe(true)
    })

    it('renders 8 skeleton rows', async () => {
      mockIsLoading.value = true
      const wrapper = await mountLog()
      const skeletonBadges = wrapper.findAll('.activity-skeleton__badge')
      expect(skeletonBadges).toHaveLength(8)
    })

    it('does not show entry data while loading', async () => {
      mockIsLoading.value = true
      mockEntries.value = [makeEntry()]
      const wrapper = await mountLog()
      expect(wrapper.find('.badge[aria-label]').exists()).toBe(false)
    })
  })

  // ── Table headers ────────────────────────────────────────────

  describe('table headers', () => {
    it('renders "Tipo" column header', async () => {
      mockEntries.value = [makeEntry()]
      const wrapper = await mountLog()
      expect(wrapper.find('thead').text()).toContain('Tipo')
    })

    it('renders "Descripción" column header', async () => {
      mockEntries.value = [makeEntry()]
      const wrapper = await mountLog()
      expect(wrapper.find('thead').text()).toContain('Descripción')
    })

    it('renders "Usuario" column header', async () => {
      mockEntries.value = [makeEntry()]
      const wrapper = await mountLog()
      expect(wrapper.find('thead').text()).toContain('Usuario')
    })

    it('renders "Fecha" column header', async () => {
      mockEntries.value = [makeEntry()]
      const wrapper = await mountLog()
      expect(wrapper.find('thead').text()).toContain('Fecha')
    })
  })

  // ── Activity type badges ─────────────────────────────────────

  describe('activity type badges', () => {
    it('user_registered entry has bg-primary badge', async () => {
      mockEntries.value = [makeEntry({ type: 'user_registered' })]
      const wrapper = await mountLog()
      expect(wrapper.find('.badge.bg-primary').exists()).toBe(true)
    })

    it('pet_created entry has bg-success badge', async () => {
      mockEntries.value = [makeEntry({ type: 'pet_created' })]
      const wrapper = await mountLog()
      expect(wrapper.find('.badge.bg-success').exists()).toBe(true)
    })

    it('adoption_requested entry has bg-warning badge', async () => {
      mockEntries.value = [makeEntry({ type: 'adoption_requested' })]
      const wrapper = await mountLog()
      expect(wrapper.find('.badge.bg-warning').exists()).toBe(true)
    })

    it('subscription_created entry has bg-info badge', async () => {
      mockEntries.value = [makeEntry({ type: 'subscription_created' })]
      const wrapper = await mountLog()
      expect(wrapper.find('.badge.bg-info').exists()).toBe(true)
    })

    it('donation_made entry has bg-danger badge', async () => {
      mockEntries.value = [makeEntry({ type: 'donation_made' })]
      const wrapper = await mountLog()
      expect(wrapper.find('.badge.bg-danger').exists()).toBe(true)
    })

    it('badge has correct aria-label for user_registered', async () => {
      mockEntries.value = [makeEntry({ type: 'user_registered' })]
      const wrapper = await mountLog()
      const badge = wrapper.find('.badge[aria-label]')
      expect(badge.attributes('aria-label')).toBe('Tipo: Registro')
    })

    it('badge shows label text "Registro" for user_registered', async () => {
      mockEntries.value = [makeEntry({ type: 'user_registered' })]
      const wrapper = await mountLog()
      expect(wrapper.find('.badge').text()).toContain('Registro')
    })

    it('badge shows label text "Mascota" for pet_created', async () => {
      mockEntries.value = [makeEntry({ type: 'pet_created' })]
      const wrapper = await mountLog()
      expect(wrapper.find('.badge').text()).toContain('Mascota')
    })
  })

  // ── Row data rendering ───────────────────────────────────────

  describe('row data rendering', () => {
    it('renders description text', async () => {
      mockEntries.value = [makeEntry({ description: 'Mascota creada: Fido' })]
      const wrapper = await mountLog()
      expect(wrapper.text()).toContain('Mascota creada: Fido')
    })

    it('renders user_email when present', async () => {
      mockEntries.value = [makeEntry({ user_email: 'john@test.com' })]
      const wrapper = await mountLog()
      expect(wrapper.text()).toContain('john@test.com')
    })

    it('shows "—" when user_email is absent', async () => {
      mockEntries.value = [makeEntry({ user_email: undefined })]
      const wrapper = await mountLog()
      expect(wrapper.text()).toContain('—')
    })

    it('renders a row for each entry', async () => {
      mockEntries.value = [
        makeEntry({ id: '1', type: 'user_registered' }),
        makeEntry({ id: '2', type: 'pet_created' }),
        makeEntry({ id: '3', type: 'donation_made' }),
      ]
      const wrapper = await mountLog()
      const rows = wrapper.findAll('tbody tr')
      expect(rows).toHaveLength(3)
    })
  })

  // ── Event count ──────────────────────────────────────────────

  describe('event count display', () => {
    it('shows totalActivity count when activity is present', async () => {
      mockEntries.value = [makeEntry()]
      mockTotalActivity.value = 42
      const wrapper = await mountLog()
      expect(wrapper.find('[role="status"]').text()).toContain('42')
    })

    it('shows "eventos" in plural when totalActivity > 1', async () => {
      mockEntries.value = [makeEntry(), makeEntry()]
      mockTotalActivity.value = 2
      const wrapper = await mountLog()
      expect(wrapper.find('[role="status"]').text()).toContain('eventos')
    })

    it('shows "evento" in singular when totalActivity is 1', async () => {
      mockEntries.value = [makeEntry()]
      mockTotalActivity.value = 1
      const wrapper = await mountLog()
      const text = wrapper.find('[role="status"]').text()
      expect(text).toContain('1 evento')
      expect(text).not.toContain('eventos')
    })

    it('hides event count when no activity', async () => {
      mockEntries.value = []
      const wrapper = await mountLog()
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
    })
  })

  // ── Error alert ──────────────────────────────────────────────

  describe('error alert', () => {
    it('shows error alert when error is set', async () => {
      mockError.value = 'Error al cargar actividad'
      const wrapper = await mountLog()
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(wrapper.find('[role="alert"]').text()).toContain('Error al cargar actividad')
    })

    it('hides error alert when error is null', async () => {
      mockEntries.value = [makeEntry()]
      mockError.value = null
      const wrapper = await mountLog()
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })

  // ── Empty state ──────────────────────────────────────────────

  describe('empty state', () => {
    it('shows "No hay actividad reciente registrada." when not loading and empty', async () => {
      mockIsLoading.value = false
      mockEntries.value = []
      const wrapper = await mountLog()
      expect(wrapper.text()).toContain('No hay actividad reciente registrada.')
    })

    it('hides empty state when entries are present', async () => {
      mockEntries.value = [makeEntry()]
      const wrapper = await mountLog()
      expect(wrapper.text()).not.toContain('No hay actividad reciente registrada.')
    })
  })
})

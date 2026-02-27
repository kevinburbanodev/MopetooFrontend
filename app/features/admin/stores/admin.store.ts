// ============================================================
// Admin store — manages admin dashboard state: platform stats,
// paginated lists of users / shelters / petshops / clinics,
// and the financial transaction log.
// clearAdmin() IS called from auth.store.clearSession() because
// admin data is user-session-specific (role-gated content).
// ============================================================

import { defineStore } from 'pinia'
import type {
  AdminStats,
  AdminUser,
  AdminShelter,
  AdminPetshop,
  AdminClinic,
  AdminTransaction,
} from '../types'

export const useAdminStore = defineStore('admin', () => {
  // ── State ──────────────────────────────────────────────────
  const stats = ref<AdminStats | null>(null)
  const users = ref<AdminUser[]>([])
  const selectedUser = ref<AdminUser | null>(null)
  const shelters = ref<AdminShelter[]>([])
  const petshops = ref<AdminPetshop[]>([])
  const clinics = ref<AdminClinic[]>([])
  const transactions = ref<AdminTransaction[]>([])
  const isLoading = ref(false)
  const totalUsers = ref(0)
  const totalShelters = ref(0)
  const totalPetshops = ref(0)
  const totalClinics = ref(0)
  const totalTransactions = ref(0)

  // ── Getters ────────────────────────────────────────────────
  const hasStats = computed(() => stats.value !== null)
  const hasUsers = computed(() => users.value.length > 0)

  // ── Actions ────────────────────────────────────────────────

  function setStats(data: AdminStats): void {
    stats.value = data
  }

  function setUsers(items: AdminUser[], total: number): void {
    users.value = items
    totalUsers.value = total
  }

  /**
   * Merge partial data into an existing user record in the list.
   * Used for optimistic toggle updates (is_pro, is_admin).
   */
  function updateUser(id: number, data: Partial<AdminUser>): void {
    const idx = users.value.findIndex(u => u.id === id)
    if (idx !== -1) {
      users.value[idx] = { ...users.value[idx], ...data }
    }
  }

  function removeUser(id: number): void {
    users.value = users.value.filter(u => u.id !== id)
    totalUsers.value = Math.max(0, totalUsers.value - 1)
  }

  function setSelectedUser(u: AdminUser): void {
    selectedUser.value = u
  }

  function clearSelectedUser(): void {
    selectedUser.value = null
  }

  function setShelters(items: AdminShelter[], total: number): void {
    shelters.value = items
    totalShelters.value = total
  }

  function updateShelter(id: string, data: Partial<AdminShelter>): void {
    const idx = shelters.value.findIndex(s => s.id === id)
    if (idx !== -1) {
      shelters.value[idx] = { ...shelters.value[idx], ...data }
    }
  }

  function removeShelter(id: string): void {
    shelters.value = shelters.value.filter(s => s.id !== id)
    totalShelters.value = Math.max(0, totalShelters.value - 1)
  }

  function setPetshops(items: AdminPetshop[], total: number): void {
    petshops.value = items
    totalPetshops.value = total
  }

  function updatePetshop(id: string, data: Partial<AdminPetshop>): void {
    const idx = petshops.value.findIndex(p => p.id === id)
    if (idx !== -1) {
      petshops.value[idx] = { ...petshops.value[idx], ...data }
    }
  }

  function removePetshop(id: string): void {
    petshops.value = petshops.value.filter(p => p.id !== id)
    totalPetshops.value = Math.max(0, totalPetshops.value - 1)
  }

  function setAdminClinics(items: AdminClinic[], total: number): void {
    clinics.value = items
    totalClinics.value = total
  }

  function updateAdminClinic(id: string, data: Partial<AdminClinic>): void {
    const idx = clinics.value.findIndex(c => c.id === id)
    if (idx !== -1) {
      clinics.value[idx] = { ...clinics.value[idx], ...data }
    }
  }

  function removeAdminClinic(id: string): void {
    clinics.value = clinics.value.filter(c => c.id !== id)
    totalClinics.value = Math.max(0, totalClinics.value - 1)
  }

  function setTransactions(items: AdminTransaction[], total: number): void {
    transactions.value = items
    totalTransactions.value = total
  }

  function setLoading(val: boolean): void {
    isLoading.value = val
  }

  /**
   * Reset ALL admin state.
   * Called from auth.store.clearSession() to prevent stale admin data
   * being visible to the next user on a shared device.
   */
  function clearAdmin(): void {
    stats.value = null
    users.value = []
    selectedUser.value = null
    shelters.value = []
    petshops.value = []
    clinics.value = []
    transactions.value = []
    isLoading.value = false
    totalUsers.value = 0
    totalShelters.value = 0
    totalPetshops.value = 0
    totalClinics.value = 0
    totalTransactions.value = 0
  }

  return {
    // State
    stats,
    users,
    selectedUser,
    shelters,
    petshops,
    clinics,
    transactions,
    isLoading,
    totalUsers,
    totalShelters,
    totalPetshops,
    totalClinics,
    totalTransactions,
    // Getters
    hasStats,
    hasUsers,
    // Actions
    setStats,
    setUsers,
    updateUser,
    removeUser,
    setSelectedUser,
    clearSelectedUser,
    setShelters,
    updateShelter,
    removeShelter,
    setPetshops,
    updatePetshop,
    removePetshop,
    setAdminClinics,
    updateAdminClinic,
    removeAdminClinic,
    setTransactions,
    setLoading,
    clearAdmin,
  }
})

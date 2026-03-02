// ============================================================
// Admin store — manages admin dashboard state: paginated lists
// of users / shelters / petshops / clinics, transaction log,
// and donation records.
// clearAdmin() IS called from auth.store.clearSession() because
// admin data is user-session-specific (role-gated content).
// ============================================================

import { defineStore } from 'pinia'
import type {
  AdminUser,
  AdminShelter,
  AdminPetshop,
  AdminClinic,
  AdminTransaction,
  AdminDonation,
} from '../types'

export const useAdminStore = defineStore('admin', () => {
  // ── State ──────────────────────────────────────────────────
  const users = ref<AdminUser[]>([])
  const selectedUser = ref<AdminUser | null>(null)
  const shelters = ref<AdminShelter[]>([])
  const petshops = ref<AdminPetshop[]>([])
  const clinics = ref<AdminClinic[]>([])
  const transactions = ref<AdminTransaction[]>([])
  const donations = ref<AdminDonation[]>([])
  const isLoading = ref(false)
  const totalUsers = ref(0)
  const totalShelters = ref(0)
  const totalPetshops = ref(0)
  const totalClinics = ref(0)
  const totalTransactions = ref(0)
  const totalDonations = ref(0)

  // ── Getters ────────────────────────────────────────────────
  const hasUsers = computed(() => users.value.length > 0)

  // ── Actions ────────────────────────────────────────────────

  function setUsers(items: AdminUser[], total: number): void {
    users.value = items
    totalUsers.value = total
  }

  /**
   * Merge partial data into an existing user record in the list.
   * Used for optimistic toggle updates (is_pro, is_admin, is_active).
   */
  function updateUser(id: number, data: Partial<AdminUser>): void {
    const idx = users.value.findIndex(u => u.id === id)
    if (idx !== -1) {
      users.value[idx] = { ...users.value[idx], ...data }
    }
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

  function updateShelter(id: number, data: Partial<AdminShelter>): void {
    const idx = shelters.value.findIndex(s => s.id === id)
    if (idx !== -1) {
      shelters.value[idx] = { ...shelters.value[idx], ...data }
    }
  }

  function setPetshops(items: AdminPetshop[], total: number): void {
    petshops.value = items
    totalPetshops.value = total
  }

  function updatePetshop(id: number, data: Partial<AdminPetshop>): void {
    const idx = petshops.value.findIndex(p => p.id === id)
    if (idx !== -1) {
      petshops.value[idx] = { ...petshops.value[idx], ...data }
    }
  }

  function setAdminClinics(items: AdminClinic[], total: number): void {
    clinics.value = items
    totalClinics.value = total
  }

  function updateAdminClinic(id: number, data: Partial<AdminClinic>): void {
    const idx = clinics.value.findIndex(c => c.id === id)
    if (idx !== -1) {
      clinics.value[idx] = { ...clinics.value[idx], ...data }
    }
  }

  function setTransactions(items: AdminTransaction[], total: number): void {
    transactions.value = items
    totalTransactions.value = total
  }

  function setDonations(items: AdminDonation[], total: number): void {
    donations.value = items
    totalDonations.value = total
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
    users.value = []
    selectedUser.value = null
    shelters.value = []
    petshops.value = []
    clinics.value = []
    transactions.value = []
    donations.value = []
    isLoading.value = false
    totalUsers.value = 0
    totalShelters.value = 0
    totalPetshops.value = 0
    totalClinics.value = 0
    totalTransactions.value = 0
    totalDonations.value = 0
  }

  return {
    // State
    users,
    selectedUser,
    shelters,
    petshops,
    clinics,
    transactions,
    donations,
    isLoading,
    totalUsers,
    totalShelters,
    totalPetshops,
    totalClinics,
    totalTransactions,
    totalDonations,
    // Getters
    hasUsers,
    // Actions
    setUsers,
    updateUser,
    setSelectedUser,
    clearSelectedUser,
    setShelters,
    updateShelter,
    setPetshops,
    updatePetshop,
    setAdminClinics,
    updateAdminClinic,
    setTransactions,
    setDonations,
    setLoading,
    clearAdmin,
  }
})

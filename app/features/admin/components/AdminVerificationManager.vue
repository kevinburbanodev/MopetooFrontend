<script setup lang="ts">
import type { VerificationRequest } from '../types'

const { fetchVerificationRequests, approveVerification, rejectVerification, error } = useAdmin()

const requests = ref<VerificationRequest[]>([])
const statusFilter = ref<string>('pending')
const loading = ref(false)
const rejectingId = ref<number | null>(null)
const rejectReason = ref('')

async function loadRequests(): Promise<void> {
  loading.value = true
  requests.value = await fetchVerificationRequests(statusFilter.value || undefined)
  loading.value = false
}

async function handleApprove(id: number): Promise<void> {
  const ok = await approveVerification(id)
  if (ok) await loadRequests()
}

function openRejectModal(id: number): void {
  rejectingId.value = id
  rejectReason.value = ''
}

async function handleReject(): Promise<void> {
  if (!rejectingId.value || !rejectReason.value.trim()) return
  const ok = await rejectVerification(rejectingId.value, rejectReason.value.trim())
  if (ok) {
    rejectingId.value = null
    rejectReason.value = ''
    await loadRequests()
  }
}

function statusBadge(status: string): string {
  switch (status) {
    case 'approved': return 'bg-success'
    case 'rejected': return 'bg-danger'
    default: return 'bg-warning text-dark'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'approved': return 'Aprobada'
    case 'rejected': return 'Rechazada'
    default: return 'Pendiente'
  }
}

onMounted(loadRequests)
watch(statusFilter, loadRequests)
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="h5 fw-bold mb-0">Solicitudes de Verificacion</h2>
      <select v-model="statusFilter" class="form-select form-select-sm w-auto">
        <option value="">Todas</option>
        <option value="pending">Pendientes</option>
        <option value="approved">Aprobadas</option>
        <option value="rejected">Rechazadas</option>
      </select>
    </div>

    <!-- Error -->
    <div v-if="error" class="alert alert-danger py-2 small" role="alert">{{ error }}</div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border spinner-border-sm text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="requests.length === 0" class="text-center py-4 text-muted">
      No hay solicitudes{{ statusFilter ? ` ${statusLabel(statusFilter).toLowerCase()}s` : '' }}.
    </div>

    <!-- Table -->
    <div v-else class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th>ID</th>
            <th>Refugio</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="req in requests" :key="req.id">
            <td class="text-muted small">{{ req.id }}</td>
            <td>
              <span class="fw-semibold">{{ req.shelter_name ?? `Refugio #${req.shelter_id}` }}</span>
            </td>
            <td>
              <span class="badge" :class="statusBadge(req.status)">
                {{ statusLabel(req.status) }}
              </span>
            </td>
            <td class="text-muted small">
              {{ new Date(req.created_at).toLocaleDateString('es-CO') }}
            </td>
            <td class="text-end">
              <template v-if="req.status === 'pending'">
                <button
                  class="btn btn-success btn-sm me-1"
                  @click="handleApprove(req.id)"
                >
                  Aprobar
                </button>
                <button
                  class="btn btn-outline-danger btn-sm"
                  @click="openRejectModal(req.id)"
                >
                  Rechazar
                </button>
              </template>
              <span v-else-if="req.rejection_reason" class="text-muted small">
                {{ req.rejection_reason }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Reject modal -->
    <div
      v-if="rejectingId"
      class="modal d-block"
      tabindex="-1"
      style="background: rgba(0,0,0,0.5)"
      @click.self="rejectingId = null"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Rechazar solicitud</h5>
            <button type="button" class="btn-close" @click="rejectingId = null" />
          </div>
          <div class="modal-body">
            <label for="reject-reason" class="form-label">Motivo del rechazo</label>
            <textarea
              id="reject-reason"
              v-model="rejectReason"
              class="form-control"
              rows="3"
              placeholder="Explica el motivo..."
              required
            />
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" @click="rejectingId = null">Cancelar</button>
            <button
              class="btn btn-danger btn-sm"
              :disabled="!rejectReason.trim()"
              @click="handleReject"
            >
              Confirmar rechazo
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

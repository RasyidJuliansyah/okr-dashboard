<template>
  <div class="sprint-root">
    <div class="sprint-content">

      <!-- Header Section -->
      <div class="page-header card">
        <div class="header-title">
          <div class="title-row">
            <h2>Siklus Sprint & Snapshot Cadence</h2>
            <span class="view-badge">Cadence 21st - 20th</span>
          </div>
          <p class="section-desc">
            Kelola siklus sprint 30 hari (tanggal 21 hingga 20). Kunci sprint yang sudah selesai untuk membekukan capaian member, dan lakukan rollover otomatis maupun manual.
          </p>
        </div>
        <div class="header-actions">
          <button class="secondary-btn" :disabled="loading" @click="fetchSprints">
            Refresh
          </button>
          <button class="primary-btn" :disabled="generating" @click="handleGenerateYearly">
            {{ generating ? 'Membuat...' : '+ Generate 12-Bulan Sprint' }}
          </button>
        </div>
      </div>

      <!-- Alert Messages -->
      <div v-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>
      <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

      <!-- Active Sprint Banner -->
      <div v-if="activeSprint" class="active-sprint-banner card">
        <div class="banner-left">
          <div class="active-pill">SPRINT AKTIF SAAT INI</div>
          <h3 class="active-title">{{ activeSprint.name }}</h3>
          <p class="active-dates">
            Periode: <strong>{{ formatDate(activeSprint.startDate) }}</strong> s/d <strong>{{ formatDate(activeSprint.endDate) }}</strong>
          </p>
          <div class="active-status-meta">
            <span class="lock-indicator" :class="activeSprint.isLocked ? 'locked' : 'unlocked'">
              {{ activeSprint.isLocked ? '🔒 Terkunci' : '🔓 Terbuka' }}
            </span>
            <span class="days-remaining">
              {{ getRemainingDays(activeSprint.endDate) }}
            </span>
          </div>
        </div>
        <div class="banner-right">
          <button
            class="danger-btn"
            :disabled="closingSprintId === activeSprint.id"
            @click="confirmCloseSprint(activeSprint)"
          >
            {{ closingSprintId === activeSprint.id ? 'Memproses...' : 'Tutup & Rollover Sprint' }}
          </button>
        </div>
      </div>

      <!-- Sprint List Table Card -->
      <div class="table-card card">
        <div class="table-header-row">
          <h3>Daftar Seluruh Sprint ({{ sprints.length }})</h3>
        </div>

        <div v-if="loading" class="loading-state">Memuat data sprint...</div>

        <div v-else-if="sprints.length === 0" class="empty-state">
          Belum ada sprint yang dibuat. Klik tombol "+ Generate 12-Bulan Sprint" di atas.
        </div>

        <div v-else class="table-responsive">
          <table class="sprint-table">
            <thead>
              <tr>
                <th>Nama Sprint</th>
                <th>Mulai</th>
                <th>Selesai</th>
                <th>Status</th>
                <th>Akses</th>
                <th>Inisiatif / Task</th>
                <th>Arsip Skor</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sprint in sprints" :key="sprint.id" :class="{ 'row-active': sprint.status === 'ACTIVE' }">
                <td class="font-bold">
                  {{ sprint.name }}
                  <span v-if="sprint.status === 'ACTIVE'" class="active-tag">Aktif</span>
                </td>
                <td>{{ formatDate(sprint.startDate) }}</td>
                <td>{{ formatDate(sprint.endDate) }}</td>
                <td>
                  <span class="status-badge" :class="'badge-' + sprint.status.toLowerCase()">
                    {{ sprint.status }}
                  </span>
                </td>
                <td>
                  <button
                    class="badge-btn"
                    :class="sprint.isLocked ? 'btn-locked' : 'btn-unlocked'"
                    @click="handleToggleLock(sprint)"
                  >
                    {{ sprint.isLocked ? '🔒 Terkunci' : '🔓 Terbuka' }}
                  </button>
                </td>
                <td>
                  {{ sprint._count?.initiatives || 0 }} / {{ sprint._count?.tasks || 0 }}
                </td>
                <td>
                  <span v-if="sprint._count?.memberScores > 0" class="archive-count">
                    ✓ {{ sprint._count.memberScores }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="action-btn edit-btn" @click="openEditModal(sprint)">Edit</button>
                    <button
                      v-if="sprint.status === 'ACTIVE'"
                      class="action-btn close-btn"
                      @click="confirmCloseSprint(sprint)"
                    >
                      Tutup
                    </button>
                    <NuxtLink :to="`/member-achievement?sprintId=${sprint.id}`" class="action-btn view-btn">
                      Lihat
                    </NuxtLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>


      <!-- Edit Modal -->
      <div v-if="showEditModal" class="modal-backdrop">
        <div class="modal-card">
          <h3>Edit Periode Sprint</h3>
          <div class="form-group">
            <label>Nama Sprint:</label>
            <input v-model="editForm.name" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>Tanggal Mulai (00:00:00):</label>
            <input v-model="editForm.startDate" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label>Tanggal Selesai (23:59:59):</label>
            <input v-model="editForm.endDate" type="date" class="form-input" />
          </div>
          <div class="modal-actions">
            <button class="secondary-btn" @click="showEditModal = false">Batal</button>
            <button class="primary-btn" :disabled="saving" @click="handleSaveEdit">
              {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';

const auth = useAuthStore();
const config = useRuntimeConfig();
const API = config.public.apiBase || 'http://localhost:3001/api';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${auth.token}`,
  };
}

const loading = ref(true);
const generating = ref(false);
const saving = ref(false);
const closingSprintId = ref<string | null>(null);
const errorMsg = ref('');
const successMsg = ref('');

const sprints = ref<any[]>([]);
const activeSprint = ref<any>(null);

const showEditModal = ref(false);
const editForm = ref({
  id: '',
  name: '',
  startDate: '',
  endDate: '',
});

function formatDate(isoStr: string) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getRemainingDays(endDateIso: string) {
  const diff = new Date(endDateIso).getTime() - new Date().getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Telah melewati tenggat waktu';
  if (days === 0) return 'Hari terakhir sprint!';
  return `Tersisa ${days} hari lagi`;
}

async function fetchSprints() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await $fetch<any>(`${API}/sprints`, { headers: getHeaders() });
    sprints.value = res.sprints || [];
    activeSprint.value = res.activeSprint || null;
  } catch (err: any) {
    errorMsg.value = err?.data?.error || err.message || 'Gagal memuat data sprint';
  } finally {
    loading.value = false;
  }
}

async function handleGenerateYearly() {
  if (!confirm('Buat 12 sprint cadence (21 ke 20) otomatis?')) return;
  generating.value = true;
  errorMsg.value = '';
  successMsg.value = '';
  try {
    const res = await $fetch<any>(`${API}/sprints/generate-yearly`, {
      method: 'POST',
      body: { baseYear: 2026 },
      headers: getHeaders(),
    });
    successMsg.value = `Berhasil! Dibuat ${res.createdCount} sprint baru (${res.existingCount} sudah ada).`;
    await fetchSprints();
  } catch (err: any) {
    errorMsg.value = err?.data?.error || err.message || 'Gagal membuat sprint';
  } finally {
    generating.value = false;
  }
}

async function handleToggleLock(sprint: any) {
  const newLock = !sprint.isLocked;
  errorMsg.value = '';
  try {
    await $fetch<any>(`${API}/sprints/${sprint.id}/toggle-lock`, {
      method: 'POST',
      body: { isLocked: newLock },
      headers: getHeaders(),
    });
    sprint.isLocked = newLock;
    successMsg.value = `Sprint ${sprint.name} berhasil ${newLock ? 'dikunci' : 'dibuka kuncinya'}.`;
  } catch (err: any) {
    errorMsg.value = err?.data?.error || err.message || 'Gagal mengubah status kunci sprint';
  }
}

async function confirmCloseSprint(sprint: any) {
  const ok = confirm(
    `Apakah Anda yakin ingin menutup "${sprint.name}"?\n\n` +
    `Semua capaian member akan dibekukan ke arsip, target KR diakumulasikan, dan sprint berikutnya akan diaktifkan.`
  );
  if (!ok) return;

  closingSprintId.value = sprint.id;
  errorMsg.value = '';
  successMsg.value = '';
  try {
    await $fetch<any>(`${API}/sprints/${sprint.id}/close`, {
      method: 'POST',
      headers: getHeaders(),
    });
    successMsg.value = `Sprint ${sprint.name} berhasil ditutup dan capaian member telah di-snapshot!`;
    await fetchSprints();
  } catch (err: any) {
    errorMsg.value = err?.data?.error || err.message || 'Gagal menutup sprint';
  } finally {
    closingSprintId.value = null;
  }
}

function openEditModal(sprint: any) {
  editForm.value = {
    id: sprint.id,
    name: sprint.name,
    startDate: sprint.startDate ? sprint.startDate.substring(0, 10) : '',
    endDate: sprint.endDate ? sprint.endDate.substring(0, 10) : '',
  };
  showEditModal.value = true;
}

async function handleSaveEdit() {
  if (!editForm.value.startDate || !editForm.value.endDate) {
    alert('Tanggal mulai dan selesai wajib diisi');
    return;
  }
  saving.value = true;
  errorMsg.value = '';
  try {
    await $fetch<any>(`${API}/sprints/${editForm.value.id}`, {
      method: 'PUT',
      body: {
        name: editForm.value.name,
        startDate: editForm.value.startDate,
        endDate: editForm.value.endDate,
      },
      headers: getHeaders(),
    });
    showEditModal.value = false;
    successMsg.value = 'Periode sprint berhasil diperbarui.';
    await fetchSprints();
  } catch (err: any) {
    errorMsg.value = err?.data?.error || err.message || 'Gagal memperbarui sprint';
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  fetchSprints();
});
</script>


<style scoped>
.sprint-root {
  padding: 1.5rem;
  background: #f8fafc;
  min-height: 100vh;
}
.sprint-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.title-row h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.view-badge {
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
}
.section-desc {
  margin-top: 0.35rem;
  color: #64748b;
  font-size: 0.875rem;
}
.header-actions {
  display: flex;
  gap: 0.75rem;
}
.primary-btn {
  background: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
}
.primary-btn:hover:not(:disabled) {
  background: #1d4ed8;
}
.secondary-btn {
  background: #f1f5f9;
  color: #475569;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
}
.secondary-btn:hover:not(:disabled) {
  background: #e2e8f0;
}
.danger-btn {
  background: #ef4444;
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
}
.danger-btn:hover:not(:disabled) {
  background: #dc2626;
}
.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
}
.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
.alert-success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}
.active-sprint-banner {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
  border: 1px solid #334155;
}
.active-pill {
  font-size: 0.7rem;
  font-weight: 700;
  color: #38bdf8;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}
.active-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}
.active-dates {
  color: #cbd5e1;
  font-size: 0.875rem;
  margin: 0 0 0.5rem 0;
}
.active-status-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  font-size: 0.8rem;
}
.lock-indicator.unlocked {
  color: #4ade80;
}
.lock-indicator.locked {
  color: #f87171;
}
.days-remaining {
  color: #94a3b8;
}
.table-card {
  padding: 0;
  overflow: hidden;
}
.table-header-row {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}
.table-header-row h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}
.table-responsive {
  overflow-x: auto;
}
.sprint-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  text-align: left;
}
.sprint-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}
.sprint-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}
.row-active {
  background: #f0f9ff;
}
.active-tag {
  background: #0284c7;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  margin-left: 0.5rem;
}
.font-bold {
  font-weight: 600;
  color: #0f172a;
}
.status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}
.badge-active {
  background: #dbeafe;
  color: #1e40af;
}
.badge-closed {
  background: #f1f5f9;
  color: #64748b;
}
.badge-upcoming {
  background: #fef9c3;
  color: #854d0e;
}
.badge-btn {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
}
.btn-locked {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fca5a5;
}
.btn-unlocked {
  background: #dcfce7;
  color: #166534;
  border-color: #86efac;
}
.archive-count {
  color: #166534;
  font-weight: 600;
  font-size: 0.8rem;
}
.text-muted {
  color: #94a3b8;
}
.action-buttons {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}
.action-btn {
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
}
.edit-btn {
  background: #f1f5f9;
  color: #334155;
  border-color: #cbd5e1;
}
.close-btn {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #fca5a5;
}
.view-btn {
  background: #e0f2fe;
  color: #0369a1;
  border-color: #bae6fd;
}
.loading-state, .empty-state {
  padding: 2.5rem;
  text-align: center;
  color: #64748b;
  font-size: 0.875rem;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.modal-card {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 440px;
  padding: 1.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
.modal-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;
}
.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}
.form-input {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
}
.form-input:focus {
  border-color: #2563eb;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
</style>


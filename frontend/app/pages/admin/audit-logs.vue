<template>
  <div class="audit-root">
    <div class="audit-content">
      <div class="page-header card">
        <div class="header-title">
          <h2>Audit Logs</h2>
          <p class="section-desc">
            Riwayat lengkap pencatatan perubahan data untuk transparansi dan akuntabilitas sistem.
          </p>
        </div>
        <div class="header-stats">
          <span class="stat-badge">Total {{ pagination.total }} Aktivitas</span>
        </div>
      </div>

      <div class="card filter-card">
        <div class="filter-grid">
          <div class="filter-item search-item">
            <label>Cari</label>
            <input
              v-model="filters.search"
              type="text"
              class="form-select"
              placeholder="Cari user, email, ID..."
              @input="debouncedFetch"
            />
          </div>

          <div class="filter-item">
            <label>Entitas</label>
            <select v-model="filters.entityType" @change="fetchLogs(1)" class="form-select">
              <option value="ALL">Semua Entitas</option>
              <option value="USER">User / Pegawai</option>
              <option value="DEPARTMENT">Departemen</option>
              <option value="KEY_RESULT">Key Result</option>
              <option value="INITIATIVE">Inisiatif</option>
              <option value="TASK">Task</option>
            </select>
          </div>

          <div class="filter-item">
            <label>Aksi</label>
            <select v-model="filters.action" @change="fetchLogs(1)" class="form-select">
              <option value="ALL">Semua Aksi</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="STATUS_CHANGE">STATUS_CHANGE</option>
              <option value="ASSIGN_MANAGER">ASSIGN_MANAGER</option>
              <option value="REMOVE_MANAGER">REMOVE_MANAGER</option>
              <option value="RESET_PASSWORD">RESET_PASSWORD</option>
            </select>
          </div>

          <div class="filter-item">
            <label>Tanggal Mulai</label>
            <input
              v-model="filters.startDate"
              type="date"
              class="form-select"
              @change="fetchLogs(1)"
            />
          </div>
          <div class="filter-item">
            <label>Tanggal Akhir</label>
            <input
              v-model="filters.endDate"
              type="date"
              class="form-select"
              @change="fetchLogs(1)"
            />
          </div>

          <div class="filter-item filter-btn-col">
            <button class="secondary-btn btn-reset" @click="resetFilters">
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      <div class="card table-card">
        <div v-if="loading" class="loading-state">Memuat data audit logs...</div>
        <div v-else-if="logs.length === 0" class="empty-state">
          <p>Belum ada rekaman audit log yang sesuai dengan filter.</p>
        </div>
        <div v-else class="table-responsive">
          <table class="audit-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Pengguna</th>
                <th>Aksi</th>
                <th>Entitas</th>
                <th>IP Address</th>
                <th style="text-align: right;">Detail</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id">
                <td class="col-time">
                  <div class="time-primary">{{ formatDate(log.createdAt) }}</div>
                  <div class="time-secondary">{{ formatTime(log.createdAt) }}</div>
                </td>
                <td class="col-user">
                  <div v-if="log.user" class="user-cell">
                    <div class="chip-avatar" :style="{ background: getAvatarColor(log.user.name) }">
                      {{ getInitials(log.user.name) }}
                    </div>
                    <div>
                      <div class="user-name">{{ log.user.name }}</div>
                      <div class="user-email">{{ log.user.email }}</div>
                    </div>
                  </div>
                  <div v-else class="system-cell">
                    <span class="system-badge">System</span>
                  </div>
                </td>
                <td class="col-action">
                  <span class="action-badge" :class="getActionClass(log.action)">
                    {{ log.action }}
                  </span>
                </td>
                <td class="col-entity">
                  <span class="entity-badge">{{ log.entityType }}</span>
                  <div class="entity-id" :title="log.entityId">{{ log.entityId || '-' }}</div>
                </td>
                <td class="col-ip">
                  <code>{{ log.ipAddress || '-' }}</code>
                </td>
                <td class="col-detail" style="text-align: right;">
                  <button
                    v-if="log.oldValues || log.newValues"
                    class="detail-btn"
                    @click="openDetailModal(log)"
                  >
                    Lihat Diff
                  </button>
                  <span v-else class="no-diff">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="pagination.totalPages > 1" class="pagination-bar">
          <span class="pagination-info">
            Halaman {{ pagination.page }} dari {{ pagination.totalPages }} (Total {{ pagination.total }} data)
          </span>
          <div class="pagination-actions">
            <button
              class="page-btn"
              :disabled="pagination.page <= 1"
              @click="fetchLogs(pagination.page - 1)"
            >
              Sebelumnya
            </button>
            <button
              class="page-btn"
              :disabled="pagination.page >= pagination.totalPages"
              @click="fetchLogs(pagination.page + 1)"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Diff Detail Modal -->
    <div v-if="activeLogModal" class="modal-backdrop" @click.self="activeLogModal = null">
      <div class="modal-card card">
        <div class="modal-header">
          <div>
            <h3>Detail Perubahan Data</h3>
            <p class="modal-subtitle">
              {{ activeLogModal.action }} pada {{ activeLogModal.entityType }} (ID: {{ activeLogModal.entityId || '-' }})
            </p>
          </div>
          <button class="close-btn" @click="activeLogModal = null">&times;</button>
        </div>

        <div class="modal-body">
          <div class="meta-strip">
            <div><strong>Waktu:</strong> {{ formatDateTime(activeLogModal.createdAt) }}</div>
            <div><strong>Pelaku:</strong> {{ activeLogModal.user ? `${activeLogModal.user.name} (${activeLogModal.user.email})` : 'System' }}</div>
            <div><strong>IP:</strong> {{ activeLogModal.ipAddress || '-' }}</div>
          </div>

          <div class="diff-grid">
            <div class="diff-pane old-pane">
              <div class="diff-title">Nilai Sebelumnya (Old Values)</div>
              <pre class="json-code">{{ formatJson(activeLogModal.oldValues) }}</pre>
            </div>
            <div class="diff-pane new-pane">
              <div class="diff-title">Nilai Baru (New Values)</div>
              <pre class="json-code">{{ formatJson(activeLogModal.newValues) }}</pre>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="primary-btn" @click="activeLogModal = null">Tutup</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';

const config = useRuntimeConfig();
const auth = useAuthStore();
const API = config.public.apiBase;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${auth.token || localStorage.getItem('auth_token')}`,
});

const loading = ref(false);
const logs = ref([]);
const activeLogModal = ref(null);

const pagination = reactive({
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
});

const filters = reactive({
  search: '',
  entityType: 'ALL',
  action: 'ALL',
  startDate: '',
  endDate: '',
});

let debounceTimer = null;
function debouncedFetch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchLogs(1);
  }, 350);
}

function resetFilters() {
  filters.search = '';
  filters.entityType = 'ALL';
  filters.action = 'ALL';
  filters.startDate = '';
  filters.endDate = '';
  fetchLogs(1);
}

async function fetchLogs(page = 1) {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', pagination.limit.toString());

    if (filters.entityType && filters.entityType !== 'ALL') {
      params.set('entityType', filters.entityType);
    }
    if (filters.action && filters.action !== 'ALL') {
      params.set('action', filters.action);
    }
    if (filters.search) {
      params.set('search', filters.search);
    }
    if (filters.startDate) {
      params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.set('endDate', filters.endDate);
    }

    const res = await fetch(`${API}/audit-logs?${params.toString()}`, {
      headers: getHeaders(),
    });

    if (res.ok) {
      const result = await res.json();
      logs.value = result.data || [];
      pagination.total = result.pagination?.total || 0;
      pagination.page = result.pagination?.page || 1;
      pagination.totalPages = result.pagination?.totalPages || 1;
    } else {
      logs.value = [];
    }
  } catch (err) {
    console.error('Fetch audit logs error:', err);
  } finally {
    loading.value = false;
  }
}

function openDetailModal(log) {
  activeLogModal.value = log;
}

function formatJson(val) {
  if (!val) return 'None';
  try {
    return JSON.stringify(val, null, 2);
  } catch (e) {
    return String(val);
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

function getActionClass(action) {
  if (action === 'CREATE') return 'action-create';
  if (action === 'UPDATE') return 'action-update';
  if (action === 'DELETE') return 'action-delete';
  if (action === 'STATUS_CHANGE') return 'action-status';
  if (action === 'ASSIGN_MANAGER') return 'action-assign';
  if (action === 'REMOVE_MANAGER') return 'action-remove';
  if (action === 'RESET_PASSWORD') return 'action-reset';
  return 'action-default';
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function getAvatarColor(name) {
  const colors = ['#0E97D6', '#0583C3', '#7C3AED', '#DB2777', '#EA580C', '#00A925'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

onMounted(() => {
  fetchLogs(1);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap');

.audit-root {
  min-height: 100vh;
  background: var(--content-bg, #f8fafc);
  padding: 2rem;
  font-family: 'Rubik', sans-serif;
}

.audit-content {
  max-width: 1300px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: #ffffff;
  border-radius: 14px;
  padding: 1.5rem;
  border: 1px solid #f0f3f9;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title h2 {
  font-size: 1.5rem;
  color: #2d3643;
  margin: 0 0 0.25rem;
  font-weight: 600;
}

.section-desc {
  color: #5e718d;
  font-size: 0.88rem;
  margin: 0;
}

.stat-badge {
  background: #f0f3f9;
  color: #475467;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.filter-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
  gap: 1rem;
  align-items: flex-end;
}

@media (max-width: 1024px) {
  .filter-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.filter-item label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #475467;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.form-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  font-size: 0.88rem;
  background: #ffffff;
  color: #1d2939;
  outline: none;
}

.btn-reset {
  height: 38px;
  white-space: nowrap;
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;
}

.audit-table th {
  background: #f8fafc;
  color: #475467;
  font-weight: 600;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid #eaecf0;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.audit-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f0f3f9;
  vertical-align: middle;
}

.audit-table tr:hover {
  background: #fafcff;
}

.time-primary {
  font-weight: 500;
  color: #1d2939;
}

.time-secondary {
  font-size: 0.75rem;
  color: #667085;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.user-name {
  font-weight: 500;
  color: #1d2939;
  font-size: 0.85rem;
}

.user-email {
  font-size: 0.75rem;
  color: #667085;
}

.chip-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.system-badge {
  display: inline-block;
  background: #f2f4f7;
  color: #475467;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.action-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.action-create { background: #e6f4ea; color: #137333; }
.action-update { background: #e8f6fd; color: #0e97d6; }
.action-delete { background: #fce8e6; color: #c5221f; }
.action-status { background: #fef7e0; color: #b06000; }
.action-assign { background: #f5f0ff; color: #7c3aed; }
.action-remove { background: #fff1f0; color: #cf1322; }
.action-reset { background: #fdf2f8; color: #be185d; }
.action-default { background: #f2f4f7; color: #344054; }

.entity-badge {
  display: inline-block;
  background: #f0f3f9;
  color: #344054;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 600;
}

.entity-id {
  font-size: 0.72rem;
  color: #98a2b3;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 0.15rem;
}

.col-ip code {
  font-family: monospace;
  font-size: 0.78rem;
  color: #667085;
}

.detail-btn {
  padding: 0.35rem 0.75rem;
  background: #f8fafc;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  color: #344054;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.detail-btn:hover {
  background: #0e97d6;
  border-color: #0e97d6;
  color: #ffffff;
}

.no-diff {
  color: #d0d5dd;
}

.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border-top: 1px solid #eaecf0;
}

.pagination-info {
  font-size: 0.82rem;
  color: #475467;
}

.pagination-actions {
  display: flex;
  gap: 0.5rem;
}

.page-btn {
  padding: 0.35rem 0.75rem;
  background: #ffffff;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  font-size: 0.82rem;
  color: #344054;
  cursor: pointer;
}

.page-btn:hover:not(:disabled) {
  background: #f2f4f7;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state,
.empty-state {
  padding: 3rem;
  text-align: center;
  color: #667085;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(16, 24, 40, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f3f9;
}

.modal-header h3 {
  margin: 0;
  color: #1d2939;
  font-size: 1.2rem;
}

.modal-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.82rem;
  color: #667085;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #98a2b3;
  cursor: pointer;
}

.modal-body {
  padding: 1rem 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.meta-strip {
  display: flex;
  gap: 1.5rem;
  background: #f8fafc;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #344054;
  flex-wrap: wrap;
}

.diff-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 640px) {
  .diff-grid {
    grid-template-columns: 1fr;
  }
}

.diff-pane {
  background: #f8fafc;
  border-radius: 8px;
  padding: 0.75rem;
  border: 1px solid #eaecf0;
}

.diff-title {
  font-size: 0.78rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #344054;
}

.old-pane .diff-title { color: #b42318; }
.new-pane .diff-title { color: #027a48; }

.json-code {
  font-family: monospace;
  font-size: 0.78rem;
  background: #ffffff;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #e4e7ec;
  overflow-x: auto;
  max-height: 320px;
  white-space: pre-wrap;
  word-break: break-word;
  color: #1d2939;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #f0f3f9;
}

.primary-btn {
  padding: 0.5rem 1.25rem;
  background: #0e97d6;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.secondary-btn {
  padding: 0.5rem 1rem;
  background: #ffffff;
  color: #344054;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}
</style>

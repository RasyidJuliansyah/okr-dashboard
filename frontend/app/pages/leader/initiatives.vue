<template>
  <div class="admin-root">
    <div class="admin-content">
      <div class="header-section card">
        <div class="header-title">
          <h2>📌 Inisiatif Tim Saya</h2>
          <p class="section-desc">
            Kelola Inisiatif yang dikerjakan oleh Tim Anda beserta KPI-nya.
          </p>
        </div>
      </div>

      <div v-if="loading" class="alert alert-info">Memuat data...</div>
      <div v-else-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>
      <div v-else-if="initiatives.length === 0" class="empty-state card">
        Belum ada Inisiatif. Silakan buat melalui menu "KR Saya".
      </div>

      <div v-for="initiative in initiatives" :key="initiative.id" class="initiative-block card">
        <div class="initiative-header">
          <div>
            <h3>{{ initiative.title }}</h3>
            <span class="team-badge">Tim: {{ initiative.team?.name }}</span>
            <span class="kr-badge">KR: {{ initiative.keyResult?.title }}</span>
          </div>
        </div>

        <div class="kpi-list">
          <div v-if="initiative.kpis?.length === 0" class="empty-kpi">Belum ada KPI di Initiative ini. (KPI di-assign oleh Admin)</div>
          <div v-for="kpi in initiative.kpis" :key="kpi.id" class="kpi-row">
            <div class="kpi-info">
              <span class="kpi-name">{{ kpi.title }}</span>
              <div class="kpi-details">
                <span class="kpi-target">Target: {{ kpi.targetValue }} {{ kpi.unit }}</span>
                <span class="kpi-current">Saat ini: {{ kpi.currentValue }}</span>
                <span class="kpi-status" :class="getStatusClass(kpi.status)">{{ kpi.status }}</span>
              </div>
            </div>
            
            <div class="kpi-assignees">
              <span v-for="a in kpi.assignments" :key="a.userId" class="assignee-chip">{{ a.user?.name }}</span>
              <span v-if="kpi.assignments.length === 0" class="text-sm text-gray">Belum ada assignee</span>
            </div>
            
            <div class="kpi-actions">
              <button 
                class="primary-btn small" 
                v-if="hasPendingUpdates(kpi)"
                @click="openReviewModal(kpi)"
              >
                Review Update
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal Review -->
      <div v-if="showReviewModal" class="modal-overlay" @click.self="showReviewModal = false">
        <div class="modal-box">
          <h3>Review Progress KPI</h3>
          <p class="mb-4">KPI: <strong>{{ selectedKpi?.title }}</strong></p>
          
          <div v-if="pendingUpdates.length === 0">Tidak ada update pending.</div>
          
          <div v-for="upd in pendingUpdates" :key="upd.id" class="update-card">
            <div class="update-meta">
              <span>Nilai baru: <strong>{{ upd.newValue }}</strong> (Sebelumnya: {{ upd.oldValue }})</span>
              <span class="text-sm text-gray">{{ new Date(upd.createdAt).toLocaleDateString() }}</span>
            </div>
            <p v-if="upd.note" class="update-note">"{{ upd.note }}"</p>
            
            <div v-if="rejectingId === upd.id" class="reject-form">
              <textarea v-model="rejectNote" placeholder="Alasan penolakan..." class="form-input"></textarea>
              <div class="flex-gap">
                <button class="secondary-btn small" @click="rejectingId = null">Batal</button>
                <button class="danger-btn small" @click="confirmReject(upd.id)">Konfirmasi Tolak</button>
              </div>
            </div>
            <div v-else class="update-actions">
              <button class="primary-btn small" @click="approveUpdate(upd.id)">Approve</button>
              <button class="danger-btn small" @click="rejectingId = upd.id">Reject</button>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="secondary-btn" @click="showReviewModal = false">Tutup</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const initiatives = ref([]);
const loading = ref(true);
const errorMsg = ref('');

const showReviewModal = ref(false);
const selectedKpi = ref(null);
const pendingUpdates = ref([]);
const rejectingId = ref(null);
const rejectNote = ref('');

const config = useRuntimeConfig();
const API = config.public.apiBase || 'http://localhost:3001/api';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authStore.token}`,
  };
}

onMounted(async () => {
  if (!authStore.isAuthenticated || !['LEADER', 'ADMIN'].includes(authStore.user?.role)) {
    router.push('/login');
    return;
  }
  await fetchInitiatives();
});

async function fetchInitiatives() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await fetch(`${API}/initiatives`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Gagal memuat Initiative');
    initiatives.value = await res.json();
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}

function hasPendingUpdates(kpi) {
  // We need to know if there are pending updates. 
  // Ideally backend returns pendingCount or we fetch it. 
  // Wait, backend getInitiatives includes kpis, but does it include updates? 
  // Let's check backend initiative.controller.ts getInitiatives. It only includes kpis and assignments.
  // I will just show the button and fetch inside the modal, or always show "Review Update" button.
  return true; 
}

async function openReviewModal(kpi) {
  selectedKpi.value = kpi;
  showReviewModal.value = true;
  pendingUpdates.value = [];
  rejectingId.value = null;
  rejectNote.value = '';
  
  try {
    const res = await fetch(`${API}/kpis/${kpi.id}/updates`, { headers: getHeaders() });
    const allUpdates = await res.json();
    pendingUpdates.value = allUpdates.filter(u => u.status === 'PENDING_APPROVAL');
  } catch (err) {
    console.error(err);
  }
}

async function approveUpdate(updateId) {
  try {
    const res = await fetch(`${API}/kpi-updates/${updateId}/approve`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    if (res.ok) {
      pendingUpdates.value = pendingUpdates.value.filter(u => u.id !== updateId);
      await fetchInitiatives();
    }
  } catch (e) {
    console.error(e);
  }
}

async function confirmReject(updateId) {
  if (!rejectNote.value) {
    alert("Catatan wajib diisi");
    return;
  }
  try {
    const res = await fetch(`${API}/kpi-updates/${updateId}/reject`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ reviewNote: rejectNote.value })
    });
    if (res.ok) {
      pendingUpdates.value = pendingUpdates.value.filter(u => u.id !== updateId);
      rejectingId.value = null;
      await fetchInitiatives();
    }
  } catch (e) {
    console.error(e);
  }
}

function getStatusClass(status) {
  if (status === 'ON_TRACK') return 'text-green';
  if (status === 'AT_RISK') return 'text-yellow';
  if (status === 'OFF_TRACK') return 'text-red';
  return 'text-gray';
}
</script>

<style scoped>
.admin-root { min-height: 100vh; background-color: #f8fafc; padding: 32px; }
.admin-content { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
.card { background: #ffffff; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }
.header-section { display: flex; justify-content: space-between; align-items: center; }
.header-title h2 { font-size: 24px; font-weight: 600; color: #1e293b; margin: 0 0 8px 0; }
.section-desc { font-size: 14px; color: #64748b; margin: 0; }
.initiative-block { display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; }
.initiative-header { border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
.initiative-header h3 { margin: 0 0 8px 0; font-size: 18px; color: #0f172a; }
.team-badge { font-size: 12px; color: #0ea5e9; font-weight: 500; background: #e0f2fe; padding: 4px 8px; border-radius: 6px; margin-right: 8px; }
.kr-badge { font-size: 12px; color: #475569; font-weight: 500; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; }

.kpi-list { display: flex; flex-direction: column; gap: 12px; }
.empty-kpi { color: #94a3b8; font-size: 14px; font-style: italic; }
.kpi-row { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
.kpi-info { flex: 2; }
.kpi-name { font-weight: 600; color: #1e293b; display: block; margin-bottom: 4px; }
.kpi-details { display: flex; gap: 16px; font-size: 13px; color: #64748b; }
.kpi-assignees { flex: 1; display: flex; flex-wrap: wrap; gap: 6px; }
.assignee-chip { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 8px; border-radius: 12px; font-size: 12px; color: #475569; }
.kpi-actions { flex: 0 0 auto; display: flex; gap: 8px; }

.text-green { color: #166534; font-weight: 500;}
.text-yellow { color: #854d0e; font-weight: 500;}
.text-red { color: #991b1b; font-weight: 500;}
.text-gray { color: #64748b; }

.primary-btn { background: #0ea5e9; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
.primary-btn:hover { background: #0284c7; }
.primary-btn.small { padding: 4px 12px; font-size: 13px; }
.secondary-btn { background: white; color: #475569; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; font-weight: 500; cursor: pointer; }
.secondary-btn.small { padding: 4px 12px; font-size: 13px; }
.danger-btn { background: #fee2e2; color: #991b1b; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 500; cursor: pointer; }
.danger-btn.small { padding: 4px 12px; font-size: 13px; }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-box { background: white; border-radius: 16px; padding: 24px; width: 100%; max-width: 500px; max-height: 80vh; overflow-y: auto; }
.update-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
.update-meta { display: flex; justify-content: space-between; margin-bottom: 8px; }
.update-note { font-style: italic; color: #475569; margin: 0 0 12px 0; font-size: 14px; }
.update-actions { display: flex; gap: 8px; }
.reject-form { display: flex; flex-direction: column; gap: 8px; }
.form-input { width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; }
.flex-gap { display: flex; gap: 8px; }
.modal-actions { display: flex; justify-content: flex-end; margin-top: 24px; }
.alert { padding: 12px; border-radius: 8px; margin-bottom: 16px; }
.alert-error { background: #fee2e2; color: #991b1b; }
.alert-info { background: #e0f2fe; color: #075985; }
.mb-4 { margin-bottom: 16px; }
</style>

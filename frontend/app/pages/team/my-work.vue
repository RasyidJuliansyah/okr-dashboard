<template>
  <div class="admin-root">
    <div class="admin-content">
      <div class="header-section card">
        <div class="header-title">
          <h2>📊 Pekerjaan Saya</h2>
          <p class="section-desc">
            Inisiatif tim dan KPI yang menjadi tanggung jawab Anda hari ini.
          </p>
        </div>
      </div>

      <div v-if="loading" class="alert alert-info">Memuat data...</div>
      <div v-else-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>

      <!-- Inisiatif Tim Section -->
      <div v-if="!loading && teamInitiatives.length > 0" class="team-initiatives-section">
        <h3 class="section-title">📌 Inisiatif Tim Saya</h3>
        <div class="initiative-list">
          <div v-for="ini in teamInitiatives" :key="ini.id" class="ini-card card">
            <div class="ini-header">
              <h4>{{ ini.title }}</h4>
              <span class="status-badge" :class="getStatusClass(ini.status)">{{ ini.status }}</span>
            </div>
            <div class="ini-context">
              <p><strong>KR:</strong> {{ ini.keyResult?.title }}</p>
              <p><strong>Tim:</strong> {{ ini.team?.name }} <span v-if="ini.owner" class="text-sm text-gray" style="margin-left: 8px;">(PIC: <strong>{{ ini.owner.name }}</strong>)</span></p>
            </div>
            
            <div v-if="ini.kpis?.length > 0" class="ini-kpis">
              <h5>KPI Terkait:</h5>
              <div class="kpi-progress-list">
                <div v-for="kpi in ini.kpis" :key="kpi.id" class="kpi-progress-item">
                  <div class="kpi-progress-header">
                    <span class="kpi-title">{{ kpi.title }}</span>
                    <span class="kpi-numbers">{{ kpi.currentValue }}/{{ kpi.targetValue }} {{ kpi.unit }}</span>
                  </div>
                  <div class="progress-bar-container small">
                    <div class="progress-bar" :style="{ width: getProgressPercent(kpi) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-sm text-gray mt-2">Belum ada KPI untuk inisiatif ini.</div>
          </div>
        </div>
      </div>

      <h3 class="section-title mt-6">📊 KPI Yang Di-Assign Ke Saya</h3>
      <div v-if="!loading && kpiAssignments.length === 0" class="empty-state card">
        Belum ada KPI yang di-assign ke Anda.
      </div>

      <div class="kpi-grid">
        <div v-for="assign in kpiAssignments" :key="assign.id" class="kpi-card card">
          <div class="kpi-header">
            <h3>{{ assign.kpi.title }}</h3>
            <span class="status-badge" :class="getStatusClass(assign.kpi.status)">{{ assign.kpi.status }}</span>
          </div>
          
          <div class="kpi-context">
            <p><strong>KR:</strong> {{ assign.kpi.initiative?.keyResult?.title }}</p>
            <p><strong>Inisiatif:</strong> {{ assign.kpi.initiative?.title }}</p>
          </div>
          
          <div class="kpi-progress-section">
            <div class="progress-labels">
              <span>Target: <strong>{{ assign.kpi.targetValue }} {{ assign.kpi.unit }}</strong></span>
              <span>Saat ini: <strong>{{ assign.kpi.currentValue }} {{ assign.kpi.unit }}</strong></span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar" :style="{ width: getProgressPercent(assign.kpi) + '%' }"></div>
            </div>
          </div>
          
          <div class="kpi-updates">
            <h4 v-if="assign.kpi.updates?.length > 0">Update Terakhir:</h4>
            <div v-if="assign.kpi.updates?.length > 0" class="recent-update">
              <span class="update-date">{{ new Date(assign.kpi.updates[0].createdAt).toLocaleDateString() }}</span>
              <span class="update-val">Nilai dilaporkan: {{ assign.kpi.updates[0].newValue }}</span>
              <span class="update-status" :class="'status-' + assign.kpi.updates[0].status.toLowerCase()">
                {{ assign.kpi.updates[0].status }}
              </span>
            </div>
            <p v-else class="text-sm text-gray">Belum ada update.</p>
          </div>
          
          <div class="card-actions">
            <button class="primary-btn full-width" @click="openUpdateModal(assign.kpi)">📤 Submit Update Progress</button>
          </div>
        </div>
      </div>
      
      <!-- Modal Submit Update -->
      <div v-if="showUpdateModal" class="modal-overlay" @click.self="showUpdateModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Submit Update Progress</h3>
            <button class="modal-close-btn" @click="showUpdateModal = false">&times;</button>
          </div>
          <p class="mb-4">KPI: <strong>{{ selectedKpi?.title }}</strong></p>
          
          <div class="info-box mb-4">
            Target: {{ selectedKpi?.targetValue }} {{ selectedKpi?.unit }}<br/>
            Saat ini: {{ selectedKpi?.currentValue }} {{ selectedKpi?.unit }}
          </div>
          
          <label>Nilai Baru (Kumulatif) *</label>
          <input v-model.number="updateForm.newValue" type="number" class="form-input" />
          
          <label>Catatan Progress</label>
          <textarea v-model="updateForm.note" class="form-input" rows="3" placeholder="Apa yang sudah dikerjakan?"></textarea>
          
          <div v-if="modalError" class="alert alert-error">{{ modalError }}</div>
          
          <div class="modal-actions">
            <button class="secondary-btn" @click="showUpdateModal = false">Batal</button>
            <button class="primary-btn" @click="submitUpdate" :disabled="saving">
              {{ saving ? 'Mengirim...' : 'Kirim Update' }}
            </button>
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

const kpiAssignments = ref([]);
const teamInitiatives = ref([]);
const loading = ref(true);
const errorMsg = ref('');

const showUpdateModal = ref(false);
const saving = ref(false);
const modalError = ref('');
const selectedKpi = ref(null);
const updateForm = ref({
  newValue: 0,
  note: ''
});

const config = useRuntimeConfig();
const API = config.public.apiBase || 'http://localhost:3001/api';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authStore.token}`,
  };
}

onMounted(async () => {
  if (!authStore.isAuthenticated || !['TEAM', 'LEADER', 'ADMIN'].includes(authStore.user?.role)) {
    router.push('/login');
    return;
  }
  await Promise.all([fetchMyWork(), fetchTeamInitiatives()]);
});

async function fetchTeamInitiatives() {
  try {
    const res = await fetch(`${API}/initiatives/my-team`, { headers: getHeaders() });
    if (res.ok) {
      teamInitiatives.value = await res.json();
    }
  } catch (err) {
    console.error("Gagal memuat inisiatif tim:", err);
  }
}

async function fetchMyWork() {
  loading.value = true;
  errorMsg.value = '';
  try {
    // Wait, earlier I set endpoint to /my-work/all
    // Let's check initiative.routes.ts: router.get('/my-work/all', authMiddleware, getMyWork);
    const res = await fetch(`${API}/initiatives/my-work/all`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Gagal memuat pekerjaan');
    const data = await res.json();
    kpiAssignments.value = data;
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}

function getProgressPercent(kpi) {
  if (!kpi || !kpi.targetValue) return 0;
  return Math.min(100, Math.max(0, (kpi.currentValue / kpi.targetValue) * 100));
}

function getStatusClass(status) {
  if (status === 'ON_TRACK') return 'bg-green';
  if (status === 'AT_RISK') return 'bg-yellow';
  if (status === 'OFF_TRACK') return 'bg-red';
  return 'bg-gray';
}

function openUpdateModal(kpi) {
  selectedKpi.value = kpi;
  updateForm.value = {
    newValue: kpi.currentValue,
    note: ''
  };
  modalError.value = '';
  showUpdateModal.value = true;
}

async function submitUpdate() {
  if (updateForm.value.newValue === undefined || updateForm.value.newValue === null) {
    modalError.value = 'Nilai baru wajib diisi';
    return;
  }
  
  saving.value = true;
  modalError.value = '';
  try {
    // submitKpiUpdate route: POST /kpis/:id/updates
    const res = await fetch(`${API}/initiatives/kpis/${selectedKpi.value.id}/updates`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(updateForm.value)
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }
    
    showUpdateModal.value = false;
    await fetchMyWork(); // refresh
  } catch (err) {
    modalError.value = err.message;
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.admin-root { min-height: 100vh; background-color: #f8fafc; padding: 32px; }
.admin-content { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
.card { background: #ffffff; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }
.header-section { display: flex; justify-content: space-between; align-items: center; }
.header-title h2 { font-size: 24px; font-weight: 600; color: #1e293b; margin: 0 0 8px 0; }
.section-desc { font-size: 14px; color: #64748b; margin: 0; }

.kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.kpi-card { display: flex; flex-direction: column; gap: 16px; }
.kpi-header { display: flex; justify-content: space-between; align-items: flex-start; }
.kpi-header h3 { font-size: 16px; margin: 0; color: #0f172a; flex: 1; }
.status-badge { font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 600; }

.kpi-context { background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 13px; color: #475569; }
.kpi-context p { margin: 0 0 4px 0; }
.kpi-context p:last-child { margin: 0; }

.kpi-progress-section { display: flex; flex-direction: column; gap: 8px; }
.progress-labels { display: flex; justify-content: space-between; font-size: 13px; color: #475569; }
.progress-bar-container { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.progress-bar { height: 100%; background: #0ea5e9; transition: width 0.3s; }

.kpi-updates h4 { margin: 0 0 8px 0; font-size: 13px; color: #64748b; }
.recent-update { display: flex; flex-direction: column; gap: 4px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; }
.update-date { color: #94a3b8; }
.update-val { font-weight: 500; color: #1e293b; }
.update-status { font-weight: 600; display: inline-block; width: fit-content; padding: 2px 6px; border-radius: 4px; }

.status-pending_approval { background: #fef08a; color: #854d0e; }
.status-approved { background: #dcfce7; color: #166534; }
.status-rejected { background: #fee2e2; color: #991b1b; }

.bg-green { background: #dcfce7; color: #166534; }
.bg-yellow { background: #fef08a; color: #854d0e; }
.bg-red { background: #fee2e2; color: #991b1b; }
.bg-gray { background: #f1f5f9; color: #475569; }

.text-gray { color: #64748b; }
.text-sm { font-size: 12px; }

.primary-btn { background: #0ea5e9; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
.primary-btn:hover { background: #0284c7; }
.primary-btn:disabled { background: #94a3b8; cursor: not-allowed; }
.primary-btn.full-width { width: 100%; margin-top: auto; }
.secondary-btn { background: white; color: #475569; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; font-weight: 500; cursor: pointer; }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-box { background: white; border-radius: 16px; padding: 24px; width: 100%; max-width: 500px; }
.info-box { background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 14px; border: 1px solid #e2e8f0; }
.form-input { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 16px; box-sizing: border-box; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
.alert { padding: 12px; border-radius: 8px; margin-bottom: 16px; }
.alert-error { background: #fee2e2; color: #991b1b; }
.alert-info { background: #e0f2fe; color: #075985; }
.mb-4 { margin-bottom: 16px; }

/* Initiatives styles */
.section-title { font-size: 18px; margin: 0 0 16px 0; color: #0f172a; }
.mt-6 { margin-top: 32px; }
.team-initiatives-section { margin-bottom: 24px; }
.initiative-list { display: flex; flex-direction: column; gap: 16px; }
.ini-card { display: flex; flex-direction: column; gap: 12px; }
.ini-header { display: flex; justify-content: space-between; align-items: flex-start; }
.ini-header h4 { font-size: 16px; margin: 0; color: #0f172a; }
.ini-context { background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 13px; color: #475569; }
.ini-context p { margin: 0 0 4px 0; }
.ini-context p:last-child { margin: 0; }
.ini-kpis { padding-top: 12px; border-top: 1px solid #f1f5f9; }
.ini-kpis h5 { font-size: 13px; margin: 0 0 12px 0; color: #64748b; }
.kpi-progress-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.kpi-progress-item { display: flex; flex-direction: column; gap: 6px; }
.kpi-progress-header { display: flex; justify-content: space-between; font-size: 12px; }
.kpi-title { font-weight: 500; color: #334155; }
.kpi-numbers { color: #64748b; }
.progress-bar-container.small { height: 6px; }

/* Modal Header styling */
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.modal-header h3 { margin: 0; }
.modal-close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #64748b; }
.modal-close-btn:hover { color: #0f172a; }
.alert-info { background: #e0f2fe; color: #075985; }
.mb-4 { margin-bottom: 16px; }
</style>

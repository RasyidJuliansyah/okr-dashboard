<template>
  <div class="admin-root">
    <!-- Navbar / Header -->
    <header class="admin-header">
      <div class="header-brand">
        <NuxtLink to="/" class="back-link">
          <span class="back-icon">←</span> Kembali ke Dashboard
        </NuxtLink>
        <h1>Admin Console: Update Capaian OKR</h1>
      </div>
      <div class="header-user">
        <span class="user-badge admin">ADMIN</span>
        <span class="user-name">{{ auth.user?.name }}</span>
      </div>
    </header>

    <div class="admin-content">
      <section class="progress-section card">
        <div class="section-header">
          <div>
            <h2>Update Capaian Key Results</h2>
            <p class="section-desc">Masukkan capaian real-time harian untuk memperbarui status indikator kerja otomatis.</p>
          </div>
          <div class="filter-controls">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Cari Key Result..." 
              class="search-input"
            />
            <select v-model="filterQuarter" @change="fetchObjectives" class="quarter-select">
              <option value="">Semua Quarter</option>
              <option value="Q1-2026">Q1-2026</option>
              <option value="Q2-2026">Q2-2026</option>
              <option value="Q3-2026">Q3-2026</option>
              <option value="Q4-2026">Q4-2026</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          Memuat data Key Results...
        </div>

        <div v-else-if="filteredKeyResults.length === 0" class="empty-state">
          Tidak ada Key Result yang ditemukan.
        </div>

        <!-- Key Results Table / List -->
        <div v-else class="kr-grid">
          <div v-for="kr in filteredKeyResults" :key="kr.id" class="kr-update-card">
            <div class="kr-card-main">
              <div class="kr-details">
                <span class="parent-obj-title">{{ kr.objectiveTitle }} ({{ kr.objectiveQuarter }})</span>
                <h3>{{ kr.title }}</h3>
                <div class="kr-meta-row">
                  <span class="perspective-badge" :class="kr.bscPerspective.toLowerCase()">
                    {{ formatPerspective(kr.bscPerspective) }}
                  </span>
                  <span class="status-badge" :class="kr.status.toLowerCase().replace('_', '')">
                    {{ kr.status.replace('_', ' ') }}
                  </span>
                </div>
              </div>

              <!-- Metrics -->
              <div class="kr-metrics">
                <div class="metric-box">
                  <span class="m-label">Target</span>
                  <span class="m-val">{{ kr.targetValue }} {{ kr.unit }}</span>
                </div>
                <div class="metric-box">
                  <span class="m-label">Capaian Saat Ini</span>
                  <span class="m-val highlight">{{ kr.currentValue }} {{ kr.unit }}</span>
                </div>
              </div>

              <!-- Update Action Form -->
              <div class="update-form-inline">
                <div class="input-group">
                  <input 
                    v-model.number="updatePayloads[kr.id].newValue" 
                    type="number" 
                    step="any"
                    placeholder="Nilai baru"
                    class="val-input"
                  />
                  <input 
                    v-model="updatePayloads[kr.id].note" 
                    type="text" 
                    placeholder="Catatan update..."
                    class="note-input"
                  />
                  <button 
                    @click="submitProgress(kr.id)" 
                    :disabled="submittingId === kr.id"
                    class="update-btn"
                  >
                    {{ submittingId === kr.id ? '...' : 'Update' }}
                  </button>
                </div>
                <button @click="showHistory(kr)" class="history-btn">
                  🕒 Riwayat Audit
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- History Modal -->
    <div v-if="selectedKrForHistory" class="modal-backdrop" @click="closeHistory">
      <div class="modal-card" @click.stop>
        <div class="modal-header">
          <h3>Riwayat Audit Trail: {{ selectedKrForHistory.title }}</h3>
          <button @click="closeHistory" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="loadingHistory" class="modal-loading">
            Memuat riwayat perubahan...
          </div>
          <div v-else-if="historyLogs.length === 0" class="modal-empty">
            Belum ada catatan riwayat perubahan untuk Key Result ini.
          </div>
          <div v-else class="timeline">
            <div v-for="log in historyLogs" :key="log.id" class="timeline-item">
              <div class="timeline-badge"></div>
              <div class="timeline-content">
                <div class="timeline-time">
                  {{ formatDate(log.updatedAt) }} - Oleh <strong>{{ log.updatedBy }}</strong>
                </div>
                <div class="timeline-diff">
                  Perubahan: <span class="old-val">{{ log.oldValue }}</span> → <span class="new-val">{{ log.newValue }}</span>
                </div>
                <p v-if="log.note" class="timeline-note">"{{ log.note }}"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';

const auth = useAuthStore();
const config = useRuntimeConfig();

const objectives = ref([]);
const loading = ref(false);
const filterQuarter = ref('');
const searchQuery = ref('');

const updatePayloads = ref({});
const submittingId = ref(null);

// History Modal states
const selectedKrForHistory = ref(null);
const historyLogs = ref([]);
const loadingHistory = ref(false);

const flatKeyResults = computed(() => {
  const list = [];
  objectives.value.forEach(obj => {
    if (obj.keyResults) {
      obj.keyResults.forEach(kr => {
        list.push({
          ...kr,
          objectiveTitle: obj.title,
          objectiveQuarter: obj.quarter
        });
      });
    }
  });
  return list;
});

const filteredKeyResults = computed(() => {
  return flatKeyResults.value.filter(kr => {
    const matchesSearch = kr.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                          kr.objectiveTitle.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchesSearch;
  });
});

function formatPerspective(p) {
  if (!p) return '';
  return p.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function fetchObjectives() {
  loading.value = true;
  try {
    let url = `${config.public.apiBase}/objectives`;
    if (filterQuarter.value) {
      url += `?quarter=${filterQuarter.value}`;
    }
    const response = await $fetch(url, {
      headers: {
        Authorization: `Bearer ${auth.token}`
      }
    });
    objectives.value = response;

    // Initialize update payloads
    const payloads = {};
    flatKeyResults.value.forEach(kr => {
      payloads[kr.id] = {
        newValue: null,
        note: ''
      };
    });
    updatePayloads.value = payloads;
  } catch (err) {
    console.error('Error fetching objectives:', err);
  } finally {
    loading.value = false;
  }
}

async function submitProgress(krId) {
  const payload = updatePayloads.value[krId];
  if (payload.newValue === null || payload.newValue === undefined) {
    alert('Masukkan nilai capaian baru');
    return;
  }

  submittingId.value = krId;
  try {
    await $fetch(`${config.public.apiBase}/key-results/${krId}/progress`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json'
      },
      body: {
        newValue: payload.newValue,
        note: payload.note
      }
    });

    // Reset input row
    payload.newValue = null;
    payload.note = '';

    // Refresh list
    await fetchObjectives();
  } catch (err) {
    console.error('Update progress error:', err);
    alert(err.data?.message || 'Gagal memperbarui capaian.');
  } finally {
    submittingId.value = null;
  }
}

async function showHistory(kr) {
  selectedKrForHistory.value = kr;
  loadingHistory.value = true;
  try {
    const response = await $fetch(`${config.public.apiBase}/key-results/${kr.id}/history`, {
      headers: {
        Authorization: `Bearer ${auth.token}`
      }
    });
    historyLogs.value = response;
  } catch (err) {
    console.error('Error fetching history logs:', err);
  } finally {
    loadingHistory.value = false;
  }
}

function closeHistory() {
  selectedKrForHistory.value = null;
  historyLogs.value = [];
}

onMounted(() => {
  fetchObjectives();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

.admin-root {
  font-family: 'Outfit', sans-serif;
  min-height: 100vh;
  background: radial-gradient(circle at 10% 20%, rgb(15, 22, 38) 0%, rgb(8, 12, 21) 90%);
  color: white;
  padding: 0 0 60px 0;
}

/* Header */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-link {
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  transition: color 0.3s;
}

.back-link:hover {
  color: #00d2ff;
}

.header-brand h1 {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, #00d2ff 0%, #0066ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
}

.user-badge.admin {
  background: rgba(255, 75, 75, 0.15);
  color: #ff8888;
  border: 1px solid rgba(255, 75, 75, 0.3);
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

/* Layout Content */
.admin-content {
  max-width: 1100px;
  margin: 30px auto 0 auto;
  padding: 0 20px;
}

.card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 30px;
  backdrop-filter: blur(16px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 24px;
}

h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 6px 0;
}

.section-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* Filters */
.filter-controls {
  display: flex;
  gap: 12px;
}

.search-input,
.quarter-select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 14px;
  color: white;
  font-size: 13px;
  outline: none;
}

.search-input:focus,
.quarter-select:focus {
  border-color: #0088ff;
}

/* Grid & Cards */
.kr-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kr-update-card {
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s;
}

.kr-update-card:hover {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
}

.kr-card-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.parent-obj-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.kr-details h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 10px 0;
}

.kr-meta-row {
  display: flex;
  gap: 8px;
}

/* Metrics Row */
.kr-metrics {
  display: flex;
  gap: 20px;
  background: rgba(255, 255, 255, 0.02);
  padding: 12px 20px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.metric-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.m-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  font-weight: 500;
}

.m-val {
  font-size: 15px;
  font-weight: 600;
}

.m-val.highlight {
  color: #00d2ff;
}

/* Update Form Actions */
.update-form-inline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  border-top: 1px dashed rgba(255, 255, 255, 0.06);
  padding-top: 16px;
}

.input-group {
  display: flex;
  gap: 10px;
  flex-grow: 1;
}

.val-input {
  width: 110px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 8px 12px;
  color: white;
  outline: none;
}

.note-input {
  flex-grow: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 8px 12px;
  color: white;
  outline: none;
}

.update-btn {
  background: #0066ff;
  border: none;
  color: white;
  padding: 8px 18px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.update-btn:hover:not(:disabled) {
  background: #0055dd;
}

.history-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.history-btn:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: white;
  background: rgba(255, 255, 255, 0.02);
}

/* Badges */
.perspective-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
}

.perspective-badge.financial {
  background: rgba(0, 210, 255, 0.12);
  color: #8ce9ff;
  border: 1px solid rgba(0, 210, 255, 0.25);
}

.perspective-badge.customer {
  background: rgba(255, 170, 0, 0.12);
  color: #ffcc66;
  border: 1px solid rgba(255, 170, 0, 0.25);
}

.perspective-badge.internal_process {
  background: rgba(138, 43, 226, 0.12);
  color: #d8b4fe;
  border: 1px solid rgba(138, 43, 226, 0.25);
}

.perspective-badge.learning_growth {
  background: rgba(75, 255, 75, 0.12);
  color: #88ff88;
  border: 1px solid rgba(75, 255, 75, 0.25);
}

.status-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
}

.status-badge.ontrack {
  background: rgba(75, 255, 75, 0.15);
  color: #88ff88;
}

.status-badge.atrisk {
  background: rgba(255, 170, 0, 0.15);
  color: #ffcc66;
}

.status-badge.offtrack {
  background: rgba(255, 75, 75, 0.15);
  color: #ff8888;
}

/* States */
.loading-state,
.empty-state {
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s;
}

.modal-card {
  background: #141b2a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 18px;
  cursor: pointer;
}

.close-btn:hover {
  color: white;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.modal-loading,
.modal-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  padding: 30px;
}

/* Timeline */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timeline-item {
  display: flex;
  gap: 16px;
  position: relative;
}

.timeline-badge {
  width: 10px;
  height: 10px;
  background: #00d2ff;
  border-radius: 50%;
  margin-top: 6px;
  box-shadow: 0 0 8px #00d2ff;
  flex-shrink: 0;
}

.timeline-content {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 14px;
  border-radius: 8px;
  flex-grow: 1;
}

.timeline-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 4px;
}

.timeline-diff {
  font-size: 13px;
  font-weight: 500;
}

.old-val {
  color: #ff8888;
  text-decoration: line-through;
}

.new-val {
  color: #88ff88;
  font-weight: 600;
}

.timeline-note {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  margin: 6px 0 0 0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>

<template>
  <div class="admin-root">
    <div class="admin-content">
      <div class="header-section card">
        <div class="header-title">
          <h2>🎯 KR yang Di-assign ke Saya</h2>
          <p class="section-desc">
            Key Results yang menjadi tanggung jawab Anda. Anda bisa membuat Inisiatif dari sini.
          </p>
        </div>
      </div>

      <div v-if="loading" class="alert alert-info">Memuat data...</div>
      <div v-else-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>
      <div v-else-if="krs.length === 0" class="empty-state card">
        Tidak ada KR yang di-assign ke Anda.
      </div>
      
      <div v-else class="kr-list">
        <div v-for="assign in krs" :key="assign.id" class="kr-card card">
          <div class="kr-header">
            <div>
              <h3>{{ assign.keyResult.title }}</h3>
              <div class="kr-meta">
                <span class="badge">Objective: {{ assign.keyResult.objective.title }}</span>
                <span class="badge">BSC: {{ assign.keyResult.bscPerspective }}</span>
                <span class="badge" :class="getStatusClass(assign.keyResult.status)">Status: {{ assign.keyResult.status }}</span>
                <span class="badge bg-blue">RACI: {{ assign.raciRole }}</span>
              </div>
            </div>
            <div class="kr-progress">
              <div class="progress-bar-container">
                <div class="progress-bar" :style="{ width: getProgressPercent(assign.keyResult) + '%' }"></div>
              </div>
              <span class="progress-text">{{ assign.keyResult.currentValue }} / {{ assign.keyResult.targetValue }} {{ assign.keyResult.unit }} ({{ getProgressPercent(assign.keyResult).toFixed(1) }}%)</span>
            </div>
          </div>
          
          <div class="initiatives-section">
            <h4>📌 Inisiatif yang sudah dibuat ({{ assign.keyResult.initiatives?.length || 0 }}):</h4>
            <ul v-if="assign.keyResult.initiatives?.length > 0" class="ini-list-items">
              <li v-for="ini in assign.keyResult.initiatives" :key="ini.id" class="ini-item-row">
                <div class="ini-info-col">
                  <span class="ini-title">{{ ini.title }}</span>
                  <div class="ini-sub-meta">
                    <span class="badge-team">→ {{ ini.team?.name }}</span>
                    <span v-if="ini.owner" class="badge-owner">👤 {{ ini.owner.name }}</span>
                    <span class="badge" :class="getStatusClass(ini.status)">{{ ini.status }}</span>
                  </div>
                </div>
                <div class="ini-actions">
                  <button class="icon-btn" @click="startEditInitiative(ini, assign.keyResult)" title="Edit Inisiatif">✏️</button>
                  <button class="icon-btn danger" @click="deleteInitiative(ini.id)" title="Hapus Inisiatif">🗑️</button>
                </div>
              </li>
            </ul>
            <p v-else class="text-gray text-sm">Belum ada Inisiatif</p>
            <button class="primary-btn mt-2" @click="openInitiativeModal(assign.keyResult)">+ Buat Inisiatif dari KR ini</button>
          </div>
        </div>
      </div>
      
      <!-- MODAL: Buat / Edit Inisiatif -->
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ editingIni ? 'Edit Inisiatif' : 'Buat Inisiatif Baru' }}</h3>
            <button class="modal-close-btn" @click="showModal = false">&times;</button>
          </div>
          <p class="mb-4">Untuk KR: <strong>{{ selectedKr?.title }}</strong></p>
          
          <label>Judul Inisiatif *</label>
          <input v-model="form.title" class="form-input" placeholder="Contoh: Kampanye B2B" />
          
          <label>Deskripsi</label>
          <textarea v-model="form.description" class="form-input" rows="3"></textarea>
          
          <label>Pilih Tim / Departemen Anda *</label>
          <div class="searchable-field">
            <input
              v-model="leaderTeamSearch"
              type="text"
              class="form-input search-mini"
              placeholder="🔍 Cari nama departemen / tim..."
            />
            <select v-model="form.teamId" class="form-input">
              <option value="">-- Pilih Tim / Departemen --</option>
              <option v-for="team in filteredLeaderTeams" :key="team.id" :value="team.id">
                {{ team.name }}
              </option>
            </select>
          </div>
          
          <label>PIC Pegawai (Penanggung Jawab)</label>
          <div class="searchable-field">
            <input
              v-model="leaderUserSearch"
              type="text"
              class="form-input search-mini"
              placeholder="🔍 Cari nama pegawai..."
            />
            <select v-model="form.ownerId" class="form-input">
              <option value="">-- Pilih Pegawai (Opsional) --</option>
              <option v-for="user in filteredLeaderUsers" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
          </div>
          
          <label>Target Value</label>
          <input v-model.number="form.targetValue" type="number" class="form-input" />
          
          <label>Unit</label>
          <input v-model="form.unit" class="form-input" placeholder="%" />
          
          <div v-if="modalError" class="alert alert-error mt-2">{{ modalError }}</div>
          
          <div class="modal-actions">
            <button class="secondary-btn" @click="showModal = false">Batal</button>
            <button class="primary-btn" @click="saveInitiative" :disabled="saving">
              {{ saving ? 'Menyimpan...' : editingIni ? 'Simpan Perubahan' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const krs = ref([]);
const myTeams = ref([]);
const userList = ref([]);
const loading = ref(true);
const errorMsg = ref('');

const leaderTeamSearch = ref('');
const leaderUserSearch = ref('');

const filteredLeaderTeams = computed(() => {
  if (!leaderTeamSearch.value.trim()) return myTeams.value;
  const q = leaderTeamSearch.value.toLowerCase();
  return myTeams.value.filter((t) => t.name && t.name.toLowerCase().includes(q));
});

const filteredLeaderUsers = computed(() => {
  if (!leaderUserSearch.value.trim()) return userList.value;
  const q = leaderUserSearch.value.toLowerCase();
  return userList.value.filter((u) => u.name && u.name.toLowerCase().includes(q));
});

const showModal = ref(false);
const editingIni = ref(null);
const saving = ref(false);
const modalError = ref('');
const selectedKr = ref(null);
const form = ref({
  title: '',
  description: '',
  teamId: '',
  ownerId: '',
  targetValue: 0,
  unit: ''
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
  if (!authStore.isAuthenticated || !['LEADER', 'ADMIN'].includes(authStore.user?.role)) {
    router.push('/login');
    return;
  }
  await Promise.all([fetchData(), fetchMyTeams(), fetchUsers()]);
});

async function fetchUsers() {
  try {
    const res = await fetch(`${API}/users`, { headers: getHeaders() });
    if (res.ok) {
      userList.value = await res.json();
    }
  } catch (err) {
    console.error('Error fetch users:', err);
  }
}

async function fetchData() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await fetch(`${API}/key-results/my/assigned`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Gagal memuat KR');
    const data = await res.json();
    krs.value = data;
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function fetchMyTeams() {
  try {
    const res = await fetch(`${API}/users/teams`, { headers: getHeaders() });
    if (res.ok) {
      const teams = await res.json();
      // Filter only teams led by this leader
      myTeams.value = teams.filter(t => t.leaderId === authStore.user.id);
    }
  } catch (e) {
    console.error(e);
  }
}

// I will fix fetchMyTeams in a moment by adding /teams endpoint if missing.

function getProgressPercent(kr) {
  if (!kr || !kr.targetValue) return 0;
  return Math.min(100, Math.max(0, (kr.currentValue / kr.targetValue) * 100));
}

function getStatusClass(status) {
  if (status === 'ON_TRACK') return 'bg-green';
  if (status === 'AT_RISK') return 'bg-yellow';
  if (status === 'OFF_TRACK') return 'bg-red';
  return 'bg-gray';
}

function openInitiativeModal(kr) {
  editingIni.value = null;
  selectedKr.value = kr;
  leaderTeamSearch.value = '';
  leaderUserSearch.value = '';
  form.value = {
    title: '',
    description: '',
    teamId: myTeams.value[0]?.id || '',
    ownerId: '',
    targetValue: 0,
    unit: '%'
  };
  modalError.value = '';
  showModal.value = true;
}

function startEditInitiative(ini, kr) {
  editingIni.value = ini;
  selectedKr.value = kr || ini.keyResult;
  leaderTeamSearch.value = '';
  leaderUserSearch.value = '';
  form.value = {
    title: ini.title,
    description: ini.description || '',
    teamId: ini.teamId || myTeams.value[0]?.id || '',
    ownerId: ini.ownerId || '',
    targetValue: ini.targetValue || 0,
    unit: ini.unit || '%'
  };
  modalError.value = '';
  showModal.value = true;
}

async function deleteInitiative(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus Inisiatif ini beserta seluruh KPI di dalamnya?")) {
    return;
  }
  try {
    const res = await fetch(`${API}/initiatives/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }
    await fetchData();
  } catch (err) {
    console.error("Delete initiative error:", err);
    alert(err.message || "Gagal menghapus Inisiatif.");
  }
}

async function saveInitiative() {
  if (!form.value.title || !form.value.teamId) {
    modalError.value = 'Judul dan Tim wajib diisi';
    return;
  }
  
  saving.value = true;
  modalError.value = '';
  try {
    let res;
    if (editingIni.value) {
      res = await fetch(`${API}/initiatives/${editingIni.value.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(form.value)
      });
    } else {
      res = await fetch(`${API}/initiatives`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          ...form.value,
          keyResultId: selectedKr.value.id
        })
      });
    }
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }
    
    showModal.value = false;
    editingIni.value = null;
    await fetchData();
  } catch (e) {
    modalError.value = e.message || 'Gagal menyimpan inisiatif';
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.admin-root {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 32px;
}

.admin-content {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f5f9;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title h2 {
  font-family: 'Rubik', sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.section-desc {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.kr-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kr-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kr-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.kr-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #0f172a;
}

.kr-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: #f1f5f9;
  color: #475569;
}

.badge-team {
  font-size: 12px;
  color: #0ea5e9;
  font-weight: 500;
  margin-left: 8px;
  margin-right: 8px;
}

.bg-green { background: #dcfce7; color: #166534; }
.bg-yellow { background: #fef08a; color: #854d0e; }
.bg-red { background: #fee2e2; color: #991b1b; }
.bg-blue { background: #dbeafe; color: #1e40af; }
.bg-gray { background: #f1f5f9; color: #475569; }

.kr-progress {
  width: 200px;
  text-align: right;
}

.progress-bar-container {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-bar {
  height: 100%;
  background: #0ea5e9;
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: #64748b;
}

.initiatives-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #334155;
}

.initiatives-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.initiatives-section li {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.ini-title {
  font-weight: 500;
  color: #1e293b;
  font-size: 14px;
}

.primary-btn {
  background: #0ea5e9;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.primary-btn:hover { background: #0284c7; }
.primary-btn:disabled { background: #94a3b8; cursor: not-allowed; }

.secondary-btn {
  background: white;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}
.secondary-btn:hover { background: #f8fafc; }

.mt-2 { margin-top: 8px; }
.mb-4 { margin-bottom: 16px; }

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 500px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.modal-header h3 { margin: 0; }
.modal-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #64748b;
  padding: 0;
}
.modal-close-btn:hover { color: #0f172a; }
.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 16px;
  box-sizing: border-box;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
.alert { padding: 12px; border-radius: 8px; margin-bottom: 16px; }
.alert-error { background: #fee2e2; color: #991b1b; }
.alert-info { background: #e0f2fe; color: #075985; }
.searchable-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.search-mini {
  margin-bottom: 0 !important;
  font-size: 13px;
  background: #f8fafc;
}
.ini-list-items {
  list-style: none;
  padding: 0;
  margin: 0 0 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ini-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.ini-info-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ini-sub-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.badge-owner {
  font-size: 12px;
  color: #0369a1;
  background: #e0f2fe;
  padding: 2px 8px;
  border-radius: 12px;
}
.ini-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.icon-btn {
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.icon-btn:hover {
  background: #f1f5f9;
}
.icon-btn.danger:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}
</style>

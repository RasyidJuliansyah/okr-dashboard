<template>
  <div class="admin-root">
    <div class="admin-content">
      <div class="header-section card">
        <div class="header-title">
          <h2>Manajemen Initiative & KPI</h2>
          <p class="section-desc">
            Kelola Initiative (level Tim) dan KPI (level Individu) yang menjadi turunan Key Result.
          </p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <NuxtLink to="/initiatives" class="secondary-btn" style="text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
            ⚡ Buka Kanban Board
          </NuxtLink>
          <button class="secondary-btn" @click="showBulkModal = true">
            📤 Bulk Upload CSV
          </button>
          <button class="primary-btn" @click="openAddInitiativeModal">+ Tambah Initiative</button>
        </div>
      </div>

      <!-- Alert -->
      <div v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</div>
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <!-- Filter by KR -->
      <div class="filter-section card">
        <label>Filter by Key Result:</label>
        <select v-model="selectedKrId" @change="fetchInitiatives">
          <option value="">Semua Key Result</option>
          <option v-for="kr in allKrs" :key="kr.id" :value="kr.id">{{ kr.title }}</option>
        </select>
      </div>

      <!-- Daftar Initiative -->
      <div v-if="initiatives.length === 0" class="empty-state card">
        Belum ada Initiative. Klik "+ Tambah Initiative" untuk membuat.
      </div>

      <div v-for="initiative in initiatives" :key="initiative.id" class="initiative-block card">
        <div class="initiative-header">
          <div>
            <h3>{{ initiative.title }}</h3>
            <span class="team-badge">Tim: {{ initiative.team?.name }}</span>
            <span class="kr-badge">KR: {{ initiative.keyResult?.title }}</span>
          </div>
          <div class="initiative-actions">
            <button class="secondary-btn" @click="openAddKpiModal(initiative)">+ KPI</button>
            <button class="icon-btn" @click="openEditInitiativeModal(initiative)">✏️</button>
            <button class="icon-btn danger" @click="deleteInitiative(initiative.id)">🗑️</button>
          </div>
        </div>

        <!-- KPI List -->
        <div class="kpi-list">
          <div v-if="initiative.kpis?.length === 0" class="empty-kpi">Belum ada KPI di Initiative ini.</div>
          <div v-for="kpi in initiative.kpis" :key="kpi.id" class="kpi-row">
            <span class="kpi-name">{{ kpi.title }}</span>
            <span class="kpi-target">Target: {{ kpi.targetValue }} {{ kpi.unit }}</span>
            <span class="kpi-current">Saat ini: {{ kpi.currentValue }}</span>
            <div class="kpi-assignees">
              <span v-for="a in kpi.assignments" :key="a.userId" class="assignee-chip">{{ a.user?.name }}</span>
            </div>
            <div class="kpi-actions">
              <button class="secondary-btn small" @click="openAssignModal(kpi)">Assign</button>
              <button class="icon-btn" @click="openEditKpiModal(kpi)">✏️</button>
              <button class="icon-btn danger" @click="deleteKpi(kpi.id)">🗑️</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── MODAL: Add/Edit Initiative ─── -->
      <div v-if="showInitiativeModal" class="modal-overlay" @click.self="showInitiativeModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ editingInitiative ? 'Edit' : 'Tambah' }} Initiative</h3>
            <button class="modal-close-btn" @click="showInitiativeModal = false">&times;</button>
          </div>
          <label>Judul *</label>
          <input v-model="initiativeForm.title" class="form-input" placeholder="Judul initiative..." />
          <label>Deskripsi</label>
          <textarea v-model="initiativeForm.description" class="form-input" rows="3"></textarea>
          <label>Key Result *</label>
          <select v-model="initiativeForm.keyResultId" class="form-input">
            <option value="">-- Pilih Key Result --</option>
            <option v-for="kr in allKrs" :key="kr.id" :value="kr.id">{{ kr.title }}</option>
          </select>
          <label>Tim / Departemen *</label>
          <input
            v-model="teamSearch"
            type="text"
            class="form-input"
            style="margin-bottom: 6px;"
            placeholder="🔍 Cari departemen / tim..."
          />
          <select v-model="initiativeForm.teamId" class="form-input">
            <option value="">-- Pilih Tim / Departemen --</option>
            <option v-for="team in filteredTeams" :key="team.id" :value="team.id">{{ team.name }}</option>
          </select>
          <label>PIC Pegawai (Penanggung Jawab)</label>
          <input
            v-model="userSearch"
            type="text"
            class="form-input"
            style="margin-bottom: 6px;"
            placeholder="🔍 Cari nama pegawai..."
          />
          <select v-model="initiativeForm.ownerId" class="form-input">
            <option value="">-- Pilih Pegawai (Opsional) --</option>
            <option v-for="user in filteredUsers" :key="user.id" :value="user.id">{{ user.name }}</option>
          </select>
          <label>Target Value</label>
          <input v-model.number="initiativeForm.targetValue" type="number" class="form-input" />
          <label>Unit</label>
          <input v-model="initiativeForm.unit" class="form-input" placeholder="%, IDR, tasks..." />
          <div class="modal-actions">
            <button class="secondary-btn" @click="showInitiativeModal = false">Batal</button>
            <button class="primary-btn" @click="saveInitiative">Simpan</button>
          </div>
        </div>
      </div>

      <!-- ─── MODAL: Add/Edit KPI ─── -->
      <div v-if="showKpiModal" class="modal-overlay" @click.self="showKpiModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ editingKpi ? 'Edit' : 'Tambah' }} KPI</h3>
            <button class="modal-close-btn" @click="showKpiModal = false">&times;</button>
          </div>
          <p>Initiative: <strong>{{ selectedInitiativeForKpi?.title }}</strong></p>
          <label>Judul KPI *</label>
          <input v-model="kpiForm.title" class="form-input" placeholder="Judul KPI..." />
          <label>Target Value *</label>
          <input v-model.number="kpiForm.targetValue" type="number" class="form-input" />
          <label>Unit</label>
          <input v-model="kpiForm.unit" class="form-input" placeholder="%, IDR, tasks..." />
          <div class="modal-actions">
            <button class="secondary-btn" @click="showKpiModal = false">Batal</button>
            <button class="primary-btn" @click="saveKpi">Simpan</button>
          </div>
        </div>
      </div>

      <!-- ─── MODAL: Assign Member ke KPI ─── -->
      <div v-if="showAssignModal" class="modal-overlay" @click.self="showAssignModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Assign Member ke KPI: {{ selectedKpiForAssign?.title }}</h3>
            <button class="modal-close-btn" @click="showAssignModal = false">&times;</button>
          </div>
          <p>Pilih member untuk di-assign:</p>
          <div class="member-list">
            <label v-for="user in teamMembers" :key="user.id" class="member-checkbox">
              <input type="checkbox" :value="user.id" v-model="selectedMemberIds" />
              {{ user.name }} ({{ user.email }})
            </label>
          </div>
          <div class="modal-actions">
            <button class="secondary-btn" @click="showAssignModal = false">Batal</button>
            <button class="primary-btn" @click="saveAssignment">Assign</button>
          </div>
        </div>
      </div>

      <!-- Bulk Upload Modal -->
      <BulkUploadModal
        v-if="showBulkModal"
        type="initiative"
        @close="showBulkModal = false"
        @done="fetchInitiatives"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import BulkUploadModal from '~/components/BulkUploadModal.vue';

const auth = useAuthStore();
const config = useRuntimeConfig();
const API = config.public.apiBase;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${auth.token}`,
});

// ─── Data ───
const initiatives = ref<any[]>([]);
const allKrs = ref<any[]>([]);
const allTeams = ref<any[]>([]);
const teamMembers = ref<any[]>([]);
const selectedKrId = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const showBulkModal = ref(false);

// Initiative modal
const showInitiativeModal = ref(false);
const editingInitiative = ref<any>(null);
const initiativeForm = ref({ title: '', description: '', keyResultId: '', teamId: '', ownerId: '', targetValue: 0, unit: '' });

const teamSearch = ref('');
const userSearch = ref('');

const filteredTeams = computed(() => {
  if (!teamSearch.value.trim()) return allTeams.value;
  const q = teamSearch.value.toLowerCase();
  return allTeams.value.filter((t: any) => t.name && t.name.toLowerCase().includes(q));
});

const filteredUsers = computed(() => {
  if (!userSearch.value.trim()) return teamMembers.value;
  const q = userSearch.value.toLowerCase();
  return teamMembers.value.filter((u: any) => u.name && u.name.toLowerCase().includes(q));
});

// KPI modal
const showKpiModal = ref(false);
const editingKpi = ref<any>(null);
const selectedInitiativeForKpi = ref<any>(null);
const kpiForm = ref({ title: '', targetValue: 0, unit: '' });

// Assign modal
const showAssignModal = ref(false);
const selectedKpiForAssign = ref<any>(null);
const selectedMemberIds = ref<string[]>([]);

// ─── Fetch ───
async function fetchInitiatives() {
  const url = selectedKrId.value ? `${API}/initiatives?krId=${selectedKrId.value}` : `${API}/initiatives`;
  const res = await fetch(url, { headers: getHeaders() });
  if (res.ok) initiatives.value = await res.json();
}

async function fetchAllKrs() {
  const objRes = await fetch(`${API}/objectives`, { headers: getHeaders() });
  if (objRes.ok) {
    const objs = await objRes.json();
    allKrs.value = objs.flatMap((o: any) => o.keyResults || []);
  }
}

async function fetchAllTeams() {
  const res = await fetch(`${API}/users/teams`, { headers: getHeaders() });
  if (res.ok) allTeams.value = await res.json();
}

async function fetchTeamMembers() {
  const res = await fetch(`${API}/users`, { headers: getHeaders() });
  if (res.ok) teamMembers.value = await res.json();
}

// ─── Initiative CRUD ───
function openAddInitiativeModal() {
  editingInitiative.value = null;
  teamSearch.value = '';
  userSearch.value = '';
  initiativeForm.value = { title: '', description: '', keyResultId: selectedKrId.value || '', teamId: '', ownerId: '', targetValue: 0, unit: '' };
  errorMessage.value = '';
  showInitiativeModal.value = true;
}

function openEditInitiativeModal(ini: any) {
  editingInitiative.value = ini;
  teamSearch.value = '';
  userSearch.value = '';
  initiativeForm.value = {
    title: ini.title,
    description: ini.description || '',
    keyResultId: ini.keyResultId,
    teamId: ini.teamId,
    ownerId: ini.ownerId || '',
    targetValue: ini.targetValue,
    unit: ini.unit || '',
  };
  errorMessage.value = '';
  showInitiativeModal.value = true;
}

async function saveInitiative() {
  if (!initiativeForm.value.title || !initiativeForm.value.keyResultId || !initiativeForm.value.teamId) {
    errorMessage.value = 'Judul, Key Result, dan Tim wajib diisi';
    return;
  }
  const method = editingInitiative.value ? 'PUT' : 'POST';
  const url = editingInitiative.value ? `${API}/initiatives/${editingInitiative.value.id}` : `${API}/initiatives`;
  const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(initiativeForm.value) });
  if (res.ok) {
    showInitiativeModal.value = false;
    successMessage.value = `Initiative berhasil ${editingInitiative.value ? 'diupdate' : 'dibuat'}`;
    setTimeout(() => successMessage.value = '', 3000);
    await fetchInitiatives();
  } else {
    const err = await res.json();
    errorMessage.value = err.message;
  }
}

async function deleteInitiative(id: string) {
  if (!confirm('Hapus Initiative ini beserta semua KPI di dalamnya?')) return;
  const res = await fetch(`${API}/initiatives/${id}`, { method: 'DELETE', headers: getHeaders() });
  if (res.ok) {
    successMessage.value = 'Initiative berhasil dihapus';
    setTimeout(() => successMessage.value = '', 3000);
    await fetchInitiatives();
  }
}

// ─── KPI CRUD ───
function openAddKpiModal(initiative: any) {
  editingKpi.value = null;
  selectedInitiativeForKpi.value = initiative;
  kpiForm.value = { title: '', targetValue: 0, unit: '' };
  errorMessage.value = '';
  showKpiModal.value = true;
}

function openEditKpiModal(kpi: any) {
  editingKpi.value = kpi;
  kpiForm.value = { title: kpi.title, targetValue: kpi.targetValue, unit: kpi.unit || '' };
  showKpiModal.value = true;
}

async function saveKpi() {
  if (!kpiForm.value.title || kpiForm.value.targetValue === undefined) {
    errorMessage.value = 'Judul dan Target Value wajib diisi';
    return;
  }
  const method = editingKpi.value ? 'PUT' : 'POST';
  const url = editingKpi.value
    ? `${API}/initiatives/kpis/${editingKpi.value.id}`
    : `${API}/initiatives/${selectedInitiativeForKpi.value.id}/kpis`;
  const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(kpiForm.value) });
  if (res.ok) {
    showKpiModal.value = false;
    successMessage.value = `KPI berhasil ${editingKpi.value ? 'diupdate' : 'dibuat'}`;
    setTimeout(() => successMessage.value = '', 3000);
    await fetchInitiatives();
  } else {
    const err = await res.json();
    errorMessage.value = err.message;
  }
}

async function deleteKpi(id: string) {
  if (!confirm('Hapus KPI ini?')) return;
  const res = await fetch(`${API}/initiatives/kpis/${id}`, { method: 'DELETE', headers: getHeaders() });
  if (res.ok) {
    successMessage.value = 'KPI berhasil dihapus';
    setTimeout(() => successMessage.value = '', 3000);
    await fetchInitiatives();
  }
}

// ─── Assign ───
function openAssignModal(kpi: any) {
  selectedKpiForAssign.value = kpi;
  selectedMemberIds.value = kpi.assignments?.map((a: any) => a.userId) || [];
  showAssignModal.value = true;
}

async function saveAssignment() {
  const res = await fetch(`${API}/initiatives/kpis/${selectedKpiForAssign.value.id}/assign`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ userIds: selectedMemberIds.value }),
  });
  if (res.ok) {
    showAssignModal.value = false;
    successMessage.value = 'Assignment berhasil disimpan';
    setTimeout(() => successMessage.value = '', 3000);
    await fetchInitiatives();
  } else {
    const err = await res.json();
    errorMessage.value = err.message;
  }
}

// ─── Lifecycle ───
onMounted(async () => {
  if (!auth.isAuthenticated || !['ADMIN', 'MANAGER', 'LEADER'].includes(auth.user?.role ?? '')) {
    navigateTo('/dashboard');
    return;
  }
  await Promise.all([fetchInitiatives(), fetchAllKrs(), fetchAllTeams(), fetchTeamMembers()]);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.admin-root {
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
  background-color: var(--content-bg, #0a0a0a);
  color: var(--text-color, #ffffff);
  padding: 40px;
}
.admin-content {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.card {
  background: var(--card-bg, #1e1e1e);
  border: 1px solid var(--border-color, #333);
  border-radius: 12px;
  padding: 24px;
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-title h2 { margin: 0 0 8px 0; font-size: 1.5rem; }
.section-desc { margin: 0; color: #888; }
.primary-btn, .secondary-btn, .icon-btn {
  padding: 8px 16px; border-radius: 6px; cursor: pointer; border: none; font-weight: 500; transition: all 0.2s;
}
.primary-btn { background: #3b82f6; color: white; }
.primary-btn:hover { background: #2563eb; }
.secondary-btn { background: #333; color: white; }
.secondary-btn:hover { background: #444; }
.icon-btn { background: transparent; padding: 4px; font-size: 1.2rem; }
.icon-btn:hover { transform: scale(1.1); }
.alert { padding: 12px; border-radius: 6px; margin-bottom: 20px; }
.alert-error { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; }
.alert-success { background: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid #22c55e; }
.filter-section { display: flex; align-items: center; gap: 12px; }
.filter-section select { padding: 8px; border-radius: 6px; background: #2a2a2a; color: white; border: 1px solid #444; }
.empty-state { text-align: center; color: #888; padding: 40px !important; }
.initiative-block { display: flex; flex-direction: column; gap: 16px; }
.initiative-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #333; padding-bottom: 12px; }
.initiative-header h3 { margin: 0 0 8px 0; font-size: 1.2rem; }
.team-badge, .kr-badge { display: inline-block; padding: 4px 8px; background: #2a2a2a; border-radius: 4px; font-size: 0.8rem; color: #aaa; margin-right: 8px; }
.initiative-actions { display: flex; gap: 8px; }
.kpi-list { display: flex; flex-direction: column; gap: 8px; }
.empty-kpi { color: #666; font-style: italic; font-size: 0.9rem; }
.kpi-row { display: flex; align-items: center; justify-content: space-between; background: #2a2a2a; padding: 12px; border-radius: 8px; }
.kpi-name { font-weight: 500; flex: 1; }
.kpi-target, .kpi-current { color: #aaa; font-size: 0.9rem; margin-right: 16px; }
.kpi-assignees { display: flex; gap: 4px; flex-wrap: wrap; margin-right: 16px; }
.assignee-chip { background: #3b82f6; color: white; padding: 2px 6px; border-radius: 12px; font-size: 0.75rem; }
.kpi-actions { display: flex; gap: 8px; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 999; }
.modal-box { background: var(--card-bg, #1e1e1e); padding: 24px; border-radius: 12px; width: 400px; max-width: 90%; border: 1px solid #333; display: flex; flex-direction: column; gap: 12px; }
.modal-box h3 { margin: 0; }
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #444;
}
.modal-close-btn {
  background: #333;
  border: 1px solid #444;
  color: #aaa;
  font-size: 22px;
  line-height: 1;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.2s;
}
.modal-close-btn:hover {
  background: #444;
  color: white;
}
.form-input { width: 100%; padding: 10px; border-radius: 6px; background: #2a2a2a; border: 1px solid #444; color: white; box-sizing: border-box; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px; }
.member-list { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; background: #2a2a2a; padding: 12px; border-radius: 6px; }
.member-checkbox { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer; }
</style>

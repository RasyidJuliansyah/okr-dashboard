<template>
  <div class="dept-root">
    <div class="dept-content">

      <!-- Header -->
      <div class="page-header card">
        <div class="header-title">
          <h2>Struktur Departemen</h2>
          <p class="section-desc">
            Hierarki organisasi per departemen. Lihat Manager, Leader, dan anggota Team serta keterhubungannya ke Key Result dan Initiative.
          </p>

          <!-- Scope Notice Badge -->
          <div class="scope-banner" :class="userRoleClass">
            <span class="scope-icon">{{ roleIcon }}</span>
            <span class="scope-text">
              <strong>Scope Akses ({{ auth.user?.role }}):</strong> {{ scopeDescription }}
            </span>
          </div>
        </div>
        <div class="header-actions" style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
          <select v-model="selectedDept" class="dept-filter-select">
            <option value="">Semua Departemen ({{ DEPARTMENTS.length }})</option>
            <option v-for="d in DEPARTMENTS" :key="d.value" :value="d.value">
              {{ d.label }}
            </option>
          </select>
          <button v-if="isAdmin" class="primary-btn" @click="openAddDeptModal">+ Tambah Dept</button>
        </div>
      </div>

      <!-- Alert -->
      <div v-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>
      <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state card">Memuat data struktur departemen...</div>

      <!-- Empty State -->
      <div v-else-if="filteredDepts.length === 0" class="empty-state card" style="text-align: center; padding: 2.5rem 1rem;">
        <p style="color: var(--text-muted, #94a3b8); margin: 0;">
          Tidak ada data departemen yang sesuai dengan scope Anda.
        </p>
      </div>

      <!-- Dept Cards -->
      <div v-else class="dept-grid">
        <div
          v-for="dept in filteredDepts"
          :key="dept.value"
          class="dept-card card"
        >
          <!-- Dept Header -->
          <div class="dept-card-header">
            <div class="dept-icon">{{ dept.icon }}</div>
            <div>
              <h3 class="dept-name">{{ dept.label }}</h3>
              <p class="dept-member-count">{{ getMemberCount(dept.value) }} anggota terdaftar</p>
            </div>
          </div>

          <!-- Manager Row -->
          <div class="role-section">
            <div class="role-label manager-label">
              <span class="role-dot manager-dot"></span>
              Manager Departemen
            </div>
            <div class="role-member-list">
              <div v-if="getManagers(dept.value).length === 0" class="empty-role">
                <span class="empty-hint">Belum ada Manager</span>
                <button v-if="isAdmin" class="assign-btn" @click="openAssignRoleModal(dept.value, 'MANAGER')">
                  + Assign Manager
                </button>
              </div>
              <div v-else class="member-chips">
                <div
                  v-for="m in getManagers(dept.value)"
                  :key="m.id"
                  class="member-chip manager-chip"
                >
                  <div class="chip-avatar" :style="{ background: getAvatarColor(m.name) }">
                    {{ getInitials(m.name) }}
                  </div>
                  <div class="chip-info">
                    <span class="chip-name">{{ m.name }}</span>
                    <span class="chip-pos">{{ m.position || 'Manager' }}</span>
                  </div>
                  <button v-if="isAdmin" class="remove-member-btn" title="Keluarkan dari Departemen" @click="removeUserFromDept(m.id)">
                    &times;
                  </button>
                </div>
                <button v-if="isAdmin" class="assign-btn small" @click="openAssignRoleModal(dept.value, 'MANAGER')">
                  + Edit
                </button>
              </div>
            </div>
          </div>

          <!-- Leader Row -->
          <div class="role-section">
            <div class="role-label leader-label">
              <span class="role-dot leader-dot"></span>
              Team Leader
            </div>
            <div class="role-member-list">
              <div v-if="getLeaders(dept.value).length === 0" class="empty-role">
                <span class="empty-hint">Belum ada Leader</span>
                <button v-if="isAdmin" class="assign-btn" @click="openAssignRoleModal(dept.value, 'LEADER')">
                  + Assign Leader
                </button>
              </div>
              <div v-else class="member-chips">
                <div
                  v-for="m in getLeaders(dept.value)"
                  :key="m.id"
                  class="member-chip leader-chip"
                >
                  <div class="chip-avatar" :style="{ background: getAvatarColor(m.name) }">
                    {{ getInitials(m.name) }}
                  </div>
                  <div class="chip-info">
                    <span class="chip-name">{{ m.name }}</span>
                    <span class="chip-pos">{{ m.position || 'Leader' }}</span>
                  </div>
                  <button v-if="isAdmin" class="remove-member-btn" title="Keluarkan dari Departemen" @click="removeUserFromDept(m.id)">
                    &times;
                  </button>
                </div>
                <button v-if="isAdmin" class="assign-btn small" @click="openAssignRoleModal(dept.value, 'LEADER')">
                  + Edit
                </button>
              </div>
            </div>
          </div>

          <!-- Team Members Row -->
          <div class="role-section">
            <div class="role-label team-label">
              <span class="role-dot team-dot"></span>
              Anggota Tim (Staff / Specialist)
            </div>
            <div class="role-member-list">
              <div v-if="getTeamMembers(dept.value).length === 0" class="empty-role">
                <span class="empty-hint">Belum ada anggota Tim</span>
                <button v-if="isAdmin" class="assign-btn" @click="openAssignRoleModal(dept.value, 'TEAM')">
                  + Assign Anggota
                </button>
              </div>
              <div v-else class="member-chips">
                <div
                  v-for="m in getTeamMembers(dept.value)"
                  :key="m.id"
                  class="member-chip team-chip"
                >
                  <div class="chip-avatar" :style="{ background: getAvatarColor(m.name) }">
                    {{ getInitials(m.name) }}
                  </div>
                  <div class="chip-info">
                    <span class="chip-name">{{ m.name }}</span>
                    <span class="chip-pos">{{ m.position || 'Team Member' }}</span>
                  </div>
                  <button v-if="isAdmin" class="remove-member-btn" title="Keluarkan dari Departemen" @click="removeUserFromDept(m.id)">
                    &times;
                  </button>
                </div>
                <button v-if="isAdmin" class="assign-btn small" @click="openAssignRoleModal(dept.value, 'TEAM')">
                  + Edit
                </button>
              </div>
            </div>
          </div>

          <!-- Assign KR / Initiative Buttons (Admin & Manager) -->
          <div v-if="isAdmin || isManager" class="dept-card-actions">
            <button class="action-btn kr-btn" @click="openAssignKrModal(dept.value)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Assign RACI KR
            </button>
            <button class="action-btn init-btn" @click="openAssignInitiativeModal(dept.value)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Assign Initiative
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── MODAL: Tambah Departemen (Admin) ─── -->
    <div v-if="showAddDeptModal" class="modal-backdrop" @click.self="showAddDeptModal = false">
      <div class="modal-card card">
        <div class="modal-header">
          <h3>Tambah Departemen Baru</h3>
          <button class="close-btn" @click="showAddDeptModal = false">&times;</button>
        </div>
        
        <div class="form-group">
          <label>Nama Departemen *</label>
          <input
            v-model="newDeptForm.name"
            @input="generateDeptValue"
            type="text"
            class="form-input"
            placeholder="Contoh: Digital Marketing"
          />
        </div>
        <div class="form-group" style="margin-top: 1rem;">
          <label>ID/Value Departemen *</label>
          <input
            v-model="newDeptForm.value"
            type="text"
            class="form-input"
            placeholder="Contoh: DIGITAL_MARKETING"
            style="text-transform: uppercase;"
          />
          <p class="pick-meta" style="margin-top: 0.25rem;">Digunakan sebagai identifier unik dalam sistem.</p>
        </div>

        <div class="modal-footer" style="margin-top: 1rem;">
          <button class="secondary-btn" @click="showAddDeptModal = false">Batal</button>
          <button class="primary-btn" :disabled="saving || !newDeptForm.name || !newDeptForm.value" @click="saveNewDepartment">
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ─── MODAL: Assign Role ke Departemen ─── -->
    <div v-if="showRoleModal" class="modal-backdrop" @click.self="showRoleModal = false">
      <div class="modal-card card">
        <div class="modal-header">
          <h3>Assign {{ targetRole }} &mdash; {{ getDeptLabel(targetDept) }}</h3>
          <button class="close-btn" @click="showRoleModal = false">&times;</button>
        </div>

        <div class="form-group" style="margin-bottom: 0.75rem;">
          <input
            v-model="roleSearch"
            type="text"
            class="form-input"
            placeholder="🔍 Cari nama atau email pegawai..."
          />
        </div>

        <div class="user-picker-list">
          <div v-if="filteredUsersForRole.length === 0" class="empty-hint">
            Tidak ada pegawai yang cocok.
          </div>
          <label
            v-for="user in filteredUsersForRole"
            :key="user.id"
            class="user-pick-item"
            :class="{ selected: isUserSelectedForRole(user.id) }"
          >
            <input
              v-if="targetRole === 'MANAGER'"
              type="radio"
              :value="user.id"
              v-model="selectedRoleUserIds[0]"
              name="manager-pick"
            />
            <input
              v-else
              type="checkbox"
              :value="user.id"
              v-model="selectedRoleUserIds"
            />
            <div class="chip-avatar small" :style="{ background: getAvatarColor(user.name) }">
              {{ getInitials(user.name) }}
            </div>
            <div class="pick-info">
              <span class="pick-name">{{ user.name }}</span>
              <span class="pick-meta">{{ user.position || user.role }} &bull; {{ user.email }}</span>
            </div>
          </label>
        </div>

        <div class="modal-footer">
          <button class="secondary-btn" @click="showRoleModal = false">Batal</button>
          <button class="primary-btn" :disabled="saving" @click="saveRoleAssignment">
            {{ saving ? 'Menyimpan...' : 'Simpan Assignment' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ─── MODAL: Assign RACI KR ─── -->
    <div v-if="showKrModal" class="modal-backdrop" @click.self="showKrModal = false">
      <div class="modal-card card">
        <div class="modal-header">
          <h3>Assign RACI Key Result &mdash; {{ getDeptLabel(targetDept) }}</h3>
          <button class="close-btn" @click="showKrModal = false">&times;</button>
        </div>

        <div class="form-group">
          <label>Pilih Key Result *</label>
          <select v-model="selectedKrId" class="form-input" @change="loadKrAssignments">
            <option value="">-- Pilih Key Result --</option>
            <option v-for="kr in allKrs" :key="kr.id" :value="kr.id">
              [{{ kr.bscPerspective }}] {{ kr.title }}
            </option>
          </select>
        </div>

        <div v-if="selectedKrId" class="raci-assign-grid">
          <!-- R -->
          <div class="raci-col r-col">
            <div class="raci-col-header">
              <span class="raci-badge r-badge">R</span>
              <strong>Responsible (Wajib 1)</strong>
            </div>
            <select v-model="krAssign.responsibleId" class="form-input">
              <option value="">-- Pilih Pegawai --</option>
              <option v-for="u in getDeptAllMembers(targetDept)" :key="u.id" :value="u.id">
                {{ u.name }} ({{ u.role }})
              </option>
            </select>
          </div>

          <!-- A -->
          <div class="raci-col a-col">
            <div class="raci-col-header">
              <span class="raci-badge a-badge">A</span>
              <strong>Accountable (Min 1)</strong>
            </div>
            <div class="checkbox-user-list">
              <label v-for="u in getDeptAllMembers(targetDept)" :key="u.id" class="check-user-item">
                <input type="checkbox" :value="u.id" v-model="krAssign.accountableIds" />
                <span>{{ u.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="secondary-btn" @click="showKrModal = false">Batal</button>
          <button class="primary-btn" :disabled="saving || !selectedKrId" @click="saveKrRaci">
            {{ saving ? 'Menyimpan...' : 'Simpan RACI' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ─── MODAL: Assign Initiative ─── -->
    <div v-if="showInitModal" class="modal-backdrop" @click.self="showInitModal = false">
      <div class="modal-card card">
        <div class="modal-header">
          <h3>Assign Initiative &mdash; {{ getDeptLabel(targetDept) }}</h3>
          <button class="close-btn" @click="showInitModal = false">&times;</button>
        </div>

        <div class="form-group">
          <label>Pilih Initiative *</label>
          <select v-model="selectedInitiativeId" class="form-input" @change="loadInitiativeKpis">
            <option value="">-- Pilih Initiative --</option>
            <option v-for="ini in allInitiatives" :key="ini.id" :value="ini.id">
              {{ ini.title }} (Tim: {{ ini.team?.name }})
            </option>
          </select>
        </div>

        <div v-if="selectedInitiativeId && selectedInitiativeKpis.length > 0" class="init-kpi-assign-list">
          <div v-for="kpi in selectedInitiativeKpis" :key="kpi.id" class="kpi-assign-card">
            <h4>KPI: {{ kpi.title }}</h4>
            <div class="checkbox-user-list">
              <label v-for="u in getDeptAllMembers(targetDept)" :key="u.id" class="check-user-item">
                <input
                  type="checkbox"
                  :value="u.id"
                  :checked="(kpiAssignMap[kpi.id] || []).includes(u.id)"
                  @change="toggleKpiUser(kpi.id, u.id, $event)"
                />
                <span>{{ u.name }} ({{ u.role }})</span>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="secondary-btn" @click="showInitModal = false">Batal</button>
          <button class="primary-btn" :disabled="saving || !selectedInitiativeId" @click="saveKpiAssignments">
            {{ saving ? 'Menyimpan...' : 'Simpan Assignment' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';

const config = useRuntimeConfig();
const auth = useAuthStore();
const API = config.public.apiBase;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${auth.token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '')}`,
});

// ─── Roles & Permissions ───
const isAdmin = computed(() => auth.user?.role === 'ADMIN');
const isCLevel = computed(() => auth.user?.role === 'C_LEVEL');
const isManager = computed(() => auth.user?.role === 'MANAGER');
const isLeader = computed(() => auth.user?.role === 'LEADER');
const isTeam = computed(() => auth.user?.role === 'TEAM');

const userRoleClass = computed(() => {
  const r = (auth.user?.role || '').toLowerCase();
  return `scope-${r}`;
});

const roleIcon = computed(() => {
  if (isAdmin.value) return '👑';
  if (isCLevel.value) return '📊';
  if (isManager.value) return '👔';
  if (isLeader.value) return '🛡️';
  return '👥';
});

const scopeDescription = computed(() => {
  if (isAdmin.value || isCLevel.value) {
    return 'Menampilkan seluruh struktur hierarki departemen (Company-wide).';
  }
  if (isManager.value) {
    return 'Menampilkan departemen yang Anda kelola / pimpin.';
  }
  if (isLeader.value) {
    return 'Menampilkan departemen dan tim yang Anda pimpin.';
  }
  return 'Menampilkan hierarki departemen dan anggota tim Anda.';
});

// ─── State ───
const loading = ref(false);
const saving = ref(false);
const errorMsg = ref('');
const successMsg = ref('');
const selectedDept = ref('');

const allUsers = ref<any[]>([]);
const allKrs = ref<any[]>([]);
const allInitiatives = ref<any[]>([]);

// ─── Modal state ───
const showRoleModal = ref(false);
const targetDept = ref('');
const targetRole = ref('');
const roleSearch = ref('');
const selectedRoleUserIds = ref<string[]>([]);

const showKrModal = ref(false);
const selectedKrId = ref('');
const krAssign = ref<{ responsibleId: string; accountableIds: string[]; consultedIds: string[]; informedIds: string[] }>({
  responsibleId: '',
  accountableIds: [],
  consultedIds: [],
  informedIds: []
});

const showInitModal = ref(false);
const selectedInitiativeId = ref('');
const selectedInitiativeKpis = ref<any[]>([]);
const kpiAssignMap = ref<Record<string, string[]>>({});

const showAddDeptModal = ref(false);
const newDeptForm = ref({ name: '', value: '' });

// ─── Departments Config ───
const DEPARTMENTS = ref<any[]>([]);

// ─── Computed ───
const filteredDepts = computed(() => {
  if (!selectedDept.value) return DEPARTMENTS.value;
  return DEPARTMENTS.value.filter(d => d.value === selectedDept.value);
});

const filteredUsersForRole = computed(() => {
  return allUsers.value.filter(u => {
    const matchSearch = !roleSearch.value ||
      u.name.toLowerCase().includes(roleSearch.value.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(roleSearch.value.toLowerCase());
    return matchSearch;
  });
});

function isUserSelectedForRole(userId: string) {
  return selectedRoleUserIds.value.includes(userId);
}

// ─── Helpers ───
function getManagers(deptVal: string) {
  const deptObj = DEPARTMENTS.value.find(d => d.value === deptVal);
  if (deptObj && deptObj.manager) {
    return [deptObj.manager];
  }
  return allUsers.value.filter(u => u.department === deptVal && u.role === 'MANAGER');
}

function getLeaders(dept: string) {
  return allUsers.value.filter(u => u.department === dept && u.role === 'LEADER');
}

function getTeamMembers(dept: string) {
  return allUsers.value.filter(u => u.department === dept && u.role === 'TEAM');
}

function getDeptAllMembers(dept: string) {
  return allUsers.value.filter(u => u.department === dept);
}

function getMemberCount(dept: string) {
  return allUsers.value.filter(u => u.department === dept).length;
}

function getDeptLabel(val: string) {
  return DEPARTMENTS.value.find(d => d.value === val)?.label || val;
}

function getInitials(name: string) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = ['#0E97D6', '#0583C3', '#7C3AED', '#DB2777', '#EA580C', '#00A925'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── Fetch ───
const FALLBACK_ICONS = ['🏢', '📊', '💼', '👥', '💡', '🌟', '⚡', '🚀'];

async function fetchDepartments() {
  try {
    const res = await fetch(`${API}/departments`, { headers: getHeaders() });
    if (res.ok) {
      const data = await res.json();
      DEPARTMENTS.value = data.map((d: any, index: number) => ({
        id: d.id,
        value: d.value,
        label: d.name,
        managerId: d.managerId,
        manager: d.manager,
        icon: FALLBACK_ICONS[index % FALLBACK_ICONS.length],
      }));
    }
  } catch (e) {
    console.error('Gagal memuat departemen');
  }
}

async function fetchUsers() {
  loading.value = true;
  try {
    const res = await fetch(`${API}/users`, { headers: getHeaders() });
    if (res.ok) {
      allUsers.value = await res.json();
    }
  } catch (e) {
    errorMsg.value = 'Gagal memuat data pegawai';
  } finally {
    loading.value = false;
  }
}

async function fetchKrs() {
  try {
    const res = await fetch(`${API}/objectives`, { headers: getHeaders() });
    if (res.ok) {
      const objs = await res.json();
      allKrs.value = objs.flatMap((o: any) =>
        (o.keyResults || []).map((kr: any) => ({ ...kr, objectiveTitle: o.title }))
      );
    }
  } catch (e) {}
}

async function fetchInitiatives() {
  try {
    const res = await fetch(`${API}/initiatives`, { headers: getHeaders() });
    if (res.ok) {
      allInitiatives.value = await res.json();
    }
  } catch (e) {}
}

// ─── Modal Actions ───
function openAddDeptModal() {
  newDeptForm.value = { name: '', value: '' };
  showAddDeptModal.value = true;
}

function generateDeptValue() {
  if (!newDeptForm.value.name) {
    newDeptForm.value.value = '';
    return;
  }
  newDeptForm.value.value = newDeptForm.value.name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_');
}

async function saveNewDepartment() {
  saving.value = true;
  errorMsg.value = '';
  try {
    const res = await fetch(`${API}/departments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(newDeptForm.value),
    });
    if (res.ok) {
      showAddDeptModal.value = false;
      successMsg.value = 'Departemen baru berhasil ditambahkan!';
      setTimeout(() => successMsg.value = '', 3000);
      await fetchDepartments();
    } else {
      const err = await res.json();
      errorMsg.value = err.message || 'Gagal menambahkan departemen';
    }
  } catch (e: any) {
    errorMsg.value = e.message;
  } finally {
    saving.value = false;
  }
}

function openAssignRoleModal(deptVal: string, role: string) {
  targetDept.value = deptVal;
  targetRole.value = role;
  roleSearch.value = '';
  if (role === 'MANAGER') {
    const mgrs = getManagers(deptVal);
    selectedRoleUserIds.value = mgrs.length ? [mgrs[0].id] : [];
  } else if (role === 'LEADER') {
    selectedRoleUserIds.value = getLeaders(deptVal).map(u => u.id);
  } else if (role === 'TEAM') {
    selectedRoleUserIds.value = getTeamMembers(deptVal).map(u => u.id);
  }
  showRoleModal.value = true;
}

async function saveRoleAssignment() {
  saving.value = true;
  errorMsg.value = '';
  try {
    const deptObj = DEPARTMENTS.value.find(d => d.value === targetDept.value);
    if (!deptObj) return;

    if (targetRole.value === 'MANAGER') {
      const mgrId = selectedRoleUserIds.value[0] || null;
      await fetch(`${API}/departments/${deptObj.id}/manager`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ userId: mgrId }),
      });
    } else {
      const prevMembers = allUsers.value.filter(
        u => u.department === targetDept.value && u.role === targetRole.value
      );
  
      // Users to assign to this dept and role
      for (const uid of selectedRoleUserIds.value) {
        await fetch(`${API}/users/${uid}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({
            role: targetRole.value,
            department: targetDept.value,
          }),
        });
      }
  
      // Users who were deselected (removed from this role & department)
      for (const prev of prevMembers) {
        if (!selectedRoleUserIds.value.includes(prev.id)) {
          await fetch(`${API}/users/${prev.id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ department: null, role: 'TEAM' }),
          });
        }
      }
    }

    showRoleModal.value = false;
    successMsg.value = 'Penugasan role berhasil disimpan!';
    setTimeout(() => successMsg.value = '', 3000);
    await Promise.all([fetchDepartments(), fetchUsers()]);
  } catch (e: any) {
    errorMsg.value = e.message;
  } finally {
    saving.value = false;
  }
}

async function removeUserFromDept(userId: string) {
  if (!confirm('Apakah Anda yakin ingin mengeluarkan pegawai ini dari struktur departemen? (Data master tidak akan terhapus)')) return;
  try {
    const res = await fetch(`${API}/users/${userId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ department: null }),
    });
    if (res.ok) {
      successMsg.value = 'Pegawai berhasil dikeluarkan dari departemen.';
      await Promise.all([fetchDepartments(), fetchUsers()]);
      setTimeout(() => successMsg.value = '', 3000);
    } else {
      const err = await res.json();
      errorMsg.value = err.message || 'Gagal mengeluarkan pegawai';
    }
  } catch (e: any) {
    errorMsg.value = e.message;
  }
}

function openAssignKrModal(deptVal: string) {
  targetDept.value = deptVal;
  selectedKrId.value = '';
  krAssign.value = { responsibleId: '', accountableIds: [], consultedIds: [], informedIds: [] };
  showKrModal.value = true;
}

async function loadKrAssignments() {
  if (!selectedKrId.value) return;
  try {
    const res = await fetch(`${API}/key-results/${selectedKrId.value}/assignments`, { headers: getHeaders() });
    if (res.ok) {
      const assigns = await res.json();
      const r = assigns.find((a: any) => a.raciRole === 'RESPONSIBLE');
      const a = assigns.filter((a: any) => a.raciRole === 'ACCOUNTABLE').map((a: any) => a.userId);
      krAssign.value.responsibleId = r ? r.userId : '';
      krAssign.value.accountableIds = a;
    }
  } catch (e) {}
}

async function saveKrRaci() {
  if (!selectedKrId.value) return;
  saving.value = true;
  try {
    const assignments: any[] = [];
    if (krAssign.value.responsibleId) {
      assignments.push({ userId: krAssign.value.responsibleId, raciRole: 'RESPONSIBLE' });
    }
    krAssign.value.accountableIds.forEach(uid => {
      assignments.push({ userId: uid, raciRole: 'ACCOUNTABLE' });
    });

    const res = await fetch(`${API}/key-results/${selectedKrId.value}/assign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        assignments,
        departments: [targetDept.value]
      })
    });

    if (res.ok) {
      showKrModal.value = false;
      successMsg.value = 'RACI Key Result berhasil disimpan!';
      setTimeout(() => successMsg.value = '', 3000);
    } else {
      const err = await res.json();
      alert(err.message || 'Gagal menyimpan RACI');
    }
  } catch (e: any) {
    alert(e.message);
  } finally {
    saving.value = false;
  }
}

function openAssignInitiativeModal(deptVal: string) {
  targetDept.value = deptVal;
  selectedInitiativeId.value = '';
  selectedInitiativeKpis.value = [];
  kpiAssignMap.value = {};
  showInitModal.value = true;
}

async function loadInitiativeKpis() {
  if (!selectedInitiativeId.value) return;
  try {
    const res = await fetch(`${API}/initiatives/${selectedInitiativeId.value}/kpis`, { headers: getHeaders() });
    if (res.ok) {
      const kpis = await res.json();
      selectedInitiativeKpis.value = kpis;
      const map: Record<string, string[]> = {};
      kpis.forEach((k: any) => {
        map[k.id] = (k.assignments || []).map((a: any) => a.userId);
      });
      kpiAssignMap.value = map;
    }
  } catch (e) {}
}

function toggleKpiUser(kpiId: string, userId: string, event: Event) {
  const target = event.target as HTMLInputElement;
  if (!kpiAssignMap.value[kpiId]) kpiAssignMap.value[kpiId] = [];
  if (target.checked) {
    if (!kpiAssignMap.value[kpiId].includes(userId)) {
      kpiAssignMap.value[kpiId].push(userId);
    }
  } else {
    kpiAssignMap.value[kpiId] = kpiAssignMap.value[kpiId].filter(id => id !== userId);
  }
}

async function saveKpiAssignments() {
  saving.value = true;
  try {
    for (const kpi of selectedInitiativeKpis.value) {
      const userIds = kpiAssignMap.value[kpi.id] || [];
      await fetch(`${API}/initiatives/kpis/${kpi.id}/assign`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userIds })
      });
    }
    showInitModal.value = false;
    successMsg.value = 'Penugasan KPI berhasil disimpan!';
    setTimeout(() => successMsg.value = '', 3000);
  } catch (e: any) {
    alert(e.message);
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await Promise.all([
    fetchDepartments(),
    fetchUsers(),
    fetchKrs(),
    fetchInitiatives(),
  ]);
});
</script>

<style scoped>
.dept-root {
  padding: 1.5rem;
  background: var(--bg-primary, #f8fafc);
  min-height: calc(100vh - 70px);
}

.card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.page-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 16px;
}

.header-title h2 {
  margin: 0;
  font-size: 1.35rem;
  color: var(--text-primary, #0f172a);
}

.section-desc {
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  color: var(--text-secondary, #64748b);
}

/* Scope Banner */
.scope-banner {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.82rem;
}

.scope-banner.scope-admin { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
.scope-banner.scope-c_level { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; }
.scope-banner.scope-manager { background: #fefce8; border: 1px solid #fef08a; color: #854d0e; }
.scope-banner.scope-leader { background: #faf5ff; border: 1px solid #e9d5ff; color: #6b21a8; }
.scope-banner.scope-team { background: #f8fafc; border: 1px solid #e2e8f0; color: #334155; }

.dept-filter-select {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  font-size: 0.85rem;
  outline: none;
}

.primary-btn {
  background: #0E97D6;
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.primary-btn:hover {
  background: #0b7bb0;
}

.secondary-btn {
  background: #ffffff;
  color: var(--text-primary, #0f172a);
  border: 1px solid #cbd5e1;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

/* Dept Grid */
.dept-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.dept-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: all 0.2s ease;
}

.dept-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.07);
  transform: translateY(-2px);
}

.dept-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border-color, #f1f5f9);
  padding-bottom: 10px;
}

.dept-icon {
  font-size: 1.8rem;
}

.dept-name {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}

.dept-member-count {
  margin: 2px 0 0 0;
  font-size: 0.78rem;
  color: var(--text-muted, #94a3b8);
}

/* Role section */
.role-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.role-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.manager-label { color: #0284c7; }
.leader-label { color: #9333ea; }
.team-label { color: #475569; }

.role-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.manager-dot { background: #0284c7; }
.leader-dot { background: #9333ea; }
.team-dot { background: #64748b; }

.empty-role {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-input, #f8fafc);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
}

.empty-hint {
  color: var(--text-muted, #94a3b8);
  font-size: 0.78rem;
}

.assign-btn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #0E97D6;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
}

.assign-btn:hover {
  background: rgba(14, 151, 214, 0.06);
  border-color: #0E97D6;
}

.member-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.member-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.8rem;
  border: 1px solid transparent;
}

.manager-chip { background: #eff6ff; border-color: #bfdbfe; }
.leader-chip { background: #faf5ff; border-color: #e9d5ff; }
.team-chip { background: #f8fafc; border-color: #e2e8f0; }

.chip-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chip-avatar.small {
  width: 28px;
  height: 28px;
  font-size: 0.75rem;
}

.chip-info {
  display: flex;
  flex-direction: column;
}

.chip-name {
  font-weight: 600;
  color: var(--text-primary, #0f172a);
  font-size: 0.78rem;
  line-height: 1.2;
}

.chip-pos {
  font-size: 0.68rem;
  color: var(--text-muted, #64748b);
}

.dept-card-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid var(--border-color, #f1f5f9);
}

.action-btn {
  flex: 1;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.kr-btn { background: #eff6ff; border: 1px solid #bfdbfe; color: #0284c7; }
.init-btn { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }

/* Modals */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  backdrop-filter: blur(2px);
}

.modal-card {
  width: 95%;
  max-width: 540px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 1.5rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.15rem;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
}

.user-picker-list {
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px;
}

.user-pick-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
}

.user-pick-item:hover { background: #f1f5f9; }
.user-pick-item.selected { background: #e0f2fe; }

.pick-info {
  display: flex;
  flex-direction: column;
}

.pick-name { font-size: 0.82rem; font-weight: 600; color: #0f172a; }
.pick-meta { font-size: 0.72rem; color: #64748b; }

.raci-assign-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 1rem;
}

.raci-col {
  padding: 10px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.raci-col-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.82rem;
}

.raci-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.r-badge { background: #e0f2fe; color: #0284c7; }
.a-badge { background: #fef3c7; color: #b45309; }

.checkbox-user-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 140px;
  overflow-y: auto;
}

.check-user-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 1.25rem;
}

.alert {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.alert-error { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
.alert-success { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }

.remove-member-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 1.15rem;
  line-height: 1;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  transition: all 0.2s ease;
}
.remove-member-btn:hover {
  background: #fee2e2;
  color: #b91c1c;
}
</style>

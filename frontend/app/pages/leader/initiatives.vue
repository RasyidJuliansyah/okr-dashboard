<template>
  <div class="admin-root">
    <div class="admin-content">
      <div class="header-section card">
        <div class="header-title">
          <h2>Inisiatif Tim Saya</h2>
          <p class="section-desc">
            Kelola Inisiatif yang dikerjakan oleh Tim Anda beserta Task-nya.
          </p>
        </div>
        <div class="header-actions">
          <button class="primary-btn" @click="openAddInitiativeModal">
            + Tambah Inisiatif
          </button>
        </div>
      </div>

      <div v-if="loading" class="alert alert-info">Memuat data...</div>
      <div v-else-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>
      <div v-else-if="initiatives.length === 0" class="empty-state card">
        Belum ada Inisiatif. Klik "+ Tambah Inisiatif" untuk membuat inisiatif
        baru.
      </div>

      <div
        v-for="initiative in initiatives"
        :key="initiative.id"
        class="initiative-block card"
      >
        <div class="initiative-header">
          <div class="init-header-top">
            <div>
              <h3>{{ initiative.title }}</h3>
              <span class="team-badge">Tim: {{ initiative.team?.name }}</span>
              <span class="kr-badge"
                >KR: {{ initiative.keyResult?.title }}</span
              >
            </div>
            <div class="init-progress-badge">
              <span class="pct-val"
                >{{ getInitiativeProgressPct(initiative) }}%</span
              >
              <span class="pct-lbl">Progress</span>
            </div>
          </div>
          <!-- Progress bar for Initiative -->
          <div class="init-progress-track">
            <div
              class="init-progress-bar"
              :style="{ width: getInitiativeProgressPct(initiative) + '%' }"
            ></div>
          </div>
        </div>

        <div class="task-list">
          <div v-if="initiative.tasks?.length === 0" class="empty-task">
            Belum ada Task di Initiative ini.
          </div>
          <div v-for="task in initiative.tasks" :key="task.id" class="task-row">
            <div class="task-info">
              <span class="task-name">{{ task.title }}</span>
              <div class="task-details">
                <span class="task-target"
                  >Target: {{ task.targetValue }} {{ task.unit || "" }}</span
                >
                <span class="task-current"
                  >Saat ini: {{ task.currentValue }}</span
                >
                <span class="task-pct-tag"
                  >{{ getTaskProgressPct(task) }}%</span
                >
              </div>
              <div class="task-mini-track">
                <div
                  class="task-mini-bar"
                  :style="{ width: getTaskProgressPct(task) + '%' }"
                ></div>
              </div>
            </div>

            <div class="task-assignees">
              <span
                v-for="a in task.assignments"
                :key="a.userId"
                class="assignee-chip"
                >{{ a.user?.name }}</span
              >
              <span
                v-if="!task.assignments || task.assignments.length === 0"
                class="text-sm text-gray"
                >Belum ada assignee</span
              >
            </div>

            <div class="task-actions">
              <button
                class="secondary-btn small"
                @click="openAssignModal(task, initiative)"
              >
                Assign
              </button>
              <button class="primary-btn small" @click="openReviewModal(task)">
                Review Update
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Review Progress -->
      <div
        v-if="showReviewModal"
        class="modal-overlay"
        @click.self="showReviewModal = false"
      >
        <div class="modal-box">
          <h3>Review Progress Task</h3>
          <p class="mb-4">
            Task: <strong>{{ selectedTask?.title }}</strong>
          </p>

          <div v-if="pendingUpdates.length === 0" class="text-gray">
            Tidak ada update pending.
          </div>

          <div v-for="upd in pendingUpdates" :key="upd.id" class="update-card">
            <div class="update-meta">
              <span
                >Nilai baru: <strong>{{ upd.newValue }}</strong> (Sebelumnya:
                {{ upd.oldValue }})</span
              >
              <span class="text-sm text-gray">{{
                new Date(upd.createdAt).toLocaleDateString()
              }}</span>
            </div>
            <p v-if="upd.note" class="update-note">"{{ upd.note }}"</p>
            <div
              v-if="upd.link"
              class="update-link"
              style="margin-top: 8px; margin-bottom: 8px"
            >
              <a
                :href="upd.link"
                target="_blank"
                class="primary-btn small"
                style="
                  display: inline-flex;
                  align-items: center;
                  gap: 4px;
                  text-decoration: none;
                "
              >
                Buka Link Dokumentasi
              </a>
            </div>

            <div v-if="rejectingId === upd.id" class="reject-form">
              <textarea
                v-model="rejectNote"
                placeholder="Alasan penolakan..."
                class="form-input"
              ></textarea>
              <div class="flex-gap">
                <button class="secondary-btn small" @click="rejectingId = null">
                  Batal
                </button>
                <button class="danger-btn small" @click="confirmReject(upd.id)">
                  Konfirmasi Tolak
                </button>
              </div>
            </div>
            <div v-else class="update-actions">
              <button class="primary-btn small" @click="approveUpdate(upd.id)">
                Approve
              </button>
              <button class="danger-btn small" @click="rejectingId = upd.id">
                Reject
              </button>
            </div>
          </div>

          <div class="modal-actions">
            <button class="secondary-btn" @click="showReviewModal = false">
              Tutup
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Assign Member ke Task -->
      <div
        v-if="showAssignModal"
        class="modal-overlay"
        @click.self="showAssignModal = false"
      >
        <div class="modal-box">
          <h3>Assign Member ke Task</h3>
          <p class="mb-4">
            Task: <strong>{{ selectedTask?.title }}</strong>
          </p>
          <p class="text-sm text-gray mb-2">
            Pilih anggota tim Anda yang bertanggung jawab atas Task ini:
          </p>

          <div v-if="teamMembers.length === 0" class="text-gray">
            Belum ada anggota tim terdaftar.
          </div>
          <div class="member-checkbox-list">
            <label
              v-for="member in teamMembers"
              :key="member.id"
              class="checkbox-item"
            >
              <input
                type="checkbox"
                :value="member.id"
                v-model="selectedAssigneeIds"
              />
              <span
                >{{ member.name }} ({{ member.position || member.role }})</span
              >
            </label>
          </div>

          <div class="modal-actions">
            <button class="secondary-btn" @click="showAssignModal = false">
              Batal
            </button>
            <button class="primary-btn" @click="saveTaskAssignment">
              Simpan Assignment
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Tambah Initiative -->
      <div
        v-if="showAddInitiativeModal"
        class="modal-overlay"
        @click.self="showAddInitiativeModal = false"
      >
        <div class="modal-box">
          <h3>Tambah Inisiatif Baru</h3>

          <label class="form-label">Judul Inisiatif *</label>
          <input
            v-model="initiativeForm.title"
            class="form-input mb-3"
            placeholder="Nama inisiatif..."
          />

          <label class="form-label">Parent Key Result *</label>
          <select v-model="initiativeForm.keyResultId" class="form-input mb-3">
            <option value="">-- Pilih Key Result --</option>
            <option v-for="kr in availableKrs" :key="kr.id" :value="kr.id">
              {{ kr.objective?.title ? `[${kr.objective.title}] ` : ""
              }}{{ kr.title }}
            </option>
          </select>

          <label class="form-label">Tim *</label>
          <select v-model="initiativeForm.teamId" class="form-input mb-3">
            <option value="">-- Pilih Tim --</option>
            <option v-for="team in leaderTeams" :key="team.id" :value="team.id">
              {{ team.name }}
            </option>
          </select>

          <div class="form-row-2 mb-3">
            <div>
              <label class="form-label">Target Value</label>
              <input
                v-model.number="initiativeForm.targetValue"
                type="number"
                class="form-input"
              />
            </div>
            <div>
              <label class="form-label">Satuan (Unit)</label>
              <input
                v-model="initiativeForm.unit"
                class="form-input"
                placeholder="%, session, tasks..."
              />
            </div>
          </div>

          <div class="modal-actions">
            <button
              class="secondary-btn"
              @click="showAddInitiativeModal = false"
            >
              Batal
            </button>
            <button class="primary-btn" @click="saveInitiative">
              Simpan Inisiatif
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

const initiatives = ref([]);
const loading = ref(true);
const errorMsg = ref("");

const showReviewModal = ref(false);
const selectedTask = ref(null);
const pendingUpdates = ref([]);
const rejectingId = ref(null);
const rejectNote = ref("");

// Assign Member Modal state
const showAssignModal = ref(false);
const teamMembers = ref([]);
const selectedAssigneeIds = ref([]);
const activeInitiative = ref(null);

// Create Initiative Modal state
const showAddInitiativeModal = ref(false);
const availableKrs = ref([]);
const leaderTeams = ref([]);
const initiativeForm = ref({
  title: "",
  keyResultId: "",
  teamId: "",
  targetValue: 0,
  unit: "",
  weight: 1.0,
});

const config = useRuntimeConfig();
const API = config.public.apiBase || "http://localhost:3001/api";

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authStore.token}`,
  };
}

onMounted(async () => {
  if (
    !authStore.isAuthenticated ||
    !["LEADER", "MANAGER", "ADMIN"].includes(authStore.user?.role)
  ) {
    router.push("/login");
    return;
  }
  if (
    authStore.user &&
    (authStore.user.department === undefined ||
      authStore.user.managedDepartments === undefined)
  ) {
    try {
      await authStore.fetchUser();
    } catch (err) {
      console.error(err);
    }
  }
  await Promise.all([
    fetchInitiatives(),
    fetchLeaderTeams(),
    fetchKrsDropdown(),
  ]);
});

async function fetchInitiatives() {
  loading.value = true;
  errorMsg.value = "";
  try {
    const res = await fetch(`${API}/initiatives`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Gagal memuat Initiative");
    initiatives.value = await res.json();
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function fetchLeaderTeams() {
  try {
    const res = await fetch(`${API}/users/teams`, { headers: getHeaders() });
    if (res.ok) {
      const teams = await res.json();
      if (authStore.user?.role === "ADMIN") {
        leaderTeams.value = teams;
      } else {
        const userTeamId = authStore.user?.teamId;
        const userDept = authStore.user?.department;
        const managedDepts = authStore.user?.managedDepartments || [];
        leaderTeams.value = teams.filter(
          (t) =>
            t.leaderId === authStore.user?.id ||
            (userTeamId && t.id === userTeamId) ||
            (userDept && t.department === userDept) ||
            (t.department && managedDepts.includes(t.department)),
        );
      }
    }
  } catch (err) {}
}

async function fetchKrsDropdown() {
  try {
    const res = await fetch(`${API}/key-results/dropdown`, {
      headers: getHeaders(),
    });
    if (res.ok) {
      availableKrs.value = await res.json();
    }
  } catch (err) {}
}

function getTaskProgressPct(task) {
  if (!task || !task.targetValue || task.targetValue <= 0) return 0;
  const pct = (task.currentValue / task.targetValue) * 100;
  return Math.min(100, Math.round(pct * 10) / 10);
}

function getInitiativeProgressPct(init) {
  if (!init || !init.targetValue || init.targetValue <= 0) return 0;
  const val =
    init.achievedValue !== null && init.achievedValue !== undefined
      ? init.achievedValue
      : init.currentValue || 0;
  return Math.min(
    100,
    Math.max(0, Math.round((val / init.targetValue) * 100 * 10) / 10),
  );
}

async function openReviewModal(task) {
  selectedTask.value = task;
  showReviewModal.value = true;
  pendingUpdates.value = [];
  rejectingId.value = null;
  rejectNote.value = "";

  try {
    const res = await fetch(`${API}/initiatives/tasks/${task.id}/updates`, {
      headers: getHeaders(),
    });
    const allUpdates = await res.json();
    pendingUpdates.value = allUpdates.filter(
      (u) => u.status === "PENDING_APPROVAL",
    );
  } catch (err) {
    console.error(err);
  }
}

async function openAssignModal(task, initiative) {
  selectedTask.value = task;
  activeInitiative.value = initiative;
  selectedAssigneeIds.value = task.assignments
    ? task.assignments.map((a) => a.userId)
    : [];
  showAssignModal.value = true;

  try {
    const res = await fetch(`${API}/users/teams/${initiative.teamId}/members`, {
      headers: getHeaders(),
    });
    if (res.ok) {
      teamMembers.value = await res.json();
    }
  } catch (err) {
    teamMembers.value = [];
  }
}

async function saveTaskAssignment() {
  if (!selectedTask.value) return;
  try {
    const res = await fetch(
      `${API}/initiatives/tasks/${selectedTask.value.id}/assign`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ userIds: selectedAssigneeIds.value }),
      },
    );
    if (res.ok) {
      showAssignModal.value = false;
      await fetchInitiatives();
    } else {
      const err = await res.json();
      alert(err.message || "Gagal menyimpan assignment");
    }
  } catch (err) {
    alert(err.message);
  }
}

function openAddInitiativeModal() {
  initiativeForm.value = {
    title: "",
    keyResultId: availableKrs.value[0]?.id || "",
    teamId: leaderTeams.value[0]?.id || "",
    targetValue: 0,
    unit: "",
    weight: 1.0,
  };
  showAddInitiativeModal.value = true;
}

async function saveInitiative() {
  if (!initiativeForm.value.title.trim()) {
    alert("Judul Inisiatif wajib diisi");
    return;
  }
  if (!initiativeForm.value.keyResultId) {
    alert("Key Result wajib dipilih");
    return;
  }
  if (!initiativeForm.value.teamId) {
    alert("Tim wajib dipilih");
    return;
  }

  try {
    const res = await fetch(`${API}/initiatives`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(initiativeForm.value),
    });
    if (res.ok) {
      showAddInitiativeModal.value = false;
      await fetchInitiatives();
    } else {
      const err = await res.json();
      alert(err.message || "Gagal menyimpan inisiatif");
    }
  } catch (err) {
    alert(err.message);
  }
}

async function approveUpdate(updateId) {
  try {
    const res = await fetch(`${API}/task-updates/${updateId}/approve`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    if (res.ok) {
      pendingUpdates.value = pendingUpdates.value.filter(
        (u) => u.id !== updateId,
      );
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
    const res = await fetch(`${API}/task-updates/${updateId}/reject`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ reviewNote: rejectNote.value }),
    });
    if (res.ok) {
      pendingUpdates.value = pendingUpdates.value.filter(
        (u) => u.id !== updateId,
      );
      rejectingId.value = null;
      await fetchInitiatives();
    }
  } catch (e) {
    console.error(e);
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
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}
.section-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}
.initiative-block {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.initiative-header {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 16px;
}
.init-header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}
.init-header-top h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #0f172a;
}
.team-badge {
  font-size: 12px;
  color: #0ea5e9;
  font-weight: 500;
  background: #e0f2fe;
  padding: 4px 8px;
  border-radius: 6px;
  margin-right: 8px;
}
.kr-badge {
  font-size: 12px;
  color: #475569;
  font-weight: 500;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 6px;
}

.init-progress-badge {
  text-align: right;
}
.pct-val {
  font-size: 20px;
  font-weight: 700;
  color: #0ea5e9;
  display: block;
}
.pct-lbl {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
}

.init-progress-track {
  width: 100%;
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}
.init-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #10b981);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.empty-task {
  color: #94a3b8;
  font-size: 14px;
  font-style: italic;
}
.task-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  gap: 12px;
}
.task-info {
  flex: 2;
}
.task-name {
  font-weight: 600;
  color: #1e293b;
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
}
.task-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
  align-items: center;
}
.task-pct-tag {
  background: #e0f2fe;
  color: #0284c7;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.task-mini-track {
  width: 100%;
  height: 5px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}
.task-mini-bar {
  height: 100%;
  background: #0ea5e9;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.task-assignees {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.assignee-chip {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: #475569;
}
.task-actions {
  flex: 0 0 auto;
  display: flex;
  gap: 8px;
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
.primary-btn:hover {
  background: #0284c7;
}
.primary-btn.small {
  padding: 4px 12px;
  font-size: 13px;
}
.secondary-btn {
  background: white;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}
.secondary-btn.small {
  padding: 4px 12px;
  font-size: 13px;
}
.danger-btn {
  background: #fee2e2;
  color: #991b1b;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}
.danger-btn.small {
  padding: 4px 12px;
  font-size: 13px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
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
  max-width: 520px;
  max-height: 85vh;
  overflow-y: auto;
}
.update-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}
.update-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.update-note {
  font-style: italic;
  color: #475569;
  margin: 0 0 12px 0;
  font-size: 14px;
}
.update-actions {
  display: flex;
  gap: 8px;
}
.reject-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 4px;
  display: block;
}
.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}
.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.member-checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 16px;
}
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}

.flex-gap {
  display: flex;
  gap: 8px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
.alert {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.alert-error {
  background: #fee2e2;
  color: #991b1b;
}
.alert-info {
  background: #e0f2fe;
  color: #075985;
}
.mb-2 {
  margin-bottom: 8px;
}
.mb-3 {
  margin-bottom: 12px;
}
.mb-4 {
  margin-bottom: 16px;
}
.text-sm {
  font-size: 12px;
}
.text-gray {
  color: #64748b;
}
</style>

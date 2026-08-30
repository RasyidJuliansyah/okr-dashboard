<template>
  <div class="admin-root">
    <div class="admin-content">
      <!-- Header Section -->
      <div class="header-section card">
        <div class="header-left-title">
          <div class="title-with-badge">
            <h2>Progress Capaian Task Member</h2>
            <span class="view-badge">Target 100% Bulanan</span>
          </div>
          <p class="section-desc">
            Pantau dan evaluasi capaian target 100% setiap member, dihitung dari
            rata-rata progress card inisiatif yang dimiliki.
          </p>

          <!-- Scope Notice Badge -->
          <div class="scope-banner" :class="userRoleClass">
            <span class="scope-icon">{{ roleIcon }}</span>
            <span class="scope-text">
              <strong>Scope Visibilitas ({{ auth.user?.role }}):</strong>
              {{ scopeDescription }}
            </span>
          </div>
        </div>
      </div>

      <!-- Alert Messages -->
      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <!-- Filters & Controls Card -->
      <div class="filter-card card">
        <div class="filter-controls-row">
          <!-- Search Bar -->
          <div class="search-input-wrap">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="search-icon"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Cari nama member, posisi, atau tim..."
            />
          </div>

          <!-- Filter Departemen (Khusus Admin, C-Level, & Manager) -->
          <div v-if="isAdmin || isCLevel || isManager" class="filter-item">
            <label>Filter Departemen:</label>
            <select v-model="selectedDepartment" class="filter-select">
              <option value="">
                Semua Departemen ({{ availableDepartments.length }})
              </option>
              <option
                v-for="dept in availableDepartments"
                :key="dept"
                :value="dept"
              >
                {{ dept }}
              </option>
            </select>
          </div>

          <!-- Filter Sprint / Bulan -->
          <div class="filter-item">
            <label>Bulan / Sprint:</label>
            <select
              v-model="selectedSprintMonth"
              class="filter-select"
              @change="fetchMemberProgress"
            >
              <option value="">Semua Sprint (Kumulatif)</option>
              <option
                v-for="sprint in availableSprintMonths"
                :key="sprint"
                :value="sprint"
              >
                {{ formatSprintLabel(sprint) }}
              </option>
            </select>
          </div>

          <!-- Sorting -->
          <div class="filter-item">
            <label>Urutkan Capaian:</label>
            <select v-model="selectedSort" class="filter-select">
              <option value="highest">Capaian Tertinggi</option>
              <option value="lowest">Capaian Terendah</option>
              <option value="name_asc">Nama (A - Z)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Grid Cards Capaian Member -->
      <div class="cards-section">
        <div v-if="loading" class="loading-state card">
          <span class="loading-spinner">Memuat data capaian member...</span>
        </div>

        <div v-else-if="displayedMembers.length === 0" class="empty-state card">
          <div class="empty-icon">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M22 12h-6l-2 3h-4l-2-3H2" />
              <path
                d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
              />
            </svg>
          </div>
          <h4>Tidak Ada Data Member</h4>
          <p class="text-secondary">
            Tidak ditemukan member yang sesuai dengan filter atau scope
            visibilitas Anda.
          </p>
        </div>

        <div v-else class="member-grid">
          <div
            v-for="m in displayedMembers"
            :key="m.userId"
            class="member-card card"
          >
            <div class="member-card-header">
              <div class="member-profile">
                <div class="member-avatar-circle">
                  <span>{{ getInitials(m.userName) }}</span>
                </div>
                <div class="member-meta">
                  <h3 class="member-name">{{ m.userName }}</h3>
                  <div class="badges-row">
                    <span class="role-pill" :class="m.role?.toLowerCase()">{{
                      m.position || m.role
                    }}</span>
                    <!-- <span v-if="m.teamName" class="team-pill">{{
                      m.teamName
                    }}</span> -->
                    <!-- <span v-if="m.department" class="dept-pill">{{
                      m.department
                    }}</span> -->
                  </div>
                </div>
              </div>

              <div class="pct-badge-container">
                <div
                  class="pct-val"
                  :class="getAchColorClass(m.achievementPct)"
                >
                  {{ m.achievementPct }}%
                </div>
                <div class="pct-sub">/ 100% Target</div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="progress-bar-section">
              <div class="progress-track">
                <div
                  class="progress-fill"
                  :class="getAchColorClass(m.achievementPct)"
                  :style="{ width: m.achievementPct + '%' }"
                ></div>
              </div>
            </div>

            <!-- Tasks Summary & Expansion Footer -->
            <div class="member-card-footer">
              <div class="task-count-label">
                <strong>{{ m.totalAssignedTasks }}</strong> Card Inisiatif
                <span class="total-weight-tag" style="display: none">
                  Total Bobot: {{ m.totalWeight }}%
                </span>
              </div>
              <button class="detail-toggle-btn" @click="toggleExpand(m.userId)">
                {{
                  expandedUserIds.includes(m.userId)
                    ? "Sembunyikan Rincian"
                    : "Lihat Rincian Card"
                }}
              </button>
            </div>

            <!-- Expanded Initiative Card Details -->
            <div
              v-if="expandedUserIds.includes(m.userId)"
              class="expanded-tasks-list"
            >
              <h5 class="tasks-list-title">Daftar Card Inisiatif:</h5>
              <div v-if="m.initiatives?.length === 0" class="no-tasks">
                Belum ada card inisiatif yang dimiliki.
              </div>
              <div v-else class="task-items-wrapper">
                <div
                  v-for="ini in m.initiatives"
                  :key="ini.id"
                  class="task-detail-item"
                >
                  <div class="task-info">
                    <span class="task-title">{{ ini.title }}</span>
                    <span v-if="ini.sprintMonth" class="task-parent"
                      >sprint {{ formatSprintLabel(ini.sprintMonth) }}</span
                    >
                  </div>
                  <div class="task-progress-info">
                    <span
                      class="task-pct-tag"
                      :class="getAchColorClass(ini.progressPct)"
                      >{{ ini.progressPct }}%</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "~/stores/auth";

const auth = useAuthStore();
const API = useRuntimeConfig().public.apiBase || "http://localhost:3001/api";

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${auth.token}`,
  };
}

// Roles & Scope Computed
const isAdmin = computed(() => auth.user?.role === "ADMIN");
const isCLevel = computed(() => auth.user?.role === "C_LEVEL");
const isManager = computed(() => auth.user?.role === "MANAGER");
const isLeader = computed(() => auth.user?.role === "LEADER");
const isTeam = computed(() => auth.user?.role === "TEAM");

const userRoleClass = computed(() => {
  if (isTeam.value) return "team-banner";
  if (isLeader.value) return "leader-banner";
  if (isManager.value) return "manager-banner";
  return "admin-banner";
});

const roleIcon = computed(() => {
  if (isTeam.value) return "";
  if (isLeader.value) return "";
  if (isManager.value) return "";
  return "";
});

const scopeDescription = computed(() => {
  if (isTeam.value)
    return "Hanya menampilkan persentase capaian target 100% pribadi Anda (Privat).";
  if (isLeader.value)
    return "Menampilkan capaian 100% seluruh anggota tim yang Anda pimpin.";
  if (isManager.value)
    return "Menampilkan capaian 100% seluruh Leader dan Team di departemen Anda.";
  return "Menampilkan capaian 100% seluruh member di perusahaan (Company-wide).";
});

// States
const loading = ref(true);
const errorMessage = ref("");
const memberProgressList = ref<any[]>([]);
const searchQuery = ref("");
const selectedDepartment = ref("");
const selectedSort = ref("highest"); // 'highest', 'lowest', 'name_asc'
const expandedUserIds = ref<string[]>([]);
const selectedSprintMonth = ref("");
const availableSprintMonths = ref<string[]>([]);

function formatSprintLabel(sprint: string | null | undefined) {
  if (!sprint) return "";
  if (/^\d{4}-\d{2}$/.test(sprint)) {
    const [year, month] = sprint.split("-") as [string, string];
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("id-ID", {
      month: "short",
      year: "numeric",
    });
  }
  return sprint;
}

function toggleExpand(userId: string) {
  if (expandedUserIds.value.includes(userId)) {
    expandedUserIds.value = expandedUserIds.value.filter((id) => id !== userId);
  } else {
    expandedUserIds.value.push(userId);
  }
}

function getInitials(name: string) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function getAchColorClass(pct: number) {
  if (pct >= 80) return "ach-high";
  if (pct >= 50) return "ach-mid";
  return "ach-low";
}

const availableDepartments = computed(() => {
  const depts = new Set<string>();
  for (const m of memberProgressList.value) {
    if (m.department) depts.add(m.department);
  }
  return Array.from(depts).sort();
});

const displayedMembers = computed(() => {
  let list = [...memberProgressList.value];

  // Search query
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(
      (m: any) =>
        (m.userName && m.userName.toLowerCase().includes(q)) ||
        (m.position && m.position.toLowerCase().includes(q)) ||
        (m.teamName && m.teamName.toLowerCase().includes(q)) ||
        (m.role && m.role.toLowerCase().includes(q)),
    );
  }

  // Filter Departemen
  if (selectedDepartment.value) {
    list = list.filter((m: any) => m.department === selectedDepartment.value);
  }

  // Sorting
  if (selectedSort.value === "highest") {
    list.sort((a, b) => b.achievementPct - a.achievementPct);
  } else if (selectedSort.value === "lowest") {
    list.sort((a, b) => a.achievementPct - b.achievementPct);
  } else if (selectedSort.value === "name_asc") {
    list.sort((a, b) => (a.userName || "").localeCompare(b.userName || ""));
  }

  return list;
});

async function fetchMemberProgress() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const query = selectedSprintMonth.value
      ? `?sprintMonth=${encodeURIComponent(selectedSprintMonth.value)}`
      : "";
    const res = await fetch(`${API}/initiatives/member-progress${query}`, {
      headers: getHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      memberProgressList.value = data.members || [];
      availableSprintMonths.value = data.availableSprintMonths || [];
    } else {
      errorMessage.value = "Gagal memuat data capaian member";
    }
  } catch (err: any) {
    errorMessage.value = err.message || "Terjadi kesalahan server";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await fetchMemberProgress();
});
</script>

<style scoped>
.admin-root {
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 30px;
  overflow: hidden;
}

.admin-content {
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 14px;
}

.header-section {
  padding: 1.5rem;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-with-badge h2 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-primary, #0f172a);
}

.view-badge {
  background: rgba(14, 151, 214, 0.12);
  color: #0e97d6;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

.section-desc {
  margin: 6px 0 12px 0;
  font-size: 0.85rem;
  color: var(--text-secondary, #64748b);
}

.scope-banner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  margin-top: 4px;
}

.team-banner {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}
.leader-banner {
  background: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
}
.manager-banner {
  background: #faf5ff;
  color: #6b21a8;
  border: 1px solid #e9d5ff;
}
.admin-banner {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.filter-card {
  padding: 1rem 1.25rem;
}

.filter-controls-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-input-wrap {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 9px 12px 9px 36px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.85rem;
  outline: none;
}

.search-input:focus {
  border-color: #0e97d6;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.85rem;
  background: #ffffff;
  color: #0f172a;
  outline: none;
  cursor: pointer;
}

.filter-select:focus {
  border-color: #0e97d6;
}

/* Grid Cards (3 cards per row) */
.member-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 992px) {
  .member-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .member-grid {
    grid-template-columns: 1fr;
  }
}

.member-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  min-width: 0;
  overflow: hidden;
  transition:
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.member-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
}

.member-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.member-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.member-avatar-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0e97d6 0%, #0284c7 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1rem;
  flex-shrink: 0;
  box-shadow: 0 3px 8px rgba(14, 151, 214, 0.25);
}

.member-meta {
  flex: 1;
  min-width: 0;
}

.member-name {
  margin: 0 0 6px 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badges-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.role-pill {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  background: #e2e8f0;
  color: #334155;
  letter-spacing: 0.3px;
}
.role-pill.leader {
  background: #e0f2fe;
  color: #0284c7;
}
.role-pill.manager {
  background: #f3e8ff;
  color: #7e22ce;
}
.role-pill.team {
  background: #ecfdf5;
  color: #047857;
}

.team-pill,
.dept-pill {
  font-size: 0.72rem;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 6px;
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.pct-badge-container {
  text-align: right;
  flex-shrink: 0;
}

.pct-val {
  font-size: 1.5rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.5px;
}

.pct-sub {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary, #64748b);
  margin-top: 3px;
}

.progress-bar-section {
  width: 100%;
}

.progress-track {
  width: 100%;
  height: 8px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.ach-high {
  color: #10b981;
}
.ach-mid {
  color: #0e97d6;
}
.ach-low {
  color: #dc2626;
}

.member-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  padding-top: 10px;
  border-top: 1px dashed #e2e8f0;
}

.task-count-label {
  color: #475569;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.total-weight-tag {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
}

.total-weight-tag.weight-incomplete {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.detail-toggle-btn {
  background: rgba(14, 151, 214, 0.08);
  border: none;
  color: #0e97d6;
  font-weight: 700;
  font-size: 0.7rem;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 6px;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.detail-toggle-btn:hover {
  background: rgba(14, 151, 214, 0.16);
}

.expanded-tasks-list {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  margin-top: 4px;
}

.tasks-list-title {
  margin: 0 0 10px 0;
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
}

.no-tasks {
  font-size: 0.78rem;
  color: #94a3b8;
  font-style: italic;
}

.task-items-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: #0f172a;
}

.task-parent {
  font-size: 0.7rem;
  color: #64748b;
}

.task-progress-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.task-vals {
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
}

.task-pct-tag {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 5px;
}

.loading-state,
.empty-state {
  padding: 3rem;
  text-align: center;
}

.empty-icon {
  display: flex;
  justify-content: center;
  color: #94a3b8;
  margin-bottom: 8px;
}
.text-secondary {
  color: #64748b;
  font-size: 0.85rem;
}

.alert {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}
.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}
</style>

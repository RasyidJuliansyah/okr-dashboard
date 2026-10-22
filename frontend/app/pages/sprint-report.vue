<template>
  <div v-if="isAllowed" class="admin-root">
    <div class="admin-content">
      <!-- Header Section -->
      <div class="header-section card">
        <div class="header-left-title">
          <div class="title-with-badge">
            <h2>Laporan Capaian Sprint Bulanan</h2>
            <span class="view-badge">Siklus {{ selectedSprint?.name || "Sprint" }}</span>
          </div>
          <p class="section-desc">
            Evaluasi capaian per Key Result, Inisiatif, Task, dan KPI. Capaian sprint me-reset per siklus bulanan, sementara capaian KR tetap berjalan akumulatif.
          </p>

          <div v-if="reportData?.isLocked" class="locked-banner">
            <span class="lock-icon">🔒</span>
            <span>
              <strong>Sprint Terkunci & Diarsipkan:</strong> Capaian periode ini telah dibekukan. Data historis tidak berubah.
            </span>
          </div>
        </div>

        <div class="header-actions">
          <button
            class="export-btn"
            :disabled="loading || !reportData"
            @click="exportActiveTabToCsv"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Ekspor CSV (Tab Aktif)</span>
          </button>
        </div>
      </div>

      <!-- Filter Controls Card -->
      <div class="filter-card card">
        <div class="filter-controls-row">
          <!-- Sprint Selector -->
          <div class="filter-item">
            <label>Pilih Siklus Sprint:</label>
            <select
              v-model="selectedSprintId"
              class="filter-select"
              :disabled="loading"
              @change="fetchReport"
            >
              <option
                v-for="s in sprints"
                :key="s.id"
                :value="s.id"
              >
                {{ s.name }} ({{ formatDateShort(s.startDate) }} - {{ formatDateShort(s.endDate) }}) {{ s.status === "ACTIVE" ? "★ Aktif" : "" }}
              </option>
            </select>
          </div>

          <!-- Department Filter -->
          <div class="filter-item">
            <label>Filter Departemen:</label>
            <select
              v-model="selectedDepartment"
              class="filter-select"
              :disabled="loading"
              @change="fetchReport"
            >
              <option value="">Semua Departemen</option>
              <option
                v-for="dept in departmentsList"
                :key="dept.id"
                :value="dept.value"
              >
                {{ dept.name }}
              </option>
            </select>
          </div>

          <!-- Search Query -->
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
              placeholder="Cari item di tab aktif..."
            />
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state card">
        <div class="spinner"></div>
        <p>Memuat laporan capaian sprint...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <!-- Main Content -->
      <div v-else-if="reportData" class="report-container">
        <!-- Summary Metric Cards -->
        <div class="summary-cards-grid">
          <div class="stat-card">
            <div class="stat-title">Rata-rata Capaian Sprint</div>
            <div class="stat-value text-primary">
              {{ reportData.avgSprintAchievementPct }}%
            </div>
            <div class="stat-sub">Rata-rata capaian sprint KR periode ini</div>
          </div>

          <div class="stat-card">
            <div class="stat-title">Progres KR Berjalan</div>
            <div class="stat-value text-success">
              {{ reportData.avgCumulativeKrAchievementPct }}%
            </div>
            <div class="stat-sub">Akumulasi terhadap target tahunan</div>
          </div>

          <div class="stat-card">
            <div class="stat-title">Inisiatif Sprint Ini</div>
            <div class="stat-value">
              {{ reportData.completedInitiatives }} / {{ reportData.totalInitiatives }}
            </div>
            <div class="stat-sub">Selesai (DONE) dari total inisiatif</div>
          </div>

          <div class="stat-card">
            <div class="stat-title">Task Sprint Ini</div>
            <div class="stat-value">
              {{ reportData.completedTasks }} / {{ reportData.totalTasks }}
            </div>
            <div class="stat-sub">Selesai dari total penugasan task</div>
          </div>

          <div class="stat-card">
            <div class="stat-title">Master KPI Terdampak</div>
            <div class="stat-value text-indigo">
              {{ reportData.totalKpis }}
            </div>
            <div class="stat-sub">KPI terhubung ke task & inisiatif</div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="tabs-nav card">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'kr' }"
            @click="activeTab = 'kr'"
          >
            <span>Capaian per Key Result (KR)</span>
            <span class="tab-badge">{{ filteredKrs.length }}</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'initiative' }"
            @click="activeTab = 'initiative'"
          >
            <span>Capaian per Inisiatif</span>
            <span class="tab-badge">{{ filteredInitiatives.length }}</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'task' }"
            @click="activeTab = 'task'"
          >
            <span>Capaian per Task</span>
            <span class="tab-badge">{{ filteredTasks.length }}</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'kpi' }"
            @click="activeTab = 'kpi'"
          >
            <span>Capaian per Master KPI</span>
            <span class="tab-badge">{{ filteredKpis.length }}</span>
          </button>
        </div>

        <!-- TAB 1: PER KEY RESULT -->
        <div v-if="activeTab === 'kr'" class="table-card card">
          <div class="table-header">
            <h3>Breakdown Capaian per Key Result</h3>
            <span class="table-hint">
              Target sprint me-reset per siklus, sedangkan Capaian KR Berjalan merefleksikan kemajuan tahunan kumulatif.
            </span>
          </div>

          <div class="table-responsive">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Key Result & Objective</th>
                  <th>Perspektif</th>
                  <th>Departemen</th>
                  <th class="text-right">Target Sprint</th>
                  <th class="text-right">Realisasi Sprint</th>
                  <th style="min-width: 140px;">Capaian Sprint</th>
                  <th class="text-right">Target Tahunan</th>
                  <th class="text-right">Kumulatif KR</th>
                  <th style="min-width: 150px;">Capaian KR Berjalan</th>
                  <th class="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredKrs.length === 0">
                  <td colspan="10" class="empty-cell">
                    Tidak ada data Key Result pada sprint dan filter yang dipilih.
                  </td>
                </tr>
                <tr v-for="kr in filteredKrs" :key="kr.keyResultId">
                  <td>
                    <div class="item-title">{{ kr.title }}</div>
                    <div class="item-sub">Objektif: {{ kr.objectiveTitle }}</div>
                  </td>
                  <td>
                    <span class="perspective-pill">{{ formatPerspective(kr.bscPerspective) }}</span>
                  </td>
                  <td>
                    <span class="dept-text">{{ kr.department }}</span>
                  </td>
                  <td class="text-right">
                    <strong>{{ kr.sprintTarget }}</strong> {{ kr.unit }}
                  </td>
                  <td class="text-right">
                    <strong>{{ kr.sprintCurrent }}</strong> {{ kr.unit }}
                  </td>
                  <td>
                    <div class="progress-wrap">
                      <div class="progress-bar-bg">
                        <div
                          class="progress-bar-fill sprint-bar"
                          :style="{ width: `${Math.min(100, kr.sprintAchievementPct)}%` }"
                        ></div>
                      </div>
                      <span class="progress-text">{{ kr.sprintAchievementPct }}%</span>
                    </div>
                  </td>
                  <td class="text-right">
                    {{ kr.annualTarget }} {{ kr.unit }}
                  </td>
                  <td class="text-right text-success font-semibold">
                    {{ kr.cumulativeCurrent }} {{ kr.unit }}
                  </td>
                  <td>
                    <div class="progress-wrap">
                      <div class="progress-bar-bg">
                        <div
                          class="progress-bar-fill cumulative-bar"
                          :style="{ width: `${Math.min(100, kr.cumulativeAchievementPct)}%` }"
                        ></div>
                      </div>
                      <span class="progress-text font-bold">{{ kr.cumulativeAchievementPct }}%</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <span class="status-badge" :class="getStatusBadgeClass(kr.status)">
                      {{ kr.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TAB 2: PER INISIATIF -->
        <div v-if="activeTab === 'initiative'" class="table-card card">
          <div class="table-header">
            <h3>Breakdown Capaian per Inisiatif</h3>
            <span class="table-hint">
              Target dan capaian inisiatif dievaluasi dalam batasan sprint ini.
            </span>
          </div>

          <div class="table-responsive">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Judul Inisiatif</th>
                  <th>Key Result Induk</th>
                  <th>PIC / Leader</th>
                  <th>Tim / Dept</th>
                  <th class="text-center">Kanban</th>
                  <th class="text-right">Target</th>
                  <th class="text-right">Realisasi</th>
                  <th style="min-width: 140px;">Capaian Sprint</th>
                  <th class="text-center">Task Selesai</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredInitiatives.length === 0">
                  <td colspan="9" class="empty-cell">
                    Tidak ada inisiatif pada sprint dan filter yang dipilih.
                  </td>
                </tr>
                <tr v-for="ini in filteredInitiatives" :key="ini.id">
                  <td>
                    <div class="item-title">{{ ini.title }}</div>
                  </td>
                  <td>
                    <div class="item-sub" style="max-width: 260px;">{{ ini.keyResultTitle }}</div>
                  </td>
                  <td>{{ ini.ownerName }}</td>
                  <td>
                    <span class="dept-text">{{ ini.department }}</span>
                  </td>
                  <td class="text-center">
                    <span class="kanban-badge" :class="ini.kanbanStatus?.toLowerCase()">
                      {{ ini.kanbanStatus }}
                    </span>
                  </td>
                  <td class="text-right">{{ ini.targetValue }}</td>
                  <td class="text-right">
                    {{ ini.achievedValue !== null && ini.achievedValue !== undefined ? ini.achievedValue : ini.currentValue }}
                  </td>
                  <td>
                    <div class="progress-wrap">
                      <div class="progress-bar-bg">
                        <div
                          class="progress-bar-fill sprint-bar"
                          :style="{ width: `${Math.min(100, ini.sprintAchievementPct)}%` }"
                        ></div>
                      </div>
                      <span class="progress-text">{{ ini.sprintAchievementPct }}%</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <span class="task-count-badge">
                      {{ ini.completedTaskCount }} / {{ ini.taskCount }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TAB 3: PER TASK -->
        <div v-if="activeTab === 'task'" class="table-card card">
          <div class="table-header">
            <h3>Breakdown Capaian per Task</h3>
            <span class="table-hint">
              Target dan capaian task member dalam siklus sprint aktif.
            </span>
          </div>

          <div class="table-responsive">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Judul Task</th>
                  <th>Inisiatif Induk</th>
                  <th>Assignee (Member)</th>
                  <th>Departemen</th>
                  <th class="text-right">Baseline</th>
                  <th class="text-right">Target</th>
                  <th class="text-right">Realisasi</th>
                  <th style="min-width: 140px;">Capaian Sprint</th>
                  <th class="text-center">Kanban</th>
                  <th class="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredTasks.length === 0">
                  <td colspan="10" class="empty-cell">
                    Tidak ada task pada sprint dan filter yang dipilih.
                  </td>
                </tr>
                <tr v-for="t in filteredTasks" :key="t.id">
                  <td>
                    <div class="item-title">
                      {{ t.title }}
                      <span v-if="t.isCrossDept" class="cross-badge">Cross-Dept</span>
                    </div>
                  </td>
                  <td>
                    <div class="item-sub" style="max-width: 240px;">{{ t.initiativeTitle }}</div>
                  </td>
                  <td>
                    <strong>{{ t.assigneeName }}</strong>
                  </td>
                  <td>
                    <span class="dept-text">{{ t.department }}</span>
                  </td>
                  <td class="text-right text-muted">{{ t.baselineValue }}</td>
                  <td class="text-right">{{ t.targetValue }} {{ t.unit }}</td>
                  <td class="text-right font-semibold">{{ t.currentValue }} {{ t.unit }}</td>
                  <td>
                    <div class="progress-wrap">
                      <div class="progress-bar-bg">
                        <div
                          class="progress-bar-fill sprint-bar"
                          :style="{ width: `${Math.min(100, t.sprintAchievementPct)}%` }"
                        ></div>
                      </div>
                      <span class="progress-text">{{ t.sprintAchievementPct }}%</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <span class="kanban-badge" :class="t.kanbanStatus?.toLowerCase()">
                      {{ t.kanbanStatus }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="status-badge" :class="getStatusBadgeClass(t.status)">
                      {{ t.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TAB 4: PER MASTER KPI -->
        <div v-if="activeTab === 'kpi'" class="table-card card">
          <div class="table-header">
            <h3>Breakdown Capaian per Master KPI</h3>
            <span class="table-hint">
              Target dan realisasi KPI yang terkumpul dari Task dan Inisiatif di sprint ini.
            </span>
          </div>

          <div class="table-responsive">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Nama Master KPI</th>
                  <th>Departemen</th>
                  <th>Perspektif BSC</th>
                  <th>Satuan</th>
                  <th class="text-right">Target Sprint</th>
                  <th class="text-right">Realisasi Sprint</th>
                  <th style="min-width: 140px;">Capaian KPI Sprint</th>
                  <th class="text-center">Task Terkait</th>
                  <th class="text-center">Inisiatif Terkait</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredKpis.length === 0">
                  <td colspan="9" class="empty-cell">
                    Tidak ada KPI terhubung pada sprint dan filter yang dipilih.
                  </td>
                </tr>
                <tr v-for="k in filteredKpis" :key="k.kpiId">
                  <td>
                    <div class="item-title">{{ k.name }}</div>
                  </td>
                  <td>
                    <span class="dept-text">{{ k.department || "-" }}</span>
                  </td>
                  <td>
                    <span class="perspective-pill">{{ formatPerspective(k.bscPerspective) }}</span>
                  </td>
                  <td>{{ k.unit }}</td>
                  <td class="text-right font-semibold">{{ k.sprintTarget }}</td>
                  <td class="text-right text-success font-semibold">{{ k.sprintCurrent }}</td>
                  <td>
                    <div class="progress-wrap">
                      <div class="progress-bar-bg">
                        <div
                          class="progress-bar-fill sprint-bar"
                          :style="{ width: `${Math.min(100, k.sprintAchievementPct)}%` }"
                        ></div>
                      </div>
                      <span class="progress-text font-bold">{{ k.sprintAchievementPct }}%</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <span class="task-count-badge">{{ k.linkedTasksCount }}</span>
                  </td>
                  <td class="text-center">
                    <span class="task-count-badge">{{ k.linkedInitiativesCount }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "~/stores/auth";

const route = useRoute();
const auth = useAuthStore();
const config = useRuntimeConfig();
const API = config.public.apiBase || "http://localhost:3001/api";

const isAdmin = computed(
  () => auth.user?.role === "ADMIN" || auth.user?.originalRole === "ADMIN",
);
const isCLevel = computed(
  () => auth.user?.role === "C_LEVEL" || auth.user?.originalRole === "C_LEVEL",
);
const isManager = computed(
  () => auth.user?.role === "MANAGER" || auth.user?.originalRole === "MANAGER",
);
const isLeader = computed(
  () => auth.user?.role === "LEADER" || auth.user?.originalRole === "LEADER",
);
const isAllowed = computed(
  () => isAdmin.value || isCLevel.value || isManager.value || isLeader.value,
);

const loading = ref(true);
const errorMessage = ref("");
const sprints = ref<any[]>([]);
const selectedSprintId = ref<string>("");
const selectedDepartment = ref<string>("");
const searchQuery = ref<string>("");
const activeTab = ref<"kr" | "initiative" | "task" | "kpi">("kr");
const reportData = ref<any>(null);

interface DepartmentItem {
  id: string;
  name: string;
  value: string;
  isActive?: boolean;
}

const departmentsList = ref<DepartmentItem[]>([]);

async function fetchDepartments() {
  try {
    const url = (isAdmin.value || isCLevel.value) ? `${API}/departments?all=true` : `${API}/departments`;
    const res = await $fetch<any[]>(url, {
      headers: getHeaders(),
    });
    departmentsList.value = (res || []).filter((d: any) => d.isActive !== false);
  } catch (err: any) {
    console.error("Failed to fetch departments:", err);
  }
}

const selectedSprint = computed(() => {
  return sprints.value.find((s) => s.id === selectedSprintId.value);
});

function getHeaders() {
  const token =
    auth.token ||
    (typeof localStorage !== "undefined"
      ? localStorage.getItem("auth_token") || localStorage.getItem("token")
      : "");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function formatDateShort(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function formatPerspective(p: string) {
  if (!p) return "-";
  const map: Record<string, string> = {
    FINANCIAL: "Financial",
    CUSTOMER: "Customer",
    INTERNAL_PROCESS: "Internal Process",
    LEARNING_GROWTH: "Learning & Growth",
  };
  return map[p] || p;
}

function getStatusBadgeClass(status: string) {
  if (!status) return "";
  const s = status.toUpperCase().replace("-", "_");
  if (s === "ON_TRACK") return "on-track";
  if (s === "AT_RISK") return "at-risk";
  if (s === "OFF_TRACK") return "off-track";
  return "";
}

// Filtered items
const filteredKrs = computed(() => {
  if (!reportData.value?.krs) return [];
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return reportData.value.krs;
  return reportData.value.krs.filter(
    (kr: any) =>
      kr.title?.toLowerCase().includes(q) ||
      kr.objectiveTitle?.toLowerCase().includes(q) ||
      kr.department?.toLowerCase().includes(q)
  );
});

const filteredInitiatives = computed(() => {
  if (!reportData.value?.initiatives) return [];
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return reportData.value.initiatives;
  return reportData.value.initiatives.filter(
    (ini: any) =>
      ini.title?.toLowerCase().includes(q) ||
      ini.keyResultTitle?.toLowerCase().includes(q) ||
      ini.ownerName?.toLowerCase().includes(q) ||
      ini.department?.toLowerCase().includes(q)
  );
});

const filteredTasks = computed(() => {
  if (!reportData.value?.tasks) return [];
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return reportData.value.tasks;
  return reportData.value.tasks.filter(
    (t: any) =>
      t.title?.toLowerCase().includes(q) ||
      t.initiativeTitle?.toLowerCase().includes(q) ||
      t.assigneeName?.toLowerCase().includes(q) ||
      t.department?.toLowerCase().includes(q)
  );
});

const filteredKpis = computed(() => {
  if (!reportData.value?.kpis) return [];
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return reportData.value.kpis;
  return reportData.value.kpis.filter(
    (k: any) =>
      k.name?.toLowerCase().includes(q) ||
      k.department?.toLowerCase().includes(q) ||
      k.bscPerspective?.toLowerCase().includes(q)
  );
});

async function fetchSprintsList() {
  try {
    const res = await $fetch<any>(`${API}/sprints`, {
      headers: getHeaders(),
    });
    sprints.value = res.sprints || [];

    // Query param priority
    const qSprintId = route.query.sprintId as string;
    if (qSprintId && sprints.value.some((s) => s.id === qSprintId)) {
      selectedSprintId.value = qSprintId;
    } else {
      const active = sprints.value.find((s) => s.status === "ACTIVE");
      if (active) {
        selectedSprintId.value = active.id;
      } else if (sprints.value.length > 0) {
        selectedSprintId.value = sprints.value[0].id;
      }
    }
  } catch (err: any) {
    console.error("Failed to fetch sprints:", err);
  }
}

async function fetchReport() {
  if (!selectedSprintId.value) return;
  loading.value = true;
  errorMessage.value = "";
  try {
    const queryParams = new URLSearchParams();
    if (selectedDepartment.value) {
      queryParams.set("department", selectedDepartment.value);
    }
    const url = `${API}/sprints/${selectedSprintId.value}/report?${queryParams.toString()}`;
    const data = await $fetch<any>(url, {
      headers: getHeaders(),
    });
    reportData.value = data;
  } catch (err: any) {
    errorMessage.value =
      err?.data?.error || err.message || "Gagal memuat data laporan sprint";
  } finally {
    loading.value = false;
  }
}

function exportActiveTabToCsv() {
  if (!reportData.value) return;
  const sprintName = selectedSprint.value?.name?.replace(/\s+/g, "_") || "Sprint";
  let filename = `Report_${sprintName}_${activeTab.value.toUpperCase()}.csv`;
  let csvContent = "";

  if (activeTab.value === "kr") {
    csvContent = "KR Title,Objective,Perspective,Department,Target Sprint,Realisasi Sprint,Capaian Sprint (%),Target Tahunan,Kumulatif KR,Capaian KR Berjalan (%),Status\n";
    filteredKrs.value.forEach((kr: any) => {
      csvContent += `"${(kr.title || "").replace(/"/g, '""')}","${(kr.objectiveTitle || "").replace(/"/g, '""')}","${kr.bscPerspective}","${kr.department}",${kr.sprintTarget},${kr.sprintCurrent},${kr.sprintAchievementPct}%,${kr.annualTarget},${kr.cumulativeCurrent},${kr.cumulativeAchievementPct}%,"${kr.status}"\n`;
    });
  } else if (activeTab.value === "initiative") {
    csvContent = "Initiative Title,KR Title,Owner,Department,Kanban Status,Target,Realisasi,Capaian Sprint (%),Completed Tasks,Total Tasks\n";
    filteredInitiatives.value.forEach((ini: any) => {
      const val = ini.achievedValue !== null && ini.achievedValue !== undefined ? ini.achievedValue : ini.currentValue;
      csvContent += `"${(ini.title || "").replace(/"/g, '""')}","${(ini.keyResultTitle || "").replace(/"/g, '""')}","${ini.ownerName}","${ini.department}","${ini.kanbanStatus}",${ini.targetValue},${val},${ini.sprintAchievementPct}%,${ini.completedTaskCount},${ini.taskCount}\n`;
    });
  } else if (activeTab.value === "task") {
    csvContent = "Task Title,Initiative,Assignee,Department,Baseline,Target,Realisasi,Capaian Sprint (%),Kanban,Status,Cross Dept\n";
    filteredTasks.value.forEach((t: any) => {
      csvContent += `"${(t.title || "").replace(/"/g, '""')}","${(t.initiativeTitle || "").replace(/"/g, '""')}","${t.assigneeName}","${t.department}",${t.baselineValue},${t.targetValue},${t.currentValue},${t.sprintAchievementPct}%,"${t.kanbanStatus}","${t.status}",${t.isCrossDept}\n`;
    });
  } else if (activeTab.value === "kpi") {
    csvContent = "KPI Name,Department,Perspective,Unit,Target Sprint,Realisasi Sprint,Capaian Sprint (%),Linked Tasks,Linked Initiatives\n";
    filteredKpis.value.forEach((k: any) => {
      csvContent += `"${(k.name || "").replace(/"/g, '""')}","${k.department || "-"}","${k.bscPerspective}","${k.unit}",${k.sprintTarget},${k.sprintCurrent},${k.sprintAchievementPct}%,${k.linkedTasksCount},${k.linkedInitiativesCount}\n`;
    });
  }

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

onMounted(async () => {
  if (!auth.isAuthenticated) {
    return navigateTo("/login");
  }
  if (!isAllowed.value) {
    return navigateTo("/dashboard");
  }
  await Promise.all([fetchSprintsList(), fetchDepartments()]);
  if (selectedSprintId.value) {
    await fetchReport();
  }
});
</script>

<style scoped>
.admin-root {
  min-height: 100vh;
  background-color: var(--bg-page, #f8fafc);
  padding: 1.5rem;
}
.admin-content {
  max-width: 1380px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-section {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
}
.header-left-title {
  flex: 1;
}
.title-with-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}
.title-with-badge h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main, #0f172a);
  margin: 0;
}
.view-badge {
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
}
.section-desc {
  font-size: 0.875rem;
  color: var(--text-muted, #64748b);
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
}
.locked-banner {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
}

.header-actions {
  display: flex;
  align-items: center;
}
.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.export-btn:hover:not(:disabled) {
  background: #0369a1;
}
.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Filter controls */
.filter-card {
  padding: 1.25rem;
}
.filter-controls-row {
  display: flex;
  gap: 1.25rem;
  align-items: flex-end;
  flex-wrap: wrap;
}
.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 240px;
}
.filter-item label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  color: var(--text-main, #0f172a);
  font-size: 0.875rem;
}
.search-input-wrap {
  position: relative;
  flex: 1;
  min-width: 220px;
}
.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}
.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  color: var(--text-main, #0f172a);
  font-size: 0.875rem;
}

/* Summary Grid */
.summary-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
}
.stat-card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.stat-title {
  font-size: 0.775rem;
  font-weight: 600;
  color: var(--text-muted, #64748b);
  margin-bottom: 0.35rem;
}
.stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-main, #0f172a);
  margin-bottom: 0.25rem;
}
.stat-sub {
  font-size: 0.75rem;
  color: #94a3b8;
}
.text-primary {
  color: #0284c7;
}
.text-success {
  color: #16a34a;
}
.text-indigo {
  color: #4f46e5;
}

/* Tabs */
.tabs-nav {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  overflow-x: auto;
}
.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.1rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-muted, #64748b);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.tab-btn:hover {
  background: rgba(0, 0, 0, 0.04);
  color: var(--text-main, #0f172a);
}
.tab-btn.active {
  background: #0284c7;
  color: #ffffff;
}
.tab-badge {
  background: rgba(0, 0, 0, 0.08);
  font-size: 0.725rem;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
}
.tab-btn.active .tab-badge {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

/* Tables */
.table-card {
  padding: 1.25rem;
}
.table-header {
  margin-bottom: 1rem;
}
.table-header h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-main, #0f172a);
  margin: 0 0 0.25rem 0;
}
.table-hint {
  font-size: 0.8rem;
  color: var(--text-muted, #64748b);
}
.table-responsive {
  overflow-x: auto;
}
.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.825rem;
  text-align: left;
}
.report-table th {
  background: var(--bg-page, #f8fafc);
  padding: 0.75rem 0.85rem;
  font-weight: 600;
  color: var(--text-muted, #475569);
  border-bottom: 2px solid var(--border-color, #e2e8f0);
  white-space: nowrap;
}
.report-table td {
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  color: var(--text-main, #1e293b);
  vertical-align: middle;
}
.report-table tr:hover td {
  background: rgba(2, 132, 199, 0.02);
}

.item-title {
  font-weight: 600;
  color: var(--text-main, #0f172a);
  line-height: 1.35;
}
.item-sub {
  font-size: 0.75rem;
  color: var(--text-muted, #64748b);
  margin-top: 0.2rem;
}
.dept-text {
  font-weight: 500;
  color: #475569;
}
.perspective-pill {
  font-size: 0.725rem;
  font-weight: 600;
  background: #f1f5f9;
  color: #475569;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  white-space: nowrap;
}

/* Progress bars */
.progress-wrap {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.progress-bar-bg {
  flex: 1;
  height: 7px;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
  min-width: 65px;
}
.progress-bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s ease;
}
.sprint-bar {
  background: #0284c7;
}
.cumulative-bar {
  background: #16a34a;
}
.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 38px;
  text-align: right;
}

/* Badges */
.status-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.25rem 0.55rem;
  border-radius: 9999px;
  text-transform: uppercase;
  white-space: nowrap;
}
.status-badge.on-track {
  background: #dcfce7;
  color: #15803d;
}
.status-badge.at-risk {
  background: #fef9c3;
  color: #a16207;
}
.status-badge.off-track {
  background: #fee2e2;
  color: #b91c1c;
}

.kanban-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  text-transform: uppercase;
}
.kanban-badge.todo {
  background: #f1f5f9;
  color: #64748b;
}
.kanban-badge.in_progress,
.kanban-badge.in-progress {
  background: #e0f2fe;
  color: #0369a1;
}
.kanban-badge.done {
  background: #dcfce7;
  color: #166534;
}
.kanban-badge.drop {
  background: #fee2e2;
  color: #991b1b;
}

.cross-badge {
  font-size: 0.65rem;
  font-weight: 600;
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  margin-left: 0.35rem;
}
.task-count-badge {
  font-size: 0.75rem;
  font-weight: 600;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  color: #334155;
}

.empty-cell {
  text-align: center;
  padding: 2.5rem;
  color: #94a3b8;
  font-style: italic;
}
.loading-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #0284c7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 0.75rem auto;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.alert {
  padding: 0.85rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
}
.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.text-right {
  text-align: right;
}
.text-center {
  text-align: center;
}
.font-semibold {
  font-weight: 600;
}
.font-bold {
  font-weight: 700;
}
.text-muted {
  color: #94a3b8;
}
</style>

<template>
  <div class="dashboard-root">
    <div class="dashboard-container">
      <!-- Controls & Filter Row -->
      <section class="controls-card card">
        <div class="controls-content">
          <h2>Ringkasan Progres OKR</h2>

          <!-- Scope Selector (Visible to Admin, C-Level, Manager) -->
          <div v-if="showScopeSelector" class="scope-selector">
            <span class="scope-label">Lingkup (Scope):</span>
            <div class="scope-buttons">
              <button
                @click="changeScope('self')"
                :class="{ active: currentScope === 'self' }"
                class="scope-btn"
              >
                Pribadi (Self)
              </button>
              <button
                v-if="auth.user?.role !== 'EMPLOYEE'"
                @click="changeScope('team')"
                :class="{ active: currentScope === 'team' }"
                class="scope-btn"
              >
                Tim (Team)
              </button>
              <button
                v-if="
                  auth.user?.role === 'C_LEVEL' || auth.user?.role === 'ADMIN'
                "
                @click="changeScope('company')"
                :class="{ active: currentScope === 'company' }"
                class="scope-btn"
              >
                Perusahaan (Company)
              </button>
            </div>
          </div>

          <!-- Comparison Date Range Picker -->
          <div class="comparison-row">
            <span class="comparison-label">Bandingkan dengan periode:</span>
            <div class="date-range-inputs">
              <input type="date" v-model="compareFrom" :max="compareTo || today" />
              <span class="date-sep">–</span>
              <input type="date" v-model="compareTo" :min="compareFrom" :max="today" />
            </div>
            <!-- Shortcut buttons -->
            <div class="shortcut-btns">
              <button @click="setShortcut(7)" class="shortcut-btn">7 Hari Lalu</button>
              <button @click="setShortcut(14)" class="shortcut-btn">14 Hari Lalu</button>
              <button @click="setShortcut(30)" class="shortcut-btn">30 Hari Lalu</button>
              <button @click="clearComparison" class="clear-btn" v-if="compareFrom || compareTo">Reset</button>
            </div>
            <button class="compare-btn" @click="fetchDashboardData" :disabled="!compareFrom || !compareTo">
              Bandingkan
            </button>
          </div>
        </div>
      </section>

      <!-- KPI Summary Cards -->
      <section class="kpi-grid">
        <!-- Average Progress -->
        <div class="kpi-card card">
          <span class="kpi-label">Rata-Rata Progres</span>
          <div class="kpi-value-row">
            <span class="kpi-value"
              >{{ summaryData.metrics?.averageProgress || 0 }}%</span
            >
            <span
              v-if="summaryData.previousMetrics"
              class="delta-badge"
              :class="getDeltaClass(progressDelta)"
            >
              {{ formatDelta(progressDelta) }}
            </span>
            <div class="progress-ring-placeholder">
              <div
                class="progress-ring-fill"
                :style="{
                  width: (summaryData.metrics?.averageProgress || 0) + '%',
                }"
              ></div>
            </div>
          </div>
          <p v-if="compareFrom && !summaryData.previousMetrics" class="kpi-no-data">
            Tidak ada data pada periode ini
          </p>
          <p v-else-if="summaryData.previousMetrics" class="kpi-desc">
            vs. {{ summaryData.previousMetrics.rangeLabel }}: {{ summaryData.previousMetrics.averageProgress }}%
          </p>
          <p v-else class="kpi-desc">
            Agregat progres seluruh Key Results dalam scope terpilih.
          </p>
        </div>

        <!-- OKR Status Counts -->
        <div class="kpi-card card">
          <span class="kpi-label">Status Key Results</span>
          <div class="status-summary-row">
            <div class="status-count-item">
              <div class="status-val-row">
                <span class="count-val ontrack">{{
                  summaryData.metrics?.onTrackCount || 0
                }}</span>
                <span
                  v-if="summaryData.previousMetrics"
                  class="delta-badge small"
                  :class="getDeltaClass(onTrackDelta)"
                >
                  {{ formatSimpleDelta(onTrackDelta) }}
                </span>
              </div>
              <span class="count-lbl">On Track</span>
            </div>
            <div class="status-count-item">
              <div class="status-val-row">
                <span class="count-val atrisk">{{
                  summaryData.metrics?.atRiskCount || 0
                }}</span>
                <span
                  v-if="summaryData.previousMetrics"
                  class="delta-badge small"
                  :class="getDeltaClass(atRiskDelta, true)"
                >
                  {{ formatSimpleDelta(atRiskDelta) }}
                </span>
              </div>
              <span class="count-lbl">At Risk</span>
            </div>
            <div class="status-count-item">
              <div class="status-val-row">
                <span class="count-val offtrack">{{
                  summaryData.metrics?.offTrackCount || 0
                }}</span>
                <span
                  v-if="summaryData.previousMetrics"
                  class="delta-badge small"
                  :class="getDeltaClass(offTrackDelta, true)"
                >
                  {{ formatSimpleDelta(offTrackDelta) }}
                </span>
              </div>
              <span class="count-lbl">Off Track</span>
            </div>
          </div>
          <p v-if="compareFrom && !summaryData.previousMetrics" class="kpi-no-data">
            Tidak ada data pada periode ini
          </p>
          <p v-else-if="summaryData.previousMetrics" class="kpi-desc">
            vs. {{ summaryData.previousMetrics.rangeLabel }}
          </p>
          <p v-else class="kpi-desc">
            Status otomatis berdasarkan capaian vs target harian.
          </p>
        </div>
      </section>

      <!-- Objectives & Key Results List -->
      <section class="objectives-section">
        <div class="section-title-row">
          <h2>Daftar Target (Objectives)</h2>
          <span class="count-badge"
            >{{ summaryData.objectives?.length || 0 }} Objectives</span
          >
        </div>

        <div v-if="loading" class="skeleton-grid">
          <div class="skeleton-card card" v-for="i in 2" :key="i">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line desc"></div>
            <div class="skeleton-line progress"></div>
            <div class="skeleton-krs">
              <div class="skeleton-kr-item" v-for="j in 2" :key="j">
                <div class="skeleton-line title-sm"></div>
                <div class="skeleton-line bar"></div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else-if="
            !summaryData.objectives || summaryData.objectives.length === 0
          "
          class="empty-state"
        >
          Belum ada OKR yang terdaftar pada lingkup ini.
        </div>

        <div v-else class="objectives-grid">
          <!-- Objective Card -->
          <div
            v-for="(obj, index) in summaryData.objectives"
            :key="obj.id"
            class="objective-card card"
            draggable="true"
            @dragstart="onDragStart(index, $event)"
            @dragover.prevent
            @dragenter.prevent
            @drop="onDrop(index, $event)"
            @dragend="onDragEnd"
            :class="{ 'is-dragging': draggedIndex === index }"
            style="cursor: grab;"
          >
            <div class="obj-card-header">
              <div>
                <span class="obj-quarter">{{ obj.quarter }}</span>
                <h3>{{ obj.title }}</h3>
                <p v-if="obj.description" class="obj-desc">
                  {{ obj.description }}
                </p>
              </div>
              <div class="obj-progress-badge">
                <span>{{ Math.round(obj.progress || 0) }}%</span>
                <span class="progress-lbl">Progres</span>
              </div>
            </div>

            <!-- Objective Progress Bar -->
            <div class="obj-progress-track">
              <div
                class="obj-progress-bar"
                :style="{ width: (obj.progress || 0) + '%' }"
              ></div>
            </div>

            <!-- Key Results nested list -->
            <div class="krs-section">
              <h4>Key Results (Indikator Capaian):</h4>
              <div class="krs-list">
                <div v-for="kr in obj.keyResults" :key="kr.id" class="kr-item">
                  <div class="kr-header-row">
                    <span class="kr-title">{{ kr.title }}</span>
                    <span
                      class="perspective-badge"
                      :class="kr.bscPerspective.toLowerCase()"
                    >
                      {{ formatPerspective(kr.bscPerspective) }}
                    </span>
                  </div>

                  <!-- KR Progress Bar -->
                  <div class="kr-progress-container">
                    <div class="kr-progress-track">
                      <div
                        class="kr-progress-bar"
                        :class="kr.status.toLowerCase().replace('_', '')"
                        :style="{ width: kr.progress + '%' }"
                      ></div>
                    </div>
                    <span class="kr-progress-val"
                      >{{ Math.round(kr.progress) }}%</span
                    >
                  </div>

                  <!-- Details -->
                  <div class="kr-details-row">
                    <span class="kr-values">
                      Nilai: <strong>{{ kr.currentValue }}</strong> /
                      {{ kr.targetValue }} {{ kr.unit }}
                    </span>
                    <!-- <span
                      class="kr-source-tooltip"
                      :title="
                        'Input Manual — Diperbarui pada: ' +
                        formatDate(kr.updatedAt)
                      "
                    >
                      ℹ️ Input Manual
                    </span> -->
                    <span
                      class="status-badge"
                      :class="kr.status.toLowerCase().replace('_', '')"
                    >
                      {{ kr.status.replace("_", " ") }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const config = useRuntimeConfig();

const summaryData = ref({});
const currentScope = ref("self");
const loading = ref(false);

const compareFrom = ref("");
const compareTo = ref("");
const today = new Date().toISOString().split("T")[0];

function setShortcut(days) {
  const from = new Date();
  from.setDate(from.getDate() - days);
  compareFrom.value = from.toISOString().split("T")[0];
  compareTo.value = today;
  fetchDashboardData();
}

function clearComparison() {
  compareFrom.value = "";
  compareTo.value = "";
  fetchDashboardData();
}

const progressDelta = computed(() => {
  if (!summaryData.value.previousMetrics) return null;
  return Math.round((
    (summaryData.value.metrics?.averageProgress ?? 0) -
    summaryData.value.previousMetrics.averageProgress
  ) * 10) / 10;
});

const onTrackDelta = computed(() => {
  if (!summaryData.value.previousMetrics) return null;
  return (summaryData.value.metrics?.onTrackCount ?? 0) - summaryData.value.previousMetrics.onTrackCount;
});

const atRiskDelta = computed(() => {
  if (!summaryData.value.previousMetrics) return null;
  return (summaryData.value.metrics?.atRiskCount ?? 0) - summaryData.value.previousMetrics.atRiskCount;
});

const offTrackDelta = computed(() => {
  if (!summaryData.value.previousMetrics) return null;
  return (summaryData.value.metrics?.offTrackCount ?? 0) - summaryData.value.previousMetrics.offTrackCount;
});

function formatDelta(delta) {
  if (delta === null || delta === undefined) return "";
  if (delta > 0) return `▲ +${delta}%`;
  if (delta < 0) return `▼ ${delta}%`;
  return "─ 0%";
}

function formatSimpleDelta(delta) {
  if (delta === null || delta === undefined) return "";
  if (delta > 0) return `▲ +${delta}`;
  if (delta < 0) return `▼ ${delta}`;
  return "─ 0";
}

function getDeltaClass(delta, invert = false) {
  if (delta === null || delta === undefined) return "delta-neutral";
  if (delta > 0) return invert ? "delta-down" : "delta-up";
  if (delta < 0) return invert ? "delta-up" : "delta-down";
  return "delta-neutral";
}

const orderLocalStorageKey = "okr-dashboard-objectives-order";
const draggedIndex = ref(null);

function applyCustomOrder() {
  if (!summaryData.value || !summaryData.value.objectives) return;
  const savedOrderStr = localStorage.getItem(orderLocalStorageKey);
  if (!savedOrderStr) return;
  
  try {
    const savedOrder = JSON.parse(savedOrderStr);
    summaryData.value.objectives.sort((a, b) => {
      const idxA = savedOrder.indexOf(a.id);
      const idxB = savedOrder.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  } catch (e) {
    console.error("Failed to parse custom objectives order", e);
  }
}

function onDragStart(index, event) {
  draggedIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
}

function onDrop(targetIndex, event) {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) return;
  
  const objectives = [...summaryData.value.objectives];
  const draggedObj = objectives.splice(draggedIndex.value, 1)[0];
  objectives.splice(targetIndex, 0, draggedObj);
  
  summaryData.value.objectives = objectives;
  
  const idsOrder = objectives.map(o => o.id);
  localStorage.setItem(orderLocalStorageKey, JSON.stringify(idsOrder));
  
  draggedIndex.value = null;
}

function onDragEnd() {
  draggedIndex.value = null;
}

const showScopeSelector = computed(() => {
  return auth.user?.role && auth.user.role !== "EMPLOYEE";
});

function formatPerspective(p) {
  if (!p) return "";
  return p
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function changeScope(scope) {
  currentScope.value = scope;
  await fetchDashboardData();
}

async function fetchDashboardData() {
  loading.value = true;
  try {
    let url = `${config.public.apiBase}/dashboard/summary?scope=${currentScope.value}`;
    if (compareFrom.value && compareTo.value) {
      url += `&compareFrom=${compareFrom.value}&compareTo=${compareTo.value}`;
    }
    const response = await $fetch(url, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
    summaryData.value = response;
    applyCustomOrder();
  } catch (err) {
    console.error("Error fetching dashboard summary:", err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  // Default scope for C_LEVEL / ADMIN is company, for MANAGER is team, for EMPLOYEE is self
  if (auth.user?.role === "ADMIN" || auth.user?.role === "C_LEVEL") {
    currentScope.value = "company";
  } else if (auth.user?.role === "MANAGER") {
    currentScope.value = "team";
  } else {
    currentScope.value = "self";
  }
  fetchDashboardData();
});
</script>

<style scoped>
@import url("https://fonts.google.com/share?selection.family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900|Rubik:ital,wght@0,300..900;1,300..900");

.dashboard-root {
  font-family: "Inter", sans-serif;
  min-height: 100vh;
  background: var(--content-bg);
  color: var(--text-color);
  padding: 0 0 60px 0;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: var(--header-bg);
  border-bottom: 1px solid var(--header-border);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-link {
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 17px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  transition: color 0.3s;
}

.back-link:hover {
  color: #00d2ff;
}

.header-title {
  font-family: "Rubik", sans-serif;
  font-weight: 600;
  font-size: 27px;
  line-height: 32px;
  color: #2d3643;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-brand h1 {
  font-size: 25px;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, #00d2ff 0%, #0066ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-btn {
  background: var(--nav-btn-bg);
  border: 1px solid var(--nav-btn-border);
  color: var(--nav-btn-text);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s;
}

.header-btn:hover {
  background: rgba(0, 102, 255, 0.15);
  border-color: rgba(0, 102, 255, 0.3);
}

.header-btn.secondary {
  background: rgba(0, 210, 255, 0.1);
  border-color: rgba(0, 210, 255, 0.2);
  color: #8ce9ff;
}

.header-btn.secondary:hover {
  background: rgba(0, 210, 255, 0.2);
}

.header-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-badge {
  font-size: 13px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.user-badge.admin {
  background: rgba(255, 75, 75, 0.15);
  color: #ff8888;
  border: 1px solid rgba(255, 75, 75, 0.3);
}

.user-badge.manager {
  background: rgba(255, 170, 0, 0.15);
  color: #ffcc66;
  border: 1px solid rgba(255, 170, 0, 0.3);
}

.user-badge.clevel {
  background: rgba(138, 43, 226, 0.15);
  color: #d8b4fe;
  border: 1px solid rgba(138, 43, 226, 0.3);
}

.user-badge.employee {
  background: rgba(0, 210, 255, 0.15);
  color: #8ce9ff;
  border: 1px solid rgba(0, 210, 255, 0.3);
}

.user-name {
  font-size: 17px;
  font-weight: 500;
  color: var(--text-color);
}

/* Layout Container */
.dashboard-container {
  max-width: 1200px;
  margin: auto 0 auto;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(16px);
  box-shadow: var(--card-shadow);
}

/* Controls */
.controls-card {
  padding: 20px 24px;
}

.controls-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.controls-content h2 {
  font-size: 21px;
  font-weight: 600;
  margin: 0;
}

.scope-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scope-label {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
}

.scope-buttons {
  display: flex;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 4px;
}

.scope-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  padding: 6px 14px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.scope-btn:hover {
  color: white;
}

.scope-btn.active {
  background: rgba(255, 255, 255, 0.08);
  color: #0e97d6;
}

/* KPI Summary Cards Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 768px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kpi-label {
  font-size: 15px;
  text-transform: uppercase;
  color: #0f1623;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.kpi-value-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.kpi-value {
  font-size: 39px;
  font-weight: 700;
  color: #0e97d6;
}

.progress-ring-placeholder {
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  flex-grow: 1;
  max-width: 200px;
  position: relative;
  overflow: hidden;
}

.progress-ring-fill {
  height: 100%;
  background: #0e97d6;
  border-radius: 4px;
}

.status-summary-row {
  display: flex;
  gap: 24px;
}

.status-count-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.count-val {
  font-size: 27px;
  font-weight: 700;
}

.count-val.ontrack {
  color: var(--color-green);
}
.count-val.atrisk {
  color: var(--color-yellow);
}
.count-val.offtrack {
  color: var(--color-red);
}

.count-lbl {
  font-size: 14px;
  color: #8897ae;
  margin-top: 2px;
}

.kpi-desc {
  font-size: 15px;
  color: #0f1623;
  margin: 0;
}

/* Objectives Section */
.objectives-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title-row h2 {
  font-size: 21px;
  font-weight: 600;
  margin: 0;
}

.count-badge {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
}

.objectives-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.objective-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-left: 4px solid #0066ff;
  transition: all 0.3s;
}

.objective-card:hover {
  transform: translateY(-2px);
  border-color: #00d2ff;
}

.objective-card.is-dragging {
  opacity: 0.4;
  border: 2px dashed #0066ff !important;
  background: var(--card-bg-hover, rgba(0, 102, 255, 0.05));
  transform: scale(0.98);
}

.obj-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.obj-quarter {
  background: var(--color-primary-tint);
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 6px;
}

.obj-card-header h3 {
  font-size: 21px;
  font-weight: 600;
  margin: 0;
}

.obj-desc {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  margin: 4px 0 0 0;
}

.obj-progress-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  background: rgba(255, 255, 255, 0.03);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.obj-progress-badge span {
  font-size: 21px;
  font-weight: 700;
  color: #0e97d6;
}

.progress-lbl {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

/* Objective Progress Track */
.obj-progress-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  overflow: hidden;
}

.obj-progress-bar {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: 3px;
}

/* Key Results List inside Objective */
.krs-section {
  border-top: 1px solid #3d4a5c;
  padding-top: 16px;
}

.krs-section h4 {
  font-size: 15px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  margin: 0 0 12px 0;
  font-weight: 600;
}

.krs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kr-item {
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kr-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.kr-title {
  font-size: 17px;
  font-weight: 500;
}

/* KR Progress Bar Row */
.kr-progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kr-progress-track {
  height: 6px;
  background: #f0f3f9;
  border-radius: 3px #f0f3f9;
  flex-grow: 1;
  overflow: hidden;
}

.kr-progress-bar {
  height: 100%;
  border-radius: 2px;
}

.kr-progress-bar.ontrack {
  background: #49d507;
}
.kr-progress-bar.atrisk {
  background: #f2af17;
}
.kr-progress-bar.offtrack {
  background: #f97066;
}

.kr-progress-val {
  font-size: 15px;
  font-weight: 600;
  min-width: 32px;
  text-align: right;
}

/* Detail Info */
.kr-details-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  color: #5e718d;
}

.kr-values {
  color: #5e718d;
}

.kr-values strong {
  color: #3d4a5c;
}

/* Badges */
.perspective-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  flex-shrink: 0;
}

.perspective-badge.financial {
  background: var(--color-purple-badge);
  color: var(--color-primary);
  border: 1px solid rgba(0, 210, 255, 0.25);
}

.perspective-badge.customer {
  background: var(--color-yellow-badge);
  color: var(--color-yellow);
  border: 1px solid rgba(255, 170, 0, 0.25);
}

.perspective-badge.internal_process {
  background: var(--color-purple-badge);
  color: var(--color-purple);
  border: 1px solid rgba(138, 43, 226, 0.25);
}

.perspective-badge.learning_growth {
  background: var(--color-green-badge);
  color: var(--color-green);
  border: 1px solid rgba(75, 255, 75, 0.25);
}

.status-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 8px;
  text-transform: uppercase;
}

.status-badge.ontrack {
  background: var(--color-green-badge);
  color: var(--color-green);
}

.status-badge.atrisk {
  background: var(--color-yellow-badge);
  color: var(--color-yellow);
  color: #ffcc66;
}

.status-badge.offtrack {
  background: var(--color-red-badge);
  color: var(--color-red);
}

/* Loading/Empty State */
.loading-state,
.empty-state {
  text-align: center;
  padding: 60px;
  color: #5e718d;
  font-size: 17px;
  background: #ffff;
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

/* Mobile responsive fixes */
@media (max-width: 480px) {
  .header {
    padding: 16px 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .controls-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .scope-selector {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }

  .scope-buttons {
    width: 100%;
  }

  .scope-btn {
    flex-grow: 1;
    text-align: center;
  }
}

.kr-source-tooltip {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  cursor: help;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.02);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  transition: all 0.3s;
}

.kr-source-tooltip:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.8);
}

/* Skeleton Loader Styles */
.skeleton-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-left: 4px solid rgba(255, 255, 255, 0.05);
}

.skeleton-line {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.03) 75%
  );
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-line.title {
  height: 24px;
  width: 60%;
}

.skeleton-line.desc {
  height: 14px;
  width: 40%;
}

.skeleton-line.progress {
  height: 8px;
  width: 100%;
}

.skeleton-krs {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  padding-top: 14px;
}

.skeleton-kr-item {
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line.title-sm {
  height: 14px;
  width: 50%;
}

.skeleton-line.bar {
  height: 6px;
  width: 90%;
}

@keyframes loading-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.comparison-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f3f9;
  width: 100%;
}

.comparison-label {
  font-size: 14px;
  font-weight: 500;
  color: #5e718d;
}

.date-range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-range-inputs input[type="date"] {
  padding: 8px 12px;
  border: 1px solid #e4e4e4;
  border-radius: 8px;
  font-size: 14px;
  font-family: "Rubik", sans-serif;
  color: #2d3643;
  cursor: pointer;
  background-color: #ffffff;
}

.date-sep {
  color: #8897ae;
}

.shortcut-btns {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.shortcut-btn {
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #e4e4e4;
  background: #f8fafc;
  color: #5e718d;
  font-size: 13px;
  font-family: "Rubik", sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease-out;
}

.shortcut-btn:hover {
  background: #0e97d6;
  color: #ffffff;
  border-color: #0e97d6;
}

.clear-btn {
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #eb3123;
  background: #fff1f2;
  color: #eb3123;
  font-size: 13px;
  font-family: "Rubik", sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease-out;
}

.clear-btn:hover {
  background: #eb3123;
  color: #ffffff;
}

.compare-btn {
  padding: 8px 20px;
  background: #0e97d6;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-family: "Rubik", sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease-out;
}

.compare-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.compare-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.delta-badge {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  margin-left: 10px;
}

.delta-badge.small {
  font-size: 11px;
  padding: 2px 6px;
  margin-left: 4px;
}

.delta-up {
  color: #009c29;
  background: #e3fdea;
}

.delta-down {
  color: #eb3123;
  background: #ffeaed;
}

.delta-neutral {
  color: #5e718d;
  background: #f0f3f9;
}

.kpi-no-data {
  font-size: 13px;
  color: #8897ae;
  font-style: italic;
  margin: 4px 0 0;
}

.status-val-row {
  display: flex;
  align-items: center;
}
</style>

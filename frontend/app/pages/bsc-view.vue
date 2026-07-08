<template>
  <div class="bsc-root">
    <div class="bsc-container">
      <!-- Intro Card -->
      <section class="intro-card card">
        <h2>Peta Perspektif Perusahaan</h2>
        <p class="section-desc">
          Pengelompokan indikator keberhasilan (Key Results) ke dalam 4
          perspektif utama Balanced Scorecard guna memastikan keseimbangan arah
          strategis.
        </p>
      </section>

      <!-- 4-Quadrant View Grid -->
      <section class="quadrant-grid">
        <!-- FINANCIAL -->
        <div
          @click="selectQuadrant('FINANCIAL')"
          :class="{ active: selectedQuadrantKey === 'FINANCIAL' }"
          class="quadrant-card financial-theme card"
        >
          <div class="q-header">
            <h3>Financial</h3>
          </div>
          <div class="q-body">
            <div class="q-stat">
              <span class="q-label">Rata-Rata Progres</span>
              <span class="q-val"
                >{{
                  bscOverview.FINANCIAL?.metrics?.averageProgress || 0
                }}%</span
              >
            </div>
            <div class="q-stat">
              <span class="q-label">Total Key Results</span>
              <span class="q-val">{{
                bscOverview.FINANCIAL?.metrics?.totalCount || 0
              }}</span>
            </div>
          </div>
          <div class="q-footer">
            <span>Klik untuk detail data</span>
            <span class="arrow-indicator">→</span>
          </div>
        </div>

        <!-- CUSTOMER -->
        <div
          @click="selectQuadrant('CUSTOMER')"
          :class="{ active: selectedQuadrantKey === 'CUSTOMER' }"
          class="quadrant-card customer-theme card"
        >
          <div class="q-header">
            <h3>Customer</h3>
          </div>
          <div class="q-body">
            <div class="q-stat">
              <span class="q-label">Rata-Rata Progres</span>
              <span class="q-val"
                >{{
                  bscOverview.CUSTOMER?.metrics?.averageProgress || 0
                }}%</span
              >
            </div>
            <div class="q-stat">
              <span class="q-label">Total Key Results</span>
              <span class="q-val">{{
                bscOverview.CUSTOMER?.metrics?.totalCount || 0
              }}</span>
            </div>
          </div>
          <div class="q-footer">
            <span>Klik untuk detail data</span>
            <span class="arrow-indicator">→</span>
          </div>
        </div>

        <!-- INTERNAL PROCESS -->
        <div
          @click="selectQuadrant('INTERNAL_PROCESS')"
          :class="{ active: selectedQuadrantKey === 'INTERNAL_PROCESS' }"
          class="quadrant-card internal-theme card"
        >
          <div class="q-header">
            <h3>Internal Process</h3>
          </div>
          <div class="q-body">
            <div class="q-stat">
              <span class="q-label">Rata-Rata Progres</span>
              <span class="q-val"
                >{{
                  bscOverview.INTERNAL_PROCESS?.metrics?.averageProgress || 0
                }}%</span
              >
            </div>
            <div class="q-stat">
              <span class="q-label">Total Key Results</span>
              <span class="q-val">{{
                bscOverview.INTERNAL_PROCESS?.metrics?.totalCount || 0
              }}</span>
            </div>
          </div>
          <div class="q-footer">
            <span>Klik untuk detail data</span>
            <span class="arrow-indicator">→</span>
          </div>
        </div>

        <!-- LEARNING & GROWTH -->
        <div
          @click="selectQuadrant('LEARNING_GROWTH')"
          :class="{ active: selectedQuadrantKey === 'LEARNING_GROWTH' }"
          class="quadrant-card learning-theme card"
        >
          <div class="q-header">
            <h3>Learning & Growth</h3>
          </div>
          <div class="q-body">
            <div class="q-stat">
              <span class="q-label">Rata-Rata Progres</span>
              <span class="q-val"
                >{{
                  bscOverview.LEARNING_GROWTH?.metrics?.averageProgress || 0
                }}%</span
              >
            </div>
            <div class="q-stat">
              <span class="q-label">Total Key Results</span>
              <span class="q-val">{{
                bscOverview.LEARNING_GROWTH?.metrics?.totalCount || 0
              }}</span>
            </div>
          </div>
          <div class="q-footer">
            <span>Klik untuk detail data</span>
            <span class="arrow-indicator">→</span>
          </div>
        </div>
      </section>

      <!-- Drill-down Details Section -->
      <section v-if="selectedQuadrantKey" class="drilldown-section card">
        <div class="drilldown-header">
          <div class="dd-title-row">
            <span class="dd-icon">{{
              getPerspectiveIcon(selectedQuadrantKey)
            }}</span>
            <h2>
              Detail Perspektif: {{ formatPerspective(selectedQuadrantKey) }}
            </h2>
          </div>
          <div class="dd-metrics-summary">
            <span class="status-count-pill ontrack">
              On Track:
              <strong>{{
                bscOverview[selectedQuadrantKey]?.metrics?.onTrackCount || 0
              }}</strong>
            </span>
            <span class="status-count-pill atrisk">
              At Risk:
              <strong>{{
                bscOverview[selectedQuadrantKey]?.metrics?.atRiskCount || 0
              }}</strong>
            </span>
            <span class="status-count-pill offtrack">
              Off Track:
              <strong>{{
                bscOverview[selectedQuadrantKey]?.metrics?.offTrackCount || 0
              }}</strong>
            </span>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          Memuat data perspektif...
        </div>

        <div
          v-else-if="!selectedKrs || selectedKrs.length === 0"
          class="empty-state"
        >
          Belum ada Key Result yang didefinisikan dalam perspektif ini.
        </div>

        <div v-else class="krs-drilldown-list">
          <div v-for="kr in selectedKrs" :key="kr.id" class="kr-drilldown-item">
            <div class="kr-dd-top">
              <div class="kr-dd-info">
                <span class="kr-parent-obj"
                  >Objective: {{ kr.objective?.title }} ({{
                    kr.objective?.quarter
                  }})</span
                >
                <h3>{{ kr.title }}</h3>
              </div>
              <span
                class="status-badge"
                :class="kr.status.toLowerCase().replace('_', '')"
              >
                {{ kr.status.replace("_", " ") }}
              </span>
            </div>

            <!-- Progress row -->
            <div class="kr-dd-progress">
              <div class="kr-progress-track">
                <div
                  class="kr-progress-bar"
                  :class="kr.status.toLowerCase().replace('_', '')"
                  :style="{ width: kr.progress + '%' }"
                ></div>
              </div>
              <span class="kr-progress-percent"
                >{{ Math.round(kr.progress) }}%</span
              >
            </div>

            <div class="kr-dd-footer">
              <span
                >Satuan: <strong>{{ kr.unit }}</strong></span
              >
              <span
                >Capaian: <strong>{{ kr.currentValue }}</strong> / Target:
                <strong>{{ kr.targetValue }}</strong></span
              >
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

const bscOverview = ref({});
const selectedQuadrantKey = ref("FINANCIAL");
const loading = ref(false);

const selectedKrs = computed(() => {
  if (
    !selectedQuadrantKey.value ||
    !bscOverview.value[selectedQuadrantKey.value]
  ) {
    return [];
  }
  return bscOverview.value[selectedQuadrantKey.value].krs || [];
});

function formatPerspective(p) {
  if (!p) return "";
  return p
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function getPerspectiveIcon(p) {
  if (p === "FINANCIAL") return;
  if (p === "CUSTOMER") return;
  if (p === "INTERNAL_PROCESS") return;
  if (p === "LEARNING_GROWTH") return;
  return "📊";
}

function selectQuadrant(key) {
  selectedQuadrantKey.value = key;
}

async function fetchBscData() {
  loading.value = true;
  try {
    const response = await $fetch(`${config.public.apiBase}/bsc/overview`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
    bscOverview.value = response;
  } catch (err) {
    console.error("Error fetching BSC overview:", err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchBscData();
});
</script>

<style scoped>
@import url("https://fonts.google.com/share?selection.family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900|Rubik:ital,wght@0,300..900;1,300..900");

.bsc-root {
  font-family: "Inter", sans-serif;
  min-height: 100vh;
  background: var(--content-bg);
  padding: 0 0 60px 0;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: #ffff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
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
  color: rgba(255, 255, 255, 0.8);
}

/* Layout Container */
.bsc-container {
  max-width: 1200px;
  margin: auto 0 auto;
  padding: 20px 20px;
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
}

/* Intro */
.intro-card h2 {
  font-size: 23px;
  margin: 0 0 6px 0;
  font-weight: 600;
  color: var(--color-gamma-150);
}

.section-desc {
  font-size: 17px;
  color: #5e718d;
  margin: 0;
  line-height: 1.5;
}

/* 4-Quadrant Grid */
.quadrant-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .quadrant-grid {
    grid-template-columns: 1fr;
  }
}

.quadrant-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.quadrant-card:hover {
  transform: translateY(-4px);
}

/* Themes colors for left vertical indicator */
.quadrant-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
}

.financial-theme::before {
  background: var(--color-primary);
}
.customer-theme::before {
  background: var(--color-secondary);
}
.internal-theme::before {
  background: var(--color-purple);
}
.learning-theme::before {
  background: var(--color-green);
}

.q-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.q-icon {
  font-size: 27px;
}

.q-header h3 {
  font-size: 21px;
  font-weight: 600;
  margin: 0;
  color: var(--color-gamma-150);
}

.q-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 16px;
}

.q-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.q-label {
  font-size: 14px;
  text-transform: uppercase;
  color: #5e718d;
  font-weight: 500;
}

.q-val {
  font-size: 23px;
  font-weight: 700;
  color: #5e718d;
}

/* Theme value highlights */
.financial-theme .q-val {
  color: var(--color-primary);
}
.customer-theme .q-val {
  color: var(--color-secondary);
}
.internal-theme .q-val {
  color: var(--color-purple);
}
.learning-theme .q-val {
  color: var(--color-green);
}

.q-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  color: #5e718d;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  padding-top: 12px;
  margin-top: auto;
}

.arrow-indicator {
  transition: transform 0.3s;
}

.quadrant-card:hover .arrow-indicator {
  transform: translateX(4px);
  color: #5e718d;
}

/* Drilldown Section */
.drilldown-section {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.drilldown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 20px;
}

.dd-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dd-icon {
  font-size: 27px;
}

.dd-title-row h2 {
  font-size: 21px;
  font-weight: 600;
  margin: 0;
  color: var(--color-gamma-150);
}

.dd-metrics-summary {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.status-count-pill {
  font-size: 16px;
  padding: 4px 10px;
  border-radius: 12px;
  background: var(--color-black-badge);
  color: var(--color-white);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.status-count-pill.ontrack strong {
  color: var(--color-green);
}
.status-count-pill.atrisk strong {
  color: var(--color-yellow);
}
.status-count-pill.offtrack strong {
  color: var(--color-util-alert-tint);
}

.krs-drilldown-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kr-drilldown-item {
  background: #ffffff;
  border: 1px solid #d7dfe9;
  border-radius: 12px;
  padding: 16px 20px;
}

.kr-dd-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}

.kr-parent-obj {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.kr-dd-info h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #5e718d;
}

/* Progress bar */
.kr-dd-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  color: #5e718d;
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

.kr-progress-percent {
  font-size: 16px;
  font-weight: 600;
}

.kr-dd-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  color: #5e718d;
  border-top: 1px dashed rgba(255, 255, 255, 0.04);
  padding-top: 10px;
}

.kr-dd-footer strong {
  color: #5e718d;
}

/* Badges */
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

/* States */
.loading-state,
.empty-state {
  text-align: center;
  padding: 40px;
  color: #5e718d;
  font-size: 17px;
}
</style>

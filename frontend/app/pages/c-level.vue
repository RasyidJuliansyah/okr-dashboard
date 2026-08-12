<template>
  <div class="clevel-root">
    <!-- Header -->
    <section class="clevel-header">
      <div class="header-left">
        <p class="header-eyebrow">Executive Dashboard</p>
        <h1 class="header-title">Balanced Scorecard Overview</h1>
        <p class="header-subtitle">
          Monitoring kesehatan strategis perusahaan secara menyeluruh berdasarkan 4 perspektif BSC.
        </p>
      </div>
      <div class="header-actions">
        <button class="export-btn" @click="exportCsv">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Memuat data executive dashboard...</p>
    </div>

    <template v-else-if="data">
      <!-- Row 1: Health Score + Summary Cards -->
      <section class="summary-row">
        <!-- Health Score Gauge -->
        <div class="health-card card">
          <p class="card-label">Company Health Score</p>
          <div class="gauge-container">
            <svg viewBox="0 0 120 80" class="gauge-svg">
              <!-- Track arc -->
              <path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke="#eef2f8" stroke-width="12" stroke-linecap="round"/>
              <!-- Fill arc -->
              <path
                d="M 10 70 A 50 50 0 0 1 110 70"
                fill="none"
                :stroke="healthColor"
                stroke-width="12"
                stroke-linecap="round"
                :stroke-dasharray="`${gaugeLength * (data.overallHealthScore / 100)} ${gaugeLength}`"
              />
              <!-- Center text -->
              <text x="60" y="62" text-anchor="middle" class="gauge-number" :fill="healthColor">
                {{ data.overallHealthScore }}%
              </text>
            </svg>
          </div>
          <p class="health-label" :class="healthClass">{{ healthLabel }}</p>
        </div>

        <!-- Total KRs -->
        <div class="summary-card card">
          <p class="card-label">Total Key Results</p>
          <p class="summary-big-num">{{ data.totalKRs }}</p>
          <p class="summary-sub">Seluruh perspektif BSC</p>
        </div>

        <!-- On Track -->
        <div class="summary-card card status-card ontrack">
          <p class="card-label">On Track</p>
          <p class="summary-big-num green">{{ data.totalOnTrack }}</p>
          <p class="summary-sub">
            {{ data.totalKRs > 0 ? Math.round((data.totalOnTrack / data.totalKRs) * 100) : 0 }}% dari total KR
          </p>
        </div>

        <!-- At Risk -->
        <div class="summary-card card status-card atrisk">
          <p class="card-label">At Risk</p>
          <p class="summary-big-num yellow">{{ data.totalAtRisk }}</p>
          <p class="summary-sub">
            {{ data.totalKRs > 0 ? Math.round((data.totalAtRisk / data.totalKRs) * 100) : 0 }}% dari total KR
          </p>
        </div>

        <!-- Off Track -->
        <div class="summary-card card status-card offtrack">
          <p class="card-label">Off Track</p>
          <p class="summary-big-num red">{{ data.totalOffTrack }}</p>
          <p class="summary-sub">
            {{ data.totalKRs > 0 ? Math.round((data.totalOffTrack / data.totalKRs) * 100) : 0 }}% dari total KR
          </p>
        </div>
      </section>

      <!-- Row 2: BSC Scorecard Strips -->
      <section class="bsc-scorecard card">
        <div class="scorecard-header">
          <h2>BSC Scorecard — 4 Perspektif</h2>
          <p class="section-sub">Progress agregat per perspektif Balanced Scorecard</p>
        </div>
        <div class="scorecard-list">
          <div
            v-for="(pdata, pkey) in data.bscByPerspective"
            :key="pkey"
            class="scorecard-row"
            :class="perspectiveClass(pkey)"
          >
            <div class="scorecard-left">
              <span class="perspective-icon">{{ perspectiveIcon(pkey) }}</span>
              <div>
                <p class="perspective-name">{{ perspectiveLabel(pkey) }}</p>
                <p class="perspective-sub">{{ pdata.totalCount }} Key Results</p>
              </div>
            </div>
            <div class="scorecard-bar-area">
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :class="perspectiveClass(pkey)"
                  :style="{ width: pdata.averageProgress + '%' }"
                ></div>
              </div>
              <span class="bar-pct">{{ pdata.averageProgress }}%</span>
            </div>
            <div class="scorecard-pills">
              <span class="pill ontrack">{{ pdata.onTrackCount }} On Track</span>
              <span class="pill atrisk">{{ pdata.atRiskCount }} At Risk</span>
              <span class="pill offtrack">{{ pdata.offTrackCount }} Off Track</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Row 3: Trend Chart + Department Progress -->
      <div class="two-col-row">
        <!-- Trend Chart (pure CSS sparklines per perspective) -->
        <section class="trend-card card">
          <h2>Tren Progres — 8 Minggu Terakhir</h2>
          <p class="section-sub">Perkembangan rata-rata progress tiap perspektif BSC per minggu</p>
          <div class="trend-chart">
            <!-- Y axis labels -->
            <div class="y-axis">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
            <div class="chart-area">
              <!-- Horizontal grid lines -->
              <div class="grid-lines">
                <div class="grid-line" v-for="n in 5" :key="n"></div>
              </div>
              <!-- SVG line per perspective -->
              <svg
                :viewBox="`0 0 ${(data.trendLabels.length - 1) * 60 + 20} 120`"
                class="trend-svg"
                preserveAspectRatio="none"
              >
                <g v-for="(pkey, pi) in Object.keys(data.trendData)" :key="pkey">
                  <polyline
                    :points="trendPoints(data.trendData[pkey])"
                    fill="none"
                    :stroke="perspectiveStroke(pkey)"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    :stroke-dasharray="hasTrendData(data.trendData[pkey]) ? 'none' : '4 4'"
                    opacity="0.85"
                  />
                  <!-- Dots -->
                  <g v-for="(val, wi) in data.trendData[pkey]" :key="wi">
                    <circle
                      v-if="val !== null"
                      :cx="wi * 60 + 10"
                      :cy="120 - (val / 100) * 110"
                      r="3.5"
                      :fill="perspectiveStroke(pkey)"
                    />
                  </g>
                </g>
              </svg>
            </div>
          </div>
          <!-- X axis labels -->
          <div class="x-axis">
            <span v-for="label in data.trendLabels" :key="label">{{ label }}</span>
          </div>
          <!-- Legend -->
          <div class="trend-legend">
            <div v-for="pkey in Object.keys(data.trendData)" :key="pkey" class="legend-item">
              <span class="legend-dot" :style="{ background: perspectiveStroke(pkey) }"></span>
              <span>{{ perspectiveLabel(pkey) }}</span>
            </div>
          </div>
        </section>

        <!-- Department Progress -->
        <section class="dept-card card">
          <h2>Progress per Departemen</h2>
          <p class="section-sub">Rata-rata progres KR berdasarkan departemen yang terlibat</p>
          <div v-if="data.byDepartment.length === 0" class="empty-state">
            Belum ada data departemen yang terdaftar pada KR.
          </div>
          <div class="dept-list" v-else>
            <div v-for="dept in data.byDepartment" :key="dept.department" class="dept-row">
              <div class="dept-info">
                <span class="dept-name">{{ dept.department }}</span>
                <span class="dept-kr-count">{{ dept.krCount }} KR</span>
              </div>
              <div class="dept-bar-row">
                <div class="dept-bar-track">
                  <div
                    class="dept-bar-fill"
                    :class="progressClass(dept.averageProgress)"
                    :style="{ width: dept.averageProgress + '%' }"
                  ></div>
                </div>
                <span class="dept-pct" :class="progressClass(dept.averageProgress)">
                  {{ dept.averageProgress }}%
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Row 4: Critical KRs Table -->
      <section class="critical-card card" v-if="data.criticalKrs.length > 0">
        <div class="critical-header">
          <div>
            <h2>🚨 Key Results Kritis</h2>
            <p class="section-sub">KR dengan status At Risk atau Off Track yang memerlukan perhatian segera</p>
          </div>
          <span class="critical-count-badge">{{ data.criticalKrs.length }} KR</span>
        </div>
        <div class="critical-table-wrap">
          <table class="critical-table">
            <thead>
              <tr>
                <th>Key Result</th>
                <th>Perspektif</th>
                <th>Objective</th>
                <th>PIC (Responsible)</th>
                <th>Progres</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="kr in data.criticalKrs" :key="kr.id" class="critical-row" :class="kr.status.toLowerCase().replace('_', '')">
                <td class="kr-title-cell">
                  <span class="kr-title-text">{{ kr.title }}</span>
                  <span class="kr-value-text">{{ kr.currentValue }} / {{ kr.targetValue }} {{ kr.unit }}</span>
                </td>
                <td>
                  <span class="persp-badge" :class="perspectiveClass(kr.bscPerspective)">
                    {{ perspectiveLabel(kr.bscPerspective) }}
                  </span>
                </td>
                <td class="obj-cell">
                  <span class="obj-title">{{ kr.objectiveTitle }}</span>
                  <span class="quarter-chip">{{ kr.quarter }}</span>
                </td>
                <td>
                  <span v-if="kr.responsible" class="pic-name">{{ kr.responsible.name }}</span>
                  <span v-else class="pic-empty">—</span>
                </td>
                <td class="progress-cell">
                  <div class="inline-bar">
                    <div class="inline-bar-fill" :class="kr.status === 'AT_RISK' ? 'atrisk' : 'offtrack'" :style="{ width: kr.progress + '%' }"></div>
                  </div>
                  <span class="inline-pct">{{ kr.progress }}%</span>
                </td>
                <td>
                  <span class="status-badge" :class="kr.status === 'AT_RISK' ? 'atrisk' : 'offtrack'">
                    {{ kr.status === 'AT_RISK' ? 'At Risk' : 'Off Track' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div v-else class="no-critical card">
        <p>✅ Tidak ada KR kritis saat ini. Semua indikator dalam kondisi On Track!</p>
      </div>
    </template>

    <div v-else class="error-state card">
      <p>Gagal memuat data. Pastikan Anda login sebagai C-Level atau Admin.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';

useHead({ title: 'Executive BSC Dashboard — C-Level' });

const auth = useAuthStore();
const loading = ref(true);
const data = ref(null);

const gaugeLength = 157; // approximate arc length for semicircle r=50

const healthColor = computed(() => {
  const s = data.value?.overallHealthScore ?? 0;
  if (s >= 70) return '#22c55e';
  if (s >= 40) return '#f2af17';
  return '#f97066';
});

const healthClass = computed(() => {
  const s = data.value?.overallHealthScore ?? 0;
  if (s >= 70) return 'green';
  if (s >= 40) return 'yellow';
  return 'red';
});

const healthLabel = computed(() => {
  const s = data.value?.overallHealthScore ?? 0;
  if (s >= 70) return 'Sehat (Healthy)';
  if (s >= 40) return 'Perlu Perhatian';
  return 'Kritis';
});

function perspectiveLabel(key) {
  const map = {
    FINANCIAL: 'Financial',
    CUSTOMER: 'Customer',
    INTERNAL_PROCESS: 'Internal Process',
    LEARNING_GROWTH: 'Learning & Growth',
  };
  return map[key] || key;
}

function perspectiveIcon(key) {
  const map = { FINANCIAL: '💰', CUSTOMER: '🤝', INTERNAL_PROCESS: '⚙️', LEARNING_GROWTH: '📈' };
  return map[key] || '📊';
}

function perspectiveClass(key) {
  const map = {
    FINANCIAL: 'financial',
    CUSTOMER: 'customer',
    INTERNAL_PROCESS: 'internal',
    LEARNING_GROWTH: 'learning',
  };
  return map[key] || '';
}

function perspectiveStroke(key) {
  const map = {
    FINANCIAL: '#0e97d6',
    CUSTOMER: '#6366f1',
    INTERNAL_PROCESS: '#a855f7',
    LEARNING_GROWTH: '#22c55e',
  };
  return map[key] || '#888';
}

function progressClass(pct) {
  if (pct >= 70) return 'ontrack';
  if (pct >= 40) return 'atrisk';
  return 'offtrack';
}

function hasTrendData(arr) {
  return arr.some(v => v !== null);
}

function trendPoints(arr) {
  const pts = [];
  arr.forEach((val, wi) => {
    if (val !== null) {
      const x = wi * 60 + 10;
      const y = 120 - (val / 100) * 110;
      pts.push(`${x},${y}`);
    }
  });
  return pts.join(' ');
}

async function fetchData() {
  loading.value = true;
  try {
    const token = auth.token || localStorage.getItem('auth_token');
    const res = await fetch('http://localhost:3001/api/bsc/c-level-dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Unauthorized or server error');
    data.value = await res.json();
  } catch (e) {
    console.error('C-Level dashboard fetch error:', e);
    data.value = null;
  } finally {
    loading.value = false;
  }
}

function exportCsv() {
  if (!data.value) return;

  const rows = [
    ['Key Result', 'Perspektif', 'Objective', 'Quarter', 'PIC Responsible', 'Target', 'Current', 'Unit', 'Progress (%)', 'Status'],
  ];

  // All KRs from criticalKrs + we need all. Re-build from bscByPerspective is complex,
  // so export critical KRs + summary sheet.
  // Export criticalKrs
  data.value.criticalKrs.forEach(kr => {
    rows.push([
      `"${kr.title}"`,
      perspectiveLabel(kr.bscPerspective),
      `"${kr.objectiveTitle}"`,
      kr.quarter,
      kr.responsible ? kr.responsible.name : '',
      kr.targetValue,
      kr.currentValue,
      kr.unit,
      kr.progress,
      kr.status,
    ]);
  });

  // Summary rows
  rows.push([]);
  rows.push(['--- SUMMARY PER PERSPEKTIF ---']);
  rows.push(['Perspektif', 'Total KR', 'On Track', 'At Risk', 'Off Track', 'Avg Progress (%)']);
  Object.entries(data.value.bscByPerspective).forEach(([key, p]) => {
    rows.push([
      perspectiveLabel(key),
      p.totalCount,
      p.onTrackCount,
      p.atRiskCount,
      p.offTrackCount,
      p.averageProgress,
    ]);
  });

  rows.push([]);
  rows.push(['--- PROGRESS PER DEPARTEMEN ---']);
  rows.push(['Departemen', 'Jumlah KR', 'Avg Progress (%)']);
  data.value.byDepartment.forEach(d => {
    rows.push([d.department, d.krCount, d.averageProgress]);
  });

  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bsc-executive-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

onMounted(fetchData);
</script>

<style scoped>
/* ─── Root Layout ──────────────────────────────────────────────────────── */
.clevel-root {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 28px 60px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: 'Rubik', sans-serif;
}

/* ─── Card Base ─────────────────────────────────────────────────────────── */
.card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--card-border, #eef2f8);
  border-radius: 18px;
  padding: 24px 28px;
}

/* ─── Header ────────────────────────────────────────────────────────────── */
.clevel-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.header-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #0e97d6;
  margin: 0 0 6px;
}

.header-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-gamma-150, #1a2335);
  margin: 0 0 6px;
  letter-spacing: -0.5px;
}

.header-subtitle {
  font-size: 15px;
  color: #5e718d;
  margin: 0;
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: #f8fafc;
  border: 1px solid #d7dfe9;
  border-radius: 10px;
  font-family: 'Rubik', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #3d536e;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.export-btn:hover {
  background: #eef2f8;
  border-color: #b8c6d9;
}

/* ─── Summary Row ───────────────────────────────────────────────────────── */
.summary-row {
  display: grid;
  grid-template-columns: 220px repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1100px) {
  .summary-row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .summary-row {
    grid-template-columns: 1fr;
  }
}

/* Health Gauge */
.health-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 24px 20px 20px;
}

.gauge-container {
  width: 130px;
}

.gauge-svg {
  width: 100%;
  overflow: visible;
}

.gauge-number {
  font-family: 'Rubik', sans-serif;
  font-size: 20px;
  font-weight: 700;
}

.health-label {
  font-size: 13px;
  font-weight: 600;
  margin: 4px 0 0;
  padding: 3px 10px;
  border-radius: 20px;
}

.health-label.green { background: #dcfce7; color: #16a34a; }
.health-label.yellow { background: #fef3c7; color: #b45309; }
.health-label.red { background: #fee2e2; color: #dc2626; }

/* Summary Cards */
.summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  overflow: hidden;
}

.status-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  border-radius: 2px 0 0 2px;
}

.status-card.ontrack::before { background: #22c55e; }
.status-card.atrisk::before { background: #f2af17; }
.status-card.offtrack::before { background: #f97066; }

.card-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #8897ae;
  margin: 0;
}

.summary-big-num {
  font-size: 40px;
  font-weight: 700;
  color: #1a2335;
  margin: 0;
  line-height: 1;
}

.summary-big-num.green { color: #16a34a; }
.summary-big-num.yellow { color: #b45309; }
.summary-big-num.red { color: #dc2626; }

.summary-sub {
  font-size: 13px;
  color: #8897ae;
  margin: 0;
}

/* ─── BSC Scorecard ─────────────────────────────────────────────────────── */
.scorecard-header {
  margin-bottom: 20px;
}

.scorecard-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-gamma-150, #1a2335);
  margin: 0 0 4px;
}

.section-sub {
  font-size: 14px;
  color: #8897ae;
  margin: 0;
}

.scorecard-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.scorecard-row {
  display: grid;
  grid-template-columns: 220px 1fr 280px;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  border-radius: 12px;
  background: #f8fafc;
  border-left: 4px solid transparent;
  transition: background 0.15s;
}

.scorecard-row:hover { background: #f0f4f8; }
.scorecard-row.financial { border-left-color: #0e97d6; }
.scorecard-row.customer { border-left-color: #6366f1; }
.scorecard-row.internal { border-left-color: #a855f7; }
.scorecard-row.learning { border-left-color: #22c55e; }

@media (max-width: 900px) {
  .scorecard-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.scorecard-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.perspective-icon { font-size: 26px; }

.perspective-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a2335;
  margin: 0;
}

.perspective-sub {
  font-size: 12px;
  color: #8897ae;
  margin: 0;
}

.scorecard-bar-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-track {
  flex: 1;
  height: 10px;
  background: #e5eaf3;
  border-radius: 6px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.bar-fill.financial { background: #0e97d6; }
.bar-fill.customer { background: #6366f1; }
.bar-fill.internal { background: #a855f7; }
.bar-fill.learning { background: #22c55e; }

.bar-pct {
  font-size: 15px;
  font-weight: 700;
  color: #1a2335;
  min-width: 44px;
  text-align: right;
}

.scorecard-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.pill {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
}

.pill.ontrack { background: #dcfce7; color: #16a34a; }
.pill.atrisk { background: #fef3c7; color: #b45309; }
.pill.offtrack { background: #fee2e2; color: #dc2626; }

/* ─── Two Column Row ────────────────────────────────────────────────────── */
.two-col-row {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
}

@media (max-width: 1024px) {
  .two-col-row {
    grid-template-columns: 1fr;
  }
}

/* ─── Trend Chart ───────────────────────────────────────────────────────── */
.trend-card h2, .dept-card h2, .critical-card h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-gamma-150, #1a2335);
  margin: 0 0 4px;
}

.trend-chart {
  display: flex;
  gap: 8px;
  margin: 20px 0 0;
  height: 140px;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 11px;
  color: #8897ae;
  text-align: right;
  padding-bottom: 2px;
  min-width: 34px;
}

.chart-area {
  flex: 1;
  position: relative;
  height: 100%;
}

.grid-lines {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}

.grid-line {
  border-top: 1px dashed #e5eaf3;
  width: 100%;
}

.trend-svg {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
}

.x-axis {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #8897ae;
  margin-top: 8px;
  padding-left: 42px;
}

.trend-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #5e718d;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ─── Department Progress ───────────────────────────────────────────────── */
.dept-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 20px;
}

.dept-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dept-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dept-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a2335;
}

.dept-kr-count {
  font-size: 12px;
  color: #8897ae;
}

.dept-bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dept-bar-track {
  flex: 1;
  height: 8px;
  background: #e5eaf3;
  border-radius: 4px;
  overflow: hidden;
}

.dept-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.dept-bar-fill.ontrack { background: #22c55e; }
.dept-bar-fill.atrisk { background: #f2af17; }
.dept-bar-fill.offtrack { background: #f97066; }

.dept-pct {
  font-size: 13px;
  font-weight: 700;
  min-width: 38px;
  text-align: right;
}

.dept-pct.ontrack { color: #16a34a; }
.dept-pct.atrisk { color: #b45309; }
.dept-pct.offtrack { color: #dc2626; }

/* ─── Critical KRs Table ────────────────────────────────────────────────── */
.critical-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 12px;
}

.critical-count-badge {
  background: #fee2e2;
  color: #dc2626;
  font-size: 13px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

.critical-table-wrap {
  overflow-x: auto;
}

.critical-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.critical-table th {
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #8897ae;
  padding: 10px 14px;
  border-bottom: 1px solid #eef2f8;
  white-space: nowrap;
}

.critical-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f8fafc;
  vertical-align: middle;
}

.critical-row:hover td {
  background: #fafbfc;
}

.kr-title-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-width: 260px;
}

.kr-title-text {
  font-weight: 600;
  color: #1a2335;
  line-height: 1.4;
}

.kr-value-text {
  font-size: 12px;
  color: #8897ae;
}

.persp-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

.persp-badge.financial { background: #e0f2fe; color: #0369a1; }
.persp-badge.customer { background: #ede9fe; color: #6d28d9; }
.persp-badge.internal { background: #f3e8ff; color: #7e22ce; }
.persp-badge.learning { background: #dcfce7; color: #15803d; }

.obj-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 220px;
}

.obj-title {
  font-size: 13px;
  color: #3d536e;
  line-height: 1.4;
}

.quarter-chip {
  font-size: 11px;
  color: #8897ae;
  font-weight: 600;
}

.pic-name {
  font-size: 13px;
  font-weight: 600;
  color: #1a2335;
}

.pic-empty {
  color: #c5d0de;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 120px;
}

.inline-bar {
  flex: 1;
  height: 6px;
  background: #e5eaf3;
  border-radius: 3px;
  overflow: hidden;
}

.inline-bar-fill {
  height: 100%;
  border-radius: 3px;
}

.inline-bar-fill.atrisk { background: #f2af17; }
.inline-bar-fill.offtrack { background: #f97066; }

.inline-pct {
  font-size: 13px;
  font-weight: 700;
  min-width: 38px;
  color: #3d536e;
}

.status-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;
}

.status-badge.atrisk { background: #fef3c7; color: #b45309; }
.status-badge.offtrack { background: #fee2e2; color: #dc2626; }

/* ─── No Critical / Empty / Error / Loading ─────────────────────────────── */
.no-critical {
  text-align: center;
  color: #16a34a;
  font-size: 16px;
  font-weight: 500;
  padding: 32px;
}

.empty-state, .error-state {
  text-align: center;
  color: #8897ae;
  padding: 40px;
  font-size: 15px;
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px;
  color: #5e718d;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #eef2f8;
  border-top-color: #0e97d6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

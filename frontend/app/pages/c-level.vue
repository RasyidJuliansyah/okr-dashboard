<template>
  <div class="clevel-root">
    <!-- Header -->
    <section class="clevel-header">
      <div class="header-left">
        <p class="header-eyebrow">Executive Dashboard</p>
        <h1 class="header-title">Balanced Scorecard Overview</h1>
        <p class="header-subtitle">
          Monitoring kesehatan strategis perusahaan secara menyeluruh
          berdasarkan 4 perspektif BSC.
        </p>
      </div>
      <div
        class="header-actions"
        style="display: flex; gap: 12px; align-items: center"
      >
        <select
          v-model="selectedMonth"
          @change="fetchData"
          class="month-select"
        >
          <option value="">Semua Bulan (YTD)</option>
          <option v-for="m in availableMonths" :key="m.value" :value="m.value">
            {{ m.label }}
          </option>
        </select>
        <button class="export-btn" @click="exportCsv">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
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
              <path
                d="M 10 70 A 50 50 0 0 1 110 70"
                fill="none"
                stroke="#eef2f8"
                stroke-width="12"
                stroke-linecap="round"
              />
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
              <text
                x="60"
                y="62"
                text-anchor="middle"
                class="gauge-number"
                :fill="healthColor"
              >
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
            {{
              data.totalKRs > 0
                ? Math.round((data.totalOnTrack / data.totalKRs) * 100)
                : 0
            }}% dari total KR
          </p>
        </div>

        <!-- At Risk -->
        <div class="summary-card card status-card atrisk">
          <p class="card-label">At Risk</p>
          <p class="summary-big-num yellow">{{ data.totalAtRisk }}</p>
          <p class="summary-sub">
            {{
              data.totalKRs > 0
                ? Math.round((data.totalAtRisk / data.totalKRs) * 100)
                : 0
            }}% dari total KR
          </p>
        </div>

        <!-- Off Track -->
        <div class="summary-card card status-card offtrack">
          <p class="card-label">Off Track</p>
          <p class="summary-big-num red">{{ data.totalOffTrack }}</p>
          <p class="summary-sub">
            {{
              data.totalKRs > 0
                ? Math.round((data.totalOffTrack / data.totalKRs) * 100)
                : 0
            }}% dari total KR
          </p>
        </div>
      </section>

      <!-- Row 2: BSC Scorecard Strips (Expandable) -->
      <section class="bsc-scorecard card">
        <div class="scorecard-header">
          <div>
            <h2>BSC Scorecard — 4 Perspektif</h2>
            <p class="section-sub">
              Progress agregat per perspektif Balanced Scorecard. Klik kartu untuk melihat capaian Key Results.
            </p>
          </div>
          <button
            type="button"
            class="toggle-all-btn"
            @click="toggleAllPerspectives"
          >
            {{ allExpanded ? "Tutup Semua" : "Buka Semua" }}
          </button>
        </div>
        <div class="scorecard-list">
          <div
            v-for="(pdata, pkey) in data.bscByPerspective"
            :key="pkey"
            class="scorecard-item"
            :class="[perspectiveClass(pkey), { expanded: isExpanded(pkey) }]"
          >
            <div
              class="scorecard-row"
              :class="perspectiveClass(pkey)"
              role="button"
              tabindex="0"
              :aria-expanded="isExpanded(pkey)"
              @click="togglePerspective(pkey)"
              @keydown.enter.space.prevent="togglePerspective(pkey)"
            >
              <div class="scorecard-left">
                <span class="perspective-icon">{{ perspectiveIcon(pkey) }}</span>
                <div>
                  <p class="perspective-name">{{ perspectiveLabel(pkey) }}</p>
                  <p class="perspective-sub">
                    {{ pdata.totalCount }} Key Results
                  </p>
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
              <div class="scorecard-right">
                <div class="scorecard-pills">
                  <span class="pill ontrack"
                    >{{ pdata.onTrackCount }} On Track</span
                  >
                  <span class="pill atrisk">{{ pdata.atRiskCount }} At Risk</span>
                  <span class="pill offtrack"
                    >{{ pdata.offTrackCount }} Off Track</span
                  >
                </div>
                <div class="chevron-icon" :class="{ rotated: isExpanded(pkey) }">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Expanded Details Slot Placeholder -->
            <div v-show="isExpanded(pkey)" class="scorecard-detail">
              <div
                v-if="!pdata.keyResults || pdata.keyResults.length === 0"
                class="empty-kr-detail"
              >
                Belum ada Key Result terdaftar pada perspektif ini.
              </div>
              <div v-else class="kr-cards-list">
                <div
                  v-for="kr in pdata.keyResults"
                  :key="kr.id"
                  class="kr-detail-card"
                >
                  <div class="kr-detail-main">
                    <div class="kr-detail-info">
                      <div class="kr-detail-title-line">
                        <span class="kr-title">{{ kr.title }}</span>
                        <span
                          class="status-badge"
                          :class="statusBadgeClass(kr.status)"
                        >
                          {{ statusLabel(kr.status) }}
                        </span>
                      </div>
                      <div class="kr-meta-chips">
                        <span
                          v-if="kr.objectiveTitle"
                          class="meta-chip obj-chip"
                          :title="kr.objectiveTitle"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                          </svg>
                          {{ kr.objectiveTitle }} {{ kr.year ? `(${kr.year})` : '' }}
                        </span>
                        <span
                          v-if="kr.responsible"
                          class="meta-chip"
                          title="PIC Responsible"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          PIC: {{ kr.responsible.name }}
                        </span>
                        <span
                          v-for="dept in kr.departments"
                          :key="dept"
                          class="meta-chip"
                        >
                          {{ dept }}
                        </span>
                        <span
                          v-if="kr.initiatives && kr.initiatives.length > 0"
                          class="meta-chip inits-count-chip"
                          title="Jumlah Inisiatif"
                        >
                          {{ kr.initiatives.length }} Inisiatif
                        </span>
                      </div>
                    </div>

                    <div class="kr-progress-box">
                      <div class="kr-metric-nums">
                        <span class="kr-cur-tgt">
                          <strong>{{ kr.currentValue?.toLocaleString('id-ID') }}</strong> / {{ kr.targetValue?.toLocaleString('id-ID') }} {{ kr.unit || '' }}
                        </span>
                        <span
                          class="kr-pct-badge"
                          :class="progressClass(kr.progress)"
                        >
                          {{ kr.progress }}%
                        </span>
                      </div>
                      <div class="kr-mini-track">
                        <div
                          class="kr-mini-fill"
                          :class="progressClass(kr.progress)"
                          :style="{ width: Math.min(100, Math.max(0, kr.progress)) + '%' }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Row 3: Trend Chart + Department Progress -->
      <div class="two-col-row">
        <!-- Trend Chart (pure CSS sparklines per perspective) -->
        <section class="trend-card card">
          <h2>Tren Progres — 8 Minggu Terakhir</h2>
          <p class="section-sub">
            Perkembangan rata-rata progress tiap perspektif BSC per minggu
          </p>
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
                <g
                  v-for="(pkey, pi) in Object.keys(data.trendData)"
                  :key="pkey"
                >
                  <polyline
                    :points="trendPoints(data.trendData[pkey])"
                    fill="none"
                    :stroke="perspectiveStroke(pkey)"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    :stroke-dasharray="
                      hasTrendData(data.trendData[pkey]) ? 'none' : '4 4'
                    "
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
            <span v-for="label in data.trendLabels" :key="label">{{
              label
            }}</span>
          </div>
          <!-- Legend -->
          <div class="trend-legend">
            <div
              v-for="pkey in Object.keys(data.trendData)"
              :key="pkey"
              class="legend-item"
            >
              <span
                class="legend-dot"
                :style="{ background: perspectiveStroke(pkey) }"
              ></span>
              <span>{{ perspectiveLabel(pkey) }}</span>
            </div>
          </div>
        </section>

        <!-- Department Progress -->
        <section class="dept-card card">
          <h2>Progress per Departemen</h2>
          <p class="section-sub">
            Rata-rata progres KR berdasarkan departemen yang terlibat
          </p>
          <div v-if="data.byDepartment.length === 0" class="empty-state">
            Belum ada data departemen yang terdaftar pada KR.
          </div>
          <div class="dept-list" v-else>
            <div
              v-for="dept in data.byDepartment"
              :key="dept.department"
              class="dept-row"
            >
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
                <span
                  class="dept-pct"
                  :class="progressClass(dept.averageProgress)"
                >
                  {{ dept.averageProgress }}%
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Row 3.5: Matrix Table Overview (NEW) -->
      <section
        class="card mb-6"
        style="margin-top: 24px; margin-bottom: 24px; padding: 20px"
      >
        <h2
          style="
            font-size: 18px;
            font-weight: 700;
            color: #1a2335;
            margin: 0 0 4px;
          "
        >
          Matriks Capaian Bulanan
        </h2>
        <p
          class="section-sub"
          style="font-size: 12px; color: #8897ae; margin: 0 0 16px"
        >
          Visualisasi capaian Balanced Scorecard per bulan untuk seluruh Key
          Result tahunan
        </p>
        <MonthlyMatrixTable
          :annualKrs="annualKeyResults"
          :highlightMonth="selectedMonth"
          :monthlyHealthScores="data?.monthlyHealthScores"
          :ytdHealthScore="data?.ytdHealthScore"
          :overallHealthScore="data?.overallHealthScore"
        />
      </section>

      <!-- Row 4: Critical KRs Table -->
      <section class="critical-card card" v-if="data.criticalKrs.length > 0">
        <div class="critical-header">
          <div>
            <h2>Key Results Kritis</h2>
            <p class="section-sub">
              KR dengan status At Risk atau Off Track yang memerlukan perhatian
              segera
            </p>
          </div>
          <span class="critical-count-badge"
            >{{ data.criticalKrs.length }} KR</span
          >
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
              <tr
                v-for="kr in data.criticalKrs"
                :key="kr.id"
                class="critical-row"
                :class="kr.status.toLowerCase().replace('_', '')"
              >
                <td class="kr-title-cell">
                  <span class="kr-title-text">{{ kr.title }}</span>
                  <span class="kr-value-text"
                    >{{ kr.currentValue }} / {{ kr.targetValue }}
                    {{ kr.unit }}</span
                  >
                </td>
                <td>
                  <span
                    class="persp-badge"
                    :class="perspectiveClass(kr.bscPerspective)"
                  >
                    {{ perspectiveLabel(kr.bscPerspective) }}
                  </span>
                </td>
                <td class="obj-cell">
                  <span class="obj-title">{{ kr.objectiveTitle }}</span>
                  <span class="year-chip">{{ kr.year }}</span>
                </td>
                <td>
                  <span v-if="kr.responsible" class="pic-name">{{
                    kr.responsible.name
                  }}</span>
                  <span v-else class="pic-empty">—</span>
                </td>
                <td class="progress-cell">
                  <div class="inline-bar">
                    <div
                      class="inline-bar-fill"
                      :class="kr.status === 'AT_RISK' ? 'atrisk' : 'offtrack'"
                      :style="{ width: kr.progress + '%' }"
                    ></div>
                  </div>
                  <span class="inline-pct">{{ kr.progress }}%</span>
                </td>
                <td>
                  <span
                    class="status-badge"
                    :class="kr.status === 'AT_RISK' ? 'atrisk' : 'offtrack'"
                  >
                    {{ kr.status === "AT_RISK" ? "At Risk" : "Off Track" }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div v-else class="no-critical card">
        <p>
          Tidak ada KR kritis saat ini. Semua indikator dalam kondisi On Track!
        </p>
      </div>
    </template>

    <div v-else class="error-state card">
      <p>Gagal memuat data. Pastikan Anda login sebagai C-Level atau Admin.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRuntimeConfig } from "#app";

useHead({ title: "Executive BSC Dashboard — C-Level" });

const auth = useAuthStore();
const config = useRuntimeConfig();
const loading = ref(true);
const data = ref(null);

const selectedMonth = ref("");
const availableMonths = [
  { value: "2026-01", label: "Januari 2026" },
  { value: "2026-02", label: "Februari 2026" },
  { value: "2026-03", label: "Maret 2026" },
  { value: "2026-04", label: "April 2026" },
  { value: "2026-05", label: "Mei 2026" },
  { value: "2026-06", label: "Juni 2026" },
  { value: "2026-07", label: "Juli 2026" },
  { value: "2026-08", label: "Agustus 2026" },
  { value: "2026-09", label: "September 2026" },
  { value: "2026-10", label: "Oktober 2026" },
  { value: "2026-11", label: "November 2026" },
  { value: "2026-12", label: "Desember 2026" },
];
const annualKeyResults = ref([]);

async function fetchAnnualKeyResults() {
  try {
    const token = auth.token || localStorage.getItem("auth_token");
    const res = await fetch(
      `${config.public.apiBase}/annual-key-results?year=2026`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (res.ok) {
      const krs = await res.json();
      annualKeyResults.value = await Promise.all(
        krs.map(async (akr) => {
          try {
            const detailRes = await fetch(
              `${config.public.apiBase}/annual-key-results/${akr.id}/monthly-breakdown`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            if (detailRes.ok) {
              return await detailRes.json();
            }
          } catch (e) {
            console.error(e);
          }
          return {
            ...akr,
            aggregatedProgress: 0,
            months: [],
          };
        }),
      );
    }
  } catch (err) {
    console.error("Gagal memuat data matriks tahunan", err);
  }
}

const gaugeLength = 157; // approximate arc length for semicircle r=50

const healthColor = computed(() => {
  const s = data.value?.overallHealthScore ?? 0;
  if (s >= 70) return "#22c55e";
  if (s >= 40) return "#f2af17";
  return "#f97066";
});

const healthClass = computed(() => {
  const s = data.value?.overallHealthScore ?? 0;
  if (s >= 70) return "green";
  if (s >= 40) return "yellow";
  return "red";
});

const healthLabel = computed(() => {
  const s = data.value?.overallHealthScore ?? 0;
  if (s >= 70) return "Sehat (Healthy)";
  if (s >= 40) return "Perlu Perhatian";
  return "Kritis";
});

function perspectiveLabel(key) {
  const map = {
    FINANCIAL: "Financial",
    CUSTOMER: "Customer",
    INTERNAL_PROCESS: "Internal Process",
    LEARNING_GROWTH: "Learning & Growth",
  };
  return map[key] || key;
}

function perspectiveIcon(key) {
  const map = {
    FINANCIAL: "",
    CUSTOMER: "",
    INTERNAL_PROCESS: "",
    LEARNING_GROWTH: "",
  };
  return map[key] || "";
}

function perspectiveClass(key) {
  const map = {
    FINANCIAL: "financial",
    CUSTOMER: "customer",
    INTERNAL_PROCESS: "internal",
    LEARNING_GROWTH: "learning",
  };
  return map[key] || "";
}

function perspectiveStroke(key) {
  const map = {
    FINANCIAL: "#0e97d6",
    CUSTOMER: "#6366f1",
    INTERNAL_PROCESS: "#a855f7",
    LEARNING_GROWTH: "#22c55e",
  };
  return map[key] || "#888";
}

function progressClass(pct) {
  if (pct >= 70) return "ontrack";
  if (pct >= 40) return "atrisk";
  return "offtrack";
}

const expandedPerspectives = ref({});

function togglePerspective(key) {
  expandedPerspectives.value[key] = !expandedPerspectives.value[key];
}

function isExpanded(key) {
  return !!expandedPerspectives.value[key];
}

const allExpanded = computed(() => {
  if (!data.value?.bscByPerspective) return false;
  const keys = Object.keys(data.value.bscByPerspective);
  return keys.length > 0 && keys.every((k) => expandedPerspectives.value[k]);
});

function toggleAllPerspectives() {
  const target = !allExpanded.value;
  if (!data.value?.bscByPerspective) return;
  const next = {};
  Object.keys(data.value.bscByPerspective).forEach((k) => {
    next[k] = target;
  });
  expandedPerspectives.value = next;
}

function statusBadgeClass(status) {
  if (status === "ON_TRACK") return "ontrack";
  if (status === "AT_RISK") return "atrisk";
  if (status === "OFF_TRACK") return "offtrack";
  return "";
}

function statusLabel(status) {
  if (status === "ON_TRACK") return "On Track";
  if (status === "AT_RISK") return "At Risk";
  if (status === "OFF_TRACK") return "Off Track";
  return status || "-";
}

function hasTrendData(arr) {
  return arr.some((v) => v !== null);
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
  return pts.join(" ");
}

async function fetchData() {
  loading.value = true;
  try {
    const token = auth.token || localStorage.getItem("auth_token");
    let url = `${config.public.apiBase}/bsc/c-level-dashboard`;
    if (selectedMonth.value) {
      url += `?month=${selectedMonth.value}`;
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Unauthorized or server error");
    data.value = await res.json();
    await fetchAnnualKeyResults();
  } catch (e) {
    console.error("C-Level dashboard fetch error:", e);
    data.value = null;
  } finally {
    loading.value = false;
  }
}

function exportCsv() {
  if (!data.value?.bscByPerspective) return;

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headers = [
    "Aspek BSC",
    "Objektif Induk",
    "Key Result",
    "Target",
    "Capaian Saat Ini",
    "Satuan",
    "Capaian (%)",
    "Status",
    "Active",
    "Tipe Target",
    "Bulan",
    "Tahun",
    "PIC Responsible",
    "Departemen",
    "Jumlah Inisiatif",
  ];

  const rows = [headers.map(escapeCell)];

  Object.entries(data.value.bscByPerspective).forEach(([key, p]) => {
    const aspectName = perspectiveLabel(key);
    (p.keyResults || [])
      .filter(
        (kr) =>
          kr.isActive === undefined ||
          kr.isActive === 1 ||
          kr.isActive === true,
      )
      .forEach((kr) => {
        const depts =
          Array.isArray(kr.departments) && kr.departments.length > 0
            ? kr.departments.join(", ")
            : "-";
        const picName = kr.responsible?.name || "-";
        const initsCount = Array.isArray(kr.initiatives)
          ? kr.initiatives.length
          : 0;
        const activeVal =
          kr.isActive !== undefined ? (kr.isActive ? 1 : 0) : 1;

        rows.push([
          escapeCell(aspectName),
          escapeCell(kr.objectiveTitle || "-"),
          escapeCell(kr.title || "-"),
          kr.targetValue ?? 0,
          kr.currentValue ?? 0,
          escapeCell(kr.unit || ""),
          kr.progress ?? 0,
          escapeCell(statusLabel(kr.status)),
          activeVal,
          escapeCell(kr.targetType || "AT_LEAST"),
          escapeCell(kr.month || "-"),
          escapeCell(kr.year || "-"),
          escapeCell(picName),
          escapeCell(depts),
          initsCount,
        ]);
      });
  });

  const csv = rows.map((r) => r.join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `key-results-active-bsc-${selectedMonth.value ? selectedMonth.value + "-" : ""}${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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
  font-family: "Rubik", sans-serif;
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
  color: var(--text-heading, #1a2335);
  margin: 0 0 6px;
  letter-spacing: -0.5px;
}

.header-subtitle {
  font-size: 15px;
  color: var(--text-muted, #5e718d);
  margin: 0;
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--bg-page);
  border: 1px solid #d7dfe9;
  border-radius: 10px;
  font-family: "Rubik", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #3d536e;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
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
  font-family: "Rubik", sans-serif;
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

.health-label.green {
  background: #dcfce7;
  color: #16a34a;
}
.health-label.yellow {
  background: #fef3c7;
  color: #b45309;
}
.health-label.red {
  background: #fee2e2;
  color: #dc2626;
}

/* Summary Cards */
.summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  overflow: hidden;
}

.status-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 2px 0 0 2px;
}

.status-card.ontrack::before {
  background: #22c55e;
}
.status-card.atrisk::before {
  background: #f2af17;
}
.status-card.offtrack::before {
  background: #f97066;
}

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
  color: var(--text-heading, #1a2335);
  margin: 0;
  line-height: 1;
}

.summary-big-num.green {
  color: #16a34a;
}
.summary-big-num.yellow {
  color: #b45309;
}
.summary-big-num.red {
  color: #dc2626;
}

.summary-sub {
  font-size: 13px;
  color: #8897ae;
  margin: 0;
}

/* ─── BSC Scorecard ─────────────────────────────────────────────────────── */
.scorecard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.scorecard-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-heading, #1a2335);
  margin: 0 0 4px;
}

.section-sub {
  font-size: 14px;
  color: #8897ae;
  margin: 0;
}

.toggle-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #0e97d6;
  background: rgba(14, 151, 214, 0.08);
  border: 1px solid rgba(14, 151, 214, 0.25);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-all-btn:hover {
  background: #0e97d6;
  color: #ffffff;
}

.scorecard-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.scorecard-item {
  border-radius: 12px;
  border: 1px solid var(--card-border, #e4e4e4);
  background: var(--card-bg, #ffffff);
  overflow: hidden;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.scorecard-item:hover {
  border-color: rgba(14, 151, 214, 0.35);
}

.scorecard-item.expanded {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.scorecard-row {
  display: grid;
  grid-template-columns: 220px 1fr auto;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  background: var(--bg-page);
  border-left: 4px solid transparent;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.scorecard-row:hover {
  background: #f0f4f8;
}
.scorecard-row.financial {
  border-left-color: #0e97d6;
}
.scorecard-row.customer {
  border-left-color: #6366f1;
}
.scorecard-row.internal {
  border-left-color: #a855f7;
}
.scorecard-row.learning {
  border-left-color: #22c55e;
}

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

.perspective-icon {
  font-size: 26px;
}

.perspective-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-heading, #1a2335);
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

.bar-fill.financial {
  background: #0e97d6;
}
.bar-fill.customer {
  background: #6366f1;
}
.bar-fill.internal {
  background: #a855f7;
}
.bar-fill.learning {
  background: #22c55e;
}

.bar-pct {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-heading, #1a2335);
  min-width: 44px;
  text-align: right;
}

.scorecard-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.chevron-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: #8897ae;
  background: rgba(0, 0, 0, 0.04);
  transition: transform 0.25s ease, background 0.15s, color 0.15s;
}

.scorecard-row:hover .chevron-icon {
  color: #0e97d6;
  background: rgba(14, 151, 214, 0.12);
}

.chevron-icon.rotated {
  transform: rotate(180deg);
  color: #0e97d6;
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

.pill.ontrack {
  background: #dcfce7;
  color: #16a34a;
}
.pill.atrisk {
  background: #fef3c7;
  color: #b45309;
}
.pill.offtrack {
  background: #fee2e2;
  color: #dc2626;
}

/* ─── Scorecard Expandable Details ──────────────────────────────────────── */
.scorecard-detail {
  padding: 16px 20px 20px;
  border-top: 1px solid var(--card-border, #e4e4e4);
  background: var(--card-bg, #ffffff);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.empty-kr-detail {
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted, #8897ae);
  font-style: italic;
}

.kr-cards-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.kr-detail-card {
  border-radius: 10px;
  border: 1px solid var(--card-border, #e2e8f0);
  background: var(--bg-page);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.15s;
}

.kr-detail-card:hover {
  border-color: #cbd5e1;
}

.kr-detail-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

@media (max-width: 768px) {
  .kr-detail-main {
    flex-direction: column;
    gap: 12px;
  }
}

.kr-detail-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kr-detail-title-line {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.kr-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-heading, #1e293b);
  line-height: 1.4;
}

.kr-meta-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.04);
  color: #64748b;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.meta-chip.obj-chip {
  color: #0284c7;
  background: rgba(2, 132, 199, 0.08);
  border-color: rgba(2, 132, 199, 0.2);
}

.kr-progress-box {
  width: 210px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

@media (max-width: 768px) {
  .kr-progress-box {
    width: 100%;
  }
}

.kr-metric-nums {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.kr-cur-tgt {
  font-size: 12px;
  color: var(--text-muted, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kr-pct-badge {
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
}

.kr-pct-badge.ontrack {
  color: #16a34a;
}
.kr-pct-badge.atrisk {
  color: #b45309;
}
.kr-pct-badge.offtrack {
  color: #dc2626;
}

.kr-mini-track {
  width: 100%;
  height: 6px;
  background: #e5eaf3;
  border-radius: 3px;
  overflow: hidden;
}

.kr-mini-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}

.kr-mini-fill.ontrack {
  background: #22c55e;
}
.kr-mini-fill.atrisk {
  background: #f2af17;
}
.kr-mini-fill.offtrack {
  background: #f97066;
}

.meta-chip.inits-count-chip {
  color: #0e97d6;
  background: rgba(14, 151, 214, 0.08);
  border-color: rgba(14, 151, 214, 0.2);
}

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
.trend-card h2,
.dept-card h2,
.critical-card h2 {
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

.dept-bar-fill.ontrack {
  background: #22c55e;
}
.dept-bar-fill.atrisk {
  background: #f2af17;
}
.dept-bar-fill.offtrack {
  background: #f97066;
}

.dept-pct {
  font-size: 13px;
  font-weight: 700;
  min-width: 38px;
  text-align: right;
}

.dept-pct.ontrack {
  color: #16a34a;
}
.dept-pct.atrisk {
  color: #b45309;
}
.dept-pct.offtrack {
  color: #dc2626;
}

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

.persp-badge.financial {
  background: #e0f2fe;
  color: #0369a1;
}
.persp-badge.customer {
  background: #ede9fe;
  color: #6d28d9;
}
.persp-badge.internal {
  background: #f3e8ff;
  color: #7e22ce;
}
.persp-badge.learning {
  background: #dcfce7;
  color: #15803d;
}

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

.year-chip {
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

.inline-bar-fill.atrisk {
  background: #f2af17;
}
.inline-bar-fill.offtrack {
  background: #f97066;
}

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

.status-badge.ontrack {
  background: #dcfce7;
  color: #15803d;
}
.status-badge.atrisk {
  background: #fef3c7;
  color: #b45309;
}
.status-badge.offtrack {
  background: #fee2e2;
  color: #dc2626;
}

/* ─── No Critical / Empty / Error / Loading ─────────────────────────────── */
.no-critical {
  text-align: center;
  color: #16a34a;
  font-size: 16px;
  font-weight: 500;
  padding: 32px;
}

.empty-state,
.error-state {
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
  to {
    transform: rotate(360deg);
  }
}

.month-select {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background-color: white;
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  outline: none;
}
.month-select:focus {
  border-color: #3b82f6;
}

/* ─── Dark Theme Overrides for BSC Scorecard Details ─────────────────────── */
.dark-theme .scorecard-item {
  border-color: var(--card-border);
  background: var(--card-bg);
}

.dark-theme .scorecard-header h2,
.dark-theme .perspective-name,
.dark-theme .bar-pct {
  color: var(--text-heading, #f8fafc);
}

.dark-theme .scorecard-row {
  background: rgba(255, 255, 255, 0.02);
}

.dark-theme .scorecard-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.dark-theme .scorecard-detail {
  background: var(--card-bg);
  border-color: var(--card-border);
}

.dark-theme .kr-detail-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: var(--card-border);
}

.dark-theme .kr-detail-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
}

.dark-theme .kr-title {
  color: var(--text-heading);
}

.dark-theme .meta-chip {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-body);
  border-color: rgba(255, 255, 255, 0.08);
}

.dark-theme .meta-chip.obj-chip {
  background: rgba(2, 132, 199, 0.15);
  color: #38bdf8;
  border-color: rgba(2, 132, 199, 0.3);
}

.dark-theme .meta-chip.inits-count-chip {
  background: rgba(14, 151, 214, 0.15);
  color: #38bdf8;
  border-color: rgba(14, 151, 214, 0.3);
}

.dark-theme .kr-mini-track {
  background: rgba(255, 255, 255, 0.08);
}

.dark-theme .chevron-icon {
  background: rgba(255, 255, 255, 0.05);
}

.dark-theme .status-badge.ontrack {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}
.dark-theme .status-badge.atrisk {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}
.dark-theme .status-badge.offtrack {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.dark-theme .toggle-all-btn {
  background: rgba(14, 151, 214, 0.15);
  border-color: rgba(14, 151, 214, 0.35);
  color: #38bdf8;
}

.dark-theme .toggle-all-btn:hover {
  background: #0e97d6;
  color: #ffffff;
}
</style>

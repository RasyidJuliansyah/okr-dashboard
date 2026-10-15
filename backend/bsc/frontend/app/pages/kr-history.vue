<template>
  <div class="history-root">
    <div class="history-container">
      <!-- Header -->
      <section class="history-header card">
        <div class="header-left">
          <NuxtLink to="/dashboard" class="back-btn">← Kembali ke Dashboard</NuxtLink>
          <h2>History Capaian KR</h2>
          <p class="kr-title-display" v-if="krTitle">{{ krTitle }}</p>
        </div>
        <div class="header-right">
          <!-- Filter periode -->
          <div class="date-filter">
            <label>Dari:</label>
            <input type="date" v-model="filterFrom" @change="fetchHistory" />
            <label>Sampai:</label>
            <input type="date" v-model="filterTo" @change="fetchHistory" />
            <button
              @click="clearFilter"
              class="clear-filter-btn"
              v-if="filterFrom || filterTo"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">Memuat riwayat...</div>

      <!-- Empty State -->
      <div v-else-if="history.length === 0" class="empty-state card">
        <p>Belum ada riwayat perubahan untuk Key Result ini.</p>
        <p class="empty-hint">
          Riwayat akan muncul setelah Admin melakukan update capaian.
        </p>
      </div>

      <template v-else>
        <!-- Chart Section -->
        <section class="chart-section card">
          <h3>Grafik Progres Capaian</h3>
          <p class="chart-subtitle">
            Nilai aktual KR dari waktu ke waktu vs target
            <strong>{{ krTarget }} {{ krUnit }}</strong>
          </p>
          <div class="chart-wrapper">
            <ClientOnly>
              <Line :data="chartData" :options="chartOptions" />
            </ClientOnly>
          </div>
        </section>

        <!-- Stats Row -->
        <section class="stats-row">
          <div class="stat-card card">
            <span class="stat-label">Total Update</span>
            <span class="stat-val">{{ history.length }}</span>
          </div>
          <div class="stat-card card">
            <span class="stat-label">Nilai Awal</span>
            <span class="stat-val">{{ history[0]?.oldValue ?? "-" }} {{ krUnit }}</span>
          </div>
          <div class="stat-card card">
            <span class="stat-label">Nilai Terkini</span>
            <span class="stat-val highlight"
              >{{ history[history.length - 1]?.newValue ?? "-" }} {{ krUnit }}</span
            >
          </div>
          <div class="stat-card card">
            <span class="stat-label">Perubahan Total</span>
            <span
              class="stat-val"
              :class="totalDelta >= 0 ? 'positive' : 'negative'"
            >
              {{ totalDelta >= 0 ? "+" : "" }}{{ totalDelta }} {{ krUnit }}
            </span>
          </div>
        </section>

        <!-- Timeline List -->
        <section class="timeline-section card">
          <h3>Riwayat Perubahan</h3>
          <div class="timeline">
            <div
              v-for="(entry, index) in reversedHistory"
              :key="entry.id"
              class="timeline-item"
              :class="{ latest: index === 0 }"
            >
              <div class="timeline-dot" :class="getDeltaClass(entry)"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-date">{{ formatDateTime(entry.updatedAt) }}</span>
                  <span class="timeline-delta" :class="getDeltaClass(entry)">
                    {{ entry.newValue > entry.oldValue ? "+" : "" }}
                    {{ (entry.newValue - entry.oldValue).toFixed(2) }} {{ krUnit }}
                  </span>
                </div>
                <div class="timeline-values">
                  <span class="old-val">{{ entry.oldValue }} {{ krUnit }}</span>
                  <span class="arrow">→</span>
                  <span class="new-val" :class="getDeltaClass(entry)"
                    >{{ entry.newValue }} {{ krUnit }}</span
                  >
                </div>
                <div class="timeline-progress" v-if="krTarget > 0">
                  <div class="progress-track">
                    <div
                      class="progress-fill"
                      :style="{
                        width: Math.min(100, Math.max(0, (entry.newValue / krTarget) * 100)) + '%',
                      }"
                    ></div>
                  </div>
                  <span class="progress-pct">
                    {{ Math.round((entry.newValue / krTarget) * 100) }}%
                  </span>
                </div>
                <p v-if="entry.note" class="timeline-note">"{{ entry.note }}"</p>
                <span class="timeline-updater">oleh: {{ entry.updatedBy }}</span>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const route = useRoute();
const auth = useAuthStore();
const config = useRuntimeConfig();

const krId = computed(() => route.query.krId);
const krTitle = computed(() =>
  route.query.krTitle ? decodeURIComponent(route.query.krTitle) : "",
);

const history = ref([]);
const loading = ref(false);
const filterFrom = ref("");
const filterTo = ref("");

const krTarget = computed(() =>
  route.query.krTarget ? parseFloat(route.query.krTarget) : 0,
);
const krUnit = computed(() =>
  route.query.krUnit ? decodeURIComponent(route.query.krUnit) : "",
);

const reversedHistory = computed(() => [...history.value].reverse());

const totalDelta = computed(() => {
  if (history.value.length === 0) return 0;
  const first = history.value[0].oldValue;
  const last = history.value[history.value.length - 1].newValue;
  return parseFloat((last - first).toFixed(2));
});

const chartData = computed(() => {
  const labels = history.value.map((e) => formatDate(e.updatedAt));
  const values = history.value.map((e) => e.newValue);

  return {
    labels,
    datasets: [
      {
        label: "Nilai Aktual",
        data: values,
        borderColor: "#0E97D6",
        backgroundColor: "rgba(14, 151, 214, 0.15)",
        fill: true,
        tension: 0.3,
        pointBackgroundColor: "#0E97D6",
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: `Target (${krTarget.value} ${krUnit.value})`,
        data: history.value.map(() => krTarget.value),
        borderColor: "#10B981",
        borderDash: [6, 4],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: {
        font: { family: "Rubik", size: 12 },
        color: "#94A3B8",
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} ${krUnit.value}`,
      },
    },
  },
  scales: {
    x: {
      ticks: {
        font: { family: "Rubik", size: 11 },
        color: "#64748B",
        maxRotation: 45,
      },
      grid: { color: "rgba(255, 255, 255, 0.06)" },
    },
    y: {
      ticks: {
        font: { family: "Rubik", size: 11 },
        color: "#64748B",
      },
      grid: { color: "rgba(255, 255, 255, 0.06)" },
    },
  },
};

async function fetchHistory() {
  if (!krId.value) return;

  loading.value = true;
  try {
    let url = `${config.public.apiBase}/key-results/${krId.value}/history`;
    const data = await $fetch(url, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    let result = data.sort(
      (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
    );

    if (filterFrom.value) {
      const fromDate = new Date(filterFrom.value);
      result = result.filter((e) => new Date(e.updatedAt) >= fromDate);
    }
    if (filterTo.value) {
      const toDate = new Date(filterTo.value);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter((e) => new Date(e.updatedAt) <= toDate);
    }

    history.value = result;
  } catch (err) {
    console.error("Fetch history error:", err);
  } finally {
    loading.value = false;
  }
}

function clearFilter() {
  filterFrom.value = "";
  filterTo.value = "";
  fetchHistory();
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDeltaClass(entry) {
  if (entry.newValue > entry.oldValue) return "positive";
  if (entry.newValue < entry.oldValue) return "negative";
  return "neutral";
}

onMounted(() => {
  fetchHistory();
});
</script>

<style scoped>
.history-root {
  padding: 2rem;
  background: var(--content-bg, #0f172a);
  min-height: 100vh;
  color: var(--text-color, #f8fafc);
  font-family: "Rubik", sans-serif;
}

.history-container {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.5rem;
}

.back-btn {
  display: inline-block;
  color: #38bdf8;
  text-decoration: none;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.history-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-gamma-050, #f8fafc);
  font-weight: 600;
}

.kr-title-display {
  color: var(--color-primary-shade, #94a3b8);
  font-size: 0.9rem;
  margin: 0.25rem 0 0;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.date-filter label {
  font-size: 0.8rem;
  color: #94a3b8;
}

.date-filter input {
  font-size: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  color: #f8fafc;
  font-family: "Rubik", sans-serif;
}

.clear-filter-btn {
  font-size: 0.8rem;
  padding: 0.3rem 0.6rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  color: #94a3b8;
  transition: background 150ms;
}

.clear-filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.loading-state,
.empty-state {
  padding: 3rem;
  text-align: center;
  color: #94a3b8;
}

.empty-hint {
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.chart-section {
  padding: 1.5rem;
}

.chart-section h3 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 600;
}

.chart-subtitle {
  margin: 0 0 1rem;
  font-size: 0.85rem;
  color: #94a3b8;
}

.chart-wrapper {
  height: 280px;
  position: relative;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  text-align: center;
}

.stat-label {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-val {
  font-size: 1.5rem;
  font-weight: 600;
}

.stat-val.highlight { color: #38bdf8; }
.stat-val.positive { color: #34d399; }
.stat-val.negative { color: #f87171; }

.timeline-section {
  padding: 1.5rem;
}

.timeline-section h3 {
  margin: 0 0 1.5rem;
  font-size: 1rem;
  font-weight: 600;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}

.timeline::before {
  content: "";
  position: absolute;
  left: 11px;
  top: 12px;
  bottom: 12px;
  width: 2px;
  background: rgba(255, 255, 255, 0.08);
}

.timeline-item {
  display: flex;
  gap: 1rem;
  padding-bottom: 1.5rem;
  position: relative;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 3px solid;
  background: #0f172a;
  position: relative;
  z-index: 1;
  margin-top: 2px;
}

.timeline-dot.positive { border-color: #34d399; }
.timeline-dot.negative { border-color: #f87171; }
.timeline-dot.neutral { border-color: #94a3b8; }

.timeline-item.latest .timeline-dot {
  background-color: #38bdf8;
  border-color: #38bdf8;
}

.timeline-content {
  flex: 1;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 1rem;
}

.timeline-item.latest .timeline-content {
  border-color: rgba(56, 189, 248, 0.3);
  background: rgba(56, 189, 248, 0.05);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.timeline-date {
  font-size: 0.8rem;
  color: #94a3b8;
}

.timeline-delta {
  font-size: 0.85rem;
  font-weight: 600;
}

.timeline-delta.positive { color: #34d399; }
.timeline-delta.negative { color: #f87171; }
.timeline-delta.neutral { color: #94a3b8; }

.timeline-values {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.old-val {
  font-size: 0.9rem;
  color: #64748b;
  text-decoration: line-through;
}

.arrow {
  color: #64748b;
  font-size: 0.8rem;
}

.new-val {
  font-size: 1rem;
  font-weight: 600;
}

.new-val.positive { color: #34d399; }
.new-val.negative { color: #f87171; }
.new-val.neutral { color: #f8fafc; }

.timeline-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.progress-track {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #38bdf8;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-pct {
  font-size: 0.75rem;
  color: #94a3b8;
  min-width: 36px;
  text-align: right;
}

.timeline-note {
  font-size: 0.82rem;
  color: #cbd5e1;
  font-style: italic;
  margin: 0.3rem 0 0.2rem;
  padding-left: 0.5rem;
  border-left: 2px solid rgba(56, 189, 248, 0.4);
}

.timeline-updater {
  font-size: 0.75rem;
  color: #64748b;
}
</style>

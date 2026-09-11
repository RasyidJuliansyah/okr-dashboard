<script setup lang="ts">
import { computed } from "vue";

interface LeaderAssignee {
  userId: string;
  name: string;
  role: string;
  raciRole: string;
}

interface MonthData {
  month: string;
  monthLabel: string;
  monthWeight: number;
  monthTarget: number;
  currentValue: number;
  progressPercent: number;
  status: string;
  isManualOverride: boolean;
  leaderAssignees: LeaderAssignee[];
}

interface AnnualKrBreakdown {
  id?: string;
  annualKrId?: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  bscPerspective: string;
  year: string;
  aggregatedProgress: number;
  months: MonthData[];
}

const props = defineProps<{
  annualKrs: AnnualKrBreakdown[];
  highlightMonth?: string;
}>();

const monthHeaders = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function getCellClass(monthData: MonthData, isHighlighted: boolean) {
  let cls = "matrix-cell ";
  if (monthData.monthWeight === 0 && monthData.monthTarget === 0) {
    cls += "status-empty";
  } else {
    cls += `status-${String(monthData.status).toLowerCase().replace("_", "-")}`;
  }
  if (isHighlighted) {
    cls += " highlight-col";
  }
  return cls;
}

function getPerspectiveClass(perspective: string) {
  const p = String(perspective).toUpperCase();
  switch (p) {
    case "FINANCIAL":
      return "badge-financial";
    case "CUSTOMER":
      return "badge-customer";
    case "INTERNAL_PROCESS":
    case "INTERNAL":
      return "badge-internal";
    case "LEARNING_GROWTH":
    case "LEARNING":
      return "badge-learning";
    default:
      return "badge-default";
  }
}

function getPerspectiveLabel(perspective: string) {
  const p = String(perspective).toUpperCase();
  switch (p) {
    case "FINANCIAL":
      return "Financial";
    case "CUSTOMER":
      return "Customer";
    case "INTERNAL_PROCESS":
    case "INTERNAL":
      return "Internal Process";
    case "LEARNING_GROWTH":
    case "LEARNING":
      return "Learning & Growth";
    default:
      return perspective;
  }
}
</script>

<template>
  <div class="matrix-table-container card">
    <div class="table-responsive">
      <table class="matrix-table">
        <thead>
          <tr>
            <th class="col-title">Key Result Tahunan (Perspektif)</th>
            <th
              v-for="(mName, idx) in monthHeaders"
              :key="mName"
              :class="[
                'col-month',
                {
                  'highlight-header':
                    highlightMonth &&
                    highlightMonth.endsWith(String(idx + 1).padStart(2, '0')),
                },
              ]"
            >
              {{ mName }}
            </th>
            <th class="col-ytd">YTD (Weighted)</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="akr in annualKrs"
            :key="akr.annualKrId || akr.id"
            class="matrix-row"
          >
            <td class="col-title">
              <div class="kr-title-cell">
                <span class="kr-title">{{ akr.title }}</span>
                <span
                  class="perspective-badge"
                  :class="getPerspectiveClass(akr.bscPerspective)"
                >
                  {{ getPerspectiveLabel(akr.bscPerspective) }}
                </span>
              </div>
            </td>
            <td
              v-for="(m, idx) in akr.months"
              :key="m.month"
              :class="getCellClass(m, highlightMonth === m.month)"
              :title="`${m.monthLabel}\nTarget: ${m.monthTarget} ${akr.unit}\nAktual: ${m.currentValue} ${akr.unit}\nBobot: ${Math.round(m.monthWeight * 100)}%\nStatus: ${m.status}${m.leaderAssignees?.length ? '\nLeader: ' + m.leaderAssignees.map((l) => l.name).join(', ') : ''}`"
            >
              <div class="cell-content">
                <span class="progress-pct">{{ m.progressPercent }}%</span>
                <span
                  v-if="m.isManualOverride"
                  class="override-indicator"
                  title="Manual Override oleh Leader"
                  >⚠️</span
                >
              </div>
            </td>
            <td class="col-ytd value-ytd">
              <span class="ytd-progress">{{ akr.aggregatedProgress }}%</span>
              <span class="ytd-absolute"
                >{{ akr.currentValue }} / {{ akr.targetValue }}
                {{ akr.unit }}</span
              >
            </td>
          </tr>
          <tr v-if="annualKrs.length === 0">
            <td colspan="14" class="empty-row">
              Tidak ada data Key Result tahunan.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.matrix-table-container {
  padding: 0;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.matrix-table th,
.matrix-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

.matrix-table th {
  background-color: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 12px;
}

.col-title {
  min-width: 250px;
}

.col-month {
  width: 55px;
  text-align: center;
}

.col-ytd {
  width: 120px;
  text-align: center;
  font-weight: bold;
}

.highlight-header {
  background-color: #f1f5f9 !important;
  color: #0f172a !important;
  font-weight: 700;
}

.kr-title-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kr-title {
  font-weight: 600;
  color: #0f172a;
  line-height: 1.4;
}

.perspective-badge {
  align-self: flex-start;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.badge-financial {
  background-color: #e0f2fe;
  color: #0369a1;
}
.badge-customer {
  background-color: #e0e7ff;
  color: #4338ca;
}
.badge-internal {
  background-color: #f3e8ff;
  color: #7e22ce;
}
.badge-learning {
  background-color: #dcfce7;
  color: #15803d;
}
.badge-default {
  background-color: #f1f5f9;
  color: #475569;
}

.matrix-cell {
  text-align: center;
  transition: all 0.2s;
  cursor: help;
}

.cell-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 11px;
}

.override-indicator {
  font-size: 10px;
}

.status-empty {
  background-color: #f8fafc;
  color: #94a3b8;
}
.status-on-track {
  background-color: #dcfce7;
  color: #15803d;
  font-weight: 500;
}
.status-at-risk {
  background-color: #fef3c7;
  color: #b45309;
  font-weight: 500;
}
.status-off-track {
  background-color: #fee2e2;
  color: #b91c1c;
  font-weight: 500;
}

.highlight-col {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
  position: relative;
  z-index: 10;
}

.value-ytd {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.ytd-progress {
  font-size: 14px;
  color: #0f172a;
}

.ytd-absolute {
  font-size: 10px;
  color: #64748b;
  font-weight: normal;
}

.empty-row {
  text-align: center;
  color: #64748b;
  padding: 30px !important;
}

.matrix-row:hover td {
  background-color: #f8fafc;
}
</style>

<template>
  <div class="list-view-wrapper">
    <div v-if="initiatives.length === 0" class="list-empty">
      Tidak ada inisiatif yang sesuai filter.
    </div>
    <div v-else class="list-table-scroll">
      <table class="list-table">
        <thead>
          <tr>
            <th class="col-no">No</th>
            <th class="col-title">Judul</th>
            <th class="col-type">Jenis</th>
            <th class="col-kr">Key Result</th>
            <th class="col-obj">Objective</th>
            <th class="col-assignee">Assignee</th>
            <th class="col-target">Target Capaian</th>
            <th class="col-date">End Date</th>
            <th class="col-status">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ini, idx) in initiatives" :key="ini.id">
            <td class="col-no">{{ idx + 1 }}</td>
            <td class="col-title">
              <span class="list-title-text">{{ ini.title }}</span>
            </td>
            <td class="col-type">
              <span
                class="type-badge"
                :class="getTypeBadgeClass(ini)"
                :style="ini.isCrossDept ? 'cursor: pointer;' : ''"
                :title="ini.isCrossDept ? 'Klik untuk diskusi Lintas Dept' : ''"
                @click.stop="ini.isCrossDept ? $emit('open-cross-dept', ini) : null"
              >
                {{ getTypeLabel(ini) }}
              </span>
            </td>
            <td class="col-kr" :title="ini.keyResult?.title || ''">{{ ini.keyResult?.title || '—' }}</td>
            <td class="col-obj" :title="ini.keyResult?.objective?.title || ''">{{ ini.keyResult?.objective?.title || '—' }}</td>
            <td class="col-assignee">{{ ini.owner?.name || '—' }}</td>
            <td class="col-target">
              <div class="target-cell">
                <span class="target-text">{{ formatProgress(ini) }}</span>
                <div class="mini-progress-bar">
                  <div
                    class="mini-progress-fill"
                    :style="{ width: getProgressPct(ini) + '%' }"
                    :class="getProgressColor(ini)"
                  />
                </div>
              </div>
            </td>
            <td class="col-date" :class="{ overdue: isOverdue(ini) }">
              {{ formatDateShort(ini.dueDate) || '—' }}
            </td>
            <td class="col-status">
              <span
                class="status-badge"
                :class="'status-' + (ini.kanbanStatus || 'TODO').toLowerCase()"
              >
                {{ statusLabel(ini.kanbanStatus) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { calculateProgressPercent } from "~/utils/formatters";

const props = defineProps<{
  initiatives: any[];
}>();

const emit = defineEmits<{
  (e: "open-cross-dept", ini: any): void;
}>();

function getTypeLabel(ini: any): string {
  if (ini.isCrossDept) return "Lintas Dept";
  if (ini.isTaskCard) return "Task Individu";
  return "Inisiatif";
}

function getTypeBadgeClass(ini: any): string {
  if (ini.isCrossDept) return "type-cross-dept";
  if (ini.isTaskCard) return "type-task";
  return "type-initiative";
}

function formatProgress(ini: any): string {
  const achieved =
    ini.achievedValue !== null && ini.achievedValue !== undefined
      ? ini.achievedValue
      : ini.currentValue ?? 0;
  const target = ini.targetValue ?? 0;
  const unit = ini.unit || "";
  const pct = getProgressPct(ini);
  return `${achieved}/${target} ${unit} (${pct}%)`;
}

function getProgressPct(ini: any): number {
  const achieved =
    ini.achievedValue !== null && ini.achievedValue !== undefined
      ? ini.achievedValue
      : ini.currentValue;
  return calculateProgressPercent(achieved, ini.targetValue, ini.targetType);
}

function getProgressColor(ini: any): string {
  const pct = getProgressPct(ini);
  if (pct >= 80) return "fill-green";
  if (pct >= 50) return "fill-yellow";
  return "fill-red";
}

function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(ini: any): boolean {
  if (!ini.dueDate) return false;
  if (ini.kanbanStatus === "DONE" || ini.kanbanStatus === "DROP") return false;
  return new Date(ini.dueDate) < new Date();
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    DONE: "Done",
    DROP: "Drop",
    NEED_INFO: "Need Info",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };
  return map[status] || status || "To Do";
}
</script>

<style scoped>
.list-view-wrapper {
  width: 100%;
}
.list-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted, #94a3b8);
  font-size: 0.9rem;
  background: var(--bg-card, #ffffff);
  border: 1px dashed var(--border-color, #e2e8f0);
  border-radius: 12px;
}
.list-table-scroll {
  width: 100%;
  overflow-x: auto;
}
.list-table {
  width: 100%;
  min-width: 950px;
  border-collapse: separate;
  border-spacing: 0;
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  overflow: hidden;
  font-size: 0.83rem;
}
.list-table thead th {
  background: var(--bg-input, #f8fafc);
  color: var(--text-secondary, #475569);
  font-weight: 700;
  padding: 10px 12px;
  text-align: left;
  border-bottom: 2px solid var(--border-color, #e2e8f0);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
}
.list-table tbody tr {
  transition: background 0.1s ease;
}
.list-table tbody tr:hover {
  background: rgba(14, 151, 214, 0.04);
}
.list-table tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color, #f1f5f9);
  color: var(--text-primary, #0f172a);
  vertical-align: middle;
}
.col-no {
  width: 40px;
  text-align: center;
  color: var(--text-muted, #94a3b8) !important;
  font-weight: 600;
}
.col-title {
  min-width: 180px;
}
.list-title-text {
  font-weight: 600;
  color: var(--text-primary, #0f172a);
}
.col-type {
  width: 110px;
}
.type-badge {
  font-size: 0.73rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  white-space: nowrap;
}
.type-initiative {
  background: #eff6ff;
  color: #2563eb;
}
.type-task {
  background: #f0fdf4;
  color: #16a34a;
}
.type-cross-dept {
  background: #fffbeb;
  color: #d97706;
}
.col-kr,
.col-obj {
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-secondary, #64748b);
  font-size: 0.8rem;
}
.col-assignee {
  white-space: nowrap;
  font-weight: 500;
}
.col-target {
  min-width: 130px;
}
.target-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.target-text {
  font-size: 0.78rem;
  color: var(--text-secondary, #64748b);
}
.mini-progress-bar {
  width: 100%;
  height: 4px;
  background: var(--bg-input, #e2e8f0);
  border-radius: 4px;
  overflow: hidden;
}
.mini-progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}
.fill-green {
  background: #10b981;
}
.fill-yellow {
  background: #f59e0b;
}
.fill-red {
  background: #ef4444;
}
.col-date {
  white-space: nowrap;
  font-size: 0.8rem;
}
.col-date.overdue {
  color: #ef4444;
  font-weight: 700;
}
.col-status {
  width: 100px;
}
.status-badge {
  font-size: 0.73rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
}
.status-todo {
  background: #f1f5f9;
  color: #64748b;
}
.status-in_progress {
  background: rgba(14, 151, 214, 0.12);
  color: #0e97d6;
}
.status-done {
  background: #ecfdf5;
  color: #059669;
}
.status-drop {
  background: #fef2f2;
  color: #dc2626;
}
.status-need_info {
  background: #fffbeb;
  color: #d97706;
}
.status-resolved {
  background: #eff6ff;
  color: #2563eb;
}
.status-closed {
  background: #f3f4f6;
  color: #6b7280;
}
</style>

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
              <button
                type="button"
                class="list-title-link"
                :title="'Lihat detail ' + getTypeLabel(ini) + ': ' + ini.title"
                @click="openDetailModal(ini)"
              >
                {{ ini.title }}
              </button>
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

    <!-- ─── Modal Detail Task-Card / Inisiatif-Card ─── -->
    <div
      v-if="showDetailModal && selectedItem"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      @click.self="closeDetailModal"
    >
      <div class="modal-box detail-modal-box">
        <div class="modal-header">
          <div class="modal-header-left">
            <span class="type-badge" :class="getTypeBadgeClass(selectedItem)">
              {{ getTypeLabel(selectedItem) }}
            </span>
            <span
              class="status-badge"
              :class="'status-' + (selectedItem.kanbanStatus || 'TODO').toLowerCase()"
            >
              {{ statusLabel(selectedItem.kanbanStatus) }}
            </span>
          </div>
          <button
            type="button"
            class="modal-close-btn"
            aria-label="Tutup modal"
            @click="closeDetailModal"
          >
            &times;
          </button>
        </div>

        <div class="modal-body-scroll">
          <!-- Judul & Deskripsi -->
          <div class="detail-title-section">
            <h3 id="detail-modal-title" class="detail-main-title">
              {{ selectedItem.title }}
            </h3>
            <p v-if="selectedItem.description" class="detail-desc">
              {{ selectedItem.description }}
            </p>
            <p v-else class="detail-desc-empty">Tidak ada deskripsi.</p>

            <div v-if="selectedItem.link" class="detail-link-row">
              <a
                :href="
                  selectedItem.link.startsWith('http')
                    ? selectedItem.link
                    : `https://${selectedItem.link}`
                "
                target="_blank"
                rel="noopener noreferrer"
                class="detail-external-link"
              >
                🔗 Tautan Dokumen Pendukung ↗
              </a>
            </div>
          </div>

          <!-- Progress Bar Card -->
          <div class="detail-progress-card">
            <div class="progress-info-row">
              <span class="progress-label">Target & Capaian:</span>
              <strong class="progress-val">{{ formatProgress(selectedItem) }}</strong>
            </div>
            <div class="detail-progress-bar">
              <div
                class="detail-progress-fill"
                :style="{ width: getProgressPct(selectedItem) + '%' }"
                :class="getProgressColor(selectedItem)"
              />
            </div>
          </div>
          <!-- Metadata Grid -->
          <div class="detail-meta-grid">
            <div class="meta-item">
              <span class="meta-label">Jenis Card</span>
              <span class="meta-value">{{ getTypeLabel(selectedItem) }}</span>
            </div>

            <div class="meta-item">
              <span class="meta-label">Status</span>
              <span class="meta-value">{{ statusLabel(selectedItem.kanbanStatus) }}</span>
            </div>

            <div class="meta-item">
              <span class="meta-label">Assignee / PIC</span>
              <span class="meta-value font-medium">{{ getAssigneeName(selectedItem) }}</span>
            </div>

            <div class="meta-item">
              <span class="meta-label">Departemen / Tim</span>
              <span class="meta-value">
                <template v-if="selectedItem.isCrossDept">
                  {{ selectedItem.creatorDept || "—" }} ➔ {{ selectedItem.targetDept || "—" }}
                </template>
                <template v-else>
                  {{ selectedItem.team?.name || selectedItem.department || "—" }}
                </template>
              </span>
            </div>

            <div class="meta-item">
              <span class="meta-label">Key Result Induk</span>
              <span class="meta-value" :title="selectedItem.keyResult?.title || ''">
                {{ selectedItem.keyResult?.title || "—" }}
              </span>
            </div>

            <div class="meta-item">
              <span class="meta-label">Objective</span>
              <span class="meta-value" :title="selectedItem.keyResult?.objective?.title || ''">
                {{ selectedItem.keyResult?.objective?.title || "—" }}
              </span>
            </div>

            <div v-if="selectedItem.parentInitiativeTitle" class="meta-item">
              <span class="meta-label">Inisiatif Induk</span>
              <span class="meta-value">{{ selectedItem.parentInitiativeTitle }}</span>
            </div>

            <div v-if="selectedItem.assignedLeader?.name" class="meta-item">
              <span class="meta-label">Leader</span>
              <span class="meta-value">{{ selectedItem.assignedLeader.name }}</span>
            </div>

            <div class="meta-item">
              <span class="meta-label">Sprint / Periode</span>
              <span class="meta-value">
                {{ selectedItem.sprint?.name || formatSprintLabel(selectedItem.sprintMonth) || "—" }}
              </span>
            </div>

            <div class="meta-item">
              <span class="meta-label">Jadwal / Timeline</span>
              <span class="meta-value" :class="{ 'text-danger': isOverdue(selectedItem) }">
                {{ formatDateShort(selectedItem.startDate) || "—" }} – {{ formatDateShort(selectedItem.dueDate) || "—" }}
                <span v-if="isOverdue(selectedItem)" class="overdue-pill">Terlambat</span>
              </span>
            </div>
          </div>

          <!-- Lintas Dept Callout (if cross dept) -->
          <div v-if="selectedItem.isCrossDept" class="cross-dept-callout">
            <div class="cross-dept-callout-text">
              <span class="callout-title">⚡ Tugas Lintas Departemen</span>
              <span class="callout-sub">
                Koordinasi antara <strong>{{ selectedItem.creatorDept || "—" }}</strong> dan <strong>{{ selectedItem.targetDept || "—" }}</strong>.
              </span>
            </div>
            <button
              type="button"
              class="modal-btn modal-btn-amber"
              @click="openCrossDeptFromDetail(selectedItem)"
            >
              🔍 Buka Ruang Diskusi Lintas Dept
            </button>
          </div>

          <!-- Subtasks Section (if initiative has tasks) -->
          <div v-if="selectedItem.tasks?.length" class="detail-subtasks-section">
            <div class="subtasks-header">
              <span class="section-title">Daftar Sub-Task</span>
              <span class="section-count">{{ selectedItem.tasks.length }} task</span>
            </div>
            <div class="subtasks-table-wrapper">
              <table class="subtasks-table">
                <thead>
                  <tr>
                    <th>Judul Task</th>
                    <th>Status</th>
                    <th>PIC</th>
                    <th>Target / Progress</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="st in selectedItem.tasks" :key="st.id">
                    <td class="st-title">{{ st.title }}</td>
                    <td class="st-status">
                      <span
                        class="status-badge"
                        :class="'status-' + (st.kanbanStatus || st.status || 'TODO').toLowerCase()"
                      >
                        {{ statusLabel(st.kanbanStatus || st.status) }}
                      </span>
                    </td>
                    <td class="st-pic">{{ getTaskAssigneeName(st) }}</td>
                    <td class="st-prog">
                      {{ formatProgressRange(st.currentValue, st.targetValue, st.unit, st.targetType) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button
            v-if="selectedItem.isCrossDept"
            type="button"
            class="modal-btn modal-btn-amber"
            @click="openCrossDeptFromDetail(selectedItem)"
          >
            💬 Diskusi Lintas Dept
          </button>
          <button
            type="button"
            class="modal-btn modal-btn-secondary"
            @click="closeDetailModal"
          >
            Tutup
          </button>
          <button
            type="button"
            class="modal-btn modal-btn-primary"
            @click="openProgressModal(selectedItem)"
          >
            Update Capaian
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Modal Laporkan Progress Inisiatif / Task ─── -->
    <div
      v-if="showProgressModal && selectedItem"
      class="modal-overlay progress-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="progress-modal-title"
      @click.self="closeProgressModal"
    >
      <div class="modal-box progress-modal-box">
        <div class="modal-header">
          <div class="modal-header-left">
            <span class="type-badge" :class="getTypeBadgeClass(selectedItem)">
              {{ getTypeLabel(selectedItem) }}
            </span>
            <h3 id="progress-modal-title" class="progress-modal-title">
              {{ isTaskItem(selectedItem) ? "Laporkan Progress Task" : "Laporkan Progress Inisiatif" }}
            </h3>
          </div>
          <button
            type="button"
            class="modal-close-btn"
            aria-label="Tutup modal"
            @click="closeProgressModal"
          >
            &times;
          </button>
        </div>

        <div class="modal-body-scroll">
          <div class="progress-target-summary">
            <div class="target-summary-title">
              <span class="summary-label">{{ isTaskItem(selectedItem) ? "Task:" : "Inisiatif:" }}</span>
              <strong>{{ selectedItem.title }}</strong>
            </div>
            <div class="target-summary-metrics">
              <div class="metric-item">
                <span class="metric-label">Target</span>
                <span class="metric-value">{{ selectedItem.targetValue ?? 0 }} {{ selectedItem.unit || "%" }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Saat Ini</span>
                <span class="metric-value">{{ getItemCurrentVal(selectedItem) }} {{ selectedItem.unit || "%" }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Status Saat Ini</span>
                <span class="metric-value">{{ statusLabel(selectedItem.kanbanStatus) }}</span>
              </div>
            </div>
            <div
              v-if="!isTaskItem(selectedItem) && selectedItem.tasks?.length"
              class="target-summary-notice"
            >
              ℹ️ Inisiatif ini memiliki {{ selectedItem.tasks.length }} task terkait. Pelaporan manual akan memperbarui capaian langsung.
            </div>
          </div>

          <!-- Status Pekerjaan (Kanban) jika inisiatif -->
          <div v-if="!isTaskItem(selectedItem)" class="form-group">
            <label class="form-label">Status Pekerjaan (Kanban)</label>
            <select v-model="progressForm.kanbanStatus" class="form-input">
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
              <option value="DROP">Drop</option>
            </select>
          </div>

          <!-- Nilai Realisasi -->
          <div class="form-group">
            <label class="form-label">
              {{ isTaskItem(selectedItem) ? "Nilai Baru (Kumulatif) *" : "Nilai Realisasi Saat Ini *" }}
              <span class="unit-pill">Satuan: {{ selectedItem.unit || "%" }}</span>
            </label>
            <input
              v-model.number="progressForm.newValue"
              type="number"
              step="any"
              class="form-input"
              :placeholder="'Contoh: ' + (selectedItem.targetValue || 100)"
              required
            />
          </div>

          <!-- Catatan Progress / Notes -->
          <div class="form-group">
            <label class="form-label">Catatan Progress / Notes *</label>
            <textarea
              v-model="progressForm.note"
              class="form-input"
              rows="3"
              placeholder="Informasi detail pekerjaan, capaian, kendala, atau note penting..."
              required
            ></textarea>
          </div>

          <!-- Link Dokumentasi -->
          <div class="form-group">
            <label class="form-label">Link Dokumentasi Hasil (opsional)</label>
            <input
              v-model="progressForm.link"
              type="url"
              class="form-input"
              placeholder="https://..."
            />
          </div>

          <div v-if="progressError" class="alert alert-error">
            {{ progressError }}
          </div>
          <div v-if="progressSuccess" class="alert alert-success">
            {{ progressSuccess }}
          </div>
        </div>

        <div class="modal-actions">
          <button
            type="button"
            class="modal-btn modal-btn-secondary"
            :disabled="isSubmittingProgress"
            @click="closeProgressModal"
          >
            Batal
          </button>
          <button
            type="button"
            class="modal-btn modal-btn-primary"
            :disabled="isSubmittingProgress"
            @click="submitProgressUpdate"
          >
            {{ isSubmittingProgress ? "Menyimpan..." : "Kirim Laporan" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRuntimeConfig } from "#app";
import { useAuthStore } from "~/stores/auth";
import { calculateProgressPercent, formatProgressRange } from "~/utils/formatters";

const props = defineProps<{
  initiatives: any[];
}>();

const emit = defineEmits<{
  (e: "open-cross-dept", ini: any): void;
  (e: "open-detail", ini: any): void;
  (e: "progress-updated"): void;
}>();

const auth = useAuthStore();
const config = useRuntimeConfig();
const API = config.public?.apiBase || "/api";

function getHeaders() {
  const token =
    auth.token ||
    (typeof localStorage !== "undefined"
      ? localStorage.getItem("token")
      : null);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const selectedItem = ref<any>(null);
const showDetailModal = ref(false);

const showProgressModal = ref(false);
const isSubmittingProgress = ref(false);
const progressError = ref("");
const progressSuccess = ref("");
const progressForm = ref({
  newValue: 0,
  note: "",
  kanbanStatus: "TODO",
  link: "",
});

function isTaskItem(item: any): boolean {
  if (!item) return false;
  return Boolean(
    item.isTaskCard || item.taskId || String(item.id).startsWith("task-"),
  );
}

function getCleanTaskId(item: any): string {
  if (item.taskId) return String(item.taskId);
  return String(item.id).replace(/^task-/, "");
}

function getCleanInitiativeId(item: any): string {
  return String(item.id).replace(/^task-/, "");
}

function getItemCurrentVal(item: any): number {
  if (!item) return 0;
  if (item.achievedValue !== null && item.achievedValue !== undefined) {
    return item.achievedValue;
  }
  return item.currentValue ?? 0;
}

function openDetailModal(ini: any) {
  selectedItem.value = ini;
  showDetailModal.value = true;
  emit("open-detail", ini);
}

function closeDetailModal() {
  showDetailModal.value = false;
  selectedItem.value = null;
}

function openCrossDeptFromDetail(ini: any) {
  closeDetailModal();
  emit("open-cross-dept", ini);
}

function openProgressModal(item?: any) {
  const target = item || selectedItem.value;
  if (!target) return;
  progressForm.value = {
    newValue: getItemCurrentVal(target),
    note: "",
    kanbanStatus: target.kanbanStatus || "TODO",
    link: "",
  };
  progressError.value = "";
  progressSuccess.value = "";
  showProgressModal.value = true;
}

function closeProgressModal() {
  showProgressModal.value = false;
  progressError.value = "";
  progressSuccess.value = "";
}

async function submitProgressUpdate() {
  if (
    progressForm.value.newValue === undefined ||
    progressForm.value.newValue === null ||
    isNaN(Number(progressForm.value.newValue))
  ) {
    progressError.value = "Nilai realisasi wajib diisi dengan angka valid";
    return;
  }
  if (!progressForm.value.note || !progressForm.value.note.trim()) {
    progressError.value = "Catatan progress wajib diisi";
    return;
  }

  isSubmittingProgress.value = true;
  progressError.value = "";

  try {
    const item = selectedItem.value;
    const isTask = isTaskItem(item);
    const endpoint = isTask
      ? `${API}/initiatives/tasks/${getCleanTaskId(item)}/updates`
      : `${API}/initiatives/${getCleanInitiativeId(item)}/progress-updates`;

    const bodyPayload = isTask
      ? {
          newValue: Number(progressForm.value.newValue),
          note: progressForm.value.note.trim(),
          link: progressForm.value.link?.trim() || undefined,
        }
      : {
          newValue: Number(progressForm.value.newValue),
          note: progressForm.value.note.trim(),
          kanbanStatus: progressForm.value.kanbanStatus,
          link: progressForm.value.link?.trim() || undefined,
        };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(bodyPayload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Gagal menyimpan laporan progress");
    }

    const val = Number(progressForm.value.newValue);
    item.currentValue = val;
    item.achievedValue = val;
    if (!isTask && progressForm.value.kanbanStatus) {
      item.kanbanStatus = progressForm.value.kanbanStatus;
    }

    progressSuccess.value = "Laporan progress berhasil disimpan!";
    emit("progress-updated");

    setTimeout(() => {
      closeProgressModal();
    }, 800);
  } catch (err: any) {
    progressError.value = err.message || "Terjadi kesalahan";
  } finally {
    isSubmittingProgress.value = false;
  }
}

function getAssigneeName(ini: any): string {
  if (ini.owner?.name) return ini.owner.name;
  if (ini.assignedTeamMember?.name) return ini.assignedTeamMember.name;
  if (ini.assignments && ini.assignments.length > 0) {
    const names = ini.assignments
      .map((a: any) => a.user?.name || a.userName)
      .filter(Boolean);
    if (names.length > 0) return names.join(", ");
  }
  return "—";
}

function getTaskAssigneeName(task: any): string {
  if (task.assignedTeamMember?.name) return task.assignedTeamMember.name;
  if (task.assignments && task.assignments.length > 0) {
    const names = task.assignments
      .map((a: any) => a.user?.name || a.userName)
      .filter(Boolean);
    if (names.length > 0) return names.join(", ");
  }
  return task.owner?.name || "—";
}

function formatSprintLabel(sprint: string | null | undefined): string {
  if (!sprint) return "";
  if (/^\d{4}-\d{2}$/.test(sprint)) {
    const [year, month] = sprint.split("-");
    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const mIdx = parseInt(month, 10) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return `${monthNames[mIdx]} ${year}`;
    }
  }
  return sprint;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    if (showProgressModal.value) {
      closeProgressModal();
    } else if (showDetailModal.value) {
      closeDetailModal();
    }
  }
}

onMounted(() => {
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", onKeydown);
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", onKeydown);
  }
});

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
.list-title-link {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  font-weight: 600;
  color: #0284c7;
  text-align: left;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: rgba(2, 132, 199, 0.4);
  display: inline;
  transition: color 0.15s ease, text-decoration-color 0.15s ease;
  line-height: 1.4;
}
.list-title-link:hover {
  color: #0369a1;
  text-decoration-color: #0369a1;
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

/* ─── Detail Modal Styles ─── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.detail-modal-box {
  background: var(--bg-card, #ffffff);
  color: var(--text-primary, #0f172a);
  border-radius: 16px;
  width: 100%;
  max-width: 660px;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color, #e2e8f0);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: color 0.15s ease, background 0.15s ease;
}

.modal-close-btn:hover {
  color: var(--text-primary, #0f172a);
  background: var(--bg-input, #f1f5f9);
}

.modal-body-scroll {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-main-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  line-height: 1.4;
}

.detail-desc {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary, #475569);
  line-height: 1.5;
  white-space: pre-line;
}

.detail-desc-empty {
  margin: 0;
  font-size: 0.82rem;
  color: var(--text-muted, #94a3b8);
  font-style: italic;
}

.detail-link-row {
  margin-top: 4px;
}

.detail-external-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #0284c7;
  text-decoration: none;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 4px 10px;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.detail-external-link:hover {
  background: #dbeafe;
}

.detail-progress-card {
  background: var(--bg-input, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
}

.progress-label {
  color: var(--text-secondary, #64748b);
  font-weight: 500;
}

.progress-val {
  color: var(--text-primary, #0f172a);
}

.detail-progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  overflow: hidden;
}

.detail-progress-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease;
}

.detail-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (max-width: 540px) {
  .detail-meta-grid {
    grid-template-columns: 1fr;
  }
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  background: var(--bg-input, #f8fafc);
  border: 1px solid var(--border-color, #f1f5f9);
  border-radius: 8px;
  padding: 8px 12px;
}

.meta-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-muted, #94a3b8);
}

.meta-value {
  font-size: 0.83rem;
  color: var(--text-primary, #0f172a);
  word-break: break-word;
}

.meta-value.font-medium {
  font-weight: 600;
}

.meta-value.text-danger {
  color: #ef4444;
  font-weight: 600;
}

.overdue-pill {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  font-size: 0.68rem;
  font-weight: 700;
  border-radius: 4px;
  background: #fee2e2;
  color: #dc2626;
}
.cross-dept-callout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 10px;
  padding: 12px 14px;
}

.cross-dept-callout-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.callout-title {
  font-weight: 700;
  font-size: 0.82rem;
  color: #b45309;
}

.callout-sub {
  font-size: 0.78rem;
  color: #92400e;
}

.detail-subtasks-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subtasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--text-primary, #0f172a);
}

.section-count {
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
}

.subtasks-table-wrapper {
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  overflow: hidden;
}

.subtasks-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.subtasks-table th {
  background: var(--bg-input, #f8fafc);
  color: var(--text-secondary, #475569);
  padding: 6px 10px;
  text-align: left;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  font-weight: 600;
}

.subtasks-table td {
  padding: 6px 10px;
  border-bottom: 1px solid var(--border-color, #f1f5f9);
  color: var(--text-primary, #0f172a);
}

.subtasks-table tbody tr:last-child td {
  border-bottom: none;
}

.st-title {
  font-weight: 600;
}

.st-pic {
  white-space: nowrap;
  color: var(--text-secondary, #64748b);
}

.st-prog {
  white-space: nowrap;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-input, #f8fafc);
}

.modal-btn {
  padding: 7px 16px;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
}

.modal-btn-primary {
  background: #0ea5e9;
  color: white;
}

.modal-btn-primary:hover {
  background: #0284c7;
}

.modal-btn-secondary {
  background: var(--bg-card, #ffffff);
  color: var(--text-secondary, #475569);
  border: 1px solid var(--border-color, #cbd5e1);
}

.modal-btn-secondary:hover {
  background: var(--bg-input, #f1f5f9);
}

.modal-btn-amber {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.modal-btn-amber:hover {
  background: #fde68a;
}

/* ─── Dark Theme Overrides for Modal ─── */
:global(.dark-theme) .list-title-link {
  color: #38bdf8;
  text-decoration-color: rgba(56, 189, 248, 0.4);
}

:global(.dark-theme) .list-title-link:hover {
  color: #7dd3fc;
  text-decoration-color: #7dd3fc;
}

:global(.dark-theme) .detail-modal-box {
  background: #1e293b;
  border-color: #334155;
  color: #f8fafc;
}

:global(.dark-theme) .modal-header,
:global(.dark-theme) .modal-actions {
  border-color: #334155;
  background: #0f172a;
}

:global(.dark-theme) .detail-progress-card,
:global(.dark-theme) .meta-item {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

:global(.dark-theme) .detail-progress-bar {
  background: rgba(255, 255, 255, 0.1);
}

:global(.dark-theme) .subtasks-table-wrapper {
  border-color: #334155;
}

:global(.dark-theme) .subtasks-table th {
  background: #0f172a;
  border-color: #334155;
  color: #94a3b8;
}

:global(.dark-theme) .subtasks-table td {
  border-color: #334155;
  color: #f8fafc;
}

:global(.dark-theme) .modal-close-btn:hover {
  background: #334155;
}

:global(.dark-theme) .modal-btn-secondary {
  background: #1e293b;
  color: #cbd5e1;
  border-color: #475569;
}

:global(.dark-theme) .modal-btn-secondary:hover {
  background: #334155;
}

:global(.dark-theme) .cross-dept-callout {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.25);
}

:global(.dark-theme) .callout-title {
  color: #fcd34d;
}

:global(.dark-theme) .callout-sub {
  color: #fde68a;
}

:global(.dark-theme) .detail-external-link {
  background: rgba(14, 165, 233, 0.15);
  border-color: rgba(14, 165, 233, 0.3);
  color: #38bdf8;
}

:global(.dark-theme) .detail-external-link:hover {
  background: rgba(14, 165, 233, 0.25);
}

/* ─── Progress Modal Specific Styles ─── */
.progress-modal-overlay {
  z-index: 1100;
}

.progress-modal-box {
  background: var(--bg-card, #ffffff);
  color: var(--text-primary, #0f172a);
  border-radius: 16px;
  width: 100%;
  max-width: 540px;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-color, #e2e8f0);
  overflow: hidden;
}

.progress-modal-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}

.progress-target-summary {
  background: var(--bg-input, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.target-summary-title {
  font-size: 0.85rem;
  color: var(--text-primary, #0f172a);
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.summary-label {
  color: var(--text-muted, #94a3b8);
  font-weight: 600;
}

.target-summary-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 6px;
  border-top: 1px dashed var(--border-color, #e2e8f0);
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted, #94a3b8);
  text-transform: uppercase;
}

.metric-value {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
}

.target-summary-notice {
  font-size: 0.75rem;
  color: var(--text-secondary, #64748b);
  background: rgba(14, 165, 233, 0.08);
  padding: 6px 10px;
  border-radius: 6px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.unit-pill {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-muted, #94a3b8);
}

.form-input {
  width: 100%;
  padding: 9px 12px;
  font-size: 0.85rem;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  color: var(--text-primary, #0f172a);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  box-sizing: border-box;
  font-family: inherit;
}

.form-input:focus {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
}

.alert {
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
}

.alert-error {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
}

.alert-success {
  background: #dcfce7;
  border: 1px solid #86efac;
  color: #166534;
}

/* Dark mode for progress modal */
:global(.dark-theme) .progress-modal-box {
  background: #1e293b;
  border-color: #334155;
  color: #f8fafc;
}

:global(.dark-theme) .progress-modal-title {
  color: #f8fafc;
}

:global(.dark-theme) .progress-target-summary {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

:global(.dark-theme) .target-summary-metrics {
  border-color: rgba(255, 255, 255, 0.08);
}

:global(.dark-theme) .form-label {
  color: #cbd5e1;
}

:global(.dark-theme) .form-input {
  background: #0f172a;
  border-color: #334155;
  color: #f8fafc;
}

:global(.dark-theme) .form-input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
}
</style>

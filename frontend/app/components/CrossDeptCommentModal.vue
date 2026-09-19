<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box cross-dept-modal">
      <div class="modal-header-amber">
        <div class="header-tag-row">
          <span class="badge-amber-tag">Tugas Lintas Departemen</span>
          <span v-if="task?.initiative" class="badge-sub-tag linked">Terkait: {{ task.initiative.title }}</span>
          <span v-else class="badge-sub-tag standalone">Tugas Mandiri</span>
        </div>
        <button class="modal-close-btn" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body-scroll" v-if="loading && !task">
        <div class="loading-state">Memuat detail tugas...</div>
      </div>

      <div class="modal-body-scroll" v-else-if="task">
        <div class="task-title-section">
          <h2 class="task-modal-title">{{ task.title }}</h2>
          <p v-if="task.description" class="task-modal-desc">{{ task.description }}</p>
          <a v-if="task.link" :href="task.link.startsWith('http') ? task.link : `https://${task.link}`" target="_blank" rel="noopener noreferrer" class="task-external-link">🔗 Tautan Dokumen</a>
        </div>

        <div class="task-meta-grid">
          <div class="meta-item">
            <span class="meta-label">Pemohon:</span>
            <span class="meta-val highlight-creator">{{ task.creator?.name || "Saya" }} ({{ task.creatorDept || "—" }})</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Tujuan:</span>
            <span class="meta-val highlight-target">{{ task.targetDept || "—" }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Pelaksana:</span>
            <span class="meta-val">{{ task.assignedTeamMember?.name || "Belum didisposisikan" }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Tenggat:</span>
            <span class="meta-val">{{ formatDate(task.finishDate) }}</span>
          </div>
        </div>

        <div class="lifecycle-bar-section">
          <div class="lifecycle-header">
            <span class="lifecycle-title">Lifecycle</span>
            <span class="current-status-pill" :class="task.kanbanStatus?.toLowerCase()">{{ formatStatusLabel(task.kanbanStatus) }}</span>
          </div>

          <div class="lifecycle-steps">
            <div class="step-item" :class="{ current: task.kanbanStatus === 'TODO' }">TODO</div>
            <div class="step-arrow">➔</div>
            <div class="step-item" :class="{ current: task.kanbanStatus === 'IN_PROGRESS' }">IN PROGRESS</div>
            <div class="step-arrow">⇄</div>
            <div class="step-item" :class="{ current: task.kanbanStatus === 'NEED_INFO' }">NEED INFO</div>
            <div class="step-arrow">➔</div>
            <div class="step-item" :class="{ current: task.kanbanStatus === 'RESOLVED' }">RESOLVED</div>
            <div class="step-arrow">➔</div>
            <div class="step-item" :class="{ current: task.kanbanStatus === 'CLOSED' }">CLOSED</div>
          </div>

          <div class="status-actions-row">
            <button v-if="task.kanbanStatus !== 'NEED_INFO' && task.kanbanStatus !== 'CLOSED'" class="btn-lifecycle need-info" :disabled="updatingStatus" @click="changeStatus('NEED_INFO')">❓ Klarifikasi</button>
            <button v-if="task.kanbanStatus === 'NEED_INFO' || task.kanbanStatus === 'TODO'" class="btn-lifecycle in-progress" :disabled="updatingStatus" @click="changeStatus('IN_PROGRESS')">⚡ Kerjakan</button>
            <button v-if="task.kanbanStatus !== 'RESOLVED' && task.kanbanStatus !== 'CLOSED'" class="btn-lifecycle resolved" :disabled="updatingStatus" @click="changeStatus('RESOLVED')">✅ Selesai</button>
            <button v-if="canCloseOrReopen && task.kanbanStatus !== 'CLOSED'" class="btn-lifecycle close-btn" :disabled="updatingStatus" @click="changeStatus('CLOSED')">🔒 Close</button>
            <button v-if="canCloseOrReopen && (task.kanbanStatus === 'CLOSED' || task.kanbanStatus === 'RESOLVED')" class="btn-lifecycle reopen-btn" :disabled="updatingStatus" @click="changeStatus('IN_PROGRESS')">🔄 Reopen</button>
          </div>
          <div v-if="statusError" class="status-error-msg">{{ statusError }}</div>
        </div>
        <div v-if="canReassign" class="reassign-box">
          <div class="reassign-title">Disposisikan ke Anggota Tim Departemen {{ task.targetDept }}</div>
          <div class="reassign-row">
            <select v-model="selectedAssigneeId" class="reassign-select">
              <option value="">-- Pilih Anggota Tim --</option>
              <option v-for="user in targetDeptUsers" :key="user.id" :value="user.id">
                {{ user.name }} ({{ user.position || user.role }})
              </option>
            </select>
            <button class="reassign-btn" :disabled="!selectedAssigneeId || reassigning" @click="doReassign">
              {{ reassigning ? "Menyimpan..." : "Disposisikan" }}
            </button>
          </div>
        </div>

        <div class="discussion-section">
          <div class="discussion-header">
            <h3 class="discussion-title">💬 Diskusi & Klarifikasi ({{ comments.length }})</h3>
            <span v-if="task.kanbanStatus === 'NEED_INFO'" class="need-info-pulse">Membutuhkan Respons</span>
          </div>

          <div class="comments-list">
            <div v-if="comments.length === 0" class="no-comments">
              Belum ada pesan diskusi. Gunakan kolom di bawah untuk berdiskusi.
            </div>
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="comment-card"
              :class="{ 'is-me': comment.userId === currentUserId, 'is-creator': comment.userId === task.creatorId }"
            >
              <div class="comment-meta">
                <span class="comment-author">{{ comment.user?.name || "Anggota Tim" }}</span>
                <span v-if="comment.userId === task.creatorId" class="badge-role-creator">Requester</span>
                <span v-if="comment.user?.role" class="badge-role-pill">{{ comment.user.role }}</span>
                <span v-if="comment.user?.department" class="badge-dept-pill">{{ comment.user.department }}</span>
                <span class="comment-time">{{ formatTimeAgo(comment.createdAt) }}</span>
              </div>
              <div class="comment-message">{{ comment.message }}</div>
              <a v-if="comment.attachmentLink" :href="comment.attachmentLink.startsWith('http') ? comment.attachmentLink : `https://${comment.attachmentLink}`" target="_blank" rel="noopener noreferrer" class="comment-attachment">📎 Lampiran</a>
            </div>
          </div>

          <div class="comment-input-box">
            <textarea v-model="newCommentMessage" class="comment-textarea" placeholder="Tulis pesan diskusi atau klarifikasi di sini..." rows="3"></textarea>
            <div class="comment-extra-row">
              <input v-model="newCommentAttachment" type="text" class="comment-link-input" placeholder="Tautan lampiran (opsional)..." />
              <button class="comment-send-btn" :disabled="!newCommentMessage.trim() || sendingComment" @click="sendComment">
                {{ sendingComment ? "Mengirim..." : "Kirim Pesan" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRuntimeConfig } from "#app";

const props = defineProps<{
  isOpen: boolean;
  taskId: string | null;
  currentUser?: any;
}>();

const emit = defineEmits(["close", "task-updated", "comment-added"]);

const config = useRuntimeConfig();
const API = config.public.apiBase;

function getHeaders() {
  const token = localStorage.getItem("token") || "";
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

const task = ref<any>(null);
const comments = ref<any[]>([]);
const targetDeptUsers = ref<any[]>([]);
const loading = ref(false);
const updatingStatus = ref(false);
const reassigning = ref(false);
const sendingComment = ref(false);
const statusError = ref("");

const newCommentMessage = ref("");
const newCommentAttachment = ref("");
const selectedAssigneeId = ref("");

const currentUserId = computed(() => props.currentUser?.id || localStorage.getItem("userId") || "");
const currentUserRole = computed(() => props.currentUser?.role || localStorage.getItem("userRole") || "");
const currentUserDept = computed(() => props.currentUser?.department || localStorage.getItem("userDept") || "");

const canCloseOrReopen = computed(() => {
  if (!task.value) return false;
  const isCreator = task.value.creatorId === currentUserId.value;
  const isAdmin = currentUserRole.value === "ADMIN";
  const isCreatorManager =
    currentUserRole.value === "MANAGER" &&
    task.value.creatorDept &&
    currentUserDept.value === task.value.creatorDept;
  return isCreator || isAdmin || isCreatorManager;
});

const canReassign = computed(() => {
  if (!task.value) return false;
  const isAdmin = currentUserRole.value === "ADMIN";
  const isCreator = task.value.creatorId === currentUserId.value;
  const isTargetMP =
    ["MANAGER", "LEADER"].includes(currentUserRole.value) &&
    task.value.targetDept &&
    currentUserDept.value === task.value.targetDept;
  return isAdmin || isCreator || isTargetMP;
});

async function fetchTaskDetails() {
  if (!props.taskId) return;
  loading.value = true;
  statusError.value = "";
  try {
    const res = await fetch(`${API}/tasks/${props.taskId}`, { headers: getHeaders() });
    if (res.ok) {
      task.value = await res.json();
      comments.value = task.value.comments || [];
      selectedAssigneeId.value = task.value.assignedTeamMemberId || "";
      if (task.value.targetDept) {
        fetchTargetDeptUsers(task.value.targetDept);
      }
    }
  } catch (err) {
    console.error("Fetch task details error:", err);
  } finally {
    loading.value = false;
  }
}

async function fetchTargetDeptUsers(dept: string) {
  try {
    const res = await fetch(`${API}/users?department=${dept}`, { headers: getHeaders() });
    if (res.ok) {
      targetDeptUsers.value = await res.json();
    }
  } catch (err) {
    console.error("Fetch target dept users error:", err);
  }
}
async function changeStatus(newStatus: string) {
  if (!task.value) return;
  updatingStatus.value = true;
  statusError.value = "";
  try {
    const res = await fetch(`${API}/tasks/${task.value.id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      task.value = updated;
      emit("task-updated", updated);
    } else {
      const err = await res.json();
      statusError.value = err.message || "Gagal memperbarui status";
    }
  } catch (err: any) {
    statusError.value = err.message || "Gagal memperbarui status";
  } finally {
    updatingStatus.value = false;
  }
}

async function doReassign() {
  if (!task.value || !selectedAssigneeId.value) return;
  reassigning.value = true;
  try {
    const res = await fetch(`${API}/tasks/${task.value.id}/reassign`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ assignedTeamMemberId: selectedAssigneeId.value }),
    });
    if (res.ok) {
      const updated = await res.json();
      task.value = updated;
      emit("task-updated", updated);
    }
  } catch (err) {
    console.error("Reassign error:", err);
  } finally {
    reassigning.value = false;
  }
}

async function sendComment() {
  if (!task.value || !newCommentMessage.value.trim()) return;
  sendingComment.value = true;
  try {
    const res = await fetch(`${API}/tasks/${task.value.id}/comments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        message: newCommentMessage.value.trim(),
        attachmentLink: newCommentAttachment.value.trim() || undefined,
      }),
    });
    if (res.ok) {
      const newComment = await res.json();
      comments.value.push(newComment);
      newCommentMessage.value = "";
      newCommentAttachment.value = "";
      emit("comment-added", newComment);
    }
  } catch (err) {
    console.error("Send comment error:", err);
  } finally {
    sendingComment.value = false;
  }
}

function formatStatusLabel(st: string) {
  const map: Record<string, string> = {
    TODO: "TO DO",
    IN_PROGRESS: "IN PROGRESS",
    NEED_INFO: "NEED INFO",
    RESOLVED: "RESOLVED",
    CLOSED: "CLOSED",
  };
  return map[st] || st;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeAgo(d: string) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  return `${days}h lalu`;
}

watch(
  () => props.isOpen,
  (open) => {
    if (open && props.taskId) {
      fetchTaskDetails();
    } else {
      task.value = null;
      comments.value = [];
      newCommentMessage.value = "";
      newCommentAttachment.value = "";
      statusError.value = "";
    }
  },
  { immediate: true },
);
</script>
<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; }
.modal-box.cross-dept-modal { background: #fff; border-radius: 12px; width: 100%; max-width: 660px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15); border: 1px solid #fef3c7; overflow: hidden; }
.modal-header-amber { background: #fffbeb; border-bottom: 2px solid #fde68a; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; }
.header-tag-row { display: flex; gap: 8px; align-items: center; }
.badge-amber-tag { background: #f59e0b; color: #fff; font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 6px; }
.badge-sub-tag { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; }
.badge-sub-tag.linked { background: #e0f2fe; color: #0369a1; }
.badge-sub-tag.standalone { background: #f1f5f9; color: #475569; }
.modal-close-btn { background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; line-height: 1; }
.modal-body-scroll { padding: 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
.task-modal-title { font-size: 17px; font-weight: 700; color: #1e293b; margin: 0; }
.task-modal-desc { font-size: 13px; color: #475569; margin: 0; }
.task-external-link { font-size: 12px; color: #2563eb; font-weight: 600; text-decoration: none; }
.task-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
.meta-item { display: flex; flex-direction: column; gap: 2px; }
.meta-label { font-size: 11px; font-weight: 600; color: #64748b; }
.meta-val { font-size: 12px; font-weight: 600; color: #1e293b; }
.highlight-creator { color: #d97706; }
.highlight-target { color: #2563eb; }
.lifecycle-bar-section { background: #fffdf5; border: 1px solid #fef08a; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.lifecycle-header { display: flex; justify-content: space-between; align-items: center; }
.lifecycle-title { font-size: 12px; font-weight: 700; color: #92400e; }
.current-status-pill { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
.current-status-pill.todo { background: #f1f5f9; color: #475569; }
.current-status-pill.in_progress { background: #e0f2fe; color: #0284c7; }
.current-status-pill.need_info { background: #fef3c7; color: #d97706; border: 1px solid #fcd34d; }
.current-status-pill.resolved { background: #dcfce7; color: #15803d; }
.current-status-pill.closed { background: #e2e8f0; color: #334155; }
.lifecycle-steps { display: flex; align-items: center; gap: 6px; overflow-x: auto; }
.step-item { padding: 3px 8px; border-radius: 6px; background: #f1f5f9; color: #94a3b8; font-size: 10px; font-weight: 700; white-space: nowrap; }
.step-item.current { background: #f59e0b; color: #fff; }
.step-arrow { color: #cbd5e1; font-size: 11px; }
.status-actions-row { display: flex; gap: 6px; flex-wrap: wrap; }
.btn-lifecycle { font-size: 11px; font-weight: 600; padding: 5px 10px; border-radius: 6px; border: none; cursor: pointer; }
.btn-lifecycle.need-info { background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; }
.btn-lifecycle.in-progress { background: #e0f2fe; color: #0369a1; }
.btn-lifecycle.resolved { background: #dcfce7; color: #166534; }
.btn-lifecycle.close-btn { background: #1e293b; color: #fff; }
.btn-lifecycle.reopen-btn { background: #f8fafc; border: 1px solid #cbd5e1; color: #475569; }
.reassign-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
.reassign-title { font-size: 12px; font-weight: 700; color: #334155; }
.reassign-row { display: flex; gap: 8px; }
.reassign-select { flex: 1; font-size: 12px; padding: 5px 8px; border-radius: 6px; border: 1px solid #cbd5e1; }
.reassign-btn { background: #3b82f6; color: #fff; border: none; font-size: 12px; padding: 5px 12px; border-radius: 6px; cursor: pointer; }
.discussion-section { display: flex; flex-direction: column; gap: 8px; }
.discussion-header { display: flex; justify-content: space-between; align-items: center; }
.discussion-title { font-size: 14px; font-weight: 700; color: #1e293b; margin: 0; }
.need-info-pulse { background: #f59e0b; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
.comments-list { display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; }
.no-comments { font-size: 12px; color: #94a3b8; font-style: italic; text-align: center; padding: 10px; }
.comment-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 4px; }
.comment-card.is-creator { border-left: 3px solid #f59e0b; }
.comment-meta { display: flex; align-items: center; gap: 6px; font-size: 11px; }
.comment-author { font-weight: 700; color: #1e293b; }
.badge-role-creator { background: #fef3c7; color: #b45309; font-size: 9px; font-weight: 700; padding: 1px 4px; border-radius: 4px; }
.badge-role-pill { background: #e2e8f0; color: #475569; font-size: 9px; padding: 1px 4px; border-radius: 4px; }
.badge-dept-pill { background: #f1f5f9; color: #64748b; font-size: 9px; padding: 1px 4px; border-radius: 4px; }
.comment-time { color: #94a3b8; font-size: 10px; margin-left: auto; }
.comment-message { font-size: 13px; color: #334155; white-space: pre-wrap; }
.comment-attachment { font-size: 11px; color: #2563eb; font-weight: 600; text-decoration: none; }
.comment-input-box { display: flex; flex-direction: column; gap: 6px; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; }
.comment-textarea { width: 100%; border: none; outline: none; font-size: 13px; resize: vertical; }
.comment-extra-row { display: flex; gap: 8px; }
.comment-link-input { flex: 1; font-size: 11px; padding: 5px 8px; border-radius: 6px; border: 1px solid #e2e8f0; outline: none; }
.comment-send-btn { background: #f59e0b; color: #fff; border: none; font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 6px; cursor: pointer; }
.status-error-msg { font-size: 11px; color: #ef4444; font-weight: 600; }
.loading-state { text-align: center; padding: 20px; color: #64748b; font-size: 13px; }
</style>


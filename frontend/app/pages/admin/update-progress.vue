<template>
  <div class="admin-root">
    <div class="admin-content">
      <section class="progress-section card">
        <div class="section-header">
          <div>
            <h2>Update Capaian Key Results</h2>
            <p class="section-desc">
              Input capaian harian satuan KR dengan otorisasi Admin Override. Beralih ke mode overlapping tanpa blokir inisiatif.
            </p>
          </div>
          <div class="filter-controls">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari Key Result / Objective..."
              class="search-input"
            />
            <select v-model="filterPerspective" class="perspective-select">
              <option value="">Semua Perspektif</option>
              <option value="FINANCIAL">Financial</option>
              <option value="CUSTOMER">Customer</option>
              <option value="INTERNAL_PROCESS">Internal Process</option>
              <option value="LEARNING_GROWTH">Learning & Growth</option>
            </select>
            <button
              v-if="pendingChanges.length > 0"
              class="toggle-pending-btn"
              :class="{ active: onlyShowPending }"
              @click="onlyShowPending = !onlyShowPending"
            >
              {{ onlyShowPending ? "Tampilkan Semua" : `Hanya Diubah (${pendingChanges.length})` }}
            </button>
          </div>
        </div>

        <!-- Success Toast / Alert -->
        <div v-if="successToast" class="alert-success-banner">
          <span class="banner-icon">✓</span>
          <span>{{ successToast }}</span>
          <button @click="successToast = ''" class="banner-close">&times;</button>
        </div>

        <div v-if="loading" class="loading-state">
          Memuat data Key Results...
        </div>

        <div v-else-if="filteredKeyResults.length === 0" class="empty-state">
          Tidak ada Key Result yang sesuai filter.
        </div>

        <!-- Key Results Grid -->
        <div v-else class="kr-grid">
          <div
            v-for="kr in filteredKeyResults"
            :key="kr.id"
            class="kr-update-card"
            :class="{ 'is-modified': isDirty(kr.id) }"
          >
            <div class="kr-card-main">
              <div class="kr-details">
                <div class="kr-top-line">
                  <span class="parent-obj-title">
                    {{ kr.objectiveTitle }} ({{ kr.objectiveYear }})
                  </span>
                  <span v-if="isDirty(kr.id)" class="draft-badge">
                    Draft Diubah: {{ kr.currentValue }} → {{ updatePayloads[kr.id]?.newValue }} {{ kr.unit }}
                  </span>
                </div>

                <h3>{{ kr.title }}</h3>
                <div class="kr-meta-row">
                  <span
                    class="perspective-badge"
                    :class="kr.bscPerspective.toLowerCase()"
                  >
                    {{ formatPerspective(kr.bscPerspective) }}
                  </span>
                  <span
                    class="status-badge"
                    :class="kr.status.toLowerCase().replace('_', '')"
                  >
                    {{ kr.status.replace("_", " ") }}
                  </span>
                  <div
                    v-if="kr.assignments && kr.assignments.length > 0"
                    class="kr-pic-inline"
                  >
                    <span class="pic-lbl">PIC:</span>
                    <span
                      v-for="a in kr.assignments"
                      :key="a.id"
                      class="pic-chip"
                      :class="a.raciRole.toLowerCase()"
                    >
                      {{ a.user?.name }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Metrics -->
              <div class="kr-metrics">
                <div class="metric-box">
                  <span class="m-label">Target</span>
                  <span class="m-val">{{ kr.targetValue }} {{ kr.unit }}</span>
                </div>
                <div class="metric-box">
                  <span class="m-label">Capaian Saat Ini</span>
                  <span class="m-val highlight"
                    >{{ kr.currentValue }} {{ kr.unit }}</span
                  >
                </div>
                <div v-if="isDirty(kr.id)" class="metric-box new-preview-box">
                  <span class="m-label">Nilai Baru (Draft)</span>
                  <span class="m-val draft-val">
                    {{ updatePayloads[kr.id]?.newValue }} {{ kr.unit }}
                  </span>
                </div>
              </div>

              <!-- Update Action Form -->
              <div class="update-form-inline">
                <div class="input-group">
                  <div class="input-col">
                    <label class="field-mini-label">Nilai Capaian Baru</label>
                    <input
                      v-model.number="updatePayloads[kr.id].newValue"
                      type="number"
                      step="any"
                      :placeholder="String(kr.currentValue)"
                      class="val-input"
                    />
                  </div>
                  <div class="input-col note-col">
                    <label class="field-mini-label">Catatan Pembaruan (Opsional)</label>
                    <input
                      v-model="updatePayloads[kr.id].note"
                      type="text"
                      placeholder="Alasan penyesuaian capaian..."
                      class="note-input"
                    />
                  </div>

                  <div class="btn-actions-inline">
                    <button
                      v-if="isDirty(kr.id)"
                      @click="resetKrDraft(kr.id)"
                      class="reset-btn"
                      title="Batalkan perubahan pada KR ini"
                    >
                      Batal
                    </button>
                    <button
                      @click="openPasswordModalForKr(kr)"
                      :disabled="!isDirty(kr.id)"
                      class="update-btn"
                      :class="{ 'btn-highlight': isDirty(kr.id) }"
                    >
                      Simpan KR Ini
                    </button>
                  </div>
                </div>

                <button @click="showHistory(kr)" class="history-btn">
                  Riwayat Audit
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Sticky Floating Action Bar (Appears when there are unsaved pending changes) -->
    <transition name="slide-up">
      <div v-if="pendingChanges.length > 0" class="floating-batch-bar">
        <div class="bar-left">
          <span class="pulse-dot"></span>
          <span class="bar-text">
            <strong>{{ pendingChanges.length }} Key Result</strong> diubah & belum disimpan
          </span>
        </div>
        <div class="bar-right">
          <button @click="resetAllDrafts" class="btn-batch-cancel">
            Batalkan Semua
          </button>
          <button @click="openPasswordModalForBatch" class="btn-batch-save">
            <span class="lock-icon">🔒</span>
            Simpan Semua ({{ pendingChanges.length }})
          </button>
        </div>
      </div>
    </transition>

    <!-- Admin Password Authorization Modal -->
    <div
      v-if="showPasswordModal"
      class="modal-backdrop"
      @click.self="closePasswordModal"
    >
      <div class="modal-card modal-auth">
        <div class="modal-header">
          <div>
            <h3>Otorisasi Admin Override</h3>
            <p class="modal-subtitle">
              Konfirmasi penyimpanan {{ itemsToSubmit.length }} perubahan capaian KR dengan password Admin
            </p>
          </div>
          <button @click="closePasswordModal" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Summary of changes -->
          <div class="override-summary-table">
            <div class="summary-header">
              <span>Key Result</span>
              <span>Perubahan Nilai</span>
            </div>
            <div class="summary-list">
              <div
                v-for="item in itemsToSubmit"
                :key="item.kr.id"
                class="summary-row"
              >
                <div class="summary-kr-info">
                  <span class="summary-title">{{ item.kr.title }}</span>
                  <span class="summary-sub">
                    {{ formatPerspective(item.kr.bscPerspective) }} | Target: {{ item.kr.targetValue }} {{ item.kr.unit }}
                  </span>
                  <span v-if="item.note" class="summary-note">"{{ item.note }}"</span>
                </div>
                <div class="summary-diff">
                  <span class="old-val">{{ item.kr.currentValue }}</span>
                  <span class="arrow-sym">→</span>
                  <span class="new-val">{{ item.newValue }} {{ item.kr.unit }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Password verification field -->
          <div class="auth-input-section">
            <label class="auth-label">
              Password Akun Admin
              <span class="req">*</span>
            </label>
            <div class="password-input-wrapper">
              <input
                v-model="adminPassword"
                :type="showPasswordText ? 'text' : 'password'"
                placeholder="Ketik password akun Anda..."
                class="auth-input"
                @keyup.enter="confirmAndSubmitOverride"
                ref="passwordInputRef"
              />
              <button
                type="button"
                @click="showPasswordText = !showPasswordText"
                class="btn-toggle-eye"
                tabindex="-1"
              >
                {{ showPasswordText ? "Sembunyikan" : "Lihat" }}
              </button>
            </div>

            <div v-if="passwordError" class="auth-error-banner">
              ⚠️ {{ passwordError }}
            </div>

            <p class="auth-hint">
              🛡️ Tindakan override ini akan langsung memperbarui capaian tanpa memblokir inisiatif dan tercatat di riwayat audit sistem.
            </p>
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            @click="closePasswordModal"
            class="btn-secondary"
            :disabled="isSubmittingOverride"
          >
            Batal
          </button>
          <button
            type="button"
            @click="confirmAndSubmitOverride"
            class="btn-primary"
            :disabled="isSubmittingOverride || !adminPassword"
          >
            <span v-if="isSubmittingOverride" class="spinner-small"></span>
            <span>{{ isSubmittingOverride ? "Menyimpan..." : `Konfirmasi & Simpan (${itemsToSubmit.length} KR)` }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- History Modal -->
    <div
      v-if="selectedKrForHistory"
      class="modal-backdrop"
      @click="closeHistory"
    >
      <div class="modal-card" @click.stop>
        <div class="modal-header">
          <h3>Riwayat Audit Trail: {{ selectedKrForHistory.title }}</h3>
          <button @click="closeHistory" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="loadingHistory" class="modal-loading">
            Memuat riwayat perubahan...
          </div>
          <div v-else-if="historyLogs.length === 0" class="modal-empty">
            Belum ada catatan riwayat perubahan untuk Key Result ini.
          </div>
          <div v-else class="timeline">
            <div v-for="log in historyLogs" :key="log.id" class="timeline-item">
              <div class="timeline-badge"></div>
              <div class="timeline-content">
                <div class="timeline-time">
                  {{ formatDate(log.updatedAt) }} - Oleh
                  <strong>{{ log.updatedBy }}</strong>
                </div>
                <div class="timeline-diff">
                  Perubahan: <span class="old-val">{{ log.oldValue }}</span> →
                  <span class="new-val">{{ log.newValue }}</span>
                </div>
                <p v-if="log.note" class="timeline-note">"{{ log.note }}"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const auth = useAuthStore();
const config = useRuntimeConfig();

const objectives = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const filterPerspective = ref("");
const onlyShowPending = ref(false);

const updatePayloads = ref({});
const successToast = ref("");

// Password Modal state
const showPasswordModal = ref(false);
const adminPassword = ref("");
const showPasswordText = ref(false);
const passwordError = ref("");
const isSubmittingOverride = ref(false);
const singleTargetKr = ref(null);
const passwordInputRef = ref(null);

// History Modal states
const selectedKrForHistory = ref(null);
const historyLogs = ref([]);
const loadingHistory = ref(false);

const flatKeyResults = computed(() => {
  const list = [];
  objectives.value.forEach((obj) => {
    if (obj.keyResults) {
      obj.keyResults.forEach((kr) => {
        list.push({
          ...kr,
          objectiveTitle: obj.title,
          objectiveYear: obj.year,
        });
      });
    }
  });
  return list;
});

function isDirty(krId) {
  const p = updatePayloads.value[krId];
  if (!p) return false;
  if (p.newValue === null || p.newValue === undefined || p.newValue === "") {
    return false;
  }
  const num = Number(p.newValue);
  if (isNaN(num)) return false;

  const kr = flatKeyResults.value.find((k) => k.id === krId);
  if (!kr) return false;

  return num !== Number(kr.currentValue);
}

const pendingChanges = computed(() => {
  const list = [];
  for (const kr of flatKeyResults.value) {
    if (isDirty(kr.id)) {
      const p = updatePayloads.value[kr.id];
      list.push({
        kr,
        newValue: Number(p.newValue),
        note: p.note ? p.note.trim() : "",
      });
    }
  }
  return list;
});

const filteredKeyResults = computed(() => {
  return flatKeyResults.value.filter((kr) => {
    if (onlyShowPending.value && !isDirty(kr.id)) {
      return false;
    }
    if (
      filterPerspective.value &&
      kr.bscPerspective !== filterPerspective.value
    ) {
      return false;
    }
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const matchTitle = kr.title.toLowerCase().includes(q);
      const matchObj = kr.objectiveTitle.toLowerCase().includes(q);
      if (!matchTitle && !matchObj) return false;
    }
    return true;
  });
});

const itemsToSubmit = computed(() => {
  if (singleTargetKr.value) {
    const p = updatePayloads.value[singleTargetKr.value.id];
    return [
      {
        kr: singleTargetKr.value,
        newValue: Number(p?.newValue),
        note: p?.note ? p.note.trim() : "",
      },
    ];
  }
  return pendingChanges.value;
});

function formatPerspective(p) {
  if (!p) return "";
  return p
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resetKrDraft(krId) {
  if (updatePayloads.value[krId]) {
    updatePayloads.value[krId].newValue = null;
    updatePayloads.value[krId].note = "";
  }
}

function resetAllDrafts() {
  if (
    window.confirm(
      `Batalkan semua perubahan draft pada ${pendingChanges.value.length} Key Result?`
    )
  ) {
    flatKeyResults.value.forEach((kr) => {
      resetKrDraft(kr.id);
    });
    onlyShowPending.value = false;
  }
}

function openPasswordModalForKr(kr) {
  if (!isDirty(kr.id)) return;
  singleTargetKr.value = kr;
  adminPassword.value = "";
  passwordError.value = "";
  showPasswordModal.value = true;
  nextTick(() => {
    passwordInputRef.value?.focus();
  });
}

function openPasswordModalForBatch() {
  if (pendingChanges.value.length === 0) return;
  singleTargetKr.value = null;
  adminPassword.value = "";
  passwordError.value = "";
  showPasswordModal.value = true;
  nextTick(() => {
    passwordInputRef.value?.focus();
  });
}

function closePasswordModal() {
  showPasswordModal.value = false;
  adminPassword.value = "";
  passwordError.value = "";
  singleTargetKr.value = null;
}

async function confirmAndSubmitOverride() {
  if (!adminPassword.value) {
    passwordError.value = "Password Admin wajib diisi untuk otorisasi.";
    return;
  }

  const updates = itemsToSubmit.value.map((item) => ({
    keyResultId: item.kr.id,
    newValue: item.newValue,
    note: item.note || undefined,
  }));

  if (updates.length === 0) {
    passwordError.value = "Tidak ada KR yang akan disimpan.";
    return;
  }

  isSubmittingOverride.value = true;
  passwordError.value = "";

  try {
    const res = await $fetch(
      `${config.public.apiBase}/key-results/admin/override-progress`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: {
          password: adminPassword.value,
          updates,
        },
      }
    );

    // Reset input fields for saved KRs
    updates.forEach((u) => {
      resetKrDraft(u.keyResultId);
    });

    closePasswordModal();
    successToast.value =
      res.message || `Berhasil memperbarui ${updates.length} Key Result.`;

    // Refresh data
    await fetchObjectives();

    setTimeout(() => {
      if (successToast.value) {
        successToast.value = "";
      }
    }, 6000);
  } catch (err) {
    console.error("Admin override error:", err);
    passwordError.value =
      err.data?.message || "Gagal otorisasi. Pastikan password Admin benar.";
  } finally {
    isSubmittingOverride.value = false;
  }
}

async function fetchObjectives() {
  loading.value = true;
  try {
    const response = await $fetch(`${config.public.apiBase}/objectives`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
    objectives.value = response;

    // Initialize or keep existing draft payloads
    const payloads = { ...updatePayloads.value };
    flatKeyResults.value.forEach((kr) => {
      if (!payloads[kr.id]) {
        payloads[kr.id] = {
          newValue: null,
          note: "",
        };
      }
    });
    updatePayloads.value = payloads;
  } catch (err) {
    console.error("Error fetching objectives:", err);
  } finally {
    loading.value = false;
  }
}

async function showHistory(kr) {
  selectedKrForHistory.value = kr;
  loadingHistory.value = true;
  try {
    const response = await $fetch(
      `${config.public.apiBase}/key-results/${kr.id}/history`,
      {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      }
    );
    historyLogs.value = response;
  } catch (err) {
    console.error("Error fetching history logs:", err);
  } finally {
    loadingHistory.value = false;
  }
}

function closeHistory() {
  selectedKrForHistory.value = null;
  historyLogs.value = [];
}

// Navigation guard before leaving page
onBeforeRouteLeave((to, from) => {
  if (pendingChanges.value.length > 0) {
    const answer = window.confirm(
      `Perhatian: Terdapat ${pendingChanges.value.length} Key Result yang telah diubah namun belum disimpan dengan password Admin. Tinggalkan halaman dan buang perubahan?`
    );
    if (!answer) {
      return false;
    }
  }
});

// Browser unload guard (tab close or refresh)
const handleBeforeUnload = (e) => {
  if (pendingChanges.value.length > 0) {
    e.preventDefault();
    e.returnValue = "";
  }
};

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);
  fetchObjectives();
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
});
</script>

<style scoped>
@import url("https://fonts.google.com/share?selection.family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900|Rubik:ital,wght@0,300..900;1,300..900");

.admin-root {
  font-family: "Rubik", sans-serif;
  min-height: 100vh;
  background: var(--content-bg);
  color: var(--text-color);
  padding: 0 0 100px 0;
}

.admin-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 30px 20px;
}

.card {
  background: var(--card-bg);
  border: 1.5px solid var(--card-border);
  border-radius: 16px;
  padding: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 24px;
}

h2 {
  font-size: 23px;
  font-weight: 600;
  margin: 0 0 6px 0;
}

.section-desc {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
  max-width: 650px;
  line-height: 1.5;
}

/* Filters */
.filter-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  width: 280px;
  background: var(--input-bg);
  border: 1.5px solid var(--color-gamma-650);
  border-radius: 8px;
  padding: 10px 14px;
  color: var(--color-gamma-080);
  font-size: 14px;
  outline: none;
}

.perspective-select {
  background: var(--input-bg);
  border: 1.5px solid var(--color-gamma-650);
  border-radius: 8px;
  padding: 10px 14px;
  color: var(--color-gamma-080);
  font-size: 14px;
  outline: none;
  cursor: pointer;
}

.search-input:focus,
.perspective-select:focus {
  border-color: var(--color-primary);
}

.toggle-pending-btn {
  background: rgba(255, 170, 0, 0.15);
  border: 1px solid rgba(255, 170, 0, 0.4);
  color: #ffaa00;
  padding: 9px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-pending-btn:hover,
.toggle-pending-btn.active {
  background: #ffaa00;
  color: #111;
}

/* Success Banner */
.alert-success-banner {
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.4);
  color: #4ade80;
  padding: 12px 18px;
  border-radius: 10px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
}

.banner-icon {
  font-weight: bold;
  font-size: 16px;
}

.banner-close {
  margin-left: auto;
  background: transparent;
  border: none;
  color: #4ade80;
  font-size: 20px;
  cursor: pointer;
}

/* Grid & Cards */
.kr-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kr-update-card {
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.25s ease;
}

.kr-update-card:hover {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.12);
}

.kr-update-card.is-modified {
  border-color: rgba(0, 210, 255, 0.5);
  background: rgba(0, 210, 255, 0.02);
  box-shadow: 0 0 15px rgba(0, 210, 255, 0.06);
}

.kr-card-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kr-top-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.parent-obj-title {
  font-size: 13px;
  color: var(--color-primary);
  font-weight: 500;
}

.draft-badge {
  font-size: 12px;
  font-weight: 700;
  color: #00d2ff;
  background: rgba(0, 210, 255, 0.12);
  border: 1px solid rgba(0, 210, 255, 0.3);
  padding: 3px 10px;
  border-radius: 12px;
}

.kr-details h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 10px 0;
  line-height: 1.4;
}

.kr-meta-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

/* Metrics Row */
.kr-metrics {
  display: flex;
  gap: 20px;
  background: var(--color-field);
  padding: 12px 20px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  align-items: center;
}

.metric-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.new-preview-box {
  padding-left: 20px;
  border-left: 1px dashed rgba(255, 255, 255, 0.15);
}

.m-label {
  font-size: 12px;
  color: var(--color-gamma-050);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.m-val {
  font-size: 17px;
  font-weight: 600;
}

.m-val.highlight {
  color: #00d2ff;
}

.m-val.draft-val {
  color: #4ade80;
}

/* Update Form Actions */
.update-form-inline {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 16px;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
  padding-top: 16px;
}

.input-group {
  display: flex;
  gap: 12px;
  flex-grow: 1;
  align-items: flex-end;
  flex-wrap: wrap;
}

.input-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.note-col {
  flex-grow: 1;
  min-width: 240px;
}

.field-mini-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.val-input {
  width: 130px;
  background: var(--color-gamma-020);
  border: 1.5px solid var(--card-border);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--color-primary-shade);
  font-size: 14px;
  outline: none;
}

.note-input {
  width: 100%;
  background: var(--color-gamma-020);
  border: 1.5px solid var(--card-border);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--color-primary-shade);
  font-size: 14px;
  outline: none;
}

.val-input:focus,
.note-input:focus {
  border-color: var(--color-primary);
}

.btn-actions-inline {
  display: flex;
  gap: 8px;
}

.reset-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: rgba(255, 75, 75, 0.15);
  border-color: rgba(255, 75, 75, 0.3);
  color: #ff8888;
}

.update-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.5);
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.update-btn.btn-highlight {
  background: #0066ff;
  border-color: #0066ff;
  color: white;
}

.update-btn.btn-highlight:hover {
  background: #0052cc;
}

.update-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.history-btn {
  background: transparent;
  border: 1.5px solid var(--card-border);
  color: var(--color-primary-shade);
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.history-btn:hover {
  border-color: var(--color-primary);
  color: white;
  background: var(--color-primary);
}

/* Badges */
.perspective-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 8px;
  text-transform: uppercase;
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
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 8px;
  text-transform: uppercase;
}

.status-badge.ontrack {
  background: var(--color-green-badge);
  color: var(--color-green);
}

.status-badge.atrisk {
  background: var(--color-yellow-badge);
  color: #ffcc66;
}

.status-badge.offtrack {
  background: var(--color-red-badge);
  color: var(--color-red);
}

.kr-pic-inline {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-left: 0.5rem;
}

.pic-lbl {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.4);
}

.pic-chip {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-weight: 500;
}

.pic-chip.accountable {
  background: rgba(124, 58, 237, 0.2);
  color: #c084fc;
}

.pic-chip.responsible {
  background: rgba(14, 151, 214, 0.2);
  color: #38bdf8;
}

/* Floating Batch Action Bar */
.floating-batch-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 990;
  background: #101726;
  border: 1.5px solid rgba(0, 210, 255, 0.4);
  border-radius: 50px;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 210, 255, 0.15);
  backdrop-filter: blur(12px);
}

.bar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pulse-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #00d2ff;
  box-shadow: 0 0 10px #00d2ff;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.7; }
}

.bar-text {
  font-size: 14px;
  color: #ffffff;
}

.bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-batch-cancel {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  padding: 8px 16px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-batch-cancel:hover {
  background: rgba(255, 75, 75, 0.2);
  border-color: rgba(255, 75, 75, 0.4);
  color: #ff8888;
}

.btn-batch-save {
  background: linear-gradient(135deg, #00d2ff 0%, #0066ff 100%);
  border: none;
  color: white;
  padding: 9px 20px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(0, 102, 255, 0.4);
}

.btn-batch-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 102, 255, 0.6);
}

.lock-icon {
  font-size: 14px;
}

/* Modals */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.25s;
}

.modal-card {
  background: #141b2a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 90%;
  max-width: 620px;
  max-height: 85vh;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-header h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
}

.modal-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover {
  color: white;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Override Summary in Modal */
.override-summary-table {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  margin-bottom: 20px;
  overflow: hidden;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 600;
  text-transform: uppercase;
}

.summary-list {
  max-height: 180px;
  overflow-y: auto;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  gap: 14px;
}

.summary-kr-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-grow: 1;
}

.summary-title {
  font-size: 13px;
  font-weight: 500;
  color: #ffffff;
}

.summary-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
}

.summary-note {
  font-size: 11px;
  color: #00d2ff;
  font-style: italic;
}

.summary-diff {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  flex-shrink: 0;
}

.old-val {
  color: #ff8888;
  text-decoration: line-through;
}

.arrow-sym {
  color: rgba(255, 255, 255, 0.4);
}

.new-val {
  color: #4ade80;
  font-weight: 600;
}

/* Auth Section */
.auth-input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.auth-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.req {
  color: #ff4d4f;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.auth-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.25);
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 12px 100px 12px 14px;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.auth-input:focus {
  border-color: #00d2ff;
}

.btn-toggle-eye {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  cursor: pointer;
  padding: 6px 10px;
}

.btn-toggle-eye:hover {
  color: #00d2ff;
}

.auth-error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #f87171;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
}

.auth-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  margin: 4px 0 0 0;
  line-height: 1.4;
}

.btn-secondary {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.btn-primary {
  background: linear-gradient(135deg, #00d2ff 0%, #0066ff 100%);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.95;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Timeline */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-item {
  display: flex;
  gap: 14px;
  position: relative;
}

.timeline-badge {
  width: 10px;
  height: 10px;
  background: #00d2ff;
  border-radius: 50%;
  margin-top: 5px;
  box-shadow: 0 0 8px #00d2ff;
  flex-shrink: 0;
}

.timeline-content {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 12px 14px;
  border-radius: 8px;
  flex-grow: 1;
}

.timeline-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 4px;
}

.timeline-diff {
  font-size: 14px;
  font-weight: 500;
}

.timeline-note {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  margin: 6px 0 0 0;
}

.modal-loading,
.modal-empty,
.loading-state,
.empty-state {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  padding: 30px;
  font-size: 14px;
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translate(-50%, 50px);
  opacity: 0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from { transform: scale(0.96); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>

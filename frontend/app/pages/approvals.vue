<template>
  <div class="approvals-container">
    <div class="header-card card">
      <div class="header-title">
        <h2>Antrean Persetujuan (Pending Approvals)</h2>
        <p class="section-desc">
          Tinjau dan proses pengajuan perubahan progress dari rekan tim atau
          bawahan Anda.
        </p>
      </div>
    </div>

    <!-- Alert / Status -->
    <div v-if="loading" class="alert alert-info">Memuat data...</div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div v-if="!loading" class="content-section">
      <div v-if="pendingUpdates.length === 0" class="empty-state card">
        Tidak ada pengajuan update yang butuh persetujuan saat ini.
      </div>
      <div v-else class="pending-list">
        <div v-for="upd in pendingUpdates" :key="upd.id" class="card mb-4">
          <div class="kr-main">
            <div class="kr-title-row mb-2">
              <span class="kr-title">{{ upd.initiative?.title }}</span>
              <span
                class="badge"
                :class="upd.type === 'TASK' ? 'bg-task' : 'bg-initiative'"
              >
                {{ upd.type }}
              </span>
              <span class="badge bg-yellow ml-2">PENDING</span>
            </div>

            <div class="text-sm text-gray mb-4">
              <strong>Tim Pelaksana:</strong>
              {{ upd.initiative?.team?.name || "-" }}
            </div>

            <div class="update-details">
              <div class="detail-box">
                <span class="lbl">Nilai Sebelumnya:</span>
                <span class="val">{{ upd.oldValue }}</span>
              </div>
              <div class="detail-box">
                <span class="lbl">Nilai Diajukan:</span>
                <span class="val text-blue">{{ upd.newValue }}</span>
              </div>
              <div class="detail-box flex-2">
                <span class="lbl">Catatan:</span>
                <span class="val italic"
                  >"{{ upd.note || "Tidak ada catatan" }}"</span
                >
              </div>
              <div v-if="upd.link" class="detail-box">
                <span class="lbl">Dokumentasi:</span>
                <span class="val">
                  <a
                    :href="upd.link"
                    target="_blank"
                    class="text-blue hover:underline font-semibold"
                  >
                    Link Hasil
                  </a>
                </span>
              </div>
            </div>

            <!-- Reject Form -->
            <div v-if="rejectingId === upd.id" class="reject-form mt-4">
              <textarea
                v-model="rejectNote"
                placeholder="Alasan penolakan wajib diisi..."
                class="form-input"
                rows="2"
              ></textarea>
              <div class="actions-row mt-2">
                <button
                  class="secondary-btn small"
                  @click="cancelReject"
                  :disabled="actionLoading"
                >
                  Batal
                </button>
                <button
                  class="danger-btn small"
                  @click="confirmReject(upd.id)"
                  :disabled="actionLoading"
                >
                  {{ actionLoading ? "Memproses..." : "Konfirmasi Tolak" }}
                </button>
              </div>
            </div>

            <!-- Standard Actions -->
            <div v-else class="actions-row mt-4">
              <button
                class="primary-btn small"
                @click="approveUpdate(upd.id)"
                :disabled="actionLoading"
              >
                {{ actionLoading ? "Memproses..." : "Approve" }}
              </button>
              <button
                class="danger-btn small"
                @click="startReject(upd.id)"
                :disabled="actionLoading"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRuntimeConfig } from "#app";
import { useAuthStore } from "../stores/auth";

const config = useRuntimeConfig();
const API = config.public.apiBase || "http://localhost:3001/api";
const auth = useAuthStore();

const pendingUpdates = ref([]);
const loading = ref(false);
const actionLoading = ref(false);
const error = ref("");

const rejectingId = ref(null);
const rejectNote = ref("");

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${auth.token}`,
  };
}

async function fetchPendingUpdates() {
  loading.value = true;
  error.value = "";
  try {
    const res = await fetch(`${API}/initiatives/initiative-updates/pending`, {
      headers: getHeaders(),
    });
    if (res.ok) {
      pendingUpdates.value = await res.json();
    } else {
      const err = await res.json();
      throw new Error(err.message || "Gagal memuat data persetujuan");
    }
  } catch (e) {
    console.error(e);
    error.value = e.message || "Terjadi kesalahan koneksi";
  } finally {
    loading.value = false;
  }
}

async function approveUpdate(id) {
  actionLoading.value = true;
  try {
    const res = await fetch(
      `${API}/initiatives/initiative-updates/${id}/approve`,
      {
        method: "PATCH",
        headers: getHeaders(),
      },
    );
    if (res.ok) {
      await fetchPendingUpdates();
    } else {
      const err = await res.json();
      alert(err.message || "Gagal menyetujui update");
    }
  } catch (e) {
    console.error(e);
    alert("Terjadi kesalahan sistem");
  } finally {
    actionLoading.value = false;
  }
}

function startReject(id) {
  rejectingId.value = id;
  rejectNote.value = "";
}

function cancelReject() {
  rejectingId.value = null;
  rejectNote.value = "";
}

async function confirmReject(id) {
  if (!rejectNote.value.trim()) {
    alert("Alasan penolakan wajib diisi");
    return;
  }
  actionLoading.value = true;
  try {
    const res = await fetch(
      `${API}/initiatives/initiative-updates/${id}/reject`,
      {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ reviewNote: rejectNote.value }),
      },
    );
    if (res.ok) {
      rejectingId.value = null;
      rejectNote.value = "";
      await fetchPendingUpdates();
    } else {
      const err = await res.json();
      alert(err.message || "Gagal menolak update");
    }
  } catch (e) {
    console.error(e);
    alert("Terjadi kesalahan sistem");
  } finally {
    actionLoading.value = false;
  }
}

onMounted(() => {
  fetchPendingUpdates();
});
</script>

<style scoped>
.approvals-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f5f9;
}

.header-title h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.section-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.empty-state {
  text-align: center;
  color: #64748b;
  padding: 48px;
  font-size: 15px;
}

.pending-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kr-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.kr-title {
  font-weight: 600;
  font-size: 16px;
  color: #1e293b;
}

.badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
  text-transform: uppercase;
}

.bg-task {
  background: #e0f2fe;
  color: #0369a1;
}

.bg-initiative {
  background: #f3e8ff;
  color: #7e22ce;
}

.bg-yellow {
  background: #fef08a;
  color: #854d0e;
}

.text-gray {
  color: #64748b;
}

.update-details {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}

.detail-box {
  flex: 1;
  min-width: 150px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-box.flex-2 {
  flex: 2;
  min-width: 250px;
}

.detail-box .lbl {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 500;
}

.detail-box .val {
  font-size: 14px;
  color: #334155;
  font-weight: 600;
}

.text-blue {
  color: #0e97d6 !important;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #0e97d6;
  box-shadow: 0 0 0 2px rgba(14, 151, 214, 0.1);
}

.actions-row {
  display: flex;
  gap: 12px;
}

.primary-btn {
  background-color: #0e97d6;
  color: white;
  border: none;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn:hover {
  background-color: #0a84be;
}

.primary-btn.small,
.danger-btn.small,
.secondary-btn.small {
  padding: 8px 16px;
  font-size: 13px;
}

.danger-btn {
  background-color: #ef4444;
  color: white;
  border: none;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.danger-btn:hover {
  background-color: #dc2626;
}

.secondary-btn {
  background-color: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-btn:hover {
  background-color: #e2e8f0;
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.alert-info {
  background-color: #e0f2fe;
  color: #0369a1;
}

.alert-error {
  background-color: #fee2e2;
  color: #991b1b;
}

.mt-4 {
  margin-top: 16px;
}
.mt-2 {
  margin-top: 8px;
}
.mb-4 {
  margin-bottom: 16px;
}
.ml-2 {
  margin-left: 8px;
}
.font-semibold {
  font-weight: 600;
}
.italic {
  font-style: italic;
}
</style>

<template>
  <div class="admin-root">
    <div class="admin-content">
      <div class="header-section card">
        <div class="header-title">
          <h2>OKR Overview</h2>
          <p class="section-desc">
            Pantau seluruh OKR perusahaan dan kelola persetujuan progress Task.
          </p>
        </div>
      </div>

      <div class="tabs mb-4">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'overview' }"
          @click="activeTab = 'overview'"
        >
          OKR Overview
        </button>
        <!-- <button
          class="tab-btn"
          :class="{ active: activeTab === 'annualProgress' }"
          @click="activeTab = 'annualProgress'"
        >
          Annual KR Progress
        </button> -->
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'pending' }"
          @click="activeTab = 'pending'"
        >
          Pending Approval
          <span v-if="pendingCount > 0" class="badge-count">{{
            pendingCount
          }}</span>
        </button>
      </div>

      <div v-if="loading" class="alert alert-info">Memuat data...</div>
      <div v-else-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>

      <!-- TAB: OKR OVERVIEW -->
      <div v-if="activeTab === 'overview' && !loading">
        <div v-if="objectives.length === 0" class="empty-state card">
          Belum ada Objective yang dibuat.
        </div>

        <div
          v-for="obj in objectives"
          :key="obj.id"
          class="obj-block card mb-4"
        >
          <div class="obj-header">
            <h3>[{{ obj.year }}] {{ obj.title }}</h3>
          </div>

          <div class="kr-list">
            <div
              v-if="obj.keyResults?.length === 0"
              class="empty-text"
              style="padding: 16px 24px"
            >
              Tidak ada Key Result.
            </div>
            <div v-else>
              <div
                v-for="(krs, deptKey) in getGroupedKrs(obj.keyResults)"
                :key="deptKey"
                class="dept-group mb-4"
              >
                <div class="dept-group-header mb-2">
                  <span class="dept-title-badge"
                    >Section: {{ getDeptLabel(deptKey) }}</span
                  >
                </div>
                <div class="table-container" style="overflow-x: auto">
                  <table
                    class="overview-table"
                    style="
                      width: 100%;
                      border-collapse: collapse;
                      font-size: 13px;
                    "
                  >
                    <thead>
                      <tr
                        style="
                          background: #f8fafc;
                          border-bottom: 2px solid #e2e8f0;
                          text-align: left;
                        "
                      >
                        <th style="padding: 10px 12px; width: 50px">No</th>
                        <th style="padding: 10px 12px">Nama Key Result</th>
                        <th style="padding: 10px 12px; width: 140px">Target</th>
                        <th style="padding: 10px 12px; width: 140px">Actual</th>
                        <th style="padding: 10px 12px; width: 140px">GAP</th>
                        <th
                          style="
                            padding: 10px 12px;
                            width: 110px;
                            text-align: right;
                          "
                        >
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="(kr, krIdx) in krs" :key="kr.id">
                        <tr style="border-bottom: 1px solid #f1f5f9">
                          <td style="padding: 10px 12px">{{ krIdx + 1 }}</td>
                          <td style="padding: 10px 12px">
                            <div
                              style="
                                display: flex;
                                align-items: center;
                                gap: 8px;
                              "
                            >
                              <button
                                v-if="kr.initiatives?.length > 0"
                                @click="toggleKrExpand(kr.id)"
                                class="btn-expand"
                                style="
                                  background: #f1f5f9;
                                  border: 1px solid #cbd5e1;
                                  border-radius: 4px;
                                  cursor: pointer;
                                  font-size: 11px;
                                  color: #475569;
                                  padding: 2px 6px;
                                "
                                :title="
                                  isKrExpanded(kr.id)
                                    ? 'Sembunyikan Inisiatif'
                                    : 'Tampilkan Inisiatif'
                                "
                              >
                                {{
                                  isKrExpanded(kr.id)
                                    ? "▼ Sembunyikan"
                                    : "▶ Expand (" +
                                      kr.initiatives.length +
                                      " Inisiatif)"
                                }}
                              </button>
                              <span style="font-weight: 600; color: #1e293b">{{
                                kr.title
                              }}</span>
                              <span
                                class="badge"
                                :class="getStatusClass(kr.status)"
                                >{{ kr.status }}</span
                              >
                            </div>
                          </td>
                          <td
                            style="
                              padding: 10px 12px;
                              font-weight: 600;
                              color: #0f172a;
                            "
                          >
                            {{ formatTargetValue(kr.targetValue, kr.unit) }}
                          </td>
                          <td
                            style="
                              padding: 10px 12px;
                              font-weight: 600;
                              color: #059669;
                            "
                          >
                            {{ formatTargetValue(kr.currentValue, kr.unit) }}
                          </td>
                          <td
                            style="
                              padding: 10px 12px;
                              font-weight: 600;
                              color: #dc2626;
                            "
                          >
                            {{
                              calculateGap(
                                kr.targetValue,
                                kr.currentValue,
                                kr.unit,
                              )
                            }}
                          </td>
                          <td style="padding: 10px 12px; text-align: right">
                            <button
                              class="secondary-btn small"
                              @click="openDelegateModal(kr)"
                              style="
                                padding: 4px 8px;
                                font-size: 12px;
                                background-color: #f1f5f9;
                                border: 1px solid #cbd5e1;
                                border-radius: 4px;
                                cursor: pointer;
                              "
                            >
                              Delegasikan
                            </button>
                          </td>
                        </tr>

                        <!-- Expand sub-row for Initiatives & Tasks -->
                        <tr
                          v-if="
                            kr.initiatives?.length > 0 && isKrExpanded(kr.id)
                          "
                          style="background-color: #f8fafc"
                        >
                          <td colspan="6" style="padding: 12px 16px">
                            <div
                              class="nested-initiatives"
                              style="
                                padding-left: 12px;
                                border-left: 3px solid #3b82f6;
                              "
                            >
                              <div
                                style="
                                  font-weight: 600;
                                  font-size: 12px;
                                  color: #475569;
                                  margin-bottom: 8px;
                                "
                              >
                                Sub-Inisiatif & Task:
                              </div>
                              <div
                                v-for="ini in kr.initiatives"
                                :key="ini.id"
                                class="nested-ini-item"
                                style="
                                  margin-bottom: 10px;
                                  background: #ffffff;
                                  padding: 10px 12px;
                                  border-radius: 6px;
                                  border: 1px solid #e2e8f0;
                                "
                              >
                                <div
                                  style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    flex-wrap: wrap;
                                    gap: 8px;
                                  "
                                >
                                  <div>
                                    <strong style="color: #0f172a"
                                      >Inisiatif: {{ ini.title }}</strong
                                    >
                                    <span
                                      class="team-badge"
                                      style="margin-left: 8px"
                                      >Tim: {{ ini.team?.name }}</span
                                    >
                                  </div>
                                  <div style="font-size: 12px; color: #64748b">
                                    Target:
                                    {{
                                      formatTargetValue(
                                        ini.targetValue,
                                        ini.unit,
                                        "%",
                                      )
                                    }}
                                    | Realisasi:
                                    {{
                                      formatTargetValue(
                                        ini.achievedValue ?? ini.currentValue,
                                        ini.unit,
                                        "%",
                                      )
                                    }}
                                    ({{ getProgressPercent(ini).toFixed(1) }}%)
                                  </div>
                                </div>
                                <div
                                  class="progress-bar-container mt-1"
                                  style="
                                    height: 6px;
                                    background: #e2e8f0;
                                    border-radius: 3px;
                                    overflow: hidden;
                                    margin-top: 6px;
                                  "
                                >
                                  <div
                                    class="progress-bar"
                                    :style="{
                                      width: getProgressPercent(ini) + '%',
                                      background: '#3b82f6',
                                      height: '100%',
                                    }"
                                  ></div>
                                </div>

                                <!-- Tasks under Initiative -->
                                <div
                                  v-if="ini.tasks?.length > 0"
                                  class="nested-tasks"
                                  style="
                                    margin-top: 8px;
                                    padding-left: 12px;
                                    border-left: 2px solid #cbd5e1;
                                  "
                                >
                                  <div
                                    v-for="task in ini.tasks"
                                    :key="task.id"
                                    style="
                                      font-size: 12px;
                                      color: #334155;
                                      padding: 3px 0;
                                    "
                                  >
                                    <span style="color: #94a3b8">└─ </span>
                                    <strong>Task: {{ task.title }}</strong>
                                    <span
                                      style="color: #64748b; margin-left: 6px"
                                    >
                                      (Target:
                                      {{
                                        formatTargetValue(
                                          task.targetValue,
                                          task.unit,
                                        )
                                      }}
                                      | Saat ini:
                                      {{
                                        formatTargetValue(
                                          task.currentValue,
                                          task.unit,
                                        )
                                      }})
                                    </span>
                                    <span
                                      style="color: #64748b; margin-left: 6px"
                                    >
                                      Assignee:
                                      {{
                                        task.assignments
                                          ?.map((a) => a.user?.name)
                                          .join(", ") || "Belum ada"
                                      }}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB: ANNUAL KR PROGRESS -->
      <div v-if="activeTab === 'annualProgress' && !annualLoading">
        <!-- Matrix Table Overview -->
        <div class="card mb-6">
          <h3 class="tab-section-title mb-2">Matriks Capaian Bulanan</h3>
          <p class="tab-section-desc mb-4">
            Perbandingan capaian bulanan seluruh Annual Key Result Anda di tahun
            {{ selectedYear }}.
          </p>
          <MonthlyMatrixTable :annualKrs="annualKeyResults" />
        </div>

        <!-- Detail Cards -->
        <h3 class="tab-section-title mb-4">Detail Tren & Breakdown Bulanan</h3>

        <div v-if="annualKeyResults.length === 0" class="empty-state card">
          Belum ada Annual Key Result yang di-assign ke Anda.
        </div>

        <div
          v-for="akr in annualKeyResults"
          :key="akr.annualKrId || akr.id"
          class="akr-card card mb-6"
        >
          <div class="akr-card-header">
            <div class="akr-info">
              <span
                class="perspective-badge"
                :class="getPerspectiveClass(akr.bscPerspective)"
              >
                {{ getPerspectiveLabel(akr.bscPerspective) }}
              </span>
              <h4>{{ akr.title }}</h4>
            </div>
            <div class="akr-progress-summary">
              <div class="progress-details">
                <span class="pct-val">{{ akr.aggregatedProgress }}%</span>
                <span class="abs-val"
                  >{{ akr.currentValue }} / {{ akr.targetValue }}
                  {{ akr.unit }}</span
                >
              </div>
              <div class="progress-bar-bg">
                <div
                  class="progress-bar-fill animate-width"
                  :style="{ width: akr.aggregatedProgress + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <div class="akr-card-body">
            <!-- Left Column: Line Chart -->
            <div class="chart-section">
              <h5 class="section-subtitle">Tren Progress Bulanan (%)</h5>
              <MonthlyTrendChart
                :months="akr.months"
                :title="akr.title"
                :unit="akr.unit"
                :bscPerspective="akr.bscPerspective"
              />
            </div>

            <!-- Right Column: Month details -->
            <div class="details-section">
              <h5 class="section-subtitle">Breakdown Bulanan & Target</h5>
              <div class="months-list-scroll">
                <div
                  v-for="m in akr.months"
                  :key="m.month"
                  class="month-row-item"
                >
                  <div class="month-info-col">
                    <span class="month-lbl">{{ m.monthLabel }}</span>
                    <span class="month-wt"
                      >Bobot: {{ Math.round(m.monthWeight * 100) }}%</span
                    >
                  </div>
                  <div class="month-progress-col">
                    <div class="progress-text-row">
                      <span class="target-val"
                        >{{ m.currentValue }} / {{ m.monthTarget }}
                        {{ akr.unit }}</span
                      >
                      <span
                        class="badge"
                        :style="{ marginLeft: '8px' }"
                        :class="getCellClass(m)"
                        >{{ m.progressPercent }}%</span
                      >
                    </div>
                    <div class="assignees-row" v-if="m.leaderAssignees?.length">
                      <span class="lbl-assignee">Leader:</span>
                      <span class="name-assignee">{{
                        m.leaderAssignees.map((l) => l.name).join(", ")
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB: PENDING APPROVAL -->
      <div v-if="activeTab === 'pending' && !loading">
        <div v-if="pendingUpdates.length === 0" class="empty-state card">
          Tidak ada Inisiatif update yang butuh persetujuan.
        </div>
        <div v-else class="pending-list">
          <div v-for="upd in pendingUpdates" :key="upd.id" class="card mb-4">
            <div class="kr-main">
              <div class="kr-title-row mb-2">
                <span class="kr-title">{{ upd.initiative?.title }}</span>
                <span class="badge bg-yellow">PENDING</span>
              </div>
              <div class="text-sm text-gray mb-4">
                <strong>Tim Pelaksana:</strong>
                {{ upd.initiative?.team?.name }}
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
                      class="text-blue hover:underline"
                      style="font-weight: 600"
                    >
                      Link Hasil
                    </a>
                  </span>
                </div>
              </div>

              <div v-if="rejectingId === upd.id" class="reject-form mt-4">
                <textarea
                  v-model="rejectNote"
                  placeholder="Alasan penolakan wajib diisi..."
                  class="form-input"
                ></textarea>
                <div class="modal-actions mt-2">
                  <button
                    class="secondary-btn small"
                    @click="rejectingId = null"
                  >
                    Batal
                  </button>
                  <button
                    class="danger-btn small"
                    @click="confirmReject(upd.id)"
                  >
                    Konfirmasi Tolak
                  </button>
                </div>
              </div>
              <div v-else class="actions-row mt-4">
                <button
                  class="primary-btn small"
                  @click="approveUpdate(upd.id)"
                >
                  Approve
                </button>
                <button class="danger-btn small" @click="rejectingId = upd.id">
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL: Delegasikan KR ke Leader -->
      <div
        v-if="showDelegateModal"
        class="modal-overlay"
        @click.self="showDelegateModal = false"
      >
        <div class="modal-box">
          <div class="modal-header">
            <h3>Delegasikan Key Result ke Leader</h3>
            <button class="modal-close-btn" @click="showDelegateModal = false">
              &times;
            </button>
          </div>
          <p class="mb-4">
            Key Result: <strong>{{ selectedKrDelegate?.title }}</strong>
          </p>

          <label>Pilih Leader *</label>
          <select
            v-model="selectedLeaderId"
            class="form-input"
            style="
              width: 100%;
              padding: 8px;
              margin-bottom: 12px;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
            "
          >
            <option value="">-- Pilih Leader --</option>
            <option
              v-for="leader in leaderList"
              :key="leader.id"
              :value="leader.id"
            >
              {{ leader.name }} ({{ leader.position || "Leader" }})
            </option>
          </select>

          <div
            v-if="delegateError"
            class="alert alert-error"
            style="color: red; margin-bottom: 12px"
          >
            {{ delegateError }}
          </div>

          <div
            class="modal-actions"
            style="display: flex; justify-content: flex-end; gap: 8px"
          >
            <button
              class="secondary-btn"
              @click="showDelegateModal = false"
              style="padding: 8px 16px; border-radius: 6px"
            >
              Batal
            </button>
            <button
              class="primary-btn"
              @click="submitDelegate"
              :disabled="delegateSaving"
              style="
                padding: 8px 16px;
                border-radius: 6px;
                background-color: #0ea5e9;
                color: white;
              "
            >
              {{ delegateSaving ? "Mengirim..." : "Delegasikan" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useRouter } from "vue-router";
import { formatTargetValue } from "~/utils/formatters";

const authStore = useAuthStore();
const router = useRouter();

const objectives = ref([]);
const pendingUpdates = ref([]);
const loading = ref(true);
const errorMsg = ref("");
const activeTab = ref("overview");
const pendingCount = ref(0);
const rejectingId = ref(null);
const rejectNote = ref("");

const showDelegateModal = ref(false);
const selectedKrDelegate = ref(null);
const leaderList = ref([]);
const selectedLeaderId = ref("");
const delegateSaving = ref(false);
const delegateError = ref("");

const annualKeyResults = ref([]);
const annualLoading = ref(false);
const selectedYear = ref("2026");

const expandedKrs = ref({});
function toggleKrExpand(krId) {
  expandedKrs.value[krId] = !expandedKrs.value[krId];
}
function isKrExpanded(krId) {
  return !!expandedKrs.value[krId];
}
function calculateGap(targetVal, currentVal, unit) {
  const t = Number(targetVal) || 0;
  const c = Number(currentVal) || 0;
  const diff = Math.max(0, t - c);
  return formatTargetValue(diff, unit);
}

watch(activeTab, async (newTab) => {
  if (newTab === "annualProgress" && annualKeyResults.value.length === 0) {
    await fetchAnnualKeyResults();
  }
});

async function fetchAnnualKeyResults() {
  annualLoading.value = true;
  errorMsg.value = "";
  try {
    const res = await fetch(
      `${API}/annual-key-results?year=${selectedYear.value}`,
      {
        headers: getHeaders(),
      },
    );
    if (!res.ok) throw new Error("Gagal memuat Annual Key Results");
    const data = await res.json();

    annualKeyResults.value = await Promise.all(
      data.map(async (akr) => {
        try {
          const detailRes = await fetch(
            `${API}/annual-key-results/${akr.id}/monthly-breakdown`,
            {
              headers: getHeaders(),
            },
          );
          if (detailRes.ok) {
            return await detailRes.json();
          }
        } catch (e) {
          console.error(`Gagal memuat detail bulanan untuk KR ${akr.id}`, e);
        }
        return {
          ...akr,
          aggregatedProgress: 0,
          months: [],
        };
      }),
    );
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    annualLoading.value = false;
  }
}

function getCellClass(monthData) {
  if (monthData.monthWeight === 0 && monthData.monthTarget === 0) {
    return "bg-gray";
  }
  const status = monthData.status;
  if (status === "ON_TRACK") return "bg-green";
  if (status === "AT_RISK") return "bg-yellow";
  if (status === "OFF_TRACK") return "bg-red";
  return "bg-gray";
}

function getPerspectiveClass(perspective) {
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

function getPerspectiveLabel(perspective) {
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

const config = useRuntimeConfig();
const API = config.public.apiBase || "http://localhost:3001/api";

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authStore.token}`,
  };
}

onMounted(async () => {
  if (
    !authStore.isAuthenticated ||
    !["MANAGER", "ADMIN", "C_LEVEL"].includes(authStore.user?.role)
  ) {
    router.push("/login");
    return;
  }
  await fetchOverview();
  await fetchPendingUpdates();
});

async function fetchOverview() {
  loading.value = true;
  errorMsg.value = "";
  try {
    const res = await fetch(`${API}/objectives/manager/overview`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Gagal memuat overview");
    objectives.value = await res.json();
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function fetchPendingUpdates() {
  try {
    const res = await fetch(`${API}/initiatives/initiative-updates/pending`, {
      headers: getHeaders(),
    });
    if (res.ok) {
      pendingUpdates.value = await res.json();
      pendingCount.value = pendingUpdates.value.length;
    }
  } catch (e) {
    console.error(e);
  }
}

async function approveUpdate(id) {
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
      await fetchOverview();
    }
  } catch (e) {
    console.error(e);
  }
}

async function fetchLeaders() {
  try {
    const res = await fetch(`${API}/users`, { headers: getHeaders() });
    if (res.ok) {
      const allUsers = await res.json();
      leaderList.value = allUsers.filter((u) => u.role === "LEADER");
    }
  } catch (err) {
    console.error("Error fetching leaders:", err);
  }
}

function openDelegateModal(kr) {
  selectedKrDelegate.value = kr;
  selectedLeaderId.value = "";
  delegateError.value = "";
  showDelegateModal.value = true;
  if (leaderList.value.length === 0) {
    fetchLeaders();
  }
}

async function submitDelegate() {
  if (!selectedLeaderId.value) {
    delegateError.value = "Silakan pilih Leader";
    return;
  }
  delegateSaving.value = true;
  delegateError.value = "";
  try {
    const res = await fetch(
      `${API}/key-results/${selectedKrDelegate.value.id}/delegate`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ leaderId: selectedLeaderId.value }),
      },
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }
    showDelegateModal.value = false;
    await fetchOverview();
    alert("Key Result berhasil didelegasikan!");
  } catch (err) {
    delegateError.value = err.message;
  } finally {
    delegateSaving.value = false;
  }
}

async function confirmReject(id) {
  if (!rejectNote.value) {
    alert("Catatan wajib diisi");
    return;
  }
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
      await fetchPendingUpdates();
    }
  } catch (e) {
    console.error(e);
  }
}

function getProgressPercent(item) {
  if (!item || !item.targetValue) return 0;
  return Math.min(
    100,
    Math.max(0, (item.currentValue / item.targetValue) * 100),
  );
}

function getStatusClass(status) {
  if (status === "ON_TRACK") return "bg-green";
  if (status === "AT_RISK") return "bg-yellow";
  if (status === "OFF_TRACK") return "bg-red";
  return "bg-gray";
}

const DEPT_LABELS = {
  STRATEGIC: "Strategic",
  FINANCE: "Finance",
  BUSINESS: "Business",
  B2S: "B2S",
  B2B_EXPANSION: "B2B Expansion",
  B2B_CORPORATION: "B2B Corporate",
  B2C: "B2C",
  PRODUCT_SERVICE: "Product Service",
  SERVICE_ACCOUNT: "Service Account",
  TECHDEV: "Techdev",
  TECHOPS: "TechOps",
  EDUCATION: "Education",
  SSC: "Shared Service Center",
  DESIGN: "Design",
  DATA: "Data",
  HR: "HR",
  UNASSIGNED: "General / Lainnya",
};

function getDeptLabel(deptKey) {
  return DEPT_LABELS[deptKey] || deptKey;
}

function getGroupedKrs(keyResults) {
  if (!keyResults) return {};
  const groups = {};

  keyResults.forEach((kr) => {
    let depts = [];
    if (kr.departments && kr.departments.length > 0) {
      depts = kr.departments.map((d) => d.department);
    } else {
      // Fallback 1: Parse from bracket prefix in title, e.g. "[B2C] title"
      const titleMatch = kr.title.match(/^\[(.*?)\]/);
      if (titleMatch) {
        const titleDept = titleMatch[1].trim();
        let key = titleDept.toUpperCase().replace(/\s+/g, "_");
        if (key === "B2B_CORPORATE") key = "B2B_CORPORATION";
        depts = [key];
      } else {
        // Fallback 2: Check initiatives' team departments
        const iniDepts = kr.initiatives
          ?.map((ini) => ini.team?.department)
          .filter(Boolean);
        if (iniDepts && iniDepts.length > 0) {
          depts = [...new Set(iniDepts)];
        }
      }
    }

    if (depts.length === 0) {
      depts = ["UNASSIGNED"];
    }

    depts.forEach((dept) => {
      if (!groups[dept]) {
        groups[dept] = [];
      }
      if (!groups[dept].some((item) => item.id === kr.id)) {
        groups[dept].push(kr);
      }
    });
  });

  return groups;
}
</script>

<style scoped>
.admin-root {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 32px;
}
.admin-content {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 2px solid #f1f5f9;
  margin: 16px;
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.tabs {
  display: flex;
  gap: 16px;
  border-bottom: 1px solid #e2e8f0;
}
.tab-btn {
  background: none;
  border: none;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}
.tab-btn.active {
  color: #0ea5e9;
  border-bottom-color: #0ea5e9;
}
.badge-count {
  background: #ef4444;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 11px;
  margin-left: 4px;
}

.obj-block {
  padding: 0;
  overflow: hidden;
}
.obj-header {
  background: #f8fafc;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
}
.obj-header h3 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}

.kr-list {
  display: flex;
  flex-direction: column;
}
.kr-item {
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
}
.kr-item:last-child {
  border-bottom: none;
}
.kr-main {
  margin-bottom: 12px;
}
.kr-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.kr-title {
  font-weight: 600;
  font-size: 15px;
  color: #1e293b;
  margin-bottom: 8px;
}

.badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
}
.bg-green {
  background: #dcfce7;
  color: #166534;
}
.bg-yellow {
  background: #fef08a;
  color: #854d0e;
}
.bg-red {
  background: #fee2e2;
  color: #991b1b;
}
.bg-gray {
  background: #f1f5f9;
  color: #475569;
}
.team-badge {
  font-size: 11px;
  color: #0ea5e9;
  font-weight: 500;
  background: #e0f2fe;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
}

.progress-bar-container {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  width: 300px;
}
.progress-bar {
  height: 100%;
  background: #0ea5e9;
  transition: width 0.3s;
}
.mt-2 {
  margin-top: 8px;
}

.tree-line {
  color: #cbd5e1;
  font-family: monospace;
  margin-right: 8px;
}
.tree-line.indent {
  margin-left: 24px;
}
.initiatives-list {
  margin-top: 12px;
  margin-left: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ini-header {
  display: flex;
  align-items: center;
}
.ini-title {
  font-weight: 500;
  font-size: 14px;
  color: #334155;
}
.tasks-list {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.task-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.task-title {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.text-sm {
  font-size: 12px;
}
.text-gray {
  color: #94a3b8;
}
.text-blue {
  color: #0ea5e9;
  font-weight: 500;
}
.italic {
  font-style: italic;
}

.update-details {
  display: flex;
  gap: 16px;
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-top: 8px;
}
.detail-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.detail-box.flex-2 {
  flex: 2;
}
.lbl {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
}
.val {
  font-size: 14px;
  color: #1e293b;
}

.actions-row {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: flex-end;
}
.primary-btn {
  background: #0ea5e9;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}
.primary-btn.small {
  padding: 4px 12px;
  font-size: 12px;
}
.secondary-btn {
  background: white;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}
.secondary-btn.small {
  padding: 4px 12px;
  font-size: 12px;
}
.danger-btn {
  background: #fee2e2;
  color: #991b1b;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}
.danger-btn.small {
  padding: 4px 12px;
  font-size: 12px;
}

.reject-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  box-sizing: border-box;
}
.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.mb-6 {
  margin-bottom: 24px;
}
.tab-section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}
.tab-section-desc {
  font-size: 13px;
  color: #64748b;
}
.akr-card {
  padding: 0 !important;
  overflow: hidden;
}
.akr-card-header {
  background: #f8fafc;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
.akr-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 60%;
}
.akr-info h4 {
  margin: 0;
  font-size: 16px;
  color: #0f172a;
  font-weight: 600;
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

.akr-progress-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 200px;
}
.progress-details {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.pct-val {
  font-size: 18px;
  font-weight: bold;
  color: #0f172a;
}
.abs-val {
  font-size: 11px;
  color: #64748b;
}
.progress-bar-bg {
  width: 100%;
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background-color: #0ea5e9;
  border-radius: 4px;
}

.akr-card-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: none;
}
@media (max-width: 768px) {
  .akr-card-body {
    grid-template-columns: 1fr;
  }
}
.chart-section {
  padding: 24px;
  border-right: 1px solid #e2e8f0;
}
@media (max-width: 768px) {
  .chart-section {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }
}
.details-section {
  padding: 24px;
  display: flex;
  flex-direction: column;
}
.section-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.months-list-scroll {
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 4px;
}
.month-row-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.month-info-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.month-lbl {
  font-weight: 600;
  color: #0f172a;
  font-size: 13px;
}
.month-wt {
  font-size: 11px;
  color: #64748b;
}
.month-progress-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.progress-text-row {
  display: flex;
  align-items: center;
}
.target-val {
  font-size: 12px;
  color: #334155;
  font-weight: 500;
}
.assignees-row {
  display: flex;
  gap: 4px;
  font-size: 10px;
}
.lbl-assignee {
  color: #64748b;
}
.name-assignee {
  color: #0f172a;
  font-weight: 500;
}
.animate-width {
  transition: width 0.6s ease-in-out;
}
.dept-group-header {
  background: #f8fafc;
  padding: 12px 24px;
  border-bottom: 1px solid #f1f5f9;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
}
.dept-group:first-child .dept-group-header {
  border-top: none;
}
.dept-title-badge {
  font-size: 16px;
  font-weight: 700;
  color: #475569;
  background: var(--color-cyan-100, #cffafe);
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>

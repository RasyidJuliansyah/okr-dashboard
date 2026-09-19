<template>
  <div class="admin-root">
    <div class="admin-content">
      <div class="header-section card">
        <div class="header-title">
          <h2>KR yang Di-assign ke Saya</h2>
          <p class="section-desc">
            Key Results yang menjadi tanggung jawab Anda. Anda bisa membuat
            Inisiatif dari sini.
          </p>
        </div>
      </div>

      <div v-if="loading" class="alert alert-info">Memuat data...</div>
      <div v-else-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>

      <div v-else-if="!loading && !errorMsg">
        <div
          class="filters-container mb-4"
          style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap"
        >
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari KR, Inisiatif, atau Task..."
            class="form-input"
            style="flex: 1; min-width: 200px; margin-bottom: 0"
          />
          <select
            v-model="selectedGroup"
            class="form-input"
            style="width: auto; margin-bottom: 0"
          >
            <option value="">Semua Grup</option>
            <option v-for="dept in availableGroups" :key="dept" :value="dept">
              {{ getDeptLabel(dept) }}
            </option>
          </select>
          <select
            v-model="selectedEmployee"
            class="form-input"
            style="width: auto; margin-bottom: 0"
          >
            <option value="">Semua Pegawai</option>
            <option
              v-for="emp in availableEmployees"
              :key="emp.id"
              :value="emp.id"
            >
              {{ emp.name }}
            </option>
          </select>
          <select
            v-model="selectedSprint"
            class="form-input"
            style="width: auto; margin-bottom: 0"
          >
            <option value="">Semua Sprint</option>
            <option
              v-for="sprint in availableSprints"
              :key="sprint"
              :value="sprint"
            >
              {{ sprint }}
            </option>
          </select>
        </div>

        <div v-if="filteredKrs.length === 0" class="empty-state card">
          Tidak ada KR yang sesuai dengan filter.
        </div>

        <div v-else class="kr-list">
          <div
            v-for="(assigns, deptKey) in getGroupedAssignedKrs(filteredKrs)"
            :key="deptKey"
            class="dept-group mb-6"
          >
            <div class="dept-group-header">
              <span class="dept-title-badge">{{ getDeptLabel(deptKey) }}</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 16px">
              <div
                v-for="assign in assigns"
                :key="assign.id"
                class="kr-card card"
              >
                <div class="kr-header">
                  <div>
                    <h3>{{ assign.keyResult.title }}</h3>
                    <div class="kr-meta">
                      <span class="badge"
                        >Objective: {{ assign.keyResult.objective.title }}</span
                      >
                      <span class="badge"
                        >BSC: {{ assign.keyResult.bscPerspective }}</span
                      >
                      <span
                        class="badge"
                        :class="getStatusClass(assign.keyResult.status)"
                        >Status: {{ assign.keyResult.status }}</span
                      >
                      <span class="badge bg-blue"
                        >RACI: {{ assign.raciRole }}</span
                      >
                      <button
                        v-if="assign.raciRole === 'RESPONSIBLE'"
                        class="secondary-btn small"
                        @click="openReassignModal(assign.keyResult)"
                        style="
                          margin-left: 8px;
                          padding: 2px 6px;
                          font-size: 14px;
                          background-color: #f1f5f9;
                          border: 1px solid #cbd5e1;
                          border-radius: 4px;
                          cursor: pointer;
                          color: #475569;
                        "
                      >
                        Re-assign
                      </button>
                    </div>
                  </div>
                  <div class="kr-progress">
                    <div class="progress-bar-container">
                      <div
                        class="progress-bar"
                        :style="{
                          width: getProgressPercent(assign.keyResult) + '%',
                        }"
                      ></div>
                    </div>
                    <span class="progress-text"
                      >{{
                        formatProgressRange(
                          assign.keyResult.currentValue,
                          assign.keyResult.targetValue,
                          assign.keyResult.unit,
                        )
                      }}
                      ({{
                        getProgressPercent(assign.keyResult).toFixed(1)
                      }}%)</span
                    >
                  </div>
                </div>

                <div class="initiatives-section">
                  <h4>
                    Inisiatif yang sudah dibuat ({{
                      assign.keyResult.initiatives?.length || 0
                    }}):
                  </h4>
                  <ul
                    v-if="assign.keyResult.initiatives?.length > 0"
                    class="ini-list-items"
                  >
                    <li
                      v-for="ini in assign.keyResult.initiatives"
                      :key="ini.id"
                      class="ini-item-row"
                    >
                      <div class="ini-item-main">
                        <div class="ini-info-col">
                          <span class="ini-title">{{ ini.title }}</span>
                          <div class="ini-sub-meta">
                            <span class="badge-team"
                              >→ {{ ini.team?.name }}</span
                            >
                            <span
                              v-if="ini.assignedLeader || ini.owner"
                              class="badge-owner"
                            >
                              PIC: {{ (ini.assignedLeader || ini.owner)?.name }}
                            </span>
                            <span v-if="ini.sprintMonth" class="badge bg-blue">
                              Sprint: {{ ini.sprintMonth }}
                            </span>
                            <span
                              class="badge"
                              :class="getStatusClass(ini.status)"
                              >{{ ini.status }}</span
                            >
                          </div>
                        </div>
                        <div class="ini-actions">
                          <button
                            class="icon-btn"
                            @click="startEditInitiative(ini, assign.keyResult)"
                            title="Edit Inisiatif"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            >
                              <path
                                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                              />
                              <path
                                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                              />
                            </svg>
                          </button>
                          <button
                            v-if="
                              [
                                'ADMIN',
                                'C_LEVEL',
                                'MANAGER',
                                'LEADER',
                                'TEAM',
                              ].includes(authStore.user?.role)
                            "
                            class="icon-btn danger"
                            @click="deleteInitiative(ini.id)"
                            title="Hapus Inisiatif"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path
                                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                              />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <!-- Show Tasks List under Manager's Initiative -->
                      <div
                        v-if="ini.tasks && ini.tasks.length > 0"
                        class="task-nested-list"
                      >
                        <div class="task-nested-header">
                          <span>Tasks (Inisiatif Leader):</span>
                          <button
                            v-if="
                              ['LEADER', 'MANAGER', 'ADMIN'].includes(
                                authStore.user?.role,
                              )
                            "
                            class="create-task-btn"
                            @click="openCreateTaskModal(ini, assign.keyResult)"
                          >
                            + Buat Task ke Team
                          </button>
                        </div>
                        <div
                          v-for="task in ini.tasks"
                          :key="task.id"
                          class="task-nested-row"
                        >
                          <div class="task-nested-left">
                            <div class="task-nested-title">
                              {{ task.title }}
                              <span
                                v-if="task.sprintMonth"
                                class="badge bg-blue"
                                style="font-size: 10px; margin-left: 4px"
                              >
                                {{ task.sprintMonth }}
                              </span>
                            </div>
                            <div
                              class="task-nested-assignees"
                              v-if="
                                task.assignments && task.assignments.length > 0
                              "
                            >
                              <span
                                v-for="a in task.assignments"
                                :key="a.userId"
                                class="task-assignee-tag"
                              >
                                {{ a.user?.name }}
                              </span>
                            </div>
                          </div>
                          <div class="task-nested-meta">
                            <span class="task-nested-progress">
                              {{
                                formatProgressRange(
                                  task.currentValue,
                                  task.targetValue,
                                  task.unit,
                                )
                              }}
                            </span>
                            <span
                              class="badge bg-grey"
                              v-if="task.status === 'ON_TRACK'"
                              >{{ task.status }}</span
                            >
                            <span
                              class="badge bg-red"
                              v-else-if="task.status === 'AT_RISK'"
                              >{{ task.status }}</span
                            >
                            <span class="badge bg-green" v-else>{{
                              task.status
                            }}</span>
                            <button
                              v-if="
                                authStore.user?.role === 'LEADER' ||
                                authStore.user?.role === 'ADMIN' ||
                                authStore.user?.role === 'MANAGER'
                              "
                              class="icon-btn small"
                              @click="
                                startEditTask(task, ini, assign.keyResult)
                              "
                              title="Edit Task"
                              style="padding: 2px 4px; margin-left: 4px"
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              >
                                <path
                                  d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                                />
                                <path
                                  d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                                />
                              </svg>
                            </button>
                            <button
                              v-if="
                                [
                                  'ADMIN',
                                  'C_LEVEL',
                                  'MANAGER',
                                  'LEADER',
                                  'TEAM',
                                ].includes(authStore.user?.role)
                              "
                              class="icon-btn small danger"
                              @click="deleteTask(task.id)"
                              title="Hapus Task"
                              style="padding: 2px 4px; margin-left: 4px"
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path
                                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div v-else class="empty-task-row">
                        <p class="empty-task-text">Belum ada Task Individual</p>
                        <button
                          v-if="
                            ['LEADER', 'MANAGER', 'ADMIN'].includes(
                              authStore.user?.role,
                            )
                          "
                          class="create-task-btn"
                          @click="openCreateTaskModal(ini, assign.keyResult)"
                        >
                          + Buat Task ke Team
                        </button>
                      </div>
                    </li>
                  </ul>
                  <p v-else class="text-gray text-sm">Belum ada Inisiatif</p>
                  <button
                    class="primary-btn mt-2"
                    @click="openInitiativeModal(assign.keyResult)"
                  >
                    {{
                      authStore.user?.role === "LEADER"
                        ? "+ Buat Inisiatif Baru"
                        : "+ Buat Inisiatif dari KR ini"
                    }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL: Buat / Edit Inisiatif -->
      <div
        v-if="showModal"
        class="modal-overlay"
        @click.self="showModal = false"
      >
        <div class="modal-box">
          <div class="modal-header">
            <h3>
              {{
                isCreatingTask
                  ? "Buat Task Baru (Assign ke Team)"
                  : editingTask
                    ? "Edit Task (Inisiatif)"
                    : editingIni
                      ? "Edit Inisiatif"
                      : "Buat Inisiatif Baru"
              }}
            </h3>
            <button class="modal-close-btn" @click="showModal = false">
              &times;
            </button>
          </div>

          <!-- Mode: Creating or Editing Task -->
          <div v-if="isCreatingTask || editingTask">
            <label>Pilih KR Utama *</label>
            <select v-model="form.keyResultId" class="form-input">
              <option value="">-- Pilih KR Utama --</option>
              <option
                v-for="assign in krs"
                :key="assign.keyResult.id"
                :value="assign.keyResult.id"
              >
                {{
                  assign.keyResult.objective?.title
                    ? `[${assign.keyResult.objective.title}] `
                    : ""
                }}{{ assign.keyResult.title }}
              </option>
            </select>

            <label>Pilih Inisiatif Induk *</label>
            <select v-model="form.initiativeId" class="form-input">
              <option value="">-- Pilih Inisiatif Induk --</option>
              <option
                v-for="ini in availableInitiativesForTask"
                :key="ini.id"
                :value="ini.id"
              >
                {{ ini.title }}
                {{ ini.sprintMonth ? `(Sprint: ${ini.sprintMonth})` : "" }}
              </option>
            </select>

            <label>Bulan / Sprint Task *</label>
            <input v-model="form.sprintMonth" type="month" class="form-input" />

            <label>Judul Task *</label>
            <input
              v-model="form.title"
              class="form-input"
              placeholder="Contoh: Membuat draft mockup UI"
            />

            <label>Assign Pegawai (PIC Task) *</label>
            <div class="searchable-field">
              <input
                v-model="leaderUserSearch"
                type="text"
                class="form-input search-mini"
                placeholder="Cari nama pegawai..."
              />
              <select v-model="form.ownerId" class="form-input">
                <option value="">-- Pilih Pegawai --</option>
                <option
                  v-for="user in filteredLeaderUsers"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.name }} ({{ user.position || user.role }})
                </option>
              </select>
            </div>
          </div>

          <!-- Mode: Creating or Editing Initiative -->
          <div v-else>
            <label>Pilih KR Utama *</label>
            <select v-model="form.keyResultId" class="form-input">
              <option value="">-- Pilih KR Utama --</option>
              <option
                v-for="assign in krs"
                :key="assign.keyResult.id"
                :value="assign.keyResult.id"
              >
                {{
                  assign.keyResult.objective?.title
                    ? `[${assign.keyResult.objective.title}] `
                    : ""
                }}{{ assign.keyResult.title }}
              </option>
            </select>

            <label>Judul Inisiatif *</label>
            <input
              v-model="form.title"
              class="form-input"
              placeholder="Contoh: Kampanye B2B"
            />

            <label>Deskripsi</label>
            <textarea
              v-model="form.description"
              class="form-input"
              rows="2"
            ></textarea>

            <label>Bulan / Sprint Inisiatif *</label>
            <input v-model="form.sprintMonth" type="month" class="form-input" />

            <label>Pilih Tim / Departemen Anda *</label>
            <div class="searchable-field">
              <input
                v-model="leaderTeamSearch"
                type="text"
                class="form-input search-mini"
                placeholder="Cari nama departemen / tim..."
              />
              <select v-model="form.teamId" class="form-input">
                <option value="">-- Pilih Tim / Departemen --</option>
                <option
                  v-for="team in filteredLeaderTeams"
                  :key="team.id"
                  :value="team.id"
                >
                  {{ team.name
                  }}{{ team.department ? ` - ${team.department}` : "" }}
                </option>
              </select>
            </div>

            <label>PIC Pegawai / Leader (Penanggung Jawab)</label>
            <div class="searchable-field">
              <input
                v-model="leaderUserSearch"
                type="text"
                class="form-input search-mini"
                placeholder="Cari nama pegawai..."
              />
              <select v-model="form.ownerId" class="form-input">
                <option value="">-- Pilih Pegawai (Opsional) --</option>
                <option
                  v-for="user in filteredLeaderUsers"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.name }}
                </option>
              </select>
            </div>
          </div>

          <UnitTargetInput
            v-model:targetValue="form.targetValue"
            v-model:unit="form.unit"
            :required="true"
          />

          <!-- KpiSelector -->
          <KpiSelector v-model="form.kpis" />

          <div v-if="modalError" class="alert alert-error mt-2">
            {{ modalError }}
          </div>

          <div class="modal-actions">
            <button class="secondary-btn" @click="showModal = false">
              Batal
            </button>
            <button
              class="primary-btn"
              @click="saveInitiative"
              :disabled="saving || !form.unit?.trim()"
            >
              {{
                saving
                  ? "Menyimpan..."
                  : editingIni
                    ? "Simpan Perubahan"
                    : "Simpan"
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

const krs = ref([]);
const myTeams = ref([]);
const userList = ref([]);
const loading = ref(true);
const errorMsg = ref("");

const searchQuery = ref("");
const selectedGroup = ref("");
const selectedEmployee = ref("");
const selectedSprint = ref("");

const availableSprints = computed(() => {
  const sprints = new Set();
  krs.value.forEach((assign) => {
    assign.keyResult.initiatives?.forEach((ini) => {
      if (ini.sprintMonth) sprints.add(ini.sprintMonth);
      ini.tasks?.forEach((t) => {
        if (t.sprintMonth) sprints.add(t.sprintMonth);
      });
    });
  });
  return Array.from(sprints).sort().reverse();
});

const availableEmployees = computed(() => {
  const emps = new Map();
  krs.value.forEach((assign) => {
    assign.keyResult.initiatives?.forEach((ini) => {
      if (ini.owner) emps.set(ini.owner.id, ini.owner);
      ini.tasks?.forEach((t) => {
        t.assignments?.forEach((a) => {
          if (a.user) emps.set(a.user.id, a.user);
        });
      });
    });
  });
  return Array.from(emps.values()).sort((a, b) => a.name.localeCompare(b.name));
});

const availableGroups = computed(() => {
  const groups = new Set();
  krs.value.forEach((assign) => {
    const kr = assign.keyResult;
    let depts = [];
    if (kr.departments && kr.departments.length > 0) {
      depts = kr.departments.map((d) => d.department).filter(Boolean);
    }
    if (depts.length === 0) {
      const titleMatch = kr.title ? kr.title.match(/^\[(.*?)\]/) : null;
      if (titleMatch) {
        let key = titleMatch[1].trim().toUpperCase().replace(/\s+/g, "_");
        if (key === "B2B_CORPORATE") key = "B2B_CORPORATION";
        depts = [key];
      } else {
        const iniDepts = kr.initiatives
          ?.map((ini) => ini.team?.department)
          .filter(Boolean);
        if (iniDepts && iniDepts.length > 0) depts = [...new Set(iniDepts)];
      }
    }
    if (depts.length === 0) depts = ["UNASSIGNED"];
    depts.forEach((d) => groups.add(d));
  });
  return Array.from(groups);
});

const filteredKrs = computed(() => {
  let result = krs.value;

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter((assign) => {
      const matchKr =
        assign.keyResult.title?.toLowerCase().includes(q) ||
        assign.keyResult.objective?.title?.toLowerCase().includes(q);
      const matchIni = assign.keyResult.initiatives?.some(
        (ini) =>
          ini.title?.toLowerCase().includes(q) ||
          ini.tasks?.some((t) => t.title?.toLowerCase().includes(q)),
      );
      return matchKr || matchIni;
    });
  }

  if (selectedEmployee.value) {
    result = result.filter((assign) => {
      return assign.keyResult.initiatives?.some(
        (ini) =>
          ini.owner?.id === selectedEmployee.value ||
          ini.tasks?.some((t) =>
            t.assignments?.some((a) => a.user?.id === selectedEmployee.value),
          ),
      );
    });
  }

  if (selectedSprint.value) {
    result = result.filter((assign) => {
      return assign.keyResult.initiatives?.some(
        (ini) =>
          ini.sprintMonth === selectedSprint.value ||
          ini.tasks?.some((t) => t.sprintMonth === selectedSprint.value),
      );
    });
  }

  return result;
});

const leaderTeamSearch = ref("");
const leaderUserSearch = ref("");

const filteredLeaderTeams = computed(() => {
  if (!leaderTeamSearch.value.trim()) return myTeams.value;
  const q = leaderTeamSearch.value.toLowerCase();
  return myTeams.value.filter(
    (t) =>
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.department && t.department.toLowerCase().includes(q)),
  );
});

const filteredLeaderUsers = computed(() => {
  let list = userList.value;

  // Find selected team's department
  const selectedTeam = myTeams.value.find((t) => t.id === form.value.teamId);

  if (selectedTeam && selectedTeam.department) {
    // Filter to show only employees in the selected team's department
    list = list.filter(
      (u) =>
        u.department &&
        u.department.toLowerCase() === selectedTeam.department.toLowerCase(),
    );
  } else {
    // Fallback: Filter by all departments managed/owned by this manager/leader
    const leaderDept = authStore.user?.department;
    const managedDepts = authStore.user?.managedDepartments || [];

    if (leaderDept || managedDepts.length > 0) {
      list = list.filter((u) => {
        if (!u.department) return false;
        const deptLower = u.department.toLowerCase();
        const isPrimaryDept =
          leaderDept && deptLower === leaderDept.toLowerCase();
        const isManagedDept = managedDepts.some(
          (d) => d.toLowerCase() === deptLower,
        );
        return isPrimaryDept || isManagedDept;
      });
    }
  }

  if (!leaderUserSearch.value.trim()) return list;
  const q = leaderUserSearch.value.toLowerCase();
  return list.filter((u) => u.name && u.name.toLowerCase().includes(q));
});

const showModal = ref(false);
const editingIni = ref(null);
const editingTask = ref(null);
const isCreatingTask = ref(false);
const saving = ref(false);
const modalError = ref("");
const selectedKr = ref(null);
const selectedInitiativeId = ref("");
const form = ref({
  keyResultId: "",
  initiativeId: "",
  title: "",
  description: "",
  teamId: "",
  ownerId: "",
  sprintMonth: "",
  targetValue: 0,
  unit: "%",
  kpis: [],
});

const availableInitiativesForTask = computed(() => {
  const iniList = [];
  krs.value.forEach((assign) => {
    if (
      !form.value.keyResultId ||
      assign.keyResult.id === form.value.keyResultId
    ) {
      assign.keyResult.initiatives?.forEach((ini) => {
        if (!iniList.some((item) => item.id === ini.id)) {
          iniList.push(ini);
        }
      });
    }
  });
  return iniList;
});

watch(
  () => form.value.initiativeId,
  (newIniId) => {
    if (newIniId && (isCreatingTask.value || editingTask.value)) {
      const found = availableInitiativesForTask.value.find(
        (i) => i.id === newIniId,
      );
      if (found) {
        if (found.keyResultId && form.value.keyResultId !== found.keyResultId) {
          form.value.keyResultId = found.keyResultId;
        }
        if (found.sprintMonth && !form.value.sprintMonth) {
          form.value.sprintMonth = found.sprintMonth;
        }
      }
    }
  },
);

watch(
  () => form.value.teamId,
  (newTeamId) => {
    // Reset ownerId if team changes, to avoid assigning a PIC from a different department/team
    form.value.ownerId = "";
  },
);

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
    !["LEADER", "MANAGER", "ADMIN"].includes(authStore.user?.role)
  ) {
    router.push("/login");
    return;
  }
  if (
    authStore.user &&
    (authStore.user.department === undefined ||
      authStore.user.managedDepartments === undefined)
  ) {
    try {
      await authStore.fetchUser();
    } catch (err) {
      console.error(err);
    }
  }
  await Promise.all([fetchData(), fetchMyTeams(), fetchUsers()]);
});

async function fetchUsers() {
  try {
    const res = await fetch(`${API}/users`, { headers: getHeaders() });
    if (res.ok) {
      userList.value = await res.json();
    }
  } catch (err) {
    console.error("Error fetch users:", err);
  }
}

async function fetchData() {
  loading.value = true;
  errorMsg.value = "";
  try {
    const res = await fetch(`${API}/key-results/my/assigned`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Gagal memuat KR");
    const data = await res.json();
    krs.value = data;
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function fetchMyTeams() {
  try {
    const res = await fetch(`${API}/users/teams`, { headers: getHeaders() });
    if (res.ok) {
      const teams = await res.json();
      const userTeamId = authStore.user?.teamId;
      const userDept = authStore.user?.department;
      const managedDepts = authStore.user?.managedDepartments || [];
      myTeams.value = teams.filter(
        (t) =>
          t.leaderId === authStore.user?.id ||
          (userTeamId && t.id === userTeamId) ||
          (userDept && t.department === userDept) ||
          (t.department && managedDepts.includes(t.department)),
      );
    }
  } catch (e) {
    console.error(e);
  }
}

function getProgressPercent(kr) {
  if (!kr || !kr.targetValue) return 0;
  return Math.min(100, Math.max(0, (kr.currentValue / kr.targetValue) * 100));
}

function getStatusClass(status) {
  if (status === "ON_TRACK") return "bg-green";
  if (status === "AT_RISK") return "bg-yellow";
  if (status === "OFF_TRACK") return "bg-red";
  return "bg-gray";
}

function openInitiativeModal(kr) {
  editingIni.value = null;
  editingTask.value = null;
  isCreatingTask.value = false;
  selectedKr.value = kr;
  leaderTeamSearch.value = "";
  leaderUserSearch.value = "";
  selectedInitiativeId.value = "";
  form.value = {
    title: "",
    description: "",
    teamId: myTeams.value[0]?.id || "",
    ownerId: "",
    targetValue: 100,
    unit: "%",
    keyResultId: kr?.id || "",
    sprintMonth: new Date().toISOString().slice(0, 7),
    kpis: [],
  };
  modalError.value = "";
  showModal.value = true;
}

function openCreateTaskModal(ini, kr) {
  editingIni.value = null;
  editingTask.value = null;
  isCreatingTask.value = true;
  selectedKr.value = kr || ini.keyResult;
  selectedInitiativeId.value = ini.id;
  leaderTeamSearch.value = "";
  leaderUserSearch.value = "";
  form.value = {
    keyResultId: kr?.id || ini.keyResultId || "",
    initiativeId: ini.id,
    title: "",
    description: "",
    teamId: ini.teamId || "",
    ownerId: "",
    sprintMonth: ini.sprintMonth || new Date().toISOString().slice(0, 7),
    targetValue: 100,
    unit: "%",
    kpis: [],
  };
  modalError.value = "";
  showModal.value = true;
}

function startEditInitiative(ini, kr) {
  editingIni.value = ini;
  editingTask.value = null;
  isCreatingTask.value = false;
  selectedKr.value = kr || ini.keyResult;
  leaderTeamSearch.value = "";
  leaderUserSearch.value = "";
  form.value = {
    title: ini.title,
    description: ini.description || "",
    teamId: ini.teamId || myTeams.value[0]?.id || "",
    ownerId: ini.ownerId || "",
    targetValue: ini.targetValue || 0,
    unit: ini.unit || "%",
    keyResultId: ini.keyResultId || kr?.id || "",
    sprintMonth: ini.sprintMonth || "",
    kpis: ini.kpis
      ? ini.kpis.map((ik) => ({
          kpiId: ik.kpiId,
          targetValue: ik.targetValue,
          currentValue: ik.currentValue,
          kpi: ik.kpi,
        }))
      : [],
  };
  modalError.value = "";
  showModal.value = true;
}

function startEditTask(task, ini, kr) {
  editingIni.value = null;
  editingTask.value = task;
  isCreatingTask.value = false;
  selectedKr.value = kr;
  selectedInitiativeId.value = ini.id;
  leaderTeamSearch.value = "";
  leaderUserSearch.value = "";
  form.value = {
    keyResultId: kr?.id || ini.keyResultId || "",
    initiativeId: ini.id,
    title: task.title,
    description: "",
    teamId: "",
    ownerId: task.assignedTeamMemberId || task.assignments?.[0]?.userId || "",
    sprintMonth: task.sprintMonth || ini.sprintMonth || "",
    targetValue: task.targetValue || 0,
    unit: task.unit || "%",
    kpis: task.kpis
      ? task.kpis.map((tk) => ({
          kpiId: tk.kpiId,
          targetValue: tk.targetValue,
          currentValue: tk.currentValue,
          kpi: tk.kpi,
        }))
      : [],
  };
  modalError.value = "";
  showModal.value = true;
}

async function deleteInitiative(id) {
  if (
    !confirm(
      "Apakah Anda yakin ingin menghapus Inisiatif ini beserta seluruh Task di dalamnya?",
    )
  ) {
    return;
  }
  try {
    const res = await fetch(`${API}/initiatives/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }
    await fetchData();
  } catch (err) {
    console.error("Delete initiative error:", err);
    alert(err.message || "Gagal menghapus Inisiatif.");
  }
}

async function deleteTask(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus Task ini?")) {
    return;
  }
  try {
    const res = await fetch(`${API}/initiatives/tasks/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }
    await fetchData();
  } catch (err) {
    console.error("Delete task error:", err);
    alert(err.message || "Gagal menghapus Task.");
  }
}

async function saveInitiative() {
  if (isCreatingTask.value) {
    if (!form.value.title || !form.value.initiativeId) {
      modalError.value = "Judul Task dan Inisiatif Induk wajib diisi";
      return;
    }
    if (!form.value.ownerId) {
      modalError.value = "Harap pilih Pegawai untuk di-assign";
      return;
    }
    if (!form.value.unit || !form.value.unit.trim()) {
      modalError.value = "Satuan (Unit) wajib diisi";
      return;
    }
    saving.value = true;
    modalError.value = "";
    try {
      const res = await fetch(
        `${API}/initiatives/${form.value.initiativeId}/tasks`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            title: form.value.title,
            targetValue: form.value.targetValue || 0,
            unit: form.value.unit,
            assigneeId: form.value.ownerId,
            assignedTeamMemberId: form.value.ownerId,
            sprintMonth: form.value.sprintMonth || undefined,
            keyResultId: form.value.keyResultId || undefined,
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      showModal.value = false;
      isCreatingTask.value = false;
      await fetchData();
    } catch (e) {
      modalError.value = e.message || "Gagal membuat task";
    } finally {
      saving.value = false;
    }
    return;
  }

  if (editingTask.value) {
    if (!form.value.title) {
      modalError.value = "Judul wajib diisi";
      return;
    }
    if (!form.value.ownerId) {
      modalError.value = "Harap pilih Pegawai untuk di-assign";
      return;
    }
    if (!form.value.unit || !form.value.unit.trim()) {
      modalError.value = "Satuan (Unit) wajib diisi";
      return;
    }
    saving.value = true;
    modalError.value = "";
    try {
      // 1. Update task details
      const res = await fetch(
        `${API}/initiatives/tasks/${editingTask.value.id}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            title: form.value.title,
            targetValue: form.value.targetValue || 0,
            unit: form.value.unit,
            sprintMonth: form.value.sprintMonth || null,
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      // 2. Update task assignment
      const assignRes = await fetch(
        `${API}/initiatives/tasks/${editingTask.value.id}/assign`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            userIds: [form.value.ownerId],
          }),
        },
      );

      if (!assignRes.ok) {
        const err = await assignRes.json();
        throw new Error(err.message || "Gagal meng-assign task ke pegawai");
      }

      showModal.value = false;
      editingTask.value = null;
      await fetchData();
    } catch (e) {
      modalError.value = e.message || "Gagal menyimpan task";
    } finally {
      saving.value = false;
    }
    return;
  }

  if (!form.value.title || !form.value.teamId || !form.value.keyResultId) {
    modalError.value = "Judul, Tim, dan KR Utama wajib diisi";
    return;
  }
  if (!form.value.unit || !form.value.unit.trim()) {
    modalError.value = "Satuan (Unit) wajib diisi";
    return;
  }

  saving.value = true;
  modalError.value = "";
  try {
    let res;
    if (editingIni.value) {
      res = await fetch(`${API}/initiatives/${editingIni.value.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(form.value),
      });
    } else {
      res = await fetch(`${API}/initiatives`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(form.value),
      });
    }

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }

    showModal.value = false;
    editingIni.value = null;
    await fetchData();
  } catch (e) {
    modalError.value = e.message || "Gagal menyimpan inisiatif";
  } finally {
    saving.value = false;
  }
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

function getGroupedAssignedKrs(assignments) {
  const list =
    assignments && assignments.value !== undefined
      ? assignments.value
      : assignments;
  if (!list || !Array.isArray(list)) return {};
  const groups = {};

  list.forEach((assign) => {
    if (!assign || !assign.keyResult) return;
    const kr = assign.keyResult;

    let depts = [];
    if (kr.departments && kr.departments.length > 0) {
      depts = kr.departments.map((d) => d.department).filter(Boolean);
    }

    if (depts.length === 0) {
      // Fallback 1: Parse from bracket prefix in title, e.g. "[B2C] title"
      const titleMatch =
        kr.title && typeof kr.title === "string"
          ? kr.title.match(/^\[(.*?)\]/)
          : null;
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
      if (selectedGroup.value && dept !== selectedGroup.value) return;

      if (!groups[dept]) {
        groups[dept] = [];
      }
      if (!groups[dept].some((item) => item.id === assign.id)) {
        groups[dept].push(assign);
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
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title h2 {
  font-family: "Rubik", sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.section-desc {
  font-family: "Rubik", sans-serif;
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.kr-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kr-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kr-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.kr-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #0f172a;
}

.kr-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: #f1f5f9;
  color: #475569;
}

.badge-team {
  font-size: 12px;
  color: #0ea5e9;
  font-weight: 500;
  margin-left: 8px;
  margin-right: 8px;
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
.bg-blue {
  background: #dbeafe;
  color: #1e40af;
}
.bg-gray {
  background: #f1f5f9;
  color: #475569;
}

.kr-progress {
  width: 200px;
  text-align: right;
}

.progress-bar-container {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-bar {
  height: 100%;
  background: #0ea5e9;
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: #64748b;
}

.initiatives-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #334155;
}

.initiatives-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.initiatives-section li {
  display: flex;
  align-items: left;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.ini-title {
  font-weight: 500;
  color: #1e293b;
  font-size: 14px;
}

.primary-btn {
  background: #0ea5e9;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.primary-btn:hover {
  background: #0284c7;
}
.primary-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
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
.secondary-btn:hover {
  background: #f8fafc;
}

.mt-2 {
  margin-top: 8px;
}
.mb-4 {
  margin-bottom: 16px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 500px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.modal-header h3 {
  margin: 0;
}
.modal-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #64748b;
  padding: 0;
}
.modal-close-btn:hover {
  color: #0f172a;
}
.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 16px;
  box-sizing: border-box;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
.alert {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.alert-error {
  background: #fee2e2;
  color: #991b1b;
}
.alert-info {
  background: #e0f2fe;
  color: #075985;
}
.searchable-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.search-mini {
  margin-bottom: 0 !important;
  font-size: 13px;
  background: #f8fafc;
}
.ini-list-items {
  list-style: none;
  padding: 0;
  margin: 0 0 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ini-item-row {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: #f8fafc;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  gap: 10px;
}
.ini-item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.task-nested-list {
  border-top: 1px dashed #cbd5e1;
  padding-top: 10px;
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.task-nested-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 2px;
}
.task-nested-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}
.task-nested-title {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}
.task-nested-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}
.task-nested-progress {
  font-size: 12px;
  color: #64748b;
}
.text-red {
  color: #ef4444;
}
.task-nested-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.task-nested-assignees {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.task-assignee-tag {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 11px;
  color: #475569;
}
.ini-info-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ini-sub-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.badge-owner {
  font-size: 12px;
  color: #0369a1;
  background: #e0f2fe;
  padding: 2px 8px;
  border-radius: 12px;
}
.ini-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.icon-btn {
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.icon-btn:hover {
  background: #f1f5f9;
}
.icon-btn.danger:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}
.dept-group-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  margin-top: 16px;
}
.dept-title-badge {
  font-size: 16px;
  font-weight: 700;
  color: #475569;
  background: var(--color-cyan-100, #cffafe);
  padding: 10px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.empty-task-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}
.empty-task-text {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}
.create-task-btn {
  padding: 12px 8px;
  font-size: 12px;
  color: #0284c7;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  background: #ffffff;
  font-weight: 500;
  transition: all 0.2s;
}
.create-task-btn:hover {
  background: #f0f9ff;
  border-color: #7dd3fc;
}
.btn-task-badge {
  padding: 3px 8px;
  font-size: 11px;
  background: #e0f2fe;
  color: #0284c7;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-task-badge:hover {
  background: #bae6fd;
}
</style>

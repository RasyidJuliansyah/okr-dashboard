<template>
  <div class="dept-root">
    <div class="dept-content">
      <!-- Header -->
      <div class="page-header card">
        <div class="header-title">
          <h2>Struktur Departemen</h2>
          <p class="section-desc">
            Kelola hierarki organisasi per departemen. Assign Manager, Leader,
            dan anggota Team serta hubungkan mereka ke Key Result, Initiative,
            dan Task.
          </p>

          <!-- Scope Notice Badge -->
          <div class="scope-banner" :class="userRoleClass">
            <span class="scope-icon">{{ roleIcon }}</span>
            <span class="scope-text">
              <strong>Scope Akses ({{ auth.user?.role }}):</strong>
              {{ scopeDescription }}
            </span>
          </div>
        </div>
        <div
          class="header-actions"
          style="
            display: flex;
            gap: 0.75rem;
            align-items: center;
            flex-wrap: wrap;
          "
        >
          <select v-model="statusFilter" class="dept-filter-select">
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Hanya Aktif</option>
            <option value="INACTIVE">Hanya Nonaktif</option>
          </select>
          <select v-model="selectedDept" class="dept-filter-select">
            <option value="">Semua Departemen</option>
            <option v-for="d in DEPARTMENTS" :key="d.value" :value="d.value">
              {{ d.label }}
            </option>
          </select>
          <button v-if="isAdmin" class="primary-btn" @click="openAddDeptModal">
            + Tambah Dept
          </button>
        </div>
      </div>

      <!-- Alert -->
      <div v-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>
      <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state card">
        Memuat data departemen...
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredDepts.length === 0"
        class="empty-state card"
        style="text-align: center; padding: 2.5rem 1rem"
      >
        <p style="color: var(--text-muted, #94a3b8); margin: 0">
          Tidak ada data departemen yang sesuai dengan filter.
        </p>
      </div>

      <!-- Dept Cards -->
      <div v-else class="dept-grid">
        <div
          v-for="dept in filteredDepts"
          :key="dept.value"
          class="dept-card card"
        >
          <!-- Dept Header -->
          <div class="dept-card-header">
            <div class="dept-header-left">
              <div class="dept-icon">{{ dept.icon }}</div>
              <div>
                <div class="dept-name-row">
                  <h3 class="dept-name">{{ dept.label }}</h3>
                  <span
                    class="status-badge"
                    :class="
                      dept.isActive !== false
                        ? 'status-active'
                        : 'status-inactive'
                    "
                  >
                    {{ dept.isActive !== false ? "Aktif" : "Nonaktif" }}
                  </span>
                </div>
                <p class="dept-member-count">
                  {{ getMemberCount(dept.value) }} anggota
                </p>
              </div>
            </div>
            <div v-if="isAdmin" class="dept-header-right">
              <button
                class="edit-name-btn"
                @click="openEditDeptModal(dept)"
                title="Edit Nama Departemen"
              >
                Edit
              </button>
              <button
                class="status-toggle-btn"
                :class="
                  dept.isActive !== false ? 'btn-deactivate' : 'btn-activate'
                "
                @click="toggleDeptStatus(dept)"
                :title="
                  dept.isActive !== false
                    ? 'Nonaktifkan Departemen'
                    : 'Aktifkan Departemen'
                "
              >
                {{ dept.isActive !== false ? "Nonaktifkan" : "Aktifkan" }}
              </button>
            </div>
          </div>

          <!-- Manager Row -->
          <div class="role-section">
            <div class="role-label manager-label">
              <span class="role-dot manager-dot"></span>
              Manager
            </div>
            <div class="role-member-list">
              <div
                v-if="getManagers(dept.value).length === 0"
                class="empty-role"
              >
                <span class="empty-hint">Belum ada Manager</span>
                <button
                  v-if="isAdmin"
                  class="assign-btn"
                  @click="openAssignRoleModal(dept.value, 'MANAGER')"
                >
                  + Assign Manager
                </button>
              </div>
              <div v-else class="member-chips">
                <div
                  v-for="m in getManagers(dept.value)"
                  :key="m.id"
                  class="member-chip manager-chip"
                >
                  <div
                    class="chip-avatar"
                    :style="{ background: getAvatarColor(m.name) }"
                  >
                    {{ getInitials(m.name) }}
                  </div>
                  <div class="chip-info">
                    <span class="chip-name">{{ m.name }}</span>
                    <span class="chip-pos">{{ m.position || "Manager" }}</span>
                  </div>
                </div>
                <div v-if="isAdmin" class="manager-action-btns">
                  <button
                    class="assign-btn small"
                    @click="openAssignRoleModal(dept.value, 'MANAGER')"
                  >
                    Ubah
                  </button>
                  <button
                    class="assign-btn small btn-danger"
                    @click="removeManager(dept)"
                  >
                    Hapus Manager
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Leader Row -->
          <div class="role-section">
            <div class="role-label leader-label">
              <span class="role-dot leader-dot"></span>
              Leader
            </div>
            <div class="role-member-list">
              <div
                v-if="getLeaders(dept.value).length === 0"
                class="empty-role"
              >
                <span class="empty-hint">Belum ada Leader</span>
                <button
                  v-if="isAdmin"
                  class="assign-btn"
                  @click="openAssignRoleModal(dept.value, 'LEADER')"
                >
                  + Assign Leader
                </button>
              </div>
              <div v-else class="member-chips">
                <div
                  v-for="m in getLeaders(dept.value)"
                  :key="m.id"
                  class="member-chip leader-chip"
                >
                  <div
                    class="chip-avatar"
                    :style="{ background: getAvatarColor(m.name) }"
                  >
                    {{ getInitials(m.name) }}
                  </div>
                  <div class="chip-info">
                    <span class="chip-name">{{ m.name }}</span>
                    <span class="chip-pos">{{ m.position || "Leader" }}</span>
                  </div>
                  <button
                    v-if="isAdmin"
                    class="remove-member-btn"
                    title="Keluarkan dari Departemen"
                    @click="removeUserFromDept(m.id)"
                  >
                    &times;
                  </button>
                </div>
                <button
                  v-if="isAdmin"
                  class="assign-btn small"
                  @click="openAssignRoleModal(dept.value, 'LEADER')"
                >
                  + Edit
                </button>
              </div>
            </div>
          </div>

          <!-- Team Members Row -->
          <div class="role-section">
            <div class="role-label team-label">
              <span class="role-dot team-dot"></span>
              Team Members
            </div>
            <div class="role-member-list">
              <div
                v-if="getTeamMembers(dept.value).length === 0"
                class="empty-role"
              >
                <span class="empty-hint">Belum ada anggota Tim</span>
                <button
                  v-if="isAdmin"
                  class="assign-btn"
                  @click="openAssignRoleModal(dept.value, 'TEAM')"
                >
                  + Assign Anggota
                </button>
              </div>
              <div v-else class="member-chips">
                <div
                  v-for="m in getTeamMembers(dept.value)"
                  :key="m.id"
                  class="member-chip team-chip"
                >
                  <div
                    class="chip-avatar"
                    :style="{ background: getAvatarColor(m.name) }"
                  >
                    {{ getInitials(m.name) }}
                  </div>
                  <div class="chip-info">
                    <span class="chip-name">{{ m.name }}</span>
                    <span class="chip-pos">{{ m.position || "Team" }}</span>
                  </div>
                  <button
                    v-if="isAdmin"
                    class="remove-member-btn"
                    title="Keluarkan dari Departemen"
                    @click="removeUserFromDept(m.id)"
                  >
                    &times;
                  </button>
                </div>
                <button
                  v-if="isAdmin"
                  class="assign-btn small"
                  @click="openAssignRoleModal(dept.value, 'TEAM')"
                >
                  + Edit
                </button>
              </div>
            </div>
          </div>

          <!-- Assign KR / Initiative / Task Buttons -->
          <div v-if="isAdmin || isManager" class="dept-card-actions">
            <button
              class="action-btn kr-btn"
              @click="openAssignKrModal(dept.value)"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Assign RACI KR
            </button>
            <button
              class="action-btn init-btn"
              @click="openAssignInitiativeModal(dept.value)"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Assign Initiative
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── MODAL: Tambah Departemen ─── -->
    <div
      v-if="showAddDeptModal"
      class="modal-backdrop"
      @click.self="showAddDeptModal = false"
    >
      <div class="modal-card card">
        <div class="modal-header">
          <h3>Tambah Departemen Baru</h3>
          <button class="close-btn" @click="showAddDeptModal = false">
            &times;
          </button>
        </div>

        <form @submit.prevent="saveNewDepartment" class="modal-form">
          <div class="form-group">
            <label for="admin-new-dept-name">Nama Departemen *</label>
            <input
              id="admin-new-dept-name"
              v-model="newDeptForm.name"
              @input="generateDeptValue"
              type="text"
              class="form-input"
              placeholder="Contoh: Digital Marketing"
              required
            />
          </div>
          <div class="form-group">
            <label for="admin-new-dept-val">ID/Value Departemen *</label>
            <input
              id="admin-new-dept-val"
              v-model="newDeptForm.value"
              type="text"
              class="form-input"
              placeholder="Contoh: DIGITAL_MARKETING"
              style="text-transform: uppercase"
              required
            />
            <p
              class="pick-meta"
              style="margin-top: 0.25rem; font-size: 0.8rem; color: #5e718d"
            >
              Digunakan sebagai identifier unik dalam sistem.
            </p>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="secondary-btn"
              @click="showAddDeptModal = false"
            >
              Batal
            </button>
            <button
              type="submit"
              class="primary-btn"
              :disabled="saving || !newDeptForm.name || !newDeptForm.value"
            >
              {{ saving ? "Menyimpan..." : "Simpan" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ─── MODAL: Edit Nama Departemen ─── -->
    <div
      v-if="showEditDeptModal"
      class="modal-backdrop"
      @click.self="showEditDeptModal = false"
    >
      <div class="modal-card card">
        <div class="modal-header">
          <h3>Edit Nama Departemen</h3>
          <button class="close-btn" @click="showEditDeptModal = false">
            &times;
          </button>
        </div>

        <form @submit.prevent="saveEditDepartment" class="modal-form">
          <div class="form-group">
            <label for="admin-edit-dept-name">Nama Departemen *</label>
            <input
              id="admin-edit-dept-name"
              v-model="editDeptForm.name"
              type="text"
              class="form-input"
              placeholder="Contoh: Digital Marketing"
              required
            />
          </div>
          <div class="form-group">
            <label for="admin-edit-dept-val">ID / Value Departemen</label>
            <input
              id="admin-edit-dept-val"
              :value="editDeptForm.value"
              type="text"
              class="form-input"
              disabled
              style="
                background: #f8fafc;
                cursor: not-allowed;
                text-transform: uppercase;
              "
            />
            <p
              class="pick-meta"
              style="margin-top: 0.25rem; font-size: 0.8rem; color: #5e718d"
            >
              Kode departemen bersifat permanen untuk integritas relasi sistem.
            </p>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="secondary-btn"
              @click="showEditDeptModal = false"
            >
              Batal
            </button>
            <button
              type="submit"
              class="primary-btn"
              :disabled="saving || !editDeptForm.name.trim()"
            >
              {{ saving ? "Menyimpan..." : "Simpan Perubahan" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ─── MODAL: Assign Role ke Departemen ─── -->
    <div
      v-if="showRoleModal"
      class="modal-backdrop"
      @click.self="showRoleModal = false"
    >
      <div class="modal-card card">
        <div class="modal-header">
          <h3>
            Assign {{ targetRole === "MANAGER" ? "Manager" : "Leader" }} ke
            Departemen {{ getDeptLabel(targetDept) }}
          </h3>
          <button class="close-btn" @click="showRoleModal = false">
            &times;
          </button>
        </div>
        <p class="modal-subtitle">
          Pilih pegawai yang akan dijadikan
          <strong>{{ targetRole === "MANAGER" ? "Manager" : "Leader" }}</strong>
          di departemen ini. Hal ini akan mengupdate data pegawai tersebut.
        </p>

        <div class="search-box" style="margin-bottom: 1rem">
          <input
            v-model="roleSearch"
            type="text"
            placeholder="Cari nama pegawai..."
          />
        </div>

        <div class="user-pick-list">
          <label
            v-for="user in filteredUsersForRole"
            :key="user.id"
            class="user-pick-item"
            :class="{ selected: selectedRoleUserIds.includes(user.id) }"
          >
            <input
              :type="targetRole === 'MANAGER' ? 'checkbox' : 'checkbox'"
              :value="user.id"
              v-model="selectedRoleUserIds"
            />
            <div
              class="chip-avatar small"
              :style="{ background: getAvatarColor(user.name) }"
            >
              {{ getInitials(user.name) }}
            </div>
            <div class="pick-info">
              <span class="pick-name">{{ user.name }}</span>
              <span class="pick-meta"
                >{{ user.position || "-" }} · {{ user.email }}</span
              >
            </div>
            <span class="current-role-badge" :class="user.role.toLowerCase()">{{
              user.role
            }}</span>
          </label>
          <div
            v-if="filteredUsersForRole.length === 0"
            class="empty-hint"
            style="padding: 1rem; text-align: center"
          >
            Tidak ada pegawai ditemukan.
          </div>
        </div>

        <div class="modal-footer">
          <button class="secondary-btn" @click="showRoleModal = false">
            Batal
          </button>
          <button
            class="primary-btn"
            :disabled="saving"
            @click="saveRoleAssignment"
          >
            {{ saving ? "Menyimpan..." : "Simpan" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ─── MODAL: Assign RACI KR ─── -->
    <div
      v-if="showKrModal"
      class="modal-backdrop"
      @click.self="showKrModal = false"
    >
      <div class="modal-card card wide-modal">
        <div class="modal-header">
          <h3>Assign RACI Key Result — Dept. {{ getDeptLabel(targetDept) }}</h3>
          <button class="close-btn" @click="showKrModal = false">
            &times;
          </button>
        </div>
        <p class="modal-subtitle">
          Assign anggota departemen
          <strong>{{ getDeptLabel(targetDept) }}</strong> ke Key Result melalui
          RACI.
        </p>

        <!-- KR select -->
        <div class="form-group" style="margin-bottom: 1rem">
          <label>Pilih Key Result *</label>
          <select
            v-model="selectedKrId"
            @change="loadKrAssignments"
            class="form-select"
          >
            <option value="">-- Pilih Key Result --</option>
            <option v-for="kr in allKrs" :key="kr.id" :value="kr.id">
              {{ kr.objectiveTitle ? `[${kr.objectiveTitle}] ` : ""
              }}{{ kr.title }}
            </option>
          </select>
        </div>

        <div v-if="selectedKrId" class="raci-assign-section">
          <!-- Responsible -->
          <div class="raci-block">
            <div class="raci-block-header">
              <span class="raci-badge r-badge">R</span>
              <span>Responsible <small>— tepat 1 orang</small></span>
            </div>
            <div class="user-pick-list compact">
              <label
                v-for="user in getDeptAllMembers(targetDept)"
                :key="'R-' + user.id"
                class="user-pick-item"
                :class="{ selected: krAssign.responsibleId === user.id }"
              >
                <input
                  type="radio"
                  :value="user.id"
                  v-model="krAssign.responsibleId"
                />
                <div
                  class="chip-avatar small"
                  :style="{ background: getAvatarColor(user.name) }"
                >
                  {{ getInitials(user.name) }}
                </div>
                <div class="pick-info">
                  <span class="pick-name">{{ user.name }}</span>
                  <span class="pick-meta">{{ user.role }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Accountable -->
          <div class="raci-block">
            <div class="raci-block-header">
              <span class="raci-badge a-badge">A</span>
              <span>Accountable <small>— bisa lebih dari 1</small></span>
            </div>
            <div class="user-pick-list compact">
              <label
                v-for="user in getDeptAllMembers(targetDept)"
                :key="'A-' + user.id"
                class="user-pick-item"
                :class="{
                  selected: krAssign.accountableIds.includes(user.id),
                  disabled: user.id === krAssign.responsibleId,
                }"
              >
                <input
                  type="checkbox"
                  :value="user.id"
                  v-model="krAssign.accountableIds"
                  :disabled="user.id === krAssign.responsibleId"
                />
                <div
                  class="chip-avatar small"
                  :style="{ background: getAvatarColor(user.name) }"
                >
                  {{ getInitials(user.name) }}
                </div>
                <div class="pick-info">
                  <span class="pick-name">{{ user.name }}</span>
                  <span class="pick-meta">{{ user.role }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Consulted -->
          <div class="raci-block">
            <div class="raci-block-header">
              <span class="raci-badge c-badge">C</span>
              <span>Consulted <small>— yang perlu dikonsultasi</small></span>
            </div>
            <div class="user-pick-list compact">
              <label
                v-for="user in getDeptAllMembers(targetDept)"
                :key="'C-' + user.id"
                class="user-pick-item"
                :class="{
                  selected: krAssign.consultedIds.includes(user.id),
                  disabled:
                    user.id === krAssign.responsibleId ||
                    krAssign.accountableIds.includes(user.id),
                }"
              >
                <input
                  type="checkbox"
                  :value="user.id"
                  v-model="krAssign.consultedIds"
                  :disabled="
                    user.id === krAssign.responsibleId ||
                    krAssign.accountableIds.includes(user.id)
                  "
                />
                <div
                  class="chip-avatar small"
                  :style="{ background: getAvatarColor(user.name) }"
                >
                  {{ getInitials(user.name) }}
                </div>
                <div class="pick-info">
                  <span class="pick-name">{{ user.name }}</span>
                  <span class="pick-meta">{{ user.role }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Informed -->
          <div class="raci-block">
            <div class="raci-block-header">
              <span class="raci-badge i-badge">I</span>
              <span>Informed <small>— yang perlu diinformasikan</small></span>
            </div>
            <div class="user-pick-list compact">
              <label
                v-for="user in getDeptAllMembers(targetDept)"
                :key="'I-' + user.id"
                class="user-pick-item"
                :class="{
                  selected: krAssign.informedIds.includes(user.id),
                }"
              >
                <input
                  type="checkbox"
                  :value="user.id"
                  v-model="krAssign.informedIds"
                />
                <div
                  class="chip-avatar small"
                  :style="{ background: getAvatarColor(user.name) }"
                >
                  {{ getInitials(user.name) }}
                </div>
                <div class="pick-info">
                  <span class="pick-name">{{ user.name }}</span>
                  <span class="pick-meta">{{ user.role }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="secondary-btn" @click="showKrModal = false">
            Batal
          </button>
          <button
            class="primary-btn"
            :disabled="saving || !selectedKrId"
            @click="saveKrAssignment"
          >
            {{ saving ? "Menyimpan..." : "Simpan RACI" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ─── MODAL: Assign Initiative ─── -->
    <div
      v-if="showInitModal"
      class="modal-backdrop"
      @click.self="showInitModal = false"
    >
      <div class="modal-card card">
        <div class="modal-header">
          <h3>Assign Initiative — Dept. {{ getDeptLabel(targetDept) }}</h3>
          <button class="close-btn" @click="showInitModal = false">
            &times;
          </button>
        </div>
        <p class="modal-subtitle">
          Assign anggota <strong>{{ getDeptLabel(targetDept) }}</strong> ke Task
          dalam Initiative.
        </p>

        <!-- Initiative select -->
        <div class="form-group" style="margin-bottom: 0.75rem">
          <label>Pilih Initiative *</label>
          <select
            v-model="selectedInitiativeId"
            @change="loadInitiativeTasks"
            class="form-select"
          >
            <option value="">-- Pilih Initiative --</option>
            <option
              v-for="init in allInitiatives"
              :key="init.id"
              :value="init.id"
            >
              {{ init.title }} (KR: {{ init.keyResult?.title || "-" }})
            </option>
          </select>
        </div>

        <!-- Task List -->
        <div
          v-if="selectedInitiativeId && selectedInitiativeTasks.length > 0"
          class="task-assign-section"
        >
          <div
            v-for="task in selectedInitiativeTasks"
            :key="task.id"
            class="task-assign-row"
          >
            <div class="task-assign-title">
              {{ task.title }}
              <span class="task-target-badge"
                >Target: {{ task.targetValue }} {{ task.unit }}</span
              >
            </div>
            <div class="user-pick-list compact">
              <label
                v-for="user in getDeptAllMembers(targetDept)"
                :key="task.id + '-' + user.id"
                class="user-pick-item"
                :class="{
                  selected: (taskAssignMap[task.id] || []).includes(user.id),
                }"
              >
                <input
                  type="checkbox"
                  :value="user.id"
                  :checked="(taskAssignMap[task.id] || []).includes(user.id)"
                  @change="toggleTaskAssign(task.id, user.id, $event)"
                />
                <div
                  class="chip-avatar small"
                  :style="{ background: getAvatarColor(user.name) }"
                >
                  {{ getInitials(user.name) }}
                </div>
                <div class="pick-info">
                  <span class="pick-name">{{ user.name }}</span>
                  <span class="pick-meta">{{ user.role }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div
          v-else-if="
            selectedInitiativeId && selectedInitiativeTasks.length === 0
          "
          class="empty-hint"
          style="padding: 1rem; text-align: center"
        >
          Initiative ini belum memiliki Task.
        </div>

        <div class="modal-footer">
          <button class="secondary-btn" @click="showInitModal = false">
            Batal
          </button>
          <button
            class="primary-btn"
            :disabled="saving || !selectedInitiativeId"
            @click="saveTaskAssignments"
          >
            {{ saving ? "Menyimpan..." : "Simpan Assignment" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";

const config = useRuntimeConfig();
const auth = useAuthStore();
const API = config.public.apiBase;
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${auth.token || localStorage.getItem("auth_token")}`,
});

// ─── Roles & Permissions ───
const isAdmin = computed(() => auth.user?.role === "ADMIN");
const isCLevel = computed(() => auth.user?.role === "C_LEVEL");
const isManager = computed(() => auth.user?.role === "MANAGER");
const isLeader = computed(() => auth.user?.role === "LEADER");
const isTeam = computed(() => auth.user?.role === "TEAM");

const userRoleClass = computed(() => {
  const role = auth.user?.role;
  if (role === "ADMIN") return "scope-admin";
  if (role === "C_LEVEL") return "scope-clevel";
  if (role === "MANAGER") return "scope-manager";
  if (role === "LEADER") return "scope-leader";
  return "scope-team";
});

const roleIcon = computed(() => {
  const role = auth.user?.role;
  if (role === "ADMIN") return "⚡";
  if (role === "C_LEVEL") return "👑";
  if (role === "MANAGER") return "🏢";
  if (role === "LEADER") return "🎯";
  return "👤";
});

const scopeDescription = computed(() => {
  if (isAdmin.value || isCLevel.value) {
    return "Menampilkan seluruh struktur hierarki departemen (Company-wide).";
  }
  if (isManager.value) {
    return `Scope Manager: Memantau dan mengelola struktur hierarki departemen ${auth.user?.department || ""}.`;
  }
  if (isLeader.value) {
    return `Scope Leader: Memantau struktur tim dan penugasan departemen ${auth.user?.department || ""}.`;
  }
  return `Scope Team: Melihat struktur dan rekan kerja di departemen ${auth.user?.department || ""}.`;
});

// ─── State ───
const loading = ref(false);
const saving = ref(false);
const errorMsg = ref("");
const successMsg = ref("");
const selectedDept = ref("");
const statusFilter = ref("ALL");

const allUsers = ref([]);
const allKrs = ref([]);
const allInitiatives = ref([]);

// ─── Modal state ───
const showRoleModal = ref(false);
const targetDept = ref("");
const targetRole = ref("");
const roleSearch = ref("");
const selectedRoleUserIds = ref([]);

const showKrModal = ref(false);
const selectedKrId = ref("");
const krAssign = ref({
  responsibleId: "",
  accountableIds: [],
  consultedIds: [],
  informedIds: [],
});

const showInitModal = ref(false);
const selectedInitiativeId = ref("");
const selectedInitiativeTasks = ref([]);
const taskAssignMap = ref({}); // { [taskId]: userId[] }

const showAddDeptModal = ref(false);
const newDeptForm = ref({ name: "", value: "" });
const showEditDeptModal = ref(false);
const editDeptForm = ref({ id: "", name: "", value: "" });

// ─── Departments Config ───
const DEPARTMENTS = ref([]);

// ─── Computed ───
const filteredDepts = computed(() => {
  return DEPARTMENTS.value.filter((d) => {
    if (selectedDept.value && d.value !== selectedDept.value) return false;
    if (statusFilter.value === "ACTIVE" && d.isActive === false) return false;
    if (statusFilter.value === "INACTIVE" && d.isActive !== false) return false;
    return true;
  });
});

const filteredUsersForRole = computed(() => {
  return allUsers.value.filter((u) => {
    const matchSearch =
      !roleSearch.value ||
      u.name.toLowerCase().includes(roleSearch.value.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(roleSearch.value.toLowerCase());
    return matchSearch;
  });
});

// ─── Helpers ───
function getManagers(deptVal) {
  const deptObj = DEPARTMENTS.value.find((d) => d.value === deptVal);
  if (deptObj && deptObj.manager) {
    return [deptObj.manager];
  }
  return [];
}
function getLeaders(dept) {
  return allUsers.value.filter(
    (u) => u.department === dept && u.role === "LEADER",
  );
}
function getTeamMembers(dept) {
  return allUsers.value.filter(
    (u) => u.department === dept && u.role === "TEAM",
  );
}
function getDeptAllMembers(dept) {
  return allUsers.value.filter((u) => u.department === dept);
}
function getMemberCount(dept) {
  return allUsers.value.filter((u) => u.department === dept).length;
}
function getDeptLabel(val) {
  return DEPARTMENTS.value.find((d) => d.value === val)?.label || val;
}
function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}
function getAvatarColor(name) {
  const colors = [
    "#0E97D6",
    "#0583C3",
    "#7C3AED",
    "#DB2777",
    "#EA580C",
    "#00A925",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── Fetch ───
const FALLBACK_ICONS = ["", "", "", "", "", "", "", ""];

async function fetchDepartments() {
  try {
    const res = await fetch(`${API}/departments`, { headers: getHeaders() });
    const data = await res.json();
    DEPARTMENTS.value = data.map((d, index) => ({
      id: d.id,
      value: d.value,
      label: d.name,
      isActive: d.isActive !== undefined ? d.isActive : true,
      managerId: d.managerId,
      manager: d.manager,
      icon: FALLBACK_ICONS[index % FALLBACK_ICONS.length],
    }));
  } catch (e) {
    console.error("Gagal memuat departemen");
  }
}

async function toggleDeptStatus(dept) {
  const willBeInactive = dept.isActive !== false;
  const msg = willBeInactive
    ? `Nonaktifkan departemen "${dept.label}"? Akses user departemen ini ke data OKR/BSC akan dibatasi.`
    : `Aktifkan kembali departemen "${dept.label}"?`;

  if (!confirm(msg)) return;

  saving.value = true;
  errorMsg.value = "";
  try {
    const res = await fetch(`${API}/departments/${dept.id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ isActive: !dept.isActive }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal mengubah status departemen");
    }
    successMsg.value = `Status departemen "${dept.label}" berhasil diperbarui.`;
    await fetchDepartments();
    setTimeout(() => (successMsg.value = ""), 4000);
  } catch (e) {
    errorMsg.value = e.message || "Gagal mengubah status departemen";
  } finally {
    saving.value = false;
  }
}

async function removeManager(dept) {
  if (
    !confirm(
      `Hapus jabatan Manager dari departemen "${dept.label}"? Jika user tidak mengelola departemen lain, role-nya akan diturunkan ke TEAM.`,
    )
  )
    return;

  saving.value = true;
  errorMsg.value = "";
  try {
    const res = await fetch(`${API}/departments/${dept.id}/manager`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ userId: null }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal menghapus manager");
    }
    successMsg.value = `Manager departemen "${dept.label}" berhasil dihapus.`;
    await Promise.all([fetchDepartments(), fetchUsers()]);
    setTimeout(() => (successMsg.value = ""), 4000);
  } catch (e) {
    errorMsg.value = e.message || "Gagal menghapus manager";
  } finally {
    saving.value = false;
  }
}

async function fetchUsers() {
  loading.value = true;
  try {
    const res = await fetch(`${API}/users`, { headers: getHeaders() });
    allUsers.value = await res.json();
  } catch (e) {
    errorMsg.value = "Gagal memuat data pegawai";
  } finally {
    loading.value = false;
  }
}

async function fetchKrs() {
  try {
    const res = await fetch(`${API}/objectives`, { headers: getHeaders() });
    const objs = await res.json();
    allKrs.value = objs.flatMap((o) =>
      (o.keyResults || []).map((kr) => ({ ...kr, objectiveTitle: o.title })),
    );
  } catch (e) {
    console.error("Gagal memuat KR");
  }
}

async function fetchInitiatives() {
  try {
    const res = await fetch(`${API}/initiatives`, { headers: getHeaders() });
    allInitiatives.value = await res.json();
  } catch (e) {
    console.error("Gagal memuat Initiative");
  }
}

// ─── Add Department ───
function openAddDeptModal() {
  newDeptForm.value = { name: "", value: "" };
  showAddDeptModal.value = true;
}

function generateDeptValue() {
  if (!newDeptForm.value.name) {
    newDeptForm.value.value = "";
    return;
  }
  newDeptForm.value.value = newDeptForm.value.name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")
    .replace(/_+/g, "_");
}

async function saveNewDepartment() {
  saving.value = true;
  errorMsg.value = "";
  try {
    const res = await fetch(`${API}/departments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(newDeptForm.value),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }
    successMsg.value = "Departemen berhasil ditambahkan!";
    showAddDeptModal.value = false;
    await fetchDepartments();
    setTimeout(() => (successMsg.value = ""), 4000);
  } catch (e) {
    errorMsg.value = e.message || "Gagal menambahkan departemen";
  } finally {
    saving.value = false;
  }
}

function openEditDeptModal(dept) {
  editDeptForm.value = {
    id: dept.id,
    name: dept.label,
    value: dept.value,
  };
  showEditDeptModal.value = true;
}

async function saveEditDepartment() {
  if (!editDeptForm.value.name.trim()) return;
  saving.value = true;
  errorMsg.value = "";
  try {
    const res = await fetch(`${API}/departments/${editDeptForm.value.id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ name: editDeptForm.value.name.trim() }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Gagal mengubah nama departemen");
    }
    successMsg.value = "Nama departemen berhasil diperbarui!";
    showEditDeptModal.value = false;
    await fetchDepartments();
    setTimeout(() => (successMsg.value = ""), 4000);
  } catch (e) {
    errorMsg.value = e.message || "Gagal mengubah nama departemen";
  } finally {
    saving.value = false;
  }
}

// ─── Assign Role ───
function openAssignRoleModal(dept, role) {
  targetDept.value = dept;
  targetRole.value = role;
  roleSearch.value = "";

  if (role === "MANAGER") {
    const deptObj = DEPARTMENTS.value.find((d) => d.value === dept);
    selectedRoleUserIds.value =
      deptObj && deptObj.managerId ? [deptObj.managerId] : [];
  } else if (role === "LEADER") {
    selectedRoleUserIds.value = allUsers.value
      .filter((u) => u.department === dept && u.role === role)
      .map((u) => u.id);
  } else if (role === "TEAM") {
    selectedRoleUserIds.value = allUsers.value
      .filter((u) => u.department === dept && u.role === role)
      .map((u) => u.id);
  }

  showRoleModal.value = true;
}

async function saveRoleAssignment() {
  saving.value = true;
  errorMsg.value = "";
  try {
    if (targetRole.value === "MANAGER") {
      const deptObj = DEPARTMENTS.value.find(
        (d) => d.value === targetDept.value,
      );
      const userId =
        selectedRoleUserIds.value.length > 0
          ? selectedRoleUserIds.value[0]
          : null;

      const res = await fetch(`${API}/departments/${deptObj.id}/manager`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error("Gagal update manager");
    } else {
      const prevMembers = allUsers.value.filter(
        (u) => u.department === targetDept.value && u.role === targetRole.value,
      );

      // Users to assign to this dept and role
      for (const uid of selectedRoleUserIds.value) {
        await fetch(`${API}/users/${uid}`, {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            role: targetRole.value,
            department: targetDept.value,
          }),
        });
      }

      // Users who were deselected (removed from this role & department)
      for (const prev of prevMembers) {
        if (!selectedRoleUserIds.value.includes(prev.id)) {
          await fetch(`${API}/users/${prev.id}`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify({ department: null, role: "TEAM" }),
          });
        }
      }
    }

    successMsg.value = `${targetRole.value === "MANAGER" ? "Manager" : targetRole.value === "LEADER" ? "Leader" : "Anggota Tim"} berhasil diupdate untuk departemen ${getDeptLabel(targetDept.value)}`;
    showRoleModal.value = false;
    await fetchDepartments();
    await fetchUsers();
    setTimeout(() => (successMsg.value = ""), 4000);
  } catch (e) {
    errorMsg.value = e.message || "Gagal menyimpan assignment role";
  } finally {
    saving.value = false;
  }
}

async function removeUserFromDept(userId) {
  if (
    !confirm(
      "Apakah Anda yakin ingin mengeluarkan pegawai ini dari struktur departemen? (Data master tidak akan terhapus)",
    )
  )
    return;
  try {
    const res = await fetch(`${API}/users/${userId}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ department: null }),
    });
    if (res.ok) {
      successMsg.value = "Pegawai berhasil dikeluarkan dari departemen.";
      await Promise.all([fetchDepartments(), fetchUsers()]);
      setTimeout(() => (successMsg.value = ""), 3000);
    } else {
      const err = await res.json();
      errorMsg.value = err.message || "Gagal mengeluarkan pegawai";
    }
  } catch (e) {
    errorMsg.value = e.message;
  }
}

// ─── Assign RACI KR ───
function openAssignKrModal(dept) {
  targetDept.value = dept;
  selectedKrId.value = "";
  krAssign.value = {
    responsibleId: "",
    accountableIds: [],
    consultedIds: [],
    informedIds: [],
  };
  showKrModal.value = true;
}

async function loadKrAssignments() {
  if (!selectedKrId.value) return;
  try {
    const res = await fetch(
      `${API}/key-results/${selectedKrId.value}/assignments`,
      { headers: getHeaders() },
    );
    const data = await res.json();
    krAssign.value.responsibleId =
      data.assignments?.find((a) => a.raciRole === "RESPONSIBLE")?.userId || "";
    krAssign.value.accountableIds =
      data.assignments
        ?.filter((a) => a.raciRole === "ACCOUNTABLE")
        .map((a) => a.userId) || [];
    krAssign.value.consultedIds =
      data.assignments
        ?.filter((a) => a.raciRole === "CONSULTED")
        .map((a) => a.userId) || [];
    krAssign.value.informedIds =
      data.assignments
        ?.filter((a) => a.raciRole === "INFORMED")
        .map((a) => a.userId) || [];
  } catch (e) {
    console.error("Gagal load KR assignments");
  }
}

async function saveKrAssignment() {
  if (!krAssign.value.responsibleId) {
    errorMsg.value = "Wajib menentukan 1 orang sebagai Responsible";
    return;
  }
  if (krAssign.value.accountableIds.length === 0) {
    errorMsg.value = "Wajib menentukan minimal 1 orang sebagai Accountable";
    return;
  }
  saving.value = true;
  errorMsg.value = "";
  try {
    const assignments = [
      { userId: krAssign.value.responsibleId, raciRole: "RESPONSIBLE" },
      ...krAssign.value.accountableIds.map((id) => ({
        userId: id,
        raciRole: "ACCOUNTABLE",
      })),
      ...krAssign.value.consultedIds.map((id) => ({
        userId: id,
        raciRole: "CONSULTED",
      })),
      ...krAssign.value.informedIds.map((id) => ({
        userId: id,
        raciRole: "INFORMED",
      })),
    ];

    const res = await fetch(`${API}/key-results/${selectedKrId.value}/assign`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ assignments, departments: [targetDept.value] }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }

    successMsg.value = "RACI Assignment berhasil disimpan!";
    showKrModal.value = false;
    setTimeout(() => (successMsg.value = ""), 4000);
  } catch (e) {
    errorMsg.value = e.message || "Gagal menyimpan RACI";
  } finally {
    saving.value = false;
  }
}

// ─── Assign Initiative Task ───
function openAssignInitiativeModal(dept) {
  targetDept.value = dept;
  selectedInitiativeId.value = "";
  selectedInitiativeTasks.value = [];
  taskAssignMap.value = {};
  showInitModal.value = true;
}

async function loadInitiativeTasks() {
  if (!selectedInitiativeId.value) return;
  const init = allInitiatives.value.find(
    (i) => i.id === selectedInitiativeId.value,
  );
  selectedInitiativeTasks.value = init?.tasks || [];
  // build taskAssignMap from existing assignments
  const map = {};
  for (const task of selectedInitiativeTasks.value) {
    map[task.id] = (task.assignments || []).map((a) => a.userId);
  }
  taskAssignMap.value = map;
}

function toggleTaskAssign(taskId, userId, event) {
  if (!taskAssignMap.value[taskId]) taskAssignMap.value[taskId] = [];
  if (event.target.checked) {
    taskAssignMap.value[taskId].push(userId);
  } else {
    taskAssignMap.value[taskId] = taskAssignMap.value[taskId].filter(
      (id) => id !== userId,
    );
  }
}

async function saveTaskAssignments() {
  saving.value = true;
  errorMsg.value = "";
  try {
    for (const [taskId, userIds] of Object.entries(taskAssignMap.value)) {
      const res = await fetch(`${API}/initiatives/tasks/${taskId}/assign`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ userIds }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
    }
    successMsg.value = "Task Assignment berhasil disimpan!";
    showInitModal.value = false;
    await fetchInitiatives();
    setTimeout(() => (successMsg.value = ""), 4000);
  } catch (e) {
    errorMsg.value = e.message || "Gagal menyimpan Task assignment";
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await fetchDepartments();
  await Promise.all([fetchUsers(), fetchKrs(), fetchInitiatives()]);
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap");

.dept-root {
  min-height: 100vh;
  background: var(--content-bg, #f8fafc);
  padding: 2rem;
  font-family: "Rubik", sans-serif;
}

.dept-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: #ffffff;
  border-radius: 14px;
  padding: 1.5rem;
  border: 1px solid #f0f3f9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-title h2 {
  font-size: 1.5rem;
  color: #2d3643;
  margin: 0 0 0.25rem;
  font-weight: 600;
}
.section-desc {
  color: #5e718d;
  font-size: 0.88rem;
  margin: 0;
}
/* Scope Banner */
.scope-banner {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 500;
}

.scope-banner.scope-admin {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}
.scope-banner.scope-clevel,
.scope-banner.scope-c_level {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}
.scope-banner.scope-manager {
  background: #fefce8;
  border: 1px solid #fef08a;
  color: #854d0e;
}
.scope-banner.scope-leader {
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  color: #6b21a8;
}
.scope-banner.scope-team {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.dept-filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  background: #f8fafc;
  color: #2d3643;
  cursor: pointer;
}

/* Alerts */
.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}
.alert-error {
  background: #fff1f0;
  border: 1px solid #ffa39e;
  color: #cf1322;
}
.alert-success {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #389e0d;
}

.loading-state {
  color: #5e718d;
  font-size: 0.95rem;
}

/* Dept Grid */
.dept-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 1.5rem;
}

.dept-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dept-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f0f3f9;
}
.dept-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.dept-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.status-active {
  background: #e6f4ea;
  color: #137333;
}
.status-inactive {
  background: #fce8e6;
  color: #c5221f;
}
.edit-name-btn {
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #d0d5dd;
  background: #ffffff;
  color: #344054;
  transition: all 0.15s;
}
.edit-name-btn:hover {
  background: #f2f4f7;
  border-color: #98a2b3;
}

.status-toggle-btn {
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
}
.btn-deactivate {
  background: #fff1f0;
  color: #cf1322;
  border-color: #ffa39e;
}
.btn-deactivate:hover {
  background: #ffccc7;
}
.btn-activate {
  background: #f6ffed;
  color: #389e0d;
  border-color: #b7eb8f;
}
.btn-activate:hover {
  background: #d9f7be;
}
.manager-action-btns {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}
.btn-danger {
  color: #cf1322 !important;
  border-color: #ffa39e !important;
}
.btn-danger:hover {
  background: #fff1f0 !important;
  border-color: #cf1322 !important;
}
.dept-icon {
  font-size: 1.8rem;
}
.dept-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3643;
  margin: 0 0 0.1rem;
}
.dept-member-count {
  font-size: 0.8rem;
  color: #8897ae;
  margin: 0;
}

/* Role Sections */
.role-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.role-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.role-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.manager-dot {
  background: #7c3aed;
}
.leader-dot {
  background: #0e97d6;
}
.team-dot {
  background: #00a925;
}
.manager-label {
  color: #7c3aed;
}
.leader-label {
  color: #0e97d6;
}
.team-label {
  color: #00a925;
}

.role-member-list {
  padding-left: 1.25rem;
}

.empty-role {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.empty-hint {
  font-size: 0.82rem;
  color: #aab4c4;
  font-style: italic;
}

/* Member Chips */
.member-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
.member-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.6rem 0.3rem 0.35rem;
  border-radius: 20px;
  font-size: 0.82rem;
}
.manager-chip {
  background: #f5f0ff;
  border: 1px solid #d6bbfb;
}
.leader-chip {
  background: #e8f6fd;
  border: 1px solid #9dd6ef;
}
.team-chip {
  background: #f0fff4;
  border: 1px solid #9de0a8;
}

.chip-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.chip-avatar.small {
  width: 28px;
  height: 28px;
  font-size: 0.7rem;
}
.chip-info {
  display: flex;
  flex-direction: column;
}
.chip-name {
  font-weight: 500;
  color: #2d3643;
  font-size: 0.82rem;
}
.chip-pos {
  font-size: 0.72rem;
  color: #8897ae;
}

/* Action Buttons */
.assign-btn {
  padding: 0.3rem 0.65rem;
  font-size: 0.78rem;
  border: 1px dashed #c8d3e0;
  border-radius: 6px;
  background: transparent;
  color: #5e718d;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.assign-btn:hover {
  border-color: #0e97d6;
  color: #0e97d6;
  background: #e8f6fd;
}
.assign-btn.small {
  padding: 0.2rem 0.5rem;
}

.dept-card-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-top: 0.75rem;
  border-top: 1px solid #f0f3f9;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.kr-btn {
  background: #ede9fe;
  color: #7c3aed;
}
.kr-btn:hover {
  background: #ddd6fe;
}
.init-btn {
  background: #fff7ed;
  color: #c2410c;
}
.init-btn:hover {
  background: #ffedd5;
}

/* Buttons */
.primary-btn {
  padding: 0.55rem 1.2rem;
  background: #0e97d6;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.primary-btn:hover:not(:disabled) {
  background: #0583c3;
}
.primary-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.secondary-btn {
  padding: 0.55rem 1.2rem;
  background: transparent;
  color: #5e718d;
  border: 1px solid #d1d9e6;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.secondary-btn:hover {
  background: #f8fafc;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 1rem;
}
.modal-card {
  width: 100%;
  max-width: 540px;
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.wide-modal {
  max-width: 780px;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-header h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #2d3643;
  font-weight: 600;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: #8897ae;
  line-height: 1;
}
.close-btn:hover {
  color: #2d3643;
}
.modal-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: #5e718d;
}
.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 0.75rem;
  border-top: 1px solid #f0f3f9;
}

/* Search / Form */
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-box input,
.form-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  color: #2d3643;
  background: #f8fafc;
  box-sizing: border-box;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.form-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #5e718d;
}

/* User Pick List */
.user-pick-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem;
  background: #fafbfc;
}
.user-pick-list.compact {
  max-height: 180px;
}

.user-pick-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.1s;
  border: 1px solid transparent;
}
.user-pick-item:hover {
  background: #f0f5ff;
}
.user-pick-item.selected {
  background: #e8f6fd;
  border-color: #9dd6ef;
}
.user-pick-item.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pick-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.pick-name {
  font-size: 0.88rem;
  font-weight: 500;
  color: #2d3643;
}
.pick-meta {
  font-size: 0.75rem;
  color: #8897ae;
}

.current-role-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  text-transform: uppercase;
}
.current-role-badge.admin {
  background: #fff1b8;
  color: #ad6800;
}
.current-role-badge.manager {
  background: #f5f0ff;
  color: #7c3aed;
}
.current-role-badge.leader {
  background: #e8f6fd;
  color: #0e97d6;
}
.current-role-badge.team {
  background: #f0fff4;
  color: #00a925;
}
.current-role-badge.c_level {
  background: #fff7ed;
  color: #c2410c;
}

/* RACI blocks */
.raci-assign-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.raci-block {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.raci-block-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #2d3643;
}
.raci-block-header small {
  font-weight: 400;
  color: #8897ae;
}
.raci-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
}
.r-badge {
  background: #16a34a;
}
.a-badge {
  background: #dc2626;
}
.c-badge {
  background: #2563eb;
}
.i-badge {
  background: #7c3aed;
}

/* Task Assign */
.task-assign-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.task-assign-row {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.task-assign-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #2d3643;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.task-target-badge {
  font-size: 0.75rem;
  font-weight: 400;
  background: #f0f3f9;
  color: #5e718d;
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
}

.remove-member-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 1.15rem;
  line-height: 1;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  transition: all 0.2s ease;
}
.remove-member-btn:hover {
  background: #fee2e2;
  color: #b91c1c;
}
</style>

<template>
  <div class="admin-root">
    <div class="admin-content">
      <div class="header-section card">
        <div class="header-title">
          <h2>Manajemen Data Pegawai</h2>
          <p class="section-desc">
            Kelola data pegawai, posisi/jabatan, dan departemen yang akan
            terhubung ke RACI Assignment OKR. Data pegawai ini juga berfungsi
            sebagai akun untuk login ke sistem.
          </p>
        </div>
        <div class="header-actions" style="display: flex; gap: 0.5rem">
          <button class="secondary-btn" @click="downloadTemplate">
            Template CSV
          </button>
          <button class="secondary-btn" @click="openImportModal">
            Import CSV
          </button>
          <button class="primary-btn" @click="openAddModal">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tambah Pegawai
          </button>
        </div>
      </div>

      <!-- Controls & Filter Section -->
      <div class="filter-section card">
        <div class="search-box">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama pegawai, email, atau posisi..."
          />
        </div>

        <div class="filter-group">
          <label>Departemen:</label>
          <select v-model="selectedDept">
            <option value="">Semua Departemen</option>
            <option
              v-for="dept in availableDepartments"
              :key="dept.value"
              :value="dept.value"
            >
              {{ dept.icon }} {{ dept.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Alert Messages -->
      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <!-- Table Section -->
      <div class="card table-card">
        <div v-if="loading" class="loading-state">Memuat data pegawai...</div>

        <div v-else-if="filteredEmployees.length === 0" class="empty-state">
          Pegawai tidak ditemukan.
        </div>

        <table v-else class="employee-table">
          <thead>
            <tr>
              <th>Pegawai</th>
              <th>Posisi / Jabatan</th>
              <th>Departemen</th>
              <th>Role Sistem</th>
              <th class="action-col">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in filteredEmployees" :key="emp.id">
              <td>
                <div class="user-info">
                  <div
                    class="avatar"
                    :style="{ backgroundColor: getAvatarColor(emp.name) }"
                  >
                    {{ getInitials(emp.name) }}
                  </div>
                  <div>
                    <div class="user-name">{{ emp.name }}</div>
                    <div class="user-email">{{ emp.email }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span v-if="emp.position" class="position-badge">{{
                  emp.position
                }}</span>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <span v-if="emp.department" class="dept-badge">
                  {{ getDeptLabel(emp.department) }}
                </span>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <span class="role-badge" :class="emp.role.toLowerCase()">
                  {{ emp.role }}
                </span>
              </td>
              <td class="action-col">
                <button
                  class="icon-btn edit-btn"
                  title="Edit Pegawai"
                  @click="openEditModal(emp)"
                >
                  ✏️
                </button>
                <button
                  class="icon-btn delete-btn"
                  title="Hapus Pegawai"
                  @click="confirmDelete(emp)"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ─── SECTION: Konfigurasi Team ─── -->
      <!-- <div class="header-section card" style="margin-top: 2rem">
        <h3>Konfigurasi Team</h3>
        <p class="section-desc">
          Assign Leader dan Department untuk setiap Tim.
        </p>
      </div> -->

      <!-- <div class="card" style="margin-top: 1rem">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nama Tim</th>
              <th>Leader</th>
              <th>Department</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="team in allTeams" :key="team.id">
              <td>{{ team.name }}</td>
              <td>
                <select
                  v-model="teamConfigs[team.id].leaderId"
                  class="form-select-inline"
                >
                  <option value="">-- Tanpa Leader --</option>
                  <option
                    v-for="leader in leaderUsers"
                    :key="leader.id"
                    :value="leader.id"
                  >
                    {{ leader.name }}
                  </option>
                </select>
              </td>
              <td>
                <select
                  v-model="teamConfigs[team.id].department"
                  class="form-select-inline"
                >
                  <option value="">-- Tanpa Department --</option>
                  <option
                    v-for="dept in availableDepartments"
                    :key="dept.value"
                    :value="dept.value"
                  >
                    {{ dept.icon }} {{ dept.label }}
                  </option>
                </select>
              </td>
              <td>
                <button
                  class="primary-btn small"
                  @click="saveTeamConfig(team.id)"
                >
                  Simpan
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div> -->
    </div>

    <!-- Modal Form -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card card">
        <div class="modal-header">
          <h3>{{ isEditing ? "Edit Data Pegawai" : "Tambah Pegawai Baru" }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>

        <form @submit.prevent="saveEmployee" class="modal-form">
          <div class="form-group">
            <label for="emp-name">Nama Lengkap *</label>
            <input
              id="emp-name"
              v-model="form.name"
              type="text"
              placeholder="Contoh: Budi Santoso"
              required
            />
          </div>

          <div class="form-group" v-if="!isEditing">
            <label for="emp-email">Email *</label>
            <input
              id="emp-email"
              v-model="form.email"
              type="email"
              placeholder="Contoh: budi@skolla.com"
              required
            />
            <p
              class="text-muted"
              style="font-size: 0.8rem; margin-top: 0.5rem; color: #5e718d"
            >
              Email ini akan digunakan sebagai akses login pegawai ke sistem
              dengan password default: <strong>SkollaEdu</strong>
            </p>
          </div>

          <div class="form-group">
            <label for="emp-position">Posisi / Jabatan</label>
            <input
              id="emp-position"
              v-model="form.position"
              type="text"
              placeholder="Contoh: Finance Manager, QA Lead, UX Designer"
            />
          </div>

          <div class="form-group">
            <label for="emp-dept">Departemen</label>
            <select id="emp-dept" v-model="form.department">
              <option value="">-- Pilih Departemen --</option>
              <option
                v-for="dept in availableDepartments"
                :key="dept.value"
                :value="dept.value"
              >
                {{ dept.icon }} {{ dept.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="emp-role">Role Sistem *</label>
            <select id="emp-role" v-model="form.role" required>
              <option value="">-- Pilih Role --</option>
              <option
                v-for="r in availableRoles"
                :key="r.value"
                :value="r.value"
              >
                {{ r.label }}
              </option>
            </select>
          </div>

          <div v-if="modalError" class="alert alert-error">
            {{ modalError }}
          </div>

          <div class="modal-footer">
            <button type="button" class="secondary-btn" @click="closeModal">
              Batal
            </button>
            <button type="submit" class="primary-btn" :disabled="saving">
              {{
                saving
                  ? "Menyimpan..."
                  : isEditing
                    ? "Simpan Perubahan"
                    : "Tambah Pegawai"
              }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Import CSV Modal -->
    <div
      v-if="showImportModal"
      class="modal-backdrop"
      @click.self="closeImportModal"
    >
      <div class="modal-card card import-modal">
        <div class="modal-header">
          <h3>Import Data Pegawai (CSV)</h3>
          <button class="close-btn" @click="closeImportModal">&times;</button>
        </div>

        <!-- Step 1: Upload -->
        <div v-if="importStep === 1" class="import-step">
          <p class="text-muted" style="margin-bottom: 1rem">
            Format yang didukung: name, email, position, department, role
          </p>
          <div class="upload-area">
            <input
              type="file"
              accept=".csv"
              @change="handleFileUpload"
              id="csv-upload"
              class="file-input"
            />
            <label for="csv-upload" class="upload-label">
              <span>Pilih file CSV</span>
            </label>
          </div>
        </div>

        <!-- Step 2: Preview -->
        <div v-if="importStep === 2" class="import-step">
          <div class="preview-header" style="margin-bottom: 0.5rem">
            <strong>Preview Data ({{ csvRows.length }} baris)</strong>
          </div>
          <div class="preview-table-wrapper">
            <table class="employee-table preview-table">
              <thead>
                <tr>
                  <th>Baris</th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in csvRows" :key="row._index">
                  <td>{{ row._index }}</td>
                  <td>{{ row.name }}</td>
                  <td>{{ row.email }}</td>
                  <td>
                    <span
                      v-if="row._status === 'ERROR'"
                      class="badge badge-error"
                      :title="row._error"
                      >🔴 ERROR</span
                    >
                    <span
                      v-else-if="row._status === 'UPDATE'"
                      class="badge badge-warning"
                      >🟡 UPDATE</span
                    >
                    <span v-else class="badge badge-success">🟢 NEW</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="import-summary-bar">
            <span>✅ {{ validRowCount }} baris valid</span>
            <span v-if="errorRowCount > 0" class="text-error"
              >⚠️ {{ errorRowCount }} baris error</span
            >
          </div>
          <div class="modal-footer">
            <button type="button" class="secondary-btn" @click="importStep = 1">
              Batal
            </button>
            <button
              type="button"
              class="primary-btn"
              :disabled="isImporting || validRowCount === 0"
              @click="confirmImport"
            >
              {{ isImporting ? "Menyimpan..." : "Confirm Import" }}
            </button>
          </div>
        </div>

        <!-- Step 3: Result -->
        <div v-if="importStep === 3" class="import-step result-step">
          <div class="success-icon">✅</div>
          <h4>Import Selesai!</h4>
          <div class="result-stats">
            <div>
              🟢 Pegawai baru: <strong>{{ importResult.success }}</strong>
            </div>
            <div>
              🟡 Data diperbarui: <strong>{{ importResult.updated }}</strong>
            </div>
            <div>
              🔴 Gagal/Error: <strong>{{ importResult.errors.length }}</strong>
            </div>
          </div>
          <div v-if="importResult.errors.length > 0" class="error-details">
            <p><strong>Detail Error:</strong></p>
            <ul>
              <li v-for="(err, i) in importResult.errors" :key="i">
                Baris {{ err.row }} ({{ err.email }}): {{ err.reason }}
              </li>
            </ul>
          </div>
          <div
            class="modal-footer"
            style="justify-content: center; margin-top: 1.5rem"
          >
            <button type="button" class="primary-btn" @click="closeImportModal">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../../stores/auth";

const config = useRuntimeConfig();
const auth = useAuthStore();

const employees = ref([]);
const loading = ref(false);
const saving = ref(false);
const searchQuery = ref("");
const selectedDept = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const modalError = ref("");

// === Import CSV state ===
const showImportModal = ref(false);
const importStep = ref(1);
const csvRows = ref([]);
const importResult = ref(null);
const isImporting = ref(false);

const validRowCount = computed(
  () => csvRows.value.filter((r) => r._status !== "ERROR").length,
);
const errorRowCount = computed(
  () => csvRows.value.filter((r) => r._status === "ERROR").length,
);

// ─── Team Config ───
const allTeams = ref([]);
const leaderUsers = ref([]);
const teamConfigs = ref({});

async function fetchTeams() {
  const token = auth.token || localStorage.getItem("token");
  const res = await fetch(`${config.public.apiBase}/users/teams`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const teams = await res.json();
  allTeams.value = teams;
  teams.forEach((t) => {
    teamConfigs.value[t.id] = {
      leaderId: t.leaderId || "",
      department: t.department || "",
    };
  });
}

async function fetchLeaders() {
  const token = auth.token || localStorage.getItem("token");
  const res = await fetch(`${config.public.apiBase}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const users = await res.json();
  leaderUsers.value = users.filter((u) => u.role === "LEADER");
}

async function saveTeamConfig(teamId) {
  const token = auth.token || localStorage.getItem("token");
  const cfg = teamConfigs.value[teamId];
  const res = await fetch(`${config.public.apiBase}/users/teams/${teamId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      leaderId: cfg.leaderId || null,
      department: cfg.department || null,
    }),
  });
  if (res.ok) {
    alert("Konfigurasi Tim berhasil disimpan");
  } else {
    const err = await res.json();
    alert(err.message || "Gagal menyimpan konfigurasi");
  }
}

function downloadTemplate() {
  const template =
    "name,email,position,department,role\nBudi Santoso,budi@perusahaan.com,Frontend Developer,TECHDEV,TEAM";
  const blob = new Blob([template], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template_pegawai.csv";
  a.click();
}

function openImportModal() {
  showImportModal.value = true;
  importStep.value = 1;
  csvRows.value = [];
  importResult.value = null;
}

function closeImportModal() {
  showImportModal.value = false;
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    parseCSV(text);
  };
  reader.readAsText(file);
  event.target.value = null;
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const parsedRows = lines.slice(1).map((line, idx) => {
    const values = line.split(",").map((v) => v.trim());
    const row = {};
    headers.forEach((h, i) => (row[h] = values[i] || ""));

    const exists = employees.value.find((e) => e.email === row.email);

    row._status = !row.name || !row.email ? "ERROR" : exists ? "UPDATE" : "NEW";
    row._error = !row.name || !row.email ? "Name/Email kosong" : "";
    row._index = idx + 2;
    return row;
  });

  csvRows.value = parsedRows;
  importStep.value = 2;
}

async function confirmImport() {
  isImporting.value = true;
  const validRows = csvRows.value.filter((r) => r._status !== "ERROR");
  try {
    const result = await $fetch(`${config.public.apiBase}/users/bulk-upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.token}` },
      body: {
        employees: validRows.map((r) => ({
          name: r.name,
          email: r.email,
          position: r.position,
          department: r.department,
          role: r.role,
        })),
      },
    });
    importResult.value = result;
    importStep.value = 3;
    fetchEmployees();
  } catch (err) {
    console.error("Import error:", err);
    alert(err.data?.message || "Terjadi kesalahan saat import data");
    importStep.value = 1;
  } finally {
    isImporting.value = false;
  }
}

const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref(null);

const form = ref({
  name: "",
  email: "",
  position: "",
  department: "",
  role: "TEAM",
});

const availableRoles = [
  { value: "ADMIN", label: "Admin" },
  { value: "C_LEVEL", label: "C-Level" },
  { value: "MANAGER", label: "Manager" },
  { value: "LEADER", label: "Leader" },
  { value: "TEAM", label: "Team" },
];

const availableDepartments = ref([]);

async function fetchDepartments() {
  try {
    const response = await $fetch(`${config.public.apiBase}/departments`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    // Add default icon for departments to match existing UI
    availableDepartments.value = response.map((d) => ({
      ...d,
      icon: "🏢",
      label: d.name,
    }));
  } catch (err) {
    console.error("Error fetching departments:", err);
  }
}

const filteredEmployees = computed(() => {
  return employees.value.filter((emp) => {
    const matchQuery =
      emp.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (emp.position &&
        emp.position.toLowerCase().includes(searchQuery.value.toLowerCase()));

    const matchDept =
      !selectedDept.value || emp.department === selectedDept.value;

    return matchQuery && matchDept;
  });
});

async function fetchEmployees() {
  loading.value = true;
  try {
    const response = await $fetch(`${config.public.apiBase}/users`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    employees.value = response;
  } catch (err) {
    console.error("Error fetching employees:", err);
    errorMessage.value = "Gagal memuat data pegawai.";
  } finally {
    loading.value = false;
  }
}

function openAddModal() {
  isEditing.value = false;
  editingId.value = null;
  form.value = {
    name: "",
    email: "",
    position: "",
    department: "",
    role: "TEAM",
  };
  modalError.value = "";
  showModal.value = true;
}

function openEditModal(emp) {
  isEditing.value = true;
  editingId.value = emp.id;
  form.value = {
    name: emp.name,
    email: emp.email,
    position: emp.position || "",
    department: emp.department || "",
    role: emp.role || "TEAM",
  };
  modalError.value = "";
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function saveEmployee() {
  saving.value = true;
  modalError.value = "";
  try {
    if (isEditing.value) {
      await $fetch(`${config.public.apiBase}/users/${editingId.value}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: {
          name: form.value.name,
          position: form.value.position,
          department: form.value.department,
          role: form.value.role,
        },
      });
      successMessage.value = "Data pegawai berhasil diperbarui!";
    } else {
      await $fetch(`${config.public.apiBase}/users`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: form.value,
      });
      successMessage.value = "Pegawai baru berhasil ditambahkan!";
    }

    closeModal();
    fetchEmployees();
    setTimeout(() => (successMessage.value = ""), 4000);
  } catch (err) {
    console.error("Error saving employee:", err);
    modalError.value = err.data?.message || "Gagal menyimpan data pegawai.";
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(emp) {
  if (!confirm(`Apakah Anda yakin ingin menghapus data pegawai "${emp.name}"?`))
    return;

  try {
    await $fetch(`${config.public.apiBase}/users/${emp.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    successMessage.value = `Pegawai "${emp.name}" berhasil dihapus.`;
    fetchEmployees();
    setTimeout(() => (successMessage.value = ""), 4000);
  } catch (err) {
    console.error("Error deleting employee:", err);
    errorMessage.value = err.data?.message || "Gagal menghapus pegawai.";
    setTimeout(() => (errorMessage.value = ""), 5000);
  }
}

function getDeptLabel(deptKey) {
  const dept = availableDepartments.value.find((d) => d.value === deptKey);
  return dept ? `${dept.label}` : deptKey;
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
    "#00A925",
    "#7C3AED",
    "#DB2777",
    "#EA580C",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

onMounted(async () => {
  await fetchDepartments();
  await fetchEmployees();
  await fetchTeams();
  await fetchLeaders();
});
</script>

<style scoped>
.admin-root {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 2rem;
  font-family: "Rubik", sans-serif;
}

.admin-content {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #f0f3f9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title h2 {
  font-size: 1.5rem;
  color: #2d3643;
  margin: 0 0 0.25rem 0;
  font-weight: 600;
}

.section-desc {
  color: #5e718d;
  font-size: 0.9rem;
  margin: 0;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  flex: 1;
}

.search-box input {
  border: none;
  background: transparent;
  width: 100%;
  outline: none;
  font-family: inherit;
  font-size: 0.9rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #5e718d;
}

.filter-group select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  font-family: inherit;
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #0e97d6;
  color: white;
  border: none;
  padding: 0.65rem 1.2rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.primary-btn:hover {
  background-color: #0583c3;
}

.secondary-btn {
  background-color: #e2e8f0;
  color: #2d3643;
  border: none;
  padding: 0.65rem 1.2rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.employee-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.employee-table th {
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  color: #8897ae;
  border-bottom: 2px solid #f0f3f9;
  letter-spacing: 0.5px;
}

.employee-table td {
  padding: 1rem;
  border-bottom: 1px solid #f0f3f9;
  vertical-align: middle;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
}

.user-name {
  font-weight: 500;
  color: #2d3643;
}

.user-email {
  font-size: 0.8rem;
  color: #8897ae;
}

.position-badge {
  background: #f1f5f9;
  color: #334155;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
}

.dept-badge {
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
}

.role-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
}

.role-badge.employee {
  background: #f3f4f6;
  color: #4b5563;
}

.role-badge.admin {
  background: #fef3c7;
  color: #d97706;
}

.role-badge.manager {
  background: #dcfce7;
  color: #15803d;
}

.action-col {
  text-align: right;
  width: 100px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.3rem;
  border-radius: 4px;
  transition: background 0.15s;
}

.icon-btn:hover {
  background: #f1f5f9;
}

.text-muted {
  color: #cbd5e1;
}

.alert {
  padding: 0.8rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.alert-error {
  background-color: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-success {
  background-color: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

/* Modal styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
}

.modal-header h3 {
  margin: 0;
  color: #2d3643;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #8897ae;
  cursor: pointer;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.form-group input,
.form-group select {
  padding: 0.65rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #0e97d6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

/* Import CSV Styles */
.import-modal {
  max-width: 700px;
}
.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 3rem 1rem;
  text-align: center;
  background: #f8fafc;
  transition: all 0.2s;
}
.upload-area:hover {
  border-color: #0e97d6;
  background: #f0f9ff;
}
.file-input {
  display: none;
}
.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #0e97d6;
  font-weight: 500;
}
.preview-table-wrapper {
  max-height: 350px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.preview-table th,
.preview-table td {
  padding: 0.6rem 1rem;
}
.badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  display: inline-block;
}
.badge-error {
  background: #fef2f2;
  color: #991b1b;
}
.badge-warning {
  background: #fef3c7;
  color: #d97706;
}
.badge-success {
  background: #dcfce7;
  color: #15803d;
}
.import-summary-bar {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.9rem;
}
.text-error {
  color: #dc2626;
}
.result-step {
  text-align: center;
}
.success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
.result-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1rem 0;
  text-align: left;
}
.error-details {
  text-align: left;
  background: #fef2f2;
  padding: 1rem;
  border-radius: 8px;
  max-height: 150px;
  overflow-y: auto;
  font-size: 0.85rem;
  color: #991b1b;
}
.error-details ul {
  margin: 0;
  padding-left: 1.5rem;
}
</style>

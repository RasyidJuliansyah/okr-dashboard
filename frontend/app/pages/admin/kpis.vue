<template>
  <div class="admin-root">
    <div class="admin-content">
      <div class="header-section card">
        <div class="header-title">
          <h2>Master Data KPI (Key Performance Indicator)</h2>
          <p class="section-desc">
            Kelola katalog indikator kinerja perusahaan yang terhubung dengan
            Departemen dan Aspek BSC (Balanced Scorecard). Indikator ini dapat
            dipilih oleh karyawan saat membuat Inisiatif dan Task.
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
            Tambah KPI
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
            placeholder="Cari nama indikator KPI atau deskripsi..."
          />
        </div>

        <div class="filter-group">
          <label>Departemen:</label>
          <select v-model="selectedDept">
            <option value="">Semua Departemen</option>
            <option value="ALL">ALL (Semua Departemen)</option>
            <option
              v-for="dept in availableDepartments"
              :key="dept.value"
              :value="dept.value"
            >
              {{ dept.label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>Aspek BSC:</label>
          <select v-model="selectedBsc">
            <option value="">Semua Aspek BSC</option>
            <option value="FINANCIAL">Financial (Keuangan)</option>
            <option value="CUSTOMER">Customer (Pelanggan)</option>
            <option value="INTERNAL_PROCESS">Internal Process</option>
            <option value="LEARNING_GROWTH">Learning & Growth</option>
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
        <div v-if="loading" class="loading-state">
          Memuat data Master KPI...
        </div>

        <div v-else-if="filteredKpis.length === 0" class="empty-state">
          Master KPI tidak ditemukan.
        </div>

        <table v-else class="employee-table">
          <thead>
            <tr>
              <th>Indikator KPI</th>
              <th>Departemen</th>
              <th>Aspek BSC</th>
              <th>Satuan (Unit)</th>
              <th>Target Standar</th>
              <th>Status</th>
              <th class="action-col">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="kpi in filteredKpis" :key="kpi.id">
              <td>
                <div class="user-info">
                  <div>
                    <div class="user-name">{{ kpi.name }}</div>
                    <div v-if="kpi.description" class="user-email">
                      {{ kpi.description }}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <span class="dept-badge">
                  {{ getDeptLabel(kpi.department) }}
                </span>
              </td>
              <td>
                <span
                  class="bsc-badge"
                  :class="kpi.bscPerspective.toLowerCase()"
                >
                  {{ getBscLabel(kpi.bscPerspective) }}
                </span>
              </td>
              <td>
                <span class="position-badge">{{ kpi.unit }}</span>
              </td>
              <td>
                <span
                  v-if="
                    kpi.defaultTarget !== null &&
                    kpi.defaultTarget !== undefined
                  "
                  class="target-val"
                >
                  {{ kpi.defaultTarget }} {{ kpi.unit }}
                </span>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <span class="role-badge" :class="kpi.status.toLowerCase()">
                  {{ kpi.status }}
                </span>
              </td>
              <td class="action-col">
                <button
                  class="icon-btn edit-btn"
                  title="Edit KPI"
                  @click="openEditModal(kpi)"
                >
                  <svg
                    width="16"
                    height="16"
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
                  class="icon-btn delete-btn"
                  title="Hapus KPI"
                  @click="confirmDelete(kpi)"
                >
                  <svg
                    width="16"
                    height="16"
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form Tambah / Edit KPI -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card card">
        <div class="modal-header">
          <h3>
            {{ isEditing ? "Edit Master KPI" : "Tambah Master KPI Baru" }}
          </h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>

        <form @submit.prevent="saveKpi" class="modal-form">
          <div class="form-group">
            <label for="kpi-name">Nama / Indikator KPI *</label>
            <input
              id="kpi-name"
              v-model="form.name"
              type="text"
              placeholder="Contoh: Customer Satisfaction Index, Bug Resolution Rate"
              required
            />
          </div>

          <div class="form-group">
            <label for="kpi-desc">Deskripsi / Penjelasan Indikator</label>
            <textarea
              id="kpi-desc"
              v-model="form.description"
              rows="2"
              placeholder="Penjelasan singkat mengenai cara pengajuan atau acuan indikator"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="kpi-dept">Departemen Terkait *</label>
            <select id="kpi-dept" v-model="form.department" required>
              <option value="ALL">ALL (Semua Departemen)</option>
              <option
                v-for="dept in availableDepartments"
                :key="dept.value"
                :value="dept.value"
              >
                {{ dept.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="kpi-bsc">Aspek BSC (Balanced Scorecard) *</label>
            <select id="kpi-bsc" v-model="form.bscPerspective" required>
              <option value="">-- Pilih Aspek BSC --</option>
              <option value="FINANCIAL">Financial (Keuangan)</option>
              <option value="CUSTOMER">Customer (Pelanggan)</option>
              <option value="INTERNAL_PROCESS">Internal Process</option>
              <option value="LEARNING_GROWTH">Learning & Growth</option>
            </select>
          </div>

          <div class="form-row" style="display: flex; gap: 1rem">
            <div class="form-group" style="flex: 1">
              <label for="kpi-unit">Satuan (Unit) *</label>
              <input
                id="kpi-unit"
                v-model="form.unit"
                type="text"
                placeholder="%, Qty, IDR, Jam, dll"
                required
              />
            </div>
            <div class="form-group" style="flex: 1">
              <label for="kpi-target">Target Standar (Opsional)</label>
              <input
                id="kpi-target"
                v-model="form.defaultTarget"
                type="number"
                step="any"
                placeholder="100"
              />
            </div>
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
                    : "Tambah KPI"
              }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Import CSV -->
    <div
      v-if="showImportModal"
      class="modal-backdrop"
      @click.self="closeImportModal"
    >
      <div class="modal-card card import-modal">
        <div class="modal-header">
          <h3>Import Master KPI (CSV)</h3>
          <button class="close-btn" @click="closeImportModal">&times;</button>
        </div>

        <!-- Step 1: Upload -->
        <div v-if="importStep === 1" class="import-step">
          <p class="text-muted" style="margin-bottom: 1rem">
            Format kolom CSV:
            <code
              >name, department, bscPerspective, unit, defaultTarget,
              description</code
            >
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
          <div class="import-summary mb-3">
            <span class="badge badge-success"
              >{{ validRowCount }} baris siap di-import</span
            >
            <span v-if="errorRowCount > 0" class="badge badge-danger"
              >{{ errorRowCount }} baris eror</span
            >
          </div>

          <div class="table-scroll" style="max-height: 300px; overflow-y: auto">
            <table class="employee-table small">
              <thead>
                <tr>
                  <th>Baris</th>
                  <th>Nama KPI</th>
                  <th>Dept</th>
                  <th>BSC</th>
                  <th>Unit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in csvRows" :key="r._index">
                  <td>{{ r._index }}</td>
                  <td>{{ r.name || "-" }}</td>
                  <td>{{ r.department || "ALL" }}</td>
                  <td>{{ r.bscPerspective || "-" }}</td>
                  <td>{{ r.unit || "-" }}</td>
                  <td>
                    <span
                      :class="
                        r._status === 'ERROR' ? 'text-danger' : 'text-success'
                      "
                    >
                      {{ r._status }} {{ r._error ? `(${r._error})` : "" }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="modal-footer" style="margin-top: 1rem">
            <button type="button" class="secondary-btn" @click="importStep = 1">
              Kembali
            </button>
            <button
              type="button"
              class="primary-btn"
              :disabled="validRowCount === 0 || isImporting"
              @click="confirmImport"
            >
              {{
                isImporting ? "Meng-import..." : `Import ${validRowCount} KPI`
              }}
            </button>
          </div>
        </div>

        <!-- Step 3: Result -->
        <div v-if="importStep === 3" class="import-step">
          <div class="alert alert-success">
            Import Selesai! {{ importResult?.success || 0 }} KPI baru
            ditambahkan, {{ importResult?.updated || 0 }} KPI diperbarui.
          </div>
          <div
            v-if="importResult?.errors?.length > 0"
            class="alert alert-error mt-2"
          >
            Peringatan: {{ importResult.errors.length }} baris gagal di-import.
          </div>
          <div class="modal-footer" style="margin-top: 1rem">
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

const kpis = ref([]);
const loading = ref(false);
const saving = ref(false);
const searchQuery = ref("");
const selectedDept = ref("");
const selectedBsc = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const modalError = ref("");

const availableDepartments = ref([]);

const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref(null);

const form = ref({
  name: "",
  description: "",
  department: "ALL",
  bscPerspective: "",
  unit: "%",
  defaultTarget: null,
});

// CSV Import State
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

const filteredKpis = computed(() => {
  return kpis.value.filter((kpi) => {
    const matchQuery =
      !searchQuery.value ||
      kpi.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (kpi.description &&
        kpi.description
          .toLowerCase()
          .includes(searchQuery.value.toLowerCase()));

    const matchDept =
      !selectedDept.value ||
      kpi.department === selectedDept.value ||
      kpi.department === "ALL";

    const matchBsc =
      !selectedBsc.value || kpi.bscPerspective === selectedBsc.value;

    return matchQuery && matchDept && matchBsc;
  });
});

async function fetchKpis() {
  loading.value = true;
  try {
    const response = await $fetch(`${config.public.apiBase}/kpis`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    kpis.value = response;
  } catch (err) {
    console.error("Error fetching KPIs:", err);
    errorMessage.value = "Gagal memuat data KPI.";
  } finally {
    loading.value = false;
  }
}

async function fetchDepartments() {
  try {
    const response = await $fetch(`${config.public.apiBase}/departments`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    availableDepartments.value = response.map((d) => ({
      value: d.value || d.name,
      label: d.name,
    }));
  } catch (err) {
    console.error("Error fetching departments:", err);
  }
}

function getDeptLabel(deptKey) {
  if (!deptKey || deptKey === "ALL") return "ALL (Semua Dept)";
  const dept = availableDepartments.value.find((d) => d.value === deptKey);
  return dept ? dept.label : deptKey;
}

function getBscLabel(bscKey) {
  switch (bscKey) {
    case "FINANCIAL":
      return "Financial";
    case "CUSTOMER":
      return "Customer";
    case "INTERNAL_PROCESS":
      return "Internal Process";
    case "LEARNING_GROWTH":
      return "Learning & Growth";
    default:
      return bscKey;
  }
}

function openAddModal() {
  isEditing.value = false;
  editingId.value = null;
  form.value = {
    name: "",
    description: "",
    department: "ALL",
    bscPerspective: "",
    unit: "%",
    defaultTarget: null,
  };
  modalError.value = "";
  showModal.value = true;
}

function openEditModal(kpi) {
  isEditing.value = true;
  editingId.value = kpi.id;
  form.value = {
    name: kpi.name,
    description: kpi.description || "",
    department: kpi.department || "ALL",
    bscPerspective: kpi.bscPerspective,
    unit: kpi.unit,
    defaultTarget: kpi.defaultTarget,
  };
  modalError.value = "";
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function saveKpi() {
  modalError.value = "";
  if (!form.value.name || !form.value.bscPerspective || !form.value.unit) {
    modalError.value = "Nama KPI, Aspek BSC, dan Satuan (unit) wajib diisi.";
    return;
  }

  saving.value = true;
  try {
    if (isEditing.value) {
      await $fetch(`${config.public.apiBase}/kpis/${editingId.value}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: form.value,
      });
      successMessage.value = "Master KPI berhasil diperbarui!";
    } else {
      await $fetch(`${config.public.apiBase}/kpis`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: form.value,
      });
      successMessage.value = "Master KPI baru berhasil ditambahkan!";
    }

    closeModal();
    fetchKpis();
    setTimeout(() => (successMessage.value = ""), 4000);
  } catch (err) {
    console.error("Error saving KPI:", err);
    modalError.value = err.data?.message || "Gagal menyimpan Master KPI.";
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(kpi) {
  if (!confirm(`Apakah Anda yakin ingin menghapus Master KPI "${kpi.name}"?`))
    return;

  try {
    const res = await $fetch(`${config.public.apiBase}/kpis/${kpi.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    successMessage.value =
      res.message || `Master KPI "${kpi.name}" berhasil dihapus.`;
    fetchKpis();
    setTimeout(() => (successMessage.value = ""), 4000);
  } catch (err) {
    console.error("Error deleting KPI:", err);
    errorMessage.value = err.data?.message || "Gagal menghapus KPI.";
    setTimeout(() => (errorMessage.value = ""), 5000);
  }
}

// Bulk Upload CSV Handlers
function downloadTemplate() {
  const csvContent =
    "name,department,bscPerspective,unit,defaultTarget,description\n" +
    "Customer Satisfaction Index,CUSTOMER,CUSTOMER,%,85,Tingkat kepuasan pelanggan\n" +
    "Bug Resolution Speed,TECHDEV,INTERNAL_PROCESS,Jam,24,Waktu rata-rata penyelesaian bug\n" +
    "Revenue Growth Rate,FINANCE,FINANCIAL,%,15,Pertumbuhan pendapatan bersih";

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "template_master_kpi.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function openImportModal() {
  importStep.value = 1;
  csvRows.value = [];
  importResult.value = null;
  showImportModal.value = true;
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
  if (lines.length < 2) return;
  const headers = lines[0].split(",").map((h) => h.trim());

  const parsedRows = lines.slice(1).map((line, idx) => {
    const values = line.split(",").map((v) => v.trim());
    const row = {};
    headers.forEach((h, i) => (row[h] = values[i] || ""));

    const validBsc = [
      "FINANCIAL",
      "CUSTOMER",
      "INTERNAL_PROCESS",
      "LEARNING_GROWTH",
    ];

    const isBscValid =
      row.bscPerspective && validBsc.includes(row.bscPerspective.toUpperCase());

    row._status =
      !row.name || !row.bscPerspective || !row.unit || !isBscValid
        ? "ERROR"
        : "NEW";
    row._error =
      !row.name || !row.bscPerspective || !row.unit
        ? "Nama/BSC/Unit kosong"
        : !isBscValid
          ? "BSC tak valid"
          : "";
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
    const result = await $fetch(`${config.public.apiBase}/kpis/bulk-upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.token}` },
      body: {
        kpis: validRows.map((r) => ({
          name: r.name,
          department: r.department || "ALL",
          bscPerspective: r.bscPerspective,
          unit: r.unit,
          defaultTarget: r.defaultTarget || null,
          description: r.description || null,
        })),
      },
    });
    importResult.value = result;
    importStep.value = 3;
    fetchKpis();
  } catch (err) {
    console.error("Import KPI error:", err);
    alert(err.data?.message || "Terjadi kesalahan saat import KPI");
    importStep.value = 1;
  } finally {
    isImporting.value = false;
  }
}

onMounted(() => {
  fetchKpis();
  fetchDepartments();
});
</script>

<style scoped>
.admin-root {
  padding: 1.5rem;
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
}
.header-title h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f172a;
}
.section-desc {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
  max-width: 700px;
}
.filter-section {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem 1.5rem;
  flex-wrap: wrap;
}
.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  flex: 1;
  min-width: 260px;
  background: #ffffff;
}
.search-box input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 0.875rem;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #475569;
}
.filter-group select {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  font-size: 0.875rem;
  background: #ffffff;
}
.table-card {
  padding: 0;
  overflow: hidden;
}
.employee-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}
.employee-table th {
  background: #f8fafc;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}
.employee-table td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.action-col {
  text-align: right;
  width: 100px;
}
.bsc-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-weight: 600;
}
.bsc-badge.financial {
  background: #dbeafe;
  color: #1e40af;
}
.bsc-badge.customer {
  background: #dcfce7;
  color: #166534;
}
.bsc-badge.internal_process {
  background: #fef3c7;
  color: #92400e;
}
.bsc-badge.learning_growth {
  background: #f3e8ff;
  color: #6b21a8;
}
.dept-badge {
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
}
.position-badge {
  background: #f1f5f9;
  color: #334155;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
}
.target-val {
  font-weight: 600;
  color: #0f172a;
}
.role-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
}
.role-badge.active {
  background: #dcfce7;
  color: #15803d;
}
.role-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 4px;
  color: #64748b;
  transition: background 0.15s;
}
.icon-btn:hover {
  background: #f1f5f9;
}
.icon-btn.edit-btn:hover {
  color: #0284c7;
}
.icon-btn.delete-btn:hover {
  color: #ef4444;
}
.loading-state,
.empty-state {
  padding: 3rem;
  text-align: center;
  color: #64748b;
}
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
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}
.import-modal {
  max-width: 700px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
}
.modal-header h3 {
  margin: 0;
  color: #0f172a;
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
  color: #475569;
}
.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.65rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  font-family: inherit;
  font-size: 0.875rem;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}
.primary-btn {
  background: var(--primary-color, #0e97d6);
  color: #ffffff;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.secondary-btn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
}
.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 3rem 1rem;
  text-align: center;
  background: #f8fafc;
}
.file-input {
  display: none;
}
.upload-label {
  cursor: pointer;
  color: #0e97d6;
  font-weight: 600;
}
.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}
.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
.alert-success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}
.text-danger {
  color: #ef4444;
}
.text-success {
  color: #22c55e;
}
.badge-success {
  background: #dcfce7;
  color: #15803d;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-danger {
  background: #fee2e2;
  color: #991b1b;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}
</style>

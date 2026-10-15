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

        <div v-else class="table-responsive">
          <table class="employee-table">
            <thead>
              <tr>
                <th class="col-kpi">Indikator KPI</th>
                <th class="col-nowrap">Departemen</th>
                <th class="col-nowrap">Aspek BSC</th>
                <th class="col-nowrap col-center">Satuan (Unit)</th>
                <th class="col-nowrap col-target">Target Standar</th>
                <th class="col-nowrap col-center">Status</th>
                <th class="col-nowrap action-col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="kpi in filteredKpis" :key="kpi.id">
                <td class="col-kpi">
                  <div class="kpi-cell">
                    <span class="kpi-name">{{ kpi.name }}</span>
                    <span v-if="kpi.description" class="kpi-desc">
                      {{ kpi.description }}
                    </span>
                  </div>
                </td>
                <td class="col-nowrap">
                  <span class="dept-badge">
                    {{ getDeptLabel(kpi.department) }}
                  </span>
                </td>
                <td class="col-nowrap">
                  <span
                    class="bsc-badge"
                    :class="kpi.bscPerspective.toLowerCase()"
                  >
                    {{ getBscLabel(kpi.bscPerspective) }}
                  </span>
                </td>
                <td class="col-nowrap col-center">
                  <span class="position-badge">{{ kpi.unit }}</span>
                </td>
                <td class="col-nowrap col-target">
                  <span
                    v-if="
                      kpi.defaultTarget !== null &&
                      kpi.defaultTarget !== undefined
                    "
                    class="target-val"
                  >
                    {{ formatTargetValue(kpi.defaultTarget, kpi.unit) }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="col-nowrap col-center">
                  <span class="role-badge" :class="kpi.status.toLowerCase()">
                    {{ kpi.status }}
                  </span>
                </td>
                <td class="col-nowrap action-col">
                  <button
                    class="icon-btn edit-btn"
                    title="Edit KPI"
                    @click="openEditModal(kpi)"
                  >
                    <svg
                      width="16px"
                      height="16px"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.87601 18.1156C2.92195 17.7021 2.94493 17.4954 3.00748 17.3022C3.06298 17.1307 3.1414 16.9676 3.24061 16.8171C3.35242 16.6475 3.49952 16.5005 3.7937 16.2063L17 3C18.1046 1.89543 19.8954 1.89543 21 3C22.1046 4.10457 22.1046 5.89543 21 7L7.7937 20.2063C7.49951 20.5005 7.35242 20.6475 7.18286 20.7594C7.03242 20.8586 6.86926 20.937 6.69782 20.9925C6.50457 21.055 6.29783 21.078 5.88434 21.124L2.49997 21.5L2.87601 18.1156Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    class="icon-btn delete-btn"
                    title="Hapus KPI"
                    @click.stop="confirmDelete(kpi)"
                  >
                    <svg
                      width="16px"
                      height="16px"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      color="red"
                    >
                      <path
                        d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
            <strong>Ringkasan Import:</strong>
            <div
              style="
                gap: 1rem;
                margin-top: 0.5rem;
                display: flex;
                flex-wrap: wrap;
              "
            >
              <span class="badge badge-success"
                >{{ validRowCount }} baris siap di-import</span
              >
              <span v-if="errorRowCount > 0" class="badge badge-danger"
                >{{ errorRowCount }} baris eror</span
              >
            </div>
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
import { formatTargetValue } from "~/utils/formatters";

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
  try {
    const token =
      auth.token ||
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("auth_token") || localStorage.getItem("token")
        : "");
    const res = await $fetch(`${config.public.apiBase}/kpis/${kpi.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    successMessage.value =
      res.message || `Master KPI "${kpi.name}" berhasil dihapus.`;
    fetchKpis();
    setTimeout(() => (successMessage.value = ""), 4000);
  } catch (err) {
    console.error("Error deleting KPI:", err);
    errorMessage.value =
      err.data?.message || err.message || "Gagal menghapus KPI.";
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

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

onMounted(() => {
  fetchKpis();
  fetchDepartments();
});
</script>

<style scoped>
.admin-root {
  min-height: 100vh;
  background-color: var(--bg-page);
  padding: 2rem;
  font-family: "Rubik", sans-serif;
}

.admin-content {
  max-width: 1360px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--card-border);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.header-title h2 {
  font-size: 1.4rem;
  color: #1e293b;
  margin: 0 0 0.35rem 0;
  font-weight: 600;
}

.section-desc {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
  max-width: 750px;
  line-height: 1.5;
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
  background: var(--bg-page);
  border: 1px solid var(--card-border);
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
  font-size: 0.875rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

.filter-group select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--card-border);
  border-radius: 8px;
  outline: none;
  font-family: inherit;
  background: var(--card-bg);
  font-size: 0.875rem;
  color: #334155;
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

.table-card {
  padding: 0;
  overflow: hidden;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.employee-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

.employee-table th {
  padding: 0.85rem 1.1rem;
  font-size: 0.725rem;
  text-transform: uppercase;
  color: #64748b;
  background-color: var(--bg-page);
  border-bottom: 1px solid var(--card-border);
  letter-spacing: 0.04em;
  font-weight: 600;
}

.employee-table td {
  padding: 0.85rem 1.1rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  color: #334155;
}

.employee-table tbody tr {
  transition: background-color 0.15s ease;
}

.employee-table tbody tr:hover {
  background-color: var(--bg-page);
}

.employee-table tbody tr:last-child td {
  border-bottom: none;
}

.col-kpi {
  width: auto;
  min-width: 260px;
}

.col-nowrap {
  white-space: nowrap;
  width: 1%;
}

.col-center {
  text-align: center;
}

.col-target {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.kpi-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.kpi-name {
  font-weight: 500;
  color: #1e293b;
  line-height: 1.4;
}

.kpi-desc {
  font-size: 0.775rem;
  color: #64748b;
  line-height: 1.35;
  max-width: 520px;
}

.position-badge {
  display: inline-block;
  white-space: nowrap;
  background: var(--bg-page);
  color: #475569;
  border: 1px solid var(--card-border);
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  font-size: 0.775rem;
  font-weight: 500;
}

.dept-badge {
  display: inline-block;
  white-space: nowrap;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #dbeafe;
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  font-size: 0.775rem;
  font-weight: 500;
}

.bsc-badge {
  display: inline-block;
  white-space: nowrap;
  font-size: 0.75rem;
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  font-weight: 500;
  border: 1px solid transparent;
}

.bsc-badge.financial {
  background: #eff6ff;
  color: #1e40af;
  border-color: #dbeafe;
}

.bsc-badge.customer {
  background: #f0fdf4;
  color: #15803d;
  border-color: #bbf7d0;
}

.bsc-badge.internal_process {
  background: #fefce8;
  color: #854d0e;
  border-color: #fef08a;
}

.bsc-badge.learning_growth {
  background: #faf5ff;
  color: #7e22ce;
  border-color: #e9d5ff;
}

.target-val {
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
}

.role-badge {
  display: inline-block;
  white-space: nowrap;
  font-size: 0.72rem;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.role-badge.active {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.role-badge.inactive {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.action-col {
  text-align: right;
  white-space: nowrap;
  width: 1%;
  padding-right: 1.25rem;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.35rem;
  border-radius: 6px;
  color: #64748b;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: var(--bg-page);
}

.icon-btn.edit-btn:hover {
  color: #0284c7;
  background: #e0f2fe;
}

.icon-btn.delete-btn:hover {
  color: #ef4444;
  background: #fee2e2;
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
  background: var(--card-bg);
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
.form-group select,
.form-group textarea {
  padding: 0.65rem;
  border: 1px solid var(--card-border);
  border-radius: 8px;
  outline: none;
  font-family: inherit;
  font-size: 0.875rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #0e97d6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 3rem 1rem;
  text-align: center;
  background: var(--bg-page);
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

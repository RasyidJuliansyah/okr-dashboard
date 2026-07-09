<template>
  <div class="admin-root">
    <div class="admin-content">
      <!-- Left Column: Form Builder -->
      <section class="form-section card">
        <h2>Buat Objective & Key Results Baru</h2>
        <p class="section-desc">
          Definisikan target strategis triwulanan dan indikator keberhasilannya.
        </p>

        <form @submit.prevent="submitObjective" class="okr-form">
          <div class="form-group">
            <label>Metode Input Objective</label>
            <div class="radio-group" style="display: flex; gap: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: normal;">
                <input type="radio" :value="false" v-model="isExistingObjective" />
                Buat Baru
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: normal;">
                <input type="radio" :value="true" v-model="isExistingObjective" />
                Pilih Eksisting
              </label>
            </div>
          </div>

          <div v-if="isExistingObjective" class="form-group">
            <label for="obj-select">Pilih Objective Eksisting *</label>
            <select id="obj-select" v-model="selectedObjectiveId" required>
              <option value="" disabled>Pilih Objective</option>
              <option v-for="obj in allObjectivesForDropdown" :key="obj.id" :value="obj.id">
                [{{ obj.quarter }}] {{ obj.title }}
              </option>
            </select>
          </div>

          <template v-else>
            <div class="form-group">
              <label for="obj-title">Judul Objective *</label>
              <input
                id="obj-title"
                v-model="newObjective.title"
                type="text"
                placeholder="Contoh: Meningkatkan Efisiensi Operasional Tim Dev"
                required
              />
            </div>

            <div class="form-group">
              <label for="obj-desc">Deskripsi (Opsional)</label>
              <textarea
                id="obj-desc"
                v-model="newObjective.description"
                placeholder="Detail penjelasan mengenai sasaran ini..."
                rows="2"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label for="obj-quarter">Quarter / Periode *</label>
                <select id="obj-quarter" v-model="newObjective.quarter" required>
                  <option value="" disabled>Pilih Quarter</option>
                  <option value="Q1-2026">Q1-2026</option>
                  <option value="Q2-2026">Q2-2026</option>
                  <option value="Q3-2026">Q3-2026</option>
                  <option value="Q4-2026">Q4-2026</option>
                </select>
              </div>
            </div>
          </template>

          <hr class="divider" />

          <!-- Key Results Section -->
          <div class="kr-builder-header">
            <h3>Key Results (KR)</h3>
            <button type="button" @click="addKrRow" class="add-kr-btn">
              + Tambah KR
            </button>
          </div>

          <div
            v-if="newObjective.keyResults.length === 0"
            class="empty-kr-alert"
          >
            Minimal harus ada 1 Key Result sebelum menyimpan Objective.
          </div>

          <div
            v-for="(kr, index) in newObjective.keyResults"
            :key="index"
            class="kr-row-card"
          >
            <div class="kr-row-header">
              <h4>Key Result #{{ index + 1 }}</h4>
              <button
                type="button"
                @click="removeKrRow(index)"
                class="remove-kr-btn"
                title="Hapus KR ini"
              >
                ✕
              </button>
            </div>

            <div class="form-group">
              <label :for="'kr-title-' + index">Deskripsi KR *</label>
              <input
                :id="'kr-title-' + index"
                v-model="kr.title"
                type="text"
                placeholder="Contoh: Mengurangi load-time server menjadi < 200ms"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group third">
                <label :for="'kr-target-' + index">Target Nilai *</label>
                <input
                  :id="'kr-target-' + index"
                  v-model.number="kr.targetValue"
                  type="number"
                  step="any"
                  placeholder="Target"
                  min="0.000001"
                  required
                />
              </div>
              <div class="form-group third">
                <label :for="'kr-unit-' + index">Satuan *</label>
                <input
                  :id="'kr-unit-' + index"
                  v-model="kr.unit"
                  type="text"
                  placeholder="%, IDR, dll"
                  required
                />
              </div>
              <div class="form-group third">
                <label :for="'kr-bsc-' + index">Perspektif BSC *</label>
                <select
                  :id="'kr-bsc-' + index"
                  v-model="kr.bscPerspective"
                  required
                >
                  <option value="" disabled>Pilih</option>
                  <option value="FINANCIAL">Financial</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="INTERNAL_PROCESS">Internal Process</option>
                  <option value="LEARNING_GROWTH">Learning & Growth</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button
              type="submit"
              class="save-btn"
              :disabled="loading || newObjective.keyResults.length === 0"
            >
              {{ loading ? "Menyimpan..." : "Simpan OKR & Hubungkan ke BSC" }}
            </button>
          </div>

          <!-- Notification Messages -->
          <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
          <p v-if="successMessage" class="success-msg">{{ successMessage }}</p>
        </form>
      </section>

      <!-- Right Column: OKR List -->
      <section class="list-section card">
        <div class="list-header">
          <h2>Daftar OKR Aktif</h2>
          <div class="filter-group">
            <label for="filter-quarter">Quarter:</label>
            <select
              id="filter-quarter"
              v-model="filterQuarter"
              @change="fetchObjectives"
            >
              <option value="">Semua</option>
              <option value="Q1-2026">Q1-2026</option>
              <option value="Q2-2026">Q2-2026</option>
              <option value="Q3-2026">Q3-2026</option>
              <option value="Q4-2026">Q4-2026</option>
            </select>
          </div>
        </div>

        <div v-if="loadingList" class="loading-state">Memuat data OKR...</div>

        <div v-else-if="objectives.length === 0" class="empty-state">
          Belum ada OKR yang terdaftar untuk periode ini.
        </div>

        <div v-else class="objectives-list">
          <div v-for="obj in objectives" :key="obj.id" class="objective-item">
            <div class="objective-item-header">
              <div>
                <span class="quarter-badge">{{ obj.quarter }}</span>
                <h3>{{ obj.title }}</h3>
                <p v-if="obj.description" class="obj-desc">
                  {{ obj.description }}
                </p>
              </div>
              <button
                @click="deleteObjective(obj.id)"
                class="delete-obj-btn"
                title="Hapus Objective ini beserta seluruh Key Results nya"
              >
                Hapus
              </button>
            </div>

            <div class="key-results-container">
              <div
                v-for="kr in obj.keyResults"
                :key="kr.id"
                class="kr-list-row"
              >
                <div class="kr-info">
                  <span class="kr-title">{{ kr.title }}</span>
                  <div class="kr-stats">
                    Target: <strong>{{ kr.targetValue }} {{ kr.unit }}</strong>
                    <span
                      class="status-badge"
                      :class="kr.status.toLowerCase().replace('_', '')"
                      >{{ kr.status }}</span
                    >
                  </div>
                </div>
                <div class="kr-actions-wrapper">
                  <div class="kr-perspective">
                    <span
                      class="perspective-badge"
                      :class="kr.bscPerspective.toLowerCase()"
                    >
                      {{ formatPerspective(kr.bscPerspective) }}
                    </span>
                  </div>
                  <div class="kr-action-buttons">
                    <button
                      @click="startEditKr(kr)"
                      class="edit-kr-btn"
                      title="Edit Metric (Key Result)"
                    >
                      Edit
                    </button>
                    <button
                      @click="deleteKr(kr.id)"
                      class="delete-kr-btn"
                      title="Hapus Metric (Key Result)"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Edit KR Modal -->
    <div v-if="editingKr" class="modal-overlay">
      <div class="modal-card">
        <h3>Edit Key Result / Metric</h3>
        <form @submit.prevent="submitEditKr" class="okr-form">
          <div class="form-group">
            <label>Deskripsi Key Result *</label>
            <input
              v-model="editKrData.title"
              type="text"
              placeholder="Contoh: Mengurangi load-time server menjadi < 200ms"
              required
            />
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label>Target Nilai *</label>
              <input
                v-model.number="editKrData.targetValue"
                type="number"
                step="any"
                min="0.000001"
                required
              />
            </div>
            <div class="form-group half">
              <label>Satuan *</label>
              <input
                v-model="editKrData.unit"
                type="text"
                placeholder="%, IDR, dll"
                required
              />
            </div>
          </div>
          <div class="form-group">
            <label>Perspektif BSC *</label>
            <select v-model="editKrData.bscPerspective" required>
              <option value="FINANCIAL">Financial</option>
              <option value="CUSTOMER">Customer</option>
              <option value="INTERNAL_PROCESS">Internal Process</option>
              <option value="LEARNING_GROWTH">Learning & Growth</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" @click="editingKr = null" class="cancel-btn">
              Batal
            </button>
            <button type="submit" class="save-kr-btn" :disabled="savingKr">
              {{ savingKr ? "Menyimpan..." : "Simpan Perubahan" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../../stores/auth";

const auth = useAuthStore();
const config = useRuntimeConfig();

const objectives = ref([]);
const filterQuarter = ref("");
const loading = ref(false);
const loadingList = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const isExistingObjective = ref(false);
const selectedObjectiveId = ref("");
const allObjectivesForDropdown = ref([]);

const newObjective = ref({
  title: "",
  description: "",
  quarter: "Q3-2026",
  keyResults: [
    {
      title: "",
      targetValue: null,
      unit: "%",
      bscPerspective: "",
    },
  ],
});

function addKrRow() {
  newObjective.value.keyResults.push({
    title: "",
    targetValue: null,
    unit: "%",
    bscPerspective: "",
  });
}

function removeKrRow(index) {
  newObjective.value.keyResults.splice(index, 1);
}

function formatPerspective(p) {
  if (!p) return "";
  return p
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

async function fetchAllObjectivesForDropdown() {
  try {
    const response = await $fetch(`${config.public.apiBase}/objectives`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
    allObjectivesForDropdown.value = response;
  } catch (err) {
    console.error("Error fetching all objectives for dropdown:", err);
  }
}

async function fetchObjectives() {
  loadingList.value = true;
  try {
    let url = `${config.public.apiBase}/objectives`;
    if (filterQuarter.value) {
      url += `?quarter=${filterQuarter.value}`;
    }
    const response = await $fetch(url, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
    objectives.value = response;
  } catch (err) {
    console.error("Error fetching objectives:", err);
  } finally {
    loadingList.value = false;
  }
}

async function submitObjective() {
  errorMessage.value = "";
  successMessage.value = "";

  // Validations
  if (isExistingObjective.value && !selectedObjectiveId.value) {
    errorMessage.value = "Silakan pilih Objective terlebih dahulu";
    return;
  }

  if (!isExistingObjective.value && !newObjective.value.title.trim()) {
    errorMessage.value = "Judul Objective wajib diisi";
    return;
  }

  if (newObjective.value.keyResults.length === 0) {
    errorMessage.value = "Minimal harus membuat 1 Key Result";
    return;
  }

  for (let i = 0; i < newObjective.value.keyResults.length; i++) {
    const kr = newObjective.value.keyResults[i];
    if (!kr.title.trim()) {
      errorMessage.value = `Deskripsi Key Result #${i + 1} wajib diisi`;
      return;
    }
    if (
      kr.targetValue === null ||
      kr.targetValue === undefined ||
      kr.targetValue <= 0
    ) {
      errorMessage.value = `Target Nilai Key Result #${i + 1} harus lebih besar dari 0`;
      return;
    }
    if (!kr.bscPerspective) {
      errorMessage.value = `Perspektif BSC Key Result #${i + 1} wajib dipilih`;
      return;
    }
  }

  loading.value = true;
  try {
    if (isExistingObjective.value) {
      // Save Key Results to existing Objective
      for (const kr of newObjective.value.keyResults) {
        await $fetch(`${config.public.apiBase}/key-results`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
          body: {
            objectiveId: selectedObjectiveId.value,
            title: kr.title,
            targetValue: kr.targetValue,
            unit: kr.unit,
            bscPerspective: kr.bscPerspective,
          },
        });
      }
      successMessage.value = "Key Results berhasil ditambahkan ke Objective!";
    } else {
      // Create new Objective and nested Key Results
      await $fetch(`${config.public.apiBase}/objectives`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: newObjective.value,
      });
      successMessage.value = "Objective & Key Results berhasil dibuat!";
    }

    // Reset form
    newObjective.value = {
      title: "",
      description: "",
      quarter: "Q3-2026",
      keyResults: [
        {
          title: "",
          targetValue: null,
          unit: "%",
          bscPerspective: "",
        },
      ],
    };
    selectedObjectiveId.value = "";

    fetchObjectives();
    fetchAllObjectivesForDropdown();
  } catch (err) {
    console.error("Submit objective error:", err);
    errorMessage.value = err.data?.message || "Gagal menyimpan data OKR.";
  } finally {
    loading.value = false;
  }
}

async function deleteObjective(id) {
  if (
    !confirm(
      "Apakah Anda yakin ingin menghapus Objective ini beserta seluruh Key Results di dalamnya?",
    )
  ) {
    return;
  }

  try {
    await $fetch(`${config.public.apiBase}/objectives/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
    fetchObjectives();
  } catch (err) {
    console.error("Delete error:", err);
    alert(err.data?.message || "Gagal menghapus Objective.");
  }
}

// Edit & Delete individual Key Results/Metrics
const editingKr = ref(null);
const editKrData = ref({
  id: "",
  title: "",
  targetValue: null,
  unit: "",
  bscPerspective: "",
});
const savingKr = ref(false);

function startEditKr(kr) {
  editingKr.value = kr.id;
  editKrData.value = {
    id: kr.id,
    title: kr.title,
    targetValue: kr.targetValue,
    unit: kr.unit,
    bscPerspective: kr.bscPerspective,
  };
}

async function submitEditKr() {
  if (!editKrData.value.title.trim()) return;
  if (
    editKrData.value.targetValue === null ||
    editKrData.value.targetValue <= 0
  )
    return;

  savingKr.value = true;
  try {
    await $fetch(
      `${config.public.apiBase}/key-results/${editKrData.value.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: {
          title: editKrData.value.title,
          targetValue: editKrData.value.targetValue,
          unit: editKrData.value.unit,
          bscPerspective: editKrData.value.bscPerspective,
        },
      },
    );
    editingKr.value = null;
    fetchObjectives();
  } catch (err) {
    console.error("Edit KR error:", err);
    alert(err.data?.message || "Gagal mengubah Key Result.");
  } finally {
    savingKr.value = false;
  }
}

async function deleteKr(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus Key Result ini?")) {
    return;
  }
  try {
    await $fetch(`${config.public.apiBase}/key-results/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
    fetchObjectives();
  } catch (err) {
    console.error("Delete KR error:", err);
    alert(err.data?.message || "Gagal menghapus Key Result.");
  }
}

onMounted(() => {
  fetchObjectives();
  fetchAllObjectivesForDropdown();
});
</script>

<style scoped>
@import url("https://fonts.google.com/share?selection.family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900|Rubik:ital,wght@0,300..900;1,300..900");

.admin-root {
  font-family: "Rubik", sans-serif;
  background: var(--content-bg);
  color: var(--text-color);
  padding: 30px 0 50px 0;
}

/* Header Styles */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-link {
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 17px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  transition: color 0.3s;
}

.back-link:hover {
  color: #00d2ff;
}

.header-brand h1 {
  font-size: 25px;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, #00d2ff 0%, #0066ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-badge {
  font-size: 14px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  letter-spacing: 0.5px;
}

.user-badge.admin {
  background: rgba(255, 75, 75, 0.15);
  color: #ff8888;
  border: 1px solid rgba(255, 75, 75, 0.3);
}

.user-name {
  font-size: 17px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

/* Layout Content */
.admin-content {
  display: grid;
  grid-template-columns: 1.1fr 1.3fr;
  gap: 30px;
  max-width: 1400px;
  margin: 30px auto 0 auto;
  padding: 0 30px;
}

@media (max-width: 1024px) {
  .admin-content {
    grid-template-columns: 1fr;
  }
}

.card {
  background: rgba(255, 255, 255, 0.03);
  border: 1.5px solid var(--card-border);
  border-radius: 16px;
  padding: 30px;
}

h2 {
  font-size: 23px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.section-desc {
  font-size: 17px;
  color: var(--color-primary-shade);
  margin: 20px 0 24px 0;
}

/* Form Styles */
.okr-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-gamma-050);
}

input[type="text"],
input[type="number"],
textarea,
select {
  background: var(--color-field);
  border: 1.5px solid var(--color-gamma-750);
  border-radius: 8px;
  padding: 12px 14px;
  color: var(--color-gamma-065);
  font-family: inherit;
  font-size: 17px;
  transition: all 0.3s;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #0088ff;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(0, 136, 255, 0.2);
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-group.half {
  width: 50%;
}

.form-group.third {
  width: 33.33%;
}

.divider {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin: 10px 0;
}

/* KR Builder Row Card */
.kr-builder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.kr-builder-header h3 {
  font-size: 19px;
  font-weight: 600;
  margin: 0;
}

.add-kr-btn {
  background: transparent;
  border: 1.5px solid var(--card-border);
  color: var(--color-primary-shade);
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.add-kr-btn:hover {
  background: var(--color-primary);
  transform: translateY(-1px);
  color: white;
}

.empty-kr-alert {
  background: rgba(255, 75, 75, 0.08);
  border: 1px solid rgba(255, 75, 75, 0.2);
  color: #ff8888;
  padding: 12px;
  border-radius: 8px;
  font-size: 16px;
  text-align: center;
}

.kr-row-card {
  background: var(--color-field);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.kr-row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kr-row-header h4 {
  font-size: 16px;
  margin: 0;
  color: var(--color-primary-shade);
  font-weight: 600;
}

.remove-kr-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  font-size: 17px;
  padding: 4px;
  transition: color 0.3s;
}

.remove-kr-btn:hover {
  color: #ff6666;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.save-btn {
  background: var(--color-primary);
  border: none;
  color: white;
  padding: 14px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 17px;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.save-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
  box-shadow: none;
}

.error-msg {
  color: #ff8888;
  background: rgba(255, 75, 75, 0.1);
  border-left: 3px solid #ff4b4b;
  padding: 10px 14px;
  border-radius: 4px;
  font-size: 16px;
  margin: 0;
}

.success-msg {
  color: #88ff88;
  background: rgba(75, 255, 75, 0.1);
  border-left: 3px solid #4bff4b;
  padding: 10px 14px;
  border-radius: 4px;
  font-size: 16px;
  margin: 0;
}

/* List Column Styles */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
}

.filter-group select {
  padding: 6px 12px;
  font-size: 16px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 17px;
  background: rgba(255, 255, 255, 0.01);
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.objectives-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 700px;
  overflow-y: auto;
  padding-right: 8px;
}

.objectives-list::-webkit-scrollbar {
  width: 6px;
}

.objectives-list::-webkit-scrollbar-track {
  background: transparent;
}

.objectives-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.objectives-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.objective-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1.5px solid var(--color-gamma-850);
  border-radius: 12px;
  padding: 20px;
}

.objective-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.quarter-badge {
  background: rgba(0, 136, 255, 0.15);
  color: #8cc4ff;
  font-size: 14px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 6px;
}

.objective-item-header h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.obj-desc {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  margin: 6px 0 0 0;
}

.delete-obj-btn {
  background: rgba(255, 75, 75, 0.1);
  border: 1px solid rgba(255, 75, 75, 0.2);
  color: #ff8888;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.delete-obj-btn:hover {
  background: rgba(255, 75, 75, 0.2);
  border-color: rgba(255, 75, 75, 0.4);
}

.key-results-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 14px;
}

.kr-list-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.01);
  border: 1.5px solid var(--card-gamma-650);
  padding: 10px 14px;
  border-radius: 8px;
}

.kr-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kr-title {
  font-size: 14px;
  border: 1.5px solid var(--card-gamma-650);
}

.kr-stats {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
}

.status-badge {
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 10px;
  text-transform: uppercase;
  margin-left: 6px;
}

.status-badge.ontrack {
  background: var(--color-green-badge);
  color: var(--color-green);
}

.status-badge.atrisk {
  background: var(--color-yellow-badge);
  color: var(--color-yellow);
  color: #ffcc66;
}

.status-badge.offtrack {
  background: var(--color-red-badge);
  color: var(--color-red);
}

.perspective-badge {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  flex-shrink: 0;
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

.kr-actions-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kr-action-buttons {
  display: flex;
  gap: 6px;
}

.edit-kr-btn {
  background: transparent;
  border: 1.5px solid var(--card-border);
  color: var(--color-primary-shade);
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.edit-kr-btn:hover {
  background: rgba(0, 210, 255, 0.2);
}

.delete-kr-btn {
  background: transparent;
  border: 1.5px solid var(--card-border);
  color: var(--color-red);
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.delete-kr-btn:hover {
  background: rgba(255, 75, 75, 0.2);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-card {
  background: var(--card-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  color: var(--color-gamma-065);
}

.modal-card h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 21px;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.save-kr-btn {
  background: var(--color-primary);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.save-kr-btn:hover {
  transform: translateY(-1px);
}
</style>

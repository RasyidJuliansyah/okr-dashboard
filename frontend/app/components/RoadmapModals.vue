<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3>{{ modalTitle }}</h3>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>

      <!-- DOMAIN FORM -->
      <form v-if="modalType === 'DOMAIN'" @submit.prevent="handleSaveDomain" class="modal-body">
        <div class="form-group">
          <label>Nama Domain <span class="req">*</span></label>
          <input
            v-model="domainForm.name"
            type="text"
            class="form-control"
            placeholder="Contoh: School Experience, Core Platform"
            required
          />
        </div>
        <div class="form-group">
          <label>Kode Domain <span class="req">*</span></label>
          <input
            v-model="domainForm.code"
            type="text"
            class="form-control"
            placeholder="Contoh: SCHOOL_EXP, CORE_PLATFORM"
            required
          />
        </div>
        <div class="form-group">
          <label>Warna Tema Domain</label>
          <div class="color-picker-row">
            <button
              v-for="color in presetColors"
              :key="color"
              type="button"
              class="color-swatch-btn"
              :class="{ active: domainForm.color === color }"
              :style="{ backgroundColor: color }"
              @click="domainForm.color = color"
            ></button>
            <input
              v-model="domainForm.color"
              type="text"
              class="form-control color-hex-input"
              placeholder="#010571"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="$emit('close')">Batal</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? "Menyimpan..." : (isEditing ? "Simpan Perubahan" : "Buat Domain") }}
          </button>
        </div>
      </form>

      <!-- EPIC FORM -->
      <form v-else-if="modalType === 'EPIC'" @submit.prevent="handleSaveEpic" class="modal-body">
        <div class="form-group">
          <label>Domain <span class="req">*</span></label>
          <select v-model="epicForm.domainId" class="form-control" required>
            <option v-for="d in domains" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Judul Epic <span class="req">*</span></label>
          <input
            v-model="epicForm.title"
            type="text"
            class="form-control"
            placeholder="Contoh: Rebuild Try Out, Absen QR & Presensi"
            required
          />
        </div>
        <div class="form-row">
          <div class="form-group col-6">
            <label>Tanggal Mulai</label>
            <input v-model="epicForm.startDate" type="date" class="form-control" />
          </div>
          <div class="form-group col-6">
            <label>Tenggat Akhir</label>
            <input v-model="epicForm.endDate" type="date" class="form-control" />
          </div>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select v-model="epicForm.status" class="form-control">
            <option value="PLANNED">Terencana (PLANNED)</option>
            <option value="IN_PROGRESS">Sedang Berjalan (IN_PROGRESS)</option>
            <option value="COMPLETED">Selesai (COMPLETED)</option>
            <option value="DELAYED">Tertunda (DELAYED)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Deskripsi Singkat</label>
          <textarea
            v-model="epicForm.description"
            class="form-control"
            rows="3"
            placeholder="Penjelasan tujuan epic dan dampak ke pengguna..."
          ></textarea>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="$emit('close')">Batal</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? "Menyimpan..." : (isEditing ? "Simpan Perubahan" : "Buat Epic") }}
          </button>
        </div>
      </form>

      <!-- FEATURE FORM -->
      <form v-else-if="modalType === 'FEATURE'" @submit.prevent="handleSaveFeature" class="modal-body">
        <div class="form-group">
          <label>Epic Terkait <span class="req">*</span></label>
          <select v-model="featureForm.epicId" class="form-control" required>
            <template v-for="d in domains" :key="d.id">
              <optgroup :label="d.name">
                <option v-for="ep in d.epics" :key="ep.id" :value="ep.id">
                  {{ ep.title }}
                </option>
              </optgroup>
            </template>
          </select>
        </div>
        <div class="form-group">
          <label>Nama Feature <span class="req">*</span></label>
          <input
            v-model="featureForm.title"
            type="text"
            class="form-control"
            placeholder="Contoh: Absen QR Code Siswa, Anbuso v1"
            required
          />
        </div>
        <!-- Pilihan Cepat Kurun Week (W1-W2 / W3-W4) -->
        <div class="week-picker-card">
          <div class="week-picker-header">
            <span class="picker-label">⚡ Pintasan Kurun Waktu (Bulan & Week):</span>
          </div>
          <div class="week-picker-body">
            <select
              v-model="selectedFeatureMonth"
              class="form-control form-control-sm picker-month-select"
            >
              <option v-for="m in monthOptions" :key="m.value" :value="m.value">
                {{ m.label }}
              </option>
            </select>
            <div class="week-btn-group">
              <button
                type="button"
                class="btn-week-choice"
                :class="{ active: currentFeatureWeekPreset === 'W1-W2' }"
                @click="applyFeatureWeekPreset('W1-W2')"
                title="Pilih Minggu 1 & 2 (Tanggal 1–15)"
              >
                W1-W2
                <span class="small-text">(1–15)</span>
              </button>
              <button
                type="button"
                class="btn-week-choice"
                :class="{ active: currentFeatureWeekPreset === 'W3-W4' }"
                @click="applyFeatureWeekPreset('W3-W4')"
                title="Pilih Minggu 3 & 4 (Tanggal 16–Akhir)"
              >
                W3-W4
                <span class="small-text">(16–Akhir)</span>
              </button>
              <button
                type="button"
                class="btn-week-choice"
                :class="{ active: currentFeatureWeekPreset === 'FULL' }"
                @click="applyFeatureWeekPreset('FULL')"
                title="Pilih 1 Bulan Penuh (W1-W4)"
              >
                1 Bulan
                <span class="small-text">(W1–W4)</span>
              </button>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group col-6">
            <label>Tanggal Mulai <span class="req">*</span></label>
            <input v-model="featureForm.startDate" type="date" class="form-control" required />
          </div>
          <div class="form-group col-6">
            <label>Tenggat Akhir <span class="req">*</span></label>
            <input v-model="featureForm.endDate" type="date" class="form-control" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group col-6">
            <label>Progress: <strong>{{ featureForm.progressPercent }}%</strong></label>
            <input
              v-model.number="featureForm.progressPercent"
              type="range"
              min="0"
              max="100"
              step="5"
              class="form-range"
            />
          </div>
          <div class="form-group col-6">
            <label>Status</label>
            <select v-model="featureForm.status" class="form-control">
              <option value="PLANNED">Terencana</option>
              <option value="IN_PROGRESS">Sedang Berjalan</option>
              <option value="COMPLETED">Selesai</option>
              <option value="DELAYED">Tertunda</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>PIC / Pemilik Fitur</label>
          <input
            v-model="featureForm.picName"
            type="text"
            class="form-control"
            placeholder="Contoh: Team School, Core Eng, FinTech Team"
          />
        </div>
        <div class="form-group">
          <label>Deskripsi & Catatan Rilis</label>
          <textarea
            v-model="featureForm.description"
            class="form-control"
            rows="2"
            placeholder="Informasi cakupan fitur atau catatan rilis..."
          ></textarea>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="$emit('close')">Batal</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? "Menyimpan..." : (isEditing ? "Simpan Perubahan" : "Buat Feature") }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from "vue";

const props = defineProps<{
  isOpen: boolean;
  modalType: "DOMAIN" | "EPIC" | "FEATURE";
  editingItem: any | null;
  defaultDomainId?: string;
  defaultEpicId?: string;
  domains: any[];
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save-domain", data: any): void;
  (e: "save-epic", data: any): void;
  (e: "save-feature", data: any): void;
}>();

const presetColors = [
  "#010571",
  "#0e97d6",
  "#f2ca17",
  "#7c3aed",
  "#059669",
  "#db2777",
];

const isEditing = computed(() => Boolean(props.editingItem?.id));

const modalTitle = computed(() => {
  if (props.modalType === "DOMAIN") {
    return isEditing.value ? "Ubah Domain Produk" : "Tambah Domain Produk Baru";
  }
  if (props.modalType === "EPIC") {
    return isEditing.value ? "Ubah Epic Roadmap" : "Tambah Epic Baru";
  }
  return isEditing.value ? "Ubah Feature Roadmap" : "Tambah Feature Baru";
});

const domainForm = reactive({
  name: "",
  code: "",
  color: "#010571",
});

const epicForm = reactive({
  domainId: "",
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  status: "PLANNED",
});

const monthOptions = [
  { value: "2026-10", label: "Oktober 2026" },
  { value: "2026-11", label: "November 2026" },
  { value: "2026-12", label: "Desember 2026" },
  { value: "2027-01", label: "Januari 2027" },
  { value: "2027-02", label: "Februari 2027" },
  { value: "2027-03", label: "Maret 2027" },
  { value: "2027-04", label: "April 2027" },
  { value: "2027-05", label: "Mei 2027" },
  { value: "2027-06", label: "Juni 2027" },
  { value: "2027-07", label: "Juli 2027" },
  { value: "2027-08", label: "Agustus 2027" },
  { value: "2027-09", label: "September 2027" },
  { value: "2027-10", label: "Oktober 2027" },
  { value: "2027-11", label: "November 2027" },
  { value: "2027-12", label: "Desember 2027" },
];

const selectedFeatureMonth = ref("2026-10");
const currentFeatureWeekPreset = ref<"W1-W2" | "W3-W4" | "FULL" | null>(null);

function applyFeatureWeekPreset(preset: "W1-W2" | "W3-W4" | "FULL") {
  currentFeatureWeekPreset.value = preset;
  const [yearStr, monthStr] = selectedFeatureMonth.value.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const daysInM = new Date(year, month + 1, 0).getDate();
  const splitDay = daysInM === 28 ? 14 : 15;
  const mPad = String(month + 1).padStart(2, "0");

  if (preset === "W1-W2") {
    featureForm.startDate = `${year}-${mPad}-01`;
    featureForm.endDate = `${year}-${mPad}-${String(splitDay).padStart(2, "0")}`;
  } else if (preset === "W3-W4") {
    featureForm.startDate = `${year}-${mPad}-${String(splitDay + 1).padStart(2, "0")}`;
    featureForm.endDate = `${year}-${mPad}-${String(daysInM).padStart(2, "0")}`;
  } else if (preset === "FULL") {
    featureForm.startDate = `${year}-${mPad}-01`;
    featureForm.endDate = `${year}-${mPad}-${String(daysInM).padStart(2, "0")}`;
  }
}

const featureForm = reactive({
  epicId: "",
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  progressPercent: 0,
  status: "PLANNED",
  picName: "",
});

watch(
  () => props.isOpen,
  (open) => {
    if (!open) return;
    const it = props.editingItem;
    if (props.modalType === "DOMAIN") {
      domainForm.name = it?.name || "";
      domainForm.code = it?.code || "";
      domainForm.color = it?.color || "#010571";
    } else if (props.modalType === "EPIC") {
      epicForm.domainId = it?.domainId || props.defaultDomainId || props.domains[0]?.id || "";
      epicForm.title = it?.title || "";
      epicForm.description = it?.description || "";
      epicForm.startDate = it?.startDate ? it.startDate.substring(0, 10) : "";
      epicForm.endDate = it?.endDate ? it.endDate.substring(0, 10) : "";
      epicForm.status = it?.status || "PLANNED";
    } else if (props.modalType === "FEATURE") {
      let defaultEpic = props.defaultEpicId;
      if (!defaultEpic && props.domains[0]?.epics[0]) {
        defaultEpic = props.domains[0].epics[0].id;
      }
      featureForm.epicId = it?.epicId || defaultEpic || "";
      featureForm.title = it?.title || "";
      featureForm.description = it?.description || "";
      featureForm.startDate = it?.startDate ? it.startDate.substring(0, 10) : "";
      if (featureForm.startDate && featureForm.startDate.length >= 7) {
        selectedFeatureMonth.value = featureForm.startDate.substring(0, 7);
      }
      featureForm.endDate = it?.endDate ? it.endDate.substring(0, 10) : "";
      featureForm.progressPercent = typeof it?.progressPercent === "number" ? it.progressPercent : 0;
      featureForm.status = it?.status || "PLANNED";
      featureForm.picName = it?.picName || "";
    }
  },
  { immediate: true }
);

function handleSaveDomain() {
  emit("save-domain", { ...domainForm });
}

function handleSaveEpic() {
  emit("save-epic", {
    ...epicForm,
    startDate: epicForm.startDate || null,
    endDate: epicForm.endDate || null,
  });
}

function handleSaveFeature() {
  emit("save-feature", { ...featureForm });
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.modal-dialog {
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #010571;
}

.btn-close {
  background: none;
  border: none;
  font-size: 16px;
  color: #94a3b8;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12.5px;
  font-weight: 600;
  color: #334155;
}

.req {
  color: #ef4444;
}

.form-control {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}

.form-control:focus {
  border-color: #010571;
  box-shadow: 0 0 0 2px rgba(1, 5, 113, 0.1);
}

.form-row {
  display: flex;
  gap: 12px;
}

.col-6 {
  flex: 1;
}

.form-range {
  width: 100%;
  accent-color: #010571;
}

.color-picker-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-swatch-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
}

.color-swatch-btn.active {
  border-color: #0f172a;
  transform: scale(1.15);
}

.color-hex-input {
  width: 100px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.btn-primary {
  background: #010571;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: #0e97d6;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.week-picker-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.week-picker-header {
  margin-bottom: 6px;
}

.picker-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #010571;
}

.week-picker-body {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.picker-month-select {
  flex: 1 1 130px;
  max-width: 160px;
  height: 32px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 2px 6px;
  background: #ffffff;
}

.week-btn-group {
  display: flex;
  gap: 6px;
  flex: 2 1 230px;
}

.btn-week-choice {
  flex: 1;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
  color: #010571;
  cursor: pointer;
  transition: all 0.15s ease;
  line-height: 1.1;
}

.btn-week-choice .small-text {
  font-size: 8.5px;
  font-weight: 500;
  color: #64748b;
  margin-top: 1px;
}

.btn-week-choice:hover {
  border-color: #0e97d6;
  background: #f0f9ff;
}

.btn-week-choice.active {
  background: #010571;
  color: #ffffff;
  border-color: #010571;
}

.btn-week-choice.active .small-text {
  color: #cbd5e1;
}

</style>

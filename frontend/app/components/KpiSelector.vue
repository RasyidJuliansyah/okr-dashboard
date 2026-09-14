<template>
  <div class="kpi-selector-container">
    <div class="kpi-selector-header">
      <label class="kpi-label">
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
          <path d="M12 20v-6M6 20V10M18 20V4" />
        </svg>
        Target KPI (Key Performance Indicator)
      </label>
      <button
        v-if="!readonly"
        type="button"
        class="add-kpi-btn"
        @click="openPickerModal"
      >
        + Tambah KPI
      </button>
    </div>

    <!-- Selected KPI Items List -->
    <div v-if="selectedItems.length === 0" class="empty-kpis">
      Belum ada KPI yang dipilih. Klik tombol "+ Tambah KPI" di atas untuk
      menghubungkan KPI.
    </div>

    <div v-else class="kpi-list">
      <div
        v-for="(item, index) in selectedItems"
        :key="item.kpiId || index"
        class="kpi-item-card"
      >
        <div class="kpi-item-main">
          <div class="kpi-title-row">
            <span class="kpi-name">{{ getKpiName(item) }}</span>
            <span
              v-if="getKpiBsc(item)"
              class="bsc-badge-sm"
              :class="getKpiBsc(item).toLowerCase()"
            >
              {{ getKpiBsc(item) }}
            </span>
            <span v-if="getKpiDept(item)" class="dept-badge-sm">
              {{ getKpiDept(item) }}
            </span>
          </div>
          <p v-if="getKpiDesc(item)" class="kpi-desc">
            {{ getKpiDesc(item) }}
          </p>
        </div>

        <div class="kpi-item-inputs">
          <div class="input-group-sm">
            <label>Target Value:</label>
            <div class="unit-input-wrap">
              <input
                type="number"
                step="any"
                v-model.number="item.targetValue"
                :readonly="readonly"
                placeholder="0"
                class="form-input-sm"
                @input="emitChange"
              />
              <span class="unit-text">{{ getKpiUnit(item) }}</span>
            </div>
          </div>

          <div v-if="showCurrentValue" class="input-group-sm">
            <label>Capaian Saat Ini:</label>
            <div class="unit-input-wrap">
              <input
                type="number"
                step="any"
                v-model.number="item.currentValue"
                :readonly="readonly"
                placeholder="0"
                class="form-input-sm"
                @input="emitChange"
              />
              <span class="unit-text">{{ getKpiUnit(item) }}</span>
            </div>
          </div>

          <button
            v-if="!readonly"
            type="button"
            class="remove-kpi-btn"
            @click="removeKpi(index)"
            title="Hapus KPI"
          >
            &times;
          </button>
        </div>
      </div>
    </div>

    <!-- Picker Modal -->
    <div
      v-if="showPicker"
      class="picker-backdrop"
      @click.self="showPicker = false"
    >
      <div class="picker-card">
        <div class="picker-header">
          <h4>Pilih Indikator KPI</h4>
          <button type="button" class="close-btn" @click="showPicker = false">
            &times;
          </button>
        </div>

        <div class="picker-filter">
          <div class="picker-filter-row">
            <input
              v-model="pickerSearch"
              type="text"
              placeholder="Cari indikator KPI..."
              class="picker-search-input"
            />
            <select v-model="pickerDept" class="picker-dept-select">
              <option value="">Semua Departemen</option>
              <option value="ALL">ALL (Lintas Dept)</option>
              <option
                v-for="dept in availableDepartments"
                :key="dept.value"
                :value="dept.value"
              >
                {{ dept.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="picker-body">
          <div v-if="loadingMaster" class="loading-state-sm">
            Memuat katalog KPI...
          </div>
          <div
            v-else-if="availableKpisForPicker.length === 0"
            class="empty-state-sm"
          >
            Tidak ada KPI yang tersedia untuk dipilih.
          </div>
          <div v-else class="picker-kpi-list">
            <div
              v-for="kpi in availableKpisForPicker"
              :key="kpi.id"
              class="picker-kpi-item"
              @click="selectKpiFromPicker(kpi)"
            >
              <div class="picker-kpi-info">
                <div class="picker-kpi-name">{{ kpi.name }}</div>
                <div class="picker-kpi-meta">
                  <span
                    class="bsc-badge-xs"
                    :class="kpi.bscPerspective.toLowerCase()"
                  >
                    {{ kpi.bscPerspective }}
                  </span>
                  <span class="dept-badge-xs">{{
                    kpi.department || "ALL"
                  }}</span>
                  <span class="unit-badge-xs">Satuan: {{ kpi.unit }}</span>
                </div>
              </div>
              <button type="button" class="select-btn-sm">+ Pilih</button>
            </div>
          </div>
        </div>

        <div class="picker-footer">
          <button
            type="button"
            class="secondary-btn-sm"
            @click="showPicker = false"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import { useAuthStore } from "../stores/auth";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  department: {
    type: String,
    default: "",
  },
  bscPerspective: {
    type: String,
    default: "",
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  showCurrentValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);
const auth = useAuthStore();
const config = useRuntimeConfig();

const masterKpis = ref([]);
const departments = ref([]);
const loadingMaster = ref(false);
const showPicker = ref(false);
const pickerSearch = ref("");
const pickerDept = ref("");

const selectedItems = ref([]);

watch(
  () => props.modelValue,
  (newVal) => {
    if (Array.isArray(newVal)) {
      selectedItems.value = newVal.map((item) => ({
        kpiId: item.kpiId || item.id,
        targetValue:
          item.targetValue !== undefined
            ? item.targetValue
            : item.defaultTarget || 0,
        currentValue: item.currentValue || 0,
        kpi:
          item.kpi ||
          masterKpis.value.find((m) => m.id === (item.kpiId || item.id)),
      }));
    }
  },
  { immediate: true, deep: true },
);

async function fetchMasterKpis() {
  loadingMaster.value = true;
  try {
    const res = await $fetch(`${config.public.apiBase}/kpis`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    masterKpis.value = res;
    // Re-link kpi objects for selectedItems if missing
    selectedItems.value.forEach((item) => {
      if (!item.kpi) {
        item.kpi = masterKpis.value.find((m) => m.id === item.kpiId);
      }
    });
  } catch (err) {
    console.error("Error fetching master KPIs in selector:", err);
  } finally {
    loadingMaster.value = false;
  }
}

async function fetchDepartments() {
  try {
    const res = await $fetch(`${config.public.apiBase}/departments`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    departments.value = res.map((d) => ({
      value: d.value || d.name,
      label: d.name,
    }));
  } catch (err) {
    console.error("Error fetching departments in selector:", err);
  }
}

const availableDepartments = computed(() => {
  const set = new Map();
  departments.value.forEach((d) => {
    set.set(d.value, d.label);
  });
  masterKpis.value.forEach((k) => {
    if (k.department && k.department !== "ALL" && !set.has(k.department)) {
      set.set(k.department, k.department);
    }
  });
  return Array.from(set.entries()).map(([value, label]) => ({ value, label }));
});

const availableKpisForPicker = computed(() => {
  const selectedIds = selectedItems.value.map((i) => i.kpiId);

  return masterKpis.value.filter((kpi) => {
    if (selectedIds.includes(kpi.id)) return false;

    const matchSearch =
      !pickerSearch.value ||
      kpi.name.toLowerCase().includes(pickerSearch.value.toLowerCase()) ||
      (kpi.description &&
        kpi.description.toLowerCase().includes(pickerSearch.value.toLowerCase()));

    const matchDept =
      !pickerDept.value ||
      (pickerDept.value === "ALL"
        ? kpi.department === "ALL"
        : kpi.department === pickerDept.value || kpi.department === "ALL");

    return matchSearch && matchDept;
  });
});

function openPickerModal() {
  pickerSearch.value = "";
  pickerDept.value = props.department || "";
  showPicker.value = true;
  if (masterKpis.value.length === 0) {
    fetchMasterKpis();
  }
  if (departments.value.length === 0) {
    fetchDepartments();
  }
}

function selectKpiFromPicker(kpi) {
  selectedItems.value.push({
    kpiId: kpi.id,
    targetValue:
      kpi.defaultTarget !== null && kpi.defaultTarget !== undefined
        ? kpi.defaultTarget
        : 0,
    currentValue: 0,
    kpi: kpi,
  });
  emitChange();
}

function removeKpi(index) {
  selectedItems.value.splice(index, 1);
  emitChange();
}

function emitChange() {
  emit(
    "update:modelValue",
    selectedItems.value.map((item) => ({
      kpiId: item.kpiId,
      targetValue: item.targetValue,
      currentValue: item.currentValue,
      kpi: item.kpi,
    })),
  );
}

function getKpiName(item) {
  return (
    item.kpi?.name ||
    masterKpis.value.find((m) => m.id === item.kpiId)?.name ||
    "KPI"
  );
}

function getKpiBsc(item) {
  return (
    item.kpi?.bscPerspective ||
    masterKpis.value.find((m) => m.id === item.kpiId)?.bscPerspective ||
    ""
  );
}

function getKpiDept(item) {
  return (
    item.kpi?.department ||
    masterKpis.value.find((m) => m.id === item.kpiId)?.department ||
    ""
  );
}

function getKpiDesc(item) {
  return (
    item.kpi?.description ||
    masterKpis.value.find((m) => m.id === item.kpiId)?.description ||
    ""
  );
}

function getKpiUnit(item) {
  return (
    item.kpi?.unit ||
    masterKpis.value.find((m) => m.id === item.kpiId)?.unit ||
    "%"
  );
}

onMounted(() => {
  fetchMasterKpis();
  fetchDepartments();
});
</script>

<style scoped>
.kpi-selector-container {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  background: #f8fafc;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
.kpi-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.kpi-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.add-kpi-btn {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.add-kpi-btn:hover {
  background: #0369a1;
}
.empty-kpis {
  font-size: 0.8rem;
  color: #64748b;
  font-style: italic;
  padding: 0.5rem 0;
}
.kpi-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.kpi-item-card {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.kpi-item-main {
  flex: 1;
  min-width: 200px;
}
.kpi-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.kpi-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: #0f172a;
}
.bsc-badge-sm {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-weight: 600;
}
.bsc-badge-sm.financial {
  background: #dbeafe;
  color: #1e40af;
}
.bsc-badge-sm.customer {
  background: #dcfce7;
  color: #166534;
}
.bsc-badge-sm.internal_process {
  background: #fef3c7;
  color: #92400e;
}
.bsc-badge-sm.learning_growth {
  background: #f3e8ff;
  color: #6b21a8;
}

.dept-badge-sm {
  background: #f1f5f9;
  color: #475569;
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}
.kpi-desc {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0.2rem 0 0 0;
}
.kpi-item-inputs {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.input-group-sm {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #334155;
}
.unit-input-wrap {
  display: flex;
  align-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  overflow: hidden;
}
.form-input-sm {
  width: 70px;
  padding: 0.3rem 0.4rem;
  border: none;
  outline: none;
  font-size: 0.8rem;
  text-align: right;
}
.unit-text {
  background: #f1f5f9;
  padding: 0.3rem 0.4rem;
  font-size: 0.75rem;
  color: #64748b;
  border-left: 1px solid #cbd5e1;
}
.remove-kpi-btn {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1.2rem;
  cursor: pointer;
  line-height: 1;
  padding: 0 0.25rem;
}
.picker-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}
.picker-card {
  width: 100%;
  max-width: 550px;
  background: #ffffff;
  border-radius: 10px;
  padding: 1.25rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}
.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.picker-header h4 {
  margin: 0;
  font-size: 1rem;
  color: #0f172a;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #94a3b8;
  cursor: pointer;
}
.picker-filter {
  margin-bottom: 1rem;
}
.picker-filter-row {
  display: flex;
  gap: 0.5rem;
}
.picker-search-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;
}
.picker-search-input:focus {
  border-color: #0284c7;
}
.picker-dept-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.825rem;
  background-color: #ffffff;
  color: #334155;
  outline: none;
  max-width: 180px;
  cursor: pointer;
}
.picker-dept-select:focus {
  border-color: #0284c7;
}
.picker-body {
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
  padding: 0.5rem;
}
.picker-kpi-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.picker-kpi-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.picker-kpi-item:hover {
  background: #f0f9ff;
  border-color: #0284c7;
}
.picker-kpi-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: #0f172a;
}
.picker-kpi-meta {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.2rem;
}
.bsc-badge-xs,
.dept-badge-xs,
.unit-badge-xs {
  font-size: 0.65rem;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}
.bsc-badge-xs.financial {
  background: #dbeafe;
  color: #1e40af;
}
.bsc-badge-xs.customer {
  background: #dcfce7;
  color: #166534;
}
.bsc-badge-xs.internal_process {
  background: #fef3c7;
  color: #92400e;
}
.bsc-badge-xs.learning_growth {
  background: #f3e8ff;
  color: #6b21a8;
}
.dept-badge-xs {
  background: #e0f2fe;
  color: #0369a1;
}
.unit-badge-xs {
  background: #f1f5f9;
  color: #475569;
}
.select-btn-sm {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}
.picker-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}
.secondary-btn-sm {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #475569;
  cursor: pointer;
}
.loading-state-sm,
.empty-state-sm {
  padding: 1.5rem;
  text-align: center;
  color: #64748b;
  font-size: 0.85rem;
}
</style>

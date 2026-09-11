<template>
  <div class="unit-target-wrapper" style="margin-bottom: 12px">
    <div
      class="form-row-2"
      style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px"
    >
      <div>
        <label
          style="
            display: block;
            margin-bottom: 4px;
            font-weight: 500;
            font-size: 13px;
          "
        >
          {{ labelTarget || "Target Value" }}
          <span v-if="required" style="color: #ef4444">*</span>
        </label>
        <div>
          <input
            v-if="unitCategory === 'Rupiah'"
            :value="formattedRupiahDisplay"
            @input="onRupiahInput"
            type="text"
            class="form-input"
            :placeholder="placeholderTarget || 'Contoh: 1,000,000'"
            :required="required"
          />
          <input
            v-else-if="unitCategory === '%'"
            :value="targetValue"
            @input="onPercentInput"
            type="number"
            class="form-input"
            min="0"
            max="100"
            :placeholder="placeholderTarget || '0 - 100'"
            :required="required"
          />
          <input
            v-else
            :value="targetValue"
            @input="onGeneralInput"
            type="number"
            class="form-input"
            min="0"
            :placeholder="placeholderTarget || 'Target nilai'"
            :required="required"
          />
        </div>
        <small
          v-if="unitCategory === 'Rupiah'"
          style="
            color: #059669;
            font-weight: 600;
            font-size: 11px;
            display: block;
            margin-top: 4px;
          "
        >
          Nominal: {{ formatTargetValue(targetValue, "Rupiah (Rp)") }}
        </small>
        <small
          v-else-if="unitCategory === '%'"
          style="
            color: #64748b;
            font-size: 11px;
            display: block;
            margin-top: 4px;
          "
        >
          * Maksimal 100%
        </small>
      </div>

      <div>
        <label
          style="
            display: block;
            margin-bottom: 4px;
            font-weight: 500;
            font-size: 13px;
          "
        >
          {{ labelUnit || "Satuan (Unit)" }}
          <span v-if="required" style="color: #ef4444">*</span>
        </label>
        <select
          v-model="unitCategory"
          class="form-input"
          @change="onCategoryChange"
        >
          <option value="Rupiah">Rupiah (Rp)</option>
          <option value="%">% (Persen)</option>
          <option value="Lainnya">Lainnya</option>
        </select>

        <div v-if="unitCategory === 'Lainnya'" style="margin-top: 6px">
          <input
            v-model="customUnitText"
            @input="onCustomUnitInput"
            type="text"
            class="form-input"
            :class="{ 'input-invalid': isCustomEmpty }"
            placeholder="Tulis satuan (misal: Leads, Target, Unit...)"
            style="font-size: 13px"
            :required="required || unitCategory === 'Lainnya'"
          />
          <small
            v-if="isCustomEmpty"
            style="
              color: #ef4444;
              font-size: 11px;
              display: block;
              margin-top: 4px;
            "
          >
            * Satuan wajib diisi jika memilih opsi 'Lainnya'
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { formatTargetValue } from "~/utils/formatters";

const props = withDefaults(
  defineProps<{
    targetValue?: number | string | null;
    unit?: string | null;
    labelTarget?: string;
    labelUnit?: string;
    required?: boolean;
    placeholderTarget?: string;
  }>(),
  {
    targetValue: 0,
    unit: "%",
    labelTarget: "Target Value",
    labelUnit: "Satuan (Unit)",
    required: false,
    placeholderTarget: "",
  },
);

const emit = defineEmits<{
  (e: "update:targetValue", val: number): void;
  (e: "update:unit", val: string): void;
}>();

const unitCategory = ref<"Rupiah" | "%" | "Lainnya">("%");
const customUnitText = ref("");

const isCustomEmpty = computed(() => {
  return unitCategory.value === "Lainnya" && !customUnitText.value.trim();
});

function detectCategory(u?: string | null): "Rupiah" | "%" | "Lainnya" {
  if (!u) return "%";
  const trimmed = u.trim().toLowerCase();
  if (
    trimmed.includes("rupiah") ||
    trimmed.includes("rp") ||
    trimmed === "idr"
  ) {
    return "Rupiah";
  }
  if (
    trimmed === "%" ||
    trimmed.includes("persen") ||
    trimmed.includes("percent")
  ) {
    return "%";
  }
  return "Lainnya";
}

// Sync category and custom text when prop unit changes
watch(
  () => props.unit,
  (newUnit) => {
    // If currently 'Lainnya' and newUnit is empty or matches our custom text, do not reset
    if (unitCategory.value === "Lainnya") {
      if (!newUnit || newUnit === customUnitText.value) {
        return;
      }
    }
    const cat = detectCategory(newUnit);
    unitCategory.value = cat;
    if (cat === "Lainnya") {
      customUnitText.value = newUnit || "";
    }
  },
  { immediate: true },
);

function onCategoryChange() {
  if (unitCategory.value === "Rupiah") {
    emit("update:unit", "Rupiah (Rp)");
  } else if (unitCategory.value === "%") {
    emit("update:unit", "%");
    const num = Number(props.targetValue) || 0;
    if (num > 100) {
      emit("update:targetValue", 100);
    }
  } else {
    emit("update:unit", customUnitText.value);
  }
}

function onCustomUnitInput() {
  emit("update:unit", customUnitText.value);
}

const formattedRupiahDisplay = computed(() => {
  if (
    props.targetValue === null ||
    props.targetValue === undefined ||
    props.targetValue === "" ||
    props.targetValue === 0
  ) {
    return "";
  }
  const num = Number(props.targetValue);
  return isNaN(num) ? "" : num.toLocaleString("en-US");
});

function onRupiahInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const rawDigits = input.value.replace(/[^\d]/g, "");
  if (rawDigits === "") {
    emit("update:targetValue", 0);
    input.value = "";
    return;
  }
  const num = parseInt(rawDigits, 10);
  emit("update:targetValue", num);
  input.value = num.toLocaleString("en-US");
}

function onPercentInput(e: Event) {
  const input = e.target as HTMLInputElement;
  let num = parseFloat(input.value);
  if (isNaN(num)) num = 0;
  if (num > 100) num = 100;
  if (num < 0) num = 0;
  emit("update:targetValue", num);
}

function onGeneralInput(e: Event) {
  const input = e.target as HTMLInputElement;
  let num = parseFloat(input.value);
  if (isNaN(num)) num = 0;
  if (num < 0) num = 0;
  emit("update:targetValue", num);
}
</script>

<style scoped>
.form-input {
  width: 100%;
  height: 38px;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #0f172a;
  background-color: #ffffff;
  box-sizing: border-box;
  outline: none;
  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
}

select.form-input {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  padding-right: 32px;
  cursor: pointer;
}

.form-input:focus {
  border-color: #0e97d6;
  box-shadow: 0 0 0 3px rgba(14, 151, 214, 0.15);
}

.form-input::placeholder {
  color: #94a3b8;
}

.form-input.input-invalid {
  border-color: #ef4444 !important;
}

.form-input.input-invalid:focus {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15) !important;
}
</style>

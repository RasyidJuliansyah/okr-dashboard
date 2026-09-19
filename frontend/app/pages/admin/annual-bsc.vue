<template>
  <div class="admin-root">
    <div
      class="admin-content"
      style="display: flex; gap: 1.5rem; flex-wrap: wrap"
    >
      <!-- Left Column: Form Builder -->
      <section
        class="form-section card"
        style="flex: 1; min-width: 320px; max-width: 450px"
      >
        <h2 style="margin: 0 0 0.5rem 0">Buat BSC Tahunan Baru</h2>
        <p
          class="section-desc"
          style="
            margin-top: 4px;
            margin-bottom: 1.5rem;
            font-size: 0.85rem;
            color: #666;
          "
        >
          Definisikan Annual Key Result berdasarkan Objective dan Perspektif
          BSC.
        </p>

        <form @submit.prevent="submitAnnualKr" class="okr-form">
          <div class="form-group" style="margin-bottom: 1rem">
            <label
              for="obj-select"
              style="font-weight: 600; display: block; margin-bottom: 0.25rem"
              >Pilih Objective *</label
            >
            <select
              id="obj-select"
              v-model="form.objectiveId"
              required
              style="
                width: 100%;
                padding: 0.5rem;
                border: 1px solid #ccc;
                border-radius: 4px;
              "
            >
              <option value="" disabled>Pilih Objective</option>
              <option v-for="obj in objectives" :key="obj.id" :value="obj.id">
                [{{ obj.year }}] {{ obj.title }}
              </option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 1rem">
            <label
              for="kr-title"
              style="font-weight: 600; display: block; margin-bottom: 0.25rem"
              >Judul Annual Key Result *</label
            >
            <input
              id="kr-title"
              v-model="form.title"
              type="text"
              placeholder="Contoh: EBITDA 10 Milyar Rupiah"
              required
              style="
                width: 100%;
                padding: 0.5rem;
                border: 1px solid #ccc;
                border-radius: 4px;
              "
            />
          </div>

          <div class="form-group" style="margin-bottom: 1rem">
            <label
              for="kr-desc"
              style="font-weight: 600; display: block; margin-bottom: 0.25rem"
              >Deskripsi (Opsional)</label
            >
            <textarea
              id="kr-desc"
              v-model="form.description"
              placeholder="Detail penjelasan target tahunan ini..."
              rows="2"
              style="
                width: 100%;
                padding: 0.5rem;
                border: 1px solid #ccc;
                border-radius: 4px;
                resize: vertical;
              "
            ></textarea>
          </div>

          <UnitTargetInput
            v-model:targetValue="form.targetValue"
            v-model:unit="form.unit"
            :required="true"
          />

          <div class="form-group" style="margin-bottom: 1.5rem">
            <label
              for="kr-perspective"
              style="font-weight: 600; display: block; margin-bottom: 0.25rem"
              >Perspektif BSC *</label
            >
            <select
              id="kr-perspective"
              v-model="form.bscPerspective"
              required
              style="
                width: 100%;
                padding: 0.5rem;
                border: 1px solid #ccc;
                border-radius: 4px;
              "
            >
              <option value="" disabled>Pilih Perspektif</option>
              <option value="FINANCIAL">Financial</option>
              <option value="CUSTOMER">Customer</option>
              <option value="INTERNAL_PROCESS">Internal Process</option>
              <option value="LEARNING_GROWTH">Learning & Growth</option>
            </select>
          </div>

          <div
            class="form-actions"
            style="display: flex; justify-content: flex-end; gap: 0.5rem"
          >
            <button
              v-if="editingId"
              type="button"
              @click="resetForm"
              class="secondary-btn"
              style="
                padding: 0.5rem 1rem;
                border: 1px solid #ccc;
                border-radius: 4px;
                background: #fff;
                cursor: pointer;
              "
            >
              Batal
            </button>
            <button
              type="submit"
              class="primary-btn"
              :disabled="!form.unit?.trim()"
              style="
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 4px;
                background: #4f46e5;
                color: #fff;
                cursor: pointer;
              "
            >
              {{ editingId ? "Simpan Perubahan" : "Buat Target" }}
            </button>
          </div>
        </form>
      </section>

      <!-- Right Column: List & Expansion -->
      <section class="list-section" style="flex: 2; min-width: 450px">
        <div
          class="card"
          style="
            margin-bottom: 1rem;
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <h2 style="margin: 0">Daftar BSC Tahunan 2026</h2>
          <div>
            <label
              for="filter-perspective"
              style="margin-right: 0.5rem; font-weight: 600"
              >Filter Perspektif:</label
            >
            <select
              id="filter-perspective"
              v-model="filterPerspective"
              @change="fetchAnnualKrs"
              style="
                padding: 0.4rem;
                border: 1px solid #ccc;
                border-radius: 4px;
              "
            >
              <option value="">Semua Perspektif</option>
              <option value="FINANCIAL">Financial</option>
              <option value="CUSTOMER">Customer</option>
              <option value="INTERNAL_PROCESS">Internal Process</option>
              <option value="LEARNING_GROWTH">Learning & Growth</option>
            </select>
          </div>
        </div>

        <div v-if="loading" style="text-align: center; padding: 2rem">
          Loading...
        </div>
        <div
          v-else-if="annualKrs.length === 0"
          style="text-align: center; padding: 2rem; color: #666"
          class="card"
        >
          Belum ada BSC Tahunan untuk kriteria ini.
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 1rem">
          <div
            v-for="item in annualKrs"
            :key="item.id"
            class="card"
            style="padding: 1.25rem"
          >
            <div
              style="
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 0.75rem;
              "
            >
              <div>
                <span
                  :class="'badge-' + item.bscPerspective.toLowerCase()"
                  style="
                    font-size: 0.75rem;
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                    font-weight: bold;
                    margin-right: 0.5rem;
                    background: #e0e7ff;
                    color: #4338ca;
                  "
                >
                  {{ item.bscPerspective.replace("_", " ") }}
                </span>
                <h3 style="margin: 0.5rem 0 0.25rem 0; font-size: 1.1rem">
                  {{ item.title }}
                </h3>
                <p style="margin: 0; font-size: 0.85rem; color: #666">
                  Objective: {{ item.objective?.title || "-" }} (Tahun:
                  {{ item.objective?.year }})
                </p>
                <p
                  v-if="item.description"
                  style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #444"
                >
                  {{ item.description }}
                </p>
              </div>
              <div style="display: flex; gap: 8px">
                <button
                  @click="editAnnualKr(item)"
                  style="
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    color: #4f46e5;
                    font-size: 0.9rem;
                  "
                >
                  Edit
                </button>
                <button
                  @click="deleteAnnualKr(item.id)"
                  style="
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    color: #dc2626;
                    font-size: 0.9rem;
                  "
                >
                  Hapus
                </button>
              </div>
            </div>

            <!-- Progress Bar -->
            <div style="margin-bottom: 1rem">
              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  font-size: 0.85rem;
                  margin-bottom: 0.25rem;
                  font-weight: 600;
                "
              >
                <span>Progress: {{ calculateProgress(item) }}%</span>
                <span
                  >{{ item.currentValue }} / {{ item.targetValue }}
                  {{ item.unit }}</span
                >
              </div>
              <div
                style="
                  background: #e5e7eb;
                  height: 10px;
                  border-radius: 9999px;
                  overflow: hidden;
                "
              >
                <div
                  :style="
                    'width: ' +
                    calculateProgress(item) +
                    '%; background: #4f46e5; height: 100%; transition: width 0.3s;'
                  "
                ></div>
              </div>
            </div>

            <!-- Expandable Monthly KRs -->
            <details
              style="border-top: 1px solid #f3f4f6; padding-top: 0.75rem"
            >
              <summary
                style="
                  cursor: pointer;
                  font-size: 0.85rem;
                  color: #4f46e5;
                  font-weight: 600;
                  outline: none;
                  margin-bottom: 0.5rem;
                "
              >
                Tampilkan KRs Bulanan Anak ({{ item.keyResults.length }})
              </summary>
              <div
                style="
                  display: flex;
                  flex-direction: column;
                  gap: 0.5rem;
                  margin-top: 0.5rem;
                  font-size: 0.85rem;
                "
              >
                <div
                  v-if="item.keyResults.length === 0"
                  style="color: #666; font-style: italic"
                >
                  Belum ada KR bulanan terhubung.
                </div>
                <div
                  v-for="mkr in item.keyResults"
                  :key="mkr.id"
                  style="
                    display: flex;
                    justify-content: space-between;
                    background: #f9fafb;
                    padding: 0.5rem;
                    border-radius: 4px;
                    border-left: 3px solid #6366f1;
                  "
                >
                  <div>
                    <strong>{{ mkr.title }}</strong>
                    <div style="font-size: 0.75rem; color: #666">
                      Bulan/Sprint: {{ mkr.month }} (Bobot Bulanan:
                      {{ mkr.monthWeight }})
                    </div>
                  </div>
                  <div style="text-align: right">
                    <div>
                      {{ mkr.currentValue }} / {{ mkr.targetValue }}
                      {{ mkr.unit }}
                    </div>
                    <span
                      style="
                        font-size: 0.75rem;
                        font-weight: bold;
                        color: #059669;
                      "
                      v-if="mkr.status === 'ON_TRACK'"
                      >ON TRACK</span
                    >
                    <span
                      style="
                        font-size: 0.75rem;
                        font-weight: bold;
                        color: #d97706;
                      "
                      v-else-if="mkr.status === 'AT_RISK'"
                      >AT RISK</span
                    >
                    <span
                      style="
                        font-size: 0.75rem;
                        font-weight: bold;
                        color: #dc2626;
                      "
                      v-else
                      >OFF TRACK</span
                    >
                  </div>
                </div>

                <!-- Link Monthly KR Form -->
                <div
                  style="
                    margin-top: 0.75rem;
                    background: #f3f4f6;
                    padding: 0.75rem;
                    border-radius: 6px;
                  "
                >
                  <h4 style="margin: 0 0 0.5rem 0; font-size: 0.85rem">
                    Hubungkan KR Bulanan Existing
                  </h4>
                  <form
                    @submit.prevent="linkMonthlyKr(item.id)"
                    style="
                      display: flex;
                      gap: 0.5rem;
                      align-items: center;
                      flex-wrap: wrap;
                    "
                  >
                    <select
                      v-model="linkForm.krId"
                      required
                      style="
                        flex: 2;
                        padding: 0.35rem;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        font-size: 0.8rem;
                        min-width: 150px;
                      "
                    >
                      <option value="" disabled>Pilih KR Bulanan</option>
                      <option
                        v-for="dropdownKr in availableKrsForLinking"
                        :key="dropdownKr.id"
                        :value="dropdownKr.id"
                      >
                        [{{ dropdownKr.month || "-" }}] {{ dropdownKr.title }}
                      </option>
                    </select>
                    <input
                      v-model.number="linkForm.monthWeight"
                      type="number"
                      step="any"
                      min="0.1"
                      placeholder="Bobot"
                      required
                      style="
                        width: 70px;
                        padding: 0.35rem;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        font-size: 0.8rem;
                      "
                    />
                    <button
                      type="submit"
                      style="
                        padding: 0.35rem 0.75rem;
                        border: none;
                        border-radius: 4px;
                        background: #10b981;
                        color: #fff;
                        font-size: 0.8rem;
                        cursor: pointer;
                        font-weight: bold;
                      "
                    >
                      Link
                    </button>
                  </form>
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../../stores/auth";

const auth = useAuthStore();
const config = useRuntimeConfig();

const objectives = ref([]);
const annualKrs = ref([]);
const availableKrsForLinking = ref([]);
const loading = ref(false);
const filterPerspective = ref("");
const editingId = ref(null);

const form = ref({
  objectiveId: "",
  title: "",
  description: "",
  targetValue: 100,
  unit: "%",
  bscPerspective: "",
  year: "2026",
});

const linkForm = ref({
  krId: "",
  monthWeight: 1.0,
});

async function fetchObjectives() {
  try {
    const data = await $fetch(`${config.public.apiBase}/objectives`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    objectives.value = data;
  } catch (err) {
    console.error("Error fetching objectives:", err);
  }
}

async function fetchAnnualKrs() {
  loading.value = true;
  try {
    let url = `${config.public.apiBase}/annual-key-results?year=2026`;
    if (filterPerspective.value) {
      url += `&bscPerspective=${filterPerspective.value}`;
    }
    const data = await $fetch(url, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    annualKrs.value = data;
  } catch (err) {
    console.error("Error fetching annual key results:", err);
  } finally {
    loading.value = false;
  }
}

// Fetch KRs that are not yet linked to any AnnualKeyResult, or can be linked
async function fetchAvailableKrs() {
  try {
    const data = await $fetch(`${config.public.apiBase}/key-results`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    // Filter out keyresults that have no month or already have annualKeyResultId (optional, depending if we let them change linkage)
    availableKrsForLinking.value = data.filter((kr) => kr.month);
  } catch (err) {
    console.error("Error fetching monthly key results:", err);
  }
}

function calculateProgress(item) {
  if (!item.targetValue) return 0;
  const progress = (item.currentValue / item.targetValue) * 100;
  return Math.min(100, Math.max(0, Math.round(progress * 10) / 10));
}

function resetForm() {
  form.value = {
    objectiveId: "",
    title: "",
    description: "",
    targetValue: 100,
    unit: "%",
    bscPerspective: "",
    year: "2026",
  };
  editingId.value = null;
}

async function submitAnnualKr() {
  if (!form.value.unit || !form.value.unit.trim()) {
    alert("Satuan (Unit) wajib diisi!");
    return;
  }
  try {
    const payload = { ...form.value };
    if (editingId.value) {
      await $fetch(
        `${config.public.apiBase}/annual-key-results/${editingId.value}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
          body: payload,
        },
      );
      alert("BSC Tahunan berhasil diperbarui!");
    } else {
      await $fetch(`${config.public.apiBase}/annual-key-results`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: payload,
      });
      alert("BSC Tahunan berhasil ditambahkan!");
    }
    resetForm();
    await fetchAnnualKrs();
  } catch (err) {
    console.error("Error submitting annual Key Result:", err);
    alert(err.data?.message || "Gagal menyimpan BSC Tahunan.");
  }
}

function editAnnualKr(item) {
  editingId.value = item.id;
  form.value = {
    objectiveId: item.objectiveId,
    title: item.title,
    description: item.description || "",
    targetValue: item.targetValue,
    unit: item.unit,
    bscPerspective: item.bscPerspective,
    year: item.year,
  };
}

async function deleteAnnualKr(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus BSC Tahunan ini?")) return;
  try {
    await $fetch(`${config.public.apiBase}/annual-key-results/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    alert("BSC Tahunan berhasil dihapus!");
    await fetchAnnualKrs();
  } catch (err) {
    console.error("Error deleting annual key result:", err);
    alert(err.data?.message || "Gagal menghapus BSC Tahunan.");
  }
}

async function linkMonthlyKr(annualId) {
  try {
    await $fetch(
      `${config.public.apiBase}/annual-key-results/${annualId}/link-kr/${linkForm.value.krId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: { monthWeight: linkForm.value.monthWeight },
      },
    );
    alert("KR Bulanan berhasil dihubungkan!");
    linkForm.value.krId = "";
    linkForm.value.monthWeight = 1.0;
    await fetchAnnualKrs();
    await fetchAvailableKrs();
  } catch (err) {
    console.error("Error linking monthly KR:", err);
    alert(err.data?.message || "Gagal menghubungkan KR Bulanan.");
  }
}

onMounted(async () => {
  await fetchObjectives();
  await fetchAnnualKrs();
  await fetchAvailableKrs();
});
</script>

<style scoped>
.admin-root {
  padding: 1.5rem;
  background: var(--bg-page, #f8fafc);
  font-family: inherit;
  color: #374151;
}
.card {
  background: #ffffff;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  padding: 1.25rem;
}
.okr-form .form-group {
  display: flex;
  flex-direction: column;
}
.badge-financial {
  background: #e0f2fe !important;
  color: #0369a1 !important;
}
.badge-customer {
  background: #dcfce7 !important;
  color: #15803d !important;
}
.badge-internal_process {
  background: #fef9c3 !important;
  color: #a16207 !important;
}
.badge-learning_growth {
  background: #f3e8ff !important;
  color: #7e22ce !important;
}
</style>

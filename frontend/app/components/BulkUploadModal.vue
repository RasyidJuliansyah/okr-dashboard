<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-card card bulk-modal">
      <div class="modal-header">
        <div class="modal-title-wrap">
          <div class="modal-badge-type">
            {{
              isObjective
                ? "Objective"
                : isKr
                  ? "Key Results (KR)"
                  : "Inisiatif Tim"
            }}
          </div>
          <h3>
            Bulk Upload
            {{
              isObjective
                ? "Objective"
                : isKr
                  ? "Key Results & RACI"
                  : "Inisiatif"
            }}
            (CSV)
          </h3>
        </div>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <!-- Steps Indicator -->
      <div class="steps-nav">
        <div
          class="step-indicator"
          :class="{ active: currentStep === 1, done: currentStep > 1 }"
        >
          <span class="step-num">1</span>
          <span class="step-text">Upload File</span>
        </div>
        <div class="step-divider"></div>
        <div
          class="step-indicator"
          :class="{ active: currentStep === 2, done: currentStep > 2 }"
        >
          <span class="step-num">2</span>
          <span class="step-text">Preview &amp; Validasi</span>
        </div>
        <div class="step-divider"></div>
        <div class="step-indicator" :class="{ active: currentStep === 3 }">
          <span class="step-num">3</span>
          <span class="step-text">Hasil Import</span>
        </div>
      </div>

      <!-- Alert if any -->
      <div
        v-if="localError"
        class="alert alert-error"
        style="margin-bottom: 1rem"
      >
        {{ localError }}
      </div>

      <!-- STEP 1: Upload & Template -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="info-box">
          <div class="info-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg></div>
          <div class="info-text">
            <template v-if="isObjective">
              <p><strong>Format Kolom CSV untuk Objective:</strong></p>
              <code>title, description, year, ownerName</code>
              <p class="text-sub">
                * Kolom <strong>title</strong> dan
                <strong>year</strong> (contoh: Q3-2026) wajib diisi. * Kolom
                <strong>ownerName</strong> diisi nama atau email owner/PIC
                terdaftar (opsional).
              </p>
            </template>
            <template v-if="isKr">
              <p><strong>Format Kolom CSV untuk Key Result:</strong></p>
              <code
                >objectiveId, title, targetValue, unit, bscPerspective, R, A, C,
                I, departments</code
              >
              <p class="text-sub">
                * Kolom <strong>objectiveId</strong> bisa diisi ID atau Judul
                Objective. * Kolom <strong>R, A, C, I</strong> diisi nama
                pegawai terdaftar (pisahkan koma untuk multi-nama).
              </p>
            </template>
            <template v-else-if="!isObjective && !isKr">
              <p><strong>Format Kolom CSV untuk Inisiatif:</strong></p>
              <code
                >keyResultId, teamName, ownerName, title, description,
                targetValue, unit, kanbanStatus</code
              >
              <p class="text-sub">
                * <strong>kanbanStatus</strong>: <code>TODO</code>,
                <code>IN_PROGRESS</code>, atau <code>DONE</code> (default:
                TODO). Nama Owner dan Tim akan dicocokkan otomatis.
              </p>
            </template>
          </div>
        </div>

        <!-- Target Objective Selector for KR -->
        <div
          v-if="isKr && availableObjectives.length > 0"
          class="form-group"
          style="margin-bottom: 1.25rem"
        >
          <label
            style="
              font-size: 0.85rem;
              font-weight: 600;
              color: #334155;
              margin-bottom: 4px;
              display: block;
            "
          >
            Target Objective Default (Otomatis digunakan jika baris CSV tidak
            mencantumkan objectiveId):
          </label>
          <select
            v-model="targetObjectiveId"
            class="form-input"
            style="
              width: 100%;
              padding: 8px 12px;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
            "
          >
            <option value="">
              -- Gunakan Objective dari CSV / Objective Pertama --
            </option>
            <option
              v-for="obj in availableObjectives"
              :key="obj.id"
              :value="obj.id"
            >
              {{ obj.title }}
            </option>
          </select>
        </div>

        <div class="action-row-template">
          <button
            type="button"
            class="secondary-btn template-btn"
            @click="downloadTemplate"
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Template CSV
            {{ isObjective ? "Objective" : isKr ? "KR" : "Inisiatif" }}
          </button>
        </div>

        <div
          class="upload-dropzone"
          :class="{ 'is-dragging': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <input
            id="bulk-csv-input"
            type="file"
            accept=".csv"
            class="file-input-hidden"
            @change="handleFileInput"
          />
          <label for="bulk-csv-input" class="upload-dropzone-label">
            <div class="upload-icon-svg">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0E97D6"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <polyline points="9 15 12 12 15 15" />
              </svg>
            </div>
            <div class="upload-text-main">
              Pilih file CSV atau seret ke sini
            </div>
            <div class="upload-text-hint">Ukuran file maksimal 5MB (.csv)</div>
          </label>
        </div>
      </div>

      <!-- STEP 2: Preview -->
      <div v-if="currentStep === 2" class="step-content">
        <div class="preview-header-bar">
          <div class="preview-count">
            <strong
              >Preview Data: {{ parsedRows.length }} baris terdeteksi</strong
            >
          </div>
          <div class="preview-badges">
            <span class="count-pill valid">{{ validCount }} Valid</span>
            <span v-if="warningCount > 0" class="count-pill warning"
              >{{ warningCount }} Perlu Cek</span
            >
            <span v-if="errorCount > 0" class="count-pill error"
              >{{ errorCount }} Error</span
            >
          </div>
        </div>

        <div class="preview-table-container">
          <table class="preview-table">
            <thead>
              <tr v-if="isObjective">
                <th>#</th>
                <th>Status</th>
                <th>Judul Objective</th>
                <th>Deskripsi</th>
                <th>Year</th>
                <th>Owner PIC</th>
                <th>Catatan / Masalah</th>
              </tr>
              <tr v-else-if="isKr">
                <th>#</th>
                <th>Status</th>
                <th>Judul KR</th>
                <th>Target</th>
                <th>Perspective</th>
                <th>R (Responsible)</th>
                <th>A (Accountable)</th>
                <th>C / I</th>
                <th>Catatan / Masalah</th>
              </tr>
              <tr v-else>
                <th>#</th>
                <th>Status</th>
                <th>Judul Inisiatif</th>
                <th>Tim</th>
                <th>Owner PIC</th>
                <th>Target</th>
                <th>Kolom Kanban</th>
                <th>Catatan / Masalah</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in parsedRows"
                :key="row._rowNum"
                :class="{
                  'row-has-error': row._status === 'ERROR',
                  'row-has-warning': row._status === 'WARNING',
                }"
              >
                <td class="col-num">{{ row._rowNum }}</td>
                <td>
                  <span
                    v-if="row._status === 'VALID'"
                    class="badge-status valid"
                    >VALID</span
                  >
                  <span
                    v-else-if="row._status === 'WARNING'"
                    class="badge-status warning"
                    >WARNING</span
                  >
                  <span v-else class="badge-status error">ERROR</span>
                </td>

                <!-- Objective Columns -->
                <template v-if="isObjective">
                  <td class="col-title" :title="row.title">
                    {{ row.title || "-" }}
                  </td>
                  <td>{{ row.description || "-" }}</td>
                  <td>
                    <span class="year-chip">{{ row.year || "-" }}</span>
                  </td>
                  <td>{{ row.ownerName || "-" }}</td>
                </template>

                <!-- KR Columns -->
                <template v-else-if="isKr">
                  <td class="col-title" :title="row.title">
                    {{ row.title || "-" }}
                  </td>
                  <td class="col-target">
                    {{ row.targetValue }} {{ row.unit }}
                  </td>
                  <td>
                    <span class="perspective-chip">{{
                      row.bscPerspective || "FINANCIAL"
                    }}</span>
                  </td>
                  <td>
                    <span class="raci-chip r">{{ row.R || "-" }}</span>
                  </td>
                  <td>
                    <span class="raci-chip a">{{ row.A || "-" }}</span>
                  </td>
                  <td>
                    <span v-if="row.C" class="raci-chip c">C: {{ row.C }}</span>
                    <span v-if="row.I" class="raci-chip i">I: {{ row.I }}</span>
                    <span v-if="!row.C && !row.I" class="text-muted">-</span>
                  </td>
                </template>

                <!-- Initiative Columns -->
                <template v-else>
                  <td class="col-title" :title="row.title">
                    {{ row.title || "-" }}
                  </td>
                  <td>
                    <span class="team-chip">{{
                      row.teamName || row.teamId || "-"
                    }}</span>
                  </td>
                  <td>{{ row.ownerName || row.ownerId || "-" }}</td>
                  <td class="col-target">
                    {{ row.targetValue || "0" }} {{ row.unit || "" }}
                  </td>
                  <td>
                    <span
                      class="kanban-chip"
                      :class="(row.kanbanStatus || 'TODO').toLowerCase()"
                      >{{ row.kanbanStatus || "TODO" }}</span
                    >
                  </td>
                </template>

                <td class="col-issue">
                  <span v-if="row._issues?.length" class="issue-text">{{
                    row._issues.join(", ")
                  }}</span>
                  <span v-else class="text-muted">Siap diimport</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-footer">
          <button type="button" class="secondary-btn" @click="currentStep = 1">
            &larr; Upload File Lain
          </button>
          <button
            type="button"
            class="primary-btn"
            :disabled="isSubmitting || (validCount === 0 && warningCount === 0)"
            @click="submitBulkUpload"
          >
            {{
              isSubmitting
                ? "Mengimport Data..."
                : `Konfirmasi Import (${validCount + warningCount} Data)`
            }}
          </button>
        </div>
      </div>

      <!-- STEP 3: Results -->
      <div v-if="currentStep === 3" class="step-content result-content">
        <div class="result-icon-celebrate"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></div>
        <h4>Proses Bulk Upload Selesai!</h4>
        <p class="text-muted" style="margin-bottom: 1.5rem">
          Ringkasan hasil penyimpanan data ke sistem:
        </p>

        <div class="result-stats-grid">
          <div class="stat-box success">
            <div class="stat-val">{{ uploadResult?.success || 0 }}</div>
            <div class="stat-lbl">Berhasil Disimpan</div>
          </div>
          <div class="stat-box warning">
            <div class="stat-val">{{ uploadResult?.warned || 0 }}</div>
            <div class="stat-lbl">Ada Peringatan (RACI/Owner)</div>
          </div>
          <div class="stat-box error">
            <div class="stat-val">{{ uploadResult?.errors?.length || 0 }}</div>
            <div class="stat-lbl">Gagal / Dilewati</div>
          </div>
        </div>

        <!-- Detail Error List -->
        <div
          v-if="uploadResult?.errors?.length"
          class="result-errors-accordion"
        >
          <h5>Detail Catatan / Error:</h5>
          <div class="error-items-list">
            <div
              v-for="(err, idx) in uploadResult.errors"
              :key="idx"
              class="error-item-card"
            >
              <span class="err-row-badge">Baris {{ err.row }}</span>
              <strong class="err-item-title">{{ err.item }}:</strong>
              <span class="err-reason">{{ err.reason }}</span>
            </div>
          </div>
        </div>

        <div
          class="modal-footer"
          style="justify-content: center; margin-top: 1.5rem"
        >
          <button type="button" class="primary-btn" @click="finishImport">
            Selesai &amp; Perbarui Tampilan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "~/stores/auth";

const props = withDefaults(
  defineProps<{
    type: "objective" | "kr" | "initiative";
    defaultObjectiveId?: string;
    defaultKeyResultId?: string;
  }>(),
  {
    type: "kr",
    defaultObjectiveId: "",
    defaultKeyResultId: "",
  },
);

const emit = defineEmits<{
  (e: "close"): void;
  (e: "done"): void;
}>();

const auth = useAuthStore();
const config = useRuntimeConfig();
const API = config.public.apiBase;

const isObjective = computed(() => props.type === "objective");
const isKr = computed(() => props.type === "kr");
const isInitiative = computed(() => props.type === "initiative");

const currentStep = ref<1 | 2 | 3>(1);
const isDragging = ref(false);
const isSubmitting = ref(false);
const localError = ref("");
const parsedRows = ref<any[]>([]);
const uploadResult = ref<any>(null);

const availableObjectives = ref<any[]>([]);
const targetObjectiveId = ref(props.defaultObjectiveId || "");

onMounted(async () => {
  if (isKr.value) {
    try {
      const res = await fetch(`${API}/objectives`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token || (typeof window !== "undefined" ? localStorage.getItem("auth_token") : "")}`,
        },
      });
      if (res.ok) {
        availableObjectives.value = await res.json();
        if (!targetObjectiveId.value && availableObjectives.value.length > 0) {
          targetObjectiveId.value = availableObjectives.value[0].id;
        }
      }
    } catch (e) {}
  }
});

const validCount = computed(
  () => parsedRows.value.filter((r) => r._status === "VALID").length,
);
const warningCount = computed(
  () => parsedRows.value.filter((r) => r._status === "WARNING").length,
);
const errorCount = computed(
  () => parsedRows.value.filter((r) => r._status === "ERROR").length,
);

// ─── Download Template ───
function downloadTemplate() {
  let headers = "";
  let sampleContent = "";
  let fileName = "";

  if (isObjective.value) {
    fileName = "template_bulk_objective.csv";
    headers = "title,description,year,ownerName";
    sampleContent = [
      headers,
      `"Meningkatkan Penjualan B2B","Fokus pada segmen korporasi baru","Q3-2026","Budi Santoso"`,
      `"Meningkatkan Kepuasan Pelanggan","Mengurangi response time support ticket","Q3-2026","Sarah Smith"`,
      `"Peningkatan Infrastruktur TechOps","Migrasi server database utama","Q3-2026","John Doe"`,
    ].join("\n");
  } else if (isKr.value) {
    fileName = "template_bulk_kr.csv";
    headers =
      "objectiveId,title,targetValue,unit,bscPerspective,R,A,C,I,departments";
    const sampleObjId =
      targetObjectiveId.value || availableObjectives.value[0]?.title || "obj-1";
    sampleContent = [
      headers,
      `"${sampleObjId}","Meningkatkan Revenue Q3 2026",2.5,"M USD",FINANCIAL,"Budi Santoso","Sarah Smith","John Doe","Jane Doe","FINANCE,BUSINESS"`,
      `"${sampleObjId}","Menurunkan Customer Churn Rate",2.0,"%","CUSTOMER","Sarah Smith","John Doe","","","PRODUCT_SERVICE"`,
      `"${sampleObjId}","Meningkatkan Uptime Server",99.9,"%","INTERNAL_PROCESS","John Doe","Bob Johnson","","","TECHOPS"`,
    ].join("\n");
  } else {
    fileName = "template_bulk_inisiatif.csv";
    headers =
      "keyResultId,teamName,ownerName,title,description,targetValue,unit,kanbanStatus";
    sampleContent = [
      headers,
      'kr-1,"Engineering","John Doe","Optimalisasi Query Database","Refactor index database utama",10,"Tabel",TODO',
      'kr-1,"Product & Design","Sarah Smith","Redesign Checkout Flow","Pembaruan UX pembayaran",5,"Layar",IN_PROGRESS',
      'kr-2,"Growth & Marketing","Jane Doe","Kampanye Retensi Email","Automated onboarding drip",1000,"Email",DONE',
    ].join("\n");
  }

  const blob = new Blob([sampleContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─── CSV File Handling ───
function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    readFile(target.files[0]);
  }
}

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
    readFile(e.dataTransfer.files[0]);
  }
}

function readFile(file: File) {
  localError.value = "";
  if (!file.name.toLowerCase().endsWith(".csv")) {
    localError.value = "File harus berformat .csv";
    return;
  }

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const text = evt.target?.result as string;
      parseCSVText(text);
    } catch (err: any) {
      localError.value = "Gagal membaca CSV: " + err.message;
    }
  };
  reader.readAsText(file);
}

// ─── Robust CSV Parser supporting quotes ───
function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSVText(rawText: string) {
  const lines = rawText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    localError.value = "File CSV kosong atau hanya berisi baris header.";
    return;
  }

  const headerRow = parseCSVLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/[\s_-]+/g, ""),
  );
  const parsed: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: any = { _rowNum: i + 1, _issues: [] as string[] };

    headerRow.forEach((header, colIdx) => {
      const val = values[colIdx] || "";
      row[header] = val;
      // Also map standard headers
      if (header.includes("objective")) row.objectiveId = val;
      if (header.includes("keyresult") || header === "krid")
        row.keyResultId = val;
      if (header === "title" || header === "judul" || header === "nama")
        row.title = val;
      if (header.includes("target")) row.targetValue = val;
      if (header === "unit" || header === "satuan") row.unit = val;
      if (header.includes("perspective") || header.includes("bsc"))
        row.bscPerspective = val;
      if (header.includes("team") || header.includes("tim")) row.teamName = val;
      if (header.includes("owner") || header.includes("pic"))
        row.ownerName = val;
      if (header.includes("kanban") || header.includes("status"))
        row.kanbanStatus = val;
      if (header === "r") row.R = val;
      if (header === "a") row.A = val;
      if (header === "c") row.C = val;
      if (header === "i") row.I = val;
      if (header.includes("dept") || header.includes("department"))
        row.departments = val;
      if (header.includes("desc") || header.includes("deskripsi"))
        row.description = val;
    });

    // Fallbacks from props or selected targetObjectiveId
    if (isKr.value && !row.objectiveId) {
      row.objectiveId = targetObjectiveId.value || props.defaultObjectiveId;
    }
    if (!isKr.value && !row.keyResultId && props.defaultKeyResultId) {
      row.keyResultId = props.defaultKeyResultId;
    }

    // Validation logic
    let hasError = false;
    let hasWarning = false;

    if (!row.title) {
      row._issues.push("Judul kosong");
      hasError = true;
    }

    if (isObjective.value) {
      if (!row.title) {
        row._issues.push("Judul objective kosong");
        hasError = true;
      }
      if (!row.year) {
        row._issues.push("Year kosong");
        hasError = true;
      }
    } else if (isKr.value) {
      if (row.targetValue === undefined || row.targetValue === "") {
        row._issues.push("Target value kosong");
        hasError = true;
      } else if (
        isNaN(parseFloat(row.targetValue)) ||
        parseFloat(row.targetValue) <= 0
      ) {
        row._issues.push("Target harus angka > 0");
        hasError = true;
      }
      if (!row.R) {
        row._issues.push("Belum ada Responsible (R)");
        hasWarning = true;
      }
      if (!row.A) {
        row._issues.push("Belum ada Accountable (A)");
        hasWarning = true;
      }
    } else {
      if (!row.teamName && !row.teamId) {
        row._issues.push("Tim belum diisi");
        hasWarning = true;
      }
      if (!row.ownerName && !row.ownerId) {
        row._issues.push("Owner belum diisi");
        hasWarning = true;
      }
    }

    if (hasError) {
      row._status = "ERROR";
    } else if (hasWarning) {
      row._status = "WARNING";
    } else {
      row._status = "VALID";
    }

    parsed.push(row);
  }

  if (parsed.length === 0) {
    localError.value = "Tidak ada baris data yang berhasil diparsing.";
    return;
  }

  parsedRows.value = parsed;
  currentStep.value = 2;
}

// ─── Submit Bulk Upload to Backend ───
async function submitBulkUpload() {
  localError.value = "";
  isSubmitting.value = true;

  try {
    const validRows = parsedRows.value.filter((r) => r._status !== "ERROR");
    if (validRows.length === 0) {
      localError.value = "Tidak ada baris yang valid untuk diimport.";
      isSubmitting.value = false;
      return;
    }

    // Ensure fallback objectiveId
    if (isKr.value) {
      validRows.forEach((r) => {
        if (!r.objectiveId)
          r.objectiveId = targetObjectiveId.value || props.defaultObjectiveId;
      });
    }

    let endpoint = "";
    let payload = {};
    if (isObjective.value) {
      endpoint = `${API}/bulk-upload/objectives`;
      payload = { objectives: validRows };
    } else if (isKr.value) {
      endpoint = `${API}/bulk-upload/krs`;
      payload = { keyResults: validRows };
    } else {
      endpoint = `${API}/bulk-upload/initiatives`;
      payload = { initiatives: validRows };
    }
    const token =
      auth.token ||
      (typeof window !== "undefined" ? localStorage.getItem("auth_token") : "");

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Gagal melakukan bulk upload");
    }

    const resultData = await res.json();
    uploadResult.value = resultData;
    currentStep.value = 3;
  } catch (err: any) {
    localError.value = err.message || "Terjadi kesalahan saat upload";
  } finally {
    isSubmitting.value = false;
  }
}

function finishImport() {
  emit("done");
  emit("close");
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  backdrop-filter: blur(4px);
  padding: 1rem;
}

.bulk-modal {
  max-width: 900px;
  width: 95%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-card, #ffffff);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  position: relative;
  z-index: 100000;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-badge-type {
  font-size: 0.75rem;
  font-weight: 700;
  background: #0e97d6;
  color: #ffffff;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
}

/* Steps */
.steps-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 1rem 1.5rem;
  background: var(--bg-input, #f8fafc);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted, #94a3b8);
  font-size: 0.85rem;
  font-weight: 500;
}

.step-indicator.active {
  color: #0e97d6;
  font-weight: 600;
}

.step-indicator.done {
  color: #10b981;
}

.step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--border-color, #e2e8f0);
  font-size: 0.8rem;
}

.step-indicator.active .step-num {
  background: #0e97d6;
  color: #ffffff;
}

.step-indicator.done .step-num {
  background: #10b981;
  color: #ffffff;
}

.step-divider {
  width: 30px;
  height: 2px;
  background: var(--border-color, #e2e8f0);
}

.step-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

/* Info Box */
.info-box {
  display: flex;
  gap: 12px;
  background: rgba(14, 151, 214, 0.08);
  border: 1px solid rgba(14, 151, 214, 0.2);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 1.25rem;
}

.info-icon {
  color: #0e97d6;
  flex-shrink: 0;
}

.info-text p {
  margin: 0 0 4px 0;
  font-size: 0.88rem;
  color: var(--text-primary, #0f172a);
}

.info-text code {
  display: block;
  background: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: monospace;
  margin: 6px 0;
  color: #0b7bb0;
}

.info-text .text-sub {
  font-size: 0.8rem;
  color: var(--text-secondary, #475569);
}

.action-row-template {
  margin-bottom: 1.25rem;
  display: flex;
  justify-content: flex-end;
}

.template-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  padding: 8px 14px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #0e97d6;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-btn:hover {
  background: rgba(14, 151, 214, 0.05);
  border-color: #0e97d6;
}

/* Dropzone */
.upload-dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 2.5rem 1.5rem;
  text-align: center;
  background: var(--bg-input, #f8fafc);
  transition: all 0.2s ease;
  cursor: pointer;
}

.upload-dropzone:hover,
.upload-dropzone.is-dragging {
  border-color: #0e97d6;
  background: rgba(14, 151, 214, 0.04);
}

.file-input-hidden {
  display: none;
}

.upload-dropzone-label {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-text-main {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
}

.upload-text-hint {
  font-size: 0.82rem;
  color: var(--text-muted, #94a3b8);
}

/* Preview Bar */
.preview-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.preview-badges {
  display: flex;
  gap: 8px;
}

.count-pill {
  font-size: 0.78rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
}

.count-pill.valid {
  background: #d1fae5;
  color: #065f46;
}
.count-pill.warning {
  background: #fef3c7;
  color: #92400e;
}
.count-pill.error {
  background: #fee2e2;
  color: #991b1b;
}

.preview-table-container {
  max-height: 380px;
  overflow-y: auto;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.preview-table th {
  position: sticky;
  top: 0;
  background: var(--bg-input, #f1f5f9);
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  z-index: 1;
}

.preview-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.preview-table tr:hover {
  background: rgba(14, 151, 214, 0.03);
}

.row-has-error {
  background: rgba(239, 68, 68, 0.04);
}

.row-has-warning {
  background: rgba(245, 158, 11, 0.04);
}

.col-num {
  font-weight: 600;
  color: var(--text-muted, #94a3b8);
  width: 35px;
}

.col-title {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.col-target {
  font-weight: 600;
  white-space: nowrap;
}

.col-issue {
  font-size: 0.78rem;
  max-width: 180px;
}

.badge-status {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.badge-status.valid {
  background: #d1fae5;
  color: #065f46;
}
.badge-status.warning {
  background: #fef3c7;
  color: #92400e;
}
.badge-status.error {
  background: #fee2e2;
  color: #991b1b;
}

.perspective-chip {
  font-size: 0.72rem;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  color: #475569;
}

.raci-chip {
  font-size: 0.72rem;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  margin-right: 4px;
}

.raci-chip.r {
  background: #e0f2fe;
  color: #0369a1;
  font-weight: 600;
}
.raci-chip.a {
  background: #fef3c7;
  color: #b45309;
}
.raci-chip.c {
  background: #f3e8ff;
  color: #7e22ce;
}
.raci-chip.i {
  background: #f1f5f9;
  color: #475569;
}

.team-chip {
  font-size: 0.75rem;
  background: #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.kanban-chip {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.kanban-chip.todo {
  background: #e2e8f0;
  color: #334155;
}
.kanban-chip.in_progress {
  background: #dbeafe;
  color: #1d4ed8;
}
.kanban-chip.done {
  background: #d1fae5;
  color: #047857;
}

/* Results */
.result-content {
  text-align: center;
  padding: 2rem 1.5rem;
}

.result-icon-celebrate {
  display: flex;
  justify-content: center;
  color: #16a34a;
  margin-bottom: 0.5rem;
}

.result-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 1.5rem;
}

.stat-box {
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid transparent;
}

.stat-box.success {
  background: #d1fae5;
  border-color: #a7f3d0;
  color: #065f46;
}
.stat-box.warning {
  background: #fef3c7;
  border-color: #fde68a;
  color: #92400e;
}
.stat-box.error {
  background: #fee2e2;
  border-color: #fecaca;
  color: #991b1b;
}

.stat-val {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-lbl {
  font-size: 0.8rem;
  font-weight: 500;
}

.result-errors-accordion {
  text-align: left;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
  max-height: 200px;
  overflow-y: auto;
}

.result-errors-accordion h5 {
  margin: 0 0 8px 0;
  font-size: 0.85rem;
  color: #334155;
}

.error-items-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.error-item-card {
  font-size: 0.8rem;
  background: #ffffff;
  padding: 6px 10px;
  border-radius: 6px;
  border-left: 3px solid #f59e0b;
}

.err-row-badge {
  font-weight: 700;
  color: #64748b;
  margin-right: 6px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color, #e2e8f0);
}
</style>

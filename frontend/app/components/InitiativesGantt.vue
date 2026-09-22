<template>
  <div class="gantt-view-wrapper">
    <div v-if="validItems.length === 0" class="gantt-empty">
      Tidak ada inisiatif dengan tanggal mulai dan tenggat waktu untuk ditampilkan.
    </div>
    <template v-else>
      <div v-if="skippedCount > 0" class="gantt-skipped-notice">
        ⚠ {{ skippedCount }} inisiatif tidak ditampilkan karena belum memiliki tanggal mulai / tenggat waktu.
      </div>
      <div class="gantt-toolbar">
        <button
          v-for="mode in viewModes"
          :key="mode"
          :class="['gantt-mode-btn', { active: currentMode === mode }]"
          @click="currentMode = mode"
        >
          {{ modeLabelMap[mode] }}
        </button>
      </div>
      <div ref="ganttContainer" class="gantt-container" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";

const props = defineProps<{
  initiatives: any[];
}>();

const ganttContainer = ref<HTMLElement | null>(null);
let ganttInstance: any = null;

const viewModes = ["Day", "Week", "Month"] as const;
type GanttViewMode = (typeof viewModes)[number];
const currentMode = ref<GanttViewMode>("Month");
const modeLabelMap: Record<string, string> = {
  Day: "Harian",
  Week: "Mingguan",
  Month: "Bulanan",
};

const validItems = computed(() =>
  props.initiatives.filter((ini) => ini.startDate && ini.dueDate)
);

const skippedCount = computed(
  () => props.initiatives.length - validItems.value.length
);

function statusColor(status: string): string {
  const map: Record<string, string> = {
    TODO: "#94a3b8",
    IN_PROGRESS: "#0e97d6",
    DONE: "#10b981",
    DROP: "#ef4444",
    NEED_INFO: "#f59e0b",
    RESOLVED: "#3b82f6",
    CLOSED: "#6b7280",
  };
  return map[status] || "#94a3b8";
}

function getProgressPct(ini: any): number {
  const achieved =
    ini.achievedValue !== null && ini.achievedValue !== undefined
      ? ini.achievedValue
      : ini.currentValue ?? 0;
  const target = ini.targetValue ?? 0;
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((achieved / target) * 100)));
}

function buildTasks() {
  return validItems.value.map((ini) => {
    let start = ini.startDate.substring(0, 10);
    let end = ini.dueDate.substring(0, 10);
    // frappe-gantt requires start <= end
    if (start > end) {
      const tmp = start;
      start = end;
      end = tmp;
    }
    return {
      id: String(ini.id),
      name: ini.title,
      start,
      end,
      progress: getProgressPct(ini),
      custom_class: "bar-" + (ini.kanbanStatus || "TODO").toLowerCase(),
    };
  });
}

async function getGanttClass(): Promise<any> {
  if (typeof window === "undefined") return null;
  if ((window as any).Gantt) return (window as any).Gantt;
  return new Promise((resolve) => {
    const check = () => {
      if ((window as any).Gantt) {
        resolve((window as any).Gantt);
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
}

async function renderGantt() {
  await nextTick();
  if (!ganttContainer.value) return;
  const tasks = buildTasks();
  if (tasks.length === 0) return;

  const Gantt = await getGanttClass();
  if (!Gantt) return;

  if (ganttContainer.value) {
    ganttContainer.value.innerHTML = "";
    ganttInstance = null;
  }

  try {
    ganttInstance = new Gantt(ganttContainer.value, tasks, {
      view_mode: currentMode.value,
      date_format: "YYYY-MM-DD",
      language: "id",
      readonly: true,
    });

    await nextTick();
    validItems.value.forEach((ini) => {
      const barEl = ganttContainer.value?.querySelector(
        `.bar-wrapper[data-id="${ini.id}"] .bar`
      );
      if (barEl) {
        (barEl as HTMLElement).style.fill = statusColor(ini.kanbanStatus);
      }
    });
  } catch (err) {
    console.error("Gantt render error:", err);
  }
}

watch(currentMode, () => {
  if (ganttInstance) {
    ganttInstance.change_view_mode(currentMode.value);
  }
});

watch(
  () => [props.initiatives, validItems.value.length],
  () => renderGantt(),
  { deep: true, immediate: true }
);

onMounted(() => {
  renderGantt();
});

onBeforeUnmount(() => {
  if (ganttContainer.value) {
    ganttContainer.value.innerHTML = "";
  }
  ganttInstance = null;
});
</script>

<style scoped>
.gantt-view-wrapper {
  width: 100%;
}
.gantt-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted, #94a3b8);
  font-size: 0.9rem;
  background: var(--bg-card, #ffffff);
  border: 1px dashed var(--border-color, #e2e8f0);
  border-radius: 12px;
}
.gantt-skipped-notice {
  background: #fffbeb;
  border: 1px solid #fef08a;
  color: #92400e;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  margin-bottom: 12px;
}
.gantt-toolbar {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}
.gantt-mode-btn {
  padding: 6px 14px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 7px;
  background: var(--bg-card, #ffffff);
  color: var(--text-secondary, #64748b);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.gantt-mode-btn:hover {
  background: var(--bg-input, #f1f5f9);
}
.gantt-mode-btn.active {
  background: #0e97d6;
  color: #ffffff;
  border-color: #0e97d6;
}
.gantt-container {
  width: 100%;
  overflow-x: auto;
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  padding: 12px;
}
:deep(.bar-todo .bar-progress) { fill: #94a3b8; }
:deep(.bar-in_progress .bar-progress) { fill: #0e97d6; }
:deep(.bar-done .bar-progress) { fill: #10b981; }
:deep(.bar-drop .bar-progress) { fill: #ef4444; }
:deep(.bar-need_info .bar-progress) { fill: #f59e0b; }
:deep(.bar-resolved .bar-progress) { fill: #3b82f6; }
</style>

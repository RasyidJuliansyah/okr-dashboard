<template>
  <div
    ref="containerRef"
    class="mindmap-viewport"
    :class="[
      viewportMode === 'hand' ? 'mode-hand' : 'mode-zoom',
      { 'is-panning': isPanning, 'is-alt': isAltPressed },
    ]"
    @mousedown="startPan"
    @mousemove="onPan"
    @mouseup="endPan"
    @mouseleave="endPan"
    @wheel.prevent="onWheel"
  >
    <div
      ref="canvasRef"
      class="mindmap-canvas"
      :style="{
        transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        transformOrigin: '0 0',
      }"
    >
      <div v-if="treeData" class="tree-root-container">
        <CascadingMindMapBranch
          :node="treeData"
          :is-root="true"
          :selected-node-id="selectedNodeId"
          :active-pillar-name="activePillarName"
          :collapsed-map="collapsedMap"
          @select-node="handleSelectNode"
          @toggle-node="handleToggleNode"
        />
      </div>

      <div v-else class="empty-state">
        <p>Tidak ada data OKR Cascading ditemukan.</p>
      </div>
    </div>

    <!-- Floating Mode & Zoom Toolbar inside mindmap-viewport -->
    <div class="mindmap-floating-bar" @mousedown.stop @click.stop>
      <div class="mode-toggles">
        <button
          type="button"
          class="mode-btn"
          :class="{ active: viewportMode === 'hand' }"
          title="Mode Hand (H) — Scroll & drag untuk menggeser canvas"
          @click="setViewportMode('hand')"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 11V6a2 2 0 0 0-4 0v5" />
            <path d="M14 10V4a2 2 0 0 0-4 0v7" />
            <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
            <path
              d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"
            />
          </svg>
          <span>Hand</span>
        </button>

        <button
          type="button"
          class="mode-btn"
          :class="{ active: viewportMode === 'zoom' }"
          title="Mode Zoom (Z) — Scroll atau klik untuk zoom"
          @click="setViewportMode('zoom')"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <span>Zoom</span>
        </button>
      </div>

      <div class="floating-divider"></div>

      <div class="zoom-steppers">
        <button
          type="button"
          class="tool-icon-btn"
          title="Zoom Out (-)"
          @click="zoomOut()"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <span class="zoom-display">{{ zoomPercent }}%</span>

        <button
          type="button"
          class="tool-icon-btn"
          title="Zoom In (+)"
          @click="zoomIn()"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <button
          type="button"
          class="tool-icon-btn"
          title="Reset Posisi & Zoom"
          @click="resetZoom()"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onUnmounted,
} from "vue";
import CascadingMindMapBranch, {
  type MindMapNode,
} from "./CascadingMindMapBranch.vue";

const props = withDefaults(
  defineProps<{
    rootData?: { title: string; subtitle: string; year?: string };
    perspectives: any[];
    selectedNodeId?: string | null;
    activePillarName?: string | null;
    zoomLevel?: number;
  }>(),
  {
    rootData: () => ({
      title: "BSC-OKR Suite",
      subtitle: "SKOLLA STRATEGY 2026",
      year: "FY 2026",
    }),
    selectedNodeId: null,
    activePillarName: null,
    zoomLevel: 100,
  },
);

const emit = defineEmits<{
  (e: "select-node", node: any): void;
  (e: "update:zoomLevel", val: number): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLElement | null>(null);

const panX = ref(60);
const panY = ref(60);
const isPanning = ref(false);
const panMoved = ref(false);
const startMouseX = ref(0);
const startMouseY = ref(0);

const viewportMode = ref<"hand" | "zoom">("hand");
const isAltPressed = ref(false);

const zoom = computed(() => (props.zoomLevel || 100) / 100);
const zoomPercent = computed(() => Math.round(props.zoomLevel || 100));
const collapsedMap = ref<Record<string, boolean>>({});

function setViewportMode(mode: "hand" | "zoom") {
  viewportMode.value = mode;
}

function formatVal(val: any, unit?: string) {
  if (val === undefined || val === null) return "-";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  if (unit === "Rp" || unit === "IDR" || num >= 1000000) {
    return "Rp " + num.toLocaleString("id-ID");
  }
  return num.toLocaleString("id-ID") + (unit ? " " + unit : "");
}

function formatTeam(kr: any): string {
  if (kr.departments && kr.departments.length > 0 && kr.departments[0]) {
    return kr.departments[0];
  }
  if (
    kr.initiatives &&
    kr.initiatives.length > 0 &&
    kr.initiatives[0]?.team?.name
  ) {
    return kr.initiatives[0].team.name;
  }
  const match = kr.title?.match(/^\[([^\]]+)\]/);
  if (match) return match[1];
  return "Tim";
}

// Convert 6-level BSC-OKR structure into MindMapNode tree
const treeData = computed<MindMapNode | null>(() => {
  const rootTitle = props.rootData?.title || "BSC-OKR Suite";
  const rootSub = props.rootData?.subtitle || "SKOLLA STRATEGY 2026";
  const pers = props.perspectives || [];

  const avgCorpProgress =
    pers.length > 0
      ? Math.round(
          (pers.reduce((acc, p) => acc + (p.averageProgress || 0), 0) /
            pers.length) *
            10,
        ) / 10
      : 100;

  const pillarChildren: MindMapNode[] = pers.map((p) => {
    const pLineage = { root: rootTitle, pillar: p.name };

    const objChildren: MindMapNode[] = (p.objectives || []).map((obj: any) => {
      const objLineage = { ...pLineage, objective: obj.title };

      const krChildren: MindMapNode[] = (obj.keyResults || []).map(
        (kr: any) => {
          const dept = formatTeam(kr);
          const krLineage = { ...objLineage, team: dept, kr: kr.title };

          const initChildren: MindMapNode[] = (kr.initiatives || []).map(
            (init: any) => {
              const initLineage = { ...krLineage, initiative: init.title };

              const taskList = init.tasks || init.kpis || [];
              const kpiChildren: MindMapNode[] = taskList.map((task: any) => {
                const taskLineage = {
                  ...initLineage,
                  task: task.title,
                  kpi: task.title,
                };

                return {
                  id: `kpi-${task.id}`,
                  type: "KPI",
                  title: task.title,
                  tag: "KPI",
                  color: "#10b981",
                  pic:
                    task.assignedTeamMember?.name ||
                    task.assignedUser?.name ||
                    "PIC",
                  status: task.kanbanStatus || task.status || "TODO",
                  target: task.targetValue
                    ? `${formatVal(task.currentValue, task.unit)} / ${formatVal(task.targetValue, task.unit)}`
                    : undefined,
                  lineage: taskLineage,
                  raw: {
                    ...task,
                    parentKr: kr,
                    parentInit: init,
                    objectiveId: obj.id,
                    objectiveTitle: obj.title,
                    perspective: p.name,
                    siblingKrs: (obj.keyResults || []).filter((s: any) => s.id !== kr.id),
                  },
                  children: [],
                };
              });

              return {
                id: `init-${init.id}`,
                type: "INITIATIVE",
                title: init.title,
                tag: "Inisiatif",
                color: "#7c3aed",
                pic: init.owner?.name || init.assignedLeader?.name,
                progress: init.progress,
                status: init.kanbanStatus || init.status || "TODO",
                lineage: initLineage,
                raw: {
                  ...init,
                  parentKr: kr,
                  objectiveId: obj.id,
                  objectiveTitle: obj.title,
                  perspective: p.name,
                  siblingKrs: (obj.keyResults || []).filter((s: any) => s.id !== kr.id),
                },
                children: kpiChildren,
              };
            },
          );

          const krPics =
            Array.isArray(kr.assignments) && kr.assignments.length > 0
              ? kr.assignments
                  .map((a: any) => `${a.user?.name || ""}${a.raciRole ? ` (${a.raciRole[0]})` : ""}`)
                  .filter((s: string) => Boolean(s.trim()))
                  .join(", ")
              : kr.owner?.name;

          return {
            id: `kr-${kr.id}`,
            type: "KR",
            title: kr.title,
            tag: "Key Result",
            badge: dept,
            color: p.color || "#0284c7",
            pic: krPics,
            progress: kr.progress,
            status: kr.status,
            target: `${formatVal(kr.currentValue, kr.unit)} / ${formatVal(kr.targetValue, kr.unit)}`,
            lineage: krLineage,
            raw: {
              ...kr,
              objectiveId: obj.id,
              objectiveTitle: obj.title,
              perspective: p.name,
              siblingKrs: (obj.keyResults || []).filter((s: any) => s.id !== kr.id),
            },
            children: initChildren,
          };
        },
      );

      return {
        id: `obj-${obj.id}`,
        type: "OBJECTIVE",
        title: obj.title,
        tag: "Objective",
        color: p.color || "#0284c7",
        progress: obj.progress,
        status: obj.status,
        badge: obj.quarter,
        lineage: objLineage,
        raw: obj,
        children: krChildren,
      };
    });

    return {
      id: `pillar-${p.id || p.key}`,
      type: "PILLAR",
      title: p.name,
      tag: "Pilar BSC",
      badge: `${p.totalKrs || 0} KRs`,
      color: p.color || "#0284c7",
      progress: p.averageProgress,
      status:
        p.averageProgress >= 70
          ? "ON TRACK"
          : p.averageProgress >= 40
            ? "AT RISK"
            : "OFF TRACK",
      lineage: pLineage,
      raw: p,
      children: objChildren,
    };
  });

  return {
    id: "root",
    type: "ROOT",
    title: rootTitle,
    subtitle: rootSub,
    tag: "Root BSC",
    badge: props.rootData?.year || "FY 2026",
    color: "#0f172a",
    progress: avgCorpProgress,
    lineage: { root: rootTitle },
    raw: {
      id: "root",
      type: "ROOT",
      title: rootTitle,
      subtitle: rootSub,
      progress: avgCorpProgress,
    },
    children: pillarChildren,
  };
});

function handleSelectNode(node: any) {
  emit("select-node", node);
}

function handleToggleNode(id: string) {
  collapsedMap.value = {
    ...collapsedMap.value,
    [id]: !collapsedMap.value[id],
  };
}

// Default collapse: hanya Aspek BSC (Pillar) yang terbuka. Objective dan turunannya tertutup.
function collapseToPillar() {
  const map: Record<string, boolean> = {};
  function traverse(n: MindMapNode) {
    if (n.type === "PILLAR") {
      map[n.id] = true;
    }
    if (n.children && n.children.length > 0) {
      n.children.forEach(traverse);
    }
  }
  if (treeData.value) {
    traverse(treeData.value);
  }
  collapsedMap.value = map;
}

function expandAll() {
  collapsedMap.value = {};
}

function collapseAll() {
  collapseToPillar();
}

watch(
  () => props.perspectives,
  (newVal) => {
    if (newVal && newVal.length > 0) {
      nextTick(() => {
        collapseToPillar();
      });
    }
  },
  { immediate: true, deep: true },
);

function onKeyDown(e: KeyboardEvent) {
  const target = e.target as HTMLElement;
  if (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  ) {
    return;
  }
  if (e.key === "Alt") {
    isAltPressed.value = true;
  } else if (e.key === "h" || e.key === "H") {
    viewportMode.value = "hand";
  } else if (e.key === "z" || e.key === "Z") {
    viewportMode.value = "zoom";
  }
}

function onKeyUp(e: KeyboardEvent) {
  if (e.key === "Alt") {
    isAltPressed.value = false;
  }
}

onMounted(() => {
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
  }
  nextTick(() => {
    collapseToPillar();
  });
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  }
});

function resetZoom() {
  panX.value = 60;
  panY.value = 60;
  emit("update:zoomLevel", 100);
}

function applyZoom(newZoomLevel: number, focalX: number, focalY: number) {
  const clampedZoom = Math.min(180, Math.max(40, Math.round(newZoomLevel)));
  const oldZoom = (props.zoomLevel || 100) / 100;
  const newZoom = clampedZoom / 100;

  if (oldZoom !== newZoom) {
    const ratio = newZoom / oldZoom;
    panX.value = focalX - (focalX - panX.value) * ratio;
    panY.value = focalY - (focalY - panY.value) * ratio;
    emit("update:zoomLevel", clampedZoom);
  }
}

function zoomIn(focalX?: number, focalY?: number) {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    const fx = focalX !== undefined ? focalX : rect.width / 2;
    const fy = focalY !== undefined ? focalY : rect.height / 2;
    applyZoom((props.zoomLevel || 100) + 10, fx, fy);
  } else {
    emit("update:zoomLevel", Math.min(180, (props.zoomLevel || 100) + 10));
  }
}

function zoomOut(focalX?: number, focalY?: number) {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    const fx = focalX !== undefined ? focalX : rect.width / 2;
    const fy = focalY !== undefined ? focalY : rect.height / 2;
    applyZoom((props.zoomLevel || 100) - 10, fx, fy);
  } else {
    emit("update:zoomLevel", Math.max(40, (props.zoomLevel || 100) - 10));
  }
}

defineExpose({
  expandAll,
  collapseAll,
  collapseDefault: collapseToPillar,
  collapseToPillar,
  resetZoom,
  zoomIn,
  zoomOut,
  setViewportMode,
});

function startPan(e: MouseEvent) {
  if (e.button !== 0) return;
  const target = e.target as HTMLElement;
  if (
    target.closest("button") ||
    target.closest(".card") ||
    target.closest(".mindmap-floating-bar")
  ) {
    return;
  }
  isPanning.value = true;
  panMoved.value = false;
  startMouseX.value = e.clientX - panX.value;
  startMouseY.value = e.clientY - panY.value;
}

function onPan(e: MouseEvent) {
  if (!isPanning.value) return;
  const newX = e.clientX - startMouseX.value;
  const newY = e.clientY - startMouseY.value;
  if (Math.abs(newX - panX.value) > 3 || Math.abs(newY - panY.value) > 3) {
    panMoved.value = true;
  }
  panX.value = newX;
  panY.value = newY;
}

function endPan(e: MouseEvent) {
  if (
    isPanning.value &&
    !panMoved.value &&
    viewportMode.value === "zoom"
  ) {
    if (containerRef.value) {
      const rect = containerRef.value.getBoundingClientRect();
      const focalX = e.clientX - rect.left;
      const focalY = e.clientY - rect.top;
      const delta = e.altKey ? -15 : 15;
      applyZoom((props.zoomLevel || 100) + delta, focalX, focalY);
    }
  }
  isPanning.value = false;
  panMoved.value = false;
}

function onWheel(e: WheelEvent) {
  if (!containerRef.value) return;

  const isZoomGesture =
    viewportMode.value === "zoom" || e.ctrlKey || e.metaKey;

  if (isZoomGesture) {
    const rect = containerRef.value.getBoundingClientRect();
    const focalX = e.clientX - rect.left;
    const focalY = e.clientY - rect.top;

    const delta = e.deltaY < 0 ? 8 : -8;
    applyZoom((props.zoomLevel || 100) + delta, focalX, focalY);
  } else {
    // Mode Hand / scroll biasa: geser (scroll/pan) viewport
    if (e.shiftKey && !e.deltaX) {
      panX.value -= e.deltaY;
    } else {
      panX.value -= e.deltaX;
      panY.value -= e.deltaY;
    }
  }
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Raleway:wght@500;600;700;800&display=swap");

.mindmap-viewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background-color: #ffffff;
  background-image: radial-gradient(#e2e8f0 1.2px, transparent 1.2px);
  background-size: 24px 24px;
  user-select: none;

  /* Global Mind Map CSS variables matching user template */
  --bg: #ffffff;
  --ink: #111111;
  --muted: #8a8a8a;
  --line: #2742e0;
  --line-w: 2.5px;
  --gap: 36px;
  --row-gap: 24px;
  --elbow-y: 20px;
  --pill-bg: #ffffff;
  --pill-bd: #e3e3e3;
}

.mindmap-viewport.mode-hand {
  cursor: grab;
}

.mindmap-viewport.mode-hand:active,
.mindmap-viewport.mode-hand.is-panning {
  cursor: grabbing;
}

.mindmap-viewport.mode-zoom {
  cursor: zoom-in;
}

.mindmap-viewport.mode-zoom.is-alt {
  cursor: zoom-out;
}

/* Floating Mode & Zoom Toolbar */
.mindmap-floating-bar {
  position: absolute;
  bottom: 24px;
  left: 24px;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  padding: 6px 10px;
  border-radius: 9999px;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.16), 0 2px 6px -1px rgba(15, 23, 42, 0.08);
  border: 1px solid #e2e8f0;
  backdrop-filter: blur(8px);
}

.mode-toggles {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 9999px;
}

.mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 9999px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.mode-btn:hover {
  color: #0f172a;
}

.mode-btn.active {
  background: #ffffff;
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.floating-divider {
  width: 1px;
  height: 20px;
  background: #e2e8f0;
  margin: 0 2px;
}

.zoom-steppers {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tool-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-icon-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.zoom-display {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  min-width: 44px;
  text-align: center;
  user-select: none;
}

.mindmap-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: max-content;
  min-width: 3200px;
  min-height: 2400px;
  padding: 80px 100px;
}

.tree-root-container {
  display: inline-block;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #94a3b8;
  font-size: 16px;
}
</style>

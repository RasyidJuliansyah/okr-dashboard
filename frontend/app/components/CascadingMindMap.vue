<template>
  <div
    ref="containerRef"
    class="mindmap-viewport"
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
          :collapsed-map="collapsedMap"
          @select-node="handleSelectNode"
          @toggle-node="handleToggleNode"
        />
      </div>

      <div v-else class="empty-state">
        <p>Tidak ada data OKR Cascading ditemukan.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import CascadingMindMapBranch, {
  type MindMapNode,
} from "./CascadingMindMapBranch.vue";

const props = withDefaults(
  defineProps<{
    rootData?: { title: string; subtitle: string; year?: string };
    perspectives: any[];
    selectedNodeId?: string | null;
    zoomLevel?: number;
  }>(),
  {
    rootData: () => ({
      title: "BSC-OKR Suite",
      subtitle: "SKOLLA STRATEGY 2026",
      year: "FY 2026",
    }),
    selectedNodeId: null,
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
const startMouseX = ref(0);
const startMouseY = ref(0);

const zoom = computed(() => (props.zoomLevel || 100) / 100);
const collapsedMap = ref<Record<string, boolean>>({});

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

          return {
            id: `kr-${kr.id}`,
            type: "KR",
            title: kr.title,
            tag: "Key Result",
            badge: dept,
            color: p.color || "#0284c7",
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
  collapsedMap.value[id] = !collapsedMap.value[id];
}

function expandAll() {
  collapsedMap.value = {};
}

function collapseAll() {
  const map: Record<string, boolean> = {};
  if (treeData.value?.children) {
    treeData.value.children.forEach((p) => {
      map[p.id] = true;
    });
  }
  collapsedMap.value = map;
}

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
  resetZoom,
  zoomIn,
  zoomOut,
});

function startPan(e: MouseEvent) {
  if (e.button !== 0) return;
  const target = e.target as HTMLElement;
  if (target.closest("button") || target.closest(".card")) return;
  isPanning.value = true;
  startMouseX.value = e.clientX - panX.value;
  startMouseY.value = e.clientY - panY.value;
}

function onPan(e: MouseEvent) {
  if (!isPanning.value) return;
  panX.value = e.clientX - startMouseX.value;
  panY.value = e.clientY - startMouseY.value;
}

function endPan() {
  isPanning.value = false;
}

function onWheel(e: WheelEvent) {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const focalX = e.clientX - rect.left;
  const focalY = e.clientY - rect.top;

  const delta = e.deltaY < 0 ? 6 : -6;
  applyZoom((props.zoomLevel || 100) + delta, focalX, focalY);
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
  cursor: grab;
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

.mindmap-viewport:active {
  cursor: grabbing;
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

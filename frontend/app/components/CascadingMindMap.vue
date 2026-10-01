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
      <!-- SVG Connector Lines Layer -->
      <svg
        class="connectors-layer"
        :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
      >
        <path
          v-for="(path, idx) in connectorPaths"
          :key="idx"
          :d="path.d"
          :stroke="path.color || '#38bdf8'"
          stroke-width="2.5"
          fill="none"
          stroke-linecap="round"
        />
      </svg>

      <!-- Nodes Tree Layout -->
      <div class="tree-columns-container">
        <!-- Level 0: Root Node -->
        <div class="column-level col-root">
          <div
            class="tree-card node-root"
            :class="{ 'is-selected': selectedNodeId === 'root' }"
            @click.stop="
              selectNode({
                id: 'root',
                type: 'ROOT',
                title: rootData.title || 'BSC-OKR Suite',
                description: rootData.subtitle || 'SKOLLA STRATEGY 2026',
                progress: 100,
                lineage: { root: rootData.title || 'BSC-OKR Suite' },
              })
            "
          >
            <div class="root-left">
              <div class="root-icon-box">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <circle cx="19" cy="6" r="2" />
                  <circle cx="19" cy="18" r="2" />
                  <circle cx="5" cy="12" r="2" />
                  <line x1="12" y1="9" x2="19" y2="6" />
                  <line x1="12" y1="15" x2="19" y2="18" />
                  <line x1="5" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <div class="root-content">
                <h3 class="root-title">
                  {{ rootData.title || "BSC-OKR Suite" }}
                </h3>
                <span class="root-sub">{{
                  rootData.subtitle || "SKOLLA STRATEGY 2026"
                }}</span>
              </div>
            </div>
            <!-- Open/Close Toggle Button on Root -->
            <button
              type="button"
              class="node-collapse-trigger"
              :title="
                isExpanded('root') ? 'Tutup 4 Aspek BSC' : 'Buka 4 Aspek BSC'
              "
              @click.stop="toggleNode('root')"
            >
              {{ isExpanded("root") ? "−" : "+" }}
            </button>
          </div>
        </div>

        <!-- Level 1: BSC Pillars -->
        <div v-if="isExpanded('root')" class="column-level col-pillars">
          <div v-for="p in perspectives" :key="p.id" class="pillar-group">
            <!-- Pillar Card -->
            <div
              :id="'node-pillar-' + p.id"
              class="tree-card node-pillar"
              :class="{ 'is-selected': selectedNodeId === p.id }"
              @click.stop="
                selectNode({
                  ...p,
                  type: 'PILLAR',
                  lineage: {
                    root: rootData.title || 'BSC-OKR Suite',
                    pillar: p.name,
                  },
                })
              "
            >
              <div class="pillar-left">
                <div class="pillar-icon">
                  <svg
                    v-if="p.key === 'FINANCIAL'"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <path
                      d="M15 10a2 2 0 0 0-2-2h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-2-2"
                    />
                  </svg>
                  <svg
                    v-else-if="p.key === 'CUSTOMER'"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <svg
                    v-else-if="p.key === 'INTERNAL_PROCESS'"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  <svg
                    v-else
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <div class="pillar-details">
                  <div class="pillar-title-row">
                    <h4 class="pillar-name">{{ p.name }}</h4>
                    <span v-if="p.totalKrs > 0" class="pillar-count-pill">{{
                      p.totalKrs
                    }}</span>
                  </div>
                  <span class="pillar-tag">BSC</span>
                </div>
              </div>

              <!-- Open/Close Toggle Button -->
              <button
                type="button"
                class="node-collapse-trigger"
                :title="isExpanded(p.id) ? 'Tutup cabang' : 'Buka cabang'"
                @click.stop="toggleNode(p.id)"
              >
                {{ isExpanded(p.id) ? "−" : "+" }}
              </button>
            </div>

            <!-- Sub-tree: Objectives under Pillar -->
            <div
              v-if="isExpanded(p.id) && p.objectives?.length"
              class="branch-children col-objectives"
            >
              <div
                v-for="obj in p.objectives"
                :key="obj.id"
                class="objective-branch"
              >
                <!-- Objective Card -->
                <div
                  :id="'node-obj-' + obj.id"
                  class="tree-card node-objective"
                  :class="{ 'is-selected': selectedNodeId === obj.id }"
                  @click.stop="
                    selectNode({
                      ...obj,
                      type: 'OBJECTIVE',
                      perspective: p.name,
                      lineage: {
                        root: rootData.title || 'BSC-OKR Suite',
                        pillar: p.name,
                        objective: obj.title,
                      },
                    })
                  "
                >
                  <div class="obj-header">
                    <span class="card-type-tag obj">Objective</span>
                    <span
                      class="node-status-dot"
                      :class="obj.status?.toLowerCase()"
                    ></span>
                  </div>
                  <p class="node-text">{{ obj.title }}</p>
                  <button
                    v-if="obj.keyResults?.length"
                    type="button"
                    class="node-collapse-trigger"
                    :title="isExpanded(obj.id) ? 'Tutup KR' : 'Buka KR'"
                    @click.stop="toggleNode(obj.id)"
                  >
                    {{ isExpanded(obj.id) ? "−" : "+" }}
                  </button>
                </div>

                <!-- Sub-tree: Key Results under Objective -->
                <div
                  v-if="isExpanded(obj.id) && obj.keyResults?.length"
                  class="branch-children col-krs"
                >
                  <div
                    v-for="kr in obj.keyResults"
                    :key="kr.id"
                    class="kr-branch"
                  >
                    <!-- Key Result Card -->
                    <div
                      :id="'node-kr-' + kr.id"
                      class="tree-card node-kr"
                      :class="{ 'is-selected': selectedNodeId === kr.id }"
                      @click.stop="
                        selectNode({
                          ...kr,
                          type: 'KR',
                          perspective: p.name,
                          objectiveTitle: obj.title,
                          lineage: {
                            root: rootData.title || 'BSC-OKR Suite',
                            pillar: p.name,
                            objective: obj.title,
                            team: formatTeam(kr),
                            kr: kr.title,
                          },
                        })
                      "
                    >
                      <div class="kr-top-row">
                        <span class="team-badge">{{ formatTeam(kr) }}</span>
                        <span
                          class="kr-status-pill"
                          :class="kr.status?.toLowerCase()"
                          >{{ kr.progress }}%</span
                        >
                      </div>
                      <h5 class="kr-card-title">{{ kr.title }}</h5>
                      <div class="kr-mini-prog">
                        <div
                          class="kr-mini-fill"
                          :style="{ width: kr.progress + '%' }"
                        ></div>
                      </div>
                      <button
                        v-if="kr.initiatives?.length"
                        type="button"
                        class="node-collapse-trigger"
                        :title="
                          isExpanded(kr.id)
                            ? 'Tutup Inisiatif'
                            : 'Buka Inisiatif'
                        "
                        @click.stop="toggleNode(kr.id)"
                      >
                        {{ isExpanded(kr.id) ? "−" : "+" }}
                      </button>
                    </div>

                    <!-- Sub-tree: Initiatives under KR -->
                    <div
                      v-if="isExpanded(kr.id) && kr.initiatives?.length"
                      class="branch-children col-initiatives"
                    >
                      <div
                        v-for="init in kr.initiatives"
                        :key="init.id"
                        class="initiative-branch"
                      >
                        <!-- Initiative Card -->
                        <div
                          :id="'node-init-' + init.id"
                          class="tree-card node-initiative"
                          :class="{ 'is-selected': selectedNodeId === init.id }"
                          @click.stop="
                            selectNode({
                              ...init,
                              type: 'INITIATIVE',
                              perspective: p.name,
                              objectiveTitle: obj.title,
                              krTitle: kr.title,
                              lineage: {
                                root: rootData.title || 'BSC-OKR Suite',
                                pillar: p.name,
                                objective: obj.title,
                                team: init.team?.name || formatTeam(kr),
                                kr: kr.title,
                                initiative: init.title,
                              },
                            })
                          "
                        >
                          <div class="init-header">
                            <span class="card-type-tag init">Inisiatif</span>
                            <span class="init-status-tag">{{
                              init.kanbanStatus || init.status
                            }}</span>
                          </div>
                          <p class="node-text font-medium">{{ init.title }}</p>
                          <div class="init-footer">
                            <span class="init-pic">{{
                              init.owner?.name ||
                              init.assignedLeader?.name ||
                              "PIC"
                            }}</span>
                            <span class="init-percent"
                              >{{ init.progress }}%</span
                            >
                          </div>
                          <button
                            v-if="init.tasks?.length"
                            type="button"
                            class="node-collapse-trigger"
                            :title="
                              isExpanded(init.id) ? 'Tutup KPI' : 'Buka KPI'
                            "
                            @click.stop="toggleNode(init.id)"
                          >
                            {{ isExpanded(init.id) ? "−" : "+" }}
                          </button>
                        </div>

                        <!-- Sub-tree: KPIs under Initiative -->
                        <div
                          v-if="isExpanded(init.id) && init.tasks?.length"
                          class="branch-children col-tasks"
                        >
                          <div
                            v-for="task in init.tasks"
                            :key="task.id"
                            :id="'node-task-' + task.id"
                            class="tree-card node-task"
                            :class="{
                              'is-selected': selectedNodeId === task.id,
                            }"
                            @click.stop="
                              selectNode({
                                ...task,
                                type: 'KPI',
                                perspective: p.name,
                                objectiveTitle: obj.title,
                                krTitle: kr.title,
                                initiativeTitle: init.title,
                                lineage: {
                                  root: rootData.title || 'BSC-OKR Suite',
                                  pillar: p.name,
                                  objective: obj.title,
                                  team: init.team?.name || formatTeam(kr),
                                  kr: kr.title,
                                  initiative: init.title,
                                  task: task.title,
                                  kpi: task.title,
                                },
                              })
                            "
                          >
                            <div class="task-top-row">
                              <span class="card-type-tag kpi">KPI</span>
                              <span
                                class="task-status-pill"
                                :class="
                                  (
                                    task.kanbanStatus ||
                                    task.status ||
                                    'todo'
                                  ).toLowerCase()
                                "
                                >{{
                                  task.kanbanStatus || task.status || "TODO"
                                }}</span
                              >
                            </div>
                            <p class="task-title">{{ task.title }}</p>
                            <div class="task-footer">
                              <span class="task-member">{{
                                task.assignedTeamMember?.name ||
                                task.assignedUser?.name ||
                                "PIC"
                              }}</span>
                              <span v-if="task.targetValue" class="task-target"
                                >{{ formatVal(task.currentValue, task.unit) }} /
                                {{
                                  formatVal(task.targetValue, task.unit)
                                }}</span
                              >
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from "vue";

const props = withDefaults(
  defineProps<{
    rootData: { title: string; subtitle: string; year?: string };
    perspectives: any[];
    selectedNodeId?: string | null;
    zoomLevel?: number;
  }>(),
  {
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

const panX = ref(40);
const panY = ref(60);
const isPanning = ref(false);
const startMouseX = ref(0);
const startMouseY = ref(0);
const canvasWidth = ref(3600);
const canvasHeight = ref(2400);

const zoom = computed(() => (props.zoomLevel || 100) / 100);
const nodeState = ref<Record<string, boolean>>({});

function isExpanded(id: string): boolean {
  if (nodeState.value[id] !== undefined) return nodeState.value[id];
  return true;
}

function toggleNode(id: string) {
  nodeState.value[id] = !isExpanded(id);
  nextTick(() => recalculateConnectors());
}

function expandAll() {
  nodeState.value["root"] = true;
  props.perspectives.forEach((p) => {
    nodeState.value[p.id] = true;
    p.objectives?.forEach((o: any) => {
      nodeState.value[o.id] = true;
      o.keyResults?.forEach((k: any) => {
        nodeState.value[k.id] = true;
        k.initiatives?.forEach((i: any) => {
          nodeState.value[i.id] = true;
        });
      });
    });
  });
  nextTick(() => recalculateConnectors());
}

function collapseAll() {
  nodeState.value["root"] = true;
  props.perspectives.forEach((p) => {
    nodeState.value[p.id] = false;
  });
  nextTick(() => recalculateConnectors());
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
  return "Team Unit";
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

defineExpose({
  expandAll,
  collapseAll,
  resetZoom: () => {
    panX.value = 40;
    panY.value = 60;
    emit("update:zoomLevel", 100);
  },
});

function selectNode(node: any) {
  emit("select-node", node);
}

function startPan(e: MouseEvent) {
  if (e.button !== 0) return;
  const target = e.target as HTMLElement;
  if (target.closest("button") || target.closest(".tree-card")) return;
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
  const delta = e.deltaY < 0 ? 5 : -5;
  const newZoom = Math.min(180, Math.max(40, (props.zoomLevel || 100) + delta));
  emit("update:zoomLevel", newZoom);
}

const connectorPaths = ref<Array<{ d: string; color?: string }>>([]);

function recalculateConnectors() {
  if (!canvasRef.value) return;
  const canvasRect = canvasRef.value.getBoundingClientRect();
  const scale = zoom.value || 1;
  const paths: Array<{ d: string; color?: string }> = [];

  const getAnchor = (el: HTMLElement, side: "right" | "left") => {
    const r = el.getBoundingClientRect();
    const x =
      side === "right"
        ? (r.right - canvasRect.left) / scale
        : (r.left - canvasRect.left) / scale;
    const y = (r.top + r.height / 2 - canvasRect.top) / scale;
    return { x, y };
  };

  const rootEl = canvasRef.value.querySelector(
    ".node-root",
  ) as HTMLElement | null;
  if (!rootEl) return;
  const rootAnchor = getAnchor(rootEl, "right");

  if (isExpanded("root")) {
    props.perspectives.forEach((p) => {
      const pillarEl = canvasRef.value?.querySelector(
        `#node-pillar-${p.id}`,
      ) as HTMLElement | null;
      if (!pillarEl) return;
      const pillarIn = getAnchor(pillarEl, "left");
      const pillarOut = getAnchor(pillarEl, "right");

      const dx = pillarIn.x - rootAnchor.x;
      paths.push({
        d: `M ${rootAnchor.x} ${rootAnchor.y} C ${rootAnchor.x + dx * 0.55} ${rootAnchor.y}, ${pillarIn.x - dx * 0.45} ${pillarIn.y}, ${pillarIn.x} ${pillarIn.y}`,
        color: p.color || "#0284c7",
      });

      if (isExpanded(p.id) && p.objectives) {
        p.objectives.forEach((obj: any) => {
          const objEl = canvasRef.value?.querySelector(
            `#node-obj-${obj.id}`,
          ) as HTMLElement | null;
          if (!objEl) return;
          const objIn = getAnchor(objEl, "left");
          const objOut = getAnchor(objEl, "right");
          const dObjX = objIn.x - pillarOut.x;

          paths.push({
            d: `M ${pillarOut.x} ${pillarOut.y} C ${pillarOut.x + dObjX * 0.5} ${pillarOut.y}, ${objIn.x - dObjX * 0.5} ${objIn.y}, ${objIn.x} ${objIn.y}`,
            color: p.color || "#38bdf8",
          });

          if (isExpanded(obj.id) && obj.keyResults) {
            obj.keyResults.forEach((kr: any) => {
              const krEl = canvasRef.value?.querySelector(
                `#node-kr-${kr.id}`,
              ) as HTMLElement | null;
              if (!krEl) return;
              const krIn = getAnchor(krEl, "left");
              const krOut = getAnchor(krEl, "right");
              const dKrX = krIn.x - objOut.x;

              paths.push({
                d: `M ${objOut.x} ${objOut.y} C ${objOut.x + dKrX * 0.5} ${objOut.y}, ${krIn.x - dKrX * 0.5} ${krIn.y}, ${krIn.x} ${krIn.y}`,
                color: "#0284c7",
              });

              if (isExpanded(kr.id) && kr.initiatives) {
                kr.initiatives.forEach((init: any) => {
                  const initEl = canvasRef.value?.querySelector(
                    `#node-init-${init.id}`,
                  ) as HTMLElement | null;
                  if (!initEl) return;
                  const initIn = getAnchor(initEl, "left");
                  const initOut = getAnchor(initEl, "right");
                  const dInitX = initIn.x - krOut.x;

                  paths.push({
                    d: `M ${krOut.x} ${krOut.y} C ${krOut.x + dInitX * 0.5} ${krOut.y}, ${initIn.x - dInitX * 0.5} ${initIn.y}, ${initIn.x} ${initIn.y}`,
                    color: "#7c3aed",
                  });

                  if (isExpanded(init.id) && init.tasks) {
                    init.tasks.forEach((task: any) => {
                      const taskEl = canvasRef.value?.querySelector(
                        `#node-task-${task.id}`,
                      ) as HTMLElement | null;
                      if (!taskEl) return;
                      const taskIn = getAnchor(taskEl, "left");
                      const dTaskX = taskIn.x - initOut.x;

                      paths.push({
                        d: `M ${initOut.x} ${initOut.y} C ${initOut.x + dTaskX * 0.5} ${initOut.y}, ${taskIn.x - dTaskX * 0.5} ${taskIn.y}, ${taskIn.x} ${taskIn.y}`,
                        color: "#10b981",
                      });
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  connectorPaths.value = paths;
}

watch(
  () => [props.perspectives, props.zoomLevel],
  () => {
    nextTick(() => {
      setTimeout(() => recalculateConnectors(), 50);
    });
  },
  { deep: true },
);

onMounted(() => {
  nextTick(() => {
    setTimeout(() => recalculateConnectors(), 100);
  });
  window.addEventListener("resize", recalculateConnectors);
});
</script>

<style scoped>
.mindmap-viewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background-color: #f8fafc;
  background-image: radial-gradient(#cbd5e1 1.2px, transparent 1.2px);
  background-size: 24px 24px;
  cursor: grab;
  user-select: none;
}

.mindmap-viewport:active {
  cursor: grabbing;
}

.mindmap-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 3600px;
  height: 2400px;
  transition: transform 0.05s ease-out;
}

.connectors-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.tree-columns-container {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  gap: 120px;
  padding: 80px 60px;
}

.column-level {
  display: flex;
  flex-direction: column;
}

.col-root {
  justify-content: center;
  align-self: center;
  margin-top: 140px;
}

.tree-card {
  position: relative;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  transition: all 0.2s ease;
  cursor: pointer;
}

.tree-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
  transform: translateY(-2px);
}

.tree-card.is-selected {
  outline: 2.5px solid #0284c7;
  box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.2);
}

/* Root Card */
.node-root {
  background: #1e3a5f;
  color: #ffffff;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 250px;
  border: 1px solid #2563eb;
}

.root-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.root-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.root-title {
  font-size: 1.05rem;
  font-weight: 800;
  margin: 0;
}

.root-sub {
  font-size: 0.72rem;
  color: #93c5fd;
  letter-spacing: 0.5px;
}

/* Pillar Branch & Card */
.col-pillars {
  gap: 40px;
}

.pillar-branch {
  display: flex;
  align-items: flex-start;
  gap: 80px;
}

.node-pillar {
  background: #1e293b;
  color: #ffffff;
  padding: 14px 18px;
  width: max-content;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pillar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pillar-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #38bdf8;
}

.pillar-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pillar-name {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0;
}

.pillar-count-pill {
  font-size: 0.68rem;
  background: #334155;
  color: #94a3b8;
  padding: 1px 6px;
  border-radius: 999px;
  font-weight: 700;
}

.pillar-tag {
  font-size: 0.65rem;
  color: #64748b;
  font-weight: 700;
}

/* Branch Children Layouts */
.branch-children {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.objective-branch,
.kr-branch,
.initiative-branch {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 60px;
}

/* Objective Card */
.node-objective {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #0284c7;
  padding: 14px 16px;
  width: 250px;
}

.obj-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.node-text {
  font-size: 0.85rem;
  color: #1e293b;
  line-height: 1.4;
  margin: 0;
}

/* Key Result Card */
.node-kr {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 12px 14px;
  width: 260px;
}

.kr-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.team-badge {
  font-size: 0.68rem;
  font-weight: 700;
  background: #e0f2fe;
  color: #0369a1;
  padding: 2px 6px;
  border-radius: 4px;
}

.kr-card-title {
  font-size: 0.84rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
  line-height: 1.35;
}

.kr-status-pill {
  font-size: 0.72rem;
  font-weight: 800;
  color: #059669;
}

.kr-mini-prog {
  width: 100%;
  height: 5px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.kr-mini-fill {
  height: 100%;
  background: #0284c7;
  border-radius: 999px;
}

/* Initiative Card */
.node-initiative {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #8b5cf6;
  padding: 10px 12px;
  width: 230px;
}

.init-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.init-status-tag {
  font-size: 0.65rem;
  font-weight: 700;
  color: #6d28d9;
}

.init-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: #64748b;
  margin-top: 6px;
}

/* Task/KPI Card */
.node-task {
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-left: 3px solid #10b981;
  padding: 8px 10px;
  width: 200px;
}

.task-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.task-status-pill {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #059669;
}

.task-title {
  font-size: 0.78rem;
  font-weight: 500;
  color: #334155;
  margin: 4px 0;
  line-height: 1.3;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.68rem;
  color: #64748b;
  margin-top: 4px;
}

.task-member {
  font-weight: 600;
  color: #475569;
}

.task-target {
  font-size: 0.68rem;
  color: #0284c7;
  font-weight: 600;
}

/* Tags & Indicators */
.card-type-tag {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #0284c7;
}

.card-type-tag.init {
  color: #7c3aed;
}
.card-type-tag.task,
.card-type-tag.kpi {
  color: #059669;
  background: #ecfdf5;
  padding: 1px 5px;
  border-radius: 4px;
}

.node-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

.node-status-dot.at_risk {
  background: #f59e0b;
}
.node-status-dot.off_track {
  background: #ef4444;
}

.node-collapse-trigger {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #0284c7;
  color: #ffffff;
  border: 2px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  z-index: 5;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease;
}

.node-collapse-trigger:hover {
  transform: translateY(-50%) scale(1.15);
  background: #0369a1;
}
</style>

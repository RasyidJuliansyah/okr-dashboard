<template>
  <div class="branch" :class="{ collapsed: isCollapsed }">
    <button
      type="button"
      class="card"
      :class="[
        isRoot ? 'root' : '',
        !hasKids ? 'leaf' : '',
        selectedNodeId === node.id ? 'is-selected' : '',
        'card-' + (node.type || '').toLowerCase(),
      ]"
      :aria-expanded="hasKids ? String(!isCollapsed) : undefined"
      @click="handleCardClick"
    >
      <div class="card-main">
        <div class="title-wrap">
          <span class="title">
            {{ node.title }}
          </span>
          <span
            v-if="hasKids"
            class="toggle"
            :title="isCollapsed ? 'Buka cabang' : 'Tutup cabang'"
            @click.stop="toggleCollapse"
          >
            {{ isCollapsed ? "+" : "−" }}
          </span>
        </div>

        <div v-if="node.subtitle" class="node-subtitle">
          {{ node.subtitle }}
        </div>

        <div class="meta-row">
          <span class="tag" :class="node.type?.toLowerCase()">
            {{ node.tag }}
          </span>

          <span v-if="node.badge" class="badge-dept">
            {{ node.badge }}
          </span>

          <span v-if="node.status" class="badge-status" :class="statusClass">
            {{ node.status }}
          </span>

          <span v-if="node.progress !== undefined" class="badge-prog">
            {{ node.progress }}%
          </span>

          <span v-if="node.pic" class="badge-pic"> PIC: {{ node.pic }} </span>

          <span v-if="node.target" class="badge-target">
            {{ node.target }}
          </span>
        </div>

        <!-- Mini Progress bar for KRs / Objectives / Pillars -->
        <div
          v-if="node.progress !== undefined && node.type !== 'KPI'"
          class="card-progress-bar"
        >
          <div
            class="card-progress-fill"
            :style="{
              width: Math.min(100, Math.max(0, node.progress)) + '%',
              backgroundColor: node.color || '#2742e0',
            }"
          ></div>
        </div>
      </div>
    </button>

    <div v-if="hasKids && !isCollapsed" class="stub"></div>

    <div v-if="hasKids && !isCollapsed" class="children">
      <div v-for="child in node.children" :key="child.id" class="child">
        <CascadingMindMapBranch
          :node="child"
          :is-root="false"
          :selected-node-id="selectedNodeId"
          :collapsed-map="collapsedMap"
          @select-node="$emit('select-node', $event)"
          @toggle-node="$emit('toggle-node', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import CascadingMindMapBranch from "./CascadingMindMapBranch.vue";

export interface MindMapNode {
  id: string;
  type: "ROOT" | "PILLAR" | "OBJECTIVE" | "KR" | "INITIATIVE" | "KPI";
  title: string;
  subtitle?: string;
  tag: string;
  badge?: string;
  color?: string;
  progress?: number;
  status?: string;
  pic?: string;
  target?: string;
  lineage: Record<string, string>;
  raw: any;
  children?: MindMapNode[];
}

const props = withDefaults(
  defineProps<{
    node: MindMapNode;
    isRoot?: boolean;
    selectedNodeId?: string | null;
    collapsedMap?: Record<string, boolean>;
  }>(),
  {
    isRoot: false,
    selectedNodeId: null,
    collapsedMap: () => ({}),
  },
);

const emit = defineEmits<{
  (e: "select-node", node: any): void;
  (e: "toggle-node", id: string): void;
}>();

const hasKids = computed(
  () => !!props.node.children && props.node.children.length > 0,
);

const isCollapsed = computed(() => {
  if (!hasKids.value) return false;
  if (props.collapsedMap && props.collapsedMap[props.node.id] !== undefined) {
    return props.collapsedMap[props.node.id];
  }
  return false;
});

function handleCardClick() {
  emit("select-node", {
    ...props.node.raw,
    id: props.node.id,
    type: props.node.type,
    title: props.node.title,
    lineage: props.node.lineage,
    progress: props.node.progress,
  });
}

function toggleCollapse() {
  emit("toggle-node", props.node.id);
}

const statusClass = computed(() => {
  const s = String(props.node.status || "").toUpperCase();
  if (
    s.includes("ON_TRACK") ||
    s.includes("ON TRACK") ||
    s.includes("DONE") ||
    s.includes("SELESAI")
  ) {
    return "status-success";
  }
  if (
    s.includes("AT_RISK") ||
    s.includes("AT RISK") ||
    s.includes("IN_PROGRESS") ||
    s.includes("SEDANG")
  ) {
    return "status-warning";
  }
  if (
    s.includes("OFF_TRACK") ||
    s.includes("OFF TRACK") ||
    s.includes("BLOCKED")
  ) {
    return "status-danger";
  }
  return "status-muted";
});
</script>

<style scoped>
/* ---------- struktur pohon ---------- */
.branch {
  display: flex;
  align-items: center;
  width: max-content;
}

.stub {
  width: var(--gap, 36px);
  height: var(--line-w, 2.5px);
  background: var(--line, #2742e0);
  flex: none;
}

.children {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
}

.child {
  position: relative;
  display: flex;
  align-items: center;
  padding-left: var(--gap, 36px);
}

/* garis vertikal */
.child::before {
  content: "";
  position: absolute;
  left: 0;
  width: var(--line-w, 2.5px);
  top: 0;
  bottom: 0;
  background: var(--line, #2742e0);
}

.child:first-child::before {
  top: 50%;
}

.child:last-child::before {
  bottom: 50%;
}

.child:only-child::before {
  display: none;
}

/* garis horizontal penghubung ke kartu anak */
.child::after {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: var(--gap, 36px);
  height: var(--line-w, 2.5px);
  background: var(--line, #2742e0);
  transform: translateY(-50%);
}

.child:only-child::after {
  /* Tetap hubungkan dari stub parent langsung */
  width: var(--gap, 36px);
}

/* ---------- card ---------- */
.card {
  display: block;
  text-align: left;
  font: inherit;
  color: inherit;
  background: #ffffff;
  border: 1px solid var(--pill-bd, #e2e8f0);
  border-radius: 12px;
  padding: 14px 18px;
  margin: 0;
  cursor: pointer;
  width: 290px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
  border-color: #cbd5e1;
}

.card:focus-visible {
  outline: 2px solid var(--line, #2742e0);
  outline-offset: 4px;
}

.card.is-selected {
  outline: 2.5px solid var(--line, #2742e0);
  border-color: var(--line, #2742e0);
  box-shadow: 0 0 0 4px rgba(39, 66, 224, 0.18);
}

.title-wrap {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.card .title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: -0.005em;
  color: #0f172a;
}

.node-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
  font-weight: 500;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.card .tag {
  display: inline-block;
  padding: 3px 9px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  background: var(--pill-bg, #f8fafc);
  border: 1px solid var(--pill-bd, #e2e8f0);
  border-radius: 7px;
}

.card .tag.root {
  background: #1e293b;
  color: #f8fafc;
  border-color: #334155;
}

.card .tag.pillar {
  background: #e0f2fe;
  color: #0369a1;
  border-color: #bae6fd;
}

.card .tag.objective {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.card .tag.kr {
  background: #f0fdf4;
  color: #15803d;
  border-color: #bbf7d0;
}

.card .tag.initiative {
  background: #faf5ff;
  color: #7e22ce;
  border-color: #e9d5ff;
}

.card .tag.kpi {
  background: #ecfdf5;
  color: #047857;
  border-color: #a7f3d0;
}

.badge-dept {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.badge-status {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
}
.badge-status.status-success {
  background: #dcfce7;
  color: #166534;
}
.badge-status.status-warning {
  background: #fef3c7;
  color: #92400e;
}
.badge-status.status-danger {
  background: #fee2e2;
  color: #991b1b;
}
.badge-status.status-muted {
  background: #f1f5f9;
  color: #64748b;
}

.badge-prog {
  font-size: 11px;
  font-weight: 700;
  color: #0f172a;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 2px 6px;
  border-radius: 6px;
}

.badge-pic {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
}

.badge-target {
  font-size: 11px;
  font-weight: 600;
  color: #334155;
}

.card-progress-bar {
  width: 100%;
  height: 5px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 10px;
}

.card-progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

/* card induk (root) */
.card.root {
  background: #0f172a;
  color: #ffffff;
  border-color: #1e293b;
  min-width: 290px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.2);
}

.card.root .title {
  color: #ffffff;
  font-size: 19px;
  font-weight: 700;
}

.card.root .node-subtitle {
  color: #94a3b8;
}

.card.root .badge-prog {
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  border-color: rgba(255, 255, 255, 0.15);
}

/* indikator expand / collapse */
.toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-left: 8px;
  vertical-align: middle;
  border-radius: 50%;
  border: 1.5px solid var(--line, #2742e0);
  color: var(--line, #2742e0);
  font-size: 14px;
  line-height: 1;
  font-weight: 700;
  flex: none;
  background: #ffffff;
  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

.toggle:hover {
  background: #eff6ff;
  transform: scale(1.08);
}

.card.root .toggle {
  border-color: #ffffff;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
}

.card.root .toggle:hover {
  background: rgba(255, 255, 255, 0.25);
}

.card.leaf {
  cursor: pointer;
}
.card.leaf .toggle {
  display: none;
}

/* collapse */
.branch.collapsed > .stub,
.branch.collapsed > .children {
  display: none;
}

@media (prefers-reduced-motion: no-preference) {
  .children {
    animation: open 0.18s ease-out;
  }
  @keyframes open {
    from {
      opacity: 0;
      transform: translateX(-6px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
}
</style>

<template>
  <aside v-if="selectedNode" class="node-inspector-panel">
    <!-- Panel Header -->
    <div class="inspector-header">
      <div class="inspector-title-wrap">
        <svg class="info-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span class="header-label">Node Inspector</span>
        <span class="node-type-pill" :class="selectedNode.type?.toLowerCase()">
          {{ nodeTypeLabel }}
        </span>
      </div>
      <button class="close-btn" @click="$emit('close')" title="Tutup Inspector">✕</button>
    </div>

    <!-- Scrollable Content -->
    <div class="inspector-body">
      <!-- Title & Description -->
      <div class="node-intro">
        <h2 class="node-title">{{ selectedNode.title }}</h2>
        <p v-if="selectedNode.description" class="node-desc">{{ selectedNode.description }}</p>
      </div>

      <!-- Progress Realisasi Box -->
      <div class="progress-box">
        <div class="prog-top">
          <span class="prog-label">PROGRESS REALISASI</span>
          <span class="prog-val" :class="progressStatusClass">{{ selectedNode.progress ?? 0 }}%</span>
        </div>
        <div class="prog-bar-track">
          <div
            class="prog-bar-fill"
            :class="progressStatusClass"
            :style="{ width: Math.min(100, Math.max(0, selectedNode.progress || 0)) + '%' }"
          ></div>
        </div>
        <div class="target-values-grid">
          <div class="val-col">
            <span class="val-muted">Target</span>
            <strong class="val-main">{{ formatVal(selectedNode.targetValue, selectedNode.unit) }}</strong>
          </div>
          <div class="val-col text-right">
            <span class="val-muted">Tercapai</span>
            <strong class="val-main success">{{ formatVal(selectedNode.currentValue, selectedNode.unit) }}</strong>
          </div>
        </div>
      </div>

      <!-- Lineage Cascading Section -->
      <div class="inspector-section">
        <h3 class="section-title">LINEAGE CASCADING:</h3>
        <div class="lineage-tree">
          <div class="lineage-step">
            <span class="step-circle root"></span>
            <span class="step-text font-semibold">{{ lineage.root || 'BSC-OKR Suite' }}</span>
          </div>
          <div v-if="lineage.pillar" class="lineage-step indent-1">
            <svg class="sub-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span class="step-circle pillar"></span>
            <span class="step-text font-medium">{{ lineage.pillar }}</span>
          </div>
          <div v-if="lineage.objective" class="lineage-step indent-2">
            <svg class="sub-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span class="step-text">Obj: {{ lineage.objective }}</span>
          </div>
          <div v-if="lineage.team" class="lineage-step indent-3">
            <svg class="sub-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span class="step-text font-medium text-dept">Team: {{ lineage.team }}</span>
          </div>
          <div v-if="lineage.kr" class="lineage-step indent-4">
            <svg class="sub-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span class="step-text font-semibold">KR: {{ lineage.kr }}</span>
          </div>
          <div v-if="lineage.initiative" class="lineage-step indent-5">
            <svg class="sub-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span class="step-text">Inisiatif: {{ lineage.initiative }}</span>
          </div>
          <div v-if="lineage.task || lineage.kpi" class="lineage-step indent-6">
            <svg class="sub-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span class="step-text font-semibold text-emerald-700">KPI: {{ lineage.kpi || lineage.task }}</span>
          </div>
        </div>
      </div>

      <!-- Owner & Penanggung Jawab Section -->
      <div class="inspector-section">
        <h3 class="section-title">OWNER & PENANGGUNG JAWAB:</h3>
        <div class="owner-card">
          <div class="owner-avatar">
            {{ ownerInitials }}
          </div>
          <div class="owner-meta">
            <h4 class="owner-name">{{ ownerName }}</h4>
            <span class="owner-role">{{ ownerRole }}</span>
          </div>
          <button class="open-link-btn" title="Detail">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Team Distribution FY 2026 -->
      <div class="inspector-section">
        <div class="dist-header">
          <h3 class="section-title">Team Distribution</h3>
          <span class="dist-year">FY 2026</span>
        </div>
        <div class="team-dist-list">
          <div v-for="t in teamDistribution" :key="t.name" class="team-dist-row">
            <div class="team-info">
              <span class="team-name">{{ t.name }}</span>
              <span class="team-krs">{{ t.krCount }} KRs ({{ t.percentage }}%)</span>
            </div>
            <div class="team-bar-track">
              <div class="team-bar-fill" :style="{ width: t.percentage + '%' }"></div>
            </div>
          </div>
        </div>
        <div class="mapped-badge">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
          <span>100% Objective terpetakan ke penanggung jawab tim</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  selectedNode: any;
  teamDistribution: Array<{ name: string; krCount: number; percentage: number }>;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const nodeTypeLabel = computed(() => {
  const type = props.selectedNode?.type?.toUpperCase() || 'NODE';
  if (type === 'ROOT') return 'ROOT BSC';
  if (type === 'PILLAR') return 'PILAR BSC';
  if (type === 'OBJECTIVE') return 'OBJECTIVE';
  if (type === 'KR') return 'KEY RESULT';
  if (type === 'INITIATIVE') return 'INISIATIF';
  if (type === 'TASK' || type === 'KPI') return 'KPI';
  return type;
});

const progressStatusClass = computed(() => {
  const p = props.selectedNode?.progress ?? 0;
  if (p >= 70) return 'on-track';
  if (p >= 40) return 'at-risk';
  return 'off-track';
});

const lineage = computed(() => {
  return props.selectedNode?.lineage || {
    root: 'BSC-OKR Suite',
    pillar: props.selectedNode?.perspective || null,
    objective: props.selectedNode?.objectiveTitle || null,
    team: props.selectedNode?.teamName || props.selectedNode?.departments?.[0] || null,
    kr: props.selectedNode?.krTitle || null,
    initiative: props.selectedNode?.initiativeTitle || null,
    task: props.selectedNode?.taskTitle || (props.selectedNode?.type === 'KPI' || props.selectedNode?.type === 'TASK' ? props.selectedNode?.title : null),
    kpi: props.selectedNode?.taskTitle || (props.selectedNode?.type === 'KPI' || props.selectedNode?.type === 'TASK' ? props.selectedNode?.title : null),
  };
});

const ownerName = computed(() => {
  return props.selectedNode?.owner?.name || props.selectedNode?.assignedLeader?.name || 'Rangga Setiawan';
});

const ownerRole = computed(() => {
  return props.selectedNode?.owner?.position || 'Owner & Penanggung Jawab';
});

const ownerInitials = computed(() => {
  const parts = ownerName.value.split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (ownerName.value.slice(0, 2) || 'OK').toUpperCase();
});

function formatVal(val: any, unit?: string) {
  if (val === undefined || val === null) return '-';
  const num = Number(val);
  if (isNaN(num)) return String(val);
  if (unit === 'Rp' || unit === 'IDR' || num >= 1000000) {
    return 'Rp ' + num.toLocaleString('id-ID');
  }
  return num.toLocaleString('id-ID') + (unit ? ' ' + unit : '');
}
</script>

<style scoped>
.node-inspector-panel {
  width: 380px;
  background: #ffffff;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex-shrink: 0;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.04);
  z-index: 20;
  overflow: hidden;
}

.inspector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #edf2f7;
  background: #fcfdfe;
}

.inspector-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-icon { color: #3b82f6; }
.header-label { font-size: 0.95rem; font-weight: 700; color: #0f172a; }

.node-type-pill {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
}

.inspector-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.node-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.35;
  margin: 0 0 8px 0;
}

.node-desc {
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.5;
  margin: 0;
}

.progress-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
}

.prog-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.prog-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.5px;
}

.prog-val { font-size: 1.1rem; font-weight: 800; }
.prog-val.on-track { color: #059669; }
.prog-val.at-risk { color: #d97706; }
.prog-val.off-track { color: #dc2626; }

.prog-bar-track {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 12px;
}

.prog-bar-fill { height: 100%; border-radius: 999px; }
.prog-bar-fill.on-track { background: #10b981; }
.prog-bar-fill.at-risk { background: #f59e0b; }
.prog-bar-fill.off-track { background: #ef4444; }

.target-values-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  border-top: 1px dashed #e2e8f0;
  padding-top: 10px;
}

.val-col { display: flex; flex-direction: column; }
.text-right { text-align: right; align-items: flex-end; }
.val-muted { font-size: 0.72rem; color: #64748b; margin-bottom: 2px; }
.val-main { font-size: 0.88rem; color: #1e293b; font-weight: 700; }
.val-main.success { color: #059669; }

.section-title {
  font-size: 0.72rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.6px;
  margin: 0 0 10px 0;
}

.lineage-tree {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lineage-step {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #334155;
}

.lineage-step.indent-1 { padding-left: 10px; }
.lineage-step.indent-2 { padding-left: 20px; }
.lineage-step.indent-3 { padding-left: 30px; }
.lineage-step.indent-4 { padding-left: 40px; }
.lineage-step.indent-5 { padding-left: 50px; }
.lineage-step.indent-6 { padding-left: 60px; }

.step-circle.root {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #1e3a5f;
  flex-shrink: 0;
}

.step-circle.pillar {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #0284c7;
  flex-shrink: 0;
}

.text-dept {
  color: #0284c7;
  font-weight: 600;
}

.sub-arrow { color: #94a3b8; flex-shrink: 0; }

.owner-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.owner-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #0284c7;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
}

.owner-meta { flex: 1; }
.owner-name { font-size: 0.9rem; font-weight: 700; color: #0f172a; margin: 0 0 2px 0; }
.owner-role { font-size: 0.75rem; color: #64748b; }
.open-link-btn { background: transparent; border: none; color: #64748b; cursor: pointer; padding: 4px; }

.dist-header { display: flex; justify-content: space-between; align-items: center; }
.dist-year { font-size: 0.72rem; font-weight: 700; color: #94a3b8; }
.team-dist-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
.team-dist-row { display: flex; flex-direction: column; gap: 4px; }
.team-info { display: flex; justify-content: space-between; font-size: 0.8rem; }
.team-name { color: #1e293b; font-weight: 600; }
.team-krs { color: #0284c7; font-weight: 700; }
.team-bar-track { width: 100%; height: 5px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.team-bar-fill { height: 100%; background: #0284c7; border-radius: 999px; }

.mapped-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #065f46;
}
</style>

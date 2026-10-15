<template>
  <aside v-if="selectedNode" class="node-inspector-panel">
    <!-- Panel Header -->
    <div class="inspector-header">
      <div class="inspector-title-wrap">
        <svg
          class="info-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span class="header-label">Node Inspector</span>
        <span class="node-type-pill" :class="selectedNode.type?.toLowerCase()">
          {{ nodeTypeLabel }}
        </span>
      </div>
      <button class="close-btn" @click="$emit('close')" title="Tutup Inspector">
        ✕
      </button>
    </div>

    <!-- Scrollable Content -->
    <div class="inspector-body">
      <!-- Title & Description -->
      <div class="node-intro">
        <h2 class="node-title">{{ selectedNode.title }}</h2>
        <p v-if="selectedNode.description" class="node-desc">
          {{ selectedNode.description }}
        </p>
      </div>

      <!-- Progress Realisasi Box -->
      <div class="progress-box">
        <div class="prog-top">
          <span class="prog-label">PROGRESS REALISASI</span>
          <span class="prog-val" :class="progressStatusClass"
            >{{ selectedNode.progress ?? 0 }}%</span
          >
        </div>
        <div class="prog-bar-track">
          <div
            class="prog-bar-fill"
            :class="progressStatusClass"
            :style="{
              width:
                Math.min(100, Math.max(0, selectedNode.progress || 0)) + '%',
            }"
          ></div>
        </div>
        <div class="target-values-grid">
          <div class="val-col">
            <span class="val-muted">Target</span>
            <strong class="val-main">{{
              formatVal(selectedNode.targetValue, selectedNode.unit)
            }}</strong>
          </div>
          <div class="val-col text-right">
            <span class="val-muted">Tercapai</span>
            <strong class="val-main success">{{
              formatVal(selectedNode.currentValue, selectedNode.unit)
            }}</strong>
          </div>
        </div>
      </div>

      <!-- Lineage Cascading Section -->
      <div class="inspector-section">
        <h3 class="section-title">LINEAGE CASCADING:</h3>
        <div class="lineage-tree">
          <div class="lineage-step">
            <span class="step-circle root"></span>
            <span class="step-text font-semibold">{{
              lineage.root || "BSC-OKR Suite"
            }}</span>
          </div>
          <div v-if="lineage.pillar" class="lineage-step indent-1">
            <svg
              class="sub-arrow"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span class="step-circle pillar"></span>
            <span class="step-text font-medium">{{ lineage.pillar }}</span>
          </div>
          <div v-if="lineage.objective" class="lineage-step indent-2">
            <svg
              class="sub-arrow"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span class="step-text">Obj: {{ lineage.objective }}</span>
          </div>
          <div v-if="lineage.team" class="lineage-step indent-3">
            <svg
              class="sub-arrow"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span class="step-text font-medium text-dept"
              >Team: {{ lineage.team }}</span
            >
          </div>
          <div v-if="lineage.kr" class="lineage-step indent-4">
            <svg
              class="sub-arrow"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span class="step-text font-semibold">KR: {{ lineage.kr }}</span>
          </div>
          <div v-if="lineage.initiative" class="lineage-step indent-5">
            <svg
              class="sub-arrow"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span class="step-text">Inisiatif: {{ lineage.initiative }}</span>
          </div>
          <div v-if="lineage.task || lineage.kpi" class="lineage-step indent-6">
            <svg
              class="sub-arrow"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span class="step-text font-semibold text-emerald-700"
              >KPI: {{ lineage.kpi || lineage.task }}</span
            >
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
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
              />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Team Distribution & Relasi Tim FY 2026 -->
      <div class="inspector-section">
        <div class="dist-header">
          <h3 class="section-title">Team Distribution & Relasi KR</h3>
          <span class="dist-year">FY 2026</span>
        </div>

        <!-- 1. Tim Pemilik KR Ini -->
        <div class="kr-team-card">
          <span class="kr-team-label">Tim Penanggung Jawab:</span>
          <span class="kr-team-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            {{ primaryTeamName }}
          </span>
        </div>

        <!-- 2. Tim Eksekutor Inisiatif Terkait -->
        <div v-if="initiativeTeams.length > 0" class="rel-subsection">
          <div class="rel-subtitle">
            Tim Eksekutor Inisiatif ({{ initiativeTeams.length }} Tim):
          </div>
          <div class="exec-teams-list">
            <div v-for="it in initiativeTeams" :key="it.teamName" class="exec-team-item">
              <div class="exec-team-head">
                <span class="exec-team-name">{{ it.teamName }}</span>
                <span class="exec-team-count">{{ it.initiatives.length }} Inisiatif</span>
              </div>
              <div class="exec-inits-tags">
                <span v-for="init in it.initiatives" :key="init.id" class="exec-init-chip" :title="init.title">
                  {{ init.title }} ({{ init.progress || 0 }}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Relasi ke KR dari Tim Lain (Dalam 1 Objective Strategis) -->
        <div class="rel-subsection">
          <div class="rel-subtitle">
            Relasi KR Tim Lain (Objective: {{ activeKr?.objectiveTitle || lineage.objective || 'Strategis' }}):
          </div>

          <div v-if="siblingTeamKrs.length > 0" class="sibling-krs-list">
            <div
              v-for="sib in siblingTeamKrs"
              :key="sib.id"
              class="sibling-kr-item"
              @click="$emit('select-node', sib)"
            >
              <span class="sib-team-pill">{{ sib.teamName }}</span>
              <div class="sib-kr-content">
                <span class="sib-kr-title">{{ sib.title }}</span>
                <div class="sib-kr-meta">
                  <span class="sib-status-dot" :class="sib.status?.toLowerCase().replace('_', '-')"></span>
                  <span class="sib-status-txt">{{ sib.status?.replace('_', ' ') }}</span>
                  <span class="sib-prog-txt">{{ sib.progress }}%</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-rel-msg">
            <span>KR ini merupakan fokus tunggal pada objective terkait.</span>
          </div>
        </div>

        <!-- 4. Causal Links Relasi Lintas Tim -->
        <div v-if="causalLinksData.outbound.length > 0 || causalLinksData.inbound.length > 0" class="rel-subsection">
          <div class="rel-subtitle">Relasi Kausalitas Lintas Tim:</div>
          <div class="causal-links-list">
            <div v-for="link in causalLinksData.inbound" :key="link.id" class="causal-link-item inbound">
              <span class="causal-tag in">Dipengaruhi:</span>
              <span class="causal-team-tag">{{ link.sourceTeams.join(', ') || 'Tim Lain' }}</span>
              <span class="causal-title">{{ link.sourceKrTitle }}</span>
            </div>
            <div v-for="link in causalLinksData.outbound" :key="link.id" class="causal-link-item outbound">
              <span class="causal-tag out">Mempengaruhi:</span>
              <span class="causal-team-tag">{{ link.targetTeams.join(', ') || 'Tim Lain' }}</span>
              <span class="causal-title">{{ link.targetKrTitle }}</span>
            </div>
          </div>
        </div>

        <!-- 5. Collapsible: Company-wide Team Distribution -->
        <div class="company-dist-toggle" @click="showCompanyDist = !showCompanyDist">
          <span>{{ showCompanyDist ? 'Sembunyikan' : 'Lihat' }} Distribusi Seluruh Tim</span>
          <svg class="chevron-icon" :class="{ rotated: showCompanyDist }" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        <div v-if="showCompanyDist" class="team-dist-list mt-2">
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

        <div class="mapped-badge mt-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2">
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
import { ref, computed } from "vue";

const props = defineProps<{
  selectedNode: any;
  teamDistribution: Array<{
    name: string;
    krCount: number;
    percentage: number;
  }>;
  perspectives?: any[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "select-node", node: any): void;
}>();

const showCompanyDist = ref(false);

function extractKrTeam(kr: any): string {
  if (!kr) return "Lintas Tim";
  if (kr.departments && kr.departments.length > 0) {
    const d = kr.departments[0];
    return typeof d === "string" ? d : d.department || d.name || "Tim";
  }
  if (kr.initiatives && kr.initiatives.length > 0 && kr.initiatives[0]?.team?.name) {
    return kr.initiatives[0].team.name;
  }
  const match = kr.title?.match(/^\[([^\]]+)\]/);
  if (match) return match[1];
  return kr.lineage?.team || "Lintas Tim";
}

const activeKr = computed(() => {
  if (!props.selectedNode) return null;
  if (props.selectedNode.type === "KR") return props.selectedNode;
  if (props.selectedNode.parentKr) return props.selectedNode.parentKr;
  const targetId = props.selectedNode.keyResultId || props.selectedNode.id;
  const targetTitle = props.selectedNode.krTitle || props.selectedNode.title;
  for (const p of props.perspectives || []) {
    for (const obj of p.objectives || []) {
      for (const kr of obj.keyResults || []) {
        if (kr.id === targetId || kr.title === targetTitle) {
          return { ...kr, objectiveTitle: obj.title, perspective: p.name };
        }
      }
    }
  }
  return null;
});

const primaryTeamName = computed(() => {
  const kr = activeKr.value || props.selectedNode;
  return extractKrTeam(kr);
});

const initiativeTeams = computed(() => {
  const kr = activeKr.value || props.selectedNode;
  if (!kr?.initiatives || kr.initiatives.length === 0) return [];
  const map = new Map<string, { teamName: string; initiatives: any[] }>();
  for (const init of kr.initiatives) {
    const tName = init.team?.name || extractKrTeam(kr);
    if (!map.has(tName)) {
      map.set(tName, { teamName: tName, initiatives: [] });
    }
    map.get(tName)!.initiatives.push(init);
  }
  return Array.from(map.values());
});

const siblingTeamKrs = computed(() => {
  const kr = activeKr.value || props.selectedNode;
  if (!kr) return [];

  if (kr.siblingKrs && kr.siblingKrs.length > 0) {
    return kr.siblingKrs.map((s: any) => ({
      ...s,
      type: "KR",
      teamName: extractKrTeam(s),
      perspective: kr.perspective,
      objectiveTitle: kr.objectiveTitle || kr.lineage?.objective,
      lineage: {
        root: "BSC-OKR Suite",
        pillar: kr.perspective || kr.lineage?.pillar,
        objective: kr.objectiveTitle || kr.lineage?.objective,
        team: extractKrTeam(s),
        kr: s.title,
      },
    }));
  }

  const krId = kr.id;
  const krTitle = kr.title;
  for (const p of props.perspectives || []) {
    for (const obj of p.objectives || []) {
      const match = (obj.keyResults || []).some((k: any) => k.id === krId || k.title === krTitle);
      if (match) {
        return (obj.keyResults || [])
          .filter((k: any) => k.id !== krId && k.title !== krTitle)
          .map((s: any) => ({
            ...s,
            type: "KR",
            teamName: extractKrTeam(s),
            perspective: p.name,
            objectiveTitle: obj.title,
            lineage: {
              root: "BSC-OKR Suite",
              pillar: p.name,
              objective: obj.title,
              team: extractKrTeam(s),
              kr: s.title,
            },
          }));
      }
    }
  }

  return [];
});

const causalLinksData = computed(() => {
  const kr = activeKr.value || props.selectedNode;
  return kr?.causalLinks || { outbound: [], inbound: [] };
});

const nodeTypeLabel = computed(() => {
  const type = props.selectedNode?.type?.toUpperCase() || "NODE";
  if (type === "ROOT") return "ROOT BSC";
  if (type === "PILLAR") return "PILAR BSC";
  if (type === "OBJECTIVE") return "OBJECTIVE";
  if (type === "KR") return "KEY RESULT";
  if (type === "INITIATIVE") return "INISIATIF";
  if (type === "TASK" || type === "KPI") return "KPI";
  return type;
});

const progressStatusClass = computed(() => {
  const p = props.selectedNode?.progress ?? 0;
  if (p >= 70) return "on-track";
  if (p >= 40) return "at-risk";
  return "off-track";
});

const lineage = computed(() => {
  return (
    props.selectedNode?.lineage || {
      root: "BSC-OKR Suite",
      pillar: props.selectedNode?.perspective || null,
      objective: props.selectedNode?.objectiveTitle || null,
      team:
        props.selectedNode?.teamName ||
        props.selectedNode?.departments?.[0] ||
        null,
      kr: props.selectedNode?.krTitle || null,
      initiative: props.selectedNode?.initiativeTitle || null,
      task:
        props.selectedNode?.taskTitle ||
        (props.selectedNode?.type === "KPI" ||
        props.selectedNode?.type === "TASK"
          ? props.selectedNode?.title
          : null),
      kpi:
        props.selectedNode?.taskTitle ||
        (props.selectedNode?.type === "KPI" ||
        props.selectedNode?.type === "TASK"
          ? props.selectedNode?.title
          : null),
    }
  );
});

const ownerName = computed(() => {
  return (
    props.selectedNode?.owner?.name ||
    props.selectedNode?.assignedLeader?.name ||
    "BSC Skolla Education 2026"
  );
});

const ownerRole = computed(() => {
  return props.selectedNode?.owner?.position || "Owner & Penanggung Jawab";
});

const ownerInitials = computed(() => {
  const parts = ownerName.value.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (ownerName.value.slice(0, 2) || "OK").toUpperCase();
});

function formatVal(val: any, unit?: string) {
  if (val === undefined || val === null) return "-";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  if (unit === "Rp" || unit === "IDR" || num >= 1000000) {
    return "Rp " + num.toLocaleString("id-ID");
  }
  return num.toLocaleString("id-ID") + (unit ? " " + unit : "");
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

.info-icon {
  color: #3b82f6;
}
.header-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

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

.prog-val {
  font-size: 1.1rem;
  font-weight: 800;
}
.prog-val.on-track {
  color: #059669;
}
.prog-val.at-risk {
  color: #d97706;
}
.prog-val.off-track {
  color: #dc2626;
}

.prog-bar-track {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 12px;
}

.prog-bar-fill {
  height: 100%;
  border-radius: 999px;
}
.prog-bar-fill.on-track {
  background: #10b981;
}
.prog-bar-fill.at-risk {
  background: #f59e0b;
}
.prog-bar-fill.off-track {
  background: #ef4444;
}

.target-values-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  border-top: 1px dashed #e2e8f0;
  padding-top: 10px;
}

.val-col {
  display: flex;
  flex-direction: column;
}
.text-right {
  text-align: right;
  align-items: flex-end;
}
.val-muted {
  font-size: 0.72rem;
  color: #64748b;
  margin-bottom: 2px;
}
.val-main {
  font-size: 0.88rem;
  color: #1e293b;
  font-weight: 700;
}
.val-main.success {
  color: #059669;
}

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

.lineage-step.indent-1 {
  padding-left: 10px;
}
.lineage-step.indent-2 {
  padding-left: 20px;
}
.lineage-step.indent-3 {
  padding-left: 30px;
}
.lineage-step.indent-4 {
  padding-left: 40px;
}
.lineage-step.indent-5 {
  padding-left: 50px;
}
.lineage-step.indent-6 {
  padding-left: 60px;
}

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

.sub-arrow {
  color: #94a3b8;
  flex-shrink: 0;
}

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

.owner-meta {
  flex: 1;
}
.owner-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2px 0;
}
.owner-role {
  font-size: 0.75rem;
  color: #64748b;
}
.open-link-btn {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
}

.dist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dist-year {
  font-size: 0.72rem;
  font-weight: 700;
  color: #94a3b8;
}
.team-dist-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}
.team-dist-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.team-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}
.team-name {
  color: #1e293b;
  font-weight: 600;
}
.team-krs {
  color: #0284c7;
  font-weight: 700;
}
.team-bar-track {
  width: 100%;
  height: 5px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}
.team-bar-fill {
  height: 100%;
  background: #0284c7;
  border-radius: 999px;
}

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

/* KR Team & Relations Styling */
.kr-team-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 10px;
  margin-top: 10px;
  margin-bottom: 12px;
}

.kr-team-label {
  font-size: 0.76rem;
  font-weight: 600;
  color: #64748b;
}

.kr-team-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 0.75rem;
  font-weight: 700;
}

.rel-subsection {
  margin-bottom: 12px;
}

.rel-subtitle {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  margin-bottom: 6px;
}

.exec-teams-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.exec-team-item {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
  padding: 6px 8px;
}

.exec-team-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.exec-team-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: #1e293b;
}

.exec-team-count {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 600;
}

.exec-inits-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.exec-init-chip {
  background: #f3e8ff;
  color: #6b21a8;
  border: 1px solid #e9d5ff;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.7rem;
  font-weight: 500;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sibling-krs-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sibling-kr-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sibling-kr-item:hover {
  background: #f0f9ff;
  border-color: #7dd3fc;
  transform: translateX(2px);
}

.sib-team-pill {
  font-size: 0.68rem;
  font-weight: 700;
  background: #ede9fe;
  color: #5b21b6;
  border-radius: 4px;
  padding: 2px 6px;
  flex-shrink: 0;
  margin-top: 1px;
}

.sib-kr-content {
  flex: 1;
  min-width: 0;
}

.sib-kr-title {
  display: block;
  font-size: 0.76rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.3;
  margin-bottom: 3px;
}

.sib-kr-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
}

.sib-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.sib-status-dot.on-track {
  background: #10b981;
}

.sib-status-dot.at-risk {
  background: #f59e0b;
}

.sib-status-dot.off-track {
  background: #ef4444;
}

.sib-status-txt {
  font-weight: 600;
  color: #64748b;
  text-transform: capitalize;
}

.sib-prog-txt {
  font-weight: 700;
  color: #0284c7;
  margin-left: auto;
}

.empty-rel-msg {
  font-size: 0.74rem;
  color: #94a3b8;
  font-style: italic;
  padding: 6px 0;
}

.causal-links-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.causal-link-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
}

.causal-link-item.inbound {
  background: #ecfdf5;
  border: 1px solid #d1fae5;
}

.causal-link-item.outbound {
  background: #eff6ff;
  border: 1px solid #dbeafe;
}

.causal-tag {
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
}

.causal-tag.in {
  color: #047857;
}

.causal-tag.out {
  color: #1d4ed8;
}

.causal-team-tag {
  font-weight: 700;
  color: #0f172a;
}

.causal-title {
  color: #334155;
  font-size: 0.7rem;
}

.company-dist-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #0284c7;
  cursor: pointer;
  padding: 6px 0;
  border-top: 1px dashed #e2e8f0;
  margin-top: 10px;
}

.company-dist-toggle:hover {
  color: #0369a1;
}

.company-dist-toggle .chevron-icon {
  transition: transform 0.2s ease;
}

.company-dist-toggle .chevron-icon.rotated {
  transform: rotate(180deg);
}
</style>

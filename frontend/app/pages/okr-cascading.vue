<template>
  <div class="okr-cascading-page">
    <!-- 1. Top Header Bar -->
    <header class="page-top-header">
      <div class="header-left">
        <!-- Breadcrumbs -->
        <nav class="breadcrumb-trail">
          <span>SKOLLA FY 2026 STRATEGY</span>
          <span class="crumb-separator">›</span>
          <span>ALIGNMENT ENGINE</span>
          <span class="crumb-separator">›</span>
          <span class="crumb-active">CASCADING TREE MAP</span>
        </nav>
        <!-- Title & Live Cascade Badge -->
        <div class="title-row">
          <h1 class="page-main-title">
            Cascading BSC → Objectives → Key Results → Initiatives → KPI
          </h1>
          <span class="live-cascade-badge">
            <span class="pulse-dot"></span>
            Live Cascade
          </span>
        </div>
      </div>

      <!-- Header Action Controls -->
      <div class="header-right">
        <!-- View Switcher -->
        <div class="view-switch-group">
          <button
            type="button"
            class="switch-btn"
            :class="{ active: viewMode === 'mindmap' }"
            @click="viewMode = 'mindmap'"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Mind Map View</span>
          </button>
          <button
            type="button"
            class="switch-btn"
            :class="{ active: viewMode === 'matrix' }"
            @click="viewMode = 'matrix'"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span>Matrix Table</span>
          </button>
        </div>

        <!-- Zoom Controls (Mind Map) -->
        <div v-if="viewMode === 'mindmap'" class="zoom-controls-group">
          <button type="button" class="zoom-btn" title="Zoom Out" @click="zoomOut">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <span class="zoom-text">{{ zoomLevel }}%</span>
          <button type="button" class="zoom-btn" title="Zoom In" @click="zoomIn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <button type="button" class="zoom-btn" title="Reset Zoom" @click="resetZoom">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
        </div>

        <!-- Expand / Collapse All -->
        <button type="button" class="action-btn-outline" @click="toggleExpandAll">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="7 13 12 18 17 13" />
            <polyline points="7 6 12 11 17 6" />
          </svg>
          <span>{{ isAllExpanded ? 'Collapse All' : 'Expand All' }}</span>
        </button>

        <!-- Export -->
        <button type="button" class="action-btn-primary" @click="exportView">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Export SVG / PDF</span>
        </button>
      </div>
    </header>

    <!-- 2. Filter & Search Bar -->
    <div class="filter-toolbar">
      <!-- Search Input -->
      <div class="search-input-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          v-model="filters.search"
          type="text"
          placeholder="Cari Objective, Team, atau Key Result (e.g..."
          class="search-input"
          @input="debouncedFetch"
        />
        <button v-if="filters.search" class="clear-search-btn" @click="filters.search = ''; fetchCascadingData()">✕</button>
      </div>

      <!-- Filters Dropdowns -->
      <div class="dropdowns-row">
        <!-- Perspektif BSC -->
        <div class="filter-dropdown">
          <span class="dropdown-prefix">PERSPEKTIF:</span>
          <select v-model="filters.perspective" class="select-control" @change="fetchCascadingData">
            <option value="ALL">All Perspectives (4)</option>
            <option value="FINANCIAL">Finance</option>
            <option value="CUSTOMER">Customer</option>
            <option value="INTERNAL_PROCESS">Internal Process</option>
            <option value="LEARNING_GROWTH">Learning & Growth</option>
          </select>
        </div>

        <!-- Tahun -->
        <div class="filter-dropdown">
          <span class="dropdown-prefix">TAHUN:</span>
          <select v-model="filters.year" class="select-control" @change="fetchCascadingData">
            <option value="FY 2026">FY 2026 (Annual)</option>
            <option value="2026">2026</option>
            <option value="Q3-2026">Q3-2026</option>
            <option value="ALL">Semua Tahun</option>
          </select>
        </div>

        <!-- Kuartal (Requested) -->
        <div class="filter-dropdown">
          <span class="dropdown-prefix">KUARTAL:</span>
          <select v-model="filters.quarter" class="select-control" @change="fetchCascadingData">
            <option value="ALL">Semua Kuartal</option>
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
            <option value="Annual">Annual</option>
          </select>
        </div>

        <!-- Sprint (Requested) -->
        <div class="filter-dropdown">
          <span class="dropdown-prefix">SPRINT:</span>
          <select v-model="filters.sprintId" class="select-control" @change="fetchCascadingData">
            <option value="ALL">Semua Sprint</option>
            <option v-for="sp in filterOptions.sprints" :key="sp.id" :value="sp.id">
              {{ sp.name }}
            </option>
          </select>
        </div>

        <!-- Team (Requested) -->
        <div class="filter-dropdown">
          <span class="dropdown-prefix">TEAM:</span>
          <select v-model="filters.teamId" class="select-control" @change="fetchCascadingData">
            <option value="ALL">Semua Tim</option>
            <option v-for="t in filterOptions.teams" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
        </div>

        <!-- Nama Employee (Requested) -->
        <div class="filter-dropdown">
          <span class="dropdown-prefix">EMPLOYEE:</span>
          <select v-model="filters.employeeId" class="select-control" @change="fetchCascadingData">
            <option value="ALL">Semua Karyawan</option>
            <option v-for="emp in filterOptions.employees" :key="emp.id" :value="emp.id">
              {{ emp.name }}
            </option>
          </select>
        </div>

        <!-- Status -->
        <div class="filter-dropdown">
          <span class="dropdown-prefix">STATUS:</span>
          <select v-model="filters.status" class="select-control" @change="fetchCascadingData">
            <option value="ALL">Semua Status</option>
            <option value="ON_TRACK">On Track</option>
            <option value="AT_RISK">At Risk</option>
            <option value="OFF_TRACK">Off Track</option>
          </select>
        </div>
        <!-- Active KRs Badge -->
        <div class="active-krs-pill">
          <span class="dot-green"></span>
          <span>{{ totalActiveKrs }} Active KRs</span>
        </div>
      </div>
    </div>



    <!-- 3. Hierarchy Path Legend Helper -->
    <div class="hierarchy-legend-bar">
      <div class="legend-left">
        <span class="flow-title">HIRARKI ALUR:</span>
        <div class="flow-steps">
          <span class="flow-step suite">Root BSC</span>
          <span class="step-arrow">→</span>
          <span class="flow-step bsc">4 Aspek BSC</span>
          <span class="step-arrow">→</span>
          <span class="flow-step obj">Objective</span>
          <span class="step-arrow">→</span>
          <span class="flow-step kr">Key Result (KR)</span>
          <span class="step-arrow">→</span>
          <span class="flow-step init">Inisiatif</span>
          <span class="step-arrow">→</span>
          <span class="flow-step kpi">KPI</span>
        </div>
      </div>
      <div class="legend-hint">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
        <span>Klik kartu node untuk preview detail lineage</span>
      </div>
    </div>

    <!-- 4. Main Workspace (Canvas / Table + Node Inspector) -->
    <div class="cascading-workspace">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="spinner"></div>
        <span>Memuat data cascading OKR...</span>
      </div>

      <!-- Main Visual View Area -->
      <div class="visual-canvas-wrapper">
        <!-- Mind Map View -->
        <CascadingMindMap
          v-if="viewMode === 'mindmap'"
          ref="mindMapRef"
          :rootData="rootData"
          :perspectives="perspectives"
          :selectedNodeId="selectedNode?.id"
          :zoomLevel="zoomLevel"
          @update:zoomLevel="zoomLevel = $event"
          @select-node="handleNodeSelect"
        />

        <!-- Matrix Table View -->
        <CascadingMatrixTable
          v-else
          :perspectives="perspectives"
          @select-node="handleNodeSelect"
        />
      </div>

      <!-- Right Drawer: Node Inspector -->
      <CascadingInspector
        v-if="selectedNode"
        :selectedNode="selectedNode"
        :teamDistribution="teamDistribution"
        @close="selectedNode = null"
        @select-node="handleNodeSelect"
      />
    </div>

    <!-- 5. Bottom Status Footer -->
    <footer class="cascading-footer">
      <div class="footer-legend">
        <div class="legend-item">
          <span class="legend-dot on-track"></span>
          <span>On Track (&gt;70%)</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot at-risk"></span>
          <span>At Risk (40% – 70%)</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot off-track"></span>
          <span>Off Track (&lt;40%)</span>
        </div>
      </div>
      <div class="footer-engine-sync">
        <span>Skolla BSC Sync Engine v4.2</span>
        <span class="sync-dot">•</span>
        <span>Last automated sync: {{ lastSyncTime }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import CascadingMindMap from '../components/CascadingMindMap.vue';
import CascadingMatrixTable from '../components/CascadingMatrixTable.vue';
import CascadingInspector from '../components/CascadingInspector.vue';

const auth = useAuthStore();
const config = useRuntimeConfig();
const API = config.public?.apiBase || 'http://localhost:3001/api';

const viewMode = ref<'mindmap' | 'matrix'>('mindmap');
const zoomLevel = ref<number>(100);
const isAllExpanded = ref<boolean>(true);
const isLoading = ref<boolean>(false);
const lastSyncTime = ref<string>('Baru saja');
const mindMapRef = ref<any>(null);

const selectedNode = ref<any>(null);

const rootData = reactive({
  title: 'BSC-OKR Suite',
  subtitle: 'SKOLLA STRATEGY 2026',
  year: 'FY 2026',
});

const perspectives = ref<any[]>([]);
const totalActiveKrs = ref<number>(0);
const teamDistribution = ref<any[]>([]);

const filterOptions = reactive({
  perspectives: [] as any[],
  sprints: [] as any[],
  teams: [] as any[],
  employees: [] as any[],
  quarters: ['ALL', 'Q1', 'Q2', 'Q3', 'Q4', 'Annual'],
  years: ['FY 2026', '2026', 'Q3-2026', 'ALL'],
  statuses: [] as any[],
});

const filters = reactive({
  search: '',
  perspective: 'ALL',
  year: 'FY 2026',
  quarter: 'ALL',
  sprintId: 'ALL',
  teamId: 'ALL',
  employeeId: 'ALL',
  status: 'ALL',
});

let debounceTimer: any = null;
function debouncedFetch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchCascadingData();
  }, 350);
}

async function fetchCascadingData() {
  if (!auth.token) return;
  isLoading.value = true;
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.perspective) params.append('perspective', filters.perspective);
    if (filters.year) params.append('year', filters.year);
    if (filters.quarter) params.append('quarter', filters.quarter);
    if (filters.sprintId) params.append('sprintId', filters.sprintId);
    if (filters.teamId) params.append('teamId', filters.teamId);
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.status) params.append('status', filters.status);

    const res = await fetch(`${API}/bsc/cascading-tree?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      perspectives.value = data.perspectives || [];
      totalActiveKrs.value = data.totalActiveKrs || 0;
      teamDistribution.value = data.teamDistribution || [];
      if (data.root) {
        rootData.title = data.root.title;
        rootData.subtitle = data.root.subtitle;
      }
      if (data.filterOptions) {
        filterOptions.sprints = data.filterOptions.sprints || [];
        filterOptions.teams = data.filterOptions.teams || [];
        filterOptions.employees = data.filterOptions.employees || [];
      }
      lastSyncTime.value = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

      if (!selectedNode.value && perspectives.value.length > 0) {
        for (const p of perspectives.value) {
          if (p.objectives?.length > 0) {
            for (const obj of p.objectives) {
              if (obj.keyResults?.length > 0) {
                const firstKr = obj.keyResults[0];
                selectedNode.value = {
                  ...firstKr,
                  type: 'KR',
                  perspective: p.name,
                  objectiveTitle: obj.title,
                  lineage: {
                    pillar: p.name + ' Pillar',
                    objective: obj.title,
                    team: firstKr.departments?.[0] || 'Business Team',
                    kr: firstKr.title,
                  },
                };
                break;
              }
            }
          }
          if (selectedNode.value) break;
        }
      }
    }
  } catch (err) {
    console.error('Fetch cascading tree error:', err);
  } finally {
    isLoading.value = false;
  }
}

function handleNodeSelect(node: any) {
  selectedNode.value = node;
}

function zoomIn() {
  zoomLevel.value = Math.min(180, zoomLevel.value + 10);
}

function zoomOut() {
  zoomLevel.value = Math.max(40, zoomLevel.value - 10);
}

function resetZoom() {
  zoomLevel.value = 100;
  mindMapRef.value?.resetZoom();
}

function toggleExpandAll() {
  isAllExpanded.value = !isAllExpanded.value;
  if (isAllExpanded.value) {
    mindMapRef.value?.expandAll();
  } else {
    mindMapRef.value?.collapseAll();
  }
}

function exportView() {
  if (typeof window !== 'undefined') {
    window.print();
  }
}

onMounted(() => {
  fetchCascadingData();
});
</script>

<style scoped>
.okr-cascading-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  min-height: 700px;
  background: #f8fafc;
  overflow: hidden;
}

.page-top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.breadcrumb-trail {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.crumb-separator { color: #cbd5e1; }
.crumb-active { color: #0284c7; }

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-main-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
}

.live-cascade-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  font-size: 0.72rem;
  font-weight: 700;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.view-switch-group {
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 3px;
  border: 1px solid #e2e8f0;
}

.switch-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.switch-btn.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.zoom-controls-group {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 2px 4px;
}

.zoom-btn {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.zoom-btn:hover { background: #f1f5f9; color: #1e293b; }
.zoom-text { font-size: 0.75rem; font-weight: 700; color: #334155; padding: 0 6px; }

.action-btn-outline {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.action-btn-outline:hover { background: #f8fafc; border-color: #cbd5e1; }

.action-btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: #0284c7;
  border: 1px solid #0284c7;
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.action-btn-primary:hover { background: #0369a1; }

.filter-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.search-input-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 12px;
  min-width: 260px;
}

.search-icon { color: #94a3b8; }
.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.8rem;
  color: #0f172a;
  width: 100%;
}
.clear-search-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.dropdowns-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-dropdown {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 4px 8px;
}

.dropdown-prefix {
  font-size: 0.68rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.4px;
}

.select-control {
  border: none;
  background: transparent;
  font-size: 0.78rem;
  font-weight: 600;
  color: #0f172a;
  outline: none;
  cursor: pointer;
  padding-right: 18px !important;
}

.active-krs-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #0f172a;
}

.dot-green {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}


.hierarchy-legend-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.74rem;
  flex-shrink: 0;
}

.legend-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.flow-title { font-weight: 800; color: #475569; letter-spacing: 0.4px; }
.flow-steps { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

.flow-step {
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.7rem;
}

.flow-step.suite { background: #1e3a5f; color: #fff; }
.flow-step.bsc { background: #1e293b; color: #fff; }
.flow-step.obj { background: #e0f2fe; color: #0369a1; }
.flow-step.kr { background: #0284c7; color: #fff; }
.flow-step.init { background: #7c3aed; color: #fff; }
.flow-step.task,
.flow-step.kpi { background: #10b981; color: #fff; }
.step-arrow { color: #94a3b8; font-weight: 700; }
.legend-hint { display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 0.72rem; }

.cascading-workspace {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 50;
  font-size: 0.85rem;
  font-weight: 600;
  color: #0369a1;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0f2fe;
  border-top-color: #0284c7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.visual-canvas-wrapper {
  flex: 1;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.cascading-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  font-size: 0.72rem;
  color: #64748b;
  flex-shrink: 0;
}

.footer-legend {
  display: flex;
  align-items: center;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-dot.on-track { background: #10b981; }
.legend-dot.at-risk { background: #8b5cf6; }
.legend-dot.off-track { background: #ef4444; }

.footer-engine-sync {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sync-dot { color: #cbd5e1; }
</style>

}

.select-control {
  border: none;
  background: transparent;
  font-size: 0.78rem;
  font-weight: 600;
  color: #0f172a;
  outline: none;
  cursor: pointer;
  padding-right: 18px !important;
}

.active-krs-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #0f172a;
}

.dot-green {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}



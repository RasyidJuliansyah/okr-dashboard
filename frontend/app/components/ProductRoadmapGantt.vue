<template>
  <div class="product-roadmap-gantt">
    <!-- Top Filter & Controls Bar -->
    <div class="roadmap-controls card">
      <div class="controls-left">
        <div class="search-box">
          <svg
            class="search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari domain, epic, atau feature..."
            class="search-input"
          />
          <button
            v-if="searchQuery"
            class="clear-btn"
            @click="searchQuery = ''"
          >
            ✕
          </button>
        </div>

        <div class="status-filters">
          <button
            v-for="st in statusOptions"
            :key="st.value"
            :class="['filter-pill', { active: selectedStatus === st.value }]"
            @click="selectedStatus = st.value"
          >
            <span
              class="pill-dot"
              :style="{ backgroundColor: st.color }"
            ></span>
            {{ st.label }}
          </button>
        </div>
      </div>

      <div class="controls-right">
        <!-- Scale Switcher -->
        <div class="scale-switcher">
          <button
            :class="['scale-btn', { active: viewScale === 'QUARTER' }]"
            @click="viewScale = 'QUARTER'"
          >
            Kuartal
          </button>
          <button
            :class="['scale-btn', { active: viewScale === 'MONTH' }]"
            @click="viewScale = 'MONTH'"
          >
            Bulan
          </button>
        </div>

        <!-- Snap to Week Switcher -->
        <button
          type="button"
          class="snap-toggle-btn"
          :class="{ active: snapToWeek }"
          :title="
            snapToWeek
              ? 'Snap otomatis per Week (W1-W2 & W3-W4) aktif'
              : 'Snap non-aktif (geser bebas harian)'
          "
          @click="snapToWeek = !snapToWeek"
        >
          <span class="snap-icon">⚡</span>
          <span>Snap: {{ snapToWeek ? "Week (W1-W4)" : "Harian" }}</span>
        </button>

        <!-- Role-based actions -->
        <div v-if="canEdit" class="admin-actions">
          <button class="btn-create-domain" @click="openCreateDomain">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Domain Baru</span>
          </button>

          <button
            v-if="domains.length === 0"
            class="btn-seed"
            @click="seedDefaultRoadmap"
          >
            Muat Data Standar Skolla
          </button>
        </div>
        <div
          v-else
          class="view-only-badge"
          title="Hanya Admin & Manager yang dapat mengubah jadwal"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Hanya Lihat (View Only)</span>
        </div>
      </div>
    </div>

    <!-- Progress Color Legend Strip -->
    <div class="progress-legend-strip">
      <div class="legend-title">Warna Progress Fitur:</div>
      <div class="legend-items">
        <div class="legend-badge">
          <span class="legend-color-dot prog-gray"></span>
          <span>0–30% (Abu-abu)</span>
        </div>
        <div class="legend-badge">
          <span class="legend-color-dot prog-red"></span>
          <span>31–70% (Merah)</span>
        </div>
        <div class="legend-badge">
          <span class="legend-color-dot prog-yellow"></span>
          <span>71–99% (Kuning)</span>
        </div>
        <div class="legend-badge">
          <span class="legend-color-dot prog-green"></span>
          <span>100% (Hijau - Ready Release)</span>
        </div>
      </div>
    </div>

    <!-- Alert / Toast Banner -->
    <transition name="fade">
      <div
        v-if="toastMessage"
        class="toast-banner"
        :class="{ 'is-error': isToastError }"
      >
        <span>{{ toastMessage }}</span>
      </div>
    </transition>

    <!-- Loading State -->
    <div v-if="loading" class="gantt-loading card">
      <div class="spinner"></div>
      <p>Memuat peta jalan produk interaktif...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredDomains.length === 0" class="gantt-empty card">
      <div class="empty-icon"></div>
      <h3>Tidak Ada Roadmap Ditemukan</h3>
      <p v-if="searchQuery || selectedStatus !== 'ALL'">
        Tidak ada item yang cocok dengan pencarian atau filter status.
      </p>
      <p v-else>Belum ada domain atau fitur pada roadmap produk saat ini.</p>
      <div v-if="canEdit && domains.length === 0" class="empty-actions">
        <button class="btn-primary" @click="seedDefaultRoadmap">
          Muat Data Standar Skolla Q4 2026 – Q1 2027
        </button>
        <button class="btn-secondary" @click="openCreateDomain">
          Buat Domain Pertama Secara Manual
        </button>
      </div>
    </div>

    <!-- Gantt Chart Main Board -->
    <div v-else class="gantt-board-card card">
      <div class="gantt-layout">
        <!-- LEFT: Hierarchy Tree Column -->
        <div class="gantt-tree-col">
          <div class="tree-header">
            <span class="tree-header-title"
              >STRUKTUR ROADMAP (DOMAIN / EPIC / FEATURE)</span
            >
            <div class="tree-header-actions">
              <button class="btn-text" @click="expandAll">Buka</button>
              <span class="sep">·</span>
              <button class="btn-text" @click="collapseAll">Tutup</button>
            </div>
          </div>

          <div class="tree-rows-container">
            <template v-for="domain in filteredDomains" :key="domain.id">
              <!-- LEVEL 1: DOMAIN ROW -->
              <div class="tree-row domain-row">
                <div class="row-content">
                  <button
                    class="collapse-toggle"
                    @click="toggleDomain(domain.id)"
                  >
                    <span
                      class="arrow-icon"
                      :class="{ open: !collapsedDomains.has(domain.id) }"
                      >▶</span
                    >
                  </button>
                  <span
                    class="domain-color-bar"
                    :style="{ backgroundColor: domain.color }"
                  ></span>
                  <span class="domain-title" :title="domain.name">{{
                    domain.name
                  }}</span>
                  <span class="item-count-badge"
                    >{{ domain.epics.length }} Epic</span
                  >
                </div>
                <div v-if="canEdit" class="row-actions">
                  <button
                    class="btn-icon"
                    title="Tambah Epic"
                    @click="openCreateEpic(domain.id)"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                  <button
                    class="btn-icon"
                    title="Edit Domain"
                    @click="openEditDomain(domain)"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      ></path>
                      <path
                        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                      ></path>
                    </svg>
                  </button>
                  <button
                    class="btn-icon danger"
                    title="Hapus Domain"
                    @click="confirmDeleteDomain(domain)"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path
                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- LEVEL 2 & 3: EPICS & FEATURES -->
              <template v-if="!collapsedDomains.has(domain.id)">
                <template v-for="epic in domain.epics" :key="epic.id">
                  <!-- EPIC ROW -->
                  <div class="tree-row epic-row">
                    <div class="row-content indent-1">
                      <button
                        class="collapse-toggle"
                        @click="toggleEpic(epic.id)"
                      >
                        <span
                          class="arrow-icon"
                          :class="{ open: !collapsedEpics.has(epic.id) }"
                          >▶</span
                        >
                      </button>
                      <span class="epic-title" :title="epic.title">{{
                        epic.title
                      }}</span>
                      <span
                        class="status-chip"
                        :class="getStatusClass(epic.status)"
                      >
                        {{ getStatusLabel(epic.status) }}
                      </span>
                    </div>
                    <div v-if="canEdit" class="row-actions">
                      <button
                        class="btn-icon"
                        title="Tambah Feature"
                        @click="openCreateFeature(epic.id)"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </button>
                      <button
                        class="btn-icon"
                        title="Edit Epic"
                        @click="openEditEpic(epic)"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                          ></path>
                          <path
                            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                          ></path>
                        </svg>
                      </button>
                      <button
                        class="btn-icon danger"
                        title="Hapus Epic"
                        @click="confirmDeleteEpic(epic)"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path
                            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- FEATURE ROWS -->
                  <template v-if="!collapsedEpics.has(epic.id)">
                    <div
                      v-for="feature in epic.features"
                      :key="feature.id"
                      class="tree-row feature-row"
                    >
                      <div class="row-content indent-2">
                        <span class="feature-bullet">•</span>
                        <span class="feature-title" :title="feature.title">{{
                          feature.title
                        }}</span>
                        <span
                          v-if="feature.picName"
                          class="pic-pill"
                          :title="'PIC: ' + feature.picName"
                        >
                          {{ feature.picName }}
                        </span>
                        <span class="progress-pill"
                          >{{ feature.progressPercent }}%</span
                        >
                      </div>
                      <div v-if="canEdit" class="row-actions">
                        <button
                          class="btn-icon"
                          title="Edit Feature"
                          @click="openEditFeature(epic.id, feature)"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <path
                              d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                            ></path>
                            <path
                              d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                            ></path>
                          </svg>
                        </button>
                        <button
                          class="btn-icon danger"
                          title="Hapus Feature"
                          @click="confirmDeleteFeature(feature)"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path
                              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                            ></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </template>
                </template>
              </template>
            </template>
          </div>
        </div>

        <!-- RIGHT: Timeline Grid Column -->
        <div ref="timelineScrollContainer" class="gantt-timeline-col">
          <div
            class="timeline-scroll-inner"
            :style="{ width: timelineTotalWidth + 'px' }"
          >
            <!-- Timeline Header (2-tier: Month/Quarter + W1-W2 | W3-W4) -->
            <div class="timeline-header">
              <div
                v-for="col in timelineColumns"
                :key="col.key"
                class="timeline-header-cell"
                :style="{ width: col.width + 'px' }"
              >
                <!-- Main Header Row (Month / Quarter) -->
                <div class="header-main-row">
                  <span class="header-main-label">{{ col.label }}</span>
                  <span
                    v-if="col.subLabel && viewScale === 'QUARTER'"
                    class="header-sub-label"
                    >({{ col.subLabel }})</span
                  >
                </div>

                <!-- Sub-Columns Row (W1-W2 | W3-W4 for MONTH, or Months for QUARTER) -->
                <div
                  v-if="col.subColumns && col.subColumns.length"
                  class="header-subcols-row"
                >
                  <div
                    v-for="sub in col.subColumns"
                    :key="sub.key"
                    class="timeline-subcol-cell"
                    :style="{ width: sub.width + 'px' }"
                    :title="`${col.label}: ${sub.label} (${sub.subLabel})`"
                  >
                    <span class="subcol-title">{{ sub.label }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Timeline Rows -->
            <div class="timeline-rows-container">
              <!-- Today Line Marker -->
              <div
                v-if="todayOffsetPx !== null"
                class="today-marker-line"
                :style="{ left: todayOffsetPx + 'px' }"
              >
                <div class="today-marker-badge">Hari Ini</div>
              </div>

              <!-- Vertical grid lines with W1-W2 | W3-W4 sub-dividers -->
              <div class="grid-columns-overlay">
                <template
                  v-for="col in timelineColumns"
                  :key="'grid-' + col.key"
                >
                  <template v-if="col.subColumns && col.subColumns.length">
                    <div
                      v-for="(sub, sIdx) in col.subColumns"
                      :key="'grid-' + col.key + '-' + sub.key"
                      class="grid-column-line"
                      :class="{
                        'grid-subcol-divider': sIdx < col.subColumns.length - 1,
                        'grid-month-divider':
                          sIdx === col.subColumns.length - 1,
                      }"
                      :style="{ width: sub.width + 'px' }"
                    ></div>
                  </template>
                  <div
                    v-else
                    class="grid-column-line grid-month-divider"
                    :style="{ width: col.width + 'px' }"
                  ></div>
                </template>
              </div>

              <!-- Rows matching the left tree -->
              <template
                v-for="domain in filteredDomains"
                :key="'tl-dom-' + domain.id"
              >
                <!-- Domain timeline row (backdrop bar) -->
                <div class="tl-row domain-tl-row">
                  <div
                    class="domain-span-bar"
                    :style="getDomainBarStyle(domain)"
                  >
                    <span class="domain-span-label">{{ domain.name }}</span>
                  </div>
                </div>

                <template v-if="!collapsedDomains.has(domain.id)">
                  <template
                    v-for="epic in domain.epics"
                    :key="'tl-epic-' + epic.id"
                  >
                    <!-- Epic timeline row (summary rollup bar) -->
                    <div class="tl-row epic-tl-row">
                      <div
                        v-if="
                          hasValidDates(
                            epic.computedStartDate,
                            epic.computedEndDate,
                          )
                        "
                        class="epic-rollup-bar"
                        :style="
                          getBarPositionStyle(
                            epic.computedStartDate,
                            epic.computedEndDate,
                          )
                        "
                        :title="
                          formatBarTooltip(
                            epic.title,
                            epic.computedStartDate,
                            epic.computedEndDate,
                            epic.computedProgress,
                            epic.status,
                          )
                        "
                      >
                        <div
                          class="epic-progress-fill"
                          :class="getProgressBarColorClass(epic.computedProgress)"
                          :style="{ width: (epic.computedProgress || 0) + '%' }"
                        ></div>
                        <span class="epic-bar-label"
                          >{{ epic.title }} ({{
                            epic.computedProgress || 0
                          }}%)</span
                        >
                      </div>
                      <div v-else class="bar-empty-notice">
                        Belum ada tanggal
                      </div>
                    </div>

                    <!-- Feature timeline rows (Interactive Bars) -->
                    <template v-if="!collapsedEpics.has(epic.id)">
                      <div
                        v-for="feature in epic.features"
                        :key="'tl-feat-' + feature.id"
                        class="tl-row feature-tl-row"
                      >
                        <div
                          v-if="
                            hasValidDates(feature.startDate, feature.endDate)
                          "
                          class="interactive-gantt-bar"
                          :class="[
                            getProgressBarColorClass(feature.progressPercent),
                            {
                              'is-dragging':
                                activeDrag?.featureId === feature.id,
                            },
                          ]"
                          :style="
                            getBarPositionStyle(
                              feature.startDate,
                              feature.endDate,
                            )
                          "
                          :title="
                            formatBarTooltip(
                              feature.title,
                              feature.startDate,
                              feature.endDate,
                              feature.progressPercent,
                              feature.status,
                              feature.picName,
                            )
                          "
                          @click="onBarClick(epic.id, feature)"
                          @mousedown="onBarMouseDown($event, feature, 'move')"
                        >
                          <!-- Left Resize Handle -->
                          <div
                            v-if="canEdit"
                            class="resize-handle handle-left"
                            title="Geser untuk mengubah tanggal mulai"
                            @mousedown.stop="
                              onBarMouseDown($event, feature, 'resize-start')
                            "
                          ></div>

                          <!-- Progress Fill inside Bar -->
                          <div
                            class="bar-progress-fill"
                            :style="{
                              width: (feature.progressPercent || 0) + '%',
                            }"
                          ></div>

                          <!-- Bar Content Label -->
                          <div class="bar-content">
                            <span
                              v-if="
                                formatFeatureWeekTag(
                                  feature.startDate,
                                  feature.endDate,
                                )
                              "
                              class="bar-week-tag"
                            >
                              {{
                                formatFeatureWeekTag(
                                  feature.startDate,
                                  feature.endDate,
                                )
                              }}
                            </span>
                            <span class="bar-name">{{ feature.title }}</span>
                            <span
                              v-if="feature.progressPercent === 100"
                              class="ready-release-tag"
                              title="Fitur Siap Rilis (100%)"
                            >
                              🚀 Ready Release
                            </span>
                            <span v-else class="bar-progress-text">
                              {{ feature.progressPercent }}%
                            </span>
                          </div>

                          <!-- Right Resize Handle -->
                          <div
                            v-if="canEdit"
                            class="resize-handle handle-right"
                            title="Geser untuk mengubah tenggat akhir"
                            @mousedown.stop="
                              onBarMouseDown($event, feature, 'resize-end')
                            "
                          ></div>
                        </div>

                        <div v-else class="bar-empty-notice">
                          <span
                            v-if="canEdit"
                            class="link-set-date"
                            @click="openEditFeature(epic.id, feature)"
                          >
                            + Tentukan tanggal rilis
                          </span>
                          <span v-else>Belum ada tanggal</span>
                        </div>
                      </div>
                    </template>
                  </template>
                </template>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals Component -->
    <RoadmapModals
      :isOpen="modalState.isOpen"
      :modalType="modalState.type"
      :editingItem="modalState.item"
      :defaultDomainId="modalState.defaultDomainId"
      :defaultEpicId="modalState.defaultEpicId"
      :domains="domains"
      :saving="saving"
      @close="modalState.isOpen = false"
      @save-domain="handleSaveDomain"
      @save-epic="handleSaveEpic"
      @save-feature="handleSaveFeature"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, reactive } from "vue";
import { useAuthStore } from "../stores/auth";
import RoadmapModals from "./RoadmapModals.vue";

interface Feature {
  id: string;
  epicId: string;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  progressPercent: number;
  status: string;
  picName: string | null;
  sortOrder: number;
}

interface Epic {
  id: string;
  domainId: string;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  computedStartDate?: string | null;
  computedEndDate?: string | null;
  computedProgress?: number;
  status: string;
  sortOrder: number;
  features: Feature[];
}

interface Domain {
  id: string;
  name: string;
  code: string;
  color: string;
  sortOrder: number;
  epics: Epic[];
}

const auth = useAuthStore();
const config = useRuntimeConfig();

const rawApiBase = config.public.apiBase || "http://localhost:3001/api";
const API_BASE = computed(() => {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return rawApiBase.replace("127.0.0.1", "localhost");
  }
  return rawApiBase;
});

function getAuthToken(): string {
  if (auth.token) return auth.token;
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("auth_token") ||
      localStorage.getItem("token") ||
      ""
    );
  }
  return "";
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const canEdit = computed(() => {
  const user =
    auth.user ||
    (typeof window !== "undefined"
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem("auth_user") || "null");
          } catch {
            return null;
          }
        })()
      : null);
  if (!user) return false;
  const role = user.role;
  return (
    role === "ADMIN" || role === "MANAGER" || user.originalRole === "ADMIN"
  );
});

// State
const domains = ref<Domain[]>([]);
const loading = ref(true);
const saving = ref(false);
const searchQuery = ref("");
const selectedStatus = ref("ALL");
const viewScale = ref<"QUARTER" | "MONTH">("MONTH");
const collapsedDomains = ref<Set<string>>(new Set());
const collapsedEpics = ref<Set<string>>(new Set());
const toastMessage = ref("");
const isToastError = ref(false);

const timelineScrollContainer = ref<HTMLElement | null>(null);

const statusOptions = [
  { value: "ALL", label: "Semua", color: "#64748b" },
  { value: "IN_PROGRESS", label: "Sedang Berjalan", color: "#0e97d6" },
  { value: "PLANNED", label: "Terencana", color: "#64748b" },
  { value: "COMPLETED", label: "Selesai", color: "#10b981" },
  { value: "DELAYED", label: "Tertunda", color: "#ef4444" },
];

function showToast(msg: string, isErr = false) {
  toastMessage.value = msg;
  isToastError.value = isErr;
  setTimeout(() => {
    toastMessage.value = "";
  }, 3500);
}

// Fetch hierarchy data
async function fetchRoadmap() {
  loading.value = true;
  try {
    const res = await $fetch<{ success: boolean; data?: Domain[]; message?: string }>(
      `${API_BASE.value}/roadmap/domains`,
      {
        headers: getAuthHeaders(),
        timeout: 10000,
      },
    );
    if (res && res.success) {
      domains.value = res.data || [];
    } else {
      showToast(res?.message || "Gagal memuat roadmap", true);
    }
  } catch (err: any) {
    console.error("fetchRoadmap error:", err);
    showToast(
      err?.data?.message || err?.message || "Koneksi gagal saat memuat roadmap",
      true,
    );
  } finally {
    loading.value = false;
  }
}

// Seed default Skolla Roadmap data
async function seedDefaultRoadmap() {
  if (!confirm("Muat data default Roadmap Skolla Q4 2026 – Q1 2027?")) return;
  saving.value = true;
  try {
    const res = await $fetch<{ success: boolean; data?: Domain[]; message?: string }>(
      `${API_BASE.value}/roadmap/seed?force=true`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        timeout: 15000,
      },
    );
    if (res && res.success) {
      domains.value = res.data || [];
      showToast("Data roadmap Skolla berhasil dimuat!");
    } else {
      showToast(res?.message || "Gagal memuat data roadmap", true);
    }
  } catch (err: any) {
    showToast(err?.data?.message || err?.message || "Terjadi kesalahan saat memuat data", true);
  } finally {
    saving.value = false;
  }
}

// Watch token hydration
watch(
  () => auth.token,
  (newToken) => {
    if (newToken && domains.value.length === 0 && !loading.value) {
      fetchRoadmap();
    }
  },
);

// Filtering
const filteredDomains = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const st = selectedStatus.value;

  return domains.value
    .map((dom) => {
      const matchDom =
        !q ||
        dom.name.toLowerCase().includes(q) ||
        dom.code.toLowerCase().includes(q);

      const epics = dom.epics
        .map((ep) => {
          const matchEpic = !q || ep.title.toLowerCase().includes(q);

          const features = ep.features.filter((f) => {
            const matchFeat =
              !q ||
              f.title.toLowerCase().includes(q) ||
              (f.picName && f.picName.toLowerCase().includes(q));
            const matchStatus = st === "ALL" || f.status === st;
            return (matchDom || matchEpic || matchFeat) && matchStatus;
          });

          const matchEpicStatus =
            st === "ALL" || ep.status === st || features.length > 0;
          return {
            ...ep,
            features,
            _keep:
              matchEpicStatus && (matchDom || matchEpic || features.length > 0),
          };
        })
        .filter((ep) => ep._keep);

      return {
        ...dom,
        epics,
        _keep: epics.length > 0 || (matchDom && st === "ALL"),
      };
    })
    .filter((dom) => dom._keep);
});

// Expand / Collapse toggles
function toggleDomain(id: string) {
  const next = new Set(collapsedDomains.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  collapsedDomains.value = next;
}

function toggleEpic(id: string) {
  const next = new Set(collapsedEpics.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  collapsedEpics.value = next;
}

function expandAll() {
  collapsedDomains.value = new Set();
  collapsedEpics.value = new Set();
}

function collapseAll() {
  const nextD = new Set<string>();
  const nextE = new Set<string>();
  domains.value.forEach((d) => {
    nextD.add(d.id);
    d.epics.forEach((ep) => nextE.add(ep.id));
  });
  collapsedDomains.value = nextD;
  collapsedEpics.value = nextE;
}

// Timeline Math & Range
const timelineBounds = computed(() => {
  let min = new Date("2026-10-01").getTime();
  let max = new Date("2027-09-30").getTime();

  domains.value.forEach((d) => {
    d.epics.forEach((ep) => {
      if (ep.startDate) {
        const t = new Date(ep.startDate).getTime();
        if (!isNaN(t)) min = Math.min(min, t);
      }
      if (ep.endDate) {
        const t = new Date(ep.endDate).getTime();
        if (!isNaN(t)) max = Math.max(max, t);
      }
      ep.features.forEach((f) => {
        if (f.startDate) {
          const t = new Date(f.startDate).getTime();
          if (!isNaN(t)) min = Math.min(min, t);
        }
        if (f.endDate) {
          const t = new Date(f.endDate).getTime();
          if (!isNaN(t)) max = Math.max(max, t);
        }
      });
    });
  });

  if (isNaN(min) || isNaN(max) || min > max) {
    min = new Date("2026-10-01").getTime();
    max = new Date("2027-09-30").getTime();
  }

  const startDate = new Date(min);
  startDate.setDate(1); // align to month start
  const endDate = new Date(max);
  endDate.setMonth(endDate.getMonth() + 1, 0); // align to month end

  return {
    start: startDate,
    end: endDate,
    totalDays: Math.max(
      30,
      Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1,
    ),
  };
});

const dayWidthPx = computed(() => {
  return viewScale.value === "QUARTER" ? 2.8 : 5.8;
});

const timelineTotalWidth = computed(() => {
  return Math.max(
    1100,
    Math.round(timelineBounds.value.totalDays * dayWidthPx.value),
  );
});

// Columns based on scale (QUARTER with Month subcols, or MONTH with W1-W2 & W3-W4 subcols)
const timelineColumns = computed(() => {
  const { start, end } = timelineBounds.value;
  const cols = [];
  const cur = new Date(start.getTime());

  if (viewScale.value === "QUARTER") {
    // Generate Quarter columns with individual Month subcolumns
    const shortMonthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    let safetyQ = 0;
    while (cur <= end && safetyQ < 40) {
      safetyQ++;
      const year = cur.getFullYear();
      const month = cur.getMonth();
      const qNum = Math.floor(month / 3) + 1;
      const qStartMonth = (qNum - 1) * 3;
      const qStart = new Date(year, qStartMonth, 1);
      const qEnd = new Date(year, qStartMonth + 3, 0);

      const daysInQ =
        Math.round(
          (qEnd.getTime() - qStart.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1;
      const width = daysInQ * dayWidthPx.value;

      const subColumns = [];
      for (let m = 0; m < 3; m++) {
        const curM = qStartMonth + m;
        const curDays = new Date(year, curM + 1, 0).getDate();
        const mPad = String(curM + 1).padStart(2, "0");
        subColumns.push({
          key: `q-sub-${year}-${mPad}`,
          label: shortMonthNames[curM],
          subLabel: `${curDays}h`,
          days: curDays,
          width: curDays * dayWidthPx.value,
          startDate: `${year}-${mPad}-01`,
          endDate: `${year}-${mPad}-${String(curDays).padStart(2, "0")}`,
        });
      }

      cols.push({
        key: `Q${qNum}-${year}`,
        label: `Kuartal ${qNum} ${year}`,
        subLabel: getQuarterSubLabel(qNum, year),
        width,
        subColumns,
      });

      // advance to next quarter
      cur.setFullYear(year, qStartMonth + 3, 1);
    }
  } else {
    // Generate Month columns with W1-W2 and W3-W4 subcolumns
    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    let safetyM = 0;
    while (cur <= end && safetyM < 120) {
      safetyM++;
      const year = cur.getFullYear();
      const month = cur.getMonth();
      const mEnd = new Date(year, month + 1, 0);
      const daysInM = mEnd.getDate();
      const splitDay = daysInM === 28 ? 14 : 15;
      const daysW1W2 = splitDay;
      const daysW3W4 = daysInM - splitDay;

      const width = daysInM * dayWidthPx.value;
      const w1w2Width = daysW1W2 * dayWidthPx.value;
      const w3w4Width = daysW3W4 * dayWidthPx.value;
      const mPad = String(month + 1).padStart(2, "0");

      const subColumns = [
        {
          key: `w1w2-${year}-${mPad}`,
          label: "W1-W2",
          subLabel: `1–${splitDay}`,
          days: daysW1W2,
          width: w1w2Width,
          startDate: `${year}-${mPad}-01`,
          endDate: `${year}-${mPad}-${String(splitDay).padStart(2, "0")}`,
        },
        {
          key: `w3w4-${year}-${mPad}`,
          label: "W3-W4",
          subLabel: `${splitDay + 1}–${daysInM}`,
          days: daysW3W4,
          width: w3w4Width,
          startDate: `${year}-${mPad}-${String(splitDay + 1).padStart(2, "0")}`,
          endDate: `${year}-${mPad}-${String(daysInM).padStart(2, "0")}`,
        },
      ];

      cols.push({
        key: `M-${year}-${mPad}`,
        label: `${monthNames[month]} ${year}`,
        subLabel: `${daysInM} Hari`,
        width,
        subColumns,
      });

      cur.setMonth(cur.getMonth() + 1, 1);
    }
  }

  return cols;
});

const snapToWeek = ref(true);

function formatFeatureWeekTag(
  startStr?: string | null,
  endStr?: string | null,
): string {
  if (!startStr || !endStr) return "";
  const s = new Date(startStr);
  const e = new Date(endStr);
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  const sM = s.getMonth();
  const eM = e.getMonth();
  const sD = s.getDate();
  const eD = e.getDate();
  const sY = s.getFullYear();
  const eY = e.getFullYear();

  const getWeekName = (day: number) => (day <= 15 ? "W1-W2" : "W3-W4");

  if (sY === eY && sM === eM) {
    if (sD <= 15 && eD <= 15) {
      return `${monthNames[sM]} (W1-W2)`;
    } else if (sD >= 16 && eD >= 16) {
      return `${monthNames[sM]} (W3-W4)`;
    } else {
      return `${monthNames[sM]} (W1-W4)`;
    }
  } else {
    return `${monthNames[sM]} ${getWeekName(sD)} – ${monthNames[eM]} ${getWeekName(eD)}`;
  }
}

function snapDateToWeekBoundary(targetDate: Date, isEndDate: boolean): Date {
  const y = targetDate.getFullYear();
  const m = targetDate.getMonth();
  const day = targetDate.getDate();
  const daysInM = new Date(y, m + 1, 0).getDate();
  const splitDay = daysInM === 28 ? 14 : 15;

  if (isEndDate) {
    if (day <= splitDay + Math.round((daysInM - splitDay) / 3)) {
      return new Date(y, m, splitDay);
    } else {
      return new Date(y, m, daysInM);
    }
  } else {
    if (day <= Math.round(splitDay / 2) + 2) {
      return new Date(y, m, 1);
    } else {
      return new Date(y, m, splitDay + 1);
    }
  }
}

function getQuarterSubLabel(q: number, y: number): string {
  if (q === 1) return "Jan - Mar";
  if (q === 2) return "Apr - Jun";
  if (q === 3) return "Jul - Sep";
  return "Okt - Des";
}

// Today Marker
const todayOffsetPx = computed(() => {
  const today = new Date();
  const start = timelineBounds.value.start;
  const end = timelineBounds.value.end;
  if (today < start || today > end) return null;
  const days = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return Math.round(days * dayWidthPx.value);
});

function hasValidDates(
  startStr: string | null | undefined,
  endStr: string | null | undefined,
) {
  return Boolean(startStr && endStr);
}

function getBarPositionStyle(
  startStr: string | null | undefined,
  endStr: string | null | undefined,
) {
  if (!startStr || !endStr) return { display: "none" };
  const start = new Date(startStr);
  const end = new Date(endStr);
  const baseStart = timelineBounds.value.start;

  const startDiff = Math.max(
    0,
    (start.getTime() - baseStart.getTime()) / (1000 * 60 * 60 * 24),
  );
  const duration = Math.max(
    1,
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1,
  );

  const left = Math.round(startDiff * dayWidthPx.value);
  const width = Math.max(34, Math.round(duration * dayWidthPx.value));

  return {
    left: left + "px",
    width: width + "px",
  };
}

function getDomainBarStyle(domain: Domain) {
  let min: number | null = null;
  let max: number | null = null;

  domain.epics.forEach((ep) => {
    const s = ep.computedStartDate || ep.startDate;
    const e = ep.computedEndDate || ep.endDate;
    if (s) {
      const t = new Date(s).getTime();
      if (!isNaN(t)) min = min === null ? t : Math.min(min, t);
    }
    if (e) {
      const t = new Date(e).getTime();
      if (!isNaN(t)) max = max === null ? t : Math.max(max, t);
    }
  });

  if (min === null || max === null || isNaN(min) || isNaN(max)) {
    return { display: "none" };
  }

  const baseStart = timelineBounds.value.start;
  const startDiff = Math.max(
    0,
    (min - baseStart.getTime()) / (1000 * 60 * 60 * 24),
  );
  const duration = Math.max(2, (max - min) / (1000 * 60 * 60 * 24) + 1);

  const left = Math.round(startDiff * dayWidthPx.value);
  const width = Math.max(48, Math.round(duration * dayWidthPx.value));

  return {
    left: left + "px",
    width: width + "px",
    borderColor: domain.color,
    backgroundColor: domain.color + "18",
  };
}

// Interactive Drag & Drop / Resize
interface DragSession {
  featureId: string;
  epicId: string;
  action: "move" | "resize-start" | "resize-end";
  startX: number;
  origStart: Date;
  origEnd: Date;
  curStartStr: string;
  curEndStr: string;
}

const activeDrag = ref<DragSession | null>(null);

function onBarMouseDown(
  e: MouseEvent,
  feature: Feature,
  action: "move" | "resize-start" | "resize-end",
) {
  if (!canEdit.value || !feature.startDate || !feature.endDate) return;
  e.preventDefault();

  const origStart = new Date(feature.startDate);
  const origEnd = new Date(feature.endDate);

  activeDrag.value = {
    featureId: feature.id,
    epicId: feature.epicId,
    action,
    startX: e.clientX,
    origStart,
    origEnd,
    curStartStr: feature.startDate.substring(0, 10),
    curEndStr: feature.endDate.substring(0, 10),
  };

  window.addEventListener("mousemove", onWindowMouseMove);
  window.addEventListener("mouseup", onWindowMouseUp);
}

function onWindowMouseMove(e: MouseEvent) {
  if (!activeDrag.value) return;
  const { action, startX, origStart, origEnd, featureId } = activeDrag.value;
  const deltaX = e.clientX - startX;
  const deltaDays = Math.round(deltaX / dayWidthPx.value);

  let newStart = new Date(origStart.getTime());
  let newEnd = new Date(origEnd.getTime());

  if (action === "move") {
    const rawStartDate = new Date(origStart.getTime() + deltaDays * 86400000);
    const durationMs = origEnd.getTime() - origStart.getTime();

    if (snapToWeek.value) {
      newStart = snapDateToWeekBoundary(rawStartDate, false);
      const approxEnd = new Date(newStart.getTime() + durationMs);
      newEnd = snapDateToWeekBoundary(approxEnd, true);
      if (newEnd <= newStart) {
        newEnd = snapDateToWeekBoundary(
          new Date(newStart.getTime() + 15 * 86400000),
          true,
        );
      }
    } else {
      newStart = rawStartDate;
      newEnd = new Date(rawStartDate.getTime() + durationMs);
    }
  } else if (action === "resize-start") {
    const rawStartDate = new Date(
      origStart.getDate()
        ? origStart.getTime() + deltaDays * 86400000
        : origStart.getTime(),
    );
    newStart = snapToWeek.value
      ? snapDateToWeekBoundary(rawStartDate, false)
      : rawStartDate;
    if (newStart >= newEnd) {
      newStart = new Date(newEnd.getTime() - 86400000);
    }
  } else if (action === "resize-end") {
    const rawEndDate = new Date(origEnd.getTime() + deltaDays * 86400000);
    newEnd = snapToWeek.value
      ? snapDateToWeekBoundary(rawEndDate, true)
      : rawEndDate;
    if (newEnd <= newStart) {
      newEnd = new Date(newStart.getTime() + 86400000);
    }
  }

  const sStr = newStart.toISOString().substring(0, 10);
  const eStr = newEnd.toISOString().substring(0, 10);

  // Update in place optimistically
  for (const d of domains.value) {
    for (const ep of d.epics) {
      const f = ep.features.find((item) => item.id === featureId);
      if (f) {
        f.startDate = sStr;
        f.endDate = eStr;
        activeDrag.value.curStartStr = sStr;
        activeDrag.value.curEndStr = eStr;
        break;
      }
    }
  }
}

async function onWindowMouseUp() {
  window.removeEventListener("mousemove", onWindowMouseMove);
  window.removeEventListener("mouseup", onWindowMouseUp);

  if (!activeDrag.value) return;
  const { featureId, curStartStr, curEndStr } = activeDrag.value;
  activeDrag.value = null;

  try {
    const result = await $fetch<{ success: boolean; message?: string }>(
      `${API_BASE.value}/roadmap/features/${featureId}/dates`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: {
          startDate: curStartStr,
          endDate: curEndStr,
        },
        timeout: 10000,
      },
    );
    if (!result.success) {
      showToast(result.message || "Gagal memperbarui tanggal", true);
      await fetchRoadmap();
    } else {
      showToast(`Jadwal diperbarui: ${curStartStr} s/d ${curEndStr}`);
    }
  } catch (err: any) {
    showToast("Gagal menyimpan perubahan tanggal", true);
    await fetchRoadmap();
  }
}

function onBarClick(epicId: string, feature: Feature) {
  if (canEdit.value) {
    openEditFeature(epicId, feature);
  }
}

// Labels & Formats
function getStatusLabel(st: string) {
  const map: Record<string, string> = {
    PLANNED: "Terencana",
    IN_PROGRESS: "Berjalan",
    COMPLETED: "Selesai",
    DELAYED: "Tertunda",
  };
  return map[st] || st;
}

function getStatusClass(st: string) {
  return "status-" + (st || "PLANNED").toLowerCase().replace("_", "-");
}

function getProgressBarColorClass(percent: number | undefined | null): string {
  const p = Number(percent) || 0;
  if (p >= 100) return "prog-green";
  if (p >= 71) return "prog-yellow";
  if (p >= 31) return "prog-red";
  return "prog-gray";
}

function formatBarTooltip(
  title: string,
  start: string | null | undefined,
  end: string | null | undefined,
  progress: number | undefined,
  status: string,
  pic?: string | null,
) {
  const s = start ? start.substring(0, 10) : "-";
  const e = end ? end.substring(0, 10) : "-";
  const weekTag = formatFeatureWeekTag(start, end);
  const p = progress || 0;
  const pLabel = p === 100 ? "100% (Ready Release)" : `${p}%`;
  return `${title}
Kurun: ${weekTag ? weekTag + " " : ""}(${s} s/d ${e})
Progress: ${pLabel}
Status: ${getStatusLabel(status)}${
    pic
      ? `
PIC: ${pic}`
      : ""
  }`;
}

// Modals management
const modalState = reactive<{
  isOpen: boolean;
  type: "DOMAIN" | "EPIC" | "FEATURE";
  item: any | null;
  defaultDomainId?: string;
  defaultEpicId?: string;
}>({
  isOpen: false,
  type: "DOMAIN",
  item: null,
});

function openCreateDomain() {
  modalState.type = "DOMAIN";
  modalState.item = null;
  modalState.isOpen = true;
}

function openEditDomain(d: Domain) {
  modalState.type = "DOMAIN";
  modalState.item = d;
  modalState.isOpen = true;
}

function openCreateEpic(domainId: string) {
  modalState.type = "EPIC";
  modalState.item = null;
  modalState.defaultDomainId = domainId;
  modalState.isOpen = true;
}

function openEditEpic(ep: Epic) {
  modalState.type = "EPIC";
  modalState.item = ep;
  modalState.isOpen = true;
}

function openCreateFeature(epicId: string) {
  modalState.type = "FEATURE";
  modalState.item = null;
  modalState.defaultEpicId = epicId;
  modalState.isOpen = true;
}

function openEditFeature(epicId: string, feat: Feature) {
  modalState.type = "FEATURE";
  modalState.item = feat;
  modalState.defaultEpicId = epicId;
  modalState.isOpen = true;
}

async function handleSaveDomain(data: any) {
  saving.value = true;
  try {
    const isEdit = Boolean(modalState.item?.id);
    const url = isEdit
      ? `${API_BASE.value}/roadmap/domains/${modalState.item.id}`
      : `${API_BASE.value}/roadmap/domains`;
    const result = await $fetch<{ success: boolean; message?: string }>(url, {
      method: isEdit ? "PUT" : "POST",
      headers: getAuthHeaders(),
      body: data,
      timeout: 10000,
    });
    if (result.success) {
      showToast(isEdit ? "Domain diperbarui" : "Domain baru dibuat");
      modalState.isOpen = false;
      await fetchRoadmap();
    } else {
      showToast(result.message || "Gagal menyimpan domain", true);
    }
  } catch (err: any) {
    showToast("Terjadi kesalahan saat menyimpan", true);
  } finally {
    saving.value = false;
  }
}

async function handleSaveEpic(data: any) {
  saving.value = true;
  try {
    const isEdit = Boolean(modalState.item?.id);
    const url = isEdit
      ? `${API_BASE.value}/roadmap/epics/${modalState.item.id}`
      : `${API_BASE.value}/roadmap/epics`;
    const result = await $fetch<{ success: boolean; message?: string }>(url, {
      method: isEdit ? "PUT" : "POST",
      headers: getAuthHeaders(),
      body: data,
      timeout: 10000,
    });
    if (result.success) {
      showToast(isEdit ? "Epic diperbarui" : "Epic baru dibuat");
      modalState.isOpen = false;
      await fetchRoadmap();
    } else {
      showToast(result.message || "Gagal menyimpan epic", true);
    }
  } catch (err: any) {
    showToast("Terjadi kesalahan saat menyimpan", true);
  } finally {
    saving.value = false;
  }
}

async function handleSaveFeature(data: any) {
  saving.value = true;
  try {
    const isEdit = Boolean(modalState.item?.id);
    const url = isEdit
      ? `${API_BASE.value}/roadmap/features/${modalState.item.id}`
      : `${API_BASE.value}/roadmap/features`;
    const result = await $fetch<{ success: boolean; message?: string }>(url, {
      method: isEdit ? "PUT" : "POST",
      headers: getAuthHeaders(),
      body: data,
      timeout: 10000,
    });
    if (result.success) {
      showToast(isEdit ? "Feature diperbarui" : "Feature baru ditambahkan");
      modalState.isOpen = false;
      await fetchRoadmap();
    } else {
      showToast(result.message || "Gagal menyimpan feature", true);
    }
  } catch (err: any) {
    showToast("Terjadi kesalahan saat menyimpan", true);
  } finally {
    saving.value = false;
  }
}

async function confirmDeleteDomain(d: Domain) {
  if (
    !confirm(
      `Hapus domain "${d.name}" beserta seluruh epic dan feature di dalamnya?`,
    )
  )
    return;
  try {
    const result = await $fetch<{ success: boolean; message?: string }>(
      `${API_BASE.value}/roadmap/domains/${d.id}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        timeout: 10000,
      },
    );
    if (result.success) {
      showToast("Domain dihapus");
      await fetchRoadmap();
    } else {
      showToast(result.message || "Gagal menghapus", true);
    }
  } catch (e) {
    showToast("Gagal menghapus domain", true);
  }
}

async function confirmDeleteEpic(ep: Epic) {
  if (!confirm(`Hapus epic "${ep.title}" beserta feature di dalamnya?`)) return;
  try {
    const result = await $fetch<{ success: boolean; message?: string }>(
      `${API_BASE.value}/roadmap/epics/${ep.id}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        timeout: 10000,
      },
    );
    if (result.success) {
      showToast("Epic dihapus");
      await fetchRoadmap();
    } else {
      showToast(result.message || "Gagal menghapus epic", true);
    }
  } catch (e) {
    showToast("Gagal menghapus epic", true);
  }
}

async function confirmDeleteFeature(feat: Feature) {
  if (!confirm(`Hapus feature "${feat.title}"?`)) return;
  try {
    const result = await $fetch<{ success: boolean; message?: string }>(
      `${API_BASE.value}/roadmap/features/${feat.id}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        timeout: 10000,
      },
    );
    if (result.success) {
      showToast("Feature dihapus");
      await fetchRoadmap();
    } else {
      showToast(result.message || "Gagal menghapus feature", true);
    }
  } catch (e) {
    showToast("Gagal menghapus feature", true);
  }
}

onMounted(() => {
  fetchRoadmap();
});

onUnmounted(() => {
  window.removeEventListener("mousemove", onWindowMouseMove);
  window.removeEventListener("mouseup", onWindowMouseUp);
});
</script>

<style scoped>
.product-roadmap-gantt {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.roadmap-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px 20px;
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  flex: 1 1 480px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 260px;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 36px;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  font-size: 13px;
  background: #f8fafc;
  outline: none;
  transition: all 0.15s ease;
}

.search-input:focus {
  background: #ffffff;
  border-color: #010571;
  box-shadow: 0 0 0 2px rgba(1, 5, 113, 0.1);
}

.clear-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 11px;
}

.status-filters {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #ffffff);
  color: var(--text-muted, #475569);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-pill:hover {
  background: #f1f5f9;
}

.filter-pill.active {
  background: #010571;
  color: #ffffff;
  border-color: #010571;
}

.filter-pill.active .pill-dot {
  background-color: #f2ca17 !important;
}

.pill-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.controls-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.scale-switcher {
  display: inline-flex;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #e2e8f0);
}

.scale-btn {
  padding: 5px 12px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.scale-btn.active {
  background: #ffffff;
  color: #010571;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.admin-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-create-domain {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #010571;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-create-domain:hover {
  background: #0e97d6;
}

.btn-seed {
  background: #f2ca17;
  color: #010571;
  border: 1px solid #deb508;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.view-only-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.toast-banner {
  padding: 10px 16px;
  background: #dcfce7;
  border: 1px solid #86efac;
  color: #166534;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

.toast-banner.is-error {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #991b1b;
}

.gantt-board-card {
  padding: 0;
  background: #ffffff;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.gantt-layout {
  display: flex;
  position: relative;
  min-height: 520px;
}

/* Tree Column (Left) */
.gantt-tree-col {
  width: 360px;
  min-width: 360px;
  max-width: 360px;
  border-right: 2px solid #e2e8f0;
  background: #ffffff;
  z-index: 4;
  display: flex;
  flex-direction: column;
}

.tree-header {
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.tree-header-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #475569;
}

.tree-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.btn-text {
  background: none;
  border: none;
  color: #0e97d6;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-size: 11px;
}

.tree-row {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.1s ease;
}

.tree-row:hover {
  background: #f8fafc;
}

.row-content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.indent-1 {
  padding-left: 20px;
}

.indent-2 {
  padding-left: 44px;
}

.domain-row {
  background: #f8fafc;
  font-weight: 700;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #cbd5e1;
}

.domain-color-bar {
  width: 4px;
  height: 18px;
  border-radius: 2px;
  flex-shrink: 0;
}

.domain-title {
  font-size: 13px;
  color: #010571;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-count-badge {
  font-size: 10px;
  background: #e2e8f0;
  color: #475569;
  padding: 2px 6px;
  border-radius: 999px;
  font-weight: 600;
  flex-shrink: 0;
}

.epic-row {
  font-weight: 600;
  background: #ffffff;
}

.epic-title {
  font-size: 12.5px;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.feature-row {
  background: #ffffff;
  color: #475569;
}

.feature-title {
  font-size: 12px;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pic-pill {
  font-size: 10px;
  background: #e0f2fe;
  color: #0369a1;
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.progress-pill {
  font-size: 10px;
  font-weight: 700;
  color: #0e97d6;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  padding: 1px 5px;
  border-radius: 4px;
  flex-shrink: 0;
}

.collapse-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
}

.arrow-icon {
  display: inline-block;
  font-size: 9px;
  color: #94a3b8;
  transition: transform 0.15s ease;
}

.arrow-icon.open {
  transform: rotate(90deg);
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0.35;
  transition: opacity 0.15s ease;
}

.tree-row:hover .row-actions {
  opacity: 1;
}

.btn-icon {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.btn-icon:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-icon.danger:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Timeline Column (Right) */
.gantt-timeline-col {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  background: #ffffff;
  position: relative;
}

.timeline-scroll-inner {
  position: relative;
  min-height: 100%;
}

.timeline-header {
  height: 56px;
  display: flex;
  background: #f8fafc;
  border-bottom: 2px solid #cbd5e1;
  position: sticky;
  top: 0;
  z-index: 10;
}

.timeline-header-cell {
  display: flex;
  flex-direction: column;
  border-right: 1.5px solid #cbd5e1;
  box-sizing: border-box;
  flex-shrink: 0;
  background: #f8fafc;
}

.header-main-row {
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #f1f5f9;
  border-bottom: 1px solid #cbd5e1;
  padding: 0 4px;
}

.header-main-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #010571;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-sub-label {
  font-size: 10px;
  color: #64748b;
  font-weight: 500;
}

.header-subcols-row {
  height: 30px;
  display: flex;
  width: 100%;
}

.timeline-subcol-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1px dashed #cbd5e1;
  box-sizing: border-box;
  background: #ffffff;
  padding: 1px 2px;
  transition: background 0.15s ease;
  overflow: hidden;
}

.timeline-subcol-cell:last-child {
  border-right: none;
}

.timeline-subcol-cell:hover {
  background: #f0f9ff;
}

.subcol-title {
  font-size: 10.5px;
  font-weight: 700;
  color: #0e97d6;
  line-height: 1.1;
  white-space: nowrap;
}

.subcol-dates {
  font-size: 9px;
  color: #94a3b8;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.timeline-rows-container {
  position: relative;
}

.grid-columns-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  pointer-events: none;
  z-index: 1;
}

.grid-column-line {
  height: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}

.grid-subcol-divider {
  border-right: 1px dashed #f1f5f9;
}

.grid-month-divider {
  border-right: 1.5px solid #e2e8f0;
}

.today-marker-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #ef4444;
  z-index: 5;
  pointer-events: none;
}

.today-marker-badge {
  position: absolute;
  top: -20px;
  left: -24px;
  background: #ef4444;
  color: #ffffff;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.tl-row {
  height: 44px;
  position: relative;
  border-bottom: 1px solid #f1f5f9;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  z-index: 2;
}

.domain-tl-row {
  background: #f8fafc22;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #cbd5e1;
}

.domain-span-bar {
  position: absolute;
  height: 24px;
  border-radius: 6px;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  padding: 0 10px;
  pointer-events: none;
}

.domain-span-label {
  font-size: 11px;
  font-weight: 700;
  color: #010571;
  white-space: nowrap;
}

.epic-tl-row {
  background: transparent;
}

.epic-rollup-bar {
  position: absolute;
  height: 18px;
  border-radius: 5px;
  background: #cbd5e1;
  overflow: hidden;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.epic-progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: #010571;
  opacity: 0.85;
}

.epic-bar-label {
  position: relative;
  z-index: 1;
  padding: 0 8px;
  font-size: 10px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
}

.feature-tl-row {
  background: transparent;
}

/* Interactive Gantt Bar */
.interactive-gantt-bar {
  position: absolute;
  height: 28px;
  border-radius: 6px;
  background: #64748b;
  color: #ffffff;
  display: flex;
  align-items: center;
  cursor: grab;
  user-select: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease;
}

.interactive-gantt-bar:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.interactive-gantt-bar.is-dragging {
  cursor: grabbing;
  opacity: 0.9;
  z-index: 10;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.bar-progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.28);
  pointer-events: none;
}

.bar-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 10px;
  gap: 8px;
  pointer-events: none;
}

.bar-name {
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-progress-text {
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

.resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: ew-resize;
  z-index: 2;
  transition: background 0.15s ease;
}

.resize-handle:hover {
  background: rgba(255, 255, 255, 0.4);
}

.handle-left {
  left: 0;
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}

.handle-right {
  right: 0;
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
}

/* Status Colors */
.status-planned {
  background: #64748b !important;
}

.status-in-progress {
  background: #0e97d6 !important;
}

.status-completed {
  background: #10b981 !important;
}

.status-delayed {
  background: #ef4444 !important;
}

.status-chip {
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  color: #ffffff;
  flex-shrink: 0;
}

.bar-empty-notice {
  padding-left: 16px;
  font-size: 11px;
  font-style: italic;
  color: #94a3b8;
}

.link-set-date {
  color: #0e97d6;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.gantt-loading,
.gantt-empty {
  padding: 48px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.empty-icon {
  font-size: 40px;
}

.empty-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.btn-primary {
  background: #010571;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: #0e97d6;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #b2e3f7;
  border-top-color: #010571;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.bar-week-tag {
  display: inline-flex;
  align-items: center;
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 5px;
  background: rgba(255, 255, 255, 0.28);
  border-radius: 4px;
  color: #ffffff;
  white-space: nowrap;
  letter-spacing: 0.02em;
  flex-shrink: 0;
}

.snap-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.snap-toggle-btn:hover {
  border-color: #0e97d6;
  color: #010571;
}

.snap-toggle-btn.active {
  background: #010571;
  color: #ffffff;
  border-color: #010571;
}

.snap-icon {
  font-size: 13px;
}

/* Progress colors for interactive-gantt-bar (0-30% Gray, 31-70% Red, 71-99% Yellow, 100% Green) */
.interactive-gantt-bar.prog-gray {
  background: #64748b;
  border: 1px solid #475569;
  color: #ffffff;
}
.interactive-gantt-bar.prog-gray:hover {
  background: #475569;
}

.interactive-gantt-bar.prog-red {
  background: #ef4444;
  border: 1px solid #dc2626;
  color: #ffffff;
}
.interactive-gantt-bar.prog-red:hover {
  background: #dc2626;
}

.interactive-gantt-bar.prog-yellow {
  background: #eab308;
  border: 1px solid #ca8a04;
  color: #0f172a;
}
.interactive-gantt-bar.prog-yellow:hover {
  background: #ca8a04;
  color: #ffffff;
}
.interactive-gantt-bar.prog-yellow .bar-name {
  color: inherit;
  font-weight: 700;
}
.interactive-gantt-bar.prog-yellow .bar-progress-text {
  color: inherit;
  font-weight: 800;
}
.interactive-gantt-bar.prog-yellow .bar-week-tag {
  background: rgba(0, 0, 0, 0.15);
  color: inherit;
}

.interactive-gantt-bar.prog-green {
  background: #10b981;
  border: 1px solid #059669;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);
}
.interactive-gantt-bar.prog-green:hover {
  background: #059669;
}

.ready-release-tag {
  font-size: 10px;
  font-weight: 800;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.25);
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
  letter-spacing: 0.02em;
  flex-shrink: 0;
}

/* Epic rollup progress fills */
.epic-progress-fill.prog-gray { background: #64748b; }
.epic-progress-fill.prog-red { background: #ef4444; }
.epic-progress-fill.prog-yellow { background: #eab308; }
.epic-progress-fill.prog-green { background: #10b981; }

/* Progress Legend Strip */
.progress-legend-strip {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  padding: 8px 16px;
  flex-wrap: wrap;
}

.legend-title {
  font-size: 12px;
  font-weight: 700;
  color: #010571;
}

.legend-items {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.legend-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: #334155;
}

.legend-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
}

.legend-color-dot.prog-gray { background: #64748b; border: 1px solid #475569; }
.legend-color-dot.prog-red { background: #ef4444; border: 1px solid #dc2626; }
.legend-color-dot.prog-yellow { background: #eab308; border: 1px solid #ca8a04; }
.legend-color-dot.prog-green { background: #10b981; border: 1px solid #059669; }

</style>

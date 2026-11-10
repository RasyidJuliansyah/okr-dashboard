<template>
  <div class="roadmap-page-root" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- Top Page Header -->
    <div class="roadmap-header card">
      <div class="header-left">
        <div class="title-row">
          <div class="badge-tag">PRODUCT ROADMAP</div>
          <h1 class="page-title">Peta Jalan Produk Skolla (Q4 2026 – 2027)</h1>
        </div>
        <p class="section-desc">
          Perencanaan fitur produk 3 tingkat (Domain, Epic, Feature) dengan linimasa interaktif,
          pelacakan progres, dan sinkronisasi lintas tim.
        </p>

        <!-- Navigation Tabs -->
        <div class="view-tabs">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'GANTT' }"
            @click="activeTab = 'GANTT'"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
              <line x1="8" y1="14" x2="14" y2="14"></line>
              <line x1="8" y1="18" x2="18" y2="18"></line>
            </svg>
            <span>Gantt Chart Interaktif</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === 'STATIC' }"
            @click="activeTab = 'STATIC'"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Dokumen Rilis & Catatan (Arsip)</span>
          </button>
        </div>
      </div>

      <!-- Header actions for static tab -->
      <div v-if="activeTab === 'STATIC'" class="header-actions">
        <button
          type="button"
          class="btn-sync"
          :disabled="syncing"
          @click="syncContent"
          title="Sinkronkan konten dokumen terbaru"
        >
          <svg class="action-icon" :class="{ spin: syncing }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>{{ syncing ? "Menyinkronkan..." : "Sinkronkan Konten" }}</span>
        </button>

        <button type="button" class="btn-secondary" @click="reloadIframe" title="Muat ulang dokumen">
          <svg class="action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          <span>Muat Ulang</span>
        </button>

        <button type="button" class="btn-secondary" @click="toggleFullscreen" title="Tampilan layar penuh">
          <svg class="action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path v-if="!isFullscreen" d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            <path v-else d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
          <span>{{ isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh" }}</span>
        </button>

        <a href="/roadmap/index.html" target="_blank" rel="noopener noreferrer" class="btn-tab" title="Buka di tab baru">
          <svg class="action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <span>Buka Dokumen</span>
        </a>
      </div>
    </div>

    <!-- TAB 1: INTERACTIVE GANTT CHART -->
    <div v-show="activeTab === 'GANTT'" class="tab-content">
      <ProductRoadmapGantt />
    </div>

    <!-- TAB 2: STATIC DOCUMENT VIEWER -->
    <div v-show="activeTab === 'STATIC'" class="tab-content">
      <div class="roadmap-viewer-wrapper" :class="{ 'fullscreen-wrapper': isFullscreen }">
        <div v-if="loadingFrame" class="loading-overlay">
          <div class="spinner"></div>
          <p>Memuat tampilan roadmap produk...</p>
        </div>

        <iframe
          ref="roadmapFrame"
          src="/roadmap/index.html"
          class="roadmap-iframe"
          title="Roadmap Produk Skolla"
          @load="onFrameLoad"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import ProductRoadmapGantt from "../components/ProductRoadmapGantt.vue";

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

const activeTab = ref<"GANTT" | "STATIC">("GANTT");
const roadmapFrame = ref<HTMLIFrameElement | null>(null);
const loadingFrame = ref(true);
const syncing = ref(false);
const isFullscreen = ref(false);

function onFrameLoad() {
  loadingFrame.value = false;
}

watch(activeTab, (tab) => {
  if (tab === "STATIC" && loadingFrame.value) {
    setTimeout(() => {
      loadingFrame.value = false;
    }, 1500);
  }
});

function reloadIframe() {
  if (roadmapFrame.value) {
    loadingFrame.value = true;
    const currentSrc = roadmapFrame.value.src.split("?")[0];
    roadmapFrame.value.src = `${currentSrc}?t=${Date.now()}`;
    setTimeout(() => {
      loadingFrame.value = false;
    }, 4000);
  }
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

async function syncContent() {
  syncing.value = true;
  try {
    const token = getAuthToken();
    const result = await $fetch<{ success: boolean }>(`${API_BASE.value}/roadmap/sync`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 15000,
    });
    if (result && result.success) {
      reloadIframe();
    }
  } catch (err: any) {
    console.error("Sync error:", err);
  } finally {
    syncing.value = false;
  }
}

onMounted(() => {
  // Check if hash matches
  if (typeof window !== "undefined" && window.location.hash === "#arsip") {
    activeTab.value = "STATIC";
  }
  setTimeout(() => {
    loadingFrame.value = false;
  }, 4000);
});
</script>

<style scoped>
.roadmap-page-root {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.roadmap-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
  padding: 24px;
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1 1 540px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.badge-tag {
  background: #010571;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  border-radius: 6px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #010571;
  letter-spacing: -0.01em;
}

.section-desc {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--text-muted, #475569);
  max-width: 740px;
}

.view-tabs {
  display: inline-flex;
  gap: 6px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-top: 4px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: #010571;
}

.tab-btn.active {
  background: #ffffff;
  color: #010571;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-sync {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #010571;
  color: #ffffff;
  border: 1px solid #010571;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-sync:hover:not(:disabled) {
  background: #0e97d6;
  border-color: #0e97d6;
}

.btn-sync:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-card, #ffffff);
  color: var(--text-main, #0f172a);
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-secondary:hover {
  background: var(--bg-hover, #f8fafc);
  border-color: #94a3b8;
}

.btn-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f2ca17;
  color: #010571;
  border: 1px solid #e0b809;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.btn-tab:hover {
  background: #deb508;
}

.action-icon {
  flex-shrink: 0;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.tab-content {
  width: 100%;
}

.roadmap-viewer-wrapper {
  position: relative;
  width: 100%;
  height: calc(100vh - 240px);
  min-height: 800px;
  background: #ffffff;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.roadmap-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.88);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 5;
  color: #010571;
  font-size: 14px;
  font-weight: 500;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #b2e3f7;
  border-top-color: #010571;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #ffffff;
  padding: 12px;
  height: 100vh;
  box-sizing: border-box;
}

.fullscreen-wrapper {
  height: calc(100vh - 120px) !important;
  min-height: auto !important;
}

@media (max-width: 768px) {
  .roadmap-header {
    flex-direction: column;
    padding: 16px;
  }
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  .roadmap-viewer-wrapper {
    height: calc(100vh - 280px);
    min-height: 600px;
  }
}
</style>

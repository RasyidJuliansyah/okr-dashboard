<template>
  <div class="roadmap-page-root" :class="{ 'is-fullscreen': isFullscreen }">
    <div class="roadmap-header card">
      <div class="header-left">
        <div class="title-row">
          <div class="badge-tag">ROADMAP PRODUK</div>
          <h1 class="page-title">Rencana Rilis & Timeline Fitur Q4 2026 – Q1 2027</h1>
        </div>
        <p class="section-desc">
          Peta jalan pengembangan produk Skolla untuk tim Sales, Operation, After Sales, Finance, dan HR.
          Konten terhubung langsung dengan dokumen rencana produk berkala.
        </p>

        <div class="status-row">
          <span class="status-badge" :class="sourceStatusClass">
            <span class="status-indicator"></span>
            <span>{{ sourceStatusText }}</span>
          </span>
          <span v-if="lastSyncedText" class="meta-item">
            Diperbarui: <strong>{{ lastSyncedText }}</strong>
          </span>
          <span v-if="syncMessage" class="sync-msg" :class="{ 'is-error': isSyncError }">
            {{ syncMessage }}
          </span>
        </div>
      </div>

      <div class="header-actions">
        <button
          type="button"
          class="btn-sync"
          :disabled="syncing"
          @click="syncContent"
          title="Sinkronkan konten terbaru dari direktori dokumen lokal"
        >
          <svg class="action-icon" :class="{ spin: syncing }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>{{ syncing ? "Menyinkronkan..." : "Sinkronkan Konten" }}</span>
        </button>

        <button type="button" class="btn-secondary" @click="reloadIframe" title="Muat ulang tampilan roadmap">
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

        <a href="/roadmap/Main.dc.html" target="_blank" rel="noopener noreferrer" class="btn-tab" title="Buka di tab baru">
          <svg class="action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <span>Tab Baru</span>
        </a>
      </div>
    </div>

    <div class="roadmap-viewer-wrapper" :class="{ 'fullscreen-wrapper': isFullscreen }">
      <div v-if="loadingFrame" class="loading-overlay">
        <div class="spinner"></div>
        <p>Memuat tampilan roadmap produk...</p>
      </div>

      <iframe
        ref="roadmapFrame"
        :src="iframeUrl"
        class="roadmap-iframe"
        title="Dokumen Roadmap Produk"
        @load="onIframeLoad"
      ></iframe>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";

// ponytail: embedded iframe viewer; upgrade path: server-rendered micro-frontend when DC tool exports native Vue.
const auth = useAuthStore();
const config = useRuntimeConfig();

const syncing = ref(false);
const loadingFrame = ref(true);
const isFullscreen = ref(false);
const cacheKey = ref(Date.now());
const roadmapFrame = ref(null);

const sourceExists = ref(false);
const sourceDir = ref("");
const lastModified = ref("");
const syncMessage = ref("");
const isSyncError = ref(false);

const iframeUrl = computed(() => `/roadmap/Main.dc.html?t=${cacheKey.value}`);

const sourceStatusClass = computed(() => (sourceExists.value ? "is-connected" : "is-bundled"));

const sourceStatusText = computed(() =>
  sourceExists.value ? "Folder Sumber Lokal Terhubung" : "Menggunakan Arsip Bundel"
);

const lastSyncedText = computed(() => {
  if (!lastModified.value) return "";
  try {
    const d = new Date(lastModified.value);
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return lastModified.value;
  }
});

function onIframeLoad() {
  loadingFrame.value = false;
}

function reloadIframe() {
  loadingFrame.value = true;
  cacheKey.value = Date.now();
  if (roadmapFrame.value) {
    roadmapFrame.value.src = iframeUrl.value;
  }
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

async function fetchStatus() {
  const API = config.public?.apiBase || "http://localhost:3001/api";
  try {
    const res = await fetch(`${API}/roadmap/status`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (res.ok) {
      const data = await res.json();
      sourceExists.value = Boolean(data.sourceExists);
      sourceDir.value = data.sourceDir || "";
      lastModified.value = data.sourceLastModified || data.targetLastModified || "";
    }
  } catch {
    sourceExists.value = false;
  }
}

async function syncContent() {
  if (syncing.value) return;
  syncing.value = true;
  syncMessage.value = "Menyinkronkan dokumen...";
  isSyncError.value = false;

  const API = config.public?.apiBase || "http://localhost:3001/api";
  try {
    const res = await fetch(`${API}/roadmap/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
    });

    const data = await res.json();
    if (res.ok && data.success) {
      lastModified.value = data.lastModified;
      sourceExists.value = true;
      syncMessage.value = "Berhasil disinkronkan!";
      isSyncError.value = false;
      reloadIframe();
      setTimeout(() => {
        syncMessage.value = "";
      }, 4000);
    } else {
      syncMessage.value = data.message || "Folder sumber tidak ditemukan di server lokal.";
      isSyncError.value = true;
    }
  } catch {
    syncMessage.value = "Gagal memanggil endpoint sinkronisasi.";
    isSyncError.value = true;
  } finally {
    syncing.value = false;
  }
}

onMounted(() => {
  fetchStatus();
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
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  padding: 20px 24px;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.header-left {
  flex: 1 1 520px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.badge-tag {
  background: #010571;
  color: #f2ca17;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-block;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main, #0f172a);
  letter-spacing: -0.01em;
}

.section-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-muted, #64748b);
  max-width: 820px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 4px;
  font-size: 13px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 500;
  font-size: 12px;
}

.status-badge.is-connected {
  background: #e6f9ed;
  color: #15803d;
}

.status-badge.is-connected .status-indicator {
  background: #22c55e;
}

.status-badge.is-bundled {
  background: #eff6ff;
  color: #1d4ed8;
}

.status-badge.is-bundled .status-indicator {
  background: #3b82f6;
}

.status-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.meta-item {
  color: var(--text-muted, #64748b);
}

.meta-item strong {
  color: var(--text-main, #0f172a);
}

.sync-msg {
  font-size: 12px;
  font-weight: 600;
  color: #16a34a;
}

.sync-msg.is-error {
  color: #dc2626;
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
  transition: all 0.15s ease;
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
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.roadmap-viewer-wrapper {
  position: relative;
  width: 100%;
  height: calc(100vh - 220px);
  min-height: 820px;
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

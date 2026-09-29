<template>
  <div class="strategy-map-page">
    <!-- Top Header Bar -->
    <header class="page-topbar">
      <div class="topbar-left">
        <div class="brand-tag">BSC STRATEGY MAP 2026</div>
        <h1 class="page-title">Perubahan KR & KPI Skolla 2026</h1>
      </div>

      <div class="topbar-right">
        <div class="tab-pill-nav">
          <button
            v-for="t in tabs"
            :key="t.id"
            class="tab-pill-btn"
            :class="{ active: activeTab === t.id }"
            @click="switchTab(t.id)"
          >
            {{ t.name }}
          </button>
        </div>

        <div class="view-mode-toggle">
          <button
            class="mode-btn"
            :class="{ active: viewMode === 'ringkas' }"
            @click="viewMode = 'ringkas'"
          >
            Ringkas
          </button>
          <button
            class="mode-btn"
            :class="{ active: viewMode === 'pengecekan' }"
            @click="viewMode = 'pengecekan'"
          >
            Pengecekan
          </button>
        </div>

        <button
          v-if="isAdmin"
          class="admin-action-btn"
          @click="showLinkModal = true"
          title="Kelola data relasi kausalitas"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Kelola Relasi</span>
        </button>
      </div>
    </header>

    <!-- Metrics & Legend Sub-bar -->
    <div class="stats-legend-bar">
      <div class="stats-pills">
        <span class="stat-badge">
          <strong class="stat-num">{{ objectives.length }}</strong> node
          <span class="stat-sub">({{ laneCounts }})</span>
        </span>
        <span class="stat-badge">
          <strong class="stat-num">{{ totalKrCount }}</strong> KR (termasuk KR baru)
        </span>
        <span class="stat-badge">
          <strong class="stat-num">{{ links.length }}</strong> panah kausalitas
        </span>
      </div>

      <div class="legend-items">
        <div class="legend-item">
          <span class="legend-line solid"></span>
          <span>Sebab-akibat (driver / outcome)</span>
        </div>
        <div class="legend-item">
          <span class="legend-line dashed"></span>
          <span>Verifikasi / lompat perspektif</span>
        </div>
        <div class="legend-item">
          <span class="legend-box pending"></span>
          <span>Menunggu keputusan (K1–K8)</span>
        </div>
      </div>
    </div>

    <!-- Active Filter/Focus Notice if any -->
    <div v-if="selectedNodeId" class="focus-alert-bar">
      <div class="focus-info">
        <span class="focus-dot"></span>
        <span>
          Menyorot <strong>{{ selectedNode?.code }}: {{ selectedNode?.title }}</strong>
          — {{ incomingLinks(selectedNodeId).length }} Driver pendorong &
          {{ outgoingLinks(selectedNodeId).length }} Dampak lanjutan
        </span>
      </div>
      <button class="clear-focus-btn" @click="resetFocus">
        ✕ Batalkan Fokus (Esc)
      </button>
    </div>

    <!-- Main Workspace: Canvas + Sidebar -->
    <div class="workspace-layout">
      <!-- Left/Main Canvas Area -->
      <div
        ref="canvasWrapperRef"
        class="canvas-area-wrapper"
        @click="handleCanvasClick"
      >
        <div ref="boardRef" class="board-container">
          <!-- SVG Connections Overlay -->
          <svg class="svg-connections-layer" :style="{ width: svgWidth + 'px', height: svgHeight + 'px' }">
            <defs>
              <!-- Arrowhead markers -->
              <marker
                id="arrow-solid"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#00d2ff" />
              </marker>
              <marker
                id="arrow-solid-dimmed"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(0, 210, 255, 0.2)" />
              </marker>
              <marker
                id="arrow-dashed"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#fbbf24" />
              </marker>
            </defs>

            <!-- Render all connection edges -->
            <g class="edges-group">
              <path
                v-for="edge in computedEdgePaths"
                :key="edge.id"
                :d="edge.d"
                :class="[
                  'edge-path',
                  edge.type,
                  {
                    highlighted: edge.isHighlighted,
                    dimmed: selectedNodeId && !edge.isHighlighted,
                  },
                ]"
                :marker-end="getMarker(edge)"
              />
            </g>
          </svg>

          <!-- 4 BSC Swimlanes -->
          <div
            v-for="lane in swimlanes"
            :key="lane.key"
            :class="['swimlane-row', lane.key.toLowerCase()]"
          >
            <!-- Vertical Swimlane Label -->
            <div class="swimlane-label-col">
              <div class="label-vertical-text">
                <span class="lane-title">{{ lane.label }}</span>
                <span class="lane-counter">{{ getObjectivesByLane(lane.key).length }} obj</span>
              </div>
            </div>

            <!-- Swimlane Nodes Grid -->
            <div class="swimlane-cards-col">
              <div
                v-for="node in getObjectivesByLane(lane.key)"
                :id="'node-' + node.id"
                :key="node.id"
                :ref="(el) => setNodeRef(node.id, el)"
                class="strategic-card"
                :class="{
                  'has-decision': !!node.decisionTag,
                  active: selectedNodeId === node.id,
                  'is-driver': isUpstreamNode(node.id),
                  'is-outcome': isDownstreamNode(node.id),
                  dimmed: selectedNodeId && !isRelatedNode(node.id),
                }"
                @click.stop="selectNode(node.id)"
              >
                <!-- Card Top: Tags & Decision Pill -->
                <div class="card-header-tags">
                  <span class="kr-count-pill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 14 14" />
                    </svg>
                    {{ node.krCount }} KR
                  </span>

                  <span v-if="node.decisionTag" class="decision-pill" :title="'Menunggu Keputusan ' + node.decisionTag">
                    {{ node.decisionTag }}
                  </span>
                </div>

                <!-- Card Body: Code & Title -->
                <div class="card-main-info">
                  <span class="node-code">{{ node.code }}</span>
                  <h3 class="node-title">{{ node.title }}</h3>
                </div>

                <!-- Card Footer: Departments -->
                <div class="card-depts-footer">
                  <span class="dept-text">{{ node.departments.join(" • ") }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidepanel: Objective Browser / Detail Inspector -->
      <aside class="side-inspector card">
        <!-- DETAIL VIEW when a node is selected -->
        <div v-if="selectedNode" class="inspector-detail">
          <div class="detail-header">
            <div class="detail-title-group">
              <span class="lane-chip" :class="selectedNode.perspective.toLowerCase()">
                {{ formatPerspective(selectedNode.perspective) }}
              </span>
              <span v-if="selectedNode.decisionTag" class="decision-pill">
                {{ selectedNode.decisionTag }}
              </span>
            </div>
            <button class="close-btn" @click="resetFocus" title="Tutup Detail">
              ✕
            </button>
          </div>

          <h2 class="detail-heading">
            <span class="detail-code">{{ selectedNode.code }}.</span>
            {{ selectedNode.title }}
          </h2>

          <div class="detail-dept-badge">
            <span class="label-mini">Departemen:</span>
            <strong>{{ selectedNode.departments.join(", ") }}</strong>
          </div>

          <!-- Quick Relationship Stats -->
          <div class="detail-stats-grid">
            <div class="stat-box">
              <span class="num">{{ incomingLinks(selectedNode.id).length }}</span>
              <span class="lbl">Driver Masuk</span>
            </div>
            <div class="stat-box">
              <span class="num">{{ outgoingLinks(selectedNode.id).length }}</span>
              <span class="lbl">Dampak Keluar</span>
            </div>
            <div class="stat-box">
              <span class="num">{{ selectedNode.krCount }}</span>
              <span class="lbl">Total KR</span>
            </div>
          </div>

          <!-- Key Results Section -->
          <div class="detail-section">
            <h4 class="section-title">
              Key Results Terkait
              <span class="badge-count">{{ selectedNode.keyResults.length }}</span>
            </h4>
            <div class="kr-list-container">
              <div
                v-for="(kr, idx) in selectedNode.keyResults"
                :key="idx"
                class="kr-item-row"
              >
                <span class="kr-index">{{ idx + 1 }}.</span>
                <span class="kr-desc">{{ kr }}</span>
              </div>
            </div>
          </div>

          <!-- Causal Relations (Incoming: Drivers) -->
          <div class="detail-section">
            <h4 class="section-title">
              Didorong Oleh (Driver / Sebab)
              <span class="badge-count">{{ incomingLinks(selectedNode.id).length }}</span>
            </h4>
            <div v-if="incomingLinks(selectedNode.id).length === 0" class="empty-relation">
              Perspektif pondasi (tidak ada driver internal di bawahnya).
            </div>
            <div v-else class="relation-cards">
              <div
                v-for="link in incomingLinks(selectedNode.id)"
                :key="link.id"
                class="rel-card driver-rel"
                @click="selectNode(link.source)"
              >
                <div class="rel-top">
                  <span class="rel-badge driver">Driver</span>
                  <span class="rel-node-title">
                    {{ getNodeById(link.source)?.code }}: {{ getNodeById(link.source)?.title }}
                  </span>
                </div>
                <p class="rel-rationale">{{ link.rationale }}</p>
              </div>
            </div>
          </div>

          <!-- Causal Relations (Outgoing: Outcomes) -->
          <div class="detail-section">
            <h4 class="section-title">
              Mendorong (Outcome / Dampak)
              <span class="badge-count">{{ outgoingLinks(selectedNode.id).length }}</span>
            </h4>
            <div v-if="outgoingLinks(selectedNode.id).length === 0" class="empty-relation">
              Puncak hasil finansial akhir (tidak ada outcome operasional di atasnya).
            </div>
            <div v-else class="relation-cards">
              <div
                v-for="link in outgoingLinks(selectedNode.id)"
                :key="link.id"
                class="rel-card outcome-rel"
                @click="selectNode(link.target)"
              >
                <div class="rel-top">
                  <span class="rel-badge outcome">Outcome</span>
                  <span class="rel-node-title">
                    {{ getNodeById(link.target)?.code }}: {{ getNodeById(link.target)?.title }}
                  </span>
                </div>
                <p class="rel-rationale">{{ link.rationale }}</p>
              </div>
            </div>
          </div>

          <!-- Decision note if available -->
          <div v-if="selectedNode.decisionTag && decisionNotes[selectedNode.decisionTag]" class="detail-section decision-box">
            <h4 class="decision-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Catatan Keputusan: {{ selectedNode.decisionTag }}
            </h4>
            <p class="decision-text">{{ decisionNotes[selectedNode.decisionTag] }}</p>
          </div>
        </div>

        <!-- LIST VIEW when no node is selected -->
        <div v-else class="inspector-list">
          <div class="list-header">
            <h3>Pilih objective</h3>
            <p class="list-helper">
              Klik node pada peta atau pilih dari daftar untuk melihat relasi kausalitasnya.
            </p>
          </div>

          <div class="grouped-objectives">
            <div
              v-for="lane in swimlanes"
              :key="lane.key"
              class="objective-group"
            >
              <div class="group-header" :class="lane.key.toLowerCase()">
                <span class="group-title">{{ lane.label }}</span>
                <span class="group-count">{{ getObjectivesByLane(lane.key).length }}</span>
              </div>

              <div class="group-items">
                <div
                  v-for="node in getObjectivesByLane(lane.key)"
                  :key="node.id"
                  class="obj-list-item"
                  @click="selectNode(node.id)"
                >
                  <div class="item-left">
                    <span class="item-code">{{ node.code }}</span>
                    <div class="item-meta">
                      <div class="item-name">{{ node.title }}</div>
                      <div class="item-sub">
                        {{ node.krCount }} KR • {{ node.departments.slice(0, 2).join(", ") }}
                      </div>
                    </div>
                  </div>
                  <div class="item-right">
                    <span v-if="node.decisionTag" class="mini-pill">
                      {{ node.decisionTag }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Bottom Panel: Pemeriksaan Otomatis (Shown if viewMode === 'pengecekan') -->
    <section v-if="viewMode === 'pengecekan'" class="validation-panel card">
      <div class="val-header">
        <div class="val-title-group">
          <span class="val-icon">🔍</span>
          <div>
            <h3>Pemeriksaan Otomatis & Integritas Relasi Kausalitas</h3>
            <p class="val-sub">
              Validasi konsistensi peta kausalitas Balanced Scorecard Skolla 2026.
            </p>
          </div>
        </div>
        <button class="btn-compact" @click="viewMode = 'ringkas'">Tutup Panel</button>
      </div>

      <div class="val-cards-grid">
        <div class="val-card valid">
          <div class="val-card-status">✓ TERVERIFIKASI</div>
          <h4>Kontinuitas Rantai Kausalitas</h4>
          <p>
            Semua 4 perspektif terhubung vertikal secara utuh dari Learning & Growth
            menuju Financial tanpa pemutusan alur.
          </p>
        </div>

        <div class="val-card valid">
          <div class="val-card-status">✓ BEBAS ORPHAN NODE</div>
          <h4>Koneksi Node Lengkap</h4>
          <p>
            Semua 13 Strategic Objectives memiliki minimal 1 relasi aktif (pendorong atau
            dampak), tidak ada node yang terisolasi.
          </p>
        </div>

        <div class="val-card valid">
          <div class="val-card-status">✓ METRIK KR TERPETAKAN</div>
          <h4>Total 37 Key Results</h4>
          <p>
            Seluruh 37 Key Results Skolla 2026 telah terbagi proporsional sesuai
            kapasitas departemen pelaksana.
          </p>
        </div>

        <div class="val-card pending">
          <div class="val-card-status">⏳ PERLU PERSETUJUAN</div>
          <h4>8 Item Menunggu Keputusan (K1–K8)</h4>
          <p>
            Target finansial, penyesuaian SLA, dan batasan OPEX masih menunggu persetujuan
            dalam rapat evaluasi C-Level.
          </p>
        </div>
      </div>
    </section>

    <!-- Admin Link Management Modal -->
    <div v-if="showLinkModal" class="modal-backdrop" @click.self="showLinkModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Kelola Hubungan Sebab-Akibat</h3>
          <button class="close-btn" @click="showLinkModal = false">✕</button>
        </div>

        <div class="modal-body">
          <p class="modal-sub">
            Tambah atau perbarui relasi sebab-akibat antar-objective strategis Skolla 2026.
          </p>

          <form @submit.prevent="submitCustomLink" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Objective Pendorong (Driver / Source) *</label>
                <select v-model="formLink.source" required>
                  <option value="" disabled>Pilih Objective Pendorong</option>
                  <option v-for="node in objectives" :key="node.id" :value="node.id">
                    [{{ formatPerspective(node.perspective) }}] {{ node.code }}: {{ node.title }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Objective Dampak (Outcome / Target) *</label>
                <select v-model="formLink.target" required>
                  <option value="" disabled>Pilih Objective Dampak</option>
                  <option v-for="node in objectives" :key="node.id" :value="node.id">
                    [{{ formatPerspective(node.perspective) }}] {{ node.code }}: {{ node.title }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Tipe Relasi</label>
                <select v-model="formLink.type">
                  <option value="solid">Sebab-Akibat Langsung (Solid)</option>
                  <option value="dashed">Verifikasi / Lompat Perspektif (Dashed)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Alasan / Rationale Hubungan</label>
                <input
                  v-model="formLink.rationale"
                  type="text"
                  placeholder="Contoh: Infrastruktur stabil menjamin retensi pelanggan"
                  required
                />
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="submit-btn">Tambah Hubungan</button>
            </div>
          </form>

          <h4 class="mt-4 mb-2">Daftar Relasi Kausalitas Saat Ini ({{ links.length }})</h4>
          <div class="links-scroll-list">
            <div v-for="l in links" :key="l.id" class="link-manage-item">
              <div class="link-info">
                <strong>{{ getNodeById(l.source)?.code }}</strong>
                <span class="arr">➔</span>
                <strong>{{ getNodeById(l.target)?.code }}</strong>
                <span class="rel-type-tag" :class="l.type">{{ l.type }}</span>
                <div class="link-desc">{{ l.rationale }}</div>
              </div>
              <button
                class="del-btn"
                title="Hapus Relasi"
                @click="removeLink(l.id)"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const config = useRuntimeConfig();
const { confirm: confirmDialog } = useConfirm();

const isAdmin = computed(() =>
  auth.user ? ["ADMIN", "C_LEVEL"].includes(auth.user.role) : false
);

// Tab and View Modes
const activeTab = ref(4);
const viewMode = ref("ringkas"); // 'ringkas' | 'pengecekan'
const showLinkModal = ref(false);

const tabs = [
  { id: 1, name: "1. Ringkasan Perubahan" },
  { id: 2, name: "2. Inventaris KR & KPI" },
  { id: 3, name: "3. Matriks Relasi" },
  { id: 4, name: "4. Peta Kausalitas" },
  { id: 5, name: "5. Gap & Rekomendasi" },
  { id: 6, name: "6. Rencana Aksi" },
];

function switchTab(id) {
  activeTab.value = id;
}

// 4 BSC Swimlanes
const swimlanes = [
  { key: "FINANCIAL", label: "FINANCIAL" },
  { key: "CUSTOMER", label: "CUSTOMER" },
  { key: "INTERNAL_PROCESS", label: "INTERNAL PROCESS" },
  { key: "LEARNING_GROWTH", label: "LEARNING & GROWTH" },
];

// Strategic Objectives Dataset: 13 nodes, 37 KR total
const objectives = ref([
  // FINANCIAL (4 nodes, 14 KR)
  {
    id: "F1",
    code: "F1",
    perspective: "FINANCIAL",
    title: "Meningkatkan Pendapatan & Pertumbuhan B2C Retail",
    krCount: 7,
    departments: ["B2C", "MARKETING"],
    decisionTag: "K1",
    keyResults: [
      "Revenue B2C Retail mencapai Rp 18,5 M",
      "Average Revenue Per Paying User (ARPPU) tumbuh 25%",
      "Gross Margin produk digital retail terjaga minimal 68%",
      "Subscription renewal retail per semester mencapai > 40%",
      "Rasio efisiensi CAC-to-LTV minimal 1:4.5",
      "Total transakasi paket belajar intensif tembus 45.000 transaksi",
      "Net Profit Margin lini B2C terjaga di atas 24%",
    ],
  },
  {
    id: "F2",
    code: "F2",
    perspective: "FINANCIAL",
    title: "Ekspansi Pendapatan B2B Corporate & Kemitraan B2S",
    krCount: 3,
    departments: ["B2B CORPORATE", "B2S"],
    decisionTag: "K2",
    keyResults: [
      "Nilai kontrak baru B2B Corporate mencapai Rp 12,0 M",
      "Penetrasi program B2S (Sekolah Mitra) membukukan Rp 7,5 M",
      "Tingkat ketepatan pembayaran termin (AR Collection) > 94%",
    ],
  },
  {
    id: "F3",
    code: "F3",
    perspective: "FINANCIAL",
    title: "Optimalisasi Efisiensi Biaya Operasional & OPEX",
    krCount: 2,
    departments: ["FINANCE", "ALL DEPT"],
    decisionTag: null,
    keyResults: [
      "Rasio OPEX terhadap total pendapatan ditekan di bawah 45%",
      "Efisiensi beban cloud server dan tools lisensi SaaS per user turun 20%",
    ],
  },
  {
    id: "F4",
    code: "F4",
    perspective: "FINANCIAL",
    title: "Penguatan Arus Kas & Kesehatan Likuiditas",
    krCount: 2,
    departments: ["FINANCE"],
    decisionTag: null,
    keyResults: [
      "Operating Cash Flow positif setiap penutupan kuartal",
      "Cash runway perusahaan terjaga minimal 18 bulan",
    ],
  },

  // CUSTOMER (3 nodes, 10 KR)
  {
    id: "C1",
    code: "C1",
    perspective: "CUSTOMER",
    title: "Meningkatkan Akuisisi, Retensi, & Kepuasan Pengguna",
    krCount: 5,
    departments: ["B2C", "MARKETING"],
    decisionTag: "K3",
    keyResults: [
      "Net Promoter Score (NPS) pengguna pelajar & guru >= 72",
      "Retensi aktif 30-hari (D30 Retention) aplikasi mobile >= 42%",
      "Monthly Active Users (MAU) menembus 650.000 user",
      "Churn rate langganan berkala turun di bawah 8%",
      "Customer Satisfaction Score (CSAT) layanan live support >= 90%",
    ],
  },
  {
    id: "C2",
    code: "C2",
    perspective: "CUSTOMER",
    title: "Memperluas Jangkauan Pasar B2B & Kemitraan Strategis",
    krCount: 3,
    departments: ["B2B CORPORATE", "B2S"],
    decisionTag: "K4 • K5",
    keyResults: [
      "Akuisisi 60 klien institusi & korporasi enterprise baru",
      "Kemitraan resmi dengan 350 sekolah tingkat SMA/SMK",
      "Renewal rate tahunan kemitraan B2B mencapai 92%",
    ],
  },
  {
    id: "C3",
    code: "C3",
    perspective: "CUSTOMER",
    title: "Memperkuat Brand Awareness & Positioning EduTech",
    krCount: 2,
    departments: ["MARKETING", "BRAND"],
    decisionTag: null,
    keyResults: [
      "Share of Voice (SOV) kategori edutech di platform digital >= 28%",
      "Total brand impressions lintas kanal mencapai > 85 Juta tayangan",
    ],
  },

  // INTERNAL PROCESS (3 nodes, 7 KR)
  {
    id: "I1",
    code: "I1",
    perspective: "INTERNAL_PROCESS",
    title: "Mengembangkan & Mengoptimalkan Produk Digital (App & Web)",
    krCount: 3,
    departments: ["TECHDEV", "PRODUCT"],
    decisionTag: "K6",
    keyResults: [
      "Platform availability / uptime layanan mencapai >= 99.95%",
      "Crash-free sessions pengguna mobile app >= 99.8%",
      "Cycle time rilis fitur baru dari sprint ke production < 10 hari",
    ],
  },
  {
    id: "I2",
    code: "I2",
    perspective: "INTERNAL_PROCESS",
    title: "Standarisasi & Otomasi Operasional Bisnis",
    krCount: 2,
    departments: ["OPERATIONS", "TECH"],
    decisionTag: null,
    keyResults: [
      "Otomasi proses onboarding kemitraan sekolah dan siswa hingga 85%",
      "Mean Time To Resolve (MTTR) penanganan tiket keluhan < 4 jam",
    ],
  },
  {
    id: "I3",
    code: "I3",
    perspective: "INTERNAL_PROCESS",
    title: "Pengembangan Konten Pembelajaran Berkualitas & Relevan",
    krCount: 2,
    departments: ["ACADEMIC", "CONTENT"],
    decisionTag: null,
    keyResults: [
      "Produksi 15.000 butir bank soal adaptif SNBT & Kedinasan terverifikasi",
      "Tingkat kepuasan siswa terhadap materi video pembelajaran >= 4.7 / 5.0",
    ],
  },

  // LEARNING & GROWTH (3 nodes, 6 KR)
  {
    id: "L1",
    code: "L1",
    perspective: "LEARNING_GROWTH",
    title: "Meningkatkan Kapabilitas & Retensi Talenta Kunci",
    krCount: 2,
    departments: ["HR", "PEOPLE"],
    decisionTag: "K7",
    keyResults: [
      "Rata-rata jam pelatihan upskilling karyawan >= 36 jam/tahun",
      "Retensi karyawan berkinerja tinggi (key talent) terjaga >= 92%",
    ],
  },
  {
    id: "L2",
    code: "L2",
    perspective: "LEARNING_GROWTH",
    title: "Membangun Budaya Kerja Berkinerja Tinggi & Agile",
    krCount: 2,
    departments: ["HR", "ALL DEPT"],
    decisionTag: null,
    keyResults: [
      "Kepatuhan pelaporan progres sprint OKR bulanan mencapai 96%",
      "100% unit kerja menjalankan evaluasi retrospektif dua mingguan",
    ],
  },
  {
    id: "L3",
    code: "L3",
    perspective: "LEARNING_GROWTH",
    title: "Modernisasi Infrastruktur Teknologi & Keamanan Data",
    krCount: 2,
    departments: ["TECHDEV", "INFRA"],
    decisionTag: "K8",
    keyResults: [
      "Arsitektur cloud auto-scaling dan zero-trust terimplementasi penuh",
      "Kepatuhan standar perlindungan data pribadi (UU PDP) & ISO 27001 100%",
    ],
  },
]);

// 16 Causal Links (Exact mapping)
const links = ref([
  // L&G -> Internal
  {
    id: "link-1",
    source: "L1",
    target: "I2",
    type: "solid",
    rationale: "Kompetensi talenta operasional mempercepat standardisasi & otomasi proses",
  },
  {
    id: "link-2",
    source: "L1",
    target: "I3",
    type: "solid",
    rationale: "Talenta akademik yang kompeten menjamin produksi materi pembelajaran bermutu tinggi",
  },
  {
    id: "link-3",
    source: "L2",
    target: "I1",
    type: "solid",
    rationale: "Budaya agile mempercepat siklus delivery rilis fitur aplikasi dan portal web",
  },
  {
    id: "link-4",
    source: "L2",
    target: "I2",
    type: "solid",
    rationale: "Disiplin eksekusi kerja mendorong kepatuhan SOP digital di setiap lini unit",
  },
  {
    id: "link-5",
    source: "L3",
    target: "I1",
    type: "solid",
    rationale: "Infrastruktur cloud modern menjamin stabilitas 99.95% uptime & kecepatan respons",
  },
  {
    id: "link-6",
    source: "L3",
    target: "F3",
    type: "dashed",
    rationale: "Modernisasi arsitektur cloud langsung mengoptimalkan pengeluaran server & overhead",
  },

  // Internal -> Customer & Finance
  {
    id: "link-7",
    source: "I1",
    target: "C1",
    type: "solid",
    rationale: "Aplikasi yang cepat dan bebas kendala meningkatkan kepuasan dan retensi belajar siswa",
  },
  {
    id: "link-8",
    source: "I1",
    target: "C2",
    type: "solid",
    rationale: "Portal B2B & sekolah yang reliabel mempermudah kemitraan institusi skala besar",
  },
  {
    id: "link-9",
    source: "I2",
    target: "C2",
    type: "solid",
    rationale: "Onboarding cepat & SLA support yang prima memperkuat kepercayaan mitra korporasi",
  },
  {
    id: "link-10",
    source: "I2",
    target: "F3",
    type: "solid",
    rationale: "Otomasi alur kerja menekan biaya administrasi dan efisiensi pengeluaran harian",
  },
  {
    id: "link-11",
    source: "I3",
    target: "C1",
    type: "solid",
    rationale: "Bank soal adaptif berkualitas langsung meningkatkan retensi dan engagement siswa",
  },
  {
    id: "link-12",
    source: "I3",
    target: "C3",
    type: "solid",
    rationale: "Keunggulan konten pembelajaran menjadi materi pemasaran dan penguat reputasi brand",
  },

  // Customer -> Financial
  {
    id: "link-13",
    source: "C3",
    target: "C1",
    type: "solid",
    rationale: "Brand awareness yang kuat menurunkan CAC dan melipatgandakan akuisisi organik",
  },
  {
    id: "link-14",
    source: "C3",
    target: "F1",
    type: "dashed",
    rationale: "Brand equity yang terpercaya memperkuat daya tawar harga lisensi produk di pasar",
  },
  {
    id: "link-15",
    source: "C1",
    target: "F1",
    type: "solid",
    rationale: "Tingginya akuisisi dan retensi retail secara langsung mendongkrak omzet B2C",
  },
  {
    id: "link-16",
    source: "C2",
    target: "F2",
    type: "solid",
    rationale: "Ekspansi kontrak sekolah dan kemitraan B2B mengunci recurring revenue bernilai besar",
  },
]);

// Decision registry (K1-K8)
const decisionNotes = {
  K1: "Penyesuaian target revenue B2C vs B2B Corporate paska restrukturisasi Q1 untuk mengantisipasi siklus pendaftaran tahun ajaran baru.",
  K2: "Kebijakan integrasi skema pricing paket lisensi B2S per sekolah & kuota akun guru.",
  K3: "Penyatuan formula metrik retensi antara pengguna web portal dan aplikasi mobile agar terukur konsisten.",
  "K4 • K5": "K4: Standarisasi kriteria kelayakan kemitraan enterprise. K5: Program beasiswa CSR korporasi.",
  K6: "Penetapan prioritas sprint Q2: arsitektur modular microservices vs penyelesaian modul belajar AI.",
  K7: "Alokasi plafon anggaran program sertifikasi profesional dan kepemimpinan manajerial.",
  K8: "Penerapan enkripsi end-to-end data nilai siswa dan audit kepatuhan perlindungan data pribadi (UU PDP).",
};

// Form state for creating custom link
const formLink = ref({
  source: "",
  target: "",
  type: "solid",
  rationale: "",
});

function submitCustomLink() {
  if (formLink.value.source === formLink.value.target) {
    alert("Objective pendorong dan dampak tidak boleh sama!");
    return;
  }
  links.value.push({
    id: "link-" + Date.now(),
    source: formLink.value.source,
    target: formLink.value.target,
    type: formLink.value.type,
    rationale: formLink.value.rationale || "Hubungan kausalitas baru",
  });
  formLink.value = { source: "", target: "", type: "solid", rationale: "" };
  showLinkModal.value = false;
  nextTick(recalculatePositions);
}

async function removeLink(id) {
  const ok = await confirmDialog("Hapus hubungan kausalitas ini?");
  if (!ok) return;
  links.value = links.value.filter((l) => l.id !== id);
  nextTick(recalculatePositions);
}

// Selection & Interactivity state
const selectedNodeId = ref(null);
const selectedNode = computed(() =>
  objectives.value.find((o) => o.id === selectedNodeId.value)
);

function selectNode(id) {
  if (selectedNodeId.value === id) {
    selectedNodeId.value = null;
  } else {
    selectedNodeId.value = id;
  }
}

function resetFocus() {
  selectedNodeId.value = null;
}

function handleCanvasClick() {
  resetFocus();
}

function getNodeById(id) {
  return objectives.value.find((o) => o.id === id);
}

function getObjectivesByLane(laneKey) {
  return objectives.value.filter((o) => o.perspective === laneKey);
}

function incomingLinks(nodeId) {
  return links.value.filter((l) => l.target === nodeId);
}

function outgoingLinks(nodeId) {
  return links.value.filter((l) => l.source === nodeId);
}

function isUpstreamNode(nodeId) {
  if (!selectedNodeId.value) return false;
  return incomingLinks(selectedNodeId.value).some((l) => l.source === nodeId);
}

function isDownstreamNode(nodeId) {
  if (!selectedNodeId.value) return false;
  return outgoingLinks(selectedNodeId.value).some((l) => l.target === nodeId);
}

function isRelatedNode(nodeId) {
  if (!selectedNodeId.value) return false;
  if (selectedNodeId.value === nodeId) return true;
  return isUpstreamNode(nodeId) || isDownstreamNode(nodeId);
}

function formatPerspective(p) {
  if (!p) return "";
  const map = {
    FINANCIAL: "Financial",
    CUSTOMER: "Customer",
    INTERNAL_PROCESS: "Internal Process",
    LEARNING_GROWTH: "Learning & Growth",
  };
  return map[p] || p;
}

// Statistics computed
const totalKrCount = computed(() =>
  objectives.value.reduce((acc, curr) => acc + (curr.krCount || 0), 0)
);

const laneCounts = computed(() => {
  return swimlanes
    .map((l) => `${getObjectivesByLane(l.key).length} ${l.label}`)
    .join(", ");
});

// Dynamic SVG edge routing
const boardRef = ref(null);
const canvasWrapperRef = ref(null);
const nodeRefs = ref({});
const svgWidth = ref(1200);
const svgHeight = ref(860);

function setNodeRef(id, el) {
  if (el) {
    nodeRefs.value[id] = el;
  }
}

const computedEdgePaths = ref([]);

function recalculatePositions() {
  if (!boardRef.value) return;

  const boardRect = boardRef.value.getBoundingClientRect();
  svgWidth.value = Math.max(boardRect.width, 980);
  svgHeight.value = Math.max(boardRect.height, 800);

  const paths = [];

  links.value.forEach((link) => {
    const sEl = nodeRefs.value[link.source];
    const tEl = nodeRefs.value[link.target];

    if (!sEl || !tEl) return;

    const sRect = sEl.getBoundingClientRect();
    const tRect = tEl.getBoundingClientRect();

    const isUpward = sRect.top > tRect.bottom;
    const isDownward = sRect.bottom < tRect.top;
    const isSameLane = Math.abs(sRect.top - tRect.top) < 40;

    let sx = sRect.left - boardRect.left + sRect.width / 2;
    let sy = sRect.top - boardRect.top;
    let tx = tRect.left - boardRect.left + tRect.width / 2;
    let ty = tRect.top - boardRect.top;

    if (isUpward) {
      sy = sRect.top - boardRect.top;
      ty = tRect.bottom - boardRect.top;
    } else if (isDownward) {
      sy = sRect.bottom - boardRect.top;
      ty = tRect.top - boardRect.top;
    } else if (isSameLane) {
      if (sx < tx) {
        sx = sRect.right - boardRect.left;
        sy = sRect.top - boardRect.top + sRect.height / 2;
        tx = tRect.left - boardRect.left;
        ty = tRect.top - boardRect.top + tRect.height / 2;
      } else {
        sx = sRect.left - boardRect.left;
        sy = sRect.top - boardRect.top + sRect.height / 2;
        tx = tRect.right - boardRect.left;
        ty = tRect.top - boardRect.top + tRect.height / 2;
      }
    }

    const dy = ty - sy;
    let d = "";

    if (isSameLane) {
      const curveY = sy - 40;
      d = `M ${sx} ${sy} C ${sx + 30} ${curveY}, ${tx - 30} ${curveY}, ${tx} ${ty}`;
    } else {
      const c1x = sx;
      const c1y = sy + dy * 0.45;
      const c2x = tx;
      const c2y = ty - dy * 0.45;
      d = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`;
    }

    const isHighlighted =
      selectedNodeId.value &&
      (link.source === selectedNodeId.value || link.target === selectedNodeId.value);

    paths.push({
      id: link.id,
      source: link.source,
      target: link.target,
      type: link.type,
      d,
      isHighlighted,
    });
  });

  computedEdgePaths.value = paths;
}

function getMarker(edge) {
  if (edge.isHighlighted) return "url(#arrow-active)";
  if (selectedNodeId.value && !edge.isHighlighted) return "url(#arrow-solid-dimmed)";
  return edge.type === "dashed" ? "url(#arrow-dashed)" : "url(#arrow-solid)";
}

function handleKeydown(e) {
  if (e.key === "Escape") {
    resetFocus();
    showLinkModal.value = false;
  }
}

let resizeObserver = null;

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("resize", recalculatePositions);

  nextTick(() => {
    recalculatePositions();
    if (typeof ResizeObserver !== "undefined" && boardRef.value) {
      resizeObserver = new ResizeObserver(() => {
        recalculatePositions();
      });
      resizeObserver.observe(boardRef.value);
    }
    setTimeout(recalculatePositions, 200);
    setTimeout(recalculatePositions, 600);
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("resize", recalculatePositions);
  if (resizeObserver) resizeObserver.disconnect();
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Rubik:wght@400;500;600;700&display=swap");

.strategy-map-page {
  font-family: "Plus Jakarta Sans", "Rubik", sans-serif;
  background-color: #0b1322;
  color: #f1f5f9;
  min-height: calc(100vh - 60px);
  padding: 16px 24px 60px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
}

/* Page Topbar */
.page-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.topbar-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.brand-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #38bdf8;
  text-transform: uppercase;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.5px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Tab pill nav 1-6 */
.tab-pill-nav {
  display: flex;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}

.tab-pill-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-pill-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.06);
}

.tab-pill-btn.active {
  background: #0284c7;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35);
}

/* View Mode Switcher */
.view-mode-toggle {
  display: flex;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 3px;
}

.mode-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn.active {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.admin-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(14, 165, 233, 0.15);
  border: 1px solid rgba(14, 165, 233, 0.4);
  color: #38bdf8;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.admin-action-btn:hover {
  background: rgba(14, 165, 233, 0.25);
  color: #ffffff;
}

/* Stats and Legend Bar */
.stats-legend-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 10px 18px;
}

.stats-pills {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-badge {
  font-size: 13px;
  color: #94a3b8;
}

.stat-num {
  color: #38bdf8;
  font-weight: 700;
  font-size: 14px;
}

.stat-sub {
  color: #64748b;
  font-size: 12px;
}

.legend-items {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 12.5px;
  color: #cbd5e1;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-line {
  display: inline-block;
  width: 28px;
  height: 2px;
}

.legend-line.solid {
  background: #00d2ff;
  box-shadow: 0 0 6px rgba(0, 210, 255, 0.6);
}

.legend-line.dashed {
  border-top: 2px dashed #38bdf8;
}

.legend-box.pending {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 1.5px dashed #fbbf24;
  border-radius: 3px;
  background: rgba(251, 191, 36, 0.15);
}

/* Focus banner */
.focus-alert-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(2, 132, 199, 0.18);
  border: 1px solid rgba(2, 132, 199, 0.45);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  color: #bae6fd;
}

.focus-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.focus-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
  animation: pulse-dot 1.5s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

.clear-focus-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-focus-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Workspace Layout */
.workspace-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 16px;
  align-items: start;
}

@media (max-width: 1200px) {
  .workspace-layout {
    grid-template-columns: 1fr;
  }
}

/* Canvas Area */
.canvas-area-wrapper {
  background: #0d1629;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px 20px;
  overflow-x: auto;
  position: relative;
  min-height: 800px;
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.4);
}

.board-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  min-width: 840px;
}

/* SVG Connection Overlay */
.svg-connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 5;
}

.edge-path {
  fill: none;
  stroke: #00d2ff;
  stroke-width: 2px;
  transition: stroke 0.3s, stroke-width 0.3s, opacity 0.3s;
}

.edge-path.solid {
  stroke: #00d2ff;
}

.edge-path.dashed {
  stroke: #38bdf8;
  stroke-dasharray: 6 5;
}

.edge-path.highlighted {
  stroke: #fbbf24;
  stroke-width: 3.5px;
  stroke-dasharray: none;
  filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.8));
  z-index: 10;
}

.edge-path.dimmed {
  opacity: 0.12;
  stroke: rgba(255, 255, 255, 0.2);
}

/* Swimlanes */
.swimlane-row {
  display: flex;
  align-items: stretch;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  min-height: 155px;
  position: relative;
  z-index: 6;
}

.swimlane-row.financial {
  border-left: 4px solid #00d2ff;
}
.swimlane-row.customer {
  border-left: 4px solid #f59e0b;
}
.swimlane-row.internal_process {
  border-left: 4px solid #a855f7;
}
.swimlane-row.learning_growth {
  border-left: 4px solid #10b981;
}

.swimlane-label-col {
  width: 140px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  padding: 12px 10px;
  background: rgba(10, 17, 30, 0.5);
  border-top-left-radius: 9px;
  border-bottom-left-radius: 9px;
}

.label-vertical-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
}

.lane-title {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #94a3b8;
  text-transform: uppercase;
}

.swimlane-row.financial .lane-title { color: #38bdf8; }
.swimlane-row.customer .lane-title { color: #fbbf24; }
.swimlane-row.internal_process .lane-title { color: #c084fc; }
.swimlane-row.learning_growth .lane-title { color: #34d399; }

.lane-counter {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

.swimlane-cards-col {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 14px 20px;
  gap: 14px;
  flex-wrap: wrap;
}

/* Strategic Card */
.strategic-card {
  width: 235px;
  background: #141f32;
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  position: relative;
  user-select: none;
}

.strategic-card:hover {
  transform: translateY(-2px);
  border-color: rgba(56, 189, 248, 0.5);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
}

.strategic-card.has-decision {
  border: 1.5px dashed #fbbf24;
}

.strategic-card.active {
  border-color: #38bdf8;
  background: #192a47;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.6), 0 8px 30px rgba(0, 0, 0, 0.5);
  transform: translateY(-3px) scale(1.02);
  z-index: 15;
}

.strategic-card.is-driver {
  border-color: #38bdf8;
  background: #11273f;
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.35);
}

.strategic-card.is-outcome {
  border-color: #fbbf24;
  background: #272314;
  box-shadow: 0 0 16px rgba(251, 191, 36, 0.35);
}

.strategic-card.dimmed {
  opacity: 0.18;
  filter: grayscale(60%);
  transform: scale(0.98);
}

.card-header-tags {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.kr-count-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.08);
  padding: 3px 8px;
  border-radius: 4px;
}

.decision-pill {
  font-size: 11px;
  font-weight: 800;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.15);
  border: 1px dashed #fbbf24;
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.card-main-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.node-code {
  font-size: 11px;
  font-weight: 800;
  color: #38bdf8;
  letter-spacing: 0.5px;
}

.node-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #f8fafc;
  line-height: 1.35;
}

.card-depts-footer {
  margin-top: auto;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.dept-text {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

/* Side Inspector */
.side-inspector {
  background: #111a2d;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 18px;
  max-height: 800px;
  overflow-y: auto;
}

.side-inspector::-webkit-scrollbar {
  width: 6px;
}

.side-inspector::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

/* Inspector: List View */
.inspector-list .list-header h3 {
  margin: 0 0 6px 0;
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
}

.list-helper {
  margin: 0 0 16px 0;
  font-size: 12.5px;
  color: #94a3b8;
  line-height: 1.4;
}

.grouped-objectives {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.objective-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.group-header.financial { color: #38bdf8; }
.group-header.customer { color: #fbbf24; }
.group-header.internal_process { color: #c084fc; }
.group-header.learning_growth { color: #34d399; }

.group-count {
  background: rgba(255, 255, 255, 0.08);
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 10px;
  color: #cbd5e1;
}

.group-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.obj-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.obj-list-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(56, 189, 248, 0.4);
}

.item-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.item-code {
  font-size: 11px;
  font-weight: 800;
  color: #38bdf8;
  padding-top: 2px;
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  line-height: 1.3;
}

.item-sub {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.mini-pill {
  font-size: 10px;
  font-weight: 800;
  color: #fbbf24;
  border: 1px dashed #fbbf24;
  background: rgba(251, 191, 36, 0.15);
  padding: 1px 5px;
  border-radius: 3px;
  white-space: nowrap;
}

/* Inspector: Detail View */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.detail-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lane-chip {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.6px;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.lane-chip.financial { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
.lane-chip.customer { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
.lane-chip.internal_process { background: rgba(192, 132, 252, 0.15); color: #c084fc; }
.lane-chip.learning_growth { background: rgba(52, 211, 153, 0.15); color: #34d399; }

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
}

.close-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

.detail-heading {
  margin: 0 0 10px 0;
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.35;
}

.detail-code {
  color: #38bdf8;
}

.detail-dept-badge {
  font-size: 12px;
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.04);
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 14px;
}

.label-mini {
  color: #94a3b8;
  margin-right: 6px;
}

.detail-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.stat-box {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 8px;
  text-align: center;
}

.stat-box .num {
  display: block;
  font-size: 18px;
  font-weight: 800;
  color: #38bdf8;
}

.stat-box .lbl {
  font-size: 10px;
  color: #94a3b8;
  text-transform: uppercase;
  font-weight: 600;
}

.detail-section {
  margin-bottom: 16px;
}

.section-title {
  margin: 0 0 8px 0;
  font-size: 12.5px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge-count {
  background: rgba(255, 255, 255, 0.1);
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 10px;
  color: #cbd5e1;
}

.kr-list-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
}

.kr-item-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12.5px;
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
  padding: 6px 8px;
  line-height: 1.35;
}

.kr-index {
  font-weight: 700;
  color: #38bdf8;
  flex-shrink: 0;
}

.empty-relation {
  font-size: 12px;
  color: #64748b;
  font-style: italic;
  padding: 4px 0;
}

.relation-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rel-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.rel-card:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(56, 189, 248, 0.5);
}

.rel-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.rel-badge {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 4px;
}

.rel-badge.driver {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
}

.rel-badge.outcome {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.rel-node-title {
  font-size: 12.5px;
  font-weight: 600;
  color: #f1f5f9;
}

.rel-rationale {
  margin: 0;
  font-size: 11.5px;
  color: #94a3b8;
  line-height: 1.4;
}

.decision-box {
  background: rgba(251, 191, 36, 0.08);
  border: 1px dashed rgba(251, 191, 36, 0.4);
  border-radius: 8px;
  padding: 12px;
}

.decision-title {
  margin: 0 0 6px 0;
  font-size: 12px;
  font-weight: 700;
  color: #fbbf24;
  display: flex;
  align-items: center;
  gap: 6px;
}

.decision-text {
  margin: 0;
  font-size: 12px;
  color: #fef08a;
  line-height: 1.45;
}

/* Validation Panel */
.validation-panel {
  background: #111a2d;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px;
}

.val-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.val-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.val-icon {
  font-size: 24px;
}

.val-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
}

.val-sub {
  margin: 3px 0 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.btn-compact {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.btn-compact:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.val-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}

.val-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 14px;
}

.val-card.valid {
  border-top: 3px solid #10b981;
}

.val-card.pending {
  border-top: 3px solid #fbbf24;
}

.val-card-status {
  font-size: 10px;
  font-weight: 800;
  margin-bottom: 6px;
}

.val-card.valid .val-card-status { color: #34d399; }
.val-card.pending .val-card-status { color: #fbbf24; }

.val-card h4 {
  margin: 0 0 6px 0;
  font-size: 13.5px;
  font-weight: 700;
  color: #f1f5f9;
}

.val-card p {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
}

/* Modal Backdrop */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  background: #111a2d;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  width: 100%;
  max-width: 640px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.modal-sub {
  margin: 0 0 16px 0;
  font-size: 13px;
  color: #94a3b8;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-size: 11.5px;
  font-weight: 600;
  color: #94a3b8;
}

.form-group select,
.form-group input {
  background: #0d1629;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
  color: #ffffff;
  outline: none;
}

.form-group select:focus,
.form-group input:focus {
  border-color: #38bdf8;
}

.submit-btn {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  align-self: flex-end;
  transition: all 0.2s;
}

.submit-btn:hover {
  background: #0369a1;
}

.links-scroll-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
}

.link-manage-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 8px 12px;
}

.link-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
}

.link-info .arr {
  color: #38bdf8;
}

.rel-type-tag {
  font-size: 10px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 3px;
  text-transform: uppercase;
}

.rel-type-tag.solid { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
.rel-type-tag.dashed { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }

.link-desc {
  width: 100%;
  font-size: 11.5px;
  color: #94a3b8;
  margin-top: 2px;
}

.del-btn {
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #f87171;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.del-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}
</style>

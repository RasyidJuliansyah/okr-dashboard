<template>
  <div class="map-root">
    <!-- Navbar / Header -->
    <header class="header">
      <div class="header-brand">
        <NuxtLink to="/dashboard" class="back-link">
          <span class="back-icon">←</span> Dashboard
        </NuxtLink>
        <h1>BSC Strategy Map (Causal Links)</h1>
      </div>
      
      <div class="header-actions">
        <div class="header-user">
          <span class="user-badge" :class="auth.user?.role?.toLowerCase().replace('_', '')">
            {{ auth.user?.role?.replace('_', ' ') }}
          </span>
          <span class="user-name">{{ auth.user?.name }}</span>
        </div>
      </div>
    </header>

    <!-- Critical Disclaimer Banner (FR-USR-006) -->
    <div class="disclaimer-banner">
      <span class="disclaimer-icon">⚠️</span>
      <p><strong>Disclaimer:</strong> Peta ini berdasarkan asumsi manajemen (input manual Admin), bukan korelasi data statistik.</p>
    </div>

    <div class="map-content">
      <!-- Left Panel: Graph Display -->
      <section class="graph-section card">
        <div class="graph-header">
          <h2>Visualisasi Relasi Sebab-Akibat</h2>
          <button @click="fetchStrategyMap" class="refresh-btn">🔄 Refresh Map</button>
        </div>

        <div v-if="loadingMap" class="loading-state">
          Memuat peta strategi...
        </div>
        
        <div v-else class="flow-container">
          <ClientOnly>
            <!-- Fallback in case of zero nodes -->
            <div v-if="elements.length === 0" class="empty-state">
              Belum ada data relasi atau Key Result untuk digambar.
            </div>

            <!-- Standard Vue Flow container -->
            <VueFlow 
              v-else
              v-model="elements"
              :fit-view-on-init="true"
              class="vue-flow-board"
            >
              <!-- Custom Node Renderer -->
              <template #node-custom="{ data }">
                <div class="custom-node" :class="data.perspective.toLowerCase()">
                  <div class="node-header">
                    <span class="node-quarter">{{ data.objectiveQuarter }}</span>
                    <span class="node-perspective">{{ formatPerspective(data.perspective) }}</span>
                  </div>
                  <p class="node-title">{{ data.title }}</p>
                  <div class="node-progress-row">
                    <div class="node-progress-track">
                      <div 
                        class="node-progress-bar" 
                        :class="data.status.toLowerCase().replace('_', '')"
                        :style="{ width: data.progress + '%' }"
                      ></div>
                    </div>
                    <span class="node-progress-pct">{{ data.progress }}%</span>
                  </div>
                </div>
              </template>
            </VueFlow>
          </ClientOnly>
        </div>
      </section>

      <!-- Right Panel: Causal Link Creator (Admin only) & Details -->
      <section class="side-panel">
        <!-- Link Creator Card -->
        <div v-if="auth.user?.role === 'ADMIN'" class="card creator-card">
          <h2>Hubungkan Sebab-Akibat (Admin)</h2>
          <p class="section-desc">Pilih Key Result pendorong (driver) dan hasil akhir (outcome) untuk memetakan sebab-akibat.</p>

          <form @submit.prevent="submitCausalLink" class="link-form">
            <div class="form-group">
              <label for="source-kr">Key Result Pendorong (Source/Driver) *</label>
              <select id="source-kr" v-model="newLink.sourceKrId" required>
                <option value="" disabled>Pilih Key Result</option>
                <option v-for="kr in allKeyResults" :key="kr.id" :value="kr.id">
                  [{{ formatPerspective(kr.bscPerspective) }}] {{ kr.title }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="target-kr">Key Result Dampak (Target/Outcome) *</label>
              <select id="target-kr" v-model="newLink.targetKrId" required>
                <option value="" disabled>Pilih Key Result</option>
                <option v-for="kr in allKeyResults" :key="kr.id" :value="kr.id">
                  [{{ formatPerspective(kr.bscPerspective) }}] {{ kr.title }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="rel-type">Hubungan Relasi *</label>
              <select id="rel-type" v-model="newLink.relationship" required>
                <option value="driver">Driver (Pendorong)</option>
                <option value="outcome">Outcome (Dampak)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="link-note">Catatan Penjelasan (Opsional)</label>
              <input 
                id="link-note"
                v-model="newLink.note" 
                type="text" 
                placeholder="Contoh: Kualitas code mempercepat rilis fitur" 
              />
            </div>

            <button 
              type="submit" 
              :disabled="submitting || !newLink.sourceKrId || !newLink.targetKrId"
              class="submit-btn"
            >
              {{ submitting ? 'Menyimpan...' : 'Hubungkan Relasi' }}
            </button>

            <p v-if="successMessage" class="success-msg">{{ successMessage }}</p>
            <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
          </form>
        </div>

        <!-- Links List Card (All Roles) -->
        <div class="card links-list-card">
          <h2>Daftar Kausalitas Aktif</h2>
          <p class="section-desc">Berikut hubungan driver-outcome yang saat ini terdefinisi.</p>

          <div v-if="loadingMap" class="loading-state">
            Memuat daftar hubungan...
          </div>
          <div v-else-if="edges.length === 0" class="empty-state">
            Belum ada hubungan kausalitas yang dibuat.
          </div>
          <div v-else class="links-list">
            <div v-for="edge in edges" :key="edge.id" class="link-item">
              <div class="link-item-top">
                <div class="link-names">
                  <span class="kr-node-ref">{{ getKrTitleById(edge.source) }}</span>
                  <span class="direction-arrow">➔</span>
                  <span class="kr-node-ref">{{ getKrTitleById(edge.target) }}</span>
                </div>
                <button 
                  v-if="auth.user?.role === 'ADMIN'"
                  @click="deleteLink(edge.id)" 
                  class="delete-link-btn"
                  title="Hapus Hubungan"
                >
                  ✕
                </button>
              </div>
              <div class="link-item-meta">
                <span class="rel-badge">{{ edge.label }}</span>
                <span v-if="edge.data?.note" class="link-note">"{{ edge.data.note }}"</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { VueFlow } from '@vue-flow/core';

// Nuxt module style imports
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';

const auth = useAuthStore();
const config = useRuntimeConfig();

const elements = ref([]);
const allKeyResults = ref([]);
const loadingMap = ref(false);
const submitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const newLink = ref({
  sourceKrId: '',
  targetKrId: '',
  relationship: 'driver',
  note: ''
});

// Cache list of edges and nodes separately for UI elements listing
const nodes = ref([]);
const edges = ref([]);

function formatPerspective(p) {
  if (!p) return '';
  return p.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

function getKrTitleById(id) {
  const kr = allKeyResults.value.find(k => k.id === id);
  return kr ? kr.title : 'Key Result';
}

async function fetchAllKeyResults() {
  try {
    const objectives = await $fetch(`${config.public.apiBase}/objectives`, {
      headers: {
        Authorization: `Bearer ${auth.token}`
      }
    });

    const krs = [];
    objectives.forEach(obj => {
      if (obj.keyResults) {
        obj.keyResults.forEach(kr => {
          krs.push(kr);
        });
      }
    });
    allKeyResults.value = krs;
  } catch (err) {
    console.error('Error fetching KRs:', err);
  }
}

async function fetchStrategyMap() {
  loadingMap.value = true;
  errorMessage.value = '';
  try {
    const response = await $fetch(`${config.public.apiBase}/strategy-map`, {
      headers: {
        Authorization: `Bearer ${auth.token}`
      }
    });

    nodes.value = response.nodes;
    edges.value = response.edges;

    // Combine for Vue Flow
    elements.value = [...response.nodes, ...response.edges];
  } catch (err) {
    console.error('Error fetching strategy map:', err);
  } finally {
    loadingMap.value = false;
  }
}

async function submitCausalLink() {
  errorMessage.value = '';
  successMessage.value = '';

  if (newLink.value.sourceKrId === newLink.value.targetKrId) {
    errorMessage.value = 'Key Result Driver dan Outcome tidak boleh sama';
    return;
  }

  submitting.value = true;
  try {
    await $fetch(`${config.public.apiBase}/causal-links`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json'
      },
      body: newLink.value
    });

    successMessage.value = 'Relasi kausalitas berhasil didefinisikan!';
    
    // Reset form
    newLink.value = {
      sourceKrId: '',
      targetKrId: '',
      relationship: 'driver',
      note: ''
    };

    await fetchStrategyMap();
  } catch (err) {
    console.error('Causal link error:', err);
    errorMessage.value = err.data?.message || 'Gagal menyimpan hubungan.';
  } finally {
    submitting.value = false;
  }
}

async function deleteLink(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus hubungan sebab-akibat ini?')) {
    return;
  }

  try {
    await $fetch(`${config.public.apiBase}/causal-links/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${auth.token}`
      }
    });
    await fetchStrategyMap();
  } catch (err) {
    console.error('Delete link error:', err);
    alert('Gagal menghapus hubungan.');
  }
}

onMounted(async () => {
  await fetchAllKeyResults();
  await fetchStrategyMap();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

.map-root {
  font-family: 'Outfit', sans-serif;
  min-height: 100vh;
  background: radial-gradient(circle at 10% 20%, rgb(15, 22, 38) 0%, rgb(8, 12, 21) 90%);
  color: white;
  padding: 0 0 60px 0;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-link {
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  transition: color 0.3s;
}

.back-link:hover {
  color: #00d2ff;
}

.header-brand h1 {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, #00d2ff 0%, #0066ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  text-transform: uppercase;
}

.user-badge.admin {
  background: rgba(255, 75, 75, 0.15);
  color: #ff8888;
  border: 1px solid rgba(255, 75, 75, 0.3);
}

.user-badge.manager {
  background: rgba(255, 170, 0, 0.15);
  color: #ffcc66;
  border: 1px solid rgba(255, 170, 0, 0.3);
}

.user-badge.clevel {
  background: rgba(138, 43, 226, 0.15);
  color: #d8b4fe;
  border: 1px solid rgba(138, 43, 226, 0.3);
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

/* Disclaimer Banner */
.disclaimer-banner {
  background: rgba(255, 170, 0, 0.1);
  border-bottom: 1px solid rgba(255, 170, 0, 0.2);
  padding: 12px 40px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.disclaimer-banner p {
  margin: 0;
  font-size: 13px;
  color: #ffe0a3;
}

.disclaimer-icon {
  font-size: 16px;
}

/* Layout Grid */
.map-content {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 30px;
  max-width: 1400px;
  margin: 30px auto 0 auto;
  padding: 0 30px;
  flex-grow: 1;
}

@media (max-width: 1024px) {
  .map-content {
    grid-template-columns: 1fr;
  }
}

.card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.graph-section {
  display: flex;
  flex-direction: column;
  height: 750px;
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.graph-header h2 {
  font-size: 18px;
  margin: 0;
  font-weight: 600;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.flow-container {
  flex-grow: 1;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.vue-flow-board {
  width: 100%;
  height: 100%;
  background: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* Custom Node Styles */
.custom-node {
  background: #141b2d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 8px;
  width: 250px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  position: relative;
}

.custom-node::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.custom-node.financial::after { background: #00d2ff; }
.custom-node.customer::after { background: #ffaa00; }
.custom-node.internal_process::after { background: #8a2be2; }
.custom-node.learning_growth::after { background: #4bff4b; }

.node-header {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: rgba(255,255,255,0.4);
  margin-bottom: 6px;
  text-transform: uppercase;
  font-weight: 700;
}

.node-title {
  font-size: 12px;
  font-weight: 500;
  margin: 0 0 10px 0;
  line-height: 1.4;
  white-space: normal;
  color: white;
}

.node-progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-progress-track {
  height: 4px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  flex-grow: 1;
  overflow: hidden;
}

.node-progress-bar {
  height: 100%;
  border-radius: 2px;
}

.node-progress-bar.ontrack { background: #88ff88; }
.node-progress-bar.atrisk { background: #ffcc66; }
.node-progress-bar.offtrack { background: #ff8888; }

.node-progress-pct {
  font-size: 10px;
  font-weight: 600;
}

/* Side Panel Creator */
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.creator-card h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 6px 0;
}

.section-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0 0 20px 0;
  line-height: 1.4;
}

.link-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

select, input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 10px;
  color: white;
  font-family: inherit;
  font-size: 13px;
  outline: none;
}

select:focus, input:focus {
  border-color: #0066ff;
}

.submit-btn {
  background: #0066ff;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
  transition: all 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background: #0055dd;
}

.submit-btn:disabled {
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.3);
  cursor: not-allowed;
}

/* Links List */
.links-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 350px;
  overflow-y: auto;
  padding-right: 4px;
}

.links-list::-webkit-scrollbar {
  width: 4px;
}

.links-list::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
}

.link-item {
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.link-item-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.link-names {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.kr-node-ref {
  background: rgba(255,255,255,0.04);
  padding: 2px 6px;
  border-radius: 4px;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

.direction-arrow {
  color: #00d2ff;
}

.delete-link-btn {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.3);
  cursor: pointer;
  padding: 2px;
  font-size: 12px;
}

.delete-link-btn:hover {
  color: #ff6666;
}

.link-item-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rel-badge {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(0, 102, 255, 0.15);
  color: #8cc4ff;
  padding: 1px 6px;
  border-radius: 4px;
}

.link-note {
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.success-msg {
  color: #88ff88;
  font-size: 12px;
  margin: 6px 0 0 0;
  text-align: center;
}

.error-msg {
  color: #ff8888;
  font-size: 12px;
  margin: 6px 0 0 0;
  text-align: center;
}
</style>

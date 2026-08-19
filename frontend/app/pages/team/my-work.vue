<template>
  <div class="admin-root">
    <div class="admin-content">
      <div class="header-section card">
        <div class="header-title">
          <h2>Pekerjaan Saya</h2>
          <p class="section-desc">
            Inisiatif tim dan KPI yang menjadi tanggung jawab Anda hari ini.
          </p>
        </div>
      </div>

      <div v-if="loading" class="alert alert-info">Memuat data...</div>
      <div v-else-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>
      <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

      <!-- Inisiatif Tim Section -->
      <div v-if="!loading && teamInitiatives.length > 0" class="team-initiatives-section">
        <h3 class="section-title">Inisiatif Saya</h3>
        <div class="initiative-list">
          <div v-for="ini in teamInitiatives" :key="ini.id" class="ini-card card">
            <div class="ini-header">
              <h4>{{ ini.title }}</h4>
              <div class="badge-group" style="display: flex; gap: 8px; align-items: center;">
                <span class="status-badge" :class="getStatusClass(ini.status)">{{ ini.status }}</span>
                <span class="status-badge" style="background: #cbd5e1; color: #334155;">{{ ini.kanbanStatus }}</span>
              </div>
            </div>
            <div class="ini-context">
              <p><strong>KR:</strong> {{ ini.keyResult?.title }}</p>
              <p><strong>Tim:</strong> {{ ini.team?.name }} <span v-if="ini.owner" class="text-sm text-gray" style="margin-left: 8px;">(PIC: <strong>{{ ini.owner.name }}</strong>)</span></p>
            </div>

            <!-- Realisasi vs Target Inisiatif -->
            <div class="ini-progress-section" style="margin-top: 12px; margin-bottom: 12px;">
              <div class="progress-labels" style="display: flex; justify-content: space-between; font-size: 13px; color: #475569;">
                <span>Target Inisiatif: <strong>{{ ini.targetValue }} {{ ini.unit || '%' }}</strong></span>
                <span>Realisasi: <strong>{{ ini.currentValue }} {{ ini.unit || '%' }}</strong></span>
              </div>
              <div class="progress-bar-container" style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 4px;">
                <div class="progress-bar" :style="{ width: getProgressPercent(ini) + '%', height: '100%', background: '#0ea5e9' }"></div>
              </div>
            </div>

            <!-- Riwayat Laporan Inisiatif -->
            <div v-if="ini.progressUpdates?.length > 0" class="ini-updates" style="background: #f8fafc; padding: 10px; border-radius: 8px; font-size: 12px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="font-weight: 500; color: #475569;">📋 Riwayat Laporan ({{ ini.progressUpdates.length }})</div>
                <button v-if="ini.progressUpdates.length > 1 && ['TEAM', 'LEADER', 'ADMIN'].includes(userRole)" 
                        class="toggle-history-btn" 
                        style="margin: 0;"
                        @click="toggleIniHistory(ini.id)">
                  {{ expandedIniIds.includes(ini.id) ? '▲ Sembunyikan' : `▼ Lihat ${ini.progressUpdates.length - 1} riwayat sebelumnya` }}
                </button>
              </div>

              <!-- Update terbaru selalu tampil -->
              <div class="history-item" style="padding: 0; background: transparent;">
                <div class="history-timestamp">🕐 {{ formatDateTime(ini.progressUpdates[0].createdAt) }}</div>
                <div class="history-value">
                  Realisasi: <strong>{{ ini.progressUpdates[0].newValue }} {{ ini.unit || '%' }}</strong>
                  <span class="prev-value">(dari {{ ini.progressUpdates[0].oldValue }})</span>
                </div>
                <div v-if="ini.progressUpdates[0].kanbanStatus" class="history-kanban">
                  Status: <span class="kanban-tag">{{ ini.progressUpdates[0].kanbanStatus }}</span>
                </div>
                <div v-if="ini.progressUpdates[0].note" class="history-note">"{{ ini.progressUpdates[0].note }}"</div>
              </div>

              <!-- History lainnya disembunyikan pakai toggle -->
              <div v-if="expandedIniIds.includes(ini.id)" class="history-timeline">
                <div v-for="upd in ini.progressUpdates.slice(1)" :key="upd.id" class="history-item">
                  <div class="history-timestamp">🕐 {{ formatDateTime(upd.createdAt) }}</div>
                  <div class="history-value">
                    Realisasi: <strong>{{ upd.newValue }} {{ ini.unit || '%' }}</strong>
                    <span class="prev-value">(dari {{ upd.oldValue }})</span>
                  </div>
                  <div v-if="upd.kanbanStatus" class="history-kanban">
                    Status: <span class="kanban-tag">{{ upd.kanbanStatus }}</span>
                  </div>
                  <div v-if="upd.note" class="history-note">"{{ upd.note }}"</div>
                </div>
              </div>
            </div>
            
            <div v-if="ini.kpis?.length > 0" class="ini-kpis">
              <h5>KPI Terkait:</h5>
              <div class="kpi-progress-list">
                <div v-for="kpi in ini.kpis" :key="kpi.id" class="kpi-progress-item">
                  <div class="kpi-progress-header">
                    <span class="kpi-title">{{ kpi.title }}</span>
                    <span class="kpi-numbers">{{ kpi.currentValue }}/{{ kpi.targetValue }} {{ kpi.unit }}</span>
                  </div>
                  <div class="progress-bar-container small">
                    <div class="progress-bar" :style="{ width: getProgressPercent(kpi) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-sm text-gray mt-2">Belum ada KPI untuk inisiatif ini.</div>

            <div class="card-actions" style="margin-top: 16px;">
              <button class="secondary-btn full-width" style="width: 100%; border: 1px dashed #0ea5e9; color: #0ea5e9;" @click="openIniModal(ini)">📝 Laporkan Progress Inisiatif</button>
            </div>
          </div>
        </div>
      </div>

      <h3 class="section-title mt-6">KPI Yang Di-Assign Ke Saya</h3>
      <div v-if="!loading && kpiAssignments.length === 0" class="empty-state card">
        Belum ada KPI yang di-assign ke Anda.
      </div>

      <div class="kpi-grid">
        <div v-for="assign in kpiAssignments" :key="assign.id" class="kpi-card card">
          <div class="kpi-header">
            <h3>{{ assign.kpi.title }}</h3>
            <span class="status-badge" :class="getStatusClass(assign.kpi.status)">{{ assign.kpi.status }}</span>
          </div>
          
          <div class="kpi-context">
            <p><strong>KR:</strong> {{ assign.kpi.initiative?.keyResult?.title }}</p>
            <p><strong>Inisiatif:</strong> {{ assign.kpi.initiative?.title }}</p>
          </div>
          
          <div class="kpi-progress-section">
            <div class="progress-labels">
              <span>Target: <strong>{{ assign.kpi.targetValue }} {{ assign.kpi.unit }}</strong></span>
              <span>Saat ini: <strong>{{ assign.kpi.currentValue }} {{ assign.kpi.unit }}</strong></span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar" :style="{ width: getProgressPercent(assign.kpi) + '%' }"></div>
            </div>
          </div>
          
          <div class="kpi-updates">
            <div v-if="assign.kpi.updates?.length > 0">
              <!-- Update terbaru selalu tampil -->
              <div class="update-latest">
                <span class="update-timestamp">{{ formatDateTime(assign.kpi.updates[0].createdAt) }}</span>
                <span class="update-val">Nilai dilaporkan: {{ assign.kpi.updates[0].newValue }}</span>
                <span class="update-status" :class="'status-' + assign.kpi.updates[0].status.toLowerCase()">
                  {{ getUpdateStatusLabel(assign.kpi.updates[0].status) }}
                </span>
                <span v-if="assign.kpi.updates[0].note" class="history-note">"{{ assign.kpi.updates[0].note }}"</span>
              </div>

              <!-- Toggle history lama -->
              <div v-if="assign.kpi.updates.length > 1 && ['TEAM', 'LEADER', 'ADMIN'].includes(userRole)">
                <button class="toggle-history-btn" @click="toggleKpiHistory(assign.kpi.id)">
                  {{ expandedKpiIds.includes(assign.kpi.id)
                    ? '▲ Sembunyikan riwayat'
                    : `▼ Lihat ${assign.kpi.updates.length - 1} riwayat sebelumnya` }}
                </button>
                <div v-if="expandedKpiIds.includes(assign.kpi.id)" class="history-timeline">
                  <div v-for="upd in assign.kpi.updates.slice(1)" :key="upd.id" class="history-item">
                    <span class="history-timestamp">{{ formatDateTime(upd.createdAt) }}</span>
                    <span class="history-value">Nilai: {{ upd.newValue }}</span>
                    <span class="update-status" :class="'status-' + upd.status.toLowerCase()">
                      {{ getUpdateStatusLabel(upd.status) }}
                    </span>
                    <div v-if="upd.note" class="history-note">"{{ upd.note }}"</div>
                    <div v-if="upd.reviewNote" class="reject-note">
                      ❌ Alasan reject: "{{ upd.reviewNote }}"
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray">Belum ada update.</p>
          </div>
          
          <div class="card-actions">
            <button class="primary-btn full-width" @click="openUpdateModal(assign.kpi)">Submit Update Progress</button>
          </div>
        </div>
      </div>

      <!-- Pekerjaan Tim Saya -->
      <div v-if="['TEAM', 'LEADER', 'ADMIN'].includes(userRole)" class="team-section mt-8">
        <h3 class="section-title">👥 Pekerjaan Tim Saya</h3>
        
        <div v-if="(teamMembersWork.kpiAssignments?.length || 0) === 0 && (teamMembersWork.initiatives?.length || 0) === 0" class="empty-state card mt-4">
          Belum ada inisiatif atau KPI yang dikerjakan oleh anggota tim Anda.
        </div>

        <div v-else>
          <!-- Team Initiatives -->
          <div v-if="teamMembersWork.initiatives?.length > 0" class="mb-6">
            <h4 class="text-gray mb-4">Inisiatif Tim</h4>
            <div class="initiative-list">
              <div v-for="ini in teamMembersWork.initiatives" :key="'team_ini_'+ini.id" class="ini-card card">
                <div class="ini-header">
                  <h4>{{ ini.title }}</h4>
                  <div class="badge-group" style="display: flex; gap: 8px; align-items: center;">
                    <span class="status-badge" :class="getStatusClass(ini.status)">{{ ini.status }}</span>
                    <span class="status-badge" style="background: #cbd5e1; color: #334155;">{{ ini.kanbanStatus }}</span>
                  </div>
                </div>
                <div class="ini-context">
                  <p><strong>KR:</strong> {{ ini.keyResult?.title }}</p>
                  <p><strong>PIC:</strong> 👤 {{ ini.owner?.name || '-' }}</p>
                </div>

                <div class="ini-progress-section" style="margin-top: 12px; margin-bottom: 12px;">
                  <div class="progress-labels" style="display: flex; justify-content: space-between; font-size: 13px; color: #475569;">
                    <span>Target: <strong>{{ ini.targetValue }} {{ ini.unit || '%' }}</strong></span>
                    <span>Realisasi: <strong>{{ ini.currentValue }} {{ ini.unit || '%' }}</strong></span>
                  </div>
                  <div class="progress-bar-container" style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 4px;">
                    <div class="progress-bar" :style="{ width: getProgressPercent(ini) + '%', height: '100%', background: '#0ea5e9' }"></div>
                  </div>
                </div>

                <!-- History Inisiatif -->
                <div class="ini-updates" style="background: #f8fafc; padding: 10px; border-radius: 8px; font-size: 12px;">
                  <div v-if="ini.progressUpdates?.length > 0">
                    <div class="history-item" style="padding: 0; background: transparent;">
                      <div class="history-timestamp">🕐 {{ formatDateTime(ini.progressUpdates[0].createdAt) }}</div>
                      <div class="history-value">Realisasi: <strong>{{ ini.progressUpdates[0].newValue }} {{ ini.unit || '%' }}</strong></div>
                      <div v-if="ini.progressUpdates[0].kanbanStatus" class="history-kanban">Status: <span class="kanban-tag">{{ ini.progressUpdates[0].kanbanStatus }}</span></div>
                      <div v-if="ini.progressUpdates[0].note" class="history-note">"{{ ini.progressUpdates[0].note }}"</div>
                    </div>
                    
                    <div v-if="ini.progressUpdates.length > 1">
                      <button class="toggle-history-btn" @click="toggleIniHistory('team_' + ini.id)">
                        {{ expandedIniIds.includes('team_' + ini.id) ? '▲ Sembunyikan' : `▼ Lihat ${ini.progressUpdates.length - 1} riwayat sebelumnya` }}
                      </button>
                      <div v-if="expandedIniIds.includes('team_' + ini.id)" class="history-timeline">
                        <div v-for="upd in ini.progressUpdates.slice(1)" :key="upd.id" class="history-item">
                          <div class="history-timestamp">🕐 {{ formatDateTime(upd.createdAt) }}</div>
                          <div class="history-value">Realisasi: <strong>{{ upd.newValue }} {{ ini.unit || '%' }}</strong></div>
                          <div v-if="upd.note" class="history-note">"{{ upd.note }}"</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-sm text-gray">Belum ada laporan progress.</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Team KPIs -->
          <div v-if="teamMembersWork.kpiAssignments?.length > 0">
            <h4 class="text-gray mb-4">KPI Tim</h4>
            <div class="kpi-grid">
              <div v-for="assign in teamMembersWork.kpiAssignments" :key="'team_kpi_'+assign.id" class="kpi-card card">
                <div class="member-badge">
                  👤 {{ assign.user?.name }}
                </div>
                
                <div class="kpi-header">
                  <h3>{{ assign.kpi.title }}</h3>
                  <span class="status-badge" :class="getStatusClass(assign.kpi.status)">{{ assign.kpi.status }}</span>
                </div>

                <div class="kpi-context">
                  <p><strong>KR:</strong> {{ assign.kpi.initiative?.keyResult?.title }}</p>
                  <p><strong>Inisiatif:</strong> {{ assign.kpi.initiative?.title }}</p>
                </div>

                <div class="kpi-progress-section">
                  <div class="progress-labels">
                    <span>Target: <strong>{{ assign.kpi.targetValue }} {{ assign.kpi.unit }}</strong></span>
                    <span>Saat ini: <strong>{{ assign.kpi.currentValue }} {{ assign.kpi.unit }}</strong></span>
                  </div>
                  <div class="progress-bar-container">
                    <div class="progress-bar" :style="{ width: getProgressPercent(assign.kpi) + '%' }"></div>
                  </div>
                </div>

                <!-- Full history untuk LEADER melihat anggota tim -->
                <div class="kpi-updates">
                  <div v-if="assign.kpi.updates?.length > 0">
                    <div class="update-latest">
                      <span class="update-timestamp">{{ formatDateTime(assign.kpi.updates[0].createdAt) }}</span>
                      <span class="update-val">Nilai dilaporkan: {{ assign.kpi.updates[0].newValue }}</span>
                      <span class="update-status" :class="'status-' + assign.kpi.updates[0].status.toLowerCase()">
                        {{ getUpdateStatusLabel(assign.kpi.updates[0].status) }}
                      </span>
                      <span v-if="assign.kpi.updates[0].note" class="history-note">"{{ assign.kpi.updates[0].note }}"</span>
                    </div>

                    <div v-if="assign.kpi.updates.length > 1">
                      <button class="toggle-history-btn" @click="toggleKpiHistory('team_' + assign.kpi.id)">
                        {{ expandedKpiIds.includes('team_' + assign.kpi.id)
                          ? '▲ Sembunyikan riwayat'
                          : `▼ Lihat ${assign.kpi.updates.length - 1} riwayat sebelumnya` }}
                      </button>
                      <div v-if="expandedKpiIds.includes('team_' + assign.kpi.id)" class="history-timeline">
                        <div v-for="upd in assign.kpi.updates.slice(1)" :key="upd.id" class="history-item">
                          <span class="history-timestamp">{{ formatDateTime(upd.createdAt) }}</span>
                          <span class="history-value">Nilai: {{ upd.newValue }}</span>
                          <span class="update-status" :class="'status-' + upd.status.toLowerCase()">
                            {{ getUpdateStatusLabel(upd.status) }}
                          </span>
                          <div v-if="upd.note" class="history-note">"{{ upd.note }}"</div>
                          <div v-if="upd.reviewNote" class="reject-note">❌ Alasan reject: "{{ upd.reviewNote }}"</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p v-else class="text-sm text-gray">Belum ada update.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal Submit Update KPI -->
      <div v-if="showUpdateModal" class="modal-overlay" @click.self="showUpdateModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Submit Update Progress KPI</h3>
            <button class="modal-close-btn" @click="showUpdateModal = false">&times;</button>
          </div>
          <p class="mb-4">KPI: <strong>{{ selectedKpi?.title }}</strong></p>
          
          <div class="info-box mb-4">
            Target: {{ selectedKpi?.targetValue }} {{ selectedKpi?.unit }}<br/>
            Saat ini: {{ selectedKpi?.currentValue }} {{ selectedKpi?.unit }}
          </div>
          
          <label>Nilai Baru (Kumulatif) *</label>
          <input v-model.number="updateForm.newValue" type="number" class="form-input" />
          
          <label>Catatan Progress</label>
          <textarea v-model="updateForm.note" class="form-input" rows="3" placeholder="Apa yang sudah dikerjakan?"></textarea>
          
          <div v-if="isAutoApproveRole" class="info-box info-approved mb-4">
            ✅ Sebagai <strong>{{ userRole }}</strong>, update Anda akan <strong>langsung diterapkan</strong> tanpa perlu persetujuan.
          </div>
          <div v-else class="info-box mb-4">
            ⏳ Update akan dikirim ke Leader/Manager untuk disetujui terlebih dahulu.
          </div>

          <!-- Riwayat KPI updates sebelumnya -->
          <div v-if="selectedKpi?.updates?.length > 0" class="mini-history mb-4" style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
            <h5 style="margin: 0 0 8px 0; font-size: 13px; color: #475569;">Riwayat Update Sebelumnya:</h5>
            <div style="max-height: 120px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
              <div v-for="upd in selectedKpi.updates" :key="upd.id" style="font-size: 11px; padding: 6px; border: 1px solid #e2e8f0; border-radius: 6px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">{{ new Date(upd.createdAt).toLocaleDateString('id-ID') }}</span>
                  <span style="font-weight: 500;">Nilai: {{ upd.newValue }}</span>
                </div>
                <div style="margin-top: 2px;">Status: {{ getUpdateStatusLabel(upd.status) }}</div>
                <div v-if="upd.note" style="color: #64748b; font-style: italic; margin-top: 2px;">"{{ upd.note }}"</div>
                <div v-if="upd.reviewNote" style="color: #ef4444; margin-top: 2px; font-weight: 500;">Alasan reject: "{{ upd.reviewNote }}"</div>
              </div>
            </div>
          </div>
          
          <div v-if="modalError" class="alert alert-error">{{ modalError }}</div>
          
          <div class="modal-actions">
            <button class="secondary-btn" @click="showUpdateModal = false">Batal</button>
            <button class="primary-btn" @click="submitUpdate" :disabled="saving">
              {{ saving ? 'Mengirim...' : 'Kirim Update' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Laporkan Progress Inisiatif -->
      <div v-if="showIniModal" class="modal-overlay" @click.self="showIniModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Laporkan Progress Inisiatif</h3>
            <button class="modal-close-btn" @click="showIniModal = false">&times;</button>
          </div>
          <p class="mb-4">Inisiatif: <strong>{{ selectedIni?.title }}</strong></p>
          
          <div class="info-box mb-4">
            Target: {{ selectedIni?.targetValue }} {{ selectedIni?.unit || '%' }}<br/>
            Saat ini: {{ selectedIni?.currentValue }} {{ selectedIni?.unit || '%' }}
          </div>

          <label>Status Pekerjaan (Kanban)</label>
          <select v-model="iniForm.kanbanStatus" class="form-input">
            <option value="TODO">📋 Todo</option>
            <option value="IN_PROGRESS">⚙️ In Progress</option>
            <option value="DONE">✅ Done</option>
          </select>
          
          <label>Nilai Realisasi Saat Ini *</label>
          <input v-model.number="iniForm.newValue" type="number" class="form-input" />
          
          <label>Catatan Progress / Notes *</label>
          <textarea v-model="iniForm.note" class="form-input" rows="3" placeholder="Informasi detail pekerjaan, kendala, atau note penting..."></textarea>
          
          <div class="info-box mb-4">
            ℹ️ Catatan progress inisiatif ini akan langsung disimpan ke history tanpa proses approval.
          </div>
          
          <div v-if="modalError" class="alert alert-error">{{ modalError }}</div>
          
          <div class="modal-actions">
            <button class="secondary-btn" @click="showIniModal = false">Batal</button>
            <button class="primary-btn" @click="submitIniUpdate" :disabled="saving">
              {{ saving ? 'Mengirim...' : 'Simpan Progress' }}
            </button>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const kpiAssignments = ref([]);
const teamInitiatives = ref([]);
const loading = ref(true);
const errorMsg = ref('');

const showUpdateModal = ref(false);
const showIniModal = ref(false);
const saving = ref(false);
const modalError = ref('');
const successMsg = ref('');
const selectedKpi = ref(null);
const selectedIni = ref(null);

const updateForm = ref({
  newValue: 0,
  note: ''
});

const iniForm = ref({
  newValue: 0,
  note: '',
  kanbanStatus: ''
});

const userRole = computed(() => authStore.user?.role || '');
const isAutoApproveRole = computed(() => ['LEADER', 'MANAGER', 'ADMIN'].includes(userRole.value));

const config = useRuntimeConfig();
const API = config.public.apiBase || 'http://localhost:3001/api';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authStore.token}`,
  };
}

onMounted(async () => {
  if (!authStore.isAuthenticated || !['TEAM', 'LEADER', 'MANAGER', 'ADMIN'].includes(authStore.user?.role)) {
    router.push('/login');
    return;
  }
  await fetchMyWork();
});

const teamMembersWork = ref({ kpiAssignments: [], initiatives: [] });
const expandedKpiIds = ref([]);
const expandedIniIds = ref([]);

function toggleKpiHistory(id) {
  const idx = expandedKpiIds.value.indexOf(id);
  if (idx === -1) expandedKpiIds.value.push(id);
  else expandedKpiIds.value.splice(idx, 1);
}

function toggleIniHistory(id) {
  const idx = expandedIniIds.value.indexOf(id);
  if (idx === -1) expandedIniIds.value.push(id);
  else expandedIniIds.value.splice(idx, 1);
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const dayName = days[d.getDay()];
  const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return `${dayName}, ${date} · ${time}`;
}

async function fetchMyWork() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await fetch(`${API}/initiatives/my-work/all`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Gagal memuat pekerjaan');
    const data = await res.json();
    kpiAssignments.value = data.kpiAssignments || [];
    teamInitiatives.value = data.myInitiatives || [];
    if (data.teamMembersWork && Object.keys(data.teamMembersWork).length > 0) {
      teamMembersWork.value = data.teamMembersWork;
    }
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}

function getProgressPercent(kpi) {
  if (!kpi || !kpi.targetValue) return 0;
  return Math.min(100, Math.max(0, (kpi.currentValue / kpi.targetValue) * 100));
}

function getStatusClass(status) {
  if (status === 'ON_TRACK') return 'bg-green';
  if (status === 'AT_RISK') return 'bg-yellow';
  if (status === 'OFF_TRACK') return 'bg-red';
  return 'bg-gray';
}

function openUpdateModal(kpi) {
  selectedKpi.value = kpi;
  updateForm.value = {
    newValue: kpi.currentValue,
    note: ''
  };
  modalError.value = '';
  showUpdateModal.value = true;
}

function openIniModal(ini) {
  selectedIni.value = ini;
  iniForm.value = {
    newValue: ini.currentValue,
    note: '',
    kanbanStatus: ini.kanbanStatus || 'TODO'
  };
  modalError.value = '';
  showIniModal.value = true;
}

async function submitUpdate() {
  if (updateForm.value.newValue === undefined || updateForm.value.newValue === null) {
    modalError.value = 'Nilai baru wajib diisi';
    return;
  }
  
  saving.value = true;
  modalError.value = '';
  try {
    const res = await fetch(`${API}/initiatives/kpis/${selectedKpi.value.id}/updates`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(updateForm.value)
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }

    const data = await res.json();
    showUpdateModal.value = false;
    await fetchMyWork(); // refresh

    successMsg.value = data.message || 'Update berhasil dikirim!';
    setTimeout(() => { successMsg.value = ''; }, 4000);
  } catch (err) {
    modalError.value = err.message;
  } finally {
    saving.value = false;
  }
}

async function submitIniUpdate() {
  if (iniForm.value.newValue === undefined || iniForm.value.newValue === null) {
    modalError.value = 'Nilai realisasi wajib diisi';
    return;
  }
  
  saving.value = true;
  modalError.value = '';
  try {
    const res = await fetch(`${API}/initiatives/${selectedIni.value.id}/progress-updates`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(iniForm.value)
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }

    const data = await res.json();
    showIniModal.value = false;
    await fetchMyWork(); // refresh

    successMsg.value = data.message || 'Laporan progress berhasil disimpan!';
    setTimeout(() => { successMsg.value = ''; }, 4000);
  } catch (err) {
    modalError.value = err.message;
  } finally {
    saving.value = false;
  }
}

function getUpdateStatusLabel(status) {
  const labels = {
    PENDING_APPROVAL: '⏳ Menunggu Persetujuan',
    APPROVED: '✅ Disetujui',
    REJECTED: '❌ Ditolak',
  };
  return labels[status] || status;
}


</script>

<style scoped>
.admin-root { min-height: 100vh; background-color: #f8fafc; padding: 32px; }
.admin-content { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
.card { background: #ffffff; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }
.header-section { display: flex; justify-content: space-between; align-items: center; }
.header-title h2 { font-size: 24px; font-weight: 600; color: #1e293b; margin: 0 0 8px 0; }
.section-desc { font-size: 14px; color: #64748b; margin: 0; }

.kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.kpi-card { display: flex; flex-direction: column; gap: 16px; }
.kpi-header { display: flex; justify-content: space-between; align-items: flex-start; }
.kpi-header h3 { font-size: 16px; margin: 0; color: #0f172a; flex: 1; }
.status-badge { font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 600; }

.kpi-context { background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 13px; color: #475569; }
.kpi-context p { margin: 0 0 4px 0; }
.kpi-context p:last-child { margin: 0; }

.kpi-progress-section { display: flex; flex-direction: column; gap: 8px; }
.progress-labels { display: flex; justify-content: space-between; font-size: 13px; color: #475569; }
.progress-bar-container { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.progress-bar { height: 100%; background: #0ea5e9; transition: width 0.3s; }

.kpi-updates h4 { margin: 0 0 8px 0; font-size: 13px; color: #64748b; }
.recent-update { display: flex; flex-direction: column; gap: 4px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; }
.update-date { color: #94a3b8; }
.update-val { font-weight: 500; color: #1e293b; }
.update-status { font-weight: 600; display: inline-block; width: fit-content; padding: 2px 6px; border-radius: 4px; }

.status-pending_approval { background: #fef08a; color: #854d0e; }
.status-approved { background: #dcfce7; color: #166534; }
.status-rejected { background: #fee2e2; color: #991b1b; }

.bg-green { background: #dcfce7; color: #166534; }
.bg-yellow { background: #fef08a; color: #854d0e; }
.bg-red { background: #fee2e2; color: #991b1b; }
.bg-gray { background: #f1f5f9; color: #475569; }

.text-gray { color: #64748b; }
.text-sm { font-size: 12px; }

.primary-btn { background: #0ea5e9; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
.primary-btn:hover { background: #0284c7; }
.primary-btn:disabled { background: #94a3b8; cursor: not-allowed; }
.primary-btn.full-width { width: 100%; margin-top: auto; }
.secondary-btn { background: white; color: #475569; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; font-weight: 500; cursor: pointer; }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-box { background: white; border-radius: 16px; padding: 24px; width: 100%; max-width: 500px; }
.info-box { background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 14px; border: 1px solid #e2e8f0; }
.form-input { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 16px; box-sizing: border-box; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
.alert { padding: 12px; border-radius: 8px; margin-bottom: 16px; }
.alert-error { background: #fee2e2; color: #991b1b; }
.alert-info { background: #e0f2fe; color: #075985; }
.alert-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.info-approved { background: #dcfce7; border-color: #bbf7d0; color: #166534; }

/* History timeline */
.history-timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding-left: 12px;
  border-left: 2px solid #e2e8f0;
}
.history-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 12px;
}
.history-timestamp {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}
.history-value { color: #1e293b; font-weight: 500; }
.prev-value { color: #94a3b8; font-size: 11px; margin-left: 4px; }
.history-note { color: #64748b; font-style: italic; }
.reject-note { color: #ef4444; font-weight: 500; font-size: 11px; }

.kanban-tag {
  background: #e0f2fe;
  color: #0369a1;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.toggle-history-btn {
  background: none;
  border: none;
  color: #0ea5e9;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 0;
  text-decoration: underline;
}

.update-latest { display: flex; flex-direction: column; gap: 3px; font-size: 12px; }
.update-timestamp { font-size: 11px; color: #94a3b8; font-weight: 500; }

/* Seksi tim (LEADER) */
.team-section { border-top: 2px solid #e2e8f0; padding-top: 24px; }
.member-badge {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 4px 10px;
  margin-bottom: 12px;
  display: inline-block;
}
.mt-8 { margin-top: 40px; }

.info-approved { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.mb-4 { margin-bottom: 16px; }

/* Initiatives styles */
.section-title { font-size: 18px; margin: 0 0 16px 0; color: #0f172a; }
.mt-6 { margin-top: 32px; }
.team-initiatives-section { margin-bottom: 24px; }
.initiative-list { display: flex; flex-direction: column; gap: 16px; }
.ini-card { display: flex; flex-direction: column; gap: 12px; }
.ini-header { display: flex; justify-content: space-between; align-items: flex-start; }
.ini-header h4 { font-size: 16px; margin: 0; color: #0f172a; }
.ini-context { background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 13px; color: #475569; }
.ini-context p { margin: 0 0 4px 0; }
.ini-context p:last-child { margin: 0; }
.ini-kpis { padding-top: 12px; border-top: 1px solid #f1f5f9; }
.ini-kpis h5 { font-size: 13px; margin: 0 0 12px 0; color: #64748b; }
.kpi-progress-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.kpi-progress-item { display: flex; flex-direction: column; gap: 6px; }
.kpi-progress-header { display: flex; justify-content: space-between; font-size: 12px; }
.kpi-title { font-weight: 500; color: #334155; }
.kpi-numbers { color: #64748b; }
.progress-bar-container.small { height: 6px; }

/* Modal Header styling */
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.modal-header h3 { margin: 0; }
.modal-close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #64748b; }
.modal-close-btn:hover { color: #0f172a; }
.alert-info { background: #e0f2fe; color: #075985; }
.mb-4 { margin-bottom: 16px; }
</style>

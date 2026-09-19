<template>
  <div class="dashboard-root">
    <div class="dashboard-container">
      <!-- Controls & Filter Row -->
      <section class="controls-card card">
        <div class="controls-content">
          <h2>Ringkasan Progres OKR</h2>

          <!-- Scope Selector (Visible to Admin, C-Level, Manager) -->
          <div v-if="showScopeSelector" class="scope-selector">
            <span class="scope-label">Lingkup (Scope):</span>
            <div class="scope-buttons">
              <button
                @click="changeScope('self')"
                :class="{ active: currentScope === 'self' }"
                class="scope-btn"
              >
                Pribadi (Self)
              </button>
              <button
                v-if="auth.user?.role !== 'EMPLOYEE'"
                @click="changeScope('team')"
                :class="{ active: currentScope === 'team' }"
                class="scope-btn"
              >
                Tim (Team)
              </button>
              <button
                v-if="
                  auth.user?.role === 'C_LEVEL' || auth.user?.role === 'ADMIN'
                "
                @click="changeScope('company')"
                :class="{ active: currentScope === 'company' }"
                class="scope-btn"
              >
                Perusahaan (Company)
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Task Summary Cards -->
      <section class="task-grid">
        <!-- Average Progress -->
        <div class="task-card card">
          <span class="task-label">Rata-Rata Progres</span>
          <div class="task-value-row">
            <span class="task-value"
              >{{ summaryData.metrics?.averageProgress || 0 }}%</span
            >
            <span
              v-if="summaryData.previousMetrics"
              class="delta-badge"
              :class="getDeltaClass(progressDelta)"
            >
              {{ formatDelta(progressDelta) }}
            </span>
            <div class="progress-ring-placeholder">
              <div
                class="progress-ring-fill"
                :style="{
                  width: (summaryData.metrics?.averageProgress || 0) + '%',
                }"
              ></div>
            </div>
          </div>
          <p
            v-if="compareFrom && !summaryData.previousMetrics"
            class="task-no-data"
          >
            Tidak ada data pada periode ini
          </p>
          <p v-else-if="summaryData.previousMetrics" class="task-desc">
            vs. {{ summaryData.previousMetrics.rangeLabel }}:
            {{ summaryData.previousMetrics.averageProgress }}%
          </p>
          <p v-else class="task-desc">
            Agregat progres seluruh Key Results dalam scope terpilih.
          </p>
        </div>

        <!-- OKR Status Counts -->
        <div class="task-card card">
          <span class="task-label">Status Key Results</span>
          <div class="status-summary-row">
            <div class="status-count-item">
              <div class="status-val-row">
                <span class="count-val ontrack">{{
                  summaryData.metrics?.onTrackCount || 0
                }}</span>
                <span
                  v-if="summaryData.previousMetrics"
                  class="delta-badge small"
                  :class="getDeltaClass(onTrackDelta)"
                >
                  {{ formatSimpleDelta(onTrackDelta) }}
                </span>
              </div>
              <span class="count-lbl">On Track</span>
            </div>
            <div class="status-count-item">
              <div class="status-val-row">
                <span class="count-val atrisk">{{
                  summaryData.metrics?.atRiskCount || 0
                }}</span>
                <span
                  v-if="summaryData.previousMetrics"
                  class="delta-badge small"
                  :class="getDeltaClass(atRiskDelta, true)"
                >
                  {{ formatSimpleDelta(atRiskDelta) }}
                </span>
              </div>
              <span class="count-lbl">At Risk</span>
            </div>
            <div class="status-count-item">
              <div class="status-val-row">
                <span class="count-val offtrack">{{
                  summaryData.metrics?.offTrackCount || 0
                }}</span>
                <span
                  v-if="summaryData.previousMetrics"
                  class="delta-badge small"
                  :class="getDeltaClass(offTrackDelta, true)"
                >
                  {{ formatSimpleDelta(offTrackDelta) }}
                </span>
              </div>
              <span class="count-lbl">Off Track</span>
            </div>
          </div>
          <p
            v-if="compareFrom && !summaryData.previousMetrics"
            class="task-no-data"
          >
            Tidak ada data pada periode ini
          </p>
          <p v-else-if="summaryData.previousMetrics" class="task-desc">
            vs. {{ summaryData.previousMetrics.rangeLabel }}
          </p>
          <p v-else class="task-desc">
            Status otomatis berdasarkan capaian vs target harian.
          </p>
        </div>
      </section>

      <!-- ─── SECTION: TEAM VIEW ─── -->
      <section v-if="userRole === 'TEAM'" class="role-section">
        <h3 class="section-title">Task Saya</h3>
        <div v-if="myTasks.length === 0" class="empty-state">
          Belum ada Task yang di-assign ke kamu.
        </div>
        <div v-else class="task-grid">
          <div v-for="task in myTasks" :key="task.id" class="task-card card">
            <div class="task-header">
              <h3>{{ task.title }}</h3>
              <span class="status-badge" :class="getStatusClass(task.status)">{{
                task.status
              }}</span>
            </div>

            <div class="task-context" v-if="task.initiative">
              <p v-if="task.initiative?.keyResult?.title">
                <strong>KR:</strong> {{ task.initiative.keyResult.title }}
              </p>
              <p v-if="task.initiative?.title">
                <strong>Inisiatif:</strong> {{ task.initiative.title }}
              </p>
            </div>

            <div class="task-progress-section">
              <div class="progress-labels">
                <span
                  >Target:
                  <strong>{{
                    formatTargetValue(task.targetValue, task.unit)
                  }}</strong></span
                >
                <span
                  >Saat ini:
                  <strong>{{
                    formatTargetValue(task.currentValue, task.unit)
                  }}</strong></span
                >
              </div>
              <div class="progress-bar-container">
                <div
                  class="progress-bar"
                  :style="{ width: getProgressPercent(task) + '%' }"
                ></div>
              </div>
            </div>

            <button
              class="primary-btn small"
              :disabled="isTaskDone(task)"
              @click="openTaskSubmitModal(task)"
            >
              Submit Update
            </button>
          </div>
        </div>
      </section>

      <!-- ─── SECTION: PERSETUJUAN TASK (LEADER & MANAGER) ─── -->
      <section
        v-if="
          ['LEADER', 'MANAGER'].includes(userRole) &&
          pendingApprovals.length > 0
        "
        class="role-section approvals-section"
      >
        <div class="section-title-row">
          <h3 class="section-title">Persetujuan Task — Level Di Bawahnya</h3>
          <span class="count-badge-sub"
            >{{ pendingApprovals.length }} Menunggu Persetujuan</span
          >
        </div>

        <div class="pending-list">
          <div v-for="upd in pendingApprovals" :key="upd.id" class="card mb-4">
            <div class="kr-main">
              <div class="kr-title-row mb-2">
                <span class="kr-title">{{ upd.initiative?.title }}</span>
                <span
                  class="badge"
                  :class="upd.type === 'TASK' ? 'bg-task' : 'bg-initiative'"
                >
                  {{ upd.type }}
                </span>
                <span class="badge bg-yellow ml-2">PENDING</span>
              </div>

              <div class="text-sm text-gray mb-4">
                <strong>Tim Pelaksana:</strong>
                {{ upd.initiative?.team?.name || "-" }}
              </div>

              <div class="update-details">
                <div class="detail-box">
                  <span class="lbl">Nilai Sebelumnya:</span>
                  <span class="val">{{ upd.oldValue }}</span>
                </div>
                <div class="detail-box">
                  <span class="lbl">Nilai Diajukan:</span>
                  <span class="val text-blue">{{ upd.newValue }}</span>
                </div>
                <div v-if="upd.note" class="detail-box flex-2">
                  <span class="lbl">Catatan:</span>
                  <span class="val italic">"{{ upd.note }}"</span>
                </div>
                <div v-if="upd.link" class="detail-box">
                  <span class="lbl">Dokumentasi:</span>
                  <span class="val">
                    <a
                      :href="upd.link"
                      target="_blank"
                      class="text-blue hover:underline font-semibold"
                    >
                      Link Hasil
                    </a>
                  </span>
                </div>
              </div>

              <div class="actions-row mt-4">
                <button
                  class="primary-btn small"
                  @click="handleApprove(upd.id)"
                >
                  Approve
                </button>
                <button class="danger-btn small" @click="openRejectModal(upd)">
                  Reject
                </button>
                <button
                  class="secondary-btn small"
                  @click="
                    openDetailModal(
                      upd.initiative?.title,
                      upd.type === 'TASK' ? 'Task' : 'Inisiatif',
                      upd,
                      '—',
                    )
                  "
                >
                  Lihat Detail
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── SECTION: TASK LINTAS DEPARTEMEN (CROSS-DEPARTMENT) ─── -->
      <section
        v-if="
          ['ADMIN', 'C_LEVEL', 'MANAGER', 'LEADER', 'TEAM'].includes(userRole)
        "
        class="role-section cross-dept-section"
      >
        <div class="section-title-row">
          <div>
            <div class="cross-dept-title-wrap">
              <h3 class="section-title">Task Lintas Departemen (Cross-Dept)</h3>
              <span class="count-badge-amber">
                {{
                  (crossDeptData.incoming?.length || 0) +
                  (crossDeptData.outgoing?.length || 0)
                }}
                Task Aktif
              </span>
            </div>
            <p class="section-sub-desc">
              Koordinasi penugasan antar divisi dengan alur lifecycle status
              terintegrasi & thread diskusi.
            </p>
          </div>
        </div>

        <!-- Metric Summary Cards -->
        <div class="cross-dept-summary-grid mb-4">
          <div class="cross-summary-card card">
            <span class="cross-summary-val text-blue">
              {{ crossDeptData.incoming?.length || 0 }}
            </span>
            <span class="cross-summary-lbl">Masuk (Target Dept Saya)</span>
          </div>
          <div class="cross-summary-card card">
            <span class="cross-summary-val text-amber">
              {{ crossDeptData.outgoing?.length || 0 }}
            </span>
            <span class="cross-summary-lbl">Keluar (Dibuat Dept Saya)</span>
          </div>
          <div class="cross-summary-card card">
            <span class="cross-summary-val text-red">
              {{ crossDeptNeedInfoCount }}
            </span>
            <span class="cross-summary-lbl">Butuh Info (Need Info)</span>
          </div>
          <div class="cross-summary-card card">
            <span class="cross-summary-val text-green">
              {{ crossDeptResolvedCount }}
            </span>
            <span class="cross-summary-lbl">Terselesaikan / Closed</span>
          </div>
        </div>

        <!-- Tab Controls -->
        <div class="cross-dept-tabs-nav mb-4">
          <button
            type="button"
            class="cross-dept-tab-btn"
            :class="{ active: activeCrossDeptTab === 'incoming' }"
            @click="activeCrossDeptTab = 'incoming'"
          >
            Masuk ke Departemen Saya ({{ crossDeptData.incoming?.length || 0 }})
          </button>
          <button
            type="button"
            class="cross-dept-tab-btn"
            :class="{ active: activeCrossDeptTab === 'outgoing' }"
            @click="activeCrossDeptTab = 'outgoing'"
          >
            Dibuat oleh Departemen Saya ({{
              crossDeptData.outgoing?.length || 0
            }})
          </button>
        </div>

        <!-- Tasks Content -->
        <div v-if="loadingCrossDept" class="cross-dept-empty-card card">
          Memuat data task lintas departemen...
        </div>
        <div
          v-else-if="currentCrossDeptList.length === 0"
          class="cross-dept-empty-card card"
        >
          {{
            activeCrossDeptTab === "incoming"
              ? "Tidak ada task lintas departemen yang masuk ke departemen Anda saat ini."
              : "Departemen Anda belum membuat permintaan task ke departemen lain."
          }}
        </div>
        <div v-else class="cross-dept-grid">
          <div
            v-for="task in currentCrossDeptList"
            :key="task.id"
            class="cross-dept-item-card card"
          >
            <div class="cross-dept-item-top">
              <span class="cross-dept-route-badge">
                {{ task.creatorDept || "?" }} → {{ task.targetDept || "?" }}
              </span>
              <span
                class="cross-dept-status-pill"
                :class="task.status.toLowerCase()"
              >
                {{ task.status }}
              </span>
            </div>

            <h4 class="cross-dept-item-title">{{ task.title }}</h4>
            <p v-if="task.description" class="cross-dept-item-desc">
              {{ task.description }}
            </p>

            <div class="cross-dept-meta-row">
              <span v-if="task.creator?.name" class="meta-sub">
                Pemohon: <strong>{{ task.creator.name }}</strong>
              </span>
              <span v-if="task.assignedTeamMember?.name" class="meta-sub">
                Assignee: <strong>{{ task.assignedTeamMember.name }}</strong>
              </span>
              <span v-if="task.dueDate" class="meta-sub">
                Due: <strong>{{ formatDate(task.dueDate) }}</strong>
              </span>
            </div>

            <div class="cross-dept-item-actions">
              <button
                type="button"
                class="btn-open-cross-thread"
                @click="openCrossDeptModal(task.id)"
              >
                💬 Buka Diskusi & Lifecycle
              </button>
              <a
                v-if="task.link"
                :href="task.link"
                target="_blank"
                class="btn-external-link"
              >
                Dokumen ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── SECTION: INITIATIVE PROGRESS (Leader, Manager, C-Level, Admin) ─── -->
      <section v-if="showInitiativeProgress" class="role-section">
        <div class="section-title-row">
          <h3 class="section-title">Progress Capaian Initiative</h3>
          <span class="count-badge-sub">
            {{ initProgressData.summary?.totalInitiatives || 0 }} Initiative
          </span>
        </div>

        <!-- Summary Cards Grid -->
        <div class="init-summary-grid">
          <div class="init-summary-card card">
            <span class="summary-val"
              >{{ initProgressData.summary?.avgProgress || 0 }}%</span
            >
            <span class="summary-lbl">Rata-rata Progress</span>
          </div>
          <div class="init-summary-card card">
            <span class="summary-val">
              {{ initProgressData.summary?.completedTasks || 0 }}/{{
                initProgressData.summary?.totalTasks || 0
              }}
            </span>
            <span class="summary-lbl">Task Selesai</span>
          </div>
          <div class="init-summary-card card">
            <span class="summary-val done-val">
              {{ initProgressData.summary?.byKanbanStatus?.DONE || 0 }}
            </span>
            <span class="summary-lbl">Initiative Done</span>
          </div>
          <div class="init-summary-card card">
            <span class="summary-val progress-val">
              {{ initProgressData.summary?.byKanbanStatus?.IN_PROGRESS || 0 }}
            </span>
            <span class="summary-lbl">In Progress</span>
          </div>
        </div>

        <!-- Grouped by Key Result -->
        <div
          v-for="group in initProgressData.byKeyResult"
          :key="group.keyResult?.id"
          class="kr-group-card card"
        >
          <div class="kr-group-header">
            <div class="kr-group-title-wrap">
              <span
                class="perspective-badge"
                :class="group.keyResult?.bscPerspective?.toLowerCase()"
              >
                {{ formatPerspective(group.keyResult?.bscPerspective) }}
              </span>
              <h4>{{ group.keyResult?.title }}</h4>
              <span class="kr-obj-context" v-if="group.keyResult?.objective">
                {{ group.keyResult.objective.title }} ({{
                  group.keyResult.objective.year
                }})
              </span>
            </div>
            <div class="kr-group-progress-info">
              <span class="kr-progress-pct">{{ group.krProgress }}%</span>
              <div class="kr-mini-progress-track">
                <div
                  class="kr-mini-progress-bar"
                  :style="{ width: group.krProgress + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Initiative rows under this KR -->
          <div
            v-for="init in group.initiatives"
            :key="init.id"
            class="init-progress-row"
          >
            <div class="init-row-header">
              <div class="init-row-left">
                <span
                  class="kanban-dot"
                  :class="init.kanbanStatus?.toLowerCase()"
                ></span>
                <span class="init-row-title">{{ init.title }}</span>
                <span class="team-mini-badge">{{ init.team?.name }}</span>
              </div>
              <div class="init-row-right">
                <span class="init-pct">{{ init.calculatedProgress }}%</span>
                <span class="task-count-mini">
                  {{ init.completedTasks }}/{{ init.totalTasks }} Task
                </span>
              </div>
            </div>
            <div class="init-progress-track">
              <div
                class="init-progress-bar"
                :class="getProgressColorClass(init.calculatedProgress)"
                :style="{ width: init.calculatedProgress + '%' }"
              ></div>
            </div>

            <!-- Task detail rows -->
            <div v-if="init.tasks?.length" class="task-detail-grid">
              <div
                v-for="task in init.tasks"
                :key="task.id"
                class="task-detail-row"
              >
                <span class="task-detail-name">{{ task.title }}</span>
                <span class="task-detail-val">
                  {{ formatTargetValue(task.currentValue, task.unit) }} /
                  {{ formatTargetValue(task.targetValue, task.unit) }}
                </span>
                <div class="task-mini-track">
                  <div
                    class="task-mini-bar"
                    :style="{ width: task.progressPercent + '%' }"
                  ></div>
                </div>
                <span class="task-mini-pct">{{ task.progressPercent }}%</span>
                <div class="task-assignees-mini">
                  <span
                    v-for="a in task.assignments"
                    :key="a.userId"
                    class="assignee-mini"
                  >
                    {{ a.user?.name }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!initProgressData.byKeyResult?.length" class="empty-state">
          Belum ada Initiative yang terdaftar pada lingkup ini.
        </div>
      </section>

      <!-- ─── MODAL: Submit Task Update (TEAM) ─── -->
      <div
        v-if="showTaskSubmitModal"
        class="modal-overlay"
        @click.self="showTaskSubmitModal = false"
      >
        <div class="modal-box">
          <div class="modal-header">
            <h3>Submit Update Progress Task</h3>
            <button
              class="modal-close-btn"
              @click="showTaskSubmitModal = false"
            >
              &times;
            </button>
          </div>
          <p class="mb-4" style="font-size: 14px; color: #334155">
            Task: <strong>{{ selectedTask?.title }}</strong>
          </p>

          <div class="info-box mb-4">
            Target:
            <strong
              >{{ selectedTask?.targetValue }}
              {{ selectedTask?.unit || "" }}</strong
            ><br />
            Saat ini:
            <strong
              >{{ selectedTask?.currentValue }}
              {{ selectedTask?.unit || "" }}</strong
            >
          </div>

          <label
            style="
              display: block;
              font-size: 13px;
              font-weight: 500;
              margin-bottom: 4px;
              color: #475569;
            "
            >Nilai Baru (Kumulatif) *</label
          >
          <input
            v-model.number="submitNewValue"
            type="number"
            class="form-input"
          />

          <label
            style="
              display: block;
              font-size: 13px;
              font-weight: 500;
              margin-bottom: 4px;
              color: #475569;
            "
            >Catatan Progress</label
          >
          <textarea
            v-model="submitNote"
            class="form-input"
            rows="3"
            placeholder="Apa yang sudah dikerjakan?"
          ></textarea>

          <label
            style="
              display: block;
              font-size: 13px;
              font-weight: 500;
              margin-bottom: 4px;
              color: #475569;
            "
            >Link Dokumentasi Hasil (opsional)</label
          >
          <input
            v-model="submitLink"
            type="url"
            class="form-input"
            placeholder="https://example.com/..."
          />

          <div
            v-if="['ADMIN', 'C_LEVEL', 'MANAGER', 'LEADER'].includes(userRole)"
            class="info-box info-approved mb-4"
          >
            Sebagai <strong>{{ userRole }}</strong
            >, update Anda akan <strong>langsung diterapkan</strong> tanpa perlu
            persetujuan.
          </div>
          <div v-else class="info-box mb-4">
            Update akan dikirim ke Leader/Manager untuk disetujui terlebih
            dahulu.
          </div>

          <!-- Riwayat Task updates sebelumnya jika ada -->
          <div
            v-if="selectedTask?.updates?.length > 0"
            class="mini-history mb-4"
            style="border-top: 1px solid #e2e8f0; padding-top: 12px"
          >
            <h5 style="margin: 0 0 8px 0; font-size: 13px; color: #475569">
              Riwayat Update Sebelumnya:
            </h5>
            <div
              style="
                max-height: 120px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 8px;
              "
            >
              <div
                v-for="upd in selectedTask.updates"
                :key="upd.id"
                style="
                  font-size: 11px;
                  padding: 6px;
                  border: 1px solid #e2e8f0;
                  border-radius: 6px;
                "
              >
                <div style="display: flex; justify-content: space-between">
                  <span style="color: #64748b">{{
                    new Date(upd.createdAt).toLocaleDateString("id-ID")
                  }}</span>
                  <span style="font-weight: 500"
                    >Nilai: {{ upd.newValue }}</span
                  >
                </div>
                <div style="margin-top: 2px">Status: {{ upd.status }}</div>
                <div
                  v-if="upd.note"
                  style="color: #64748b; font-style: italic; margin-top: 2px"
                >
                  "{{ upd.note }}"
                </div>
                <div
                  v-if="upd.reviewNote"
                  style="color: #ef4444; margin-top: 2px; font-weight: 500"
                >
                  Alasan reject: "{{ upd.reviewNote }}"
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="secondary-btn" @click="showTaskSubmitModal = false">
              Batal
            </button>
            <button class="primary-btn" @click="submitTaskUpdate">
              Kirim Update
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Detail Hasil Kerja / Popup Hasil -->
      <div
        v-if="showDetailModal"
        class="modal-overlay"
        @click.self="showDetailModal = false"
      >
        <div class="modal-box">
          <div class="modal-header">
            <h3>Detail Progress & Hasil</h3>
            <button class="modal-close-btn" @click="showDetailModal = false">
              &times;
            </button>
          </div>
          <div class="info-box mb-4">
            <p>
              <strong>Item:</strong> {{ detailData.type }} -
              {{ detailData.title }}
            </p>
            <p>
              <strong>Dilaporkan Oleh:</strong> {{ detailData.submittedBy }}
            </p>
            <p><strong>Tanggal:</strong> {{ detailData.date }}</p>
          </div>
          <div class="mb-4">
            <span
              class="lbl"
              style="display: block; font-weight: 600; margin-bottom: 4px"
              >Perubahan Progress:</span
            >
            <span class="val" style="font-size: 16px"
              >Realisasi: <strong>{{ detailData.newValue }}</strong> (dari
              {{ detailData.oldValue }})</span
            >
          </div>
          <div class="mb-4">
            <span
              class="lbl"
              style="display: block; font-weight: 600; margin-bottom: 4px"
              >Catatan Progress:</span
            >
            <span
              class="val"
              style="
                display: block;
                background: #f8fafc;
                padding: 10px;
                border-radius: 8px;
                font-style: italic;
                border: 1px solid #e2e8f0;
                white-space: pre-line;
              "
            >
              {{ detailData.note }}
            </span>
          </div>
          <div class="mb-4">
            <span
              class="lbl"
              style="display: block; font-weight: 600; margin-bottom: 4px"
              >Link Dokumentasi:</span
            >
            <div v-if="detailData.link" style="margin-top: 8px">
              <a
                :href="detailData.link"
                target="_blank"
                class="primary-btn"
                style="
                  display: inline-flex;
                  align-items: center;
                  gap: 6px;
                  text-decoration: none;
                  font-size: 14px;
                "
              >
                Buka Link Dokumentasi
              </a>
            </div>
            <span v-else class="text-sm text-gray" style="font-style: italic"
              >Tidak ada link dokumentasi yang dilampirkan.</span
            >
          </div>
          <div class="modal-actions">
            <button class="secondary-btn" @click="showDetailModal = false">
              Tutup
            </button>
          </div>
        </div>
      </div>

      <!-- ─── MODAL: Reject Task Update (MANAGER) ─── -->
      <div
        v-if="showRejectModal"
        class="modal-overlay"
        @click.self="showRejectModal = false"
      >
        <div class="modal-box">
          <div class="modal-header">
            <h3>Tolak Update Task</h3>
            <button class="modal-close-btn" @click="showRejectModal = false">
              &times;
            </button>
          </div>
          <p>
            Berikan alasan penolakan untuk
            <strong>{{ selectedApproval?.task?.title }}</strong
            >:
          </p>
          <textarea
            v-model="rejectNote"
            class="form-input"
            rows="3"
            placeholder="Alasan penolakan (wajib diisi)..."
          ></textarea>
          <div class="modal-actions">
            <button class="secondary-btn" @click="showRejectModal = false">
              Batal
            </button>
            <button class="danger-btn" @click="handleReject">
              Tolak Update
            </button>
          </div>
        </div>
      </div>

      <!-- ─── MODAL: Update Monthly KR (LEADER) ─── -->
      <div
        v-if="showLeaderKrModal"
        class="modal-overlay"
        @click.self="showLeaderKrModal = false"
      >
        <div class="modal-box">
          <div class="modal-header">
            <h3>Update Manual Monthly Key Result</h3>
            <button class="modal-close-btn" @click="showLeaderKrModal = false">
              &times;
            </button>
          </div>
          <div class="mb-4">
            <span
              class="lbl"
              style="display: block; font-weight: 600; margin-bottom: 4px"
              >Key Result:</span
            >
            <span class="val" style="display: block; font-size: 14px">{{
              selectedLeaderKr?.title
            }}</span>
          </div>
          <div class="mb-4">
            <label
              class="lbl"
              style="display: block; font-weight: 600; margin-bottom: 4px"
              >Nilai Baru:</label
            >
            <input
              v-model.number="leaderSubmitValue"
              type="number"
              class="form-input"
            />
          </div>
          <div class="mb-4">
            <label
              class="lbl"
              style="display: block; font-weight: 600; margin-bottom: 4px"
              >Catatan Update (Wajib):</label
            >
            <textarea
              v-model="leaderSubmitNote"
              class="form-input"
              rows="3"
              placeholder="Masukkan alasan update manual..."
            ></textarea>
          </div>
          <div class="modal-actions">
            <button class="secondary-btn" @click="showLeaderKrModal = false">
              Batal
            </button>
            <button
              class="primary-btn"
              @click="submitLeaderKrUpdate"
              :disabled="!leaderSubmitNote"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>

      <!-- Objectives & Key Results List -->
      <section class="objectives-section">
        <div class="section-title-row">
          <h2>Daftar Target (Objectives)</h2>
          <span class="count-badge"
            >{{ summaryData.objectives?.length || 0 }} Objectives</span
          >
        </div>

        <div v-if="loading" class="skeleton-grid">
          <div class="skeleton-card card" v-for="i in 2" :key="i">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line desc"></div>
            <div class="skeleton-line progress"></div>
            <div class="skeleton-krs">
              <div class="skeleton-kr-item" v-for="j in 2" :key="j">
                <div class="skeleton-line title-sm"></div>
                <div class="skeleton-line bar"></div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else-if="
            !summaryData.objectives || summaryData.objectives.length === 0
          "
          class="empty-state"
        >
          Belum ada OKR yang terdaftar pada lingkup ini.
        </div>

        <div v-else class="objectives-grid">
          <!-- Objective Card -->
          <div
            v-for="(obj, index) in summaryData.objectives"
            :key="obj.id"
            class="objective-card card"
            draggable="true"
            @dragstart="onDragStart(index, $event)"
            @dragover.prevent
            @dragenter.prevent
            @drop="onDrop(index, $event)"
            @dragend="onDragEnd"
            :class="{ 'is-dragging': draggedIndex === index }"
            style="cursor: grab"
          >
            <div class="obj-card-header">
              <div>
                <span class="obj-year">{{ obj.year }}</span>
                <h3>{{ obj.title }}</h3>
                <p v-if="obj.description" class="obj-desc">
                  {{ obj.description }}
                </p>
              </div>
              <div class="obj-progress-badge">
                <span>{{ Math.round(obj.progress || 0) }}%</span>
                <span class="progress-lbl">Progres</span>
              </div>
            </div>

            <!-- Objective Progress Bar -->
            <div class="obj-progress-track">
              <div
                class="obj-progress-bar"
                :style="{ width: (obj.progress || 0) + '%' }"
              ></div>
            </div>

            <!-- Key Results nested list -->
            <div class="krs-section">
              <h4>Key Results (Indikator Capaian):</h4>
              <div class="krs-list">
                <div v-for="kr in obj.keyResults" :key="kr.id" class="kr-item">
                  <div class="kr-header-row">
                    <span class="kr-title">{{ kr.title }}</span>
                    <span
                      class="perspective-badge"
                      :class="kr.bscPerspective.toLowerCase()"
                    >
                      {{ formatPerspective(kr.bscPerspective) }}
                    </span>
                  </div>

                  <!-- KR Progress Bar -->
                  <div class="kr-progress-container">
                    <div class="kr-progress-track">
                      <div
                        class="kr-progress-bar"
                        :class="kr.status.toLowerCase().replace('_', '')"
                        :style="{ width: kr.progress + '%' }"
                      ></div>
                    </div>
                    <span class="kr-progress-val"
                      >{{ Math.round(kr.progress) }}%</span
                    >
                  </div>

                  <!-- Details -->
                  <div class="kr-details-row">
                    <span class="kr-values">
                      Nilai:
                      <strong>{{
                        formatTargetValue(kr.currentValue, kr.unit)
                      }}</strong>
                      /
                      {{ formatTargetValue(kr.targetValue, kr.unit) }}
                    </span>
                    <span
                      class="status-badge"
                      :class="kr.status.toLowerCase().replace('_', '')"
                    >
                      {{ kr.status.replace("_", " ") }}
                    </span>
                  </div>

                  <!-- RACI Row -->
                  <div
                    v-if="
                      (kr.assignments && kr.assignments.length > 0) ||
                      (kr.departments && kr.departments.length > 0)
                    "
                    class="kr-raci-row"
                  >
                    <!-- Accountable -->
                    <div
                      class="raci-mini-group"
                      v-if="
                        kr.assignments &&
                        kr.assignments.some((x) => x.raciRole === 'ACCOUNTABLE')
                      "
                    >
                      <span class="raci-mini-badge a-mini">A</span>
                      <span
                        v-for="a in kr.assignments.filter(
                          (x) => x.raciRole === 'ACCOUNTABLE',
                        )"
                        :key="a.id"
                        class="raci-chip accountable-chip"
                      >
                        {{ a.user.name }}
                      </span>
                    </div>
                    <!-- Responsible -->
                    <div
                      class="raci-mini-group"
                      v-if="
                        kr.assignments &&
                        kr.assignments.some((x) => x.raciRole === 'RESPONSIBLE')
                      "
                    >
                      <span class="raci-mini-badge r-mini">R</span>
                      <span
                        v-for="a in kr.assignments.filter(
                          (x) => x.raciRole === 'RESPONSIBLE',
                        )"
                        :key="a.id"
                        class="raci-chip responsible-chip"
                      >
                        {{ a.user.name }}
                        <span v-if="a.user.department" class="chip-dept"
                          >· {{ a.user.department }}</span
                        >
                      </span>
                    </div>
                    <!-- Departemen Terlibat -->
                    <div
                      class="kr-dept-row"
                      v-if="kr.departments && kr.departments.length > 0"
                    >
                      <span class="dept-mini-label">Dept:</span>
                      <span
                        v-for="d in kr.departments"
                        :key="d.id"
                        class="dept-mini-tag"
                        >{{ d.department }}</span
                      >
                    </div>
                  </div>

                  <!-- KR History Link -->
                  <div class="kr-history-link">
                    <NuxtLink
                      :to="`/kr-history?krId=${kr.id}&krTitle=${encodeURIComponent(kr.title)}&krTarget=${kr.targetValue}&krUnit=${encodeURIComponent(kr.unit)}`"
                      class="history-btn"
                    >
                      Lihat History
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Cross Department Discussion & Lifecycle Modal -->
      <CrossDeptCommentModal
        :task-id="activeCrossDeptTaskId"
        :is-open="showCrossDeptModal"
        @close="showCrossDeptModal = false"
        @task-updated="fetchCrossDeptTasks"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import CrossDeptCommentModal from "~/components/CrossDeptCommentModal.vue";

const auth = useAuthStore();
const config = useRuntimeConfig();

// Ambil role dari auth store
const userRole = computed(() => auth.user?.role || "");

// State Cross Department
const crossDeptData = ref({ incoming: [], outgoing: [], all: [] });
const activeCrossDeptTab = ref("incoming");
const loadingCrossDept = ref(false);
const showCrossDeptModal = ref(false);
const activeCrossDeptTaskId = ref("");

function openCrossDeptModal(taskId) {
  if (!taskId) return;
  activeCrossDeptTaskId.value = taskId;
  showCrossDeptModal.value = true;
}

async function fetchCrossDeptTasks() {
  loadingCrossDept.value = true;
  try {
    const res = await fetch(`${config.public.apiBase}/tasks/cross-dept`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
    });
    if (res.ok) {
      crossDeptData.value = await res.json();
    }
  } catch (err) {
    console.error("Fetch cross dept tasks error:", err);
  } finally {
    loadingCrossDept.value = false;
  }
}

const currentCrossDeptList = computed(() => {
  if (activeCrossDeptTab.value === "incoming") {
    return crossDeptData.value?.incoming || [];
  }
  return crossDeptData.value?.outgoing || [];
});

const crossDeptNeedInfoCount = computed(() => {
  const all = crossDeptData.value?.all || [];
  return all.filter((t) => t.status === "NEED_INFO").length;
});

const crossDeptResolvedCount = computed(() => {
  const all = crossDeptData.value?.all || [];
  return all.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED")
    .length;
});

// State untuk data TEAM
const myTasks = ref([]);
const myInitiatives = ref([]);

// State untuk data MANAGER
const pendingApprovals = ref([]);

// State untuk data LEADER
const leadingTeams = ref([]);
const leaderInitiatives = ref([]);
const leaderAssignedKrs = ref([]);
const leaderLoadingKrs = ref(false);

const showLeaderKrModal = ref(false);
const selectedLeaderKr = ref(null);
const leaderSubmitValue = ref(0);
const leaderSubmitNote = ref("");

async function fetchLeaderAssignedKrs() {
  if (userRole.value !== "LEADER") return;
  leaderLoadingKrs.value = true;
  try {
    const res = await $fetch(
      `${config.public.apiBase}/key-results/my/assigned`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
      },
    );
    leaderAssignedKrs.value = res || [];
  } catch (err) {
    console.error("Error fetching leader assigned KRs:", err);
  } finally {
    leaderLoadingKrs.value = false;
  }
}

function openLeaderKrUpdateModal(kr) {
  selectedLeaderKr.value = kr;
  leaderSubmitValue.value = kr.currentValue;
  leaderSubmitNote.value = "";
  showLeaderKrModal.value = true;
}

async function submitLeaderKrUpdate() {
  if (!selectedLeaderKr.value) return;
  if (!leaderSubmitNote.value) {
    alert("Catatan update wajib diisi!");
    return;
  }
  try {
    const response = await $fetch(
      `${config.public.apiBase}/key-results/${selectedLeaderKr.value.id}/progress`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: {
          newValue: leaderSubmitValue.value,
          note: leaderSubmitNote.value,
        },
      },
    );

    if (response) {
      showLeaderKrModal.value = false;
      await fetchLeaderAssignedKrs();
      if (showInitiativeProgress.value) {
        await fetchInitiativeProgress();
      }
      await fetchDashboardData();
    }
  } catch (err) {
    console.error("Error updating leader KR progress:", err);
    alert(err.data?.message || "Gagal mengupdate progress Key Result");
  }
}

function formatMonthLabel(monthStr) {
  if (!monthStr) return "";
  const parts = monthStr.split("-");
  if (parts.length !== 2) return monthStr;
  const year = parts[0];
  const monthNum = parseInt(parts[1], 10);
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
  return `${monthNames[monthNum - 1]} ${year}`;
}

// State & Computed untuk Initiative Progress (Leader, Manager, C-Level, Admin)
const initProgressData = ref({ initiatives: [], byKeyResult: [], summary: {} });

const showInitiativeProgress = computed(() => {
  return ["LEADER", "MANAGER", "C_LEVEL", "ADMIN"].includes(userRole.value);
});

function getProgressColorClass(pct) {
  if (pct >= 80) return "progress-high";
  if (pct >= 50) return "progress-mid";
  return "progress-low";
}

function getStatusClass(status) {
  if (status === "ON_TRACK") return "bg-green";
  if (status === "AT_RISK") return "bg-yellow";
  if (status === "OFF_TRACK") return "bg-red";
  return "bg-gray";
}

function isTaskDone(task) {
  if (!task) return false;
  const status = String(task.status || "").toUpperCase();
  const kanbanStatus = String(task.kanbanStatus || "").toUpperCase();
  return (
    status === "DONE" ||
    status === "COMPLETED" ||
    kanbanStatus === "DONE" ||
    kanbanStatus === "COMPLETED"
  );
}

function getProgressPercent(task) {
  if (!task || !task.targetValue || task.targetValue <= 0) return 0;
  return Math.min(
    100,
    Math.max(0, (task.currentValue / task.targetValue) * 100),
  );
}

async function fetchInitiativeProgress() {
  try {
    const res = await $fetch(`${config.public.apiBase}/initiatives/progress`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    initProgressData.value = res || {
      initiatives: [],
      byKeyResult: [],
      summary: {},
    };
  } catch (err) {
    console.error("Error fetching initiative progress:", err);
  }
}

const summaryData = ref({});
const currentScope = ref("self");
const loading = ref(false);

const compareFrom = ref("");
const compareTo = ref("");
const today = new Date().toISOString().split("T")[0];

function setShortcut(days) {
  const from = new Date();
  from.setDate(from.getDate() - days);
  compareFrom.value = from.toISOString().split("T")[0];
  compareTo.value = today;
  fetchDashboardData();
}

function clearComparison() {
  compareFrom.value = "";
  compareTo.value = "";
  fetchDashboardData();
}

const progressDelta = computed(() => {
  if (!summaryData.value.previousMetrics) return null;
  return (
    Math.round(
      ((summaryData.value.metrics?.averageProgress ?? 0) -
        summaryData.value.previousMetrics.averageProgress) *
        10,
    ) / 10
  );
});

const onTrackDelta = computed(() => {
  if (!summaryData.value.previousMetrics) return null;
  return (
    (summaryData.value.metrics?.onTrackCount ?? 0) -
    summaryData.value.previousMetrics.onTrackCount
  );
});

const atRiskDelta = computed(() => {
  if (!summaryData.value.previousMetrics) return null;
  return (
    (summaryData.value.metrics?.atRiskCount ?? 0) -
    summaryData.value.previousMetrics.atRiskCount
  );
});

const offTrackDelta = computed(() => {
  if (!summaryData.value.previousMetrics) return null;
  return (
    (summaryData.value.metrics?.offTrackCount ?? 0) -
    summaryData.value.previousMetrics.offTrackCount
  );
});

function formatDelta(delta) {
  if (delta === null || delta === undefined) return "";
  if (delta > 0) return `▲ +${delta}%`;
  if (delta < 0) return `▼ ${delta}%`;
  return "─ 0%";
}

function formatSimpleDelta(delta) {
  if (delta === null || delta === undefined) return "";
  if (delta > 0) return `▲ +${delta}`;
  if (delta < 0) return `▼ ${delta}`;
  return "─ 0";
}

function getDeltaClass(delta, invert = false) {
  if (delta === null || delta === undefined) return "delta-neutral";
  if (delta > 0) return invert ? "delta-down" : "delta-up";
  if (delta < 0) return invert ? "delta-up" : "delta-down";
  return "delta-neutral";
}

const orderLocalStorageKey = "okr-dashboard-objectives-order";
const draggedIndex = ref(null);

function applyCustomOrder() {
  if (!summaryData.value || !summaryData.value.objectives) return;
  const savedOrderStr = localStorage.getItem(orderLocalStorageKey);
  if (!savedOrderStr) return;

  try {
    const savedOrder = JSON.parse(savedOrderStr);
    summaryData.value.objectives.sort((a, b) => {
      const idxA = savedOrder.indexOf(a.id);
      const idxB = savedOrder.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  } catch (e) {
    console.error("Failed to parse custom objectives order", e);
  }
}

function onDragStart(index, event) {
  draggedIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
}

function onDrop(targetIndex, event) {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) return;

  const objectives = [...summaryData.value.objectives];
  const draggedObj = objectives.splice(draggedIndex.value, 1)[0];
  objectives.splice(targetIndex, 0, draggedObj);

  summaryData.value.objectives = objectives;

  const idsOrder = objectives.map((o) => o.id);
  localStorage.setItem(orderLocalStorageKey, JSON.stringify(idsOrder));

  draggedIndex.value = null;
}

function onDragEnd() {
  draggedIndex.value = null;
}

const showScopeSelector = computed(() => {
  return false;
});

function formatPerspective(p) {
  if (!p) return "";
  return p
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function changeScope(scope) {
  currentScope.value = scope;
  await fetchDashboardData();
}

async function fetchDashboardData() {
  loading.value = true;
  try {
    let url = `${config.public.apiBase}/dashboard/summary?scope=${currentScope.value}`;
    if (compareFrom.value && compareTo.value) {
      url += `&compareFrom=${compareFrom.value}&compareTo=${compareTo.value}`;
    }
    const response = await $fetch(url, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });

    if (userRole.value === "TEAM") {
      myTasks.value = response.myTasks || [];
      myInitiatives.value = response.initiatives || [];
    } else if (userRole.value === "LEADER") {
      leadingTeams.value = response.leadingTeams || [];
      leaderInitiatives.value = response.initiatives || [];
      await fetchPendingApprovals();
    } else if (userRole.value === "MANAGER") {
      pendingApprovals.value = response.pendingApprovals || [];
      await fetchPendingApprovals();
    }

    summaryData.value = response;
    applyCustomOrder();
  } catch (err) {
    console.error("Error fetching dashboard summary:", err);
  } finally {
    loading.value = false;
  }
}

async function fetchPendingApprovals() {
  if (!["LEADER", "MANAGER", "ADMIN", "C_LEVEL"].includes(userRole.value))
    return;
  try {
    const res = await $fetch(
      `${config.public.apiBase}/initiatives/initiative-updates/pending`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
      },
    );
    pendingApprovals.value = res || [];
  } catch (err) {
    console.error("Error fetching pending approvals:", err);
  }
}

onMounted(() => {
  // Default scope based on role: ADMIN/C_LEVEL -> company, MANAGER/LEADER -> team, others -> self
  if (auth.user?.role === "ADMIN" || auth.user?.role === "C_LEVEL") {
    currentScope.value = "company";
  } else if (auth.user?.role === "MANAGER" || auth.user?.role === "LEADER") {
    currentScope.value = "team";
  } else {
    currentScope.value = "self";
  }
  fetchDashboardData();
  if (showInitiativeProgress.value) {
    fetchInitiativeProgress();
  }
  if (["LEADER", "MANAGER"].includes(auth.user?.role)) {
    fetchPendingApprovals();
  }
  if (auth.user?.role === "LEADER") {
    fetchLeaderAssignedKrs();
  }
  fetchCrossDeptTasks();
});

// ─── Task Submit Modal (TEAM) ───
const showTaskSubmitModal = ref(false);
const selectedTask = ref(null);
const submitNewValue = ref(0);
const submitNote = ref("");
const submitLink = ref("");

const showDetailModal = ref(false);
const detailData = ref({
  title: "",
  type: "Task",
  oldValue: 0,
  newValue: 0,
  note: "",
  link: "",
  date: "",
  submittedBy: "",
});

function openDetailModal(title, type, update, submitterName) {
  detailData.value = {
    title,
    type,
    oldValue: update.oldValue,
    newValue: update.newValue,
    note: update.note || "Tidak ada catatan.",
    link: update.link || "",
    date: new Date(update.createdAt).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    submittedBy: submitterName || "Anggota Tim",
  };
  showDetailModal.value = true;
}

function openTaskSubmitModal(task) {
  if (isTaskDone(task)) return;
  selectedTask.value = task;
  submitNewValue.value = task.currentValue;
  submitNote.value = "";
  submitLink.value = "";
  showTaskSubmitModal.value = true;
}

async function submitTaskUpdate() {
  if (!selectedTask.value) return;
  const token = auth.token || localStorage.getItem("token");
  const res = await fetch(
    `${config.public.apiBase}/initiatives/tasks/${selectedTask.value.id}/updates`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        newValue: submitNewValue.value,
        note: submitNote.value,
        link: submitLink.value,
      }),
    },
  );
  if (res.ok) {
    showTaskSubmitModal.value = false;
    alert("Update berhasil dikirim, menunggu persetujuan Manager.");
    await fetchDashboardData();
  } else {
    const err = await res.json();
    alert(err.message || "Gagal mengirim update");
  }
}

// ─── Approval Modal (MANAGER) ───
const showRejectModal = ref(false);
const selectedApproval = ref(null);
const rejectNote = ref("");

function openRejectModal(update) {
  selectedApproval.value = update;
  rejectNote.value = "";
  showRejectModal.value = true;
}

async function handleApprove(updateId) {
  if (!confirm("Setujui update ini?")) return;
  const token = auth.token || localStorage.getItem("token");
  const res = await fetch(
    `${config.public.apiBase}/initiatives/initiative-updates/${updateId}/approve`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (res.ok) {
    await fetchDashboardData();
  } else {
    alert("Gagal approve");
  }
}

async function handleReject() {
  if (!rejectNote.value.trim()) {
    alert("Alasan penolakan wajib diisi");
    return;
  }
  const token = auth.token || localStorage.getItem("token");
  const res = await fetch(
    `${config.public.apiBase}/initiatives/initiative-updates/${selectedApproval.value.id}/reject`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reviewNote: rejectNote.value }),
    },
  );
  if (res.ok) {
    showRejectModal.value = false;
    await fetchDashboardData();
  } else {
    alert("Gagal reject");
  }
}
</script>

<style scoped>
@import url("https://fonts.google.com/share?selection.family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900|Rubik:ital,wght@0,300..900;1,300..900");

.dashboard-root {
  font-family: "Rubik", sans-serif;
  min-height: 100vh;
  background: inherit;
  color: var(--text-color);
  padding: 0 0 60px 0;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: var(--header-bg);
  border-bottom: 1px solid var(--header-border);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-link {
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 17px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  transition: color 0.3s;
}

.back-link:hover {
  color: #00d2ff;
}

.header-title {
  font-family: "Rubik", sans-serif;
  font-weight: 600;
  font-size: 27px;
  line-height: 32px;
  color: #2d3643;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-brand h1 {
  font-size: 25px;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, #00d2ff 0%, #0066ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-btn {
  background: var(--nav-btn-bg);
  border: 1px solid var(--nav-btn-border);
  color: var(--nav-btn-text);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s;
}

.header-btn:hover {
  background: rgba(0, 102, 255, 0.15);
  border-color: rgba(0, 102, 255, 0.3);
}

.header-btn.secondary {
  background: rgba(0, 210, 255, 0.1);
  border-color: rgba(0, 210, 255, 0.2);
  color: #8ce9ff;
}

.header-btn.secondary:hover {
  background: rgba(0, 210, 255, 0.2);
}

.header-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-badge {
  font-size: 13px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  letter-spacing: 0.5px;
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

.user-badge.employee {
  background: rgba(0, 210, 255, 0.15);
  color: #8ce9ff;
  border: 1px solid rgba(0, 210, 255, 0.3);
}

.user-name {
  font-size: 17px;
  font-weight: 500;
  color: var(--text-color);
}

/* Layout Container */
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}
.card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 24px;
}
.primary-btn {
  background: #0ea5e9;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.primary-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  opacity: 0.7;
}
/* Controls */
.controls-card {
  padding: 20px 24px;
}

.controls-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.controls-content h2 {
  font-size: 21px;
  font-weight: 600;
  margin: 0;
}

.scope-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scope-label {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
}

.scope-buttons {
  display: flex;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 4px;
}

.scope-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  padding: 6px 14px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.scope-btn:hover {
  color: white;
}

.scope-btn.active {
  background: rgba(255, 255, 255, 0.08);
  color: #0e97d6;
}

/* Task Cards Grid (matching Pekerjaan Saya / my-work.vue) */
.task-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.task-header h3 {
  font-size: 16px;
  margin: 0;
  color: var(--text-color, #0f172a);
  flex: 1;
}

.status-badge {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.task-context {
  background: var(--input-bg, #f8fafc);
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-secondary, #475569);
  border: 1px solid var(--card-border, #e2e8f0);
}

.task-context p {
  margin: 0 0 4px 0;
}

.task-context p:last-child {
  margin: 0;
}

.task-progress-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary, #475569);
}

.progress-bar-container {
  height: 8px;
  background: var(--card-border, #e2e8f0);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #0ea5e9;
  transition: width 0.3s;
}

.bg-green {
  background: #dcfce7;
  color: #166534;
}

.bg-yellow {
  background: #fef08a;
  color: #854d0e;
}

.bg-red {
  background: #fee2e2;
  color: #991b1b;
}

.bg-gray {
  background: #f1f5f9;
  color: #475569;
}

.bg-blue {
  background: #dbeafe;
  color: #1e40af;
}

.kr-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kr-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--card-border, #f1f5f9);
}

.kr-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--text-color, #0f172a);
}

.kr-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: var(--input-bg, #f1f5f9);
  color: var(--text-secondary, #475569);
}

.kr-progress {
  width: 220px;
  text-align: right;
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary, #64748b);
}

.task-label {
  font-size: 15px;
  text-transform: uppercase;
  color: #0f1623;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.task-value-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.task-value {
  font-size: 39px;
  font-weight: 700;
  color: #0e97d6;
}

.progress-ring-placeholder {
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  flex-grow: 1;
  max-width: 200px;
  position: relative;
  overflow: hidden;
}

.progress-ring-fill {
  height: 100%;
  background: #0e97d6;
  border-radius: 4px;
}

.status-summary-row {
  display: flex;
  gap: 24px;
}

.status-count-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.count-val {
  font-size: 27px;
  font-weight: 700;
}

.count-val.ontrack {
  color: var(--color-green);
}
.count-val.atrisk {
  color: var(--color-yellow);
}
.count-val.offtrack {
  color: var(--color-red);
}

.count-lbl {
  font-size: 14px;
  color: #8897ae;
  margin-top: 2px;
}

.task-desc {
  font-size: 15px;
  color: #0f1623;
  margin: 0;
}

/* Objectives Section */
.objectives-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title-row h2 {
  font-size: 21px;
  font-weight: 600;
  margin: 0;
}

.count-badge {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
}

.objectives-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.objective-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-left: 4px solid #0066ff;
  transition: all 0.3s;
}

.objective-card:hover {
  transform: translateY(-2px);
  border-color: #00d2ff;
}

.objective-card.is-dragging {
  opacity: 0.4;
  border: 2px dashed #0066ff !important;
  background: var(--card-bg-hover, rgba(0, 102, 255, 0.05));
  transform: scale(0.98);
}

.obj-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.obj-year {
  background: var(--color-primary-tint);
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 6px;
}

.obj-card-header h3 {
  font-size: 21px;
  font-weight: 600;
  margin: 0;
}

.obj-desc {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  margin: 4px 0 0 0;
}

.obj-progress-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  background: rgba(255, 255, 255, 0.03);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.obj-progress-badge span {
  font-size: 21px;
  font-weight: 700;
  color: #0e97d6;
}

.progress-lbl {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

/* Objective Progress Track */
.obj-progress-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  overflow: hidden;
}

.obj-progress-bar {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: 3px;
}

/* Key Results List inside Objective */
.krs-section {
  border-top: 1px solid #3d4a5c;
  padding-top: 16px;
}

.krs-section h4 {
  font-size: 15px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  margin: 0 0 12px 0;
  font-weight: 600;
}

.krs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kr-item {
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kr-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.kr-title {
  font-size: 17px;
  font-weight: 500;
}

/* KR Progress Bar Row */
.kr-progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kr-progress-track {
  height: 6px;
  background: #f0f3f9;
  border-radius: 3px #f0f3f9;
  flex-grow: 1;
  overflow: hidden;
}

.kr-progress-bar {
  height: 100%;
  border-radius: 2px;
}

.kr-progress-bar.ontrack {
  background: #49d507;
}
.kr-progress-bar.atrisk {
  background: #f2af17;
}
.kr-progress-bar.offtrack {
  background: #f97066;
}

.kr-progress-val {
  font-size: 15px;
  font-weight: 600;
  min-width: 32px;
  text-align: right;
}

/* Detail Info */
.kr-details-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  color: #5e718d;
}

.kr-values {
  color: #5e718d;
}

.kr-values strong {
  color: #3d4a5c;
}

/* Badges */
.perspective-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  flex-shrink: 0;
}

.perspective-badge.financial {
  background: var(--color-purple-badge);
  color: var(--color-primary);
  border: 1px solid rgba(0, 210, 255, 0.25);
}

.perspective-badge.customer {
  background: var(--color-yellow-badge);
  color: var(--color-yellow);
  border: 1px solid rgba(255, 170, 0, 0.25);
}

.perspective-badge.internal_process {
  background: var(--color-purple-badge);
  color: var(--color-purple);
  border: 1px solid rgba(138, 43, 226, 0.25);
}

.perspective-badge.learning_growth {
  background: var(--color-green-badge);
  color: var(--color-green);
  border: 1px solid rgba(75, 255, 75, 0.25);
}

.status-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 8px;
  text-transform: uppercase;
}

.status-badge.ontrack {
  background: var(--color-green-badge);
  color: var(--color-green);
}

.status-badge.atrisk {
  background: var(--color-yellow-badge);
  color: var(--color-yellow);
  color: #ffcc66;
}

.status-badge.offtrack {
  background: var(--color-red-badge);
  color: var(--color-red);
}

/* Loading/Empty State */
.loading-state,
.empty-state {
  text-align: center;
  padding: 60px;
  color: #5e718d;
  font-size: 17px;
  background: #ffff;
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

/* Mobile responsive fixes */
@media (max-width: 480px) {
  .header {
    padding: 16px 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .controls-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .scope-selector {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }

  .scope-buttons {
    width: 100%;
  }

  .scope-btn {
    flex-grow: 1;
    text-align: center;
  }
}

.kr-source-tooltip {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  cursor: help;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.02);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  transition: all 0.3s;
}

.kr-source-tooltip:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.8);
}

/* Skeleton Loader Styles */
.skeleton-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-left: 4px solid rgba(255, 255, 255, 0.05);
}

.skeleton-line {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.03) 75%
  );
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-line.title {
  height: 24px;
  width: 60%;
}

.skeleton-line.desc {
  height: 14px;
  width: 40%;
}

.skeleton-line.progress {
  height: 8px;
  width: 100%;
}

.skeleton-krs {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  padding-top: 14px;
}

.skeleton-kr-item {
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line.title-sm {
  height: 14px;
  width: 50%;
}

.skeleton-line.bar {
  height: 6px;
  width: 90%;
}

@keyframes loading-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.comparison-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f3f9;
  width: 100%;
}

.comparison-label {
  font-size: 14px;
  font-weight: 500;
  color: #5e718d;
}

.date-range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-range-inputs input[type="date"] {
  padding: 8px 12px;
  border: 1px solid #e4e4e4;
  border-radius: 8px;
  font-size: 14px;
  font-family: "Rubik", sans-serif;
  color: #2d3643;
  cursor: pointer;
  background-color: #ffffff;
}

.date-sep {
  color: #8897ae;
}

.shortcut-btns {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.shortcut-btn {
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #e4e4e4;
  background: #f8fafc;
  color: #5e718d;
  font-size: 13px;
  font-family: "Rubik", sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease-out;
}

.shortcut-btn:hover {
  background: #0e97d6;
  color: #ffffff;
  border-color: #0e97d6;
}

.clear-btn {
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #eb3123;
  background: #fff1f2;
  color: #eb3123;
  font-size: 13px;
  font-family: "Rubik", sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease-out;
}

.clear-btn:hover {
  background: #eb3123;
  color: #ffffff;
}

.compare-btn {
  padding: 8px 20px;
  background: #0e97d6;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-family: "Rubik", sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease-out;
}

.compare-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.compare-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.delta-badge {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  margin-left: 10px;
}

.delta-badge.small {
  font-size: 11px;
  padding: 2px 6px;
  margin-left: 4px;
}

.delta-up {
  color: #009c29;
  background: #e3fdea;
}

.delta-down {
  color: #eb3123;
  background: #ffeaed;
}

.delta-neutral {
  color: #5e718d;
  background: #f0f3f9;
}

.task-no-data {
  font-size: 13px;
  color: #8897ae;
  font-style: italic;
  margin: 4px 0 0;
}

.status-val-row {
  display: flex;
  align-items: center;
}

/* KR RACI & Dept Styles */
.kr-raci-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.5rem;
}

.raci-mini-group {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.raci-mini-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.a-mini {
  background: #7c3aed;
}
.r-mini {
  background: #0e97d6;
}

.raci-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.72rem;
  padding: 0.12rem 0.5rem;
  border-radius: 99px;
  font-weight: 500;
}

.accountable-chip {
  background: rgba(124, 58, 237, 0.15);
  color: #a78bfa;
  border: 1px solid rgba(124, 58, 237, 0.3);
}

.responsible-chip {
  background: rgba(14, 151, 214, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(14, 151, 214, 0.3);
}

.chip-dept {
  opacity: 0.75;
}

.kr-dept-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.dept-mini-label {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.dept-mini-tag {
  font-size: 0.65rem;
  padding: 0.08rem 0.4rem;
  background: rgba(5, 150, 105, 0.15);
  color: #34d399;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
}

.kr-history-link {
  margin-top: 0.5rem;
}

.history-btn {
  font-size: 0.75rem;
  color: #38bdf8;
  text-decoration: none;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  background: rgba(14, 151, 214, 0.1);
  border: 1px solid rgba(14, 151, 214, 0.2);
  display: inline-block;
  transition: all 150ms ease;
}

.history-btn:hover {
  background: rgba(14, 151, 214, 0.2);
  border-color: rgba(14, 151, 214, 0.4);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: #ffffff;
  color: var(--text-color, #0f172a);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--card-border, #e2e8f0);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-color, #0f172a);
}
.modal-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #64748b;
}
.modal-close-btn:hover {
  color: #0f172a;
}
.info-box {
  background: var(--input-bg, #f8fafc);
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  border: 1px solid var(--card-border, #e2e8f0);
  color: var(--text-color, #334155);
}
.info-approved {
  background: #dcfce7;
  border-color: #bbf7d0;
  color: #166534;
}
.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--card-border, #e2e8f0);
  border-radius: 8px;
  margin-bottom: 16px;
  box-sizing: border-box;
  font-size: 14px;
  background: #ffffff;
  color: var(--text-color, #0f172a);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

/* ─── INITIATIVE PROGRESS STYLES ─── */
.count-badge-sub {
  font-size: 0.78rem;
  font-weight: 600;
  background: rgba(14, 151, 214, 0.12);
  color: #0e97d6;
  padding: 4px 10px;
  border-radius: 20px;
}

.init-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .init-summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.init-summary-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.summary-val {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0e97d6;
}

.summary-val.done-val {
  color: #10b981;
}
.summary-val.progress-val {
  color: #3b82f6;
}

.summary-lbl {
  font-size: 0.78rem;
  color: var(--text-secondary, #64748b);
  margin-top: 4px;
}

.kr-group-card {
  padding: 20px;
  margin-bottom: 16px;
}

.kr-group-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  margin-bottom: 16px;
}

.kr-group-title-wrap h4 {
  margin: 6px 0 4px 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}

.kr-obj-context {
  font-size: 0.78rem;
  color: var(--text-secondary, #64748b);
}

.kr-group-progress-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 120px;
}

.kr-progress-pct {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0e97d6;
}

.kr-mini-progress-track {
  width: 120px;
  height: 8px;
  background: var(--bg-input, #e2e8f0);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 4px;
}

.kr-mini-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #0e97d6, #10b981);
  border-radius: 4px;
  transition: width 0.4s ease;
}

.init-progress-row {
  background: var(--bg-input, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 12px;
}

.init-row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.init-row-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kanban-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.kanban-dot.todo {
  background: #94a3b8;
}
.kanban-dot.in_progress {
  background: #0e97d6;
}
.kanban-dot.done {
  background: #10b981;
}
.kanban-dot.drop {
  background: #ef4444;
}

.init-row-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary, #0f172a);
}

.team-mini-badge {
  font-size: 0.7rem;
  background: #e2e8f0;
  color: #334155;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.init-row-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.init-pct {
  font-weight: 700;
  font-size: 0.9rem;
  color: #0e97d6;
}

.task-count-mini {
  font-size: 0.75rem;
  color: var(--text-secondary, #64748b);
  background: #ffffff;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
}

.init-progress-track {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 10px;
}

.init-progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.init-progress-bar.progress-high {
  background: #10b981;
}
.init-progress-bar.progress-mid {
  background: #0e97d6;
}
.init-progress-bar.progress-low {
  background: #f59e0b;
}

.task-detail-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px dashed #e2e8f0;
}

.task-detail-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 40px 1.5fr;
  align-items: center;
  gap: 10px;
  font-size: 0.78rem;
  background: #ffffff;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #f1f5f9;
}

@media (max-width: 768px) {
  .task-detail-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}

.task-detail-name {
  font-weight: 500;
  color: var(--text-primary, #334155);
}

.task-detail-val {
  color: var(--text-secondary, #64748b);
}

.task-mini-track {
  height: 5px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.task-mini-bar {
  height: 100%;
  background: #0e97d6;
  border-radius: 3px;
}

.task-mini-pct {
  font-weight: 600;
  color: #0e97d6;
}

.assignee-mini {
  font-size: 0.7rem;
  background: #f1f5f9;
  color: #475569;
  padding: 1px 6px;
  border-radius: 4px;
}

/* LEADER KEY RESULTS SECTION STYLES */
.leader-krs-grid {
  .kr-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
.kr-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}
.kr-title-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.month-badge {
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  align-self: flex-start;
}
.kr-badge-area {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.override-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
}
.badge-warn {
  background-color: #fffbeb;
  color: #d97706;
  border: 1px solid #fef3c7;
}
.badge-info {
  background-color: #eff6ff;
  color: #2563eb;
  border: 1px solid #dbeafe;
}
.parent-annual-context {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 16px;
}
.context-label {
  font-size: 10px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.parent-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.parent-title {
  font-weight: 600;
  font-size: 12px;
  color: #0f172a;
}
.parent-status {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
}
.parent-progress-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #64748b;
}
.kr-progress-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #334155;
}
.kr-actions {
  display: flex;
  justify-content: flex-end;
}

/* --- Pending Approvals List (matching approvals.vue) --- */
.approvals-section {
  margin-top: 24px;
}

.approvals-section .pending-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.approvals-section .card.mb-4 {
  margin-bottom: 16px;
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--card-border, #e2e8f0);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.approvals-section .kr-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.approvals-section .kr-title {
  font-weight: 600;
  font-size: 16px;
  color: var(--text-color, #1e293b);
}

.approvals-section .badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
  text-transform: uppercase;
}

.approvals-section .bg-task {
  background: #e0f2fe;
  color: #0369a1;
}

.approvals-section .bg-initiative {
  background: #f3e8ff;
  color: #7e22ce;
}

.approvals-section .bg-yellow {
  background: #fef08a;
  color: #854d0e;
}

.approvals-section .text-gray {
  color: #64748b;
}

.approvals-section .update-details {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  background: var(--input-bg, #f8fafc);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--card-border, #f1f5f9);
}

.approvals-section .detail-box {
  flex: 1;
  min-width: 150px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.approvals-section .detail-box.flex-2 {
  flex: 2;
  min-width: 250px;
}

.approvals-section .detail-box .lbl {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 500;
}

.approvals-section .detail-box .val {
  font-size: 14px;
  color: var(--text-color, #334155);
  font-weight: 600;
}

.approvals-section .text-blue {
  color: #0e97d6 !important;
}

.approvals-section .actions-row {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.approvals-section .primary-btn.small {
  background-color: #0e97d6;
  color: white;
  border: none;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 8px 16px;
  font-size: 13px;
}

.approvals-section .primary-btn.small:hover {
  background-color: #0a84be;
}

.approvals-section .danger-btn.small {
  background-color: #ef4444;
  color: white;
  border: none;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 8px 16px;
  font-size: 13px;
}

.approvals-section .danger-btn.small:hover {
  background-color: #dc2626;
}

.approvals-section .secondary-btn.small {
  background-color: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 8px 16px;
  font-size: 13px;
}

.approvals-section .secondary-btn.small:hover {
  background-color: #e2e8f0;
}

/* Cross Department Dashboard Widget Styles */
.cross-dept-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.amber-lightning {
  font-size: 18px;
}
.count-badge-amber {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 9999px;
}
.section-sub-desc {
  font-size: 13px;
  color: #64748b;
  margin: 4px 0 0 0;
}
.cross-dept-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.cross-summary-card {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cross-summary-val {
  font-size: 22px;
  font-weight: 800;
}
.cross-summary-val.text-amber {
  color: #d97706;
}
.cross-summary-val.text-blue {
  color: #2563eb;
}
.cross-summary-val.text-red {
  color: #dc2626;
}
.cross-summary-val.text-green {
  color: #16a34a;
}
.cross-summary-lbl {
  font-size: 14px;
  color: #64748b;
  font-weight: 600;
}
.cross-dept-tabs-nav {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 2px;
  margin-top: 24px;
}
.cross-dept-tab-btn {
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  padding: 8px 14px;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  transition: all 0.15s;
}
.cross-dept-tab-btn.active {
  color: #d97706;
  border-bottom: 3px solid #f59e0b;
  font-weight: 700;
}
.cross-dept-empty-card {
  padding: 24px;
  text-align: center;
  color: #64748b;
  font-size: 13px;
  font-style: italic;
}
.cross-dept-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}
.cross-dept-item-card {
  background: #fffdf5;
  border: 1px solid #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cross-dept-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cross-dept-route-badge {
  background: #fef3c7;
  color: #92400e;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}
.cross-dept-status-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}
.cross-dept-status-pill.todo {
  background: #f1f5f9;
  color: #475569;
}
.cross-dept-status-pill.in_progress {
  background: #e0f2fe;
  color: #0284c7;
}
.cross-dept-status-pill.need_info {
  background: #fee2e2;
  color: #dc2626;
  font-weight: 800;
}
.cross-dept-status-pill.resolved {
  background: #dcfce7;
  color: #15803d;
}
.cross-dept-status-pill.closed {
  background: #e2e8f0;
  color: #334155;
}
.cross-dept-item-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.cross-dept-item-desc {
  font-size: 12px;
  color: #475569;
  margin: 0;
  line-height: 1.4;
}
.cross-dept-meta-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: #64748b;
  background: #fff;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #fef08a;
}
.cross-dept-item-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 4px;
}
.btn-open-cross-thread {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fcd34d;
  font-size: 11px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  flex: 1;
}
.btn-open-cross-thread:hover {
  background: #fef3c7;
}
.btn-external-link {
  font-size: 11px;
  color: #2563eb;
  font-weight: 600;
  text-decoration: none;
  padding: 6px 8px;
}
</style>

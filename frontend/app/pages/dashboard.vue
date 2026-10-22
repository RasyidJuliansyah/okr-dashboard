<template>
  <div class="dashboard-root">
    <div class="dashboard-container">
      <!-- Alert Messages -->
      <div v-if="errorMsg" class="alert alert-error mb-4">{{ errorMsg }}</div>
      <div v-if="successMsg" class="alert alert-success mb-4">
        {{ successMsg }}
      </div>

      <!-- Controls & Filter Row -->
      <section class="controls-card card">
        <div class="controls-content">
          <h2>Ringkasan Progres OKR</h2>

          <div class="controls-actions">
            <!-- Sprint Filter (Aligned Right) -->
            <div class="sprint-filter-inline">
              <label for="dashboard-sprint-select" class="sprint-filter-label"
                >Sprint / Bulan:</label
              >
              <select
                id="dashboard-sprint-select"
                v-model="selectedSprint"
                @change="onSprintChange"
                class="sprint-filter-select"
              >
                <option
                  v-for="sp in availableSprints"
                  :key="sp.id"
                  :value="sp.id"
                >
                  {{ sp.name }}{{ sp.status === 'ACTIVE' ? ' (Saat Ini)' : sp.status === 'CLOSED' ? ' (Sebelumnya)' : '' }}
                </option>
              </select>
            </div>

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
        </div>
      </section>

      <!-- Task Summary Cards -->
      <section class="task-grid task-summary-grid">
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
            Agregat progres seluruh Key Results yang diampu.
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
                  >Saat ini:
                  <strong>{{
                    formatTargetValue(task.currentValue, task.unit)
                  }}</strong></span
                >
                <span
                  >Target:
                  <strong>{{
                    formatTargetValue(task.targetValue, task.unit)
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
                <span v-if="upd.submitter?.name" class="ml-2">
                  | <strong>Diajukan oleh:</strong> {{ upd.submitter.name }}
                </span>
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
                      upd.submitter?.name || upd.submittedBy,
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

      <!-- ─── SECTION: INITIATIVE PROGRESS (Leader, Manager, C-Level, Admin) ─── -->
      <section v-if="showInitiativeProgress" class="role-section">
        <div class="section-title-row">
          <h3 class="section-title">Progress Capaian Initiative</h3>
          <span class="count-badge-sub">
            {{ filteredTotalInitiatives }} Initiative
          </span>
        </div>

        <!-- Summary Cards Grid -->
        <div class="init-summary-grid">
          <div class="init-summary-card card">
            <span class="summary-val"
              >{{ filteredSummary.avgProgress || 0 }}%</span
            >
            <span class="summary-lbl">Rata-rata Progress</span>
          </div>
          <div class="init-summary-card card">
            <span class="summary-val">
              {{ filteredSummary.completedTasks || 0 }}/{{
                filteredSummary.totalTasks || 0
              }}
            </span>
            <span class="summary-lbl">Task Selesai</span>
          </div>
          <div class="init-summary-card card">
            <span class="summary-val done-val">
              {{ filteredSummary.byKanbanStatus?.DONE || 0 }}
            </span>
            <span class="summary-lbl">Initiative Done</span>
          </div>
          <div class="init-summary-card card">
            <span class="summary-val progress-val">
              {{ filteredSummary.byKanbanStatus?.IN_PROGRESS || 0 }}
            </span>
            <span class="summary-lbl">In Progress</span>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="init-filter-bar">
          <div class="filter-search-box">
            <svg
              class="search-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              v-model="filterSearch"
              type="text"
              class="filter-search-input"
              placeholder="Cari nama inisiatif, task, KR, atau tim..."
            />
            <button
              v-if="filterSearch"
              type="button"
              class="filter-clear-btn"
              @click="filterSearch = ''"
              title="Hapus pencarian"
            >
              &times;
            </button>
          </div>

          <div class="filter-actions-group">
            <div class="filter-field">
              <label class="filter-field-label">Status</label>
              <select v-model="filterInitStatus" class="filter-select-input">
                <option value="ALL">Semua Status</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done / Selesai</option>
                <option value="ON_TRACK">On Track</option>
                <option value="AT_RISK">At Risk</option>
                <option value="OFF_TRACK">Off Track</option>
              </select>
            </div>

            <div class="filter-field">
              <label class="filter-field-label">Tipe Card</label>
              <select v-model="filterCardType" class="filter-select-input">
                <option value="ALL">Semua Tipe</option>
                <option value="INITIATIVE">Initiatives</option>
                <option value="TASK">Task</option>
                <option value="CROSS_DEPT">Cross Departemen</option>
              </select>
            </div>

            <button
              v-if="isAnyInitFilterActive"
              type="button"
              class="filter-reset-btn"
              @click="resetInitFilters"
            >
              Reset Filter
            </button>
          </div>
        </div>

        <!-- Grouped by Key Result -->
        <div
          v-for="group in filteredByKeyResult"
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

          <!-- RACI 2-Section: KR Responsible & KR Accountability -->
          <div
            v-if="group.keyResult?.id !== 'unassigned'"
            class="kr-raci-dual-section"
          >
            <!-- Section 1: KR Responsible -->
            <div class="raci-section-box responsible-box">
              <div class="raci-section-header">
                <span class="raci-mini-badge r-mini">R</span>
                <span class="raci-section-title">KR Responsible</span>
              </div>
              <div class="raci-section-body">
                <span
                  v-if="getResponsible(group.keyResult)"
                  class="raci-chip responsible-chip"
                >
                  <span class="pic-name">{{
                    getResponsible(group.keyResult).name
                  }}</span>
                  <span
                    v-if="getResponsible(group.keyResult).department"
                    class="chip-dept"
                  >
                    · {{ getResponsible(group.keyResult).department }}
                  </span>
                </span>
                <span v-else class="raci-empty-text">—</span>
              </div>
            </div>

            <!-- Section 2: KR Accountability -->
            <div class="raci-section-box accountable-box">
              <div class="raci-section-header">
                <span class="raci-mini-badge a-mini">A</span>
                <span class="raci-section-title">KR Accountability</span>
              </div>
              <div class="raci-section-body">
                <template v-if="getAccountables(group.keyResult).length">
                  <span
                    v-for="acc in getAccountables(group.keyResult)"
                    :key="acc.id"
                    class="raci-chip accountable-chip"
                  >
                    <span class="pic-name">{{ acc.name }}</span>
                    <span v-if="acc.department" class="chip-dept"
                      >· {{ acc.department }}</span
                    >
                  </span>
                </template>
                <span v-else class="raci-empty-text">—</span>
              </div>
            </div>
          </div>

          <!-- Initiative rows under this KR -->
          <div
            v-for="init in group.initiatives"
            :key="init.id"
            class="init-progress-row"
            :class="{
              'is-expanded': isInitExpanded(init.id) || isAutoExpanded(init),
            }"
          >
            <div
              class="init-row-header"
              :class="{ 'is-clickable': init.tasks?.length }"
              @click="init.tasks?.length ? toggleInitTasks(init.id) : null"
            >
              <div class="init-row-left">
                <span
                  class="kanban-dot"
                  :class="init.kanbanStatus?.toLowerCase()"
                ></span>
                <span class="init-row-title">{{ init.title }}</span>
                <span class="team-mini-badge">{{ init.team?.name }}</span>
                <span
                  v-if="init.sprint?.name || init.sprintMonth"
                  class="cadence-mini-badge"
                  :title="
                    'Cadence: ' +
                    (init.sprint?.name || formatSprintLabel(init.sprintMonth))
                  "
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  {{ init.sprint?.name || formatSprintLabel(init.sprintMonth) }}
                </span>
                <span
                  class="status-mini-badge"
                  :class="getStatusBadgeClass(init.kanbanStatus || init.status)"
                >
                  {{ formatStatusLabel(init.kanbanStatus || init.status) }}
                </span>
                <span
                  v-if="hasCrossDeptTasks(init)"
                  class="cross-dept-tag-badge"
                  title="Memiliki task lintas departemen"
                >
                  Cross-Dept
                </span>
              </div>
              <div class="init-row-right">
                <span class="init-pct">{{ init.calculatedProgress }}%</span>
                <button
                  v-if="init.tasks?.length"
                  type="button"
                  class="task-count-mini is-toggleable"
                  @click.stop="toggleInitTasks(init.id)"
                  :aria-expanded="
                    isInitExpanded(init.id) || isAutoExpanded(init)
                  "
                  :title="
                    isInitExpanded(init.id) || isAutoExpanded(init)
                      ? 'Tutup rincian task'
                      : 'Buka rincian task'
                  "
                >
                  <span
                    >{{ init.completedTasks }}/{{ init.totalTasks }} Task</span
                  >
                  <svg
                    class="init-expand-icon"
                    :class="{
                      'is-expanded':
                        isInitExpanded(init.id) || isAutoExpanded(init),
                    }"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <span v-else class="task-count-mini">
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
            <div
              v-if="
                init.tasks?.length &&
                (isInitExpanded(init.id) || isAutoExpanded(init))
              "
              class="task-detail-grid"
            >
              <div
                v-for="task in init.tasks"
                :key="task.id"
                class="task-detail-row"
              >
                <div class="task-detail-title-col">
                  <span class="task-detail-name">{{ task.title }}</span>
                  <div class="task-meta-pills">
                    <span
                      v-if="task.isCrossDept"
                      class="task-cross-badge"
                      :title="
                        (task.creatorDept || '') +
                        (task.targetDept ? ' → ' + task.targetDept : '')
                      "
                    >
                      Cross-Dept
                    </span>
                    <span
                      v-if="task.sprint?.name || task.sprintMonth"
                      class="task-cadence-badge"
                    >
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        ></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                      </svg>
                      {{
                        task.sprint?.name || formatSprintLabel(task.sprintMonth)
                      }}
                    </span>
                    <span
                      class="status-mini-badge"
                      :class="
                        getStatusBadgeClass(task.kanbanStatus || task.status)
                      "
                    >
                      {{ formatStatusLabel(task.kanbanStatus || task.status) }}
                    </span>
                  </div>
                </div>
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

        <div
          v-if="filteredByKeyResult.length === 0 && isAnyInitFilterActive"
          class="empty-state"
        >
          <p>
            Tidak ada Initiative atau Task yang sesuai dengan kriteria filter.
          </p>
          <button
            type="button"
            class="filter-reset-btn"
            style="margin-top: 10px"
            @click="resetInitFilters"
          >
            Reset Filter
          </button>
        </div>
        <div
          v-else-if="!initProgressData.byKeyResult?.length"
          class="empty-state"
        >
          Belum ada Initiative yang terdaftar pada lingkup ini.
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
                class="cross-dept-status-pill current-status-pill"
                :class="
                  (task.kanbanStatus || task.status || 'todo').toLowerCase()
                "
              >
                {{ formatCrossDeptStatus(task.kanbanStatus || task.status) }}
              </span>
            </div>

            <h4 class="cross-dept-item-title">{{ task.title }}</h4>
            <div v-if="task.description" class="cross-dept-desc-wrapper">
              <p
                class="cross-dept-item-desc"
                :class="{ 'desc-expanded': isCrossDeptDescExpanded(task.id) }"
              >
                {{ task.description }}
              </p>
              <button
                v-if="isDescLong(task.description)"
                type="button"
                class="desc-toggle-btn"
                :title="
                  isCrossDeptDescExpanded(task.id)
                    ? 'Perkecil deskripsi'
                    : 'Perluas deskripsi'
                "
                :aria-label="
                  isCrossDeptDescExpanded(task.id)
                    ? 'Perkecil deskripsi'
                    : 'Perluas deskripsi'
                "
                @click.stop="toggleCrossDeptDesc(task.id)"
              >
                <svg
                  v-if="!isCrossDeptDescExpanded(task.id)"
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              </button>
            </div>

            <div class="cross-dept-meta-row">
              <span v-if="task.creator?.name" class="meta-sub">
                Pemohon: <strong>{{ task.creator.name }}</strong>
              </span>
              <span v-if="task.assignedTeamMember?.name" class="meta-sub">
                Assignee: <strong>{{ task.assignedTeamMember.name }}</strong>
              </span>
              <span v-if="task.dueDate || task.finishDate" class="meta-sub">
                Tenggat:
                <strong>{{
                  formatDate(task.finishDate || task.dueDate)
                }}</strong>
              </span>
            </div>

            <div class="cross-dept-item-actions">
              <button
                type="button"
                class="btn-open-cross-thread"
                @click="openCrossDeptModal(task.id)"
              >
                Detail & Diskusi
              </button>
            </div>
          </div>
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
              type="button"
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
            <strong>{{
              formatTargetValue(selectedTask?.targetValue, selectedTask?.unit)
            }}</strong
            ><br />
            Saat ini:
            <strong>{{
              formatTargetValue(selectedTask?.currentValue, selectedTask?.unit)
            }}</strong>
          </div>

          <label class="modal-label">Nilai Baru (Kumulatif) *</label>
          <input
            v-model.number="submitNewValue"
            type="number"
            class="form-input"
          />

          <label class="modal-label">Catatan Progress</label>
          <textarea
            v-model="submitNote"
            class="form-input"
            rows="3"
            placeholder="Apa yang sudah dikerjakan?"
          ></textarea>

          <label class="modal-label">Link Dokumentasi Hasil (opsional)</label>
          <input
            v-model="submitLink"
            type="url"
            class="form-input"
            placeholder="https://example.com/..."
          />

          <!-- KpiSelector jika task memiliki KPI terlampir -->
          <KpiSelector
            v-if="selectedTask?.kpis?.length"
            v-model="selectedTask.kpis"
            :showCurrentValue="true"
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

          <div v-if="taskSubmitError" class="alert alert-error mb-4">
            {{ taskSubmitError }}
          </div>

          <!-- Riwayat Task updates sebelumnya jika ada -->
          <div
            v-if="selectedTask?.updates?.length > 0"
            class="mini-history mb-4"
            style="border-top: 1px solid var(--card-border); padding-top: 12px"
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
                  border: 1px solid var(--card-border);
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
            <button
              type="button"
              class="secondary-btn btn-cancel-danger"
              @click="showTaskSubmitModal = false"
            >
              Batal
            </button>
            <button
              type="button"
              class="primary-btn"
              :disabled="submittingTask"
              @click="submitTaskUpdate"
            >
              {{ submittingTask ? "Mengirim..." : "Kirim Update" }}
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
                background: var(--bg-page);
                padding: 10px;
                border-radius: 8px;
                font-style: italic;
                border: 1px solid var(--card-border);
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
            <button
              type="button"
              class="secondary-btn btn-cancel-danger"
              @click="showRejectModal = false"
            >
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
            <button
              type="button"
              class="secondary-btn btn-cancel-danger"
              @click="showLeaderKrModal = false"
            >
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

      <!-- Objectives Grid (Hidden sementara / tidak digunakan) -->
      <template v-if="false">
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
            <div
              class="obj-card-header is-clickable"
              @click="toggleObjective(obj.id)"
            >
              <div class="obj-header-left">
                <span class="obj-year">{{ obj.year }}</span>
                <h3>{{ obj.title }}</h3>
                <p v-if="obj.description" class="obj-desc">
                  {{ obj.description }}
                </p>
              </div>
              <div class="obj-header-right">
                <div class="obj-progress-badge">
                  <span>{{ Math.round(obj.progress || 0) }}%</span>
                  <span class="progress-lbl">Progres</span>
                </div>
                <button
                  type="button"
                  class="obj-toggle-btn"
                  @click.stop="toggleObjective(obj.id)"
                  :aria-expanded="isObjectiveExpanded(obj.id)"
                  :title="isObjectiveExpanded(obj.id) ? 'Collapse' : 'Expand'"
                >
                  <svg
                    class="obj-toggle-icon"
                    :class="{ 'is-expanded': isObjectiveExpanded(obj.id) }"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              </div>
            </div>

            <div v-show="isObjectiveExpanded(obj.id)" class="obj-card-body">
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
                  <div
                    v-for="kr in obj.keyResults"
                    :key="kr.id"
                    class="kr-item"
                  >
                    <div class="kr-header-row">
                      <span class="kr-title">{{ kr.title }}</span>
                      <span
                        class="perspective-badge"
                        :class="kr.bscPerspective.toLowerCase()"
                      >
                        {{ formatPerspective(kr.bscPerspective) }}
                      </span>
                    </div>

                    <!-- KR Progress Bar
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
                          kr.assignments.some(
                            (x) => x.raciRole === 'ACCOUNTABLE',
                          )
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
                          kr.assignments.some(
                            (x) => x.raciRole === 'RESPONSIBLE',
                          )
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
        </div>
      </template>

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
import { formatTargetValue } from "~/utils/formatters";

const auth = useAuthStore();
const config = useRuntimeConfig();
const { confirm: confirmDialog, alert: alertDialog } = useConfirm();

const successMsg = ref("");
const errorMsg = ref("");

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
      const data = await res.json();
      if (Array.isArray(data)) {
        const myDept = auth.user?.department || "";
        const myId = auth.user?.id;
        const inc = data.filter(
          (t) =>
            (myDept && t.targetDept === myDept) ||
            t.assignedTeamMemberId === myId ||
            t.assignments?.some((a) => a.userId === myId),
        );
        const out = data.filter(
          (t) => (myDept && t.creatorDept === myDept) || t.creatorId === myId,
        );
        crossDeptData.value = { incoming: inc, outgoing: out, all: data };
      } else {
        crossDeptData.value = {
          incoming: data.incoming || [],
          outgoing: data.outgoing || [],
          all: data.all || [...(data.incoming || []), ...(data.outgoing || [])],
        };
      }
    }
  } catch (err) {
    console.error("Fetch cross dept tasks error:", err);
  } finally {
    loadingCrossDept.value = false;
  }
}

function formatCrossDeptStatus(st) {
  if (!st) return "TO DO";
  const s = String(st).toUpperCase();
  if (s === "TODO") return "TO DO";
  if (s === "IN_PROGRESS") return "IN PROGRESS";
  if (s === "NEED_INFO") return "NEED INFO";
  if (s === "RESOLVED") return "RESOLVED";
  if (s === "CLOSED") return "CLOSED";
  return s.replace(/_/g, " ");
}

const expandedCrossDeptDesc = ref({});

function toggleCrossDeptDesc(taskId) {
  expandedCrossDeptDesc.value = {
    ...expandedCrossDeptDesc.value,
    [taskId]: !expandedCrossDeptDesc.value[taskId],
  };
}

function isCrossDeptDescExpanded(taskId) {
  return !!expandedCrossDeptDesc.value[taskId];
}

function isDescLong(desc) {
  if (!desc) return false;
  return desc.length > 35 || desc.includes("\n");
}

const currentCrossDeptList = computed(() => {
  if (activeCrossDeptTab.value === "incoming") {
    return crossDeptData.value?.incoming || [];
  }
  return crossDeptData.value?.outgoing || [];
});

const crossDeptNeedInfoCount = computed(() => {
  const all = crossDeptData.value?.all || [];
  return all.filter((t) => {
    const k = (t.kanbanStatus || t.status || "").toUpperCase();
    return k === "NEED_INFO";
  }).length;
});

const crossDeptResolvedCount = computed(() => {
  const all = crossDeptData.value?.all || [];
  return all.filter((t) => {
    const k = (t.kanbanStatus || "").toUpperCase();
    const s = (t.status || "").toUpperCase();
    return (
      k === "RESOLVED" ||
      k === "CLOSED" ||
      s === "RESOLVED" ||
      s === "CLOSED" ||
      s === "DONE"
    );
  }).length;
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

// State expand / collapse per Objective Card (default: collapsed)
const expandedObjIds = ref({});

function toggleObjective(objId) {
  if (!objId) return;
  expandedObjIds.value = {
    ...expandedObjIds.value,
    [objId]: !expandedObjIds.value[objId],
  };
}

function isObjectiveExpanded(objId) {
  return !!expandedObjIds.value[objId];
}

// State & Computed untuk Initiative Progress (Leader, Manager, C-Level, Admin)
const initProgressData = ref({ initiatives: [], byKeyResult: [], summary: {} });

// Filter State untuk Initiative Progress (Search, Status, Card Type)
const filterSearch = ref("");
const filterInitStatus = ref("ALL");
const filterCardType = ref("ALL"); // 'ALL' | 'INITIATIVE' | 'TASK' | 'CROSS_DEPT'

const isAnyInitFilterActive = computed(() => {
  return (
    !!filterSearch.value.trim() ||
    filterInitStatus.value !== "ALL" ||
    filterCardType.value !== "ALL"
  );
});

function resetInitFilters() {
  filterSearch.value = "";
  filterInitStatus.value = "ALL";
  filterCardType.value = "ALL";
}

function formatSprintLabel(sprint) {
  if (!sprint) return "";
  if (/^\d{4}-\d{2}$/.test(sprint)) {
    const [year, month] = sprint.split("-");
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
    const mIdx = parseInt(month, 10) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return `${monthNames[mIdx]} ${year}`;
    }
  }
  return sprint;
}

function formatStatusLabel(status) {
  if (!status) return "To Do";
  const s = String(status).toUpperCase();
  if (s === "DONE" || s === "COMPLETED") return "Done";
  if (s === "IN_PROGRESS") return "In Progress";
  if (s === "TODO") return "To Do";
  if (s === "DROP") return "Drop";
  if (s === "ON_TRACK") return "On Track";
  if (s === "AT_RISK") return "At Risk";
  if (s === "OFF_TRACK") return "Off Track";
  return status;
}

function getStatusBadgeClass(status) {
  if (!status) return "status-todo";
  const s = String(status).toUpperCase();
  if (s === "DONE" || s === "COMPLETED") return "status-done";
  if (s === "IN_PROGRESS") return "status-in-progress";
  if (s === "TODO") return "status-todo";
  if (s === "DROP") return "status-drop";
  if (s === "ON_TRACK") return "status-on-track";
  if (s === "AT_RISK") return "status-at-risk";
  if (s === "OFF_TRACK") return "status-off-track";
  return "status-todo";
}

function hasCrossDeptTasks(init) {
  if (init?.isCrossDept) return true;
  return Array.isArray(init?.tasks) && init.tasks.some((t) => t.isCrossDept);
}

function isAutoExpanded(init) {
  if (!isAnyInitFilterActive.value) return false;
  if (
    filterCardType.value === "TASK" ||
    filterCardType.value === "CROSS_DEPT" ||
    !!filterSearch.value.trim() ||
    filterInitStatus.value !== "ALL"
  ) {
    return Array.isArray(init?.tasks) && init.tasks.length > 0;
  }
  return false;
}

function matchesStatusFilter(item, selectedStatus) {
  if (!selectedStatus || selectedStatus === "ALL") return true;
  const s = selectedStatus.toUpperCase();
  const itemKanban = String(item?.kanbanStatus || "").toUpperCase();
  const itemStatus = String(item?.status || "").toUpperCase();
  const pct =
    item?.calculatedProgress !== undefined
      ? item.calculatedProgress
      : item?.progressPercent !== undefined
        ? item.progressPercent
        : 0;

  if (s === "DONE") {
    return (
      itemKanban === "DONE" ||
      itemKanban === "COMPLETED" ||
      itemStatus === "DONE" ||
      itemStatus === "COMPLETED" ||
      pct >= 100
    );
  }
  if (s === "IN_PROGRESS") {
    return (
      itemKanban === "IN_PROGRESS" ||
      itemStatus === "IN_PROGRESS" ||
      (pct > 0 && pct < 100)
    );
  }
  if (s === "TODO") {
    return itemKanban === "TODO" || itemStatus === "TODO" || pct === 0;
  }
  if (s === "DROP") {
    return itemKanban === "DROP" || itemStatus === "DROP";
  }
  if (s === "ON_TRACK") {
    return itemStatus === "ON_TRACK";
  }
  if (s === "AT_RISK") {
    return itemStatus === "AT_RISK";
  }
  if (s === "OFF_TRACK") {
    return itemStatus === "OFF_TRACK";
  }
  return itemKanban === s || itemStatus === s;
}

const filteredByKeyResult = computed(() => {
  const rawGroups = initProgressData.value?.byKeyResult || [];
  if (!isAnyInitFilterActive.value) {
    return rawGroups;
  }

  const q = filterSearch.value.trim().toLowerCase();
  const statusFilter = filterInitStatus.value;
  const typeFilter = filterCardType.value; // 'ALL' | 'INITIATIVE' | 'TASK' | 'CROSS_DEPT'

  const result = [];

  for (const group of rawGroups) {
    const krTitle = (group.keyResult?.title || "").toLowerCase();
    const krMatches = q && krTitle.includes(q);

    const matchingInitiatives = [];

    for (const init of group.initiatives || []) {
      const initTitle = (init.title || "").toLowerCase();
      const teamName = (init.team?.name || "").toLowerCase();
      const initMatchesName =
        !q || krMatches || initTitle.includes(q) || teamName.includes(q);
      const initMatchesStatus = matchesStatusFilter(init, statusFilter);
      const isCrossDeptInit = hasCrossDeptTasks(init);

      const allTasks = Array.isArray(init.tasks) ? init.tasks : [];

      const matchingTasks = allTasks.filter((task) => {
        if (typeFilter === "INITIATIVE") return false;
        if (typeFilter === "CROSS_DEPT" && !task.isCrossDept) return false;

        const taskTitle = (task.title || "").toLowerCase();
        const assigneeMatches = (task.assignments || []).some((a) =>
          (a.user?.name || "").toLowerCase().includes(q),
        );
        const taskMatchesName =
          !q ||
          krMatches ||
          initTitle.includes(q) ||
          taskTitle.includes(q) ||
          assigneeMatches;
        const taskMatchesStatus = matchesStatusFilter(task, statusFilter);

        return taskMatchesName && taskMatchesStatus;
      });

      if (typeFilter === "TASK") {
        if (matchingTasks.length > 0) {
          matchingInitiatives.push({
            ...init,
            tasks: matchingTasks,
          });
        }
      } else if (typeFilter === "INITIATIVE") {
        if (initMatchesName && initMatchesStatus) {
          matchingInitiatives.push({
            ...init,
            tasks: allTasks,
          });
        }
      } else if (typeFilter === "CROSS_DEPT") {
        if (isCrossDeptInit) {
          const crossTasks =
            matchingTasks.length > 0
              ? matchingTasks
              : allTasks.filter((t) => t.isCrossDept);
          if (
            (initMatchesName && initMatchesStatus) ||
            matchingTasks.length > 0
          ) {
            matchingInitiatives.push({
              ...init,
              tasks: crossTasks,
            });
          }
        }
      } else {
        // typeFilter === 'ALL'
        const selfMatches = initMatchesName && initMatchesStatus;
        const hasMatchingTasks = matchingTasks.length > 0;
        if (selfMatches || hasMatchingTasks) {
          matchingInitiatives.push({
            ...init,
            tasks: hasMatchingTasks ? matchingTasks : allTasks,
          });
        }
      }
    }

    if (matchingInitiatives.length > 0) {
      result.push({
        ...group,
        initiatives: matchingInitiatives,
      });
    }
  }

  return result;
});

const filteredSummary = computed(() => {
  if (!isAnyInitFilterActive.value) {
    return initProgressData.value?.summary || {};
  }
  let totalInits = 0;
  let sumPct = 0;
  let totalTasks = 0;
  let completedTasks = 0;
  let doneInits = 0;
  let inProgressInits = 0;

  for (const group of filteredByKeyResult.value) {
    for (const init of group.initiatives || []) {
      totalInits++;
      sumPct += init.calculatedProgress || 0;
      const tasks = Array.isArray(init.tasks) ? init.tasks : [];
      totalTasks += tasks.length;
      completedTasks += tasks.filter(
        (t) => (t.progressPercent || 0) >= 100 || isTaskDone(t),
      ).length;
      const s = String(init.kanbanStatus || init.status || "").toUpperCase();
      if (
        s === "DONE" ||
        s === "COMPLETED" ||
        (init.calculatedProgress || 0) >= 100
      ) {
        doneInits++;
      } else if (
        s === "IN_PROGRESS" ||
        ((init.calculatedProgress || 0) > 0 &&
          (init.calculatedProgress || 0) < 100)
      ) {
        inProgressInits++;
      }
    }
  }

  return {
    totalInitiatives: totalInits,
    avgProgress:
      totalInits > 0 ? Math.round((sumPct / totalInits) * 10) / 10 : 0,
    totalTasks,
    completedTasks,
    byKanbanStatus: {
      DONE: doneInits,
      IN_PROGRESS: inProgressInits,
    },
  };
});

const filteredTotalInitiatives = computed(() => {
  return filteredSummary.value.totalInitiatives !== undefined
    ? filteredSummary.value.totalInitiatives
    : initProgressData.value.summary?.totalInitiatives || 0;
});

// State expand / collapse per Initiative
const expandedInitIds = ref({});

function toggleInitTasks(initId) {
  if (!initId) return;
  expandedInitIds.value = {
    ...expandedInitIds.value,
    [initId]: !expandedInitIds.value[initId],
  };
}

function isInitExpanded(initId) {
  return !!expandedInitIds.value[initId];
}

const showInitiativeProgress = computed(() => {
  return ["LEADER", "MANAGER", "C_LEVEL", "ADMIN"].includes(userRole.value);
});

function getProgressColorClass(pct) {
  if (pct >= 80) return "progress-high";
  if (pct >= 50) return "progress-mid";
  return "progress-low";
}

function getStatusClass(status) {
  if (status === "DONE") return "bg-green";
  if (status === "ON_TRACK") return "bg-blue";
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
    kanbanStatus === "CLOSED" ||
    kanbanStatus === "COMPLETED"
  );
}

function getProgressPercent(task) {
  if (!task || task.targetValue === null || task.targetValue === undefined)
    return 0;
  const val =
    task.achievedValue !== null && task.achievedValue !== undefined
      ? task.achievedValue
      : task.currentValue;
  return calculateProgressPercent(
    val,
    task.targetValue,
    task.targetType,
    task.baselineValue,
  );
}

async function fetchInitiativeProgress() {
  try {
    let url = `${config.public.apiBase}/initiatives/progress`;
    if (selectedSprint.value) {
      url += `?sprintId=${encodeURIComponent(selectedSprint.value)}&month=${encodeURIComponent(selectedSprint.value)}`;
    }
    const token = auth.token || (process.client ? localStorage.getItem("auth_token") : "");
    const res = await $fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
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

function getResponsible(kr) {
  if (!kr) return null;
  if (kr.responsible) return kr.responsible;
  if (Array.isArray(kr.assignments)) {
    const a = kr.assignments.find((x) => x.raciRole === "RESPONSIBLE");
    if (a?.user) return a.user;
  }
  return null;
}

function getAccountables(kr) {
  if (!kr) return [];
  if (Array.isArray(kr.accountables) && kr.accountables.length > 0) {
    return kr.accountables;
  }
  if (Array.isArray(kr.assignments)) {
    return kr.assignments
      .filter((x) => x.raciRole === "ACCOUNTABLE")
      .map((x) => x.user)
      .filter(Boolean);
  }
  return [];
}

const summaryData = ref({});
const currentScope = ref("self");
const loading = ref(false);
const selectedSprint = ref("");
const availableSprints = ref([]);

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

async function onSprintChange() {
  await fetchDashboardData();
  if (showInitiativeProgress.value) {
    await fetchInitiativeProgress();
  }
}

async function fetchSummary(month) {
  if (month !== undefined) {
    selectedSprint.value = month;
  }
  return onSprintChange();
}

async function fetchDashboardData() {
  loading.value = true;
  try {
    let url = `${config.public.apiBase}/dashboard/summary?scope=${currentScope.value}`;
    if (selectedSprint.value) {
      url += `&sprintId=${encodeURIComponent(selectedSprint.value)}&month=${encodeURIComponent(selectedSprint.value)}`;
    }
    if (compareFrom.value && compareTo.value) {
      url += `&compareFrom=${compareFrom.value}&compareTo=${compareTo.value}`;
    }
    const token = auth.token || (process.client ? localStorage.getItem("auth_token") : "");
    const response = await $fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response?.sprint?.id && !selectedSprint.value) {
      selectedSprint.value = response.sprint.id;
    }

    if (userRole.value === "TEAM") {
      myTasks.value = response.myTasks || [];
      myInitiatives.value = response.initiatives || [];
    } else if (userRole.value === "LEADER") {
      leadingTeams.value = response.leadingTeams || [];
      leaderInitiatives.value = response.initiatives || [];
      pendingApprovals.value = response.pendingApprovals || [];
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

async function fetchSprints() {
  try {
    const token = auth.token || (process.client ? localStorage.getItem("auth_token") : "");
    const res = await $fetch(`${config.public.apiBase}/sprints`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res?.sprints) {
      const currentAndPast = res.sprints.filter(
        (s) => s.status === "ACTIVE" || s.status === "CLOSED",
      );
      availableSprints.value =
        currentAndPast.length > 0 ? currentAndPast : res.sprints;
    }
    if (res?.activeSprint && !selectedSprint.value) {
      selectedSprint.value = res.activeSprint.id;
    } else if (availableSprints.value.length > 0 && !selectedSprint.value) {
      const active = availableSprints.value.find((s) => s.status === "ACTIVE");
      selectedSprint.value = active
        ? active.id
        : availableSprints.value[availableSprints.value.length - 1].id;
    }
  } catch (err) {
    console.error("Error fetching sprints:", err);
  }
}

async function fetchPendingApprovals() {
  if (!["LEADER", "MANAGER", "ADMIN", "C_LEVEL"].includes(userRole.value))
    return;
  try {
    const token = auth.token || (process.client ? localStorage.getItem("auth_token") : "");
    const res = await $fetch(
      `${config.public.apiBase}/initiatives/initiative-updates/pending`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    pendingApprovals.value = res || [];
  } catch (err) {
    console.error("Error fetching pending approvals:", err);
  }
}

onMounted(async () => {
  // Default scope based on role: ADMIN/C_LEVEL -> company, MANAGER/LEADER -> team, others -> self
  if (auth.user?.role === "ADMIN" || auth.user?.role === "C_LEVEL") {
    currentScope.value = "company";
  } else if (auth.user?.role === "MANAGER" || auth.user?.role === "LEADER") {
    currentScope.value = "team";
  } else {
    currentScope.value = "self";
  }
  await fetchSprints();
  await fetchDashboardData();
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
const submittingTask = ref(false);
const taskSubmitError = ref("");

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
  const resolvedSubmitter =
    (submitterName && submitterName !== "—" ? submitterName : null) ||
    update?.submitter?.name ||
    update?.submittedByName ||
    update?.submittedBy ||
    "Anggota Tim";

  detailData.value = {
    title,
    type,
    oldValue: update?.oldValue ?? 0,
    newValue: update?.newValue ?? 0,
    note: update?.note || "Tidak ada catatan.",
    link: update?.link || "",
    date: update?.createdAt
      ? new Date(update.createdAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—",
    submittedBy: resolvedSubmitter,
  };
  showDetailModal.value = true;
}

function openTaskSubmitModal(task) {
  if (isTaskDone(task)) return;
  selectedTask.value = task;
  submitNewValue.value = task.currentValue || 0;
  submitNote.value = "";
  submitLink.value = "";
  taskSubmitError.value = "";
  showTaskSubmitModal.value = true;
}

async function submitTaskUpdate() {
  if (!selectedTask.value) return;
  if (submitNewValue.value === undefined || submitNewValue.value === null) {
    taskSubmitError.value = "Nilai baru wajib diisi";
    return;
  }

  const ok = await confirmDialog({
    title: "Konfirmasi",
    message: `Kirim update progress untuk task "${selectedTask.value.title}"?`,
    confirmText: "Ya, Lanjutkan",
    cancelText: "Batal",
    type: "info",
    danger: false,
  });
  if (!ok) return;

  submittingTask.value = true;
  taskSubmitError.value = "";
  try {
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
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Gagal mengirim update");
    }
    const data = await res.json().catch(() => ({}));
    showTaskSubmitModal.value = false;
    const msg =
      data?.message || "Update berhasil dikirim, menunggu persetujuan Manager.";
    successMsg.value = msg;
    setTimeout(() => {
      successMsg.value = "";
    }, 4000);
    await fetchDashboardData();
    await alertDialog({
      title: "Berhasil",
      message: msg,
      confirmText: "OK",
      type: "success",
    });
  } catch (err) {
    taskSubmitError.value =
      err.message || "Terjadi kesalahan saat mengirim update";
  } finally {
    submittingTask.value = false;
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
  const ok = await confirmDialog("Setujui update ini?");
  if (!ok) return;
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

.controls-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-left: auto;
}

.sprint-filter-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.sprint-filter-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, #64748b);
  white-space: nowrap;
}

.sprint-filter-select {
  height: 34px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--bg-card, #ffffff);
  color: var(--text-primary, #0f172a);
  font-size: 13px;
  cursor: pointer;
}

.sprint-filter-select:focus {
  outline: none;
  border-color: #0e97d6;
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
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.task-summary-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 1200px) {
  .task-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .task-grid,
  .task-summary-grid {
    grid-template-columns: 1fr;
  }
}

.task-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  overflow: hidden;
}
.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.task-header h3 {
  font-size: 15px;
  line-height: 1.4;
  margin: 0;
  color: var(--text-color, #0f172a);
  flex: 1;
  min-width: 0;
  word-break: break-word;
  overflow-wrap: break-word;
}

.status-badge {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
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
  background: var(--bg-page);
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
  background: var(--card-border, #e2e8f0);
  border-radius: 4px;
  flex-grow: 1;
  max-width: 200px;
  position: relative;
  overflow: hidden;
}

.progress-ring-fill {
  height: 100%;
  background: linear-gradient(90deg, #3cef84, #00870b);
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

.obj-card-header.is-clickable {
  cursor: pointer;
  user-select: none;
}

.obj-header-left {
  flex: 1;
  min-width: 0;
}

.obj-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.obj-toggle-btn {
  background: var(--input-bg, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  width: 36px;
  height: 36px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, #94a3b8);
  cursor: pointer;
  transition: all 0.2s ease;
}

.obj-toggle-btn:hover {
  background: var(--card-bg-hover, rgba(0, 102, 255, 0.1));
  color: var(--color-primary, #0066ff);
  border-color: var(--color-primary, #0066ff);
}

.obj-toggle-icon {
  transition: transform 0.2s ease;
}

.obj-toggle-icon.is-expanded {
  transform: rotate(180deg);
}

.obj-card-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  background: var(--input-bg);
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
  background: var(--card-bg);
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
  border: 1px solid var(--card-border);
  border-radius: 8px;
  font-size: 14px;
  font-family: "Rubik", sans-serif;
  color: #2d3643;
  cursor: pointer;
  background-color: var(--card-bg);
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
  border: 1px solid var(--card-border);
  background: var(--bg-page);
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
  background: var(--input-bg);
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
  background: var(--card-bg);
  color: var(--text-color, #0f172a);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 500px;
  max-height: calc(100dvh - 32px);
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  box-sizing: border-box;
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
  background: var(--card-bg);
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
  background: linear-gradient(90deg, #3cef84, #00870b);
  border-radius: 4px;
  transition: width 0.4s ease;
}

.kr-raci-dual-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 14px;
  background: var(--bg-input, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 10px;
}

.raci-section-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.raci-section-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.raci-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.responsible-box .raci-section-title {
  color: #0284c7;
}

.accountable-box .raci-section-title {
  color: #7c3aed;
}

.raci-section-body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 28px;
}

.responsible-box .responsible-chip {
  background: rgba(14, 151, 214, 0.12);
  color: #0369a1;
  border: 1px solid rgba(14, 151, 214, 0.25);
  font-weight: 600;
}

.accountable-box .accountable-chip {
  background: rgba(124, 58, 237, 0.12);
  color: #6d28d9;
  border: 1px solid rgba(124, 58, 237, 0.25);
  font-weight: 600;
}

.raci-empty-text {
  font-size: 0.8rem;
  color: var(--text-muted, #94a3b8);
  font-style: italic;
}

/* Initiative Progress Filter Controls */
.init-filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 10px;
  padding: 12px 16px;
}

.filter-search-box {
  display: flex;
  align-items: center;
  position: relative;
  flex: 1;
  min-width: 240px;
}

.filter-search-input {
  width: 100%;
  height: 38px;
  padding: 6px 30px 6px 34px;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--text-primary, #0f172a);
  background: var(--bg-page, #ffffff);
  transition: border-color 0.2s;
}

.filter-search-input:focus {
  outline: none;
  border-color: #0e97d6;
}

.filter-search-box .search-icon {
  position: absolute;
  left: 11px;
  color: #94a3b8;
  pointer-events: none;
}

.filter-clear-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  font-size: 1.15rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

.filter-clear-btn:hover {
  color: #475569;
}

.filter-actions-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-field {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary, #64748b);
  white-space: nowrap;
}

.filter-select-input {
  height: 38px;
  padding: 6px 12px;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  font-size: 0.82rem;
  background: var(--bg-page, #ffffff);
  color: var(--text-primary, #0f172a);
  cursor: pointer;
}

.filter-select-input:focus {
  outline: none;
  border-color: #0e97d6;
}

.filter-reset-btn {
  height: 38px;
  padding: 0 14px;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  background: var(--bg-page, #f8fafc);
  color: var(--text-secondary, #475569);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.filter-reset-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
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

.init-row-header.is-clickable {
  cursor: pointer;
  user-select: none;
}

.init-row-header.is-clickable:hover .init-row-title {
  color: #0e97d6;
}

.init-row-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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

.cadence-mini-badge {
  font-size: 0.68rem;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.status-mini-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  display: inline-flex;
  align-items: center;
}

.status-mini-badge.status-done,
.status-mini-badge.status-on-track {
  background: #dcfce7;
  color: #166534;
  border: 1px solid rgba(22, 101, 52, 0.25);
}

.status-mini-badge.status-in-progress {
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid rgba(3, 105, 161, 0.25);
}

.status-mini-badge.status-todo {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid rgba(100, 116, 139, 0.25);
}

.status-mini-badge.status-at-risk {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid rgba(146, 64, 14, 0.25);
}

.status-mini-badge.status-off-track,
.status-mini-badge.status-drop {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid rgba(153, 27, 27, 0.25);
}

.cross-dept-tag-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  background: #fef3c7;
  color: #b45309;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.task-detail-title-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.task-meta-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.task-cadence-badge {
  font-size: 0.66rem;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.task-cross-badge {
  font-size: 0.66rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  background: #fef3c7;
  color: #b45309;
  border: 1px solid rgba(245, 158, 11, 0.3);
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
  background: var(--card-bg);
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

button.task-count-mini {
  cursor: pointer;
  font-family: inherit;
  font-size: 0.75rem;
  line-height: inherit;
}

.task-count-mini.is-toggleable {
  transition:
    background-color 0.2s,
    border-color 0.2s;
}

.init-row-header.is-clickable:hover .task-count-mini.is-toggleable,
.task-count-mini.is-toggleable:hover {
  background: var(--bg-page);
  border-color: #94a3b8;
}

.init-expand-icon {
  transition: transform 0.2s ease;
  color: var(--text-secondary, #64748b);
  flex-shrink: 0;
}

.init-expand-icon.is-expanded {
  transform: rotate(180deg);
}

.init-progress-track {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 10px;
}

.init-progress-row:not(.is-expanded) .init-progress-track {
  margin-bottom: 0;
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
  grid-template-columns: 2.2fr 1fr 1.2fr 40px 1.2fr;
  align-items: center;
  gap: 10px;
  font-size: 0.78rem;
  background: var(--card-bg);
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
  background: var(--bg-page);
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
  background: var(--bg-page);
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
  background: var(--bg-page);
  border: 1px solid var(--card-border);
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
  margin-bottom: 8px;
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
  border: 1px solid var(--card-border);
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

.secondary-btn {
  background: white;
  color: #475569;
  border: 1px solid var(--card-border, #cbd5e1);
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-btn:hover {
  background-color: var(--bg-page, #f8fafc);
}

.btn-cancel-danger {
  color: #ef4444 !important;
  border: 2px solid #ef4444 !important;
  padding: 8px 16px !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  background-color: transparent !important;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel-danger:hover {
  background-color: rgba(239, 68, 68, 0.08) !important;
  border-color: #dc2626 !important;
  color: #dc2626 !important;
}

.modal-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-top: 10px;
  margin-bottom: 4px;
  color: #475569;
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
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
  margin: 4px 0 8px 0;
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
  padding-bottom: 2px;
  margin: 24px 0 12px 0;
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
.cross-dept-status-pill,
.current-status-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}
.cross-dept-status-pill.todo,
.current-status-pill.todo {
  background: var(--bg-page);
  color: #475569;
}
.cross-dept-status-pill.in_progress,
.current-status-pill.in_progress {
  background: #e0f2fe;
  color: #0284c7;
}
.cross-dept-status-pill.need_info,
.current-status-pill.need_info {
  background: #fee2e2;
  color: #dc2626;
  font-weight: 800;
}
.cross-dept-status-pill.resolved,
.current-status-pill.resolved {
  background: #dcfce7;
  color: #15803d;
}
.cross-dept-status-pill.closed,
.current-status-pill.closed,
.cross-dept-status-pill.done,
.current-status-pill.done {
  background: #e2e8f0;
  color: #334155;
}
.cross-dept-item-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.cross-dept-desc-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
}
.cross-dept-item-desc {
  font-size: 12px;
  color: #475569;
  margin: 0;
  max-width: 250px;
  height: 20px;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 0;
}
.cross-dept-item-desc.desc-expanded {
  max-width: 100%;
  height: auto;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}
.desc-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-left: auto;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  color: #475569;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease;
}
.desc-toggle-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
  border-color: #94a3b8;
}
.cross-dept-meta-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: #64748b;
  background: var(--card-bg);
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

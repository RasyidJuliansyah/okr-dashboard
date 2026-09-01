<template>
  <div class="admin-root">
    <div class="admin-content">
      <div class="header-section card">
        <div class="header-title">
          <h2>Pekerjaan Saya</h2>
          <p class="section-desc">
            Inisiatif tim dan Task yang menjadi tanggung jawab Anda hari ini.
          </p>
        </div>
      </div>

      <!-- Filter Bar for Search, Department, PIC, and Sprint -->
      <div
        class="filters-bar card mb-6"
        style="
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          padding: 12px 16px;
          margin-top: 24px;
        "
      >
        <!-- Search Input -->
        <div class="filter-item" style="flex: 1; min-width: 220px">
          <label
            style="
              font-size: 11px;
              font-weight: 600;
              color: #64748b;
              margin-bottom: 4px;
              display: block;
            "
            >Search Task / Inisiatif</label
          >
          <input
            v-model="searchQuery"
            type="text"
            class="form-input"
            placeholder="Cari judul task, inisiatif, atau KR..."
            style="width: 100%; font-size: 13px"
          />
        </div>

        <!-- Department Filter -->
        <div class="filter-item" style="min-width: 170px">
          <label
            style="
              font-size: 11px;
              font-weight: 600;
              color: #64748b;
              margin-bottom: 4px;
              display: block;
            "
            >Departemen</label
          >
          <select
            v-model="selectedDepartment"
            class="form-input"
            style="width: 100%; font-size: 13px"
          >
            <option value="">Semua Departemen</option>
            <option v-for="dept in departmentsList" :key="dept" :value="dept">
              {{ getDeptLabel(dept) }}
            </option>
          </select>
        </div>

        <!-- PIC / Employee Filter -->
        <div class="filter-item" style="min-width: 170px">
          <label
            style="
              font-size: 11px;
              font-weight: 600;
              color: #64748b;
              margin-bottom: 4px;
              display: block;
            "
            >PIC / Pegawai</label
          >
          <select
            v-model="selectedEmployeeId"
            class="form-input"
            style="width: 100%; font-size: 13px"
          >
            <option value="">Semua PIC</option>
            <option v-for="emp in employeesList" :key="emp.id" :value="emp.id">
              {{ emp.name }}
            </option>
          </select>
        </div>

        <!-- Sprint Month Filter -->
        <div class="filter-item" style="min-width: 150px">
          <label
            style="
              font-size: 11px;
              font-weight: 600;
              color: #64748b;
              margin-bottom: 4px;
              display: block;
            "
          >
            Periode Sprint</label
          >
          <input
            v-model="selectedSprintMonth"
            type="month"
            class="form-input"
            style="width: 100%; font-size: 13px"
          />
        </div>

        <!-- Reset Button -->
        <div
          class="filter-item"
          v-if="
            searchQuery ||
            selectedDepartment ||
            selectedEmployeeId ||
            selectedSprintMonth
          "
          style="align-self: flex-end"
        >
          <button
            class="secondary-btn small"
            @click="resetFilters"
            style="
              font-size: 12px;
              padding: 6px 12px;
              margin-bottom: 16px;
              height: 36px;
              min-width: 100px;
            "
          >
            Reset Filter
          </button>
        </div>
      </div>

      <div v-if="loading" class="alert alert-info">Memuat data...</div>
      <div v-else-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>
      <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

      <!-- Inisiatif Tim Section -->
      <div
        v-if="!loading && filteredTeamInitiatives.length > 0"
        class="team-initiatives-section"
      >
        <h3 class="section-title">Inisiatif Saya</h3>

        <div
          v-for="(inis, deptKey) in getGroupedInitiatives(
            filteredTeamInitiatives,
          )"
          :key="deptKey"
          class="dept-group mb-6"
        >
          <div class="dept-group-header mb-4">
            <span class="dept-title-badge">{{ getDeptLabel(deptKey) }}</span>
          </div>

          <div class="initiative-list">
            <div v-for="ini in inis" :key="ini.id" class="ini-card card">
              <div class="ini-header">
                <h4>{{ ini.title }}</h4>
                <div
                  class="badge-group"
                  style="display: flex; gap: 8px; align-items: center"
                >
                  <span
                    class="status-badge"
                    :class="getStatusClass(ini.status)"
                    >{{ ini.status }}</span
                  >
                  <span
                    class="status-badge"
                    style="background: #cbd5e1; color: #334155"
                    >{{ ini.kanbanStatus }}</span
                  >
                </div>
              </div>
              <div class="ini-context">
                <p><strong>KR:</strong> {{ ini.keyResult?.title }}</p>
                <p>
                  <strong>Tim:</strong> {{ ini.team?.name }}
                  <span
                    v-if="ini.owner"
                    class="text-sm text-gray"
                    style="margin-left: 8px"
                    >(PIC: <strong>{{ ini.owner.name }}</strong
                    >)</span
                  >
                </p>
              </div>

              <!-- Realisasi vs Target Inisiatif -->
              <div
                class="ini-progress-section"
                style="margin-top: 12px; margin-bottom: 12px"
              >
                <div
                  class="progress-labels"
                  style="
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                    color: #475569;
                  "
                >
                  <span
                    >Target Inisiatif:
                    <strong
                      >{{ ini.targetValue }} {{ ini.unit || "%" }}</strong
                    ></span
                  >
                  <span
                    >Realisasi:
                    <strong
                      >{{ ini.currentValue }} {{ ini.unit || "%" }}</strong
                    ></span
                  >
                </div>
                <div
                  class="progress-bar-container"
                  style="
                    height: 8px;
                    background: #e2e8f0;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-top: 4px;
                  "
                >
                  <div
                    class="progress-bar"
                    :style="{
                      width: getProgressPercent(ini) + '%',
                      height: '100%',
                      background: '#0ea5e9',
                    }"
                  ></div>
                </div>
              </div>

              <!-- Riwayat Laporan Inisiatif -->
              <div
                v-if="ini.progressUpdates?.length > 0"
                class="ini-updates"
                style="
                  background: #f8fafc;
                  padding: 10px;
                  border-radius: 8px;
                  font-size: 12px;
                  margin-bottom: 12px;
                "
              >
                <div
                  style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                  "
                >
                  <div style="font-weight: 500; color: #475569">
                    Riwayat Laporan ({{ ini.progressUpdates.length }})
                  </div>
                  <button
                    v-if="
                      ini.progressUpdates.length > 1 &&
                      ['TEAM', 'LEADER', 'MANAGER', 'ADMIN'].includes(userRole)
                    "
                    class="toggle-history-btn"
                    style="margin: 0"
                    @click="toggleIniHistory(ini.id)"
                  >
                    {{
                      expandedIniIds.includes(ini.id)
                        ? "▲ Sembunyikan"
                        : `▼ Lihat ${ini.progressUpdates.length - 1} riwayat sebelumnya`
                    }}
                  </button>
                </div>

                <!-- Update terbaru selalu tampil -->
                <div
                  class="history-item"
                  style="padding: 0; background: transparent"
                >
                  <div
                    style="
                      display: flex;
                      justify-content: space-between;
                      align-items: flex-start;
                    "
                  >
                    <div>
                      <div class="history-timestamp">
                        {{ formatDateTime(ini.progressUpdates[0].createdAt) }}
                      </div>
                      <div class="history-value">
                        Realisasi:
                        <strong
                          >{{ ini.progressUpdates[0].newValue }}
                          {{ ini.unit || "%" }}</strong
                        >
                        <span class="prev-value"
                          >(dari {{ ini.progressUpdates[0].oldValue }})</span
                        >
                      </div>
                      <div
                        v-if="ini.progressUpdates[0].kanbanStatus"
                        class="history-kanban"
                      >
                        Status:
                        <span class="kanban-tag">{{
                          ini.progressUpdates[0].kanbanStatus
                        }}</span>
                      </div>
                    </div>
                    <button
                      class="toggle-history-btn"
                      style="margin: 0; padding: 2px 6px; font-size: 11px"
                      @click="
                        openDetailModal(
                          ini.title,
                          'Inisiatif',
                          ini.progressUpdates[0],
                          ini.owner?.name || authStore.user?.name,
                        )
                      "
                    >
                      Lihat Hasil
                    </button>
                  </div>
                  <div v-if="ini.progressUpdates[0].note" class="history-note">
                    "{{ ini.progressUpdates[0].note }}"
                  </div>
                </div>

                <!-- History lainnya disembunyikan pakai toggle -->
                <div
                  v-if="expandedIniIds.includes(ini.id)"
                  class="history-timeline"
                >
                  <div
                    v-for="upd in ini.progressUpdates.slice(1)"
                    :key="upd.id"
                    class="history-item"
                  >
                    <div
                      style="
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                      "
                    >
                      <div>
                        <div class="history-timestamp">
                          {{ formatDateTime(upd.createdAt) }}
                        </div>
                        <div class="history-value">
                          Realisasi:
                          <strong
                            >{{ upd.newValue }} {{ ini.unit || "%" }}</strong
                          >
                          <span class="prev-value"
                            >(dari {{ upd.oldValue }})</span
                          >
                        </div>
                        <div v-if="upd.kanbanStatus" class="history-kanban">
                          Status:
                          <span class="kanban-tag">{{ upd.kanbanStatus }}</span>
                        </div>
                      </div>
                      <button
                        class="toggle-history-btn"
                        style="margin: 0; padding: 2px 6px; font-size: 11px"
                        @click="
                          openDetailModal(
                            ini.title,
                            'Inisiatif',
                            upd,
                            ini.owner?.name || authStore.user?.name,
                          )
                        "
                      >
                        Lihat Hasil
                      </button>
                    </div>
                    <div v-if="upd.note" class="history-note">
                      "{{ upd.note }}"
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="ini.tasks?.length > 0" class="ini-tasks">
                <h5>Task Terkait:</h5>
                <div class="task-progress-list">
                  <div
                    v-for="task in ini.tasks"
                    :key="task.id"
                    class="task-progress-item"
                  >
                    <div class="task-progress-header">
                      <span class="task-title">{{ task.title }}</span>
                      <span class="task-numbers"
                        >{{ task.currentValue }}/{{ task.targetValue }}
                        {{ task.unit }}</span
                      >
                    </div>
                    <div class="progress-bar-container small">
                      <div
                        class="progress-bar"
                        :style="{ width: getProgressPercent(task) + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-sm text-gray mt-2">
                Belum ada Task untuk inisiatif ini.
              </div>

              <div class="card-actions" style="margin-top: 16px">
                <button
                  class="secondary-btn full-width"
                  style="
                    width: 100%;
                    border: 1px dashed #0ea5e9;
                    color: #0ea5e9;
                  "
                  @click="openIniModal(ini)"
                >
                  Laporkan Progress Inisiatif
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 class="section-title mt-6">Task Yang Di-Assign Ke Saya</h3>
      <div
        v-if="!loading && filteredTaskAssignments.length === 0"
        class="empty-state card"
      >
        Belum ada Task yang di-assign ke Anda.
      </div>

      <div class="task-grid">
        <div
          v-for="assign in filteredTaskAssignments"
          :key="assign.id"
          class="task-card card"
        >
          <div class="task-header">
            <h3>{{ assign.task.title }}</h3>
            <span
              class="status-badge"
              :class="getStatusClass(assign.task.status)"
              >{{ assign.task.status }}</span
            >
          </div>

          <div class="task-context">
            <p>
              <strong>KR:</strong>
              {{ assign.task.initiative?.keyResult?.title }}
            </p>
            <p>
              <strong>Inisiatif:</strong> {{ assign.task.initiative?.title }}
            </p>
          </div>

          <div class="task-progress-section">
            <div class="progress-labels">
              <span
                >Target:
                <strong
                  >{{ assign.task.targetValue }} {{ assign.task.unit }}</strong
                ></span
              >
              <span
                >Saat ini:
                <strong
                  >{{ assign.task.currentValue }} {{ assign.task.unit }}</strong
                ></span
              >
            </div>
            <div class="progress-bar-container">
              <div
                class="progress-bar"
                :style="{ width: getProgressPercent(assign.task) + '%' }"
              ></div>
            </div>
          </div>

          <div class="task-updates">
            <div v-if="assign.task.updates?.length > 0">
              <!-- Update terbaru selalu tampil -->
              <div class="update-latest">
                <div
                  style="
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                  "
                >
                  <div>
                    <span class="update-timestamp">{{
                      formatDateTime(assign.task.updates[0].createdAt)
                    }}</span>
                    <span class="update-val"
                      >Nilai dilaporkan:
                      {{ assign.task.updates[0].newValue }}</span
                    >
                    <span
                      class="update-status"
                      :class="
                        'status-' + assign.task.updates[0].status.toLowerCase()
                      "
                    >
                      {{ getUpdateStatusLabel(assign.task.updates[0].status) }}
                    </span>
                  </div>
                  <button
                    class="toggle-history-btn"
                    style="margin: 0; padding: 2px 6px; font-size: 11px"
                    @click="
                      openDetailModal(
                        assign.task.title,
                        'Task',
                        assign.task.updates[0],
                        authStore.user?.name,
                      )
                    "
                  >
                    Lihat Hasil
                  </button>
                </div>
                <span v-if="assign.task.updates[0].note" class="history-note"
                  >"{{ assign.task.updates[0].note }}"</span
                >
              </div>

              <!-- Toggle history lama -->
              <div
                v-if="
                  assign.task.updates.length > 1 &&
                  ['TEAM', 'LEADER', 'MANAGER', 'ADMIN'].includes(userRole)
                "
              >
                <button
                  class="toggle-history-btn"
                  @click="toggleTaskHistory(assign.task.id)"
                >
                  {{
                    expandedTaskIds.includes(assign.task.id)
                      ? "▲ Sembunyikan riwayat"
                      : `▼ Lihat ${assign.task.updates.length - 1} riwayat sebelumnya`
                  }}
                </button>
                <div
                  v-if="expandedTaskIds.includes(assign.task.id)"
                  class="history-timeline"
                >
                  <div
                    v-for="upd in assign.task.updates.slice(1)"
                    :key="upd.id"
                    class="history-item"
                  >
                    <div
                      style="
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                      "
                    >
                      <div>
                        <span class="history-timestamp">{{
                          formatDateTime(upd.createdAt)
                        }}</span>
                        <span class="history-value"
                          >Nilai: {{ upd.newValue }}</span
                        >
                        <span
                          class="update-status"
                          :class="'status-' + upd.status.toLowerCase()"
                        >
                          {{ getUpdateStatusLabel(upd.status) }}
                        </span>
                      </div>
                      <button
                        class="toggle-history-btn"
                        style="margin: 0; padding: 2px 6px; font-size: 11px"
                        @click="
                          openDetailModal(
                            assign.task.title,
                            'Task',
                            upd,
                            authStore.user?.name,
                          )
                        "
                      >
                        Lihat Hasil
                      </button>
                    </div>
                    <div v-if="upd.note" class="history-note">
                      "{{ upd.note }}"
                    </div>
                    <div v-if="upd.reviewNote" class="reject-note">
                      Alasan reject: "{{ upd.reviewNote }}"
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray">Belum ada update.</p>
          </div>

          <div class="card-actions">
            <button
              class="primary-btn full-width"
              @click="openUpdateModal(assign.task)"
            >
              Submit Update Progress
            </button>
          </div>
        </div>
      </div>

      <!-- Pekerjaan Tim Saya -->
      <div
        v-if="['TEAM', 'LEADER', 'MANAGER', 'ADMIN'].includes(userRole)"
        class="team-section mt-8"
      >
        <h3 class="section-title">Pekerjaan Tim Saya</h3>

        <div
          v-if="
            filteredTeamMembersTasks.length === 0 &&
            filteredTeamMembersInitiatives.length === 0
          "
          class="empty-state card mt-4"
        >
          Belum ada inisiatif atau Task yang dikerjakan oleh anggota tim Anda
          (atau tidak cocok dengan filter).
        </div>

        <div v-else>
          <!-- Team Initiatives -->
          <div v-if="filteredTeamMembersInitiatives.length > 0" class="mb-6">
            <h4 class="text-gray mb-4">Inisiatif Tim</h4>
            <div
              v-for="(inis, deptKey) in getGroupedInitiatives(
                filteredTeamMembersInitiatives,
              )"
              :key="deptKey"
              class="dept-group mb-6"
            >
              <div class="dept-group-header mb-4">
                <span class="dept-title-badge">{{
                  getDeptLabel(deptKey)
                }}</span>
              </div>
              <div class="initiative-list">
                <div
                  v-for="ini in inis"
                  :key="'team_ini_' + ini.id"
                  class="ini-card card"
                >
                  <div class="ini-header">
                    <h4>{{ ini.title }}</h4>
                    <div
                      class="badge-group"
                      style="display: flex; gap: 8px; align-items: center"
                    >
                      <span
                        class="status-badge"
                        :class="getStatusClass(ini.status)"
                        >{{ ini.status }}</span
                      >
                      <span
                        class="status-badge"
                        style="background: #cbd5e1; color: #334155"
                        >{{ ini.kanbanStatus }}</span
                      >
                    </div>
                  </div>
                  <div class="ini-context">
                    <p><strong>KR:</strong> {{ ini.keyResult?.title }}</p>
                    <p><strong>PIC:</strong> {{ ini.owner?.name || "-" }}</p>
                  </div>

                  <div
                    class="ini-progress-section"
                    style="margin-top: 12px; margin-bottom: 12px"
                  >
                    <div
                      class="progress-labels"
                      style="
                        display: flex;
                        justify-content: space-between;
                        font-size: 13px;
                        color: #475569;
                      "
                    >
                      <span
                        >Target:
                        <strong
                          >{{ ini.targetValue }} {{ ini.unit || "%" }}</strong
                        ></span
                      >
                      <span
                        >Realisasi:
                        <strong
                          >{{ ini.currentValue }} {{ ini.unit || "%" }}</strong
                        ></span
                      >
                    </div>
                    <div
                      class="progress-bar-container"
                      style="
                        height: 8px;
                        background: #e2e8f0;
                        border-radius: 4px;
                        overflow: hidden;
                        margin-top: 4px;
                      "
                    >
                      <div
                        class="progress-bar"
                        :style="{
                          width: getProgressPercent(ini) + '%',
                          height: '100%',
                          background: '#0ea5e9',
                        }"
                      ></div>
                    </div>
                  </div>

                  <!-- History Inisiatif -->
                  <div
                    class="ini-updates"
                    style="
                      background: #f8fafc;
                      padding: 10px;
                      border-radius: 8px;
                      font-size: 12px;
                    "
                  >
                    <div v-if="ini.progressUpdates?.length > 0">
                      <div
                        class="history-item"
                        style="padding: 0; background: transparent"
                      >
                        <div
                          style="
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                          "
                        >
                          <div>
                            <div class="history-timestamp">
                              {{
                                formatDateTime(ini.progressUpdates[0].createdAt)
                              }}
                            </div>
                            <div class="history-value">
                              Realisasi:
                              <strong
                                >{{ ini.progressUpdates[0].newValue }}
                                {{ ini.unit || "%" }}</strong
                              >
                            </div>
                            <div
                              v-if="ini.progressUpdates[0].kanbanStatus"
                              class="history-kanban"
                            >
                              Status:
                              <span class="kanban-tag">{{
                                ini.progressUpdates[0].kanbanStatus
                              }}</span>
                            </div>
                          </div>
                          <button
                            class="toggle-history-btn"
                            style="margin: 0; padding: 2px 6px; font-size: 11px"
                            @click="
                              openDetailModal(
                                ini.title,
                                'Inisiatif',
                                ini.progressUpdates[0],
                                ini.owner?.name,
                              )
                            "
                          >
                            Lihat Hasil
                          </button>
                        </div>
                        <div
                          v-if="ini.progressUpdates[0].note"
                          class="history-note"
                        >
                          "{{ ini.progressUpdates[0].note }}"
                        </div>
                      </div>

                      <div v-if="ini.progressUpdates.length > 1">
                        <button
                          class="toggle-history-btn"
                          @click="toggleIniHistory('team_' + ini.id)"
                        >
                          {{
                            expandedIniIds.includes("team_" + ini.id)
                              ? "▲ Sembunyikan"
                              : `▼ Lihat ${ini.progressUpdates.length - 1} riwayat sebelumnya`
                          }}
                        </button>
                        <div
                          v-if="expandedIniIds.includes('team_' + ini.id)"
                          class="history-timeline"
                        >
                          <div
                            v-for="upd in ini.progressUpdates.slice(1)"
                            :key="upd.id"
                            class="history-item"
                          >
                            <div
                              style="
                                display: flex;
                                justify-content: space-between;
                                align-items: flex-start;
                              "
                            >
                              <div>
                                <div class="history-timestamp">
                                  {{ formatDateTime(upd.createdAt) }}
                                </div>
                                <div class="history-value">
                                  Realisasi:
                                  <strong
                                    >{{ upd.newValue }}
                                    {{ ini.unit || "%" }}</strong
                                  >
                                </div>
                              </div>
                              <button
                                class="toggle-history-btn"
                                style="
                                  margin: 0;
                                  padding: 2px 6px;
                                  font-size: 11px;
                                "
                                @click="
                                  openDetailModal(
                                    ini.title,
                                    'Inisiatif',
                                    upd,
                                    ini.owner?.name,
                                  )
                                "
                              >
                                Lihat Hasil
                              </button>
                            </div>
                            <div v-if="upd.note" class="history-note">
                              "{{ upd.note }}"
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="text-sm text-gray">
                      Belum ada laporan progress.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Team Tasks -->
          <div v-if="filteredTeamMembersTasks.length > 0">
            <h4 class="text-gray mb-4">Task Tim</h4>
            <div class="task-grid">
              <div
                v-for="assign in filteredTeamMembersTasks"
                :key="'team_task_' + assign.id"
                class="task-card card"
              >
                <div class="member-badge">{{ assign.user?.name }}</div>

                <div class="task-header">
                  <h3>{{ assign.task.title }}</h3>
                  <span
                    class="status-badge"
                    :class="getStatusClass(assign.task.status)"
                    >{{ assign.task.status }}</span
                  >
                </div>

                <div class="task-context">
                  <p>
                    <strong>KR:</strong>
                    {{ assign.task.initiative?.keyResult?.title }}
                  </p>
                  <p>
                    <strong>Inisiatif:</strong>
                    {{ assign.task.initiative?.title }}
                  </p>
                </div>

                <div class="task-progress-section">
                  <div class="progress-labels">
                    <span
                      >Target:
                      <strong
                        >{{ assign.task.targetValue }}
                        {{ assign.task.unit }}</strong
                      ></span
                    >
                    <span
                      >Saat ini:
                      <strong
                        >{{ assign.task.currentValue }}
                        {{ assign.task.unit }}</strong
                      ></span
                    >
                  </div>
                  <div class="progress-bar-container">
                    <div
                      class="progress-bar"
                      :style="{ width: getProgressPercent(assign.task) + '%' }"
                    ></div>
                  </div>
                </div>

                <!-- Full history untuk LEADER melihat anggota tim -->
                <div class="task-updates">
                  <div v-if="assign.task.updates?.length > 0">
                    <div class="update-latest">
                      <div
                        style="
                          display: flex;
                          justify-content: space-between;
                          align-items: flex-start;
                        "
                      >
                        <div>
                          <span class="update-timestamp">{{
                            formatDateTime(assign.task.updates[0].createdAt)
                          }}</span>
                          <span class="update-val"
                            >Nilai dilaporkan:
                            {{ assign.task.updates[0].newValue }}</span
                          >
                          <span
                            class="update-status"
                            :class="
                              'status-' +
                              assign.task.updates[0].status.toLowerCase()
                            "
                          >
                            {{
                              getUpdateStatusLabel(
                                assign.task.updates[0].status,
                              )
                            }}
                          </span>
                        </div>
                        <button
                          class="toggle-history-btn"
                          style="margin: 0; padding: 2px 6px; font-size: 11px"
                          @click="
                            openDetailModal(
                              assign.task.title,
                              'Task',
                              assign.task.updates[0],
                              assign.user?.name,
                            )
                          "
                        >
                          Lihat Hasil
                        </button>
                      </div>
                      <span
                        v-if="assign.task.updates[0].note"
                        class="history-note"
                        >"{{ assign.task.updates[0].note }}"</span
                      >
                    </div>

                    <div v-if="assign.task.updates.length > 1">
                      <button
                        class="toggle-history-btn"
                        @click="toggleTaskHistory('team_' + assign.task.id)"
                      >
                        {{
                          expandedTaskIds.includes("team_" + assign.task.id)
                            ? "▲ Sembunyikan riwayat"
                            : `▼ Lihat ${assign.task.updates.length - 1} riwayat sebelumnya`
                        }}
                      </button>
                      <div
                        v-if="
                          expandedTaskIds.includes('team_' + assign.task.id)
                        "
                        class="history-timeline"
                      >
                        <div
                          v-for="upd in assign.task.updates.slice(1)"
                          :key="upd.id"
                          class="history-item"
                        >
                          <div
                            style="
                              display: flex;
                              justify-content: space-between;
                              align-items: flex-start;
                            "
                          >
                            <div>
                              <span class="history-timestamp">{{
                                formatDateTime(upd.createdAt)
                              }}</span>
                              <span class="history-value"
                                >Nilai: {{ upd.newValue }}</span
                              >
                              <span
                                class="update-status"
                                :class="'status-' + upd.status.toLowerCase()"
                              >
                                {{ getUpdateStatusLabel(upd.status) }}
                              </span>
                            </div>
                            <button
                              class="toggle-history-btn"
                              style="
                                margin: 0;
                                padding: 2px 6px;
                                font-size: 11px;
                              "
                              @click="
                                openDetailModal(
                                  assign.task.title,
                                  'Task',
                                  upd,
                                  assign.user?.name,
                                )
                              "
                            >
                              Lihat Hasil
                            </button>
                          </div>
                          <div v-if="upd.note" class="history-note">
                            "{{ upd.note }}"
                          </div>
                          <div v-if="upd.reviewNote" class="reject-note">
                            Alasan reject: "{{ upd.reviewNote }}"
                          </div>
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

      <!-- Modal Submit Update Task -->
      <div
        v-if="showUpdateModal"
        class="modal-overlay"
        @click.self="showUpdateModal = false"
      >
        <div class="modal-box">
          <div class="modal-header">
            <h3>Submit Update Progress Task</h3>
            <button class="modal-close-btn" @click="showUpdateModal = false">
              &times;
            </button>
          </div>
          <p class="mb-4">
            Task: <strong>{{ selectedTask?.title }}</strong>
          </p>

          <div class="info-box mb-4">
            Target: {{ selectedTask?.targetValue }} {{ selectedTask?.unit
            }}<br />
            Saat ini: {{ selectedTask?.currentValue }} {{ selectedTask?.unit }}
          </div>

          <label>Nilai Baru (Kumulatif) *</label>
          <input
            v-model.number="updateForm.newValue"
            type="number"
            class="form-input"
          />

          <label>Catatan Progress</label>
          <textarea
            v-model="updateForm.note"
            class="form-input"
            rows="3"
            placeholder="Apa yang sudah dikerjakan?"
          ></textarea>

          <label>Link Dokumentasi Hasil (opsional)</label>
          <input
            v-model="updateForm.link"
            type="url"
            class="form-input"
            placeholder="https://example.com/..."
          />

          <div v-if="isAutoApproveRole" class="info-box info-approved mb-4">
            Sebagai <strong>{{ userRole }}</strong
            >, update Anda akan <strong>langsung diterapkan</strong> tanpa perlu
            persetujuan.
          </div>
          <div v-else class="info-box mb-4">
            Update akan dikirim ke Leader/Manager untuk disetujui terlebih
            dahulu.
          </div>

          <!-- Riwayat Task updates sebelumnya -->
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
                <div style="margin-top: 2px">
                  Status: {{ getUpdateStatusLabel(upd.status) }}
                </div>
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

          <div v-if="modalError" class="alert alert-error">
            {{ modalError }}
          </div>

          <div class="modal-actions">
            <button class="secondary-btn" @click="showUpdateModal = false">
              Batal
            </button>
            <button
              class="primary-btn"
              @click="submitUpdate"
              :disabled="saving"
            >
              {{ saving ? "Mengirim..." : "Kirim Update" }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Laporkan Progress Inisiatif -->
      <div
        v-if="showIniModal"
        class="modal-overlay"
        @click.self="showIniModal = false"
      >
        <div class="modal-box">
          <div class="modal-header">
            <h3>Laporkan Progress Inisiatif</h3>
            <button class="modal-close-btn" @click="showIniModal = false">
              &times;
            </button>
          </div>
          <p class="mb-4">
            Inisiatif: <strong>{{ selectedIni?.title }}</strong>
          </p>

          <div class="info-box mb-4">
            Target: {{ selectedIni?.targetValue }} {{ selectedIni?.unit || "%"
            }}<br />
            Saat ini: {{ selectedIni?.currentValue }}
            {{ selectedIni?.unit || "%" }}
          </div>

          <label>Status Pekerjaan (Kanban)</label>
          <select v-model="iniForm.kanbanStatus" class="form-input">
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>

          <label>Nilai Realisasi Saat Ini *</label>
          <input
            v-model.number="iniForm.newValue"
            type="number"
            class="form-input"
          />

          <label>Catatan Progress / Notes *</label>
          <textarea
            v-model="iniForm.note"
            class="form-input"
            rows="3"
            placeholder="Informasi detail pekerjaan, kendala, atau note penting..."
          ></textarea>

          <label>Link Dokumentasi Hasil (opsional)</label>
          <input
            v-model="iniForm.link"
            type="url"
            class="form-input"
            placeholder="https://example.com/..."
          />

          <div class="info-box mb-4">
            Catatan progress inisiatif ini akan langsung disimpan ke history
            tanpa proses approval.
          </div>

          <div v-if="modalError" class="alert alert-error">
            {{ modalError }}
          </div>

          <div class="modal-actions">
            <button class="secondary-btn" @click="showIniModal = false">
              Batal
            </button>
            <button
              class="primary-btn"
              @click="submitIniUpdate"
              :disabled="saving"
            >
              {{ saving ? "Mengirim..." : "Simpan Progress" }}
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
            <p v-if="detailData.status">
              <strong>Status Approval:</strong>
              {{ getUpdateStatusLabel(detailData.status) }}
            </p>
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

const taskAssignments = ref([]);
const teamInitiatives = ref([]);
const loading = ref(true);
const errorMsg = ref("");

const showUpdateModal = ref(false);
const showIniModal = ref(false);
const saving = ref(false);
const modalError = ref("");
const successMsg = ref("");
const selectedTask = ref(null);
const selectedIni = ref(null);

const updateForm = ref({
  newValue: 0,
  note: "",
  link: "",
});

const iniForm = ref({
  newValue: 0,
  note: "",
  kanbanStatus: "",
  link: "",
});

const showDetailModal = ref(false);
const detailData = ref({
  title: "",
  type: "",
  oldValue: 0,
  newValue: 0,
  note: "",
  link: "",
  date: "",
  submittedBy: "",
  status: "",
});

function openDetailModal(title, type, update, submitterName) {
  detailData.value = {
    title,
    type,
    oldValue: update.oldValue,
    newValue: update.newValue,
    note: update.note || "Tidak ada catatan.",
    link: update.link || "",
    date: formatDateTime(update.createdAt),
    submittedBy: submitterName || "Anggota Tim",
    status: update.status || "",
  };
  showDetailModal.value = true;
}

const userRole = computed(() => authStore.user?.role || "");
const isAutoApproveRole = computed(() =>
  ["LEADER", "MANAGER", "ADMIN"].includes(userRole.value),
);

const config = useRuntimeConfig();
const API = config.public.apiBase || "http://localhost:3001/api";

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authStore.token}`,
  };
}

// Filter State
const searchQuery = ref("");
const selectedDepartment = ref("");
const selectedEmployeeId = ref("");
const selectedSprintMonth = ref("");

const allUsers = ref([]);

async function fetchAllUsers() {
  try {
    const res = await fetch(`${API}/users`, { headers: getHeaders() });
    if (res.ok) allUsers.value = await res.json();
  } catch (err) {}
}

const departmentsList = computed(() => {
  const depts = new Set();
  allUsers.value.forEach((u) => {
    if (u.department) depts.add(u.department);
  });
  teamInitiatives.value.forEach((i) => {
    if (i.team?.department) depts.add(i.team.department);
  });
  if (teamMembersWork.value.initiatives) {
    teamMembersWork.value.initiatives.forEach((i) => {
      if (i.team?.department) depts.add(i.team.department);
    });
  }
  return Array.from(depts).sort();
});

const employeesList = computed(() => {
  if (!selectedDepartment.value) return allUsers.value;
  return allUsers.value.filter(
    (u) => u.department === selectedDepartment.value,
  );
});

function resetFilters() {
  searchQuery.value = "";
  selectedDepartment.value = "";
  selectedEmployeeId.value = "";
  selectedSprintMonth.value = "";
}

const filteredTeamInitiatives = computed(() => {
  return teamInitiatives.value.filter((ini) => {
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchTitle = ini.title?.toLowerCase().includes(q);
      const matchDesc = ini.description?.toLowerCase().includes(q);
      const matchKr = ini.keyResult?.title?.toLowerCase().includes(q);
      const matchOwner = ini.owner?.name?.toLowerCase().includes(q);
      const matchTask = ini.tasks?.some((t) =>
        t.title?.toLowerCase().includes(q),
      );
      if (!matchTitle && !matchDesc && !matchKr && !matchOwner && !matchTask)
        return false;
    }

    if (selectedDepartment.value) {
      const matchDept =
        ini.team?.department === selectedDepartment.value ||
        ini.owner?.department === selectedDepartment.value;
      if (!matchDept) return false;
    }

    if (selectedEmployeeId.value) {
      const isOwner = ini.ownerId === selectedEmployeeId.value;
      const isAssignedLeader =
        ini.assignedLeaderId === selectedEmployeeId.value;
      const isTaskAssignee = ini.tasks?.some(
        (t) =>
          t.assignedTeamMemberId === selectedEmployeeId.value ||
          t.assignments?.some((a) => a.userId === selectedEmployeeId.value),
      );
      if (!isOwner && !isAssignedLeader && !isTaskAssignee) return false;
    }

    if (selectedSprintMonth.value) {
      const matchIniSprint = ini.sprintMonth === selectedSprintMonth.value;
      const matchTaskSprint = ini.tasks?.some(
        (t) => t.sprintMonth === selectedSprintMonth.value,
      );
      if (!matchIniSprint && !matchTaskSprint) return false;
    }

    return true;
  });
});

const filteredTaskAssignments = computed(() => {
  return taskAssignments.value.filter((assign) => {
    const task = assign.task || assign;
    if (!task) return false;

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchTitle = task.title?.toLowerCase().includes(q);
      const matchIni = task.initiative?.title?.toLowerCase().includes(q);
      const matchKr = task.initiative?.keyResult?.title
        ?.toLowerCase()
        .includes(q);
      if (!matchTitle && !matchIni && !matchKr) return false;
    }

    if (selectedDepartment.value) {
      const matchDept =
        task.initiative?.team?.department === selectedDepartment.value ||
        assign.user?.department === selectedDepartment.value ||
        task.assignedTeamMember?.department === selectedDepartment.value;
      if (!matchDept) return false;
    }

    if (selectedEmployeeId.value) {
      const matchUser =
        assign.userId === selectedEmployeeId.value ||
        task.assignedTeamMemberId === selectedEmployeeId.value ||
        task.assignments?.some((a) => a.userId === selectedEmployeeId.value);
      if (!matchUser) return false;
    }

    if (selectedSprintMonth.value) {
      const matchTaskSprint = task.sprintMonth === selectedSprintMonth.value;
      const matchIniSprint =
        task.initiative?.sprintMonth === selectedSprintMonth.value;
      if (!matchTaskSprint && !matchIniSprint) return false;
    }

    return true;
  });
});

const filteredTeamMembersInitiatives = computed(() => {
  if (!teamMembersWork.value.initiatives) return [];
  return teamMembersWork.value.initiatives.filter((ini) => {
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchTitle = ini.title?.toLowerCase().includes(q);
      const matchDesc = ini.description?.toLowerCase().includes(q);
      const matchKr = ini.keyResult?.title?.toLowerCase().includes(q);
      const matchOwner = ini.owner?.name?.toLowerCase().includes(q);
      const matchTask = ini.tasks?.some((t) =>
        t.title?.toLowerCase().includes(q),
      );
      if (!matchTitle && !matchDesc && !matchKr && !matchOwner && !matchTask)
        return false;
    }

    if (selectedDepartment.value) {
      const matchDept =
        ini.team?.department === selectedDepartment.value ||
        ini.owner?.department === selectedDepartment.value;
      if (!matchDept) return false;
    }

    if (selectedEmployeeId.value) {
      const isOwner = ini.ownerId === selectedEmployeeId.value;
      const isAssignedLeader =
        ini.assignedLeaderId === selectedEmployeeId.value;
      const isTaskAssignee = ini.tasks?.some(
        (t) =>
          t.assignedTeamMemberId === selectedEmployeeId.value ||
          t.assignments?.some((a) => a.userId === selectedEmployeeId.value),
      );
      if (!isOwner && !isAssignedLeader && !isTaskAssignee) return false;
    }

    if (selectedSprintMonth.value) {
      const matchIniSprint = ini.sprintMonth === selectedSprintMonth.value;
      const matchTaskSprint = ini.tasks?.some(
        (t) => t.sprintMonth === selectedSprintMonth.value,
      );
      if (!matchIniSprint && !matchTaskSprint) return false;
    }

    return true;
  });
});

const filteredTeamMembersTasks = computed(() => {
  if (!teamMembersWork.value.taskAssignments) return [];
  return teamMembersWork.value.taskAssignments.filter((assign) => {
    const task = assign.task || assign;
    if (!task) return false;

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchTitle = task.title?.toLowerCase().includes(q);
      const matchIni = task.initiative?.title?.toLowerCase().includes(q);
      const matchKr = task.initiative?.keyResult?.title
        ?.toLowerCase()
        .includes(q);
      if (!matchTitle && !matchIni && !matchKr) return false;
    }

    if (selectedDepartment.value) {
      const matchDept =
        task.initiative?.team?.department === selectedDepartment.value ||
        assign.user?.department === selectedDepartment.value ||
        task.assignedTeamMember?.department === selectedDepartment.value;
      if (!matchDept) return false;
    }

    if (selectedEmployeeId.value) {
      const matchUser =
        assign.userId === selectedEmployeeId.value ||
        task.assignedTeamMemberId === selectedEmployeeId.value ||
        task.assignments?.some((a) => a.userId === selectedEmployeeId.value);
      if (!matchUser) return false;
    }

    if (selectedSprintMonth.value) {
      const matchTaskSprint = task.sprintMonth === selectedSprintMonth.value;
      const matchIniSprint =
        task.initiative?.sprintMonth === selectedSprintMonth.value;
      if (!matchTaskSprint && !matchIniSprint) return false;
    }

    return true;
  });
});

onMounted(async () => {
  if (
    !authStore.isAuthenticated ||
    !["TEAM", "LEADER", "MANAGER", "ADMIN"].includes(authStore.user?.role)
  ) {
    router.push("/login");
    return;
  }
  await Promise.all([fetchMyWork(), fetchAllUsers()]);
});

const teamMembersWork = ref({ taskAssignments: [], initiatives: [] });
const expandedTaskIds = ref([]);
const expandedIniIds = ref([]);

function toggleTaskHistory(id) {
  const idx = expandedTaskIds.value.indexOf(id);
  if (idx === -1) expandedTaskIds.value.push(id);
  else expandedTaskIds.value.splice(idx, 1);
}

function toggleIniHistory(id) {
  const idx = expandedIniIds.value.indexOf(id);
  if (idx === -1) expandedIniIds.value.push(id);
  else expandedIniIds.value.splice(idx, 1);
}

function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const dayName = days[d.getDay()];
  const date = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dayName}, ${date} · ${time}`;
}

async function fetchMyWork() {
  loading.value = true;
  errorMsg.value = "";
  try {
    const res = await fetch(`${API}/initiatives/my-work/all`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Gagal memuat pekerjaan");
    const data = await res.json();
    taskAssignments.value = data.taskAssignments || [];
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

function getProgressPercent(task) {
  if (!task || !task.targetValue) return 0;
  return Math.min(
    100,
    Math.max(0, (task.currentValue / task.targetValue) * 100),
  );
}

function getStatusClass(status) {
  if (status === "ON_TRACK") return "bg-green";
  if (status === "AT_RISK") return "bg-yellow";
  if (status === "OFF_TRACK") return "bg-red";
  return "bg-gray";
}

function openUpdateModal(task) {
  selectedTask.value = task;
  updateForm.value = {
    newValue: task.currentValue,
    note: "",
    link: "",
  };
  modalError.value = "";
  showUpdateModal.value = true;
}

function openIniModal(ini) {
  selectedIni.value = ini;
  iniForm.value = {
    newValue: ini.currentValue,
    note: "",
    kanbanStatus: ini.kanbanStatus || "TODO",
    link: "",
  };
  modalError.value = "";
  showIniModal.value = true;
}

async function submitUpdate() {
  if (
    updateForm.value.newValue === undefined ||
    updateForm.value.newValue === null
  ) {
    modalError.value = "Nilai baru wajib diisi";
    return;
  }

  saving.value = true;
  modalError.value = "";
  try {
    const res = await fetch(
      `${API}/initiatives/tasks/${selectedTask.value.id}/updates`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(updateForm.value),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }

    const data = await res.json();
    showUpdateModal.value = false;
    await fetchMyWork(); // refresh

    successMsg.value = data.message || "Update berhasil dikirim!";
    setTimeout(() => {
      successMsg.value = "";
    }, 4000);
  } catch (err) {
    modalError.value = err.message;
  } finally {
    saving.value = false;
  }
}

async function submitIniUpdate() {
  if (iniForm.value.newValue === undefined || iniForm.value.newValue === null) {
    modalError.value = "Nilai realisasi wajib diisi";
    return;
  }

  saving.value = true;
  modalError.value = "";
  try {
    const res = await fetch(
      `${API}/initiatives/${selectedIni.value.id}/progress-updates`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(iniForm.value),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }

    const data = await res.json();
    showIniModal.value = false;
    await fetchMyWork(); // refresh

    successMsg.value = data.message || "Laporan progress berhasil disimpan!";
    setTimeout(() => {
      successMsg.value = "";
    }, 4000);
  } catch (err) {
    modalError.value = err.message;
  } finally {
    saving.value = false;
  }
}

function getUpdateStatusLabel(status) {
  const labels = {
    PENDING_APPROVAL: "Menunggu Persetujuan",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
  };
  return labels[status] || status;
}

const DEPT_LABELS = {
  STRATEGIC: "Strategic",
  FINANCE: "Finance",
  BUSINESS: "Business",
  B2S: "B2S",
  B2B_EXPANSION: "B2B Expansion",
  B2B_CORPORATION: "B2B Corporate",
  B2C: "B2C",
  PRODUCT_SERVICE: "Product Service",
  SERVICE_ACCOUNT: "Service Account",
  TECHDEV: "Techdev",
  TECHOPS: "TechOps",
  EDUCATION: "Education",
  SSC: "Shared Service Center",
  DESIGN: "Design",
  DATA: "Data",
  HR: "HR",
  UNASSIGNED: "General / Lainnya",
};

function getDeptLabel(deptKey) {
  return DEPT_LABELS[deptKey] || deptKey;
}

function getGroupedInitiatives(initiatives) {
  if (!initiatives) return {};
  const groups = {};

  initiatives.forEach((ini) => {
    let depts = [];
    const kr = ini.keyResult;
    if (kr) {
      if (kr.departments && kr.departments.length > 0) {
        depts = kr.departments.map((d) => d.department);
      } else {
        // Fallback 1: Parse from bracket prefix in KR title, e.g. "[B2C] title"
        const titleMatch = kr.title.match(/^\[(.*?)\]/);
        if (titleMatch) {
          const titleDept = titleMatch[1].trim();
          let key = titleDept.toUpperCase().replace(/\s+/g, "_");
          if (key === "B2B_CORPORATE") key = "B2B_CORPORATION";
          depts = [key];
        } else {
          // Fallback 2: Check team department of the initiative itself
          if (ini.team?.department) {
            depts = [ini.team.department];
          }
        }
      }
    }

    if (depts.length === 0) {
      depts = ["UNASSIGNED"];
    }

    depts.forEach((dept) => {
      if (!groups[dept]) {
        groups[dept] = [];
      }
      if (!groups[dept].some((item) => item.id === ini.id)) {
        groups[dept].push(ini);
      }
    });
  });

  return groups;
}
</script>

<style scoped>
.admin-root {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 32px;
}
.admin-content {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f5f9;
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-title h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}
.section-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
}
.task-header h3 {
  font-size: 16px;
  margin: 0;
  color: #0f172a;
  flex: 1;
}
.status-badge {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.task-context {
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #475569;
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
  color: #475569;
}
.progress-bar-container {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: #0ea5e9;
  transition: width 0.3s;
}

.task-updates h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #64748b;
}
.recent-update {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
}
.update-date {
  color: #94a3b8;
}
.update-val {
  display: flex;
  margin: 4px;
  font-weight: 500;
  color: #1e293b;
}
.update-status {
  font-weight: 600;
  display: inline-block;
  width: fit-content;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-pending_approval {
  background: #fef08a;
  color: #854d0e;
}
.status-approved {
  background: #dcfce7;
  color: #166534;
}
.status-rejected {
  background: #fee2e2;
  color: #991b1b;
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

.text-gray {
  color: #64748b;
}
.text-sm {
  font-size: 12px;
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
.primary-btn:hover {
  background: #0284c7;
}
.primary-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}
.primary-btn.full-width {
  width: 100%;
  margin-top: auto;
}
.secondary-btn {
  background: white;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
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
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 500px;
}
.info-box {
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  border: 1px solid #e2e8f0;
}
.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 16px;
  box-sizing: border-box;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}
.alert {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.alert-error {
  background: #fee2e2;
  color: #991b1b;
}
.alert-info {
  background: #e0f2fe;
  color: #075985;
}
.alert-success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}
.info-approved {
  background: #dcfce7;
  border-color: #bbf7d0;
  color: #166534;
}

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
.history-value {
  color: #1e293b;
  font-weight: 500;
}
.prev-value {
  color: #94a3b8;
  font-size: 11px;
  margin-left: 4px;
}
.history-note {
  color: #64748b;
  font-style: italic;
}
.reject-note {
  color: #ef4444;
  font-weight: 500;
  font-size: 11px;
}

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

.update-latest {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
}
.update-timestamp {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

/* Seksi tim (LEADER) */
.team-section {
  border-top: 2px solid #e2e8f0;
  padding-top: 24px;
}
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
.mt-8 {
  margin-top: 40px;
}

.info-approved {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}
.mb-4 {
  margin-bottom: 16px;
}

/* Initiatives styles */
.section-title {
  font-size: 18px;
  margin: 0 0 16px 0;
  color: #0f172a;
}
.mt-6 {
  margin-top: 32px;
}
.team-initiatives-section {
  margin-bottom: 24px;
}
.initiative-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ini-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ini-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.ini-header h4 {
  font-size: 16px;
  margin: 0;
  color: #0f172a;
}
.ini-context {
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #475569;
}
.ini-context p {
  margin: 0 0 4px 0;
}
.ini-context p:last-child {
  margin: 0;
}
.ini-tasks {
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}
.ini-tasks h5 {
  font-size: 13px;
  margin: 0 0 12px 0;
  color: #64748b;
}
.task-progress-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.task-progress-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.task-progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
.task-title {
  font-weight: 500;
  color: #334155;
}
.task-numbers {
  color: #64748b;
}
.progress-bar-container.small {
  height: 6px;
}

/* Modal Header styling */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.modal-header h3 {
  margin: 0;
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
.alert-info {
  background: #e0f2fe;
  color: #075985;
}
.mb-4 {
  margin-bottom: 16px;
}
.dept-group-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  margin-top: 16px;
}
.dept-group:first-child .dept-group-header {
  margin-top: 0;
}
.dept-title-badge {
  font-size: 16px;
  font-weight: 700;
  color: #475569;
  background: var(--color-cyan-100, #cffafe);
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>

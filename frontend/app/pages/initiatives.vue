<template>
  <div class="admin-root">
    <div class="admin-content">
      <!-- Header Section -->
      <div class="header-section card">
        <div class="header-left-title">
          <div class="title-with-badge">
            <h2>Papan Inisiatif Tim</h2>
            <span class="view-badge">Kanban Board</span>
          </div>
          <p class="section-desc">
            Pantau dan kelola eksekusi seluruh inisiatif kerja melalui 3 tahapan
            alur: To Do, In Progress, dan Done.
          </p>

          <!-- Scope Notice Badge -->
          <div class="scope-banner" :class="userRoleClass">
            <span class="scope-icon">{{ roleIcon }}</span>
            <span class="scope-text">
              <strong>Scope Akses ({{ auth.user?.role }}):</strong>
              {{ scopeDescription }}
            </span>
          </div>
        </div>

        <div class="header-action-group">
          <button
            v-if="isAdmin"
            class="secondary-btn"
            @click="showBulkModal = true"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Bulk Upload CSV
          </button>
          <button
            v-if="canCreateInitiative"
            class="primary-btn"
            @click="openAddInitiativeModal"
          >
            + Tambah Inisiatif
          </button>
        </div>
      </div>

      <!-- Alert -->
      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <!-- Filters & Search Bar -->
      <div class="kanban-filter-card card">
        <div class="search-controls-row">
          <div class="search-input-wrap">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="search-icon"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Cari inisiatif, PIC owner, atau Key Result..."
            />
          </div>
        </div>

        <div class="filter-controls-row">
          <div class="filter-item">
            <label>Filter Tim:</label>
            <select v-model="selectedTeamId" class="filter-select">
              <option value="">Semua Tim ({{ availableTeams.length }})</option>
              <option v-for="t in availableTeams" :key="t.id" :value="t.id">
                {{ t.name }}
              </option>
            </select>
          </div>

          <!-- Filter Pegawai / PIC Subordinat -->
          <div v-if="!isTeam && availableOwners.length > 0" class="filter-item">
            <label>Filter Pegawai (PIC):</label>
            <select v-model="selectedOwnerId" class="filter-select">
              <option value="">
                Semua Pegawai ({{ availableOwners.length }})
              </option>
              <option v-for="u in availableOwners" :key="u.id" :value="u.id">
                {{ u.name }} ({{ u.role }})
              </option>
            </select>
          </div>

          <div class="filter-item">
            <label>Filter Key Result:</label>
            <select v-model="selectedKrId" class="filter-select">
              <option value="">Semua Key Result ({{ allKrs.length }})</option>
              <option v-for="kr in allKrs" :key="kr.id" :value="kr.id">
                {{ kr.title }}
              </option>
            </select>
          </div>

          <!-- Filter Bulan / Sprint -->
          <div class="filter-item">
            <label>Filter Bulan / Sprint:</label>
            <select v-model="selectedSprintMonth" class="filter-select">
              <option value="">Semua Bulan / Sprint</option>
              <option v-for="m in availableSprintMonths" :key="m" :value="m">
                {{ formatSprintLabel(m) }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Kanban Board Container -->
      <div class="kanban-board">
        <!-- COLUMN 1: TO DO -->
        <div
          class="kanban-column"
          :class="{ 'drop-active': dragOverColumn === 'TODO' }"
          @dragover.prevent="canMoveCards ? (dragOverColumn = 'TODO') : null"
          @dragleave="dragOverColumn = null"
          @drop="canMoveCards ? handleDrop('TODO') : null"
        >
          <div class="column-header todo-head">
            <div class="col-title-wrap">
              <span class="col-dot todo"></span>
              <h4>TO DO</h4>
            </div>
            <span class="col-count-badge">{{ todoList.length }}</span>
          </div>

          <div class="column-cards-list">
            <div v-if="todoList.length === 0" class="kanban-empty-col">
              Belum ada inisiatif di kolom ini
            </div>

            <div
              v-for="ini in todoList"
              :key="ini.id"
              class="kanban-card"
              :draggable="canMoveCards"
              @dragstart="canMoveCards ? handleDragStart(ini) : null"
            >
              <div class="card-top-meta">
                <span class="card-kr-badge" :title="ini.keyResult?.title">
                  {{ ini.keyResult?.title || "Key Result" }}
                </span>
                <span
                  v-if="ini.keyResult?.bscPerspective"
                  class="perspective-pill"
                  :class="ini.keyResult.bscPerspective.toLowerCase()"
                >
                  {{ ini.keyResult.bscPerspective }}
                </span>
              </div>

              <h4 class="card-title">{{ ini.title }}</h4>
              <p v-if="ini.description" class="card-desc">
                {{ ini.description }}
              </p>

              <div class="card-target-row">
                <span v-if="ini.targetValue">
                  <span class="target-label">Target:</span>
                  <strong class="target-val"
                    >{{ ini.targetValue }} {{ ini.unit || "" }}</strong
                  >
                </span>
                <span
                  class="weight-badge-mini"
                  title="Bobot Inisiatif terhadap KR"
                >
                  Bobot: <strong>{{ ini.weight || 1.0 }}%</strong>
                </span>
              </div>

              <!-- Date Range & Sprint Meta Row -->
              <div
                class="card-dates-sprint-row"
                v-if="ini.startDate || ini.dueDate || ini.sprintMonth"
              >
                <span v-if="ini.sprintMonth" class="sprint-pill">
                  {{ formatSprintLabel(ini.sprintMonth) }}
                </span>
                <span
                  v-if="ini.startDate || ini.dueDate"
                  class="date-range-pill"
                  :class="{ overdue: isOverdue(ini) }"
                >
                  {{ formatDateShort(ini.startDate) }} –
                  {{ formatDateShort(ini.dueDate) }}
                </span>
              </div>

              <!-- Tasks summary chips -->
              <div class="card-tasks-summary" v-if="ini.tasks?.length">
                <span class="task-count-tag">
                  {{ ini.tasks.length }} Task ({{ getCompletedTasksCount(ini) }}
                  selesai)
                </span>
              </div>

              <div class="card-footer-meta">
                <div class="card-team-owner">
                  <span class="team-tag">{{ ini.team?.name }}</span>
                  <span v-if="ini.owner?.name" class="owner-tag">
                    {{ ini.owner.name }}
                    <span
                      v-if="getMemberAchievement(ini.ownerId)"
                      class="owner-ach-pill"
                      :class="
                        getAchColorClass(
                          getMemberAchievement(ini.ownerId).achievementPct,
                        )
                      "
                    >
                      {{ getMemberAchievement(ini.ownerId).achievementPct }}%
                    </span>
                  </span>
                </div>
              </div>

              <!-- Card Action Buttons -->
              <div v-if="canMoveCards" class="card-hover-actions">
                <div class="left-actions">
                  <button
                    v-if="canManageInitiative(ini)"
                    class="action-btn"
                    title="Tambah Task"
                    @click="openAddTaskModal(ini)"
                  >
                    + Task
                  </button>
                  <button
                    v-if="canManageInitiative(ini)"
                    class="action-btn"
                    title="Edit Inisiatif"
                    @click="openEditInitiativeModal(ini)"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      />
                      <path
                        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                      />
                    </svg>
                  </button>
                  <button
                    v-if="isAdmin"
                    class="action-btn danger"
                    title="Hapus"
                    @click="deleteInitiative(ini.id)"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path
                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                      />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
                <div class="move-actions">
                  <button
                    class="move-btn"
                    title="Pindah ke In Progress"
                    @click="moveCard(ini.id, 'IN_PROGRESS')"
                  >
                    Maju &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMN 2: IN PROGRESS -->
        <div
          class="kanban-column"
          :class="{ 'drop-active': dragOverColumn === 'IN_PROGRESS' }"
          @dragover.prevent="
            canMoveCards ? (dragOverColumn = 'IN_PROGRESS') : null
          "
          @dragleave="dragOverColumn = null"
          @drop="canMoveCards ? handleDrop('IN_PROGRESS') : null"
        >
          <div class="column-header progress-head">
            <div class="col-title-wrap">
              <span class="col-dot progress"></span>
              <h4>IN PROGRESS</h4>
            </div>
            <span class="col-count-badge">{{ inProgressList.length }}</span>
          </div>

          <div class="column-cards-list">
            <div v-if="inProgressList.length === 0" class="kanban-empty-col">
              Tidak ada inisiatif yang sedang berjalan
            </div>

            <div
              v-for="ini in inProgressList"
              :key="ini.id"
              class="kanban-card card-in-progress"
              :draggable="canMoveCards"
              @dragstart="canMoveCards ? handleDragStart(ini) : null"
            >
              <div class="card-top-meta">
                <span class="card-kr-badge" :title="ini.keyResult?.title">
                  {{ ini.keyResult?.title || "Key Result" }}
                </span>
                <span
                  v-if="ini.keyResult?.bscPerspective"
                  class="perspective-pill"
                  :class="ini.keyResult.bscPerspective.toLowerCase()"
                >
                  {{ ini.keyResult.bscPerspective }}
                </span>
              </div>

              <h4 class="card-title">{{ ini.title }}</h4>
              <p v-if="ini.description" class="card-desc">
                {{ ini.description }}
              </p>

              <div class="card-target-row">
                <span v-if="ini.targetValue">
                  <span class="target-label">Target:</span>
                  <strong class="target-val"
                    >{{ ini.targetValue }} {{ ini.unit || "" }}</strong
                  >
                </span>
                <span
                  class="weight-badge-mini"
                  title="Bobot Inisiatif terhadap KR"
                >
                  Bobot: <strong>{{ ini.weight || 1.0 }}%</strong>
                </span>
              </div>

              <!-- Date Range & Sprint Meta Row -->
              <div
                class="card-dates-sprint-row"
                v-if="ini.startDate || ini.dueDate || ini.sprintMonth"
              >
                <span v-if="ini.sprintMonth" class="sprint-pill">
                  {{ formatSprintLabel(ini.sprintMonth) }}
                </span>
                <span
                  v-if="ini.startDate || ini.dueDate"
                  class="date-range-pill"
                  :class="{ overdue: isOverdue(ini) }"
                >
                  {{ formatDateShort(ini.startDate) }} –
                  {{ formatDateShort(ini.dueDate) }}
                </span>
              </div>

              <!-- Tasks summary chips -->
              <div class="card-tasks-summary" v-if="ini.tasks?.length">
                <span class="task-count-tag in-progress">
                  {{ ini.tasks.length }} Task ({{ getCompletedTasksCount(ini) }}/{{
                    ini.tasks.length
                  }}
                  selesai)
                </span>
              </div>

              <div class="card-footer-meta">
                <div class="card-team-owner">
                  <span class="team-tag">{{ ini.team?.name }}</span>
                  <span v-if="ini.owner?.name" class="owner-tag">
                    {{ ini.owner.name }}
                    <span
                      v-if="getMemberAchievement(ini.ownerId)"
                      class="owner-ach-pill"
                      :class="
                        getAchColorClass(
                          getMemberAchievement(ini.ownerId).achievementPct,
                        )
                      "
                    >
                      {{ getMemberAchievement(ini.ownerId).achievementPct }}%
                    </span>
                  </span>
                </div>
              </div>

              <!-- Card Action Buttons -->
              <div v-if="canMoveCards" class="card-hover-actions">
                <div class="left-actions">
                  <button
                    v-if="canManageInitiative(ini)"
                    class="action-btn"
                    title="Tambah Task"
                    @click="openAddTaskModal(ini)"
                  >
                    + Task
                  </button>
                  <button
                    v-if="canManageInitiative(ini)"
                    class="action-btn"
                    title="Edit Inisiatif"
                    @click="openEditInitiativeModal(ini)"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      />
                      <path
                        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                      />
                    </svg>
                  </button>
                  <button
                    v-if="isAdmin"
                    class="action-btn danger"
                    title="Hapus"
                    @click="deleteInitiative(ini.id)"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path
                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                      />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
                <div class="move-actions">
                  <button
                    class="move-btn"
                    title="Kembalikan ke To Do"
                    @click="moveCard(ini.id, 'TODO')"
                  >
                    &larr; Mundur
                  </button>
                  <button
                    class="move-btn primary"
                    title="Selesaikan ke Done"
                    @click="moveCard(ini.id, 'DONE')"
                  >
                    Selesai &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMN 3: DONE -->
        <div
          class="kanban-column"
          :class="{ 'drop-active': dragOverColumn === 'DONE' }"
          @dragover.prevent="canMoveCards ? (dragOverColumn = 'DONE') : null"
          @dragleave="dragOverColumn = null"
          @drop="canMoveCards ? handleDrop('DONE') : null"
        >
          <div class="column-header done-head">
            <div class="col-title-wrap">
              <span class="col-dot done"></span>
              <h4>DONE</h4>
            </div>
            <span class="col-count-badge">{{ doneList.length }}</span>
          </div>

          <div class="column-cards-list">
            <div v-if="doneList.length === 0" class="kanban-empty-col">
              Belum ada inisiatif yang selesai
            </div>

            <div
              v-for="ini in doneList"
              :key="ini.id"
              class="kanban-card card-done"
              :draggable="canMoveCards"
              @dragstart="canMoveCards ? handleDragStart(ini) : null"
            >
              <div class="card-top-meta">
                <span class="card-kr-badge" :title="ini.keyResult?.title">
                  {{ ini.keyResult?.title || "Key Result" }}
                </span>
                <span class="completed-checkmark-badge">Selesai</span>
              </div>

              <h4 class="card-title text-done">{{ ini.title }}</h4>
              <p v-if="ini.description" class="card-desc">
                {{ ini.description }}
              </p>

              <div class="card-target-row">
                <span v-if="ini.targetValue">
                  <span class="target-label">Target:</span>
                  <strong class="target-val"
                    >{{ ini.targetValue }} {{ ini.unit || "" }}</strong
                  >
                </span>
                <span
                  class="weight-badge-mini"
                  title="Bobot Inisiatif terhadap KR"
                >
                  Bobot: <strong>{{ ini.weight || 1.0 }}%</strong>
                </span>
              </div>

              <!-- Date Range & Sprint Meta Row -->
              <div
                class="card-dates-sprint-row"
                v-if="ini.startDate || ini.dueDate || ini.sprintMonth"
              >
                <span v-if="ini.sprintMonth" class="sprint-pill">
                  {{ formatSprintLabel(ini.sprintMonth) }}
                </span>
                <span
                  v-if="ini.startDate || ini.dueDate"
                  class="date-range-pill"
                  :class="{ overdue: isOverdue(ini) }"
                >
                  {{ formatDateShort(ini.startDate) }} –
                  {{ formatDateShort(ini.dueDate) }}
                </span>
              </div>

              <!-- Achieved Value Row for DONE cards -->
              <div
                class="card-achieved-row"
                v-if="ini.kanbanStatus === 'DONE' || ini.achievedValue !== null"
              >
                <span class="achieved-label">Capaian Akhir:</span>
                <strong class="achieved-val">
                  {{ ini.achievedValue ?? ini.currentValue }} /
                  {{ ini.targetValue }} {{ ini.unit || "" }} ({{
                    calculateAchievedPercent(ini)
                  }}%)
                </strong>
              </div>

              <div class="card-footer-meta">
                <div class="card-team-owner">
                  <span class="team-tag">{{ ini.team?.name }}</span>
                  <span v-if="ini.owner?.name" class="owner-tag">
                    {{ ini.owner.name }}
                    <span
                      v-if="getMemberAchievement(ini.ownerId)"
                      class="owner-ach-pill"
                      :class="
                        getAchColorClass(
                          getMemberAchievement(ini.ownerId).achievementPct,
                        )
                      "
                    >
                      {{ getMemberAchievement(ini.ownerId).achievementPct }}%
                    </span>
                  </span>
                </div>
              </div>

              <!-- Card Action Buttons -->
              <div v-if="canMoveCards" class="card-hover-actions">
                <div class="left-actions">
                  <button
                    v-if="canManageInitiative(ini)"
                    class="action-btn"
                    title="Edit"
                    @click="openEditInitiativeModal(ini)"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      />
                      <path
                        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                      />
                    </svg>
                  </button>
                  <button
                    v-if="isAdmin"
                    class="action-btn danger"
                    title="Hapus"
                    @click="deleteInitiative(ini.id)"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path
                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                      />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
                <div class="move-actions">
                  <button
                    class="move-btn"
                    title="Pindah ke In Progress"
                    @click="moveCard(ini.id, 'IN_PROGRESS')"
                  >
                    &larr; Buka Kembali
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMN 4: DROP -->
        <div
          class="kanban-column"
          :class="{ 'drop-active': dragOverColumn === 'DROP' }"
          @dragover.prevent="canMoveCards ? (dragOverColumn = 'DROP') : null"
          @dragleave="dragOverColumn = null"
          @drop="canMoveCards ? handleDrop('DROP') : null"
        >
          <div class="column-header drop-head">
            <div class="col-title-wrap">
              <span class="col-dot drop"></span>
              <h4>DROP</h4>
            </div>
            <span class="col-count-badge">{{ dropList.length }}</span>
          </div>

          <div class="column-cards-list">
            <div v-if="dropList.length === 0" class="kanban-empty-col">
              Belum ada inisiatif yang dibatalkan
            </div>

            <div
              v-for="ini in dropList"
              :key="ini.id"
              class="kanban-card card-drop"
              :draggable="canMoveCards"
              @dragstart="canMoveCards ? handleDragStart(ini) : null"
            >
              <div class="card-top-meta">
                <span class="card-kr-badge" :title="ini.keyResult?.title">
                  {{ ini.keyResult?.title || "Key Result" }}
                </span>
                <span class="dropped-badge">Drop</span>
              </div>

              <h4 class="card-title text-drop">{{ ini.title }}</h4>
              <p v-if="ini.description" class="card-desc">
                {{ ini.description }}
              </p>

              <div class="card-target-row">
                <span v-if="ini.targetValue">
                  <span class="target-label">Target:</span>
                  <strong class="target-val"
                    >{{ ini.targetValue }} {{ ini.unit || "" }}</strong
                  >
                </span>
                <span
                  class="weight-badge-mini"
                  title="Bobot Inisiatif terhadap KR"
                >
                  Bobot: <strong>{{ ini.weight || 1.0 }}%</strong>
                </span>
              </div>

              <div class="card-footer-meta">
                <div class="card-team-owner">
                  <span class="team-tag">{{ ini.team?.name }}</span>
                  <span v-if="ini.owner?.name" class="owner-tag">
                    {{ ini.owner.name }}
                  </span>
                </div>
              </div>

              <!-- Card Action Buttons -->
              <div v-if="canMoveCards" class="card-hover-actions">
                <div class="left-actions">
                  <button
                    v-if="canManageInitiative(ini)"
                    class="action-btn"
                    title="Edit"
                    @click="openEditInitiativeModal(ini)"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      />
                      <path
                        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                      />
                    </svg>
                  </button>
                  <button
                    v-if="isAdmin"
                    class="action-btn danger"
                    title="Hapus"
                    @click="deleteInitiative(ini.id)"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path
                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                      />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
                <div class="move-actions">
                  <button
                    class="move-btn"
                    title="Pindah ke To Do"
                    @click="moveCard(ini.id, 'TODO')"
                  >
                    &larr; Aktifkan Kembali
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── MODAL: Add/Edit Initiative ─── -->
      <div
        v-if="showInitiativeModal"
        class="modal-overlay"
        @click.self="showInitiativeModal = false"
      >
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ editingInitiative ? "Edit" : "Tambah" }} Inisiatif</h3>
            <button
              class="modal-close-btn"
              @click="showInitiativeModal = false"
            >
              &times;
            </button>
          </div>
          <div class="modal-body-scroll">
            <label>Judul Inisiatif *</label>
            <input
              v-model="initiativeForm.title"
              class="form-input"
              placeholder="Contoh: Optimalisasi query database..."
            />

            <!-- <label>Deskripsi</label>
            <textarea v-model="initiativeForm.description" class="form-input" rows="2" placeholder="Catatan dan ruang lingkup inisiatif..."></textarea> -->

            <label>Parent Key Result *</label>
            <select v-model="initiativeForm.keyResultId" class="form-input">
              <option value="">-- Pilih Key Result --</option>
              <option v-for="kr in allKrs" :key="kr.id" :value="kr.id">
                {{ kr.objective?.title ? `[${kr.objective.title}] ` : ""
                }}{{ kr.title }}
              </option>
            </select>

            <label>Tim / Departemen *</label>
            <input
              v-model="teamSearch"
              type="text"
              class="form-input"
              style="margin-bottom: 6px"
              placeholder="Cari departemen / tim..."
            />
            <select v-model="initiativeForm.teamId" class="form-input">
              <option value="">-- Pilih Tim / Departemen --</option>
              <option
                v-for="team in filteredTeams"
                :key="team.id"
                :value="team.id"
              >
                {{ team.name }}
              </option>
            </select>

            <label>PIC Pegawai (Penanggung Jawab)</label>
            <input
              v-model="userSearch"
              type="text"
              class="form-input"
              style="margin-bottom: 6px"
              placeholder="Cari nama pegawai..."
            />
            <select v-model="initiativeForm.ownerId" class="form-input">
              <option value="">-- Pilih Pegawai (Opsional) --</option>
              <option
                v-for="user in filteredUsers"
                :key="user.id"
                :value="user.id"
              >
                {{ user.name }} ({{ user.position || "Staff" }})
              </option>
            </select>

            <div class="form-row-2">
              <div>
                <label>Target Value</label>
                <input
                  v-model.number="initiativeForm.targetValue"
                  type="number"
                  class="form-input"
                />
              </div>
              <div>
                <label>Unit / Satuan</label>
                <input
                  v-model="initiativeForm.unit"
                  class="form-input"
                  placeholder="%, Sesi, tasks..."
                />
              </div>
            </div>

            <div class="form-row-2">
              <div>
                <label>Tanggal Mulai Pengerjaan</label>
                <input
                  v-model="initiativeForm.startDate"
                  type="date"
                  class="form-input"
                />
              </div>
              <div>
                <label>Target Tanggal Selesai</label>
                <input
                  v-model="initiativeForm.dueDate"
                  type="date"
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-row-2">
              <div>
                <label>Bulan / Sprint</label>
                <input
                  v-model="initiativeForm.sprintMonth"
                  type="month"
                  class="form-input"
                />
              </div>
              <div>
                <label>Hasil Capaian Akhir (Selesai)</label>
                <input
                  v-model.number="initiativeForm.achievedValue"
                  type="number"
                  class="form-input"
                  placeholder="Opsional (Diisi jika DONE)"
                />
              </div>
            </div>

            <div class="form-row-2">
              <div>
                <label>Bobot Inisiatif (%) *</label>
                <input
                  v-model.number="initiativeForm.weight"
                  type="number"
                  step="1"
                  min="0.1"
                  max="100"
                  class="form-input"
                  placeholder="Contoh: 25"
                />
                <p
                  v-if="weightBudgetInfo"
                  class="weight-hint"
                  :class="{
                    'weight-hint-warning': weightBudgetInfo.remaining <= 0,
                  }"
                >
                  Terpakai {{ weightBudgetInfo.used.toFixed(1) }}% · Sisa
                  {{ weightBudgetInfo.remaining.toFixed(1) }}% untuk sprint ini
                </p>
                <p v-else class="weight-hint">
                  Pilih PIC Pegawai &amp; Bulan/Sprint untuk melihat sisa bobot
                </p>
              </div>
              <div>
                <label>Kolom Kanban (Status)</label>
                <select
                  v-model="initiativeForm.kanbanStatus"
                  class="form-input"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                  <option value="DROP">Drop</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="secondary-btn" @click="showInitiativeModal = false">
              Batal
            </button>
            <button class="primary-btn" @click="saveInitiative">Simpan</button>
          </div>
        </div>
      </div>

      <!-- ─── MODAL: Add/Edit Task ─── -->
      <div
        v-if="showTaskModal"
        class="modal-overlay"
        @click.self="showTaskModal = false"
      >
        <div class="modal-box">
          <div class="modal-header">
            <h3>Tambah Task untuk: {{ selectedInitiativeForTask?.title }}</h3>
            <button class="modal-close-btn" @click="showTaskModal = false">
              &times;
            </button>
          </div>
          <div class="modal-body-scroll">
            <label>Judul Task *</label>
            <input
              v-model="taskForm.title"
              class="form-input"
              placeholder="Contoh: Selesaikan 10 unit test..."
            />
            <div class="form-row-2">
              <div>
                <label>Target Value *</label>
                <input
                  v-model.number="taskForm.targetValue"
                  type="number"
                  class="form-input"
                />
              </div>
              <div>
                <label>Satuan (Unit)</label>
                <input
                  v-model="taskForm.unit"
                  class="form-input"
                  placeholder="%, task, doc..."
                />
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="secondary-btn" @click="showTaskModal = false">
              Batal
            </button>
            <button class="primary-btn" @click="saveTask">Simpan Task</button>
          </div>
        </div>
      </div>

      <!-- Bulk Upload Modal Component -->
      <BulkUploadModal
        v-if="showBulkModal"
        type="initiative"
        @close="showBulkModal = false"
        @done="fetchInitiatives"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useAuthStore } from "~/stores/auth";
import BulkUploadModal from "~/components/BulkUploadModal.vue";

const auth = useAuthStore();
const config = useRuntimeConfig();
const API = config.public.apiBase;

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${auth.token}`,
});

// ─── Roles & Permissions ───
const isAdmin = computed(() => auth.user?.role === "ADMIN");
const isCLevel = computed(() => auth.user?.role === "C_LEVEL");
const isManager = computed(() => auth.user?.role === "MANAGER");
const isLeader = computed(() => auth.user?.role === "LEADER");
const isTeam = computed(() => auth.user?.role === "TEAM");

const canMoveCards = computed(() => true); // All roles can move cards they are authorized to manage
const canCreateInitiative = computed(() => true); // All roles can create initiative

function canManageInitiative(ini: any) {
  if (isAdmin.value) return true;
  if (isManager.value) return true;
  if (isLeader.value) return true;
  if (isTeam.value && ini.ownerId === auth.user?.id) return true;
  return false;
}

const userRoleClass = computed(() => {
  const r = (auth.user?.role || "").toLowerCase();
  return `scope-${r}`;
});

const roleIcon = computed(() => {
  if (isAdmin.value) return "";
  if (isCLevel.value) return "";
  if (isManager.value) return "";
  if (isLeader.value) return "";
  return "";
});

const scopeDescription = computed(() => {
  if (isAdmin.value || isCLevel.value) {
    return "Menampilkan seluruh inisiatif di semua departemen perusahaan (Company-wide).";
  }
  if (isManager.value) {
    return "Menampilkan seluruh inisiatif Leader (P) dan Anggota Tim (T) di departemen Anda.";
  }
  if (isLeader.value) {
    return "Menampilkan inisiatif Anda (P) dan seluruh anggota tim (T) di bawah pimpinan Anda.";
  }
  return "Menampilkan seluruh inisiatif dalam departemen Anda. Anda hanya dapat memindahkan kartu milik Anda sendiri.";
});

// ─── State ───
const initiatives = ref<any[]>([]);
const allKrs = ref<any[]>([]);
const allTeams = ref<any[]>([]);
const allUsers = ref<any[]>([]);

const searchQuery = ref("");
const selectedTeamId = ref("");
const selectedOwnerId = ref("");
const selectedKrId = ref("");
const errorMessage = ref("");
const successMessage = ref("");

const showBulkModal = ref(false);

// Drag & drop state
const draggedItem = ref<any>(null);
const dragOverColumn = ref<string | null>(null);

// Modal state
const showInitiativeModal = ref(false);
const editingInitiative = ref<any>(null);
const initiativeForm = ref({
  title: "",
  description: "",
  keyResultId: "",
  teamId: "",
  ownerId: "",
  targetValue: 0,
  achievedValue: null as number | null,
  unit: "",
  kanbanStatus: "TODO",
  weight: 1.0,
  startDate: "",
  dueDate: "",
  sprintMonth: "",
});

const teamSearch = ref("");
const userSearch = ref("");

const availableTeams = computed(() => {
  if (isLeader.value) {
    const userTeamId = auth.user?.teamId;
    const userDept = (auth.user as any)?.department;
    return allTeams.value.filter(
      (t: any) =>
        t.leaderId === auth.user?.id ||
        (userTeamId && t.id === userTeamId) ||
        (userDept && t.department === userDept),
    );
  }
  return allTeams.value;
});

// Fetch team members reactively for LEADER when team is selected
const teamMembers = ref<any[]>([]);

watch(
  () => initiativeForm.value.teamId,
  async (newTeamId) => {
    if (isLeader.value && newTeamId) {
      try {
        const res = await fetch(`${API}/users/teams/${newTeamId}/members`, {
          headers: getHeaders(),
        });
        if (res.ok) {
          teamMembers.value = await res.json();
        }
      } catch (err) {
        teamMembers.value = [];
      }
    }
  },
);

// Subordinates list based on role
const availableOwners = computed(() => {
  if (isTeam.value) {
    return auth.user ? [auth.user] : [];
  }
  if (isLeader.value) {
    return teamMembers.value.length > 0
      ? teamMembers.value
      : allUsers.value.filter(
          (u: any) => u.teamId === auth.user?.teamId || u.id === auth.user?.id,
        );
  }
  if (isManager.value) {
    const dept = (auth.user as any)?.department;
    if (!dept) return allUsers.value;
    return allUsers.value.filter(
      (u: any) => u.department === dept || u.id === auth.user?.id,
    );
  }
  return allUsers.value; // Admin & C-Level
});

const filteredTeams = computed(() => {
  if (!teamSearch.value.trim()) return availableTeams.value;
  const q = teamSearch.value.toLowerCase();
  return availableTeams.value.filter(
    (t: any) => t.name && t.name.toLowerCase().includes(q),
  );
});

const filteredUsers = computed(() => {
  if (isTeam.value && auth.user) {
    return [auth.user];
  }
  if (isLeader.value) {
    const base =
      teamMembers.value.length > 0 ? teamMembers.value : availableOwners.value;
    if (!userSearch.value.trim()) return base;
    const q = userSearch.value.toLowerCase();
    return base.filter((u: any) => u.name && u.name.toLowerCase().includes(q));
  }
  const baseUsers = availableOwners.value;
  if (!userSearch.value.trim()) return baseUsers;
  const q = userSearch.value.toLowerCase();
  return baseUsers.filter(
    (u: any) => u.name && u.name.toLowerCase().includes(q),
  );
});

// Bobot (%) inisiatif per pegawai per sprint — total seluruh card milik satu
// pegawai pada satu sprint tidak boleh melebihi 100%.
function computeUsedWeight(
  ownerId: string,
  sprintMonth: string,
  excludeId?: string,
) {
  return initiatives.value
    .filter(
      (i: any) =>
        i.ownerId === ownerId &&
        i.sprintMonth === sprintMonth &&
        i.kanbanStatus !== "DROP" &&
        i.id !== excludeId,
    )
    .reduce((sum: number, i: any) => sum + (i.weight || 0), 0);
}

const weightBudgetInfo = computed(() => {
  const { ownerId, sprintMonth } = initiativeForm.value;
  if (!ownerId || !sprintMonth) return null;
  const used = computeUsedWeight(
    ownerId,
    sprintMonth,
    editingInitiative.value?.id,
  );
  return { used, remaining: Math.max(0, 100 - used) };
});

watch(
  [() => initiativeForm.value.ownerId, () => initiativeForm.value.sprintMonth],
  () => {
    if (editingInitiative.value) return; // jangan timpa bobot saat mode edit
    const { ownerId, sprintMonth } = initiativeForm.value;
    if (ownerId && sprintMonth) {
      const remaining = Math.max(
        0,
        100 - computeUsedWeight(ownerId, sprintMonth),
      );
      initiativeForm.value.weight = Math.round(remaining * 10) / 10;
    }
  },
);

// Task modal state
const showTaskModal = ref(false);
const selectedInitiativeForTask = ref<any>(null);
const taskForm = ref({ title: "", targetValue: 0, unit: "" });

// Sprint Month filter & helper functions
const selectedSprintMonth = ref("");

const availableSprintMonths = computed(() => {
  const months = new Set<string>();
  for (const ini of initiatives.value) {
    if (ini.sprintMonth) months.add(ini.sprintMonth);
  }
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  months.add(currentMonth);
  return Array.from(months).sort().reverse();
});

function formatDateShort(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatSprintLabel(sprint: string | null | undefined) {
  if (!sprint) return "";
  if (/^\d{4}-\d{2}$/.test(sprint)) {
    const [year, month] = sprint.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("id-ID", {
      month: "short",
      year: "numeric",
    });
  }
  return sprint;
}

function isOverdue(ini: any) {
  if (
    !ini.dueDate ||
    ini.kanbanStatus === "DONE" ||
    ini.kanbanStatus === "DROP"
  )
    return false;
  const due = new Date(ini.dueDate);
  const now = new Date();
  return due < now;
}

function calculateAchievedPercent(ini: any) {
  const achieved =
    ini.achievedValue !== null && ini.achievedValue !== undefined
      ? ini.achievedValue
      : ini.currentValue;
  if (!ini.targetValue || ini.targetValue <= 0) return 100;
  return Math.round((achieved / ini.targetValue) * 100);
}

// ─── Filtered Lists per Kanban Column ───
const filteredInitiatives = computed(() => {
  return initiatives.value.filter((ini: any) => {
    // Search query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchTitle = ini.title && ini.title.toLowerCase().includes(q);
      const matchDesc =
        ini.description && ini.description.toLowerCase().includes(q);
      const matchKr =
        ini.keyResult?.title && ini.keyResult.title.toLowerCase().includes(q);
      const matchTeam =
        ini.team?.name && ini.team.name.toLowerCase().includes(q);
      const matchOwner =
        ini.owner?.name && ini.owner.name.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchKr && !matchTeam && !matchOwner)
        return false;
    }

    // Team Filter
    if (selectedTeamId.value && ini.teamId !== selectedTeamId.value)
      return false;

    // Owner (PIC) Filter
    if (selectedOwnerId.value && ini.ownerId !== selectedOwnerId.value)
      return false;

    // KR Filter
    if (selectedKrId.value && ini.keyResultId !== selectedKrId.value)
      return false;

    // Sprint / Month Filter
    if (
      selectedSprintMonth.value &&
      ini.sprintMonth !== selectedSprintMonth.value
    )
      return false;

    return true;
  });
});

const todoList = computed(() => {
  return filteredInitiatives.value.filter(
    (i: any) => !i.kanbanStatus || i.kanbanStatus === "TODO",
  );
});

const inProgressList = computed(() => {
  return filteredInitiatives.value.filter(
    (i: any) => i.kanbanStatus === "IN_PROGRESS",
  );
});

const doneList = computed(() => {
  return filteredInitiatives.value.filter(
    (i: any) => i.kanbanStatus === "DONE",
  );
});

const dropList = computed(() => {
  return filteredInitiatives.value.filter(
    (i: any) => i.kanbanStatus === "DROP",
  );
});

function getCompletedTasksCount(ini: any) {
  if (!ini.tasks) return 0;
  return ini.tasks.filter((k: any) => k.currentValue >= k.targetValue).length;
}

// ─── Drag & Drop Handlers ───
function handleDragStart(item: any) {
  draggedItem.value = item;
}

async function handleDrop(targetColumn: string) {
  dragOverColumn.value = null;
  if (!draggedItem.value) return;
  if (draggedItem.value.kanbanStatus === targetColumn) return;

  await moveCard(draggedItem.value.id, targetColumn);
  draggedItem.value = null;
}

// ─── API Operations ───
async function fetchInitiatives() {
  try {
    const res = await fetch(`${API}/initiatives`, { headers: getHeaders() });
    if (res.ok) {
      initiatives.value = await res.json();
    }
  } catch (err: any) {
    errorMessage.value = "Gagal memuat data inisiatif";
  }
}

async function fetchAllKrs() {
  try {
    const res = await fetch(`${API}/key-results/dropdown`, {
      headers: getHeaders(),
    });
    if (res.ok) {
      allKrs.value = await res.json();
    }
  } catch (err) {}
}

// Member 100% Achievement State & Helper
const memberProgressList = ref<any[]>([]);
const selectedAchDepartment = ref("");
const selectedAchSort = ref("highest"); // 'highest', 'lowest', 'name_asc'

const availableAchDepartments = computed(() => {
  const depts = new Set<string>();
  for (const m of memberProgressList.value) {
    if (m.department) depts.add(m.department);
  }
  return Array.from(depts).sort();
});

const displayedMemberProgressList = computed(() => {
  let list = [...memberProgressList.value];

  // Filter Departemen
  if (selectedAchDepartment.value) {
    list = list.filter(
      (m: any) => m.department === selectedAchDepartment.value,
    );
  }

  // Sort Pengurutan
  if (selectedAchSort.value === "highest") {
    list.sort((a, b) => b.achievementPct - a.achievementPct);
  } else if (selectedAchSort.value === "lowest") {
    list.sort((a, b) => a.achievementPct - b.achievementPct);
  } else if (selectedAchSort.value === "name_asc") {
    list.sort((a, b) => (a.userName || "").localeCompare(b.userName || ""));
  }

  return list;
});

const memberProgressMap = computed(() => {
  const map: Record<string, any> = {};
  for (const m of memberProgressList.value) {
    map[m.userId] = m;
  }
  return map;
});

function getMemberAchievement(userId: string) {
  if (!userId) return null;
  // TEAM role: ONLY sees their own percentage!
  if (isTeam.value && userId !== auth.user?.id) {
    return null;
  }
  return memberProgressMap.value[userId] || null;
}

function getAchColorClass(pct: number) {
  if (pct >= 80) return "ach-high";
  if (pct >= 50) return "ach-mid";
  return "ach-low";
}

async function fetchMemberProgress() {
  try {
    const res = await fetch(`${API}/initiatives/member-progress`, {
      headers: getHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      memberProgressList.value = data.members || [];
    }
  } catch (err) {
    console.error("Fetch member progress error:", err);
  }
}

async function moveCard(id: string, newStatus: string) {
  try {
    const item = initiatives.value.find((i: any) => i.id === id);
    let achievedValueToSubmit: number | undefined = undefined;

    if (newStatus === "DONE" && item) {
      const input = prompt(
        `Inisiatif "${item.title}" akan ditandai DONE.\nMasukkan Nilai Capaian Riil Selesai (Target: ${item.targetValue} ${item.unit || ""}):`,
        item.achievedValue !== null && item.achievedValue !== undefined
          ? String(item.achievedValue)
          : String(item.targetValue),
      );
      if (input !== null && input.trim() !== "") {
        const val = parseFloat(input);
        if (!isNaN(val)) achievedValueToSubmit = val;
      }
    }

    if (item) {
      item.kanbanStatus = newStatus;
      if (achievedValueToSubmit !== undefined)
        item.achievedValue = achievedValueToSubmit;
    }

    const res = await fetch(`${API}/initiatives/${id}/kanban-status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({
        kanbanStatus: newStatus,
        ...(achievedValueToSubmit !== undefined && {
          achievedValue: achievedValueToSubmit,
        }),
      }),
    });

    if (!res.ok) {
      await fetchInitiatives(); // revert on error
      errorMessage.value = "Gagal memindahkan inisiatif";
    } else {
      await fetchInitiatives();
    }
  } catch (err: any) {
    await fetchInitiatives();
    errorMessage.value = err.message;
  }
}

function openAddInitiativeModal() {
  editingInitiative.value = null;
  teamSearch.value = "";
  userSearch.value = "";
  const now = new Date();
  const defaultSprint = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  initiativeForm.value = {
    title: "",
    description: "",
    keyResultId: selectedKrId.value || "",
    teamId: isTeam.value
      ? auth.user?.teamId || availableTeams.value[0]?.id || ""
      : selectedTeamId.value || "",
    ownerId: isTeam.value ? auth.user?.id || "" : "",
    targetValue: 0,
    achievedValue: null,
    unit: "",
    kanbanStatus: "TODO",
    weight: 1.0,
    startDate: "",
    dueDate: "",
    sprintMonth: defaultSprint,
  };
  errorMessage.value = "";
  showInitiativeModal.value = true;
}

function openEditInitiativeModal(ini: any) {
  editingInitiative.value = ini;
  teamSearch.value = "";
  userSearch.value = "";
  initiativeForm.value = {
    title: ini.title || "",
    description: ini.description || "",
    keyResultId: ini.keyResultId || "",
    teamId: ini.teamId || "",
    ownerId: ini.ownerId || "",
    targetValue: ini.targetValue || 0,
    achievedValue:
      ini.achievedValue !== undefined && ini.achievedValue !== null
        ? ini.achievedValue
        : null,
    unit: ini.unit || "",
    kanbanStatus: ini.kanbanStatus || "TODO",
    weight: ini.weight !== undefined ? ini.weight : 1.0,
    startDate: ini.startDate
      ? new Date(ini.startDate).toISOString().substring(0, 10)
      : "",
    dueDate: ini.dueDate
      ? new Date(ini.dueDate).toISOString().substring(0, 10)
      : "",
    sprintMonth: ini.sprintMonth || "",
  };
  errorMessage.value = "";
  showInitiativeModal.value = true;
}

async function saveInitiative() {
  if (!initiativeForm.value.title.trim()) {
    errorMessage.value = "Judul inisiatif wajib diisi";
    return;
  }
  if (!initiativeForm.value.keyResultId) {
    errorMessage.value = "Key Result wajib dipilih";
    return;
  }
  if (
    initiativeForm.value.weight === undefined ||
    initiativeForm.value.weight === null ||
    initiativeForm.value.weight <= 0 ||
    initiativeForm.value.weight > 100
  ) {
    errorMessage.value =
      "Bobot inisiatif wajib diisi, dengan nilai antara 0.1% - 100%";
    return;
  }

  if (initiativeForm.value.ownerId && initiativeForm.value.sprintMonth) {
    const used = computeUsedWeight(
      initiativeForm.value.ownerId,
      initiativeForm.value.sprintMonth,
      editingInitiative.value?.id,
    );
    const total = used + initiativeForm.value.weight;
    if (total > 100.01) {
      errorMessage.value = `Total bobot pegawai ini pada sprint tersebut menjadi ${total.toFixed(1)}%, melebihi batas 100%. Sisa bobot tersedia: ${Math.max(0, 100 - used).toFixed(1)}%`;
      return;
    }
  }

  if (isTeam.value) {
    initiativeForm.value.ownerId = auth.user?.id || "";
    if (!initiativeForm.value.teamId && auth.user?.teamId) {
      initiativeForm.value.teamId = auth.user.teamId;
    }
  }

  if (!initiativeForm.value.teamId && availableTeams.value.length > 0) {
    initiativeForm.value.teamId = availableTeams.value[0].id;
  }

  try {
    const isEdit = !!editingInitiative.value;
    const url = isEdit
      ? `${API}/initiatives/${editingInitiative.value.id}`
      : `${API}/initiatives`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(initiativeForm.value),
    });

    if (res.ok) {
      showInitiativeModal.value = false;
      successMessage.value = isEdit
        ? "Inisiatif berhasil diperbarui"
        : "Inisiatif baru berhasil dibuat";
      setTimeout(() => (successMessage.value = ""), 3000);
      await fetchInitiatives();
    } else {
      const err = await res.json();
      errorMessage.value = err.message || "Gagal menyimpan inisiatif";
    }
  } catch (err: any) {
    errorMessage.value = err.message;
  }
}

async function deleteInitiative(id: string) {
  if (!confirm("Hapus inisiatif ini beserta seluruh Task di dalamnya?")) return;
  try {
    const res = await fetch(`${API}/initiatives/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (res.ok) {
      successMessage.value = "Inisiatif berhasil dihapus";
      setTimeout(() => (successMessage.value = ""), 3000);
      await fetchInitiatives();
    } else {
      const err = await res.json();
      errorMessage.value = err.message || "Gagal menghapus";
    }
  } catch (err: any) {
    errorMessage.value = err.message;
  }
}

function openAddTaskModal(ini: any) {
  selectedInitiativeForTask.value = ini;
  taskForm.value = { title: "", targetValue: 0, unit: "" };
  showTaskModal.value = true;
}

async function saveTask() {
  if (!taskForm.value.title.trim()) {
    alert("Judul Task wajib diisi");
    return;
  }
  try {
    const res = await fetch(
      `${API}/initiatives/${selectedInitiativeForTask.value.id}/tasks`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(taskForm.value),
      },
    );
    if (res.ok) {
      showTaskModal.value = false;
      await fetchInitiatives();
    } else {
      const err = await res.json();
      alert(err.message || "Gagal membuat Task");
    }
  } catch (err: any) {
    alert(err.message);
  }
}

async function fetchAllTeams() {
  try {
    const res = await fetch(`${API}/users/teams`, { headers: getHeaders() });
    if (res.ok) allTeams.value = await res.json();
  } catch (err) {}
}

async function fetchAllUsers() {
  try {
    const res = await fetch(`${API}/users`, { headers: getHeaders() });
    if (res.ok) allUsers.value = await res.json();
  } catch (err) {}
}

onMounted(async () => {
  await Promise.all([
    fetchInitiatives(),
    fetchAllKrs(),
    fetchAllTeams(),
    fetchAllUsers(),
    fetchMemberProgress(),
  ]);
});
</script>

<style scoped>
.admin-root {
  padding: 1.5rem;
  background: var(--bg-primary, #f8fafc);
  min-height: calc(100vh - 70px);
}

.card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-section {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  gap: 16px;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-with-badge h2 {
  margin: 0;
  font-size: 1.35rem;
  color: var(--text-primary, #0f172a);
}

.view-badge {
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(14, 151, 214, 0.12);
  color: #0e97d6;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;
}

.section-desc {
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  color: var(--text-secondary, #64748b);
}

/* Scope Banner */
.scope-banner {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.82rem;
}

.scope-banner.scope-admin {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}
.scope-banner.scope-c_level {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}
.scope-banner.scope-manager {
  background: #fefce8;
  border: 1px solid #fef08a;
  color: #854d0e;
}
.scope-banner.scope-leader {
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  color: #6b21a8;
}
.scope-banner.scope-team {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #334155;
}

.header-action-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.primary-btn {
  background: #0e97d6;
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.primary-btn:hover {
  background: #0b7bb0;
}

.secondary-btn {
  background: #ffffff;
  color: var(--text-primary, #0f172a);
  border: 1px solid var(--border-color, #cbd5e1);
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.secondary-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

/* Filter Card */
.kanban-filter-card {
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
}

.search-controls-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.filter-controls-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: nowrap;
}

.search-input-wrap {
  position: relative;
  flex: 1;
  min-width: 240px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted, #94a3b8);
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  font-size: 0.85rem;
  background: var(--bg-input, #f8fafc);
  outline: none;
}

.search-input:focus {
  border-color: #0e97d6;
  background: #ffffff;
}

.filter-item {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  flex: 1 1 0;
  min-width: 0;
  font-size: 0.85rem;
  color: var(--text-secondary, #475569);
}

.filter-select {
  width: 100%;
  padding: 7px 12px;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  background: #ffffff;
  font-size: 0.85rem;
  outline: none;
}

/* Kanban Board Layout */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  align-items: start;
}

@media (max-width: 1024px) {
  .kanban-board {
    grid-template-columns: 1fr;
  }
}

.kanban-column {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  min-height: 550px;
  transition: all 0.2s ease;
}

.kanban-column.drop-active {
  background: rgba(14, 151, 214, 0.04);
  border: 2px dashed #0e97d6;
}

.column-header {
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
}

.col-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.col-title-wrap h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}

.col-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.col-dot.todo {
  background: #94a3b8;
}
.col-dot.progress {
  background: #0e97d6;
}
.col-dot.done {
  background: #10b981;
}
.col-dot.drop {
  background: #ef4444;
}

.col-count-badge {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  background: var(--bg-input, #f1f5f9);
  color: var(--text-secondary, #475569);
}

.column-cards-list {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.kanban-empty-col {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--text-muted, #94a3b8);
  font-size: 0.85rem;
  border: 1px dashed var(--border-color, #e2e8f0);
  border-radius: 10px;
}

/* Kanban Card */
.kanban-card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  position: relative;
}

.kanban-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.card-in-progress {
  border-left: 4px solid #0e97d6;
}

.card-done {
  border-left: 4px solid #10b981;
  background: #fafcfb;
}

.card-drop {
  border-left: 4px solid #ef4444;
  background: #fef2f2;
  opacity: 0.85;
}

.card-top-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.card-kr-badge {
  font-size: 0.72rem;
  color: #0b7bb0;
  background: rgba(14, 151, 214, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.perspective-pill {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: 4px;
  text-transform: uppercase;
}

.perspective-pill.financial {
  background: #e0f2fe;
  color: #0284c7;
}
.perspective-pill.customer {
  background: #fef3c7;
  color: #d97706;
}
.perspective-pill.internal_process {
  background: #f3e8ff;
  color: #9333ea;
}
.perspective-pill.learning_growth {
  background: #d1fae5;
  color: #059669;
}

.completed-checkmark-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: #10b981;
}

.card-title {
  margin: 0 0 6px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
  line-height: 1.35;
}

.card-title.text-done {
  color: #475569;
}

.card-title.text-drop {
  color: #64748b;
  text-decoration: line-through;
}

.dropped-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: #ef4444;
}

.card-desc {
  margin: 0 0 8px 0;
  font-size: 0.8rem;
  color: var(--text-secondary, #64748b);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-target-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  margin-bottom: 8px;
}

.target-label {
  color: var(--text-muted, #94a3b8);
}

.target-val {
  color: var(--text-primary, #0f172a);
}

.weight-badge-mini {
  font-size: 0.72rem;
  background: var(--bg-input, #f1f5f9);
  color: var(--text-secondary, #475569);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
  border: 1px solid var(--border-color, #cbd5e1);
}

.weight-hint {
  font-size: 0.78rem;
  color: var(--text-secondary, #475569);
  margin: 4px 0 0;
}

.weight-hint-warning {
  color: #dc2626;
  font-weight: 600;
}

.card-tasks-summary {
  margin-bottom: 8px;
}

.task-count-tag {
  font-size: 0.75rem;
  background: #f1f5f9;
  color: #475569;
  padding: 3px 8px;
  border-radius: 6px;
  display: inline-block;
}

.task-count-tag.in-progress {
  background: rgba(14, 151, 214, 0.08);
  color: #0b7bb0;
}

.card-footer-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border-color, #f1f5f9);
  padding-top: 8px;
  margin-top: 4px;
}

.card-team-owner {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.team-tag {
  font-size: 0.72rem;
  background: #e2e8f0;
  color: #334155;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.owner-tag {
  font-size: 0.72rem;
  color: var(--text-secondary, #475569);
  font-weight: 500;
}

.card-hover-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-color, #e2e8f0);
}

.left-actions,
.move-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 3px 7px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #e2e8f0;
}

.action-btn.danger:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.move-btn {
  background: #ffffff;
  border: 1px solid #0e97d6;
  color: #0e97d6;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.move-btn:hover {
  background: rgba(14, 151, 214, 0.08);
}

.move-btn.primary {
  background: #0e97d6;
  color: #ffffff;
}

.move-btn.primary:hover {
  background: #0b7bb0;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  -webkit-backdrop-filter: blur(2px);
  backdrop-filter: blur(2px);
}

.modal-box {
  background: #ffffff;
  border-radius: 16px;
  width: 95%;
  max-width: 580px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.15rem;
  color: #0f172a;
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
}

.modal-body-scroll {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal-body-scroll label {
  font-size: 0.83rem;
  font-weight: 600;
  color: #334155;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
}

.form-input:focus {
  border-color: #0e97d6;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.alert {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

/* ─── MEMBER 100% ACHIEVEMENT WIDGET STYLES ─── */
.member-achievement-card {
  margin-bottom: 20px;
  padding: 20px;
}

.widget-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  margin: 0;
}

.ach-controls-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.ach-control-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ach-control-item label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
}

.ach-filter-select {
  padding: 5px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  background: #ffffff;
  color: #1e293b;
  outline: none;
  cursor: pointer;
}

.ach-filter-select:focus {
  border-color: #0e97d6;
}

.visibility-notice {
  font-size: 0.78rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
}

.team-notice {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}
.leader-notice {
  background: rgba(14, 151, 214, 0.12);
  color: #0e97d6;
}
.manager-notice {
  background: rgba(124, 58, 237, 0.12);
  color: #7c3aed;
}
.admin-notice {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.member-achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.member-ach-card {
  background: var(--bg-input, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.member-ach-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.member-ach-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-avatar {
  font-size: 1.2rem;
}

.member-name {
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--text-primary, #0f172a);
  display: block;
}

.member-role-badge {
  font-size: 0.68rem;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  background: #e2e8f0;
  color: #475569;
}
.member-role-badge.leader {
  background: #e0f2fe;
  color: #0284c7;
}
.member-role-badge.manager {
  background: #f3e8ff;
  color: #7e22ce;
}
.member-role-badge.team {
  background: #ecfdf5;
  color: #047857;
}

.member-pct-wrap {
  text-align: right;
}

.member-pct-val {
  font-size: 1.25rem;
  font-weight: 800;
  display: block;
}

.member-pct-lbl {
  font-size: 0.68rem;
  color: var(--text-secondary, #64748b);
}

.member-progress-track {
  width: 100%;
  height: 7px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.member-progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.ach-high {
  color: #10b981;
  background: #10b981;
}
.ach-mid {
  color: #0e97d6;
  background: #0e97d6;
}
.ach-low {
  color: #dc2626;
  background: #fca5a5;
}

.member-ach-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-secondary, #64748b);
}

.dept-tag {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
}

.owner-ach-pill {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  margin-left: 4px;
  background: rgba(14, 151, 214, 0.15);
}

/* ─── DATE RANGE, SPRINT & ACHIEVED VALUE STYLES ─── */
.card-dates-sprint-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 6px 0;
}

.sprint-pill {
  font-size: 0.72rem;
  font-weight: 700;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 2px 7px;
  border-radius: 6px;
}

.date-range-pill {
  font-size: 0.72rem;
  font-weight: 600;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  padding: 2px 7px;
  border-radius: 6px;
}

.date-range-pill.overdue {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fca5a5;
  font-weight: 700;
}

.card-achieved-row {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 8px;
  padding: 6px 10px;
  margin: 6px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
}

.achieved-label {
  color: #065f46;
  font-weight: 600;
}

.achieved-val {
  color: #047857;
  font-weight: 800;
}
</style>

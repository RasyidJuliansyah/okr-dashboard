<template>
  <div class="admin-root">
    <div class="admin-content">
      <!-- Header Section -->
      <div class="header-section card">
        <div class="header-left-title">
          <div class="title-with-badge">
            <h2>Kanban Inisiatif Tim</h2>
            <span class="view-badge">Kanban Board</span>
          </div>
          <p class="section-desc">
            Visualisasi dan kelola eksekusi inisiatif tim melalui 3 tahapan alur
            kerja: To Do, In Progress, dan Done.
          </p>
        </div>
        <div class="header-action-group">
          <NuxtLink to="/admin/initiatives" class="secondary-btn">
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
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            Tampilan List
          </NuxtLink>
          <button class="secondary-btn" @click="showBulkModal = true">
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
          <button class="primary-btn" @click="openAddInitiativeModal">
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
        <div class="filter-controls-row">
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
              placeholder="Cari inisiatif, owner, atau KR..."
            />
          </div>

          <div class="filter-item">
            <label>Filter Tim:</label>
            <select v-model="selectedTeamId" class="filter-select">
              <option value="">Semua Tim</option>
              <option v-for="t in allTeams" :key="t.id" :value="t.id">
                {{ t.name }}
              </option>
            </select>
          </div>

          <div class="filter-item">
            <label>Filter Key Result:</label>
            <select v-model="selectedKrId" class="filter-select">
              <option value="">Semua Key Result</option>
              <option v-for="kr in allKrs" :key="kr.id" :value="kr.id">
                {{ kr.title }}
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
          @dragover.prevent="dragOverColumn = 'TODO'"
          @dragleave="dragOverColumn = null"
          @drop="handleDrop('TODO')"
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
              draggable="true"
              @dragstart="handleDragStart(ini)"
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
                  Bobot: <strong>{{ ini.weight || 1.0 }}</strong>
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
                  </span>
                </div>
              </div>

              <!-- Card Action Buttons -->
              <div class="card-hover-actions">
                <div class="left-actions">
                  <button
                    class="action-btn"
                    title="Tambah Task"
                    @click="openAddTaskModal(ini)"
                  >
                    + Task
                  </button>
                  <button
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
                    Maju
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
          @dragover.prevent="dragOverColumn = 'IN_PROGRESS'"
          @dragleave="dragOverColumn = null"
          @drop="handleDrop('IN_PROGRESS')"
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
              draggable="true"
              @dragstart="handleDragStart(ini)"
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
                  Bobot: <strong>{{ ini.weight || 1.0 }}</strong>
                </span>
              </div>

              <!-- Tasks summary chips -->
              <div class="card-tasks-summary" v-if="ini.tasks?.length">
                <span class="task-count-tag in-progress">
                  {{ ini.tasks.length }} Task ({{
                    getCompletedTasksCount(ini)
                  }}/{{ ini.tasks.length }} selesai)
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
              <div class="card-hover-actions">
                <div class="left-actions">
                  <button
                    class="action-btn"
                    title="Tambah Task"
                    @click="openAddTaskModal(ini)"
                  >
                    + Task
                  </button>
                  <button
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
                    Mundur
                  </button>
                  <button
                    class="move-btn primary"
                    title="Selesaikan ke Done"
                    @click="moveCard(ini.id, 'DONE')"
                  >
                    Selesai
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
          @dragover.prevent="dragOverColumn = 'DONE'"
          @dragleave="dragOverColumn = null"
          @drop="handleDrop('DONE')"
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
              draggable="true"
              @dragstart="handleDragStart(ini)"
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
                  Bobot: <strong>{{ ini.weight || 1.0 }}</strong>
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
              <div class="card-hover-actions">
                <div class="left-actions">
                  <button
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
          @dragover.prevent="dragOverColumn = 'DROP'"
          @dragleave="dragOverColumn = null"
          @drop="handleDrop('DROP')"
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
              draggable="true"
              @dragstart="handleDragStart(ini)"
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
                  Bobot: <strong>{{ ini.weight || 1.0 }}</strong>
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
              <div class="card-hover-actions">
                <div class="left-actions">
                  <button
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

            <label>Deskripsi</label>
            <textarea
              v-model="initiativeForm.description"
              class="form-input"
              rows="2"
              placeholder="Catatan dan ruang lingkup inisiatif..."
            ></textarea>

            <label>Parent Key Result *</label>
            <select v-model="initiativeForm.keyResultId" class="form-input">
              <option value="">-- Pilih Key Result --</option>
              <option v-for="kr in allKrs" :key="kr.id" :value="kr.id">
                {{ kr.title }}
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
                <label>Bobot Inisiatif *</label>
                <input
                  v-model.number="initiativeForm.weight"
                  type="number"
                  step="0.1"
                  min="0.1"
                  class="form-input"
                  placeholder="Contoh: 1.0"
                />
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
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "~/stores/auth";
import BulkUploadModal from "~/components/BulkUploadModal.vue";

const auth = useAuthStore();
const config = useRuntimeConfig();
const API = config.public.apiBase;

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${auth.token}`,
});

// ─── State ───
const initiatives = ref<any[]>([]);
const allKrs = ref<any[]>([]);
const allTeams = ref<any[]>([]);
const allUsers = ref<any[]>([]);

const searchQuery = ref("");
const selectedTeamId = ref("");
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
  unit: "",
  kanbanStatus: "TODO",
  weight: 1.0,
});

const teamSearch = ref("");
const userSearch = ref("");

const filteredTeams = computed(() => {
  if (!teamSearch.value.trim()) return allTeams.value;
  const q = teamSearch.value.toLowerCase();
  return allTeams.value.filter(
    (t: any) => t.name && t.name.toLowerCase().includes(q),
  );
});

const filteredUsers = computed(() => {
  if (!userSearch.value.trim()) return allUsers.value;
  const q = userSearch.value.toLowerCase();
  return allUsers.value.filter(
    (u: any) => u.name && u.name.toLowerCase().includes(q),
  );
});

// Task modal state
const showTaskModal = ref(false);
const selectedInitiativeForTask = ref<any>(null);
const taskForm = ref({ title: "", targetValue: 0, unit: "" });

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

    // KR Filter
    if (selectedKrId.value && ini.keyResultId !== selectedKrId.value)
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
    const objRes = await fetch(`${API}/objectives`, { headers: getHeaders() });
    if (objRes.ok) {
      const objs = await objRes.json();
      allKrs.value = objs.flatMap((o: any) => o.keyResults || []);
    }
  } catch (err) {}
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

async function moveCard(id: string, newStatus: string) {
  try {
    // Optimistic UI update
    const item = initiatives.value.find((i: any) => i.id === id);
    if (item) item.kanbanStatus = newStatus;

    const res = await fetch(`${API}/initiatives/${id}/kanban-status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ kanbanStatus: newStatus }),
    });

    if (!res.ok) {
      await fetchInitiatives(); // revert on error
      errorMessage.value = "Gagal memindahkan inisiatif";
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
  initiativeForm.value = {
    title: "",
    description: "",
    keyResultId: selectedKrId.value || "",
    teamId: selectedTeamId.value || "",
    ownerId: "",
    targetValue: 0,
    unit: "",
    kanbanStatus: "TODO",
    weight: 1.0,
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
    unit: ini.unit || "",
    kanbanStatus: ini.kanbanStatus || "TODO",
    weight: ini.weight !== undefined ? ini.weight : 1.0,
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
  if (!initiativeForm.value.teamId) {
    errorMessage.value = "Tim wajib dipilih";
    return;
  }
  if (
    initiativeForm.value.weight === undefined ||
    initiativeForm.value.weight === null ||
    initiativeForm.value.weight <= 0
  ) {
    errorMessage.value =
      "Bobot inisiatif wajib diisi dan harus bernilai lebih dari 0";
    return;
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

onMounted(async () => {
  await Promise.all([
    fetchInitiatives(),
    fetchAllKrs(),
    fetchAllTeams(),
    fetchAllUsers(),
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
  align-items: center;
  margin-bottom: 1.25rem;
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

.header-action-group {
  display: flex;
  gap: 10px;
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

.filter-controls-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
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
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary, #475569);
}

.filter-select {
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
  cursor: grab;
  transition: all 0.2s ease;
  position: relative;
}

.kanban-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.kanban-card:active {
  cursor: grabbing;
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
</style>

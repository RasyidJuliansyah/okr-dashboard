<template>
  <div class="admin-root">
    <div class="admin-content">
      <!-- Left Column: Form Builder -->
      <section class="form-section card">
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 1rem;
            margin-bottom: 0.5rem;
          "
        >
          <div>
            <h2 style="margin: 0">Buat Objective & Key Results Baru</h2>
            <p class="section-desc" style="margin-top: 4px">
              Definisikan target strategis triwulanan dan indikator
              keberhasilannya.
            </p>
          </div>
          <div style="display: flex; gap: 8px">
            <button
              type="button"
              class="secondary-btn"
              style="
                white-space: nowrap;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                font-size: 0.83rem;
              "
              @click="openBulkUpload('objective')"
            >
              Bulk Upload Objective (CSV)
            </button>
            <button
              type="button"
              class="secondary-btn"
              style="
                white-space: nowrap;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                font-size: 0.83rem;
              "
              @click="openBulkUpload('kr')"
            >
              Bulk Upload KR (CSV)
            </button>
          </div>
        </div>

        <form @submit.prevent="submitObjective" class="okr-form">
          <div class="form-group">
            <label>Metode Input Objective</label>
            <div
              class="radio-group"
              style="
                display: flex;
                gap: 1.5rem;
                margin-top: 0.5rem;
                margin-bottom: 1rem;
              "
            >
              <label
                style="
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  cursor: pointer;
                  font-weight: normal;
                "
              >
                <input
                  type="radio"
                  :value="false"
                  v-model="isExistingObjective"
                />
                Buat Baru
              </label>
              <label
                style="
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  cursor: pointer;
                  font-weight: normal;
                "
              >
                <input
                  type="radio"
                  :value="true"
                  v-model="isExistingObjective"
                />
                Pilih Eksisting
              </label>
            </div>
          </div>

          <div v-if="isExistingObjective" class="form-group">
            <label for="obj-select">Pilih Objective Eksisting *</label>
            <select id="obj-select" v-model="selectedObjectiveId" required>
              <option value="" disabled>Pilih Objective</option>
              <option
                v-for="obj in allObjectivesForDropdown"
                :key="obj.id"
                :value="obj.id"
              >
                [{{ obj.year }}] {{ obj.title }}
              </option>
            </select>
          </div>

          <template v-else>
            <div class="form-row">
              <div class="form-group" style="flex: 2">
                <label for="obj-title">Judul Objective *</label>
                <input
                  id="obj-title"
                  v-model="newObjective.title"
                  type="text"
                  placeholder="Contoh: Meningkatkan Efisiensi Operasional Tim Dev"
                  required
                />
              </div>

              <div class="form-group" style="flex: 1">
                <label for="obj-year">Tahun / Periode *</label>
                <input
                  id="obj-year"
                  v-model="newObjective.year"
                  type="text"
                  placeholder="Contoh: 2026"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label for="obj-desc">Deskripsi (Opsional)</label>
              <textarea
                id="obj-desc"
                v-model="newObjective.description"
                placeholder="Detail penjelasan mengenai sasaran ini..."
                rows="2"
              ></textarea>
            </div>
          </template>

          <hr class="divider" />

          <!-- Key Results Section -->
          <div class="kr-builder-header">
            <h3>Key Results (KR)</h3>
          </div>

          <div
            v-if="newObjective.keyResults.length === 0"
            class="empty-kr-alert"
          >
            Minimal harus ada 1 Key Result sebelum menyimpan Objective.
          </div>

          <div
            v-for="(kr, index) in newObjective.keyResults"
            :key="index"
            class="kr-row-card"
          >
            <div class="kr-row-header">
              <h4>Key Result #{{ index + 1 }}</h4>
              <button
                type="button"
                @click="removeKrRow(index)"
                class="remove-kr-btn"
                title="Hapus KR ini"
              >
                ✕
              </button>
            </div>

            <div class="form-group">
              <label :for="'kr-title-' + index">Deskripsi KR *</label>
              <input
                :id="'kr-title-' + index"
                v-model="kr.title"
                type="text"
                placeholder="Contoh: Mengurangi load-time server menjadi < 200ms"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group quarter">
                <label :for="'kr-target-' + index">Target Nilai *</label>
                <input
                  :id="'kr-target-' + index"
                  v-model.number="kr.targetValue"
                  type="number"
                  step="any"
                  placeholder="Target"
                  min="0.000001"
                  required
                />
              </div>
              <div class="form-group quarter">
                <label :for="'kr-type-' + index">Tipe Target</label>
                <select :id="'kr-type-' + index" v-model="kr.targetType">
                  <option value="AT_LEAST">Minimal (≥)</option>
                  <option value="AT_MOST">Maksimal (≤)</option>
                  <option value="EXACT">Tepat (=)</option>
                </select>
              </div>
              <div class="form-group quarter">
                <label :for="'kr-unit-' + index">Satuan *</label>
                <input
                  :id="'kr-unit-' + index"
                  v-model="kr.unit"
                  type="text"
                  placeholder="%, IDR, dll"
                  required
                />
              </div>
              <div class="form-group quarter">
                <label :for="'kr-bsc-' + index">Perspektif BSC *</label>
                <select
                  :id="'kr-bsc-' + index"
                  v-model="kr.bscPerspective"
                  required
                >
                  <option value="" disabled>Pilih</option>
                  <option value="FINANCIAL">Financial</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="INTERNAL_PROCESS">Internal Process</option>
                  <option value="LEARNING_GROWTH">Learning & Growth</option>
                </select>
              </div>
            </div>

            <!-- RACI ASSIGNMENT SECTION -->
            <div class="raci-section">
              <div class="raci-section-header">
                <span class="raci-title">RACI Assignment</span>
                <span class="raci-hint"
                  >Pilih pegawai & tentukan peran RACI mereka</span
                >
              </div>

              <!-- Responsible Member (tepat 1) -->
              <div class="raci-group">
                <div class="raci-role-label responsible">
                  <span class="raci-badge r-badge">R</span>
                  Responsible
                  <span class="raci-role-desc"
                    >— Tepat 1 orang yang mengerjakan KR ini</span
                  >
                </div>
                <div class="assignee-multi-select">
                  <div v-if="userList.length === 0" class="assignee-empty-hint">
                    Memuat daftar pegawai...
                  </div>
                  <label
                    v-for="user in userList"
                    :key="'R-' + user.id"
                    class="assignee-checkbox-item"
                    :class="[
                      { selected: isAssigned(kr, user.id, 'RESPONSIBLE') },
                      { disabled: isAssigned(kr, user.id, 'ACCOUNTABLE') },
                    ]"
                  >
                    <input
                      type="radio"
                      :name="'responsible-' + index"
                      :value="user.id"
                      :checked="isAssigned(kr, user.id, 'RESPONSIBLE')"
                      :disabled="isAssigned(kr, user.id, 'ACCOUNTABLE')"
                      @change="setResponsible(kr, user.id)"
                    />
                    <span class="assignee-name">{{ user.name }}</span>
                    <span
                      class="assignee-position-badge"
                      v-if="user.position"
                      >{{ user.position }}</span
                    >
                    <span class="assignee-dept-badge" v-if="user.department">{{
                      user.department
                    }}</span>
                  </label>
                </div>
              </div>

              <!-- Accountable Members (bisa lebih dari 1) -->
              <div class="raci-group">
                <div class="raci-role-label accountable">
                  <span class="raci-badge a-badge">A</span>
                  Accountable
                  <span class="raci-role-desc"
                    >— Penanggung jawab (≥1 orang)</span
                  >
                </div>
                <div class="assignee-multi-select">
                  <div v-if="userList.length === 0" class="assignee-empty-hint">
                    Memuat daftar pegawai...
                  </div>
                  <label
                    v-for="user in userList"
                    :key="'A-' + user.id"
                    class="assignee-checkbox-item"
                    :class="[
                      { selected: isAssigned(kr, user.id, 'ACCOUNTABLE') },
                      { disabled: isAssigned(kr, user.id, 'RESPONSIBLE') },
                    ]"
                  >
                    <input
                      type="checkbox"
                      :checked="isAssigned(kr, user.id, 'ACCOUNTABLE')"
                      :disabled="isAssigned(kr, user.id, 'RESPONSIBLE')"
                      @change="
                        toggleRaciAssignment(kr, user.id, 'ACCOUNTABLE', $event)
                      "
                    />
                    <span class="assignee-name">{{ user.name }}</span>
                    <span
                      class="assignee-position-badge"
                      v-if="user.position"
                      >{{ user.position }}</span
                    >
                    <span class="assignee-dept-badge" v-if="user.department">{{
                      user.department
                    }}</span>
                  </label>
                </div>
              </div>

              <!-- Departemen Terlibat -->
              <div class="raci-group">
                <div class="raci-role-label departments">
                  Departemen Terlibat
                  <span class="raci-role-desc"
                    >— Unit bisnis yang berkontribusi</span
                  >
                </div>
                <div class="dept-multi-select">
                  <label
                    v-for="dept in availableDepartments"
                    :key="dept.value"
                    class="dept-checkbox-item"
                    :class="{ selected: kr.departments.includes(dept.value) }"
                  >
                    <input
                      type="checkbox"
                      :value="dept.value"
                      v-model="kr.departments"
                    />
                    <span class="dept-icon">{{ dept.icon }}</span>
                    <span class="dept-name">{{ dept.label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <button type="button" @click="addKrRow" class="add-kr-btn">
            + Tambah KR
          </button>

          <!-- Form Actions -->
          <div class="form-actions">
            <button
              type="submit"
              class="save-btn"
              :disabled="loading || newObjective.keyResults.length === 0"
            >
              {{ loading ? "Menyimpan..." : "Simpan OKR & Hubungkan ke BSC" }}
            </button>
          </div>

          <!-- Notification Messages -->
          <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
          <p v-if="successMessage" class="success-msg">{{ successMessage }}</p>
        </form>
      </section>

      <!-- Right Column: OKR List -->
      <section class="list-section card">
        <div class="list-header">
          <h2>Daftar OKR Aktif</h2>
          <div class="filter-group">
            <label for="filter-year">Year:</label>
            <select
              id="filter-year"
              v-model="filterYear"
              @change="fetchObjectives"
            >
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="">Semua Tahun</option>
            </select>
          </div>
        </div>

        <div class="kr-search-bar">
          <input
            v-model="krSearch"
            type="text"
            placeholder="Cari Key Result..."
            class="kr-search-input"
          />
          <span v-if="krSearch" class="kr-search-clear" @click="krSearch = ''"
            >✕</span
          >
        </div>

        <div v-if="loadingList" class="loading-state">Memuat data OKR...</div>

        <div v-else-if="objectives.length === 0" class="empty-state">
          Belum ada OKR yang terdaftar untuk periode ini.
        </div>

        <div v-else>
          <!-- Bulk Toolbar & View Mode Switcher -->
          <div
            v-if="hasAnyKrs || allDisplayedKrs.length > 0 || hasActiveFilters"
            class="kr-toolbar"
          >
            <div class="toolbar-left">
              <label class="select-all-label">
                <input
                  type="checkbox"
                  :checked="isAllKrsSelected"
                  :disabled="allDisplayedKrs.length === 0"
                  @change="toggleSelectAllKrs"
                />
                <span>Pilih Semua KR ({{ allDisplayedKrs.length }})</span>
              </label>

              <div class="view-switch-pills">
                <button
                  type="button"
                  class="view-pill-btn"
                  :class="{ active: viewMode === 'list' }"
                  @click="viewMode = 'list'"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                  >
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                  Tabel / List
                </button>
                <button
                  type="button"
                  class="view-pill-btn"
                  :class="{ active: viewMode === 'card' }"
                  @click="viewMode = 'card'"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                  >
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  Kartu Hirarki
                </button>
              </div>

              <!-- Filter Perspektif BSC, Departemen, & PIC RACI -->
              <div class="toolbar-filters">
                <select
                  v-model="filterPerspective"
                  class="toolbar-filter-select"
                  title="Filter Perspektif BSC"
                >
                  <option value="">Semua Perspektif</option>
                  <option value="FINANCIAL">Financial</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="INTERNAL_PROCESS">Internal Process</option>
                  <option value="LEARNING_GROWTH">Learning & Growth</option>
                </select>

                <select
                  v-model="filterDepartment"
                  class="toolbar-filter-select"
                  title="Filter Departemen"
                >
                  <option value="">Semua Departemen</option>
                  <option
                    v-for="dept in filterDepartmentOptions"
                    :key="dept.value"
                    :value="dept.value"
                  >
                    {{ dept.label }}
                  </option>
                </select>

                <select
                  v-model="filterPic"
                  class="toolbar-filter-select"
                  title="Filter PIC (RACI)"
                >
                  <option value="">Semua PIC RACI</option>
                  <option
                    v-for="pic in filterPicOptions"
                    :key="pic.id"
                    :value="pic.id"
                  >
                    {{ pic.name }}
                  </option>
                </select>

                <button
                  v-if="hasActiveFilters"
                  type="button"
                  class="toolbar-reset-btn"
                  @click="resetFilters"
                  title="Reset Semua Filter"
                >
                  ✕ Reset
                </button>
              </div>
            </div>

            <div v-if="selectedKrIds.length > 0" class="toolbar-right">
              <button
                type="button"
                class="bulk-reassign-btn"
                @click="openBulkReassignModal"
              >
                Re-assign ({{ selectedKrIds.length }})
              </button>
              <button
                type="button"
                class="bulk-delete-btn"
                @click="triggerBulkDelete"
              >
                Hapus Terpilih
              </button>
            </div>
          </div>

          <!-- TABLE / LIST VIEW PLACEHOLDER -->
          <div v-if="viewMode === 'list'" class="kr-table-container">
            <table class="kr-data-table">
              <thead>
                <tr>
                  <th style="width: 38px"></th>
                  <th style="min-width: 170px">Objektif Induk</th>
                  <th style="min-width: 220px">Key Result & Target</th>
                  <th style="min-width: 110px">Perspektif</th>
                  <th style="min-width: 130px">Departemen</th>
                  <th style="min-width: 150px">PIC (RACI)</th>
                  <th style="min-width: 190px; text-align: center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="{ obj, kr } in flatKrList"
                  :key="kr.id"
                  :id="'kr-row-' + kr.id"
                  :data-kr-id="kr.id"
                  class="kr-table-row"
                  :class="{ 'highlighted-row': lastEditedKrId === kr.id }"
                >
                  <td>
                    <input
                      type="checkbox"
                      :value="kr.id"
                      v-model="selectedKrIds"
                      style="transform: scale(1.15); cursor: pointer"
                    />
                  </td>
                  <td>
                    <div class="table-obj-cell">
                      <span class="year-badge table-year-badge">{{
                        obj.year
                      }}</span>
                      <div class="table-obj-info">
                        <span class="table-obj-title" :title="obj.title">{{
                          obj.title
                        }}</span>
                        <button
                          type="button"
                          class="table-obj-edit-btn"
                          @click="startEditObjective(obj)"
                          title="Edit Objective"
                        >
                          ✎
                        </button>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="table-kr-cell">
                      <span class="table-kr-title">{{ kr.title }}</span>
                      <div
                        class="kr-stats"
                        style="margin-top: 4px; font-size: 12px"
                      >
                        Target:
                        <strong>{{
                          formatTargetValue(
                            kr.targetValue,
                            kr.unit,
                            "",
                            kr.targetType,
                          )
                        }}</strong>
                        <span
                          class="status-badge"
                          :class="kr.status.toLowerCase().replace('_', '')"
                          >{{ kr.status }}</span
                        >
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      class="perspective-badge"
                      :class="kr.bscPerspective.toLowerCase()"
                    >
                      {{ formatPerspective(kr.bscPerspective) }}
                    </span>
                  </td>
                  <td>
                    <div class="table-dept-cell">
                      <span
                        v-for="d in getKrDepartments(kr)"
                        :key="d"
                        class="kr-dept-chip"
                        >{{ d }}</span
                      >
                      <span
                        v-if="getKrDepartments(kr).length === 0"
                        style="color: rgba(255, 255, 255, 0.3); font-size: 12px"
                        >-</span
                      >
                    </div>
                  </td>
                  <td>
                    <div class="table-pic-cell">
                      <span
                        v-for="a in kr.assignments"
                        :key="a.id || a.userId"
                        class="pic-chip"
                        :class="a.raciRole ? a.raciRole.toLowerCase() : ''"
                        :title="`${getAssignmentUserName(a)} (${a.raciRole})`"
                      >
                        {{ getAssignmentUserName(a) }} ({{
                          a.raciRole ? a.raciRole.charAt(0) : "?"
                        }})
                      </span>
                      <span
                        v-if="!kr.assignments?.length"
                        style="color: rgba(255, 255, 255, 0.3); font-size: 12px"
                        >-</span
                      >
                    </div>
                  </td>
                  <td style="text-align: right">
                    <div class="table-actions-cell">
                      <button
                        @click.stop="startReassignDept(kr)"
                        class="reassign-kr-btn table-action-btn"
                        title="Re-assign Departemen"
                      >
                        Re-assign
                      </button>
                      <button
                        @click="startEditKr(kr, obj.id)"
                        class="edit-kr-btn table-action-btn"
                        title="Edit KR"
                      >
                        Edit
                      </button>
                      <button
                        @click.stop="deleteKr(kr.id)"
                        class="delete-kr-btn table-action-btn"
                        title="Hapus KR"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="flatKrList.length === 0">
                  <td
                    colspan="7"
                    style="
                      text-align: center;
                      padding: 30px;
                      color: rgba(255, 255, 255, 0.4);
                    "
                  >
                    Tidak ada Key Result yang cocok dengan pencarian / filter.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- CARD VIEW (Existing) -->
          <div v-else class="objectives-list">
            <div
              v-for="obj in filteredObjectives"
              :key="obj.id"
              class="objective-item"
            >
              <div class="objective-item-header">
                <div>
                  <div class="obj-header-meta">
                    <span class="year-badge">{{ obj.year }}</span>
                    <span
                      v-for="dept in getObjectiveDepartments(obj)"
                      :key="dept"
                      class="dept-badge"
                    >
                      {{ dept }}
                    </span>
                  </div>
                  <h3>{{ obj.title }}</h3>
                  <p v-if="obj.description" class="obj-desc">
                    {{ obj.description }}
                  </p>
                </div>
                <div style="display: flex; gap: 8px; align-items: center">
                  <button
                    @click.stop="startEditObjective(obj)"
                    class="edit-obj-btn"
                    title="Edit Objective"
                  >
                    Edit
                  </button>
                  <button
                    @click.stop="deleteObjective(obj.id)"
                    class="delete-obj-btn"
                    title="Hapus Objective ini beserta seluruh Key Results nya"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              <div class="key-results-container">
                <div
                  v-for="kr in obj.filteredKrs"
                  :key="kr.id"
                  :id="'kr-card-' + kr.id"
                  :data-kr-id="kr.id"
                  class="kr-list-row"
                  :class="{ 'highlighted-row': lastEditedKrId === kr.id }"
                >
                  <div
                    class="kr-list-row-header"
                    style="
                      display: flex;
                      align-items: center;
                      gap: 12px;
                      width: 100%;
                    "
                  >
                    <input
                      type="checkbox"
                      :value="kr.id"
                      v-model="selectedKrIds"
                      style="
                        transform: scale(1.2);
                        cursor: pointer;
                        flex-shrink: 0;
                      "
                    />
                    <div class="kr-info" style="flex: 1">
                      <span class="kr-title">{{ kr.title }}</span>
                      <div class="kr-stats">
                        Target:
                        <strong>{{
                          formatTargetValue(
                            kr.targetValue,
                            kr.unit,
                            "",
                            kr.targetType,
                          )
                        }}</strong>
                        <span
                          class="status-badge"
                          :class="kr.status.toLowerCase().replace('_', '')"
                          >{{ kr.status }}</span
                        >
                      </div>
                      <div
                        v-if="
                          getKrDepartments(kr).length > 0 ||
                          (kr.assignments && kr.assignments.length > 0)
                        "
                        class="kr-meta-row"
                      >
                        <div
                          v-if="getKrDepartments(kr).length > 0"
                          class="meta-item"
                        >
                          <span class="meta-label">Dept:</span>
                          <span
                            v-for="d in getKrDepartments(kr)"
                            :key="d"
                            class="kr-dept-chip"
                            >{{ d }}</span
                          >
                        </div>
                        <div
                          v-if="kr.assignments && kr.assignments.length > 0"
                          class="meta-item"
                        >
                          <span class="meta-label">PIC:</span>
                          <span
                            v-for="a in kr.assignments"
                            :key="a.id || a.userId"
                            class="pic-chip"
                            :class="a.raciRole ? a.raciRole.toLowerCase() : ''"
                            :title="`${getAssignmentUserName(a)} (${a.raciRole})`"
                          >
                            {{ getAssignmentUserName(a) }} ({{
                              a.raciRole ? a.raciRole.charAt(0) : "?"
                            }})
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="kr-actions-wrapper">
                      <div class="kr-perspective">
                        <span
                          class="perspective-badge"
                          :class="kr.bscPerspective.toLowerCase()"
                        >
                          {{ formatPerspective(kr.bscPerspective) }}
                        </span>
                      </div>
                      <div class="kr-action-buttons">
                        <button
                          @click.stop="startReassignDept(kr)"
                          class="reassign-kr-btn"
                          title="Re-assign Departemen"
                        >
                          Re-assign
                        </button>
                        <button
                          @click="startEditKr(kr, obj.id)"
                          class="edit-kr-btn"
                          title="Edit Metric (Key Result)"
                        >
                          Edit
                        </button>
                        <button
                          @click.stop="deleteKr(kr.id)"
                          class="delete-kr-btn"
                          title="Hapus Metric (Key Result)"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Initiatives Section (Expandable) -->
                  <!-- <div class="kr-initiatives-section">
                  <div
                    class="initiatives-header"
                    @click="toggleInitiatives(kr.id)"
                  >
                    <span class="ini-count-badge"
                      >Inisiatif ({{ kr.initiatives?.length || 0 }})</span
                    >
                    <span class="ini-toggle-icon">{{
                      expandedKrId === kr.id ? "▲" : "▼"
                    }}</span>
                  </div>

                  <div v-if="expandedKrId === kr.id" class="initiatives-body">
                    <div
                      v-for="ini in kr.initiatives"
                      :key="ini.id"
                      class="initiative-row"
                    >
                      <div class="ini-connector-line"></div>
                      <div class="ini-card">
                        <div class="ini-card-header">
                          <span class="ini-title">{{ ini.title }}</span>
                          <div class="ini-meta-chips">
                            <span class="pic-chip" v-if="ini.owner"
                              >{{ ini.owner.name }}</span
                            >
                            <span class="team-chip" v-if="ini.team">{{
                              ini.team.name
                            }}</span>
                            <div class="ini-actions-group">
                              <button
                                class="ini-action-btn edit"
                                @click.stop="startEditInitiative(ini, kr)"
                                title="Edit Inisiatif"
                              >

                              </button>
                              <button
                                class="ini-action-btn delete"
                                @click.stop="deleteInitiative(ini.id)"
                                title="Hapus Inisiatif"
                              >

                              </button>
                            </div>
                          </div>
                        </div>
                        <p class="ini-desc" v-if="ini.description">
                          {{ ini.description }}
                        </p>

                        <div class="ini-task-container">
                          <div v-if="ini.tasks?.length > 0" class="task-chips">
                            <span
                              v-for="task in ini.tasks"
                              :key="task.id"
                              class="task-chip"
                            >
                              {{ task.title }} ({{ task.currentValue }}/{{
                                task.targetValue
                              }}
                              {{ task.unit }})
                            </span>
                          </div>
                          <div v-else class="task-empty">Belum ada Task</div>
                          <button
                            class="add-task-chip-btn"
                            @click.stop="openAddTaskFor(ini)"
                          >
                            + Task
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      class="add-ini-btn"
                      @click="openAddInitiativeFor(kr)"
                    >
                      + Tambah Inisiatif untuk KR ini
                    </button>
                  </div>
                </div> -->
                </div>
              </div>
            </div>
            <div
              v-if="filteredObjectives.length === 0"
              class="empty-state"
              style="margin-top: 16px"
            >
              Tidak ada Key Result yang cocok dengan pencarian / filter.
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Edit KR Modal -->
    <div v-if="editingKr" class="modal-overlay" @click.self="editingKr = null">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Edit Key Result / Metric</h3>
          <button
            class="modal-close-btn"
            @click="editingKr = null"
            title="Tutup Modal"
          >
            &times;
          </button>
        </div>
        <form @submit.prevent="submitEditKr" class="okr-form">
          <div class="form-group">
            <label>Objektif Induk *</label>
            <select v-model="editKrData.objectiveId" required>
              <option v-for="o in objectives" :key="o.id" :value="o.id">
                {{ o.title }} ({{ o.year || "Semua Periode" }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Deskripsi Key Result *</label>
            <input
              v-model="editKrData.title"
              type="text"
              placeholder="Contoh: Mengurangi load-time server menjadi < 200ms"
              required
            />
          </div>
          <div class="form-row">
            <div class="form-group third">
              <label>Target Nilai *</label>
              <input
                v-model.number="editKrData.targetValue"
                type="number"
                step="any"
                min="0.000001"
                required
              />
            </div>
            <div class="form-group third">
              <label>Tipe Target</label>
              <select v-model="editKrData.targetType">
                <option value="AT_LEAST">Minimal</option>
                <option value="AT_MOST">Maksimal</option>
                <option value="EXACT">Tepat</option>
              </select>
            </div>
            <div class="form-group third">
              <label>Satuan *</label>
              <input
                v-model="editKrData.unit"
                type="text"
                placeholder="%, IDR, dll"
                required
              />
            </div>
          </div>
          <div class="form-group">
            <label>Perspektif BSC *</label>
            <select v-model="editKrData.bscPerspective" required>
              <option value="FINANCIAL">Financial</option>
              <option value="CUSTOMER">Customer</option>
              <option value="INTERNAL_PROCESS">Internal Process</option>
              <option value="LEARNING_GROWTH">Learning & Growth</option>
            </select>
          </div>
          <div class="form-group" style="margin-top: 8px">
            <label>Departemen Terkait</label>
            <div class="dept-checkbox-grid">
              <label
                v-for="dept in availableDepartments"
                :key="'editDept-' + dept.value"
                class="dept-checkbox-item"
                :class="{ selected: editKrDepartments.includes(dept.value) }"
              >
                <input
                  type="checkbox"
                  :value="dept.value"
                  v-model="editKrDepartments"
                />
                <span class="dept-name">{{ dept.label }}</span>
              </label>
            </div>
          </div>
          <div class="raci-section" style="margin-top: 8px">
            <div class="raci-section-header">
              <span class="raci-title">RACI Assignment</span>
              <span class="raci-hint"
                >Pilih pegawai & tentukan peran RACI mereka</span
              >
            </div>

            <!-- Responsible (radio, tepat 1) -->
            <div class="raci-group">
              <div class="raci-role-label responsible">
                <span class="raci-badge r-badge">R</span>
                Responsible
                <span class="raci-role-desc"
                  >— Tepat 1 orang yang mengerjakan KR ini</span
                >
              </div>
              <div class="assignee-multi-select">
                <div v-if="userList.length === 0" class="assignee-empty-hint">
                  Memuat daftar pegawai...
                </div>
                <label
                  v-for="user in userList"
                  :key="'editR-' + user.id"
                  class="assignee-checkbox-item"
                  :class="[
                    { selected: isEditAssigned(user.id, 'RESPONSIBLE') },
                    { disabled: isEditAssigned(user.id, 'ACCOUNTABLE') },
                  ]"
                >
                  <input
                    type="radio"
                    name="edit-responsible"
                    :value="user.id"
                    :checked="isEditAssigned(user.id, 'RESPONSIBLE')"
                    :disabled="isEditAssigned(user.id, 'ACCOUNTABLE')"
                    @change="setEditResponsible(user.id)"
                  />
                  <span class="assignee-name">{{ user.name }}</span>
                  <span class="assignee-position-badge" v-if="user.position">{{
                    user.position
                  }}</span>
                  <span class="assignee-dept-badge" v-if="user.department">{{
                    user.department
                  }}</span>
                </label>
              </div>
            </div>

            <!-- Accountable (checkbox, bisa lebih dari 1) -->
            <div class="raci-group">
              <div class="raci-role-label accountable">
                <span class="raci-badge a-badge">A</span>
                Accountable
                <span class="raci-role-desc"
                  >— Penanggung jawab (≥1 orang)</span
                >
              </div>
              <div class="assignee-multi-select">
                <div v-if="userList.length === 0" class="assignee-empty-hint">
                  Memuat daftar pegawai...
                </div>
                <label
                  v-for="user in userList"
                  :key="'editA-' + user.id"
                  class="assignee-checkbox-item"
                  :class="[
                    { selected: isEditAssigned(user.id, 'ACCOUNTABLE') },
                    { disabled: isEditAssigned(user.id, 'RESPONSIBLE') },
                  ]"
                >
                  <input
                    type="checkbox"
                    :checked="isEditAssigned(user.id, 'ACCOUNTABLE')"
                    :disabled="isEditAssigned(user.id, 'RESPONSIBLE')"
                    @change="
                      toggleEditRaciAssignment(user.id, 'ACCOUNTABLE', $event)
                    "
                  />
                  <span class="assignee-name">{{ user.name }}</span>
                  <span class="assignee-position-badge" v-if="user.position">{{
                    user.position
                  }}</span>
                  <span class="assignee-dept-badge" v-if="user.department">{{
                    user.department
                  }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="editingKr = null" class="cancel-btn">
              Batal
            </button>
            <button type="submit" class="save-kr-btn" :disabled="savingKr">
              {{ savingKr ? "Menyimpan..." : "Simpan Perubahan" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add / Edit Initiative Modal -->
    <div
      v-if="showIniModal"
      class="modal-overlay"
      @click.self="showIniModal = false"
    >
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ editingIni ? "Edit Inisiatif" : "Tambah Inisiatif Baru" }}</h3>
          <button
            class="modal-close-btn"
            @click="showIniModal = false"
            title="Tutup Modal"
          >
            &times;
          </button>
        </div>
        <p class="modal-subtitle">
          Untuk KR: <strong>{{ selectedKrForIni?.title }}</strong>
        </p>
        <form @submit.prevent="saveInitiativeForKr" class="okr-form">
          <div class="form-group">
            <label>Judul Inisiatif *</label>
            <input
              v-model="iniForm.title"
              type="text"
              placeholder="Contoh: Kampanye Edukasi B2B"
              required
            />
          </div>
          <div class="form-group">
            <label>Deskripsi</label>
            <textarea
              v-model="iniForm.description"
              placeholder="Penjelasan singkat inisiatif ini"
              rows="2"
            ></textarea>
          </div>
          <div class="form-group">
            <label>PIC Pegawai (Penanggung Jawab Inisiatif)</label>
            <div class="searchable-field">
              <input
                v-model="employeeSearch"
                type="text"
                class="search-mini-input"
                placeholder="Cari nama pegawai..."
              />
              <select v-model="iniForm.ownerId" @change="onIniOwnerChange">
                <option value="">-- Pilih Pegawai (Opsional) --</option>
                <option
                  v-for="user in filteredUsersForDropdown"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.name }}
                </option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Tim / Departemen Pelaksana *</label>
            <div class="searchable-field">
              <input
                v-model="teamSearch"
                type="text"
                class="search-mini-input"
                placeholder="Cari nama departemen / tim..."
              />
              <select v-model="iniForm.teamId" required>
                <option value="" disabled>Pilih Tim / Departemen</option>
                <option
                  v-for="team in filteredTeamsForDropdown"
                  :key="team.id"
                  :value="team.id"
                >
                  {{ team.name }}
                </option>
              </select>
            </div>
          </div>
          <div class="modal-actions">
            <button
              type="button"
              @click="showIniModal = false"
              class="cancel-btn"
            >
              Batal
            </button>
            <button type="submit" class="save-kr-btn" :disabled="savingIni">
              {{
                savingIni
                  ? "Menyimpan..."
                  : editingIni
                    ? "Simpan Perubahan"
                    : "Simpan Inisiatif"
              }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Task Modal -->
    <div
      v-if="showTaskModal"
      class="modal-overlay"
      @click.self="showTaskModal = false"
    >
      <div class="modal-card">
        <div class="modal-header">
          <h3>Tambah Task Baru</h3>
          <button
            class="modal-close-btn"
            @click="showTaskModal = false"
            title="Tutup Modal"
          >
            &times;
          </button>
        </div>
        <p class="modal-subtitle">
          Untuk Inisiatif: <strong>{{ selectedIniForTask?.title }}</strong>
        </p>
        <form @submit.prevent="saveTaskForInitiative" class="okr-form">
          <div class="form-group">
            <label>Judul Task / Metric *</label>
            <input
              v-model="taskForm.title"
              type="text"
              placeholder="Contoh: Jumlah leads baru, Conversion rate"
              required
            />
          </div>
          <UnitTargetInput
            v-model:targetValue="taskForm.targetValue"
            v-model:unit="taskForm.unit"
            v-model:targetType="taskForm.targetType"
            :required="true"
          />
          <div class="modal-actions">
            <button
              type="button"
              @click="showTaskModal = false"
              class="cancel-btn"
            >
              Batal
            </button>
            <button
              type="submit"
              class="save-kr-btn"
              :disabled="savingTask || !taskForm.unit?.trim()"
            >
              {{ savingTask ? "Menyimpan..." : "Simpan Task" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Key Result Confirmation Modal -->
    <div
      v-if="krToDelete"
      class="modal-overlay"
      @click.self="krToDelete = null"
    >
      <div class="modal-box" style="max-width: 400px; text-align: center">
        <h3 style="margin-top: 0; color: #ff4b4b">Konfirmasi Hapus</h3>
        <p style="font-size: 14px; margin: 12px 0 20px 0; color: #475569">
          Apakah Anda yakin ingin menghapus Key Result ini? Tindakan ini tidak
          dapat dibatalkan.
        </p>
        <div class="modal-actions" style="justify-content: center; gap: 12px">
          <button class="cancel-btn" @click="krToDelete = null">Batal</button>
          <button
            class="save-kr-btn"
            style="background: #ff4b4b; color: white"
            @click="confirmDeleteKr"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
    <!-- Edit Objective Modal -->
    <div
      v-if="editingObj"
      class="modal-overlay"
      @click.self="editingObj = null"
    >
      <div class="modal-box" style="max-width: 500px">
        <h3 style="margin-top: 0">Edit Objective</h3>
        <div class="form-group">
          <label>Judul Objective *</label>
          <input
            v-model="editObjData.title"
            type="text"
            class="form-control"
            placeholder="Judul Objective"
          />
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <textarea
            v-model="editObjData.description"
            class="form-control"
            rows="3"
            placeholder="Deskripsi (opsional)"
          />
        </div>
        <div class="form-group">
          <label>Tahun *</label>
          <input
            v-model="editObjData.year"
            type="text"
            class="form-control"
            placeholder="Contoh: 2025"
          />
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="editingObj = null">Batal</button>
          <button
            class="save-kr-btn"
            :disabled="savingObj"
            @click="submitEditObjective"
          >
            {{ savingObj ? "Menyimpan..." : "Simpan" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Objective Confirmation Modal -->
    <div
      v-if="objectiveToDelete"
      class="modal-overlay"
      @click.self="objectiveToDelete = null"
    >
      <div class="modal-box" style="max-width: 400px; text-align: center">
        <h3 style="margin-top: 0; color: #ff4b4b">
          Konfirmasi Hapus Objective
        </h3>
        <p style="font-size: 14px; margin: 12px 0 20px 0; color: #475569">
          Apakah Anda yakin ingin menghapus Objective ini beserta seluruh Key
          Results di dalamnya? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div class="modal-actions" style="justify-content: center; gap: 12px">
          <button class="cancel-btn" @click="objectiveToDelete = null">
            Batal
          </button>
          <button
            class="save-kr-btn"
            style="background: #ff4b4b; color: white"
            @click="confirmDeleteObjective"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Delete Key Results Confirmation Modal -->
    <div
      v-if="showBulkDeleteModal"
      class="modal-overlay"
      @click.self="showBulkDeleteModal = false"
    >
      <div class="modal-box" style="max-width: 400px; text-align: center">
        <h3 style="margin-top: 0; color: #ff4b4b">Konfirmasi Hapus Massal</h3>
        <p style="font-size: 14px; margin: 12px 0 20px 0; color: #475569">
          Apakah Anda yakin ingin menghapus
          <strong>{{ selectedKrIds.length }} Key Results</strong> yang terpilih?
          Tindakan ini akan menghapus semua Inisiatif dan Task terkait dan tidak
          dapat dibatalkan.
        </p>
        <div class="modal-actions" style="justify-content: center; gap: 12px">
          <button class="cancel-btn" @click="showBulkDeleteModal = false">
            Batal
          </button>
          <button
            class="save-kr-btn"
            style="background: #ff4b4b; color: white"
            @click="confirmBulkDeleteKrs"
          >
            Hapus Semua
          </button>
        </div>
      </div>
    </div>

    <!-- Re-assign Department Modal -->
    <div
      v-if="reassignTargetKr"
      class="modal-overlay"
      @click.self="reassignTargetKr = null"
    >
      <div class="modal-card" style="max-width: 520px">
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            gap: 2px;
          "
        >
          <div>
            <h3 style="margin: 0">Re-assign Departemen</h3>
            <p class="modal-subtitle" style="font-size: 13px; color: #475569">
              Pindahkan atau sesuaikan departemen penanggung jawab Key Result.
            </p>
          </div>
          <button
            class="modal-close-btn"
            @click="reassignTargetKr = null"
            title="Tutup Modal"
          >
            &times;
          </button>
        </div>

        <div
          style="
            margin: 16px 0;
            background: rgba(255, 255, 255, 0.04);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.08);
          "
        >
          <div
            style="
              font-size: 11px;
              text-transform: uppercase;
              color: #475569;
              font-weight: 600;
              margin-bottom: 4px;
            "
          >
            Key Result:
          </div>
          <div style="font-size: 14px; font-weight: 600; color: #475569">
            {{ reassignTargetKr.title }}
          </div>
          <div
            v-if="getKrDepartments(reassignTargetKr).length > 0"
            style="
              margin-top: 8px;
              display: flex;
              align-items: center;
              gap: 6px;
              flex-wrap: wrap;
            "
          >
            <span style="font-size: 12px; color: #475569"
              >Departemen Saat ini:</span
            >
            <span
              v-for="d in getKrDepartments(reassignTargetKr)"
              :key="d"
              class="kr-dept-chip"
              >{{ d }}</span
            >
          </div>
        </div>

        <form @submit.prevent="submitReassignDept" class="okr-form">
          <div class="form-group">
            <label>Pilih Departemen Baru / Tambahan</label>
            <div class="dept-checkbox-grid">
              <label
                v-for="dept in availableDepartments"
                :key="'reassign-' + dept.value"
                class="dept-checkbox-item"
                :class="{
                  selected: reassignDeptSelection.includes(dept.value),
                }"
              >
                <input
                  type="checkbox"
                  :value="dept.value"
                  v-model="reassignDeptSelection"
                />
                <span class="dept-name">{{ dept.label }}</span>
              </label>
            </div>
            <p
              v-if="reassignDeptSelection.length === 0"
              style="font-size: 12px; color: #f59e0b; margin-top: 6px"
            >
              Catatan: Jika tidak ada departemen dipilih, KR akan menjadi tanpa
              departemen.
            </p>
          </div>

          <div class="modal-actions" style="margin-top: 20px">
            <button
              type="button"
              class="cancel-btn"
              @click="reassignTargetKr = null"
            >
              Batal
            </button>
            <button
              type="submit"
              class="save-kr-btn"
              :disabled="savingReassign"
            >
              {{ savingReassign ? "Menyimpan..." : "Simpan Re-assign" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Bulk Re-assign Department Modal -->
    <div
      v-if="showBulkReassignModal"
      class="modal-overlay"
      @click.self="showBulkReassignModal = false"
    >
      <div class="modal-card" style="max-width: 520px">
        <div class="modal-header">
          <div>
            <h3 style="margin: 0">Re-assign Departemen Massal</h3>
            <p
              class="modal-subtitle"
              style="
                margin: 4px 0 0 0;
                font-size: 13px;
                color: rgba(255, 255, 255, 0.6);
              "
            >
              Re-assign
              <strong>{{ selectedKrIds.length }} Key Results</strong> sekaligus.
            </p>
          </div>
          <button
            class="modal-close-btn"
            @click="showBulkReassignModal = false"
            title="Tutup Modal"
          >
            &times;
          </button>
        </div>

        <form
          @submit.prevent="submitBulkReassignDept"
          class="okr-form"
          style="margin-top: 16px"
        >
          <div class="form-group">
            <label>Pilih Departemen Tujuan *</label>
            <div class="dept-checkbox-grid">
              <label
                v-for="dept in availableDepartments"
                :key="'bulkReassign-' + dept.value"
                class="dept-checkbox-item"
                :class="{
                  selected: bulkReassignDeptSelection.includes(dept.value),
                }"
              >
                <input
                  type="checkbox"
                  :value="dept.value"
                  v-model="bulkReassignDeptSelection"
                />
                <span class="dept-name">{{ dept.label }}</span>
              </label>
            </div>
          </div>

          <div class="modal-actions" style="margin-top: 20px">
            <button
              type="button"
              class="cancel-btn"
              @click="showBulkReassignModal = false"
            >
              Batal
            </button>
            <button
              type="submit"
              class="save-kr-btn"
              :disabled="
                savingReassign || bulkReassignDeptSelection.length === 0
              "
            >
              {{
                savingReassign
                  ? "Memproses..."
                  : "Terapkan ke " + selectedKrIds.length + " KR"
              }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Bulk Upload Modal -->
    <BulkUploadModal
      v-if="showBulkModal"
      :type="bulkModalType"
      @close="showBulkModal = false"
      @done="fetchObjectives"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useAuthStore } from "../../stores/auth";
import BulkUploadModal from "~/components/BulkUploadModal.vue";

const auth = useAuthStore();
const config = useRuntimeConfig();
const { confirm: confirmDialog } = useConfirm();

const showBulkModal = ref(false);
const bulkModalType = ref("kr");

function openBulkUpload(type) {
  bulkModalType.value = type;
  showBulkModal.value = true;
}
const objectives = ref([]);
const filterYear = ref("2026");
const loading = ref(false);
const loadingList = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const isExistingObjective = ref(false);
const selectedObjectiveId = ref("");
const allObjectivesForDropdown = ref([]);
const userList = ref([]);
const availableDepartments = ref([]);

async function fetchDepartments() {
  try {
    const response = await $fetch(`${config.public.apiBase}/departments`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    availableDepartments.value = response.map((d) => ({
      value: d.value,
      label: d.name,
    }));
  } catch (err) {
    console.error("Error fetching departments:", err);
  }
}

const newObjective = ref({
  title: "",
  description: "",
  year: "2026",
  keyResults: [
    {
      title: "",
      targetValue: null,
      targetType: "AT_LEAST",
      unit: "%",
      bscPerspective: "",
      raciAssignments: [],
      departments: [],
    },
  ],
});

function addKrRow() {
  newObjective.value.keyResults.push({
    title: "",
    targetValue: null,
    targetType: "AT_LEAST",
    unit: "%",
    bscPerspective: "",
    raciAssignments: [],
    departments: [],
  });
}

function removeKrRow(index) {
  newObjective.value.keyResults.splice(index, 1);
}

function isAssigned(kr, userId, raciRole) {
  return kr.raciAssignments.some(
    (a) => a.userId === userId && a.raciRole === raciRole,
  );
}

function toggleRaciAssignment(kr, userId, raciRole, event) {
  if (event.target.checked) {
    kr.raciAssignments.push({ userId, raciRole });
  } else {
    const idx = kr.raciAssignments.findIndex(
      (a) => a.userId === userId && a.raciRole === raciRole,
    );
    if (idx > -1) kr.raciAssignments.splice(idx, 1);
  }
}

function setResponsible(kr, userId) {
  const idx = kr.raciAssignments.findIndex((a) => a.raciRole === "RESPONSIBLE");
  if (idx > -1) kr.raciAssignments.splice(idx, 1);
  kr.raciAssignments.push({ userId, raciRole: "RESPONSIBLE" });
}

function isEditAssigned(userId, raciRole) {
  return editKrRaciAssignments.value.some(
    (a) => a.userId === userId && a.raciRole === raciRole,
  );
}

function setEditResponsible(userId) {
  editKrRaciAssignments.value = editKrRaciAssignments.value.filter(
    (a) => a.raciRole !== "RESPONSIBLE",
  );
  editKrRaciAssignments.value.push({ userId, raciRole: "RESPONSIBLE" });
}

function toggleEditRaciAssignment(userId, raciRole, event) {
  if (event.target.checked) {
    editKrRaciAssignments.value.push({ userId, raciRole });
  } else {
    const idx = editKrRaciAssignments.value.findIndex(
      (a) => a.userId === userId && a.raciRole === raciRole,
    );
    if (idx > -1) editKrRaciAssignments.value.splice(idx, 1);
  }
}

function setAccountable(kr, userId) {
  const idx = kr.raciAssignments.findIndex((a) => a.raciRole === "ACCOUNTABLE");
  if (idx > -1) kr.raciAssignments.splice(idx, 1);
  kr.raciAssignments.push({ userId, raciRole: "ACCOUNTABLE" });
}

function formatPerspective(p) {
  if (!p) return "";
  return p
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function getKrDepartments(kr) {
  if (kr.departments && kr.departments.length > 0) {
    return kr.departments
      .map((d) => (typeof d === "string" ? d : d.department || d.name || ""))
      .filter(Boolean);
  }
  const match = kr.title?.match(/^\[([^\]]+)\]/);
  if (match) return [match[1]];
  return [];
}

function getObjectiveDepartments(obj) {
  const set = new Set();
  const krs = obj.filteredKrs || obj.keyResults || [];
  for (const kr of krs) {
    for (const d of getKrDepartments(kr)) {
      if (d) set.add(d);
    }
  }
  return Array.from(set);
}

function getAssignmentUserName(a) {
  if (a.user?.name) return a.user.name;
  const found = userList.value?.find((u) => u.id === (a.userId || a.user?.id));
  return found?.name || "Pegawai";
}

async function fetchUserList() {
  try {
    const response = await $fetch(`${config.public.apiBase}/users`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    userList.value = response;
  } catch (err) {
    console.error("Error fetching users:", err);
  }
}

async function fetchAllObjectivesForDropdown() {
  try {
    const response = await $fetch(`${config.public.apiBase}/objectives`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
    allObjectivesForDropdown.value = response;
  } catch (err) {
    console.error("Error fetching all objectives for dropdown:", err);
  }
}

async function fetchObjectives(options = {}) {
  const isSilent =
    typeof options === "object" && options !== null && options.silent === true;
  if (!isSilent) {
    loadingList.value = true;
  }
  try {
    let url = `${config.public.apiBase}/objectives`;
    if (filterYear.value) {
      url += `?year=${filterYear.value}`;
    }
    const response = await $fetch(url, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
    objectives.value = response;
  } catch (err) {
    console.error("Error fetching objectives:", err);
  } finally {
    if (!isSilent) {
      loadingList.value = false;
    }
  }
}

async function submitObjective() {
  errorMessage.value = "";
  successMessage.value = "";

  if (isExistingObjective.value && !selectedObjectiveId.value) {
    errorMessage.value = "Silakan pilih Objective terlebih dahulu";
    return;
  }

  if (!isExistingObjective.value && !newObjective.value.title.trim()) {
    errorMessage.value = "Judul Objective wajib diisi";
    return;
  }

  if (!isExistingObjective.value && !newObjective.value.year.trim()) {
    errorMessage.value = "Tahun / Periode Objective wajib diisi";
    return;
  }

  if (newObjective.value.keyResults.length === 0) {
    errorMessage.value = "Minimal harus membuat 1 Key Result";
    return;
  }

  for (let i = 0; i < newObjective.value.keyResults.length; i++) {
    const kr = newObjective.value.keyResults[i];
    if (!kr.title.trim()) {
      errorMessage.value = `Deskripsi Key Result #${i + 1} wajib diisi`;
      return;
    }
    if (
      kr.targetValue === null ||
      kr.targetValue === undefined ||
      kr.targetValue <= 0
    ) {
      errorMessage.value = `Target Nilai Key Result #${i + 1} harus lebih besar dari 0`;
      return;
    }
    if (!kr.bscPerspective) {
      errorMessage.value = `Perspektif BSC Key Result #${i + 1} wajib dipilih`;
      return;
    }

    if (kr.raciAssignments && kr.raciAssignments.length > 0) {
      const accountables = kr.raciAssignments.filter(
        (a) => a.raciRole === "ACCOUNTABLE",
      );
      if (accountables.length < 1) {
        errorMessage.value = `Key Result #${i + 1} harus memiliki minimal 1 Accountable!`;
        return;
      }
      const responsibles = kr.raciAssignments.filter(
        (a) => a.raciRole === "RESPONSIBLE",
      );
      if (responsibles.length !== 1) {
        errorMessage.value = `Key Result #${i + 1} harus memiliki tepat 1 Responsible!`;
        return;
      }
    }
  }

  loading.value = true;
  try {
    if (isExistingObjective.value) {
      for (const kr of newObjective.value.keyResults) {
        const createdKr = await $fetch(`${config.public.apiBase}/key-results`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
          body: {
            objectiveId: selectedObjectiveId.value,
            title: kr.title,
            targetValue: kr.targetValue,
            targetType: kr.targetType || "AT_LEAST",
            unit: kr.unit,
            bscPerspective: kr.bscPerspective,
          },
        });

        if (
          createdKr &&
          createdKr.id &&
          (kr.raciAssignments.length > 0 || kr.departments.length > 0)
        ) {
          await $fetch(
            `${config.public.apiBase}/key-results/${createdKr.id}/assign`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${auth.token}` },
              body: {
                assignments: kr.raciAssignments,
                departments: kr.departments || [],
              },
            },
          );
        }
      }
      successMessage.value = "Key Results berhasil ditambahkan ke Objective!";
    } else {
      const createdObj = await $fetch(`${config.public.apiBase}/objectives`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: newObjective.value,
      });

      if (createdObj && createdObj.keyResults) {
        for (let i = 0; i < createdObj.keyResults.length; i++) {
          const createdKr = createdObj.keyResults[i];
          const krData = newObjective.value.keyResults[i];
          if (
            krData &&
            (krData.raciAssignments.length > 0 || krData.departments.length > 0)
          ) {
            await $fetch(
              `${config.public.apiBase}/key-results/${createdKr.id}/assign`,
              {
                method: "POST",
                headers: { Authorization: `Bearer ${auth.token}` },
                body: {
                  assignments: krData.raciAssignments,
                  departments: krData.departments || [],
                },
              },
            );
          }
        }
      }
      successMessage.value = "Objective & Key Results berhasil dibuat!";
    }

    newObjective.value = {
      title: "",
      description: "",
      year: "2026",
      keyResults: [
        {
          title: "",
          targetValue: null,
          targetType: "AT_LEAST",
          unit: "%",
          bscPerspective: "",
          raciAssignments: [],
          departments: [],
        },
      ],
    };
    selectedObjectiveId.value = "";

    fetchObjectives();
    fetchAllObjectivesForDropdown();
  } catch (err) {
    console.error("Submit objective error:", err);
    errorMessage.value = err.data?.message || "Gagal menyimpan data OKR.";
  } finally {
    loading.value = false;
  }
}

const objectiveToDelete = ref(null);

// Edit Objective
const editingObj = ref(null);
const editObjData = ref({ title: "", description: "", year: "" });
const savingObj = ref(false);

function startEditObjective(obj) {
  editingObj.value = obj;
  editObjData.value = {
    title: obj.title,
    description: obj.description || "",
    year: obj.year,
  };
}

async function submitEditObjective() {
  if (!editObjData.value.title.trim() || !editObjData.value.year.trim()) {
    alert("Judul dan Tahun wajib diisi!");
    return;
  }
  savingObj.value = true;
  try {
    await $fetch(`${config.public.apiBase}/objectives/${editingObj.value.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${auth.token}` },
      body: {
        title: editObjData.value.title.trim(),
        description: editObjData.value.description.trim() || null,
        year: editObjData.value.year.trim(),
      },
    });
    editingObj.value = null;
    await fetchObjectives({ silent: true });
  } catch (err) {
    console.error("Update objective error:", err);
    alert(err.data?.message || "Gagal mengupdate Objective.");
  } finally {
    savingObj.value = false;
  }
}

function deleteObjective(id) {
  console.log("deleteObjective called with ID:", id);
  objectiveToDelete.value = id;
}

async function confirmDeleteObjective() {
  if (!objectiveToDelete.value) return;
  const id = objectiveToDelete.value;
  objectiveToDelete.value = null;
  try {
    await $fetch(`${config.public.apiBase}/objectives/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
    fetchObjectives();
  } catch (err) {
    console.error("Delete objective error:", err);
    alert(err.data?.message || "Gagal menghapus Objective.");
  }
}

// Edit & Delete individual Key Results/Metrics
const editingKr = ref(null);
const lastEditedKrId = ref(null);

function scrollToKr(krId) {
  if (!krId) return;
  lastEditedKrId.value = krId;
  nextTick(() => {
    // ponytail: native scrollIntoView block nearest keeps target row in view without full container jump
    const el =
      document.getElementById(`kr-row-${krId}`) ||
      document.getElementById(`kr-card-${krId}`) ||
      document.querySelector(`[data-kr-id="${krId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });
  setTimeout(() => {
    if (lastEditedKrId.value === krId) {
      lastEditedKrId.value = null;
    }
  }, 2500);
}

const editKrData = ref({
  id: "",
  objectiveId: "",
  title: "",
  targetValue: null,
  targetType: "AT_LEAST",
  unit: "",
  bscPerspective: "",
});
const editKrRaciAssignments = ref([]);
const editKrDepartments = ref([]);
const savingKr = ref(false);

function startEditKr(kr, objId = null) {
  editingKr.value = kr.id;
  editKrData.value = {
    id: kr.id,
    objectiveId: kr.objectiveId || objId || "",
    title: kr.title,
    targetValue: kr.targetValue,
    targetType: kr.targetType || "AT_LEAST",
    unit: kr.unit,
    bscPerspective: kr.bscPerspective,
  };
  editKrRaciAssignments.value = (kr.assignments || []).map((a) => ({
    userId: a.userId || a.user?.id,
    raciRole: a.raciRole,
  }));
  editKrDepartments.value = (kr.departments || [])
    .map((d) => (typeof d === "string" ? d : d.department || d.name || ""))
    .filter(Boolean);
}

async function submitEditKr() {
  if (!editKrData.value.title.trim()) return;
  if (
    editKrData.value.targetValue === null ||
    editKrData.value.targetValue <= 0
  )
    return;

  if (editKrRaciAssignments.value.length > 0) {
    const responsibles = editKrRaciAssignments.value.filter(
      (a) => a.raciRole === "RESPONSIBLE",
    );
    const accountables = editKrRaciAssignments.value.filter(
      (a) => a.raciRole === "ACCOUNTABLE",
    );
    if (responsibles.length !== 1) {
      alert("Harus memilih tepat 1 Responsible!");
      return;
    }
    if (accountables.length < 1) {
      alert("Harus memilih minimal 1 Accountable!");
      return;
    }
  }

  savingKr.value = true;
  try {
    await $fetch(
      `${config.public.apiBase}/key-results/${editKrData.value.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: {
          objectiveId: editKrData.value.objectiveId,
          title: editKrData.value.title,
          targetValue: editKrData.value.targetValue,
          targetType: editKrData.value.targetType || "AT_LEAST",
          unit: editKrData.value.unit,
          bscPerspective: editKrData.value.bscPerspective,
        },
      },
    );

    if (
      editKrRaciAssignments.value.length > 0 ||
      editKrDepartments.value.length > 0
    ) {
      await $fetch(
        `${config.public.apiBase}/key-results/${editKrData.value.id}/assign`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${auth.token}` },
          body: {
            assignments: editKrRaciAssignments.value,
            departments: editKrDepartments.value,
          },
        },
      );
    }

    const targetKrId = editKrData.value.id;
    editingKr.value = null;
    editKrRaciAssignments.value = [];
    editKrDepartments.value = [];
    await fetchObjectives({ silent: true });
    scrollToKr(targetKrId);
  } catch (err) {
    console.error("Edit KR error:", err);
    alert(err.data?.message || "Gagal mengubah Key Result.");
  } finally {
    savingKr.value = false;
  }
}

const krToDelete = ref(null);

function deleteKr(id) {
  console.log("deleteKr called with ID:", id);
  krToDelete.value = id;
}

async function confirmDeleteKr() {
  if (!krToDelete.value) return;
  const id = krToDelete.value;
  krToDelete.value = null;
  try {
    await $fetch(`${config.public.apiBase}/key-results/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
    fetchObjectives();
  } catch (err) {
    console.error("Delete KR error:", err);
    alert(err.data?.message || "Gagal menghapus Key Result.");
  }
}

const viewMode = ref("list");

const flatKrList = computed(() => {
  const result = [];
  for (const obj of filteredObjectives.value) {
    for (const kr of obj.filteredKrs || []) {
      result.push({ obj, kr });
    }
  }
  return result;
});

const reassignTargetKr = ref(null);
const reassignDeptSelection = ref([]);
const showBulkReassignModal = ref(false);
const bulkReassignDeptSelection = ref([]);
const savingReassign = ref(false);

function startReassignDept(kr) {
  reassignTargetKr.value = kr;
  reassignDeptSelection.value = [...getKrDepartments(kr)];
}

async function submitReassignDept() {
  if (!reassignTargetKr.value) return;
  savingReassign.value = true;
  try {
    const kr = reassignTargetKr.value;
    const targetKrId = kr.id;
    await $fetch(`${config.public.apiBase}/key-results/${kr.id}/assign`, {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.token}` },
      body: {
        departments: reassignDeptSelection.value,
      },
    });

    reassignTargetKr.value = null;
    reassignDeptSelection.value = [];
    await fetchObjectives({ silent: true });
    scrollToKr(targetKrId);
  } catch (err) {
    console.error("Reassign dept error:", err);
    alert(err.data?.message || "Gagal re-assign departemen.");
  } finally {
    savingReassign.value = false;
  }
}

function openBulkReassignModal() {
  if (selectedKrIds.value.length === 0) return;
  bulkReassignDeptSelection.value = [];
  showBulkReassignModal.value = true;
}

async function submitBulkReassignDept() {
  if (
    selectedKrIds.value.length === 0 ||
    bulkReassignDeptSelection.value.length === 0
  )
    return;
  savingReassign.value = true;
  try {
    const firstSelectedId = selectedKrIds.value[0];
    for (const krId of selectedKrIds.value) {
      await $fetch(`${config.public.apiBase}/key-results/${krId}/assign`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: {
          departments: bulkReassignDeptSelection.value,
        },
      });
    }
    showBulkReassignModal.value = false;
    bulkReassignDeptSelection.value = [];
    selectedKrIds.value = [];
    await fetchObjectives({ silent: true });
    if (firstSelectedId) {
      scrollToKr(firstSelectedId);
    }
  } catch (err) {
    console.error("Bulk reassign error:", err);
    alert(err.data?.message || "Gagal re-assign massal departemen.");
  } finally {
    savingReassign.value = false;
  }
}

const selectedKrIds = ref([]);
const showBulkDeleteModal = ref(false);
const krSearch = ref("");
const filterPerspective = ref("");
const filterDepartment = ref("");
const filterPic = ref("");

const hasActiveFilters = computed(() => {
  return (
    !!filterPerspective.value ||
    !!filterDepartment.value ||
    !!filterPic.value ||
    !!krSearch.value.trim()
  );
});

function resetFilters() {
  filterPerspective.value = "";
  filterDepartment.value = "";
  filterPic.value = "";
  krSearch.value = "";
}

const filterDepartmentOptions = computed(() => {
  const map = new Map();
  for (const d of availableDepartments.value || []) {
    if (d.value) map.set(d.value.toUpperCase(), d.label || d.value);
  }
  for (const obj of objectives.value || []) {
    for (const kr of obj.keyResults || []) {
      for (const d of getKrDepartments(kr)) {
        if (d && !map.has(d.toUpperCase())) {
          map.set(d.toUpperCase(), d);
        }
      }
    }
  }
  return Array.from(map.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const filterPicOptions = computed(() => {
  const map = new Map();
  for (const u of userList.value || []) {
    if (u.id && u.name) {
      map.set(u.id, u.name);
    }
  }
  for (const obj of objectives.value || []) {
    for (const kr of obj.keyResults || []) {
      for (const a of kr.assignments || []) {
        const uid = a.userId || a.user?.id;
        const uname = getAssignmentUserName(a);
        if (uid && uname && uname !== "Pegawai" && !map.has(uid)) {
          map.set(uid, uname);
        }
      }
    }
  }
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

const hasAnyKrs = computed(() => {
  return (objectives.value || []).some(
    (o) => (o.keyResults || []).length > 0,
  );
});

const filteredObjectives = computed(() => {
  const q = krSearch.value.trim().toLowerCase();
  const persp = filterPerspective.value;
  const dept = filterDepartment.value
    ? filterDepartment.value.toUpperCase()
    : "";
  const pic = filterPic.value;

  return (objectives.value || [])
    .map((obj) => ({
      ...obj,
      filteredKrs: (obj.keyResults || []).filter((kr) => {
        // 1. Text Search
        if (q && !kr.title.toLowerCase().includes(q)) {
          return false;
        }

        // 2. BSC Perspective
        if (persp && String(kr.bscPerspective || "").toUpperCase() !== persp) {
          return false;
        }

        // 3. Department
        if (dept) {
          const krDepts = getKrDepartments(kr).map((d) => d.toUpperCase());
          if (!krDepts.includes(dept)) {
            return false;
          }
        }

        // 4. PIC RACI
        if (pic) {
          const assignments = kr.assignments || [];
          const hasPic = assignments.some(
            (a) => a.userId === pic || a.user?.id === pic,
          );
          if (!hasPic) {
            return false;
          }
        }

        return true;
      }),
    }))
    .filter((obj) => obj.filteredKrs.length > 0);
});

watch([filterPerspective, filterDepartment, filterPic, krSearch], () => {
  selectedKrIds.value = [];
});

const allDisplayedKrs = computed(() => {
  const krsList = [];
  for (const obj of filteredObjectives.value) {
    krsList.push(...obj.filteredKrs);
  }
  return krsList;
});

const isAllKrsSelected = computed(() => {
  if (allDisplayedKrs.value.length === 0) return false;
  return allDisplayedKrs.value.every((kr) =>
    selectedKrIds.value.includes(kr.id),
  );
});

function toggleSelectAllKrs() {
  if (isAllKrsSelected.value) {
    const displayedIds = new Set(allDisplayedKrs.value.map((kr) => kr.id));
    selectedKrIds.value = selectedKrIds.value.filter(
      (id) => !displayedIds.has(id),
    );
  } else {
    const set = new Set(selectedKrIds.value);
    for (const kr of allDisplayedKrs.value) {
      set.add(kr.id);
    }
    selectedKrIds.value = Array.from(set);
  }
}

function triggerBulkDelete() {
  if (selectedKrIds.value.length === 0) return;
  showBulkDeleteModal.value = true;
}

async function confirmBulkDeleteKrs() {
  showBulkDeleteModal.value = false;
  const idsToDelete = [...selectedKrIds.value];
  selectedKrIds.value = [];
  try {
    await $fetch(`${config.public.apiBase}/key-results/bulk-delete`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: { ids: idsToDelete },
    });
    fetchObjectives();
  } catch (err) {
    console.error("Bulk delete KR error:", err);
    alert(err.data?.message || "Gagal menghapus Key Results terpilih.");
  }
}

onMounted(() => {
  fetchObjectives();
  fetchAllObjectivesForDropdown();
  fetchUserList();
  fetchTeams();
  fetchDepartments();
});

// --- Inisiatif & Task State & Logic ---
const expandedKrId = ref(null);
const allTeams = ref([]);
const showIniModal = ref(false);
const editingIni = ref(null);
const selectedKrForIni = ref(null);
const iniForm = ref({
  title: "",
  description: "",
  teamId: "",
  ownerId: "",
  targetValue: 0,
  unit: "",
});
const savingIni = ref(false);

const employeeSearch = ref("");
const teamSearch = ref("");

const filteredUsersForDropdown = computed(() => {
  if (!employeeSearch.value.trim()) return userList.value;
  const q = employeeSearch.value.toLowerCase();
  return userList.value.filter(
    (u) => u.name && u.name.toLowerCase().includes(q),
  );
});

const filteredTeamsForDropdown = computed(() => {
  if (!teamSearch.value.trim()) return allTeams.value;
  const q = teamSearch.value.toLowerCase();
  return allTeams.value.filter(
    (t) => t.name && t.name.toLowerCase().includes(q),
  );
});

const showTaskModal = ref(false);
const selectedIniForTask = ref(null);
const taskForm = ref({
  title: "",
  targetValue: null,
  unit: "%",
  targetType: "AT_LEAST",
});
const savingTask = ref(false);

function toggleInitiatives(krId) {
  expandedKrId.value = expandedKrId.value === krId ? null : krId;
}

function openAddInitiativeFor(kr) {
  editingIni.value = null;
  selectedKrForIni.value = kr;
  employeeSearch.value = "";
  teamSearch.value = "";
  iniForm.value = {
    title: "",
    description: "",
    teamId: "",
    ownerId: "",
    targetValue: 0,
    unit: "",
  };
  showIniModal.value = true;
}

function startEditInitiative(ini, kr) {
  editingIni.value = ini;
  selectedKrForIni.value = kr || ini.keyResult;
  employeeSearch.value = "";
  teamSearch.value = "";
  iniForm.value = {
    title: ini.title,
    description: ini.description || "",
    teamId: ini.teamId || "",
    ownerId: ini.ownerId || "",
    targetValue: ini.targetValue || 0,
    unit: ini.unit || "",
  };
  showIniModal.value = true;
}

async function deleteInitiative(id) {
  const ok = await confirmDialog(
    "Apakah Anda yakin ingin menghapus Inisiatif ini beserta seluruh Task di dalamnya?",
  );
  if (!ok) return;
  try {
    const token =
      auth.token ||
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("auth_token") || localStorage.getItem("token")
        : "");
    await $fetch(`${config.public.apiBase}/initiatives/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    fetchObjectives();
  } catch (err) {
    console.error("Delete initiative error:", err);
    alert(err.data?.message || err.message || "Gagal menghapus Inisiatif.");
  }
}

function onIniOwnerChange() {
  if (iniForm.value.ownerId) {
    const selectedUser = userList.value.find(
      (u) => u.id === iniForm.value.ownerId,
    );
    if (selectedUser?.department) {
      const matchingTeam = allTeams.value.find(
        (t) => t.department === selectedUser.department,
      );
      if (matchingTeam) {
        iniForm.value.teamId = matchingTeam.id;
      }
    }
  }
}

function openAddTaskFor(ini) {
  selectedIniForTask.value = ini;
  taskForm.value = { title: "", targetValue: null, unit: "%" };
  showTaskModal.value = true;
}

async function fetchTeams() {
  try {
    const res = await $fetch(`${config.public.apiBase}/users/teams`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    allTeams.value = res;
  } catch (err) {
    console.error("Error fetching teams:", err);
  }
}

async function saveInitiativeForKr() {
  if (!iniForm.value.title || !iniForm.value.teamId) {
    alert("Judul dan Tim wajib diisi!");
    return;
  }
  savingIni.value = true;
  try {
    if (editingIni.value) {
      await $fetch(
        `${config.public.apiBase}/initiatives/${editingIni.value.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
          body: iniForm.value,
        },
      );
    } else {
      await $fetch(`${config.public.apiBase}/initiatives`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: {
          ...iniForm.value,
          keyResultId: selectedKrForIni.value.id,
        },
      });
    }
    showIniModal.value = false;
    editingIni.value = null;
    fetchObjectives(); // Reload to show new initiative
  } catch (err) {
    console.error("Save initiative error:", err);
    alert(err.data?.message || "Gagal menyimpan inisiatif.");
  } finally {
    savingIni.value = false;
  }
}

async function saveTaskForInitiative() {
  if (!taskForm.value.title || taskForm.value.targetValue === null) {
    alert("Judul dan Target Nilai Task wajib diisi!");
    return;
  }
  if (!taskForm.value.unit || !taskForm.value.unit.trim()) {
    alert("Satuan (Unit) wajib diisi!");
    return;
  }
  savingTask.value = true;
  try {
    await $fetch(
      `${config.public.apiBase}/initiatives/${selectedIniForTask.value.id}/tasks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: taskForm.value,
      },
    );
    showTaskModal.value = false;
    taskForm.value = {
      title: "",
      targetValue: null,
      unit: "%",
      targetType: "AT_LEAST",
    };
    fetchObjectives(); // Reload
  } catch (err) {
    console.error("Save Task error:", err);
    alert(err.data?.message || "Gagal menyimpan Task.");
  } finally {
    savingTask.value = false;
  }
}
</script>

<style scoped>
@import url("https://fonts.google.com/share?selection.family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900|Rubik:ital,wght@0,300..900;1,300..900");

.admin-root {
  font-family: "Rubik", sans-serif;
  background: var(--content-bg);
  color: var(--text-color);
  padding: 30px 0 50px 0;
}

/* Header Styles */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
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
  margin-bottom: 6px;
  transition: color 0.3s;
}

.back-link:hover {
  color: #00d2ff;
}

.header-brand h1 {
  font-size: 25px;
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
  font-size: 14px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  letter-spacing: 0.5px;
}

.user-badge.admin {
  background: rgba(255, 75, 75, 0.15);
  color: #ff8888;
  border: 1px solid rgba(255, 75, 75, 0.3);
}

.user-name {
  font-size: 17px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

/* Layout Content */
.admin-content {
  display: grid;
  grid-template-columns: 1.1fr 1.3fr;
  gap: 30px;
  max-width: 1400px;
  margin: 30px auto 0 auto;
  padding: 0 30px;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

@media (max-width: 1024px) {
  .admin-content {
    grid-template-columns: 1fr;
  }
}

.card {
  background: rgba(255, 255, 255, 0.03);
  border: 1.5px solid var(--card-border);
  border-radius: 16px;
  padding: 30px;
}

h2 {
  font-size: 23px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.section-desc {
  font-size: 17px;
  color: var(--color-primary-shade);
  margin: 20px 0 24px 0;
}

/* Form Styles */
.okr-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-gamma-050);
}

input[type="text"],
input[type="number"],
textarea,
select {
  background: var(--color-field);
  border: 1.5px solid var(--color-gamma-750);
  border-radius: 8px;
  padding: 12px 14px;
  color: var(--color-gamma-065);
  font-family: inherit;
  font-size: 17px;
  transition: all 0.3s;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #0088ff;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(0, 136, 255, 0.2);
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-group.half {
  width: 50%;
}

.form-group.third {
  width: 30%;
}

.divider {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin: 10px 0;
}

/* KR Builder Row Card */
.kr-builder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.kr-builder-header h3 {
  font-size: 19px;
  font-weight: 600;
  margin: 0;
}

.add-kr-btn {
  background: transparent;
  border: 3px solid var(--color-primary);
  color: var(--color-primary-shade);
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.add-kr-btn:hover {
  background: var(--color-primary);
  transform: translateY(-1px);
  color: white;
}

.empty-kr-alert {
  background: rgba(255, 75, 75, 0.08);
  border: 1px solid rgba(255, 75, 75, 0.2);
  color: #ff8888;
  padding: 12px;
  border-radius: 8px;
  font-size: 16px;
  text-align: center;
}

.kr-row-card {
  background: var(--color-field);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.kr-row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kr-row-header h4 {
  font-size: 16px;
  margin: 0;
  color: var(--color-primary-shade);
  font-weight: 600;
}

.remove-kr-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  font-size: 17px;
  padding: 4px;
  transition: color 0.3s;
}

.remove-kr-btn:hover {
  color: #ff6666;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.save-btn {
  background: var(--color-primary);
  border: none;
  color: white;
  padding: 14px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 17px;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.save-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
  box-shadow: none;
}

.error-msg {
  color: #ff8888;
  background: rgba(255, 75, 75, 0.1);
  border-left: 3px solid #ff4b4b;
  padding: 10px 14px;
  border-radius: 4px;
  font-size: 16px;
  margin: 0;
}

.success-msg {
  color: var(--color-green);
  background: rgba(75, 255, 75, 0.1);
  border-left: 3px solid #4bff4b;
  padding: 10px 14px;
  border-radius: 4px;
  font-size: 16px;
  margin: 0;
}

/* List Column Styles */
.list-section.card {
  color: #171c20;
}

.list-section.card,
.list-section.card h2,
.list-section.card h3,
.list-section.card label,
.list-section.card select,
.list-section.card .kr-search-input,
.list-section.card .select-all-label,
.list-section.card .table-obj-title,
.list-section.card .table-kr-title,
.list-section.card .kr-title,
.list-section.card .kr-stats,
.list-section.card .kr-data-table th,
.list-section.card .kr-data-table td,
.list-section.card .year-badge,
.list-section.card .dept-badge,
.list-section.card .kr-dept-chip,
.list-section.card .pic-chip,
.list-section.card .perspective-badge,
.list-section.card .status-badge {
  color: #171c20;
}

/* Badge & Chip blend colors in .list-section.card */
.list-section.card .year-badge,
.list-section.card .table-year-badge {
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  color: #171c20;
}

.list-section.card .dept-badge {
  background: #ede9fe;
  border: 1px solid #ddd6fe;
  color: #171c20;
}

.list-section.card .kr-dept-chip {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #171c20;
}

.list-section.card .pic-chip {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #171c20;
}

.list-section.card .pic-chip.responsible {
  background: #dcfce7;
  border-color: #86efac;
  color: #171c20;
}

.list-section.card .pic-chip.accountable {
  background: #ede9fe;
  border-color: #c4b5fd;
  color: #171c20;
}

.list-section.card .pic-chip.consulted {
  background: #e0f2fe;
  border-color: #7dd3fc;
  color: #171c20;
}

.list-section.card .pic-chip.informed {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #171c20;
}

.list-section.card .perspective-badge {
  color: #171c20;
  font-weight: 600;
}

.list-section.card .perspective-badge.financial {
  background: #e0f2fe;
  border: 1px solid #7dd3fc;
  color: #171c20;
}

.list-section.card .perspective-badge.customer {
  background: #fef3c7;
  border: 1px solid #fde68a;
  color: #171c20;
}

.list-section.card .perspective-badge.internal_process {
  background: #ede9fe;
  border: 1px solid #c4b5fd;
  color: #171c20;
}

.list-section.card .perspective-badge.learning_growth {
  background: #dcfce7;
  border: 1px solid #86efac;
  color: #171c20;
}

.list-section.card .status-badge {
  color: #171c20;
  font-weight: 600;
}

.list-section.card .status-badge.ontrack {
  background: #dcfce7;
  border: 1px solid #86efac;
  color: #171c20;
}

.list-section.card .status-badge.atrisk {
  background: #fef9c3;
  border: 1px solid #fde047;
  color: #171c20;
}

.list-section.card .status-badge.offtrack {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #171c20;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.list-header h2 {
  color: #171c20;
}

.kr-search-bar {
  position: relative;
  margin-bottom: 16px;
}

.kr-search-input {
  width: 100%;
  padding: 8px 36px 8px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #171c20;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.kr-search-input::placeholder {
  color: #171c20;
  opacity: 0.45;
}

.kr-search-input:focus {
  outline: none;
  border-color: rgba(96, 165, 250, 0.5);
}

.kr-search-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #171c20;
  opacity: 0.6;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  padding: 2px 4px;
}

.kr-search-clear:hover {
  opacity: 1;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-size: 16px;
  color: #171c20;
}

.filter-group select {
  padding: 6px 12px;
  font-size: 16px;
  color: #171c20;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 40px;
  color: #171c20;
  opacity: 0.7;
  font-size: 17px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px dashed rgba(0, 0, 0, 0.12);
  border-radius: 12px;
}

.objectives-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 700px;
  overflow-y: auto;
  padding-right: 8px;
}

.objectives-list::-webkit-scrollbar {
  width: 6px;
}

.objectives-list::-webkit-scrollbar-track {
  background: transparent;
}

.objectives-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.objectives-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.objective-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1.5px solid var(--color-gamma-850);
  border-radius: 12px;
  padding: 20px;
}

.objective-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.obj-header-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.year-badge {
  background: rgba(0, 136, 255, 0.15);
  color: #8cc4ff;
  font-size: 14px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
}

.dept-badge {
  background: rgba(147, 51, 234, 0.15);
  color: #c084fc;
  border: 1px solid rgba(147, 51, 234, 0.3);
  font-size: 12px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  display: inline-block;
  letter-spacing: 0.3px;
}

.objective-item-header h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #171c20;
}

.obj-desc {
  font-size: 16px;
  color: #171c20;
  opacity: 0.7;
  margin: 6px 0 0 0;
}

.edit-obj-btn {
  background: rgba(37, 99, 235, 0.1);
  border: 1px solid rgba(37, 99, 235, 0.2);
  color: #60a5fa;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.edit-obj-btn:hover {
  background: rgba(37, 99, 235, 0.2);
  border-color: rgba(37, 99, 235, 0.4);
}

.delete-obj-btn {
  background: rgba(255, 75, 75, 0.1);
  border: 1px solid rgba(255, 75, 75, 0.2);
  color: #ff8888;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.delete-obj-btn:hover {
  background: rgba(255, 75, 75, 0.2);
  border-color: rgba(255, 75, 75, 0.4);
}

.key-results-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 14px;
}

.kr-list-row {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.01);
  border: 1.5px solid var(--card-gamma-650);
  border-radius: 8px;
  overflow: hidden;
}

.kr-list-row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
}

.kr-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kr-title {
  font-size: 14px;
  border: 1.5px solid var(--card-gamma-650);
  color: #171c20;
}

.kr-stats {
  font-size: 14px;
  color: #171c20;
}

.status-badge {
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 10px;
  text-transform: uppercase;
  margin-left: 6px;
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

.perspective-badge {
  font-size: 10px;
  font-weight: 500;
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

.kr-actions-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kr-action-buttons {
  display: flex;
  gap: 6px;
}

.edit-kr-btn {
  background: transparent;
  border: 1.5px solid var(--card-border);
  color: var(--color-primary-shade);
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.edit-kr-btn:hover {
  background: rgba(0, 210, 255, 0.2);
}

.delete-kr-btn {
  background: transparent;
  border: 1.5px solid var(--card-border);
  color: var(--color-red);
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.delete-kr-btn:hover {
  background: rgba(255, 75, 75, 0.2);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-card {
  background: var(--card-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: calc(100dvh - 32px);
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  color: var(--color-gamma-065);
  box-sizing: border-box;
}

.modal-box {
  background: var(--card-bg, #1e293b);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: calc(100dvh - 32px);
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  color: var(--color-gamma-065);
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.modal-close-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--text-color, #e2e8f0);
  font-size: 22px;
  line-height: 1;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background: rgba(255, 75, 75, 0.2);
  border-color: rgba(255, 75, 75, 0.5);
  color: #ff6b6b;
  transform: scale(1.05);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 4px solid #ff4b4b;
  color: #ff4b4b;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.save-kr-btn {
  background: var(--color-primary);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.save-kr-btn:hover {
  transform: translateY(-1px);
}

/* RACI Section Styles */
.raci-section {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.75rem;
}

.raci-section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.raci-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gamma-050, #e2e8f0);
}

.raci-hint {
  font-size: 0.75rem;
  color: var(--color-gamma-400, #94a3b8);
}

.raci-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.raci-role-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-primary-shade, #94a3b8);
}

.raci-role-desc {
  font-weight: 400;
  color: var(--color-gamma-300);
}

.raci-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
}

.r-badge {
  background: #0e97d6;
}
.a-badge {
  background: #7c3aed;
}
.dept-badge {
  background: #059669;
  font-size: 0.8rem;
}

.assignee-multi-select {
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 0.5rem;
  max-height: 160px;
  overflow-y: auto;
  background: var(--color-field);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.assignee-checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 150ms ease;
  font-size: 0.85rem;
  color: var(--color-gamma-050, #e2e8f0);
}

.assignee-checkbox-item:hover,
.assignee-checkbox-item.selected {
  background: rgba(255, 255, 255, 0.06);
}

.assignee-checkbox-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.assignee-name {
  flex: 1;
  font-weight: 500;
}

.assignee-position-badge {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border-radius: 4px;
  font-weight: 500;
}

.assignee-dept-badge {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  background: rgba(14, 151, 214, 0.15);
  color: #0e97d6;
  border-radius: 4px;
  font-weight: 600;
}

.assignee-role-badge {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  background: rgba(5, 150, 105, 0.15);
  color: #10b981;
  border-radius: 4px;
  font-weight: 600;
}

.assignee-empty-hint {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.8rem;
  text-align: center;
  padding: 0.5rem;
}

.dept-multi-select {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.5rem;
  background: var(--color-field);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}

.dept-checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 150ms ease;
  background: rgba(255, 255, 255, 0.02);
  color: var(--color-gamma-050, #e2e8f0);
}

.dept-checkbox-item:hover,
.dept-checkbox-item.selected {
  background: rgba(14, 151, 214, 0.15);
  border-color: #0e97d6;
  color: #0e97d6;
}

/* .dept-icon {
  font-size: 0.85rem;
} */
.dept-name {
  font-weight: 500;
}

/* Initiatives Section */
.kr-initiatives-section {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.2);
}

.initiatives-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.03);
  transition: background 0.2s;
}

.initiatives-header:hover {
  background: rgba(255, 255, 255, 0.06);
}

.ini-count-badge {
  font-size: 13px;
  color: var(--color-primary);
  font-weight: 500;
}

.ini-toggle-icon {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
}

.initiatives-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.initiative-row {
  display: flex;
  align-items: stretch;
  gap: 12px;
}

.ini-connector-line {
  width: 2px;
  background: rgba(0, 210, 255, 0.3);
  margin-left: 8px;
  border-radius: 2px;
}

.ini-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 10px 12px;
}

.ini-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  flex-wrap: wrap;
  gap: 8px;
}

.ini-meta-chips {
  display: flex;
  align-items: center;
  gap: 6px;
}

.kr-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.meta-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.kr-dept-chip {
  background: #cae6ff;
  color: #001e30;
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
}

.pic-chip {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(14, 151, 214, 0.15);
  border: 1px solid rgba(14, 151, 214, 0.3);
  color: #38bdf8;
  border-radius: 12px;
}

.pic-chip.responsible {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
}

.pic-chip.accountable {
  background: rgba(124, 58, 237, 0.15);
  border-color: rgba(124, 58, 237, 0.3);
  color: #c084fc;
}

.ini-actions-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ini-action-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.ini-action-btn.edit:hover {
  background: rgba(0, 210, 255, 0.2);
  border-color: rgba(0, 210, 255, 0.4);
}

.ini-action-btn.delete:hover {
  background: rgba(255, 75, 75, 0.2);
  border-color: rgba(255, 75, 75, 0.4);
}

.ini-title {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

.team-chip {
  font-size: 11px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.ini-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 8px 0;
}

.task-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.task-chip {
  font-size: 11px;
  padding: 3px 8px;
  background: rgba(0, 210, 255, 0.1);
  border: 1px solid rgba(0, 210, 255, 0.2);
  color: var(--color-primary);
  border-radius: 4px;
}

.task-empty {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
}

.ini-task-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.add-task-chip-btn {
  background: rgba(0, 210, 255, 0.08);
  border: 1px dashed rgba(0, 210, 255, 0.4);
  color: var(--color-primary);
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-task-chip-btn:hover {
  background: rgba(0, 210, 255, 0.2);
  border-style: solid;
}

.add-ini-btn {
  align-self: flex-start;
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.6);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 22px;
}

.add-ini-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.6);
  color: #fff;
}

.searchable-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.search-mini-input {
  width: 100%;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: var(--text-color, #fff);
  font-size: 13px;
  box-sizing: border-box;
  transition: all 0.2s;
}

.search-mini-input:focus {
  outline: none;
  border-color: var(--color-primary, #00d2ff);
  background: rgba(255, 255, 255, 0.08);
}

/* Toolbar & View Switcher */
.kr-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-filter-select {
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  color: #171c20;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
  max-width: 160px;
}

.toolbar-filter-select:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
}

.toolbar-filter-select option {
  background: #ffffff;
  color: #171c20;
}

.toolbar-reset-btn {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-reset-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.dark-theme .toolbar-filter-select {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
  color: #f1f5f9;
}

.dark-theme .toolbar-filter-select option {
  background: #1e293b;
  color: #f1f5f9;
}

.select-all-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #171c20;
  cursor: pointer;
}

.view-switch-pills {
  display: inline-flex;
  background: rgba(255, 255, 255, 0.05);
  padding: 3px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  gap: 2px;
}

.view-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: #171c20;
  opacity: 0.7;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.view-pill-btn:hover {
  opacity: 1;
}

.view-pill-btn.active {
  background: rgba(0, 210, 255, 0.18);
  color: #0284c7;
  opacity: 1;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.bulk-reassign-btn {
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.4);
  color: #c084fc;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.bulk-reassign-btn:hover {
  background: rgba(168, 85, 247, 0.25);
}

.bulk-delete-btn {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #f87171;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.bulk-delete-btn:hover {
  background: rgba(239, 68, 68, 0.25);
}

/* KR Table / List View */
.kr-table-container {
  overflow-x: auto;
  border: 1.5px solid var(--color-gamma-850);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  max-height: 700px;
  overflow-y: auto;
}

.kr-data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
  color: #171c20;
}

.kr-data-table thead {
  position: sticky;
  top: 0;
  background: var(--color-field, #f1f5f9);
  z-index: 2;
}

.kr-data-table th {
  padding: 12px 14px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #171c20;
  opacity: 0.8;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.kr-table-row {
  transition: background 0.15s ease;
  color: #171c20;
  scroll-margin-top: 50px;
}

.kr-table-row.highlighted-row {
  background: rgba(0, 210, 255, 0.12) !important;
  transition: background 0.5s ease;
}

.kr-list-row.highlighted-row {
  border-color: #00d2ff !important;
  box-shadow: 0 0 12px rgba(0, 210, 255, 0.25);
  transition: all 0.5s ease;
}

.kr-table-row:hover {
  background: rgba(0, 0, 0, 0.02);
}

.kr-table-row td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  vertical-align: middle;
  color: #171c20;
}

.table-obj-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.table-year-badge {
  font-size: 11px;
  padding: 1px 6px;
  align-self: flex-start;
}

.table-obj-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.table-obj-title {
  font-weight: 600;
  color: #171c20;
  font-size: 13px;
  line-height: 1.3;
}

.table-obj-edit-btn {
  background: transparent;
  border: none;
  color: #171c20;
  opacity: 0.6;
  cursor: pointer;
  padding: 1px 4px;
  font-size: 12px;
  border-radius: 3px;
  line-height: 1;
}

.table-obj-edit-btn:hover {
  color: #38bdf8;
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

.table-kr-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.table-kr-title {
  font-weight: 600;
  color: #171c20;
  font-size: 13px;
  line-height: 1.35;
}

.table-dept-cell,
.table-pic-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.table-actions-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.table-action-btn {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 5px;
}

.reassign-kr-btn {
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.35);
  color: #c084fc;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.reassign-kr-btn:hover {
  background: rgba(168, 85, 247, 0.22);
  border-color: rgba(168, 85, 247, 0.6);
  color: #2f0086;
}
</style>

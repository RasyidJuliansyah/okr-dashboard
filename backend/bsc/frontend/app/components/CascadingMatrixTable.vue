<template>
  <div class="matrix-table-container">
    <table class="matrix-table">
      <thead>
        <tr>
          <th style="width: 34%">Hierarki & Nama Item</th>
          <th style="width: 10%">Level</th>
          <th style="width: 12%">Aspek BSC</th>
          <th style="width: 12%">Team / PIC</th>
          <th style="width: 12%">Target & Realisasi</th>
          <th style="width: 10%">Progres</th>
          <th style="width: 10%">Status</th>
        </tr>
      </thead>
      <tbody>
        <!-- Root BSC Row -->
        <tr
          class="row-root"
          @click.stop="toggleCollapse('root')"
          @click="
            $emit('select-node', {
              id: 'root',
              type: 'ROOT',
              title: 'BSC-OKR Suite',
              description: 'Skolla Strategy FY 2026',
              progress: rootAvgProgress,
              lineage: { root: 'BSC-OKR Suite' },
            })
          "
        >
          <td>
            <div class="item-name-cell indent-0">
              <button
                type="button"
                class="toggle-btn"
                ,
                @click.stop="toggleCollapse('root')"
              >
                <svg
                  class="chevron-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 12 12"
                >
                  <title>chevron-right-12</title>
                  <path
                    fill="currentColor"
                    d="M4.7 10c-.2 0-.4-.1-.5-.2c-.3-.3-.3-.8 0-1.1L6.9 6L4.2 3.3c-.3-.3-.3-.8 0-1.1s.8-.3 1.1 
                0l3.3 3.2c.3.3.3.8 0 1.1L5.3 9.7q-.3.3-.6.3"
                  />
                </svg>
              </button>
              <span class="root-bullet"></span>
              <span class="cell-title font-extrabold text-blue-950"
                >BSC-OKR Suite (Corporate)</span
              >
              <span class="badge-count">4 Aspek</span>
            </div>
          </td>
          <td><span class="level-tag root">Root BSC</span></td>
          <td><span class="bsc-pill">Semua Aspek</span></td>
          <td><span class="text-muted">Corporate</span></td>
          <td><span class="text-muted">-</span></td>
          <td>
            <div class="prog-inline">
              <span class="prog-text">{{ rootAvgProgress }}%</span>
              <div class="mini-bar">
                <div
                  class="mini-bar-fill"
                  :style="{
                    width: rootAvgProgress + '%',
                    backgroundColor: '#1e3a5f',
                  }"
                ></div>
              </div>
            </div>
          </td>
          <td>
            <span
              class="status-badge"
              :class="
                rootAvgProgress >= 70
                  ? 'on-track'
                  : rootAvgProgress >= 40
                    ? 'at-risk'
                    : 'off-track'
              "
            >
              {{
                rootAvgProgress >= 70
                  ? "ON TRACK"
                  : rootAvgProgress >= 40
                    ? "AT RISK"
                    : "OFF TRACK"
              }}
            </span>
          </td>
        </tr>

        <!-- When Root is expanded, render 4 pillars -->
        <template v-if="isExpanded('root')">
          <template v-for="p in perspectives" :key="p.id">
            <!-- Pillar Row -->
            <tr
              @click.stop="toggleCollapse(p.id)"
              class="row-pillar"
              @click="
                $emit('select-node', {
                  ...p,
                  type: 'PILLAR',
                  lineage: { root: 'BSC-OKR Suite', pillar: p.name },
                })
              "
            >
              <td>
                <div class="item-name-cell indent-1">
                  <button
                    type="button"
                    class="toggle-btn"
                    @click.stop="toggleCollapse(p.id)"
                  >
                    <svg
                      class="chevron-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="0 0 12 12"
                    >
                      <title>chevron-right-12</title>
                      <path
                        fill="currentColor"
                        d="M4.7 10c-.2 0-.4-.1-.5-.2c-.3-.3-.3-.8 0-1.1L6.9 6L4.2 3.3c-.3-.3-.3-.8 0-1.1s.8-.3 1.1 
                        0l3.3 3.2c.3.3.3.8 0 1.1L5.3 9.7q-.3.3-.6.3"
                      />
                    </svg>
                  </button>
                  <span
                    class="pillar-bullet"
                    :style="{ backgroundColor: p.color }"
                  ></span>
                  <span class="cell-title font-bold">{{ p.name }}</span>
                  <span class="badge-count">{{ p.totalKrs }} KRs</span>
                </div>
              </td>
              <td><span class="level-tag pillar">Pilar BSC</span></td>
              <td>
                <span class="bsc-pill">{{ p.name }}</span>
              </td>
              <td><span class="text-muted">Semua Tim</span></td>
              <td><span class="text-muted">-</span></td>
              <td>
                <div class="prog-inline">
                  <span class="prog-text">{{ p.averageProgress }}%</span>
                  <div class="mini-bar">
                    <div
                      class="mini-bar-fill"
                      :style="{
                        width: p.averageProgress + '%',
                        backgroundColor: p.color,
                      }"
                    ></div>
                  </div>
                </div>
              </td>
              <td>
                <span
                  class="status-badge"
                  :class="
                    p.averageProgress >= 70
                      ? 'on-track'
                      : p.averageProgress >= 40
                        ? 'at-risk'
                        : 'off-track'
                  "
                >
                  {{
                    p.averageProgress >= 70
                      ? "ON TRACK"
                      : p.averageProgress >= 40
                        ? "AT RISK"
                        : "OFF TRACK"
                  }}
                </span>
              </td>
            </tr>

            <!-- Objectives under Pillar -->
            <template v-if="isExpanded(p.id)">
              <template v-for="obj in p.objectives" :key="obj.id">
                <tr
                  class="row-obj"
                  @click="
                    $emit('select-node', {
                      ...obj,
                      type: 'OBJECTIVE',
                      perspective: p.name,
                      lineage: {
                        root: 'BSC-OKR Suite',
                        pillar: p.name,
                        objective: obj.title,
                      },
                    })
                  "
                >
                  <td>
                    <div class="item-name-cell indent-2">
                      <button
                        type="button"
                        class="toggle-btn"
                        @click.stop="toggleCollapse(obj.id)"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="1em"
                          height="1em"
                          viewBox="0 0 12 12"
                        >
                          <title>chevron-right-12</title>
                          <path
                            fill="currentColor"
                            d="M4.7 10c-.2 0-.4-.1-.5-.2c-.3-.3-.3-.8 0-1.1L6.9 6L4.2 3.3c-.3-.3-.3-.8 
                                    0-1.1s.8-.3 1.1 0l3.3 3.2c.3.3.3.8 0 1.1L5.3 9.7q-.3.3-.6.3"
                          />
                        </svg>
                      </button>
                      <span class="cell-title font-semibold">{{
                        obj.title
                      }}</span>
                    </div>
                  </td>
                  <td><span class="level-tag obj">Objective</span></td>
                  <td>
                    <span class="bsc-pill-sub">{{ p.name }}</span>
                  </td>
                  <td>
                    <span class="text-muted">{{
                      obj.quarter || obj.year || "Corporate"
                    }}</span>
                  </td>
                  <td><span class="text-muted">-</span></td>
                  <td>
                    <div class="prog-inline">
                      <span class="prog-text">{{ obj.progress }}%</span>
                      <div class="mini-bar">
                        <div
                          class="mini-bar-fill"
                          :style="{ width: obj.progress + '%' }"
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      class="status-badge"
                      :class="obj.status?.toLowerCase().replace('_', '-')"
                    >
                      {{ formatStatus(obj.status) }}
                    </span>
                  </td>
                </tr>

                <!-- Key Results under Objective -->
                <template v-if="isExpanded(obj.id)">
                  <template v-for="kr in obj.keyResults" :key="kr.id">
                    <tr
                      class="row-kr"
                      @click="
                        $emit('select-node', {
                          ...kr,
                          type: 'KR',
                          perspective: p.name,
                          objectiveTitle: obj.title,
                          objectiveId: obj.id,
                          siblingKrs: obj.keyResults?.filter(
                            (s: any) => s.id !== kr.id,
                          ),
                          lineage: {
                            root: 'BSC-OKR Suite',
                            pillar: p.name,
                            objective: obj.title,
                            team: kr.departments?.[0] || 'Lintas Tim',
                            kr: kr.title,
                          },
                        })
                      "
                    >
                      <td>
                        <div class="item-name-cell indent-3">
                          <button
                            type="button"
                            class="toggle-btn"
                            @click.stop="toggleCollapse(kr.id)"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="1em"
                              height="1em"
                              viewBox="0 0 12 12"
                            >
                              <title>chevron-right-12</title>
                              <path
                                fill="currentColor"
                                d="M4.7 10c-.2 0-.4-.1-.5-.2c-.3-.3-.3-.8 0-1.1L6.9 6L4.2 3.3c-.3-.3-.3-.8 
                                    0-1.1s.8-.3 1.1 0l3.3 3.2c.3.3.3.8 0 1.1L5.3 9.7q-.3.3-.6.3"
                              />
                            </svg>
                          </button>
                          <span class="cell-title font-medium">{{
                            kr.title
                          }}</span>
                          <span
                            v-if="kr.initiatives?.length"
                            class="badge-count-sub"
                            >{{ kr.initiatives.length }} Init</span
                          >
                        </div>
                      </td>
                      <td><span class="level-tag kr">Key Result</span></td>
                      <td>
                        <span class="bsc-pill-sub">{{ p.name }}</span>
                      </td>
                      <td>
                        <span class="text-dept">{{
                          kr.departments?.join(", ") || "Lintas Tim"
                        }}</span>
                      </td>
                      <td>
                        <div class="target-col">
                          <span
                            >T: {{ formatVal(kr.targetValue, kr.unit) }}</span
                          >
                          <span class="text-success"
                            >R: {{ formatVal(kr.currentValue, kr.unit) }}</span
                          >
                        </div>
                      </td>
                      <td>
                        <div class="prog-inline">
                          <span class="prog-text">{{ kr.progress }}%</span>
                          <div class="mini-bar">
                            <div
                              class="mini-bar-fill"
                              :style="{ width: kr.progress + '%' }"
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          class="status-badge"
                          :class="kr.status?.toLowerCase().replace('_', '-')"
                        >
                          {{ formatStatus(kr.status) }}
                        </span>
                      </td>
                    </tr>

                    <!-- Initiatives under KR -->
                    <template v-if="isExpanded(kr.id)">
                      <template v-for="init in kr.initiatives" :key="init.id">
                        <tr
                          class="row-init"
                          @click="
                            $emit('select-node', {
                              ...init,
                              type: 'INITIATIVE',
                              parentKr: kr,
                              perspective: p.name,
                              objectiveTitle: obj.title,
                              krTitle: kr.title,
                              siblingKrs: obj.keyResults?.filter(
                                (s: any) => s.id !== kr.id,
                              ),
                              lineage: {
                                root: 'BSC-OKR Suite',
                                pillar: p.name,
                                objective: obj.title,
                                team: init.team?.name || kr.departments?.[0],
                                kr: kr.title,
                                initiative: init.title,
                              },
                            })
                          "
                        >
                          <td>
                            <div class="item-name-cell indent-4">
                              <button
                                type="button"
                                class="toggle-btn"
                                @click.stop="toggleCollapse(init.id)"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="1em"
                                  height="1em"
                                  viewBox="0 0 12 12"
                                >
                                  <title>chevron-right-12</title>
                                  <path
                                    fill="currentColor"
                                    d="M4.7 10c-.2 0-.4-.1-.5-.2c-.3-.3-.3-.8 0-1.1L6.9 6L4.2 3.3c-.3-.3-.3-.8 
                                    0-1.1s.8-.3 1.1 0l3.3 3.2c.3.3.3.8 0 1.1L5.3 9.7q-.3.3-.6.3"
                                  />
                                </svg>
                              </button>
                              <span class="cell-title">{{ init.title }}</span>
                              <span
                                v-if="init.tasks?.length"
                                class="badge-count-sub"
                                >{{ init.tasks.length }} KPI</span
                              >
                            </div>
                          </td>
                          <td><span class="level-tag init">Inisiatif</span></td>
                          <td>
                            <span class="bsc-pill-sub">{{ p.name }}</span>
                          </td>
                          <td>
                            <span class="text-team">{{
                              init.team?.name || "Tim"
                            }}</span>
                          </td>
                          <td>
                            <div class="target-col">
                              <span
                                >T:
                                {{
                                  formatVal(init.targetValue, init.unit)
                                }}</span
                              >
                              <span class="text-success"
                                >R:
                                {{
                                  formatVal(init.currentValue, init.unit)
                                }}</span
                              >
                            </div>
                          </td>
                          <td>
                            <div class="prog-inline">
                              <span class="prog-text"
                                >{{ init.progress }}%</span
                              >
                              <div class="mini-bar">
                                <div
                                  class="mini-bar-fill"
                                  :style="{ width: init.progress + '%' }"
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              class="status-badge"
                              :class="init.kanbanStatus?.toLowerCase()"
                            >
                              {{ init.kanbanStatus || init.status }}
                            </span>
                          </td>
                        </tr>

                        <!-- Tasks/KPIs under Initiative -->
                        <template v-if="isExpanded(init.id)">
                          <tr
                            v-for="task in init.tasks"
                            :key="task.id"
                            class="row-task"
                            @click="
                              $emit('select-node', {
                                ...task,
                                type: 'KPI',
                                parentKr: kr,
                                parentInit: init,
                                perspective: p.name,
                                objectiveTitle: obj.title,
                                krTitle: kr.title,
                                initiativeTitle: init.title,
                                siblingKrs: obj.keyResults?.filter(
                                  (s: any) => s.id !== kr.id,
                                ),
                                lineage: {
                                  root: 'BSC-OKR Suite',
                                  pillar: p.name,
                                  objective: obj.title,
                                  team: init.team?.name || kr.departments?.[0],
                                  kr: kr.title,
                                  initiative: init.title,
                                  task: task.title,
                                  kpi: task.title,
                                },
                              })
                            "
                          >
                            <td>
                              <div class="item-name-cell indent-5">
                                <span class="task-bullet">•</span>
                                <span class="cell-title text-task">{{
                                  task.title
                                }}</span>
                              </div>
                            </td>
                            <td><span class="level-tag kpi">KPI</span></td>
                            <td>
                              <span class="bsc-pill-sub">{{ p.name }}</span>
                            </td>
                            <td>
                              <span class="text-pic">{{
                                task.assignedTeamMember?.name ||
                                task.assignedUser?.name ||
                                "Member"
                              }}</span>
                            </td>
                            <td>
                              <div class="target-col">
                                <span
                                  >T:
                                  {{
                                    formatVal(task.targetValue, task.unit)
                                  }}</span
                                >
                                <span class="text-success"
                                  >R:
                                  {{
                                    formatVal(task.currentValue, task.unit)
                                  }}</span
                                >
                              </div>
                            </td>
                            <td>
                              <div class="prog-inline">
                                <span class="prog-text"
                                  >{{ task.progress }}%</span
                                >
                                <div class="mini-bar">
                                  <div
                                    class="mini-bar-fill"
                                    :style="{ width: task.progress + '%' }"
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span
                                class="status-badge"
                                :class="task.kanbanStatus?.toLowerCase()"
                              >
                                {{ task.kanbanStatus || task.status }}
                              </span>
                            </td>
                          </tr>
                        </template>
                      </template>
                    </template>
                  </template>
                </template>
              </template>
            </template>
          </template>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps<{
  perspectives: any[];
}>();

defineEmits<{
  (e: "select-node", node: any): void;
}>();

const rootAvgProgress = computed(() => {
  if (!props.perspectives || props.perspectives.length === 0) return 0;
  const sum = props.perspectives.reduce(
    (acc: number, p: any) => acc + (p.averageProgress || 0),
    0,
  );
  return Math.round(sum / props.perspectives.length);
});

const collapsedMap = ref<Record<string, boolean>>({});

function isExpanded(id: string): boolean {
  return collapsedMap.value[id] !== false;
}

function toggleCollapse(id: string) {
  collapsedMap.value[id] = !isExpanded(id);
}

function formatStatus(status?: string) {
  if (!status) return "ON TRACK";
  return status.replace(/_/g, " ");
}

function formatVal(val: any, unit?: string) {
  if (val === undefined || val === null) return "-";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  if (unit === "Rp" || unit === "IDR" || num >= 1000000) {
    return "Rp " + num.toLocaleString("id-ID");
  }
  return num.toLocaleString("id-ID") + (unit ? " " + unit : "");
}
</script>

<style scoped>
.matrix-table-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  background: #ffffff;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  text-align: left;
}

.matrix-table th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 14px;
  border-bottom: 2px solid #e2e8f0;
  z-index: 10;
}

.matrix-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.matrix-table tbody tr {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.matrix-table tbody tr:hover {
  background-color: #f8fafc;
}
.row-root {
  background-color: #f1f5f9;
  font-weight: 700;
  border-bottom: 2px solid #cbd5e1;
}
.row-pillar {
  background-color: #fafbfc;
  font-weight: 600;
}
.row-obj {
  background-color: #ffffff;
}
.row-kr {
  background-color: #fcfeff;
}
.row-init {
  background-color: #ffffff;
}
.row-task {
  background-color: #fdfdfd;
}

.item-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.indent-0 {
  padding-left: 0;
}
.indent-1 {
  padding-left: 16px;
}
.indent-2 {
  padding-left: 36px;
}
.indent-3 {
  padding-left: 56px;
}
.indent-4 {
  padding-left: 76px;
}
.indent-5 {
  padding-left: 96px;
}

.toggle-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.chevron-icon {
  transition: transform 0.2s ease;
}
.chevron-icon.rotated {
  transform: rotate(90deg);
}

.root-bullet {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #1e3a5f;
  flex-shrink: 0;
}

.pillar-bullet {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.task-bullet {
  color: #10b981;
  font-size: 1.2rem;
  line-height: 1;
}
.cell-title {
  color: #0f172a;
}

.badge-count {
  font-size: 0.7rem;
  background: #e2e8f0;
  color: #334155;
  padding: 2px 6px;
  border-radius: 999px;
  font-weight: 600;
}

.badge-count-sub {
  font-size: 0.68rem;
  background: #f1f5f9;
  color: #64748b;
  padding: 1px 5px;
  border-radius: 4px;
}

.level-tag {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

.level-tag.root {
  background: #1e3a5f;
  color: #fff;
}
.level-tag.pillar {
  background: #0284c7;
  color: #fff;
}
.level-tag.obj {
  background: #0369a1;
  color: #fff;
}
.level-tag.kr {
  background: #0284c7;
  color: #fff;
}
.level-tag.init {
  background: #7c3aed;
  color: #fff;
}
.level-tag.task,
.level-tag.kpi {
  background: #10b981;
  color: #fff;
}

.bsc-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: #0369a1;
}
.bsc-pill-sub {
  font-size: 0.72rem;
  color: #64748b;
}

.prog-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prog-text {
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 38px;
}

.mini-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.mini-bar-fill {
  height: 100%;
  background: #0284c7;
  border-radius: 999px;
}

.target-col {
  display: flex;
  flex-direction: column;
  font-size: 0.72rem;
  color: #64748b;
}

.text-success {
  color: #059669;
  font-weight: 600;
}
.text-muted {
  color: #94a3b8;
}
.text-dept {
  color: #0f172a;
  font-weight: 600;
}
.text-team {
  color: #0369a1;
  font-weight: 600;
}
.text-pic {
  color: #334155;
}

.status-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
}

.status-badge.on-track {
  background: #dcfce7;
  color: #166534;
}
.status-badge.at-risk {
  background: #fef3c7;
  color: #92400e;
}
.status-badge.off-track {
  background: #fee2e2;
  color: #991b1b;
}
.status-badge.todo {
  background: #f1f5f9;
  color: #475569;
}
.status-badge.in_progress {
  background: #e0f2fe;
  color: #0369a1;
}
.status-badge.done {
  background: #dcfce7;
  color: #166534;
}
</style>

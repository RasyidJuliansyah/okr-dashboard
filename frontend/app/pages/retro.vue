<template>
  <div class="retro-root">
    <div class="retro-content">
      <!-- Sprint Header -->
      <section class="card sprint-header">
        <div class="sprint-info">
          <div class="sprint-select-wrap">
            <select
              v-model="sprintId"
              class="sprint-select"
              aria-label="Pilih sprint"
              @change="reload"
            >
              <option v-for="s in sprints" :key="s.id" :value="s.id">
                {{ s.name }} {{ sprintTag(s) }}
              </option>
            </select>
            <svg
              class="chev"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          <p class="sprint-sub">
            {{ periodLabel }} ·
            <span
              v-if="departments.length > 1"
              ref="deptPickerRef"
              class="dept-multiselect"
            >
              <button
                type="button"
                class="dept-select"
                aria-haspopup="true"
                :aria-expanded="deptPickerOpen"
                @click="deptPickerOpen = !deptPickerOpen"
              >
                {{ deptSelectionLabel }}
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div v-if="deptPickerOpen" class="dept-menu" role="menu">
                <label
                  v-for="d in departments"
                  :key="d.id"
                  class="dept-menu-item"
                >
                  <input
                    type="checkbox"
                    :value="d.id"
                    v-model="selectedDeptIds"
                  />
                  {{ d.name }}
                </label>
                <p class="dept-menu-hint">
                  Centang beberapa tim untuk gabungkan retro-nya dalam satu
                  canvas, atau centang satu saja untuk retro per tim.
                </p>
              </div>
            </span>
            <template v-else>{{ primaryDeptName }}</template>
          </p>

          <div class="chips">
            <span class="chip-pill" :class="boardOpen ? 'ok' : 'off'">
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline v-if="boardOpen" points="20 6 9 17 4 12" />
                <circle v-else cx="12" cy="12" r="9" />
              </svg>
              {{ boardOpen ? "Sesi berlangsung" : "Sesi ditutup" }}
            </span>
            <span
              v-if="countdownDisplay"
              class="chip-pill warn"
              :class="{ danger: timerExpired }"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 14" />
              </svg>
              {{ timerExpired ? "Waktu habis" : `${countdownDisplay} tersisa` }}
            </span>
          </div>

          <div v-if="filterableUsers.length" class="mention-filter-bar">
            <label>Disebut:</label>
            <span ref="mentionFilterRef" class="dept-multiselect">
              <button
                type="button"
                class="dept-select"
                aria-haspopup="true"
                :aria-expanded="mentionFilterOpen"
                @click="mentionFilterOpen = !mentionFilterOpen"
              >
                {{ mentionFilterLabel }}
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div v-if="mentionFilterOpen" class="dept-menu" role="menu">
                <label
                  v-for="u in filterableUsers"
                  :key="u.id"
                  class="dept-menu-item"
                >
                  <input
                    type="checkbox"
                    :value="u.id"
                    v-model="mentionFilterIds"
                  />
                  {{ u.name }}
                </label>
                <p class="dept-menu-hint">
                  Centang beberapa pegawai untuk gabungkan filter kartu yang
                  menyebut mereka.
                </p>
              </div>
            </span>
          </div>
        </div>

        <div class="sprint-actions">
          <div class="participants" :title="`${participants.length} peserta`">
            <span
              v-for="(p, i) in participants.slice(0, 5)"
              :key="p.id"
              class="avatar sm"
              :class="`tone-${p.tone}`"
              :style="{ zIndex: 5 - i }"
              >{{ p.initials }}</span
            >
            <span v-if="participants.length > 5" class="avatar sm more"
              >+{{ participants.length - 5 }}</span
            >
          </div>

          <div class="toolbar">
            <div class="timer-wrap">
              <button
                class="icon-btn"
                :class="{ active: timerMenuOpen || countdownDisplay }"
                title="Timer"
                aria-label="Timer"
                aria-haspopup="true"
                :aria-expanded="timerMenuOpen"
                @click="timerMenuOpen = !timerMenuOpen"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="13" r="8" />
                  <line x1="12" y1="13" x2="12" y2="9" />
                  <line x1="9" y1="2" x2="15" y2="2" />
                </svg>
              </button>
              <div v-if="timerMenuOpen" class="timer-menu" role="menu">
                <button
                  v-for="m in TIMER_OPTIONS"
                  :key="m"
                  role="menuitem"
                  @click="startTimer(m)"
                >
                  {{ m }} menit
                </button>
                <button
                  v-if="countdownDisplay"
                  role="menuitem"
                  class="stop"
                  @click="stopTimer"
                >
                  Hentikan timer
                </button>
              </div>
            </div>
            <button
              class="icon-btn"
              title="Riwayat"
              aria-label="Riwayat"
              @click="toggleHistory"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <polyline points="3 3 3 8 8 8" />
                <polyline points="12 8 12 12 15 14" />
              </svg>
            </button>
          </div>

          <template v-if="manageableBoards.length > 0">
            <button
              v-if="allManageableOpen"
              class="btn-primary"
              :disabled="busy"
              @click="closeBoard"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <polyline points="8.5 12 11 14.5 15.5 9.5" />
              </svg>
              Selesaikan Retro
            </button>
            <button
              v-else
              class="btn-primary"
              :disabled="busy"
              @click="openBoard"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {{ openBoardButtonLabel }}
            </button>
          </template>
        </div>
      </section>

      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <!-- Riwayat -->
      <section v-if="showHistory" class="card history">
        <h4>Riwayat Buka / Tutup</h4>
        <p v-if="!history.length" class="muted small">Belum ada riwayat.</p>
        <ul>
          <li v-for="h in history" :key="h.id">
            <strong>{{ ACTION_LABEL[h.action] || h.action }}</strong>
            oleh {{ h.user?.name || "-" }} · {{ fmtDate(h.createdAt) }}
          </li>
        </ul>
      </section>

      <!-- Summary -->
      <section v-if="boardOpen" class="summary">
        <div class="card mood-card">
          <div class="mood-head">
            <span class="eyebrow">MOOD TIM SPRINT INI</span>
            <span class="mood-avg">Rata-rata {{ mock.moodAvg }} / 5</span>
          </div>
          <div class="mood-options">
            <button
              v-for="m in mock.moods"
              :key="m.face"
              class="mood-opt"
              :class="{ active: myMood === m.face }"
              @click="pickMood(m.face)"
            >
              <span class="face">{{ m.face }}</span>
              <span class="cnt"
                >{{ m.count + (myMood === m.face ? 1 : 0) }} orang</span
              >
            </button>
          </div>
        </div>

        <div class="card stat">
          <span class="eyebrow">PARTISIPASI</span>
          <span class="stat-num accent"
            >{{ participants.length }}/{{ mock.teamSize }}</span
          >
          <span class="stat-desc"
            >{{ participationPct }}% anggota tim sudah mengisi board</span
          >
        </div>
        <div class="card stat">
          <span class="eyebrow">TOTAL KARTU</span>
          <span class="stat-num">{{ totalCards }}</span>
          <span class="stat-desc">{{ cardSummary }}</span>
        </div>
        <div class="card stat">
          <span class="eyebrow">ACTION → KEY RESULT</span>
          <span class="stat-num ok"
            >{{ cardsBy("START").length }}/{{
              cardsBy("START").length || 0
            }}</span
          >
          <span class="stat-desc">Semua action item terhubung ke KR</span>
        </div>
      </section>

      <!-- States -->
      <div v-if="loading" class="card empty">Memuat...</div>
      <div v-else-if="boards.length > 0 && !boardOpen" class="card empty">
        Retro sprint ini belum dibuka.
        <span v-if="manageableBoards.length === 0"
          >Tunggu Manager/Leader membukanya.</span
        >
      </div>

      <!-- Board -->
      <section v-else-if="boardOpen" class="board-wrap">
        <div class="board">
          <div
            v-for="col in mainColumns"
            :key="col.key"
            class="column"
            :class="col.tone"
          >
            <div class="col-head">
              <div class="col-title">
                <span class="dot" />
                <h3>{{ col.label }}</h3>
                <span class="count">{{ cardsBy(col.key).length }}</span>
              </div>
            </div>
            <p class="col-hint">{{ col.hint }}</p>

            <form
              v-if="canEdit"
              class="composer"
              @submit.prevent="addCard(col.key)"
            >
              <select
                v-if="writableBoards.length > 1"
                v-model="writeDeptId"
                class="composer-dept-select"
                aria-label="Tim tujuan kartu"
              >
                <option
                  v-for="b in writableBoards"
                  :key="b.deptId"
                  :value="b.deptId"
                >
                  {{ b.deptName }}
                </option>
              </select>
              <div class="composer-textarea-wrap">
                <textarea
                  v-model="drafts[col.key]"
                  maxlength="500"
                  rows="1"
                  placeholder="Tulis pendapatmu di sini… (ketik @ untuk tag pegawai)"
                  :aria-label="`Kartu ${col.label}`"
                  @keydown.enter.exact.prevent="addCard(col.key)"
                  @input="onComposerInput(col.key, $event)"
                  @blur="mentionMenu.open = false"
                />
                <ul
                  v-if="mentionMenu.open && mentionMenu.col === col.key && mentionMenuResults.length"
                  class="mention-menu"
                  role="listbox"
                >
                  <li
                    v-for="u in mentionMenuResults"
                    :key="u.id"
                    role="option"
                    @mousedown.prevent="pickMention(col.key, u)"
                  >
                    {{ u.name }}
                  </li>
                </ul>
              </div>
              <div class="composer-actions end">
                <button
                  class="btn-add"
                  type="submit"
                  :disabled="!drafts[col.key]?.trim()"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Tambah
                </button>
              </div>
            </form>

            <article
              v-for="(card, idx) in cardsBy(col.key)"
              :key="card.id"
              class="rcard"
            >
              <span class="accent" />
              <div class="rcard-body">
                <p class="rcard-text">{{ card.content }}</p>
                <div v-if="card.mentionedUsers?.length" class="mention-badges">
                  <span
                    v-for="u in card.mentionedUsers"
                    :key="u.id"
                    class="mention-badge"
                    >@{{ shortName(u.name) }}</span
                  >
                </div>

                <div class="footer">
                  <div class="author">
                    <span
                      class="avatar sm"
                      :class="`tone-${toneFor(card.author?.id)}`"
                      >{{ initials(card.author?.name) }}</span
                    >
                    <span class="author-name">{{
                      shortName(card.author?.name)
                    }}</span>
                    <span
                      v-if="selectedDeptIds.length > 1"
                      class="dept-badge"
                      >{{ card.deptName }}</span
                    >
                  </div>
                  <div class="card-actions">
                    <button
                      class="votes"
                      :class="{ voted: hasVoted(card) }"
                      :disabled="!canEdit"
                      @click="vote(card.id)"
                      aria-label="Suka"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        :fill="hasVoted(card) ? 'currentColor' : 'none'"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path
                          d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zm0 0l4-8a2 2 0 0 1 2.6 2.7L12 10h6a2 2 0 0 1 2 2.3l-1.1 6A2 2 0 0 1 17 20H7"
                        />
                      </svg>
                      {{ voteCount(card) }}
                    </button>
                    <button
                      v-if="
                        canEdit &&
                        (card.author?.id === auth.user?.id ||
                          card.boardCanManage)
                      "
                      class="more-btn"
                      aria-label="Hapus kartu"
                      @click="deleteCard(card.id)"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="currentColor"
                      >
                        <circle cx="5" cy="12" r="1.6" />
                        <circle cx="12" cy="12" r="1.6" />
                        <circle cx="19" cy="12" r="1.6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        <!-- Action Item & Apresiasi Tim: dikumpulkan, expand/collapse, tidak mengganggu kolom utama -->
        <div class="board board-secondary">
          <div
            v-for="col in secondaryColumns"
            :key="col.key"
            class="column collapsible"
            :class="[col.tone, { open: secondaryOpen[col.key] }]"
          >
            <button
              type="button"
              class="col-head col-head-toggle"
              :aria-expanded="secondaryOpen[col.key]"
              @click="toggleSecondary(col.key)"
            >
              <div class="col-title">
                <span class="dot" />
                <h3>{{ col.label }}</h3>
                <span class="count">{{ cardsBy(col.key).length }}</span>
              </div>
              <svg
                class="chev"
                :class="{ rotated: secondaryOpen[col.key] }"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <div v-show="secondaryOpen[col.key]" class="collapsible-body">
              <p class="col-hint">{{ col.hint }}</p>

              <div v-if="col.key === 'START'" class="ai-summary-box">
                <div class="ai-summary-actions">
                  <button
                    type="button"
                    class="btn-ai-summary"
                    :disabled="aiSummaryLoading"
                    @click="generateAiSummary"
                  >
                    ✨ {{ aiSummaryLoading ? "Meringkas…" : "Ringkasan AI" }}
                  </button>
                  <button
                    v-if="aiSummaryText || aiSummaryError"
                    type="button"
                    class="btn-ai-reset"
                    :disabled="aiSummaryLoading"
                    @click="resetAiSummary"
                  >
                    Reset
                  </button>
                </div>
                <p v-if="aiSummaryError" class="ai-summary-error">
                  {{ aiSummaryError }}
                </p>
                <div v-if="aiSummaryText" class="ai-summary-result">
                  <pre>{{ aiSummaryText }}</pre>
                </div>
              </div>

              <form
                v-if="canEdit"
                class="composer"
                @submit.prevent="addCard(col.key)"
              >
                <select
                  v-if="writableBoards.length > 1"
                  v-model="writeDeptId"
                  class="composer-dept-select"
                  aria-label="Tim tujuan kartu"
                >
                  <option
                    v-for="b in writableBoards"
                    :key="b.deptId"
                    :value="b.deptId"
                  >
                    {{ b.deptName }}
                  </option>
                </select>
                <div class="composer-textarea-wrap">
                  <textarea
                    v-model="drafts[col.key]"
                    maxlength="500"
                    rows="1"
                    placeholder="Tulis pendapatmu di sini… (ketik @ untuk tag pegawai)"
                    :aria-label="`Kartu ${col.label}`"
                    @keydown.enter.exact.prevent="addCard(col.key)"
                    @input="onComposerInput(col.key, $event)"
                    @blur="mentionMenu.open = false"
                  />
                  <ul
                    v-if="mentionMenu.open && mentionMenu.col === col.key && mentionMenuResults.length"
                    class="mention-menu"
                    role="listbox"
                  >
                    <li
                      v-for="u in mentionMenuResults"
                      :key="u.id"
                      role="option"
                      @mousedown.prevent="pickMention(col.key, u)"
                    >
                      {{ u.name }}
                    </li>
                  </ul>
                </div>
                <div class="composer-actions end">
                  <button
                    class="btn-add"
                    type="submit"
                    :disabled="!drafts[col.key]?.trim()"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.4"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Tambah
                  </button>
                </div>
              </form>

              <article
                v-for="(card, idx) in cardsBy(col.key)"
                :key="card.id"
                class="rcard"
              >
                <span class="accent" />
                <div class="rcard-body">
                  <p class="rcard-text">{{ card.content }}</p>
                  <div v-if="card.mentionedUsers?.length" class="mention-badges">
                    <span
                      v-for="u in card.mentionedUsers"
                      :key="u.id"
                      class="mention-badge"
                      >@{{ shortName(u.name) }}</span
                    >
                  </div>

                  <div class="footer">
                    <div class="author">
                      <span
                        class="avatar sm"
                        :class="`tone-${toneFor(card.author?.id)}`"
                        >{{ initials(card.author?.name) }}</span
                      >
                      <span class="author-name">{{
                        shortName(card.author?.name)
                      }}</span>
                      <span
                        v-if="selectedDeptIds.length > 1"
                        class="dept-badge"
                        >{{ card.deptName }}</span
                      >
                    </div>
                    <div class="card-actions">
                      <button
                        class="votes"
                        :class="{ voted: hasVoted(card) }"
                        :disabled="!canEdit"
                        @click="vote(card.id)"
                        aria-label="Suka"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          :fill="hasVoted(card) ? 'currentColor' : 'none'"
                          stroke="currentColor"
                          stroke-width="1.8"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path
                            d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zm0 0l4-8a2 2 0 0 1 2.6 2.7L12 10h6a2 2 0 0 1 2 2.3l-1.1 6A2 2 0 0 1 17 20H7"
                          />
                        </svg>
                        {{ voteCount(card) }}
                      </button>
                      <button
                        v-if="
                          canEdit &&
                          (card.author?.id === auth.user?.id ||
                            card.boardCanManage)
                        "
                        class="more-btn"
                        aria-label="Hapus kartu"
                        @click="deleteCard(card.id)"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="currentColor"
                        >
                          <circle cx="5" cy="12" r="1.6" />
                          <circle cx="12" cy="12" r="1.6" />
                          <circle cx="19" cy="12" r="1.6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { useAuthStore } from "~/stores/auth";

const auth = useAuthStore();
const config = useRuntimeConfig();
const API = config.public.apiBase || "http://localhost:3001/api";
const { confirm: confirmDialog } = useConfirm();

// Kolom backend (STOP/START/CONTINUE/BLOCKER/APPRECIATION) dipetakan ke kolom visual desain.
const COLUMNS = [
  {
    key: "CONTINUE",
    label: "Continue",
    tone: "well",
    hint: "Apa yang berjalan baik di sprint ini?",
    group: "main",
  },
  {
    key: "STOP",
    label: "Start",
    tone: "improve",
    hint: "Apa yang menghambat atau bisa lebih baik?",
    group: "main",
  },
  {
    key: "BLOCKER",
    label: "Stop",
    tone: "danger",
    hint: "Apa yang harus dihentikan karena menghambat tim?",
    group: "main",
  },
  {
    key: "START",
    label: "Action Item",
    tone: "action",
    hint: "Langkah konkret, PIC, dan KR terkait",
    group: "secondary",
  },
  {
    key: "APPRECIATION",
    label: "Notes Apresiasi Tim",
    tone: "appreciation",
    hint: "Apresiasi untuk anggota tim di sprint ini",
    group: "secondary",
  },
];
const mainColumns = COLUMNS.filter((c) => c.group === "main");
const secondaryColumns = COLUMNS.filter((c) => c.group === "secondary");
const secondaryOpen = reactive<Record<string, boolean>>({
  START: false,
  APPRECIATION: false,
});
function toggleSecondary(key: string) {
  secondaryOpen[key] = !secondaryOpen[key];
}
const ACTION_LABEL: Record<string, string> = {
  RETRO_OPEN: "Dibuka",
  RETRO_REOPEN: "Dibuka ulang",
  RETRO_CLOSE: "Ditutup",
};
const POLL_MS = 3000;
const TONES = ["primary", "success", "warning", "danger"];
const TIMER_OPTIONS = [5, 10, 15];

// --- Data tiruan (menunggu backend; lihat catatan di PRD) ---
const mock = reactive({
  timer: "12:45",
  anon: false,
  moodAvg: "0",
  teamSize: 0,
  moods: [
    { face: "😍", count: 0 },
    { face: "😄", count: 0 },
    { face: "🙂", count: 0 },
    { face: "😐", count: 0 },
    { face: "😫", count: 0 },
  ],
});
// ponytail: timer lokal per browser, tidak disinkronkan ke anggota lain (butuh backend untuk itu).
const timerMenuOpen = ref(false);
const timerEndsAt = ref<number | null>(null);
const timerNow = ref(Date.now());
let timerTick: ReturnType<typeof setInterval> | undefined;

function startTimer(minutes: number) {
  timerEndsAt.value = Date.now() + minutes * 60_000;
  timerMenuOpen.value = false;
  if (!timerTick)
    timerTick = setInterval(() => {
      timerNow.value = Date.now();
    }, 1000);
}
function stopTimer() {
  timerEndsAt.value = null;
  timerMenuOpen.value = false;
  clearInterval(timerTick);
  timerTick = undefined;
}
const remainingMs = computed(() =>
  timerEndsAt.value ? Math.max(0, timerEndsAt.value - timerNow.value) : 0,
);
const timerExpired = computed(
  () => timerEndsAt.value !== null && remainingMs.value === 0,
);
const countdownDisplay = computed(() => {
  if (!timerEndsAt.value) return "";
  const total = Math.ceil(remainingMs.value / 1000);
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
});

const myMood = ref<string | null>(null);
const pickMood = (face: string) => {
  myMood.value = myMood.value === face ? null : face;
};

const sprints = ref<any[]>([]);
const departments = ref<any[]>([]);
const sprintId = ref("");
// Checklist tim: satu board tetap per departemen di backend, beberapa tim bisa
// dicentang sekaligus untuk dibuka/ditutup/ditampilkan bersamaan dalam 1 canvas.
const selectedDeptIds = ref<string[]>([]);
const deptPickerOpen = ref(false);
const deptPickerRef = ref<HTMLElement | null>(null);
interface BoardEntry {
  deptId: string;
  deptName: string;
  canWrite: boolean;
  canManage: boolean;
  board: any;
  cards: any[];
}
const boards = ref<BoardEntry[]>([]);
// Tim tujuan saat menulis kartu baru, dipakai bersama saat >1 board bisa ditulis.
const writeDeptId = ref("");
const loading = ref(true);
const busy = ref(false);
const error = ref("");
const showHistory = ref(false);
const history = ref<any[]>([]);
const drafts = reactive<Record<string, string>>({});
const draftMentions = reactive<Record<string, { id: string; name: string }[]>>({});
let timer: ReturnType<typeof setInterval> | undefined;

// --- Mention @ autocomplete ---
const mentionableUsers = ref<{ id: string; name: string }[]>([]);
const mentionMenu = reactive({ open: false, col: "", query: "", caretStart: -1 });
const mentionMenuResults = computed(() =>
  mentionableUsers.value
    .filter((u) =>
      u.name.toLowerCase().includes(mentionMenu.query.toLowerCase()),
    )
    .slice(0, 6),
);
async function loadMentionableUsers() {
  if (!writeDeptId.value) return;
  try {
    mentionableUsers.value = await api(
      `/mentionable-users?departmentId=${writeDeptId.value}`,
    );
  } catch {
    mentionableUsers.value = [];
  }
}
function onComposerInput(col: string, e: Event) {
  const el = e.target as HTMLTextAreaElement;
  const caret = el.selectionStart ?? 0;
  const text = drafts[col] || "";
  const beforeCaret = text.slice(0, caret);
  const m = beforeCaret.match(/@([^\s@]*)$/);
  if (m) {
    mentionMenu.open = true;
    mentionMenu.col = col;
    mentionMenu.query = m[1] ?? "";
    mentionMenu.caretStart = caret - m[0].length;
  } else {
    mentionMenu.open = false;
  }
}
function pickMention(col: string, user: { id: string; name: string }) {
  const text = drafts[col] || "";
  const before = text.slice(0, mentionMenu.caretStart);
  const afterStart = mentionMenu.caretStart + 1 + mentionMenu.query.length;
  const after = text.slice(afterStart);
  drafts[col] = `${before}@${user.name} ${after}`;
  if (!draftMentions[col]) draftMentions[col] = [];
  if (!draftMentions[col]!.some((u) => u.id === user.id))
    draftMentions[col]!.push(user);
  mentionMenu.open = false;
}

// ponytail: reuse dropdown sprint yang sudah ada untuk "review retro sebelumnya"
// (YAGNI). Upgrade ke panel ringkasan lintas-sprint kalau nanti dibutuhkan.
function sprintTag(s: any): string {
  if (s.status === "ACTIVE") return "· Aktif";
  if (s.status === "CLOSED") return "· Selesai";
  return "";
}

// Satu board tetap per tim; "canvas gabungan" = kartu dari semua board
// terpilih digabung per kolom, tiap kartu dikasih label kecil nama timnya.
const allCards = computed(() =>
  boards.value.flatMap((b) =>
    (b.cards || []).map((c: any) => ({
      ...c,
      deptName: b.deptName,
      boardId: b.board?.id,
      boardCanManage: b.canManage,
    })),
  ),
);
const boardOpen = computed(() =>
  boards.value.some((b) => b.board?.status === "OPEN"),
);
const writableBoards = computed(() =>
  boards.value.filter((b) => b.canWrite && b.board?.status === "OPEN"),
);
const canEdit = computed(() => writableBoards.value.length > 0);
const manageableBoards = computed(() =>
  boards.value.filter((b) => b.canManage),
);
const openManageable = computed(() =>
  manageableBoards.value.filter((b) => b.board?.status === "OPEN"),
);
const closedManageable = computed(() =>
  manageableBoards.value.filter((b) => b.board?.status !== "OPEN"),
);
const allManageableOpen = computed(
  () =>
    manageableBoards.value.length > 0 && closedManageable.value.length === 0,
);
const openBoardButtonLabel = computed(() => {
  if (closedManageable.value.length === 0) return "Buka Retro";
  const anyEverOpened = closedManageable.value.some((b) => b.board);
  return anyEverOpened ? "Buka Ulang Retro" : "Buka Retro";
});
const deptSelectionLabel = computed(() => {
  const n = selectedDeptIds.value.length;
  if (n === 0) return "Pilih tim";
  if (n === 1)
    return (
      departments.value.find((d) => d.id === selectedDeptIds.value[0])?.name ||
      "Tim"
    );
  return `${n} tim digabung`;
});
const primaryDeptName = computed(
  () =>
    departments.value.find((d) => d.id === selectedDeptIds.value[0])?.name ||
    "Departemen",
);
const mentionFilterIds = ref<string[]>([]);
const mentionFilterOpen = ref(false);
const mentionFilterRef = ref<HTMLElement | null>(null);
const mentionFilterLabel = computed(() => {
  const n = mentionFilterIds.value.length;
  if (n === 0) return "Semua pegawai";
  if (n === 1)
    return (
      filterableUsers.value.find((u) => u.id === mentionFilterIds.value[0])
        ?.name || "1 pegawai"
    );
  return `${n} pegawai dipilih`;
});
// Dropdown filter nama pegawai: scope dari getMentionableUsers (dept terpilih +
// seluruh tim sibling di bawah manager yang sama), bukan hanya yang sudah di-mention.
const filterableUsers = ref<{ id: string; name: string }[]>([]);
async function loadFilterableUsers() {
  const deptId = selectedDeptIds.value[0];
  if (!deptId) {
    filterableUsers.value = [];
    return;
  }
  try {
    filterableUsers.value = await api(
      `/mentionable-users?departmentId=${deptId}`,
    );
  } catch {
    filterableUsers.value = [];
  }
}
const cardsBy = (col: string): any[] =>
  allCards.value.filter(
    (c: any) =>
      c.column === col &&
      (mentionFilterIds.value.length === 0 ||
        (c.mentionedUsers || []).some((u: any) =>
          mentionFilterIds.value.includes(u.id),
        )),
  );
const totalCards = computed(() => allCards.value.length);
const cardSummary = computed(() =>
  COLUMNS.map((c) => `${cardsBy(c.key).length} ${c.label}`).join(" · "),
);

// Peserta diturunkan dari penulis kartu yang nyata.
const participants = computed(() => {
  const seen = new Map<string, any>();
  for (const c of allCards.value) {
    const a = c.author;
    if (a?.id && !seen.has(a.id))
      seen.set(a.id, {
        id: a.id,
        initials: initials(a.name),
        tone: toneFor(a.id),
      });
  }
  return [...seen.values()];
});
const participationPct = computed(() =>
  Math.round((participants.value.length / mock.teamSize) * 100),
);

// --- Votes: dipetakan ke reaksi 👍 (nyata) ---
const VOTE = "👍";
const voteCount = (card: any) =>
  (card.reactions || []).reduce((n: number, r: any) => n + (r.count || 0), 0);
const hasVoted = (card: any) =>
  (card.reactions || []).some((r: any) => r.emoji === VOTE && r.mine);

function toneFor(id = "") {
  let h = 0;
  for (const ch of id) h = (h + ch.charCodeAt(0)) % TONES.length;
  return TONES[h];
}
const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "–";
const shortName = (name = "") => {
  const parts = name.split(/\s+/).filter(Boolean);
  return parts.length > 1 ? `${parts[0]} ${parts[1]![0]}.` : name;
};
const fmtDate = (d: string) =>
  new Date(d).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
const periodLabel = computed(() => {
  const s = sprints.value.find((x) => x.id === sprintId.value);
  if (s?.startDate && s?.endDate) {
    const f = (d: string) =>
      new Date(d).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    return `Periode ${f(s.startDate)} – ${f(s.endDate)}`;
  }
  return s?.name ? `Sprint ${s.name}` : "Periode sprint";
});

function headers() {
  const token =
    auth.token ||
    (typeof localStorage !== "undefined"
      ? localStorage.getItem("auth_token") || localStorage.getItem("token")
      : "");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
const api = <T = any,>(path: string, opts: any = {}) =>
  $fetch<T>(`${API}/retros${path}`, { headers: headers(), ...opts });
const errMsg = (e: any) =>
  e?.data?.message || e?.message || "Terjadi kesalahan";

async function fetchBoard(silent = false) {
  if (!sprintId.value || selectedDeptIds.value.length === 0) return;
  try {
    const results = await Promise.all(
      selectedDeptIds.value.map(async (deptId) => {
        const q = new URLSearchParams({
          sprintId: sprintId.value,
          departmentId: deptId,
        });
        const res = await api(`?${q}`);
        return {
          deptId,
          deptName: res.department?.name || "Tim",
          canWrite: res.canWrite,
          canManage: res.canManage,
          board: res.board,
          cards: res.cards || [],
        } as BoardEntry;
      }),
    );
    boards.value = results;
    if (
      !writeDeptId.value ||
      !selectedDeptIds.value.includes(writeDeptId.value)
    ) {
      writeDeptId.value =
        writableBoards.value[0]?.deptId || selectedDeptIds.value[0];
    }
    if (!silent) error.value = "";
  } catch (e) {
    if (!silent) {
      boards.value = [];
      error.value = errMsg(e);
    }
  } finally {
    loading.value = false;
  }
}

async function reload() {
  loading.value = true;
  showHistory.value = false;
  await fetchBoard();
}

async function act(fn: () => Promise<any>) {
  busy.value = true;
  error.value = "";
  try {
    await fn();
  } catch (e) {
    error.value = errMsg(e);
  } finally {
    busy.value = false;
    await fetchBoard(true);
    if (showHistory.value) await loadHistory();
  }
}

// Buka/tutup berlaku untuk SEMUA tim yang dicentang & bisa dikelola sekaligus
// (manager yang retro 3 tim bareng), atau satu tim saja kalau cuma itu yang dicentang.
const openBoard = () =>
  act(() =>
    Promise.all(
      manageableBoards.value.map((b) =>
        api("", {
          method: "POST",
          body: { sprintId: sprintId.value, departmentId: b.deptId },
        }),
      ),
    ),
  );
const closeBoard = async () => {
  const ok = await confirmDialog({
    title: "Selesaikan Retro?",
    message: "Anggota tidak bisa menambah kartu setelah ditutup.",
    confirmText: "Ya, Selesaikan",
    cancelText: "Batal",
    danger: false,
    type: "info",
  });
  if (!ok) return;
  await act(() =>
    Promise.all(
      openManageable.value.map((b) =>
        api(`/${b.board.id}/close`, { method: "POST" }),
      ),
    ),
  );
};
const vote = (cardId: string) =>
  act(() =>
    api(`/cards/${cardId}/reactions`, {
      method: "POST",
      body: { emoji: VOTE },
    }),
  );
const deleteCard = async (cardId: string) => {
  const ok = await confirmDialog("Hapus kartu ini?");
  if (ok) await act(() => api(`/cards/${cardId}`, { method: "DELETE" }));
};
// Ringkasan AI Action Item: scope board/tim aktif (writeDeptId) saja, bukan gabungan tim.
const aiSummaryLoading = ref(false);
const aiSummaryText = ref("");
const aiSummaryError = ref("");
function activeWriteBoard() {
  return (
    boards.value.find(
      (b) =>
        b.deptId === writeDeptId.value &&
        b.canWrite &&
        b.board?.status === "OPEN",
    ) || writableBoards.value[0]
  );
}
function resetAiSummary() {
  aiSummaryText.value = "";
  aiSummaryError.value = "";
}
async function generateAiSummary() {
  const target = activeWriteBoard();
  if (!target?.board) return;
  aiSummaryLoading.value = true;
  aiSummaryError.value = "";
  try {
    const res = await api<{ summary: string }>(
      `/${target.board.id}/ai-summary`,
      { method: "POST" },
    );
    aiSummaryText.value = res.summary;
  } catch (e) {
    aiSummaryError.value = errMsg(e);
  } finally {
    aiSummaryLoading.value = false;
  }
}
function addCard(column: string) {
  const content = drafts[column]?.trim();
  if (!content) return;
  const target =
    boards.value.find(
      (b) =>
        b.deptId === writeDeptId.value &&
        b.canWrite &&
        b.board?.status === "OPEN",
    ) || writableBoards.value[0];
  if (!target?.board) return;
  const mentions = (draftMentions[column] || []).map((u) => u.id);
  act(async () => {
    await api(`/${target.board.id}/cards`, {
      method: "POST",
      body: { column, content, mentions },
    });
    drafts[column] = "";
    draftMentions[column] = [];
    mentionMenu.open = false;
  });
}

async function loadHistory() {
  try {
    const perBoard = await Promise.all(
      manageableBoards.value
        .filter((b) => b.board)
        .map((b) =>
          api(`/${b.board.id}/history`).then((rows: any[]) =>
            rows.map((r) => ({ ...r, deptName: b.deptName })),
          ),
        ),
    );
    history.value = perBoard
      .flat()
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  } catch (e) {
    error.value = errMsg(e);
  }
}
async function toggleHistory() {
  showHistory.value = !showHistory.value;
  if (showHistory.value) await loadHistory();
}

onMounted(async () => {
  const role = auth.user?.role;
  const seeAll = role === "ADMIN" || role === "C_LEVEL";
  try {
    const [sp, depts] = await Promise.all([
      $fetch<any>(`${API}/sprints`, { headers: headers() }),
      $fetch<any[]>(`${API}/departments${seeAll ? "?all=true" : ""}`, {
        headers: headers(),
      }).catch(() => []),
    ]);
    sprints.value = sp.sprints || [];
    departments.value = (depts || []).filter((d) => d.isActive !== false);
    sprintId.value =
      (sprints.value.find((s) => s.status === "ACTIVE") || sprints.value[0])
        ?.id || "";
    // Default: tim pertama dicentang. Manager multi-tim tinggal centang lebih
    // banyak lewat dropdown checklist untuk retro gabungan.
    if (selectedDeptIds.value.length === 0 && departments.value[0]) {
      selectedDeptIds.value = [departments.value[0].id];
    }
  } catch (e) {
    error.value = errMsg(e);
  }
  await fetchBoard();
  // Polling 3 detik (bukan websocket). Dilewati saat tab tersembunyi / sedang ada aksi tulis.
  timer = setInterval(() => {
    if (!document.hidden && !busy.value) fetchBoard(true);
  }, POLL_MS);
});

onBeforeUnmount(() => {
  clearInterval(timer);
  clearInterval(timerTick);
});

watch(selectedDeptIds, (ids) => {
  if (ids.length > 0) {
    reload();
    loadFilterableUsers();
  }
}, { immediate: true });

watch(writeDeptId, (id) => {
  if (id) loadMentionableUsers();
});

function onClickOutsideDeptPicker(e: MouseEvent) {
  if (
    deptPickerOpen.value &&
    deptPickerRef.value &&
    !deptPickerRef.value.contains(e.target as Node)
  ) {
    deptPickerOpen.value = false;
  }
  if (
    mentionFilterOpen.value &&
    mentionFilterRef.value &&
    !mentionFilterRef.value.contains(e.target as Node)
  ) {
    mentionFilterOpen.value = false;
  }
}
onMounted(() => document.addEventListener("click", onClickOutsideDeptPicker));
onBeforeUnmount(() =>
  document.removeEventListener("click", onClickOutsideDeptPicker),
);
</script>

<style scoped>
/* Tokens lokal halaman retro (mengikuti bahasa visual desain BSC Suite) */
.retro-root {
  --r-card: var(--card-bg, #fff);
  --r-page: var(--bg-page, #f6f8fb);
  --r-border: var(--input-border, #e3e8ef);
  --r-strong: var(--text-heading, #1e2a4a);
  --r-muted: var(--text-muted, #64748b);
  --r-subtle: #94a3b8;
  --r-primary: var(--color-primary, #1a8fe3);
  --r-primary-soft: #e8f4fd;
  --r-success: #16a34a;
  --r-success-soft: #eaf8ef;
  --r-warning: #ea8a00;
  --r-warning-soft: #fff5e3;
  --r-danger: #e5484d;
  --r-danger-soft: #fdecec;
  --r-appreciation: #8a4fd6;
  --r-appreciation-soft: #f3ecfb;

  padding: 1.75rem 2.5rem;
  background: var(--r-page);
  min-height: 100%;
  color: var(--r-strong);
}
.retro-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.card {
  background: var(--r-card);
  border: 1px solid var(--r-border);
  border-radius: 16px;
}
.muted {
  color: var(--r-muted);
}
.small {
  font-size: 0.8rem;
}

/* ---- Sprint Header ---- */
.sprint-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 20px 24px;
  flex-wrap: wrap;
}
.sprint-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sprint-select-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.sprint-select {
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  border: none;
  padding: 0 28px 0 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--r-strong);
  cursor: pointer;
  font-family: inherit;
}
.sprint-select-wrap .chev {
  position: absolute;
  right: 0;
  color: var(--r-strong);
  pointer-events: none;
}
.sprint-sub {
  margin: 0;
  font-size: 14px;
  color: var(--r-muted);
}
.dept-multiselect {
  position: relative;
  display: inline-block;
}
.dept-select {
  appearance: none;
  -webkit-appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  color: var(--r-primary);
  font-weight: 600;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  padding: 0 2px;
}
.dept-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 20;
  min-width: 220px;
  background: var(--r-card);
  border: 1px solid var(--r-border);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(16, 24, 40, 0.1);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dept-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--r-strong);
  cursor: pointer;
}
.dept-menu-item:hover {
  background: var(--r-primary-soft);
}
.dept-menu-hint {
  margin: 6px 2px 0;
  padding-top: 6px;
  border-top: 1px solid var(--r-border);
  font-size: 11px;
  line-height: 1.4;
  color: var(--r-muted);
}
.mention-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--r-muted);
}
.mention-filter-bar select {
  border: 1px solid var(--r-border, #e2e8f0);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 13px;
}
.composer-textarea-wrap {
  position: relative;
}
.mention-menu {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  z-index: 20;
  margin: 2px 0 0;
  padding: 4px;
  list-style: none;
  background: #fff;
  border: 1px solid var(--r-border, #e2e8f0);
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  max-height: 180px;
  overflow-y: auto;
}
.mention-menu li {
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}
.mention-menu li:hover {
  background: #f1f5f9;
}
.mention-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
.mention-badge {
  font-size: 11px;
  font-weight: 600;
  color: #0369a1;
  background: #e0f2fe;
  border-radius: 999px;
  padding: 2px 8px;
}
.dept-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--r-primary-soft);
  color: var(--r-primary);
}
.composer-dept-select {
  width: 100%;
  margin-bottom: 6px;
  padding: 4px 6px;
  border: 1px solid var(--r-border);
  border-radius: 6px;
  font-size: 12px;
  font-family: inherit;
  color: var(--r-strong);
  background: var(--r-card);
}
.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 2px;
}
.chip-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
}
.chip-pill.ok {
  background: var(--r-success-soft);
  color: var(--r-success);
}
.chip-pill.off {
  background: var(--r-danger-soft);
  color: var(--r-danger);
}
.chip-pill.warn {
  background: var(--r-warning-soft);
  color: var(--r-warning);
}
.chip-pill.warn.danger {
  background: var(--r-danger-soft);
  color: var(--r-danger);
}
.chip-pill.mute {
  background: var(--r-page);
  color: var(--r-muted);
}

.sprint-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.participants {
  display: flex;
  align-items: center;
}
.participants .avatar {
  margin-right: -6px;
  border: 2px solid var(--r-card);
}
.toolbar {
  display: flex;
  gap: 8px;
}
.icon-btn {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--r-border);
  background: var(--r-card);
  border-radius: 10px;
  color: var(--r-muted);
  cursor: pointer;
}
.icon-btn:hover {
  color: var(--r-primary);
  border-color: var(--r-primary);
}
.icon-btn.active {
  color: var(--r-primary);
  border-color: var(--r-primary);
  background: var(--r-primary-soft);
}
.timer-wrap {
  position: relative;
}
.timer-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  background: var(--r-card);
  border: 1px solid var(--r-border);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  min-width: 140px;
  padding: 4px;
}
.timer-menu button {
  text-align: left;
  padding: 8px 10px;
  border: none;
  background: transparent;
  color: var(--r-strong);
  font-size: 13px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
}
.timer-menu button:hover {
  background: var(--r-page);
}
.timer-menu button.stop {
  color: var(--r-danger);
  border-top: 1px solid var(--r-border);
  margin-top: 4px;
  padding-top: 10px;
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 18px;
  border: none;
  border-radius: 10px;
  background: var(--r-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ---- Avatars ---- */
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 600;
}
.avatar.sm {
  width: 28px;
  height: 28px;
  font-size: 11px;
}
.avatar.more {
  background: var(--r-page);
  color: var(--r-muted);
  border: 2px solid var(--r-card);
}
.tone-primary {
  background: var(--r-primary-soft);
  color: var(--r-primary);
}
.tone-success {
  background: var(--r-success-soft);
  color: var(--r-success);
}
.tone-warning {
  background: var(--r-warning-soft);
  color: var(--r-warning);
}
.tone-danger {
  background: var(--r-danger-soft);
  color: var(--r-danger);
}

/* ---- Summary ---- */
.summary {
  display: grid;
  grid-template-columns: minmax(300px, 1.4fr) repeat(3, minmax(200px, 1fr));
  gap: 20px;
}
.eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.6px;
  color: var(--r-muted);
}
.mood-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.mood-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mood-avg {
  font-size: 12px;
  font-weight: 600;
  color: var(--r-success);
}
.mood-options {
  display: flex;
  justify-content: space-between;
  gap: 6px;
}
.mood-opt {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 12px;
  border: 1.5px solid transparent;
  background: transparent;
  cursor: pointer;
}
.mood-opt .face {
  font-size: 28px;
  line-height: 1;
}
.mood-opt .cnt {
  font-size: 11px;
  font-weight: 500;
  color: var(--r-muted);
}
.mood-opt.active {
  background: var(--r-primary-soft);
  border-color: var(--r-primary);
}
.mood-opt.active .cnt {
  color: var(--r-primary);
}
.stat {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.stat-num {
  font-size: 32px;
  font-weight: 700;
  color: var(--r-strong);
  line-height: 1.1;
}
.stat-num.accent {
  color: var(--r-primary);
}
.stat-num.ok {
  color: var(--r-success);
}
.stat-desc {
  font-size: 13px;
  color: var(--r-muted);
  line-height: 1.4;
}

/* ---- States ---- */
.empty {
  text-align: center;
  color: var(--r-muted);
  padding: 3rem;
}
.error {
  color: var(--r-danger);
  background: var(--r-danger-soft);
  padding: 0.7rem 1rem;
  border-radius: 10px;
  margin: 0;
  font-size: 0.875rem;
}
.history {
  padding: 1.25rem;
}
.history h4 {
  margin: 0 0 0.5rem;
}
.history ul {
  margin: 0;
  padding-left: 1.2rem;
  font-size: 0.875rem;
  color: var(--r-body, #334155);
}

/* ---- Board ---- */
.board-wrap {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  align-items: start;
}
.board-secondary {
  grid-template-columns: repeat(2, minmax(260px, 1fr));
}
.column.collapsible {
  gap: 0;
}
.col-head-toggle {
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  text-align: left;
  padding: 0;
}
.chev {
  color: var(--r-subtle);
  transition: transform 0.15s ease;
}
.chev.rotated {
  transform: rotate(180deg);
}
.collapsible-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}
@media (max-width: 720px) {
  .board-secondary {
    grid-template-columns: 1fr;
  }
}
.column {
  border-radius: 16px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.column.well {
  background: var(--r-success-soft);
}
.column.improve {
  background: var(--r-warning-soft);
}
.column.action {
  background: var(--r-primary-soft);
}
.column.danger {
  background: var(--r-danger-soft);
}
.column.appreciation {
  background: var(--r-appreciation-soft);
}
.col-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.col-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.col-title h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--r-strong);
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.column.well .dot {
  background: var(--r-success);
}
.column.improve .dot {
  background: var(--r-warning);
}
.column.action .dot {
  background: var(--r-primary);
}
.column.danger .dot {
  background: var(--r-danger);
}
.column.appreciation .dot {
  background: var(--r-appreciation);
}
.count {
  background: var(--r-card);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}
.column.well .count {
  color: var(--r-success);
}
.column.improve .count {
  color: var(--r-warning);
}
.column.action .count {
  color: var(--r-primary);
}
.column.danger .count {
  color: var(--r-danger);
}
.column.appreciation .count {
  color: var(--r-appreciation);
}
.col-hint {
  margin: 0;
  font-size: 13px;
  color: var(--r-muted);
}
.more-dim {
  color: var(--r-subtle);
}

.composer {
  background: var(--r-card);
  border: 1px solid var(--r-border);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.composer textarea {
  width: 100%;
  resize: vertical;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 14px;
  color: var(--r-strong);
  min-height: 20px;
}
.composer textarea::placeholder {
  color: var(--r-subtle);
}
.composer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.composer-actions.end {
  justify-content: flex-end;
}
.tools {
  display: flex;
  gap: 10px;
  color: var(--r-subtle);
}
.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  background: var(--r-primary-soft);
  color: var(--r-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-summary-box {
  margin-bottom: 10px;
}
.ai-summary-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-ai-reset {
  padding: 6px 12px;
  border: 1px solid var(--r-border, #d9d9e3);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.btn-ai-reset:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-ai-summary {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--r-primary);
  border-radius: 8px;
  background: transparent;
  color: var(--r-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.btn-ai-summary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ai-summary-error {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--r-danger, #d43f3f);
}
.ai-summary-result {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--r-primary-soft);
}
.ai-summary-result pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
}

.rcard {
  background: var(--r-card);
  border: 1px solid var(--r-border);
  border-radius: 12px;
  display: flex;
  overflow: hidden;
}
.rcard .accent {
  width: 4px;
  flex-shrink: 0;
}
.column.well .accent {
  background: var(--r-success);
}
.column.improve .accent {
  background: var(--r-warning);
}
.column.action .accent {
  background: var(--r-primary);
}
.column.danger .accent {
  background: var(--r-danger);
}
.column.appreciation .accent {
  background: var(--r-appreciation);
}
.rcard-body {
  flex: 1;
  min-width: 0;
  padding: 14px 16px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rcard-text {
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--r-strong);
  white-space: pre-wrap;
  word-break: break-word;
}
.meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.meta-chip.due {
  background: var(--r-page);
  color: var(--r-muted);
}
.meta-chip.kr {
  background: var(--r-primary-soft);
  color: var(--r-primary);
}
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.author {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 150;
}
.author-name {
  font-size: 12px;
  color: var(--r-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.votes {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  border: none;
  background: var(--r-page);
  color: var(--r-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
}
.votes.voted {
  background: var(--r-primary-soft);
  color: var(--r-primary);
}
.votes:disabled {
  cursor: default;
}
.more-btn {
  border: none;
  background: transparent;
  color: var(--r-subtle);
  cursor: pointer;
  padding: 0;
  display: inline-flex;
}
.more-btn:hover {
  color: var(--r-danger);
}

@media (max-width: 1100px) {
  .summary {
    grid-template-columns: 1fr 1fr;
  }
  .board {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .retro-root {
    padding: 1.25rem;
  }
  .summary {
    grid-template-columns: 1fr;
  }
  .sprint-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

<template>
  <aside
    class="app-sidebar"
    :class="{ 'is-open': isOpen, 'is-collapsed': !isOpen }"
    :style="sidebarContainerStyle"
    @mouseover="handleSidebarMouseOver"
    @mouseleave="handleSidebarMouseLeave"
    @scroll.passive="handleSidebarScroll"
  >
    <!-- Logo Section (Expanded) -->
    <div
      v-if="isOpen"
      style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 24px 16px 24px 20px;
        flex-shrink: 0;
      "
    >
      <img
        src="/logo.png"
        alt="Skolla Logo"
        @click="emit('toggle')"
        class="collapsed-brand-btn"
        style="
          background: transparent;
          max-width: 150px;
          height: auto;
          object-fit: contain;
          display: block;
          cursor: pointer;
          transition:
            transform 0.15s ease,
            background-color 0.15s ease;
        "
      />
    </div>

    <!-- Collapsed Top Brand Icon -->
    <div
      v-else
      style="
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px 0 16px;
        flex-shrink: 0;
      "
    >
      <button
        type="button"
        @click="emit('toggle')"
        title="Buka sidebar"
        aria-label="Buka sidebar"
        class="collapsed-brand-btn"
        style="
          background: transparent;
          border: none;
          border-radius: 10px;
          width: 42px;
          height: 42px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition:
            transform 0.15s ease,
            background-color 0.15s ease;
        "
      >
        <img
          src="/logoskollaS.png"
          alt="Skolla Logo"
          style="width: 32px; height: 32px; object-fit: contain; display: block"
        />
      </button>
    </div>

    <!-- Navigation -->
    <nav :style="navContainerStyle">
      <!-- Group 1: MONITORING & KINERJA -->
      <div :style="navGroupStyle">
        <p :style="navGroupLabelStyle">MONITORING & KINERJA</p>

        <NuxtLink
          to="/dashboard"
          title="Dashboard"
          :style="navItemStyle('/dashboard')"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.667"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="10" width="7" height="9" rx="1" />
            <rect x="3" y="14" width="7" height="5" rx="1" />
          </svg>
          <span v-if="isOpen">Dashboard</span>
        </NuxtLink>

        <NuxtLink
          v-if="isManager || isAdmin || isCLevel"
          to="/manager/overview"
          title="OKR Overview"
          :style="navItemStyle('/manager/overview')"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.667"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          <span v-if="isOpen">OKR Overview</span>
        </NuxtLink>

        <NuxtLink
          v-if="isLeader || isManager || isAdmin || isCLevel"
          to="/leader/my-krs"
          title="KR Saya"
          :style="navItemStyle('/leader/my-krs')"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.667"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          <span v-if="isOpen">KR Saya</span>
        </NuxtLink>

        <NuxtLink
          to="/member-achievement"
          title="Capaian Task Member"
          :style="navItemStyle('/member-achievement')"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.667"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <polyline points="16 11 18 13 22 9" />
          </svg>
          <span v-if="isOpen">Capaian Task Member</span>
        </NuxtLink>

        <NuxtLink
          v-if="isAdmin || isCLevel || isManager || isLeader"
          to="/sprint-report"
          title="Laporan Capaian Sprint"
          :style="navItemStyle('/sprint-report')"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.667"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span v-if="isOpen">Laporan Capaian Sprint</span>
        </NuxtLink>
      </div>

      <!-- Divider when collapsed -->
      <div
        v-if="!isOpen"
        style="width: 24px; height: 1px; background: #e2e8f0; margin: 4px auto"
      ></div>

      <!-- Group 2: EKSEKUSI TAKTIS & SPRINT -->
      <div :style="navGroupStyle">
        <p :style="navGroupLabelStyle">EKSEKUSI & SPRINT</p>

        <NuxtLink
          to="/initiatives"
          title="Inisiatif & Task"
          :style="navItemStyle('/initiatives')"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.667"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="5" height="18" rx="1" />
            <rect x="10" y="3" width="5" height="11" rx="1" />
            <rect x="17" y="3" width="5" height="15" rx="1" />
          </svg>
          <span v-if="isOpen">Inisiatif & Task</span>
        </NuxtLink>

        <NuxtLink
          v-if="isTeam || isLeader || isManager || isAdmin || isCLevel"
          to="/team/my-work"
          title="Pekerjaan Saya"
          :style="navItemStyle('/team/my-work')"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.667"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span v-if="isOpen">Pekerjaan Saya</span>
        </NuxtLink>

        <NuxtLink
          v-if="isAdmin || isCLevel || isManager || isLeader"
          to="/approvals"
          title="Persetujuan Task"
          :style="navItemStyle('/approvals')"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.667"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span v-if="isOpen">Persetujuan Task</span>
        </NuxtLink>

        <NuxtLink
          v-if="isAdmin"
          to="/admin/sprints"
          title="Siklus Sprint"
          :style="navItemStyle('/admin/sprints')"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.667"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span v-if="isOpen">Siklus Sprint</span>
        </NuxtLink>

        <NuxtLink
          v-if="isAdmin"
          to="/admin/update-progress"
          title="Update Progress"
          :style="navItemStyle('/admin/update-progress')"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.667"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          <span v-if="isOpen">Update Progress</span>
        </NuxtLink>
      </div>

      <!-- Divider when collapsed -->
      <div
        v-if="!isOpen"
        style="width: 24px; height: 1px; background: #e2e8f0; margin: 4px auto"
      ></div>

      <!-- Group 3: STRATEGI & OKR -->
      <div :style="navGroupStyle">
        <p :style="navGroupLabelStyle">STRATEGI & OKR</p>

        <NuxtLink
          v-if="isCLevel || isAdmin"
          to="/c-level"
          title="Executive Dashboard"
          :style="navItemStyle('/c-level')"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.667"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 20V10" />
            <path d="M12 20V4" />
            <path d="M6 20v-6" />
          </svg>
          <span v-if="isOpen">Executive Dashboard</span>
        </NuxtLink>

        <NuxtLink
          v-if="isAdmin || isCLevel || isManager || isLeader"
          to="/okr-cascading"
          title="OKR Cascading"
          :style="navItemStyle('/okr-cascading')"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.667"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="5" cy="12" r="3" />
            <circle cx="19" cy="6" r="3" />
            <circle cx="19" cy="18" r="3" />
            <path d="M8 12h3a4 4 0 0 0 4-4V6" />
            <path d="M11 12a4 4 0 0 1 4 4v2" />
          </svg>
          <span v-if="isOpen">OKR Cascading</span>
        </NuxtLink>

        <NuxtLink
          to="/product-roadmap"
          title="Roadmap Produk"
          :style="navItemStyle('/product-roadmap')"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.667"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line x1="9" y1="3" x2="9" y2="18" />
            <line x1="15" y1="6" x2="15" y2="21" />
          </svg>
          <span v-if="isOpen">Roadmap Produk</span>
        </NuxtLink>

        <NuxtLink
          v-if="isAdmin"
          to="/admin/objectives"
          title="OKR Builder"
          :style="navItemStyle('/admin/objectives')"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.667"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
            />
            <line x1="12" x2="12" y1="10" y2="16" />
            <line x1="9" x2="15" y1="13" y2="13" />
          </svg>
          <span v-if="isOpen">OKR Builder</span>
        </NuxtLink>

        <NuxtLink
          v-if="isAdmin"
          to="/admin/kpis"
          title="Master KPI"
          :style="navItemStyle('/admin/kpis')"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.667"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 20v-6M6 20V10M18 20V4" />
          </svg>
          <span v-if="isOpen">Master KPI</span>
        </NuxtLink>
      </div>

      <!-- Divider when collapsed -->
      <div
        v-if="!isOpen"
        style="width: 24px; height: 1px; background: #e2e8f0; margin: 4px auto"
      ></div>

      <!-- Group 4: TATA KELOLA & ORGANISASI -->
      <div :style="navGroupStyle">
        <p :style="navGroupLabelStyle">ORGANISASI</p>

        <NuxtLink
          to="/departments"
          title="Struktur Departemen"
          :style="navItemStyle('/departments')"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.667"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="2" y="7" width="6" height="14" rx="1" />
            <rect x="9" y="2" width="6" height="19" rx="1" />
            <rect x="16" y="11" width="6" height="10" rx="1" />
          </svg>
          <span v-if="isOpen">Struktur Departemen</span>
        </NuxtLink>

        <NuxtLink
          v-if="isAdmin"
          to="/admin/employees"
          title="Data Pegawai"
          :style="navItemStyle('/admin/employees')"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.667"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span v-if="isOpen">Data Pegawai</span>
        </NuxtLink>

        <NuxtLink
          v-if="isAdmin"
          to="/admin/audit-logs"
          title="Audit Logs"
          :style="navItemStyle('/admin/audit-logs')"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.667"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span v-if="isOpen">Audit Logs</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- Footer -->
    <div :style="sidebarFooterStyle">
      <ThemeToggle />
      <button
        v-if="isAuthenticated"
        @click="handleLogout"
        title="Logout"
        :style="footerActionStyle"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.667"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" x2="9" y1="12" y2="12" />
        </svg>
        <span v-if="isOpen">Logout</span>
      </button>
      <NuxtLink
        v-else
        to="/login"
        title="Login"
        :style="footerActionStyle"
        @click="emit('close')"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.667"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" x2="3" y1="12" y2="12" />
        </svg>
        <span v-if="isOpen">Login</span>
      </NuxtLink>
    </div>

    <!-- Teleport floating tooltip for collapsed mode -->
    <Teleport to="body" v-if="isMounted && !isOpen && hoveredTooltip">
      <div
        class="sidebar-floating-tooltip"
        :style="{
          top: `${hoveredTooltip.top}px`,
          left: `${hoveredTooltip.left}px`,
        }"
      >
        {{ hoveredTooltip.text }}
      </div>
    </Teleport>
  </aside>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useNotificationStore } from "../stores/notification";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["close", "toggle"]);

const isMounted = ref(false);
const hoveredTooltip = ref(null);

onMounted(() => {
  isMounted.value = true;
});

const sidebarContainerStyle = computed(() => {
  const open = props.isOpen;
  return {
    width: open ? "270px" : "72px",
    minWidth: open ? "270px" : "72px",
    height: "100vh",
    position: "sticky",
    left: "0",
    top: "0",
    background: "var(--card-bg)",
    borderRight: "1px solid var(--card-border)",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.05)",
    display: "flex",
    flexDirection: "column",
    zIndex: "100",
    overflowY: "auto",
    overflowX: "hidden",
    whiteSpace: "nowrap",
    visibility: "visible",
    opacity: "1",
    transition:
      "width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  };
});

const auth = useAuthStore();
const notifStore = useNotificationStore();
const route = useRoute();
const isAuthenticated = computed(() => auth.isAuthenticated);
const isAdmin = computed(
  () => auth.isAuthenticated && auth.user?.role === "ADMIN",
);
const isCLevel = computed(
  () => auth.isAuthenticated && auth.user?.role === "C_LEVEL",
);
const isManager = computed(
  () => auth.isAuthenticated && auth.user?.role === "MANAGER",
);
const isLeader = computed(
  () => auth.isAuthenticated && auth.user?.role === "LEADER",
);
const isTeam = computed(
  () => auth.isAuthenticated && auth.user?.role === "TEAM",
);

// Semua style di bawah ini di-inline (bukan class CSS) supaya sidebar tetap
// tampil benar walau stylesheet eksternal gagal ter-load di production.
const navContainerStyle = computed(() => ({
  flex: "1",
  padding: props.isOpen ? "8px 16px" : "8px 10px",
  display: "flex",
  flexDirection: "column",
  gap: props.isOpen ? "20px" : "8px",
}));

const navGroupStyle = computed(() => ({
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  alignItems: props.isOpen ? "stretch" : "center",
}));

const navGroupLabelStyle = computed(() => ({
  display: props.isOpen ? "block" : "none",
  fontFamily: "'Rubik', sans-serif",
  fontSize: "11px",
  fontWeight: "600",
  color: "var(--text-muted)",
  letterSpacing: "0.8px",
  margin: "0 0 6px 4px",
}));

const sidebarFooterStyle = computed(() => ({
  flexShrink: "0",
  padding: props.isOpen ? "16px" : "14px 8px",
  borderTop: "1px solid var(--card-border)",
  display: "flex",
  alignItems: "center",
  justifyContent: props.isOpen ? "space-between" : "center",
  flexDirection: props.isOpen ? "row" : "column",
  gap: "8px",
}));

const footerActionStyle = computed(() => {
  if (!props.isOpen) {
    return {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "44px",
      height: "44px",
      borderRadius: "12px",
      border: "none",
      background: "none",
      color: "#5e718d",
      cursor: "pointer",
      textDecoration: "none",
      transition: "background-color 150ms ease-out, color 150ms ease-out",
      margin: "0 auto",
      padding: "0",
      flexShrink: "0",
    };
  }
  return {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "none",
    background: "none",
    color: "#5e718d",
    fontFamily: "'Rubik', sans-serif",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    textDecoration: "none",
    transition: "background-color 150ms ease-out, color 150ms ease-out",
  };
});

function isActive(path) {
  return route.path === path || route.path.startsWith(path + "/");
}

function navItemStyle(path) {
  const active = isActive(path);
  if (!props.isOpen) {
    return {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "44px",
      height: "44px",
      borderRadius: "12px",
      textDecoration: "none",
      color: active ? "#ffffff" : "var(--text-secondary)",
      backgroundColor: active ? "var(--color-primary)" : "transparent",
      transition: "background-color 150ms ease-out, color 150ms ease-out",
      cursor: "pointer",
      margin: "2px auto",
      padding: "0",
      flexShrink: "0",
    };
  }
  return {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "14px",
    textDecoration: "none",
    fontFamily: "'Rubik', sans-serif",
    fontSize: "16px",
    fontWeight: active ? "600" : "500",
    color: active ? "#ffffff" : "var(--text-secondary)",
    backgroundColor: active ? "var(--color-primary)" : "transparent",
    transition: "background-color 150ms ease-out, color 150ms ease-out",
    cursor: "pointer",
  };
}

function handleLogout() {
  auth.logout();
  emit("close");
}

function handleSidebarMouseOver(e) {
  if (props.isOpen) {
    hoveredTooltip.value = null;
    return;
  }
  const target = e.target?.closest?.("a, button");
  if (!target || !target.closest(".app-sidebar")) {
    hoveredTooltip.value = null;
    return;
  }

  const text = target.getAttribute("data-tooltip") || target.getAttribute("title");
  if (!text) {
    hoveredTooltip.value = null;
    return;
  }

  // Prevent duplicate native browser tooltip while collapsed
  if (target.hasAttribute("title")) {
    target.setAttribute("data-tooltip", text);
    target.removeAttribute("title");
  }

  if (hoveredTooltip.value && hoveredTooltip.value.el === target) {
    return;
  }

  const rect = target.getBoundingClientRect();
  hoveredTooltip.value = {
    text,
    top: rect.top + rect.height / 2,
    left: rect.right + 10,
    el: target,
  };
}

function handleSidebarMouseLeave() {
  hoveredTooltip.value = null;
}

function handleSidebarScroll() {
  hoveredTooltip.value = null;
}

watch(
  () => props.isOpen,
  (open) => {
    hoveredTooltip.value = null;
    if (open && typeof document !== "undefined") {
      const items = document.querySelectorAll(".app-sidebar [data-tooltip]");
      items.forEach((el) => {
        const val = el.getAttribute("data-tooltip");
        if (val) el.setAttribute("title", val);
      });
    }
  }
);
</script>

<style scoped>
.app-sidebar {
  background-color: var(--card-bg) !important;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)),
    url("/asset/supergraphic.png") !important;
  background-size: cover !important;
  background-position: right center !important;
  background-repeat: no-repeat !important;
}

:root.dark .app-sidebar {
  background-image:
    linear-gradient(rgba(19, 26, 44, 0.85), rgba(19, 26, 44, 0.85)),
    url("/asset/supergraphic.png") !important;
}

.app-sidebar :deep(svg),
.app-sidebar svg {
  flex-shrink: 0 !important;
}

.sidebar-toggle-btn:hover {
  background-color: #f1f5f9 !important;
  color: #0e97d6 !important;
  border-color: #cbd5e1 !important;
}

.collapsed-brand-btn:hover {
  background-color: #f1f5f9 !important;
  transform: scale(1.08);
}

:global(.sidebar-floating-tooltip) {
  position: fixed;
  transform: translateY(-50%);
  background-color: #1e293b;
  color: #ffffff;
  font-family: "Rubik", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 8px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 999999;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18), 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: tooltipFadeIn 0.12s ease-out;
}

:global(.sidebar-floating-tooltip::before) {
  content: "";
  position: absolute;
  top: 50%;
  right: 100%;
  transform: translateY(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: transparent #1e293b transparent transparent;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}

@media (max-width: 1024px) {
  .app-sidebar {
    position: fixed !important;
    top: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    height: 100vh !important;
    width: 270px !important;
    min-width: 270px !important;
    transform: translateX(-100%) !important;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15) !important;
    transition: transform 0.25s ease !important;
    z-index: 100;
  }
  .app-sidebar.is-open {
    transform: translateX(0) !important;
  }
}
</style>

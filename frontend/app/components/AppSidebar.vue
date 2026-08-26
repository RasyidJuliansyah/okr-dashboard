<template>
  <div
    style="
      width: 240px;
      min-width: 240px;
      height: 100vh;
      position: sticky;
      left: 0;
      top: 0;
      background: #ffffff;
      border-right: 1px solid #f0f3f9;
      display: flex;
      flex-direction: column;
      z-index: 100;
      overflow-y: auto;
      transition:
        transform 0.3s ease,
        left 0.3s ease;
    "
  >
    <!-- Logo Section -->
    <div
      style="
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 24px;
        flex-shrink: 0;
      "
    >
      <img
        src="/logo.png"
        alt="Skolla Logo"
        style="
          width: 100%;
          max-width: 100%;
          height: auto;
          object-fit: contain;
          display: block;
        "
      />
    </div>

    <!-- Navigation -->
    <nav :style="navContainerStyle">
      <div :style="navGroupStyle">
        <p :style="navGroupLabelStyle">MENU UTAMA</p>
        <NuxtLink
          to="/dashboard"
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
          <span>Dashboard</span>
        </NuxtLink>
        <NuxtLink
          to="/bsc-view"
          :style="navItemStyle('/bsc-view')"
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
            <polygon
              points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
            />
          </svg>
          <span>Strategic Mapping</span>
        </NuxtLink>
        <NuxtLink
          to="/strategy-map"
          :style="navItemStyle('/strategy-map')"
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
            <rect x="16" y="16" width="6" height="6" rx="1" />
            <rect x="2" y="16" width="6" height="6" rx="1" />
            <rect x="9" y="2" width="6" height="6" rx="1" />
            <line x1="12" y1="12" x2="12" y2="8" />
            <line x1="12" y1="12" x2="5" y2="12" />
            <line x1="12" y1="12" x2="19" y2="12" />
          </svg>
          <span>Causal Map</span>
        </NuxtLink>
        <NuxtLink
          to="/initiatives"
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
          <span>Inisiatif (Kanban)</span>
        </NuxtLink>
        <NuxtLink
          to="/member-achievement"
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
          <span>Capaian Task Member</span>
        </NuxtLink>
        <NuxtLink
          to="/departments"
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
          <span>Struktur Departemen</span>
        </NuxtLink>
      </div>

      <!-- C-Level menu -->
      <div v-if="isCLevel || isAdmin" :style="navGroupStyle">
        <p :style="navGroupLabelStyle">C-LEVEL</p>
        <NuxtLink
          to="/c-level"
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
          <span>Executive Dashboard</span>
        </NuxtLink>
      </div>

      <!-- Admin menu - hanya muncul setelah login sebagai admin -->
      <div v-if="isAdmin" :style="navGroupStyle">
        <p :style="navGroupLabelStyle">ADMIN</p>
        <NuxtLink
          to="/admin/objectives"
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
          <span>OKR Builder</span>
        </NuxtLink>

        <NuxtLink
          to="/initiatives"
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
          <span>Inisiatif (Kanban)</span>
        </NuxtLink>
        <NuxtLink
          to="/admin/update-progress"
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
          <span>Update Progress</span>
        </NuxtLink>
        <NuxtLink
          to="/admin/employees"
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
          <span>Data Pegawai</span>
        </NuxtLink>
        <NuxtLink
          to="/departments"
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
          <span>Struktur Departemen</span>
        </NuxtLink>
      </div>

      <!-- Manager menu -->
      <div v-if="isManager || isAdmin" :style="navGroupStyle">
        <p :style="navGroupLabelStyle">MANAGER</p>
        <NuxtLink
          to="/manager/overview"
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
          <span>OKR Overview</span>
        </NuxtLink>
        <NuxtLink
          to="/leader/my-krs"
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
          <span>KR Saya</span>
        </NuxtLink>
      </div>

      <!-- Leader menu -->
      <div v-if="isLeader || isAdmin" :style="navGroupStyle">
        <p :style="navGroupLabelStyle">LEADER</p>
        <NuxtLink
          to="/leader/my-krs"
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
          <span>KR Saya</span>
        </NuxtLink>
      </div>

      <!-- Team menu -->
      <div
        v-if="isTeam || isLeader || isManager || isAdmin"
        :style="navGroupStyle"
      >
        <p :style="navGroupLabelStyle">PEKERJAAN</p>
        <NuxtLink
          to="/team/my-work"
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
          <span>Pekerjaan Saya</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- Footer -->
    <div :style="sidebarFooterStyle">
      <ThemeToggle />
      <button
        v-if="isAuthenticated"
        @click="handleLogout"
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
        <span>Logout</span>
      </button>
      <NuxtLink
        v-else
        to="/login"
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
        <span>Login</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["close"]);

const auth = useAuthStore();
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
const navContainerStyle = {
  flex: "1",
  padding: "8px 16px",
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const navGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

const navGroupLabelStyle = {
  fontFamily: "'Rubik', sans-serif",
  fontSize: "11px",
  fontWeight: "600",
  color: "#8897ae",
  letterSpacing: "0.8px",
  margin: "0 0 6px 4px",
};

const sidebarFooterStyle = {
  flexShrink: "0",
  padding: "16px",
  borderTop: "1px solid #f0f3f9",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const footerActionStyle = {
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

function isActive(path) {
  return route.path === path || route.path.startsWith(path + "/");
}

function navItemStyle(path) {
  const active = isActive(path);
  return {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "14px",
    textDecoration: "none",
    fontFamily: "'Rubik', sans-serif",
    fontSize: "16px",
    fontWeight: "500",
    color: active ? "#ffffff" : "#5e718d",
    backgroundColor: active ? "#0e97d6" : "transparent",
    transition: "background-color 150ms ease-out, color 150ms ease-out",
    cursor: "pointer",
  };
}

function handleLogout() {
  auth.logout();
  emit("close");
}
</script>

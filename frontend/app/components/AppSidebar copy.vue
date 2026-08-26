<template>
  <aside class="sidebar" :class="{ 'is-open': isOpen }">
    <!-- Logo Section -->
    <div class="logo-section">
      <img src="/logo.png" alt="Skolla Logo" class="logo-icon" />
    </div>

    <!-- Navigation -->
    <nav class="nav-container">
      <div class="nav-group">
        <p class="nav-group-label">MENU UTAMA</p>
        <NuxtLink to="/dashboard" class="nav-item" active-class="nav-active" @click="emit('close')">
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
        <NuxtLink to="/bsc-view" class="nav-item" active-class="nav-active" @click="emit('close')">
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
        <NuxtLink to="/strategy-map" class="nav-item" active-class="nav-active" @click="emit('close')">
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
        <NuxtLink to="/initiatives" class="nav-item" active-class="nav-active" @click="emit('close')">
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
        <NuxtLink to="/member-achievement" class="nav-item" active-class="nav-active" @click="emit('close')">
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
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <polyline points="16 11 18 13 22 9"/>
          </svg>
          <span>Capaian Task Member</span>
        </NuxtLink>
        <NuxtLink to="/departments" class="nav-item" active-class="nav-active" @click="emit('close')">
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
      <div v-if="isCLevel || isAdmin" class="nav-group">
        <p class="nav-group-label">C-LEVEL</p>
        <NuxtLink to="/c-level" class="nav-item" active-class="nav-active" @click="emit('close')">
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
      <div v-if="isAdmin" class="nav-group">
        <p class="nav-group-label">ADMIN</p>
        <NuxtLink
          to="/admin/objectives"
          class="nav-item"
          active-class="nav-active"
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
          class="nav-item"
          active-class="nav-active"
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
          class="nav-item"
          active-class="nav-active"
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
          class="nav-item"
          active-class="nav-active"
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
          class="nav-item"
          active-class="nav-active"
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
      <div v-if="isManager || isAdmin" class="nav-group">
        <p class="nav-group-label">MANAGER</p>
        <NuxtLink to="/manager/overview" class="nav-item" active-class="nav-active" @click="emit('close')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.667" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          <span>OKR Overview</span>
        </NuxtLink>
        <NuxtLink to="/leader/my-krs" class="nav-item" active-class="nav-active" @click="emit('close')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.667" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
          <span>KR Saya</span>
        </NuxtLink>
      </div>

      <!-- Leader menu -->
      <div v-if="isLeader || isAdmin" class="nav-group">
        <p class="nav-group-label">LEADER</p>
        <NuxtLink to="/leader/my-krs" class="nav-item" active-class="nav-active" @click="emit('close')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.667" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
          <span>KR Saya</span>
        </NuxtLink>
      </div>

      <!-- Team menu -->
      <div v-if="isTeam || isLeader || isManager || isAdmin" class="nav-group">
        <p class="nav-group-label">PEKERJAAN</p>
        <NuxtLink to="/team/my-work" class="nav-item" active-class="nav-active" @click="emit('close')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.667" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Pekerjaan Saya</span>
        </NuxtLink>
      </div>

    </nav>

    <!-- Footer -->
    <div class="sidebar-footer">
      <ThemeToggle />
      <button
        v-if="isAuthenticated"
        @click="handleLogout"
        class="footer-action"
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
      <NuxtLink v-else to="/login" class="footer-action" @click="emit('close')">
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
  </aside>
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "../stores/auth";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["close"]);

const auth = useAuthStore();
const isAuthenticated = computed(() => auth.isAuthenticated);
const isAdmin = computed(() => auth.isAuthenticated && auth.user?.role === 'ADMIN');
const isCLevel = computed(() => auth.isAuthenticated && auth.user?.role === 'C_LEVEL');
const isManager = computed(() => auth.isAuthenticated && auth.user?.role === 'MANAGER');
const isLeader = computed(() => auth.isAuthenticated && auth.user?.role === 'LEADER');
const isTeam = computed(() => auth.isAuthenticated && auth.user?.role === 'TEAM');

function handleLogout() {
  auth.logout();
  emit("close");
}
</script>

<style scoped>
.sidebar {
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
  transition: transform 0.3s ease, left 0.3s ease;
}

@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: -240px;
    height: 100vh;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
  }

  .sidebar.is-open {
    left: 0;
  }
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px 20px 16px;
  flex-shrink: 0;
}

.logo-icon {
  height: 28px;
  width: auto;
  max-width: 140px;
  object-fit: contain;
  display: block;
}

.logo-wordmark {
  font-family: "Rubik", sans-serif;
  font-weight: 600;
  font-size: 21px;
  color: #010571;
  letter-spacing: -0.3px;
  line-height: 1;
}

.nav-container {
  flex: 1;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-group-label {
  font-family: "Rubik", sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #8897ae;
  letter-spacing: 0.8px;
  margin: 0 0 6px 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  text-decoration: none;
  font-family: "Rubik", sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #5e718d;
  transition:
    background-color 150ms ease-out,
    color 150ms ease-out;
  cursor: pointer;
}

.nav-item svg {
  flex-shrink: 0;
  color: #5e718d;
  transition: color 150ms ease-out;
}

.nav-item:hover {
  background-color: #f8fafc;
}

.nav-active {
  background-color: #0e97d6 !important;
  color: #ffffff !important;
  font-weight: 500;
}

.nav-active svg {
  color: #ffffff !important;
}

.sidebar-footer {
  flex-shrink: 0;
  padding: 16px;
  border-top: 1px solid #f0f3f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  border: none;
  background: none;
  color: #5e718d;
  font-family: "Rubik", sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition:
    background-color 150ms ease-out,
    color 150ms ease-out;
}

.footer-action:hover {
  background-color: #f8fafc;
  color: #2d3643;
}
</style>

-----------------------------
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
    <div style="background-color: aqua">dashboard</div>
    <!-- Logo Section
    <div class="logo-section">
      <img src="/logo.png" alt="Skolla Logo" class="logo-icon" />
    </div> -->

    <!-- Navigation -->
    <div :style="navContainerStyle">
      <div :style="navGroupStyle">
        <p :style="navGroupLabelStyle">MENU UTAMA</p>
        <a
          href="/dashboard"
          :style="navItemStyle('/dashboard')"
          @mouseenter="hoveredPath = '/dashboard'"
          @mouseleave="hoveredPath = null"
          @click="go('/dashboard', $event)"
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
        </a>
        <a
          href="/bsc-view"
          :style="navItemStyle('/bsc-view')"
          @mouseenter="hoveredPath = '/bsc-view'"
          @mouseleave="hoveredPath = null"
          @click="go('/bsc-view', $event)"
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
        </a>
        <a
          href="/strategy-map"
          :style="navItemStyle('/strategy-map')"
          @mouseenter="hoveredPath = '/strategy-map'"
          @mouseleave="hoveredPath = null"
          @click="go('/strategy-map', $event)"
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
        </a>
        <a
          href="/initiatives"
          :style="navItemStyle('/initiatives')"
          @mouseenter="hoveredPath = '/initiatives'"
          @mouseleave="hoveredPath = null"
          @click="go('/initiatives', $event)"
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
        </a>
        <a
          href="/member-achievement"
          :style="navItemStyle('/member-achievement')"
          @mouseenter="hoveredPath = '/member-achievement'"
          @mouseleave="hoveredPath = null"
          @click="go('/member-achievement', $event)"
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
        </a>
        <a
          href="/departments"
          :style="navItemStyle('/departments')"
          @mouseenter="hoveredPath = '/departments'"
          @mouseleave="hoveredPath = null"
          @click="go('/departments', $event)"
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
        </a>
      </div>

      <!-- C-Level menu -->
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute, navigateTo } from "#app";
import { useAuthStore } from "../stores/auth";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["close"]);

const route = useRoute();
const auth = useAuthStore();
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

const hoveredPath = ref(null);

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

const navItemBaseStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 16px",
  borderRadius: "14px",
  textDecoration: "none",
  fontFamily: "'Rubik', sans-serif",
  fontSize: "16px",
  fontWeight: "500",
  color: "#5e718d",
  transition: "background-color 150ms ease-out, color 150ms ease-out",
  cursor: "pointer",
};

function isActive(path) {
  return route.path === path;
}

function navItemStyle(path) {
  if (isActive(path)) {
    return {
      ...navItemBaseStyle,
      backgroundColor: "#0e97d6",
      color: "#ffffff",
      fontWeight: "500",
    };
  }
  if (hoveredPath.value === path) {
    return {
      ...navItemBaseStyle,
      backgroundColor: "#f8fafc",
    };
  }
  return navItemBaseStyle;
}

function go(path, event) {
  event?.preventDefault();
  emit("close");
  navigateTo(path);
}

function handleLogout() {
  auth.logout();
  emit("close");
}
</script>

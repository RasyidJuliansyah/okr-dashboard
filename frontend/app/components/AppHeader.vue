<template>
  <header class="app-header">
    <div class="header-left">
      <h1 class="header-title">{{ headerTitle }}</h1>
    </div>
    <div class="header-right">
      <slot name="actions" />

      <!-- C-Board Dynamic Context Switcher -->
      <div v-if="isCBoardUser" class="context-switcher-wrapper">
        <button
          class="context-switcher-btn"
          :class="{ 'in-manager-mode': isOperatingAsManager }"
          @click.stop="toggleContextDropdown"
          :title="'Konteks aktif: ' + currentContextLabel"
        >
          <span class="context-label-group">
            <span class="context-role-tag">{{
              isOperatingAsManager ? "Manager Mode" : "Strategic Mode"
            }}</span>
            <span class="context-text">{{ currentContextLabel }}</span>
          </span>
          <svg
            class="chevron-icon"
            :class="{ open: showContextDropdown }"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <!-- Context Switcher Dropdown -->
        <div
          v-if="showContextDropdown"
          class="context-dropdown card"
          @click.stop
        >
          <div class="context-dropdown-header">
            <div class="dropdown-title-row">
              <span class="dropdown-title">Dynamic Context Switcher</span>
              <span v-if="switching" class="switching-indicator"
                >Beralih...</span
              >
            </div>
            <p class="dropdown-sub">
              Ganti perspektif antara C-Board Executive dan Manager Departemen
            </p>
          </div>

          <div class="context-options-list">
            <!-- Strategic Board Mode Option -->
            <button
              class="context-option-item strategic-option"
              :class="{ active: !isOperatingAsManager }"
              @click="switchContext('STRATEGIC', 'C_LEVEL')"
              :disabled="switching"
            >
              <div class="option-text-group">
                <span class="option-name">Strategic C-Board Level</span>
                <span class="option-desc"
                  >Executive Overview & Balanced Scorecard Korporat</span
                >
              </div>
            </button>

            <!-- Operational Departments Section -->
            <div class="context-divider">
              <span>Supervisi Operasional (Mode Manager)</span>
            </div>

            <div
              v-if="availableSwitchDepts.length === 0"
              class="empty-context-hint"
            >
              Belum ada departemen operasional yang terhubung.
            </div>

            <button
              v-for="dept in availableSwitchDepts"
              :key="dept.id || dept.value"
              class="context-option-item dept-option"
              :class="{
                active:
                  isOperatingAsManager &&
                  (auth.user?.activeDepartment === dept.value ||
                    auth.user?.department === dept.value),
              }"
              @click="switchContext(dept.value, 'MANAGER')"
              :disabled="switching"
            >
              <div class="option-text-group">
                <div class="dept-title-row">
                  <span class="option-name">{{ dept.name || dept.label }}</span>
                  <span class="dept-code-tag">{{ dept.value }}</span>
                </div>
                <span class="option-desc"
                  >Supervisi operasional & approval OKR sebagai Manager</span
                >
              </div>
              <span
                v-if="
                  isOperatingAsManager &&
                  (auth.user?.activeDepartment === dept.value ||
                    auth.user?.department === dept.value)
                "
                class="active-indicator"
              >
                ✓
              </span>
            </button>
          </div>
        </div>
      </div>

      <ThemeToggle />

      <div
        v-if="auth.user"
        class="user-info"
        style="
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          cursor: pointer;
        "
        @click="showChangePasswordModal = true"
        title="Klik untuk ganti password"
      >
        <span
          class="user-name"
          style="
            font-family: &quot;Rubik&quot;, sans-serif;
            font-size: 14px;
            font-weight: 500;
            margin: 4px;
            color: #475569;
            line-height: 1.2;
            font-weight: 600;
          "
        >
          Semangat Pagi! {{ auth.user.name }}
        </span>
        <span
          class="user-badge"
          :class="roleBadgeClass"
          style="font-size: 11px; padding: 2px 8px; margin: 0; line-height: 1"
        >
          {{ auth.user.role?.replace("_", " ") }}
        </span>
      </div>

      <button
        v-if="auth.user"
        class="icon-btn-header"
        @click="showChangePasswordModal = true"
        title="Ganti Password"
        aria-label="Ganti Password"
        style="
          background: none;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 6px;
          cursor: pointer;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        "
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </button>

      <div v-if="auth.user" class="notif-wrapper">
        <button
          class="notif-bell-btn"
          @click="toggleNotifDropdown"
          aria-label="Notifikasi"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span v-if="notifStore.unreadCount > 0" class="notif-badge">
            {{ notifStore.unreadCount > 9 ? "9+" : notifStore.unreadCount }}
          </span>
        </button>

        <!-- Dropdown Notifikasi -->
        <div v-if="showNotifDropdown" class="notif-dropdown card">
          <div class="notif-header">
            <span class="notif-header-title">Notifikasi</span>
            <button
              v-if="notifStore.unreadCount > 0"
              class="notif-mark-all-btn"
              @click="notifStore.markAllRead()"
            >
              Tandai semua dibaca
            </button>
          </div>
          <div class="notif-body-list">
            <div
              v-if="notifStore.notifications.length === 0"
              class="notif-empty"
            >
              Tidak ada notifikasi baru
            </div>
            <div
              v-for="n in notifStore.notifications"
              :key="n.id"
              class="notif-item"
              :class="{ unread: !n.isRead }"
              @click="handleNotifClick(n)"
            >
              <div class="notif-item-title">{{ n.title }}</div>
              <div class="notif-item-text">{{ n.body }}</div>
              <div class="notif-item-time">{{ formatTime(n.createdAt) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Ganti Password -->
    <ChangePasswordModal
      :isOpen="showChangePasswordModal"
      @close="showChangePasswordModal = false"
    />
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useNotificationStore } from "../stores/notification";
import ChangePasswordModal from "./ChangePasswordModal.vue";

const route = useRoute();
const auth = useAuthStore();
const notifStore = useNotificationStore();
const emit = defineEmits(["toggle-sidebar"]);

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  isSidebarOpen: {
    type: Boolean,
    default: true,
  },
});

function getMenuTitleByPath(path) {
  if (!path) return "";
  if (path.startsWith("/c-level")) return "Executive Dashboard";
  if (path.startsWith("/dashboard")) return "Dashboard";
  if (path.startsWith("/initiatives")) return "Inisiatif & Task";
  if (path.startsWith("/member-achievement")) return "Capaian Task Member";
  if (path.startsWith("/departments") || path.startsWith("/admin/departments"))
    return "Struktur Departemen";
  if (path.startsWith("/admin/objectives")) return "OKR Builder";
  if (path.startsWith("/okr-cascading")) return "OKR Cascading";
  if (
    path.startsWith("/admin/initiatives-kanban") ||
    path.startsWith("/admin/initiatives")
  )
    return "Inisiatif & Task";
  if (path.startsWith("/admin/update-progress")) return "Update Progress";
  if (path.startsWith("/admin/employees")) return "Data Pegawai";
  if (path.startsWith("/admin/kpis")) return "Master KPI";
  if (path.startsWith("/admin/audit-logs")) return "Audit Logs";
  if (path.startsWith("/admin/sprints")) return "Siklus Sprint";
  if (path.startsWith("/admin/annual-bsc")) return "Annual BSC";
  if (path.startsWith("/manager/overview")) return "OKR Overview";
  if (path.startsWith("/leader/my-krs")) return "KR Saya";
  if (path.startsWith("/leader/initiatives")) return "Inisiatif Tim";
  if (path.startsWith("/team/my-work")) return "Pekerjaan Saya";
  if (path.startsWith("/approvals")) return "Persetujuan Task";
  if (path.startsWith("/strategy-map")) return "Strategy Map";
  if (path.startsWith("/bsc-view"))
    return "Strategic Mapping (Balanced Scorecard)";
  if (path.startsWith("/kr-history")) return "Riwayat Key Result";
  return "";
}

const headerTitle = computed(() => {
  const currentPath = route?.path || "";
  const menuTitle = getMenuTitleByPath(currentPath);
  if (menuTitle) return menuTitle;
  if (props.title && props.title !== "Profil Pengguna") return props.title;
  return props.title || "Dashboard";
});

const showNotifDropdown = ref(false);
const showChangePasswordModal = ref(false);
const showContextDropdown = ref(false);
const switching = ref(false);
const allDepartmentsList = ref([]);

const roleBadgeClass = computed(() => {
  return auth.user?.role?.toLowerCase().replace("_", "") || "";
});

const isCBoardUser = computed(() => {
  if (!auth.user) return false;
  if (auth.user.originalRole === "C_LEVEL" || auth.user.role === "C_LEVEL")
    return true;
  const pos = (auth.user.position || "").toUpperCase();
  return /CEO|CTO|CBO|CHIEF EXECUTIVE|CHIEF TECHNOLOGY|CHIEF BUSINESS/i.test(
    pos,
  );
});

const isCeo = computed(() => {
  if (!auth.user) return false;
  const pos = (auth.user.position || "").toUpperCase();
  return (
    (auth.user.role === "C_LEVEL" ||
      auth.user.originalRole === "C_LEVEL" ||
      auth.user.role === "MANAGER") &&
    /CEO|CHIEF EXECUTIVE/i.test(pos)
  );
});

const isOperatingAsManager = computed(() => {
  return (
    auth.user?.role === "MANAGER" &&
    (auth.user?.originalRole === "C_LEVEL" || isCBoardUser.value)
  );
});

const currentContextLabel = computed(() => {
  if (isOperatingAsManager.value) {
    return (
      auth.user?.activeDepartment || auth.user?.department || "Operasional"
    );
  }
  return "Strategic";
});

const availableSwitchDepts = computed(() => {
  if (isCeo.value || auth.user?.role === "ADMIN") {
    return allDepartmentsList.value.filter(
      (d) => d.value !== "STRATEGIC" && d.isActive !== false,
    );
  }
  const sponsored = auth.user?.strategicDepartments || [];
  if (sponsored.length > 0) {
    const sponsoredValues = sponsored.map((s) => s.value);
    return allDepartmentsList.value.filter(
      (d) => sponsoredValues.includes(d.value) && d.isActive !== false,
    );
  }
  return allDepartmentsList.value.filter(
    (d) => d.value !== "STRATEGIC" && d.isActive !== false,
  );
});

async function fetchHeaderDepartments() {
  if (!auth.token) return;
  const config = useRuntimeConfig();
  try {
    const res = await $fetch(`${config.public.apiBase}/departments`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    allDepartmentsList.value = res || [];
  } catch (err) {
    console.error("Failed to load departments in header:", err);
  }
}

function toggleContextDropdown() {
  showContextDropdown.value = !showContextDropdown.value;
  if (showContextDropdown.value && allDepartmentsList.value.length === 0) {
    fetchHeaderDepartments();
  }
}

async function switchContext(deptValue, targetRole) {
  switching.value = true;
  try {
    await auth.switchContext(deptValue, targetRole);
    showContextDropdown.value = false;
    if (deptValue === "STRATEGIC" || targetRole === "C_LEVEL") {
      navigateTo("/dashboard");
    } else {
      navigateTo("/manager/overview");
    }
  } catch (err) {
    alert(
      "Gagal beralih konteks: " +
        (err.data?.message || err.message || "Terjadi kesalahan"),
    );
  } finally {
    switching.value = false;
  }
}

function handleClickOutside(e) {
  if (!e.target.closest(".context-switcher-wrapper")) {
    showContextDropdown.value = false;
  }
  if (!e.target.closest(".notif-wrapper")) {
    showNotifDropdown.value = false;
  }
}

function toggleNotifDropdown() {
  showNotifDropdown.value = !showNotifDropdown.value;
}

function handleNotifClick(n) {
  notifStore.markRead(n.id);
  showNotifDropdown.value = false;
  if (n.link) {
    navigateTo(n.link);
  }
}

function formatTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return (
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
    ", " +
    d.toLocaleDateString()
  );
}

onMounted(() => {
  if (auth.isAuthenticated) {
    notifStore.startPolling();
    if (isCBoardUser.value) {
      fetchHeaderDepartments();
    }
  }
  if (typeof window !== "undefined") {
    document.addEventListener("click", handleClickOutside);
  }
});

onUnmounted(() => {
  notifStore.stopPolling();
  if (typeof window !== "undefined") {
    document.removeEventListener("click", handleClickOutside);
  }
});
</script>

<style scoped>
.app-header {
  height: 72px;
  min-height: 72px;
  background: var(--header-bg);
  border-bottom: 1px solid var(--card-border);
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.hamburger-btn {
  display: flex;
  background: transparent;
  border: 1px solid var(--input-border);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.hamburger-btn:hover {
  background-color: var(--bg-page);
  color: var(--color-primary);
  border-color: var(--input-border);
}

@media (max-width: 1024px) {
  .app-header {
    padding: 0 16px;
  }
}

.header-title {
  font-family: "Rubik", sans-serif;
  font-weight: 600;
  font-size: 27px;
  line-height: 32px;
  color: var(--text-heading);
  margin: 0;
}

@media (max-width: 480px) {
  .header-title {
    font-size: 20px;
    line-height: 26px;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
/* Dynamic Context Switcher */
.context-switcher-wrapper {
  position: relative;
}

.context-switcher-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 6px 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.context-switcher-btn:hover {
  background: #ffffff;
  border-color: #cbd5e1;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
}

.context-switcher-btn.in-manager-mode {
  background: #f0fdf4;
  border-color: #86efac;
}

.context-switcher-btn.in-manager-mode:hover {
  background: #dcfce7;
  border-color: #4ade80;
}

.context-icon {
  font-size: 16px;
  line-height: 1;
}

.context-label-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.context-role-tag {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  line-height: 1.1;
}

.in-manager-mode .context-role-tag {
  color: #15803d;
}

.context-text {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.2;
}

.chevron-icon {
  color: #94a3b8;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.chevron-icon.open {
  transform: rotate(180deg);
}

.context-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 340px;
  max-height: 480px;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.1),
    0 8px 10px -6px rgba(0, 0, 0, 0.05);
  z-index: 100;
  padding: 0;
}

.context-dropdown-header {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
  border-radius: 14px 14px 0 0;
}

.dropdown-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dropdown-title {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.switching-indicator {
  font-size: 11px;
  font-weight: 600;
  color: #0284c7;
  animation: pulse 1.5s infinite;
}

.dropdown-sub {
  font-size: 11px;
  color: #64748b;
  margin: 3px 0 0;
  line-height: 1.3;
}

.context-options-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.context-divider {
  padding: 8px 10px 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #94a3b8;
}

.context-option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.context-option-item:hover {
  background: #f1f5f9;
}

.context-option-item.active {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.context-option-item.strategic-option.active {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.option-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.option-icon-box.crown-box {
  background: #fef3c7;
}

.option-icon-box.dept-box {
  background: #e0f2fe;
}

.option-text-group {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.dept-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dept-code-tag {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  background: #e2e8f0;
  color: #475569;
  border-radius: 4px;
}

.option-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.option-desc {
  font-size: 11px;
  color: #64748b;
  line-height: 1.2;
}

.active-indicator {
  font-size: 14px;
  font-weight: 700;
  color: #16a34a;
  flex-shrink: 0;
}

.strategic-option .active-indicator {
  color: #0284c7;
}

.empty-context-hint {
  font-size: 12px;
  color: #94a3b8;
  padding: 10px;
  text-align: center;
}

.notif-wrapper {
  position: relative;
}

.notif-bell-btn {
  position: relative;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5e718d;
  cursor: pointer;
  transition: all 0.2s;
}

.notif-bell-btn:hover {
  background: #f8fafc;
  color: #0e97d6;
  border-color: #cbd5e1;
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #eb3123;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1;
}

.notif-dropdown {
  position: absolute;
  right: 0;
  top: 48px;
  width: 320px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 100;
  overflow: hidden;
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.notif-header-title {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.notif-mark-all-btn {
  background: none;
  border: none;
  color: #0e97d6;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.notif-mark-all-btn:hover {
  text-decoration: underline;
}

.notif-body-list {
  max-height: 340px;
  overflow-y: auto;
}

.notif-empty {
  padding: 24px 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

.notif-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background-color 0.15s;
}

.notif-item:hover {
  background-color: #f8fafc;
}

.notif-item.unread {
  background-color: #f0f9ff;
  border-left: 3px solid #0e97d6;
}

.notif-item-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 2px;
}

.notif-item-text {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.notif-item-time {
  font-size: 10px;
  color: #94a3b8;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-badge {
  font-family: "Rubik", sans-serif;
  font-size: 14px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  background: #eff6ff;
  color: #0e97d6;
}

.user-badge.admin {
  background: #fff1f2;
  color: #eb3123;
}

.user-badge.clevel {
  background: #f0fdfa;
  color: #0583c3;
}

.user-badge.manager {
  background: #fffbeb;
  color: #b45309;
}

.user-name {
  font-family: "Rubik", sans-serif;
  font-size: 17px;
  font-weight: 500;
  color: #5e718d;
}
</style>

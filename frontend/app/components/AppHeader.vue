<template>
  <header class="app-header">
    <div class="header-left">
      <button
        class="hamburger-btn"
        @click="emit('toggle-sidebar')"
        aria-label="Toggle Sidebar"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>
      <h1 class="header-title">{{ title }}</h1>
    </div>
    <div class="header-right">
      <slot name="actions" />

      <div
        v-if="auth.user"
        class="user-info"
        style="
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        "
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
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { useNotificationStore } from "../stores/notification";

const auth = useAuthStore();
const notifStore = useNotificationStore();
const emit = defineEmits(["toggle-sidebar"]);

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
});

const showNotifDropdown = ref(false);

const roleBadgeClass = computed(() => {
  return auth.user?.role?.toLowerCase().replace("_", "") || "";
});

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
  }
});

onUnmounted(() => {
  notifStore.stopPolling();
});
</script>

<style scoped>
.app-header {
  height: 72px;
  min-height: 72px;
  background: #ffffff;
  border-bottom: 1px solid #f0f3f9;
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
  display: none;
  background: transparent;
  border: none;
  color: #5e718d;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.hamburger-btn:hover {
  background-color: #f8fafc;
}

@media (max-width: 1024px) {
  .hamburger-btn {
    display: flex;
  }
  .app-header {
    padding: 0 16px;
  }
}

.header-title {
  font-family: "Rubik", sans-serif;
  font-weight: 600;
  font-size: 27px;
  line-height: 32px;
  color: #2d3643;
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

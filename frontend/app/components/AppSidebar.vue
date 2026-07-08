<template>
  <aside class="sidebar">
    <!-- Logo Section -->
    <div class="logo-section">
      <img src="/logo.png" alt="Skolla Logo" class="logo-icon" />
    </div>

    <!-- Navigation -->
    <nav class="nav-container">
      <div class="nav-group">
        <p class="nav-group-label">MENU UTAMA</p>
        <NuxtLink to="/dashboard" class="nav-item" active-class="nav-active">
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
        <NuxtLink to="/bsc-view" class="nav-item" active-class="nav-active">
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
        <NuxtLink to="/strategy-map" class="nav-item" active-class="nav-active">
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
            <path d="M12 8v4" />
            <path d="M12 12H5v4" />
            <path d="M12 12h7v4" />
          </svg>
          <span>Causal Map</span>
        </NuxtLink>
      </div>

      <!-- Admin menu - hanya muncul setelah login sebagai admin -->
      <div v-if="isAdmin" class="nav-group">
        <p class="nav-group-label">ADMIN</p>
        <NuxtLink
          to="/admin/objectives"
          class="nav-item"
          active-class="nav-active"
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
          to="/admin/update-progress"
          class="nav-item"
          active-class="nav-active"
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
      <NuxtLink v-else to="/login" class="footer-action">
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
        <span>Login Admin</span>
      </NuxtLink>
    </div>
  </aside>
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const isAuthenticated = computed(() => auth.isAuthenticated);
const isAdmin = computed(
  () => auth.isAuthenticated && auth.user?.role === "ADMIN",
);

function handleLogout() {
  auth.logout();
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

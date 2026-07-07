<template>
  <div class="dashboard-root">
    <div class="dashboard-card">
      <div class="welcome-header">
        <div class="user-avatar">{{ userInitial }}</div>
        <div>
          <h1>Selamat Datang, {{ auth.user?.name || 'User' }}!</h1>
          <p>{{ auth.user?.email }}</p>
        </div>
        <div class="index-theme-toggle">
          <ThemeToggle />
        </div>
      </div>

      <div class="user-details">
        <div class="detail-row">
          <span class="label">User ID:</span>
          <span class="value code">{{ auth.user?.id }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Peran (Role):</span>
          <span class="value badge" :class="auth.user?.role?.toLowerCase()">{{ auth.user?.role }}</span>
        </div>
        <div class="detail-row" v-if="auth.user?.teamId">
          <span class="label">Team ID:</span>
          <span class="value code">{{ auth.user?.teamId }}</span>
        </div>
      </div>

      <div class="action-section">
        <NuxtLink to="/dashboard" class="admin-panel-btn">
          Lihat Dashboard OKR
        </NuxtLink>
        <NuxtLink v-if="auth.user?.role === 'ADMIN'" to="/admin/objectives" class="admin-panel-btn secondary">
          Buat OKR
        </NuxtLink>
        <NuxtLink v-if="auth.user?.role === 'ADMIN'" to="/admin/update-progress" class="admin-panel-btn secondary">
          Update Capaian
        </NuxtLink>
        <button @click="handleLogout" class="logout-btn">
          Keluar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

const userInitial = computed(() => {
  if (!auth.user?.name) return 'U';
  return auth.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
});

function handleLogout() {
  auth.logout();
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

.dashboard-root {
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-gradient);
  padding: 20px;
}

.dashboard-card {
  background: var(--card-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--card-border);
  padding: 40px;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  box-shadow: var(--card-shadow);
  color: var(--text-color);
  animation: scaleUp 0.5s ease-out;
}

@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.welcome-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--divider-color);
  width: 100%;
}

.index-theme-toggle {
  margin-left: auto;
}

.user-avatar {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #00d2ff 0%, #0066ff 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  box-shadow: 0 8px 16px rgba(0, 102, 255, 0.3);
}

.welcome-header h1 {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.welcome-header p {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 30px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--timeline-item-bg);
  border-radius: 8px;
  border: 1px solid var(--timeline-item-border);
}

.label {
  color: var(--text-secondary);
  font-size: 14px;
}

.value {
  font-weight: 500;
  font-size: 14px;
}

.value.code {
  font-family: monospace;
  background: var(--input-bg);
  padding: 2px 6px;
  border-radius: 4px;
}

.value.badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.value.badge.admin {
  background: rgba(255, 75, 75, 0.15);
  color: #ff8888;
  border: 1px solid rgba(255, 75, 75, 0.3);
}

.value.badge.manager {
  background: rgba(255, 170, 0, 0.15);
  color: #ffcc66;
  border: 1px solid rgba(255, 170, 0, 0.3);
}

.value.badge.c_level {
  background: rgba(138, 43, 226, 0.15);
  color: #d8b4fe;
  border: 1px solid rgba(138, 43, 226, 0.3);
}

.value.badge.employee {
  background: rgba(0, 210, 255, 0.15);
  color: #8ce9ff;
  border: 1px solid rgba(0, 210, 255, 0.3);
}

.action-section {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.admin-panel-btn {
  background: linear-gradient(135deg, #00d2ff 0%, #0066ff 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 102, 255, 0.2);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-panel-btn.secondary {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  box-shadow: none;
}

.admin-panel-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.admin-panel-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 102, 255, 0.3);
}

.logout-btn {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--nav-btn-border);
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 75, 75, 0.1);
  color: #ff8888;
  border-color: rgba(255, 75, 75, 0.4);
}
</style>

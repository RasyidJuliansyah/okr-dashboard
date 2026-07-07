<template>
  <div class="app-layout" :class="{ 'with-shell': showShell }">
    <NuxtRouteAnnouncer />
    <AppSidebar v-if="showShell" />
    <div :class="['main-wrapper', { 'with-sidebar': showShell }]">
      <AppHeader v-if="showShell" :title="pageTitle" />
      <main :class="['page-content', { 'padded-content': showShell }]">
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth";
import AppSidebar from "./components/AppSidebar.vue";
import AppHeader from "./components/AppHeader.vue";

const auth = useAuthStore();
const route = useRoute();

const isAuthenticated = computed(() => auth.isAuthenticated);
const isLoginPage = computed(() => route.path === "/login");
const showShell = computed(() => isAuthenticated.value && !isLoginPage.value);

const pageTitle = computed(() => {
  const path = route.path;
  if (path.startsWith("/dashboard")) return "Dashboard OKR";
  if (path.startsWith("/bsc-view"))
    return "Strategic Mapping (Balanced Scorecard)";
  if (path.startsWith("/strategy-map")) return "Causal Map";
  if (path.startsWith("/admin/objectives")) return "OKR Builder";
  if (path.startsWith("/admin/update-progress")) return "Update Capaian";
  return "Profil Pengguna";
});
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&family=Geist:wght@500;800&display=swap");

/* ===== SKOLLA DESIGN SYSTEM TOKENS ===== */
:root {
  /* Brand */
  --color-navy: #010571;
  --color-blue-primary: #0e97d6;
  --color-blue-light: #30b1e8;

  /* Semantic */
  --color-success: #00a925;
  --color-danger: #eb3123;
  --color-warning: #f2ca17;

  /* Text */
  --text-heading: #2d3643;
  --text-body: #0f1623;
  --text-muted: #0f1623;
  --text-dark: #0f1623;
  --text-slate: ##0f1623;

  /* Surface (Light Mode) */
  --surface-white: #ffffff;
  --surface-page: #f0f3f9;
  --surface-icon-bg: #fafcff;
  --border-default: #f0f3f9;
  --border-subtle: #e2e8f0;

  /* Layout */
  --sidebar-width: 240px;
  --header-height: 72px;
  --content-padding: 32px;

  /* Legacy aliases (untuk backward compat halaman lama) */
  --bg-gradient: #f0f3f9;
  --text-color: #0f1623;
  --text-secondary: #0f1623;
  --card-bg: #ffffff;
  --card-border: #f0f3f9;
  --input-bg: #fafcff;
  --input-border: #e2e8f0;
  --card-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  --modal-bg: #ffffff;
  --accent-color: #0e97d6;
  --divider-color: #f0f3f9;
  --timeline-item-bg: #fafcff;
  --timeline-item-border: #f0f3f9;
}

/* Dark Mode */
:root.dark-theme {
  --surface-white: #141b2a;
  --surface-page: #0f1623;
  --surface-icon-bg: #1e2736;
  --border-default: rgba(255, 255, 255, 0.08);
  --border-subtle: rgba(255, 255, 255, 0.12);
  --text-heading: #0f1623;
  --text-body: #0f1623;
  --text-muted: #0f1623;

  /* Legacy aliases dark */
  --bg-gradient: #0f1623;
  --text-color: #0f1623;
  --text-secondary: #0f1623;
  --card-bg: #1e2736;
  --card-border: rgba(255, 255, 255, 0.08);
  --input-bg: rgba(255, 255, 255, 0.05);
  --input-border: rgba(255, 255, 255, 0.12);
  --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  --modal-bg: #141b2a;
  --divider-color: rgba(255, 255, 255, 0.08);
  --timeline-item-bg: rgba(255, 255, 255, 0.03);
  --timeline-item-border: rgba(255, 255, 255, 0.06);
}

* {
  box-sizing: border-box;
}

body {
  font-family: "Rubik", sans-serif;
  background: var(--surface-page);
  color: var(--text-heading);
  margin: 0;
  overflow-x: hidden;
}

p {
  color: var(--text-body);
}

/* Layout shell wrapper styles */
.app-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

.main-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  width: 100%;
}

.main-wrapper.with-sidebar {
  margin-left: var(--sidebar-width);
  width: calc(100% - var(--sidebar-width));
}

.page-content {
  flex: 1;
  width: 100%;
}

.page-content.padded-content {
  padding: var(--content-padding);
}
</style>

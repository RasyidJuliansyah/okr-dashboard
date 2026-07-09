<template>
  <div class="app-layout" :class="{ 'with-shell': showShell }">
    <NuxtRouteAnnouncer />
    
    <!-- Sidebar backdrop overlay (mobile only) -->
    <div 
      v-if="showShell && isSidebarOpen" 
      class="sidebar-overlay" 
      @click="isSidebarOpen = false"
    ></div>

    <AppSidebar v-if="showShell" :isOpen="isSidebarOpen" @close="isSidebarOpen = false" />
    <div :class="['main-wrapper', { 'with-sidebar': showShell }]">
      <AppHeader v-if="showShell" :title="pageTitle" @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />
      <main :class="['page-content', { 'padded-content': showShell }]">
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth";
import AppSidebar from "./components/AppSidebar.vue";
import AppHeader from "./components/AppHeader.vue";

const auth = useAuthStore();
const route = useRoute();

const isSidebarOpen = ref(false);

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
  /* primary */
  --color-primary: #0e97d6;
  --color-primary-rgb: 14, 151, 214;
  --color-primary-contrast: var(--awsm-color-contrast-dark);
  --color-primary-contrast-rgb: 242, 242, 242;
  --color-primary-tint: #cfeaf7;
  --color-primary-shade: #1e6289;
  --color-primary-tone: #548fb9;

  /* secondary */
  --color-secondary: #f2ca17;
  --color-secondary-rgb: 242, 202, 23;
  --color-secondary-contrast: var(--awsm-color-contrast-light);
  --color-secondary-contrast-rgb: 13, 13, 13;
  --color-secondary-tint: #fbdb75;
  --color-secondary-shade: #9b821c;
  --color-secondary-tone: #ceb04d;

  /* accent */
  --color-accent: #ffffff;
  --color-accent-rgb: 255, 255, 255;
  --color-accent-contrast: var(--awsm-color-contrast-light);
  --color-accent-contrast-rgb: 13, 13, 13;
  --color-accent-tint: #ffffff;
  --color-accent-shade: #a2a2a2;
  --color-accent-tone: #d3d3d3;

  /* util-info */
  --color-util-info: #0e97d6;
  --color-util-info-rgb: 14, 151, 214;
  --color-util-info-contrast: var(--awsm-color-contrast-dark);
  --color-util-info-contrast-rgb: 242, 242, 242;
  --color-util-info-tint: #7fb9e4;
  --color-util-info-shade: #1e6289;
  --color-util-info-tone: #548fb9;

  /* util-safe */
  --color-util-safe: #49d507;
  --color-util-safe-rgb: 73, 213, 7;
  --color-util-safe-contrast: var(--awsm-color-contrast-light);
  --color-util-safe-contrast-rgb: 13, 13, 13;
  --color-util-safe-tint: #94e571;
  --color-util-safe-shade: #378917;
  --color-util-safe-tone: #69b949;

  /* util-warning */
  --color-util-warning: #f2af17;
  --color-util-warning-rgb: 242, 175, 23;
  --color-util-warning-contrast: var(--awsm-color-contrast-light);
  --color-util-warning-contrast-rgb: 13, 13, 13;
  --color-util-warning-tint: #fcc971;
  --color-util-warning-shade: #9b711a;
  --color-util-warning-tone: #ce9f49;

  /* util-alert */
  --color-util-alert: #f97066;
  --color-util-alert-rgb: 249, 112, 102;
  --color-util-alert-contrast: var(--awsm-color-contrast-light);
  --color-util-alert-contrast-rgb: 13, 13, 13;
  --color-util-alert-tint: #ffa296;
  --color-util-alert-shade: #a04b44;
  --color-util-alert-tone: #d3796f;

  /* gamma */
  --card-bg: #ffffff;
  --card-border: #e4e4e4;
  --content-bg: #fafcff;
  --color-green: #009c29;
  --color-purple: #02219e;
  --color-red: #eb3123;
  --color-white: #ffffff;
  --color-yellow: #f29317;
  --color-border: #afbaca;
  --color-purple-badge: #eef5ff;
  --color-green-badge: #e3fdea;
  --color-yellow-badge: #fefbe5;
  --color-black-badge: #455468;
  --color-red-badge: #ffeaed;
  --color-field: #f0f3f9;
  --color-gamma-900: #f2f2f2;
  --color-gamma-850: #e4e4e4;
  --color-gamma-750: #c9c9c9;
  --color-gamma-700: #bcbcbc;
  --color-gamma-650: #aeaeae;
  --color-gamma-600: #a1a1a1;
  --color-gamma-550: #949494;
  --color-gamma-500: #868686;
  --color-gamma-450: #797979;
  --color-gamma-400: #6b6b6b;
  --color-gamma-350: #5e5e5e;
  --color-gamma-300: #515151;
  --color-gamma-250: #434343;
  --color-gamma-200: #363636;
  --color-gamma-150: #282828;
  --color-gamma-100: #1b1b1b;
  --color-gamma-050: #0d0d0d;
  --color-gamma-000: #000000;

  /* base */
  --color-base-light: var(--color-gamma-800);
  --color-base-light-rgb: 215, 215, 215;
  --color-base-dark: var(--color-gamma-150);
  --color-base-dark-rgb: 40, 40, 40;

  /* contrast */
  --color-contrast-light: var(--color-gamma-050);
  --color-contrast-light-rgb: 13, 13, 13;
  --color-contrast-dark: var(--color-gamma-900);
  --color-contrast-dark-rgb: 242, 242, 242;

  /* text */
  --color-text-strong: var(--color-gamma-050);
  --color-text-regular: var(--color-gamma-150);
  --color-text-subtle: var(--color-gamma-250);
  --color-text-accent: var(--color-primary-tone);
}

:root {
  /* font-size */
  --font-size-xs: 11.104px;
  --font-size-s: 13.328px;
  --font-size-n: 16px;
  --font-size-l: 19.2px;
  --font-size-xl: 23.04px;
  --font-size-xxl: 27.648px;

  /* icon-size */
  --icon-size-xs: 0.867rem;
  --icon-size-s: 1.041rem;
  --icon-size-n: 1.25rem;
  --icon-size-l: 1.5rem;
  --icon-size-xl: 1.8rem;
  --icon-size-xxl: 2.16rem;

  /* line-height */
  --line-height-tight: 1.2;
  --line-height-regular: 1.6;
  --line-height-loose: 2.133;
}

:root {
  /* spacing */
  --space-012: 0.125rem;
  --space-025: 0.25rem;
  --space-050: 0.5rem;
  --space-075: 0.75rem;
  --space-100: 1rem;
  --space-125: 1.25rem;
  --space-150: 1.5rem;
  --space-175: 1.75rem;
  --space-200: 2rem;

  /* local */
  --side-gap: var(--awsm-space-100);
  --col-gap: var(--awsm-space-100);
  --width-min: 360px;
  --width-max: 1200px;
}

:root {
  /* radius */
  --radius-small: 0.25rem;
  --radius-medium: 0.5rem;
  --radius-large: 1rem;
  --radius-round: 50%;
  --radius-pill: 9999px;

  /* shadow */
  --shadow-color: #c836e8;
  --shadow-color-rgb: 200, 54, 232;
  --shadow-small:
    0px 1px 1px rgba(var(--awsm-shadow-color-rgb), 0.2),
    0px 1px 2px -0.5px rgba(var(--awsm-shadow-color-rgb), 0.45),
    0px 1px 4px -3px rgba(var(--awsm-shadow-color-rgb), 0.35);
  --shadow-medium:
    0px 1px 1px -0.5px rgba(var(--awsm-shadow-color-rgb), 0.1),
    0px 1px 2px -1px rgba(var(--awsm-shadow-color-rgb), 0.25),
    0px 2px 3px -1.5px rgba(var(--awsm-shadow-color-rgb), 0.3),
    0px 5px 6px -2px rgba(var(--awsm-shadow-color-rgb), 0.4);
  --shadow-large:
    0px 0.5px 0.5px rgba(var(--awsm-shadow-color-rgb), 0.2),
    0px 2px 2px -0.5px rgba(var(--awsm-shadow-color-rgb), 0.25),
    0px 5px 6px -1px rgba(var(--awsm-shadow-color-rgb), 0.25),
    0px 8px 9px -1px rgba(var(--awsm-shadow-color-rgb), 0.3),
    0px 12px 14px -2px rgba(var(--awsm-shadow-color-rgb), 0.3),
    0px 16px 20px -3px rgba(var(--awsm-shadow-color-rgb), 0.25);

  /* duration */
  --duration-instant: 0.118s;
  --duration-short: 0.158s;
  --duration-regular: 0.21s;
  --duration-long: 0.28s;
  --duration-extra: 0.373s;
}

/* Dark Theme Override */
/* .dark-theme {
  --bg-primary: #0b0f19;
  --bg-secondary: #131a2c;
  --bg-card: rgba(22, 30, 49, 0.85);
  --bg-input: rgba(255, 255, 255, 0.04);
  --border-color: rgba(255, 255, 255, 0.07);
  --border-strong: rgba(255, 255, 255, 0.12);
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  --primary: #38b6f0;
  --primary-dark: #0e97d6;
  --primary-glow: rgba(56, 182, 240, 0.15);
  --primary-light: rgba(56, 182, 240, 0.08);
  --purple: #a78bfa;
  --purple-glow: rgba(167, 139, 250, 0.15);

  --green: #34d399;
  --green-glow: rgba(52, 211, 153, 0.1);
  --green-light: rgba(52, 211, 153, 0.1);
  --orange: #fbbf24;
  --orange-glow: rgba(251, 191, 36, 0.1);
  --orange-light: rgba(251, 191, 36, 0.1);
  --red: #f87171;
  --red-glow: rgba(248, 113, 113, 0.1);
  --red-light: rgba(248, 113, 113, 0.1);

  --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.3);
  --shadow-elevated: 0 8px 32px rgba(0, 0, 0, 0.4);
  --shadow-premium: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
} */

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
  flex-direction: row;
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
  margin-left: 0;
  margin-top: 0;
  width: 100%;
}

.page-content {
  flex: 1;
  width: 100%;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(13, 21, 37, 0.5);
  backdrop-filter: blur(4px);
  z-index: 99;
}
</style>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<style>
/* Global CSS variables for theme management */
:root {
  /* Light Theme (default fallback) */
  --bg-gradient: radial-gradient(circle at 10% 20%, rgb(243, 246, 250) 0%, rgb(222, 230, 240) 90%);
  --text-color: #1e293b;
  --text-secondary: #64748b;
  --card-bg: rgba(255, 255, 255, 0.7);
  --card-border: rgba(0, 0, 0, 0.08);
  --input-bg: rgba(0, 0, 0, 0.03);
  --input-border: rgba(0, 0, 0, 0.1);
  --card-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  --header-bg: rgba(255, 255, 255, 0.4);
  --header-border: rgba(0, 0, 0, 0.06);
  --nav-btn-bg: rgba(0, 0, 0, 0.04);
  --nav-btn-border: rgba(0, 0, 0, 0.08);
  --nav-btn-text: #1e293b;
  --modal-bg: #ffffff;
  --timeline-item-bg: rgba(0, 0, 0, 0.02);
  --timeline-item-border: rgba(0, 0, 0, 0.04);
  --divider-color: rgba(0, 0, 0, 0.08);
  --accent-color: #00d2ff;
}

/* Dark Theme class attached to documentElement */
:root.dark-theme {
  --bg-gradient: radial-gradient(circle at 10% 20%, rgb(15, 22, 38) 0%, rgb(8, 12, 21) 90%);
  --text-color: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.5);
  --card-bg: rgba(255, 255, 255, 0.03);
  --card-border: rgba(255, 255, 255, 0.06);
  --input-bg: rgba(255, 255, 255, 0.05);
  --input-border: rgba(255, 255, 255, 0.1);
  --card-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  --header-bg: rgba(255, 255, 255, 0.02);
  --header-border: rgba(255, 255, 255, 0.06);
  --nav-btn-bg: rgba(255, 255, 255, 0.05);
  --nav-btn-border: rgba(255, 255, 255, 0.1);
  --nav-btn-text: #ffffff;
  --modal-bg: #141b2a;
  --timeline-item-bg: rgba(255, 255, 255, 0.02);
  --timeline-item-border: rgba(255, 255, 255, 0.04);
  --divider-color: rgba(255, 255, 255, 0.08);
  --accent-color: #00d2ff;
}
</style>

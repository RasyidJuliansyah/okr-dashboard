<template>
  <button
    class="theme-toggle"
    @click="toggleTheme"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    :title="isDark ? 'Mode terang' : 'Mode gelap'"
  >
    <svg v-if="isDark" class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
    <svg v-else class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </button>
</template>

<script setup>
const { isDark, toggleTheme } = useTheme();
</script>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--card-border, #e4e4e4);
  border-radius: 50%;
  background: var(--card-bg, #ffffff);
  color: var(--text-body, #334155);
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;
}
.theme-toggle:hover {
  border-color: var(--color-primary, #0e97d6);
  color: var(--color-primary, #0e97d6);
}
.toggle-icon { width: 18px; height: 18px; }
</style>

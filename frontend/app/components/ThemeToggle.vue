<template>
  <button @click="theme.toggleTheme()" class="theme-toggle-btn" :title="theme.isDark.value ? 'Mode Terang' : 'Mode Gelap'">
    {{ theme.isDark.value ? '☀️' : '🌙' }}
  </button>
</template>

<script setup>
import { useTheme } from '../composables/useTheme';
const theme = useTheme();
</script>

<style scoped>
.theme-toggle-btn {
  background: var(--nav-btn-bg);
  border: 1px solid var(--nav-btn-border);
  color: var(--nav-btn-text);
  font-size: 16px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.theme-toggle-btn:hover {
  transform: scale(1.05);
  background: var(--card-bg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>

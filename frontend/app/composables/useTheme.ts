import { ref, onMounted } from 'vue';

export function useTheme() {
  const isDark = ref(true); // Force dark mode by default

  const toggleTheme = () => {
    // Disabled
  };

  const updateTheme = () => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    }
  };

  onMounted(() => {
    if (typeof window !== 'undefined') {
      updateTheme();
    }
  });

  return {
    isDark,
    toggleTheme
  };
}

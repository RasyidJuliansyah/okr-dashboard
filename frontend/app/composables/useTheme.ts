import { ref, onMounted } from 'vue';

export function useTheme() {
  const isDark = ref(true); // Default to dark theme matching existing design

  const toggleTheme = () => {
    isDark.value = !isDark.value;
    updateTheme();
  };

  const updateTheme = () => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      if (isDark.value) {
        root.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
      }
    }
  };

  onMounted(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      isDark.value = savedTheme !== 'light';
      updateTheme();
    }
  });

  return {
    isDark,
    toggleTheme
  };
}

import { onMounted } from "vue";

export function useTheme() {
  const isDark = useState("theme-dark", () => false);

  const applyTheme = (dark: boolean) => {
    if (typeof window === "undefined") return;
    document.documentElement.classList.toggle("dark-theme", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  };

  const toggleTheme = () => {
    isDark.value = !isDark.value;
    applyTheme(isDark.value);
  };

  onMounted(() => {
    const saved = localStorage.getItem("theme");
    if (saved !== null) {
      isDark.value = saved === "dark";
    } else {
      isDark.value = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    applyTheme(isDark.value);
  });

  return { isDark, toggleTheme };
}


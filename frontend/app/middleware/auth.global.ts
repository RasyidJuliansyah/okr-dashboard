import { useAuthStore } from "../stores/auth";

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware during SSR / on server to prevent redirect loops or access errors before hydration
  if (import.meta.server) return;

  const auth = useAuthStore();

  if (
    auth.isAuthenticated &&
    auth.user &&
    (auth.user.department === undefined ||
      auth.user.managedDepartments === undefined)
  ) {
    auth
      .fetchUser()
      .catch((err) => console.error("Failed to auto-fetch user info:", err));
  }

  if (!auth.isAuthenticated && to.path !== "/login") {
    return navigateTo("/login");
  }

  if (auth.isAuthenticated && to.path === "/login") {
    return navigateTo("/dashboard");
  }

  if (to.path === "/") {
    return navigateTo("/dashboard");
  }

  if (to.path.startsWith("/admin") && auth.user?.role !== "ADMIN") {
    return navigateTo("/dashboard");
  }

  if (
    to.path.startsWith("/c-level") &&
    !["C_LEVEL", "ADMIN"].includes(auth.user?.role || "")
  ) {
    return navigateTo("/dashboard");
  }
});

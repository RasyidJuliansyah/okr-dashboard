import { useAuthStore } from '../stores/auth';

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware during SSR / on server to prevent redirect loops or access errors before hydration
  if (import.meta.server) return;

  const auth = useAuthStore();

  if (!auth.isAuthenticated && to.path !== '/login') {
    return navigateTo('/login');
  }

  if (auth.isAuthenticated && to.path === '/login') {
    return navigateTo('/');
  }

  if (to.path.startsWith('/admin') && auth.user?.role !== 'ADMIN') {
    return navigateTo('/');
  }
});

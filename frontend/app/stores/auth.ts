import { defineStore } from 'pinia';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId?: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null as string | null,
    user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth_user') || 'null') : null as User | null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role || null,
  },
  actions: {
    async login(email: string, password: string) {
      const config = useRuntimeConfig();
      try {
        const response = await $fetch<{ token: string; user: User }>(`${config.public.apiBase}/auth/login`, {
          method: 'POST',
          body: { email, password },
        });

        this.token = response.token;
        this.user = response.user;

        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('auth_user', JSON.stringify(response.user));
        }

        return response;
      } catch (error: any) {
        console.error('Store login error:', error);
        throw error.data || { message: 'Authentication failed' };
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
      navigateTo('/login');
    },
    async fetchUser() {
      if (!this.token) return;
      const config = useRuntimeConfig();
      try {
        const response = await $fetch<User>(`${config.public.apiBase}/auth/me`, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
        this.user = response;
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_user', JSON.stringify(response));
        }
      } catch (error) {
        console.error('Fetch user error, logging out...', error);
        this.logout();
      }
    }
  },
});

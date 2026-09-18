import { defineStore } from "pinia";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId?: string | null;
  department?: string | null;
  isDepartmentActive?: boolean;
  managedDepartments?: string[];
}

export const useAuthStore = defineStore("auth", {
  state: () => {
    const tokenCookie = useCookie<string | null>("auth_token", {
      maxAge: 60 * 60 * 24 * 7,
    });
    const userCookie = useCookie<User | null>("auth_user", {
      maxAge: 60 * 60 * 24 * 7,
    });

    return {
      token: tokenCookie.value || null,
      user: userCookie.value || null,
    };
  },
  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role || null,
  },
  actions: {
    async login(email: string, password: string) {
      const config = useRuntimeConfig();
      try {
        const response = await $fetch<{ token: string; user: User }>(
          `${config.public.apiBase}/auth/login`,
          {
            method: "POST",
            body: { email, password },
          },
        );

        this.token = response.token;
        this.user = response.user;

        const tokenCookie = useCookie<string | null>("auth_token", {
          maxAge: 60 * 60 * 24 * 7,
        });
        const userCookie = useCookie<User | null>("auth_user", {
          maxAge: 60 * 60 * 24 * 7,
        });
        tokenCookie.value = response.token;
        userCookie.value = response.user;

        if (typeof window !== "undefined") {
          localStorage.setItem("auth_token", response.token);
          localStorage.setItem("auth_user", JSON.stringify(response.user));
        }

        return response;
      } catch (error: any) {
        console.error("Store login error:", error);
        const errorMessage =
          error.data?.message || error.message || "Authentication failed";
        throw new Error(errorMessage);
      }
    },
    logout() {
      this.token = null;
      this.user = null;

      const tokenCookie = useCookie<string | null>("auth_token");
      const userCookie = useCookie<User | null>("auth_user");
      tokenCookie.value = null;
      userCookie.value = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
      navigateTo("/login");
    },
    async fetchUser() {
      if (!this.token) return;
      const config = useRuntimeConfig();
      try {
        const response = await $fetch<User>(
          `${config.public.apiBase}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          },
        );
        this.user = response;

        const userCookie = useCookie<User | null>("auth_user", {
          maxAge: 60 * 60 * 24 * 7,
        });
        userCookie.value = response;

        if (typeof window !== "undefined") {
          localStorage.setItem("auth_user", JSON.stringify(response));
        }
      } catch (error) {
        console.error("Fetch user error, logging out...", error);
        this.logout();
      }
    },
  },
});

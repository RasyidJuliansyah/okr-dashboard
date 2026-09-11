import { useAuthStore } from "../stores/auth";

export interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  position?: string;
}

export function useAssignment() {
  const auth = useAuthStore();
  const config = useRuntimeConfig();

  const fetchAvailableLeaders = async (
    department?: string,
  ): Promise<UserOption[]> => {
    if (!auth.token) return [];
    try {
      const query = department
        ? `?department=${encodeURIComponent(department)}`
        : "";
      const users = await $fetch<UserOption[]>(
        `${config.public.apiBase}/users${query}`,
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        },
      );
      return users.filter((u) => u.role === "LEADER");
    } catch (error) {
      console.error("Fetch leaders error:", error);
      return [];
    }
  };

  const fetchAvailableTeamMembers = async (
    department?: string,
  ): Promise<UserOption[]> => {
    if (!auth.token) return [];
    try {
      const query = department
        ? `?department=${encodeURIComponent(department)}`
        : "";
      const users = await $fetch<UserOption[]>(
        `${config.public.apiBase}/users${query}`,
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        },
      );
      return users.filter((u) => u.role === "TEAM");
    } catch (error) {
      console.error("Fetch team members error:", error);
      return [];
    }
  };

  const reassignInitiative = async (
    initiativeId: string,
    newLeaderId: string,
  ): Promise<any> => {
    if (!auth.token) return null;
    return await $fetch(
      `${config.public.apiBase}/initiatives/${initiativeId}/reassign`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: { newLeaderId },
      },
    );
  };

  return {
    fetchAvailableLeaders,
    fetchAvailableTeamMembers,
    reassignInitiative,
  };
}

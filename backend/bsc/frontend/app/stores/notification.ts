import { defineStore } from "pinia";
import { useAuthStore } from "./auth";

export interface NotificationItem {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    notifications: [] as NotificationItem[],
    unreadCount: 0,
    pollingInterval: null as any,
  }),
  actions: {
    async fetchNotifications() {
      const auth = useAuthStore();
      if (!auth.token) return;
      const config = useRuntimeConfig();

      try {
        const data = await $fetch<{
          notifications: NotificationItem[];
          unreadCount: number;
        }>(`${config.public.apiBase}/notifications?unread=true`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        this.notifications = data.notifications;
        this.unreadCount = data.unreadCount;
      } catch (error) {
        console.error("Fetch notifications error:", error);
      }
    },

    startPolling() {
      if (this.pollingInterval) return;
      this.fetchNotifications();
      this.pollingInterval = setInterval(() => {
        this.fetchNotifications();
      }, 30000); // Poll every 30 seconds
    },

    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    },

    async markRead(notificationId: string) {
      const auth = useAuthStore();
      if (!auth.token) return;
      const config = useRuntimeConfig();

      try {
        await $fetch(
          `${config.public.apiBase}/notifications/${notificationId}/read`,
          {
            method: "PATCH",
            headers: { Authorization: `Bearer ${auth.token}` },
          },
        );

        const target = this.notifications.find((n) => n.id === notificationId);
        if (target) {
          target.isRead = true;
        }
        if (this.unreadCount > 0) {
          this.unreadCount -= 1;
        }
      } catch (error) {
        console.error("Mark notification read error:", error);
      }
    },

    async markAllRead() {
      const auth = useAuthStore();
      if (!auth.token) return;
      const config = useRuntimeConfig();

      try {
        await $fetch(`${config.public.apiBase}/notifications/read-all`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        this.notifications.forEach((n) => (n.isRead = true));
        this.unreadCount = 0;
      } catch (error) {
        console.error("Mark all notifications read error:", error);
      }
    },
  },
});

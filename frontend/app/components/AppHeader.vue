<template>
  <header class="app-header">
    <h1 class="header-title">{{ title }}</h1>
    <div class="header-right">
      <slot name="actions" />
      <div v-if="auth.user" class="user-info">
        <span class="user-badge" :class="roleBadgeClass">{{
          auth.user.role?.replace("_", " ")
        }}</span>
        <!-- <span class="user-name">{{ auth.user.name }}</span> -->
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
});

const roleBadgeClass = computed(() => {
  return auth.user?.role?.toLowerCase().replace("_", "") || "";
});
</script>

<style scoped>
.app-header {
  height: 72px;
  min-height: 72px;
  background: #ffffff;
  border-bottom: 1px solid #f0f3f9;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-title {
  font-family: "Rubik", sans-serif;
  font-weight: 600;
  font-size: 27px;
  line-height: 32px;
  color: #2d3643;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-badge {
  font-family: "Rubik", sans-serif;
  font-size: 14px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  background: #eff6ff;
  color: #0e97d6;
}

.user-badge.admin {
  background: #fff1f2;
  color: #eb3123;
}

.user-badge.clevel {
  background: #f0fdfa;
  color: #0583c3;
}

.user-badge.manager {
  background: #fffbeb;
  color: #b45309;
}

.user-name {
  font-family: "Rubik", sans-serif;
  font-size: 17px;
  font-weight: 500;
  color: #5e718d;
}
</style>

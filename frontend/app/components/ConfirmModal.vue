<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="confirm-modal-overlay"
      @click.self="onCancel"
      @keydown.esc="onCancel"
      tabindex="-1"
    >
      <div class="confirm-modal-card">
        <div v-if="modalOptions.danger" class="confirm-icon-wrapper danger">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="3 6 5 6 21 6"></polyline>
            <path
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            ></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </div>
        <div v-else class="confirm-icon-wrapper info">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>

        <h3 class="confirm-modal-title">
          {{ modalOptions.title }}
        </h3>

        <p class="confirm-modal-message">
          {{ modalOptions.message }}
        </p>

        <div class="confirm-modal-actions">
          <button
            type="button"
            class="confirm-btn cancel"
            @click="onCancel"
          >
            {{ modalOptions.cancelText }}
          </button>
          <button
            type="button"
            class="confirm-btn"
            :class="modalOptions.danger ? 'danger' : 'primary'"
            @click="onConfirm"
          >
            {{ modalOptions.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useConfirm } from "../composables/useConfirm";

const { isVisible, modalOptions, onConfirm, onCancel } = useConfirm();
</script>

<style scoped>
.confirm-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 16px;
  animation: fadeIn 0.15s ease-out;
}

.confirm-modal-card {
  background: #ffffff;
  border-radius: 14px;
  width: 100%;
  max-width: 420px;
  padding: 24px;
  text-align: center;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: slideUp 0.15s ease-out;
}

.confirm-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.confirm-icon-wrapper.danger {
  background: #fee2e2;
  color: #ef4444;
}

.confirm-icon-wrapper.info {
  background: #e0f2fe;
  color: #0284c7;
}

.confirm-modal-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.confirm-modal-message {
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.5;
  color: #64748b;
  white-space: pre-line;
}

.confirm-modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.confirm-btn.cancel {
  background: #f1f5f9;
  color: #475569;
}

.confirm-btn.cancel:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.confirm-btn.danger {
  background: #ef4444;
  color: #ffffff;
}

.confirm-btn.danger:hover {
  background: #dc2626;
}

.confirm-btn.primary {
  background: #2563eb;
  color: #ffffff;
}

.confirm-btn.primary:hover {
  background: #1d4ed8;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>

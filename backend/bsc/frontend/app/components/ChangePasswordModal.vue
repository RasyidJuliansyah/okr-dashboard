<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-header-title">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h3>Ganti Password</h3>
        </div>
        <button class="close-btn" @click="closeModal" aria-label="Tutup">
          &times;
        </button>
      </div>

      <div class="modal-body">
        <div v-if="errorMessage" class="alert alert-error mb-4">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="alert alert-success mb-4">
          {{ successMessage }}
        </div>

        <form @submit.prevent="handleSubmit" class="password-form">
          <!-- Password Saat Ini -->
          <div class="form-group">
            <label for="currentPassword"
              >Password Saat Ini <span class="required">*</span></label
            >
            <div class="password-input-wrapper">
              <input
                id="currentPassword"
                :type="showCurrent ? 'text' : 'password'"
                v-model="form.currentPassword"
                placeholder="Masukkan password saat ini"
                required
                class="form-input"
              />
              <button
                type="button"
                class="toggle-eye-btn"
                @click="showCurrent = !showCurrent"
                :title="
                  showCurrent ? 'Sembunyikan password' : 'Tampilkan password'
                "
              >
                <!-- Eye Open -->
                <svg
                  v-if="showCurrent"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <!-- Eye Closed -->
                <svg
                  v-else
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                  ></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- Password Baru -->
          <div class="form-group">
            <label for="newPassword"
              >Password Baru <span class="required">*</span></label
            >
            <div class="password-input-wrapper">
              <input
                id="newPassword"
                :type="showNew ? 'text' : 'password'"
                v-model="form.newPassword"
                placeholder="Minimal 6 karakter"
                required
                class="form-input"
              />
              <button
                type="button"
                class="toggle-eye-btn"
                @click="showNew = !showNew"
                :title="showNew ? 'Sembunyikan password' : 'Tampilkan password'"
              >
                <svg
                  v-if="showNew"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg
                  v-else
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                  ></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- Konfirmasi Password Baru -->
          <div class="form-group">
            <label for="confirmPassword"
              >Konfirmasi Password Baru <span class="required">*</span></label
            >
            <div class="password-input-wrapper">
              <input
                id="confirmPassword"
                :type="showConfirm ? 'text' : 'password'"
                v-model="form.confirmPassword"
                placeholder="Ulangi password baru"
                required
                class="form-input"
              />
              <button
                type="button"
                class="toggle-eye-btn"
                @click="showConfirm = !showConfirm"
                :title="
                  showConfirm ? 'Sembunyikan password' : 'Tampilkan password'
                "
              >
                <svg
                  v-if="showConfirm"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg
                  v-else
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                  ></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </button>
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="secondary-btn"
              @click="closeModal"
              :disabled="loading"
            >
              Batal
            </button>
            <button type="submit" class="primary-btn" :disabled="loading">
              <span v-if="loading">Memproses...</span>
              <span v-else>Simpan Password Baru</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import { useAuthStore } from "../stores/auth";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);
const auth = useAuthStore();
const config = useRuntimeConfig();

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const showCurrent = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);

const form = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

function resetForm() {
  form.currentPassword = "";
  form.newPassword = "";
  form.confirmPassword = "";
  errorMessage.value = "";
  successMessage.value = "";
  showCurrent.value = false;
  showNew.value = false;
  showConfirm.value = false;
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      resetForm();
    }
  },
);

function closeModal() {
  if (loading.value) return;
  resetForm();
  emit("close");
}

async function handleSubmit() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
    errorMessage.value = "Semua bidang password harus diisi.";
    return;
  }

  if (form.newPassword !== form.confirmPassword) {
    errorMessage.value =
      "Konfirmasi password baru tidak cocok dengan password baru.";
    return;
  }

  if (form.newPassword.length < 6) {
    errorMessage.value = "Password baru minimal 6 karakter.";
    return;
  }

  loading.value = true;
  try {
    const response = await $fetch(
      `${config.public.apiBase}/auth/change-password`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        },
      },
    );

    successMessage.value =
      response.message || "Password berhasil diubah. Mengalihkan ke login...";

    setTimeout(() => {
      loading.value = false;
      closeModal();
      auth.logout();
    }, 1500);
  } catch (error) {
    loading.value = false;
    errorMessage.value =
      error.data?.message || error.message || "Gagal mengubah password.";
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  background-color: var(--card-bg, #ffffff);
  border-radius: 12px;
  width: 100%;
  max-width: 440px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.modal-header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color, #0f172a);
}

.modal-header-title h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
}

.close-btn:hover {
  color: #475569;
}

.modal-body {
  padding: 1.5rem;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted, #475569);
}

.required {
  color: #ef4444;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  padding: 0.625rem 2.5rem 0.625rem 0.875rem;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  font-size: 0.875rem;
  background-color: var(--input-bg, #ffffff);
  color: var(--text-color, #0f172a);
  transition: border-color 0.15s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.toggle-eye-btn {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
}

.toggle-eye-btn:hover {
  color: #1e293b;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  line-height: 1.4;
}

.alert-error {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.alert-success {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
}

.mb-4 {
  margin-bottom: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.primary-btn {
  background-color: #eb3123;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.primary-btn:hover:not(:disabled) {
  background-color: #c92518;
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-btn {
  background-color: transparent;
  color: #475569;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.secondary-btn:hover:not(:disabled) {
  background-color: #f1f5f9;
}
</style>

<template>
  <div class="login-container">
    <div class="theme-toggle-wrapper">
      <ThemeToggle />
    </div>
    <div class="login-card">
      <div class="logo-section">
        <img src="/logo.png" alt="Logo Skolla Education" class="logo-img" />
        <h2>Skolla Education</h2>
        <p>OKR &amp; Balanced Scorecard Suite</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Alamat Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="nama@perusahaan.com"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Kata Sandi</label>
          <div class="password-input-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              placeholder="••••••••"
              :disabled="loading"
            />
            <button
              type="button"
              class="password-toggle-btn"
              @click="togglePasswordVisibility"
              aria-label="Toggle password visibility"
            >
              <!-- Eye Icon when showPassword is false -->
              <svg
                v-if="!showPassword"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <!-- Eye-off Icon when showPassword is true -->
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path
                  d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
                />
                <path
                  d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
                />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" :disabled="loading" class="submit-btn">
          <span v-if="loading">Menghubungkan...</span>
          <span v-else>Masuk</span>
        </button>
      </form>

      <!-- <div class="demo-accounts">
        <p>Akun Demo:</p>
        <ul>
          <li><strong>Admin:</strong> admin@company.com</li>
          <li><strong>Manager:</strong> manager@company.com</li>
          <li><strong>C-Level:</strong> clevel@company.com</li>
          <li><strong>Employee:</strong> employee@company.com</li>
          <li><strong>Password:</strong> password123</li>
        </ul>
      </div> -->
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const showPassword = ref(false);

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value;
}

async function handleLogin() {
  error.value = "";
  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    // Redirect based on role or to home
    navigateTo("/");
  } catch (err) {
    error.value =
      err.message || "Login gagal. Periksa kembali email dan password Anda.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
@import url("https://fonts.google.com/share?selection.family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900|Rubik:ital,wght@0,300..900;1,300..900");

.login-container {
  font-family: "Inter", sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--content-bg);
  padding: 20px;
  position: relative;
}

.theme-toggle-wrapper {
  position: absolute;
  top: 20px;
  right: 20px;
}

.login-card {
  background: var(--card-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--card-border);
  padding: 40px;
  border-radius: 20px;
  width: 100%;
  max-width: 440px;
  box-shadow: var(--card-shadow);
  color: var(--text-color);
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-section {
  text-align: center;
  margin-bottom: 30px;
}

.logo-img {
  max-height: 50px;
  width: auto;
  margin-bottom: 12px;
  object-fit: contain;
}

.logo-section h2 {
  font-size: 27px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
}

.logo-section p {
  color: var(--text-secondary);
  font-size: 17px;
  margin: 5px 0 0 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
}

.form-group input {
  background: var(--input-bg);
  border: 1px solid var(--color-border);
  padding: 12px 16px;
  border-radius: 8px;
  color: var(--text-color);
  font-size: 17px;
  outline: none;
  transition: all 0.3s;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.password-input-wrapper input {
  width: 100%;
  padding-right: 48px;
}

.password-toggle-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 50%;
  transition:
    color 0.2s,
    background-color 0.2s;
}

.password-toggle-btn:hover {
  color: var(--text-color);
  background-color: rgba(255, 255, 255, 0.1);
}

.form-group input:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 8px rgba(0, 210, 255, 0.3);
  background: var(--input-bg);
}

.error-message {
  background: rgba(255, 75, 75, 0.15);
  border: 1px solid rgba(255, 75, 75, 0.3);
  color: #ff8888;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 16px;
}

.submit-btn {
  background: #0e97d6;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 102, 255, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.demo-accounts {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--input-border);
  font-size: 15px;
  color: var(--text-secondary);
}

.demo-accounts p {
  font-weight: 600;
  margin: 0 0 8px 0;
}

.demo-accounts ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.demo-accounts li {
  font-family: monospace;
}
</style>

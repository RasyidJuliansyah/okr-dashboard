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
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" :disabled="loading" class="submit-btn">
          <span v-if="loading">Menghubungkan...</span>
          <span v-else>Masuk ke Dashboard</span>
        </button>
      </form>

      <div class="demo-accounts">
        <p>Akun Demo:</p>
        <ul>
          <li><strong>Admin:</strong> admin@company.com</li>
          <li><strong>Manager:</strong> manager@company.com</li>
          <li><strong>C-Level:</strong> clevel@company.com</li>
          <li><strong>Employee:</strong> employee@company.com</li>
          <li><strong>Password:</strong> password123</li>
        </ul>
      </div>
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
  background: var(--bg-gradient);
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
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
}

.logo-section p {
  color: var(--text-secondary);
  font-size: 14px;
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
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
}

.form-group input {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  padding: 12px 16px;
  border-radius: 8px;
  color: var(--text-color);
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
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
  font-size: 13px;
}

.submit-btn {
  background: #0e97d6;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
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
  font-size: 12px;
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

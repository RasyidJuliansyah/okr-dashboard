// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@pinia/nuxt"],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://127.0.0.1:3001/api",
    },
  },
  // AppSidebar/AppHeader hanya render lewat v-if setelah auth-state client-side
  // ter-hydrate, jadi tidak pernah ikut SSR render tree. Nuxt secara default
  // meng-inline critical CSS per komponen berdasarkan apa yang benar-benar
  // ter-SSR (features.inlineStyles), sehingga style kedua komponen itu hilang
  // di production (walau file CSS-nya tetap ada & bisa diakses langsung).
  // Matikan supaya Nuxt selalu pakai <link> stylesheet biasa berdasarkan
  // static import graph, bukan runtime SSR render tree.
  features: {
    inlineStyles: false,
  },
});

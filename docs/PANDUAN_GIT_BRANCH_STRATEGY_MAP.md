# Panduan Git: Isolasi Branch Fitur Strategy Map & Alur Deploy

Dokumen ini berisi panduan teknis langkah demi langkah untuk mengisolasi perubahan fitur **Strategy Map** ke dalam branch terpisah (`feat/strategy-map`), memastikan branch `main` tetap bersih jika ada deployment darurat, serta alur penggabungan kembali (*merge*) ke `main` saat fitur sudah siap dirilis.

---

## 1. Simpan Perubahan ke Branch Baru & Push ke Remote

Jalankan urutan perintah berikut di terminal:

```bash
# 1. Buat branch baru dari state saat ini dan langsung berpindah ke sana
git checkout -b feat/strategy-map

# 2. Stage seluruh file perubahan terkait Strategy Map
git add frontend/app/app.vue \
        frontend/app/components/AppHeader.vue \
        frontend/app/components/AppSidebar.vue \
        frontend/app/pages/strategy-map.vue \
        scripts/test_strategy_map_webapp.py

# 3. Buat commit
git commit -m "feat: restore strategy map in sidebar and update interactive page"

# 4. Push branch baru ke remote GitHub
git push -u origin feat/strategy-map
```

> **Status:** Kode Strategy Map kini tersimpan aman di branch `feat/strategy-map` di GitHub. Branch `main` sama sekali belum terpengaruh.

---

## 2. Skenario Urgent: Deployment Cepat dari `main` Tanpa Strategy Map

Jika sewaktu-waktu ada kebutuhan darurat untuk deploy hotfix dari `main`:

```bash
# 1. Pindah ke branch main
git checkout main

# 2. Sinkronkan dengan versi terbaru di server
git pull origin main

# 3. Lakukan build / deploy dari branch main seperti biasa
# Fitur Strategy Map tidak akan ikut terbawa karena terisolasi di feat/strategy-map
```

---

## 3. Melanjutkan Pengerjaan Fitur Strategy Map

Jika ingin melanjutkan penyesuaian atau perbaikan pada Strategy Map di kemudian hari:

```bash
# Pindah kembali ke branch fitur
git checkout feat/strategy-map

# Lakukan perubahan kode, lalu simpan:
git add .
git commit -m "refactor: improve strategy map feature"
git push origin feat/strategy-map
```

---

## 4. Penggabungan ke `main` & Deploy (Saat Fitur Sudah Siap)

Setelah seluruh fungsionalitas Strategy Map selesai dan siap dirilis ke production:

```bash
# 1. Pastikan semua perubahan lokal di feat/strategy-map sudah di-commit dan di-push
git checkout feat/strategy-map
git status

# 2. Pindah ke branch main dan perbarui
git checkout main
git pull origin main

# 3. Gabungkan branch feat/strategy-map ke main
git merge feat/strategy-map

# 4. Push hasil merge ke branch main untuk trigger build/deployment production
git push origin main

# 5. (Opsional) Hapus branch fitur jika sudah tidak digunakan lagi
git branch -d feat/strategy-map
git push origin --delete feat/strategy-map
```

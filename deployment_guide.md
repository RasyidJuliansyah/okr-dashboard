# 📋 SOP Deployment Aplikasi OKR Skolla (Bahasa Awam)

Panduan praktis langkah demi langkah untuk memindahkan pembaruan fitur (deploy) dari komputer lokal Anda ke server produksi. Ikuti panduan ini secara berurutan agar deploy berjalan aman tanpa mengganggu aplikasi lain di server.

---

## 🛠️ Langkah 1: Jalankan Script Update Database (Lewat DBeaver)
*Langkah ini bersifat kondisional. Hanya perlu dilakukan jika rilis versi ini membawa perubahan struktur tabel database (seperti menambah kolom baru, tabel baru, atau relasi baru).*

> [!IMPORTANT]
> **Di mana mendapatkan Script SQL untuk Rilis ini?**
> Setiap kali Anda ingin melakukan deploy rilis baru, mintalah asisten AI untuk membuatkan **"Script SQL Penyesuaian Produksi"** untuk rilis tersebut. Asisten AI akan menuliskan query SQL yang spesifik dan aman untuk dijalankan.

**Langkah Eksekusi di DBeaver:**
1. Buka aplikasi **DBeaver** di komputer Anda dan hubungkan ke database produksi (`skolla_okr`).
2. Klik kanan pada nama database Anda $\rightarrow$ Pilih **SQL Editor** $\rightarrow$ **Open SQL console**.
3. Tempelkan (*paste*) kueri SQL khusus yang diberikan oleh asisten AI untuk rilis kali ini ke editor DBeaver.
4. Jalankan kueri tersebut (tekan tombol *Play* atau pintasan `Alt + X`).
5. Jika ada pesan error berupa `Duplicate column name` atau `Table already exists`, Anda bisa **mengabaikannya** karena itu berarti kolom/tabel tersebut sudah terpasang sebelumnya.

---

## 📂 Langkah 2: Kirim Berkas Baru (Lewat FileZilla)
*Karena server menggunakan Docker, server akan mem-build kode secara otomatis di dalam container. Anda tidak perlu melakukan compile lokal (seperti run build) dan tidak perlu mengunggah folder build.*

Buka **FileZilla**, masuk ke folder server **/mnt/vdb/dashssc/bsc/**, lalu unggah berkas berikut:

1. **Folder `backend`**:
   * Unggah folder lokal **`backend/src/`** untuk menimpa folder `backend/src/` di server.
   * Unggah file **`package.json`**, **`package-lock.json`**, dan **`tsconfig.json`** ke dalam folder `backend/` di server.
2. **Folder `frontend`**:
   * Unggah folder lokal **`frontend/app/`** untuk menimpa folder `frontend/app/` di server.
   * Unggah file **`nuxt.config.ts`**, **`package.json`**, **`package-lock.json`**, dan **`tsconfig.json`** ke dalam folder `frontend/` di server.

> [!WARNING]
> Jangan pernah mengunggah folder `node_modules` atau folder `.nuxt` / `dist` lewat FileZilla karena ukurannya sangat besar dan akan membuat proses transfer sangat lambat.

---

## 🐳 Langkah 3: Terapkan Perubahan di Server (Lewat Termius / SSH)
Setelah berkas selesai diunggah lewat FileZilla, buka terminal **Termius** Anda dan jalankan perintah berikut:

1. **Masuk ke folder utama Docker di server**:
   ```bash
   cd /mnt/vdb/dashssc/bsc
   ```
2. **Hentikan layanan kontainer lama (Wajib)**:
   ```bash
   docker compose down
   ```
   *(Perintah ini akan mematikan aplikasi dan otomatis menghapus kontainer lama agar namanya tidak bentrok).*

3. **Hapus kontainer lama secara paksa (Hanya jika terjadi error konflik nama)**:
   ```bash
   docker rm -f okr-backend okr-frontend
   ```
   > [!NOTE]
   > Langkah ini **opsional**. Biasanya `docker compose down` sudah cukup untuk membersihkan kontainer. Jalankan perintah ini hanya jika Anda melihat pesan error merah berupa `Conflict. The container name "/okr-backend" is already in use...` saat melakukan langkah berikutnya.

4. **Bangun ulang kontainer dengan kode baru dan nyalakan (Wajib)**:
   ```bash
   docker compose up --build -d
   ```
   *(Parameter `--build` wajib disertakan agar Docker mem-build kode baru yang Anda unggah via FileZilla. Parameter `-d` membuat kontainer berjalan di latar belakang).*

Setelah kontainer `okr-backend` dan `okr-frontend` berstatus `Started` warna hijau, aplikasi Anda sudah sukses ter-deploy!

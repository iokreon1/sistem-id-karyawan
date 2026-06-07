# Product Requirements Document (PRD)

**Project Name:** Sistem Profil & Kompetensi Karyawan (KPP Mining System)
**Environment:** Web-based (Client-Side Rendering)
**Deployment Target:** Vercel (Static Hosting)

## 1. Overview

Sistem ini dirancang untuk mempermudah pengecekan identitas dan kompetensi karyawan di lapangan. Sistem menggunakan pendekatan pemindaian QR Code yang berisi URL dinamis. Saat dipindai, pengguna akan diarahkan ke halaman web yang mengambil data profil karyawan dan matriks kompetensinya secara real-time dari database.

## 2. Tech Stack

* **Frontend:** HTML5, Vanilla JavaScript (ES6+).
* **Styling:** Tailwind CSS (via CDN).
* **Database & Backend (BaaS):** Supabase (PostgreSQL) via Supabase JS Client CDN.
* **Libraries:** * `qrcode.js` (untuk generate QR Code).
  * `html5-qrcode` (untuk fitur scanner kamera).
  * `FontAwesome` (untuk ikon UI).

## 3. Database Schema (Supabase)

Sistem menggunakan relasi One-to-Many.

**Table 1: `karyawan`**
Menyimpan biodata utama karyawan.

* `nrp` (text, Primary Key) - Contoh: KB25024
* `nama_lengkap` (text)
* `departemen` (text)
* `jabatan` (text)
* `foto` (text)
* `created_at` (timestamptz)

**Table 2: `karyawan_kompetensi`**
Menyimpan daftar sertifikasi/kompetensi.

* `id` (int8, Primary Key, Auto Increment)
* `nrp_karyawan` (text, Foreign Key -> `karyawan.nrp`)
* `nama_unit` (text)
* `status` (text)
* `masa_berlaku` (text)
* `created_at` (timestamptz)

## 4. Application Structure & Modules

Aplikasi dipecah menjadi antarmuka yang modular agar fungsinya terisolasi dan spesifik.

### A. Konfigurasi (`js/config.js` & `js/supabase-client.js`)
* **Fungsi:** Mengisolasi kredensial dan inisialisasi koneksi database.
* **Logic:** Menyimpan `SUPABASE_URL` dan `SUPABASE_ANON_KEY`, lalu mengekspor instance client Supabase untuk diimpor secara modular di halaman lain.

### B. `index.html` (Menu Utama)

* **Fungsi:** Halaman navigasi awal (Dashboard).
* **UI:** Memiliki dua tombol utama. Tombol 1 mengarah ke `generate.html`. Tombol 2 mengarah ke `scanner.html`.

### C. `generate.html` (QR Code Generator)

* **Fungsi:** Form admin untuk membuat QR Code.
* **Logic:**
  * Input text untuk memasukkan NRP.
  * Saat tombol ditekan, buat URL dinamis berbasis `window.location.origin` (menyesuaikan URL saat deploy di Vercel): `[Base_URL]/detail.html?nrp=[NRP]`.
  * Gunakan `qrcode.js` untuk merender URL tersebut menjadi gambar QR Code. Konfigurasi diatur ke warna hitam pekat (`#000000`) dan *CorrectLevel* menengah (`M`) agar mudah dibaca oleh kamera buram.

### D. `scanner.html` (Web QR Scanner)

* **Fungsi:** Membaca QR Code langsung dari kamera perangkat.
* **Logic:**
  * Menggunakan instance langsung `Html5Qrcode` (tanpa UI wrapper berlebih) dengan prioritas konfigurasi kamera belakang (`facingMode: "environment"`).
  * Memiliki *fallback* ke kamera depan/default jika kamera belakang tidak ditemukan (seperti pada laptop).
  * Saat scan berhasil, sistem memunculkan notifikasi sukses sesaat, mencoba menghentikan instance kamera, lalu memaksa redirect `window.location.href` ke string URL hasil scan.


### E. `detail.html` (Profil & Kompetensi Karyawan)

* **Fungsi:** Menampilkan data lengkap karyawan berdasarkan parameter URL.
* **UI:** Desain card modern menggunakan Tailwind CSS (Warna utama: Brand Green `#1b5e20`). Terdiri dari Card Biodata dan Tabel Matriks Kompetensi.
* **Logic:**
  * Parsing URL parameter untuk mendapatkan nilai `?nrp=`.
  * Mengimpor Supabase client secara dinamis dari `js/supabase-client.js`.
  * Fetch data tunggal (`.single()`) dari tabel `karyawan` dan lakukan *join* ke tabel `karyawan_kompetensi` menggunakan relasi Foreign Key.
  * **Penanganan Error:** Jika data NRP tidak ada di database atau gagal dibaca karena RLS (mengembalikan error `PGRST116`), sistem akan menampilkan peringatan informatif langsung di UI.
  * **Penting:** Jika foto tidak ada, gunakan avatar placeholder default (dikumpulkan via API `ui-avatars.com`).
  * Render data biodata ke elemen HTML spesifik (DOM manipulation).
  * Looping array dari relasi `karyawan_kompetensi` untuk merender baris (`<tr>`) pada tabel sertifikasi. Tampilkan pesan kosong jika tidak ada kompetensi.

### F. `admin.html` (Dashboard Admin & CRUD)

* **Fungsi:** Panel kontrol admin untuk mengelola (Tambah, Edit, Hapus) data karyawan dan matriks kompetensi secara langsung dari web.
* **UI:** Dashboard bergaya portal admin modern (Warna utama: Slate & Emerald/Brand Green).
* **Logic:**
  * **Autentikasi:** Gate masuk menggunakan Supabase Auth (Email & Password). Menyediakan tombol "Bypass" untuk pengujian lokal/tanpa RLS.
  * **Statistik Ringkas:** Menghitung total karyawan, total kompetensi terdaftar, kompetensi aktif, dan expired secara real-time.
  * **Pencarian Karyawan:** Input teks pencarian untuk memfilter data karyawan berdasarkan nama, NRP, departemen, atau jabatan secara instan.
  * **Modal Form CRUD:**
    - Input NRP (Primary Key, hanya diisi saat insert), nama lengkap, departemen, dan jabatan.
    - Input berkas gambar foto profil yang otomatis diunggah ke Supabase Storage (bucket `karyawan-foto`) dengan fallback input teks URL manual.
    - Input dinamis tabel kompetensi: tombol "+ Tambah Baris" untuk menambahkan row baru, dan ikon sampah untuk menghapus baris.
  - **Manajemen QR Code:** Klik tombol QR langsung di baris tabel untuk memunculkan modal QR Code karyawan tersebut secara instan tanpa berpindah halaman, lengkap dengan tombol untuk mencetak.

## 5. Security & Constraint Notes

* **Supabase RLS & Auth:**
  * Tabel `karyawan` dan `karyawan_kompetensi` dikonfigurasi agar dapat dibaca secara bebas oleh publik/anon (`SELECT`), namun hanya dapat dimodifikasi (`ALL`/`INSERT`/`UPDATE`/`DELETE`) oleh pengguna yang terautentikasi (`authenticated`).
* **Supabase Storage:**
  * Bucket `karyawan-foto` diatur dengan akses **Public** agar URL gambar profil dapat langsung diakses oleh client, dan diatur dengan kebijakan RLS agar hanya pengguna terautentikasi yang dapat mengunggah file.
* **CORS/Camera Access:** Scanner harus berjalan di atas HTTPS atau Localhost (127.0.0.1) agar API kamera browser diizinkan.
* **Dynamic Binding:** Pastikan penulisan ID/Class di HTML konsisten agar manipulasi DOM di Vanilla JS dapat berjalan dengan akurat tanpa merusak elemen UI (seperti icon FontAwesome di dalamnya).

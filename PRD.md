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
* `foto_url` (text)
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

### A. `index.html` (Menu Utama)

* **Fungsi:** Halaman navigasi awal (Dashboard).
* **UI:** Memiliki dua tombol utama. Tombol 1 mengarah ke `generate.html`. Tombol 2 mengarah ke `scanner.html`.

### B. `generate.html` (QR Code Generator)

* **Fungsi:** Form admin untuk membuat QR Code.
* **Logic:**
  * Input text untuk memasukkan NRP.
  * Saat tombol ditekan, buat URL dinamis: `[Base_URL]/detail.html?nrp=[NRP]`.
  * Gunakan `qrcode.js` untuk merender URL tersebut menjadi gambar QR Code.

### C. `scanner.html` (Web QR Scanner)

* **Fungsi:** Membaca QR Code langsung dari kamera perangkat.
* **Logic:**
  * Menggunakan `html5-qrcode` dengan konfigurasi kamera belakang (`facingMode: "environment"`).
  * Saat scan berhasil, hentikan instance kamera.
  * Redirect `window.location.href` ke string URL hasil scan.

### D. `detail.html` (Profil & Kompetensi Karyawan)

* **Fungsi:** Menampilkan data lengkap karyawan berdasarkan parameter URL.
* **UI:** Desain card modern menggunakan Tailwind CSS (Warna utama: Brand Green `#1b5e20`). Terdiri dari Card Biodata dan Tabel Matriks Kompetensi.
* **Logic:**
  * Parsing URL parameter untuk mendapatkan nilai `?nrp=`.
  * Inisialisasi Supabase client.
  * Fetch data tunggal (`.single()`) dari tabel `karyawan` dan lakukan *join* ke tabel `karyawan_kompetensi` menggunakan relasi Foreign Key.
  * **Penting:** Jika foto tidak ada, gunakan avatar placeholder default.
  * Render data biodata ke elemen HTML spesifik (DOM manipulation).
  * Looping array dari relasi `karyawan_kompetensi` untuk merender baris (`<tr>`) pada tabel sertifikasi. Tampilkan pesan kosong jika tidak ada kompetensi.

## 5. Security & Constraint Notes

* **Supabase RLS:** Row Level Security diaktifkan pada tabel untuk Read-Only (SELECT) bagi public/anon key.
* **CORS/Camera Access:** Scanner harus berjalan di atas HTTPS atau Localhost (127.0.0.1) agar API kamera browser diizinkan.
* **Dynamic Binding:** Pastikan penulisan ID/Class di HTML konsisten agar manipulasi DOM di Vanilla JS dapat berjalan dengan akurat tanpa merusak elemen UI (seperti icon FontAwesome di dalamnya).

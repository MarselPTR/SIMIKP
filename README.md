# 🏛️ SIMIKP - Sistem Informasi Manajemen Informasi dan Komunikasi Publik

Selamat datang di repositori resmi **SIMIKP Diskominfo Kota Batu**! 👋

Repositori ini diserahkan oleh tim pengembang kepada tim IT/Infrastruktur Diskominfo Kota Batu sebagai hasil akhir dari pengembangan sistem manajemen penugasan, kurasi konten, dan publikasi media.

Aplikasi ini dibangun menggunakan standar industri modern (*Monolith-Static*) yang menggabungkan **Fastify (Node.js & TypeScript)** sebagai Backend dan **React (Vite)** sebagai Frontend untuk memastikan performa yang cepat dan aman.

---

## 📚 Panduan Utama (Wajib Dibaca!)

Untuk mempermudah Bapak/Ibu di Diskominfo dalam melakukan pemeliharaan (*maintenance*), modifikasi kode, maupun tata cara *hosting* ke server VPS, kami telah merangkum **semua instruksi teknis** di dalam satu dokumen induk.

Silakan klik dan baca file berikut sebelum melakukan konfigurasi server:
👉 **[`DOKUMENTASI_PENGEMBANGAN_DAN_DEPLOYMENT.md`](./DOKUMENTASI_PENGEMBANGAN_DAN_DEPLOYMENT.md)**

Dokumen tersebut berisi:
- Penjelasan alur bisnis dan peran (Ahli Pertama, Admin, Petugas).
- Struktur tabel database dan *Relational Mapping*.
- Konfigurasi keamanan (*Security*, JWT, CORS, Enkripsi Sandi).
- **Langkah-langkah langkah instalasi VPS Linux / Render dari titik nol.**

---

## 🛠️ Persiapan Cepat (Quick Start)

Jika Bapak/Ibu ingin menguji coba aplikasi ini di komputer lokal, berikut adalah langkah singkatnya:

### 1. Atur Kredensial Rahasia (.env)
Sistem keamanan mencegah kami mengunggah kata sandi asli ke GitHub. Sebagai gantinya, kami telah menyediakan kerangka (*template*) konfigurasi. 
Silakan salin (*copy*) file kerangka tersebut lalu hapus akhiran `.example`:
- Salin `backend/.env.example` ➡️ menjadi `backend/.env`
- Salin `frontend/.env.example` ➡️ menjadi `frontend/.env`

*(Buka file `.env` di dalam folder backend dan isikan koneksi MySQL milik Kominfo pada variabel `DATABASE_URL`)*.

### 2. Instalasi Paket Aplikasi
Buka terminal di dalam folder utama (*root*) dan jalankan:
```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 3. Bangun Tabel Database (Migrasi)
Jalankan perintah ini agar sistem otomatis membuatkan tabel-tabel kosong di database MySQL Bapak/Ibu:
```bash
npm run db:migrate --prefix backend
```

### 4. Jalankan Aplikasi
Ketikkan perintah berikut untuk menghidupkan Backend dan Frontend secara bersamaan:
```bash
npm run dev:web
```

---

## 🤝 Penutup

Kami berharap sistem SIMIKP ini dapat memodernisasi alur kerja dan meningkatkan efisiensi di internal Diskominfo Kota Batu. Seluruh struktur kode sudah kami amankan, optimalkan, dan bersihkan dari *bug* atau pengaturan sementara (*prototype*).

Terima kasih atas kepercayaannya. Selamat menggunakan SIMIKP! 🚀

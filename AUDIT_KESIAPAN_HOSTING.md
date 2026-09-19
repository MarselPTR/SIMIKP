# Audit kesiapan hosting dan keamanan SIMIKP

Tanggal pemeriksaan: 19 September 2026  
Acuan kode: branch `main`, commit `bcaba8e`

## Keputusan

**Status: BELUM SIAP dihosting sebagai production yang terbuka ke internet.**

Backend dan frontend berhasil dibuild, tetapi terdapat penghalang keamanan dan integritas data yang harus diselesaikan sebelum go-live. Penilaian ini berdasarkan pemeriksaan statis seluruh repository, build lokal, lint sumber frontend, audit dependency, dan isi environment yang diberikan pemilik proyek. Kredensial tersebut tidak dipakai untuk mengakses layanan. Database production, SMTP, reverse proxy, TLS, permission filesystem, backup, dan perilaku runtime belum diuji.

### Konfirmasi konfigurasi environment yang diberikan

Pemilik proyek kemudian memberikan isi environment development. Nilai rahasia tidak disalin ke dokumen ini. Konfigurasi tersebut menambah temuan berikut:

- Kredensial database cloud dan Gmail App Password telah dibagikan dalam percakapan sehingga harus dianggap terekspos. Keduanya wajib dirotasi; hanya menghapus pesan atau file lokal tidak mencabut kredensial.
- `JWT_SECRET` dan `COOKIE_SECRET` tidak disetel, sehingga aplikasi memakai fallback hardcoded dari `server.ts`. Ini merupakan blocker production.
- `NODE_ENV=production` tidak disetel. Cookie login tidak akan memperoleh flag `Secure`, walaupun aplikasi dipasang di balik HTTPS.
- Koneksi database cloud mematikan verifikasi sertifikat (`rejectUnauthorized: false`). Implementasi `db/index.ts` juga membuang query SSL dari URL dan selalu memakai opsi tersebut untuk host cloud. Trafik terenkripsi tetapi identitas server tidak diverifikasi dengan benar.
- `APP_URL` masih menunjuk localhost, sehingga tautan reset password, review, dan penugasan dalam email akan mengarah ke komputer penerima, bukan domain SIMIKP.
- Limit upload tetap 4096 MB, terlalu besar untuk aplikasi web dan membuka risiko kehabisan disk/I/O.
- `STORAGE_PATH` tidak mengatasi upload aktif karena `storage.routes.ts` dan `server.ts` menghitung path sendiri; service yang membaca `STORAGE_PATH` tidak dipakai oleh route upload utama.
- Alamat `SMTP_FROM` perlu memakai format `Nama Aplikasi <alamat@email>` agar parsing dan reputasi pengirim konsisten.
- `HOST=127.0.0.1` tepat bila backend hanya diakses melalui reverse proxy pada server yang sama. Jika platform container mengharuskan bind ke seluruh interface, nilainya perlu mengikuti ketentuan platform.
- Jika backslash pada nama variable (`DATABASE\_URL`) dan email merupakan karakter literal di file, dotenv tidak akan mengenalinya. Backslash yang muncul hanya karena formatting Markdown tidak menjadi masalah.

## Ringkasan risiko

| Prioritas | Area | Temuan | Dampak |
|---|---|---|---|
| **Blocker** | Authorization backend | Hampir seluruh route hanya memeriksa JWT global. Tidak ada pemeriksaan role pada CRUD kegiatan, master output, user, assignment, review, produksi, publikasi, dan laporan. Sejumlah operasi juga tidak memeriksa kepemilikan record. | Petugas biasa yang sudah login dapat mencoba membaca/mengubah/menghapus data administratif atau tugas pengguna lain dengan memanggil API langsung. Route guard frontend tidak melindungi API. |
| **Blocker** | Akun otomatis/default | Login dengan username yang mengandung `ahli` menjalankan auto-provision akun Ahli Pertama dengan password `admin123`. Password service juga menerima `admin123` untuk hash legacy `$2a$`/`$2b$`. | Akun berhak review dapat dibuat/diakses dengan kredensial yang diketahui umum. |
| **Blocker** | Secret aplikasi | `JWT_SECRET` dan `COOKIE_SECRET` memiliki fallback hardcoded. Server tetap hidup bila environment production tidak memasok secret. | Salah konfigurasi deployment membuat token/cookie dapat dipalsukan memakai secret dari source code. |
| **Blocker** | Migrasi database | SQL migrasi tidak memuat ADD untuk `revision_notes`, `revision_author`, `revision_date`, `phone`, dan `bio`, sementara migrasi berikutnya melakukan MODIFY `revision_date`. Snapshot dan SQL 0007 tidak sejalan; penghapusan tabel arsip lama juga berpotensi berbenturan dengan FK. | Instalasi database baru atau upgrade dapat gagal atau menghasilkan schema yang tidak sesuai kode. |
| **Blocker** | Upload file | Limit default 4096 MB per file, tanpa allowlist MIME/ekstensi, pemeriksaan isi, kuota pengguna, antivirus, maupun cleanup saat gagal. Berkas diunggah ke filesystem lokal. | DoS kapasitas disk/memori/I/O dan penyimpanan konten berbahaya. Konten disajikan inline dengan MIME yang berasal dari klien. |
| **Blocker** | Path storage | Route upload menulis ke path berbeda dari direktori yang dilayani static server, baik dalam source maupun hasil build. Hal serupa terjadi pada dokumen privat pengguna. | Upload dapat dilaporkan berhasil tetapi file tidak dapat dibaca; data bisa tersimpan di lokasi tak terbackup. |
| **Tinggi** | CORS/CSRF | CORS memakai `origin: true` dengan credentials. Tidak ada daftar origin production atau perlindungan CSRF eksplisit. Cookie memakai SameSite Lax, yang membantu tetapi bukan pengganti kebijakan origin dan authorization. | Origin tidak tepercaya dapat diterima oleh backend; risiko meningkat pada subdomain/konfigurasi cookie yang salah atau bila autentikasi berubah. |
| **Tinggi** | Brute force/abuse | Tidak ada rate limit untuk login, forgot/reset password, upload, export, atau endpoint lain. Tidak ada lockout/backoff akun. | Password guessing, spam email, upload abuse, dan resource exhaustion lebih mudah dilakukan. |
| **Tinggi** | Data pribadi | Daftar petugas mengembalikan NIK; pas foto/KTP disimpan di filesystem. Endpoint asset hanya memeriksa “sudah login”, tanpa memastikan pemilik atau role admin. | Kebocoran data pribadi antar pengguna internal yang tidak berwenang. |
| **Tinggi** | Dependency | `npm audit --omit=dev` backend menemukan 1 high dan 2 moderate: `fast-uri` melalui Fastify/AJV dan `uuid` melalui ExcelJS. Audit seluruh dependency backend menemukan 7 isu (1 high, 6 moderate). | Menggunakan dependency dengan advisory keamanan yang diketahui. Perlu upgrade teruji, bukan sekadar `audit fix --force`. |
| **Tinggi** | Validasi input | Banyak controller memakai cast `request.body as ...` atau `any`, bukan schema runtime. Update assignment/profile menerima field target dari request. | Mass assignment, data tidak valid, dan perubahan record di luar hak pengguna lebih mudah terjadi. |
| **Sedang** | Error disclosure | Error handler mengirim `error.message` ke klien untuk error umum; beberapa route juga meneruskan pesan exception. | Detail database/filesystem dapat bocor dan membantu pemetaan serangan. |
| **Sedang** | Session | JWT berlaku 7 hari, dikembalikan dalam body lalu disimpan frontend di `localStorage`; `/auth/me` mempercayai payload lama tanpa memuat ulang status aktif/role dari DB. Tidak ada mekanisme revocation. | XSS dapat mencuri token; user yang dinonaktifkan/diubah role masih dapat memakai token sampai kedaluwarsa. |
| **Sedang** | Security headers | Tidak ada Helmet/CSP/HSTS/frame-ancestors/referrer/permissions policy di aplikasi. Konfigurasi Nginx dalam dokumentasi belum membuktikan header tersebut aktif. | Proteksi browser terhadap XSS, clickjacking, dan downgrade belum lengkap. |
| **Sedang** | Audit trail | Audit log belum mencakup seluruh operasi penting dan default waktu schema/migrasi tertentu berupa timestamp tetap. | Investigasi perubahan dan insiden tidak andal. |
| **Sedang** | Atomicity/concurrency | Kurasi bukan satu transaction; delete user menghapus role lebih dulu tanpa transaction; klaim slot melakukan check lalu insert tanpa unique constraint; update/claim tidak selalu memeriksa bentrok jadwal. | Data parsial, duplikasi assignment, dan race condition saat dipakai bersamaan. |

## Data dummy dan artefak yang belum siap

Project **belum bersih dari data/contoh perilaku dummy**:

- `backend/src/db/seed.ts` bersifat destruktif, membuat lima akun contoh dengan password `admin123`, agenda, assignment, produksi, review, publikasi, serta tautan Google Drive contoh. Seed tidak boleh dijalankan di production.
- `frontend/src/pages/auth/LoginPage.tsx` masih menampilkan tombol akun demo dan mengisi password `admin123`; teksnya berada di `LanguageContext.tsx`.
- `backend/src/modules/auth/auth.routes.ts` masih membuat akun `ahli` secara otomatis dengan identitas contoh dan password default.
- `backend/src/services/password.service.ts` masih memiliki kompatibilitas mock hash yang menerima `admin123`.
- `backend/src/modules/reviews/reviews.routes.ts` memakai nilai `dummy-version` bila production version tidak ditemukan; ini dapat gagal pada foreign key atau membuat alur review tidak valid.
- `backend/src/modules/productions/productions.controller.ts` masih memakai `Lokasi Default` untuk fallback dan beberapa endpoint memakai user/version pertama dari database.
- Terdapat JPEG contoh `Servis_PCB_u1.jpeg` yang terlacak Git di `backend/src/storage/uploads`. Ini bukan aset aplikasi dan perlu dihapus dari source/deployment setelah memastikan tidak dibutuhkan.
- `ReviewPage_temp.tsx`, `review_page.diff`, `frontend/fix_*.py`, `frontend/test_post.ts`, serta `backend/test*.ts/js`, `clear_tokens.ts`, `manual_migrate.ts`, dan `drop.ts` adalah artefak lama/percobaan. Sebagian dapat menulis atau menghapus data bila dijalankan.
- Cache `frontend/.vite` terlacak dalam repository dan tidak diperlukan pada deployment production.

Status data database aktual **belum dapat dinyatakan bersih** karena tidak ada koneksi database target. Audit repository hanya dapat membuktikan bahwa generator data contoh dan perilaku dummy masih ada di kode.

## Temuan kesiapan fungsional

- Build backend berhasil dengan `tsc`.
- Build frontend berhasil dengan Vite; bundle JavaScript utama sekitar 827 kB sebelum gzip dan memunculkan peringatan chunk lebih dari 500 kB.
- Lint khusus `frontend/src` tidak menghasilkan error, tetapi masih memberi banyak warning React/hooks. `DaftarAnggotaPage` memiliki warning akses callback ketika sedang diinisialisasi; beberapa halaman memiliki dependency effect/memo yang tidak stabil.
- Lint default ikut memindai `.vite/deps` dan gagal karena kode vendor. Konfigurasi lint perlu mengecualikan cache/build agar CI memberi hasil yang relevan.
- Tidak tersedia test suite otomatis yang menguji authorization, workflow, migrasi fresh database, upload, dan restore backup. Berkas bernama `test*` sebagian besar adalah skrip manual yang bergantung pada DB.
- Health check hanya mengembalikan waktu/status proses dan tidak memeriksa database, filesystem, atau SMTP.
- Tidak ada `.env.example` tervalidasi, pemeriksaan variable wajib saat startup, migration gate, ataupun deployment smoke test otomatis.

## Urutan wajib sebelum go-live

1. Tambahkan authorization backend per endpoint dan ownership per record. Buat matriks izin yang eksplisit untuk Super Admin, Ahli Pertama, dan Petugas; uji bypass API langsung.
2. Hapus auto-provision login, password `admin123`, fallback legacy mock hash, tombol demo, dan akun/data contoh. Paksa reset password untuk akun hasil migrasi.
3. Wajibkan secret kuat saat startup; proses harus gagal bila `JWT_SECRET`, `COOKIE_SECRET`, `DATABASE_URL`, atau konfigurasi production penting tidak ada. Rotasi semua secret yang pernah dipakai bersama source/chat.
4. Rekonsiliasi schema dengan migrasi, lalu buktikan dua skenario pada database sementara: migrasi dari kosong dan upgrade dari versi yang dipakai saat ini. Tambahkan constraint klaim assignment yang diperlukan.
5. Satukan root storage, batasi ukuran realistis, allowlist format, deteksi MIME dari isi, nama file aman, kuota, malware scan, cleanup, backup, dan authorization download. Simpan di volume persisten/object storage.
6. Batasi CORS ke domain resmi, tambahkan rate limiting, security headers, kebijakan CSRF sesuai model autentikasi, serta respons error production yang generik.
7. Perbarui dependency sampai audit production tidak memiliki high/critical; regression-test laporan Excel/PDF dan validasi Fastify setelah upgrade.
8. Bersihkan artefak demo/tes/cache/upload dari paket deployment. Gunakan allowlist file deployment atau image container reproducible.
9. Buat data production melalui prosedur terkontrol: role/master resmi, akun admin awal sekali pakai, verifikasi tidak ada dummy, dan rekonsiliasi jumlah record.
10. Tambahkan test integrasi untuk login/brute force, role/ownership, CRUD, klaim bersamaan, review, upload berbahaya/besar, migrasi, backup-restore, dan logout/revocation.
11. Uji staging dengan HTTPS, Nginx, service user non-root, firewall, permission folder, log rotation, monitoring disk/database, backup terjadwal, dan simulasi restore.
12. Lakukan security retest setelah perbaikan, termasuk pemeriksaan dependency, secret history, dan uji dinamis pada staging. Go-live hanya setelah semua blocker ditutup dan ada bukti restore backup.

## Batas audit

Audit ini tidak melakukan penetration test terhadap server publik, tidak menjalankan migrasi/seed, dan tidak mengakses database atau SMTP. Tidak ditemukan `.env` dalam working tree saat pemeriksaan, tetapi riwayat Git hanya diperiksa secara terarah untuk string default yang diketahui; pemindaian secret khusus seluruh riwayat tetap perlu dilakukan sebelum repository atau image dibagikan.

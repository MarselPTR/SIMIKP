# SIMIKP Kota Batu
## Dokumentasi Pengembangan, Database, Operasional, dan Deployment Linux VPS

> Dokumen handover untuk developer/programmer berikutnya.
>
> Dokumen ini menggambarkan struktur source saat ini. Jalankan seluruh perintah dari root repository kecuali dinyatakan lain.

---

## 1. Ringkasan Sistem

SIMIKP adalah aplikasi fullstack untuk manajemen informasi dan komunikasi publik Diskominfo Kota Batu.

Fungsi utama:

- manajemen kegiatan/agenda
- penugasan petugas lapangan
- self-claim agenda oleh petugas
- produksi naskah, foto, video, dan desain
- review dan permintaan revisi oleh Ahli Pertama/Reviewer
- kurasi konten ke Bank Konten
- publikasi media
- laporan produksi PDF/Excel
- notifikasi aplikasi dan email
- profil, role, password reset, dan preferensi notifikasi
- penyimpanan berkas ke filesystem server

Arsitektur utama:

```text
Browser
  |
  | React + Vite
  v
Frontend (:5173 saat development)
  |
  | /api proxy atau URL API production
  v
Fastify Backend (:3000 saat development)
  |             |              |
  |             |              +--> Filesystem storage
  |             +-----------------> Nodemailer/SMTP
  +-------------------------------> MySQL melalui Drizzle ORM
```

Pada production yang direkomendasikan, backend Fastify menyajikan hasil build frontend sehingga hanya satu service web yang perlu diekspos melalui Nginx.

---

## 2. Struktur Repository

```text
Merge/
├── package.json                 # Script root untuk dev/build fullstack
├── README.md
├── start.bat                    # Helper Windows development
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── layouts/             # AppLayout, Sidebar, Topbar, PetugasLayout
│       ├── pages/               # Halaman fitur
│       ├── components/          # UI reusable
│       ├── contexts/            # Toast dan confirmation
│       ├── lib/                 # API client, auth, state, constants
│       ├── routes/              # ProtectedRoute, RoleRoute, router
│       └── types/               # Tipe API frontend
└── backend/
    ├── package.json
    ├── .env                    # Lokal saja; jangan commit
    ├── drizzle.config.ts
    ├── storage/
    │   ├── uploads/             # Foto/video/desain publik-terproteksi route
    │   └── private/users/       # Berkas profil user
    └── src/
        ├── server.ts            # Fastify bootstrap, auth hook, static serving
        ├── db/
        │   ├── index.ts         # Koneksi MySQL Drizzle
        │   ├── schema/          # Schema TypeScript
        │   └── migrations/      # SQL migration Drizzle
        ├── modules/
        │   ├── auth/
        │   ├── activities/
        │   ├── assignments/
        │   ├── dashboard/
        │   ├── master/
        │   ├── productions/
        │   ├── publications/
        │   ├── reports/
        │   ├── reviews/
        │   ├── storage/
        │   ├── system/
        │   └── users/
        └── services/
            ├── mail.service.ts
            ├── password.service.ts
            └── StorageService.ts
```

File sementara seperti script eksperimen, diff review, dan audit lama tidak dianggap sebagai entry point aplikasi.

---

## 3. Teknologi

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- TanStack React Query
- Tailwind CSS
- Lucide React dan Remix Icon
- Recharts tersedia untuk visualisasi

### Backend

- Node.js
- TypeScript
- Fastify
- `@fastify/jwt`
- `@fastify/cookie`
- `@fastify/multipart`
- `@fastify/static`
- Drizzle ORM
- MySQL2
- Nodemailer
- ExcelJS
- PDFKit
- Zod

### Database

- MySQL
- Driver `mysql2`
- ORM/migration `drizzle-orm` dan `drizzle-kit`

---

## 4. Menjalankan Lokal

### Prasyarat

- Node.js versi LTS
- npm
- MySQL remote/lokal yang bisa diakses
- credential SMTP jika email ingin diuji

### Install dependency

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### Environment backend lokal

Buat `backend/.env`:

```env
PORT=3000
HOST=127.0.0.1
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
DB_SSL=true
JWT_SECRET=ganti-dengan-secret-panjang
COOKIE_SECRET=ganti-dengan-secret-panjang
MAX_FILE_SIZE_MB=4096
STORAGE_PATH=./storage/uploads
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=email@example.com
SMTP_PASS=app-password-gmail
SMTP_FROM="SIMIKP <email@example.com>"
APP_URL=http://localhost:5173
```

Jangan memasukkan `.env` ke Git atau dokumentasi publik.

### Migration lokal

```bash
npm run db:migrate --prefix backend
```

Migration bersifat kumulatif. Jangan menjalankan seed pada database yang berisi data penting.

### Seed database

```bash
npm run db:seed --prefix backend
```

`db:seed` membersihkan dan memasukkan data contoh. Gunakan hanya untuk database development kosong.

### Development penuh

```bash
npm run dev:web
```

Alamat default:

- frontend: `http://localhost:5173`
- backend: `http://127.0.0.1:3000`
- health check: `http://127.0.0.1:3000/healthz`

### Menjalankan terpisah

```bash
npm run backend
npm run frontend
```

---

## 5. Build dan Validasi

### Type-check

```bash
backend/node_modules/.bin/tsc -p backend/tsconfig.json --noEmit
frontend/node_modules/.bin/tsc -p frontend/tsconfig.app.json --noEmit
```

### Build production

```bash
npm run build:all
```

Hasil build:

- backend: `backend/dist`
- frontend: `frontend/dist`

### Menjalankan hasil build

```bash
npm run start --prefix backend
```

Backend mencari frontend production di `frontend/dist` dan menyajikannya sebagai SPA.

### Health check

```bash
curl http://127.0.0.1:3000/healthz
```

Response yang diharapkan:

```json
{"status":"ok","timestamp":"..."}
```

---

## 6. Routing Frontend dan Role

Route utama ditentukan di `frontend/src/routes/router.tsx`.

### Route publik

- `/login`
- `/reset-password`

### Route manajemen

- `/dashboard`
- `/profil`
- `/pengaturan`
- `/kegiatan`
- `/penugasan`
- `/produksi`
- `/publikasi`
- `/bank-konten`
- `/bank-konten/:id`
- `/laporan`
- `/daftar-anggota`
- `/tambah-petugas`

### Route khusus Ahli Pertama

- `/review`

Route review dibatasi oleh `RoleRoute` untuk role `AHLI_PERTAMA`. Jangan menambahkan role lain tanpa menyesuaikan kebijakan akses dan backend.

### Route petugas

- `/petugas/dashboard`
- `/petugas/agenda-tersedia`
- `/petugas/penugasan`
- `/petugas/bank-konten`
- `/petugas/bank-konten/:id`
- `/petugas/profil`
- `/petugas/pengaturan`

### Role yang dipakai

Nilai role frontend di `frontend/src/types/api.types.ts`:

```text
super_admin
ahli_pertama
admin
manager
staff
reviewer
petugas
```

Database role seed menggunakan nama uppercase seperti `AHLI_PERTAMA`, `PETUGAS`, dan `SUPER_ADMIN`. Normalisasi perbandingan role harus memperhatikan perbedaan huruf besar/kecil.

---

## 7. Alur Bisnis Utama

### 7.1 Kegiatan

```text
Admin membuat kegiatan
  -> pilih OPD/lokasi/tanggal/waktu
  -> pilih output konten yang diperlukan
  -> tersimpan ke activities
  -> relasi kebutuhan output tersimpan di activity_required_contents
```

### 7.2 Penugasan

```text
Admin membuat penugasan
  -> assignment terkait activity, user, dan content type
  -> petugas menerima notifikasi assignment
  -> petugas melihat tugas di Penugasan Saya
```

Petugas juga dapat mengambil slot agenda melalui endpoint `/assignments/claim` jika sesuai bidang pekerjaan.

### 7.3 Produksi

```text
Assignment
  -> petugas mulai bekerja
  -> upload media atau mengisi naskah/link
  -> status berubah
  -> hasil dikirim
  -> production_item dibuat
  -> production_version dibuat
```

Status yang digunakan di berbagai alur dapat meliputi:

```text
ASSIGNED
BELUM
IN_PROGRESS
LIPUTAN
MENULIS
DESAIN
KURASI
REVISI
COMPLETED
SIAP_TAYANG
SELESAI
```

Saat menambah status baru, perbarui controller, mapping frontend, workflow, dashboard, dan filter review.

### 7.4 Review dan revisi

```text
Petugas mengirim hasil
  -> Ahli Pertama/Reviewer menerima notifikasi
  -> reviewer membuka /review
  -> approve atau minta revisi
  -> jika revisi, petugas menerima catatan
  -> petugas mengirim ulang
  -> status kembali ke review
```

Tabel `reviews` tersedia untuk review formal, tetapi workflow utama aplikasi juga memakai status assignment dan kolom revision pada `assignments`. Perubahan besar pada workflow harus mempertimbangkan kedua model tersebut.

### 7.5 Bank Konten

```text
Berkas dikurasi
  -> production_files menyimpan metadata
  -> Bank Konten mengelompokkan berkas berdasarkan activity
  -> file ditampilkan berdasarkan storagePath/workLink
```

Kartu kapasitas Bank Konten menggunakan total `file_size` pada record `production_files`, bukan kapasitas disk VPS secara keseluruhan.

### 7.6 Publikasi

Data publikasi disimpan pada tabel `publications` dan terkait ke `production_versions`.

---

## 8. Database

### 8.1 Koneksi

File koneksi: `backend/src/db/index.ts`.

Aplikasi menggunakan MySQL melalui `DATABASE_URL`. Untuk MySQL Aiven, SSL diaktifkan melalui konfigurasi cloud/`DB_SSL`.

Jangan membuat koneksi database kedua di module aplikasi. Gunakan `db` dari `backend/src/db/index.ts`.

### 8.2 Tabel users dan role

#### `users`

Kolom penting:

- `id`: UUID/char 36
- `username`: unik
- `password_hash`: hash password
- `name`
- `staff_type`
- `email`
- `phone`
- `bio`
- `nik`
- `gender`
- `birth_place`
- `birth_date`
- `religion`
- `education`
- `pas_foto_url`
- `active`
- `created_at`

Password baru memakai service scrypt di `backend/src/services/password.service.ts`.

#### `roles`

Master role, misalnya:

- `AHLI_PERTAMA`
- `SUPER_ADMIN`
- `PETUGAS`

#### `user_roles`

Relasi many-to-many antara user dan role.

#### `password_reset_tokens`

Menyimpan token reset password, waktu kedaluwarsa, waktu digunakan, dan user pemilik token.

### 8.3 Master data

#### `opds`

- `id`
- `name`
- `singkatan`

#### `locations`

- `id`
- `name`
- `address`
- `kecamatan`
- `desa_kelurahan`
- `lat`
- `lng`

#### `content_types`

- `id`
- `name`
- `role_code`

`role_code` menghubungkan jenis output dengan bidang kerja, misalnya `PRAHUM`, `FOTO_VIDEO`, atau `DESAINER_EDITOR`.

### 8.4 Kegiatan dan penugasan

#### `activities`

- `id`
- `activity_code`
- `title`
- `activity_date`
- `activity_time`
- `start_time`
- `end_time`
- `location_id`
- `opd_id`
- `description`
- `priority`
- `status`
- `created_by`
- `created_at`

#### `activity_required_contents`

Tabel relasi activity dengan jenis konten yang diwajibkan.

- `activity_id`
- `content_type_id`

#### `assignments`

- `id`
- `activity_id`
- `user_id`
- `content_type_id`
- `assigned_at`
- `start_time`
- `end_time`
- `deadline`
- `status`
- `instruction`
- `work_link`
- `revision_notes`
- `revision_author`
- `revision_date`
- `created_by`

Untuk role Prahum, `work_link` dapat berisi teks naskah atau JSON media submission, bukan selalu URL.

### 8.5 Produksi dan file

#### `production_items`

Satu item produksi terkait satu assignment.

- `id`
- `assignment_id`
- `title`
- `status`
- `production_date`

#### `production_versions`

Riwayat versi produksi.

- `id`
- `production_item_id`
- `version_number`
- `work_link`
- `is_current`
- `created_at`

#### `production_files`

Metadata file yang dikurasi/disimpan.

- `id`
- `production_version_id`
- `original_filename`
- `stored_filename`
- `storage_path`
- `mime_type`
- `file_extension`
- `file_size`
- `uploaded_by`
- `uploaded_at`

`file_size` disimpan dalam byte dan digunakan untuk menghitung kapasitas Bank Konten.

### 8.6 Review dan publikasi

#### `reviews`

- `id`
- `production_version_id`
- `reviewer_id`
- `status`
- `comment`
- `reviewed_at`

#### `publications`

- `id`
- `production_version_id`
- `status`
- `channel`
- `url`
- `notes`
- `recorded_by`
- `publication_date`

### 8.7 Sistem

#### `notifications`

- `id`
- `user_id`
- `type`
- `title`
- `message`
- `read_at`
- `metadata` JSON
- `created_at`

Notifikasi wajib selalu memiliki `user_id`. Endpoint baca dan tandai dibaca membatasi data berdasarkan user JWT.

#### `notification_preferences`

Migration: `0011_add_notification_preferences.sql`.

- `user_id`: primary key dan foreign key ke `users.id`
- `email_enabled`
- `browser_enabled`
- `sound_enabled`
- `updated_at`

User lama otomatis mendapat default aktif ketika endpoint preferensi pertama kali dipanggil.

#### `audit_logs`

- `id`
- `actor_user_id`
- `action`
- `entity_type`
- `entity_id`
- `metadata` JSON
- `ip_address`
- `user_agent`
- `created_at`

### 8.8 Migration

Migration yang tersedia saat ini:

```text
0000_far_emma_frost.sql
0001_dusty_abomination.sql
0002_aberrant_doctor_strange.sql
0003_sharp_chamber.sql
0004_yielding_next_avengers.sql
0005_add_password_reset_tokens.sql
0006_add_assignments_work_link.sql
0007_silly_gorgon.sql
0008_blushing_boom_boom.sql
0009_heavy_synch.sql
0010_quick_odin.sql
0011_add_notification_preferences.sql
```

Jalankan:

```bash
npm run db:migrate --prefix backend
```

Jangan mengubah migration yang sudah pernah dijalankan. Buat migration baru:

```bash
npm run db:generate --prefix backend
```

Kemudian review SQL yang dihasilkan sebelum menjalankan migration.

---

## 9. API Backend

Semua route API menggunakan prefix `/api/v1`.

Semua route selain `/api/v1/auth/*` membutuhkan JWT melalui cookie atau Bearer token.

### Auth: `/api/v1/auth`

```text
POST /login
GET  /me
POST /logout
POST /forgot-password
GET  /verify-reset-token
POST /reset-password
POST /change-password
```

### Activities: `/api/v1/activities`

```text
GET    /
POST   /
PUT    /:id
DELETE /:id
```

### Assignments: `/api/v1/assignments`

```text
GET    /
POST   /
POST   /claim
PUT    /:id
DELETE /:id
```

### Dashboard: `/api/v1/dashboard`

```text
GET /stats
```

Mengembalikan statistik kegiatan, assignment, produksi, publikasi, OPD, pegawai, dan jumlah file Bank Konten.

### Master: `/api/v1/master`

```text
GET    /opds
GET    /content-types
POST   /content-types
PUT    /content-types/:id
DELETE /content-types/:id
```

### Productions: `/api/v1/productions`

```text
GET  /
POST /
GET  /bank-konten
POST /bank-konten/upload
GET  /my-tasks
POST /:assignmentId/status
POST /:assignmentId/submit
POST /curate-approval
```

`GET /bank-konten` juga mengembalikan `totalStorageBytes` dari `production_files.file_size`.

### Publications: `/api/v1/publications`

```text
GET  /
POST /
```

### Reviews: `/api/v1/reviews`

```text
GET  /
POST /
```

### Reports: `/api/v1/reports`

```text
GET /production
GET /production/excel
GET /production/pdf
```

### Users: `/api/v1/users`

```text
GET   /notification-preferences
PATCH /notification-preferences
GET   /petugas
POST  /petugas
DELETE /petugas/:id
PUT   /profile
PATCH /profile
```

### System: `/api/v1/system`

```text
GET   /notifications
PATCH /notifications/:id/read
PATCH /notifications/read-all
GET   /audit-logs
```

### Storage: `/api/v1/storage`

```text
POST /upload
```

File hasil upload dilayani melalui:

```text
GET /api/v1/storage/uploads/:filename
```

Berkas profil private dilayani melalui:

```text
GET /api/v1/users/assets/:filename
```

Route private membutuhkan JWT.

---

## 10. Autentikasi dan Keamanan

### JWT

Backend menerima JWT melalui:

- cookie `simikp_session`
- header `Authorization: Bearer <token>`

Frontend menyimpan token fallback di `localStorage` dengan key `simikp_token`.

### Password

Password service menggunakan `crypto.scryptSync` bawaan Node.js. Jangan menyimpan password plaintext atau membuat format hash manual baru.

### Catatan prototype

Versi lokal saat ini masih memiliki mode login prototype yang menerima password non-kosong untuk username yang valid. Ini **tidak boleh dipakai untuk production VPS**. Sebelum go-live, aktifkan kembali verifikasi password dengan `verifyPassword` pada route login dan migrasikan akun lama dari mock hash.

### Secrets

Jangan commit:

- `DATABASE_URL`
- `JWT_SECRET`
- `COOKIE_SECRET`
- `SMTP_PASS`
- App Password Gmail

Ganti semua credential yang pernah tertulis di chat, screenshot, atau repository.

### Authorization

JWT authentication global sudah ada, tetapi authorization role per endpoint harus tetap ditinjau sebelum production. `RoleRoute` frontend bukan pengganti authorization backend.

---

## 11. Storage File

### Folder aktif

Development/production relatif terhadap backend build:

```text
backend/storage/uploads/
backend/storage/private/users/
```

### Upload flow

```text
Frontend FormData
  -> POST /api/v1/storage/upload
  -> backend menyimpan file ke storage/uploads
  -> response berisi URL dan metadata
  -> metadata dikaitkan ke production_files saat kurasi
```

### Rekomendasi VPS

Gunakan lokasi persisten di luar folder source/repository, misalnya:

```text
/var/lib/simikp/uploads
/var/lib/simikp/private/users
/var/lib/simikp/backups
```

Sesuaikan `STORAGE_PATH` dan implementasi path aplikasi sebelum production jika menggunakan lokasi tersebut.

Permission contoh:

```bash
sudo mkdir -p /var/lib/simikp/uploads /var/lib/simikp/private/users /var/lib/simikp/backups
sudo chown -R simikp:simikp /var/lib/simikp
sudo chmod -R 750 /var/lib/simikp
```

### Kapasitas Bank Konten

Kartu Bank Konten menggunakan jumlah `production_files.file_size`.

Metrik ini berbeda dengan kapasitas seluruh disk VPS. Jika diperlukan, buat endpoint monitoring disk terpisah menggunakan filesystem VPS.

### Cleanup

File yang di-upload tetapi gagal masuk metadata database dapat menjadi orphan. Buat job audit/cleanup sebelum production besar. Jangan menghapus file hanya berdasarkan umur tanpa pencocokan database.

---

## 12. Notifikasi dan Preferensi

### Notifikasi database

Event yang menghasilkan notifikasi antara lain:

- assignment baru ke petugas
- hasil submit awal siap direview
- revisi dikirim ulang ke Ahli Pertama/Reviewer
- hasil produksi siap direview
- konten disetujui kembali ke petugas

### Preferensi

Pengaturan user:

- `emailEnabled`: backend tidak mengirim email notifikasi ketika false
- `browserEnabled`: Topbar dapat menampilkan browser notification baru ketika true
- `soundEnabled`: Topbar dapat memainkan bunyi singkat ketika true

Browser notification tetap bergantung pada izin browser. Audio dapat diblokir browser sampai user melakukan interaksi halaman.

### Testing notifikasi

1. Login sebagai petugas.
2. Pastikan assignment baru dibuat untuk user tersebut.
3. Pastikan row masuk ke tabel `notifications`.
4. Login sebagai Ahli Pertama.
5. Kirim hasil pertama/revisi dari petugas.
6. Pastikan Ahli Pertama melihat notifikasi baru.
7. Klik notifikasi dan periksa `read_at` berubah.
8. Ubah preferensi email/browser/suara dan ulangi event.

---

## 13. Deployment Linux VPS

Bagian ini untuk Ubuntu/Debian Linux. Sesuaikan username, domain, dan path dengan kebijakan Kominfo.

### 13.1 Paket sistem

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl nginx mysql-client build-essential
```

Install Node.js LTS, misalnya melalui NodeSource atau `nvm`. Pastikan versi Node sesuai dengan standar tim.

Verifikasi:

```bash
node --version
npm --version
```

### 13.2 User service

Jangan menjalankan aplikasi sebagai root.

```bash
sudo adduser --system --group --home /opt/simikp simikp
sudo mkdir -p /opt/simikp
sudo chown -R simikp:simikp /opt/simikp
```

### 13.3 Clone source

```bash
sudo -u simikp git clone -b render https://github.com/MarselPTR/SIMIKP.git /opt/simikp/app
cd /opt/simikp/app
```

Jika branch production berbeda, ganti `render` dengan branch yang disetujui tim.

### 13.4 Install dependency

```bash
sudo -u simikp npm ci
sudo -u simikp npm ci --prefix backend
sudo -u simikp npm ci --prefix frontend
```

### 13.5 Environment production

Buat file yang hanya dapat dibaca service user:

```bash
sudo -u simikp nano /opt/simikp/app/backend/.env
chmod 600 /opt/simikp/app/backend/.env
```

Contoh:

```env
NODE_ENV=production
PORT=3000
HOST=127.0.0.1
DATABASE_URL=mysql://USER:PASSWORD@DB_HOST:3306/DB_NAME
DB_SSL=true
JWT_SECRET=buat-secret-random-panjang
COOKIE_SECRET=buat-secret-random-panjang
MAX_FILE_SIZE_MB=4096
STORAGE_PATH=/var/lib/simikp/uploads
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=email-resmi@example.com
SMTP_PASS=app-password-gmail
SMTP_FROM="SIMIKP <email-resmi@example.com>"
APP_URL=https://simikp.kominfo.go.id
```

Jika database juga berada di VPS, gunakan private IP/hostname MySQL dan batasi akses firewall hanya dari aplikasi.

### 13.6 Migration database

```bash
sudo -u simikp npm run db:migrate --prefix /opt/simikp/app/backend
```

Jangan menjalankan `db:seed` pada database production.

### 13.7 Build

```bash
sudo -u simikp npm run build:all --prefix /opt/simikp/app
```

Periksa bahwa folder berikut ada:

```text
/opt/simikp/app/backend/dist
/opt/simikp/app/frontend/dist
```

### 13.8 systemd service

Buat `/etc/systemd/system/simikp.service`:

```ini
[Unit]
Description=SIMIKP Fastify Application
After=network.target

[Service]
Type=simple
User=simikp
Group=simikp
WorkingDirectory=/opt/simikp/app/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /opt/simikp/app/backend/dist/server.js
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Jika path Node berbeda, cari dengan:

```bash
which node
```

Aktifkan:

```bash
sudo systemctl daemon-reload
sudo systemctl enable simikp
sudo systemctl start simikp
sudo systemctl status simikp
```

Log:

```bash
journalctl -u simikp -f
```

### 13.9 Nginx reverse proxy

Buat `/etc/nginx/sites-available/simikp`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name simikp.kominfo.go.id;

    client_max_body_size 4096M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Aktifkan:

```bash
sudo ln -s /etc/nginx/sites-available/simikp /etc/nginx/sites-enabled/simikp
sudo nginx -t
sudo systemctl reload nginx
```

### 13.10 HTTPS

Gunakan DNS domain resmi yang mengarah ke IP VPS, lalu pasang sertifikat:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d simikp.kominfo.go.id
```

Setelah HTTPS aktif, ubah:

```env
APP_URL=https://simikp.kominfo.go.id
```

Restart:

```bash
sudo systemctl restart simikp
```

### 13.11 Firewall

Contoh UFW:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Port `3000` tidak perlu dibuka ke publik jika Nginx berada di mesin yang sama.

---

## 14. Prosedur Update VPS

```bash
cd /opt/simikp/app
sudo -u simikp git pull origin render
sudo -u simikp npm ci
sudo -u simikp npm ci --prefix backend
sudo -u simikp npm ci --prefix frontend
sudo -u simikp npm run db:migrate --prefix backend
sudo -u simikp npm run build:all
sudo systemctl restart simikp
sudo systemctl status simikp
```

Sebaiknya buat script deployment setelah prosedur ini stabil. Jangan melakukan `git pull` sebagai root karena permission file dapat rusak.

---

## 15. Backup dan Recovery

### Database

Contoh backup MySQL:

```bash
mysqldump --single-transaction --routines --triggers \
  -h DB_HOST -P 3306 -u DB_USER -p DB_NAME \
  | gzip > /var/lib/simikp/backups/simikp-$(date +%F-%H%M).sql.gz
```

Uji restore di database staging, bukan langsung production:

```bash
gunzip -c simikp-YYYY-MM-DD-HHMM.sql.gz | mysql -h DB_HOST -u DB_USER -p DB_NAME
```

### File

Backup folder storage:

```bash
tar -czf /var/lib/simikp/backups/storage-$(date +%F-%H%M).tar.gz \
  /var/lib/simikp/uploads /var/lib/simikp/private
```

Backup harus disalin ke storage berbeda dari VPS. Backup di disk yang sama tidak cukup untuk menghadapi kerusakan disk.

### Retensi

Contoh kebijakan:

- backup harian: 7 hari
- backup mingguan: 4 minggu
- backup bulanan: 6 bulan

Simpan credential backup menggunakan secret manager atau permission file yang ketat.

---

## 16. Monitoring dan Health Check

Health check:

```bash
curl -fsS https://simikp.kominfo.go.id/healthz
```

Monitoring service:

```bash
systemctl is-active simikp
journalctl -u simikp --since "1 hour ago"
df -h /var/lib/simikp
free -h
```

Yang perlu dipantau:

- status systemd
- penggunaan disk upload
- penggunaan RAM
- koneksi MySQL
- error migration
- error SMTP
- HTTP 401/403/404/500
- jumlah file orphan
- masa berlaku sertifikat HTTPS

---

## 17. Troubleshooting

### Backend tidak start

```bash
sudo systemctl status simikp
journalctl -u simikp -n 200 --no-pager
```

Periksa:

- `DATABASE_URL`
- `JWT_SECRET`
- `COOKIE_SECRET`
- path `frontend/dist`
- permission `/var/lib/simikp`
- port `3000`

### Frontend menampilkan halaman kosong

Periksa:

```bash
ls -la /opt/simikp/app/frontend/dist
curl -I http://127.0.0.1:3000/
```

Pastikan frontend sudah dibuild dan backend dijalankan dari hasil build.

### Database tidak tersambung

```bash
mysql -h DB_HOST -P 3306 -u DB_USER -p DB_NAME
```

Periksa SSL bila memakai Aiven atau database cloud.

### Migration gagal

- backup database dahulu
- baca error SQL lengkap
- periksa tabel `__drizzle_migrations`
- jangan menghapus journal secara manual
- jangan menjalankan seed production
- pastikan migration belum dijalankan sebagian

### Upload 404

Periksa:

```bash
ls -lah /var/lib/simikp/uploads
```

Lalu cocokkan `stored_filename` dan `storage_path` di `production_files`.

### Upload 413 dari Nginx

Naikkan:

```nginx
client_max_body_size 4096M;
```

Lalu:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Email tidak terkirim

Periksa log:

```bash
journalctl -u simikp -f
```

Periksa:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- App Password, bukan password Gmail biasa
- preferensi `email_enabled`

### Browser notification tidak muncul

- browser harus memberi izin notification
- HTTPS dibutuhkan di production
- toggle browser harus aktif
- notifikasi harus benar-benar baru
- browser dapat memblokir notification jika permission denied

### Audio tidak muncul

- browser harus sudah mendapat interaksi user
- toggle sound harus aktif
- autoplay policy dapat memblokir suara
- periksa mute tab/system

### Role bisa membuka route yang salah

Periksa dua lapisan:

1. frontend `RoleRoute` dan `router.tsx`
2. authorization backend

Jangan hanya mengandalkan route guard frontend.

---

## 18. Checklist Developer Baru

Sebelum mengubah fitur:

- [ ] Baca `DOKUMENTASI_PENGEMBANGAN_DAN_DEPLOYMENT.md`.
- [ ] Jalankan aplikasi lokal.
- [ ] Pastikan `backend/.env` tidak di-commit.
- [ ] Jalankan migration terbaru pada database development.
- [ ] Jangan menjalankan seed pada database berisi data penting.
- [ ] Cek schema Drizzle sebelum mengubah query.
- [ ] Cek endpoint dan frontend caller yang terdampak.
- [ ] Tambahkan validasi role di backend bila fitur terbatas role.
- [ ] Tambahkan notifikasi database dengan `userId` yang benar.
- [ ] Tambahkan metadata yang cukup untuk navigasi notifikasi.
- [ ] Uji read/unread pada lebih dari satu user.
- [ ] Uji upload dan file path.
- [ ] Jalankan type-check.
- [ ] Jalankan `npm run build:all`.
- [ ] Uji health check.
- [ ] Tinjau `git diff` sebelum commit.

---

## 19. Catatan Status Saat Ini

### Sudah tersedia

- frontend React dan backend Fastify
- koneksi MySQL Drizzle
- migration sampai `0011_add_notification_preferences.sql`
- JWT cookie/Bearer
- notifikasi per user dan read/unread
- preferensi email/browser/sound
- upload multipart
- static file serving
- Bank Konten dengan kapasitas dari `production_files.file_size`
- dashboard memakai query database
- pagination beberapa halaman utama
- build production backend/frontend

### Perlu perhatian sebelum production VPS

- login prototype masih menerima password non-kosong; aktifkan verifikasi password sebelum go-live
- audit authorization role semua endpoint backend
- gunakan path storage persisten di `/var/lib/simikp`
- lakukan backup database dan file secara rutin
- ganti semua credential yang pernah terekspos
- test email dari VPS
- test browser notification menggunakan HTTPS
- test migration pada staging terlebih dahulu
- siapkan cleanup orphan files
- review ukuran bundle frontend

---

## 20. Prinsip Perubahan Aman

1. Jangan menghapus migration lama.
2. Jangan mengubah data production secara manual tanpa backup.
3. Jangan memasukkan secret ke source code.
4. Jangan memakai `db:seed` di production.
5. Jangan percaya role dari frontend sebagai authorization final.
6. Pastikan setiap notifikasi memiliki `userId` yang tepat.
7. Pastikan file database dan file fisik mempunyai relasi yang dapat diaudit.
8. Setiap perubahan schema harus memiliki migration.
9. Setiap endpoint baru harus memiliki validasi input.
10. Setiap fitur user-facing harus diuji pada semua role terkait.
11. Selalu validasi dengan type-check dan production build.
12. Jangan melakukan `git push` tanpa persetujuan pemilik repository.

---

## 21. Perintah Referensi Cepat

```bash
# Development
npm run dev:web

# Migration
npm run db:migrate --prefix backend

# Development seed - database kosong saja
npm run db:seed --prefix backend

# Type-check
backend/node_modules/.bin/tsc -p backend/tsconfig.json --noEmit
frontend/node_modules/.bin/tsc -p frontend/tsconfig.app.json --noEmit

# Build production
npm run build:all

# Start production lokal
npm run start --prefix backend

# Linux service
sudo systemctl restart simikp
sudo systemctl status simikp
journalctl -u simikp -f

# Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## 22. Kontak dan Ownership

Isi bagian ini saat handover resmi:

```text
Pemilik aplikasi       : ______________________________
Tim backend            : ______________________________
Tim frontend           : ______________________________
Administrator VPS      : ______________________________
Administrator database : ______________________________
Domain production     : ______________________________
Lokasi backup          : ______________________________
Jadwal backup          : ______________________________
Tanggal handover       : ______________________________
```

Dokumen ini harus diperbarui setiap kali terjadi perubahan besar pada arsitektur, schema database, deployment, authentication, storage, atau alur role.

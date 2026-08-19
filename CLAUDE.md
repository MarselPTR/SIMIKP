# SIMIKP — Sistem Informasi Manajemen Kegiatan dan Publikasi IKP

Dokumen ini adalah konteks kerja untuk Claude Code. Baca seluruh isi file ini sebelum mengerjakan task apa pun di project ini. Sumber kebenaran bisnis & ERD ada di dokumen "SIMIKP_Dokumentasi_Proyek_dan_Alur_Sistem_FINAL" — file ini adalah ringkasan operasionalnya untuk keperluan coding.

Status saat ini: Phase 0 & Phase 1 (business requirement, ERD, API contract) **selesai dan final**. Sedang mengerjakan **Phase 2A: Project Foundation**.

## 1. Apa itu SIMIKP

Website internal Kominfo untuk mengelola siklus kegiatan dan konten secara terstruktur: agenda → penugasan → produksi konten → review → pencatatan publikasi → arsip yang bisa dicari kembali (Bank Konten).

SIMIKP **bukan** platform auto-posting media sosial. Publikasi hanya **dicatat** (channel, tanggal, URL) — tidak ada integrasi otomatis ke Instagram/Facebook/YouTube/TikTok.

Alur singkat: `LOGIN → DASHBOARD/BANK KONTEN → KEGIATAN → PENUGASAN → PRODUKSI → REVIEW/REVISI → PUBLIKASI (PENCATATAN) → ARSIP → SEARCH → PREVIEW/DOWNLOAD`

## 2. Tech stack (sudah dikunci, jangan diganti)

| Layer | Teknologi |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, shadcn/ui |
| Backend | Node.js, Fastify, TypeScript, Zod |
| ORM | Drizzle ORM |
| Database | MySQL (dev: Aiven MySQL Free shared 6 developer; production: MySQL native di VPS Ubuntu Kominfo) |
| Auth | Server-side session + HTTP-only secure cookie — **bukan JWT** |
| File storage | Private filesystem VPS Kominfo — **bukan** cloud storage |
| Process manager | systemd |
| Reverse proxy | Nginx |

### Yang sengaja TIDAK dipakai (jangan disarankan/diimplementasikan)
- Docker (development maupun production)
- Google Drive, Cloudflare R2, NAS, MinIO, AWS S3
- Integrasi API media sosial / auto-posting
- Email notification (versi awal cuma in-app notification)
- JWT sebagai mekanisme auth utama
- Elasticsearch/Algolia untuk search (pakai MySQL + index + pagination)

## 3. Role & akses

Hanya dua role: `SUPER_ADMIN` dan `PETUGAS`. Tidak ada KOORDINATOR atau Pimpinan sebagai role terpisah — semua kewenangan itu ada di SUPER_ADMIN. Satu user boleh punya lebih dari satu role (multi-role), tapi disarankan seminimal mungkin.

- **SUPER_ADMIN**: akses penuh — user, master data, kegiatan, penugasan, produksi siapa pun, review, publikasi, arsip, laporan, pengaturan.
- **PETUGAS**: melihat penugasan miliknya, mengerjakan produksi, upload hasil, melihat status review, akses arsip sesuai permission.

PETUGAS mencakup pekerjaan kameramen **dan** editor sekaligus — tidak dipisah jadi dua role.

## 4. Entitas database inti

```
users, roles, user_roles (pivot)
content_types, strategic_issues, locations, persons, keywords   -- master data
activities                                    -- data induk kegiatan
activity_strategic_issues, activity_persons, activity_keywords  -- pivot
assignments                                   -- penugasan (activity → assignment: 1-to-many)
production_items                              -- 1 assignment = 1 production item
production_versions                           -- versioning revisi, is_current flag
production_files                              -- file fisik per versi
reviews                                       -- histori approve/revisi per versi
publications                                  -- pencatatan publikasi per versi
archive_assets, archive_persons, archive_keywords  -- Bank Konten, tanpa duplikasi file
notifications, audit_logs
```

Aturan penting:
- Revisi **tidak** menimpa file lama. Setiap revisi = `production_versions` baru. Hanya satu versi `is_current` per production item, diganti lewat transaction (mencegah dua versi aktif sekaligus).
- File besar wajib diproses **streaming**, jangan dibaca penuh ke RAM.
- File private disimpan di `storage/private/simikp/{tahun}/{bulan}/{kode-kegiatan}/{jenis-media}/`, tidak boleh di public static directory. Akses hanya lewat endpoint backend setelah authorization check.

## 5. Struktur folder

### Backend
```
simikp-backend/
├── src/
│   ├── config/            # env, koneksi database (Dev 1)
│   ├── db/
│   │   ├── schema/         # Drizzle schema per entity (Dev 1, owner)
│   │   └── migrations/
│   ├── modules/
│   │   ├── auth/            # login, session, /me         <- Dev 2 (kamu)
│   │   ├── users/            # user management, RBAC        <- Dev 2 (kamu)
│   │   ├── activities/       # kegiatan/agenda (Dev 3)
│   │   ├── assignments/      # penugasan (Dev 3)
│   │   ├── production/       # produksi, versioning, review (Dev 4)
│   │   ├── publications/     # pencatatan publikasi (Dev 4)
│   │   ├── archive/           # bank konten, search (Dev 5)
│   │   └── reports/           # laporan, excel export (Dev 5)
│   ├── shared/
│   │   ├── middlewares/       # auth guard, error handler (Dev 1)
│   │   ├── services/          # storage abstraction, audit log (Dev 1)
│   │   └── utils/
│   └── app.ts
├── storage/private/simikp/
└── .env.example
```

### Frontend
```
simikp-frontend/
├── src/
│   ├── pages/
│   │   ├── auth/            # Login              <- Dev 2 (kamu)
│   │   ├── dashboard/        # Dashboard (Dev 6)
│   │   ├── kegiatan/          # (Dev 3)
│   │   ├── penugasan/         # (Dev 3)
│   │   ├── produksi/          # upload, review (Dev 4)
│   │   ├── bank-konten/        # search & archive (Dev 5)
│   │   └── laporan/            # (Dev 5)
│   ├── components/ui/          # shadcn/ui (Dev 6)
│   ├── layouts/                 # Sidebar, Topbar (Dev 6)
│   ├── hooks/                    # TanStack Query hooks per modul
│   ├── lib/                       # api client, auth context   <- Dev 2 (kamu) untuk auth context
│   └── routes/                     # protected route setup      <- Dev 2 (kamu) + Dev 6
```

## 6. Tanggung jawab kamu — Dev 2 (Authentication, SUPER_ADMIN, User Management, Security)

### Scope
- Endpoint `/api/v1/auth/login`, `/api/v1/auth/logout`, `/api/v1/auth/me`
- Session management: server-side session + HTTP-only secure cookie
- RBAC untuk dua role (`SUPER_ADMIN`, `PETUGAS`), termasuk dukungan multi-role per user
- User management: tambah, ubah, aktifkan/nonaktifkan user, reset password, atur role
- Authorization guard untuk API (middleware) dan protected route di frontend
- Password hashing, session expiry, rate limiting login, strategi CORS/CSRF

### Definition of Done
- [ ] Login/logout berfungsi
- [ ] Session aman (HTTP-only, secure cookie, expiry jelas)
- [ ] Role `SUPER_ADMIN` dan `PETUGAS` berjalan, multi-role didukung
- [ ] User management (CRUD user + role assignment) selesai
- [ ] RBAC backend selesai (middleware guard di setiap route yang butuh)
- [ ] Protected route frontend selesai (redirect ke login kalau belum auth, role-aware menu)
- [ ] Tidak ada credential/secret bocor ke source code atau response

### Koordinasi dengan dev lain
- Dev 1: menjaga API contract `/api/v1` dan schema `users`/`roles`/`user_roles` — koordinasi sebelum ubah struktur tabel ini.
- Dev 6: auth context & protected route dipakai untuk role-aware UI di semua halaman.

## 7. Aturan kerja tim (wajib diikuti)

- Satu repository GitHub, kerja di feature branch, PR wajib — jangan commit langsung ke `main`.
- `.env` tidak boleh di-commit, hanya `.env.example`.
- Jangan simpan credential Aiven/password/token/secret apa pun di source code.
- Perubahan schema/migration hanya lewat Drizzle migration, direview, lalu dijalankan oleh Dev 1 (jangan `drizzle-kit push` sembarangan ke Aiven yang shared).
- Semua endpoint validasi input pakai Zod.
- File development bersifat lokal per developer — shared database (Aiven) tidak berarti shared filesystem. Untuk testing lintas developer, pakai fixtures/dummy files.
- Semua developer wajib update dokumentasi area masing-masing.

## 8. Kode etik output untuk Claude Code di project ini

- Jangan sarankan Docker, cloud storage (R2/S3/dst), atau JWT sebagai pengganti keputusan yang sudah dikunci di atas — itu keputusan final tim, bukan area diskusi ulang.
- Jangan bikin auto-posting/integrasi media sosial dalam bentuk apa pun.
- Kalau ada perubahan yang menyentuh schema database atau API contract di luar scope Dev 2, tandai sebagai "perlu dikoordinasikan dengan Dev 1" alih-alih langsung dieksekusi.
- Ikuti sentence case dan konvensi penamaan modul yang sudah ada di struktur folder atas.

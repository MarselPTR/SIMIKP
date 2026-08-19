# SIMIKP — Sistem Informasi Manajemen Kegiatan dan Publikasi IKP

Website internal Kominfo untuk mengelola siklus kegiatan dan konten secara terstruktur: agenda → penugasan → produksi konten → review → pencatatan publikasi → arsip yang bisa dicari kembali (Bank Konten).

SIMIKP **bukan** platform auto-posting media sosial — publikasi hanya **dicatat** (channel, tanggal, URL), tidak ada integrasi otomatis ke Instagram/Facebook/YouTube/TikTok.

Sumber kebenaran bisnis & ERD lengkap ada di `SIMIKP_Dokumentasi_Proyek_dan_Alur_Sistem_FINAL_dengan_Penugasan_Tim.docx` di root repo ini.

> **Kalau kamu AI coding agent (Claude Code, Copilot, dll)**: baca `CLAUDE.md` di root sebelum mengerjakan apa pun di repo ini. File itu berisi tech stack yang dikunci, aturan tim, dan hal-hal yang sengaja tidak dipakai (Docker, JWT, cloud storage, dst) — jangan disarankan ulang.

## Tech stack (dikunci, jangan diganti)

| Layer | Teknologi |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, React Router, shadcn/ui |
| Backend | Node.js, Fastify, TypeScript, Zod |
| ORM | Drizzle ORM |
| Database | MySQL (dev: Aiven MySQL Free; production: MySQL native di VPS Ubuntu Kominfo) |
| Auth | Server-side session + HTTP-only secure cookie — **bukan JWT** |
| File storage | Private filesystem VPS Kominfo — **bukan** cloud storage |

Yang sengaja **tidak** dipakai: Docker, Google Drive/R2/S3/MinIO/NAS, integrasi API media sosial, email notification (awal), JWT sebagai auth utama, Elasticsearch/Algolia.

## Struktur repo

```
simikp/
├── backend/     → Fastify + Drizzle ORM + Zod           (Dev 1 sebagai penjaga schema/config)
└── frontend/     → React 18 + Vite + Tailwind + TanStack Query
```

### `backend/`
```
backend/src/
├── db/
│   ├── schema/       # users, roles, master data, activities, production, publications, archives, system
│   ├── migrations/
│   ├── index.ts       # koneksi Drizzle + mysql2
│   ├── migrate.ts, seed.ts, drop.ts
├── modules/
│   ├── auth/            # login/logout/me — masih placeholder, belum ada logic asli
│   ├── activities/        # masih placeholder
│   └── production/         # masih placeholder
├── services/
│   └── StorageService.ts
└── server.ts             # Fastify bootstrap: cors, cookie, multipart, error handler
```

### `frontend/`
```
frontend/src/
├── pages/
│   ├── auth/LoginPage.tsx               — Dev 2
│   ├── dashboard/DashboardPage.tsx      — Dev 6
│   ├── kegiatan/KegiatanPage.tsx        — Dev 3
│   ├── penugasan/PenugasanPage.tsx      — Dev 3
│   ├── produksi/                        — Dev 4 (satu folder, 3 halaman)
│   │   ├── ProduksiPage.tsx
│   │   ├── ReviewPage.tsx
│   │   └── PublikasiPage.tsx
│   ├── bank-konten/BankKontenPage.tsx   — Dev 5
│   └── laporan/LaporanPage.tsx          — Dev 5
├── components/
│   ├── ui/       # Button, Input, Select, Badge, Card, Table, Tabs, Dialog,
│   │              Pagination, FileUploader — Dev 6, masih hand-rolled Tailwind,
│   │              BUKAN shadcn/ui asli (lihat catatan di bawah)
│   └── shared/    # StateComponents.tsx (Loading/Empty/Error)
├── layouts/            # Sidebar.tsx, Topbar.tsx, AppLayout.tsx — Dev 6
├── contexts/           # ToastContext.tsx
├── hooks/              # TanStack Query hooks per modul (masih kosong)
├── lib/
│   ├── api-client.ts    # fetch wrapper ke backend asli (credentials: include) — belum dipakai
│   ├── AuthContext.tsx   # kerangka auth — Dev 2, MASIH MOCK (lihat catatan di bawah)
│   ├── mock-data.ts       # data dummy semua modul, dipakai sampai endpoint asli siap
│   ├── mock-api.ts         # "API" dummy di atas mock-data.ts
│   └── utils.ts
└── routes/
    ├── router.tsx        # route tree lengkap (React Router, createBrowserRouter)
    └── ProtectedRoute.tsx # redirect ke /login kalau belum auth — Dev 2
```

## Status saat ini (Phase 2A: Project Foundation)

**Sudah ada:**
- Backend: koneksi database (Drizzle + mysql2), Fastify app dengan CORS/cookie/multipart, error handler terpusat, schema lengkap untuk semua entitas inti (`users`, `roles`, `user_roles`, master data, `activities`, `production_*`, `publications`, `archive_*`), stub route `auth`/`activities`/`production` (baru placeholder response, belum ada logic).
- Frontend: **UI sudah lengkap secara visual untuk semua halaman** (login, dashboard, kegiatan, penugasan, produksi, review, publikasi, bank konten, laporan) — routing nyata (React Router + protected route), Sidebar/Topbar/layout jadi, komponen UI dasar (Button, Table, Badge, dst) jadi. **Tapi semuanya masih jalan di atas data dummy** (`lib/mock-data.ts` / `lib/mock-api.ts`), termasuk login (`lib/AuthContext.tsx` cek email/password ke daftar mock user, bukan ke backend).

**Belum ada / belum nyambung ke backend asli (menunggu dev masing-masing):**
- **Dev 2**: Auth & RBAC asli di backend (login, session cookie, guard middleware, user management). `lib/AuthContext.tsx` di frontend sudah dibentuk sesuai arsitektur session-cookie (bukan localStorage/token), tapi login-nya masih manggil `mock-api.ts` — begitu `/api/v1/auth/login` & `/api/v1/auth/me` nyata, ganti isi `login()`/`logout()` di file itu (sudah ada TODO comment di sana) dan tambahkan pengecekan sesi saat app dimuat.
- **Dev 3**: Endpoint kegiatan/penugasan di backend. `KegiatanPage.tsx`/`PenugasanPage.tsx` sudah ada dan berfungsi, tinggal ganti `mockApi.kegiatan.getAll` / `mockApi.penugasan.getAll` jadi panggilan `api-client.ts` ke endpoint asli.
- **Dev 4**: Endpoint produksi (versioning, upload file), review, publikasi. `ProduksiPage.tsx`, `ReviewPage.tsx`, `PublikasiPage.tsx` (semua di `pages/produksi/`) sudah ada, sama seperti di atas tinggal disambung ke endpoint asli. Halaman ini juga yang nantinya butuh upload file streaming ke `storage/private/simikp/`.
- **Dev 5**: Endpoint Bank Konten (search, tanpa Elasticsearch — MySQL + index) & laporan (termasuk excel export). `BankKontenPage.tsx`/`LaporanPage.tsx` sudah ada, tinggal disambung.
- **Dev 6**: Review ulang tampilan Dashboard/Sidebar/Topbar/komponen `components/ui/*` — ini semua **buatan cepat dari prototipe, bukan shadcn/ui asli** (lihat CLAUDE.md: shadcn/ui dikunci di tech stack). Kalau mau tetap pakai styling sekarang, cukup pasang shadcn/ui generator di atasnya; kalau mau redesign, folder & routing sudah siap dipakai berapa pun bentuk UI barunya.

Intinya: **kerangka + tampilan sudah ada duluan untuk semua modul**, jadi kerja tiap dev sekarang lebih ke "ganti sumber data dari mock ke API asli" plus bangun endpoint backend-nya — bukan mulai dari kosong.

## Perbaikan config di branch ini

Ditemukan & diperbaiki (menyentuh area Dev 1 — tolong direview, bukan dieksekusi sepihak untuk perubahan berikutnya):

- `backend/tsconfig.json`: `"moduleResolution": "node"` dihapus. TypeScript `^7.0.2` yang terpasang sudah membuang alias `node10`/`node` sama sekali (`TS5108`), sehingga `npx tsc --noEmit` gagal total sebelum sempat mengecek file lain. Menghapus baris tersebut membuat TS memakai default yang kompatibel dengan `"module": "CommonJS"`.
- `backend/src/server.ts`: parameter `error` di `setErrorHandler` diberi tipe eksplisit `FastifyError` — tanpa fix `moduleResolution` di atas, error TS18046 (`error` dianggap `unknown`) ini baru kelihatan dan bikin build gagal.
- Root `.env.example`: ditambahkan `COOKIE_SECRET` (dipakai `server.ts`, sebelumnya tidak terdokumentasi dan jatuh ke fallback default yang tidak aman untuk production).

Sudah diverifikasi: `npx tsc --noEmit` di `backend/` bersih, dan `npm run dev` berhasil listen di `http://127.0.0.1:3000` (belum dites dengan koneksi Aiven asli).

## Cara jalanin di lokal

**Backend:**
```bash
cd backend
npm install
cp ../.env.example .env   # isi DATABASE_URL Aiven kamu sendiri + tambahkan COOKIE_SECRET
npm run dev                # http://127.0.0.1:3000
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_BASE_URL default sudah mengarah ke backend lokal
npm run dev                # http://localhost:5173
```

## Pembagian tanggung jawab (2 role: SUPER_ADMIN, PETUGAS)

| Dev | Scope | File/folder terkait | Status |
|---|---|---|---|
| Dev 1 | Config, koneksi database, schema Drizzle, middleware & service bersama — API contract dan schema `users`/`roles`/`user_roles` harus koordinasi ke dia dulu sebelum diubah dev lain | `backend/src/config/`, `backend/src/db/schema/`, `backend/src/shared/` | Schema semua entitas sudah ada; belum ada middleware/guard bersama |
| Dev 2 | Auth (`login`/`logout`/`me`) & session cookie asli di backend; RBAC 2 role + multi-role; user management (CRUD user + role); protected route frontend | `backend/src/modules/auth/`, `backend/src/modules/users/` (belum ada), `frontend/src/lib/AuthContext.tsx`, `frontend/src/routes/ProtectedRoute.tsx` | Backend baru placeholder response; frontend auth masih mock — lihat catatan di atas |
| Dev 3 | Kegiatan/agenda (CRUD, assign strategic issue/lokasi/person/keyword) & penugasan (activity → assignment) | `backend/src/modules/activities/`, `backend/src/modules/assignments/` (belum ada), `frontend/src/pages/kegiatan/`, `frontend/src/pages/penugasan/` | Backend baru placeholder; frontend UI jadi, masih pakai mock data |
| Dev 4 | Produksi (versioning revisi, `is_current` flag), review (approve/revisi), publikasi (pencatatan channel/tanggal/URL — bukan auto-post) | `backend/src/modules/production/`, `frontend/src/pages/produksi/` (`ProduksiPage`, `ReviewPage`, `PublikasiPage`) | Backend baru placeholder; frontend UI jadi (3 halaman), masih pakai mock data |
| Dev 5 | Bank Konten (arsip tanpa duplikasi file, search pakai MySQL + index, bukan Elasticsearch) & laporan (termasuk excel export) | `backend/src/modules/archive/`, `backend/src/modules/reports/` (belum ada), `frontend/src/pages/bank-konten/`, `frontend/src/pages/laporan/` | Belum ada di backend sama sekali; frontend UI jadi, masih pakai mock data |
| Dev 6 | Dashboard, komponen UI, layout (Sidebar/Topbar) | `frontend/src/pages/dashboard/`, `frontend/src/components/ui/`, `frontend/src/layouts/` | Sudah ada versi cepat (hasil port dari prototipe) — **bukan shadcn/ui asli**, perlu direview: dipertahankan + dipasangi shadcn generator, atau didesain ulang |

Struktur folder lengkap tiap dev ada di CLAUDE.md section 5; Definition of Done detail baru tersedia untuk Dev 2 di section 6 (dev lain silakan tambahkan versi masing-masing di CLAUDE.md kalau mau dipakai bersama).

## Aturan kerja tim

- Satu repository GitHub, kerja di feature branch, **PR wajib** — jangan commit langsung ke `main`.
- `.env` tidak boleh di-commit, hanya `.env.example`.
- Jangan simpan credential Aiven/password/token/secret di source code.
- Perubahan schema/migration hanya lewat Drizzle migration, direview, dijalankan oleh Dev 1 — jangan `drizzle-kit push` sembarangan ke Aiven yang shared.
- Semua endpoint validasi input pakai Zod.
- File development lokal per developer — shared database (Aiven) tidak berarti shared filesystem. Untuk testing lintas developer, pakai fixtures/dummy files.
- Update dokumentasi area masing-masing.

Detail lengkap (entitas database, alur bisnis, definition of done per dev) ada di `CLAUDE.md`.

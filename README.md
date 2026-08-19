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
│   ├── auth/            # Login              — Dev 2
│   ├── dashboard/        # Dashboard          — Dev 6
│   ├── kegiatan/          # Kegiatan/agenda    — Dev 3
│   ├── penugasan/          # Penugasan         — Dev 3
│   ├── produksi/            # Upload, review    — Dev 4
│   ├── bank-konten/          # Search & archive  — Dev 5
│   └── laporan/                # Laporan          — Dev 5
├── components/ui/               # shadcn/ui         — Dev 6
├── layouts/                       # Sidebar, Topbar   — Dev 6
├── hooks/                           # TanStack Query hooks per modul
├── lib/                               # api-client.ts, utils.ts — auth context nanti di sini (Dev 2)
└── routes/                             # router.tsx — protected route setup nanti di sini (Dev 2)
```

## Status saat ini (Phase 2A: Project Foundation)

**Sudah ada:**
- Backend: koneksi database (Drizzle + mysql2), Fastify app dengan CORS/cookie/multipart, error handler terpusat, schema lengkap untuk semua entitas inti (`users`, `roles`, `user_roles`, master data, `activities`, `production_*`, `publications`, `archive_*`), stub route `auth`/`activities`/`production` (baru placeholder response, belum ada logic).
- Frontend: baru discaffold di branch ini — routing dasar (React Router), TanStack Query provider, Tailwind + CSS variables untuk shadcn/ui, struktur folder per modul/dev, `lib/api-client.ts` (fetch wrapper dengan cookie credentials, siap dipakai session-based auth).

**Belum ada (menunggu dev masing-masing):**
- Auth & RBAC asli (login, session, guard middleware, user management) — Dev 2
- Halaman & endpoint kegiatan/penugasan — Dev 3
- Halaman & endpoint produksi/publikasi — Dev 4
- Bank konten (search) & laporan — Dev 5
- Dashboard, komponen shadcn/ui, layout (sidebar/topbar) — Dev 6

## Known issue

- `backend/tsconfig.json` pakai `"moduleResolution": "node"`, tapi versi TypeScript yang terpasang (`^7.0.2`) sudah **menghapus** alias `node10` ini → `npx tsc --noEmit` di `backend/` langsung error (`TS5108`). Perlu diperbaiki oleh Dev 1 (ganti ke `"node10"` eksplisit dijadikan `"nodenext"`/`"bundler"`, atau pin TypeScript ke versi 5.x).
- `.env.example` di root belum ada `COOKIE_SECRET`, padahal `backend/src/server.ts` sudah membacanya (ada fallback default yang tidak aman untuk production) — perlu ditambahkan.

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

| Dev | Scope |
|---|---|
| Dev 1 | Config, koneksi database, schema Drizzle (`db/schema/`), middleware & service bersama (`shared/`) — API contract & schema `users`/`roles`/`user_roles` harus koordinasi ke dia dulu |
| Dev 2 | Auth (`login`/`logout`/`me`), session cookie, RBAC 2 role + multi-role, user management, protected route frontend |
| Dev 3 | Kegiatan/agenda & penugasan |
| Dev 4 | Produksi (versioning, review) & publikasi (pencatatan) |
| Dev 5 | Bank Konten (arsip, search) & laporan |
| Dev 6 | Dashboard, komponen UI (shadcn), layout |

## Aturan kerja tim

- Satu repository GitHub, kerja di feature branch, **PR wajib** — jangan commit langsung ke `main`.
- `.env` tidak boleh di-commit, hanya `.env.example`.
- Jangan simpan credential Aiven/password/token/secret di source code.
- Perubahan schema/migration hanya lewat Drizzle migration, direview, dijalankan oleh Dev 1 — jangan `drizzle-kit push` sembarangan ke Aiven yang shared.
- Semua endpoint validasi input pakai Zod.
- File development lokal per developer — shared database (Aiven) tidak berarti shared filesystem. Untuk testing lintas developer, pakai fixtures/dummy files.
- Update dokumentasi area masing-masing.

Detail lengkap (entitas database, alur bisnis, definition of done per dev) ada di `CLAUDE.md`.

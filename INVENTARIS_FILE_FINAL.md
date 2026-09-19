# Inventaris seluruh berkas folder Final

Tanggal: 19 September 2026. Inventaris ini mencatat berkas yang ada saat telaah, termasuk berkas tersembunyi. Dua dokumen hasil telaah (`CATATAN_PEMAHAMAN_PROYEK.md` dan dokumen ini) tidak dihitung sebagai berkas proyek awal.

Penjelasan arsitektur, alur, dan temuan: [CATATAN_PEMAHAMAN_PROYEK.md](CATATAN_PEMAHAMAN_PROYEK.md).

| Kelompok | Jumlah berkas | Ukuran byte |
|---|---:|---:|
| Berkas proyek | 168 | 3026095 |
| Cache Vite | 24 | 14347047 |
| Metadata Git | 29 | 5002181 |
| Total awal | 221 | 22375323 |

Kode dan konfigurasi aplikasi ditelusuri secara statis. Lockfile dan snapshot diperiksa sebagai data terstruktur; gambar unik ditinjau visual dan duplikat dibandingkan. Cache library diperiksa melalui metadata/import/source map, bukan audit setiap baris vendor. Internal Git dicatat sebagai metadata version control, bukan audit setiap commit atau objek biner.

Skrip migrasi, seed, penghapusan, dan percobaan tidak dijalankan. Ukuran metadata Git dapat berubah ketika alat version control bekerja.

## Berkas proyek

| No. | Path relatif | Byte | Peran/cara telaah |
|---:|---|---:|---|
| 1 | `.gitignore` | 111 | Konfigurasi proyek/build/lint/style atau ignore |
| 2 | `audit_full_system.md` | 14009 | Dokumentasi; dibandingkan dengan implementasi aktual |
| 3 | `backend/clear_tokens.ts` | 213 | Utilitas perubahan database; hanya dibaca |
| 4 | `backend/drizzle.config.ts` | 352 | Konfigurasi proyek/build/lint/style atau ignore |
| 5 | `backend/manual_migrate.ts` | 1573 | Utilitas perubahan database; hanya dibaca |
| 6 | `backend/package-lock.json` | 168361 | Lock dependency; JSON dan versi dependency diperiksa |
| 7 | `backend/package.json` | 1077 | Dependency dan perintah pengembangan/build |
| 8 | `backend/src/assets/Logo_Kota_Batu.png` | 119082 | Aset logo/watermark atau contoh unggahan; gambar unik ditinjau visual |
| 9 | `backend/src/assets/Logo_Kota_Batu_watermark.png` | 110610 | Aset logo/watermark atau contoh unggahan; gambar unik ditinjau visual |
| 10 | `backend/src/db/drop.ts` | 1079 | Koneksi, migrasi, seed, atau utilitas database; hanya dibaca |
| 11 | `backend/src/db/index.ts` | 1185 | Koneksi, migrasi, seed, atau utilitas database; hanya dibaca |
| 12 | `backend/src/db/migrate.ts` | 930 | Koneksi, migrasi, seed, atau utilitas database; hanya dibaca |
| 13 | `backend/src/db/migrations/0000_far_emma_frost.sql` | 13555 | SQL perubahan database |
| 14 | `backend/src/db/migrations/0001_dusty_abomination.sql` | 2384 | SQL perubahan database |
| 15 | `backend/src/db/migrations/0002_aberrant_doctor_strange.sql` | 1175 | SQL perubahan database |
| 16 | `backend/src/db/migrations/0003_sharp_chamber.sql` | 1548 | SQL perubahan database |
| 17 | `backend/src/db/migrations/0004_yielding_next_avengers.sql` | 1027 | SQL perubahan database |
| 18 | `backend/src/db/migrations/0005_add_password_reset_tokens.sql` | 586 | SQL perubahan database |
| 19 | `backend/src/db/migrations/0006_add_assignments_work_link.sql` | 49 | SQL perubahan database |
| 20 | `backend/src/db/migrations/0007_silly_gorgon.sql` | 310 | SQL perubahan database |
| 21 | `backend/src/db/migrations/0008_blushing_boom_boom.sql` | 1196 | SQL perubahan database |
| 22 | `backend/src/db/migrations/0009_heavy_synch.sql` | 1193 | SQL perubahan database |
| 23 | `backend/src/db/migrations/0010_quick_odin.sql` | 95 | SQL perubahan database |
| 24 | `backend/src/db/migrations/0011_add_notification_preferences.sql` | 505 | SQL perubahan database |
| 25 | `backend/src/db/migrations/meta/0000_snapshot.json` | 46079 | Snapshot schema/jurnal migrasi; diperiksa sebagai JSON |
| 26 | `backend/src/db/migrations/meta/0001_snapshot.json` | 49976 | Snapshot schema/jurnal migrasi; diperiksa sebagai JSON |
| 27 | `backend/src/db/migrations/meta/0002_snapshot.json` | 50555 | Snapshot schema/jurnal migrasi; diperiksa sebagai JSON |
| 28 | `backend/src/db/migrations/meta/0003_snapshot.json` | 52130 | Snapshot schema/jurnal migrasi; diperiksa sebagai JSON |
| 29 | `backend/src/db/migrations/meta/0004_snapshot.json` | 52320 | Snapshot schema/jurnal migrasi; diperiksa sebagai JSON |
| 30 | `backend/src/db/migrations/meta/0007_snapshot.json` | 42158 | Snapshot schema/jurnal migrasi; diperiksa sebagai JSON |
| 31 | `backend/src/db/migrations/meta/0008_snapshot.json` | 42388 | Snapshot schema/jurnal migrasi; diperiksa sebagai JSON |
| 32 | `backend/src/db/migrations/meta/0009_snapshot.json` | 42316 | Snapshot schema/jurnal migrasi; diperiksa sebagai JSON |
| 33 | `backend/src/db/migrations/meta/0010_snapshot.json` | 42316 | Snapshot schema/jurnal migrasi; diperiksa sebagai JSON |
| 34 | `backend/src/db/migrations/meta/_journal.json` | 1906 | Snapshot schema/jurnal migrasi; diperiksa sebagai JSON |
| 35 | `backend/src/db/schema/activities.ts` | 2724 | Definisi tabel/relasi Drizzle |
| 36 | `backend/src/db/schema/index.ts` | 222 | Definisi tabel/relasi Drizzle |
| 37 | `backend/src/db/schema/master.ts` | 904 | Definisi tabel/relasi Drizzle |
| 38 | `backend/src/db/schema/notification-preferences.ts` | 594 | Definisi tabel/relasi Drizzle |
| 39 | `backend/src/db/schema/production.ts` | 1997 | Definisi tabel/relasi Drizzle |
| 40 | `backend/src/db/schema/publications.ts` | 1231 | Definisi tabel/relasi Drizzle |
| 41 | `backend/src/db/schema/system.ts` | 1197 | Definisi tabel/relasi Drizzle |
| 42 | `backend/src/db/schema/users.ts` | 1919 | Definisi tabel/relasi Drizzle |
| 43 | `backend/src/db/seed.ts` | 12961 | Koneksi, migrasi, seed, atau utilitas database; hanya dibaca |
| 44 | `backend/src/modules/activities/activities.controller.ts` | 16599 | Modul API activities: controller/layanan bisnis |
| 45 | `backend/src/modules/activities/activities.routes.ts` | 395 | Modul API activities: registrasi route |
| 46 | `backend/src/modules/assignments/assignments.controller.ts` | 33738 | Modul API assignments: controller/layanan bisnis |
| 47 | `backend/src/modules/assignments/assignments.routes.ts` | 499 | Modul API assignments: registrasi route |
| 48 | `backend/src/modules/auth/auth.routes.ts` | 15263 | Modul API auth: registrasi route |
| 49 | `backend/src/modules/dashboard/dashboard.controller.ts` | 3860 | Modul API dashboard: controller/layanan bisnis |
| 50 | `backend/src/modules/dashboard/dashboard.routes.ts` | 233 | Modul API dashboard: registrasi route |
| 51 | `backend/src/modules/master/master.controller.ts` | 3710 | Modul API master: controller/layanan bisnis |
| 52 | `backend/src/modules/master/master.routes.ts` | 513 | Modul API master: registrasi route |
| 53 | `backend/src/modules/productions/productions.controller.ts` | 29376 | Modul API productions: controller/layanan bisnis |
| 54 | `backend/src/modules/productions/productions.routes.ts` | 740 | Modul API productions: registrasi route |
| 55 | `backend/src/modules/publications/publications.routes.ts` | 3138 | Modul API publications: registrasi route |
| 56 | `backend/src/modules/reports/reports.routes.ts` | 3369 | Modul API reports: registrasi route |
| 57 | `backend/src/modules/reports/reports.service.ts` | 19509 | Modul API reports: controller/layanan bisnis |
| 58 | `backend/src/modules/reviews/reviews.routes.ts` | 4481 | Modul API reviews: registrasi route |
| 59 | `backend/src/modules/storage/storage.routes.ts` | 1918 | Modul API storage: registrasi route |
| 60 | `backend/src/modules/system/audit.service.ts` | 1280 | Modul API system: controller/layanan bisnis |
| 61 | `backend/src/modules/system/notifications.service.ts` | 2259 | Modul API system: controller/layanan bisnis |
| 62 | `backend/src/modules/system/system.controller.ts` | 3542 | Modul API system: controller/layanan bisnis |
| 63 | `backend/src/modules/system/system.routes.ts` | 448 | Modul API system: registrasi route |
| 64 | `backend/src/modules/users/users.controller.ts` | 10953 | Modul API users: controller/layanan bisnis |
| 65 | `backend/src/modules/users/users.routes.ts` | 652 | Modul API users: registrasi route |
| 66 | `backend/src/server.ts` | 7188 | Entry backend, plugin, autentikasi global, static serving |
| 67 | `backend/src/services/mail.service.ts` | 48819 | Layanan storage, password, atau email |
| 68 | `backend/src/services/password.service.ts` | 1076 | Layanan storage, password, atau email |
| 69 | `backend/src/services/StorageService.ts` | 2226 | Layanan storage, password, atau email |
| 70 | `backend/src/storage/uploads/1788781720289_307fe64d8270_Servis_PCB_u1.jpeg` | 370067 | Aset logo/watermark atau contoh unggahan; gambar unik ditinjau visual |
| 71 | `backend/test-db.ts` | 318 | Skrip percobaan query/request/tipe; bukan suite otomatis, hanya dibaca |
| 72 | `backend/test-drizzle-all-assignments.ts` | 561 | Skrip percobaan query/request/tipe; bukan suite otomatis, hanya dibaca |
| 73 | `backend/test-drizzle-assignments.ts` | 505 | Skrip percobaan query/request/tipe; bukan suite otomatis, hanya dibaca |
| 74 | `backend/test-drizzle-type.ts` | 375 | Skrip percobaan query/request/tipe; bukan suite otomatis, hanya dibaca |
| 75 | `backend/test-drizzle.ts` | 429 | Skrip percobaan query/request/tipe; bukan suite otomatis, hanya dibaca |
| 76 | `backend/test-zeleony.ts` | 602 | Skrip percobaan query/request/tipe; bukan suite otomatis, hanya dibaca |
| 77 | `backend/test.js` | 716 | Skrip percobaan query/request/tipe; bukan suite otomatis, hanya dibaca |
| 78 | `backend/tsconfig.json` | 394 | Konfigurasi proyek/build/lint/style atau ignore |
| 79 | `DOKUMENTASI_PENGEMBANGAN_DAN_DEPLOYMENT.md` | 32135 | Dokumentasi; dibandingkan dengan implementasi aktual |
| 80 | `frontend/.gitignore` | 277 | Konfigurasi proyek/build/lint/style atau ignore |
| 81 | `frontend/.oxlintrc.json` | 253 | Konfigurasi proyek/build/lint/style atau ignore |
| 82 | `frontend/fix_all.py` | 2465 | Skrip perubahan kode lama; hanya dibaca |
| 83 | `frontend/fix_kegiatan.py` | 806 | Skrip perubahan kode lama; hanya dibaca |
| 84 | `frontend/fix_kegiatan_safe.py` | 5507 | Skrip perubahan kode lama; hanya dibaca |
| 85 | `frontend/fix_penugasan.py` | 2419 | Skrip perubahan kode lama; hanya dibaca |
| 86 | `frontend/fix_penugasan2.py` | 5816 | Skrip perubahan kode lama; hanya dibaca |
| 87 | `frontend/index.html` | 1643 | Entry HTML frontend |
| 88 | `frontend/package-lock.json` | 133247 | Lock dependency; JSON dan versi dependency diperiksa |
| 89 | `frontend/package.json` | 1044 | Dependency dan perintah pengembangan/build |
| 90 | `frontend/postcss.config.js` | 87 | Konfigurasi proyek/build/lint/style atau ignore |
| 91 | `frontend/public/favicon.png` | 119082 | Aset logo/watermark atau contoh unggahan; gambar unik ditinjau visual |
| 92 | `frontend/src/App.tsx` | 1324 | Entry frontend dan susunan provider |
| 93 | `frontend/src/assets/Logo_Kota_Batu.png` | 119082 | Aset logo/watermark atau contoh unggahan; gambar unik ditinjau visual |
| 94 | `frontend/src/assets/Logo_Kota_Batu_watermark.png` | 110610 | Aset logo/watermark atau contoh unggahan; gambar unik ditinjau visual |
| 95 | `frontend/src/components/shared/EventCalendar.tsx` | 14381 | Komponen UI bersama |
| 96 | `frontend/src/components/shared/StateComponents.tsx` | 2535 | Komponen UI bersama |
| 97 | `frontend/src/components/ui/Badge.tsx` | 1329 | Komponen UI bersama |
| 98 | `frontend/src/components/ui/Button.tsx` | 2487 | Komponen UI bersama |
| 99 | `frontend/src/components/ui/Card.tsx` | 1037 | Komponen UI bersama |
| 100 | `frontend/src/components/ui/demo.tsx` | 914 | Komponen UI bersama; contoh pemakaian |
| 101 | `frontend/src/components/ui/Dialog.tsx` | 2906 | Komponen UI bersama |
| 102 | `frontend/src/components/ui/FileUploader.tsx` | 3324 | Komponen UI bersama |
| 103 | `frontend/src/components/ui/index.ts` | 545 | Komponen UI bersama |
| 104 | `frontend/src/components/ui/Input.tsx` | 1148 | Komponen UI bersama |
| 105 | `frontend/src/components/ui/Pagination.tsx` | 2729 | Komponen UI bersama |
| 106 | `frontend/src/components/ui/Select.tsx` | 1503 | Komponen UI bersama |
| 107 | `frontend/src/components/ui/status-badge.tsx` | 2185 | Komponen UI bersama |
| 108 | `frontend/src/components/ui/Table.tsx` | 2141 | Komponen UI bersama |
| 109 | `frontend/src/components/ui/Tabs.tsx` | 1227 | Komponen UI bersama |
| 110 | `frontend/src/contexts/ConfirmContext.tsx` | 8058 | Context/provider state frontend |
| 111 | `frontend/src/contexts/ToastContext.tsx` | 5804 | Context/provider state frontend |
| 112 | `frontend/src/hooks/.gitkeep` | 0 | Placeholder direktori kosong |
| 113 | `frontend/src/index.css` | 2642 | Style global dan tema |
| 114 | `frontend/src/layouts/AppLayout.tsx` | 1637 | Kerangka halaman dan navigasi |
| 115 | `frontend/src/layouts/PetugasLayout.tsx` | 1821 | Kerangka halaman dan navigasi |
| 116 | `frontend/src/layouts/PetugasSidebar.tsx` | 3150 | Kerangka halaman dan navigasi |
| 117 | `frontend/src/layouts/Sidebar.tsx` | 4808 | Kerangka halaman dan navigasi |
| 118 | `frontend/src/layouts/Topbar.tsx` | 19853 | Kerangka halaman dan navigasi |
| 119 | `frontend/src/lib/api-client.ts` | 1257 | API client, task store, konstanta, atau utilitas frontend |
| 120 | `frontend/src/lib/AuthContext.tsx` | 5543 | Context/provider state frontend |
| 121 | `frontend/src/lib/constants.ts` | 689 | API client, task store, konstanta, atau utilitas frontend |
| 122 | `frontend/src/lib/LanguageContext.tsx` | 58306 | Context/provider state frontend |
| 123 | `frontend/src/lib/petugas-store.ts` | 12119 | API client, task store, konstanta, atau utilitas frontend |
| 124 | `frontend/src/lib/reports-api.ts` | 4277 | API client, task store, konstanta, atau utilitas frontend |
| 125 | `frontend/src/lib/ThemeContext.tsx` | 1599 | Context/provider state frontend |
| 126 | `frontend/src/lib/utils.ts` | 175 | API client, task store, konstanta, atau utilitas frontend |
| 127 | `frontend/src/main.tsx` | 241 | Entry frontend dan susunan provider |
| 128 | `frontend/src/pages/auth/LoginPage.tsx` | 23813 | Halaman frontend aktif: LoginPage |
| 129 | `frontend/src/pages/auth/ResetPasswordPage.tsx` | 16934 | Halaman frontend aktif: ResetPasswordPage |
| 130 | `frontend/src/pages/bank-konten/BankKontenDetailPage.tsx` | 18921 | Halaman frontend aktif: BankKontenDetailPage |
| 131 | `frontend/src/pages/bank-konten/BankKontenPage.tsx` | 22313 | Halaman frontend aktif: BankKontenPage |
| 132 | `frontend/src/pages/dashboard/DashboardPage.tsx` | 46230 | Halaman frontend aktif: DashboardPage |
| 133 | `frontend/src/pages/kegiatan/KegiatanPage.tsx` | 56446 | Halaman frontend aktif: KegiatanPage |
| 134 | `frontend/src/pages/laporan/LaporanPage.tsx` | 44158 | Halaman frontend aktif: LaporanPage |
| 135 | `frontend/src/pages/pengaturan/PengaturanPage.tsx` | 37686 | Halaman frontend aktif: PengaturanPage |
| 136 | `frontend/src/pages/penugasan/PenugasanPage.tsx` | 67580 | Halaman frontend aktif: PenugasanPage |
| 137 | `frontend/src/pages/petugas/DaftarAnggotaPage.tsx` | 20933 | Halaman frontend aktif: DaftarAnggotaPage |
| 138 | `frontend/src/pages/petugas/PetugasAgendaTersediaPage.tsx` | 6883 | Halaman frontend aktif: PetugasAgendaTersediaPage |
| 139 | `frontend/src/pages/petugas/PetugasDashboardPage.tsx` | 32875 | Halaman frontend aktif: PetugasDashboardPage |
| 140 | `frontend/src/pages/petugas/PetugasPenugasanPage.tsx` | 77083 | Halaman frontend aktif: PetugasPenugasanPage |
| 141 | `frontend/src/pages/petugas/TambahPetugasPage.tsx` | 15332 | Halaman frontend aktif: TambahPetugasPage |
| 142 | `frontend/src/pages/produksi/ProduksiPage.tsx` | 9281 | Halaman frontend aktif: ProduksiPage |
| 143 | `frontend/src/pages/produksi/PublikasiPage.tsx` | 9064 | Halaman frontend aktif: PublikasiPage |
| 144 | `frontend/src/pages/produksi/ReviewPage.tsx` | 68190 | Halaman frontend aktif: ReviewPage |
| 145 | `frontend/src/pages/profil/ProfilPage.tsx` | 45814 | Halaman frontend aktif: ProfilPage |
| 146 | `frontend/src/routes/HomeRedirect.tsx` | 307 | Routing, redirect, atau pembatasan akses frontend |
| 147 | `frontend/src/routes/ProtectedRoute.tsx` | 516 | Routing, redirect, atau pembatasan akses frontend |
| 148 | `frontend/src/routes/RoleRoute.tsx` | 1140 | Routing, redirect, atau pembatasan akses frontend |
| 149 | `frontend/src/routes/router.tsx` | 4472 | Routing, redirect, atau pembatasan akses frontend |
| 150 | `frontend/src/types/api.types.ts` | 2619 | Kontrak tipe data frontend/API |
| 151 | `frontend/tailwind.config.js` | 1055 | Konfigurasi proyek/build/lint/style atau ignore |
| 152 | `frontend/test_post.ts` | 825 | Skrip percobaan query/request/tipe; bukan suite otomatis, hanya dibaca |
| 153 | `frontend/tsconfig.app.json` | 731 | Konfigurasi proyek/build/lint/style atau ignore |
| 154 | `frontend/tsconfig.json` | 126 | Konfigurasi proyek/build/lint/style atau ignore |
| 155 | `frontend/tsconfig.node.json` | 581 | Konfigurasi proyek/build/lint/style atau ignore |
| 156 | `frontend/vite.config.ts` | 400 | Konfigurasi proyek/build/lint/style atau ignore |
| 157 | `index.html` | 264 | HTML root lama; referensi main.jsx tidak tersedia |
| 158 | `package-lock.json` | 16491 | Lock dependency; JSON dan versi dependency diperiksa |
| 159 | `package.json` | 577 | Dependency dan perintah pengembangan/build |
| 160 | `postcss.config.js` | 86 | Konfigurasi proyek/build/lint/style atau ignore |
| 161 | `read_docx.ps1` | 783 | Utilitas pembaca dokumen Word |
| 162 | `README.md` | 803 | Dokumentasi; dibandingkan dengan implementasi aktual |
| 163 | `review_page.diff` | 82220 | Patch review lama berencoding UTF-16 |
| 164 | `ReviewPage_temp.tsx` | 52409 | Salinan halaman review lama di root; bukan route aktif |
| 165 | `SIMIKP_Dokumentasi_Proyek_dan_Alur_Sistem_FINAL_dengan_Penugasan_Tim.docx` | 52480 | Rancangan awal sistem dan pembagian pekerjaan tim; isi XML ditelaah |
| 166 | `start.bat` | 768 | Launcher pengembangan Windows |
| 167 | `tailwind.config.js` | 191 | Konfigurasi proyek/build/lint/style atau ignore |
| 168 | `test.js` | 699 | Skrip percobaan query/request/tipe; bukan suite otomatis, hanya dibaca |

## Cache Vite

| No. | Path relatif | Byte | Peran/cara telaah |
|---:|---|---:|---|
| 1 | `frontend/.vite/deps/@remixicon_react.js` | 2727588 | Dependency pihak ketiga hasil bundling Vite |
| 2 | `frontend/.vite/deps/@remixicon_react.js.map` | 3305799 | Source map dependency hasil bundling |
| 3 | `frontend/.vite/deps/@tanstack_react-query.js` | 175129 | Dependency pihak ketiga hasil bundling Vite |
| 4 | `frontend/.vite/deps/@tanstack_react-query.js.map` | 394281 | Source map dependency hasil bundling |
| 5 | `frontend/.vite/deps/_metadata.json` | 1959 | Metadata cache dependency Vite |
| 6 | `frontend/.vite/deps/chunk-4MBMRILA.js` | 2607 | Dependency pihak ketiga hasil bundling Vite |
| 7 | `frontend/.vite/deps/chunk-4MBMRILA.js.map` | 100 | Source map dependency hasil bundling |
| 8 | `frontend/.vite/deps/chunk-CCMZAS57.js` | 953577 | Dependency pihak ketiga hasil bundling Vite |
| 9 | `frontend/.vite/deps/chunk-CCMZAS57.js.map` | 1492902 | Source map dependency hasil bundling |
| 10 | `frontend/.vite/deps/chunk-E55NSNTN.js` | 79690 | Dependency pihak ketiga hasil bundling Vite |
| 11 | `frontend/.vite/deps/chunk-E55NSNTN.js.map` | 125636 | Source map dependency hasil bundling |
| 12 | `frontend/.vite/deps/class-variance-authority.js` | 2817 | Dependency pihak ketiga hasil bundling Vite |
| 13 | `frontend/.vite/deps/class-variance-authority.js.map` | 5628 | Source map dependency hasil bundling |
| 14 | `frontend/.vite/deps/lucide-react.js` | 898419 | Dependency pihak ketiga hasil bundling Vite |
| 15 | `frontend/.vite/deps/lucide-react.js.map` | 2768934 | Source map dependency hasil bundling |
| 16 | `frontend/.vite/deps/package.json` | 26 | Metadata cache dependency Vite |
| 17 | `frontend/.vite/deps/react-dom_client.js` | 1055 | Dependency pihak ketiga hasil bundling Vite |
| 18 | `frontend/.vite/deps/react-dom_client.js.map` | 1233 | Source map dependency hasil bundling |
| 19 | `frontend/.vite/deps/react-router-dom.js` | 488053 | Dependency pihak ketiga hasil bundling Vite |
| 20 | `frontend/.vite/deps/react-router-dom.js.map` | 822395 | Source map dependency hasil bundling |
| 21 | `frontend/.vite/deps/react.js` | 122 | Dependency pihak ketiga hasil bundling Vite |
| 22 | `frontend/.vite/deps/react.js.map` | 100 | Source map dependency hasil bundling |
| 23 | `frontend/.vite/deps/react_jsx-dev-runtime.js` | 37880 | Dependency pihak ketiga hasil bundling Vite |
| 24 | `frontend/.vite/deps/react_jsx-dev-runtime.js.map` | 61117 | Source map dependency hasil bundling |

## Metadata Git

| No. | Path relatif | Byte | Peran/cara telaah |
|---:|---|---:|---|
| 1 | `.git/config` | 331 | Metadata, referensi, atau konfigurasi Git |
| 2 | `.git/description` | 73 | Metadata, referensi, atau konfigurasi Git |
| 3 | `.git/HEAD` | 21 | Metadata, referensi, atau konfigurasi Git |
| 4 | `.git/hooks/applypatch-msg.sample` | 478 | Contoh hook Git; metadata version control |
| 5 | `.git/hooks/commit-msg.sample` | 896 | Contoh hook Git; metadata version control |
| 6 | `.git/hooks/fsmonitor-watchman.sample` | 4726 | Contoh hook Git; metadata version control |
| 7 | `.git/hooks/post-update.sample` | 189 | Contoh hook Git; metadata version control |
| 8 | `.git/hooks/pre-applypatch.sample` | 424 | Contoh hook Git; metadata version control |
| 9 | `.git/hooks/pre-commit.sample` | 1649 | Contoh hook Git; metadata version control |
| 10 | `.git/hooks/pre-merge-commit.sample` | 416 | Contoh hook Git; metadata version control |
| 11 | `.git/hooks/pre-push.sample` | 1374 | Contoh hook Git; metadata version control |
| 12 | `.git/hooks/pre-rebase.sample` | 4898 | Contoh hook Git; metadata version control |
| 13 | `.git/hooks/pre-receive.sample` | 544 | Contoh hook Git; metadata version control |
| 14 | `.git/hooks/prepare-commit-msg.sample` | 1492 | Contoh hook Git; metadata version control |
| 15 | `.git/hooks/push-to-checkout.sample` | 2783 | Contoh hook Git; metadata version control |
| 16 | `.git/hooks/sendemail-validate.sample` | 2308 | Contoh hook Git; metadata version control |
| 17 | `.git/hooks/update.sample` | 3650 | Contoh hook Git; metadata version control |
| 18 | `.git/index` | 21470 | Metadata, referensi, atau konfigurasi Git |
| 19 | `.git/info/exclude` | 240 | Metadata, referensi, atau konfigurasi Git |
| 20 | `.git/logs/HEAD` | 200 | Metadata, referensi, atau konfigurasi Git |
| 21 | `.git/logs/refs/heads/main` | 200 | Metadata, referensi, atau konfigurasi Git |
| 22 | `.git/logs/refs/remotes/origin/HEAD` | 200 | Metadata, referensi, atau konfigurasi Git |
| 23 | `.git/objects/pack/pack-055eebd49bcce16946711f0bea1787412c43e607.idx` | 51500 | Objek/indeks riwayat Git biner |
| 24 | `.git/objects/pack/pack-055eebd49bcce16946711f0bea1787412c43e607.pack` | 4893713 | Objek/indeks riwayat Git biner |
| 25 | `.git/objects/pack/pack-055eebd49bcce16946711f0bea1787412c43e607.rev` | 7256 | Objek/indeks riwayat Git biner |
| 26 | `.git/packed-refs` | 1038 | Metadata, referensi, atau konfigurasi Git |
| 27 | `.git/refs/codex/turn-diffs/captures/1789791888902/5e8cb114-f823-40e9-ae09-db5ddb5ca7bb/base` | 41 | Metadata, referensi, atau konfigurasi Git |
| 28 | `.git/refs/heads/main` | 41 | Metadata, referensi, atau konfigurasi Git |
| 29 | `.git/refs/remotes/origin/HEAD` | 30 | Metadata, referensi, atau konfigurasi Git |

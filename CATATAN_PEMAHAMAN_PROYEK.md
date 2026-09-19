# Peta dan catatan pemahaman SIMIKP — folder Final

Tanggal telaah: 19 September 2026. Acuan kode: commit `bcaba8e` pada branch `main`.

Dokumen ini dibuat setelah penelusuran proyek untuk membantu kelanjutan pengembangan. Ini merupakan catatan implementasi yang ditemukan, bukan perubahan kebutuhan, hasil pengujian runtime, atau pernyataan bahwa seluruh fitur sudah benar.

## Cakupan dan keadaan workspace

- Inventaris awal: 168 berkas proyek (termasuk 105 berkas TS/TSX), 24 berkas cache Vite, dan 29 berkas internal Git. Daftar lengkap: [INVENTARIS_FILE_FINAL.md](INVENTARIS_FILE_FINAL.md).
- Penelusuran mencakup frontend, backend, schema dan migration, konfigurasi, skrip bantu/percobaan, dokumentasi Markdown, isi dokumen Word, serta aset gambar.
- Lockfile dan snapshot database diperiksa sebagai data terstruktur. Cache Vite diperiksa melalui metadata, import, dan source map; kode library hasil bundling tidak diaudit baris demi baris. Internal Git diinventarisasi sebagai metadata version control.
- Tidak ada `node_modules`, `.env`, maupun hasil build `dist` di folder proyek saat diperiksa. Node lokal v24.14.1 dan npm 11.11.0 tersedia.
- Tidak menjalankan install, server, build, migrasi, seed, skrip penghapus, atau pengiriman email. Tidak mengakses database/VPS. Kode aplikasi tetap seperti semula; hanya catatan pemahaman dan inventaris ditambahkan.

## Tujuan sistem dan batas bisnis

SIMIKP membantu Diskominfo Kota Batu mengelola agenda, petugas peliputan, hasil naskah/foto/video/desain, persetujuan, pencatatan publikasi, arsip Bank Konten, dan laporan. Publikasi adalah pencatatan kanal, tautan, dan status; tidak ada implementasi auto-posting media sosial.

Dokumen Word menyimpan rancangan awal dan pembagian pekerjaan enam developer. Rancangan itu menyebut dua role (`SUPER_ADMIN`, `PETUGAS`), server-side session, arsip dengan isu/tokoh/keyword, dan notifikasi in-app. Implementasi sekarang sudah berbeda: JWT, role Ahli Pertama, email SMTP, dan Bank Konten berbasis produksi/assignment. Dokumen lama perlu dibaca sebagai riwayat desain, kemudian dicocokkan dengan kode.

## Arsitektur dan titik masuk

```text
frontend/index.html → src/main.tsx → App.tsx → routes/router.tsx
  → layout manajemen / layout petugas → halaman dan komponen
  → lib/api-client.ts → /api/v1/*
backend/src/server.ts → modules/* → Drizzle → MySQL
                                   → filesystem untuk media
                                   → Nodemailer untuk email
```

| Bagian | Implementasi |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router, TanStack Query, Tailwind, Lucide/Remixicon |
| Backend | Fastify, TypeScript, Zod, JWT/cookie, multipart, static serving |
| Database | MySQL2 + Drizzle ORM; UUID berbentuk char(36) |
| Laporan | ExcelJS dan PDFKit/pdfkit-table |
| Email | Nodemailer; konfigurasi SMTP melalui environment |
| Development | Root `npm run dev:web`: backend 3000 dan frontend 5173 |
| Proxy | Vite meneruskan `/api` ke `http://127.0.0.1:3000` |
| Production | Backend mencari `frontend/dist`; dokumen menjelaskan Nginx + systemd di Ubuntu |

`App.tsx` memasang ThemeProvider, LanguageProvider, QueryClientProvider, AuthProvider, ToastProvider, dan ConfirmProvider. QueryClient memiliki stale time 10 detik dan interval refetch 15 detik. Interval tersebut berlaku pada TanStack Query, bukan otomatis pada fetch manual di task store.

Frontend memakai `VITE_API_BASE_URL` atau `/api/v1`; apiFetch menyertakan cookie dan Bearer dari `simikp_token`. Upload XHR di halaman petugas masih menggunakan `/api/v1/storage/upload` secara langsung. Export laporan menggunakan fetch terpisah dari apiFetch.

## Role dan halaman

Role sistem berbeda dari bidang pekerjaan (`staffType`). Seed membuat `SUPER_ADMIN`, `AHLI_PERTAMA`, dan `PETUGAS`; tipe frontend juga mengenal `ADMIN`, `MANAGER`, `STAFF`, dan `REVIEWER`. Login mengambil satu baris role, meskipun tabel `user_roles` mendukung many-to-many.

| Area | Halaman dan fungsi |
|---|---|
| Publik | Login dan reset password; login juga memiliki tombol akun demo |
| Manajemen | Dashboard, kegiatan, penugasan khusus, produksi, publikasi, Bank Konten, laporan, daftar anggota, tambah petugas, profil, pengaturan |
| Ahli Pertama | Dashboard dan `/review`; route review hanya mengizinkan `AHLI_PERTAMA` |
| Petugas | `/petugas/dashboard`, agenda tersedia, penugasan saya, Bank Konten/detail, profil, pengaturan |

Ada 18 komponen halaman; Bank Konten, profil, dan pengaturan digunakan kembali pada area petugas. Route guard frontend memisahkan area, tetapi tidak membuktikan authorization backend. Sidebar terutama membedakan Ahli Pertama dan manajemen lain; beberapa tautan dashboard tidak sesuai hak route setiap role.

## Alur utama yang benar-benar digunakan frontend

1. **Kegiatan:** admin mengisi agenda, tanggal/waktu, OPD, lokasi, prioritas, dan kebutuhan output. Backend mencari/membuat master OPD/lokasi, menyimpan `activities`, lalu `activity_required_contents`.
2. **Penugasan:** admin memilih kegiatan, petugas, dan jenis konten. GET `/assignments` berangkat dari kebutuhan output kegiatan dan membuat baris sintetis `vacant-...` / `UNASSIGNED` untuk slot kosong. Baris itu bukan record assignment di database.
3. **Klaim mandiri:** petugas melihat output yang belum diambil, lalu POST `/assignments/claim`. Backend memeriksa user, kecocokan bidang, kebutuhan output, dan slot terisi.
4. **Pengerjaan:** `PetugasPenugasanPage` memakai `usePetugasTasksStore(user.id)`. Naskah diketik; foto/video/desain diunggah dengan multipart streaming dan progress XHR.
5. **Pengiriman:** task store melakukan PUT `/assignments/:id`, mengisi `workLink` dan status `MENULIS`, `DESAIN`, atau `LIPUTAN`. Jalur utama ini tidak otomatis membuat production version baru pada setiap pengiriman.
6. **Review/revisi:** `ReviewPage` membaca seluruh task store. Permintaan revisi menyimpan status `REVISI` dan catatan pada assignment; pengiriman ulang memicu notifikasi reviewer. Riwayat banyak putaran revisi disimpan lokal di browser.
7. **Persetujuan:** naskah dapat disetujui melalui update assignment. Kurasi media memanggil `/productions/curate-approval` untuk membuat item/version jika belum ada dan metadata `production_files`; kemudian `approveContent` mengirim status `COMPLETED`.
8. **Bank Konten:** GET `/productions/bank-konten` menggabungkan metadata `production_files` dan fallback `workLink` assignment selesai, lalu mengelompokkan menurut kegiatan. Detail memisahkan foto/video, desainer, dan naskah.
9. **Publikasi/laporan:** publikasi dicatat dalam tabel `publications`; laporan membaca kegiatan dan assignment untuk matriks, detail tim, PDF, serta Excel.

### Bentuk workLink dan status

`assignments.work_link` adalah TEXT dengan tiga kemungkinan: naskah mentah, URL, atau JSON `MEDIA_SUBMISSION` berisi `files`, `subType`, caption, targetPlatform, dan editorNotes. Beberapa parser mengenali JSON dengan prefix string persis `{"type":"MEDIA_SUBMISSION"`; bentuk/key order yang berubah dapat memengaruhi pembacaan.

Workflow tampilan:

- PRAHUM: BELUM → LIPUTAN → MENULIS → REVISI → SIAP_TAYANG → SELESAI.
- FOTO_VIDEO: BELUM → LIPUTAN → REVISI → SIAP_TAYANG → SELESAI.
- DESAINER_EDITOR: BELUM → DESAIN → REVISI → SIAP_TAYANG → SELESAI.

Ini daftar tahapan UI, bukan state machine ketat di backend. Mapping store mengubah `COMPLETED` menjadi `SELESAI`, `ASSIGNED` menjadi `BELUM` atau status cache, dan `IN_PROGRESS` menjadi tahapan kerja. `updateStatus` hanya memetakan SELESAI/LIPUTAN secara khusus; nilai lain dikirim sebagai ASSIGNED. Approval lokal SIAP_TAYANG dikirim sebagai COMPLETED. Perubahan workflow harus dilacak pada controller, store, halaman review/petugas, halaman penugasan, dashboard, dan Bank Konten.

### Cache dan sinkronisasi

`petugas-store.ts` memakai key global `simikp_petugas_tasks_data`, event `simikp_tasks_sync_event`, dan event `storage`. Fetch assignment dilakukan saat hook terpasang/dependensinya berubah. Fungsi `refresh` membaca cache, bukan refetch server. Operasi tulis bersifat optimistis dan beberapa catch kosong menyembunyikan kegagalan backend. Cache tugas tidak dibersihkan oleh logout. Penyaringan kepemilikan tugas dilakukan di frontend; GET assignment backend mengembalikan semua slot/tugas.

## Database dan modul API

Schema aktif memiliki 18 tabel:

| Kelompok | Tabel |
|---|---|
| Akun | users, roles, user_roles, password_reset_tokens, notification_preferences |
| Master | content_types, opds, locations |
| Operasional | activities, activity_required_contents, assignments |
| Produksi | production_items, production_versions, production_files |
| Review/publikasi | reviews, publications |
| Sistem | notifications, audit_logs |

Relasi pusat: activities → assignments → production_items → production_versions → production_files/reviews/publications. `production_items.assignment_id` unik; pasangan item/version number unik. Assignment mereferensikan petugas, pembuat, dan jenis konten. Hapus kegiatan/assignment menghapus relasi produksi secara eksplisit dalam transaction; file fisik tidak ikut dihapus.

Ada 12 modul API: auth, activities, assignments, dashboard, master, productions, publications, reports, reviews, storage, system, users. Semua diregistrasikan di `backend/src/server.ts` dengan prefix `/api/v1`. `/healthz` hanya mengembalikan status/waktu, bukan pemeriksaan kesehatan database/storage.

Endpoint pendukung yang perlu dibedakan dari alur utama:

- `/productions/:assignmentId/submit` membuat versi baru untuk URL, berbeda dari submit assignment di UI petugas.
- POST `/productions` membuat assignment dengan `createdBy: "system"`, padahal field tersebut FK user.
- POST `/productions/bank-konten/upload` mencatat metadata saja dan memakai versi produksi pertama; UI Bank Konten saat ini hanya menampilkan pemberitahuan untuk mengunggah lewat produksi.
- POST `/reviews` memakai versi pertama di database. Review utama UI tidak melalui endpoint ini.
- POST `/publications` juga memakai versi pertama dan user pertama, bukan pilihan karya/user session yang eksplisit; judul kiriman frontend tidak disimpan sebagai judul publikasi tersendiri.
- `StorageService.ts` menyediakan abstraksi LocalPrivateStorage dan STORAGE_PATH, tetapi tidak digunakan oleh upload route aktif.

## Temuan penting untuk pekerjaan lanjutan

Temuan berikut berasal dari pembacaan statis; reproduksi runtime belum dilakukan.

| Area | Temuan dan dampak |
|---|---|
| Path upload | Route upload dan createPetugas menghitung path relatif menjadi `backend/src/storage/...` saat development dan `backend/dist/storage/...` setelah build. Server melayani `backend/storage/...`. Upload dapat berhasil tetapi preview/download tidak menemukan file. Satu JPEG yang ada memang berada di `backend/src/storage/uploads`. |
| Migrasi | Tersedia SQL 0000–0011, tetapi ADD kolom revision_notes, revision_author, revision_date, phone, dan bio tidak ditemukan. SQL 0009 langsung MODIFY revision_date. Snapshot 0007 memuat perubahan yang tidak lengkap di SQL 0007. DROP archive_assets juga perlu mempertimbangkan FK dari tabel arsip lama. Instalasi database kosong belum terbukti dapat menghasilkan schema aktif. |
| Password/session | Login sekarang memverifikasi scrypt dan JWT berlaku 7 hari. Legacy hash berawalan `$2a$`/`$2b$` masih menerima password demo melalui fallback. Login juga memiliki auto-provision akun ahli. `/auth/me` mengembalikan payload token, bukan profil terbaru dari database. |
| Authorization | Hook global memeriksa JWT, tetapi sebagian besar controller tidak membatasi role/ownership. Update profil menerima id/username target dari body. Beberapa controller membaca cookie sendiri sehingga Bearer saja tidak selalu cukup. |
| Kurasi | Bank Konten menambahkan fallback semua media dari assignment selesai. Berkas yang tidak dipilih saat kurasi dapat ikut tampil kembali. Approval biasa juga tersedia tanpa berkas dikirim. Kurasi belum merupakan satu transaction utuh. |
| Status dan output | Mapping status/nama konten tersebar. Master output dinamis memakai role_code, tetapi klaim/store memakai mapping nama hardcoded. Output baru atau rename belum otomatis mengikuti role_code. |
| Kalender/filter | Filter hari ini/besok/minggu di KegiatanPage memakai slice posisi array. Kalender petugas mem-parsing tanggal Indonesia, sementara store menghasilkan YYYY-MM-DD; fallback-nya hari 24 bulan kalender aktif. |
| Jadwal | Create assignment mengecek overlap; update dan klaim tidak memakai pemeriksaan konflik yang sama. Klaim mengecek slot dengan select lalu insert tanpa unique constraint pasangan activity/content type. |
| Profil | Username dan NIP dapat diedit di UI/cache tetapi tidak dipersistenkan oleh updateUser ke backend. Avatar memakai base64; /auth/me tidak mengembalikan avatar/phone/bio terbaru. |
| Hapus anggota | user_roles dihapus sebelum users tanpa transaction; FK dari penugasan/notifikasi/dll dapat menggagalkan delete user setelah role terhapus. |
| Laporan | Jumlah produksi dihitung dari seluruh assignment, tanpa filter selesai/disetujui. Content types default uppercase digabung dengan nama database secara case-sensitive; kolom semakna bisa terpisah. Preview tabel memiliki header petugas tetapi baris data tidak menyisipkan sel petugas. |
| Statistik | Beberapa penghitung selesai hanya mengenali COMPLETED, sementara modul lain juga memakai SIAP_TAYANG/SELESAI. Slot sintetis ikut dibaca sejumlah panel dashboard. |
| Notifications | Read/unread dibatasi pemilik user. Notifikasi browser dipoll Topbar 30 detik; email dikirim background tanpa antrean. Preferensi email dipakai oleh beberapa jenis email; reset/welcome/pembatalan tidak semuanya melewati pengecekan preferensi. |
| Default audit | Sebagian besar tanggal sudah CURRENT_TIMESTAMP, tetapi audit_logs schema masih `.default(new Date())`; SQL terakhir juga berisi timestamp tetap. Service logAudit biasanya mengisi waktu eksplisit. |

Masalah ini dicatat agar perubahan berikutnya tidak berangkat dari asumsi dokumen lama. Belum ada perbaikan otomatis dalam sesi pemahaman ini.

## UI, aset, dan berkas pendukung

- Komponen bersama: kalender, loading/empty/error; Button, Input, Select, Badge, Card, Table, Tabs, Dialog, Pagination, FileUploader, dan StatusBadge. `demo.tsx` merupakan demonstrasi StatusBadge, bukan route utama.
- Tema light/dark disimpan dalam `simikp-theme`; bahasa ID/EN dalam `simikp-lang`. Dictionary memiliki 525 entri per bahasa. Sebagian label masih ditulis langsung di halaman.
- Logo utama dipakai frontend dan lampiran email; favicon identik dengan logo utama. Watermark frontend/backend juga identik. JPEG upload berisi foto papan rangkaian elektronik.
- `ReviewPage_temp.tsx` adalah salinan lama di root dengan import relatif yang tidak valid di lokasinya, bukan halaman aktif. `review_page.diff` adalah patch lama berencoding UTF-16. Halaman aktif tetap `frontend/src/pages/produksi/ReviewPage.tsx`.
- `frontend/fix_*.py` adalah skrip perubahan kode lama berbasis string/regex; bukan kebutuhan menjalankan aplikasi. Sebagian masih mengacu mock API/tipe lama.
- `test.js`, `backend/test*`, dan `frontend/test_post.ts` adalah percobaan query/request, bukan test suite otomatis. test_post menulis user; clear_tokens menghapus token; drop.ts menjatuhkan tabel; seed.ts membersihkan data dan mengisi contoh. Semuanya hanya dibaca.
- Root `index.html` mengacu `/src/main.jsx` yang tidak ada; entry frontend aktif adalah `frontend/index.html`. File HTML aktif masih menampilkan error global ke DOM untuk debugging.
- `frontend/.vite/deps` adalah cache library pihak ketiga; keberadaannya tidak berarti dependency telah terpasang. Tidak ada folder node_modules dalam inventaris.

## Acuan perubahan berikutnya

| Permintaan fitur | Titik perubahan utama |
|---|---|
| Kegiatan/lokasi/output | KegiatanPage + activities controller + master controller + schema activities/master |
| Penugasan/klaim/jadwal | PenugasanPage + PetugasAgendaTersediaPage + assignments controller |
| Status/revisi/hasil kerja | petugas-store + constants + PetugasPenugasanPage + ReviewPage + assignments/productions controller |
| Upload/preview/Bank Konten | storage.routes + server.ts + productions controller + dua halaman Bank Konten |
| Login/role/akun | auth.routes + password.service + users controller + AuthContext + router/RoleRoute/Sidebar |
| Notifikasi | notifications service + system/users controller + mail.service + Topbar + PengaturanPage |
| Laporan | reports.service/routes + reports-api + LaporanPage |
| Tampilan bersama | components, layouts, index.css, ThemeContext, LanguageContext, Tailwind |

Saat melanjutkan, gunakan kode aktual dan catatan ini sebagai titik awal, periksa perubahan sejak commit acuan, lalu uji bagian yang terdampak. Status database aktual, data pengguna, SMTP, deployment VPS, serta keberhasilan build masih perlu diverifikasi pada lingkungan yang tersedia.

# Audit penggunaan tabel dan kolom database SIMIKP

Tanggal pemeriksaan: 19 September 2026  
Database: `defaultdb` pada Aiven  
Metode: query read-only ke `information_schema`, hitung baris/null, pemeriksaan foreign key/orphan, lalu pencocokan dengan schema Drizzle, controller backend, route API, dan pemakaian frontend. Tidak ada data yang diubah atau dihapus.

## Kesimpulan

Database memiliki 21 tabel: 18 tabel aplikasi aktif, 1 tabel internal migrasi Drizzle, dan 2 tabel legacy. Kandidat paling aman untuk dihapus setelah backup adalah `productions` dan `production_reviews`. Keduanya kosong, tidak ada di schema Drizzle aktif, dan tidak dipakai route/controller; perintah seed hanya mencoba membersihkannya sebagai peninggalan lama.

Ada tiga kolom yang juga merupakan kandidat kuat untuk dihapus setelah migrasi terkontrol: `content_types.jabatan_code`, `users.religion`, dan `users.education`. Ketiganya kosong pada seluruh record dan tidak digunakan oleh alur aplikasi. Jangan menghapus tabel/kolom lain hanya karena saat ini kosong; beberapa memang disiapkan dan dipanggil kode.

## Status setiap tabel

| Tabel | Baris saat audit | Status | Penjelasan |
|---|---:|---|---|
| `__drizzle_migrations` | 13 | Wajib dipertahankan | Riwayat migrasi Drizzle. Bukan tabel bisnis dan tidak boleh dihapus manual. |
| `activities` | 4 | Aktif | Sumber agenda/kegiatan, dashboard, penugasan, dan laporan. |
| `activity_required_contents` | 16 | Aktif | Relasi kebutuhan output per kegiatan dan sumber slot penugasan kosong. |
| `assignments` | 9 | Aktif inti | Penugasan, klaim, status workflow, naskah/media, dan revisi. |
| `audit_logs` | 409 | Aktif, write-oriented | Diisi oleh `logAudit`; belum ada UI pembaca log. Berguna untuk audit keamanan, tetapi integritas waktunya perlu diperbaiki. |
| `content_types` | 4 | Aktif | Master jenis output dan pemetaan `role_code`. |
| `locations` | 21 | Aktif | Lokasi kegiatan dan rincian wilayah/alamat. |
| `notification_preferences` | 2 | Aktif | Preferensi email, browser, dan suara per pengguna. |
| `notifications` | 20 | Aktif | Notifikasi in-app dan status dibaca. |
| `opds` | 4 | Aktif | Master OPD kegiatan dan statistik dashboard. |
| `password_reset_tokens` | 0 | Aktif walaupun kosong | Dibutuhkan alur lupa/reset password; kosong adalah keadaan normal bila tidak ada reset berjalan. |
| `production_files` | 10 | Aktif | Metadata file terkurasi untuk Bank Konten. |
| `production_items` | 6 | Aktif | Penghubung satu assignment dengan objek produksi. |
| `production_versions` | 6 | Aktif | Versi produksi dan parent `production_files`, `reviews`, serta `publications`. |
| `productions` | 0 | **Legacy, kandidat DROP** | Model produksi lama. Tidak ada di schema aktif dan tidak digunakan kode aplikasi. |
| `production_reviews` | 0 | **Legacy, kandidat DROP** | Model review lama. Sistem aktif memakai tabel `reviews`. |
| `publications` | 8 | Aktif | Pencatatan kanal, URL, status, dan tanggal publikasi. |
| `reviews` | 6 | Dipakai sebagian | Dipakai endpoint review, seed, relasi, dan penghapusan. UI review utama lebih banyak menyimpan revisi/status di `assignments`, sehingga terjadi tumpang tindih desain. Jangan dihapus sebelum alur review disatukan. |
| `roles` | 3 | Aktif | Master role akun. |
| `user_roles` | 7 | Aktif | Relasi user-role untuk login dan pemilihan reviewer/petugas. |
| `users` | 7 | Aktif inti | Akun, profil, bidang petugas, autentikasi, dan relasi seluruh workflow. |

## Kolom yang tidak digunakan

| Kolom | Isi aktual | Bukti penggunaan | Rekomendasi |
|---|---|---|---|
| `content_types.jabatan_code` | 0 dari 4 record terisi | Tidak ada dalam schema Drizzle aktif. Frontend/backend memakai `role_code`. | Hapus melalui migration setelah backup. |
| `users.religion` | 0 dari 7 record terisi | Hanya didefinisikan di schema/migration; form, controller, profil, dan laporan tidak membaca/menulisnya. | Hapus bila data agama memang bukan kebutuhan resmi. Ini juga mengurangi data pribadi sensitif yang tidak diperlukan. |
| `users.education` | 0 dari 7 record terisi | Hanya didefinisikan di schema/migration; tidak ada alur aplikasi yang memakai. | Hapus bila riwayat pendidikan bukan kebutuhan resmi. |

Schema TypeScript harus diubah dalam migration yang sama ketika kolom `users.religion` dan `users.education` dihapus. `jabatan_code` sudah tidak ada di schema aktif, sehingga database justru perlu diselaraskan dengan schema.

## Kolom kosong yang masih berguna atau dipanggil kode

Kolom berikut kosong saat audit tetapi **belum boleh dianggap tidak berguna**:

| Kolom | Alasan dipertahankan saat ini |
|---|---|
| `activities.description` | Dibaca service laporan. Form/requirement dapat memakainya walau empat kegiatan saat ini kosong. |
| `activities.start_time`, `activities.end_time` | Model waktu baru. Data sekarang masih bergantung pada `activity_time`; controller dan UI memakai keduanya. |
| `assignments.deadline` | Dibuat/dibaca controller, daftar tugas, produksi, dan laporan. Data aktual kosong karena UI sering memakai tanggal kegiatan sebagai fallback. |
| `locations.lat`, `locations.lng` | Form/controller menerima dan menyimpan koordinat. Hapus hanya bila fitur peta dipastikan tidak akan digunakan. |
| `users.phone`, `users.bio` | Aktif di halaman profil/pengaturan dan endpoint update profile. |
| `users.pas_foto_url` | Aktif pada registrasi dan daftar anggota; saat ini belum ada foto yang berhasil tercatat. |
| `production_items.production_date` | Ditulis oleh alur produksi/approval tertentu. |
| `production_versions.work_link` | Digunakan jalur submit versi produksi alternatif; jalur utama saat ini lebih banyak memakai `assignments.work_link`. |
| `password_reset_tokens.*` | Tabel sementara; kosong setelah token tidak pernah dibuat atau sudah dibersihkan. |

## Kolom yang fungsinya tumpang tindih atau belum optimal

- `activities.activity_time` berisi pada seluruh kegiatan dan masih menjadi fallback, sedangkan `start_time`/`end_time` seluruhnya kosong. Pilih satu representasi waktu setelah data dimigrasikan; belum aman menghapus `activity_time` sekarang.
- `assignments.work_link` adalah penyimpanan utama naskah/JSON media, sedangkan `production_versions.work_link` seluruhnya kosong. Dua sumber ini sebaiknya disatukan dalam desain versi produksi, tetapi perubahan membutuhkan migrasi workflow.
- Revisi utama tersimpan di `assignments.revision_notes`, `revision_author`, dan `revision_date`, sementara tabel `reviews` menyimpan review versi produksi. Tentukan satu sumber kebenaran sebelum merampingkan tabel.
- `production_files.file_extension` ditulis dari nama file tetapi belum ditemukan sebagai kebutuhan pembacaan khusus; ekstensi juga dapat berasal dari `stored_filename`/MIME. Kolom ini kandidat optimasi rendah, bukan kandidat hapus langsung.
- `users.birth_place` dan `users.birth_date` ditulis saat registrasi tetapi tidak dikembalikan oleh daftar/profil saat ini. Ini data pribadi yang saat ini write-only; tampilkan dan kelola secara benar atau hentikan pengumpulannya.
- `audit_logs` tidak memiliki halaman/endpoint pembaca. Tabelnya tetap berguna untuk keamanan, tetapi perlu retention policy dan akses admin khusus.

## Masalah integritas data yang ditemukan

Foreign key enforcement pada koneksi bernilai aktif, tetapi database telah memiliki record yatim, kemungkinan tercipta ketika skrip seed menonaktifkan `FOREIGN_KEY_CHECKS`:

| Relasi yatim | Jumlah |
|---|---:|
| `production_files.production_version_id` → `production_versions.id` | 1 |
| `production_files.uploaded_by` → `users.id` | 1 |
| `reviews.production_version_id` → `production_versions.id` | 6 dari 6 review |
| `reviews.reviewer_id` → `users.id` | 6 dari 6 review |
| `publications.production_version_id` → `production_versions.id` | 6 dari 8 publikasi |
| `publications.recorded_by` → `users.id` | 6 dari 8 publikasi |
| `notifications.user_id` → `users.id` | 9 dari 20 notifikasi |
| `audit_logs.actor_user_id` → `users.id` | 101 record |

Relasi kegiatan, kebutuhan output, assignment, production item/version, preferensi, dan user-role tidak memiliki orphan. Tidak ada pasangan assignment `activity_id + content_type_id` yang duplikat saat audit.

Record yatim tidak boleh langsung dihapus tanpa menentukan apakah merupakan data demo atau data yang harus dipulihkan. Khusus audit log, actor yang sudah dihapus dapat sengaja dipertahankan, tetapi FK dan kebijakan penghapusan user harus didesain sesuai kebutuhan tersebut.

## Masalah struktur tambahan

- `audit_logs.created_at` memiliki default waktu tetap `2026-09-05 08:48:50`, bukan `CURRENT_TIMESTAMP`. Service biasanya mengisi waktu sendiri, tetapi default database tetap salah.
- Database memiliki kolom revision/profile yang tidak tersedia sebagai operasi `ADD COLUMN` pada rangkaian SQL migration repository. Database live dan migration dari kosong tidak dapat dianggap identik.
- Skrip seed menonaktifkan foreign key secara global pada koneksinya dan tidak membersihkan semua tabel secara konsisten. Ini menjelaskan kemungkinan orphan dan berbahaya bila dijalankan lagi.
- Tabel legacy tidak memiliki foreign key yang menghubungkannya ke model aktif.

## Tindakan aman yang disarankan

1. Buat backup dan uji restore sebelum perubahan schema/data.
2. Rotasi kredensial database yang telah terekspos sebelum pekerjaan lanjutan.
3. Buat migration untuk membuang `productions`, `production_reviews`, dan `content_types.jabatan_code`; jangan menjalankan DROP manual.
4. Putuskan kebutuhan bisnis `religion` dan `education`, lalu hapus dari schema dan database bila tidak diperlukan.
5. Klasifikasikan orphan sebagai data demo atau data riil. Pulihkan parent yang benar atau hapus child dalam transaction.
6. Perbaiki seed agar hanya berjalan di database development, membersihkan seluruh tabel dalam urutan aman, dan tidak meninggalkan orphan.
7. Ubah default `audit_logs.created_at` menjadi `CURRENT_TIMESTAMP`.
8. Tambahkan test migrasi database kosong dan pemeriksaan orphan otomatis sebelum deployment.


// Data dummy untuk mengisi UI selama endpoint backend (Dev 1-5) belum tersedia.
// Ganti pemakaian file ini dengan panggilan lib/api-client.ts begitu endpoint asli siap.

export const Role = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  REVIEWER: "reviewer",
  PETUGAS: "petugas",
} as const;

export interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: (typeof Role)[keyof typeof Role];
  avatar: string;
  // Hanya diisi untuk role PETUGAS — menentukan alur kerja & tugas lapangan mana yang terlihat.
  bidang?: string;
}

export const mockUsers: MockUser[] = [
  { id: "u1", name: "Admin Utama", email: "admin@simikp.com", password: "admin123", role: Role.ADMIN, avatar: "AU" },
  { id: "u2", name: "Budi Santoso", email: "budi@simikp.com", password: "budi123", role: Role.MANAGER, avatar: "BS" },
  { id: "u3", name: "Siti Rahayu", email: "siti@simikp.com", password: "siti123", role: Role.STAFF, avatar: "SR" },
  { id: "u4", name: "Dewi Lestari", email: "dewi@simikp.com", password: "dewi123", role: Role.REVIEWER, avatar: "DL" },
  // Akun petugas lapangan — email berdomain @petugas.simikp.com, terpisah dari akun manajemen di atas,
  // supaya login bisa membedakan tujuan redirect (dashboard petugas vs dashboard manajemen).
  { id: "u5", name: "Rizky Fadillah", email: "rizky@petugas.simikp.com", password: "petugas123", role: Role.PETUGAS, avatar: "RF", bidang: "PRAHUM" },
  { id: "u6", name: "Dinda Amelia", email: "dinda@petugas.simikp.com", password: "petugas123", role: Role.PETUGAS, avatar: "DA", bidang: "FOTO_VIDEO" },
  { id: "u7", name: "Fajar Nugroho", email: "fajar@petugas.simikp.com", password: "petugas123", role: Role.PETUGAS, avatar: "FN", bidang: "DESAINER_EDITOR" },
];

// Alur status per bidang kerja petugas lapangan — dipakai di halaman Penugasan Saya.
export const WORKFLOWS: Record<string, string[]> = {
  PRAHUM: ["BELUM", "LIPUTAN", "MENULIS", "SIAP_TAYANG", "SELESAI"],
  FOTO_VIDEO: ["BELUM", "LIPUTAN", "SIAP_TAYANG", "SELESAI"],
  DESAINER_EDITOR: ["BELUM", "DESAIN", "REVISI", "SIAP_TAYANG", "SELESAI"],
};

export interface MockTugasPetugas {
  id: string;
  kegiatan: string;
  lokasi: string;
  jenisPekerjaan: string;
  deadline: string;
  bidang: string;
  status: string;
  instruksi: string;
  hasConflict?: boolean;
  conflictMessage?: string;
}

export const mockTugasPetugas: MockTugasPetugas[] = [
  {
    id: "t1",
    kegiatan: "Liputan Peresmian Taman Kota Kec. Selatan",
    lokasi: "Taman Kota Kec. Selatan",
    jenisPekerjaan: "Penulisan Rilis & Berita",
    deadline: "2026-08-20 15:00",
    bidang: "PRAHUM",
    status: "LIPUTAN",
    instruksi: "Fokus pada wawancara Walikota dan dampaknya bagi UMKM lokal.",
    hasConflict: true,
    conflictMessage: "Budi sudah memiliki jadwal kegiatan lain pada pukul 09.00–11.00 WIB.",
  },
  {
    id: "t2",
    kegiatan: "Dokumentasi Foto Peresmian Taman Kota",
    lokasi: "Taman Kota Kec. Selatan",
    jenisPekerjaan: "Dokumentasi Foto & Media",
    deadline: "2026-08-20 17:00",
    bidang: "FOTO_VIDEO",
    status: "BELUM",
    instruksi: "Ambil minimal 20 foto high-resolution untuk kebutuhan liputan media.",
  },
  {
    id: "t3",
    kegiatan: "Desain Banner Media Sosial HUT Kota",
    lokasi: "Kantor SIMIKP",
    jenisPekerjaan: "Desain Grafis / Feeds Instagram",
    deadline: "2026-08-22 12:00",
    bidang: "DESAINER_EDITOR",
    status: "DESAIN",
    instruksi: "Gunakan palet warna resmi Pemkot dan sertakan logo OPD terbaru.",
  },
];

export interface MockKegiatan {
  id: string;
  title: string;
  status: "active" | "review" | "done" | "pending";
  progress: number;
  deadline: string;
  prioritas: "Tinggi" | "Sedang" | "Rendah";
  lokasi?: string;
  opdPenyelenggara?: string;
  outputDibutuhkan?: string[];
}

// Warna & label status dipusatkan di sini supaya Beranda dan Manajemen Kegiatan
// (kalender, badge, chip filter) selalu tampil konsisten — satu sumber kebenaran,
// bukan didefinisikan ulang di tiap halaman.
export const KEGIATAN_STATUS_COLORS: Record<MockKegiatan["status"], string> = {
  active: "#22c55e",
  review: "#f59e0b",
  done: "#9ca3af",
  pending: "#3b82f6",
};

export const KEGIATAN_STATUS_LABELS: Record<MockKegiatan["status"], string> = {
  active: "Aktif",
  review: "Review",
  done: "Selesai",
  pending: "Pending",
};

// Sengaja dibuat padat mengisi hampir satu bulan penuh (Agustus 2026 — bulan
// berjalan) supaya kalender kegiatan (dipakai bareng oleh Beranda & Manajemen
// Kegiatan) bisa dilihat dalam kondisi ramai/realistis, bukan cuma beberapa
// data contoh. Kegiatan sebelum "hari ini" (24 Agu) berstatus done/review,
// kegiatan setelahnya active/pending — meniru alur kerja nyata.
export const mockKegiatan: MockKegiatan[] = [
  { id: "k1", title: "Upacara Bendera Hari Senin", status: "done", progress: 100, deadline: "2026-08-03", prioritas: "Rendah", lokasi: "Halaman Balaikota", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Foto"] },
  { id: "k2", title: "Rapat Koordinasi Mingguan OPD", status: "done", progress: 100, deadline: "2026-08-04", prioritas: "Sedang", lokasi: "Ruang Rapat Balaikota", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Naskah Berita"] },
  { id: "k3", title: "Sosialisasi Vaksinasi Anak Sekolah", status: "done", progress: 100, deadline: "2026-08-05", prioritas: "Tinggi", lokasi: "SDN 1 Batu", opdPenyelenggara: "Dinas Kesehatan", outputDibutuhkan: ["Foto", "Video"] },
  { id: "k4", title: "Rapat Persiapan Tahun Ajaran Baru", status: "done", progress: 100, deadline: "2026-08-05", prioritas: "Sedang", lokasi: "Aula Dinas Pendidikan", opdPenyelenggara: "Dinas Pendidikan", outputDibutuhkan: ["Naskah Berita"] },
  { id: "k5", title: "Bimbingan Teknis SIMIKP untuk Petugas Lapangan", status: "done", progress: 100, deadline: "2026-08-06", prioritas: "Sedang", lokasi: "Kantor Diskominfo", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Foto"] },
  { id: "k6", title: "Konferensi Pers Mingguan Wali Kota", status: "done", progress: 100, deadline: "2026-08-07", prioritas: "Tinggi", lokasi: "Media Center Balaikota", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Naskah Berita", "Video"] },
  { id: "k7", title: "Jalan Sehat Keluarga Sehat", status: "done", progress: 100, deadline: "2026-08-08", prioritas: "Rendah", lokasi: "Alun-Alun Kota Batu", opdPenyelenggara: "Dinas Kesehatan", outputDibutuhkan: ["Foto", "Reels"] },
  { id: "k8", title: "Upacara Bendera Hari Senin", status: "done", progress: 100, deadline: "2026-08-10", prioritas: "Rendah", lokasi: "Halaman Balaikota", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Foto"] },
  { id: "k9", title: "Kunjungan Kerja ke Puskesmas Junrejo", status: "done", progress: 100, deadline: "2026-08-11", prioritas: "Sedang", lokasi: "Puskesmas Junrejo", opdPenyelenggara: "Dinas Kesehatan", outputDibutuhkan: ["Foto", "Naskah Berita"] },
  { id: "k10", title: "Lomba Cerdas Cermat Antar Sekolah", status: "done", progress: 100, deadline: "2026-08-12", prioritas: "Sedang", lokasi: "GOR Ganesha", opdPenyelenggara: "Dinas Pendidikan", outputDibutuhkan: ["Foto", "Video"] },
  { id: "k11", title: "Pelatihan Videografi Konten Media Sosial", status: "review", progress: 90, deadline: "2026-08-13", prioritas: "Rendah", lokasi: "Studio Diskominfo", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Video"] },
  { id: "k12", title: "Penyuluhan Gizi Balita", status: "review", progress: 85, deadline: "2026-08-13", prioritas: "Rendah", lokasi: "Posyandu Melati", opdPenyelenggara: "Dinas Kesehatan", outputDibutuhkan: ["Foto"] },
  { id: "k13", title: "Rapat Evaluasi Program Kesehatan Semester", status: "review", progress: 90, deadline: "2026-08-14", prioritas: "Sedang", lokasi: "Kantor Dinas Kesehatan", opdPenyelenggara: "Dinas Kesehatan", outputDibutuhkan: ["Naskah Berita"] },
  { id: "k14", title: "Gladi Bersih Upacara HUT Kemerdekaan RI", status: "review", progress: 95, deadline: "2026-08-15", prioritas: "Tinggi", lokasi: "Alun-Alun Kota Batu", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Foto", "Video"] },
  { id: "k15", title: "Upacara HUT Kemerdekaan RI ke-81", status: "review", progress: 95, deadline: "2026-08-17", prioritas: "Tinggi", lokasi: "Alun-Alun Kota Batu", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Foto", "Video", "Naskah Berita", "Reels"] },
  { id: "k16", title: "Karnaval Budaya HUT Kota Batu", status: "active", progress: 40, deadline: "2026-08-18", prioritas: "Tinggi", lokasi: "Jalan Diponegoro", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Foto", "Video", "Reels"] },
  { id: "k17", title: "Pameran UMKM dan Produk Sekolah", status: "active", progress: 35, deadline: "2026-08-19", prioritas: "Sedang", lokasi: "GOR Ganesha", opdPenyelenggara: "Dinas Pendidikan", outputDibutuhkan: ["Foto", "Naskah Berita"] },
  { id: "k18", title: "Media Gathering bersama Wartawan", status: "active", progress: 30, deadline: "2026-08-20", prioritas: "Sedang", lokasi: "Hotel Aston", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Naskah Berita", "Foto"] },
  { id: "k19", title: "Vaksinasi Booster Lansia", status: "active", progress: 25, deadline: "2026-08-20", prioritas: "Rendah", lokasi: "Balai RW 05", opdPenyelenggara: "Dinas Kesehatan", outputDibutuhkan: ["Foto"] },
  { id: "k20", title: "Audiensi Wali Kota dengan Komunitas Difabel", status: "active", progress: 20, deadline: "2026-08-21", prioritas: "Sedang", lokasi: "Ruang Audiensi Balaikota", opdPenyelenggara: "Dinas Kesehatan", outputDibutuhkan: ["Foto", "Naskah Berita"] },
  { id: "k21", title: "Festival Anak Sehat", status: "active", progress: 15, deadline: "2026-08-22", prioritas: "Rendah", lokasi: "Taman Kota", opdPenyelenggara: "Dinas Kesehatan", outputDibutuhkan: ["Foto", "Reels"] },
  { id: "k22", title: "Rapat Koordinasi Lintas OPD Persiapan MTQ", status: "active", progress: 10, deadline: "2026-08-24", prioritas: "Tinggi", lokasi: "Ruang Rapat Balaikota", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Naskah Berita"] },
  { id: "k23", title: "Sosialisasi Kurikulum Merdeka", status: "pending", progress: 0, deadline: "2026-08-24", prioritas: "Sedang", lokasi: "Aula Dinas Pendidikan", opdPenyelenggara: "Dinas Pendidikan", outputDibutuhkan: ["Naskah Berita", "Foto"] },
  { id: "k24", title: "Talkshow Radio Pemkot: Layanan Publik Digital", status: "pending", progress: 0, deadline: "2026-08-25", prioritas: "Rendah", lokasi: "Studio RRI Batu", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Naskah Berita"] },
  { id: "k25", title: "Sosialisasi Bahaya Narkoba di Sekolah", status: "pending", progress: 0, deadline: "2026-08-26", prioritas: "Sedang", lokasi: "SMPN 2 Batu", opdPenyelenggara: "Dinas Pendidikan", outputDibutuhkan: ["Foto", "Naskah Berita"] },
  { id: "k26", title: "Rapat Anggaran Perubahan OPD", status: "pending", progress: 0, deadline: "2026-08-27", prioritas: "Tinggi", lokasi: "Ruang Rapat Balaikota", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Naskah Berita"] },
  { id: "k27", title: "Pelatihan Jurnalistik Warga", status: "pending", progress: 0, deadline: "2026-08-28", prioritas: "Rendah", lokasi: "Balaikota", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Foto", "Video"] },
  { id: "k28", title: "Donor Darah Massal", status: "pending", progress: 0, deadline: "2026-08-29", prioritas: "Sedang", lokasi: "GOR Ganesha", opdPenyelenggara: "Dinas Kesehatan", outputDibutuhkan: ["Foto", "Reels"] },
  { id: "k29", title: "Upacara Bendera Hari Senin", status: "pending", progress: 0, deadline: "2026-08-31", prioritas: "Rendah", lokasi: "Halaman Balaikota", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Foto"] },
  { id: "k30", title: "Rapat Evaluasi Akhir Bulan", status: "pending", progress: 0, deadline: "2026-09-02", prioritas: "Sedang", lokasi: "Ruang Rapat Balaikota", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Naskah Berita"] },
  { id: "k31", title: "Peluncuran Aplikasi Layanan Publik", status: "pending", progress: 0, deadline: "2026-09-10", prioritas: "Tinggi", lokasi: "Balaikota", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Foto", "Video", "Naskah Berita"] },
];

export interface MockPenugasan {
  id: string;
  kegiatanTerkait: string;
  tanggalKegiatan?: string;
  jenisKonten: string;
  pic: string;
  picAvatar?: string;
  jamMulai: string;
  jamSelesai: string;
  waktuSubtitle?: string;
  status: "in-progress" | "done" | "pending" | "conflict";
  hasConflict?: boolean;
  conflictMessage?: string;
  lokasi?: string;
  deadline?: string;
  catatan?: string;
}

export const mockPenugasan: MockPenugasan[] = [
  {
    id: "p1",
    kegiatanTerkait: "Rapat Koordinasi Lintas OPD Persiapan MTQ",
    tanggalKegiatan: "Senin, 24 Agustus 2026",
    jenisKonten: "Foto",
    pic: "Budi Fotografer",
    picAvatar: "BF",
    jamMulai: "08:00",
    jamSelesai: "10:00",
    waktuSubtitle: "(Senin, 24/8)",
    status: "in-progress",
    hasConflict: false,
    lokasi: "Ruang Rapat Balaikota",
    deadline: "2026-08-24 12:00",
    catatan: "Dokumentasi rapat koordinasi dan kehadiran seluruh pimpinan OPD.",
  },
  {
    id: "p2",
    kegiatanTerkait: "Talkshow Radio Pemkot: Layanan Publik Digital",
    tanggalKegiatan: "Selasa, 25 Agustus 2026",
    jenisKonten: "Naskah Berita",
    pic: "Andi Prahum",
    picAvatar: "AP",
    jamMulai: "10:00",
    jamSelesai: "12:00",
    waktuSubtitle: "(Selasa, 25/8)",
    status: "done",
    hasConflict: false,
    lokasi: "Studio RRI Batu",
    deadline: "2026-08-25 15:00",
    catatan: "Penulisan rilis berita lengkap untuk publikasi portal Pemkot.",
  },
  {
    id: "p3",
    kegiatanTerkait: "Sosialisasi Bahaya Narkoba di Sekolah",
    tanggalKegiatan: "Rabu, 26 Agustus 2026",
    jenisKonten: "Flyer/Infografis",
    pic: "Citra Desainer",
    picAvatar: "CD",
    jamMulai: "13:00",
    jamSelesai: "15:00",
    waktuSubtitle: "(Rabu, 26/8)",
    status: "pending",
    hasConflict: false,
    lokasi: "SMPN 2 Batu",
    deadline: "2026-08-26 17:00",
    catatan: "Pembuatan materi flyer edukasi bahaya narkoba bagi pelajar.",
  },
  {
    id: "p4",
    kegiatanTerkait: "Sosialisasi Kurikulum Merdeka",
    tanggalKegiatan: "Senin, 24 Agustus 2026",
    jenisKonten: "Review Konten",
    pic: "Budi Fotografer",
    picAvatar: "BF",
    jamMulai: "09:30",
    jamSelesai: "10:30",
    waktuSubtitle: "(Senin, 24/8)",
    status: "conflict",
    hasConflict: true,
    conflictMessage: "Budi Fotografer sudah memiliki jadwal di 'Rapat Koordinasi Lintas OPD Persiapan MTQ' (08:00 - 10:00). Terjadi bentrok jadwal selama 30 menit.",
    lokasi: "Aula Dinas Pendidikan",
    deadline: "2026-08-24 11:30",
    catatan: "Evaluasi capaian materi dan dokumentasi kurikulum merdeka.",
  },
  {
    id: "p5",
    kegiatanTerkait: "Rapat Anggaran Perubahan OPD",
    tanggalKegiatan: "Kamis, 27 Agustus 2026",
    jenisKonten: "Video Liputan",
    pic: "Dinda Amelia",
    picAvatar: "DA",
    jamMulai: "09:00",
    jamSelesai: "11:30",
    waktuSubtitle: "(Kamis, 27/8)",
    status: "in-progress",
    hasConflict: false,
    lokasi: "Ruang Rapat Balaikota",
    deadline: "2026-08-27 16:00",
    catatan: "Pengambilan footage testimoni pimpinan dan doorstop kepala dinas.",
  },
  {
    id: "p6",
    kegiatanTerkait: "Pelatihan Jurnalistik Warga",
    tanggalKegiatan: "Jumat, 28 Agustus 2026",
    jenisKonten: "Reels / TikTok",
    pic: "Fajar Nugroho",
    picAvatar: "FN",
    jamMulai: "14:00",
    jamSelesai: "16:30",
    waktuSubtitle: "(Jumat, 28/8)",
    status: "pending",
    hasConflict: false,
    lokasi: "Balaikota",
    deadline: "2026-08-28 18:00",
    catatan: "Pembuatan video format vertikal 9:16 untuk media sosial resmi.",
  },
];

export interface MockProduksi {
  id: string;
  kegiatan: string;
  bidangPekerjaan: string;
  workLink?: string;
  startDate: string;
  endDate: string;
  status: "BELUM" | "LIPUTAN" | "DESAIN" | "REVISI" | "SIAP_TAYANG" | "SELESAI";
}

export const mockProduksi: MockProduksi[] = [
  { id: "pr1", kegiatan: "Liputan Peresmian Taman Kota", bidangPekerjaan: "PRAHUM", workLink: "https://drive.google.com/xyz", startDate: "2026-08-01", endDate: "2026-08-31", status: "LIPUTAN" },
  { id: "pr2", kegiatan: "Video Profil Daerah", bidangPekerjaan: "FOTO_VIDEO", workLink: "https://drive.google.com/abc", startDate: "2026-07-01", endDate: "2026-07-30", status: "SELESAI" },
  { id: "pr3", kegiatan: "Infografis APBD", bidangPekerjaan: "DESAINER_EDITOR", startDate: "2026-08-15", endDate: "2026-09-15", status: "REVISI" },
];

export interface MockReview {
  id: string;
  content: string;
  reviewer: string;
  status: "approved" | "revision" | "pending";
  submittedAt: string;
  feedback: string;
}

export const mockReview: MockReview[] = [
  { id: "r1", content: "Artikel SEO", reviewer: "Dewi Lestari", status: "approved", submittedAt: "2026-08-28", feedback: "Bagus, hanya perbaiki meta deskripsi." },
  { id: "r2", content: "Desain Landing Page", reviewer: "Budi Santoso", status: "revision", submittedAt: "2026-08-27", feedback: "Perbaiki heading dan CTA." },
  { id: "r3", content: "Dokumentasi API", reviewer: "Admin Utama", status: "pending", submittedAt: "2026-08-29", feedback: "" },
];

export interface MockPublikasi {
  id: string;
  title: string;
  channel: string;
  status: "published" | "scheduled" | "draft";
  publishDate: string | null;
  views: number;
  link?: string;
}

export const mockPublikasi: MockPublikasi[] = [
  { id: "pu1", title: "Blog: Panduan React", channel: "Website", status: "published", publishDate: "2026-08-25", views: 1250, link: "https://batu.go.id/1" },
  { id: "pu2", title: "Infografis: Tren 2026", channel: "Instagram", status: "scheduled", publishDate: "2026-09-05", views: 0 },
  { id: "pu3", title: "Video: Tailwind CSS", channel: "YouTube", status: "draft", publishDate: null, views: 0 },
];

// Bank Konten: satu "folder" = satu kegiatan, isinya file hasil produksi
// kegiatan itu. Satu kegiatan bisa berisi campuran foto & video sekaligus —
// jenis konten itu sifat per FILE, bukan per folder. Nanti diisi dari data
// penugasan/produksi asli, bukan diinput manual — bentuknya sudah disusun
// begitu supaya gampang disambung.
export interface MockBankKontenFile {
  id: string;
  name: string;
  jenisKonten: "foto" | "video";
  size?: string;
  thumbnailUrl?: string;
}

export interface MockBankKontenFolder {
  id: string;
  title: string;
  tanggal: string;
  petugas: string;
  kategori?: string;
  strakomNumber?: string;
  thumbnailUrl?: string;
  files: MockBankKontenFile[];
}

const filesOf = (prefix: string, ext: string, jenisKonten: "foto" | "video", count: number, thumbBase?: string): MockBankKontenFile[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${jenisKonten}-f${i + 1}`,
    name: `${prefix} Dokumentasi ${i + 1}.${ext}`,
    jenisKonten,
    size: jenisKonten === "video" ? `${(15 + (i * 7.5)).toFixed(1)} MB` : `${(2.1 + (i * 0.8)).toFixed(1)} MB`,
    thumbnailUrl: thumbBase,
  }));

export const mockBankKontenFolders: MockBankKontenFolder[] = [
  {
    id: "bk1",
    title: "Upacara Detik-Detik Proklamasi HUT ke-81 RI",
    tanggal: "2026-08-17",
    petugas: "Rizky F.",
    kategori: "SOSIAL",
    strakomNumber: "STR/0817/2026",
    thumbnailUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&auto=format&fit=crop&q=80",
    files: [
      ...filesOf("Video_HUT81", "mp4", "video", 4, "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&auto=format&fit=crop&q=80"),
      ...filesOf("Foto_Upacara", "jpg", "foto", 6, "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&auto=format&fit=crop&q=80"),
    ],
  },
  {
    id: "bk2",
    title: "Peresmian Jembatan & Akses Wisata Kota Batu",
    tanggal: "2026-08-20",
    petugas: "Dinda A.",
    kategori: "EKONOMI",
    strakomNumber: "STR/0820/2026",
    thumbnailUrl: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&auto=format&fit=crop&q=80",
    files: [
      ...filesOf("Foto_Peresmian", "jpg", "foto", 8, "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400&auto=format&fit=crop&q=80"),
      ...filesOf("Video_Liputan", "mp4", "video", 2, "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400&auto=format&fit=crop&q=80"),
    ],
  },
  {
    id: "bk3",
    title: "Rapat Koordinasi Penanganan Inflasi Daerah",
    tanggal: "2026-08-15",
    petugas: "Andi Prahum",
    kategori: "EKONOMI",
    strakomNumber: "STR/0815/2026",
    thumbnailUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&auto=format&fit=crop&q=80",
    files: filesOf("Foto_Rakor", "jpg", "foto", 5, "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&auto=format&fit=crop&q=80"),
  },
  {
    id: "bk4",
    title: "Pameran Inovasi Lingkungan Hidup & Daur Ulang",
    tanggal: "2026-08-22",
    petugas: "Budi Fotografer",
    kategori: "LINGKUNGAN",
    strakomNumber: "STR/0822/2026",
    thumbnailUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80",
    files: [
      ...filesOf("Foto_Pameran", "jpg", "foto", 9, "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80"),
      ...filesOf("Video_Inovasi", "mp4", "video", 3, "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80"),
    ],
  },
  {
    id: "bk5",
    title: "Festival Wisata & Kuliner Nusantara 2026",
    tanggal: "2026-08-10",
    petugas: "Citra Desainer",
    kategori: "EKONOMI",
    strakomNumber: "STR/0810/2026",
    thumbnailUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
    files: [
      ...filesOf("Video_Festival", "mp4", "video", 5, "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&auto=format&fit=crop&q=80"),
      ...filesOf("Foto_Kuliner", "jpg", "foto", 12, "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&auto=format&fit=crop&q=80"),
    ],
  },
  {
    id: "bk6",
    title: "Evaluasi SPBE & Pelayanan Digital Kominfo",
    tanggal: "2026-08-24",
    petugas: "Dinda A.",
    kategori: "SOSIAL",
    strakomNumber: "STR/0824/2026",
    thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
    files: [
      ...filesOf("Foto_SPBE", "jpg", "foto", 4, "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80"),
      ...filesOf("Video_Presentasi", "mp4", "video", 1, "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80"),
    ],
  },
];



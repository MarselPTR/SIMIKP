// Data dummy untuk mengisi UI selama endpoint backend (Dev 1-5) belum tersedia.
// Ganti pemakaian file ini dengan panggilan lib/api-client.ts begitu endpoint asli siap.

export const Role = {
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
  workLink?: string;
  prioritas?: "Tinggi" | "Sedang" | "Rendah";
  waktuPelaksanaan?: string;
}

export const mockTugasPetugas: MockTugasPetugas[] = [
  // PRAHUM
  {
    id: "t1",
    kegiatan: "Liputan Peresmian Taman Kota Kec. Selatan",
    lokasi: "Taman Kota Kec. Selatan",
    jenisPekerjaan: "Penulisan Rilis & Berita",
    deadline: "2026-08-24 15:00",
    bidang: "PRAHUM",
    status: "LIPUTAN",
    prioritas: "Tinggi",
    waktuPelaksanaan: "09:00 - 12:00 WIB",
    instruksi: "Fokus pada wawancara Walikota dan dampak revitalisasi bagi UMKM lokal serta warga sekitar.",
    hasConflict: true,
    conflictMessage: "Jadwal beririsan dengan Kegiatan Liputan Rapat Paripurna DPRD pada pukul 09.30–11.00 WIB.",
  },
  {
    id: "t2",
    kegiatan: "Penyusunan Rilis Sosialisasi Kebijakan Pajak Daerah",
    lokasi: "Balaikota Among Tani",
    jenisPekerjaan: "Penulisan Berita & Transkrip",
    deadline: "2026-08-25 16:00",
    bidang: "PRAHUM",
    status: "MENULIS",
    prioritas: "Sedang",
    waktuPelaksanaan: "13:00 - 15:30 WIB",
    instruksi: "Rangkum 5 poin utama insentif pajak daerah untuk disiarkan di portal resmi Pemkot.",
  },
  {
    id: "t3",
    kegiatan: "Liputan Kunjungan Kerja Delegasi Pariwisata",
    lokasi: "Kawasan Agrowisata Bumiaji",
    jenisPekerjaan: "Press Release & Live Tweeting",
    deadline: "2026-08-23 18:00",
    bidang: "PRAHUM",
    status: "SIAP_TAYANG",
    prioritas: "Sedang",
    waktuPelaksanaan: "08:00 - 12:00 WIB",
    instruksi: "Naskah telah dikompilasi, menunggu final approval pimpinan sebelum publikasi.",
    workLink: "https://docs.google.com/document/d/1example-release-prahum",
  },
  {
    id: "t4",
    kegiatan: "Siaran Pers Pembukaan Festival Kuliner Kota Batu",
    lokasi: "Stadion Gelora Brantas",
    jenisPekerjaan: "Press Release Resmi",
    deadline: "2026-08-19 14:00",
    bidang: "PRAHUM",
    status: "SELESAI",
    prioritas: "Tinggi",
    waktuPelaksanaan: "10:00 - 13:00 WIB",
    instruksi: "Rilis berita sudah terbit di portal berita daerah dan media mitra Kominfo.",
    workLink: "https://drive.google.com/drive/folders/1prahum-selesai-doc",
  },
  {
    id: "t5",
    kegiatan: "Konferensi Pers Pengendalian Inflasi Daerah (TPID)",
    lokasi: "Ruang Rapat Utama Pemkot",
    jenisPekerjaan: "Penulisan Naskah Pidato & Rilis",
    deadline: "2026-08-27 11:00",
    bidang: "PRAHUM",
    status: "BELUM",
    prioritas: "Sedang",
    waktuPelaksanaan: "09:00 - 11:00 WIB",
    instruksi: "Siapkan daftar pertanyaan wartawan dan draft sambutan Kepala Diskominfo.",
  },

  // FOTO_VIDEO
  {
    id: "t6",
    kegiatan: "Dokumentasi Foto & Video Peresmian Taman Kota",
    lokasi: "Taman Kota Kec. Selatan",
    jenisPekerjaan: "Dokumentasi Foto & Media Video",
    deadline: "2026-08-24 17:00",
    bidang: "FOTO_VIDEO",
    status: "LIPUTAN",
    prioritas: "Tinggi",
    waktuPelaksanaan: "09:00 - 12:00 WIB",
    instruksi: "Ambil minimal 30 foto resolusi tinggi dan video reel 60 detik aspek 9:16 untuk Instagram.",
  },
  {
    id: "t7",
    kegiatan: "Produksi Video Profil Desa Wisata Bumiaji",
    lokasi: "Kecamatan Bumiaji",
    jenisPekerjaan: "Video Dokumenter Singkat (4K)",
    deadline: "2026-08-26 15:00",
    bidang: "FOTO_VIDEO",
    status: "SIAP_TAYANG",
    prioritas: "Tinggi",
    waktuPelaksanaan: "07:00 - 14:00 WIB",
    instruksi: "Color grading selesai, audio mix stereo telah disesuaikan dengan standar YouTube.",
    workLink: "https://drive.google.com/file/d/1video-profil-wisata",
  },
  {
    id: "t8",
    kegiatan: "Dokumentasi Upacara Peringatan Hari Jadi Kota",
    lokasi: "Balaikota Among Tani",
    jenisPekerjaan: "Foto Arsip & Highlight Reel",
    deadline: "2026-08-17 12:00",
    bidang: "FOTO_VIDEO",
    status: "SELESAI",
    prioritas: "Tinggi",
    waktuPelaksanaan: "07:30 - 10:30 WIB",
    instruksi: "Seluruh 85 foto telah diunggah ke Bank Konten dan diverifikasi.",
    workLink: "https://drive.google.com/drive/folders/1foto-upacara-kota-batu",
  },
  {
    id: "t9",
    kegiatan: "Stok Footage Drone Landmark & Kawasan Bunga",
    lokasi: "Selecta & Sidomulyo",
    jenisPekerjaan: "Aerial Drone Footage",
    deadline: "2026-08-28 10:00",
    bidang: "FOTO_VIDEO",
    status: "BELUM",
    prioritas: "Rendah",
    waktuPelaksanaan: "06:30 - 09:30 WIB",
    instruksi: "Pastikan izin terbang di area Selecta sudah dikoordinasikan dengan pengelola.",
  },

  // DESAINER_EDITOR
  {
    id: "t10",
    kegiatan: "Desain Banner Media Sosial HUT Kota Batu",
    lokasi: "Kantor Diskominfo",
    jenisPekerjaan: "Desain Grafis / Carousel Instagram",
    deadline: "2026-08-25 12:00",
    bidang: "DESAINER_EDITOR",
    status: "DESAIN",
    prioritas: "Tinggi",
    waktuPelaksanaan: "08:30 - 16:00 WIB",
    instruksi: "Gunakan palet warna resmi Pemkot Batu dan sertakan logo OPD terbaru serta elemen batik khas.",
  },
  {
    id: "t11",
    kegiatan: "Infografis Transparansi APBD Triwulan II",
    lokasi: "Kantor Diskominfo",
    jenisPekerjaan: "Infografis Statis & PDF Publikasi",
    deadline: "2026-08-24 16:00",
    bidang: "DESAINER_EDITOR",
    status: "REVISI",
    prioritas: "Tinggi",
    waktuPelaksanaan: "09:00 - 15:00 WIB",
    instruksi: "Catatan Revisi Reviewer: Sesuaikan diagram lingkaran pada sektor pendidikan dan kesehatan agar lebih kontras.",
  },
  {
    id: "t12",
    kegiatan: "Motion Graphic Bumper Layanan Siaga 112",
    lokasi: "Studio Produksi SIMIKP",
    jenisPekerjaan: "Animasi Motion Graphics 10 Detik",
    deadline: "2026-08-23 17:00",
    bidang: "DESAINER_EDITOR",
    status: "SIAP_TAYANG",
    prioritas: "Sedang",
    waktuPelaksanaan: "10:00 - 16:00 WIB",
    instruksi: "File render .MOV ProRes dan .MP4 H.264 sudah siap untuk ditayangkan di videotron.",
    workLink: "https://drive.google.com/drive/folders/1bumper-112-motion",
  },
  {
    id: "t13",
    kegiatan: "E-Flyer Sosialisasi Vaksinasi dan Pola Hidup Sehat",
    lokasi: "Kantor Diskominfo",
    jenisPekerjaan: "Digital Flyer & Poster Cetak A3",
    deadline: "2026-08-18 15:00",
    bidang: "DESAINER_EDITOR",
    status: "SELESAI",
    prioritas: "Sedang",
    waktuPelaksanaan: "09:00 - 14:00 WIB",
    instruksi: "File siap cetak telah dikirim ke bagian umum dan diterbitkan di medsos.",
    workLink: "https://drive.google.com/drive/folders/1flyer-kesehatan-selesai",
  },
  {
    id: "t14",
    kegiatan: "Template Story Instagram Agenda Mingguan Walikota",
    lokasi: "Kantor Diskominfo",
    jenisPekerjaan: "Template Figma / Photoshop",
    deadline: "2026-08-29 14:00",
    bidang: "DESAINER_EDITOR",
    status: "BELUM",
    prioritas: "Sedang",
    waktuPelaksanaan: "13:00 - 17:00 WIB",
    instruksi: "Buat 3 variasi layout minimalis dengan elemen font Outfit atau Inter.",
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

export const mockKegiatan: MockKegiatan[] = [
  { id: "k1", title: "Pembuatan Konten SEO", status: "active", progress: 75, deadline: "2026-09-15", prioritas: "Tinggi", lokasi: "Kantor Pemkot", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Berita", "Foto"] },
  { id: "k2", title: "Desain UI/UX Dashboard", status: "review", progress: 90, deadline: "2026-08-30", prioritas: "Sedang", lokasi: "Lab Komputer", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Reels", "Flyer"] },
  { id: "k3", title: "Pengembangan API Gateway", status: "done", progress: 100, deadline: "2026-08-20", prioritas: "Tinggi", lokasi: "Ruang Server", opdPenyelenggara: "Dinas Pendidikan", outputDibutuhkan: ["Foto"] },
  { id: "k4", title: "Testing Aplikasi Mobile", status: "active", progress: 45, deadline: "2026-09-25", prioritas: "Rendah", lokasi: "Lapangan", opdPenyelenggara: "Dinas Kesehatan", outputDibutuhkan: ["Berita", "Reels"] },
  { id: "k5", title: "Dokumentasi Proyek", status: "pending", progress: 20, deadline: "2026-10-01", prioritas: "Sedang", lokasi: "Hotel Aston", opdPenyelenggara: "Diskominfo", outputDibutuhkan: ["Foto", "Video"] },
  { id: "k6", title: "Optimasi Database", status: "active", progress: 60, deadline: "2026-09-10", prioritas: "Tinggi", lokasi: "Balaikota", opdPenyelenggara: "Dispendik", outputDibutuhkan: ["Berita"] },
];

export interface MockPenugasan {
  id: string;
  kegiatanTerkait: string;
  jenisKonten: string;
  pic: string;
  jamMulai: string;
  jamSelesai: string;
  status: "in-progress" | "done" | "pending";
}

export const mockPenugasan: MockPenugasan[] = [
  { id: "p1", kegiatanTerkait: "Upacara Hari Jadi Kota", jenisKonten: "Foto", pic: "Budi Fotografer", jamMulai: "08:00", jamSelesai: "10:00", status: "in-progress" },
  { id: "p2", kegiatanTerkait: "Peresmian Taman Kota", jenisKonten: "Naskah Berita", pic: "Andi Prahum", jamMulai: "10:00", jamSelesai: "12:00", status: "done" },
  { id: "p3", kegiatanTerkait: "Rapat Koordinasi", jenisKonten: "Flyer/Infografis", pic: "Citra Desainer", jamMulai: "13:00", jamSelesai: "15:00", status: "pending" },
  { id: "p4", kegiatanTerkait: "Sosialisasi Pajak", jenisKonten: "Video", pic: "Budi Fotografer", jamMulai: "09:00", jamSelesai: "11:00", status: "in-progress" },
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
}

export interface MockBankKontenFolder {
  id: string;
  title: string;
  tanggal: string;
  petugas: string;
  files: MockBankKontenFile[];
}

const filesOf = (prefix: string, ext: string, jenisKonten: "foto" | "video", count: number): MockBankKontenFile[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${jenisKonten}-f${i + 1}`,
    name: `${prefix} ${i + 1}.${ext}`,
    jenisKonten,
  }));

export const mockBankKontenFolders: MockBankKontenFolder[] = [
  {
    id: "bk1",
    title: "Upacara Agustusan",
    tanggal: "2026-08-17",
    petugas: "Rizky F.",
    files: [...filesOf("Video", "mp4", "video", 4), ...filesOf("Foto", "jpg", "foto", 3)],
  },
  {
    id: "bk2",
    title: "Peresmian Jembatan",
    tanggal: "2026-08-20",
    petugas: "Dinda A.",
    files: [...filesOf("Foto", "jpg", "foto", 6), ...filesOf("Video", "mp4", "video", 2)],
  },
  {
    id: "bk3",
    title: "Rapat Koordinasi",
    tanggal: "2026-08-15",
    petugas: "Rizky F.",
    files: filesOf("Foto", "jpg", "foto", 5),
  },
];

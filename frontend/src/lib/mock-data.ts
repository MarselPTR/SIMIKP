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
  assignee: string;
  priority: "high" | "medium" | "low";
}

export const mockKegiatan: MockKegiatan[] = [
  { id: "k1", title: "Pembuatan Konten SEO", status: "active", progress: 75, deadline: "2026-09-15", assignee: "Budi Santoso", priority: "high" },
  { id: "k2", title: "Desain UI/UX Dashboard", status: "review", progress: 90, deadline: "2026-08-30", assignee: "Siti Rahayu", priority: "medium" },
  { id: "k3", title: "Pengembangan API Gateway", status: "done", progress: 100, deadline: "2026-08-20", assignee: "Admin Utama", priority: "high" },
  { id: "k4", title: "Testing Aplikasi Mobile", status: "active", progress: 45, deadline: "2026-09-25", assignee: "Dewi Lestari", priority: "low" },
  { id: "k5", title: "Dokumentasi Proyek", status: "pending", progress: 20, deadline: "2026-10-01", assignee: "Budi Santoso", priority: "medium" },
  { id: "k6", title: "Optimasi Database", status: "active", progress: 60, deadline: "2026-09-10", assignee: "Admin Utama", priority: "high" },
];

export interface MockPenugasan {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: "in-progress" | "done" | "pending";
}

export const mockPenugasan: MockPenugasan[] = [
  { id: "p1", title: "Menyusun Laporan Bulanan", assignedTo: "Budi Santoso", dueDate: "2026-09-05", status: "in-progress" },
  { id: "p2", title: "Review Desain Mockup", assignedTo: "Siti Rahayu", dueDate: "2026-09-02", status: "done" },
  { id: "p3", title: "Implementasi Modul Auth", assignedTo: "Admin Utama", dueDate: "2026-09-10", status: "pending" },
  { id: "p4", title: "Uji Coba Produksi", assignedTo: "Dewi Lestari", dueDate: "2026-09-08", status: "in-progress" },
];

export interface MockProduksi {
  id: string;
  name: string;
  qty: number;
  unit: string;
  status: "running" | "completed";
  startDate: string;
  endDate: string;
}

export const mockProduksi: MockProduksi[] = [
  { id: "pr1", name: "Artikel Blog Bulanan", qty: 45, unit: "artikel", status: "running", startDate: "2026-08-01", endDate: "2026-08-31" },
  { id: "pr2", name: "Video Tutorial", qty: 12, unit: "video", status: "completed", startDate: "2026-07-01", endDate: "2026-07-30" },
  { id: "pr3", name: "Infografis Sosial Media", qty: 8, unit: "unit", status: "running", startDate: "2026-08-15", endDate: "2026-09-15" },
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
  platform: string;
  status: "published" | "scheduled" | "draft";
  publishDate: string | null;
  views: number;
}

export const mockPublikasi: MockPublikasi[] = [
  { id: "pu1", title: "Blog: Panduan React", platform: "Website", status: "published", publishDate: "2026-08-25", views: 1250 },
  { id: "pu2", title: "Infografis: Tren 2026", platform: "Instagram", status: "scheduled", publishDate: "2026-09-05", views: 0 },
  { id: "pu3", title: "Video: Tailwind CSS", platform: "YouTube", status: "draft", publishDate: null, views: 0 },
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

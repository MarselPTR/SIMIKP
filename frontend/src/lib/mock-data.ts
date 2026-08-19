// Data dummy untuk mengisi UI selama endpoint backend (Dev 1-5) belum tersedia.
// Ganti pemakaian file ini dengan panggilan lib/api-client.ts begitu endpoint asli siap.

export const Role = {
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  REVIEWER: "reviewer",
} as const;

export interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: (typeof Role)[keyof typeof Role];
  avatar: string;
}

export const mockUsers: MockUser[] = [
  { id: "u1", name: "Admin Utama", email: "admin@simikp.com", password: "admin123", role: Role.ADMIN, avatar: "AU" },
  { id: "u2", name: "Budi Santoso", email: "budi@simikp.com", password: "budi123", role: Role.MANAGER, avatar: "BS" },
  { id: "u3", name: "Siti Rahayu", email: "siti@simikp.com", password: "siti123", role: Role.STAFF, avatar: "SR" },
  { id: "u4", name: "Dewi Lestari", email: "dewi@simikp.com", password: "dewi123", role: Role.REVIEWER, avatar: "DL" },
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

export interface MockBankKonten {
  id: string;
  title: string;
  type: "template" | "image" | "video" | "document";
  category: string;
  tags: string[];
  createdAt: string;
}

export const mockBankKonten: MockBankKonten[] = [
  { id: "b1", title: "Template Email Promo", type: "template", category: "email", tags: ["promo", "email"], createdAt: "2026-08-10" },
  { id: "b2", title: "Foto Produk Terbaru", type: "image", category: "product", tags: ["foto", "produk"], createdAt: "2026-08-15" },
  { id: "b3", title: "Video Animasi Intro", type: "video", category: "branding", tags: ["animasi", "intro"], createdAt: "2026-08-20" },
  { id: "b4", title: "Dokumen Panduan", type: "document", category: "guide", tags: ["panduan", "dokumen"], createdAt: "2026-08-22" },
];

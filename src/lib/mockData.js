// ============================================================
// CONSTANTS / ROLES
// ============================================================
export const Role = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  REVIEWER: 'reviewer',
};

// ============================================================
// MOCK DATA
// ============================================================
export const mockUsers = [
  { id: 'u1', name: 'Admin Utama',   email: 'admin@simikp.com', password: 'admin123', role: Role.ADMIN,    avatar: 'AU' },
  { id: 'u2', name: 'Budi Santoso',  email: 'budi@simikp.com',  password: 'budi123',  role: Role.MANAGER,  avatar: 'BS' },
  { id: 'u3', name: 'Siti Rahayu',   email: 'siti@simikp.com',  password: 'siti123',  role: Role.STAFF,    avatar: 'SR' },
  { id: 'u4', name: 'Dewi Lestari',  email: 'dewi@simikp.com',  password: 'dewi123',  role: Role.REVIEWER, avatar: 'DL' },
];

export const mockKegiatan = [
  { id: 'k1', title: 'Pembuatan Konten SEO',        status: 'active',  progress: 75,  deadline: '2026-09-15', assignee: 'Budi Santoso',  priority: 'high' },
  { id: 'k2', title: 'Desain UI/UX Dashboard',      status: 'review',  progress: 90,  deadline: '2026-08-30', assignee: 'Siti Rahayu',   priority: 'medium' },
  { id: 'k3', title: 'Pengembangan API Gateway',    status: 'done',    progress: 100, deadline: '2026-08-20', assignee: 'Admin Utama',   priority: 'high' },
  { id: 'k4', title: 'Testing Aplikasi Mobile',     status: 'active',  progress: 45,  deadline: '2026-09-25', assignee: 'Dewi Lestari',  priority: 'low' },
  { id: 'k5', title: 'Dokumentasi Proyek',          status: 'pending', progress: 20,  deadline: '2026-10-01', assignee: 'Budi Santoso',  priority: 'medium' },
  { id: 'k6', title: 'Optimasi Database',           status: 'active',  progress: 60,  deadline: '2026-09-10', assignee: 'Admin Utama',   priority: 'high' },
];

export const mockPenugasan = [
  { id: 'p1', title: 'Menyusun Laporan Bulanan',  assignedTo: 'Budi Santoso',  dueDate: '2026-09-05', status: 'in-progress' },
  { id: 'p2', title: 'Review Desain Mockup',      assignedTo: 'Siti Rahayu',   dueDate: '2026-09-02', status: 'done' },
  { id: 'p3', title: 'Implementasi Auth JWT',      assignedTo: 'Admin Utama',   dueDate: '2026-09-10', status: 'pending' },
  { id: 'p4', title: 'Uji Coba Produksi',         assignedTo: 'Dewi Lestari',  dueDate: '2026-09-08', status: 'in-progress' },
];

export const mockProduksi = [
  { id: 'pr1', name: 'Artikel Blog Bulanan',     qty: 45, unit: 'artikel', status: 'running',    startDate: '2026-08-01', endDate: '2026-08-31' },
  { id: 'pr2', name: 'Video Tutorial',           qty: 12, unit: 'video',   status: 'completed',  startDate: '2026-07-01', endDate: '2026-07-30' },
  { id: 'pr3', name: 'Infografis Sosial Media',  qty: 8,  unit: 'unit',    status: 'running',    startDate: '2026-08-15', endDate: '2026-09-15' },
];

export const mockReview = [
  { id: 'r1', content: 'Artikel SEO',         reviewer: 'Dewi Lestari', status: 'approved',  submittedAt: '2026-08-28', feedback: 'Bagus, hanya perbaiki meta deskripsi.' },
  { id: 'r2', content: 'Desain Landing Page', reviewer: 'Budi Santoso', status: 'revision',  submittedAt: '2026-08-27', feedback: 'Perbaiki heading dan CTA.' },
  { id: 'r3', content: 'Dokumentasi API',     reviewer: 'Admin Utama',  status: 'pending',   submittedAt: '2026-08-29', feedback: '' },
];

export const mockPublikasi = [
  { id: 'pu1', title: 'Blog: Panduan React',    platform: 'Website',   status: 'published', publishDate: '2026-08-25', views: 1250 },
  { id: 'pu2', title: 'Infografis: Tren 2026',  platform: 'Instagram', status: 'scheduled', publishDate: '2026-09-05', views: 0 },
  { id: 'pu3', title: 'Video: Tailwind CSS',    platform: 'YouTube',   status: 'draft',     publishDate: null,         views: 0 },
];

export const mockBankKonten = [
  { id: 'b1', title: 'Template Email Promo',   type: 'template',  category: 'email',   tags: ['promo', 'email'],     createdAt: '2026-08-10' },
  { id: 'b2', title: 'Foto Produk Terbaru',    type: 'image',     category: 'product', tags: ['foto', 'produk'],     createdAt: '2026-08-15' },
  { id: 'b3', title: 'Video Animasi Intro',    type: 'video',     category: 'branding',tags: ['animasi', 'intro'],   createdAt: '2026-08-20' },
  { id: 'b4', title: 'Dokumen Panduan',        type: 'document',  category: 'guide',   tags: ['panduan', 'dokumen'], createdAt: '2026-08-22' },
];

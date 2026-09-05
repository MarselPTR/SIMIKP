// Data dummy untuk mengisi UI selama endpoint backend (Dev 1-5) belum tersedia.
// Ganti pemakaian file ini dengan panggilan lib/api-client.ts begitu endpoint asli siap.

export const Role = {
  SUPER_ADMIN: "super_admin",
  AHLI_PERTAMA: "ahli_pertama",
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
  {
    id: "mock-ahli-pertama-01",
    name: "Bambang S., S.Kom",
    email: "ahli@kominfo.batukota.go.id",
    password: "admin",
    role: Role.AHLI_PERTAMA,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    bidang: "AHLI_PERTAMA",
  },
];

// Alur status per bidang kerja petugas lapangan — dipakai di halaman Penugasan Saya.
export const WORKFLOWS: Record<string, string[]> = {
  PRAHUM: ["BELUM", "LIPUTAN", "MENULIS", "SIAP_TAYANG", "SELESAI"],
  DESAINER_EDITOR: ["BELUM", "DESAIN", "REVISI", "SIAP_TAYANG", "SELESAI"],
  FOTO_VIDEO: ["BELUM", "LIPUTAN", "SIAP_TAYANG", "SELESAI"],
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



export interface MockPenugasan {
  id: string;
  activityId?: string;
  kegiatanTerkait: string;
  tanggalKegiatan?: string;
  jenisKonten: string;
  pic: string;
  picAvatar?: string;
  jamMulai: string;
  jamSelesai: string;
  waktuSubtitle?: string;
  status: "in-progress" | "done" | "pending" | "conflict" | "unassigned";
  hasConflict?: boolean;
  conflictMessage?: string;
  lokasi?: string;
  deadline?: string;
  catatan?: string;
}



export interface MockProduksi {
  id: string;
  kegiatan: string;
  bidangPekerjaan: string;
  workLink?: string;
  startDate: string;
  endDate: string;
  status: "BELUM" | "LIPUTAN" | "DESAIN" | "REVISI" | "SIAP_TAYANG" | "SELESAI";
}



export interface MockReview {
  id: string;
  content: string;
  reviewer: string;
  status: "approved" | "revision" | "pending";
  submittedAt: string;
  feedback: string;
}



export interface MockPublikasi {
  id: string;
  title: string;
  channel: string;
  status: "published" | "scheduled" | "draft";
  publishDate: string | null;
  views: number;
  link?: string;
}



export interface MockBankKontenFile {
  id: string;
  name: string;
  jenisKonten: "foto" | "video";
  size?: string;
  thumbnailUrl?: string;
  workLink?: string;
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





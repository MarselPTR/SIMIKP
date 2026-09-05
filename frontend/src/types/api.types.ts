export const Role = {
  SUPER_ADMIN: "super_admin",
  AHLI_PERTAMA: "ahli_pertama",
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  REVIEWER: "reviewer",
  PETUGAS: "petugas",
} as const;

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: (typeof Role)[keyof typeof Role];
  avatar?: string;
  bidang?: string;
}

export interface ApiTugasPetugas {
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

export interface ApiKegiatan {
  id: string;
  title: string;
  status: "active" | "review" | "done" | "pending";
  progress: number;
  deadline: string;
  prioritas: "Tinggi" | "Sedang" | "Rendah";
  lokasi?: string;
  opdPenyelenggara?: string;
  outputDibutuhkan?: string[];
  activityTime?: string;
}

export interface ApiPenugasan {
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
  revisionNotes?: string;
}

export interface ApiProduksi {
  id: string;
  kegiatan: string;
  bidangPekerjaan: string;
  workLink?: string;
  picName?: string;
  startDate: string;
  endDate: string;
  status: "BELUM" | "LIPUTAN" | "DESAIN" | "REVISI" | "SIAP_TAYANG" | "SELESAI";
}

export interface ApiReview {
  id: string;
  content: string;
  reviewer: string;
  status: "approved" | "revision" | "pending";
  submittedAt: string;
  feedback: string;
}

export interface ApiPublikasi {
  id: string;
  title: string;
  channel: string;
  status: "published" | "scheduled" | "draft";
  publishDate: string | null;
  views: number;
  link?: string;
}

export interface ApiBankKontenFile {
  id: string;
  name: string;
  jenisKonten: "foto" | "video";
  size?: string;
  thumbnailUrl?: string;
  workLink?: string;
}

export interface ApiBankKontenFolder {
  id: string;
  title: string;
  tanggal: string;
  petugas: string;
  kategori?: string;
  strakomNumber?: string;
  thumbnailUrl?: string;
  files: ApiBankKontenFile[];
}

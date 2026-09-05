import type { ApiKegiatan } from "../types/api.types";

export const KEGIATAN_STATUS_COLORS: Record<ApiKegiatan["status"], string> = {
  active: "#22c55e",
  review: "#f59e0b",
  done: "#9ca3af",
  pending: "#3b82f6",
};

export const KEGIATAN_STATUS_LABELS: Record<ApiKegiatan["status"], string> = {
  active: "Aktif",
  review: "Review",
  done: "Selesai",
  pending: "Pending",
};

export const WORKFLOWS: Record<string, string[]> = {
  PRAHUM: ["BELUM", "LIPUTAN", "MENULIS", "REVISI", "SIAP_TAYANG", "SELESAI"],
  DESAINER_EDITOR: ["BELUM", "DESAIN", "REVISI", "SIAP_TAYANG", "SELESAI"],
  FOTO_VIDEO: ["BELUM", "LIPUTAN", "REVISI", "SIAP_TAYANG", "SELESAI"],
};

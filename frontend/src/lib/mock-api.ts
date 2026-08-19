// API dummy berbasis mock-data.ts, dipakai sampai endpoint backend asli (Dev 1-5) siap.
// Setiap modul di sini punya bentuk yang sama dengan yang nantinya dipanggil lewat
// api-client.ts — tinggal ganti implementasinya begitu endpoint tersedia.

import {
  mockUsers,
  mockKegiatan,
  mockPenugasan,
  mockProduksi,
  mockReview,
  mockPublikasi,
  mockBankKonten,
} from "./mock-data";

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  kegiatan: {
    getAll: async () => {
      await delay(500);
      return mockKegiatan;
    },
  },

  penugasan: {
    getAll: async () => {
      await delay(500);
      return mockPenugasan;
    },
  },

  produksi: {
    getAll: async () => {
      await delay(500);
      return mockProduksi;
    },
  },

  review: {
    getAll: async () => {
      await delay(500);
      return mockReview;
    },
  },

  publikasi: {
    getAll: async () => {
      await delay(500);
      return mockPublikasi;
    },
  },

  bankKonten: {
    getAll: async () => {
      await delay(500);
      return mockBankKonten;
    },
  },

  dashboard: {
    getStats: async () => {
      await delay(600);
      return {
        totalKegiatan: mockKegiatan.length,
        aktifKegiatan: mockKegiatan.filter((k) => k.status === "active").length,
        totalPenugasan: mockPenugasan.length,
        produksiRunning: mockProduksi.filter((p) => p.status === "running").length,
        reviewPending: mockReview.filter((r) => r.status === "pending").length,
        publikasiPublished: mockPublikasi.filter((p) => p.status === "published").length,
      };
    },
  },
};

// Login mock terpisah dari mockApi di atas — dipakai lib/AuthContext.tsx.
// Tidak mengembalikan token: arsitektur asli pakai session cookie (server-side),
// bukan token yang disimpan di client. Lihat AuthContext.tsx untuk detail.
export const mockAuthLogin = async (email: string, password: string) => {
  await delay(800);
  const user = mockUsers.find((u) => u.email === email);
  if (!user) throw new Error("Email tidak ditemukan");
  if (user.password !== password) throw new Error("Password salah");
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

import {
  mockUsers,
  mockKegiatan,
  mockPenugasan,
  mockProduksi,
  mockReview,
  mockPublikasi,
  mockBankKonten,
} from './mockData';

// Simulate network delay
const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  auth: {
    login: async (email, password) => {
      await delay(800);
      const user = mockUsers.find((u) => u.email === email);
      if (!user) throw new Error('Email tidak ditemukan');
      if (user.password !== password) throw new Error('Password salah');
      return { user, token: 'mock-jwt-token-' + Date.now() };
    },
    getCurrentUser: async () => {
      await delay(400);
      return mockUsers[0];
    },
  },

  kegiatan: {
    getAll: async () => {
      await delay(500);
      return mockKegiatan;
    },
    getStats: async () => {
      await delay(300);
      const total  = mockKegiatan.length;
      const active = mockKegiatan.filter((k) => k.status === 'active').length;
      const done   = mockKegiatan.filter((k) => k.status === 'done').length;
      const review = mockKegiatan.filter((k) => k.status === 'review').length;
      return { total, active, done, review };
    },
  },

  penugasan: {
    getAll: async () => { await delay(500); return mockPenugasan; },
  },

  produksi: {
    getAll: async () => { await delay(500); return mockProduksi; },
  },

  review: {
    getAll: async () => { await delay(500); return mockReview; },
  },

  publikasi: {
    getAll: async () => { await delay(500); return mockPublikasi; },
  },

  bankKonten: {
    getAll: async () => { await delay(500); return mockBankKonten; },
  },

  dashboard: {
    getStats: async () => {
      await delay(600);
      return {
        totalKegiatan:      mockKegiatan.length,
        aktifKegiatan:      mockKegiatan.filter((k) => k.status === 'active').length,
        totalPenugasan:     mockPenugasan.length,
        produksiRunning:    mockProduksi.filter((p) => p.status === 'running').length,
        reviewPending:      mockReview.filter((r) => r.status === 'pending').length,
        publikasiPublished: mockPublikasi.filter((p) => p.status === 'published').length,
      };
    },
  },
};

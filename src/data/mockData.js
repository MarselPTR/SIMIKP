export const WORKFLOWS = {
  PRAHUM: ['BELUM', 'LIPUTAN', 'MENULIS', 'SIAP_TAYANG', 'SELESAI'],
  FOTO_VIDEO: ['BELUM', 'LIPUTAN', 'SIAP_TAYANG', 'SELESAI'],
  DESAINER_EDITOR: ['BELUM', 'DESAIN', 'REVISI', 'SIAP_TAYANG', 'SELESAI']
};

export const INITIAL_TASKS = [
  {
    id: 1,
    kegiatan: 'Liputan Peresmian Taman Kota Kec. Selatan',
    lokasi: 'Taman Kota Kec. Selatan',
    jenisPekerjaan: 'Penulisan Rilis & Berita',
    deadline: '2026-08-20 15:00',
    bidang: 'PRAHUM',
    status: 'LIPUTAN',
    instruksi: 'Fokus pada wawancara Walikota dan dampaknya bagi UMKM lokal.',
    hasConflict: true,
    conflictMessage: 'Budi sudah memiliki jadwal kegiatan lain pada pukul 09.00–11.00 WIB.'
  },
  {
    id: 2,
    kegiatan: 'Dokumentasi Foto Peresmian Taman Kota',
    lokasi: 'Taman Kota Kec. Selatan',
    jenisPekerjaan: 'Dokumentasi Foto & Media',
    deadline: '2026-08-20 17:00',
    bidang: 'FOTO_VIDEO',
    status: 'BELUM',
    instruksi: 'Ambil minimal 20 foto high-resolution untuk kebutuhan liputan media.',
    hasConflict: false
  },
  {
    id: 3,
    kegiatan: 'Desain Banner Media Sosial HUT Kota',
    lokasi: 'Kantor SIMIKP',
    jenisPekerjaan: 'Desain Grafis / Feeds Instagram',
    deadline: '2026-08-22 12:00',
    bidang: 'DESAINER_EDITOR',
    status: 'DESAIN',
    instruksi: 'Gunakan palet warna resmi Pemkot dan sertakan logo OPD terbaru.',
    hasConflict: false
  }
];
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "./api-client";

export interface PetugasTaskItem {
  id: string;
  kegiatan: string;
  lokasi: string;
  jenisPekerjaan: string;
  deadline: string;
  bidang: string;
  status: string;
  instruksi: string;
  kategori: "upacara" | "rapat" | "peresmian" | "sidang";
  hasConflict?: boolean;
  conflictMessage?: string;
  workLink?: string;
  revisionNotes?: string;
  revisionAuthor?: string;
  revisionDate?: string;
}

export const INITIAL_PETUGAS_TASKS: PetugasTaskItem[] = [
  {
    id: "t1",
    kegiatan: "Liputan Peresmian Taman Kota Kec. Selatan",
    lokasi: "Taman Kota Kec. Selatan",
    jenisPekerjaan: "Penulisan Rilis & Berita",
    deadline: "24 Agustus 2026 15:00",
    bidang: "PRAHUM",
    status: "LIPUTAN",
    kategori: "peresmian",
    instruksi: "Fokus pada wawancara Walikota dan dampaknya bagi UMKM lokal sekitar taman.",
    hasConflict: true,
    conflictMessage: "Budi sudah memiliki jadwal kegiatan lain pada pukul 09.00–11.00 WIB.",
  },
  {
    id: "t2",
    kegiatan: "Rapat Koordinasi Publikasi OPD & Media Massa",
    lokasi: "Studio Media SIMIKP",
    jenisPekerjaan: "Press Release & Live Tweeting",
    deadline: "25 Agustus 2026 16:00",
    bidang: "PRAHUM",
    status: "MENULIS",
    kategori: "rapat",
    instruksi: "Rangkum 5 poin kesepakatan media relations untuk tayang di portal resmi.",
  },
  {
    id: "t3",
    kegiatan: "Dokumentasi Upacara Peringatan Hari Kemerdekaan",
    lokasi: "Balaikota Among Tani",
    jenisPekerjaan: "Foto & Video Liputan",
    deadline: "26 Agustus 2026 12:00",
    bidang: "FOTO_VIDEO",
    status: "SIAP_TAYANG",
    kategori: "upacara",
    instruksi: "Ambil minimal 30 foto resolusi tinggi dan highlight video 60 detik.",
    workLink: "https://drive.google.com/drive/folders/1upacara-foto-batu",
  },
  {
    id: "t4",
    kegiatan: "Desain Banner Media Sosial HUT Kota Batu Ke-25",
    lokasi: "Kantor Diskominfo",
    jenisPekerjaan: "Desain Grafis / Feeds Instagram",
    deadline: "27 Agustus 2026 14:00",
    bidang: "DESAINER_EDITOR",
    status: "DESAIN",
    kategori: "peresmian",
    instruksi: "Gunakan palet warna resmi Pemkot dan sertakan logo OPD terbaru.",
    workLink: "https://drive.google.com/drive/folders/1desain-banner-batu",
  },
  {
    id: "t5",
    kegiatan: "Sidang Paripurna Pandangan Fraksi DPRD",
    lokasi: "Gedung DPRD Kota Batu",
    jenisPekerjaan: "Notulensi & Transkrip Pidato",
    deadline: "28 Agustus 2026 17:00",
    bidang: "PRAHUM",
    status: "BELUM",
    kategori: "sidang",
    instruksi: "Dokumentasikan poin pandangan seluruh 6 fraksi secara lengkap.",
  },
  {
    id: "t6",
    kegiatan: "Produksi Video Profil Desa Wisata Bumiaji",
    lokasi: "Kecamatan Bumiaji",
    jenisPekerjaan: "Video Dokumenter 4K",
    deadline: "29 Agustus 2026 16:00",
    bidang: "FOTO_VIDEO",
    status: "LIPUTAN",
    kategori: "peresmian",
    instruksi: "Pengambilan video lanskap perkebunan apel dan wawancara pengelola wisata.",
  },
  {
    id: "t7",
    kegiatan: "Infografis Realisasi Anggaran APBD Triwulan II",
    lokasi: "Kantor Diskominfo",
    jenisPekerjaan: "Desain Infografis Publik",
    deadline: "30 Agustus 2026 12:00",
    bidang: "DESAINER_EDITOR",
    status: "REVISI",
    kategori: "rapat",
    instruksi: "Rancang diagram visual realisasi APBD triwulan kedua untuk publikasi media sosial.",
    workLink: "https://drive.google.com/drive/folders/1infografis-apbd",
    revisionNotes: "Tolong perbaiki kontras warna pada diagram sektor pendidikan dan kesehatan, serta sertakan logo OPD terbaru di pojok kanan atas.",
    revisionAuthor: "Admin Diskominfo",
    revisionDate: "27 Agustus 2026, 11:30 WIB",
  },
];

const STORAGE_KEY = "simikp_petugas_tasks_data";
const EVENT_NAME = "simikp_tasks_sync_event";

export const getStoredPetugasTasks = (): PetugasTaskItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_PETUGAS_TASKS;
};

export const saveStoredPetugasTasks = (tasks: PetugasTaskItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {}
};

export const updatePetugasTaskStatus = async (id: string, status: string): Promise<PetugasTaskItem[]> => {
  const current = getStoredPetugasTasks();
  const updated = current.map((t) => (t.id === id ? { ...t, status } : t));
  saveStoredPetugasTasks(updated);

  try {
    await apiFetch(`/assignments/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: status === "SELESAI" ? "COMPLETED" : status === "LIPUTAN" ? "IN_PROGRESS" : "ASSIGNED" }),
    });
  } catch {}

  return updated;
};

export const requestTaskRevision = async (id: string, notes: string, author = "Admin Diskominfo"): Promise<PetugasTaskItem[]> => {
  const current = getStoredPetugasTasks();
  const nowStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) + " WIB";

  const updated = current.map((t) =>
    t.id === id
      ? {
          ...t,
          status: "REVISI",
          revisionNotes: notes,
          revisionAuthor: author,
          revisionDate: nowStr,
        }
      : t
  );
  saveStoredPetugasTasks(updated);

  try {
    await apiFetch(`/assignments/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "REVISI" }), // If REVISI is supported, else IN_PROGRESS
    });
  } catch {}

  return updated;
};

export const approveTaskContent = async (id: string): Promise<PetugasTaskItem[]> => {
  const current = getStoredPetugasTasks();
  const updated = current.map((t) =>
    t.id === id
      ? {
          ...t,
          status: "SIAP_TAYANG",
          revisionNotes: undefined,
          revisionAuthor: undefined,
          revisionDate: undefined,
        }
      : t
  );
  saveStoredPetugasTasks(updated);

  try {
    await apiFetch(`/assignments/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "COMPLETED" }), // SIAP_TAYANG mapped to COMPLETED
    });
  } catch {}

  return updated;
};

export const submitPetugasTaskWork = async (id: string, workLink: string): Promise<PetugasTaskItem[]> => {
  const current = getStoredPetugasTasks();
  const target = current.find((t) => t.id === id);
  // If task was in REVISI status, advancing it moves to SIAP_TAYANG (ready for final review/tayang)
  const nextStatus = target?.status === "REVISI" ? "SIAP_TAYANG" : "SELESAI";

  const updated = current.map((t) =>
    t.id === id
      ? {
          ...t,
          workLink,
          status: nextStatus,
        }
      : t
  );
  saveStoredPetugasTasks(updated);

  try {
    await apiFetch(`/assignments/${id}`, {
      method: "PUT",
      body: JSON.stringify({ workLink, status: nextStatus === "SELESAI" ? "COMPLETED" : "IN_PROGRESS" }),
    });
  } catch {}

  return updated;
};

/**
 * Reactive React Hook that stays in sync across Dashboard & Penugasan Saya
 */
export const usePetugasTasksStore = (userBidang?: string | null) => {
  const [tasks, setTasks] = useState<PetugasTaskItem[]>(() => getStoredPetugasTasks());

  const sync = useCallback(() => {
    setTasks(getStoredPetugasTasks());
  }, []);

  useEffect(() => {
    // Fetch assignments from real backend
    apiFetch<{ success: boolean; data: any[] }>("/assignments")
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const mapped: PetugasTaskItem[] = res.data.map((a: any) => ({
            id: a.id,
            kegiatan: a.activityTitle || a.activity?.title || "Kegiatan",
            lokasi: a.location || "Balaikota",
            jenisPekerjaan: a.contentType || "Liputan",
            deadline: a.activityDate || "2026-08-27",
            bidang: userBidang || "PRAHUM",
            status: a.status === "COMPLETED" ? "SELESAI" : a.status === "IN_PROGRESS" ? "LIPUTAN" : "BELUM",
            kategori: ((a.activityTitle || "").toLowerCase().includes("rapat")
              ? "rapat"
              : (a.activityTitle || "").toLowerCase().includes("sidang")
              ? "sidang"
              : (a.activityTitle || "").toLowerCase().includes("upacara")
              ? "upacara"
              : "peresmian") as PetugasTaskItem["kategori"],
            instruksi: a.instruction || "Lakukan tugas sesuai arahan.",
            workLink: a.workLink,
          }));

          saveStoredPetugasTasks(mapped);
          setTasks(mapped);
        }
      })
      .catch(() => {});

    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync, userBidang]);

  const userTasks = tasks.filter((t) => !userBidang || t.bidang === userBidang);

  return {
    tasks: userTasks,
    allTasks: tasks,
    updateStatus: (id: string, status: string) => updatePetugasTaskStatus(id, status),
    submitWork: (id: string, link: string) => submitPetugasTaskWork(id, link),
    requestRevision: (id: string, notes: string, author?: string) => requestTaskRevision(id, notes, author),
    approveContent: (id: string) => approveTaskContent(id),
    refresh: sync,
  };
};

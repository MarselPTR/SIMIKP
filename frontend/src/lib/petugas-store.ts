import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "./api-client";

export interface RevisionRecord {
  id: string;
  notes: string;
  author: string;
  date: string;
}

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
  revisionHistory?: RevisionRecord[];
}

export const INITIAL_PETUGAS_TASKS: PetugasTaskItem[] = [];

const STORAGE_KEY = "simikp_petugas_tasks_data";
const EVENT_NAME = "simikp_tasks_sync_event";

export const getStoredPetugasTasks = (): PetugasTaskItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
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

export const requestTaskRevision = async (id: string, notes: string, author = "Bambang S., S.Kom (Ahli Pertama)"): Promise<PetugasTaskItem[]> => {
  const current = getStoredPetugasTasks();
  const nowStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) + " WIB";

  const updated = current.map((t) => {
    if (t.id !== id) return t;

    const newEntry: RevisionRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      notes,
      author,
      date: nowStr,
    };

    const prevHistory = Array.isArray(t.revisionHistory) ? t.revisionHistory : [];
    const newHistory = [...prevHistory, newEntry];

    return {
      ...t,
      status: "REVISI",
      revisionNotes: notes,
      revisionAuthor: author,
      revisionDate: nowStr,
      revisionHistory: newHistory,
    };
  });
  saveStoredPetugasTasks(updated);

  try {
    await apiFetch(`/assignments/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "REVISI", revisionNotes: notes }),
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

  // Jika tugas sebelumnya berstatus REVISI, kirim ulang kembali ke workflow telaah (NEED_REVIEW)
  const isFromRevision = target?.status === "REVISI";
  const nextStatus = isFromRevision
    ? (target?.bidang === "PRAHUM" ? "MENULIS" : target?.bidang === "DESAINER_EDITOR" ? "DESAIN" : "LIPUTAN")
    : "SELESAI";

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
          const currentStored = getStoredPetugasTasks();
          const currentMap = new Map(currentStored.map((t) => [t.id, t]));

          const mapped: PetugasTaskItem[] = res.data.map((a: any) => {
            const existing = currentMap.get(a.id);

            // Tentukan status yang sinkron tanpa merusak status REVISI
            let finalStatus = a.status;
            if (existing?.status === "REVISI") {
              finalStatus = "REVISI";
            } else if (a.status === "COMPLETED") {
              finalStatus = "SELESAI";
            } else if (a.status === "IN_PROGRESS") {
              finalStatus = existing?.status || "LIPUTAN";
            } else if (a.status === "ASSIGNED") {
              finalStatus = existing?.status || "BELUM";
            } else if (a.status === "REVISI") {
              finalStatus = "REVISI";
            } else if (!finalStatus) {
              finalStatus = existing?.status || "BELUM";
            }

            return {
              id: a.id,
              kegiatan: a.activityTitle || a.activity?.title || existing?.kegiatan || "Kegiatan",
              lokasi: a.location || existing?.lokasi || "Balaikota",
              jenisPekerjaan: a.contentType || existing?.jenisPekerjaan || "Liputan",
              deadline: a.activityDate ? String(a.activityDate).split("T")[0] : existing?.deadline || "2026-08-27",
              bidang: a.staffType || existing?.bidang || userBidang || "PRAHUM",
              status: finalStatus,
              kategori: ((a.activityTitle || existing?.kegiatan || "").toLowerCase().includes("rapat")
                ? "rapat"
                : (a.activityTitle || existing?.kegiatan || "").toLowerCase().includes("sidang")
                ? "sidang"
                : (a.activityTitle || existing?.kegiatan || "").toLowerCase().includes("upacara")
                ? "upacara"
                : "peresmian") as PetugasTaskItem["kategori"],
              instruksi: a.instruction || existing?.instruksi || "Lakukan tugas sesuai arahan.",
              workLink: a.workLink || existing?.workLink,
              revisionNotes: existing?.revisionNotes,
              revisionAuthor: existing?.revisionAuthor,
              revisionDate: existing?.revisionDate,
              revisionHistory: existing?.revisionHistory,
            };
          });

          // Pertahankan tugas lokal yang belum tersimpan di backend
          const backendIds = new Set(mapped.map((m) => m.id));
          const onlyLocal = currentStored.filter((t) => !backendIds.has(t.id));
          const merged = [...mapped, ...onlyLocal];

          saveStoredPetugasTasks(merged);
          setTasks(merged);
        }
      })
      .catch(() => {
        // Jangan hapus task lokal saat offline atau fetch gagal
      });

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

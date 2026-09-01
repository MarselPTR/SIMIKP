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
            bidang: a.staffType || userBidang || "PRAHUM",
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
        } else {
          saveStoredPetugasTasks([]);
          setTasks([]);
        }
      })
      .catch(() => {
        setTasks([]);
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

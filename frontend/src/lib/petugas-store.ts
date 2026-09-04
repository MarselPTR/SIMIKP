import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "./api-client";

// Jenis konten (role) tugas -> jabatan/sektor alur kerja (dipakai untuk lookup
// WORKFLOWS dan untuk membatasi role apa yang boleh diklaim petugas sesuai jabatannya).
// Cocok dengan checklist "Output yang Dibutuhkan" di form Kegiatan.
export const CONTENT_TYPE_TO_BIDANG: Record<string, string> = {
  "Naskah Berita": "PRAHUM",
  Foto: "FOTOGRAFER",
  Video: "VIDEOGRAFER",
  Reels: "VIDEOGRAFER",
  Infografis: "DESAINER_EDITOR",
  Audio: "DESAINER_EDITOR",
};

// Jabatan lama "FOTO_VIDEO" (sebelum dipecah) tetap boleh mengklaim keduanya.
export const staffTypeMatchesContentType = (staffType: string | null | undefined, contentType: string): boolean => {
  if (!staffType) return true; // belum ada jabatan tetap = bebas pilih role apapun
  const bucket = CONTENT_TYPE_TO_BIDANG[contentType];
  if (!bucket) return true;
  if (staffType === bucket) return true;
  if (staffType === "FOTO_VIDEO" && (bucket === "FOTOGRAFER" || bucket === "VIDEOGRAFER")) return true;
  return false;
};

export interface RevisionRecord {
  id: string;
  notes: string;
  author: string;
  date: string;
}

export interface MediaFileInfo {
  url: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  isCurated?: boolean;
}

export interface MediaWorkPayload {
  type: "MEDIA_SUBMISSION";
  subType?: "foto" | "video" | "desain";
  files: MediaFileInfo[];
  caption?: string;
  targetPlatform?: string;
  editorNotes?: string;
}

export interface PetugasTaskItem {
  id: string;
  userId?: string;
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
  mediaData?: MediaWorkPayload;
  caption?: string;
  targetPlatform?: string;
  editorNotes?: string;
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

export const submitPetugasTaskWork = async (
  id: string,
  workLinkOrPayload: string | MediaWorkPayload
): Promise<PetugasTaskItem[]> => {
  const current = getStoredPetugasTasks();
  const target = current.find((t) => t.id === id);

  const isMediaObj = typeof workLinkOrPayload !== "string";
  const finalWorkLink = isMediaObj ? JSON.stringify(workLinkOrPayload) : workLinkOrPayload;

  // Jika tugas sebelumnya berstatus REVISI, kirim ulang kembali ke workflow telaah (NEED_REVIEW)
  const isFromRevision = target?.status === "REVISI";
  const nextStatus = isFromRevision
    ? (target?.bidang === "PRAHUM" ? "MENULIS" : target?.bidang === "DESAINER_EDITOR" ? "DESAIN" : "LIPUTAN")
    : "SELESAI";

  const updated = current.map((t) =>
    t.id === id
      ? {
          ...t,
          workLink: finalWorkLink,
          mediaData: isMediaObj ? workLinkOrPayload : t.mediaData,
          caption: isMediaObj ? workLinkOrPayload.caption : t.caption,
          targetPlatform: isMediaObj ? workLinkOrPayload.targetPlatform : t.targetPlatform,
          editorNotes: isMediaObj ? workLinkOrPayload.editorNotes : t.editorNotes,
          status: nextStatus,
        }
      : t
  );
  saveStoredPetugasTasks(updated);

  try {
    await apiFetch(`/assignments/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        workLink: finalWorkLink,
        status: nextStatus === "SELESAI" ? "COMPLETED" : "IN_PROGRESS",
        isRevisionSubmission: isFromRevision,
        revisionNotes: target?.revisionNotes,
      }),
    });
  } catch {}

  return updated;
};

/**
 * Reactive React Hook that stays in sync across Dashboard & Penugasan Saya
 */
export const usePetugasTasksStore = (userId?: string | null) => {
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

            const rawLink = a.workLink || existing?.workLink;
            let parsedMedia: MediaWorkPayload | undefined = existing?.mediaData;
            if (rawLink && typeof rawLink === "string" && rawLink.startsWith('{"type":"MEDIA_SUBMISSION"')) {
              try {
                parsedMedia = JSON.parse(rawLink);
              } catch {}
            }

            return {
              id: a.id,
              userId: a.userId,
              kegiatan: a.activityTitle || a.activity?.title || existing?.kegiatan || "Kegiatan",
              lokasi: a.location || existing?.lokasi || "Balaikota",
              jenisPekerjaan: a.contentType || existing?.jenisPekerjaan || "Liputan",
              deadline: a.activityDate ? String(a.activityDate).split("T")[0] : existing?.deadline || "2026-08-27",
              // Role = jenis konten tugas ini, bukan staffType si petugas — konsisten
              // dengan model "role melekat per-tugas" (lihat CONTENT_TYPE_TO_BIDANG).
              bidang: CONTENT_TYPE_TO_BIDANG[a.contentType] || existing?.bidang || "PRAHUM",
              status: finalStatus,
              kategori: ((a.activityTitle || existing?.kegiatan || "").toLowerCase().includes("rapat")
                ? "rapat"
                : (a.activityTitle || existing?.kegiatan || "").toLowerCase().includes("sidang")
                ? "sidang"
                : (a.activityTitle || existing?.kegiatan || "").toLowerCase().includes("upacara")
                ? "upacara"
                : "peresmian") as PetugasTaskItem["kategori"],
              instruksi: a.instruction || existing?.instruksi || "Lakukan tugas sesuai arahan.",
              workLink: rawLink,
              mediaData: parsedMedia,
              caption: parsedMedia?.caption || existing?.caption,
              targetPlatform: parsedMedia?.targetPlatform || existing?.targetPlatform,
              editorNotes: parsedMedia?.editorNotes || existing?.editorNotes,
              revisionNotes: a.revisionNotes || existing?.revisionNotes,
              revisionAuthor: a.revisionAuthor || existing?.revisionAuthor,
              revisionDate: a.revisionDate || existing?.revisionDate,
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
  }, [sync, userId]);

  // Identitas, bukan kategori: role sekarang melekat per-tugas, jadi tugas
  // milik petugas lain (walau kebetulan role-nya sama) tidak boleh ikut tampil.
  const userTasks = tasks.filter((t) => !userId || t.userId === userId);

  return {
    tasks: userTasks,
    allTasks: tasks,
    updateStatus: (id: string, status: string) => updatePetugasTaskStatus(id, status),
    submitWork: (id: string, link: string | MediaWorkPayload) => submitPetugasTaskWork(id, link),
    requestRevision: (id: string, notes: string, author?: string) => requestTaskRevision(id, notes, author),
    approveContent: (id: string) => approveTaskContent(id),
    refresh: sync,
  };
};

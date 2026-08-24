import { useState, useEffect, useCallback } from "react";
import { mockTugasPetugas, type MockTugasPetugas } from "./mock-data";

const STORAGE_KEY = "simikp_petugas_tasks";

export const getStoredPetugasTasks = (): MockTugasPetugas[] => {
  if (typeof window === "undefined") return mockTugasPetugas;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockTugasPetugas));
      return mockTugasPetugas;
    }
    return JSON.parse(data);
  } catch {
    return mockTugasPetugas;
  }
};

export const saveStoredPetugasTasks = (tasks: MockTugasPetugas[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new Event("simikp_tasks_updated"));
  } catch (err) {
    console.error("Failed to save tasks to localStorage", err);
  }
};

export const usePetugasTasks = (bidangFilter?: string) => {
  const [tasks, setTasks] = useState<MockTugasPetugas[]>(() => getStoredPetugasTasks());

  const reload = useCallback(() => {
    setTasks(getStoredPetugasTasks());
  }, []);

  useEffect(() => {
    const handleUpdate = () => reload();
    window.addEventListener("simikp_tasks_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("simikp_tasks_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [reload]);

  const updateTask = useCallback((id: string, updates: Partial<MockTugasPetugas>) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      saveStoredPetugasTasks(next);
      return next;
    });
  }, []);

  const resetToDefault = useCallback(() => {
    saveStoredPetugasTasks(mockTugasPetugas);
    setTasks(mockTugasPetugas);
  }, []);

  const filteredTasks = bidangFilter
    ? tasks.filter((t) => t.bidang === bidangFilter)
    : tasks;

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    updateTask,
    resetToDefault,
    reload,
  };
};

export const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case "SELESAI":
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
        label: "Selesai",
      };
    case "SIAP_TAYANG":
      return {
        bg: "bg-purple-50 text-purple-700 border-purple-200",
        dot: "bg-purple-500",
        label: "Siap Tayang",
      };
    case "REVISI":
      return {
        bg: "bg-rose-50 text-rose-700 border-rose-200",
        dot: "bg-rose-500",
        label: "Perlu Revisi",
      };
    case "DESAIN":
      return {
        bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
        dot: "bg-indigo-500",
        label: "Sedang Desain",
      };
    case "MENULIS":
      return {
        bg: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
        label: "Sedang Menulis",
      };
    case "LIPUTAN":
      return {
        bg: "bg-sky-50 text-sky-700 border-sky-200",
        dot: "bg-sky-500",
        label: "Sedang Liputan",
      };
    case "BELUM":
    default:
      return {
        bg: "bg-slate-50 text-slate-700 border-slate-200",
        dot: "bg-slate-400",
        label: "Belum Dikerjakan",
      };
  }
};

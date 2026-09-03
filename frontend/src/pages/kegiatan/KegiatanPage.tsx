import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Trash2,
  Pencil,
  MapPin,
  Building2,
  Inbox,
  CalendarDays,
  UserPlus,
  Settings2,
  Check,
  RotateCcw,
  X,
} from "lucide-react";
import { apiFetch } from "../../lib/api-client";
import { KEGIATAN_STATUS_COLORS, KEGIATAN_STATUS_LABELS } from "../../lib/mock-data";
import type { MockKegiatan, MockPenugasan } from "../../lib/mock-data";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import Select from "../../components/ui/Select";
import { LoadingSpinner, ErrorState } from "../../components/shared/StateComponents";
import { useToast } from "../../contexts/ToastContext";
import EventCalendar from "../../components/shared/EventCalendar";
import type { CalendarEvent } from "../../components/shared/EventCalendar";

const STATUS_COLORS = KEGIATAN_STATUS_COLORS;
const STATUS_LABELS = KEGIATAN_STATUS_LABELS;

const STATUS_BADGE_VARIANT: Record<MockKegiatan["status"], "success" | "warning" | "default" | "info"> = {
  active: "success",
  review: "warning",
  done: "default",
  pending: "info",
};

const PRIORITAS_BADGE_VARIANT: Record<MockKegiatan["prioritas"], "warning" | "info" | "default"> = {
  Tinggi: "warning",
  Sedang: "info",
  Rendah: "default",
};

export interface OutputJabatanGroup {
  jabatan: string;
  code: string;
  options: string[];
}

// Harus sinkron dengan CONTENT_TYPE_TO_STAFF_TYPE (backend assignments.controller.ts)
// dan CONTENT_TYPE_TO_BIDANG (frontend lib/petugas-store.ts) — sama-sama menentukan
// jenis output mana yang boleh diklaim petugas dengan jabatan apa.
export const DEFAULT_OUTPUT_BY_JABATAN: OutputJabatanGroup[] = [
  {
    jabatan: "Pranata Humas (Berita)",
    code: "PRAHUM",
    options: ["Naskah Berita"],
  },
  {
    jabatan: "Fotografer",
    code: "FOTOGRAFER",
    options: ["Foto"],
  },
  {
    jabatan: "Videografer",
    code: "VIDEOGRAFER",
    options: ["Video", "Reels"],
  },
  {
    jabatan: "Desainer & Editor",
    code: "DESAINER_EDITOR",
    options: ["Infografis", "Audio"],
  },
];



export const OUTPUT_OPTIONS = DEFAULT_OUTPUT_BY_JABATAN.flatMap((g) => g.options);

export const KOTA_BATU_DISTRICTS: Record<string, string[]> = {
  "Kecamatan Batu": [
    "Kelurahan Sisir",
    "Kelurahan Ngaglik",
    "Kelurahan Temas",
    "Kelurahan Songgokerto",
    "Desa Sumberejo",
    "Desa Sidomulyo",
    "Desa Pesanggrahan",
    "Desa Oro-oro Ombo",
  ],
  "Kecamatan Bumiaji": [
    "Desa Bumiaji",
    "Desa Bulukerto",
    "Desa Giripurno",
    "Desa Gunungsari",
    "Desa Pandanrejo",
    "Desa Punten",
    "Desa Sumber Brantas",
    "Desa Sumbergondo",
    "Desa Tulungrejo",
  ],
  "Kecamatan Junrejo": [
    "Kelurahan Dadaprejo",
    "Desa Beji",
    "Desa Junrejo",
    "Desa Mojorejo",
    "Desa Pendem",
    "Desa Tlekung",
    "Desa Torongrejo",
  ],
  "Lainnya / Luar Kota": [
    "Luar Kota Batu",
  ],
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const emptyForm = {
  title: "",
  deadline: todayStr(),
  lokasi: "",
  kecamatan: "",
  desaKelurahan: "",
  alamat: "",
  opdPenyelenggara: "",
  prioritas: "Sedang" as MockKegiatan["prioritas"],
  outputDibutuhkan: [] as string[],
};

const formatTanggal = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const formatTanggalPanjang = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const KegiatanPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data: rawKegiatanData, isLoading, error, refetch } = useQuery({
    queryKey: ["kegiatan"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: any[] }>("/activities");
        return res.data || [];
      } catch {
        return [];
      }
    },
  });

  const { data: opds = [] } = useQuery({
    queryKey: ["opds"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: any[] }>("/master/opds");
        return res.data || [];
      } catch {
        return [];
      }
    },
  });



  // Query Penugasan Data for real-time synchronization
  const { data: penugasanResponse } = useQuery({
    queryKey: ["penugasan"],
    queryFn: async () => await apiFetch<{ data: any[] }>("/assignments"),
  });
  
  // Normalise items from real API or mock – map to shape expected by JSX
  const penugasanList: MockPenugasan[] = useMemo(() => {
    return (penugasanResponse?.data ?? []).map((p: any) => ({
      id: p.id,
      kegiatanTerkait: p.activityTitle ?? p.kegiatanTerkait ?? "",
      pic: p.picName ?? p.pic ?? "",
      picAvatar: p.picAvatar ?? null,
      jenisKonten: p.contentType ?? p.jenisKonten ?? "",
      jamMulai: (p.startTime ?? p.jamMulai ?? "").slice(0, 5),
      jamSelesai: (p.endTime ?? p.jamSelesai ?? "").slice(0, 5),
      status: p.status ?? "ASSIGNED",
      tanggal: p.activityDate ?? p.tanggal ?? "",
    }));
  }, [penugasanResponse?.data]);

  const getAssignedTasks = (title: string): MockPenugasan[] => {
    if (!title) return [];
    return penugasanList.filter((p) =>
      (p.kegiatanTerkait ?? "").toLowerCase() === title.toLowerCase()
    );
  };

  const items: MockKegiatan[] = useMemo(
    () => (Array.isArray(rawKegiatanData) ? (rawKegiatanData as MockKegiatan[]) : []),
    [rawKegiatanData]
  );

  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("all");
  const [statusFilter, setStatusFilter] = useState<MockKegiatan["status"] | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [viewDateKey, setViewDateKey] = useState<string | null>(null);

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const filtered = useMemo(() => {
    let res = items;
    if (search) {
      res = res.filter((k) => k.title.toLowerCase().includes(search.toLowerCase()));
    }
    if (statusFilter !== "all") {
      res = res.filter((k) => k.status === statusFilter);
    }
    if (filterDate === "today") res = res.slice(0, 2);
    if (filterDate === "tomorrow") res = res.slice(2, 4);
    if (filterDate === "this_week") res = res.slice(0, 5);
    return res;
  }, [items, search, filterDate, statusFilter]);

  const calendarEvents = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const k of items) {
      if (!k.deadline) continue;
      const list = map[k.deadline] ?? (map[k.deadline] = []);
      list.push({ color: STATUS_COLORS[k.status], label: k.title });
    }
    return map;
  }, [items]);

  const calendarLegend = (Object.keys(STATUS_LABELS) as MockKegiatan["status"][]).map((status) => ({
    label: STATUS_LABELS[status],
    color: STATUS_COLORS[status],
  }));

  const statusCounts = useMemo(() => {
    const counts: Record<MockKegiatan["status"], number> = { active: 0, review: 0, done: 0, pending: 0 };
    for (const k of items) counts[k.status]++;
    return counts;
  }, [items]);

  const tugasPadaTanggal = useMemo(
    () => (viewDateKey ? items.filter((k) => k.deadline === viewDateKey) : []),
    [items, viewDateKey],
  );

  const openAddDialog = (prefillDate?: string) => {
    setEditingId(null);
    setForm({ ...emptyForm, deadline: prefillDate ?? todayStr() });
    setIsModalOpen(true);
  };

  const openEditDialog = (item: MockKegiatan & any) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      deadline: item.deadline,
      lokasi: item.lokasi ?? "",
      kecamatan: item.kecamatan ?? "",
      desaKelurahan: item.desaKelurahan ?? "",
      alamat: item.alamat ?? "",
      opdPenyelenggara: item.opdPenyelenggara ?? "",
      prioritas: item.prioritas,
      outputDibutuhkan: item.outputDibutuhkan ?? [],
    });
    setIsModalOpen(true);
  };

  const closeDialog = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  // Output options by Jabatan with LocalStorage persistence
  const [outputGroups, setOutputGroups] = useState<OutputJabatanGroup[]>(() => {
    try {
      const saved = localStorage.getItem("simikp_output_by_jabatan");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load output groups from localStorage", e);
    }
    return DEFAULT_OUTPUT_BY_JABATAN;
  });

  // Manage Output Modal states
  const [isManageOutputOpen, setIsManageOutputOpen] = useState(false);
  const [newOutputName, setNewOutputName] = useState("");
  const [newOutputJabatanCode, setNewOutputJabatanCode] = useState("PRAHUM");
  const [editingOutput, setEditingOutput] = useState<{
    originalName: string;
    name: string;
    jabatanCode: string;
  } | null>(null);

  const saveOutputGroups = (newGroups: OutputJabatanGroup[]) => {
    setOutputGroups(newGroups);
    try {
      localStorage.setItem("simikp_output_by_jabatan", JSON.stringify(newGroups));
    } catch (e) {
      console.error("Failed to save output groups to localStorage", e);
    }
  };

  const handleAddOutput = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newOutputName.trim();
    if (!trimmed) {
      addToast("Nama tipe output tidak boleh kosong", "error");
      return;
    }
    const alreadyExists = outputGroups.some((g) =>
      g.options.some((opt) => opt.toLowerCase() === trimmed.toLowerCase())
    );
    if (alreadyExists) {
      addToast(`Tipe output "${trimmed}" sudah ada`, "warning");
      return;
    }

    const updated = outputGroups.map((g) =>
      g.code === newOutputJabatanCode
        ? { ...g, options: [...g.options, trimmed] }
        : g
    );
    saveOutputGroups(updated);
    setNewOutputName("");
    const targetJabatan = outputGroups.find((g) => g.code === newOutputJabatanCode)?.jabatan;
    addToast(`Tipe output "${trimmed}" berhasil ditambahkan ke ${targetJabatan}`, "success");
  };

  const handleSaveEditOutput = () => {
    if (!editingOutput) return;
    const trimmed = editingOutput.name.trim();
    if (!trimmed) {
      addToast("Nama tipe output tidak boleh kosong", "error");
      return;
    }

    if (trimmed.toLowerCase() !== editingOutput.originalName.toLowerCase()) {
      const alreadyExists = outputGroups.some((g) =>
        g.options.some((opt) => opt.toLowerCase() === trimmed.toLowerCase())
      );
      if (alreadyExists) {
        addToast(`Tipe output "${trimmed}" sudah ada`, "warning");
        return;
      }
    }

    const updated = outputGroups.map((g) => {
      const withoutOriginal = g.options.filter((opt) => opt !== editingOutput.originalName);
      if (g.code === editingOutput.jabatanCode) {
        return { ...g, options: [...withoutOriginal, trimmed] };
      }
      return { ...g, options: withoutOriginal };
    });

    saveOutputGroups(updated);

    // Update form if selected
    setForm((f) => ({
      ...f,
      outputDibutuhkan: f.outputDibutuhkan.map((opt) =>
        opt === editingOutput.originalName ? trimmed : opt
      ),
    }));

    addToast(`Tipe output "${trimmed}" berhasil diperbarui`, "success");
    setEditingOutput(null);
  };

  const handleDeleteOutput = (outputName: string) => {
    const updated = outputGroups.map((g) => ({
      ...g,
      options: g.options.filter((opt) => opt !== outputName),
    }));
    saveOutputGroups(updated);

    setForm((f) => ({
      ...f,
      outputDibutuhkan: f.outputDibutuhkan.filter((opt) => opt !== outputName),
    }));

    addToast(`Tipe output "${outputName}" berhasil dihapus`, "info");
    if (editingOutput?.originalName === outputName) {
      setEditingOutput(null);
    }
  };

  const handleResetOutputs = () => {
    if (window.confirm("Kembalikan daftar output ke pengaturan awal Diskominfo?")) {
      saveOutputGroups(DEFAULT_OUTPUT_BY_JABATAN);
      setEditingOutput(null);
      addToast("Daftar output dikembalikan ke pengaturan awal", "info");
    }
  };

  const toggleOutput = (opt: string) => {
    setForm((f) => ({
      ...f,
      outputDibutuhkan: f.outputDibutuhkan.includes(opt)
        ? f.outputDibutuhkan.filter((o) => o !== opt)
        : [...f.outputDibutuhkan, opt],
    }));
  };

  const toggleJabatanGroup = (options: string[]) => {
    setForm((f) => {
      const allSelected = options.every((opt) => f.outputDibutuhkan.includes(opt));
      if (allSelected) {
        return {
          ...f,
          outputDibutuhkan: f.outputDibutuhkan.filter((o) => !options.includes(o)),
        };
      }
      return {
        ...f,
        outputDibutuhkan: Array.from(new Set([...f.outputDibutuhkan, ...options])),
      };
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingId) {
        return apiFetch(`/activities/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        return apiFetch("/activities", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      refetch();
      closeDialog();
      addToast(editingId ? "Perubahan kegiatan disimpan." : "Kegiatan baru berhasil dibuat.", "success");
    },
    onError: (err: any) => {
      addToast(
        err?.status === 401
          ? "Sesi berakhir. Silakan login ulang lalu coba lagi."
          : err?.message || "Gagal menyimpan kegiatan.",
        "error",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch(`/activities/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      refetch();
    },
  });

  const handleSave = () => {
    if (!form.title.trim() || !form.deadline) return;

    const opdId = opds?.find((o: any) => o.name === form.opdPenyelenggara)?.id;
    saveMutation.mutate({
      title: form.title.trim(),
      activityDate: form.deadline,
      opdId: opdId || undefined,
      opdPenyelenggara: form.opdPenyelenggara.trim() || undefined,
      location: form.lokasi.trim() || undefined,
      locationName: form.lokasi.trim() || undefined,
      kecamatan: form.kecamatan,
      desaKelurahan: form.desaKelurahan,
      address: form.alamat.trim() || undefined,
      priority: form.prioritas,
      outputDibutuhkan: form.outputDibutuhkan,
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Hapus kegiatan ini? Tindakan ini tidak bisa dibatalkan.")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-5 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#0f1f5c] dark:text-sky-400">Agenda Kegiatan</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Kelola jadwal kegiatan (Satu Kegiatan = Satu Data Induk)</p>
        </div>
        <Button variant="default" onClick={() => openAddDialog()} className="gap-1.5 bg-[#0f1f5c] dark:bg-blue-600 hover:bg-[#162a7a] dark:hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> Tambah Kegiatan
        </Button>
      </div>

      <EventCalendar
        year={calYear}
        month={calMonth}
        events={calendarEvents}
        legend={calendarLegend}
        subtitle="Pilih tanggal untuk melihat atau menambahkan kegiatan baru"
        selectedDateKey={viewDateKey}
        onNavigate={(y, m) => {
          setCalYear(y);
          setCalMonth(m);
        }}
        onDayClick={(dateKey) => setViewDateKey((prev) => (prev === dateKey ? null : dateKey))}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            statusFilter === "all" ? "bg-blue-600 text-white shadow-xs" : "bg-white dark:bg-[#161b22] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-xs"
          }`}
        >
          Semua ({items.length})
        </button>
        {(Object.keys(STATUS_LABELS) as MockKegiatan["status"][]).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === st ? "bg-blue-600 text-white shadow-xs" : "bg-white dark:bg-[#161b22] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-xs"
            }`}
          >
            {STATUS_LABELS[st]} ({statusCounts[st] ?? 0})
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari nama kegiatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: "all", label: "Semua Waktu" },
            { value: "today", label: "Hari Ini" },
            { value: "tomorrow", label: "Besok" },
            { value: "this_week", label: "Minggu Ini" },
          ]}
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-full sm:w-44"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-[#161b22] rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            <Inbox className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Tidak ada kegiatan ditemukan.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => openEditDialog(item)}
              className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-sky-500 rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-1.5 flex-wrap mb-2">
                  <Badge variant={STATUS_BADGE_VARIANT[item.status]}>{STATUS_LABELS[item.status]}</Badge>
                  <Badge variant={PRIORITAS_BADGE_VARIANT[item.prioritas]}>{item.prioritas}</Badge>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-2 break-words">{item.title}</h3>
                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{formatTanggal(item.deadline)}</span>
                  </div>
                  {item.lokasi && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="break-words min-w-0">{item.lokasi}</span>
                    </div>
                  )}
                  {item.opdPenyelenggara && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="break-words min-w-0">{item.opdPenyelenggara}</span>
                    </div>
                  )}
                </div>
                {item.outputDibutuhkan && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.outputDibutuhkan.map((out) => (
                      <span key={out} className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-transparent dark:border-gray-700 px-2 py-0.5 rounded font-medium">
                        {out}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditDialog(item);
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog 
        open={isModalOpen} 
        onClose={closeDialog} 
        title={editingId ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}
        size="lg"
        actions={
          <>
            <Button variant="outline" onClick={closeDialog}>
              Batal
            </Button>
            <Button variant="default" disabled={!form.title.trim() || !form.deadline} onClick={handleSave} className="bg-[#0f1f5c] text-white">
              {editingId ? "Simpan Perubahan" : "Simpan Kegiatan"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Kegiatan</label>
            <Input
              placeholder="Contoh: Rapat Koordinasi SPBE..."
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Pelaksanaan</label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Prioritas</label>
              <Select
                options={[
                  { value: "Tinggi", label: "Tinggi" },
                  { value: "Sedang", label: "Sedang" },
                  { value: "Rendah", label: "Rendah" },
                ]}
                className="mt-1"
                value={form.prioritas}
                onChange={(e) => setForm((f) => ({ ...f, prioritas: e.target.value as MockKegiatan["prioritas"] }))}
              />
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Detail Lokasi Pelaksanaan</span>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nama Gedung / Ruangan *</label>
              <Input
                value={form.lokasi}
                onChange={(e) => setForm((f) => ({ ...f, lokasi: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Kecamatan</label>
                <Input
                  value={form.kecamatan}
                  onChange={(e) => setForm((f) => ({ ...f, kecamatan: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Kelurahan / Desa</label>
                <Input
                  value={form.desaKelurahan}
                  onChange={(e) => setForm((f) => ({ ...f, desaKelurahan: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Alamat Lengkap (Opsional)</label>
              <Input
                value={form.alamat}
                onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">OPD Penyelenggara</label>
            <input
              list="opd-options"
              placeholder="Pilih atau ketik OPD (Contoh: Diskominfo / Dinkes)"
              value={form.opdPenyelenggara}
              onChange={(e) => setForm((f) => ({ ...f, opdPenyelenggara: e.target.value }))}
              className="mt-1 w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
            <datalist id="opd-options">
              {Array.isArray(opds) && opds.map((o: any) => (
                <option key={o.id} value={o.name} />
              ))}
            </datalist>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Output yang Dibutuhkan (Berdasarkan Jabatan)
                </label>
                <button
                  type="button"
                  onClick={() => setIsManageOutputOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-sky-400 hover:text-blue-700 dark:hover:text-sky-300 bg-blue-50 dark:bg-sky-950/60 hover:bg-blue-100 dark:hover:bg-sky-900/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-sky-800/60 transition-colors cursor-pointer"
                  title="Kelola, Tambah, Edit, atau Pindahkan Tipe Output"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Kelola Output</span>
                </button>
              </div>
              <span className="text-[11px] text-gray-400">
                {form.outputDibutuhkan.length} dipilih
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {outputGroups.map((group) => {
                
                const checkedCount = group.options.filter((o) => form.outputDibutuhkan.includes(o)).length;
                const allChecked = group.options.length > 0 && checkedCount === group.options.length;

                return (
                  <div
                    key={group.code}
                    className="rounded-xl border border-gray-200 dark:border-gray-700/80 bg-gray-50/70 dark:bg-gray-800/40 p-3 flex flex-col justify-between transition-colors"
                  >
                    <div>
                      {/* Header Jabatan */}
                      <div className="flex items-start justify-between gap-1.5 mb-2.5 pb-2 border-b border-gray-200/80 dark:border-gray-700/60 min-h-[36px]">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-snug">
                          {group.jabatan}
                        </span>
                        {group.options.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleJabatanGroup(group.options)}
                            className="text-[10px] font-semibold text-blue-600 dark:text-sky-400 hover:underline shrink-0 whitespace-nowrap pt-0.5 cursor-pointer"
                          >
                            {allChecked ? "Batal" : "Pilih Semua"}
                          </button>
                        )}
                      </div>

                      {/* Options Checkboxes */}
                      <div className="space-y-1.5">
                        {group.options.length === 0 ? (
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 italic py-2 text-center">
                            Belum ada output
                          </p>
                        ) : (
                          group.options.map((opt) => {
                            const isChecked = form.outputDibutuhkan.includes(opt);
                            return (
                              <label
                                key={opt}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                                  isChecked
                                    ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-sky-300 shadow-2xs border border-blue-200 dark:border-sky-800/60 font-semibold"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-slate-800/40 border border-transparent"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleOutput(opt)}
                                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="truncate">{opt}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {editingId && (
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3.5 border border-gray-100 dark:border-gray-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  👥 Penugasan Khusus Terkait ({getAssignedTasks(form.title).length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    closeDialog();
                    navigate(`/penugasan?kegiatan=${encodeURIComponent(form.title)}&action=create`);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Tambah Penugasan</span>
                </button>
              </div>

              {getAssignedTasks(form.title).length === 0 ? (
                <p className="text-xs text-gray-400 italic">Belum ada staf yang ditugaskan untuk kegiatan ini.</p>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {getAssignedTasks(form.title).map((t) => (
                    <div
                      key={t.id}
                      className="bg-white dark:bg-gray-800/80 rounded-lg p-2 text-xs flex items-center justify-between border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[9px] flex items-center justify-center">
                          {t.picAvatar ?? t.pic.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{t.pic}</span>
                        <span className="text-gray-400">({t.jenisKonten})</span>
                      </div>
                      <span className="text-[11px] text-gray-500 font-mono">
                        {t.jamMulai} - {t.jamSelesai}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog>

      <Dialog
        open={viewDateKey !== null}
        onClose={() => setViewDateKey(null)}
        title={viewDateKey ? formatTanggalPanjang(viewDateKey) : "Detail Tanggal"}
      >
        <div className="mt-1">
          {tugasPadaTanggal.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto -mx-1 px-1">
              {tugasPadaTanggal.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => {
                    setViewDateKey(null);
                    openEditDialog(k);
                  }}
                  className="w-full text-left flex items-start gap-3 rounded-lg border border-gray-100 p-3 transition-all duration-150 hover:border-blue-200 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[k.status] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{k.title}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <Badge variant={STATUS_BADGE_VARIANT[k.status]}>{STATUS_LABELS[k.status]}</Badge>
                      <Badge variant={PRIORITAS_BADGE_VARIANT[k.prioritas]}>{k.prioritas}</Badge>
                      {k.lokasi && <span className="text-xs text-gray-400 truncate">{k.lokasi}</span>}
                    </div>
                  </div>
                  <Pencil className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-1" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-2">
                <Inbox className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">Belum ada kegiatan pada tanggal ini.</p>
            </div>
          )}

          <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setViewDateKey(null)}>
              Tutup
            </Button>
            <Button
              variant="default"
              className="gap-1.5 bg-[#0f1f5c] text-white"
              onClick={() => {
                const date = viewDateKey ?? undefined;
                setViewDateKey(null);
                openAddDialog(date);
              }}
            >
              <Plus className="w-4 h-4" /> Tambah Kegiatan
            </Button>
          </div>
        </div>
      </Dialog>

      {/* MODAL KELOLA OUTPUT BERDASARKAN JABATAN */}
      <Dialog
        open={isManageOutputOpen}
        onClose={() => {
          setIsManageOutputOpen(false);
          setEditingOutput(null);
        }}
        title="Kelola Pilihan Output Kegiatan"
        size="lg"
        actions={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={handleResetOutputs}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Bawaan</span>
            </button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setIsManageOutputOpen(false);
                setEditingOutput(null);
              }}
              className="px-5 cursor-pointer"
            >
              Selesai
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Form Tambah Tipe Output Baru */}
          <form
            onSubmit={handleAddOutput}
            className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-gray-800 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600 dark:text-sky-400" />
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                Tambah Tipe Output Baru
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nama Tipe Output
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Live Streaming, Podcast, Press Release..."
                  value={newOutputName}
                  onChange={(e) => setNewOutputName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3.5 py-2.5 focus:border-[#0f1f5c] dark:focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Pilih Jabatan / Penanggung Jawab
                </label>
                <select
                  value={newOutputJabatanCode}
                  onChange={(e) => setNewOutputJabatanCode(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2.5 focus:border-[#0f1f5c] dark:focus:border-sky-500 focus:outline-none cursor-pointer"
                >
                  {outputGroups.map((g) => (
                    <option key={g.code} value={g.code}>
                      {g.jabatan}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="w-full text-xs py-2.5 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah
                </Button>
              </div>
            </div>
          </form>

          {/* Form Edit Output (jika sedang mengedit) */}
          {editingOutput && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-4 animate-fade-in shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 dark:border-amber-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                    <Pencil className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      Edit & Pindahkan Tipe Output
                    </h4>
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-400">
                      Mengubah nama atau memindahkan output <strong className="font-bold">"{editingOutput.originalName}"</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingOutput(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition cursor-pointer"
                  title="Tutup Edit"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Nama Tipe Output <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingOutput.name}
                    onChange={(e) =>
                      setEditingOutput({ ...editingOutput, name: e.target.value })
                    }
                    className="w-full text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3.5 py-2.5 focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    placeholder="Nama output..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Pindahkan ke Jabatan Lain <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingOutput.jabatanCode}
                    onChange={(e) =>
                      setEditingOutput({ ...editingOutput, jabatanCode: e.target.value })
                    }
                    className="w-full text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3.5 py-2.5 focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                  >
                    {outputGroups.map((g) => (
                      <option key={g.code} value={g.code}>
                        {g.jabatan}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-amber-200/50 dark:border-amber-800/30">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingOutput(null)}
                  className="px-4 py-2 text-xs font-medium cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleSaveEditOutput}
                  className="px-5 py-2 text-xs font-semibold cursor-pointer flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
                >
                  <Check className="w-3.5 h-3.5" />
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          )}

          {/* Daftar Output per Jabatan */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
              Daftar Output Saat Ini ({outputGroups.reduce((acc, g) => acc + g.options.length, 0)} Pilihan)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {outputGroups.map((group) => {
                

                return (
                  <div
                    key={group.code}
                    className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/40 p-3.5 flex flex-col justify-between"
                  >
                    <div>
                      {/* Header Jabatan */}
                      <div className="flex items-start justify-between gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-800 min-h-[36px]">
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-snug">
                          {group.jabatan}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200/80 dark:bg-gray-800 text-gray-700 dark:text-gray-300 shrink-0">
                          {group.options.length}
                        </span>
                      </div>

                      {/* List Items */}
                      <div className="space-y-2">
                        {group.options.length === 0 ? (
                          <p className="text-xs text-gray-400 dark:text-gray-500 italic py-3 text-center">
                            Tidak ada pilihan output
                          </p>
                        ) : (
                          group.options.map((opt) => {
                            const isBeingEdited = editingOutput?.originalName === opt;
                            return (
                              <div
                                key={opt}
                                className={`flex items-center justify-between gap-2 p-2 rounded-xl border text-xs transition-all ${
                                  isBeingEdited
                                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-xs"
                                    : "bg-white dark:bg-gray-800/80 border-gray-200/80 dark:border-gray-700/60 shadow-2xs"
                                }`}
                              >
                                <span className="font-medium text-gray-800 dark:text-gray-200 truncate flex-1" title={opt}>
                                  {opt}
                                </span>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingOutput({
                                        originalName: opt,
                                        name: opt,
                                        jabatanCode: group.code,
                                      })
                                    }
                                    className="p-1 rounded-md text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                                    title={`Edit atau Pindahkan "${opt}"`}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOutput(opt)}
                                    className="p-1 rounded-md text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                                    title={`Hapus "${opt}"`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default KegiatanPage;

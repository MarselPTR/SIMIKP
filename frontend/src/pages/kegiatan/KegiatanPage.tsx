import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Trash2,
  Pencil,
  MapPin,
  Building2,
  Inbox,
  X,
  CalendarDays,
  Users,
  UserPlus,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { mockApi } from "../../lib/mock-api";
import { apiFetch } from "../../lib/api-client";
import type { MockKegiatan, MockPenugasan } from "../../lib/mock-data";
import { KEGIATAN_STATUS_COLORS, KEGIATAN_STATUS_LABELS } from "../../lib/mock-data";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import Select from "../../components/ui/Select";
import { LoadingSpinner, ErrorState } from "../../components/shared/StateComponents";
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

const OUTPUT_OPTIONS = ["Naskah Berita", "Foto", "Video", "Reels", "Infografis", "Audio"];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const emptyForm = {
  title: "",
  deadline: todayStr(),
  lokasi: "",
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

  const { data: kegiatanData, isLoading, error, refetch } = useQuery({
    queryKey: ["kegiatan"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: MockKegiatan[] }>("/activities");
        return res.data;
      } catch {
        return mockApi.kegiatan.getAll();
      }
    },
  });

  const { data: opds } = useQuery({
    queryKey: ["opds"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: any[] }>("/master/opds");
        return res.data;
      } catch {
        return [];
      }
    },
  });

  const { data: contentTypes } = useQuery({
    queryKey: ["contentTypes"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: any[] }>("/master/content-types");
        return res.data;
      } catch {
        return [];
      }
    },
  });

  // Query Penugasan Data for real-time synchronization
  const { data: penugasanList = [] } = useQuery({
    queryKey: ["penugasan"],
    queryFn: mockApi.penugasan.getAll,
  });

  const getAssignedTasks = (title: string): MockPenugasan[] => {
    return penugasanList.filter((p) => p.kegiatanTerkait.toLowerCase() === title.toLowerCase());
  };

  const [items, setItems] = useState<MockKegiatan[]>([]);
  useEffect(() => {
    if (kegiatanData) setItems(kegiatanData);
  }, [kegiatanData]);

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

  const openEditDialog = (item: MockKegiatan) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      deadline: item.deadline,
      lokasi: item.lokasi ?? "",
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

  const toggleOutput = (opt: string) => {
    setForm((f) => ({
      ...f,
      outputDibutuhkan: f.outputDibutuhkan.includes(opt)
        ? f.outputDibutuhkan.filter((o) => o !== opt)
        : [...f.outputDibutuhkan, opt],
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.deadline) return;

    try {
      // Optional attempt to post to backend API
      await apiFetch("/activities", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          activityDate: form.deadline,
          opdId: opds?.find((o: any) => o.name === form.opdPenyelenggara)?.id,
          outputDibutuhkan: form.outputDibutuhkan,
        }),
      }).catch(() => {});
    } catch {}

    if (editingId) {
      setItems((prev) =>
        prev.map((k) =>
          k.id === editingId
            ? {
                ...k,
                title: form.title.trim(),
                deadline: form.deadline,
                prioritas: form.prioritas,
                lokasi: form.lokasi.trim() || undefined,
                opdPenyelenggara: form.opdPenyelenggara || undefined,
                outputDibutuhkan: form.outputDibutuhkan.length ? form.outputDibutuhkan : undefined,
              }
            : k,
        ),
      );
    } else {
      const newKegiatan: MockKegiatan = {
        id: `k-${Date.now()}`,
        title: form.title.trim(),
        status: "pending",
        progress: 0,
        deadline: form.deadline,
        prioritas: form.prioritas,
        lokasi: form.lokasi.trim() || undefined,
        opdPenyelenggara: form.opdPenyelenggara || undefined,
        outputDibutuhkan: form.outputDibutuhkan.length ? form.outputDibutuhkan : undefined,
      };
      setItems((prev) => [newKegiatan, ...prev]);
    }
    closeDialog();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Hapus kegiatan ini? Tindakan ini tidak bisa dibatalkan.")) {
      setItems((prev) => prev.filter((k) => k.id !== id));
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-5 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agenda Kegiatan</h2>
          <p className="text-sm text-gray-500">Kelola jadwal kegiatan (Satu Kegiatan = Satu Data Induk)</p>
        </div>
        <Button variant="default" onClick={() => openAddDialog()} className="gap-1.5 bg-[#0f1f5c] hover:bg-[#162a7a] text-white">
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
            statusFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
              statusFilter === st ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400">
            <Inbox className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Tidak ada kegiatan ditemukan.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => openEditDialog(item)}
              className="bg-white border border-gray-200 hover:border-blue-300 rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant={STATUS_BADGE_VARIANT[item.status]}>{STATUS_LABELS[item.status]}</Badge>
                  <Badge variant={PRIORITAS_BADGE_VARIANT[item.prioritas]}>{item.prioritas}</Badge>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">{item.title}</h3>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>{formatTanggal(item.deadline)}</span>
                  </div>
                  {item.lokasi && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{item.lokasi}</span>
                    </div>
                  )}
                  {item.opdPenyelenggara && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{item.opdPenyelenggara}</span>
                    </div>
                  )}
                </div>
                {item.outputDibutuhkan && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.outputDibutuhkan.map((out) => (
                      <span key={out} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                        {out}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-1">
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

      <Dialog open={isModalOpen} onClose={closeDialog} title={editingId ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Nama Kegiatan</label>
            <Input
              placeholder="Contoh: Rapat Koordinasi SPBE..."
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Tanggal Pelaksanaan</label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Prioritas</label>
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
          <div>
            <label className="text-sm font-medium text-gray-700">Lokasi</label>
            <Input
              placeholder="Contoh: Ruang Rapat Lt. 2 Balai Kota"
              value={form.lokasi}
              onChange={(e) => setForm((f) => ({ ...f, lokasi: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">OPD Penyelenggara</label>
            <Input
              placeholder="Contoh: Diskominfo / Dispendik"
              value={form.opdPenyelenggara}
              onChange={(e) => setForm((f) => ({ ...f, opdPenyelenggara: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Output yang Dibutuhkan</label>
            <div className="grid grid-cols-2 gap-2">
              {OUTPUT_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.outputDibutuhkan.includes(opt)}
                    onChange={() => toggleOutput(opt)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {editingId && (
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  👥 Penugasan Tim Terkait ({getAssignedTasks(form.title).length})
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
                      className="bg-white rounded-lg p-2 text-xs flex items-center justify-between border border-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[9px] flex items-center justify-center">
                          {t.picAvatar ?? t.pic.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="font-medium text-gray-800">{t.pic}</span>
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

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={closeDialog}>
              Batal
            </Button>
            <Button variant="default" disabled={!form.title.trim() || !form.deadline} onClick={handleSave} className="bg-[#0f1f5c] text-white">
              {editingId ? "Simpan Perubahan" : "Simpan Kegiatan"}
            </Button>
          </div>
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
                    <p className="text-sm font-medium text-gray-900 truncate">{k.title}</p>
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
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-2">
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
    </div>
  );
};

export default KegiatanPage;

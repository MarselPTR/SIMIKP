import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  LayoutGrid,
  Rows3,
  Plus,
  Trash2,
  Pencil,
  MapPin,
  Building2,
  Inbox,
  X,
  CalendarDays,
} from "lucide-react";
import { mockApi } from "../../lib/mock-api";
import type { MockKegiatan } from "../../lib/mock-data";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import Select from "../../components/ui/Select";
import { LoadingSpinner, ErrorState } from "../../components/shared/StateComponents";
import EventCalendar from "../../components/shared/EventCalendar";
import type { CalendarEvent } from "../../components/shared/EventCalendar";

const STATUS_COLORS: Record<MockKegiatan["status"], string> = {
  active: "#22c55e",
  review: "#f59e0b",
  done: "#9ca3af",
  pending: "#3b82f6",
};

const STATUS_LABELS: Record<MockKegiatan["status"], string> = {
  active: "Aktif",
  review: "Review",
  done: "Selesai",
  pending: "Pending",
};

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

const OUTPUT_OPTIONS = ["Naskah Berita", "Foto", "Video", "Reels"];

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

const KegiatanPage = () => {
  const { data: kegiatanData, isLoading, error, refetch } = useQuery({
    queryKey: ["kegiatan"],
    queryFn: mockApi.kegiatan.getAll,
  });

  // Salinan lokal yang bisa ditambah/diubah dari kalender/dialog — mock API
  // tidak punya endpoint create/update, jadi disimpan di state komponen ini.
  const [items, setItems] = useState<MockKegiatan[]>([]);
  useEffect(() => {
    if (kegiatanData) setItems(kegiatanData);
  }, [kegiatanData]);

  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("all");
  const [statusFilter, setStatusFilter] = useState<MockKegiatan["status"] | "all">("all");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

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
    // Simplistic filter mock
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

  const handleSave = () => {
    if (!form.title.trim() || !form.deadline) return;

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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agenda Kegiatan</h2>
          <p className="text-sm text-gray-500">Kelola jadwal kegiatan (Satu Kegiatan = Satu Data Induk)</p>
        </div>
        <Button variant="default" onClick={() => openAddDialog()} className="gap-1.5">
          <Plus className="w-4 h-4" /> Tambah Kegiatan
        </Button>
      </div>

      <EventCalendar
        year={calYear}
        month={calMonth}
        events={calendarEvents}
        legend={calendarLegend}
        subtitle="Klik tanggal untuk menambahkan kegiatan baru pada hari itu"
        onNavigate={(y, m) => {
          setCalYear(y);
          setCalMonth(m);
        }}
        onDayClick={(dateKey) => openAddDialog(dateKey)}
      />

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Cari kegiatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors duration-150"
                aria-label="Bersihkan pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: "today", label: "Hari Ini" },
              { key: "tomorrow", label: "Besok" },
              { key: "this_week", label: "Minggu Ini" },
              { key: "all", label: "Semua" },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterDate(f.key)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                  filterDate === f.key
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="ml-auto flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              aria-label="Tampilan tabel"
              className={`p-1.5 rounded-md transition-all duration-150 ${
                viewMode === "table" ? "bg-white shadow-sm text-indigo-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Rows3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              aria-label="Tampilan kartu"
              className={`p-1.5 rounded-md transition-all duration-150 ${
                viewMode === "card" ? "bg-white shadow-sm text-indigo-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status quick filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-gray-50">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${
              statusFilter === "all" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Semua Status
            <span className="opacity-70">{items.length}</span>
          </button>
          {(Object.keys(STATUS_LABELS) as MockKegiatan["status"][]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
              className="inline-flex items-center gap-1.5 rounded-full pl-2 pr-3 py-1 text-xs font-medium transition-all duration-150"
              style={
                statusFilter === status
                  ? { backgroundColor: STATUS_COLORS[status], color: "white" }
                  : { backgroundColor: `${STATUS_COLORS[status]}14`, color: STATUS_COLORS[status] }
              }
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: statusFilter === status ? "white" : STATUS_COLORS[status] }}
              />
              {STATUS_LABELS[status]}
              <span className="opacity-70">{statusCounts[status]}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 px-1">
        Menampilkan <span className="font-medium text-gray-600">{filtered.length}</span> dari{" "}
        <span className="font-medium text-gray-600">{items.length}</span> kegiatan
      </p>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6 text-gray-300" />
          </div>
          <h4 className="text-base font-medium text-gray-900">Tidak ada kegiatan ditemukan</h4>
          <p className="text-sm text-gray-500 mt-1 max-w-xs">
            Coba ubah kata kunci pencarian atau filter, atau tambahkan kegiatan baru.
          </p>
          <Button variant="default" className="mt-4 gap-1.5" onClick={() => openAddDialog()}>
            <Plus className="w-4 h-4" /> Tambah Kegiatan
          </Button>
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Judul Kegiatan</th>
                  <th className="px-4 py-3 text-left">OPD Penyelenggara</th>
                  <th className="px-4 py-3 text-left">Output</th>
                  <th className="px-4 py-3 text-left">Prioritas</th>
                  <th className="px-4 py-3 text-left">Lokasi</th>
                  <th className="px-4 py-3 text-left">Tanggal</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => openEditDialog(row)}
                    className="group cursor-pointer transition-colors duration-150 hover:bg-blue-50/40"
                  >
                    <td className="px-4 py-3 text-gray-800 font-medium">{row.title}</td>
                    <td className="px-4 py-3 text-gray-600">{row.opdPenyelenggara || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{row.outputDibutuhkan?.join(", ") || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={PRIORITAS_BADGE_VARIANT[row.prioritas]}>{row.prioritas}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.lokasi || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatTanggal(row.deadline)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE_VARIANT[row.status]}>{STATUS_LABELS[row.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(row);
                          }}
                          className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-150"
                          aria-label={`Edit ${row.title}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(row.id, e)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
                          aria-label={`Hapus ${row.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((row) => (
            <div
              key={row.id}
              onClick={() => openEditDialog(row)}
              className="group relative bg-white rounded-xl border border-gray-200 shadow-sm p-4 cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200"
            >
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditDialog(row);
                  }}
                  className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-150"
                  aria-label={`Edit ${row.title}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(row.id, e)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
                  aria-label={`Hapus ${row.title}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="pr-14">
                <Badge variant={PRIORITAS_BADGE_VARIANT[row.prioritas]}>{row.prioritas}</Badge>
              </div>
              <h4 className="mt-2 text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{row.title}</h4>

              <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                {row.opdPenyelenggara && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{row.opdPenyelenggara}</span>
                  </div>
                )}
                {row.lokasi && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{row.lokasi}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                  <span>{formatTanggal(row.deadline)}</span>
                </div>
              </div>

              {row.outputDibutuhkan && row.outputDibutuhkan.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {row.outputDibutuhkan.map((o) => (
                    <span key={o} className="text-[10px] font-medium text-gray-500 bg-gray-50 rounded px-1.5 py-0.5">
                      {o}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-50">
                <Badge variant={STATUS_BADGE_VARIANT[row.status]}>{STATUS_LABELS[row.status]}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onClose={closeDialog} title={editingId ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Nama Kegiatan</label>
            <Input
              placeholder="Contoh: Upacara Hari Jadi Kota"
              className="mt-1"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tanggal</label>
              <Input
                type="date"
                className="mt-1"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Lokasi</label>
              <Input
                placeholder="Contoh: Balaikota"
                className="mt-1"
                value={form.lokasi}
                onChange={(e) => setForm((f) => ({ ...f, lokasi: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">OPD Penyelenggara</label>
              <Select
                options={[
                  { value: "Diskominfo", label: "Diskominfo" },
                  { value: "Dinas Pendidikan", label: "Dinas Pendidikan" },
                  { value: "Dinas Kesehatan", label: "Dinas Kesehatan" },
                ]}
                placeholder="Pilih OPD"
                className="mt-1"
                value={form.opdPenyelenggara}
                onChange={(e) => setForm((f) => ({ ...f, opdPenyelenggara: e.target.value }))}
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
            <label className="text-sm font-medium text-gray-700 mb-2 block">Output yang Dibutuhkan</label>
            <div className="grid grid-cols-2 gap-2">
              {OUTPUT_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.outputDibutuhkan.includes(opt)}
                    onChange={() => toggleOutput(opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={closeDialog}>Batal</Button>
            <Button variant="default" disabled={!form.title.trim() || !form.deadline} onClick={handleSave}>
              {editingId ? "Simpan Perubahan" : "Simpan Kegiatan"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default KegiatanPage;

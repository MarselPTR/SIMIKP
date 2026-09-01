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
} from "lucide-react";
import { apiFetch } from "../../lib/api-client";
import { mockKegiatan, KEGIATAN_STATUS_COLORS, KEGIATAN_STATUS_LABELS } from "../../lib/mock-data";
import type { MockKegiatan, MockPenugasan } from "../../lib/mock-data";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import Select from "../../components/ui/Select";
import { LoadingSpinner, ErrorState } from "../../components/shared/StateComponents";
import EventCalendar from "../../components/shared/EventCalendar";
import type { CalendarEvent } from "../../components/shared/EventCalendar";
import { useLanguage } from "../../lib/LanguageContext";

const STATUS_COLORS = KEGIATAN_STATUS_COLORS;

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

const formatTanggal = (iso: string, lang: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(lang === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const formatTanggalPanjang = (iso: string, lang: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(lang === "en" ? "en-US" : "id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const KegiatanPage = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MockKegiatan["status"] | "all">("all");
  const [filterDate, setFilterDate] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [viewDateKey, setViewDateKey] = useState<string | null>(null);

  const getStatusLabel = (status: MockKegiatan["status"]) => {
    if (language === "en") {
      if (status === "active") return "Active";
      if (status === "review") return "Review";
      if (status === "done") return "Done";
      return "Pending";
    }
    return KEGIATAN_STATUS_LABELS[status] || status;
  };

  const getPriorityLabel = (prio: MockKegiatan["prioritas"]) => {
    if (language === "en") {
      if (prio === "Tinggi") return "High";
      if (prio === "Sedang") return "Medium";
      return "Low";
    }
    return prio;
  };

  const { data: opds } = useQuery({
    queryKey: ["opds"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ data: any[] }>("/opds");
        return res.data;
      } catch {
        return [];
      }
    },
  });

  const { data: activitiesResponse, isLoading, error, refetch } = useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ data: any[] }>("/activities");
        if (res.data && res.data.length > 0) return res;
        return { data: mockKegiatan };
      } catch {
        return { data: mockKegiatan };
      }
    },
  });

  const { data: penugasanResponse } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ data: any[] }>("/assignments");
        return res;
      } catch {
        return { data: [] };
      }
    },
  });

  const items: MockKegiatan[] = useMemo(() => {
    if (!activitiesResponse?.data) return mockKegiatan;
    return activitiesResponse.data.map((item: any) => ({
      id: item.id,
      title: item.title,
      deadline: item.activityDate ? item.activityDate.split("T")[0] : todayStr(),
      status: (item.status?.toLowerCase() as MockKegiatan["status"]) || "active",
      lokasi: item.location || "",
      opdPenyelenggara: item.opd?.name || item.opdPenyelenggara || "",
      prioritas: (item.priority as MockKegiatan["prioritas"]) || "Sedang",
      outputDibutuhkan: item.outputDibutuhkan || ["Naskah Berita"],
      deskripsi: item.description || "",
      progress: item.progress || 0,
    }));
  }, [activitiesResponse]);

  const assignmentsList: MockPenugasan[] = useMemo(() => {
    return penugasanResponse?.data || [];
  }, [penugasanResponse]);

  const getAssignedTasks = (kegiatanTitle: string) => {
    return assignmentsList.filter(
      (a) => (a.kegiatanTerkait || (a as any).kegiatan || "").toLowerCase().trim() === kegiatanTitle.toLowerCase().trim(),
    );
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      counts[item.status] = (counts[item.status] || 0) + 1;
    });
    return counts;
  }, [items]);

  const calendarEvents = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const item of items) {
      if (!item.deadline) continue;
      const list = map[item.deadline] ?? (map[item.deadline] = []);
      list.push({ color: STATUS_COLORS[item.status], label: item.title });
    }
    return map;
  }, [items]);

  const calendarLegend = useMemo(() => {
    return (Object.keys(KEGIATAN_STATUS_LABELS) as MockKegiatan["status"][]).map((status) => ({
      label: getStatusLabel(status),
      color: STATUS_COLORS[status],
    }));
  }, [language]);

  const tugasPadaTanggal = useMemo(() => {
    if (!viewDateKey) return [];
    return items.filter((k) => k.deadline === viewDateKey);
  }, [items, viewDateKey]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;

      if (filterDate !== "all") {
        const today = todayStr();
        const itemDate = item.deadline;
        if (filterDate === "today" && itemDate !== today) return false;
        if (filterDate === "tomorrow") {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          if (itemDate !== tomorrow) return false;
        }
        if (filterDate === "this_week") {
          const nowD = new Date();
          const day = nowD.getDay();
          const diff = nowD.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(nowD.setDate(diff));
          const sunday = new Date(nowD.setDate(diff + 6));
          const monStr = monday.toISOString().split("T")[0];
          const sunStr = sunday.toISOString().split("T")[0];
          if (itemDate < monStr || itemDate > sunStr) return false;
        }
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchLokasi = item.lokasi?.toLowerCase().includes(q);
        const matchOpd = item.opdPenyelenggara?.toLowerCase().includes(q);
        return matchTitle || matchLokasi || matchOpd;
      }

      return true;
    });
  }, [items, statusFilter, filterDate, search]);

  const openAddDialog = (presetDate?: string) => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      deadline: presetDate ?? todayStr(),
    });
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
      location: form.lokasi.trim() || undefined,
      priority: form.prioritas,
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t("kegiatan_delete_confirm"))) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <LoadingSpinner text={t("loading")} />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-5 pb-12 animate-fade-in text-gray-900 dark:text-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-[#0f1f5c] dark:text-sky-400">{t("kegiatan_title")}</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{t("kegiatan_subtitle")}</p>
        </div>
        <Button variant="default" onClick={() => openAddDialog()} className="gap-1.5 bg-[#0f1f5c] dark:bg-blue-600 hover:bg-[#162a7a] dark:hover:bg-blue-700 text-white shadow-xs">
          <Plus className="w-4 h-4" /> {t("kegiatan_add_btn")}
        </Button>
      </div>

      <EventCalendar
        year={calYear}
        month={calMonth}
        events={calendarEvents}
        legend={calendarLegend}
        subtitle={t("dash_activity_calendar_desc")}
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
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            statusFilter === "all" ? "bg-[#0f1f5c] dark:bg-blue-600 text-white shadow-xs" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          {t("all")} ({items.length})
        </button>
        {(Object.keys(KEGIATAN_STATUS_LABELS) as MockKegiatan["status"][]).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === st ? "bg-[#0f1f5c] dark:bg-blue-600 text-white shadow-xs" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {getStatusLabel(st)} ({statusCounts[st] ?? 0})
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <Input
            placeholder={t("kegiatan_search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          options={[
            { value: "all", label: language === "en" ? "All Time" : "Semua Waktu" },
            { value: "today", label: language === "en" ? "Today" : "Hari Ini" },
            { value: "tomorrow", label: language === "en" ? "Tomorrow" : "Besok" },
            { value: "this_week", label: language === "en" ? "This Week" : "Minggu Ini" },
          ]}
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-full sm:w-44"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-[#161b22] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            <Inbox className="w-12 h-12 mx-auto mb-2 opacity-50 text-gray-400 dark:text-gray-600" />
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{t("kegiatan_empty")}</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => openEditDialog(item)}
              className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-sky-500 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant={STATUS_BADGE_VARIANT[item.status]}>{getStatusLabel(item.status)}</Badge>
                  <Badge variant={PRIORITAS_BADGE_VARIANT[item.prioritas]}>{getPriorityLabel(item.prioritas)}</Badge>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-2">{item.title}</h3>
                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>{formatTanggal(item.deadline, language)}</span>
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
                      <span key={out} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-lg font-medium border dark:border-gray-700">
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
                  className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-sky-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition"
                  aria-label={t("edit")}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition"
                  aria-label={t("delete")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onClose={closeDialog} title={editingId ? t("kegiatan_modal_edit_title") : t("kegiatan_modal_add_title")}>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">{t("kegiatan_form_title")}</label>
            <Input
              placeholder={t("kegiatan_form_title_ph")}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">{t("kegiatan_form_date")}</label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">{t("kegiatan_form_priority")}</label>
              <Select
                options={[
                  { value: "Tinggi", label: language === "en" ? "High" : "Tinggi" },
                  { value: "Sedang", label: language === "en" ? "Medium" : "Sedang" },
                  { value: "Rendah", label: language === "en" ? "Low" : "Rendah" },
                ]}
                value={form.prioritas}
                onChange={(e) => setForm((f) => ({ ...f, prioritas: e.target.value as MockKegiatan["prioritas"] }))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">{t("kegiatan_form_location")}</label>
            <Input
              placeholder={t("kegiatan_form_location_ph")}
              value={form.lokasi}
              onChange={(e) => setForm((f) => ({ ...f, lokasi: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">{t("kegiatan_form_opd")}</label>
            <Input
              placeholder={t("kegiatan_form_opd_ph")}
              value={form.opdPenyelenggara}
              onChange={(e) => setForm((f) => ({ ...f, opdPenyelenggara: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block">{t("kegiatan_form_outputs")}</label>
            <div className="grid grid-cols-2 gap-2">
              {OUTPUT_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
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
            <div className="bg-gray-50 dark:bg-gray-900/60 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  👥 {language === "en" ? "Assigned Team Members" : "Penugasan Tim Terkait"} ({getAssignedTasks(form.title).length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    closeDialog();
                    navigate(`/penugasan?kegiatan=${encodeURIComponent(form.title)}&action=create`);
                  }}
                  className="text-xs text-indigo-600 dark:text-sky-400 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ {t("penugasan_add_btn")}</span>
                </button>
              </div>

              {getAssignedTasks(form.title).length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  {language === "en" ? "No officers assigned to this activity yet." : "Belum ada staf yang ditugaskan untuk kegiatan ini."}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {getAssignedTasks(form.title).map((t) => (
                    <div
                      key={t.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-2 text-xs flex items-center justify-between border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-sky-300 font-bold text-[9px] flex items-center justify-center">
                          {t.picAvatar ?? t.pic.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{t.pic}</span>
                        <span className="text-gray-400">({t.jenisKonten})</span>
                      </div>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
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
              {t("cancel")}
            </Button>
            <Button variant="default" disabled={!form.title.trim() || !form.deadline} onClick={handleSave} className="bg-[#0f1f5c] dark:bg-blue-600 text-white">
              {editingId ? t("save_changes") : t("save")}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={viewDateKey !== null}
        onClose={() => setViewDateKey(null)}
        title={viewDateKey ? formatTanggalPanjang(viewDateKey, language) : t("dash_activity_details")}
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
                  className="w-full text-left flex items-start gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 p-3.5 transition-all duration-150 hover:border-blue-200 dark:hover:border-sky-500 hover:bg-blue-50/40 dark:hover:bg-gray-800/60 cursor-pointer"
                >
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[k.status] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{k.title}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <Badge variant={STATUS_BADGE_VARIANT[k.status]}>{getStatusLabel(k.status)}</Badge>
                      <Badge variant={PRIORITAS_BADGE_VARIANT[k.prioritas]}>{getPriorityLabel(k.prioritas)}</Badge>
                      {k.lokasi && <span className="text-xs text-gray-400 truncate">{k.lokasi}</span>}
                    </div>
                  </div>
                  <Pencil className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-1" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-2">
                <Inbox className="w-5 h-5 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("dash_no_activities_today")}</p>
            </div>
          )}

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setViewDateKey(null)}>
              {t("close")}
            </Button>
            <Button
              variant="default"
              className="gap-1.5 bg-[#0f1f5c] dark:bg-blue-600 text-white"
              onClick={() => {
                const date = viewDateKey ?? undefined;
                setViewDateKey(null);
                openAddDialog(date);
              }}
            >
              <Plus className="w-4 h-4" /> {t("kegiatan_add_btn")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default KegiatanPage;

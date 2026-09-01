import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api-client";
import { mockPenugasan, mockKegiatan, mockUsers, Role } from "../../lib/mock-data";
import type { MockPenugasan } from "../../lib/mock-data";
import { useToast } from "../../contexts/ToastContext";
import { useLanguage } from "../../lib/LanguageContext";
import Dialog from "../../components/ui/Dialog";
import Button from "../../components/ui/Button";
import { LoadingSpinner, ErrorState } from "../../components/shared/StateComponents";
import {
  Search,
  Plus,
  AlertTriangle,
  Clock,
  MapPin,
  FileText,
  User,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "../../components/ui/status-badge";
import {
  RiEditLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiArrowUpDownLine,
  RiCheckLine,
  RiTimeLine,
  RiHourglassLine,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
} from "@remixicon/react";

export default function PenugasanPage() {
  const { addToast } = useToast();
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Query Penugasan Data
  const { data: initialData, isLoading, error, refetch } = useQuery({
    queryKey: ["penugasan-page"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: any[] }>("/assignments");
        if (res.data && res.data.length > 0) {
          return res.data.map((a: any) => ({
            id: a.id,
            kegiatanTerkait: a.activityTitle || a.activity?.title || "Kegiatan",
            tanggalKegiatan: a.activityDate || "2026-08-27",
            pic: a.picName || a.user?.name || "Petugas",
            picAvatar: a.picName ? a.picName.slice(0, 2).toUpperCase() : "PT",
            jenisKonten: a.contentType || "Dokumentasi",
            jamMulai: a.startTime || "08:00",
            jamSelesai: a.endTime || "12:00",
            status:
              a.status === "COMPLETED"
                ? "done"
                : a.status === "IN_PROGRESS"
                ? "in-progress"
                : a.status === "CONFLICT"
                ? "conflict"
                : "pending",
            lokasi: a.location || "Batu",
            catatan: a.instruction,
          })) as MockPenugasan[];
        }
        return mockPenugasan;
      } catch (err) {
        console.warn("Backend unavailable, fallback to mockPenugasan", err);
        return mockPenugasan;
      }
    },
  });

  const { data: petugasList } = useQuery({
    queryKey: ["petugas"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: any[] }>("/users/petugas");
        if (res.data && res.data.length > 0) return res.data;
        return mockUsers
          .filter((u) => u.role === Role.PETUGAS)
          .map((u) => ({ id: u.id, name: u.name, staffType: u.bidang }));
      } catch {
        return mockUsers
          .filter((u) => u.role === Role.PETUGAS)
          .map((u) => ({ id: u.id, name: u.name, staffType: u.bidang }));
      }
    },
  });

  // Query Kegiatan Data for real-time synchronization
  const { data: kegiatanList = [] } = useQuery({
    queryKey: ["kegiatan"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: any[] }>("/activities");
        if (res.data && res.data.length > 0) return res.data;
        return mockKegiatan;
      } catch {
        return mockKegiatan;
      }
    },
  });

  const items: MockPenugasan[] = Array.isArray(initialData) 
    ? initialData 
    : (initialData as any)?.data || [];

  // Filters, sorting & selection
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") ?? "");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>("kegiatanTerkait");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MockPenugasan | null>(null);

  // Helper format date for display
  const formatIndoDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatSubtitleDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "(Hari H)";
      const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      return `(${days[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1})`;
    } catch {
      return "(Hari H)";
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    kegiatanTerkait: "",
    tanggalKegiatan: "",
    jenisKonten: "Foto",
    pic: "Budi Fotografer",
    picAvatar: "BF",
    jamMulai: "08:00",
    jamSelesai: "10:00",
    waktuSubtitle: "(Senin, 24/8)",
    status: "in-progress" as MockPenugasan["status"],
    lokasi: "Balaikota Among Tani",
    catatan: "",
  });

  // Handle URL pre-fill from Kegiatan Page
  useEffect(() => {
    const kegParam = searchParams.get("kegiatan");
    const actionParam = searchParams.get("action");
    if (kegParam) {
      const found = kegiatanList.find(
        (k) => k.title.toLowerCase() === kegParam.toLowerCase()
      );
      if (found) {
        setFormData({
          kegiatanTerkait: found.title,
          tanggalKegiatan: formatIndoDate(found.deadline),
          waktuSubtitle: formatSubtitleDate(found.deadline),
          jenisKonten: found.outputDibutuhkan?.[0] ?? "Foto",
          pic: "Budi Fotografer",
          picAvatar: "BF",
          jamMulai: "08:30",
          jamSelesai: "11:00",
          status: "in-progress",
          lokasi: found.lokasi ?? "Balaikota Among Tani",
          catatan: `Penugasan untuk kegiatan ${found.title} (${found.opdPenyelenggara ?? "OPD"})`,
        });
      } else {
        setFormData((prev) => ({
          ...prev,
          kegiatanTerkait: kegParam,
          catatan: `Penugasan untuk agenda ${kegParam}`,
        }));
      }

      if (actionParam === "create") {
        setIsCreateOpen(true);
      }
    }
  }, [searchParams, kegiatanList]);

  // Sync search state with URL params
  useEffect(() => {
    if (searchQuery) {
      setSearchParams({ search: searchQuery });
    } else {
      setSearchParams({});
    }
  }, [searchQuery, setSearchParams]);

  // Options for form
  const PIC_OPTIONS = [
    { name: "Budi Fotografer", role: "Fotografer", avatar: "BF" },
    { name: "Citra Videografer", role: "Videografer", avatar: "CV" },
    { name: "Andi Penulis", role: "Pranata Humas / Berita", avatar: "AP" },
    { name: "Dewi Desainer", role: "Desainer Grafis", avatar: "DD" },
    { name: "Eko Reporter", role: "Reporter Lapangan", avatar: "ER" },
  ];

  const JENIS_KONTEN_OPTIONS = [
    "Foto",
    "Video",
    "Naskah Berita",
    "Reels / TikTok",
    "Infografis",
    "Live Streaming",
  ];

  // Tab Status Counts (Solid & Real-time by item.status)
  const counts = useMemo(() => {
    return {
      all: items.length,
      inProgress: items.filter((i) => i.status === "in-progress").length,
      done: items.filter((i) => i.status === "done").length,
      pending: items.filter((i) => i.status === "pending").length,
      conflict: items.filter((i) => i.status === "conflict").length,
    };
  }, [items]);

  // Conflict detection in form
  const formConflict = useMemo(() => {
    if (!formData.pic || !formData.jamMulai || !formData.jamSelesai) return null;

    const startNum = parseInt(formData.jamMulai.replace(":", ""), 10);
    const endNum = parseInt(formData.jamSelesai.replace(":", ""), 10);

    const conflict = items.find((item) => {
      if (selectedItem && item.id === selectedItem.id) return false;
      if (item.pic !== formData.pic) return false;

      const itemStart = parseInt(item.jamMulai.replace(":", ""), 10);
      const itemEnd = parseInt(item.jamSelesai.replace(":", ""), 10);

      return Math.max(startNum, itemStart) < Math.min(endNum, itemEnd);
    });

    if (conflict) {
      return `${formData.pic} sudah memiliki penugasan pada '${conflict.kegiatanTerkait}' (${conflict.jamMulai} - ${conflict.jamSelesai}). Terjadi bentrok jadwal.`;
    }
    return null;
  }, [formData, items, selectedItem]);

  // Toggle sort
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filtered & Sorted Items
  const filteredItems = useMemo(() => {
    let list = items.filter((item) => {
      if (activeTab === "in-progress" && item.status !== "in-progress") return false;
      if (activeTab === "done" && item.status !== "done") return false;
      if (activeTab === "pending" && item.status !== "pending") return false;
      if (activeTab === "conflict" && item.status !== "conflict") return false;

      const matchSearch =
        searchQuery.trim() === "" ||
        item.kegiatanTerkait.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.jenisKonten.toLowerCase().includes(searchQuery.toLowerCase());

      return matchSearch;
    });

    list = [...list].sort((a, b) => {
      const recA = a as unknown as Record<string, unknown>;
      const recB = b as unknown as Record<string, unknown>;
      const valA = recA[sortField] ?? "";
      const valB = recB[sortField] ?? "";

      if (typeof valA === "string" && typeof valB === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return 0;
    });

    return list;
  }, [items, activeTab, searchQuery, sortField, sortAsc]);

  // Pagination slice
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedItems.map((it) => it.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((it) => selectedIds.includes(it.id));
  const isSomeSelected =
    paginatedItems.some((it) => selectedIds.includes(it.id)) && !isAllSelected;

  // Bulk Actions
  const handleBulkMarkStatus = async (status: MockPenugasan["status"]) => {
    if (selectedIds.length === 0) return;
    
    try {
      const dbStatus = status === "done" ? "COMPLETED" : status === "in-progress" ? "IN_PROGRESS" : "ASSIGNED";
      await Promise.all(
        selectedIds.map(id => 
          apiFetch(`/assignments/${id}`, {
            method: "PUT",
            body: JSON.stringify({ status: dbStatus })
          })
        )
      );
      addToast(`Status ${selectedIds.length} penugasan berhasil diubah.`, "success");
      setSelectedIds([]);
      refetch();
    } catch (e) {
      addToast("Gagal mengubah status secara massal.", "error");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Yakin ingin menghapus ${selectedIds.length} penugasan terpilih?`)) return;
    
    try {
      await Promise.all(
        selectedIds.map(id => 
          apiFetch(`/assignments/${id}`, { method: "DELETE" })
        )
      );
      addToast(`${selectedIds.length} penugasan berhasil dihapus.`, "success");
      setSelectedIds([]);
      refetch();
    } catch (e) {
      addToast("Gagal menghapus penugasan.", "error");
    }
  };

  // Handler Open Create
  const handleOpenCreate = () => {
    setSelectedItem(null);
    setFormData({
      kegiatanTerkait: "Upacara Hari Jadi Kota",
      tanggalKegiatan: "Senin, 24 Agustus 2026",
      jenisKonten: "Foto",
      pic: "Budi Fotografer",
      picAvatar: "BF",
      jamMulai: "08:00",
      jamSelesai: "10:00",
      waktuSubtitle: "(Senin, 24/8)",
      status: "in-progress",
      lokasi: "Balaikota Among Tani",
      catatan: "",
    });
    setIsCreateOpen(true);
  };

  // Handler Open Edit
  const handleOpenEdit = (item: MockPenugasan) => {
    setSelectedItem(item);
    setFormData({
      kegiatanTerkait: item.kegiatanTerkait,
      tanggalKegiatan: item.tanggalKegiatan ?? "Senin, 24 Agustus 2026",
      jenisKonten: item.jenisKonten,
      pic: item.pic,
      picAvatar: item.picAvatar ?? "BF",
      jamMulai: item.jamMulai,
      jamSelesai: item.jamSelesai,
      waktuSubtitle: item.waktuSubtitle ?? "(Senin, 24/8)",
      status: item.status,
      lokasi: item.lokasi ?? "Kantor Pemkot Batu",
      catatan: item.catatan ?? "",
    });
    setIsEditOpen(true);
  };

  // Handler Open Detail
  const handleOpenDetail = (item: MockPenugasan) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  // Handler Open Delete
  const handleOpenDelete = (item: MockPenugasan) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  // Save Create
  const handleSaveCreate = async () => {
    if (!formData.kegiatanTerkait.trim()) {
      addToast("Mohon isi nama kegiatan terkait", "warning");
      return;
    }

    const activity = kegiatanList.find(k => k.title === formData.kegiatanTerkait);
    const picUser = petugasList?.find((p: any) => p.name === formData.pic);

    try {
      await apiFetch("/assignments", {
        method: "POST",
        body: JSON.stringify({
          activityId: activity?.id,
          picId: picUser?.id,
          contentType: formData.jenisKonten,
          startTime: formData.jamMulai,
          endTime: formData.jamSelesai,
          instruction: formData.catatan,
          status: "ASSIGNED",
          location: formData.lokasi,
          activityDate: formData.tanggalKegiatan,
        }),
      });
      addToast("Penugasan baru berhasil dibuat.", "success");
      refetch();
      setIsCreateOpen(false);
    } catch (e) {
      addToast("Gagal membuat penugasan", "error");
    }
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    if (!formData.kegiatanTerkait.trim()) {
      addToast("Mohon isi nama kegiatan terkait", "warning");
      return;
    }
    
    const activity = kegiatanList.find(k => k.title === formData.kegiatanTerkait);
    const picUser = petugasList?.find((p: any) => p.name === formData.pic);

    try {
      await apiFetch(`/assignments/${selectedItem.id}`, {
        method: "PUT",
        body: JSON.stringify({
          activityId: activity?.id,
          picId: picUser?.id,
          contentType: formData.jenisKonten,
          startTime: formData.jamMulai,
          endTime: formData.jamSelesai,
          instruction: formData.catatan,
          status: formData.status === "in-progress" ? "IN_PROGRESS" : formData.status === "done" ? "COMPLETED" : "ASSIGNED",
          location: formData.lokasi,
          activityDate: formData.tanggalKegiatan,
        }),
      });
      addToast("Perubahan penugasan berhasil disimpan.", "success");
      refetch();
      setIsEditOpen(false);
    } catch (e) {
      addToast("Gagal menyimpan penugasan", "error");
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    try {
      await apiFetch(`/assignments/${selectedItem.id}`, { method: "DELETE" });
      addToast(`Penugasan "${selectedItem.kegiatanTerkait}" telah dihapus.`, "info");
      refetch();
      setIsDeleteOpen(false);
    } catch (e) {
      addToast("Gagal menghapus penugasan", "error");
    }
  };

  if (isLoading) return <LoadingSpinner text={t("loading")} />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-gray-900 dark:text-gray-100">
      {/* ── Header Title & Description ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0f1f5c] dark:text-sky-400 tracking-tight">
            {t("penugasan_title")}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("penugasan_subtitle")}
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0f1f5c] dark:bg-blue-600 hover:bg-[#0a1540] dark:hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition active:scale-[0.98] self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t("penugasan_add_btn")}</span>
        </button>
      </div>

      {/* ── Main Container / Card ── */}
      <div className="bg-white dark:bg-[#161b22] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        {/* ── 1. Top Tabs dengan Counter Real-Time ── */}
        <div className="flex items-center gap-8 px-6 pt-4 border-b border-gray-200 dark:border-gray-800 overflow-x-auto text-xs sm:text-sm">
          {/* Tab Semua */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
            className={`pb-3.5 flex items-center gap-2 font-bold transition relative whitespace-nowrap cursor-pointer ${
              activeTab === "all"
                ? "text-[#0f1f5c] dark:text-sky-400 border-b-2 border-[#0f1f5c] dark:border-sky-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <span>{t("all")}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "all"
                  ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-sky-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              }`}
            >
              {counts.all}
            </span>
          </button>

          {/* Tab Proses */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("in-progress");
              setCurrentPage(1);
            }}
            className={`pb-3.5 flex items-center gap-2 font-bold transition relative whitespace-nowrap cursor-pointer ${
              activeTab === "in-progress"
                ? "text-[#0f1f5c] dark:text-sky-400 border-b-2 border-[#0f1f5c] dark:border-sky-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <span>{t("in_progress")}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "in-progress"
                  ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              }`}
            >
              {counts.inProgress}
            </span>
          </button>

          {/* Tab Selesai */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("done");
              setCurrentPage(1);
            }}
            className={`pb-3.5 flex items-center gap-2 font-bold transition relative whitespace-nowrap cursor-pointer ${
              activeTab === "done"
                ? "text-[#0f1f5c] dark:text-sky-400 border-b-2 border-[#0f1f5c] dark:border-sky-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <span>{t("done")}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "done"
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              }`}
            >
              {counts.done}
            </span>
          </button>

          {/* Tab Menunggu */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("pending");
              setCurrentPage(1);
            }}
            className={`pb-3.5 flex items-center gap-2 font-bold transition relative whitespace-nowrap cursor-pointer ${
              activeTab === "pending"
                ? "text-[#0f1f5c] dark:text-sky-400 border-b-2 border-[#0f1f5c] dark:border-sky-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <span>{t("pending")}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "pending"
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              }`}
            >
              {counts.pending}
            </span>
          </button>

          {/* Tab Bentrok */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("conflict");
              setCurrentPage(1);
            }}
            className={`pb-3.5 flex items-center gap-2 font-bold transition relative whitespace-nowrap cursor-pointer ${
              activeTab === "conflict"
                ? "text-rose-600 dark:text-rose-400 border-b-2 border-rose-600 dark:border-rose-400"
                : "text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400"
            }`}
          >
            <span>{t("conflict")}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "conflict"
                  ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              }`}
            >
              {counts.conflict}
            </span>
          </button>
        </div>

        {/* ── 2. Toolbar: Search + Bulk Actions Bar ── */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={t("penugasan_search_ph")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition placeholder:text-gray-400"
            />
          </div>

          {/* Bulk Action Controls */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 animate-fadeIn">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {selectedIds.length} {language === "en" ? "selected:" : "dipilih:"}
              </span>
              <button
                onClick={() => handleBulkMarkStatus("done")}
                className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-1 transition cursor-pointer"
              >
                <RiCheckLine className="w-3.5 h-3.5" />
                <span>{t("done")}</span>
              </button>
              <button
                onClick={() => handleBulkMarkStatus("in-progress")}
                className="px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-1 transition cursor-pointer"
              >
                <RiTimeLine className="w-3.5 h-3.5" />
                <span>{t("in_progress")}</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-2.5 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-1 transition cursor-pointer"
              >
                <RiDeleteBinLine className="w-3.5 h-3.5" />
                <span>{t("delete")}</span>
              </button>
            </div>
          )}
        </div>

        {/* ── 3. Table Penugasan ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f1f5c] dark:bg-slate-900 text-white text-xs font-bold uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => toggleSort("kegiatanTerkait")}
                  className="py-3.5 px-4 cursor-pointer select-none hover:text-blue-200 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("penugasan_col_activity")}</span>
                    <RiArrowUpDownLine className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("pic")}
                  className="py-3.5 px-4 cursor-pointer select-none hover:text-blue-200 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("penugasan_col_officer")}</span>
                    <RiArrowUpDownLine className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("jenisKonten")}
                  className="py-3.5 px-4 cursor-pointer select-none hover:text-blue-200 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("penugasan_col_output")}</span>
                    <RiArrowUpDownLine className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("jamMulai")}
                  className="py-3.5 px-4 cursor-pointer select-none hover:text-blue-200 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("penugasan_col_time")}</span>
                    <RiArrowUpDownLine className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("status")}
                  className="py-3.5 px-4 cursor-pointer select-none hover:text-blue-200 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <RiArrowUpDownLine className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs sm:text-sm">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 dark:text-gray-500">
                    <p className="font-bold text-gray-600 dark:text-gray-400">Tidak ada penugasan ditemukan</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Coba ganti filter tab atau kata kunci pencarian.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors ${
                        isSelected ? "bg-indigo-50/40 dark:bg-blue-950/30" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(item.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Kegiatan Terkait */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900 dark:text-gray-100">{item.kegiatanTerkait}</div>
                        {item.lokasi && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{item.lokasi}</span>
                          </div>
                        )}
                      </td>

                      {/* Petugas PIC */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                            {item.picAvatar ?? item.pic.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{item.pic}</span>
                        </div>
                      </td>

                      {/* Jenis Konten */}
                      <td className="py-4 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        {item.jenisKonten}
                      </td>

                      {/* Waktu Penugasan */}
                      <td className="py-4 px-4">
                        <div className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">
                          {item.jamMulai} - {item.jamSelesai}
                        </div>
                        {item.waktuSubtitle && (
                          <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                            {item.waktuSubtitle}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {item.status === "in-progress" && (
                          <StatusBadge
                            status="default"
                            leftIcon={RiTimeLine}
                            leftLabel="Proses"
                            className="bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200/90 dark:border-amber-800 shadow-xs"
                          />
                        )}
                        {item.status === "done" && (
                          <StatusBadge
                            status="success"
                            leftIcon={RiCheckboxCircleFill}
                            leftLabel="Selesai"
                            className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200/90 dark:border-emerald-800 shadow-xs"
                          />
                        )}
                        {item.status === "pending" && (
                          <StatusBadge
                            status="default"
                            leftIcon={RiHourglassLine}
                            leftLabel="Menunggu"
                            className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200/90 dark:border-gray-700 shadow-xs"
                          />
                        )}
                        {item.status === "conflict" && (
                          <StatusBadge
                            status="error"
                            leftIcon={RiCloseCircleFill}
                            leftLabel="Bentrok"
                            className="bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200/90 dark:border-rose-800 shadow-xs"
                          />
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1 text-gray-400">
                          <button
                            onClick={() => handleOpenDetail(item)}
                            className="p-1.5 hover:text-indigo-600 dark:hover:text-sky-400 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-lg transition cursor-pointer"
                            title="Detail"
                          >
                            <RiEyeLine className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 hover:text-blue-600 dark:hover:text-sky-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition cursor-pointer"
                            title="Edit"
                          >
                            <RiEditLine className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(item)}
                            className="p-1.5 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                            title="Hapus"
                          >
                            <RiDeleteBinLine className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── 4. Pagination Footer ── */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span>Tampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span>dari {filteredItems.length} data</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-40 disabled:pointer-events-none rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              Sebelumnya
            </button>
            <span className="px-3 py-1 font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {currentPage}
            </span>
            <button
              disabled={currentPage * pageSize >= filteredItems.length}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-2.5 py-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-40 disabled:pointer-events-none rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* ── Dialog Create / Edit Penugasan ── */}
      <Dialog
        open={isCreateOpen || isEditOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setIsEditOpen(false);
        }}
        title={isCreateOpen ? "Buat Penugasan Baru" : "Edit Penugasan Tim"}
      >
        <div className="space-y-4 mt-3 text-gray-900 dark:text-gray-100">
          {/* Real-time Conflict Alert Box */}
          {formConflict && (
            <div className="flex items-start gap-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl p-3.5 text-rose-800 dark:text-rose-300 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wide">
                  ⚠️ Peringatan Deteksi Bentrok Jadwal
                </p>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">{formConflict}</p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 italic">
                  Status akan otomatis ditandai sebagai Bentrok jika disimpan.
                </p>
              </div>
            </div>
          )}

          {/* Nama Kegiatan */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Kegiatan Terkait (Sinkron dari Agenda) *
              </label>
              <button
                type="button"
                onClick={() => navigate("/kegiatan")}
                className="text-[11px] text-indigo-600 dark:text-sky-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Kelola Agenda</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <select
              value={formData.kegiatanTerkait}
              onChange={(e) => {
                const selectedKeg = kegiatanList.find((k) => k.title === e.target.value);
                if (selectedKeg) {
                  setFormData({
                    ...formData,
                    kegiatanTerkait: selectedKeg.title,
                    tanggalKegiatan: formatIndoDate(selectedKeg.deadline),
                    waktuSubtitle: formatSubtitleDate(selectedKeg.deadline),
                    lokasi: selectedKeg.lokasi ?? formData.lokasi,
                    jenisKonten: selectedKeg.outputDibutuhkan?.[0] ?? formData.jenisKonten,
                    catatan: `Penugasan untuk kegiatan ${selectedKeg.title} (${selectedKeg.opdPenyelenggara ?? "OPD"})`,
                  });
                } else {
                  setFormData({ ...formData, kegiatanTerkait: e.target.value });
                }
              }}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 font-bold cursor-pointer"
            >
              {kegiatanList.map((keg) => (
                <option key={keg.id} value={keg.title}>
                  📌 {keg.title} ({keg.opdPenyelenggara ?? "Pemkot Batu"} - {keg.deadline})
                </option>
              ))}
              {!kegiatanList.some((k) => k.title === formData.kegiatanTerkait) && (
                <option value={formData.kegiatanTerkait}>
                  📌 {formData.kegiatanTerkait} (Kegiatan Khusus)
                </option>
              )}
            </select>
          </div>

          {/* PIC Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Pilih PIC (Petugas Staf) *
            </label>
            <select
              value={formData.pic}
              onChange={(e) => {
                const opt = PIC_OPTIONS.find((p) => p.name === e.target.value);
                setFormData({
                  ...formData,
                  pic: e.target.value,
                  picAvatar: opt?.avatar ?? "ST",
                });
              }}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 font-semibold cursor-pointer"
            >
              {PIC_OPTIONS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.role})
                </option>
              ))}
            </select>
          </div>

          {/* Output & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Output / Jenis Konten
              </label>
              <select
                value={formData.jenisKonten}
                onChange={(e) => setFormData({ ...formData, jenisKonten: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 font-semibold cursor-pointer"
              >
                {JENIS_KONTEN_OPTIONS.map((jk) => (
                  <option key={jk} value={jk}>
                    {jk}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Hari / Tanggal Penugasan
              </label>
              <input
                type="text"
                placeholder="Senin, 24 Agustus 2026"
                value={formData.tanggalKegiatan}
                onChange={(e) => setFormData({ ...formData, tanggalKegiatan: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Jam Mulai & Selesai */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Jam Mulai *
              </label>
              <input
                type="time"
                value={formData.jamMulai}
                onChange={(e) => setFormData({ ...formData, jamMulai: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Jam Selesai *
              </label>
              <input
                type="time"
                value={formData.jamSelesai}
                onChange={(e) => setFormData({ ...formData, jamSelesai: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Lokasi & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Lokasi Liputan/Tugas
              </label>
              <input
                type="text"
                placeholder="Balaikota Among Tani"
                value={formData.lokasi}
                onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as MockPenugasan["status"],
                  })
                }
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 font-semibold cursor-pointer"
              >
                <option value="in-progress">Proses</option>
                <option value="done">Selesai</option>
                <option value="pending">Menunggu</option>
                <option value="conflict">Bentrok</option>
              </select>
            </div>
          </div>

          {/* Catatan / Instruksi */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Catatan / Instruksi Tambahan
            </label>
            <textarea
              rows={2}
              placeholder="Instruksi khusus liputan atau batas pengumpulan..."
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 resize-none"
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-3 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
              }}
            >
              Batal
            </Button>
            <button
              onClick={isCreateOpen ? handleSaveCreate : handleSaveEdit}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs transition bg-[#0f1f5c] dark:bg-blue-600 hover:bg-[#0a1540] dark:hover:bg-blue-700 cursor-pointer"
            >
              {isCreateOpen ? "Simpan Penugasan" : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </Dialog>

      {/* ── Dialog Detail Penugasan ── */}
      <Dialog
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Informasi Penugasan"
      >
        {selectedItem && (
          <div className="space-y-4 mt-2 text-gray-900 dark:text-gray-100">
            {/* Header info card */}
            <div className="bg-gray-50 dark:bg-gray-900/60 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                    {selectedItem.kegiatanTerkait}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {selectedItem.tanggalKegiatan ?? "Senin, 24 Agustus 2026"}
                  </p>
                </div>
                {/* Status Badge */}
                <div>
                  {selectedItem.status === "in-progress" && (
                    <StatusBadge
                      status="default"
                      leftIcon={RiTimeLine}
                      leftLabel="Proses"
                      className="bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200/90 dark:border-amber-800 shadow-xs"
                    />
                  )}
                  {selectedItem.status === "done" && (
                    <StatusBadge
                      status="success"
                      leftIcon={RiCheckboxCircleFill}
                      leftLabel="Selesai"
                      className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200/90 dark:border-emerald-800 shadow-xs"
                    />
                  )}
                  {selectedItem.status === "pending" && (
                    <StatusBadge
                      status="default"
                      leftIcon={RiHourglassLine}
                      leftLabel="Menunggu"
                      className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200/90 dark:border-gray-700 shadow-xs"
                    />
                  )}
                  {selectedItem.status === "conflict" && (
                    <StatusBadge
                      status="error"
                      leftIcon={RiCloseCircleFill}
                      leftLabel="Bentrok"
                      className="bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200/90 dark:border-rose-800 shadow-xs"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Conflict Warning if status is conflict */}
            {selectedItem.status === "conflict" && (
              <div className="flex items-start gap-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl p-3.5 text-rose-800 dark:text-rose-300">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase">
                    Status Bentrok Jadwal Terdeteksi
                  </p>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                    {selectedItem.conflictMessage ??
                      "Petugas PIC memiliki jadwal bertabrakan pada jam yang sama."}
                  </p>
                </div>
              </div>
            )}

            {/* Grid detail */}
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="bg-white dark:bg-gray-800/80 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-start gap-2.5">
                <User className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Petugas PIC</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{selectedItem.pic}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800/80 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Output Konten</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{selectedItem.jenisKonten}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800/80 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Waktu Penugasan</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                    {selectedItem.jamMulai} - {selectedItem.jamSelesai}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800/80 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Lokasi</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                    {selectedItem.lokasi ?? "Balaikota Among Tani"}
                  </p>
                </div>
              </div>
            </div>

            {/* Catatan / Instruksi */}
            {selectedItem.catatan && (
              <div className="bg-gray-50 dark:bg-gray-900/60 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">
                  Catatan / Instruksi Penugasan
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                  {selectedItem.catatan}
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* ── Dialog Konfirmasi Delete ── */}
      <Dialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Konfirmasi Hapus Penugasan"
      >
        <div className="space-y-4 mt-2">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Apakah Anda yakin ingin menghapus penugasan{" "}
            <span className="font-bold text-gray-900 dark:text-gray-100">
              "{selectedItem?.kegiatanTerkait}"
            </span>{" "}
            untuk <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedItem?.pic}</span>?
          </p>
          <div className="pt-3 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </Button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              Hapus Penugasan
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

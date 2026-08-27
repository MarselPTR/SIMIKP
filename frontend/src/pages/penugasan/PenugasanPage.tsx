import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { mockApi } from "../../lib/mock-api";
import { apiFetch } from "../../lib/api-client";
import type { MockPenugasan } from "../../lib/mock-data";
import { useToast } from "../../contexts/ToastContext";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Query Penugasan Data
  const { data: initialData, isLoading, error, refetch } = useQuery({
    queryKey: ["penugasan"],
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
        return mockApi.penugasan.getAll();
      } catch {
        return mockApi.penugasan.getAll();
      }
    },
  });

  const { data: petugasList } = useQuery({
    queryKey: ["petugas"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: any[] }>("/users/petugas");
        return res.data;
      } catch {
        return [];
      }
    },
  });

  const { data: activities } = useQuery({
    queryKey: ["kegiatanList"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: any[] }>("/activities");
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

  // Query Kegiatan Data for real-time synchronization
  const { data: kegiatanList = [] } = useQuery({
    queryKey: ["kegiatan"],
    queryFn: mockApi.kegiatan.getAll,
  });

  // Local state for penugasan items to allow CRUD interactivity
  const [items, setItems] = useState<MockPenugasan[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Sync initial query data
  useEffect(() => {
    if (initialData && !dataLoaded) {
      setItems(initialData);
      setDataLoaded(true);
    }
  }, [initialData, dataLoaded]);

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
  const handleBulkMarkStatus = (status: MockPenugasan["status"]) => {
    if (selectedIds.length === 0) return;
    setItems((prev) =>
      prev.map((it) =>
        selectedIds.includes(it.id)
          ? {
              ...it,
              status,
              hasConflict: status === "conflict",
              conflictMessage: status === "conflict" ? it.conflictMessage : undefined,
            }
          : it
      )
    );
    const statusLabel =
      status === "done"
        ? "Selesai"
        : status === "pending"
        ? "Menunggu"
        : status === "in-progress"
        ? "Proses"
        : "Bentrok";
    addToast(`${selectedIds.length} penugasan berhasil ditandai sebagai ${statusLabel}.`, "success");
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setItems((prev) => prev.filter((it) => !selectedIds.includes(it.id)));
    addToast(`${selectedIds.length} penugasan berhasil dihapus.`, "info");
    setSelectedIds([]);
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

    const isConflict = Boolean(formConflict);
    const finalStatus = isConflict ? "conflict" : formData.status;
    const newItem: MockPenugasan = {
      id: `p-${Date.now()}`,
      kegiatanTerkait: formData.kegiatanTerkait,
      tanggalKegiatan: formData.tanggalKegiatan,
      jenisKonten: formData.jenisKonten,
      pic: formData.pic,
      picAvatar: formData.picAvatar,
      jamMulai: formData.jamMulai,
      jamSelesai: formData.jamSelesai,
      waktuSubtitle: formData.waktuSubtitle,
      status: finalStatus,
      hasConflict: isConflict,
      conflictMessage: isConflict ? (formConflict ?? undefined) : undefined,
      lokasi: formData.lokasi,
      catatan: formData.catatan,
    };

    setItems((prev) => [newItem, ...prev]);
    setIsCreateOpen(false);
    addToast(
      isConflict
        ? "Penugasan disimpan dengan status bentrok jadwal."
        : "Penugasan baru berhasil dibuat.",
      isConflict ? "warning" : "success"
    );
  };

  // Save Edit
  const handleSaveEdit = () => {
    if (!selectedItem) return;
    if (!formData.kegiatanTerkait.trim()) {
      addToast("Mohon isi nama kegiatan terkait", "warning");
      return;
    }

    const isConflict = Boolean(formConflict) && formData.status === "conflict";
    const updated: MockPenugasan = {
      ...selectedItem,
      kegiatanTerkait: formData.kegiatanTerkait,
      tanggalKegiatan: formData.tanggalKegiatan,
      jenisKonten: formData.jenisKonten,
      pic: formData.pic,
      picAvatar: formData.picAvatar,
      jamMulai: formData.jamMulai,
      jamSelesai: formData.jamSelesai,
      waktuSubtitle: formData.waktuSubtitle,
      status: formData.status,
      hasConflict: isConflict,
      conflictMessage: isConflict ? (formConflict ?? selectedItem.conflictMessage) : undefined,
      lokasi: formData.lokasi,
      catatan: formData.catatan,
    };

    setItems((prev) => prev.map((it) => (it.id === selectedItem.id ? updated : it)));
    setIsEditOpen(false);
    addToast("Perubahan penugasan berhasil disimpan.", "success");
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!selectedItem) return;
    setItems((prev) => prev.filter((it) => it.id !== selectedItem.id));
    setIsDeleteOpen(false);
    addToast(`Penugasan "${selectedItem.kegiatanTerkait}" telah dihapus.`, "info");
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header Title & Description ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Penugasan Tim
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola dan pantau jadwal liputan penugasan staf konten dengan data yang rapi dan terorganisir.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0f1f5c] hover:bg-[#0a1540] text-white text-sm font-semibold rounded-lg shadow-sm transition active:scale-[0.98] self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Tugas Baru</span>
        </button>
      </div>

      {/* ── Main Container / Card ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {/* ── 1. Top Tabs dengan Counter Real-Time ── */}
        <div className="flex items-center gap-8 px-6 pt-4 border-b border-gray-200/70 overflow-x-auto text-sm">
          {/* Tab Semua */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
            className={`pb-3.5 flex items-center gap-2 font-medium transition relative whitespace-nowrap cursor-pointer ${
              activeTab === "all"
                ? "text-[#0f1f5c] font-bold border-b-2 border-[#0f1f5c]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span>Semua</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === "all"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-gray-100 text-gray-500"
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
            className={`pb-3.5 flex items-center gap-2 font-medium transition relative whitespace-nowrap cursor-pointer ${
              activeTab === "in-progress"
                ? "text-[#0f1f5c] font-bold border-b-2 border-[#0f1f5c]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span>Proses</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === "in-progress"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-100 text-gray-500"
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
            className={`pb-3.5 flex items-center gap-2 font-medium transition relative whitespace-nowrap cursor-pointer ${
              activeTab === "done"
                ? "text-[#0f1f5c] font-bold border-b-2 border-[#0f1f5c]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span>Selesai</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === "done"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-100 text-gray-500"
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
            className={`pb-3.5 flex items-center gap-2 font-medium transition relative whitespace-nowrap cursor-pointer ${
              activeTab === "pending"
                ? "text-[#0f1f5c] font-bold border-b-2 border-[#0f1f5c]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span>Menunggu</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === "pending"
                  ? "bg-gray-200 text-gray-700"
                  : "bg-gray-100 text-gray-500"
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
            className={`pb-3.5 flex items-center gap-2 font-medium transition relative whitespace-nowrap cursor-pointer ${
              activeTab === "conflict"
                ? "text-rose-600 font-bold border-b-2 border-rose-600"
                : "text-gray-500 hover:text-rose-600"
            }`}
          >
            <span>Bentrok</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === "conflict"
                  ? "bg-rose-100 text-rose-800"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {counts.conflict}
            </span>
          </button>
        </div>

        {/* ── 2. Toolbar: Search + Bulk Actions Bar ── */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kegiatan, staf, jenis..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9.5 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>

          {/* Bulk Action Controls */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 animate-fadeIn">
              <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                {selectedIds.length} dipilih:
              </span>
              <button
                onClick={() => handleBulkMarkStatus("done")}
                className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
              >
                <RiCheckLine className="w-3.5 h-3.5" />
                <span>Selesai</span>
              </button>
              <button
                onClick={() => handleBulkMarkStatus("in-progress")}
                className="px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
              >
                <RiTimeLine className="w-3.5 h-3.5" />
                <span>Proses</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
              >
                <RiDeleteBinLine className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          )}
        </div>

        {/* ── 3. Table Penugasan ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f1f5c] text-white text-xs font-semibold uppercase tracking-wider">
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
                    <span>Kegiatan Terkait</span>
                    <RiArrowUpDownLine className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("pic")}
                  className="py-3.5 px-4 cursor-pointer select-none hover:text-blue-200 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Petugas PIC</span>
                    <RiArrowUpDownLine className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("jenisKonten")}
                  className="py-3.5 px-4 cursor-pointer select-none hover:text-blue-200 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Jenis Konten</span>
                    <RiArrowUpDownLine className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("jamMulai")}
                  className="py-3.5 px-4 cursor-pointer select-none hover:text-blue-200 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Waktu Penugasan</span>
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
            <tbody className="divide-y divide-gray-100 text-sm">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <p className="font-medium text-gray-500">Tidak ada penugasan ditemukan</p>
                    <p className="text-xs text-gray-400 mt-1">
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
                      className={`hover:bg-gray-50/80 transition-colors ${
                        isSelected ? "bg-indigo-50/40" : ""
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
                        <div className="font-semibold text-gray-900">{item.kegiatanTerkait}</div>
                        {item.lokasi && (
                          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
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
                          <span className="font-medium text-gray-800">{item.pic}</span>
                        </div>
                      </td>

                      {/* Jenis Konten */}
                      <td className="py-4 px-4 font-medium text-gray-700">
                        {item.jenisKonten}
                      </td>

                      {/* Waktu Penugasan */}
                      <td className="py-4 px-4">
                        <div className="font-mono text-xs font-semibold text-gray-800">
                          {item.jamMulai} - {item.jamSelesai}
                        </div>
                        {item.waktuSubtitle && (
                          <div className="text-[11px] text-gray-400 mt-0.5">
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
                            className="bg-amber-50 text-amber-800 border-amber-200/90 shadow-xs"
                          />
                        )}
                        {item.status === "done" && (
                          <StatusBadge
                            status="success"
                            leftIcon={RiCheckboxCircleFill}
                            leftLabel="Selesai"
                            className="bg-emerald-50 text-emerald-800 border-emerald-200/90 shadow-xs"
                          />
                        )}
                        {item.status === "pending" && (
                          <StatusBadge
                            status="default"
                            leftIcon={RiHourglassLine}
                            leftLabel="Menunggu"
                            className="bg-gray-50 text-gray-700 border-gray-200/90 shadow-xs"
                          />
                        )}
                        {item.status === "conflict" && (
                          <StatusBadge
                            status="error"
                            leftIcon={RiCloseCircleFill}
                            leftLabel="Bentrok"
                            className="bg-rose-50 text-rose-800 border-rose-200/90 shadow-xs"
                          />
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1 text-gray-400">
                          <button
                            onClick={() => handleOpenDetail(item)}
                            className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                            title="Detail"
                          >
                            <RiEyeLine className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                            title="Edit"
                          >
                            <RiEditLine className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(item)}
                            className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-md transition"
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
        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>Tampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none"
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
              className="px-2.5 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none rounded hover:bg-gray-50 transition cursor-pointer"
            >
              Sebelumnya
            </button>
            <span className="px-3 py-1 font-semibold text-gray-800 bg-gray-100 rounded">
              {currentPage}
            </span>
            <button
              disabled={currentPage * pageSize >= filteredItems.length}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-2.5 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none rounded hover:bg-gray-50 transition cursor-pointer"
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
        <div className="space-y-4 mt-3">
          {/* Real-time Conflict Alert Box */}
          {formConflict && (
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-rose-800 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                  ⚠️ Peringatan Deteksi Bentrok Jadwal
                </p>
                <p className="text-xs text-rose-700 mt-1 leading-relaxed">{formConflict}</p>
                <p className="text-[11px] text-rose-600 mt-1 italic">
                  Status akan otomatis ditandai sebagai Bentrok jika disimpan.
                </p>
              </div>
            </div>
          )}

          {/* Nama Kegiatan (Dropdown Sinkron dari Manajemen Kegiatan) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Kegiatan Terkait (Sinkron dari Agenda) *
              </label>
              <button
                type="button"
                onClick={() => navigate("/kegiatan")}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
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
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white font-medium text-gray-800"
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
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
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
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
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
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Output / Jenis Konten
              </label>
              <select
                value={formData.jenisKonten}
                onChange={(e) => setFormData({ ...formData, jenisKonten: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                {JENIS_KONTEN_OPTIONS.map((jk) => (
                  <option key={jk} value={jk}>
                    {jk}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Hari / Tanggal Penugasan
              </label>
              <input
                type="text"
                placeholder="Senin, 24 Agustus 2026"
                value={formData.tanggalKegiatan}
                onChange={(e) => setFormData({ ...formData, tanggalKegiatan: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Jam Mulai & Selesai */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Jam Mulai *
              </label>
              <input
                type="time"
                value={formData.jamMulai}
                onChange={(e) => setFormData({ ...formData, jamMulai: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Jam Selesai *
              </label>
              <input
                type="time"
                value={formData.jamSelesai}
                onChange={(e) => setFormData({ ...formData, jamSelesai: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Lokasi & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Lokasi Liputan/Tugas
              </label>
              <input
                type="text"
                placeholder="Balaikota Among Tani"
                value={formData.lokasi}
                onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
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
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
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
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Catatan / Instruksi Tambahan
            </label>
            <textarea
              rows={2}
              placeholder="Instruksi khusus liputan atau batas pengumpulan..."
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
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
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition bg-[#0f1f5c] hover:bg-[#0a1540] cursor-pointer"
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
          <div className="space-y-4 mt-2">
            {/* Header info card */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {selectedItem.kegiatanTerkait}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
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
                      className="bg-amber-50 text-amber-800 border-amber-200/90 shadow-xs"
                    />
                  )}
                  {selectedItem.status === "done" && (
                    <StatusBadge
                      status="success"
                      leftIcon={RiCheckboxCircleFill}
                      leftLabel="Selesai"
                      className="bg-emerald-50 text-emerald-800 border-emerald-200/90 shadow-xs"
                    />
                  )}
                  {selectedItem.status === "pending" && (
                    <StatusBadge
                      status="default"
                      leftIcon={RiHourglassLine}
                      leftLabel="Menunggu"
                      className="bg-gray-50 text-gray-700 border-gray-200/90 shadow-xs"
                    />
                  )}
                  {selectedItem.status === "conflict" && (
                    <StatusBadge
                      status="error"
                      leftIcon={RiCloseCircleFill}
                      leftLabel="Bentrok"
                      className="bg-rose-50 text-rose-800 border-rose-200/90 shadow-xs"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Conflict Warning if status is conflict */}
            {selectedItem.status === "conflict" && (
              <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-rose-800">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-rose-900 uppercase">
                    Status Bentrok Jadwal Terdeteksi
                  </p>
                  <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                    {selectedItem.conflictMessage ??
                      "Petugas PIC memiliki jadwal bertabrakan pada jam yang sama."}
                  </p>
                </div>
              </div>
            )}

            {/* Grid detail */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-2.5">
                <User className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-[11px] text-gray-400 font-semibold uppercase">Petugas PIC</p>
                  <p className="font-semibold text-gray-800 mt-0.5">{selectedItem.pic}</p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-[11px] text-gray-400 font-semibold uppercase">Output Konten</p>
                  <p className="font-semibold text-gray-800 mt-0.5">{selectedItem.jenisKonten}</p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-[11px] text-gray-400 font-semibold uppercase">Waktu Penugasan</p>
                  <p className="font-semibold text-gray-800 mt-0.5">
                    {selectedItem.jamMulai} - {selectedItem.jamSelesai}
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-[11px] text-gray-400 font-semibold uppercase">Lokasi</p>
                  <p className="font-semibold text-gray-800 mt-0.5">
                    {selectedItem.lokasi ?? "Balaikota Among Tani"}
                  </p>
                </div>
              </div>
            </div>

            {/* Catatan / Instruksi */}
            {selectedItem.catatan && (
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <p className="text-[11px] text-gray-400 font-semibold uppercase">
                  Catatan / Instruksi Penugasan
                </p>
                <p className="text-xs text-gray-700 mt-1 leading-relaxed">
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
          <p className="text-sm text-gray-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus penugasan{" "}
            <span className="font-bold text-gray-900">
              "{selectedItem?.kegiatanTerkait}"
            </span>{" "}
            untuk <span className="font-semibold text-gray-800">{selectedItem?.pic}</span>?
          </p>
          <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </Button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition cursor-pointer"
            >
              Hapus Penugasan
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { mockApi } from "../../lib/mock-api";
import type { MockPenugasan, MockKegiatan } from "../../lib/mock-data";
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
import { StatusBadge } from "@/components/ui/status-badge";
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
    queryFn: mockApi.penugasan.getAll,
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

  // Helper format short date subtitle (e.g. (Senin, 24/8))
  const formatSubtitleDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "(Senin, 24/8)";
      const weekday = d.toLocaleDateString("id-ID", { weekday: "long" });
      const day = d.getDate();
      const month = d.getMonth() + 1;
      return `(${weekday}, ${day}/${month})`;
    } catch {
      return "(Senin, 24/8)";
    }
  };

  // Form State for Create/Edit
  const [formData, setFormData] = useState({
    kegiatanTerkait: "Upacara Hari Jadi Kota",
    tanggalKegiatan: "Senin, 24 Agustus 2026",
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

  // Handle URL Param action=create & kegiatan parameter (e.g. from KegiatanPage)
  useEffect(() => {
    const action = searchParams.get("action");
    const kegiatanParam = searchParams.get("kegiatan");

    if (action === "create" || kegiatanParam) {
      const matchedKegiatan = kegiatanList.find(
        (k) => k.title.toLowerCase() === kegiatanParam?.toLowerCase()
      );

      const targetTitle = matchedKegiatan ? matchedKegiatan.title : (kegiatanParam ?? "Upacara Hari Jadi Kota");
      const targetDate = matchedKegiatan ? formatIndoDate(matchedKegiatan.deadline) : "Senin, 24 Agustus 2026";
      const targetSubDate = matchedKegiatan ? formatSubtitleDate(matchedKegiatan.deadline) : "(Senin, 24/8)";
      const targetLocation = matchedKegiatan?.lokasi ?? "Balaikota Among Tani";
      const defaultOutput = matchedKegiatan?.outputDibutuhkan?.[0] ?? "Foto";

      setFormData({
        kegiatanTerkait: targetTitle,
        tanggalKegiatan: targetDate,
        jenisKonten: defaultOutput,
        pic: "Budi Fotografer",
        picAvatar: "BF",
        jamMulai: "08:00",
        jamSelesai: "10:00",
        waktuSubtitle: targetSubDate,
        status: "in-progress",
        lokasi: targetLocation,
        catatan: `Penugasan untuk kegiatan ${targetTitle}`,
      });

      if (action === "create") {
        setIsCreateOpen(true);
      }

      // Clear action param after handling
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("action");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, kegiatanList]);

  // List of PICs for options
  const PIC_OPTIONS = [
    { name: "Budi Fotografer", avatar: "BF", role: "FOTO_VIDEO" },
    { name: "Andi Prahum", avatar: "AP", role: "PRAHUM" },
    { name: "Citra Desainer", avatar: "CD", role: "DESAINER_EDITOR" },
    { name: "Dinda Amelia", avatar: "DA", role: "FOTO_VIDEO" },
    { name: "Fajar Nugroho", avatar: "FN", role: "DESAINER_EDITOR" },
  ];

  const JENIS_KONTEN_OPTIONS = [
    "Foto",
    "Naskah Berita",
    "Flyer/Infografis",
    "Review Konten",
    "Video Liputan",
    "Reels / TikTok",
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
      // Tab filter (strictly by item.status)
      if (activeTab === "in-progress" && item.status !== "in-progress") return false;
      if (activeTab === "done" && item.status !== "done") return false;
      if (activeTab === "pending" && item.status !== "pending") return false;
      if (activeTab === "conflict" && item.status !== "conflict") return false;

      // Search
      const matchSearch =
        searchQuery.trim() === "" ||
        item.kegiatanTerkait.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.jenisKonten.toLowerCase().includes(searchQuery.toLowerCase());

      return matchSearch;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      let valA = (a as Record<string, unknown>)[sortField] ?? "";
      let valB = (b as Record<string, unknown>)[sortField] ?? "";

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
  const handleSaveCreate = () => {
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
      hasConflict: formData.status === "conflict",
      conflictMessage: formData.status === "conflict" ? (formConflict ?? selectedItem.conflictMessage) : undefined,
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
    <div className="space-y-6">
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
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition active:scale-[0.98] self-start sm:self-auto cursor-pointer"
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
                ? "text-blue-600 font-semibold border-b-2 border-blue-600"
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
                ? "text-blue-600 font-semibold border-b-2 border-blue-600"
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
                ? "text-blue-600 font-semibold border-b-2 border-blue-600"
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
                ? "text-blue-600 font-semibold border-b-2 border-blue-600"
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
                ? "text-blue-600 font-semibold border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-800"
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

        {/* ── 2. Toolbar Aksi Cepat & Search Bar (Tanpa Cetak) ── */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-gray-100 bg-white">
          {/* Left: Action Pills (Tandai Selesai, Tandai Menunggu, Hapus) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => handleBulkMarkStatus("done")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 disabled:opacity-40 disabled:pointer-events-none transition shadow-2xs cursor-pointer"
            >
              <RiCheckLine className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tandai Selesai</span>
            </button>

            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => handleBulkMarkStatus("pending")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 disabled:opacity-40 disabled:pointer-events-none transition shadow-2xs cursor-pointer"
            >
              <RiTimeLine className="w-3.5 h-3.5 text-amber-600" />
              <span>Tandai Menunggu</span>
            </button>

            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 disabled:opacity-40 disabled:pointer-events-none transition shadow-2xs cursor-pointer"
            >
              <RiDeleteBinLine className="w-3.5 h-3.5 text-gray-500" />
              <span>Hapus</span>
            </button>

            {selectedIds.length > 0 && (
              <span className="text-xs font-semibold text-indigo-600 ml-1">
                {selectedIds.length} dipilih
              </span>
            )}
          </div>

          {/* Right: Search Box Rounded */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari penugasan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition placeholder:text-gray-400 bg-white shadow-2xs"
            />
          </div>
        </div>

        {/* ── 3. Table Container ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* ── Header Tabel Biru Terang Agak Transparan (Easy to Spot) ── */}
            <thead>
              <tr className="bg-sky-500/15 border-b-2 border-sky-200/90 text-sky-950 text-xs font-bold uppercase tracking-wider">
                {/* Select All Checkbox */}
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-sky-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>

                {/* Kolom Kegiatan & Tanggal dengan Sort */}
                <th
                  onClick={() => toggleSort("kegiatanTerkait")}
                  className="py-3.5 px-4 cursor-pointer hover:bg-sky-500/25 transition-colors select-none group"
                >
                  <div className="flex items-center gap-1.5 text-sky-900 group-hover:text-sky-950 font-bold">
                    <span>Kegiatan & Tanggal</span>
                    <RiArrowUpDownLine className="w-3.5 h-3.5 text-sky-600 group-hover:text-sky-800" />
                  </div>
                </th>

                {/* Kolom Output dengan Sort */}
                <th
                  onClick={() => toggleSort("jenisKonten")}
                  className="py-3.5 px-4 cursor-pointer hover:bg-sky-500/25 transition-colors select-none group"
                >
                  <div className="flex items-center gap-1.5 text-sky-900 group-hover:text-sky-950 font-bold">
                    <span>Output</span>
                    <RiArrowUpDownLine className="w-3.5 h-3.5 text-sky-600 group-hover:text-sky-800" />
                  </div>
                </th>

                {/* Kolom PIC dengan Sort */}
                <th
                  onClick={() => toggleSort("pic")}
                  className="py-3.5 px-4 cursor-pointer hover:bg-sky-500/25 transition-colors select-none group"
                >
                  <div className="flex items-center gap-1.5 text-sky-900 group-hover:text-sky-950 font-bold">
                    <span>PIC</span>
                    <RiArrowUpDownLine className="w-3.5 h-3.5 text-sky-600 group-hover:text-sky-800" />
                  </div>
                </th>

                {/* Kolom Waktu Penugasan dengan Sort */}
                <th
                  onClick={() => toggleSort("jamMulai")}
                  className="py-3.5 px-4 cursor-pointer hover:bg-sky-500/25 transition-colors select-none group"
                >
                  <div className="flex items-center gap-1.5 text-sky-900 group-hover:text-sky-950 font-bold">
                    <span>Waktu Penugasan</span>
                    <RiArrowUpDownLine className="w-3.5 h-3.5 text-sky-600 group-hover:text-sky-800" />
                  </div>
                </th>

                {/* Kolom Status dengan Sort */}
                <th
                  onClick={() => toggleSort("status")}
                  className="py-3.5 px-4 cursor-pointer hover:bg-sky-500/25 transition-colors select-none group"
                >
                  <div className="flex items-center gap-1.5 text-sky-900 group-hover:text-sky-950 font-bold">
                    <span>Status</span>
                    <RiArrowUpDownLine className="w-3.5 h-3.5 text-sky-600 group-hover:text-sky-800" />
                  </div>
                </th>

                {/* Kolom Aksi */}
                <th className="py-3.5 px-4 text-center text-sky-900 font-bold">
                  <span>Aksi</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                    Tidak ada data penugasan pada kategori ini.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((row) => {
                  const isConflict = row.status === "conflict";
                  const isSelected = selectedIds.includes(row.id);

                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-blue-50/40 hover:bg-blue-50/60"
                          : isConflict
                          ? "bg-[#fff1f2]/70 hover:bg-[#ffe4e6]/60 border-l-4 border-l-rose-500"
                          : "hover:bg-gray-50/70"
                      }`}
                    >
                      {/* Checkbox row */}
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(row.id)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Kegiatan & Tanggal */}
                      <td className="py-4 px-4">
                        <p className="font-semibold text-gray-900 text-sm">{row.kegiatanTerkait}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {row.tanggalKegiatan ?? "Senin, 24 Agustus 2026"}
                        </p>
                      </td>

                      {/* Output */}
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-800 font-normal">{row.jenisKonten}</span>
                      </td>

                      {/* PIC */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-[#cbd5e1] text-gray-700 font-bold text-xs flex items-center justify-center">
                              {row.picAvatar ?? row.pic.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            {isConflict && (
                              <div
                                title={row.conflictMessage ?? "Jadwal bertabrakan"}
                                className="absolute -bottom-1 -right-1 bg-red-600 text-white rounded-full p-0.5 shadow ring-2 ring-white flex items-center justify-center animate-pulse"
                              >
                                <AlertTriangle className="w-2.5 h-2.5 fill-current" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-800">{row.pic}</span>
                        </div>
                      </td>

                      {/* Waktu Penugasan */}
                      <td className="py-4 px-4">
                        <p className="text-sm font-medium text-gray-900">
                          {row.jamMulai} - {row.jamSelesai}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {row.waktuSubtitle ?? "(Senin, 24/8)"}
                        </p>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        {row.status === "in-progress" && (
                          <StatusBadge
                            status="default"
                            leftIcon={RiTimeLine}
                            leftLabel="Proses"
                            className="bg-amber-50 text-amber-800 border-amber-200/90 shadow-2xs"
                          />
                        )}
                        {row.status === "done" && (
                          <StatusBadge
                            status="success"
                            leftIcon={RiCheckboxCircleFill}
                            leftLabel="Selesai"
                            className="bg-emerald-50 text-emerald-800 border-emerald-200/90 shadow-2xs"
                          />
                        )}
                        {row.status === "pending" && (
                          <StatusBadge
                            status="default"
                            leftIcon={RiHourglassLine}
                            leftLabel="Menunggu"
                            className="bg-gray-50 text-gray-700 border-gray-200/90 shadow-2xs"
                          />
                        )}
                        {row.status === "conflict" && (
                          <StatusBadge
                            status="error"
                            leftIcon={RiCloseCircleFill}
                            leftLabel="Bentrok"
                            className="bg-rose-50 text-rose-800 border-rose-200/90 shadow-2xs"
                          />
                        )}
                      </td>

                      {/* Kolom Aksi Minimalis Sejajar (Detail, Edit, Delete) */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          {/* Detail */}
                          <button
                            type="button"
                            title="Lihat Detail Penugasan"
                            onClick={() => handleOpenDetail(row)}
                            className="text-blue-500 hover:text-blue-700 transition p-1 hover:bg-blue-50 rounded cursor-pointer"
                          >
                            <RiEyeLine className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            title="Edit Penugasan"
                            onClick={() => handleOpenEdit(row)}
                            className="text-gray-400 hover:text-gray-700 transition p-1 hover:bg-gray-100 rounded cursor-pointer"
                          >
                            <RiEditLine className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            title="Hapus Penugasan"
                            onClick={() => handleOpenDelete(row)}
                            className="text-gray-400 hover:text-rose-600 transition p-1 hover:bg-rose-50 rounded cursor-pointer"
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

        {/* ── Footer / Pagination ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 border-t border-gray-100 text-sm text-gray-600 bg-white">
          {/* Items Per Page */}
          <div className="flex items-center gap-2">
            <span>Tampilkan</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-7 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value={10}>10/page</option>
                <option value={20}>20/page</option>
                <option value={50}>50/page</option>
              </select>
            </div>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none rounded hover:bg-gray-50 transition cursor-pointer"
            >
              Sebelumnya
            </button>

            <button
              onClick={() => setCurrentPage(1)}
              className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition cursor-pointer ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-900 font-bold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              1
            </button>

            {filteredItems.length > pageSize && (
              <button
                onClick={() => setCurrentPage(2)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition cursor-pointer ${
                  currentPage === 2
                    ? "bg-gray-100 text-gray-900 font-bold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                2
              </button>
            )}

            {filteredItems.length > pageSize * 2 && (
              <button
                onClick={() => setCurrentPage(3)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition cursor-pointer ${
                  currentPage === 3
                    ? "bg-gray-100 text-gray-900 font-bold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                3
              </button>
            )}

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
              className="px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
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

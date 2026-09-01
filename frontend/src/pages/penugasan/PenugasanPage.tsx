import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
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

const FIELD_CLASS =
  "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 transition-colors focus:border-[#0f1f5c] focus:outline-none focus:ring-2 focus:ring-[#0f1f5c]/15 disabled:bg-gray-50 disabled:text-gray-500";
const LABEL_CLASS = "block text-sm font-medium text-gray-700 mb-1.5";

export default function PenugasanPage() {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Query Penugasan Data
  const { data: initialData = [], isLoading, error, refetch } = useQuery({
    queryKey: ["penugasan-page"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: any[] }>("/assignments");
        if (res.data && res.data.length > 0) {
          return res.data.map((a: any) => ({
            id: a.id,
            activityId: a.activityId || a.activity?.id,
            kegiatanTerkait: a.activityTitle || a.activity?.title || "Kegiatan",
            tanggalKegiatan: a.activityDate || "2026-08-27",
            pic: a.picName || a.user?.name || "Petugas",
            picAvatar: a.picName ? a.picName.slice(0, 2).toUpperCase() : "PT",
            jenisKonten: a.contentType || "Dokumentasi",
            jamMulai: a.startTime ? a.startTime.slice(0, 5) : "08:00",
            jamSelesai: a.endTime ? a.endTime.slice(0, 5) : "12:00",
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
        return [];
      } catch (err) {
        return [];
      }
    },
  });

  const { data: petugasList = [] } = useQuery({
    queryKey: ["petugas"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: any[] }>("/users/petugas");
        return res.data || [];
      } catch {
        return [];
      }
    },
  });

  // Query Kegiatan Data for real-time synchronization
  const { data: kegiatanList = [] } = useQuery({
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

  // Dynamic Options from real database
  const PIC_OPTIONS = useMemo(() => {
    if (Array.isArray(petugasList) && petugasList.length > 0) {
      return petugasList.map((p: any) => ({
        id: p.id,
        name: p.name,
        role: p.staffType ? p.staffType.replace("_", " ") : "Petugas Lapangan",
        avatar: p.name ? p.name.slice(0, 2).toUpperCase() : "PT",
      }));
    }
    return [];
  }, [petugasList]);

  const JENIS_KONTEN_OPTIONS = [
    "Foto",
    "Video",
    "Naskah Berita",
    "Reels / TikTok",
    "Infografis",
    "Live Streaming",
  ];

  // Form state
  const [formData, setFormData] = useState({
    kegiatanTerkait: "",
    tanggalKegiatan: "",
    jenisKonten: "Foto",
    pic: "",
    picAvatar: "PT",
    jamMulai: "08:00",
    jamSelesai: "10:00",
    waktuSubtitle: "",
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
      const defaultPic = PIC_OPTIONS.length > 0 ? PIC_OPTIONS[0].name : "";
      const defaultAvatar = PIC_OPTIONS.length > 0 ? PIC_OPTIONS[0].avatar : "PT";
      if (found) {
        setFormData({
          kegiatanTerkait: found.title,
          tanggalKegiatan: formatIndoDate(found.deadline),
          waktuSubtitle: formatSubtitleDate(found.deadline),
          jenisKonten: found.outputDibutuhkan?.[0] ?? "Foto",
          pic: defaultPic,
          picAvatar: defaultAvatar,
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
          pic: defaultPic,
          picAvatar: defaultAvatar,
          catatan: `Penugasan untuk agenda ${kegParam}`,
        }));
      }

      if (actionParam === "create") {
        setIsCreateOpen(true);
      }
    }
  }, [searchParams, kegiatanList, PIC_OPTIONS]);

  // Sync search state with URL params
  useEffect(() => {
    if (searchQuery) {
      setSearchParams({ search: searchQuery });
    } else {
      setSearchParams({});
    }
  }, [searchQuery, setSearchParams]);

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

  // Group assignments into one container per kegiatan
  const groups = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        kegiatan: string;
        tanggal?: string;
        lokasi?: string;
        activityId?: string;
        rows: MockPenugasan[];
      }
    >();
    for (const it of filteredItems) {
      const key = it.activityId || it.kegiatanTerkait;
      if (!map.has(key)) {
        map.set(key, {
          key,
          kegiatan: it.kegiatanTerkait,
          tanggal: it.tanggalKegiatan,
          lokasi: it.lokasi,
          activityId: it.activityId,
          rows: [],
        });
      }
      map.get(key)!.rows.push(it);
    }
    return [...map.values()];
  }, [filteredItems]);

  // Pagination slice (by container, not by row)
  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return groups.slice(start, start + pageSize);
  }, [groups, currentPage, pageSize]);

  // Selection handlers
  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

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
    const firstKeg = kegiatanList.length > 0 ? kegiatanList[0] : null;
    const firstPic = PIC_OPTIONS.length > 0 ? PIC_OPTIONS[0] : null;
    setFormData({
      kegiatanTerkait: firstKeg ? firstKeg.title : "",
      tanggalKegiatan: firstKeg ? formatIndoDate(firstKeg.deadline) : "Senin, 24 Agustus 2026",
      jenisKonten: firstKeg?.outputDibutuhkan?.[0] ?? JENIS_KONTEN_OPTIONS[0] ?? "Foto",
      pic: firstPic ? firstPic.name : "",
      picAvatar: firstPic ? firstPic.avatar : "PT",
      jamMulai: "08:00",
      jamSelesai: "10:00",
      waktuSubtitle: firstKeg ? formatSubtitleDate(firstKeg.deadline) : "",
      status: "in-progress",
      lokasi: firstKeg?.lokasi ?? "Balaikota Among Tani",
      catatan: firstKeg ? `Penugasan untuk kegiatan ${firstKeg.title}` : "",
    });
    setIsCreateOpen(true);
  };

  // Handler Add Petugas ke dalam wadah kegiatan yang sudah ada
  const handleAddPetugasToGroup = (group: { kegiatan: string; tanggal?: string; lokasi?: string; activityId?: string }) => {
    setSelectedItem(null);
    const keg = kegiatanList.find(
      (k) => k.id === group.activityId || k.title === group.kegiatan
    );
    const firstPic = PIC_OPTIONS.length > 0 ? PIC_OPTIONS[0] : null;
    setFormData({
      kegiatanTerkait: group.kegiatan,
      tanggalKegiatan: group.tanggal ?? (keg ? formatIndoDate(keg.deadline) : ""),
      waktuSubtitle: keg ? formatSubtitleDate(keg.deadline) : "",
      jenisKonten: keg?.outputDibutuhkan?.[0] ?? JENIS_KONTEN_OPTIONS[0] ?? "Foto",
      pic: firstPic ? firstPic.name : "",
      picAvatar: firstPic ? firstPic.avatar : "PT",
      jamMulai: "08:00",
      jamSelesai: "10:00",
      status: "in-progress",
      lokasi: group.lokasi ?? keg?.lokasi ?? "Balaikota Among Tani",
      catatan: `Penugasan untuk kegiatan ${group.kegiatan}`,
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

  const closeForm = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
  };
  const selectedPic = PIC_OPTIONS.find((p) => p.name === formData.pic);

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
            className={`pb-3.5 flex items-center gap-2 font-medium transition relative whitespace-nowrap cursor-pointer ${activeTab === "all"
                ? "text-[#0f1f5c] font-bold border-b-2 border-[#0f1f5c]"
                : "text-gray-500 hover:text-gray-800"
              }`}
          >
            <span>Semua</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === "all"
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
            className={`pb-3.5 flex items-center gap-2 font-medium transition relative whitespace-nowrap cursor-pointer ${activeTab === "in-progress"
                ? "text-[#0f1f5c] font-bold border-b-2 border-[#0f1f5c]"
                : "text-gray-500 hover:text-gray-800"
              }`}
          >
            <span>Proses</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === "in-progress"
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
            className={`pb-3.5 flex items-center gap-2 font-medium transition relative whitespace-nowrap cursor-pointer ${activeTab === "done"
                ? "text-[#0f1f5c] font-bold border-b-2 border-[#0f1f5c]"
                : "text-gray-500 hover:text-gray-800"
              }`}
          >
            <span>Selesai</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === "done"
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
            className={`pb-3.5 flex items-center gap-2 font-medium transition relative whitespace-nowrap cursor-pointer ${activeTab === "pending"
                ? "text-[#0f1f5c] font-bold border-b-2 border-[#0f1f5c]"
                : "text-gray-500 hover:text-gray-800"
              }`}
          >
            <span>Menunggu</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === "pending"
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
            className={`pb-3.5 flex items-center gap-2 font-medium transition relative whitespace-nowrap cursor-pointer ${activeTab === "conflict"
                ? "text-rose-600 font-bold border-b-2 border-rose-600"
                : "text-gray-500 hover:text-rose-600"
              }`}
          >
            <span>Bentrok</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === "conflict"
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
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition placeholder:text-gray-400"
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

        {/* ── 3. Sort Bar ── */}
        <div className="px-4 sm:px-5 py-2.5 flex items-center gap-2 text-xs text-gray-500 border-b border-gray-100 overflow-x-auto">
          <span className="font-semibold text-gray-600 whitespace-nowrap">Urutkan:</span>
          {([
            ["kegiatanTerkait", "Kegiatan"],
            ["jamMulai", "Waktu"],
            ["status", "Status"],
          ] as const).map(([field, label]) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border transition whitespace-nowrap cursor-pointer ${
                sortField === field
                  ? "bg-[#0f1f5c] text-white border-[#0f1f5c]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span>{label}</span>
              <RiArrowUpDownLine className="w-3 h-3" />
              {sortField === field && <span>{sortAsc ? "↑" : "↓"}</span>}
            </button>
          ))}
        </div>

        {/* ── 4. Daftar Wadah per Kegiatan ── */}
        <div className="p-4 sm:p-5 space-y-4 bg-gray-50/40">
          {paginatedGroups.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="font-medium text-gray-500">Tidak ada penugasan ditemukan</p>
              <p className="text-xs text-gray-400 mt-1">
                Coba ganti filter tab atau kata kunci pencarian.
              </p>
            </div>
          ) : (
            paginatedGroups.map((group) => {
              const groupIds = group.rows.map((r) => r.id);
              const groupAllSelected = groupIds.every((id) => selectedIds.includes(id));
              const groupSomeSelected =
                groupIds.some((id) => selectedIds.includes(id)) && !groupAllSelected;
              const toggleGroup = () =>
                setSelectedIds((prev) =>
                  groupAllSelected
                    ? prev.filter((id) => !groupIds.includes(id))
                    : [...new Set([...prev, ...groupIds])]
                );
              return (
                <div
                  key={group.key}
                  className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden"
                >
                  {/* Header wadah kegiatan */}
                  <div className="px-4 py-3 bg-[#0f1f5c]/[0.03] border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
                    <input
                      type="checkbox"
                      checked={groupAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = groupSomeSelected;
                      }}
                      onChange={toggleGroup}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 truncate">{group.kegiatan}</div>
                      <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        {group.tanggal && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {group.tanggal}
                          </span>
                        )}
                        {group.lokasi && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {group.lokasi}
                          </span>
                        )}
                        <span className="font-medium text-gray-600">
                          {group.rows.length} petugas ditugaskan
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddPetugasToGroup(group)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#0f1f5c] hover:bg-[#0a1540] text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-[0.98] cursor-pointer self-start sm:self-auto whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Tambah Petugas</span>
                    </button>
                  </div>

                  {/* Daftar petugas dalam wadah */}
                  <div className="divide-y divide-gray-100">
                    {group.rows.map((item) => {
                      const isSelected = selectedIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`px-4 py-3 flex flex-wrap sm:flex-nowrap items-center gap-3 hover:bg-gray-50/80 transition-colors ${
                            isSelected ? "bg-indigo-50/40" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(item.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="flex items-center gap-2.5 min-w-[160px]">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                              {item.picAvatar ?? item.pic.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800 text-sm">{item.pic}</span>
                          </div>
                          <div className="text-sm font-medium text-gray-700 min-w-[110px]">
                            {item.jenisKonten}
                          </div>
                          <div className="font-mono text-xs font-semibold text-gray-800 min-w-[100px]">
                            {item.jamMulai} - {item.jamSelesai}
                          </div>
                          <div className="flex-1">
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
                          </div>
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
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
            <span>dari {groups.length} kegiatan</span>
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
              disabled={currentPage * pageSize >= groups.length}
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
        onClose={closeForm}
        size="lg"
        title={isCreateOpen ? "Buat Penugasan Baru" : "Edit Penugasan Tim"}
        actions={
          <>
            <Button variant="outline" onClick={closeForm}>
              Batal
            </Button>
            <button
              onClick={isCreateOpen ? handleSaveCreate : handleSaveEdit}
              className="rounded-lg bg-[#0f1f5c] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0a1540] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f1f5c]/40 cursor-pointer"
            >
              {isCreateOpen ? "Simpan Penugasan" : "Simpan Perubahan"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {formConflict && (
            <div
              role="alert"
              className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />
              <div className="text-rose-800">
                <p className="font-semibold">Bentrok jadwal terdeteksi</p>
                <p className="mt-0.5 text-rose-700">{formConflict}</p>
              </div>
            </div>
          )}

          {/* Kegiatan */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <label className="text-sm font-medium text-gray-700">
                Kegiatan terkait <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => navigate("/kegiatan")}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#0f1f5c] hover:underline"
              >
                Kelola agenda
                <ExternalLink className="h-3 w-3" />
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
              className={FIELD_CLASS}
            >
              {kegiatanList.map((keg) => (
                <option key={keg.id} value={keg.title}>
                  {keg.title} — {keg.opdPenyelenggara ?? "Pemkot Batu"}
                </option>
              ))}
              {!kegiatanList.some((k) => k.title === formData.kegiatanTerkait) && (
                <option value={formData.kegiatanTerkait}>
                  {formData.kegiatanTerkait} (khusus)
                </option>
              )}
            </select>
            {formData.tanggalKegiatan && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                {formatIndoDate(formData.tanggalKegiatan)}
              </p>
            )}
          </div>

          {/* PIC */}
          <div>
            <label className={LABEL_CLASS}>
              Petugas (PIC) <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.pic}
              onChange={(e) => {
                const opt = PIC_OPTIONS.find((p) => p.name === e.target.value);
                setFormData({
                  ...formData,
                  pic: e.target.value,
                  picAvatar: opt?.avatar ?? "PT",
                });
              }}
              className={FIELD_CLASS}
            >
              {PIC_OPTIONS.length === 0 ? (
                <option value="">Belum ada petugas di database</option>
              ) : (
                PIC_OPTIONS.map((p) => (
                  <option key={p.id || p.name} value={p.name}>
                    {p.name} — {p.role}
                  </option>
                ))
              )}
            </select>
            {selectedPic && (
              <div className="mt-2 flex items-center gap-2.5 rounded-lg bg-gray-50 px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f1f5c] text-[11px] font-semibold text-white">
                  {selectedPic.avatar}
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-medium text-gray-800">{selectedPic.name}</p>
                  <p className="text-xs text-gray-500">{selectedPic.role}</p>
                </div>
              </div>
            )}
          </div>

          {/* Jenis konten + Waktu */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Jenis konten</label>
              <select
                value={formData.jenisKonten}
                onChange={(e) => setFormData({ ...formData, jenisKonten: e.target.value })}
                className={FIELD_CLASS}
              >
                {JENIS_KONTEN_OPTIONS.map((jk) => (
                  <option key={jk} value={jk}>
                    {jk}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>
                Waktu penugasan <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={formData.jamMulai}
                  onChange={(e) => setFormData({ ...formData, jamMulai: e.target.value })}
                  className={FIELD_CLASS}
                />
                <span className="text-gray-400">–</span>
                <input
                  type="time"
                  value={formData.jamSelesai}
                  onChange={(e) => setFormData({ ...formData, jamSelesai: e.target.value })}
                  className={FIELD_CLASS}
                />
              </div>
            </div>
          </div>

          {/* Lokasi + Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Lokasi liputan</label>
              <input
                type="text"
                placeholder="Balaikota Among Tani"
                value={formData.lokasi}
                onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as MockPenugasan["status"],
                  })
                }
                className={FIELD_CLASS}
              >
                <option value="pending">Menunggu</option>
                <option value="in-progress">Proses</option>
                <option value="done">Selesai</option>
                <option value="conflict">Bentrok</option>
              </select>
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className={LABEL_CLASS}>
              Catatan / instruksi{" "}
              <span className="font-normal text-gray-400">(opsional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Instruksi khusus liputan atau batas pengumpulan…"
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              className={`${FIELD_CLASS} resize-none`}
            />
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

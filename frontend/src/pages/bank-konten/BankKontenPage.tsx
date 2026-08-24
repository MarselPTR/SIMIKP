import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mockApi } from "../../lib/mock-api";
import type { MockBankKontenFolder, MockBankKontenFile } from "../../lib/mock-data";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import { LoadingSpinner, ErrorState, EmptyState } from "../../components/shared/StateComponents";
import {
  Folder, Image as ImageIcon, Video, Calendar, User,
  Download, Eye, ArrowUpRight, Tag, UploadCloud, HardDrive,
  FileCheck, Sparkles, Filter
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

const urutanOptions = [
  { value: "terbaru", label: "Terbaru dulu" },
  { value: "terlama", label: "Terlama dulu" },
];

const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

const getCoverGradient = (folder: MockBankKontenFolder) => {
  const category = folder.kategori?.toUpperCase();
  if (category === "SOSIAL") return "from-blue-600/15 via-indigo-500/10 to-violet-600/20";
  if (category === "EKONOMI") return "from-emerald-600/15 via-teal-500/10 to-cyan-600/20";
  if (category === "LINGKUNGAN") return "from-green-600/15 via-emerald-500/10 to-lime-600/20";
  return "from-indigo-600/15 via-purple-500/10 to-pink-600/20";
};

const getCategoryBadgeColor = (kategori?: string) => {
  const cat = kategori?.toUpperCase();
  if (cat === "SOSIAL") return "bg-blue-50 text-blue-700 border-blue-200";
  if (cat === "EKONOMI") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (cat === "LINGKUNGAN") return "bg-green-50 text-green-700 border-green-200";
  return "bg-purple-50 text-purple-700 border-purple-200";
};

const summarizeJenis = (folder: MockBankKontenFolder) => {
  const jumlahFoto = folder.files.filter((f) => f.jenisKonten === "foto").length;
  const jumlahVideo = folder.files.filter((f) => f.jenisKonten === "video").length;
  const totalFiles = folder.files.length;
  return { jumlahFoto, jumlahVideo, totalFiles };
};

const BankKontenPage = () => {
  const { addToast } = useToast();

  const { data: folders, isLoading, error, refetch } = useQuery({
    queryKey: ["bankKonten"],
    queryFn: mockApi.bankKonten.getAll,
  });

  const [search, setSearch] = useState("");
  const [tahun, setTahun] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [urutan, setUrutan] = useState("terbaru");
  const [selectedFolder, setSelectedFolder] = useState<MockBankKontenFolder | null>(null);
  const [dialogJenisKonten, setDialogJenisKonten] = useState<"ALL" | "foto" | "video">("ALL");
  const [dialogSearch, setDialogSearch] = useState("");

  const openFolder = (folder: MockBankKontenFolder) => {
    setSelectedFolder(folder);
    setDialogJenisKonten("ALL");
    setDialogSearch("");
  };

  const tahunOptions = useMemo(() => {
    if (!folders) return [];
    const years = new Set(folders.map((f) => new Date(f.tanggal).getFullYear()));
    return [...years]
      .sort((a, b) => b - a)
      .map((y) => ({ value: String(y), label: `Tahun ${y}` }));
  }, [folders]);

  const stats = useMemo(() => {
    if (!folders) return { totalFolders: 0, totalVideo: 0, totalFoto: 0, totalFiles: 0 };
    let totalVideo = 0;
    let totalFoto = 0;
    folders.forEach((f) => {
      f.files.forEach((file) => {
        if (file.jenisKonten === "video") totalVideo++;
        if (file.jenisKonten === "foto") totalFoto++;
      });
    });
    return {
      totalFolders: folders.length,
      totalVideo,
      totalFoto,
      totalFiles: totalVideo + totalFoto,
    };
  }, [folders]);

  const filtered = useMemo(() => {
    if (!folders) return [];
    let result = folders;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.petugas.toLowerCase().includes(q) ||
          f.kategori?.toLowerCase().includes(q) ||
          f.strakomNumber?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== "ALL") {
      result = result.filter((f) => f.kategori?.toUpperCase() === selectedCategory);
    }
    if (tahun) {
      result = result.filter((f) => String(new Date(f.tanggal).getFullYear()) === tahun);
    }
    result = [...result].sort((a, b) =>
      urutan === "terbaru"
        ? new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        : new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );
    return result;
  }, [folders, search, selectedCategory, tahun, urutan]);

  const dialogFiles = useMemo(() => {
    if (!selectedFolder) return [];
    let files = selectedFolder.files;
    if (dialogJenisKonten !== "ALL") {
      files = files.filter((f) => f.jenisKonten === dialogJenisKonten);
    }
    if (dialogSearch.trim()) {
      files = files.filter((f) => f.name.toLowerCase().includes(dialogSearch.toLowerCase()));
    }
    return files;
  }, [selectedFolder, dialogJenisKonten, dialogSearch]);

  const handleDownloadSingle = (file: MockBankKontenFile) => {
    addToast(`Mengunduh file: ${file.name}`, "info");
  };

  const handleDownloadAllFolder = () => {
    if (selectedFolder) {
      addToast(`Menyiapkan arsip ZIP untuk "${selectedFolder.title}"...`, "success");
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6 max-w-full min-w-0 pb-16">
      {/* Header & Upload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Bank Konten</h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Arsip Digital
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Pusat penyimpanan & pencarian arsip hasil produksi media per agenda kegiatan.
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1.5 shadow-sm"
          onClick={() => addToast("Fitur upload file arsip baru segera hadir.", "info")}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Arsip</span>
        </Button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Folder Kegiatan</p>
            <p className="text-lg font-bold text-gray-900">{stats.totalFolders}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Total Video</p>
            <p className="text-lg font-bold text-gray-900">{stats.totalVideo}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Total Foto</p>
            <p className="text-lg font-bold text-gray-900">{stats.totalFoto}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Total File Media</p>
            <p className="text-lg font-bold text-gray-900">{stats.totalFiles} Item</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <Input
              placeholder="Cari judul kegiatan, petugas, no strakom, atau isu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs"
            />
          </div>

          <div className="w-full sm:w-36 shrink-0">
            <Select
              options={[{ value: "", label: "Semua Tahun" }, ...tahunOptions]}
              placeholder="Tahun"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-44 shrink-0">
            <Select
              options={urutanOptions}
              value={urutan}
              onChange={(e) => setUrutan(e.target.value)}
            />
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-gray-100 text-xs">
          <span className="text-[11px] font-medium text-gray-400 mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" />
            Isu:
          </span>
          {["ALL", "SOSIAL", "EKONOMI", "LINGKUNGAN"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat === "ALL" ? "Semua Isu" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Card Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada arsip ditemukan"
          description="Coba ubah kata kunci pencarian atau ganti filter tahun/isu di atas."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((folder) => {
            const summary = summarizeJenis(folder);
            const coverGradient = getCoverGradient(folder);
            const initial = folder.petugas ? folder.petugas.slice(0, 2).toUpperCase() : "PT";

            return (
              <div
                key={folder.id}
                onClick={() => openFolder(folder)}
                className="group relative bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer"
              >
                {/* 1. TOP MEDIA COVER (HERO BANNER) — SUPPORTS THUMBNAILS OR GRADIENT FALLBACK */}
                <div className="relative h-40 bg-gray-900 border-b border-gray-100 flex items-center justify-center overflow-hidden">
                  {folder.thumbnailUrl ? (
                    <>
                      <img
                        src={folder.thumbnailUrl}
                        alt={folder.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Dark gradient overlay for crystal clear badges */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40 pointer-events-none" />
                    </>
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${coverGradient} flex items-center justify-center`}>
                      <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/40 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                      <div className="w-16 h-16 rounded-2xl bg-white/90 shadow-md backdrop-blur-md border border-white/80 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-all duration-300">
                        <Folder className="w-8 h-8 text-indigo-600 fill-indigo-50" />
                      </div>
                    </div>
                  )}

                  {/* Top-Left: Category Pill */}
                  {folder.kategori && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm backdrop-blur-md ${
                        folder.thumbnailUrl
                          ? "bg-black/50 text-white border-white/20"
                          : getCategoryBadgeColor(folder.kategori)
                      }`}>
                        <Tag className="w-2.5 h-2.5" />
                        {folder.kategori}
                      </span>
                    </div>
                  )}

                  {/* Top-Right: Glassmorphism Media Count Pill */}
                  <div className="absolute top-3 right-3 z-10">
                    <div className="bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-2 shadow-sm border border-white/20">
                      {summary.jumlahVideo > 0 && (
                        <span className="flex items-center gap-0.5 text-blue-200">
                          <Video className="w-3 h-3" />
                          {summary.jumlahVideo}
                        </span>
                      )}
                      {summary.jumlahFoto > 0 && (
                        <span className="flex items-center gap-0.5 text-emerald-200">
                          <ImageIcon className="w-3 h-3" />
                          {summary.jumlahFoto}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. CARD CONTENT BODY */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Strakom & Date row */}
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
                      <span className="flex items-center gap-1 font-medium text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {formatTanggal(folder.tanggal)}
                      </span>
                      {folder.strakomNumber && (
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          {folder.strakomNumber}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {folder.title}
                    </h3>
                  </div>

                  {/* Petugas & Content breakdown */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    {/* Petugas Info */}
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                        {initial}
                      </div>
                      <div className="truncate">
                        <p className="text-[11px] font-semibold text-gray-800 truncate">
                          {folder.petugas}
                        </p>
                      </div>
                    </div>

                    {/* Total file badge */}
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/60 shrink-0">
                      {summary.totalFiles} File
                    </span>
                  </div>
                </div>

                {/* 3. CARD FOOTER BUTTON */}
                <div className="px-4 py-2.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-600 group-hover:text-indigo-600 group-hover:bg-indigo-50/40 transition-colors">
                  <span>Lihat Semua File</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODERN PREVIEW & GALLERY DIALOG */}
      <Dialog
        open={selectedFolder !== null}
        onClose={() => setSelectedFolder(null)}
        title={selectedFolder?.title || "Galeri Arsip Kegiatan"}
        size="lg"
      >
        {selectedFolder && (
          <div className="space-y-5">
            {/* Modal Header Metadata Banner */}
            <div className="bg-gradient-to-r from-indigo-50 to-slate-50 p-4 rounded-xl border border-indigo-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-100 text-indigo-800">
                    {selectedFolder.strakomNumber || "ARSIP"}
                  </span>
                  {selectedFolder.kategori && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryBadgeColor(selectedFolder.kategori)}`}>
                      {selectedFolder.kategori}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatTanggal(selectedFolder.tanggal)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  Petugas Dokumentasi: <span className="font-semibold text-gray-800">{selectedFolder.petugas}</span>
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="border-indigo-600 text-indigo-700 hover:bg-indigo-50 font-medium flex items-center gap-1.5 self-start sm:self-auto shrink-0 text-xs"
                onClick={handleDownloadAllFolder}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Semua ({selectedFolder.files.length} File)</span>
              </Button>
            </div>

            {/* Filter Tabs & Search inside Dialog */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Type Switcher */}
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg text-xs self-start">
                <button
                  onClick={() => setDialogJenisKonten("ALL")}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    dialogJenisKonten === "ALL"
                      ? "bg-white text-indigo-700 shadow-xs font-semibold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Semua ({selectedFolder.files.length})
                </button>
                <button
                  onClick={() => setDialogJenisKonten("foto")}
                  className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                    dialogJenisKonten === "foto"
                      ? "bg-white text-emerald-700 shadow-xs font-semibold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <ImageIcon className="w-3 h-3 text-emerald-600" />
                  <span>Foto ({selectedFolder.files.filter((f) => f.jenisKonten === "foto").length})</span>
                </button>
                <button
                  onClick={() => setDialogJenisKonten("video")}
                  className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                    dialogJenisKonten === "video"
                      ? "bg-white text-blue-700 shadow-xs font-semibold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Video className="w-3 h-3 text-blue-600" />
                  <span>Video ({selectedFolder.files.filter((f) => f.jenisKonten === "video").length})</span>
                </button>
              </div>

              {/* Search file in dialog */}
              <div className="w-full sm:w-48">
                <Input
                  placeholder="Cari file..."
                  value={dialogSearch}
                  onChange={(e) => setDialogSearch(e.target.value)}
                  className="w-full text-xs py-1"
                />
              </div>
            </div>

            {/* Media Files Grid in Dialog */}
            {dialogFiles.length === 0 ? (
              <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                <FileCheck className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-semibold text-gray-600">Tidak ada file yang cocok</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Coba ganti filter jenis konten atau kata kunci.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[50vh] overflow-y-auto pr-1">
                {dialogFiles.map((file) => {
                  const isVideo = file.jenisKonten === "video";
                  return (
                    <div
                      key={file.id}
                      className="group relative rounded-xl border border-gray-200/90 bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
                    >
                      {/* Media Thumbnail with dynamic Image / Video Support */}
                      <div className="h-28 bg-gray-900 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden">
                        {file.thumbnailUrl ? (
                          <>
                            <img
                              src={file.thumbnailUrl}
                              alt={file.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                          </>
                        ) : (
                          <div className={`w-full h-full ${isVideo ? "bg-gradient-to-br from-blue-900/10 to-indigo-900/20" : "bg-gradient-to-br from-emerald-900/10 to-teal-900/20"} flex items-center justify-center`}>
                            {isVideo ? (
                              <div className="w-10 h-10 rounded-full bg-blue-100/90 text-blue-700 flex items-center justify-center shadow-xs">
                                <Video className="w-5 h-5" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-emerald-100/90 text-emerald-700 flex items-center justify-center shadow-xs">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Format extension tag */}
                        <span className="absolute bottom-2 right-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-white border border-white/20">
                          {isVideo ? "MP4" : "JPG"}
                        </span>
                      </div>

                      {/* File Details & Actions */}
                      <div className="p-2.5 space-y-1.5">
                        <p className="text-xs font-semibold text-gray-900 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <span>{file.size || "3.5 MB"}</span>
                          <span className={`capitalize font-medium ${isVideo ? "text-blue-600" : "text-emerald-600"}`}>
                            {file.jenisKonten}
                          </span>
                        </div>

                        {/* Hover Quick Action Buttons */}
                        <div className="pt-1.5 flex items-center gap-1.5 border-t border-gray-100">
                          <button
                            onClick={() => addToast(`Membuka pratinjau ${file.name}`, "info")}
                            className="flex-1 py-1 text-[11px] font-medium text-gray-700 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-md transition-colors flex items-center justify-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat</span>
                          </button>
                          <button
                            onClick={() => handleDownloadSingle(file)}
                            className="py-1 px-2 text-[11px] font-medium text-gray-700 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-md transition-colors flex items-center justify-center"
                            title="Unduh File"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default BankKontenPage;

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../lib/api-client";
import type { MockBankKontenFolder, MockBankKontenFile } from "../../lib/mock-data";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import { LoadingSpinner, ErrorState, EmptyState } from "../../components/shared/StateComponents";
import {
  Folder, Image as ImageIcon, Video, Calendar, User,
  Download, Eye, ArrowUpRight, UploadCloud, HardDrive,
  FileCheck, Filter, Search
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

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
  const jumlahFoto = (folder.files || []).filter((f) => f.jenisKonten === "foto").length;
  const jumlahVideo = (folder.files || []).filter((f) => f.jenisKonten === "video").length;
  const totalFiles = (folder.files || []).length;
  return { jumlahFoto, jumlahVideo, totalFiles };
};

const BankKontenPage = () => {
  const { addToast } = useToast();

  const { data: folders = [], isLoading, error, refetch } = useQuery({
    queryKey: ["bank-konten"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: MockBankKontenFolder[] }>("/productions/bank-konten");
        return res.data || [];
      } catch {
        return [];
      }
    },
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
      .sort((a, b) => (b as number) - (a as number))
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
      result = result.filter((f) => new Date(f.tanggal).getFullYear() === Number(tahun));
    }
    return [...result].sort((a, b) => {
      const diff = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
      return urutan === "terbaru" ? diff : -diff;
    });
  }, [folders, search, selectedCategory, tahun, urutan]);

  const dialogFiles = useMemo(() => {
    if (!selectedFolder) return [];
    let files = selectedFolder.files;
    if (dialogJenisKonten !== "ALL") {
      files = files.filter((f) => f.jenisKonten === dialogJenisKonten);
    }
    if (dialogSearch.trim()) {
      const q = dialogSearch.toLowerCase();
      files = files.filter((f) => f.name.toLowerCase().includes(q));
    }
    return files;
  }, [selectedFolder, dialogJenisKonten, dialogSearch]);

  const handleDownloadSingle = (file: MockBankKontenFile) => {
    addToast(`Memulai unduhan file "${file.name}"...`, "success");
    const link = document.createElement("a");
    link.href = file.workLink;
    link.target = "_blank";
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAllFolder = () => {
    if (!selectedFolder) return;
    addToast(
      `Memulai pengunduhan ${selectedFolder.files.length} arsip kegiatan ${selectedFolder.title}...`,
      "success"
    );
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0f1f5c] tracking-tight flex items-center gap-2">
            <span>Bank Konten</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100/80 text-[#0f1f5c] border border-blue-200/60">
              Arsip Digital
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pusat penyimpanan &amp; penemuan kembali aset dokumentasi liputan IKP Diskominfo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="bg-[#0f1f5c] hover:bg-[#162a7a] text-white shadow-xs flex items-center gap-1.5"
            onClick={() => addToast("Silakan unggah luaran melalui menu Produksi.", "info")}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Unggah Berkas Baru</span>
          </Button>
        </div>
      </div>

      {/* Modern Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400">Total Folder Kegiatan</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{stats.totalFolders}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Folder className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400">Total Arsip Foto</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{stats.totalFoto}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ImageIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400">Total Arsip Video</p>
            <p className="text-2xl font-black text-blue-600 mt-0.5">{stats.totalVideo}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400">Kapasitas Terpakai</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">1.2 TB</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Cari berdasarkan nama kegiatan, nomor strakom, atau petugas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full text-xs sm:text-sm py-2"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              options={[{ value: "", label: "Semua Tahun" }, ...tahunOptions]}
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="w-full md:w-36 text-xs"
            />
            <Select
              options={[
                { value: "terbaru", label: "Terbaru" },
                { value: "terlama", label: "Terlama" },
              ]}
              value={urutan}
              onChange={(e) => setUrutan(e.target.value)}
              className="w-full md:w-32 text-xs"
            />
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-gray-400 font-semibold text-[11px] uppercase mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Isu:
          </span>
          {["ALL", "SOSIAL", "EKONOMI", "LINGKUNGAN"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 ${
                selectedCategory === cat
                  ? "bg-[#0f1f5c] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat === "ALL" ? "Semua Kategori" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Folders Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada folder kegiatan"
          description="Tidak ada arsip kegiatan yang sesuai dengan kriteria filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((folder) => {
            const summary = summarizeJenis(folder);
            const initial = folder.petugas.slice(0, 2).toUpperCase();
            const coverGradient = getCoverGradient(folder);

            return (
              <div
                key={folder.id}
                onClick={() => openFolder(folder)}
                className="group bg-white rounded-2xl border border-gray-200/80 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between"
              >
                {/* 1. VISUAL COVER BANNER WITH GLASSMORPHISM BADGES */}
                <div className={`h-36 bg-gradient-to-br ${coverGradient} relative p-4 flex flex-col justify-between border-b border-gray-100/80 overflow-hidden`}>
                  {/* Top Metadata Badges */}
                  <div className="flex items-center justify-between gap-2 z-10">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/80 backdrop-blur-md text-gray-700 border border-white/40 shadow-2xs">
                      {folder.strakomNumber || "ARSIP"}
                    </span>

                    {folder.kategori && (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs backdrop-blur-md ${getCategoryBadgeColor(folder.kategori)}`}>
                        {folder.kategori}
                      </span>
                    )}
                  </div>

                  {/* Center Folder Glow Icon */}
                  <div className="self-center transform group-hover:scale-110 transition-transform duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-white/90 shadow-md backdrop-blur-md flex items-center justify-center text-indigo-700">
                      <Folder className="w-6 h-6 fill-indigo-600/20" />
                    </div>
                  </div>

                  {/* Bottom Type Pills */}
                  <div className="flex items-center justify-between text-[11px] text-gray-500 z-10">
                    <div className="flex items-center gap-1.5">
                      {summary.jumlahFoto > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/80 backdrop-blur-md text-emerald-800 font-semibold border border-white/40">
                          <ImageIcon className="w-3 h-3 text-emerald-600" />
                          {summary.jumlahFoto}
                        </span>
                      )}
                      {summary.jumlahVideo > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/80 backdrop-blur-md text-blue-800 font-semibold border border-white/40">
                          <Video className="w-3 h-3 text-blue-600" />
                          {summary.jumlahVideo}
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-md">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {formatTanggal(folder.tanggal)}
                    </span>
                  </div>
                </div>

                {/* 2. CARD CONTENT INFO */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {folder.title}
                    </h3>
                  </div>

                  {/* Petugas & Content breakdown */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
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

                        <span className="absolute bottom-2 right-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-white border border-white/20">
                          {isVideo ? "MP4" : "JPG"}
                        </span>
                      </div>

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

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { apiFetch } from "../../lib/api-client";
import type { ApiBankKontenFolder } from "../../types/api.types";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, EmptyState } from "../../components/shared/StateComponents";
import {
  Folder, Image as ImageIcon, Video, Calendar,
  ArrowUpRight, UploadCloud, HardDrive,
  Filter, Search
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { useLanguage } from "../../lib/LanguageContext";

const formatTanggal = (iso: string, language: string) =>
  new Date(iso).toLocaleDateString(language === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short", year: "numeric" });

const getCoverGradient = (folder: ApiBankKontenFolder) => {
  const category = folder.kategori?.toUpperCase();
  if (category === "SOSIAL") return "from-blue-600/15 via-indigo-500/10 to-violet-600/20";
  if (category === "EKONOMI") return "from-emerald-600/15 via-teal-500/10 to-cyan-600/20";
  if (category === "LINGKUNGAN") return "from-green-600/15 via-emerald-500/10 to-lime-600/20";
  return "from-indigo-600/15 via-purple-500/10 to-pink-600/20";
};

const getCategoryBadgeColor = (kategori?: string) => {
  const cat = kategori?.toUpperCase();
  if (cat === "SOSIAL") return "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
  if (cat === "EKONOMI") return "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  if (cat === "LINGKUNGAN") return "bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
  return "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
};

const summarizeJenis = (folder: ApiBankKontenFolder) => {
  const jumlahFoto = (folder.files || []).filter((f) => f.jenisKonten === "foto").length;
  const jumlahVideo = (folder.files || []).filter((f) => f.jenisKonten === "video").length;
  const totalFiles = (folder.files || []).length;
  return { jumlahFoto, jumlahVideo, totalFiles };
};

const BankKontenPage = () => {
  const { addToast } = useToast();
  const { language } = useLanguage();

  const { data: folders = [], isLoading, error, refetch } = useQuery({
    queryKey: ["bank-konten"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: ApiBankKontenFolder[] }>("/productions/bank-konten");
        return res.data || [];
      } catch {
        return [];
      }
    },
  });

  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [tahun, setTahun] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [urutan, setUrutan] = useState("terbaru");

  const openFolder = (folder: ApiBankKontenFolder) => {
    navigate(folder.id);
  };

  const tahunOptions = useMemo(() => {
    if (!folders) return [];
    const years = new Set(folders.map((f) => new Date(f.tanggal).getFullYear()));
    return [...years]
      .sort((a, b) => (b as number) - (a as number))
      .map((y) => ({ value: String(y), label: language === "en" ? `Year ${y}` : `Tahun ${y}` }));
  }, [folders, language]);

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






  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0f1f5c] dark:text-sky-400 tracking-tight flex items-center gap-2">
            <span>{language === "en" ? "Content Bank" : "Bank Konten"}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100/80 dark:bg-sky-500/20 text-[#0f1f5c] dark:text-sky-300 border border-blue-200/60 dark:border-sky-500/30">
              {language === "en" ? "Digital Archive" : "Arsip Digital"}
            </span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {language === "en"
              ? "Centralized storage & retrieval for IKP Diskominfo coverage documentation assets."
              : "Pusat penyimpanan & penemuan kembali aset dokumentasi liputan IKP Diskominfo."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="bg-[#0f1f5c] hover:bg-[#162a7a] text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
            onClick={() => addToast(language === "en" ? "Please upload output via Production menu." : "Silakan unggah luaran melalui menu Produksi.", "info")}
          >
            <UploadCloud className="w-4 h-4" />
            <span>{language === "en" ? "Upload New File" : "Unggah Berkas Baru"}</span>
          </Button>
        </div>
      </div>

      {/* Modern Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400">{language === "en" ? "Total Activity Folders" : "Total Folder Kegiatan"}</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{stats.totalFolders}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Folder className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400">{language === "en" ? "Total Photo Archives" : "Total Arsip Foto"}</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{stats.totalFoto}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ImageIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400">{language === "en" ? "Total Video Archives" : "Total Arsip Video"}</p>
            <p className="text-2xl font-black text-blue-600 mt-0.5">{stats.totalVideo}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400">{language === "en" ? "Storage Used" : "Kapasitas Terpakai"}</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">1.2 TB</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={language === "en" ? "Search by activity name, strakom number, or officer..." : "Cari berdasarkan nama kegiatan, nomor strakom, atau petugas..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full text-xs sm:text-sm py-2"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              options={[{ value: "", label: language === "en" ? "All Years" : "Semua Tahun" }, ...tahunOptions]}
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="w-full md:w-36 text-xs"
            />
            <Select
              options={[
                { value: "terbaru", label: language === "en" ? "Newest" : "Terbaru" },
                { value: "terlama", label: language === "en" ? "Oldest" : "Terlama" },
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
            <Filter className="w-3 h-3" /> {language === "en" ? "Topic:" : "Isu:"}
          </span>
          {["ALL", "SOSIAL", "EKONOMI", "LINGKUNGAN"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#0f1f5c] dark:bg-blue-600 text-white shadow-xs"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 border border-transparent dark:border-gray-700"
              }`}
            >
              {cat === "ALL" ? (language === "en" ? "All Categories" : "Semua Kategori") : (language === "en" ? (cat === "SOSIAL" ? "SOCIAL" : cat === "EKONOMI" ? "ECONOMY" : "ENVIRONMENT") : cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Folders Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title={language === "en" ? "No activity folders found" : "Tidak ada folder kegiatan"}
          description={language === "en" ? "No activity archives match the filter criteria." : "Tidak ada arsip kegiatan yang sesuai dengan kriteria filter."}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {filtered.map((folder) => {
            const summary = summarizeJenis(folder);
            const initial = folder.petugas.slice(0, 2).toUpperCase();
            const coverGradient = getCoverGradient(folder);

            return (
              <div
                key={folder.id}
                onClick={() => openFolder(folder)}
                className="group bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between"
              >
                {/* 1. VISUAL COVER BANNER WITH REAL THUMBNAIL & GLASSMORPHISM BADGES */}
                <div className={`h-36 bg-gradient-to-br ${coverGradient} relative p-4 flex flex-col justify-between border-b border-gray-100/80 dark:border-gray-800 overflow-hidden`}>
                  {/* REAL IMAGE THUMBNAIL IF PRESENT */}
                  {folder.thumbnailUrl ? (
                    <>
                      <img
                        src={folder.thumbnailUrl}
                        alt={folder.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/40 pointer-events-none" />
                    </>
                  ) : null}

                  {/* Top Metadata Badges */}
                  <div className="flex items-center justify-between gap-2 z-10">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-gray-800 dark:text-gray-100 border border-white/40 dark:border-gray-700 shadow-2xs">
                      {folder.strakomNumber || (language === "en" ? "ARCHIVE" : "ARSIP")}
                    </span>

                    {folder.kategori && (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs backdrop-blur-md ${getCategoryBadgeColor(folder.kategori)}`}>
                        {folder.kategori}
                      </span>
                    )}
                  </div>

                  {/* Center Folder Glow Icon ONLY IF NO THUMBNAIL */}
                  {!folder.thumbnailUrl && (
                    <div className="self-center transform group-hover:scale-110 transition-transform duration-300 z-10">
                      <div className="w-12 h-12 rounded-2xl bg-white/90 dark:bg-gray-800/90 shadow-md backdrop-blur-md flex items-center justify-center text-indigo-700 dark:text-indigo-400">
                        <Folder className="w-6 h-6 fill-indigo-600/20" />
                      </div>
                    </div>
                  )}

                  {/* Bottom Type Pills */}
                  <div className="flex items-center justify-between text-[11px] text-gray-500 z-10">
                    <div className="flex items-center gap-1.5">
                      {summary.jumlahFoto > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-emerald-800 dark:text-emerald-300 font-semibold border border-white/40 dark:border-gray-700 shadow-2xs">
                          <ImageIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {summary.jumlahFoto}
                        </span>
                      )}
                      {summary.jumlahVideo > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-blue-800 dark:text-blue-300 font-semibold border border-white/40 dark:border-gray-700 shadow-2xs">
                          <Video className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          {summary.jumlahVideo}
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-800 dark:text-gray-200 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/40 dark:border-gray-700 shadow-2xs">
                      <Calendar className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                      {formatTanggal(folder.tanggal, language)}
                    </span>
                  </div>
                </div>

                {/* 2. CARD CONTENT INFO */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                      {folder.title}
                    </h3>
                  </div>

                  {/* Petugas & Content breakdown */}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                        {initial}
                      </div>
                      <div className="truncate">
                        <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {folder.petugas}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-100/60 dark:border-indigo-800/60 shrink-0">
                      {summary.totalFiles} {language === "en" ? "Files" : "File"}
                    </span>
                  </div>
                </div>

                {/* 3. CARD FOOTER BUTTON */}
                <div className="px-4 py-2.5 bg-gray-50/70 dark:bg-slate-900/60 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50/40 dark:group-hover:bg-indigo-950/40 transition-colors">
                  <span>{language === "en" ? "View All Files" : "Lihat Semua File"}</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}


    </div>
  );
};

export default BankKontenPage;


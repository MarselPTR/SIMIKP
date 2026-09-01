import { useState, useMemo } from "react";
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
  Download, ArrowUpRight, UploadCloud, HardDrive,
  Filter, Search
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { useLanguage } from "../../lib/LanguageContext";

const formatTanggalLocale = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short", year: "numeric" });

const getCoverGradient = (folder: MockBankKontenFolder) => {
  const category = folder.kategori?.toUpperCase();
  if (category === "SOSIAL") return "from-blue-600/15 via-indigo-500/10 to-violet-600/20";
  if (category === "EKONOMI") return "from-emerald-600/15 via-teal-500/10 to-cyan-600/20";
  if (category === "LINGKUNGAN") return "from-green-600/15 via-emerald-500/10 to-lime-600/20";
  return "from-indigo-600/15 via-purple-500/10 to-pink-600/20";
};

const getCategoryBadgeColor = (kategori?: string) => {
  const cat = kategori?.toUpperCase();
  if (cat === "SOSIAL") return "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
  if (cat === "EKONOMI") return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  if (cat === "LINGKUNGAN") return "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
  return "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
};

const summarizeJenis = (folder: MockBankKontenFolder) => {
  const jumlahFoto = folder.files.filter((f) => f.jenisKonten === "foto").length;
  const jumlahVideo = folder.files.filter((f) => f.jenisKonten === "video").length;
  const totalFiles = folder.files.length;
  return { jumlahFoto, jumlahVideo, totalFiles };
};

const BankKontenPage = () => {
  const { addToast } = useToast();
  const { t, language } = useLanguage();

  const { data: folders, isLoading, error, refetch } = useQuery({
    queryKey: ["bank-konten"],
    queryFn: async () => {
      return mockApi.bankKonten.getAll();
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
      .map((y) => ({ value: String(y), label: `${language === "en" ? "Year" : "Tahun"} ${y}` }));
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
          f.strakomNumber?.toLowerCase().includes(q) ||
          f.files.some((file) => file.name.toLowerCase().includes(q)),
      );
    }
    if (selectedCategory !== "ALL") {
      result = result.filter((f) => f.kategori?.toUpperCase() === selectedCategory);
    }
    if (tahun) {
      result = result.filter((f) => String(new Date(f.tanggal).getFullYear()) === tahun);
    }
    result = [...result].sort((a, b) => {
      const dateA = new Date(a.tanggal).getTime();
      const dateB = new Date(b.tanggal).getTime();
      return urutan === "terbaru" ? dateB - dateA : dateA - dateB;
    });
    return result;
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

  const handleDownloadAllFolder = () => {
    if (!selectedFolder) return;
    addToast(
      language === "en"
        ? `Downloading full archive: "${selectedFolder.title}" (${selectedFolder.files.length} files)`
        : `Mengunduh seluruh berkas arsip: "${selectedFolder.title}" (${selectedFolder.files.length} file)`,
      "success",
    );
  };

  const handleDownloadSingle = (file: MockBankKontenFile) => {
    addToast(language === "en" ? `Downloading "${file.name}"` : `Mengunduh berkas "${file.name}"`, "info");
  };

  if (isLoading) {
    return <LoadingSpinner text={t("loading")} />;
  }

  if (error) {
    return <ErrorState message={t("error")} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-gray-900 dark:text-gray-100">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#161b22] rounded-3xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            {t("bank_title")}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("bank_subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="bg-[#0f1f5c] dark:bg-blue-600 hover:bg-[#182c7a] dark:hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
            onClick={() => addToast(language === "en" ? "Upload media from the assignments module" : "Buka modul penugasan untuk mengunggah luaran baru", "info")}
          >
            <UploadCloud className="w-4 h-4" />
            <span>{t("bank_upload_btn")}</span>
          </Button>
        </div>
      </div>

      {/* Modern Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
              {language === "en" ? "Total Activity Folders" : "Total Folder Kegiatan"}
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-0.5">{stats.totalFolders}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Folder className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
              {language === "en" ? "Total Photos Archived" : "Total Arsip Foto"}
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.totalFoto}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ImageIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
              {language === "en" ? "Total Videos Archived" : "Total Arsip Video"}
            </p>
            <p className="text-2xl font-black text-blue-600 dark:text-sky-400 mt-0.5">{stats.totalVideo}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400 flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{t("bank_storage_used")}</p>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-0.5">1.2 TB</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 shadow-xs space-y-3 transition-colors">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={t("bank_search_ph")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full text-xs sm:text-sm py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              options={[{ value: "", label: t("bank_filter_year") }, ...tahunOptions]}
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="w-full md:w-36 text-xs bg-white dark:bg-gray-900"
            />
            <Select
              options={[
                { value: "terbaru", label: t("bank_sort_newest") },
                { value: "terlama", label: t("bank_sort_oldest") },
              ]}
              value={urutan}
              onChange={(e) => setUrutan(e.target.value)}
              className="w-full md:w-32 text-xs bg-white dark:bg-gray-900"
            />
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-gray-400 dark:text-gray-500 font-semibold text-[11px] uppercase mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> {language === "en" ? "Category:" : "Isu:"}
          </span>
          {["ALL", "SOSIAL", "EKONOMI", "LINGKUNGAN"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#0f1f5c] dark:bg-blue-600 text-white shadow-xs"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {cat === "ALL" ? t("bank_filter_category") : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Folders Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title={language === "en" ? "No activity folders" : "Tidak ada folder kegiatan"}
          description={t("bank_empty_folder")}
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
                className="group bg-white dark:bg-[#161b22] rounded-3xl border border-gray-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-sky-500 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between"
              >
                {/* 1. VISUAL COVER BANNER */}
                <div className={`h-36 bg-gradient-to-br ${coverGradient} relative p-4 flex flex-col justify-between border-b border-gray-100/80 dark:border-gray-800 overflow-hidden`}>
                  <div className="flex items-center justify-between gap-2 z-10">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-md text-gray-700 dark:text-gray-300 border border-white/40 dark:border-gray-700 shadow-2xs">
                      {folder.strakomNumber || "ARSIP"}
                    </span>

                    {folder.kategori && (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs backdrop-blur-md ${getCategoryBadgeColor(folder.kategori)}`}>
                        {folder.kategori}
                      </span>
                    )}
                  </div>

                  <div className="flex items-end justify-between z-10">
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-xs font-semibold">
                      <Folder className="w-3.5 h-3.5" />
                      <span>{summary.totalFiles} {language === "en" ? "Files" : "File"}</span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex items-center justify-center font-bold text-xs shadow-md group-hover:scale-110 transition-transform">
                      {initial}
                    </div>
                  </div>
                </div>

                {/* 2. BODY CONTENT */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 leading-snug group-hover:text-indigo-600 dark:group-hover:text-sky-400 transition-colors">
                      {folder.title}
                    </h3>

                    <div className="mt-2.5 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{formatTanggalLocale(folder.tanggal, language)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{folder.petugas}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. CARD FOOTER */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 font-semibold">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <ImageIcon className="w-3.5 h-3.5" /> {summary.jumlahFoto} {t("bank_folder_photos")}
                      </span>
                      <span className="flex items-center gap-1 text-blue-600 dark:text-sky-400">
                        <Video className="w-3.5 h-3.5" /> {summary.jumlahVideo} {t("bank_folder_videos")}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-indigo-600 dark:text-sky-400 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      <span>{language === "en" ? "Explore" : "Buka"}</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Folder Detail / Preview Dialog */}
      <Dialog
        open={!!selectedFolder}
        onClose={() => setSelectedFolder(null)}
        title={selectedFolder?.title ?? "Detail Folder"}
        size="lg"
      >
        {selectedFolder && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-800 text-xs">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <span><strong>{t("date")}:</strong> {formatTanggalLocale(selectedFolder.tanggal, language)}</span>
                <span><strong>{language === "en" ? "Officer" : "Petugas"}:</strong> {selectedFolder.petugas}</span>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadAllFolder}
                className="bg-[#0f1f5c] dark:bg-blue-600 text-white flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{language === "en" ? "Download Full Archive (.zip)" : "Unduh Semua Berkas (.zip)"}</span>
              </Button>
            </div>

            {/* Filter in Dialog */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {(["ALL", "foto", "video"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDialogJenisKonten(type)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      dialogJenisKonten === type
                        ? "bg-[#0f1f5c] dark:bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {type === "ALL" ? t("all") : type === "foto" ? t("bank_folder_photos") : t("bank_folder_videos")}
                  </button>
                ))}
              </div>
              <Input
                placeholder={language === "en" ? "Search file..." : "Cari file..."}
                value={dialogSearch}
                onChange={(e) => setDialogSearch(e.target.value)}
                className="w-48 text-xs py-1"
              />
            </div>

            {/* File List */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {dialogFiles.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">{t("bank_empty_folder")}</p>
              ) : (
                dialogFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-700 shadow-2xs flex items-center justify-center text-gray-600 dark:text-gray-300 shrink-0">
                        {file.jenisKonten === "foto" ? <ImageIcon className="w-4 h-4 text-emerald-600" /> : <Video className="w-4 h-4 text-blue-600" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                        <p className="text-[10px] text-gray-400">{file.size}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(file)}
                      className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition cursor-pointer"
                      title={t("bank_download_file")}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedFolder(null)}>
                {t("close")}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default BankKontenPage;

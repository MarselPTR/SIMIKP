import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api-client";
import { LoadingSpinner, ErrorState, EmptyState } from "../../components/shared/StateComponents";
import { useLanguage } from "../../lib/LanguageContext";
import {
  ArrowLeft, FileText, Image as ImageIcon, Video, Folder, Calendar, Download, Eye, Check, Copy, Play, ChevronLeft, ChevronRight
} from "lucide-react";
import Dialog from "../../components/ui/Dialog";
import Button from "../../components/ui/Button";
import { useToast } from "../../contexts/ToastContext";
import { useState } from "react";

const formatTanggal = (iso: string, language: string) =>
  new Date(iso).toLocaleDateString(language === "en" ? "en-US" : "id-ID", { day: "numeric", month: "long", year: "numeric" });

const BankKontenDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addToast } = useToast();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const [previewMediaList, setPreviewMediaList] = useState<{ url: string; type: "video" | "image"; name: string }[]>([]);
  const [previewMediaIndex, setPreviewMediaIndex] = useState<number | null>(null);

  const handleOpenPreview = (files: any[], startIndex: number) => {
    const mapped = files.map(f => ({
      url: f.workLink || f.url || f.thumbnailUrl,
      type: (f.jenisKonten === "video" || (f.mimeType && f.mimeType.startsWith("video"))) ? "video" as const : "image" as const,
      name: f.name || f.originalName || "Media",
    }));
    setPreviewMediaList(mapped);
    setPreviewMediaIndex(startIndex);
  };

  const { data: folder, isLoading, error, refetch } = useQuery({
    queryKey: ["bank-konten-detail", id],
    queryFn: async () => {
      const res = await apiFetch<{ success: boolean; data: any[] }>("/productions/bank-konten");
      if (res.data) {
        return res.data.find(f => f.id === id) || null;
      }
      return null;
    },
  });

  const handleDownloadSingle = (file: any) => {
    addToast(
      language === "en" ? `Starting download for "${file.name}"...` : `Memulai unduhan file "${file.name}"...`,
      "success"
    );
    const link = document.createElement("a");
    link.href = file.workLink;
    link.target = "_blank";
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyText = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(title);
    addToast(language === "en" ? "Text copied to clipboard!" : "Teks berhasil disalin!", "success");
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!folder) return (
    <EmptyState 
      title={language === "en" ? "Folder Not Found" : "Folder Tidak Ditemukan"} 
      description={language === "en" ? "The archive you are looking for does not exist." : "Arsip yang Anda cari tidak tersedia."}
    />
  );

  // Group files by roleCategory
  const fotograferFiles = folder.files?.filter((f: any) => f.roleCategory === "FOTOGRAFER") || [];
  const desainerFiles = folder.files?.filter((f: any) => f.roleCategory === "DESAINER") || [];
  const prahumFiles = folder.files?.filter((f: any) => f.roleCategory === "PRAHUM") || [];

  const renderGridFiles = (files: any[]) => {
    if (files.length === 0) {
      return (
        <div className="py-8 text-center bg-gray-50 dark:bg-[#161b22] rounded-xl border border-gray-100/50 dark:border-gray-800/50">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {language === "en" ? "No files available." : "Belum ada file."}
          </p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {files.map((file, idx) => {
          const isVideo = file.jenisKonten === "video";
          return (
            <div
              key={file.id}
              className="group relative rounded-xl border border-gray-200/90 dark:border-gray-800 bg-white dark:bg-[#161b22] hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
            >
              <div 
                className="h-32 bg-gray-900 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden cursor-pointer"
                onClick={() => handleOpenPreview(files, idx)}
              >
                {file.thumbnailUrl ? (
                  <>
                    <img
                      src={file.thumbnailUrl}
                      alt={file.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md shadow-lg border border-white/30 group-hover:scale-110 transition-transform duration-300">
                          <Play className="w-4 h-4 text-white ml-1" fill="currentColor" />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`w-full h-full ${isVideo ? "bg-gradient-to-br from-blue-900/10 to-indigo-900/20" : "bg-gradient-to-br from-emerald-900/10 to-teal-900/20"} flex items-center justify-center group-hover:opacity-80 transition`}>
                    {isVideo ? (
                      <div className="w-10 h-10 rounded-full bg-blue-100/90 text-blue-700 flex items-center justify-center shadow-xs">
                        <Play className="w-5 h-5 ml-1" fill="currentColor" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-100/90 text-emerald-700 flex items-center justify-center shadow-xs">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none flex items-center justify-center">
                  {!isVideo && <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-md" />}
                </div>
                <span className="absolute bottom-2 right-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-white border border-white/20 uppercase">
                  {file.workLink?.split('.').pop() || "FILE"}
                </span>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-2" title={file.name}>
                  {file.name}
                </p>
                <div className="pt-2 flex items-center gap-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => handleOpenPreview(files, idx)}
                    className="flex-1 py-1 text-[11px] font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{language === "en" ? "View" : "Lihat"}</span>
                  </button>
                  <button
                    onClick={() => handleDownloadSingle(file)}
                    className="py-1 px-2.5 text-[11px] font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-md transition-colors flex items-center justify-center cursor-pointer"
                    title={language === "en" ? "Download File" : "Unduh File"}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#0f1f5c] dark:text-gray-400 dark:hover:text-sky-400 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{language === "en" ? "Back to Content Bank" : "Kembali ke Bank Konten"}</span>
      </button>

      {/* Header Info */}
      <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-[#0f1f5c]">
          <Folder className="w-48 h-48 -rotate-12 translate-x-12 -translate-y-12" />
        </div>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50 shadow-2xs">
                {folder.strakomNumber}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg border bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-2xs">
                {folder.kategori}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {folder.title}
            </h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-2">
              <Calendar className="w-4 h-4" />
              {formatTanggal(folder.tanggal, language)}
            </p>
          </div>
        </div>
      </div>

      {/* TABS / SECTIONS */}
      <div className="space-y-8">
        {/* Section 1: Fotografer / Videografer */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
            <ImageIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {language === "en" ? "Field Documentation (Photo/Video)" : "Dokumentasi Lapangan (Fotografer / Videografer)"}
            </h2>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-400">
              {fotograferFiles.length}
            </span>
          </div>
          {renderGridFiles(fotograferFiles)}
        </div>

        {/* Section 2: Editor / Desainer */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
            <Video className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {language === "en" ? "Edits & Designs" : "Hasil Desain & Edit (Editor / Desainer)"}
            </h2>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-400">
              {desainerFiles.length}
            </span>
          </div>
          {renderGridFiles(desainerFiles)}
        </div>

        {/* Section 3: Prahum (Naskah) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
            <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {language === "en" ? "News Script (Prahum)" : "Naskah Berita (Prahum)"}
            </h2>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-400">
              {prahumFiles.length}
            </span>
          </div>
          
          {prahumFiles.length === 0 ? (
            <div className="py-8 text-center bg-gray-50 dark:bg-[#161b22] rounded-xl border border-gray-100/50 dark:border-gray-800/50">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {language === "en" ? "No scripts available." : "Belum ada naskah berita."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prahumFiles.map((file: any) => (
                <div key={file.id} className="bg-white dark:bg-[#161b22] border border-gray-200/80 dark:border-gray-800 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex-1">{file.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-lg border border-amber-200/50 dark:border-amber-800/50 shadow-2xs shrink-0">
                        NASKAH
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-[11px] text-gray-600 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50 whitespace-pre-wrap">
                      {file.workLink}
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full justify-center flex items-center gap-1.5 cursor-pointer text-xs font-semibold py-1.5"
                    onClick={() => handleCopyText(file.workLink, file.name)}
                  >
                    {copiedLink === file.name ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600">{language === "en" ? "Copied!" : "Tersalin!"}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{language === "en" ? "Copy Text" : "Salin Teks"}</span>
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={previewMediaIndex !== null}
        onClose={() => setPreviewMediaIndex(null)}
        title={previewMediaIndex !== null ? previewMediaList[previewMediaIndex]?.name || (language === "en" ? "Media Preview" : "Pratinjau Media") : ""}
        size="xl"
      >
        {previewMediaIndex !== null && previewMediaList[previewMediaIndex] && (
          <div className="relative flex flex-col items-center justify-center bg-black/95 rounded-xl overflow-hidden min-h-[50vh] p-2 group">
            {previewMediaIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewMediaIndex(previewMediaIndex - 1);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white backdrop-blur-md transition-all z-10 opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {previewMediaList[previewMediaIndex].type === "video" ? (
              <video
                key={previewMediaList[previewMediaIndex].url}
                src={previewMediaList[previewMediaIndex].url}
                controls
                controlsList="nodownload"
                autoPlay
                className="w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <img
                key={previewMediaList[previewMediaIndex].url}
                src={previewMediaList[previewMediaIndex].url}
                alt={previewMediaList[previewMediaIndex].name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              />
            )}

            {previewMediaIndex < previewMediaList.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewMediaIndex(previewMediaIndex + 1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white backdrop-blur-md transition-all z-10 opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-full text-white/80 text-xs font-medium backdrop-blur-md">
              {previewMediaIndex + 1} / {previewMediaList.length}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default BankKontenDetailPage;

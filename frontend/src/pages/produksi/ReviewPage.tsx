import { useState, useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Search,
  MessageSquare,
  Clock,
  Send,
  Eye,
  MapPin,
  Upload,
  History,
  BookOpen,
  Copy,
  Download,
  Sparkles,
  Layers,
  Check,
} from "lucide-react";
import { usePetugasTasksStore } from "../../lib/petugas-store";
import type { PetugasTaskItem } from "../../lib/petugas-store";
import { WORKFLOWS } from "../../lib/mock-data";
import { apiFetch } from "../../lib/api-client";
import Dialog from "../../components/ui/Dialog";
import Button from "../../components/ui/Button";
import { useToast } from "../../contexts/ToastContext";
import { useLanguage } from "../../lib/LanguageContext";
import { useAuth } from "../../lib/AuthContext";

const CATEGORY_MAP: Record<string, { id: string; en: string }> = {
  upacara: { id: "Upacara", en: "Ceremony" },
  rapat: { id: "Rapat", en: "Meeting" },
  peresmian: { id: "Peresmian", en: "Inauguration" },
  sidang: { id: "Sidang", en: "Hearing / Session" },
};

const ReviewPage = () => {
  const { allTasks, requestRevision, approveContent } = usePetugasTasksStore();
  const { addToast } = useToast();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "NEED_REVIEW" | "REVISI" | "APPROVED">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Modal State for Minta Revisi
  const [selectedTaskForRevision, setSelectedTaskForRevision] = useState<PetugasTaskItem | null>(null);
  const [revisionNotesInput, setRevisionNotesInput] = useState("");
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  // Modal state untuk pratinjau naskah Prahum
  const [previewNaskahTask, setPreviewNaskahTask] = useState<PetugasTaskItem | null>(null);

  // Modal State for Kurasi Foto & Video (Ahli Pertama)
  const [curationTask, setCurationTask] = useState<PetugasTaskItem | null>(null);
  const [selectedFileUrls, setSelectedFileUrls] = useState<Set<string>>(new Set());
  const [isSubmittingCuration, setIsSubmittingCuration] = useState(false);

  // Modal State for Desainer & Editor Review
  const [designReviewTask, setDesignReviewTask] = useState<PetugasTaskItem | null>(null);

  const openCurationModal = (task: PetugasTaskItem) => {
    setCurationTask(task);
    const allUrls = (task.mediaData?.files || []).map((f) => f.url);
    setSelectedFileUrls(new Set(allUrls));
  };

  const toggleFileSelection = (url: string) => {
    setSelectedFileUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  const handleSelectAllFiles = () => {
    if (!curationTask?.mediaData?.files) return;
    const allUrls = curationTask.mediaData.files.map((f) => f.url);
    setSelectedFileUrls(new Set(allUrls));
  };

  const handleDeselectAllFiles = () => {
    setSelectedFileUrls(new Set());
  };

  const handleApproveCuratedFiles = async () => {
    if (!curationTask || !curationTask.mediaData?.files) return;
    if (selectedFileUrls.size === 0) {
      addToast(
        language === "en"
          ? "Please select at least 1 photo/video for Bank Konten"
          : "Harap pilih minimal 1 foto/video untuk dimasukkan ke Bank Konten Utama",
        "warning"
      );
      return;
    }

    try {
      setIsSubmittingCuration(true);
      const curatedFiles = curationTask.mediaData.files.filter((f) => selectedFileUrls.has(f.url));

      await apiFetch("/productions/curate-approval", {
        method: "POST",
        body: JSON.stringify({
          assignmentId: curationTask.id,
          curatedFiles,
          status: "SIAP_TAYANG",
        }),
      });

      await approveContent(curationTask.id);
      addToast(
        language === "en"
          ? `${curatedFiles.length} curated assets approved and added to Bank Konten!`
          : `${curatedFiles.length} berkas pilihan berhasil disetujui dan resmi masuk ke Bank Konten Utama!`,
        "success"
      );
      setCurationTask(null);
    } catch (err: any) {
      addToast(err?.message || "Gagal memproses persetujuan kurasi", "error");
    } finally {
      setIsSubmittingCuration(false);
    }
  };

  const handleApproveDesign = async (task: PetugasTaskItem) => {
    try {
      if (task.mediaData?.files && task.mediaData.files.length > 0) {
        await apiFetch("/productions/curate-approval", {
          method: "POST",
          body: JSON.stringify({
            assignmentId: task.id,
            curatedFiles: task.mediaData.files,
            status: "SIAP_TAYANG",
          }),
        });
      }
      await approveContent(task.id);
      addToast(
        language === "en"
          ? "Design approved and added to Bank Konten!"
          : "Karya desain berhasil disetujui dan masuk ke Bank Konten Utama!",
        "success"
      );
      setDesignReviewTask(null);
    } catch (err: any) {
      addToast(err?.message || "Gagal menyetujui desain", "error");
    }
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === "ALL") return t("all");
    const found = CATEGORY_MAP[cat];
    if (found) return language === "en" ? found.en : found.id;
    return cat;
  };

  // Filter tasks that have work submitted or in review/revision/siap_tayang
  const reviewableTasks = useMemo(() => {
    return allTasks.filter((t) => {
      if (categoryFilter !== "ALL" && t.kategori !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.kegiatan.toLowerCase().includes(q);
        const matchBidang = t.bidang.toLowerCase().includes(q);
        const matchJob = t.jenisPekerjaan.toLowerCase().includes(q);
        const matchLocation = t.lokasi.toLowerCase().includes(q);
        if (!matchTitle && !matchBidang && !matchJob && !matchLocation) return false;
      }

      const rawStatus = t.status.toUpperCase();
      const isApproved = rawStatus === "SIAP_TAYANG" || rawStatus === "SELESAI" || rawStatus === "COMPLETED";
      const isRevision = rawStatus.includes("REVISI");

      if (statusFilter === "NEED_REVIEW") {
        return !isApproved && !isRevision && rawStatus !== "BELUM";
      }
      if (statusFilter === "REVISI") {
        return isRevision;
      }
      if (statusFilter === "APPROVED") {
        return t.status === "SIAP_TAYANG" || t.status === "SELESAI";
      }

      return true;
    });
  }, [allTasks, searchQuery, statusFilter, categoryFilter]);

  const handleApprove = async (task: PetugasTaskItem) => {
    try {
      await approveContent(task.id);
      addToast(
        language === "en"
          ? `Task "${task.kegiatan}" approved for publication!`
          : `Tugas "${task.kegiatan}" berhasil disetujui untuk penayangan!`,
        "success",
      );
    } catch {
      addToast(t("error"), "error");
    }
  };

  const handleOpenRevisionModal = (task: PetugasTaskItem) => {
    setSelectedTaskForRevision(task);
    setRevisionNotesInput(task.revisionNotes || "");
  };

  const handleSubmitRevision = async () => {
    if (!selectedTaskForRevision) return;
    if (!revisionNotesInput.trim()) {
      addToast(
        language === "en"
          ? "Please provide revision notes for the officer."
          : "Harap masukkan catatan revisi untuk petugas.",
        "warning",
      );
      return;
    }

    setIsSubmittingRevision(true);
    try {
      const authorName = user?.name || (language === "en" ? "First Expert Officer" : "Pranata Ahli Pertama");
      await requestRevision(selectedTaskForRevision.id, revisionNotesInput.trim(), authorName);
      addToast(
        language === "en"
          ? `Revision notes sent to officer (${selectedTaskForRevision.bidang}).`
          : `Catatan revisi berhasil dikirim ke Petugas (${selectedTaskForRevision.bidang}).`,
        "success",
      );
      setSelectedTaskForRevision(null);
      setRevisionNotesInput("");
    } catch {
      addToast(t("error"), "error");
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-gray-900 dark:text-gray-100">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0f1f5c] dark:text-sky-400">
            {t("review_title")}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("review_subtitle")}
          </p>
        </div>
      </div>

      {/* 2. Top Search Bar & Status Segmented Tabs */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("review_search_ph")}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f1f5c]/20 dark:focus:ring-sky-500/20 transition placeholder:text-gray-400"
          />
        </div>

        {/* Status Segmented Tabs */}
        <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] p-1 shadow-xs self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-[#0f1f5c] dark:bg-blue-600 text-white shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            {t("review_tab_all")} ({allTasks.length})
          </button>
          <button
            onClick={() => setStatusFilter("NEED_REVIEW")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              statusFilter === "NEED_REVIEW"
                ? "bg-[#0f1f5c] dark:bg-blue-600 text-white shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            {t("review_tab_need_review")}
          </button>
          <button
            onClick={() => setStatusFilter("REVISI")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              statusFilter === "REVISI"
                ? "bg-[#0f1f5c] dark:bg-blue-600 text-white shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            {t("review_tab_revision")}
          </button>
          <button
            onClick={() => setStatusFilter("APPROVED")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              statusFilter === "APPROVED"
                ? "bg-[#0f1f5c] dark:bg-blue-600 text-white shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            {t("review_tab_approved")}
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mr-1">{t("review_category_filter")}</span>
        {["ALL", "upacara", "rapat", "peresmian", "sidang"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === cat
                ? "bg-[#0f1f5c] dark:bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-[#161b22] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {getCategoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* 3. Review Cards List */}
      <div className="space-y-4 pt-1">
        {reviewableTasks.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#161b22] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 shadow-xs">
            {t("review_no_tasks")}
          </div>
        ) : (
          reviewableTasks.map((tItem) => {
            const taskWorkflow = WORKFLOWS[tItem.bidang || "PRAHUM"] || WORKFLOWS["PRAHUM"];
            const rawStatus = tItem.status === "COMPLETED" ? "SELESAI" : tItem.status === "ASSIGNED" ? "BELUM" : tItem.status;
            const foundIndex = taskWorkflow.indexOf(rawStatus);
            const stepIndex = foundIndex >= 0 ? foundIndex : rawStatus === "SELESAI" ? taskWorkflow.length - 1 : 0;
            const totalSteps = taskWorkflow.length;
            const isCompleted = rawStatus === "SELESAI" || tItem.status === "COMPLETED";
            const isApproved = tItem.status === "SIAP_TAYANG" || isCompleted;
            const isRevision = tItem.status === "REVISI";

            return (
              <div
                key={tItem.id}
                className="relative overflow-hidden rounded-3xl p-5 sm:p-6 border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-sky-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 bg-white dark:bg-[#161b22]"
              >
                {/* Header Information and Action Buttons Row */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 text-xs font-bold rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        {getCategoryLabel(tItem.kategori)}
                      </span>
                      <span className="px-3 py-1 text-xs font-bold rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        {tItem.bidang}
                      </span>

                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${
                          isApproved
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : isRevision
                            ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            : rawStatus === "BELUM"
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                            : "bg-blue-50 dark:bg-blue-950/50 text-[#0f1f5c] dark:text-sky-300 border-blue-200 dark:border-blue-800"
                        }`}
                      >
                        {isApproved ? (
                          <>
                            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                            <span>{isCompleted ? (language === "en" ? "COMPLETED (100%)" : "SELESAI (100%)") : (language === "en" ? "Approved (Ready to Publish)" : "Disetujui (Siap Tayang)")}</span>
                          </>
                        ) : isRevision ? (
                          <>
                            <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400" />
                            <span>{language === "en" ? "Status: Needs Revision" : "Status: Perlu Revisi"}</span>
                          </>
                        ) : (
                          <>
                            <Clock size={13} className="text-[#0f1f5c] dark:text-sky-400" />
                            <span>{rawStatus.replace("_", " ")}</span>
                          </>
                        )}
                      </span>

                      <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                        {tItem.jenisPekerjaan}
                      </span>

                      {tItem.hasConflict && (
                        <span className="px-3 py-1 text-xs font-bold rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                          <AlertTriangle size={13} className="text-rose-600 dark:text-rose-400" />
                          {t("conflict")}
                        </span>
                      )}

                      {tItem.workLink && (
                        <span className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                          <Upload size={12} className="text-emerald-600 dark:text-emerald-400" />
                          {language === "en" ? "Deliverables Attached" : "Luaran Tersimpan"}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug">
                      {tItem.kegiatan}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-0.5">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-[#0f1f5c] dark:text-sky-400" /> {tItem.lokasi}
                      </span>
                      <span className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-0.5 rounded-md">
                        <Clock size={12} className="text-[#0f1f5c] dark:text-sky-400" /> {t("deadline")}: {tItem.deadline}
                      </span>
                    </div>
                  </div>

                  {/* Review Action Buttons based on Role & Data */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
                    {/* Review Action Buttons based on Role & Data */}
                    {tItem.workLink ? (
                      tItem.bidang === "PRAHUM" ? (
                        <button
                          type="button"
                          onClick={() => setPreviewNaskahTask(tItem)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#0f1f5c] dark:text-sky-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition cursor-pointer shadow-xs"
                        >
                          <BookOpen size={14} className="text-blue-600 dark:text-sky-400" />
                          <span>{language === "en" ? "Read & Review Script" : "Baca & Telaah Naskah"}</span>
                        </button>
                      ) : tItem.bidang === "DESAINER_EDITOR" ? (
                        <button
                          type="button"
                          onClick={() => setDesignReviewTask(tItem)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 transition cursor-pointer shadow-xs"
                        >
                          <Layers size={14} className="text-purple-600 dark:text-purple-400" />
                          <span>{language === "en" ? "Review Design Output" : "Telaah Hasil Desain"}</span>
                        </button>
                      ) : (tItem.bidang === "FOTOGRAFER" || tItem.bidang === "VIDEOGRAFER" || tItem.bidang === "FOTO_VIDEO") && tItem.mediaData?.files ? (
                        <button
                          type="button"
                          onClick={() => openCurationModal(tItem)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-900 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/70 border border-blue-300 dark:border-blue-700 transition cursor-pointer shadow-xs"
                        >
                          <Sparkles size={14} className="text-amber-500" />
                          <span>
                            {language === "en"
                              ? `Photo & Video Curation Desk (${tItem.mediaData.files.length})`
                              : `Meja Kurasi Foto & Video (${tItem.mediaData.files.length})`}
                          </span>
                        </button>
                      ) : (
                        <a
                          href={tItem.workLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition cursor-pointer"
                        >
                          <Eye size={14} />
                          <span>{t("review_btn_preview")}</span>
                          <ExternalLink size={12} className="opacity-70" />
                        </a>
                      )
                    ) : (
                      // Jika berkas belum diunggah petugas
                      <button
                        type="button"
                        onClick={() => {
                          if (tItem.bidang === "PRAHUM") setPreviewNaskahTask(tItem);
                          else if (tItem.bidang === "DESAINER_EDITOR") setDesignReviewTask(tItem);
                          else openCurationModal(tItem);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/70 border border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:text-blue-700 transition cursor-pointer"
                        title={language === "en" ? "Click to view task status" : "Klik untuk melihat status penugasan"}
                      >
                        {tItem.bidang === "PRAHUM" ? (
                          <>
                            <BookOpen size={13} className="text-gray-400" />
                            <span>{language === "en" ? "Script Pending" : "Naskah Belum Masuk"}</span>
                          </>
                        ) : tItem.bidang === "DESAINER_EDITOR" ? (
                          <>
                            <Layers size={13} className="text-purple-400" />
                            <span>{language === "en" ? "Design Pending" : "Desain Belum Diunggah"}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} className="text-amber-400" />
                            <span>{language === "en" ? "Photo/Video Pending" : "Foto/Video Belum Masuk"}</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenRevisionModal(tItem)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isRevision
                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <MessageSquare size={14} />
                      <span>{isRevision ? t("review_btn_edit_revision") : t("review_btn_request_revision")}</span>
                    </button>

                    <button
                      onClick={() => handleApprove(tItem)}
                      disabled={isApproved}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                        isApproved
                          ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-default opacity-80"
                          : "bg-[#0f1f5c] dark:bg-blue-600 hover:bg-[#122368] dark:hover:bg-blue-700 text-white"
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      <span>{isApproved ? t("review_btn_approved_done") : t("review_btn_approve")}</span>
                    </button>
                  </div>
                </div>

                {/* Revision Notes Callout */}
                {(tItem.revisionNotes || (tItem.revisionHistory && tItem.revisionHistory.length > 0)) && (
                  <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-2xl p-4 space-y-2 text-xs shadow-xs">
                    <div className="flex items-center justify-between gap-2 text-amber-900 dark:text-amber-200 font-bold border-b border-amber-200/80 dark:border-amber-800/60 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
                        {t("review_notes_title")} ({tItem.revisionAuthor || (language === "en" ? "First Expert Officer" : "Pranata Ahli Pertama")})
                      </span>
                      {tItem.revisionDate && (
                        <span className="text-[11px] font-normal text-amber-700 dark:text-amber-400">
                          {tItem.revisionDate}
                        </span>
                      )}
                    </div>
                    {tItem.revisionNotes && (
                      <p className="text-amber-900 dark:text-amber-300 leading-relaxed pl-1 sm:pl-5 font-medium">
                        "{tItem.revisionNotes}"
                      </p>
                    )}

                    {/* Historical entries log */}
                    {tItem.revisionHistory && tItem.revisionHistory.length > 1 && (
                      <div className="pt-2 border-t border-amber-200/70 dark:border-amber-800/60 space-y-1.5">
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                          <History size={12} className="text-amber-600" />
                          <span>{language === "en" ? "Revision History" : "Riwayat Catatan"} ({tItem.revisionHistory.length} {language === "en" ? "rounds" : "putaran"})</span>
                        </span>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                          {tItem.revisionHistory.map((h, hIdx) => (
                            <div key={h.id || hIdx} className="bg-white/70 dark:bg-gray-900/50 rounded-lg p-2 border border-amber-200/50 dark:border-amber-800/40 text-[11px]">
                              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-[10px]">
                                <span className="font-bold text-amber-900 dark:text-amber-200">#{hIdx + 1} • {h.author}</span>
                                <span>{h.date}</span>
                              </div>
                              <p className="text-gray-800 dark:text-gray-200 mt-0.5">"{h.notes}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Stepper Timeline */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-1">
                  <div className="relative flex items-center justify-between px-2 sm:px-4">
                    <div className="absolute left-4 right-4 top-3 h-0.5 bg-gray-200 dark:bg-gray-700 z-0" />
                    <div
                      className={`absolute left-4 top-3 h-0.5 transition-all duration-500 z-0 ${
                        isCompleted ? "bg-emerald-500" : isRevision ? "bg-amber-500" : "bg-[#0f1f5c] dark:bg-blue-500"
                      }`}
                      style={{
                        width: `calc(${totalSteps > 1 ? (Math.max(0, stepIndex) / (totalSteps - 1)) * 100 : 100}% - 2rem)`,
                      }}
                    />

                    {taskWorkflow.map((step, idx) => {
                      const isDone = isCompleted || idx < stepIndex;
                      const isCurrent = !isCompleted && idx === stepIndex;
                      const isRevisionNode = step === "REVISI";

                      return (
                        <div key={step} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${
                              isDone
                                ? "bg-emerald-600 text-white shadow-2xs"
                                : isCurrent
                                ? isRevisionNode
                                   ? "bg-amber-600 text-white ring-4 ring-amber-500/25 shadow-xs scale-110"
                                  : "bg-[#0f1f5c] dark:bg-blue-600 text-white ring-4 ring-[#0f1f5c]/20 dark:ring-blue-400/25 shadow-xs scale-110"
                                : "bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2 size={13} className="text-white stroke-[2.5]" />
                            ) : (
                              idx + 1
                            )}
                          </div>

                          <span
                            className={`mt-1.5 text-[10px] font-semibold tracking-tight transition-colors select-none text-center whitespace-nowrap ${
                              isDone
                                ? "text-emerald-700 dark:text-emerald-400 font-bold"
                                : isCurrent
                                ? isRevisionNode
                                  ? "text-amber-700 dark:text-amber-400 font-extrabold"
                                  : "text-[#0f1f5c] dark:text-sky-400 font-extrabold"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {step.replace("_", " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Revision Modal Dialog */}
      <Dialog
        open={!!selectedTaskForRevision}
        onClose={() => setSelectedTaskForRevision(null)}
        title={t("review_modal_revision_title")}
        size="md"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTaskForRevision(null)}
              disabled={isSubmittingRevision}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSubmitRevision}
              disabled={isSubmittingRevision || !revisionNotesInput.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
            >
              <Send size={13} className="mr-1.5" />
              {isSubmittingRevision ? t("saving") : t("review_modal_send_btn")}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div>
            <p className="font-bold text-gray-900 dark:text-gray-100">
              {language === "en" ? "Activity" : "Kegiatan"}: <span className="font-normal text-gray-700 dark:text-gray-300">{selectedTaskForRevision?.kegiatan}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {language === "en" ? "Division" : "Bidang"}: <strong>{selectedTaskForRevision?.bidang}</strong> • {selectedTaskForRevision?.jenisPekerjaan}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider">
              {language === "en" ? "Correction Notes / Parts that Need Revision:" : "Catatan Koreksi / Detail Bagian yang Perlu Direvisi:"}
            </label>
            <textarea
              rows={4}
              value={revisionNotesInput}
              onChange={(e) => setRevisionNotesInput(e.target.value)}
              placeholder={t("review_modal_revision_ph")}
              className="w-full p-3 text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition placeholder:text-gray-400"
            />
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {language === "en" ? "* These notes will instantly appear in the officer's workspace." : "* Catatan ini akan langsung tampil di banner ruang kerja Petugas Lapangan terkait."}
            </p>
          </div>
        </div>
      </Dialog>

      {/* 1. Naskah Preview & Review Dialog (PRAHUM) */}
      <Dialog
        open={!!previewNaskahTask}
        onClose={() => setPreviewNaskahTask(null)}
        title={language === "en" ? "PR News Script Review Desk" : "Meja Telaah Naskah Berita Humas"}
        size="lg"
        actions={
          previewNaskahTask ? (
            <div className="flex items-center justify-between w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewNaskahTask(null)}
              >
                {t("close")}
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tToRev = previewNaskahTask;
                    setPreviewNaskahTask(null);
                    handleOpenRevisionModal(tToRev);
                  }}
                  className="text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 cursor-pointer"
                >
                  <MessageSquare size={13} className="mr-1.5 text-amber-600" />
                  {language === "en" ? "Request Script Revision" : "Minta Revisi Naskah"}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={async () => {
                    await handleApprove(previewNaskahTask);
                    setPreviewNaskahTask(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  <CheckCircle2 size={13} className="mr-1.5" />
                  {language === "en" ? "Approve Script (Ready to Publish)" : "Setujui Naskah (Siap Tayang)"}
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {previewNaskahTask && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 bg-slate-50 dark:bg-gray-900/80 rounded-xl border border-gray-200 dark:border-gray-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                  {previewNaskahTask.kegiatan}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-sky-300">
                  {previewNaskahTask.workLink ? previewNaskahTask.workLink.trim().split(/\s+/).length : 0} {language === "en" ? "Words" : "Kata"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{language === "en" ? "Location:" : "Lokasi:"} {previewNaskahTask.lokasi}</span>
                <span>•</span>
                <span>{language === "en" ? "Deadline:" : "Batas Waktu:"} {previewNaskahTask.deadline}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {language === "en" ? "Press Release News Script:" : "Naskah Berita Rilis Pers:"}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(previewNaskahTask.workLink || "");
                  addToast(
                    language === "en" ? "Script copied to clipboard!" : "Teks naskah berhasil disalin ke clipboard!",
                    "success"
                  );
                }}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
              >
                <Copy size={13} />
                <span>{language === "en" ? "Copy Full Script" : "Salin Seluruh Naskah"}</span>
              </button>
            </div>

            {previewNaskahTask.workLink ? (
              <div className="bg-white dark:bg-gray-950/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 max-h-[55vh] overflow-y-auto leading-relaxed text-gray-800 dark:text-gray-200 font-serif text-sm sm:text-base whitespace-pre-wrap shadow-inner">
                {previewNaskahTask.workLink}
              </div>
            ) : (
              <div className="text-center py-10 px-4 bg-slate-50 dark:bg-gray-900/60 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                  {language === "en" ? "News Script Not Yet Submitted" : "Naskah Berita Belum Disetor"}
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  {language === "en"
                    ? "PR Officer has not submitted the news script for this activity. You can provide feedback or request a draft using the Revision Notes button below."
                    : "Petugas Pranata Humas belum menuliskan naskah berita untuk kegiatan ini. Anda dapat memberikan arahan atau meminta draf rilis melalui tombol Catatan Revisi di bawah."}
                </p>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* 2. Meja Kurasi Foto & Video (FOTO_VIDEO) */}
      <Dialog
        open={!!curationTask}
        onClose={() => setCurationTask(null)}
        title={language === "en" ? "Photo & Video Editorial Curation Desk" : "Meja Kurasi Redaksi Foto & Video Liputan"}
        size="lg"
        actions={
          curationTask ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurationTask(null)}
                  disabled={isSubmittingCuration}
                >
                  {t("close")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tToRev = curationTask;
                    setCurationTask(null);
                    handleOpenRevisionModal(tToRev);
                  }}
                  disabled={isSubmittingCuration}
                  className="text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 cursor-pointer"
                >
                  <MessageSquare size={13} className="mr-1.5 text-amber-600" />
                  {language === "en" ? "Request Photo/Video Revision" : "Minta Revisi Foto/Video"}
                </Button>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={handleApproveCuratedFiles}
                disabled={isSubmittingCuration || selectedFileUrls.size === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              >
                <Sparkles size={14} className="mr-1.5 text-amber-300" />
                {isSubmittingCuration
                  ? (language === "en" ? "Saving to Content Bank..." : "Menyimpan ke Bank Konten...")
                  : (language === "en"
                      ? `Approve ${selectedFileUrls.size} Assets to Content Bank`
                      : `Setujui ${selectedFileUrls.size} Berkas ke Bank Konten Utama`)}
              </Button>
            </div>
          ) : null
        }
      >
        {curationTask && (
          <div className="space-y-4 text-xs sm:text-sm">
            {/* Header info & Caption */}
            <div className="p-3.5 bg-slate-50 dark:bg-gray-900/80 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                  {curationTask.kegiatan}
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-[#0f1f5c] dark:text-sky-300">
                  {curationTask.bidang}
                </span>
              </div>
              {curationTask.mediaData?.caption && (
                <div className="p-2.5 bg-white dark:bg-gray-950/60 rounded-xl border border-gray-200/80 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300">
                  <span className="font-bold text-gray-900 dark:text-gray-100 block mb-0.5">
                    {language === "en" ? "Officer Caption / Description:" : "Keterangan / Caption Petugas:"}
                  </span>
                  "{curationTask.mediaData.caption}"
                </div>
              )}
            </div>

            {curationTask.mediaData?.files && curationTask.mediaData.files.length > 0 ? (
              <>
                {/* Selection Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#0f1f5c] dark:text-sky-300">
                      {language === "en" ? "Select Photos/Videos for Content Bank:" : "Pilih Foto/Video untuk Bank Konten:"}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[11px] font-bold">
                      {language === "en"
                        ? `${selectedFileUrls.size} of ${curationTask.mediaData.files.length} Selected`
                        : `${selectedFileUrls.size} dari ${curationTask.mediaData.files.length} Dipilih`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFiles}
                      className="text-xs font-semibold text-blue-700 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      {language === "en" ? "Select All" : "Pilih Semua"}
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllFiles}
                      className="text-xs font-semibold text-gray-500 hover:underline cursor-pointer"
                    >
                      {language === "en" ? "Deselect All" : "Batalkan Pilihan"}
                    </button>
                  </div>
                </div>

                {/* Curated Grid Gallery */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[55vh] overflow-y-auto p-1">
                  {curationTask.mediaData.files.map((file, fIdx) => {
                    const isSelected = selectedFileUrls.has(file.url);
                    const isVideo = file.mimeType.startsWith("video");

                    return (
                      <div
                        key={fIdx}
                        onClick={() => toggleFileSelection(file.url)}
                        className={`relative rounded-2xl overflow-hidden border-2 transition cursor-pointer flex flex-col justify-between bg-white dark:bg-gray-900 group ${
                          isSelected
                            ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/30"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-400 opacity-70 hover:opacity-100"
                        }`}
                      >
                        {/* Checkbox badge overlay */}
                        <div className="absolute top-2 left-2 z-10">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition shadow-sm ${
                              isSelected
                                ? "bg-emerald-600 text-white"
                                : "bg-black/50 text-transparent border border-white/50"
                            }`}
                          >
                            <Check size={14} className={isSelected ? "opacity-100 stroke-[3]" : "opacity-0"} />
                          </div>
                        </div>

                        {/* Preview Content */}
                        {isVideo ? (
                          <div className="aspect-video bg-black flex items-center justify-center relative">
                            <video
                              src={file.url}
                              controls
                              className="w-full h-full object-contain"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        ) : (
                          <div className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <img
                              src={file.url}
                              alt={file.originalName}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          </div>
                        )}

                        {/* Bottom File Info Bar */}
                        <div className="p-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px]">
                          <span className="truncate max-w-[120px] font-medium text-gray-800 dark:text-gray-200">
                            {file.originalName}
                          </span>
                          <span className="text-gray-500 shrink-0">
                            {(file.fileSize / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-10 px-4 bg-slate-50 dark:bg-gray-900/60 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                <Sparkles className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                  {language === "en" ? "Coverage Files Not Yet Uploaded" : "Berkas Liputan Belum Diunggah"}
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  {language === "en"
                    ? "Photographer or videographer has not uploaded photos or videos for this assignment."
                    : "Petugas fotografer atau videografer belum mengunggah foto maupun video ke server internal untuk penugasan ini."}
                </p>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* 3. Meja Telaah Desain & Media Publikasi (DESAINER_EDITOR) */}
      <Dialog
        open={!!designReviewTask}
        onClose={() => setDesignReviewTask(null)}
        title={language === "en" ? "Graphic Design & Publication Media Review" : "Telaah Desain Grafis & Media Publikasi"}
        size="lg"
        actions={
          designReviewTask ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDesignReviewTask(null)}
                >
                  {t("close")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tToRev = designReviewTask;
                    setDesignReviewTask(null);
                    handleOpenRevisionModal(tToRev);
                  }}
                  className="text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 cursor-pointer"
                >
                  <MessageSquare size={13} className="mr-1.5 text-amber-600" />
                  {language === "en" ? "Request Design Revision" : "Minta Revisi Desain"}
                </Button>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={() => handleApproveDesign(designReviewTask)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
              >
                <Sparkles size={14} className="mr-1.5 text-amber-300" />
                {language === "en" ? "Approve Design to Content Bank" : "Setujui Desain ke Bank Konten Utama"}
              </Button>
            </div>
          ) : null
        }
      >
        {designReviewTask && (
          <div className="space-y-4 text-xs sm:text-sm">
            {/* Header info */}
            <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-100 dark:border-purple-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                  {designReviewTask.kegiatan}
                </h4>
                {designReviewTask.mediaData?.targetPlatform && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600 text-white">
                    {designReviewTask.mediaData.targetPlatform}
                  </span>
                )}
              </div>
              {designReviewTask.mediaData?.editorNotes && (
                <div className="p-2.5 bg-white dark:bg-gray-950/60 rounded-xl border border-purple-100 dark:border-purple-900/40 text-xs text-gray-700 dark:text-gray-300">
                  <span className="font-bold text-purple-950 dark:text-purple-300 block mb-0.5">
                    {language === "en" ? "Designer / Editor Notes:" : "Catatan Desainer / Editor:"}
                  </span>
                  "{designReviewTask.mediaData.editorNotes}"
                </div>
              )}
            </div>

            {/* Design Files List & Preview */}
            {designReviewTask.mediaData?.files && designReviewTask.mediaData.files.length > 0 ? (
              <div className="space-y-3">
                {designReviewTask.mediaData.files.map((file, idx) => {
                  const isImage = file.mimeType.startsWith("image");

                  return (
                    <div key={idx} className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers size={16} className="text-purple-600" />
                          <span className="font-bold text-gray-900 dark:text-gray-100">{file.originalName}</span>
                          <span className="text-xs text-gray-500">({(file.fileSize / (1024 * 1024)).toFixed(1)} MB)</span>
                        </div>
                        <a
                          href={file.url}
                          download={file.originalName}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition"
                        >
                          <Download size={12} />
                          <span>{language === "en" ? "Download File" : "Unduh Berkas"}</span>
                        </a>
                      </div>

                      {isImage && (
                        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 flex items-center justify-center max-h-[45vh]">
                          <img
                            src={file.url}
                            alt={file.originalName}
                            className="max-h-[45vh] w-auto object-contain"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 px-4 bg-purple-50/40 dark:bg-gray-900/60 rounded-2xl border border-dashed border-purple-200 dark:border-gray-800">
                <Layers className="w-10 h-10 text-purple-400 mx-auto mb-2" />
                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                  {language === "en" ? "Design Files Not Yet Uploaded" : "Berkas Desain Belum Diunggah"}
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  {language === "en"
                    ? "Graphic designer has not uploaded final design files for this assignment."
                    : "Petugas desainer grafis belum mengunggah berkas desain akhir untuk penugasan ini."}
                </p>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ReviewPage;

